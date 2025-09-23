/**
 * Fastify模块
 *
 * @description Fastify Web框架集成模块，提供企业级Fastify集成功能
 *
 * ## 业务规则
 *
 * ### 模块配置规则
 * - 支持同步和异步配置方式
 * - 配置验证和默认值处理
 * - 支持环境变量覆盖配置
 * - 配置变更时自动重启服务器
 *
 * ### 服务提供规则
 * - CoreFastifyAdapter作为核心服务提供者
 * - 插件和中间件作为可选服务注入
 * - 支持自定义插件和中间件扩展
 * - 服务依赖关系管理和注入顺序
 *
 * ### 生命周期管理规则
 * - 模块启动时初始化Fastify适配器
 * - 按优先级注册插件和中间件
 * - 模块关闭时优雅停止所有服务
 * - 异常情况下的资源清理和恢复
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     FastifyModule.forRoot({
 *       server: { port: 3000, host: '0.0.0.0' },
 *       plugins: [{ name: 'cors', enabled: true }],
 *       middleware: [{ name: 'tenant', enabled: true }],
 *       monitoring: { enableMetrics: true }
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 *
 * @since 1.0.0
 */

import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ModuleMetadata, Type } from '@nestjs/common/interfaces';
import { CoreFastifyAdapter } from './adapters/core-fastify.adapter';
import { IFastifyConfiguration } from './interfaces/fastify.interface';
// 注意：ILoggerService 来自 @aiofix/logging 模块
// 这里使用接口定义避免运行时依赖
interface ILoggerService {
	info(message: string, context?: unknown): void;
	error(message: string, error?: Error, context?: unknown): void;
	warn(message: string, context?: unknown): void;
	debug(message: string, context?: unknown): void;
}

/**
 * Fastify模块配置接口
 */
export interface IFastifyModuleOptions extends IFastifyConfiguration {
	/**
	 * 是否为全局模块
	 */
	isGlobal?: boolean;
}

/**
 * Fastify异步模块配置接口
 */
export interface IFastifyModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
	/**
	 * 是否为全局模块
	 */
	isGlobal?: boolean;

	/**
	 * 配置工厂函数
	 */
	useFactory?: (...args: unknown[]) => Promise<IFastifyModuleOptions> | IFastifyModuleOptions;

	/**
	 * 注入的依赖
	 */
	inject?: Array<string | symbol | ((...args: unknown[]) => unknown) | Type<unknown>>;

	/**
	 * 使用现有的类
	 */
	useExisting?: Type<IFastifyModuleOptions>;

	/**
	 * 使用类
	 */
	useClass?: Type<IFastifyModuleOptions>;
}

/**
 * Fastify模块常量
 */
export const FASTIFY_MODULE_OPTIONS = 'FASTIFY_MODULE_OPTIONS';
export const FASTIFY_ADAPTER = 'FASTIFY_ADAPTER';

/**
 * Fastify模块
 */
@Module({})
export class FastifyModule {
	/**
	 * 创建同步动态模块
	 */
	static forRoot(options: IFastifyModuleOptions): DynamicModule {
		const providers = this.createProviders(options);

		return {
			module: FastifyModule,
			providers,
			exports: [FASTIFY_ADAPTER],
			global: options.isGlobal !== false
		};
	}

	/**
	 * 创建异步动态模块
	 */
	static forRootAsync(options: IFastifyModuleAsyncOptions): DynamicModule {
		const providers = this.createAsyncProviders(options);

		return {
			module: FastifyModule,
			imports: options.imports || [],
			providers,
			exports: [FASTIFY_ADAPTER],
			global: options.isGlobal !== false
		};
	}

