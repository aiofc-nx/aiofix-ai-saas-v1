/**
 * 异常处理模块
 *
 * 提供NestJS异常处理模块，包括：
 * - 统一异常过滤器
 * - 异常处理拦截器
 * - 异常处理装饰器
 * - 异常处理服务
 *
 * @description NestJS异常处理模块实现
 * @since 2.0.0
 */

import { Module, DynamicModule, Global } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { UnifiedExceptionFilter } from './unified-exception-filter';
import { ExceptionHandlingInterceptor } from './exception-handling.interceptor';
import { UnifiedExceptionManager } from '../core';
import { ExceptionStrategyManager } from '../strategies';
import { CoreErrorBusBridge } from '../bridges';
import { ExceptionConfigModule } from '../config';

/**
 * 异常处理模块配置选项
 */
export interface ExceptionHandlingModuleOptions {
	/**
	 * 是否启用全局异常过滤器
	 */
	enableGlobalFilter?: boolean;

	/**
	 * 是否启用全局异常拦截器
	 */
	enableGlobalInterceptor?: boolean;

	/**
	 * 是否启用异常监控
	 */
	enableMonitoring?: boolean;

	/**
	 * 是否启用异常统计
	 */
	enableStatistics?: boolean;

	/**
	 * 异常处理超时时间（毫秒）
	 */
	timeout?: number;

	/**
	 * 是否启用异常恢复
	 */
	enableRecovery?: boolean;

	/**
	 * 是否启用异常分类
	 */
	enableClassification?: boolean;
}

/**
 * 异常处理模块
 *
 * 提供完整的NestJS异常处理能力，包括：
 * - 全局异常过滤器
 * - 全局异常拦截器
 * - 异常处理装饰器
 * - 异常处理服务
 * - 配置管理
 * - 监控和统计
 *
 * ## 业务规则
 *
 * ### 模块注册规则
 * - 支持全局注册和局部注册
 * - 支持动态配置选项
 * - 支持模块间的依赖注入
 * - 支持配置的热重载
 *
 * ### 异常处理规则
 * - 提供统一的异常处理接口
 * - 支持多种异常处理策略
 * - 支持异常的分类和恢复
 * - 支持异常的监控和统计
 *
 * ### 性能规则
 * - 异常处理不影响业务性能
 * - 支持异步异常处理
 * - 支持异常处理的熔断机制
 * - 支持异常处理的配置化
 *
 * @example
 * ```typescript
 * // 全局注册
 * @Module({
 *   imports: [
 *     ExceptionHandlingModule.forRoot({
 *       enableGlobalFilter: true,
 *       enableGlobalInterceptor: true,
 *       enableMonitoring: true,
 *       enableStatistics: true
 *     })
 *   ]
 * })
 * export class AppModule {}
 *
 * // 局部注册
 * @Module({
 *   imports: [
 *     ExceptionHandlingModule.forFeature({
 *       enableMonitoring: true,
 *       enableStatistics: true
 *     })
 *   ]
 * })
 * export class FeatureModule {}
 * ```
 *
 * @since 2.0.0
 */
@Global()
@Module({})
export class ExceptionHandlingModule {
	/**
	 * 全局注册异常处理模块
	 *
	 * @param options 配置选项
	 * @returns 动态模块
	 */
	public static forRoot(options: ExceptionHandlingModuleOptions = {}): DynamicModule {
		const {
			enableGlobalFilter = true,
			enableGlobalInterceptor = true,
			enableMonitoring = true,
			enableStatistics = true,
			timeout = 5000,
			enableRecovery = true,
			enableClassification = true
		} = options;

		return {
			module: ExceptionHandlingModule,
			imports: [ExceptionConfigModule.forRoot()],
			providers: [
				// 核心服务
				UnifiedExceptionManager,
				ExceptionStrategyManager,
				CoreErrorBusBridge,

				// 全局异常过滤器
				...(enableGlobalFilter
					? [
							{
								provide: APP_FILTER,
								useClass: UnifiedExceptionFilter
							}
					  ]
					: []),

				// 全局异常拦截器
				...(enableGlobalInterceptor
					? [
							{
								provide: APP_INTERCEPTOR,
								useClass: ExceptionHandlingInterceptor
							}
					  ]
					: []),

				// 配置服务
				{
					provide: 'EXCEPTION_HANDLING_OPTIONS',
					useValue: {
						enableMonitoring,
						enableStatistics,
						timeout,
						enableRecovery,
						enableClassification
					}
				}
			],
			exports: [UnifiedExceptionManager, ExceptionStrategyManager, CoreErrorBusBridge, 'EXCEPTION_HANDLING_OPTIONS']
		};
	}

