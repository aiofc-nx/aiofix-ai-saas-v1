/**
 * 日志模块配置NestJS集成
 *
 * @description 提供日志模块配置的NestJS模块集成
 * 支持依赖注入和生命周期管理
 *
 * @since 1.0.0
 */

import {
  Module,
  DynamicModule,
  Provider,
  Global,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import type { IConfigManager, ILoggingModuleConfig } from '@aiofix/config';
import { LoggingConfigService } from './logging-config.service';

/**
 * 日志配置模块选项接口
 */
export interface ILoggingConfigModuleOptions {
  /** 是否全局模块 */
  global?: boolean;
  /** 是否启用热更新 */
  enableHotReload?: boolean;
  /** 自定义配置覆盖 */
  customConfig?: Partial<ILoggingModuleConfig>;
}

/**
 * 日志配置模块实现
 */
@Global()
@Module({})
export class LoggingConfigModule implements OnModuleInit, OnModuleDestroy {
  private static configService: LoggingConfigService | null = null;

  /**
   * 根模块配置
   */
  static forRoot(options: ILoggingConfigModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [
      // 配置提供者
      {
        provide: 'LOGGING_CONFIG',
        useFactory: async (configManager: IConfigManager) => {
          const config =
            await configManager.getModuleConfig<ILoggingModuleConfig>(
              'logging',
            );

          // 合并自定义配置
          if (options.customConfig) {
            return { ...config, ...options.customConfig };
          }

          return config;
        },
        inject: ['IConfigManager'],
      },

      // 配置服务
      {
        provide: LoggingConfigService,
        useFactory: async (configManager: IConfigManager) => {
          const service = new LoggingConfigService(configManager);
          LoggingConfigModule.configService = service;
          return service;
        },
        inject: ['IConfigManager'],
      },
    ];

    return {
      module: LoggingConfigModule,
      providers,
      exports: [LoggingConfigService, 'LOGGING_CONFIG'],
      global: options.global !== false,
    };
  }

  /**
   * 模块初始化
   */
  async onModuleInit(): Promise<void> {
    try {
      if (LoggingConfigModule.configService) {
        await LoggingConfigModule.configService.initialize();
      }
    } catch (error) {
      console.error('日志配置模块初始化失败:', error);
      throw error;
    }
  }

  /**
   * 模块销毁
   */
  async onModuleDestroy(): Promise<void> {
    try {
      if (LoggingConfigModule.configService) {
        await LoggingConfigModule.configService.destroy();
        LoggingConfigModule.configService = null;
      }
    } catch (error) {
      console.error('日志配置模块销毁失败:', error);
    }
  }
}

/**
 * 日志配置注入装饰器
 */
export const InjectLoggingConfig = (): ParameterDecorator => {
  return Inject('LOGGING_CONFIG');
};

/**
 * 日志配置服务注入装饰器
 */
export const InjectLoggingConfigService = (): ParameterDecorator => {
  return Inject(LoggingConfigService);
};
