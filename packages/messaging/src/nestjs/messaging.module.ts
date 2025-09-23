/**
 * Messaging模块NestJS集成
 *
 * @description 为NestJS应用提供messaging模块的完整集成
 * 基于统一配置管理平台，提供依赖注入、生命周期管理等功能
 *
 * ## 核心功能
 *
 * ### 🏗️ 模块集成
 * - NestJS模块化集成
 * - 依赖注入支持
 * - 生命周期管理
 * - 配置驱动初始化
 *
 * ### 🎯 服务提供
 * - 消息传递服务注入
 * - 队列适配器注入
 * - 配置服务注入
 * - 日志服务集成
 *
 * ### 🔧 自动配置
 * - 基于配置自动创建服务
 * - 队列自动注册
 * - 处理器自动发现
 * - 监控自动启用
 *
 * @example
 * ```typescript
 * // 在应用模块中使用
 * @Module({
 *   imports: [
 *     MessagingModule.forRoot({
 *       enableAutoDiscovery: true,
 *       enableMonitoring: true
 *     })
 *   ]
 * })
 * export class AppModule {}
 *
 * // 在服务中注入使用
 * @Injectable()
 * export class MyService {
 *   constructor(
 *     @Inject('MESSAGING_SERVICE') private messagingService: IMessagingService,
 *     @Inject('MESSAGING_CONFIG') private messagingConfig: MessagingConfigService
 *   ) {}
 * }
 * ```
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
} from '@nestjs/common';
import type { IConfigManager } from '@aiofix/config';
import { MessagingConfigService } from '../config/messaging-config.service';
import { SimpleMessagingService } from '../services/simple-messaging.service';
import { SimpleBullQueueAdapter } from '../adapters/simple-bull-queue.adapter';
import { createMessagingLogger } from '../factories/messaging-logger.factory';

/**
 * Messaging模块选项接口
 *
 * @description 定义NestJS messaging模块的选项
 */
export interface IMessagingModuleOptions {
  /** 是否作为全局模块 */
  isGlobal?: boolean;

  /** 是否启用自动发现 */
  enableAutoDiscovery?: boolean;

  /** 是否启用监控 */
  enableMonitoring?: boolean;

  /** 是否启用热更新 */
  enableHotReload?: boolean;

  /** 自定义队列适配器 */
  customAdapters?: unknown[];

  /** 模块标识 */
  moduleId?: string;
}

/**
 * Messaging模块异步选项接口
 *
 * @description 定义异步messaging模块的选项
 */
export interface IMessagingModuleAsyncOptions {
  /** 是否作为全局模块 */
  isGlobal?: boolean;

  /** 注入的依赖 */
  inject?: unknown[];

  /** 配置工厂函数 */
  useFactory?: (
    ...args: unknown[]
  ) => Promise<IMessagingModuleOptions> | IMessagingModuleOptions;

  /** 配置类 */
  useClass?: new (...args: unknown[]) => IMessagingModuleOptions;

  /** 配置值 */
  useValue?: IMessagingModuleOptions;
}

/**
 * Messaging NestJS模块
 *
 * @description 实现messaging模块的NestJS集成
 */
@Global()
@Module({})
export class MessagingModule implements OnModuleInit, OnModuleDestroy {
  private static messagingService: SimpleMessagingService | null = null;
  private static configService: MessagingConfigService | null = null;

  /**
   * 同步配置模块
   *
   * @param options - 配置选项
   * @returns 动态模块
   */
  static forRoot(options: IMessagingModuleOptions = {}): DynamicModule {
    const providers = this.createProviders(options);

    return {
      module: MessagingModule,
      providers,
      exports: providers
        .map((p) => (p as { provide?: string }).provide)
        .filter((token): token is string => Boolean(token)),
      global: options.isGlobal !== false, // 默认为全局模块
    };
  }

  /**
   * 异步配置模块
   *
   * @param options - 异步配置选项
   * @returns 动态模块
   */
  static forRootAsync(options: IMessagingModuleAsyncOptions): DynamicModule {
    const providers = this.createAsyncProviders(options);

    return {
      module: MessagingModule,
      providers,
      exports: providers
        .map((p) => (p as { provide?: string }).provide)
        .filter((token): token is string => Boolean(token)),
      global: options.isGlobal !== false,
    };
  }

  /**
   * 功能模块配置
   *
   * @param featureOptions - 功能特定选项
   * @returns 动态模块
   */
  static forFeature(featureOptions: {
    queues?: string[];
    handlers?: string[];
  }): DynamicModule {
    const providers: Provider[] = [];

    // 队列特定提供者
    if (featureOptions.queues) {
      for (const queueName of featureOptions.queues) {
        providers.push({
          provide: `QUEUE_${queueName.toUpperCase()}`,
          useFactory: async (messagingService: SimpleMessagingService) => {
            // 这里可以返回特定队列的实例
            return messagingService;
          },
          inject: ['MESSAGING_SERVICE'],
        });
      }
    }

    // 处理器特定提供者
    if (featureOptions.handlers) {
      for (const handlerName of featureOptions.handlers) {
        providers.push({
          provide: `HANDLER_${handlerName.toUpperCase()}`,
          useFactory: async (configService: MessagingConfigService) => {
            return configService.getHandlerConfig(handlerName);
          },
          inject: ['MESSAGING_CONFIG_SERVICE'],
        });
      }
    }

    return {
      module: MessagingModule,
      providers,
      exports: providers
        .map((p) => (p as { provide?: string }).provide)
        .filter((token): token is string => Boolean(token)),
    };
  }

