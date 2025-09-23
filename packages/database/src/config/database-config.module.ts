/**
 * 数据库模块配置NestJS集成
 *
 * @description 提供数据库模块配置的NestJS模块集成
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
import type { IConfigManager, IDatabaseModuleConfig } from '@aiofix/config';
import { DatabaseConfigService } from './database-config.service';

/**
 * 数据库配置模块选项接口
 */
export interface IDatabaseConfigModuleOptions {
  /** 是否全局模块 */
  global?: boolean;
  /** 是否启用热更新 */
  enableHotReload?: boolean;
  /** 自定义配置覆盖 */
  customConfig?: Partial<IDatabaseModuleConfig>;
}

/**
 * 数据库配置模块实现
 */
@Global()
@Module({})
export class DatabaseConfigModule implements OnModuleInit, OnModuleDestroy {
  private static configService: DatabaseConfigService | null = null;

  /**
   * 根模块配置
   */
  static forRoot(options: IDatabaseConfigModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [
      // 配置提供者
      {
        provide: 'DATABASE_CONFIG',
        useFactory: async (
          configManager: IConfigManager,
        ): Promise<IDatabaseModuleConfig> => {
          const config =
            await configManager.getModuleConfig<IDatabaseModuleConfig>(
              'database',
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
        provide: DatabaseConfigService,
        useFactory: async (
          configManager: IConfigManager,
        ): Promise<DatabaseConfigService> => {
          const service = new DatabaseConfigService(configManager);
          DatabaseConfigModule.configService = service;
          return service;
        },
        inject: ['IConfigManager'],
      },
    ];

    return {
      module: DatabaseConfigModule,
      providers,
      exports: [DatabaseConfigService, 'DATABASE_CONFIG'],
      global: options.global !== false,
    };
  }

  /**
   * 模块初始化
   */
  async onModuleInit(): Promise<void> {
    try {
      if (DatabaseConfigModule.configService) {
        await DatabaseConfigModule.configService.initialize();
      }
    } catch (error) {
      console.error('数据库配置模块初始化失败:', error);
      throw error;
    }
  }

  /**
   * 模块销毁
   */
  async onModuleDestroy(): Promise<void> {
    try {
      if (DatabaseConfigModule.configService) {
        await DatabaseConfigModule.configService.destroy();
        DatabaseConfigModule.configService = null;
      }
    } catch (error) {
      console.error('数据库配置模块销毁失败:', error);
    }
  }
}

/**
 * 数据库配置注入装饰器
 */
export const InjectDatabaseConfig = (): ParameterDecorator => {
  return Inject('DATABASE_CONFIG');
};

/**
 * 数据库配置服务注入装饰器
 */
export const InjectDatabaseConfigService = (): ParameterDecorator => {
  return Inject(DatabaseConfigService);
};
