/**
 * 统一配置管理NestJS模块
 *
 * @description 为NestJS应用提供统一配置管理的模块集成
 * 支持依赖注入、全局配置、模块配置等功能
 *
 * ## 核心功能
 *
 * ### 🏗️ 模块集成
 * - NestJS模块化集成
 * - 依赖注入支持
 * - 全局配置提供者
 * - 模块特定配置
 *
 * ### 🎯 配置注入
 * - 配置管理器注入
 * - 模块配置API注入
 * - 配置验证器注入
 * - 热更新管理器注入
 *
 * ### 🔧 生命周期管理
 * - 模块初始化
 * - 配置预加载
 * - 优雅关闭
 * - 资源清理
 *
 * @example
 * ```typescript
 * // 在应用模块中使用
 * @Module({
 *   imports: [
 *     UnifiedConfigModule.forRoot({
 *       loadStrategy: ConfigLoadStrategy.MERGE,
 *       enableHotReload: true,
 *       providers: [
 *         new EnvironmentConfigProvider(),
 *         new FileConfigProvider('./config.json')
 *       ]
 *     })
 *   ]
 * })
 * export class AppModule {}
 *
 * // 在服务中注入使用
 * @Injectable()
 * export class MyService {
 *   constructor(
 *     @Inject('CONFIG_MANAGER') private configManager: IConfigManager,
 *     @Inject('MESSAGING_CONFIG') private messagingConfig: any
 *   ) {}
 * }
 * ```
 *
 * @since 1.0.0
 */

