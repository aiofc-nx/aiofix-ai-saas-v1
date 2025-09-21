/**
 * 核心日志工厂
 *
 * @description 为Core模块提供日志服务的工厂函数
 *
 * ## 设计目标
 *
 * ### 🎯 **简化创建**
 * - 提供简单的工厂方法
 * - 自动选择最佳日志实现
 * - 支持配置驱动的创建
 *
 * ### 🔗 **智能适配**
 * - 优先使用完整日志服务
 * - 降级到简单控制台日志
 * - 支持依赖注入模式
 *
 * ### 🚀 **企业级支持**
 * - 支持多租户配置
 * - 支持性能监控
 * - 支持结构化日志
 *
 * @since 1.0.0
 */

import { ILoggerService } from '../interfaces/logging.interface';
import {
  ICoreLoggerService,
  ICoreLogConfig,
} from '../interfaces/core-logger.interface';
import {
  CoreLoggerAdapter,
  SimpleConsoleLoggerAdapter,
} from '../adapters/core-logger.adapter';

/**
 * 核心日志工厂类
 *
 * 提供创建Core模块日志服务的统一接口
 */
export class CoreLoggerFactory {
  /**
   * 创建核心日志服务
   *
   * @param fullLogger 完整的日志服务（可选）
   * @param config 日志配置（可选）
   * @returns 核心日志服务实例
   */
  static create(
    fullLogger?: ILoggerService,
    config?: ICoreLogConfig,
  ): ICoreLoggerService {
    if (fullLogger) {
      // 使用完整日志服务的适配器
      return new CoreLoggerAdapter(fullLogger, config);
    }

    // 降级到简单控制台日志
    return new SimpleConsoleLoggerAdapter(config);
  }

  /**
   * 为Core模块创建默认日志服务
   *
   * @param config 日志配置（可选）
   * @returns 核心日志服务实例
   */
  static createForCore(config?: ICoreLogConfig): ICoreLoggerService {
    const defaultConfig: ICoreLogConfig = {
      level: 'info',
      colorize: true,
      timestamp: true,
      performance: true,
      metadata: {
        component: 'core',
        module: 'infrastructure',
      },
      ...config,
    };

    return CoreLoggerFactory.create(undefined, defaultConfig);
  }

  /**
   * 为Fastify适配器创建日志服务
   *
   * @param fullLogger 完整的日志服务（可选）
   * @returns 核心日志服务实例
   */
  static createForFastify(fullLogger?: ILoggerService): ICoreLoggerService {
    const config: ICoreLogConfig = {
      level: 'info',
      colorize: true,
      timestamp: true,
      performance: true,
      metadata: {
        component: 'core',
        module: 'fastify-adapter',
      },
    };

    return CoreLoggerFactory.create(fullLogger, config);
  }

  /**
   * 为多租户上下文创建日志服务
   *
   * @param tenantId 租户ID
   * @param fullLogger 完整的日志服务（可选）
   * @returns 核心日志服务实例
   */
  static createForTenant(
    tenantId: string,
    fullLogger?: ILoggerService,
  ): ICoreLoggerService {
    const config: ICoreLogConfig = {
      level: 'info',
      colorize: true,
      timestamp: true,
      performance: true,
      metadata: {
        component: 'core',
        tenantId,
        context: 'multi-tenant',
      },
    };

    return CoreLoggerFactory.create(fullLogger, config);
  }

  /**
   * 为性能监控创建日志服务
   *
   * @param fullLogger 完整的日志服务（可选）
   * @returns 核心日志服务实例
   */
  static createForPerformance(fullLogger?: ILoggerService): ICoreLoggerService {
    const config: ICoreLogConfig = {
      level: 'info',
      colorize: true,
      timestamp: true,
      performance: true,
      metadata: {
        component: 'core',
        module: 'performance-monitor',
      },
    };

    return CoreLoggerFactory.create(fullLogger, config);
  }
}

/**
 * 便捷的工厂函数
 */

/**
 * 创建核心日志服务的便捷函数
 *
 * @param fullLogger 完整的日志服务（可选）
 * @param config 日志配置（可选）
 * @returns 核心日志服务实例
 */
export function createCoreLogger(
  fullLogger?: ILoggerService,
  config?: ICoreLogConfig,
): ICoreLoggerService {
  return CoreLoggerFactory.create(fullLogger, config);
}

/**
 * 创建默认Core日志服务的便捷函数
 *
 * @param config 日志配置（可选）
 * @returns 核心日志服务实例
 */
export function createDefaultCoreLogger(
  config?: ICoreLogConfig,
): ICoreLoggerService {
  return CoreLoggerFactory.createForCore(config);
}

/**
 * 创建Fastify日志服务的便捷函数
 *
 * @param fullLogger 完整的日志服务（可选）
 * @returns 核心日志服务实例
 */
export function createFastifyLogger(
  fullLogger?: ILoggerService,
): ICoreLoggerService {
  return CoreLoggerFactory.createForFastify(fullLogger);
}

/**
 * 创建多租户日志服务的便捷函数
 *
 * @param tenantId 租户ID
 * @param fullLogger 完整的日志服务（可选）
 * @returns 核心日志服务实例
 */
export function createTenantLogger(
  tenantId: string,
  fullLogger?: ILoggerService,
): ICoreLoggerService {
  return CoreLoggerFactory.createForTenant(tenantId, fullLogger);
}
