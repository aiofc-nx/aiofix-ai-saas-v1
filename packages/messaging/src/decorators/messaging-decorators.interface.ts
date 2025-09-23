/**
 * 消息传递装饰器接口
 *
 * @description 定义消息传递装饰器系统的核心接口和类型
 * 支持声明式的消息处理编程模型，简化消息处理器的编写
 *
 * ## 设计理念
 *
 * ### 🎯 **声明式编程**
 * - 通过装饰器声明消息处理逻辑，减少样板代码
 * - 支持类型安全的消息处理器定义
 * - 自动处理消息路由和分发
 *
 * ### 🔄 **灵活配置**
 * - 支持多种消息模式（点对点、发布订阅、请求响应）
 * - 可配置的消息过滤和路由规则
 * - 支持中间件和拦截器
 *
 * ### 🚀 **企业级特性**
 * - 内置错误处理和重试机制
 * - 支持多租户消息隔离
 * - 集成性能监控和日志记录
 *
 * @example
 * ```typescript
 * @MessageHandler('user.created', {
 *   queue: 'user-events',
 *   priority: MessagePriority.HIGH,
 *   maxRetries: 3
 * })
 * export class UserCreatedHandler {
 *   async handle(message: UserCreatedMessage): Promise<void> {
 *     // 处理用户创建事件
 *   }
 * }
 *
 * @EventHandler(['order.created', 'order.updated'])
 * export class OrderEventHandler {
 *   @Subscribe('order.created')
 *   async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
 *     // 处理订单创建事件
 *   }
 *
 *   @Subscribe('order.updated')
 *   async onOrderUpdated(event: OrderUpdatedEvent): Promise<void> {
 *     // 处理订单更新事件
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import type {
  MessageType,
  MessagePriority,
} from '../interfaces/messaging.interface';

/**
 * 消息处理器装饰器选项
 */
export interface IMessageHandlerOptions {
  /** 目标队列名称 */
  queue?: string;

  /** 消息优先级 */
  priority?: MessagePriority;

  /** 最大重试次数 */
  maxRetries?: number;

  /** 超时时间（毫秒） */
  timeout?: number;

  /** 是否启用多租户隔离 */
  enableTenantIsolation?: boolean;

  /** 消息过滤条件 */
  filter?: IMessageFilter;

  /** 中间件列表 */
  middleware?: string[];

  /** 自定义元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 事件处理器装饰器选项
 */
export interface IEventHandlerOptions {
  /** 目标队列名称 */
  queue?: string;

  /** 事件过滤条件 */
  filter?: IEventFilter;

  /** 是否启用批量处理 */
  enableBatch?: boolean;

  /** 批量处理大小 */
  batchSize?: number;

  /** 批量处理超时时间（毫秒） */
  batchTimeout?: number;

  /** 是否启用多租户隔离 */
  enableTenantIsolation?: boolean;

  /** 中间件列表 */
  middleware?: string[];

  /** 自定义元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 队列处理器装饰器选项
 */
export interface IQueueProcessorOptions {
  /** 队列名称 */
  queueName: string;

  /** 并发处理数量 */
  concurrency?: number;

  /** 处理器优先级 */
  priority?: number;

  /** 最大重试次数 */
  maxRetries?: number;

  /** 重试延迟（毫秒） */
  retryDelay?: number;

  /** 是否启用死信队列 */
  enableDeadLetterQueue?: boolean;

  /** 死信队列名称 */
  deadLetterQueueName?: string;

  /** 是否启用多租户隔离 */
  enableTenantIsolation?: boolean;

  /** 中间件列表 */
  middleware?: string[];

  /** 自定义元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * Saga装饰器选项
 */
export interface ISagaOptions {
  /** Saga名称 */
  sagaName: string;

  /** 触发事件列表 */
  triggerEvents: string[];

  /** 补偿事件列表 */
  compensationEvents?: string[];

  /** 超时时间（毫秒） */
  timeout?: number;

  /** 是否启用持久化 */
  enablePersistence?: boolean;

  /** 是否启用多租户隔离 */
  enableTenantIsolation?: boolean;

  /** 自定义元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 订阅装饰器选项
 */
export interface ISubscribeOptions {
  /** 消息过滤条件 */
  filter?: IMessageFilter;

  /** 处理器优先级 */
  priority?: number;

  /** 最大重试次数 */
  maxRetries?: number;

  /** 超时时间（毫秒） */
  timeout?: number;

  /** 中间件列表 */
  middleware?: string[];

  /** 自定义元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 消息过滤条件
 */
export interface IMessageFilter {
  /** 消息类型过滤 */
  messageType?: MessageType | MessageType[];

  /** 发送者过滤 */
  senderId?: string | string[];