	/**
	 * 局部注册异常处理模块
	 *
	 * @param options 配置选项
	 * @returns 动态模块
	 */
	public static forFeature(options: ExceptionHandlingModuleOptions = {}): DynamicModule {
		const {
			enableMonitoring = true,
			enableStatistics = true,
			timeout = 5000,
			enableRecovery = true,
			enableClassification = true
		} = options;

		return {
			module: ExceptionHandlingModule,
			imports: [ExceptionConfigModule.forFeature()],
			providers: [
				// 核心服务
				UnifiedExceptionManager,
				ExceptionStrategyManager,
				CoreErrorBusBridge,

				// 配置服务
				{
					provide: 'EXCEPTION_HANDLING_OPTIONS',
					useValue: {
						enableMonitoring,
						enableStatistics,
						timeout,
						enableRecovery,
						enableClassification
					}
				}
			],
			exports: [UnifiedExceptionManager, ExceptionStrategyManager, CoreErrorBusBridge, 'EXCEPTION_HANDLING_OPTIONS']
		};
	}

	/**
	 * 异步全局注册异常处理模块
	 *
	 * @param options 配置选项
	 * @returns 动态模块
	 */
	public static async forRootAsync(options: {
		useFactory: (...args: any[]) => Promise<ExceptionHandlingModuleOptions> | ExceptionHandlingModuleOptions;
		inject?: any[];
	}): Promise<DynamicModule> {
		return {
			module: ExceptionHandlingModule,
			imports: [ExceptionConfigModule.forRoot()],
			providers: [
				// 核心服务
				UnifiedExceptionManager,
				ExceptionStrategyManager,
				CoreErrorBusBridge,

				// 配置服务
				{
					provide: 'EXCEPTION_HANDLING_OPTIONS',
					useFactory: options.useFactory,
					inject: options.inject || []
				},

				// 全局异常过滤器
				{
					provide: APP_FILTER,
					useClass: UnifiedExceptionFilter
				},

				// 全局异常拦截器
				{
					provide: APP_INTERCEPTOR,
					useClass: ExceptionHandlingInterceptor
				}
			],
			exports: [UnifiedExceptionManager, ExceptionStrategyManager, CoreErrorBusBridge, 'EXCEPTION_HANDLING_OPTIONS']
		};
	}

	/**
	 * 异步局部注册异常处理模块
	 *
	 * @param options 配置选项
	 * @returns 动态模块
	 */
	public static async forFeatureAsync(options: {
		useFactory: (...args: any[]) => Promise<ExceptionHandlingModuleOptions> | ExceptionHandlingModuleOptions;
		inject?: any[];
	}): Promise<DynamicModule> {
		return {
			module: ExceptionHandlingModule,
			imports: [ExceptionConfigModule.forFeature()],
			providers: [
				// 核心服务
				UnifiedExceptionManager,
				ExceptionStrategyManager,
				CoreErrorBusBridge,

				// 配置服务
				{
					provide: 'EXCEPTION_HANDLING_OPTIONS',
					useFactory: options.useFactory,
					inject: options.inject || []
				}
			],
			exports: [UnifiedExceptionManager, ExceptionStrategyManager, CoreErrorBusBridge, 'EXCEPTION_HANDLING_OPTIONS']
		};
	}
}