	/**
	 * 创建同步提供者
	 */
	private static createProviders(options: IFastifyModuleOptions): Provider[] {
		return [
			{
				provide: FASTIFY_MODULE_OPTIONS,
				useValue: this.mergeWithDefaults(options)
			},
			{
				provide: FASTIFY_ADAPTER,
				useFactory: (config: IFastifyConfiguration, logger?: ILoggerService): CoreFastifyAdapter => {
					return new CoreFastifyAdapter(
						config,
						logger || {
							info: (): void => {
								/* 默认空实现 */
							},
							error: (): void => {
								/* 默认空实现 */
							},
							warn: (): void => {
								/* 默认空实现 */
							},
							debug: (): void => {
								/* 默认空实现 */
							}
						}
					);
				},
				inject: [FASTIFY_MODULE_OPTIONS, { token: 'ILoggerService', optional: true }]
			}
		];
	}

	/**
	 * 创建异步提供者
	 */
	private static createAsyncProviders(options: IFastifyModuleAsyncOptions): Provider[] {
		const providers: Provider[] = [];

		// 配置提供者
		if (options.useFactory) {
			providers.push({
				provide: FASTIFY_MODULE_OPTIONS,
				useFactory: async (...args: unknown[]) => {
					if (!options.useFactory) {
						throw new Error('useFactory is required when useFactory is specified');
					}
					const config = await options.useFactory(...args);
					return this.mergeWithDefaults(config);
				},
				inject: options.inject || []
			});
		} else if (options.useClass) {
			providers.push({
				provide: FASTIFY_MODULE_OPTIONS,
				useClass: options.useClass
			});
		} else if (options.useExisting) {
			providers.push({
				provide: FASTIFY_MODULE_OPTIONS,
				useExisting: options.useExisting
			});
		}

		// 适配器提供者
		providers.push({
			provide: FASTIFY_ADAPTER,
			useFactory: (config: IFastifyConfiguration, logger?: ILoggerService) => {
				return new CoreFastifyAdapter(
					config,
					logger || {
						info: (): void => {
							/* 默认空实现 */
						},
						error: (): void => {
							/* 默认空实现 */
						},
						warn: (): void => {
							/* 默认空实现 */
						},
						debug: (): void => {
							/* 默认空实现 */
						}
					}
				);
			},
			inject: [FASTIFY_MODULE_OPTIONS, { token: 'ILoggerService', optional: true }]
		});

		return providers;
	}

	/**
	 * 合并默认配置
	 */
	private static mergeWithDefaults(options: IFastifyModuleOptions): IFastifyConfiguration {
		const defaults: IFastifyConfiguration = {
			server: {
				port: 3000,
				host: '0.0.0.0'
			},
			plugins: [],
			middleware: [],
			routes: [],
			monitoring: {
				enableMetrics: true,
				enableHealthCheck: true,
				enablePerformanceMonitoring: true,
				metricsInterval: 30000
			},
			security: {
				enableHelmet: true,
				enableCORS: true,
				enableRateLimit: false
			},
			logging: {
				level: 'info',
				prettyPrint: process.env.NODE_ENV !== 'production'
			},
			multiTenant: {
				enabled: false,
				tenantHeader: 'X-Tenant-ID',
				tenantQueryParam: 'tenant'
			}
		};

		return {
			...defaults,
			...options,
			server: { ...defaults.server, ...options.server },
			monitoring: { ...defaults.monitoring, ...options.monitoring },
			security: { ...defaults.security, ...options.security },
			logging: { ...defaults.logging, ...options.logging },
			multiTenant: options.multiTenant
				? {
						enabled: options.multiTenant.enabled ?? defaults.multiTenant?.enabled ?? false,
						tenantHeader: options.multiTenant.tenantHeader ?? defaults.multiTenant?.tenantHeader ?? 'X-Tenant-ID',
						tenantQueryParam: options.multiTenant.tenantQueryParam ?? defaults.multiTenant?.tenantQueryParam ?? 'tenant'
				  }
				: defaults.multiTenant ?? {
						enabled: false,
						tenantHeader: 'X-Tenant-ID',
						tenantQueryParam: 'tenant'
				  },
			plugins: options.plugins || defaults.plugins,
			middleware: options.middleware || defaults.middleware,
			routes: options.routes || defaults.routes
		};
	}
}