  /** 租户过滤 */
  tenantId?: string | string[];

  /** 自定义属性过滤 */
  properties?: Record<string, unknown>;

  /** 自定义过滤函数 */
  customFilter?: (message: unknown) => boolean;
}

/**
 * 事件过滤条件
 */
export interface IEventFilter {
  /** 事件类型过滤 */
  eventType?: string | string[];

  /** 事件源过滤 */
  source?: string | string[];

  /** 租户过滤 */
  tenantId?: string | string[];

  /** 自定义属性过滤 */
  properties?: Record<string, unknown>;

  /** 自定义过滤函数 */
  customFilter?: (event: unknown) => boolean;
}

/**
 * 消息处理器元数据
 */
export interface IMessageHandlerMetadata {
  /** 处理器类型 */
  handlerType: 'message' | 'event' | 'queue' | 'saga' | 'subscribe';

  /** 目标主题或队列 */
  target: string | string[];

  /** 处理器选项 */
  options:
    | IMessageHandlerOptions
    | IEventHandlerOptions
    | IQueueProcessorOptions
    | ISagaOptions
    | ISubscribeOptions;

  /** 处理器类构造函数 */
  handlerClass: new (...args: unknown[]) => unknown;

  /** 处理器方法名称 */
  methodName?: string;

  /** 创建时间 */
  createdAt: Date;
}

/**
 * 装饰器注册表接口
 */
export interface IDecoratorRegistry {
  /**
   * 注册消息处理器
   *
   * @param metadata - 处理器元数据
   */
  registerHandler(metadata: IMessageHandlerMetadata): void;

  /**
   * 获取所有注册的处理器
   *
   * @returns 处理器元数据数组
   */
  getAllHandlers(): IMessageHandlerMetadata[];

  /**
   * 根据主题获取处理器
   *
   * @param topic - 主题名称
   * @returns 匹配的处理器元数据数组
   */
  getHandlersByTopic(topic: string): IMessageHandlerMetadata[];

  /**
   * 根据类型获取处理器
   *
   * @param handlerType - 处理器类型
   * @returns 匹配的处理器元数据数组
   */
  getHandlersByType(
    handlerType: IMessageHandlerMetadata['handlerType'],
  ): IMessageHandlerMetadata[];

  /**
   * 清空注册表
   */
  clear(): void;
}

/**
 * 装饰器工厂接口
 */
export interface IDecoratorFactory {
  /**
   * 创建消息处理器装饰器
   *
   * @param topic - 消息主题
   * @param options - 装饰器选项
   * @returns 类装饰器函数
   */
  createMessageHandler(
    topic: string,
    options?: IMessageHandlerOptions,
  ): ClassDecorator;

  /**
   * 创建事件处理器装饰器
   *
   * @param events - 事件列表
   * @param options - 装饰器选项
   * @returns 类装饰器函数
   */
  createEventHandler(
    events: string | string[],
    options?: IEventHandlerOptions,
  ): ClassDecorator;

  /**
   * 创建队列处理器装饰器
   *
   * @param options - 装饰器选项
   * @returns 类装饰器函数
   */
  createQueueProcessor(options: IQueueProcessorOptions): ClassDecorator;

  /**
   * 创建Saga装饰器
   *
   * @param options - 装饰器选项
   * @returns 类装饰器函数
   */
  createSaga(options: ISagaOptions): ClassDecorator;

  /**
   * 创建订阅装饰器
   *
   * @param topic - 订阅主题
   * @param options - 装饰器选项
   * @returns 方法装饰器函数
   */
  createSubscribe(topic: string, options?: ISubscribeOptions): MethodDecorator;
}

/**
 * 处理器执行上下文
 */
export interface IHandlerExecutionContext {
  /** 消息或事件数据 */
  data: unknown;

  /** 消息元数据 */
  metadata: Record<string, unknown>;

  /** 租户上下文 */
  tenantContext?: {
    tenantId: string;
    [key: string]: unknown;
  };

  /** 执行开始时间 */
  startTime: Date;

  /** 重试次数 */
  retryCount: number;

  /** 处理器实例 */
  handlerInstance: unknown;

  /** 处理器方法名 */
  methodName: string;

  /** 日志器实例 */
  logger?: unknown;
}

/**
 * 处理器执行结果
 */
export interface IHandlerExecutionResult {
  /** 执行是否成功 */
  success: boolean;

  /** 执行结果数据 */
  result?: unknown;

  /** 错误信息 */
  error?: Error;

  /** 执行耗时（毫秒） */
  duration: number;

  /** 是否需要重试 */
  shouldRetry: boolean;

  /** 下次重试延迟（毫秒） */
  retryDelay?: number;

  /** 自定义元数据 */
  metadata?: Record<string, unknown>;
}
