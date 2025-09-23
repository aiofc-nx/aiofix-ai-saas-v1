/**
 * Messaging模块日志工厂
 *
 * @description 为Messaging模块提供统一的日志创建和管理功能
 * 支持多种日志后端，自动适配和降级
 *
 * ## 核心功能
 *
 * ### 🏭 **工厂模式**
 * - 统一的日志创建接口，隐藏具体实现细节
 * - 支持多种日志后端的自动检测和适配
 * - 提供默认配置和自定义配置选项
 *
 * ### 🔄 **自动适配**
 * - 优先使用@aiofix/logging模块的完整功能
 * - 自动降级到简单的控制台日志实现
 * - 支持运行时日志后端切换
 *
 * ### 📊 **专业化**
 * - 为不同的Messaging组件提供专门的日志器
 * - 预配置常用的日志上下文和格式
 * - 支持性能监控和统计信息记录
 *
 * ## 使用方式
 *
 * ### 🚀 **基础使用**
 * ```typescript
 * import { MessagingLoggerFactory } from './messaging-logger.factory';
 *
 * // 创建默认日志器
 * const logger = MessagingLoggerFactory.create();
 * logger.info('消息服务已启动');
 *
 * // 创建队列专用日志器
 * const queueLogger = MessagingLoggerFactory.createForQueue('default');
 * queueLogger.info('队列已启动');
 * ```
 *
 * ### ⚙️ **高级配置**
 * ```typescript
 * // 使用自定义日志后端
 * const customLogger = MessagingLoggerFactory.createWithBackend(myLoggerService);
 *
 * // 为特定组件创建日志器
 * const handlerLogger = MessagingLoggerFactory.createForHandler('UserEventHandler');
 * const performanceLogger = MessagingLoggerFactory.createForPerformance();
 * ```
 *
 * @since 1.0.0
 */

import { IMessagingLoggerService } from '../interfaces/messaging-logger.interface';
import {
  MessagingLoggerAdapter,
  SimpleConsoleMessagingLogger,
} from '../adapters/messaging-logger.adapter';

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
 * Messaging模块日志工厂配置
 */
export interface IMessagingLoggerConfig {
  /** 默认日志级别 */
  level?: 'debug' | 'info' | 'warn' | 'error';

  /** 是否启用性能监控 */
  enablePerformanceMonitoring?: boolean;

  /** 默认上下文前缀 */
  contextPrefix?: string;

  /** 自定义日志后端 */
  backend?: ISimpleLoggerService;

  /** 是否强制使用控制台日志 */
  forceConsole?: boolean;
}

/**
 * Messaging模块日志工厂
 *
 * 提供统一的日志创建和管理功能
 */
export class MessagingLoggerFactory {
  private static defaultConfig: IMessagingLoggerConfig = {
    level: 'info',
    enablePerformanceMonitoring: true,
    contextPrefix: 'messaging',
    forceConsole: false,
  };

  private static loggerBackend: ISimpleLoggerService | null = null;

  /**
   * 设置默认配置
   *
   * @param config - 日志配置
   */
  static setDefaultConfig(config: Partial<IMessagingLoggerConfig>): void {
    MessagingLoggerFactory.defaultConfig = {
      ...MessagingLoggerFactory.defaultConfig,
      ...config,
    };
  }

  /**
   * 设置日志后端
   *
   * @param backend - 日志后端服务
   */
  static setLoggerBackend(backend: ISimpleLoggerService): void {
    MessagingLoggerFactory.loggerBackend = backend;
  }

  /**
   * 创建默认的Messaging日志器
   *
   * @param config - 可选的配置覆盖
   * @returns Messaging日志器实例
   */
  static create(
    config?: Partial<IMessagingLoggerConfig>,
  ): IMessagingLoggerService {
    const finalConfig = { ...MessagingLoggerFactory.defaultConfig, ...config };

    return MessagingLoggerFactory.createWithConfig(finalConfig);
  }

  /**
   * 为特定队列创建日志器
   *
   * @param queueName - 队列名称
   * @param config - 可选的配置覆盖
   * @returns 队列专用日志器
   */
  static createForQueue(
    queueName: string,
    config?: Partial<IMessagingLoggerConfig>,
  ): IMessagingLoggerService {
    const logger = MessagingLoggerFactory.create(config);
    return logger.child ? logger.child(`queue:${queueName}`) : logger;
  }

  /**
   * 为消息处理器创建日志器
   *
   * @param handlerName - 处理器名称
   * @param config - 可选的配置覆盖
   * @returns 处理器专用日志器
   */
  static createForHandler(
    handlerName: string,
    config?: Partial<IMessagingLoggerConfig>,
  ): IMessagingLoggerService {
    const logger = MessagingLoggerFactory.create(config);
    return logger.child ? logger.child(`handler:${handlerName}`) : logger;
  }

