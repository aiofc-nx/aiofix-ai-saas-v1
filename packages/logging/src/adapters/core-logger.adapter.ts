/**
 * 核心日志适配器
 *
 * @description 将完整的ILoggerService适配为ICoreLoggerService接口
 *
 * ## 设计目标
 *
 * ### 🎯 **接口适配**
 * - 将复杂的ILoggerService接口简化为ICoreLoggerService
 * - 保持完整功能的可用性
 * - 提供合理的默认配置
 *
 * ### 🔗 **无缝集成**
 * - Core模块可以直接使用ICoreLoggerService
 * - 底层使用完整的企业级日志功能
 * - 支持多租户和性能监控
 *
 * ### 🚀 **企业级功能**
 * - 自动添加系统上下文
 * - 支持结构化日志
 * - 支持性能监控和统计
 *
 * @since 1.0.0
 */

import {
  ILoggerService,
  LogContext,
  LogMetadata,
} from '../interfaces/logging.interface';
import {
  ICoreLoggerService,
  ICoreLogConfig,
} from '../interfaces/core-logger.interface';

/**
 * 核心日志适配器实现
 *
 * 将完整的企业级日志服务适配为Core模块可用的简化接口
 */
export class CoreLoggerAdapter implements ICoreLoggerService {
  private readonly defaultContext: LogContext = LogContext.SYSTEM;
  private readonly defaultMetadata: LogMetadata;

  constructor(
    private readonly logger: ILoggerService,
    private readonly config?: ICoreLogConfig,
  ) {
    this.defaultMetadata = {
      component: 'core',
      ...(config?.metadata || {}),
    };
  }

  /**
   * 记录信息日志
   */
  info(message: string, context?: unknown): void {
    this.logger.info(message, this.defaultContext, this.mergeContext(context));
  }

  /**
   * 记录错误日志
   */
  error(message: string, error?: Error, context?: unknown): void {
    this.logger.error(
      message,
      this.defaultContext,
      this.mergeContext(context),
      error,
    );
  }

  /**
   * 记录警告日志
   */
  warn(message: string, context?: unknown): void {
    this.logger.warn(message, this.defaultContext, this.mergeContext(context));
  }

  /**
   * 记录调试日志
   */
  debug(message: string, context?: unknown): void {
    this.logger.debug(message, this.defaultContext, this.mergeContext(context));
  }

  /**
   * 创建子日志器
   */
  child(
    context: string,
    metadata?: Record<string, unknown>,
  ): ICoreLoggerService {
    const childMetadata = {
      ...this.defaultMetadata,
      context,
      ...(metadata || {}),
    };

    const childLogger = this.logger.child(this.defaultContext, childMetadata);
    return new CoreLoggerAdapter(childLogger, this.config);
  }

  /**
   * 记录性能日志
   */
  performance(
    operation: string,
    duration: number,
    metadata?: Record<string, unknown>,
  ): void {
    this.logger.performance(
      operation,
      duration,
      LogContext.PERFORMANCE,
      this.mergeContext(metadata),
    );
  }

  /**
   * 刷新日志缓冲区
   */
  async flush(): Promise<void> {
    await this.logger.flush();
  }

  /**
   * 关闭日志器
   */
  async close(): Promise<void> {
    await this.logger.close();
  }

  /**
   * 合并上下文信息
   *
   * @param context 用户提供的上下文
   * @returns 合并后的元数据
   */
  private mergeContext(context?: unknown): LogMetadata {
    if (!context) {
      return this.defaultMetadata;
    }

    if (typeof context === 'object' && context !== null) {
      return {
        ...this.defaultMetadata,
        ...(context as Record<string, unknown>),
      };
    }

    return {
      ...this.defaultMetadata,
      context: String(context),
    };
  }
}

/**
 * 简单日志适配器
 *
 * 当没有完整日志服务时，提供基本的控制台日志功能
 */
export class SimpleConsoleLoggerAdapter implements ICoreLoggerService {
  private readonly config: ICoreLogConfig;

  constructor(config?: ICoreLogConfig) {
    this.config = {
      level: 'info',
      colorize: true,
      timestamp: true,
      performance: false,
      ...config,
    };
  }

  info(message: string, context?: unknown): void {
    if (this.shouldLog('info')) {
      // eslint-disable-next-line no-console
      console.log(this.formatMessage('INFO', message, context));
    }
  }

  error(message: string, error?: Error, context?: unknown): void {
    if (this.shouldLog('error')) {
      // eslint-disable-next-line no-console
      console.error(this.formatMessage('ERROR', message, context), error);
    }
  }

  warn(message: string, context?: unknown): void {
    if (this.shouldLog('warn')) {
      // eslint-disable-next-line no-console
      console.warn(this.formatMessage('WARN', message, context));
    }
  }

  debug(message: string, context?: unknown): void {
    if (this.shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.debug(this.formatMessage('DEBUG', message, context));
    }
  }

  child(
    context: string,
    metadata?: Record<string, unknown>,
  ): ICoreLoggerService {
    const childConfig = {
      ...this.config,
      metadata: {
        ...this.config.metadata,
        context,
        ...(metadata || {}),
      },
    };
    return new SimpleConsoleLoggerAdapter(childConfig);
  }

  performance(
    operation: string,
    duration: number,
    metadata?: Record<string, unknown>,
  ): void {
    if (this.config.performance && this.shouldLog('info')) {
      // eslint-disable-next-line no-console
      console.log(
        this.formatMessage(
          'PERF',
          `${operation} completed in ${duration}ms`,
          metadata,
        ),
      );
    }
  }

  async flush(): Promise<void> {
    // 控制台日志无需刷新
  }

  async close(): Promise<void> {
    // 控制台日志无需关闭
  }

  /**
   * 检查是否应该记录日志
   */
  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level || 'info');
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(
    level: string,
    message: string,
    context?: unknown,
  ): string {
    let formatted = '';

    if (this.config.timestamp) {
      formatted += `[${new Date().toISOString()}] `;
    }

    formatted += `[${level}] ${message}`;

    if (context && typeof context === 'object') {
      formatted += ` ${JSON.stringify(context)}`;
    } else if (context) {
      formatted += ` ${String(context)}`;
    }

    return formatted;
  }
}
