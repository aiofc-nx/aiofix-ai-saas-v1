/**
 * 核心日志服务接口
 *
 * @description 为Core模块提供的简化日志接口，兼容完整日志功能
 *
 * ## 设计目标
 *
 * ### 🎯 **简化接口**
 * - 保持Core模块的轻量级特性
 * - 提供必要的日志功能
 * - 支持企业级功能扩展
 *
 * ### 🔗 **兼容性**
 * - 兼容现有Core模块代码
 * - 支持完整ILoggerService功能
 * - 支持适配器模式集成
 *
 * ### 🚀 **扩展性**
 * - 支持可选的企业级功能
 * - 支持多租户上下文
 * - 支持性能监控
 *
 * @since 1.0.0
 */

/**
 * 核心日志服务接口
 *
 * 为Core模块提供简化的日志接口，同时保持与完整日志功能的兼容性
 */
export interface ICoreLoggerService {
  /**
   * 记录信息日志
   *
   * @param message 日志消息
   * @param context 日志上下文（可选）
   */
  info(message: string, context?: unknown): void;

  /**
   * 记录错误日志
   *
   * @param message 日志消息
   * @param error 错误对象（可选）
   * @param context 日志上下文（可选）
   */
  error(message: string, error?: Error, context?: unknown): void;

  /**
   * 记录警告日志
   *
   * @param message 日志消息
   * @param context 日志上下文（可选）
   */
  warn(message: string, context?: unknown): void;

  /**
   * 记录调试日志
   *
   * @param message 日志消息
   * @param context 日志上下文（可选）
   */
  debug(message: string, context?: unknown): void;

  // 企业级功能（可选实现）

  /**
   * 创建子日志器（可选）
   *
   * @param context 日志上下文
   * @param metadata 默认元数据
   * @returns 子日志器
   */
  child?(
    context: string,
    metadata?: Record<string, unknown>,
  ): ICoreLoggerService;

  /**
   * 记录性能日志（可选）
   *
   * @param operation 操作名称
   * @param duration 执行时间（毫秒）
   * @param metadata 日志元数据
   */
  performance?(
    operation: string,
    duration: number,
    metadata?: Record<string, unknown>,
  ): void;

  /**
   * 刷新日志缓冲区（可选）
   */
  flush?(): Promise<void>;

  /**
   * 关闭日志器（可选）
   */
  close?(): Promise<void>;
}

/**
 * 核心日志配置接口
 *
 * 为Core模块提供的简化配置接口
 */
export interface ICoreLogConfig {
  /** 日志级别 */
  level?: 'debug' | 'info' | 'warn' | 'error';
  /** 是否启用彩色输出 */
  colorize?: boolean;
  /** 是否启用时间戳 */
  timestamp?: boolean;
  /** 是否启用性能监控 */
  performance?: boolean;
  /** 自定义字段 */
  metadata?: Record<string, unknown>;
}
