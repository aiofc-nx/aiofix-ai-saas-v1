/**
 * 简化数据库模块
 *
 * @description 第一阶段的NestJS模块集成
 * 提供基础的数据库功能，后续将逐步完善
 *
 * @since 1.0.0
 */

/* eslint-disable no-console */
import {
  Module,
  DynamicModule,
  Provider,
  Global,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import type { IConfigManager } from '@aiofix/config';
import { SimpleDatabaseManager } from '../core/simple-database-manager';
import { DatabaseConfigService } from '../config/database-config.service';

/**
 * 简化数据库模块选项接口
 */
export interface ISimpleDatabaseModuleOptions {
  /** 是否全局模块 */
  global?: boolean;
  /** 是否启用监控 */
  enableMonitoring?: boolean;
  /** 是否启用多租户 */
  enableMultiTenant?: boolean;
}

/**
 * 简化数据库模块实现
 */
@Global()
@Module({})
export class SimpleDatabaseModule implements OnModuleInit, OnModuleDestroy {
  private static databaseManager: SimpleDatabaseManager | null = null;
  private static configService: DatabaseConfigService | null = null;

  /**
   * 根模块配置
   */
  static forRoot(options: ISimpleDatabaseModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [
      // 配置服务
      {
        provide: DatabaseConfigService,
        useFactory: async (configManager: IConfigManager) => {
          const service = new DatabaseConfigService(configManager);
          SimpleDatabaseModule.configService = service;
          return service;
        },
        inject: ['IConfigManager'], // 临时token，等待Core模块完善
      },

      // 数据库管理器
      {
        provide: SimpleDatabaseManager,
        useFactory: async (configManager: IConfigManager) => {
          const manager = new SimpleDatabaseManager(configManager);
          SimpleDatabaseModule.databaseManager = manager;
          return manager;
        },
        inject: ['IConfigManager'],
      },
    ];

    return {
      module: SimpleDatabaseModule,
      providers,
      exports: [SimpleDatabaseManager, DatabaseConfigService],
      global: options.global !== false,
    };
  }

  /**
   * 模块初始化
   */
  async onModuleInit(): Promise<void> {
    try {
      // 初始化配置服务
      if (SimpleDatabaseModule.configService) {
        await SimpleDatabaseModule.configService.initialize();
      }

      // 初始化数据库管理器
      if (SimpleDatabaseModule.databaseManager) {
        await SimpleDatabaseModule.databaseManager.initialize();
      }

      console.log('简化数据库模块初始化完成');
    } catch (error) {
      console.error('简化数据库模块初始化失败:', error);
      throw error;
    }
  }

  /**
   * 模块销毁
   */
  async onModuleDestroy(): Promise<void> {
    try {
      // 销毁数据库管理器
      if (SimpleDatabaseModule.databaseManager) {
        await SimpleDatabaseModule.databaseManager.destroy();
        SimpleDatabaseModule.databaseManager = null;
      }

      // 销毁配置服务
      if (SimpleDatabaseModule.configService) {
        await SimpleDatabaseModule.configService.destroy();
        SimpleDatabaseModule.configService = null;
      }

      console.log('简化数据库模块销毁完成');
    } catch (error) {
      console.error('简化数据库模块销毁失败:', error);
    }
  }
}

/**
 * 数据库管理器注入装饰器
 */
export const InjectSimpleDatabaseManager = (): ParameterDecorator => {
  return Inject(SimpleDatabaseManager);
};

/**
 * 数据库配置注入装饰器
 */
export const InjectSimpleDatabaseConfig = (): ParameterDecorator => {
  return Inject(DatabaseConfigService);
};
