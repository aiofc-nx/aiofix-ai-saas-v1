/**
 * Messaging模块专用日志接口
 *
 * @description 为Messaging模块定制的简化日志接口
 * 专注于消息传递相关的日志记录需求
 *
 * ## 设计理念
 *
 * ### 🎯 **专用性**
 * - 专为消息传递场景设计的日志接口
 * - 包含消息队列、事件发布订阅等专用日志方法
 * - 支持消息传递过程中的性能监控
 *
 * ### 🔧 **简化性**
 * - 相比完整的ILoggerService接口更加简化
 * - 只包含Messaging模块实际需要的日志功能
 * - 减少依赖复杂度，提高模块独立性
 *
 * ### 🚀 **扩展性**
 * - 可以轻松适配到完整的ILoggerService
 * - 支持未来添加更多消息传递专用日志功能
 * - 保持与@aiofix/logging模块的兼容性
 *
 * @example
 * ```typescript
 * const logger: IMessagingLoggerService = createMessagingLogger();
 *
 * // 记录消息发送
 * logger.info('消息已发送', { topic: 'user.created', messageId: 'msg-123' });
 *
 * // 记录队列性能
 * logger.performance('消息处理', 150, { queue: 'default', handler: 'UserHandler' });
 *
 * // 创建子日志器
 * const queueLogger = logger.child('queue:default');
 * queueLogger.info('队列已启动');
 * ```
 *
 * @since 1.0.0
 */

/**
 * Messaging模块专用日志服务接口
 */
export interface IMessagingLoggerService {
  /**
   * 记录信息日志
   *
   * @param message - 日志消息
   * @param context - 上下文信息，通常包含消息、队列、主题等相关信息
   */
  info(message: string, context?: unknown): void;

  /**
   * 记录错误日志
   *
   * @param message - 错误消息
   * @param error - 错误对象（可选）
   * @param context - 上下文信息
   */
  error(message: string, error?: Error, context?: unknown): void;

  /**
   * 记录警告日志
   *
   * @param message - 警告消息
   * @param context - 上下文信息
   */
  warn(message: string, context?: unknown): void;

  /**
   * 记录调试日志
   *
   * @param message - 调试消息
   * @param context - 上下文信息
   */
  debug(message: string, context?: unknown): void;

  /**
   * 创建子日志器
   *
   * @param context - 子日志器的上下文标识（如队列名、处理器名等）
   * @param metadata - 附加元数据
   * @returns 子日志器实例
   */
  child?(
    context: string,
    metadata?: Record<string, unknown>,
  ): IMessagingLoggerService;

  /**
   * 记录性能日志
   *
   * @param operation - 操作名称（如'消息发送', '消息处理', '队列启动'等）
   * @param duration - 操作耗时（毫秒）
   * @param metadata - 性能相关的元数据
   */
  performance?(
    operation: string,
    duration: number,
    metadata?: Record<string, unknown>,
  ): void;

  /**
   * 刷新日志缓冲区
   * 确保所有日志都已写入
   */
  flush?(): Promise<void>;

  /**
   * 关闭日志器
   * 清理资源，关闭文件句柄等
   */
  close?(): Promise<void>;
}

/**
 * 消息传递上下文信息
 *
 * 用于在日志中记录消息传递相关的上下文信息
 */
export interface IMessagingContext {
  /** 消息ID */
  messageId?: string;

  /** 消息主题 */
  topic?: string;

  /** 消息类型 */
  messageType?: string;

  /** 队列名称 */
  queue?: string;

  /** 处理器名称 */
  handler?: string;

  /** 租户ID */
  tenantId?: string;

  /** 发送者ID */
  senderId?: string;

  /** 相关ID（用于请求响应模式） */
  correlationId?: string;

  /** 重试次数 */
  retryCount?: number;

  /** 其他元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 队列操作上下文
 */
export interface IQueueContext {
  /** 队列名称 */
  queueName: string;

  /** 队列类型 */
  queueType: string;

  /** 操作类型 */
  operation:
    | 'start'
    | 'stop'
    | 'send'
    | 'subscribe'
    | 'unsubscribe'
    | 'clear'
    | 'health';

  /** 统计信息 */
  stats?: {
    totalMessages?: number;
    pendingMessages?: number;
    processingMessages?: number;
    completedMessages?: number;
    failedMessages?: number;
  };
}

/**
 * 性能监控上下文
 */
export interface IPerformanceContext {
  /** 操作类型 */
  operationType:
    | 'send'
    | 'receive'
    | 'process'
    | 'subscribe'
    | 'queue_operation';

  /** 开始时间 */
  startTime?: Date;

  /** 结束时间 */
  endTime?: Date;

  /** 耗时（毫秒） */
  duration: number;

  /** 是否成功 */
  success: boolean;

  /** 错误信息（如果失败） */
  error?: string;

  /** 附加性能数据 */
  metrics?: Record<string, number>;
}
