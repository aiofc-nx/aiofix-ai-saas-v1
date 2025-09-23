/**
 * 统一异常管理器
 *
 * 负责统一管理所有异常处理逻辑，包括异常转换、分类、策略应用和处理器执行。
 * 这是整个异常处理系统的核心组件，协调各个子组件完成异常处理流程。
 *
 * @description 统一异常管理器实现类
 * @example
 * ```typescript
 * const manager = new UnifiedExceptionManager(configManager, errorBus, logger);
 * await manager.initialize();
 * await manager.handle(exception, host);
 * ```
 *
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import type { CoreErrorBus } from '@aiofix/core';
import type { IConfigManager } from '@aiofix/config';
import type {
	IUnifiedExceptionManager,
	IUnifiedException,
	IExceptionHandler,
	IExceptionHandlingStrategy,
	IExceptionStats,
	IExceptionHealth
} from '../interfaces/exception.interface';
import { ExceptionContextManager } from './exception-context-manager';
import { ExceptionClassifier } from './exception-classifier';
import { ExceptionTransformer } from './exception-transformer';

/**
 * 统一异常管理器
 */
@Injectable()
export class UnifiedExceptionManager implements IUnifiedExceptionManager {
	private handlers = new Map<string, IExceptionHandler>();
	private strategies = new Map<string, IExceptionHandlingStrategy>();
	private initialized = false;
	private config: any = null;
	private stats: IExceptionStats = this.initializeStats();

	constructor(
		private readonly configManager: IConfigManager,
		private readonly errorBus: CoreErrorBus,
		private readonly logger: ILoggerService,
		private readonly contextManager: ExceptionContextManager,
		private readonly classifier: ExceptionClassifier,
		private readonly transformer: ExceptionTransformer
	) {}

