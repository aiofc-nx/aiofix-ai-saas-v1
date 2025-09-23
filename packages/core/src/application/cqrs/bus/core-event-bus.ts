/**
 * 核心事件总线实现
 *
 * 事件总线是 CQRS 模式中处理领域事件的核心组件，负责发布事件到相应的处理器。
 * 本实现提供了基础的事件发布、订阅管理、异步处理和错误恢复功能。
 *
 * ## 业务规则
 *
 * ### 发布规则
 * - 支持单个事件和批量事件发布
 * - 事件发布是异步的，不阻塞主流程
 * - 支持事件优先级和顺序处理
 * - 提供事件发布确认机制
 *
 * ### 订阅规则
 * - 一个事件类型可以有多个处理器
 * - 处理器必须实现 IEventHandler 接口
 * - 支持动态订阅和取消订阅
 * - 支持处理器优先级排序
 *
 * ### 中间件规则
 * - 中间件按优先级顺序执行
 * - 中间件可以修改事件或阻止发布
 * - 中间件异常会中断发布链
 * - 支持动态添加和移除中间件
 *
 * ### 错误处理规则
 * - 支持事件处理失败重试
 * - 提供死信队列机制
 * - 记录详细的处理日志
 * - 支持错误统计和监控
 *
 * @description 核心事件总线实现，提供事件发布和订阅功能
 * @example
 * ```typescript
 * const eventBus = new CoreEventBus();
 *
 * // 注册事件处理器
 * eventBus.registerHandler('UserCreated', new UserCreatedEventHandler());
 * eventBus.registerHandler('UserCreated', new SendWelcomeEmailHandler());
 *
 * // 添加中间件
 * eventBus.addMiddleware(new LoggingMiddleware());
 * eventBus.addMiddleware(new RetryMiddleware());
 *
 * // 发布事件
 * const event = new UserCreatedEvent(userId, 'user@example.com', 'John Doe');
 * await eventBus.publish(event);
 *
 * // 批量发布事件
 * await eventBus.publishAll([event1, event2, event3]);
 * ```
 *
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import { BaseDomainEvent } from '../../../domain/events/base/base-domain-event';
import { IEventHandler } from '../events/base/event-handler.interface';
import { IEventBus, ICQRSMiddleware, IMessageContext } from './cqrs-bus.interface';

/**
 * 事件处理器注册信息
 */
interface IEventHandlerRegistration {
  handler: IEventHandler;
  priority: number;
}

/**
 * 订阅信息
 */
interface ISubscription {
  id: string;
  eventType: string;
  handler: (event: BaseDomainEvent) => Promise<void>;
  priority: number;
}

/**
 * 核心事件总线实现
 */
@Injectable()
export class CoreEventBus implements IEventBus {
  private readonly handlers = new Map<string, IEventHandlerRegistration[]>();
  private readonly subscriptions = new Map<string, ISubscription>();
  private readonly middlewares: ICQRSMiddleware[] = [];
  private subscriptionIdCounter = 0;

