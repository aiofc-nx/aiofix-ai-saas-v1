/**
 * Messaging模块日志适配器
 *
 * @description 将完整的ILoggerService适配为IMessagingLoggerService
 * 提供Messaging模块专用的日志功能，同时保持与@aiofix/logging模块的兼容性
 *
 * ## 设计目标
 *
 * ### 🔄 **适配器模式**
 * - 将复杂的ILoggerService接口适配为简化的IMessagingLoggerService
 * - 保持向后兼容性，支持现有的日志基础设施
 * - 提供Messaging模块专用的日志上下文和格式化
 *
 * ### 🎯 **专业化**
 * - 为消息传递场景提供专门的日志格式
 * - 自动添加消息传递相关的上下文信息
 * - 支持队列、消息、事件等专用日志记录
 *
 * ### 🚀 **性能优化**
 * - 减少不必要的日志开销
 * - 智能上下文管理，避免重复信息
 * - 支持异步日志操作
 *
 * @example
 * ```typescript
 * import { ILoggerService } from '@aiofix/logging';
 * import { MessagingLoggerAdapter } from './messaging-logger.adapter';
 *
 * const fullLogger: ILoggerService = // ... 从logging模块获取
 * const messagingLogger = new MessagingLoggerAdapter(fullLogger, 'messaging-service');
 *
 * // 使用专用的消息传递日志
 * messagingLogger.info('消息已发送', {
 *   messageId: 'msg-123',
 *   topic: 'user.created',
 *   queue: 'default'
 * });
 * ```
 *
 * @since 1.0.0
 */

import {
  IMessagingLoggerService,
  IMessagingContext,
  IQueueContext,
  IPerformanceContext,
} from '../interfaces/messaging-logger.interface';

// 简化的日志服务接口，避免循环依赖
interface ISimpleLoggerService {
  info(message: string, context?: unknown): void;
  error(message: string, error?: Error, context?: unknown): void;
  warn(message: string, context?: unknown): void;
  debug(message: string, context?: unknown): void;
  child?(
    context: string,
    metadata?: Record<string, unknown>,
  ): ISimpleLoggerService;
  performance?(
    operation: string,
    duration: number,
    metadata?: Record<string, unknown>,
  ): void;
  flush?(): Promise<void>;
  close?(): Promise<void>;
}

/**
 * Messaging模块日志适配器
 *
 * 将完整的日志服务适配为Messaging模块专用的日志接口
 */
export class MessagingLoggerAdapter implements IMessagingLoggerService {
  private readonly defaultContext: string;

  constructor(
    private readonly logger: ISimpleLoggerService,
    defaultContext: string = 'messaging',
  ) {
    this.defaultContext = defaultContext;
  }

  /**
   * 记录信息日志
   */
  info(message: string, context?: unknown): void {
    const formattedContext = this.formatContext(context);
    this.logger.info(`[${this.defaultContext}] ${message}`, formattedContext);
  }

  /**
   * 记录错误日志
   */
  error(message: string, error?: Error, context?: unknown): void {
    const formattedContext = this.formatContext(context);
    this.logger.error(
      `[${this.defaultContext}] ${message}`,
      error,
      formattedContext,
    );
  }

  /**
   * 记录警告日志
   */
  warn(message: string, context?: unknown): void {
    const formattedContext = this.formatContext(context);
    this.logger.warn(`[${this.defaultContext}] ${message}`, formattedContext);
  }

  /**
   * 记录调试日志
   */
  debug(message: string, context?: unknown): void {
    const formattedContext = this.formatContext(context);
    this.logger.debug(`[${this.defaultContext}] ${message}`, formattedContext);
  }

  /**
   * 创建子日志器
   */
  child(
    context: string,
    metadata?: Record<string, unknown>,
  ): IMessagingLoggerService {
    const childContext = `${this.defaultContext}:${context}`;

    if (this.logger.child) {
      const childLogger = this.logger.child(context, metadata);
      return new MessagingLoggerAdapter(childLogger, childContext);
    }

    // 如果底层日志器不支持子日志器，创建一个简单的包装器
    return new MessagingLoggerAdapter(this.logger, childContext);
  }

  /**
   * 记录性能日志
   */
  performance(
    operation: string,
    duration: number,
    metadata?: Record<string, unknown>,
  ): void {
    if (this.logger.performance) {
      this.logger.performance(operation, duration, metadata);
    } else {
      // 降级到info日志
      this.info(`性能: ${operation} 耗时 ${duration}ms`, metadata);
    }
  }

  /**
   * 刷新日志缓冲区
   */
  async flush(): Promise<void> {
    if (this.logger.flush) {
      await this.logger.flush();
    }
  }