  /**
   * 为性能监控创建日志器
   *
   * @param config - 可选的配置覆盖
   * @returns 性能监控专用日志器
   */
  static createForPerformance(
    config?: Partial<IMessagingLoggerConfig>,
  ): IMessagingLoggerService {
    const perfConfig = {
      ...config,
      enablePerformanceMonitoring: true,
    };
    const logger = MessagingLoggerFactory.create(perfConfig);
    return logger.child ? logger.child('performance') : logger;
  }

  /**
   * 为租户创建日志器
   *
   * @param tenantId - 租户ID
   * @param config - 可选的配置覆盖
   * @returns 租户专用日志器
   */
  static createForTenant(
    tenantId: string,
    config?: Partial<IMessagingLoggerConfig>,
  ): IMessagingLoggerService {
    const logger = MessagingLoggerFactory.create(config);
    return logger.child ? logger.child(`tenant:${tenantId}`) : logger;
  }

  /**
   * 使用指定的日志后端创建日志器
   *
   * @param backend - 日志后端服务
   * @param context - 可选的上下文前缀
   * @returns 日志器实例
   */
  static createWithBackend(
    backend: ISimpleLoggerService,
    context?: string,
  ): IMessagingLoggerService {
    const contextPrefix =
      context ||
      MessagingLoggerFactory.defaultConfig.contextPrefix ||
      'messaging';
    return new MessagingLoggerAdapter(backend, contextPrefix);
  }

  /**
   * 创建控制台日志器
   *
   * @param context - 可选的上下文前缀
   * @returns 控制台日志器实例
   */
  static createConsoleLogger(context?: string): IMessagingLoggerService {
    const contextPrefix =
      context ||
      MessagingLoggerFactory.defaultConfig.contextPrefix ||
      'messaging';
    return new SimpleConsoleMessagingLogger(contextPrefix);
  }

  // ==================== 私有方法 ====================

  /**
   * 使用配置创建日志器
   */
  private static createWithConfig(
    config: IMessagingLoggerConfig,
  ): IMessagingLoggerService {
    // 如果强制使用控制台日志
    if (config.forceConsole) {
      return MessagingLoggerFactory.createConsoleLogger(config.contextPrefix);
    }

    // 如果有指定的后端
    if (config.backend) {
      return MessagingLoggerFactory.createWithBackend(
        config.backend,
        config.contextPrefix,
      );
    }

    // 如果有全局设置的后端
    if (MessagingLoggerFactory.loggerBackend) {
      return MessagingLoggerFactory.createWithBackend(
        MessagingLoggerFactory.loggerBackend,
        config.contextPrefix,
      );
    }

    // 尝试自动检测@aiofix/logging模块
    const detectedLogger = MessagingLoggerFactory.detectLoggingModule();
    if (detectedLogger) {
      return MessagingLoggerFactory.createWithBackend(
        detectedLogger,
        config.contextPrefix,
      );
    }

    // 降级到控制台日志
    return MessagingLoggerFactory.createConsoleLogger(config.contextPrefix);
  }

  /**
   * 自动检测@aiofix/logging模块
   */
  private static detectLoggingModule(): ISimpleLoggerService | null {
    try {
      // 尝试导入@aiofix/logging模块
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { CoreLoggerFactory } = require('@aiofix/logging');

      if (
        CoreLoggerFactory &&
        typeof CoreLoggerFactory.createForMessaging === 'function'
      ) {
        return CoreLoggerFactory.createForMessaging();
      }

      // 如果没有专用方法，尝试创建通用日志器
      if (CoreLoggerFactory && typeof CoreLoggerFactory.create === 'function') {
        return CoreLoggerFactory.create();
      }
    } catch {
      // 模块不存在或加载失败，忽略错误
    }

    return null;
  }
}

/**
 * 便捷函数：创建默认的Messaging日志器
 *
 * @param context - 可选的上下文前缀
 * @returns Messaging日志器实例
 */
export function createMessagingLogger(
  context?: string,
): IMessagingLoggerService {
  return MessagingLoggerFactory.create({ contextPrefix: context });
}

/**
 * 便捷函数：创建队列日志器
 *
 * @param queueName - 队列名称
 * @returns 队列专用日志器
 */
export function createQueueLogger(queueName: string): IMessagingLoggerService {
  return MessagingLoggerFactory.createForQueue(queueName);
}

/**
 * 便捷函数：创建处理器日志器
 *
 * @param handlerName - 处理器名称
 * @returns 处理器专用日志器
 */
export function createHandlerLogger(
  handlerName: string,
): IMessagingLoggerService {
  return MessagingLoggerFactory.createForHandler(handlerName);
}

/**
 * 便捷函数：创建性能监控日志器
 *
 * @returns 性能监控专用日志器
 */
export function createPerformanceLogger(): IMessagingLoggerService {
  return MessagingLoggerFactory.createForPerformance();
}

/**
 * 便捷函数：创建租户日志器
 *
 * @param tenantId - 租户ID
 * @returns 租户专用日志器
 */
export function createTenantLogger(tenantId: string): IMessagingLoggerService {
  return MessagingLoggerFactory.createForTenant(tenantId);
}