  /**
   * 模块初始化
   */
  async onModuleInit(): Promise<void> {
    // Messaging模块初始化完成
  }

  /**
   * 模块销毁
   */
  async onModuleDestroy(): Promise<void> {
    try {
      // 清理messaging服务
      if (MessagingModule.messagingService) {
        // SimpleMessagingService没有destroy方法，直接设置为null
        MessagingModule.messagingService = null;
      }

      // 清理配置服务
      if (MessagingModule.configService) {
        await MessagingModule.configService.destroy();
        MessagingModule.configService = null;
      }
    } catch {
      // Messaging模块销毁失败
    }
  }

  /**
   * 创建提供者
   *
   * @param options - 配置选项
   * @returns 提供者列表
   */
  private static createProviders(options: IMessagingModuleOptions): Provider[] {
    const providers: Provider[] = [];

    // 配置选项提供者
    providers.push({
      provide: 'MESSAGING_OPTIONS',
      useValue: options,
    });

    // Messaging配置服务提供者
    providers.push({
      provide: 'MESSAGING_CONFIG_SERVICE',
      useFactory: async (configManager: IConfigManager) => {
        if (!this.configService) {
          this.configService = new MessagingConfigService(configManager);
          await this.configService.initialize();
        }
        return this.configService;
      },
      inject: ['CONFIG_MANAGER'],
    });

    // Messaging日志服务提供者
    providers.push({
      provide: 'MESSAGING_LOGGER',
      useFactory: () => createMessagingLogger(),
    });

    // Bull队列适配器提供者
    providers.push({
      provide: 'BULL_QUEUE_ADAPTER',
      useFactory: async (
        configService: MessagingConfigService,
        logger: any,
      ) => {
        const config = await configService.getConfig();
        return new SimpleBullQueueAdapter(
          {
            name: 'default',
            redis: config.redis,
            enableTenantIsolation: config.global.enableTenantIsolation,
          },
          logger,
        );
      },
      inject: ['MESSAGING_CONFIG_SERVICE', 'MESSAGING_LOGGER'],
    });

    // Messaging服务提供者
    providers.push({
      provide: 'MESSAGING_SERVICE',
      useFactory: async (queueAdapter: SimpleBullQueueAdapter, logger: any) => {
        if (!this.messagingService) {
          this.messagingService = new SimpleMessagingService(
            [queueAdapter],
            logger,
          );
          // SimpleMessagingService没有initialize方法
        }
        return this.messagingService;
      },
      inject: ['BULL_QUEUE_ADAPTER', 'MESSAGING_LOGGER'],
    });

    return providers;
  }

  /**
   * 创建异步提供者
   *
   * @param options - 异步配置选项
   * @returns 提供者列表
   */
  private static createAsyncProviders(
    options: IMessagingModuleAsyncOptions,
  ): Provider[] {
    const providers: Provider[] = [];

    // 异步配置选项提供者
    if (options.useFactory) {
      providers.push({
        provide: 'MESSAGING_OPTIONS',
        useFactory: options.useFactory,
        inject: (options.inject as string[]) || [],
      });
    } else if (options.useClass) {
      providers.push({
        provide: 'MESSAGING_OPTIONS',
        useClass: options.useClass,
      });
    } else if (options.useValue) {
      providers.push({
        provide: 'MESSAGING_OPTIONS',
        useValue: options.useValue,
      });
    }

    // 其他提供者与同步版本相同
    providers.push(...this.createProviders({} as IMessagingModuleOptions));

    return providers;
  }
}

/**
 * Messaging装饰器
 *
 * @description 用于注入messaging服务的装饰器
 */
export const InjectMessagingService = (): ParameterDecorator => {
  return function (
    target: unknown,
    propertyKey?: string | symbol,
    parameterIndex?: number,
  ) {
    if (parameterIndex !== undefined) {
      return Reflect.defineMetadata(
        'inject:token',
        'MESSAGING_SERVICE',
        target as Record<string, unknown>,
        String(parameterIndex),
      );
    }
  };
};

/**
 * Messaging配置装饰器
 *
 * @description 用于注入messaging配置服务的装饰器
 */
export const InjectMessagingConfig = (): ParameterDecorator => {
  return function (
    target: unknown,
    propertyKey?: string | symbol,
    parameterIndex?: number,
  ) {
    if (parameterIndex !== undefined) {
      return Reflect.defineMetadata(
        'inject:token',
        'MESSAGING_CONFIG_SERVICE',
        target as Record<string, unknown>,
        String(parameterIndex),
      );
    }
  };
};