  /**
   * 关闭日志器
   */
  async close(): Promise<void> {
    if (this.logger.close) {
      await this.logger.close();
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 格式化上下文信息
   *
   * 为不同类型的上下文提供专门的格式化
   */
  private formatContext(context: unknown): Record<string, unknown> | undefined {
    if (!context) {
      return undefined;
    }

    // 如果是消息传递上下文
    if (this.isMessagingContext(context)) {
      return this.formatMessagingContext(context);
    }

    // 如果是队列上下文
    if (this.isQueueContext(context)) {
      return this.formatQueueContext(context);
    }

    // 如果是性能上下文
    if (this.isPerformanceContext(context)) {
      return this.formatPerformanceContext(context);
    }

    // 普通对象，直接返回
    if (typeof context === 'object' && context !== null) {
      return context as Record<string, unknown>;
    }

    // 其他类型，包装为对象
    return { value: context };
  }

  /**
   * 检查是否为消息传递上下文
   */
  private isMessagingContext(context: unknown): context is IMessagingContext {
    return (
      typeof context === 'object' &&
      context !== null &&
      ('messageId' in context || 'topic' in context || 'queue' in context)
    );
  }

  /**
   * 检查是否为队列上下文
   */
  private isQueueContext(context: unknown): context is IQueueContext {
    return (
      typeof context === 'object' &&
      context !== null &&
      'queueName' in context &&
      'operation' in context
    );
  }

  /**
   * 检查是否为性能上下文
   */
  private isPerformanceContext(
    context: unknown,
  ): context is IPerformanceContext {
    return (
      typeof context === 'object' &&
      context !== null &&
      'operationType' in context &&
      'duration' in context
    );
  }

  /**
   * 格式化消息传递上下文
   */
  private formatMessagingContext(
    context: IMessagingContext,
  ): Record<string, unknown> {
    const formatted: Record<string, unknown> = {
      type: 'messaging',
    };

    // 添加核心消息信息
    if (context.messageId) formatted.messageId = context.messageId;
    if (context.topic) formatted.topic = context.topic;
    if (context.messageType) formatted.messageType = context.messageType;
    if (context.queue) formatted.queue = context.queue;
    if (context.handler) formatted.handler = context.handler;

    // 添加业务上下文
    if (context.tenantId) formatted.tenantId = context.tenantId;
    if (context.senderId) formatted.senderId = context.senderId;
    if (context.correlationId) formatted.correlationId = context.correlationId;

    // 添加运行时信息
    if (context.retryCount !== undefined)
      formatted.retryCount = context.retryCount;

    // 添加元数据
    if (context.metadata) {
      formatted.metadata = context.metadata;
    }

    return formatted;
  }

  /**
   * 格式化队列上下文
   */
  private formatQueueContext(context: IQueueContext): Record<string, unknown> {
    const formatted: Record<string, unknown> = {
      type: 'queue',
      queueName: context.queueName,
      queueType: context.queueType,
      operation: context.operation,
    };

    // 添加统计信息
    if (context.stats) {
      formatted.stats = context.stats;
    }

    return formatted;
  }

  /**
   * 格式化性能上下文
   */
  private formatPerformanceContext(
    context: IPerformanceContext,
  ): Record<string, unknown> {
    const formatted: Record<string, unknown> = {
      type: 'performance',
      operationType: context.operationType,
      duration: context.duration,
      success: context.success,
    };

    // 添加时间信息
    if (context.startTime) formatted.startTime = context.startTime;
    if (context.endTime) formatted.endTime = context.endTime;

    // 添加错误信息
    if (context.error) formatted.error = context.error;

    // 添加性能指标
    if (context.metrics) {
      formatted.metrics = context.metrics;
    }

    return formatted;
  }
}

/**
 * 创建简单的控制台日志适配器
 *
 * 当没有可用的完整日志服务时，提供基础的控制台日志功能
 */
export class SimpleConsoleMessagingLogger implements IMessagingLoggerService {
  constructor(private readonly prefix: string = 'messaging') {}

  info(message: string, context?: unknown): void {
    // eslint-disable-next-line no-console
    console.log(`[INFO][${this.prefix}] ${message}`, context || '');
  }

  error(message: string, error?: Error, context?: unknown): void {
    // eslint-disable-next-line no-console
    console.error(
      `[ERROR][${this.prefix}] ${message}`,
      error || '',
      context || '',
    );
  }

  warn(message: string, context?: unknown): void {
    // eslint-disable-next-line no-console
    console.warn(`[WARN][${this.prefix}] ${message}`, context || '');
  }

  debug(message: string, context?: unknown): void {
    // eslint-disable-next-line no-console
    console.debug(`[DEBUG][${this.prefix}] ${message}`, context || '');
  }

  child(context: string): IMessagingLoggerService {
    return new SimpleConsoleMessagingLogger(`${this.prefix}:${context}`);
  }

  performance(
    operation: string,
    duration: number,
    metadata?: Record<string, unknown>,
  ): void {
    // eslint-disable-next-line no-console
    console.log(
      `[PERF][${this.prefix}] ${operation} 耗时 ${duration}ms`,
      metadata || '',
    );
  }

  async flush(): Promise<void> {
    // 控制台日志无需刷新
  }

  async close(): Promise<void> {
    // 控制台日志无需关闭
  }
}