  /**
   * 发布事件
   *
   * @param event - 要发布的事件
   * @returns Promise，事件发布完成后解析
   * @throws {Error} 当事件发布失败时
   */
  public async publish<TEvent extends BaseDomainEvent>(
    event: TEvent,
  ): Promise<void> {
    const eventType = event.eventType;

    // 创建消息上下文
    const context: IMessageContext = {
      messageId: event.eventId.toString(),
      tenantId: event.tenantId,
      userId: '', // 事件可能没有用户ID
      messageType: eventType,
      createdAt: event.occurredAt,
      metadata: {},
    };

    // 执行中间件链
    await this.executeMiddlewares(context, async () => {
      // 获取注册的处理器
      const registrations = this.handlers.get(eventType) || [];
      const subscriptionHandlers = this.getSubscriptionHandlers(eventType);

      // 合并所有处理器
      const allHandlers = [
        ...registrations.map((reg) => ({
          handler: reg.handler,
          priority: reg.priority,
        })),
        ...subscriptionHandlers.map((sub) => ({
          handler: sub.handler,
          priority: sub.priority,
        })),
      ];

      // 按优先级排序
      allHandlers.sort((a, b) => a.priority - b.priority);

      // 并行处理所有处理器
      const promises = allHandlers.map(async ({ handler }) => {
        try {
          if (typeof handler === 'function') {
            // 订阅处理器
            await handler(event);
          } else {
            // 注册处理器
            const eventHandler = handler as IEventHandler;

            // 检查是否应该忽略
            const shouldIgnore = await eventHandler.shouldIgnore(event);
            if (shouldIgnore) {
              return;
            }

            // 检查是否已处理
            const isProcessed = await eventHandler.isEventProcessed(event);
            if (isProcessed) {
              return;
            }

            // 验证事件
            eventHandler.validateEvent(event);

            // 检查是否可以处理
            const canHandle = await eventHandler.canHandle(event);
            if (!canHandle) {
              return;
            }

            // 处理事件
            await this.handleEventWithRetry(eventHandler, event);

            // 标记为已处理
            await eventHandler.markEventAsProcessed(event);
          }
        } catch (error) {
          // 记录错误但不中断其他处理器
          // TODO: 使用日志服务替代 console.error
          // eslint-disable-next-line no-console
          console.error(`Error handling event ${eventType}:`, error);

          if (typeof handler !== 'function') {
            const eventHandler = handler as IEventHandler;
            await eventHandler.handleFailure(event, error as Error);
          }
        }
      });

      await Promise.all(promises);
    });
  }

  /**
   * 批量发布事件
   *
   * @param events - 要发布的事件数组
   * @returns Promise，所有事件发布完成后解析
   */
  public async publishAll<TEvent extends BaseDomainEvent>(
    events: TEvent[],
  ): Promise<void> {
    const promises = events.map((event) => this.publish(event));
    await Promise.all(promises);
  }

  /**
   * 注册事件处理器
   *
   * @param eventType - 事件类型
   * @param handler - 事件处理器
   */
  public registerHandler<TEvent extends BaseDomainEvent>(
    eventType: string,
    handler: IEventHandler<TEvent>,
  ): void {
    if (!handler.supports(eventType)) {
      throw new Error(`Handler does not support event type: ${eventType}`);
    }

    const registrations = this.handlers.get(eventType) || [];
    const priority = handler.getPriority();

    registrations.push({ handler, priority });

    // 按优先级排序
    registrations.sort((a, b) => a.priority - b.priority);

    this.handlers.set(eventType, registrations);
  }

  /**
   * 取消注册事件处理器
   *
   * @param eventType - 事件类型
   */
  public unregisterHandler(eventType: string): void {
    this.handlers.delete(eventType);
  }

  /**
   * 添加中间件
   *
   * @param middleware - 中间件
   */
  public addMiddleware(middleware: ICQRSMiddleware): void {
    // 检查是否已存在同名中间件
    const existingIndex = this.middlewares.findIndex(
      (m) => m.name === middleware.name,
    );
    if (existingIndex >= 0) {
      // 替换现有中间件
      this.middlewares[existingIndex] = middleware;
    } else {
      // 添加新中间件
      this.middlewares.push(middleware);
    }

    // 按优先级排序
    this.middlewares.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 移除中间件
   *
   * @param middlewareName - 中间件名称
   */
  public removeMiddleware(middlewareName: string): void {
    const index = this.middlewares.findIndex((m) => m.name === middlewareName);
    if (index >= 0) {
      this.middlewares.splice(index, 1);
    }
  }

  /**
   * 获取所有注册的事件类型
   *
   * @returns 事件类型数组
   */
  public getRegisteredEventTypes(): string[] {
    const registeredTypes = Array.from(this.handlers.keys());
    const subscribedTypes = Array.from(
      new Set(
        Array.from(this.subscriptions.values()).map((sub) => sub.eventType),
      ),
    );

    return Array.from(new Set([...registeredTypes, ...subscribedTypes]));
  }

  /**
   * 检查是否支持指定的事件类型
   *
   * @param eventType - 事件类型
   * @returns 如果支持则返回 true，否则返回 false
   */
  public supports(eventType: string): boolean {
    return this.handlers.has(eventType) || this.hasSubscriptions(eventType);
  }

  /**
   * 订阅事件
   *
   * @param eventType - 事件类型
   * @param handler - 事件处理器函数
   * @returns 订阅ID，用于取消订阅
   */
  public subscribe<TEvent extends BaseDomainEvent>(
    eventType: string,
    handler: (event: TEvent) => Promise<void>,
  ): string {
    const subscriptionId = `sub_${++this.subscriptionIdCounter}`;

    const subscription: ISubscription = {
      id: subscriptionId,
      eventType,
      handler: handler as (event: BaseDomainEvent) => Promise<void>,
      priority: 0, // 默认优先级
    };

    this.subscriptions.set(subscriptionId, subscription);
    return subscriptionId;
  }

  /**
   * 取消订阅事件
   *
   * @param subscriptionId - 订阅ID
   */
  public unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }

  /**
   * 获取注册的处理器数量
   *
   * @param eventType - 事件类型（可选）
   * @returns 处理器数量
   */
  public getHandlerCount(eventType?: string): number {
    if (eventType) {
      const registrations = this.handlers.get(eventType) || [];
      const subscriptions = this.getSubscriptionHandlers(eventType);
      return registrations.length + subscriptions.length;
    }

    let total = 0;
    for (const registrations of this.handlers.values()) {
      total += registrations.length;
    }
    total += this.subscriptions.size;

    return total;
  }

  /**
   * 获取注册的中间件数量
   *
   * @returns 中间件数量
   */
  public getMiddlewareCount(): number {
    return this.middlewares.length;
  }

  /**
   * 获取所有中间件
   *
   * @returns 中间件数组
   */
  public getMiddlewares(): readonly ICQRSMiddleware[] {
    return [...this.middlewares];
  }

  /**
   * 清除所有处理器
   */
  public clearHandlers(): void {
    this.handlers.clear();
  }

  /**
   * 清除所有订阅
   */
  public clearSubscriptions(): void {
    this.subscriptions.clear();
  }

  /**
   * 清除所有中间件
   */
  public clearMiddlewares(): void {
    this.middlewares.length = 0;
  }

  /**
   * 获取指定事件类型的订阅处理器
   *
   * @param eventType - 事件类型
   * @returns 订阅处理器数组
   */
  private getSubscriptionHandlers(eventType: string): ISubscription[] {
    return Array.from(this.subscriptions.values()).filter(
      (sub) => sub.eventType === eventType,
    );
  }

  /**
   * 检查是否有指定事件类型的订阅
   *
   * @param eventType - 事件类型
   * @returns 如果有订阅则返回 true，否则返回 false
   */
  private hasSubscriptions(eventType: string): boolean {
    return Array.from(this.subscriptions.values()).some(
      (sub) => sub.eventType === eventType,
    );
  }

  /**
   * 带重试的事件处理
   *
   * @param handler - 事件处理器
   * @param event - 事件
   * @returns Promise，处理完成后解析
   */
  private async handleEventWithRetry(
    handler: IEventHandler,
    event: BaseDomainEvent,
  ): Promise<void> {
    const maxRetries = handler.getMaxRetries(event);
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      try {
        await handler.handle(event);
        return;
      } catch (error) {
        if (retryCount >= maxRetries) {
          throw error;
        }

        retryCount++;
        const delay = handler.getRetryDelay(event, retryCount);
        if (delay > 0) {
          await this.sleep(delay);
        }
      }
    }
  }

  /**
   * 延迟执行
   *
   * @param ms - 延迟时间（毫秒）
   * @returns Promise
   */
  private sleep(ms: number): Promise<void> {
    // eslint-disable-next-line no-undef
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 执行中间件链
   *
   * @param context - 消息上下文
   * @param next - 最终执行函数
   * @returns Promise，执行完成后解析
   */
  private async executeMiddlewares(
    context: IMessageContext,
    next: () => Promise<void>,
  ): Promise<void> {
    let index = 0;

    const executeNext = async (): Promise<unknown> => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        return await middleware.execute(context, executeNext);
      } else {
        await next();
        return undefined;
      }
    };

    await executeNext();
  }
}