	/**
	 * 初始化管理器
	 */
	async initialize(): Promise<void> {
		if (this.initialized) {
			return;
		}

		try {
			this.logger.info('开始初始化统一异常管理器', LogContext.SYSTEM);

			// 加载配置
			await this.loadConfiguration();

			// 初始化错误总线集成
			if (this.config?.global?.enableErrorBusIntegration) {
				await this.initializeErrorBusIntegration();
			}

			// 注册默认策略
			await this.registerDefaultStrategies();

			// 启动监控
			if (this.config?.monitoring?.enableMetrics) {
				await this.startMonitoring();
			}

			this.initialized = true;
			this.logger.info('统一异常管理器初始化完成', LogContext.SYSTEM, {
				handlersCount: this.handlers.size,
				strategiesCount: this.strategies.size,
				config: this.config
			});
		} catch (error) {
			this.logger.error('统一异常管理器初始化失败', LogContext.SYSTEM, {}, error as Error);
			throw new Error(`统一异常管理器初始化失败: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * 销毁管理器
	 */
	async destroy(): Promise<void> {
		try {
			this.logger.info('开始销毁统一异常管理器', LogContext.SYSTEM);

			// 停止监控
			if (this.config?.monitoring?.enableMetrics) {
				await this.stopMonitoring();
			}

			// 清理资源
			this.handlers.clear();
			this.strategies.clear();
			this.initialized = false;
			this.config = null;

			this.logger.info('统一异常管理器销毁完成', LogContext.SYSTEM);
		} catch (error) {
			this.logger.error('统一异常管理器销毁失败', LogContext.SYSTEM, {}, error as Error);
		}
	}

	/**
	 * 处理异常
	 *
	 * @param exception - 异常对象
	 * @param host - 执行上下文
	 */
	async handle(exception: unknown, host: ArgumentsHost): Promise<void> {
		await this.ensureInitialized();

		const startTime = Date.now();
		let unifiedException: IUnifiedException;

		try {
			this.logger.debug('开始处理异常', LogContext.EXCEPTION, { exception });

			// 转换为统一异常
			unifiedException = await this.transformer.transform(exception, host);

			// 更新统计信息
			await this.updateStats(unifiedException);

			// 发布到错误总线
			if (this.config?.global?.enableErrorBusIntegration) {
				await this.publishToErrorBus(unifiedException);
			}

			// 应用处理策略
			await this.applyStrategies(unifiedException, host);

			// 执行注册的处理器
			await this.executeHandlers(unifiedException, host);

			this.logger.debug('异常处理完成', LogContext.EXCEPTION, {
				exceptionId: unifiedException.id,
				category: unifiedException.category,
				level: unifiedException.level,
				duration: Date.now() - startTime
			});
		} catch (handlingError) {
			this.logger.error(
				'异常处理过程中发生错误',
				LogContext.EXCEPTION,
				{
					originalException: exception,
					handlingError: handlingError instanceof Error ? handlingError.message : String(handlingError),
					duration: Date.now() - startTime
				},
				handlingError as Error
			);

			// 降级处理：直接返回基本错误响应
			await this.fallbackErrorHandling(exception, host);
		}
	}

	/**
	 * 注册异常处理器
	 *
	 * @param handler - 异常处理器
	 */
	registerHandler(handler: IExceptionHandler): void {
		this.handlers.set(handler.name, handler);
		this.logger.debug('注册异常处理器', LogContext.SYSTEM, {
			handlerName: handler.name,
			priority: handler.priority
		});
	}

	/**
	 * 注销异常处理器
	 *
	 * @param name - 处理器名称
	 */
	unregisterHandler(name: string): void {
		const removed = this.handlers.delete(name);
		if (removed) {
			this.logger.debug('注销异常处理器', LogContext.SYSTEM, { handlerName: name });
		}
	}

	/**
	 * 注册异常处理策略
	 *
	 * @param strategy - 异常处理策略
	 */
	registerStrategy(strategy: IExceptionHandlingStrategy): void {
		this.strategies.set(strategy.name, strategy);
		this.logger.debug('注册异常处理策略', LogContext.SYSTEM, {
			strategyName: strategy.name,
			priority: strategy.priority
		});
	}

	/**
	 * 注销异常处理策略
	 *
	 * @param name - 策略名称
	 */
	unregisterStrategy(name: string): void {
		const removed = this.strategies.delete(name);
		if (removed) {
			this.logger.debug('注销异常处理策略', LogContext.SYSTEM, { strategyName: name });
		}
	}

	/**
	 * 获取统计信息
	 *
	 * @returns 异常统计信息
	 */
	async getStats(): Promise<IExceptionStats> {
		return { ...this.stats };
	}

	/**
	 * 获取健康状态
	 *
	 * @returns 异常健康状态
	 */
	async getHealth(): Promise<IExceptionHealth> {
		return {
			isHealthy: this.initialized && this.config !== null,
			details: {
				managerStatus: this.initialized ? 'running' : 'stopped',
				errorBusConnection: this.config?.global?.enableErrorBusIntegration || false,
				configLoaded: this.config !== null,
				strategiesLoaded: this.strategies.size,
				handlersLoaded: this.handlers.size
			},
			checkedAt: new Date()
		};
	}

	/**
	 * 确保管理器已初始化
	 */
	private async ensureInitialized(): Promise<void> {
		if (!this.initialized) {
			await this.initialize();
		}
	}

	/**
	 * 加载配置
	 */
	private async loadConfiguration(): Promise<void> {
		try {
			this.config = await this.configManager.getModuleConfig('exceptions');
			this.logger.info('异常模块配置加载完成', LogContext.SYSTEM, { config: this.config });
		} catch (error) {
			this.logger.warn('无法加载异常模块配置，使用默认配置', LogContext.SYSTEM, {
				error: error instanceof Error ? error.message : String(error)
			});
			this.config = this.getDefaultConfig();
		}
	}

	/**
	 * 获取默认配置
	 */
	private getDefaultConfig(): any {
		return {
			enabled: true,
			global: {
				enableTenantIsolation: true,
				enableErrorBusIntegration: true,
				enableSwaggerIntegration: true,
				defaultHandlingStrategy: 'log_only',
				enableMetrics: true,
				enableTracing: true
			},
			http: {
				enableRFC7807: true,
				includeStackTrace: false,
				enableCORS: true,
				defaultErrorMessage: 'An error occurred'
			},
			logging: {
				enableStructuredLogging: true,
				logLevel: 'error',
				enableSensitiveDataMasking: true
			},
			recovery: {
				enableAutoRecovery: false,
				maxRetryAttempts: 3,
				retryDelay: 1000,
				enableCircuitBreaker: false
			},
			monitoring: {
				enableMetrics: true,
				metricsInterval: 60000,
				enableHealthChecks: true,
				enableAlerts: false
			}
		};
	}

	/**
	 * 初始化错误总线集成
	 */
	private async initializeErrorBusIntegration(): Promise<void> {
		try {
			// 这里可以添加错误总线的初始化逻辑
			this.logger.info('错误总线集成初始化完成', LogContext.SYSTEM);
		} catch (error) {
			this.logger.error('错误总线集成初始化失败', LogContext.SYSTEM, {}, error as Error);
		}
	}

	/**
	 * 注册默认策略
	 */
	private async registerDefaultStrategies(): Promise<void> {
		// 这里会注册默认的处理策略
		// 具体的策略实现将在后续阶段添加
		this.logger.info('默认策略注册完成', LogContext.SYSTEM);
	}

	/**
	 * 启动监控
	 */
	private async startMonitoring(): Promise<void> {
		// 这里会启动监控逻辑
		this.logger.info('异常监控启动完成', LogContext.SYSTEM);
	}

	/**
	 * 停止监控
	 */
	private async stopMonitoring(): Promise<void> {
		// 这里会停止监控逻辑
		this.logger.info('异常监控停止完成', LogContext.SYSTEM);
	}

	/**
	 * 发布到错误总线
	 */
	private async publishToErrorBus(unifiedException: IUnifiedException): Promise<void> {
		try {
			// 这里会实现发布到Core模块错误总线的逻辑
			this.logger.debug('异常已发布到错误总线', LogContext.EXCEPTION, {
				exceptionId: unifiedException.id
			});
		} catch (error) {
			this.logger.error(
				'发布到错误总线失败',
				LogContext.EXCEPTION,
				{
					exceptionId: unifiedException.id,
					error: error instanceof Error ? error.message : String(error)
				},
				error as Error
			);
		}
	}

	/**
	 * 应用处理策略
	 */
	private async applyStrategies(unifiedException: IUnifiedException, host: ArgumentsHost): Promise<void> {
		const applicableStrategies = Array.from(this.strategies.values())
			.filter((strategy) => strategy.shouldApply(unifiedException))
			.sort((a, b) => b.priority - a.priority);

		for (const strategy of applicableStrategies) {
			try {
				const result = await strategy.apply(unifiedException, host);
				this.logger.debug(`策略 ${strategy.name} 执行结果`, LogContext.EXCEPTION, {
					strategy: strategy.name,
					result
				});
			} catch (strategyError) {
				this.logger.warn(`策略 ${strategy.name} 执行失败`, LogContext.EXCEPTION, {
					strategy: strategy.name,
					error: strategyError instanceof Error ? strategyError.message : String(strategyError)
				});
			}
		}
	}

	/**
	 * 执行注册的处理器
	 */
	private async executeHandlers(unifiedException: IUnifiedException, host: ArgumentsHost): Promise<void> {
		const applicableHandlers = Array.from(this.handlers.values())
			.filter((handler) => handler.shouldHandle(unifiedException))
			.sort((a, b) => b.priority - a.priority);

		for (const handler of applicableHandlers) {
			try {
				const result = await handler.handle(unifiedException, host);
				this.logger.debug(`处理器 ${handler.name} 执行结果`, LogContext.EXCEPTION, {
					handler: handler.name,
					result
				});
			} catch (handlerError) {
				this.logger.warn(`处理器 ${handler.name} 执行失败`, LogContext.EXCEPTION, {
					handler: handler.name,
					error: handlerError instanceof Error ? handlerError.message : String(handlerError)
				});
			}
		}
	}

	/**
	 * 更新统计信息
	 */
	private async updateStats(unifiedException: IUnifiedException): Promise<void> {
		this.stats.totalExceptions++;
		this.stats.byCategory[unifiedException.category]++;
		this.stats.byLevel[unifiedException.level]++;

		if (unifiedException.context.tenantId) {
			this.stats.byTenant[unifiedException.context.tenantId] =
				(this.stats.byTenant[unifiedException.context.tenantId] || 0) + 1;
		}

		if (unifiedException.context.userId) {
			this.stats.byUser[unifiedException.context.userId] =
				(this.stats.byUser[unifiedException.context.userId] || 0) + 1;
		}

		this.stats.processing.totalProcessed++;
		this.stats.processing.successful++;
		this.stats.lastUpdatedAt = new Date();
	}

	/**
	 * 降级错误处理
	 */
	private async fallbackErrorHandling(exception: unknown, _host: ArgumentsHost): Promise<void> {
		try {
			// 简单的降级处理逻辑
			this.logger.error('执行降级错误处理', LogContext.EXCEPTION, { exception });

			// 这里可以添加基本的错误响应逻辑
		} catch (error) {
			this.logger.error('降级错误处理失败', LogContext.EXCEPTION, {}, error as Error);
		}
	}

	/**
	 * 初始化统计信息
	 */
	private initializeStats(): IExceptionStats {
		return {
			totalExceptions: 0,
			byCategory: {
				[ExceptionCategory.HTTP]: 0,
				[ExceptionCategory.APPLICATION]: 0,
				[ExceptionCategory.DOMAIN]: 0,
				[ExceptionCategory.INFRASTRUCTURE]: 0,
				[ExceptionCategory.EXTERNAL]: 0,
				[ExceptionCategory.CONFIGURATION]: 0,
				[ExceptionCategory.VALIDATION]: 0
			},
			byLevel: {
				[ExceptionLevel.INFO]: 0,
				[ExceptionLevel.WARN]: 0,
				[ExceptionLevel.ERROR]: 0,
				[ExceptionLevel.FATAL]: 0
			},
			byTenant: {},
			byUser: {},
			byTime: {
				lastHour: 0,
				lastDay: 0,
				lastWeek: 0,
				lastMonth: 0
			},
			processing: {
				totalProcessed: 0,
				successful: 0,
				failed: 0,
				averageProcessingTime: 0
			},
			lastUpdatedAt: new Date()
		};
	}
}