import { DynamicModule, Provider, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import type { IConfigManager, IConfigManagerOptions } from '../interfaces/config.interface';
import { UnifiedConfigManager } from '../core/config-manager';
import { EnvironmentConfigProvider } from '../providers/environment-provider';
import { ConfigValidator } from '../validation/config-validator';
import { ConfigHotReloader } from '../hotreload/config-hot-reloader';
import { ConfigMonitor } from '../monitoring/config-monitor';

/**
 * 配置模块选项接口
 *
 * @description 定义NestJS配置模块的选项
 */
export interface IUnifiedConfigModuleOptions extends IConfigManagerOptions {
	/** 是否作为全局模块 */
	isGlobal?: boolean;

	/** 配置预加载路径 */
	preloadPaths?: string[];

	/** 是否启用热更新 */
	enableHotReload?: boolean;

	/** 是否启用监控 */
	enableMonitoring?: boolean;

	/** 模块标识 */
	moduleId?: string;
}

/**
 * 配置模块异步选项接口
 *
 * @description 定义异步配置模块的选项
 */
export interface IUnifiedConfigModuleAsyncOptions {
	/** 是否作为全局模块 */
	isGlobal?: boolean;

	/** 注入的依赖 */
	inject?: unknown[];

	/** 配置工厂函数 */
	useFactory?: (...args: unknown[]) => Promise<IUnifiedConfigModuleOptions> | IUnifiedConfigModuleOptions;

	/** 配置类 */
	useClass?: new (...args: unknown[]) => IUnifiedConfigModuleOptions;

	/** 配置值 */
	useValue?: IUnifiedConfigModuleOptions;
}

/**
 * 统一配置管理NestJS模块
 *
 * @description 实现NestJS模块集成
 */
export class UnifiedConfigModule implements OnModuleInit, OnModuleDestroy {
	private static configManager: IConfigManager | null = null;
	private static hotReloader: ConfigHotReloader | null = null;
	private static monitor: ConfigMonitor | null = null;

	/**
	 * 同步配置模块
	 *
	 * @param options - 配置选项
	 * @returns 动态模块
	 */
	static forRoot(options: IUnifiedConfigModuleOptions = {}): DynamicModule {
		const providers = this.createProviders(options);

		return {
			module: UnifiedConfigModule,
			providers,
			exports: providers
				.map((p) => (p as { provide?: string }).provide)
				.filter((token): token is string => Boolean(token)),
			global: options.isGlobal !== false // 默认为全局模块
		};
	}

	/**
	 * 异步配置模块
	 *
	 * @param options - 异步配置选项
	 * @returns 动态模块
	 */
	static forRootAsync(options: IUnifiedConfigModuleAsyncOptions): DynamicModule {
		const providers = this.createAsyncProviders(options);

		return {
			module: UnifiedConfigModule,
			providers,
			exports: providers
				.map((p) => (p as { provide?: string }).provide)
				.filter((token): token is string => Boolean(token)),
			global: options.isGlobal !== false
		};
	}

	/**
	 * 功能模块配置
	 *
	 * @param moduleOptions - 模块特定选项
	 * @returns 动态模块
	 */
	static forFeature(moduleOptions: { module: string; configPath?: string }): DynamicModule {
		const moduleConfigProvider: Provider = {
			provide: `${moduleOptions.module.toUpperCase()}_CONFIG`,
			useFactory: async (configManager: IConfigManager) => {
				const configPath = moduleOptions.configPath || moduleOptions.module;
				return configManager.getModuleConfig(configPath);
			},
			inject: ['CONFIG_MANAGER']
		};

		return {
			module: UnifiedConfigModule,
			providers: [moduleConfigProvider],
			exports: [moduleConfigProvider.provide]
		};
	}

	/**
	 * 模块初始化
	 */
	async onModuleInit(): Promise<void> {
		// 统一配置模块初始化完成
	}

	/**
	 * 模块销毁
	 */
	async onModuleDestroy(): Promise<void> {
		try {
			// 清理配置管理器
			if (UnifiedConfigModule.configManager) {
				await UnifiedConfigModule.configManager.destroy();
				UnifiedConfigModule.configManager = null;
			}

			// 清理热更新管理器
			if (UnifiedConfigModule.hotReloader) {
				await UnifiedConfigModule.hotReloader.destroy();
				UnifiedConfigModule.hotReloader = null;
			}

			// 清理监控器
			if (UnifiedConfigModule.monitor) {
				await UnifiedConfigModule.monitor.destroy();
				UnifiedConfigModule.monitor = null;
			}

			// 统一配置模块销毁完成
		} catch {
			// 统一配置模块销毁失败
		}
	}

	/**
	 * 创建提供者
	 *
	 * @param options - 配置选项
	 * @returns 提供者列表
	 */
	private static createProviders(options: IUnifiedConfigModuleOptions): Provider[] {
		const providers: Provider[] = [];

		// 配置选项提供者
		providers.push({
			provide: 'CONFIG_OPTIONS',
			useValue: options
		});

		// 配置管理器提供者
		providers.push({
			provide: 'CONFIG_MANAGER',
			useFactory: async (configOptions: IUnifiedConfigModuleOptions) => {
				if (!this.configManager) {
					this.configManager = new UnifiedConfigManager();
					await this.configManager.initialize({
						enableCache: true,
						enableValidation: true,
						providers: [new EnvironmentConfigProvider()],
						...configOptions
					});
				}
				return this.configManager;
			},
			inject: ['CONFIG_OPTIONS']
		});

		// 配置验证器提供者
		providers.push({
			provide: 'CONFIG_VALIDATOR',
			useClass: ConfigValidator
		});

		// 热更新管理器提供者（可选）
		if (options.enableHotReload) {
			providers.push({
				provide: 'CONFIG_HOT_RELOADER',
				useFactory: async (configManager: IConfigManager) => {
					if (!this.hotReloader) {
						this.hotReloader = new ConfigHotReloader(configManager);
						await this.hotReloader.initialize();
					}
					return this.hotReloader;
				},
				inject: ['CONFIG_MANAGER']
			});
		}

		// 配置监控器提供者（可选）
		if (options.enableMonitoring) {
			providers.push({
				provide: 'CONFIG_MONITOR',
				useFactory: async (configManager: IConfigManager) => {
					if (!this.monitor) {
						this.monitor = new ConfigMonitor(configManager);
						await this.monitor.initialize();
					}
					return this.monitor;
				},
				inject: ['CONFIG_MANAGER']
			});
		}

		// 常用模块配置提供者
		providers.push(
			{
				provide: 'SYSTEM_CONFIG',
				useFactory: (configManager: IConfigManager) => configManager.getModuleConfig('system'),
				inject: ['CONFIG_MANAGER']
			},
			{
				provide: 'CORE_CONFIG',
				useFactory: (configManager: IConfigManager) => configManager.getModuleConfig('core'),
				inject: ['CONFIG_MANAGER']
			},
			{
				provide: 'MESSAGING_CONFIG',
				useFactory: (configManager: IConfigManager) => configManager.getModuleConfig('messaging'),
				inject: ['CONFIG_MANAGER']
			},
			{
				provide: 'AUTH_CONFIG',
				useFactory: (configManager: IConfigManager) => configManager.getModuleConfig('auth'),
				inject: ['CONFIG_MANAGER']
			}
		);

		return providers;
	}

	/**
	 * 创建异步提供者
	 *
	 * @param options - 异步配置选项
	 * @returns 提供者列表
	 */
	private static createAsyncProviders(options: IUnifiedConfigModuleAsyncOptions): Provider[] {
		const providers: Provider[] = [];

		// 异步配置选项提供者
		if (options.useFactory) {
			providers.push({
				provide: 'CONFIG_OPTIONS',
				useFactory: options.useFactory,
				inject: (options.inject as string[]) || []
			});
		} else if (options.useClass) {
			providers.push({
				provide: 'CONFIG_OPTIONS',
				useClass: options.useClass
			});
		} else if (options.useValue) {
			providers.push({
				provide: 'CONFIG_OPTIONS',
				useValue: options.useValue
			});
		}

		// 其他提供者与同步版本相同
		providers.push(...this.createProviders({} as IUnifiedConfigModuleOptions));

		return providers;
	}
}

/**
 * 配置装饰器
 *
 * @description 用于注入配置的装饰器
 */
export const InjectConfig = (path?: string): ParameterDecorator => {
	return function (target: unknown, propertyKey?: string | symbol, parameterIndex?: number) {
		// 这里可以实现自定义的配置注入逻辑
		// 目前使用简化实现
		const token = path ? `CONFIG_${path.toUpperCase().replace(/\./g, '_')}` : 'CONFIG_MANAGER';
		if (parameterIndex !== undefined) {
			return Reflect.defineMetadata('inject:token', token, target as Record<string, unknown>, String(parameterIndex));
		}
	};
};

/**
 * 模块配置装饰器
 *
 * @description 用于注入模块配置的装饰器
 */
export const InjectModuleConfig = (module: string): ParameterDecorator => {
	const token = `${module.toUpperCase()}_CONFIG`;
	return function (target: unknown, propertyKey?: string | symbol, parameterIndex?: number) {
		if (parameterIndex !== undefined) {
			return Reflect.defineMetadata('inject:token', token, target as Record<string, unknown>, String(parameterIndex));
		}
	};
};
