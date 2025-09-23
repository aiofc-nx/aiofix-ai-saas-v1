/**
 * Core模块配置NestJS集成
 *
 * @description 提供Core模块配置的NestJS模块集成
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
	InjectionToken
} from '@nestjs/common';
import type { IConfigManager } from '@aiofix/config';
import { CoreConfigService } from './core-config.service';
import type { ICoreModuleConfig } from './core-config.interface';

/**
 * Core配置模块选项接口
 */
export interface ICoreConfigModuleOptions {
	/** 是否全局模块 */
	global?: boolean;
	/** 是否启用热更新 */
	enableHotReload?: boolean;
	/** 自定义配置覆盖 */
	customConfig?: Partial<ICoreModuleConfig>;
}

/**
 * Core配置模块异步选项接口
 */
export interface ICoreConfigModuleAsyncOptions {
	/** 配置工厂函数 */
	useFactory?: (...args: unknown[]) => Promise<ICoreConfigModuleOptions> | ICoreConfigModuleOptions;
	/** 注入的依赖 */
	inject?: InjectionToken[];
}

/**
 * Core配置模块实现
 */
@Global()
@Module({})
export class CoreConfigModule implements OnModuleInit, OnModuleDestroy {
	private static configService: CoreConfigService | null = null;

	/**
	 * 根模块配置
	 */
	static forRoot(options: ICoreConfigModuleOptions = {}): DynamicModule {
		const providers = this.createProviders(options);

		return {
			module: CoreConfigModule,
			providers,
			exports: providers.map((p) => (typeof p === 'object' && 'provide' in p ? p.provide : p)).filter(Boolean),
			global: options.global !== false
		};
	}

	/**
	 * 异步根模块配置
	 */
	static forRootAsync(options: ICoreConfigModuleAsyncOptions): DynamicModule {
		const providers = this.createAsyncProviders(options);

		return {
			module: CoreConfigModule,
			providers,
			exports: providers.map((p) => (typeof p === 'object' && 'provide' in p ? p.provide : p)).filter(Boolean)
		};
	}

	/**
	 * 模块初始化
	 */
	async onModuleInit(): Promise<void> {
		try {
			if (CoreConfigModule.configService) {
				await CoreConfigModule.configService.initialize();
			}
		} catch (error) {
			console.error('Core配置模块初始化失败:', error);
			throw error;
		}
	}

	/**
	 * 模块销毁
	 */
	async onModuleDestroy(): Promise<void> {
		try {
			if (CoreConfigModule.configService) {
				await CoreConfigModule.configService.destroy();
				CoreConfigModule.configService = null;
			}
		} catch (error) {
			console.error('Core配置模块销毁失败:', error);
		}
	}

	/**
	 * 创建提供者
	 */
	private static createProviders(options: ICoreConfigModuleOptions): Provider[] {
		const providers: Provider[] = [
			// 配置提供者
			{
				provide: 'CORE_CONFIG',
				useFactory: async (configManager: IConfigManager) => {
					const config = await configManager.getModuleConfig<ICoreModuleConfig>('core');

					// 合并自定义配置
					if (options.customConfig) {
						return { ...config, ...options.customConfig };
					}

					return config;
				},
				inject: ['IConfigManager']
			},

			// 配置服务
			{
				provide: CoreConfigService,
				useFactory: async (configManager: IConfigManager) => {
					const service = new CoreConfigService(configManager);
					CoreConfigModule.configService = service;
					return service;
				},
				inject: ['IConfigManager']
			}
		];

		return providers;
	}

	/**
	 * 创建异步提供者
	 */
	private static createAsyncProviders(options: ICoreConfigModuleAsyncOptions): Provider[] {
		const providers: Provider[] = [];

		// 异步配置提供者
		if (options.useFactory) {
			providers.push({
				provide: 'CORE_CONFIG_OPTIONS',
				useFactory: options.useFactory,
				inject: options.inject || ([] as InjectionToken[])
			});
		}

		// 基于异步选项创建其他提供者
		providers.push(...this.createProviders({} as ICoreConfigModuleOptions));

		return providers;
	}
}

/**
 * Core配置注入装饰器
 */
export const InjectCoreConfig = (): ParameterDecorator => {
	return Inject('CORE_CONFIG');
};

/**
 * Core配置服务注入装饰器
 */
export const InjectCoreConfigService = (): ParameterDecorator => {
	return Inject(CoreConfigService);
};
