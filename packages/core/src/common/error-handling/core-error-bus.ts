/**
 * CoreErrorBus - 核心错误总线实现
 *
 * 提供了统一的错误处理机制，包括错误分类、处理、通知、恢复等功能。
 * 支持企业级的错误管理、监控、报告和恢复策略。
 *
 * ## 业务规则
 *
 * ### 错误处理规则
 * - 所有错误都应该通过错误总线进行统一处理
 * - 错误处理应该是异步的，不阻塞主业务流程
 * - 错误处理应该支持重试和恢复机制
 *
 * ### 错误分类规则
 * - 错误应该根据类型、严重级别、可恢复性等进行分类
 * - 分类应该支持自定义规则和策略
 * - 分类结果应该影响后续的处理策略
 *
 * ### 错误通知规则
 * - 严重错误应该立即通知相关人员
 * - 通知应该支持多种渠道（邮件、短信、Slack等）
 * - 通知应该避免重复和垃圾信息
 *
 * ### 错误恢复规则
 * - 可恢复的错误应该尝试自动恢复
 * - 恢复策略应该支持自定义和配置
 * - 恢复失败应该记录并升级处理
 *
 * ### 错误监控规则
 * - 错误应该被记录和监控
 * - 监控数据应该支持查询和分析
 * - 监控应该支持告警和阈值设置
 *
 * @description 核心错误总线实现类
 * @example
 * ```typescript
 * const errorBus = new CoreErrorBus();
 * await errorBus.start();
 *
 * // 发布错误
 * const errorInfo = await errorBus.publish(new Error('Something went wrong'), {
 *   tenantId: 'tenant-1',
 *   userId: 'user-123',
 *   requestId: 'req-456'
 * });
 *
 * // 订阅错误处理
 * errorBus.subscribe(new BusinessErrorHandler());
 *
 * await errorBus.stop();
 * ```
 *
 * @since 1.0.0
 */
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import { v4 as uuidv4 } from 'uuid';
import type { CoreConfigService } from '../../infrastructure/config/core-config.service';
import {
	IErrorBus,
	IErrorHandler,
	IErrorClassifier,
	IErrorNotifier,
	IErrorRecovery,
	IErrorInfo,
	IErrorContext,
	IErrorClassification,
	IErrorStatistics,
	IErrorConfiguration,
	ErrorType,
	ErrorSeverity
} from './error-handling.interface';

/**
 * 核心错误总线
 */
export class CoreErrorBus implements IErrorBus {
	constructor(private readonly logger: ILoggerService, private readonly configService?: CoreConfigService) {}
	private readonly handlers = new Map<string, IErrorHandler>();
	private readonly classifiers = new Map<string, IErrorClassifier>();
	private readonly notifiers = new Map<string, IErrorNotifier>();
	private readonly recoveries = new Map<string, IErrorRecovery>();
	private readonly errorQueue: IErrorInfo[] = [];
	private readonly statistics: IErrorStatistics = {
		totalErrors: 0,
		byType: {} as Record<ErrorType, number>,
		bySeverity: {} as Record<ErrorSeverity, number>,
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
		recovery: {
			totalAttempts: 0,
			successful: 0,
			failed: 0,
			successRate: 0
		},
		notifications: {
			totalSent: 0,
			successful: 0,
			failed: 0,
			successRate: 0
		},
		lastUpdatedAt: new Date()
	};
	private _isStarted = false;
	private _processingInterval?: ReturnType<typeof globalThis.setInterval>;
	private _configuration: IErrorConfiguration = {
		enabled: true,
		enableClassification: true,
		enableNotification: true,
		enableRecovery: true,
		enableMonitoring: true,
		processingTimeout: 30000, // 30 seconds
		maxRetries: 3,
		retryDelay: 1000, // 1 second
		retentionTime: 7 * 24 * 60 * 60 * 1000, // 7 days
		batchSize: 100,
		batchInterval: 5000 // 5 seconds
	};

	/**
	 * 发布错误
	 */
	public async publish(error: Error, context?: Partial<IErrorContext>): Promise<IErrorInfo> {
		if (!this._isStarted) {
			this.logger.warn('Error bus is not started, error will be logged only', LogContext.SYSTEM);
			this.logger.error('Unhandled error', LogContext.SYSTEM, {}, error);
			throw error;
		}

		const errorId = uuidv4();
		const errorContext: IErrorContext = {
			errorId,
			timestamp: new Date(),
			...context
		};

		// 创建错误信息
		const errorInfo: IErrorInfo = {
			classification: await this.classifyError(error, errorContext),
			context: errorContext,
			originalError: error,
			status: 'PENDING',
			processingHistory: [],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		// 添加到队列
		this.errorQueue.push(errorInfo);

		// 更新统计信息
		this.updateStatistics(errorInfo);

		this.logger.debug(`Published error: ${errorId}`, LogContext.SYSTEM, {
			errorId
		});
		return errorInfo;
	}

	/**
	 * 订阅错误处理
	 */
	public subscribe(handler: IErrorHandler): void {
		this.handlers.set(handler.name, handler);
		this.logger.debug(`Subscribed error handler: ${handler.name}`, LogContext.SYSTEM, { handlerName: handler.name });
	}

	/**
	 * 取消订阅错误处理
	 */
	public unsubscribe(handlerName: string): void {
		const removed = this.handlers.delete(handlerName);
		if (removed) {
			this.logger.debug(`Unsubscribed error handler: ${handlerName}`, LogContext.SYSTEM, { handlerName });
		}
	}

	/**
	 * 添加错误分类器
	 */
	public addClassifier(classifier: IErrorClassifier): void {
		this.classifiers.set(classifier.name, classifier);
		this.logger.debug(`Added error classifier: ${classifier.name}`, LogContext.SYSTEM, {
			classifierName: classifier.name
		});
	}

	/**
	 * 移除错误分类器
	 */
	public removeClassifier(classifierName: string): void {
		const removed = this.classifiers.delete(classifierName);
		if (removed) {
			this.logger.debug(`Removed error classifier: ${classifierName}`, LogContext.SYSTEM, { classifierName });
		}
	}

	/**
	 * 添加错误通知器
	 */
	public addNotifier(notifier: IErrorNotifier): void {
		this.notifiers.set(notifier.name, notifier);
		this.logger.debug(`Added error notifier: ${notifier.name}`, LogContext.SYSTEM, { notifierName: notifier.name });
	}

	/**
	 * 移除错误通知器
	 */
	public removeNotifier(notifierName: string): void {
		const removed = this.notifiers.delete(notifierName);
		if (removed) {
			this.logger.debug(`Removed error notifier: ${notifierName}`, LogContext.SYSTEM, { notifierName });
		}
	}

	/**
	 * 添加错误恢复器
	 */
	public addRecovery(recovery: IErrorRecovery): void {
		this.recoveries.set(recovery.name, recovery);
		this.logger.debug(`Added error recovery: ${recovery.name}`, LogContext.SYSTEM, { recoveryName: recovery.name });
	}

	/**
	 * 移除错误恢复器
	 */
	public removeRecovery(recoveryName: string): void {
		const removed = this.recoveries.delete(recoveryName);
		if (removed) {
			this.logger.debug(`Removed error recovery: ${recoveryName}`, LogContext.SYSTEM, { recoveryName });
		}
	}

	/**
	 * 获取错误统计信息
	 */
	public getStatistics(): IErrorStatistics {
		this.updateTimeStatistics();
		return { ...this.statistics };
	}

	/**
	 * 获取错误处理配置
	 *
	 * @description 从配置服务获取错误处理配置
	 *
	 * @returns 错误处理配置
	 */
	private async getErrorHandlingConfig(): Promise<{
		enabled: boolean;
		enableReporting: boolean;
		retry: {
			maxRetries: number;
			retryDelay: number;
			enableBackoff: boolean;
		};
	} | null> {
		if (!this.configService) {
			this.logger.warn('CoreErrorBus: 配置服务未设置，使用默认配置');
			return {
				enabled: true,
				enableReporting: true,
				retry: {
					maxRetries: 3,
					retryDelay: 1000,
					enableBackoff: true
				}
			};
		}

		try {
			const config = await this.configService.getErrorHandlingConfig();
			return {
				enabled: config.enabled,
				enableReporting: config.enableReporting,
				retry: {
					maxRetries: config.retry.maxRetries,
					retryDelay: config.retry.retryDelay,
					enableBackoff: config.retry.enableBackoff
				}
			};
		} catch (error) {
			console.error('获取错误处理配置失败:', error);
			return null;
		}
	}

	/**
	 * 检查错误处理是否启用
	 *
	 * @description 基于配置检查错误处理功能是否启用
	 *
	 * @returns 是否启用错误处理
	 */
	async isErrorHandlingEnabled(): Promise<boolean> {
		const config = await this.getErrorHandlingConfig();
		return config?.enabled ?? true;
	}

	/**
	 * 启动错误总线
	 */
	public async start(): Promise<void> {
		if (this._isStarted) {
			this.logger.warn('Error bus is already started');
			return;
		}

		// 加载错误处理配置
		const config = await this.getErrorHandlingConfig();

		if (config && !config.enabled) {
			this.logger.warn('错误处理功能已禁用，跳过启动');
			this._isStarted = true;
			return;
		}

		this.logger.info('✅ CoreErrorBus配置已加载', LogContext.SYSTEM, { config });

		this.logger.info('Starting error bus...', LogContext.SYSTEM);

		// 启动错误处理任务
		this._processingInterval = globalThis.setInterval(() => {
			this.processErrorQueue();
		}, this._configuration.batchInterval);

		this._isStarted = true;
		this.logger.info('Error bus started successfully', LogContext.SYSTEM);
	}

	/**
	 * 停止错误总线
	 */
	public async stop(): Promise<void> {
		if (!this._isStarted) {
			this.logger.warn('Error bus is not started');
			return;
		}

		this.logger.info('Stopping error bus...', LogContext.SYSTEM);

		// 停止错误处理任务
		if (this._processingInterval) {
			globalThis.clearInterval(this._processingInterval);
			this._processingInterval = undefined;
		}

		// 处理剩余的错误
		await this.processErrorQueue();

		this._isStarted = false;
		this.logger.info('Error bus stopped successfully', LogContext.SYSTEM);
	}

	/**
	 * 检查是否已启动
	 */
	public isStarted(): boolean {
		return this._isStarted;
	}

	/**
	 * 配置错误总线
	 */
	public configure(config: Partial<IErrorConfiguration>): void {
		this._configuration = { ...this._configuration, ...config };
		this.logger.debug('Error bus configuration updated', LogContext.SYSTEM);
	}

	/**
	 * 获取配置
	 */
	public getConfiguration(): IErrorConfiguration {
		return { ...this._configuration };
	}

	/**
	 * 分类错误
	 */
	private async classifyError(error: Error, context: IErrorContext): Promise<IErrorClassification> {
		if (!this._configuration.enableClassification) {
			return this.getDefaultClassification(error);
		}

		// 按优先级排序分类器
		const sortedClassifiers = Array.from(this.classifiers.values()).sort((a, b) => b.priority - a.priority);

		for (const classifier of sortedClassifiers) {
			if (classifier.shouldClassify(error, context)) {
				try {
					const classification = await classifier.classify(error, context);
					this.logger.debug(`Error classified by ${classifier.name}: ${classification.type}`, LogContext.SYSTEM, {
						classifierName: classifier.name,
						classificationType: classification.type
					});
					return classification;
				} catch (classificationError) {
					this.logger.warn(
						`Failed to classify error with ${classifier.name}: ${(classificationError as Error).message}`,
						LogContext.SYSTEM,
						{
							classifierName: classifier.name,
							error: (classificationError as Error).message
						}
					);
				}
			}
		}

		return this.getDefaultClassification(error);
	}

	/**
	 * 获取默认分类
	 */
	private getDefaultClassification(error: Error): IErrorClassification {
		return {
			type: ErrorType.UNKNOWN,
			severity: ErrorSeverity.MEDIUM,
			code: 'UNKNOWN_ERROR',
			message: error.message,
			description: 'Unknown error occurred',
			category: 'UNKNOWN',
			recoverable: false,
			retryable: false,
			tags: ['unknown'],
			metadata: {
				errorName: error.name,
				errorStack: error.stack
			}
		};
	}

	/**
	 * 处理错误队列
	 */
	private async processErrorQueue(): Promise<void> {
		if (this.errorQueue.length === 0) {
			return;
		}

		const batchSize = Math.min(this._configuration.batchSize, this.errorQueue.length);
		const batch = this.errorQueue.splice(0, batchSize);

		this.logger.debug(`Processing ${batch.length} errors`, LogContext.SYSTEM, {
			batchSize: batch.length
		});

		for (const errorInfo of batch) {
			try {
				await this.processError(errorInfo);
			} catch (processingError) {
				this.logger.error(
					`Failed to process error ${errorInfo.context.errorId}: ${(processingError as Error).message}`,
					LogContext.SYSTEM,
					{
						errorId: errorInfo.context.errorId,
						error: (processingError as Error).message
					},
					processingError as Error
				);
			}
		}
	}

	/**
	 * 处理单个错误
	 */
	private async processError(errorInfo: IErrorInfo): Promise<void> {
		errorInfo.status = 'PROCESSING';
		errorInfo.updatedAt = new Date();

		const startTime = Date.now();

		try {
			// 处理错误
			await this.handleError(errorInfo);

			// 发送通知
			if (this._configuration.enableNotification) {
				await this.notifyError(errorInfo);
			}

			// 尝试恢复
			if (this._configuration.enableRecovery) {
				await this.recoverError(errorInfo);
			}

			errorInfo.status = 'HANDLED';
			this.statistics.processing.successful++;

			const duration = Date.now() - startTime;
			this.updateAverageProcessingTime(duration);

			this.logger.debug(
				`Error ${errorInfo.context.errorId} processed successfully in ${duration}ms`,
				LogContext.SYSTEM,
				{ errorId: errorInfo.context.errorId, duration }
			);
		} catch (error) {
			errorInfo.status = 'FAILED';
			this.statistics.processing.failed++;

			this.logger.error(
				`Failed to process error ${errorInfo.context.errorId}: ${(error as Error).message}`,
				LogContext.SYSTEM,
				{ errorId: errorInfo.context.errorId, error: (error as Error).message },
				error as Error
			);
		} finally {
			errorInfo.updatedAt = new Date();
		}
	}

	/**
	 * 处理错误
	 */
	private async handleError(errorInfo: IErrorInfo): Promise<void> {
		// 按优先级排序处理器
		const sortedHandlers = Array.from(this.handlers.values()).sort((a, b) => b.priority - a.priority);

		for (const handler of sortedHandlers) {
			if (handler.shouldHandle(errorInfo)) {
				try {
					const step = await handler.handle(errorInfo);
					errorInfo.processingHistory.push(step);
					this.logger.debug(`Error handled by ${handler.name}: ${step.status}`, LogContext.SYSTEM, {
						handlerName: handler.name,
						status: step.status
					});
				} catch (handlerError) {
					this.logger.warn(
						`Error handler ${handler.name} failed: ${(handlerError as Error).message}`,
						LogContext.SYSTEM,
						{
							handlerName: handler.name,
							error: (handlerError as Error).message
						}
					);
				}
			}
		}
	}

	/**
	 * 通知错误
	 */
	private async notifyError(errorInfo: IErrorInfo): Promise<void> {
		// 按优先级排序通知器
		const sortedNotifiers = Array.from(this.notifiers.values()).sort((a, b) => b.priority - a.priority);

		for (const notifier of sortedNotifiers) {
			if (notifier.shouldNotify(errorInfo)) {
				try {
					const step = await notifier.notify(errorInfo);
					errorInfo.processingHistory.push(step);
					this.statistics.notifications.totalSent++;
					if (step.status === 'SUCCESS') {
						this.statistics.notifications.successful++;
					} else {
						this.statistics.notifications.failed++;
					}
					this.logger.debug(`Error notification sent by ${notifier.name}: ${step.status}`, LogContext.SYSTEM, {
						notifierName: notifier.name,
						status: step.status
					});
				} catch (notificationError) {
					this.statistics.notifications.failed++;
					this.logger.warn(
						`Error notification ${notifier.name} failed: ${(notificationError as Error).message}`,
						LogContext.SYSTEM,
						{
							notifierName: notifier.name,
							error: (notificationError as Error).message
						}
					);
				}
			}
		}
	}

	/**
	 * 恢复错误
	 */
	private async recoverError(errorInfo: IErrorInfo): Promise<void> {
		if (!errorInfo.classification.recoverable) {
			return;
		}

		// 按优先级排序恢复器
		const sortedRecoveries = Array.from(this.recoveries.values()).sort((a, b) => b.priority - a.priority);

		for (const recovery of sortedRecoveries) {
			if (recovery.canRecover(errorInfo)) {
				try {
					const step = await recovery.recover(errorInfo);
					errorInfo.processingHistory.push(step);
					this.statistics.recovery.totalAttempts++;
					if (step.status === 'SUCCESS') {
						this.statistics.recovery.successful++;
					} else {
						this.statistics.recovery.failed++;
					}
					this.logger.debug(`Error recovery attempted by ${recovery.name}: ${step.status}`, LogContext.SYSTEM, {
						recoveryName: recovery.name,
						status: step.status
					});
				} catch (recoveryError) {
					this.statistics.recovery.failed++;
					this.logger.warn(
						`Error recovery ${recovery.name} failed: ${(recoveryError as Error).message}`,
						LogContext.SYSTEM,
						{
							recoveryName: recovery.name,
							error: (recoveryError as Error).message
						}
					);
				}
			}
		}
	}

	/**
	 * 更新统计信息
	 */
	private updateStatistics(errorInfo: IErrorInfo): void {
		this.statistics.totalErrors++;
		this.statistics.processing.totalProcessed++;

		// 按类型统计
		const type = errorInfo.classification.type;
		this.statistics.byType[type] = (this.statistics.byType[type] || 0) + 1;

		// 按严重级别统计
		const severity = errorInfo.classification.severity;
		this.statistics.bySeverity[severity] = (this.statistics.bySeverity[severity] || 0) + 1;

		// 按租户统计
		if (errorInfo.context.tenantId) {
			const tenantId = errorInfo.context.tenantId;
			this.statistics.byTenant[tenantId] = (this.statistics.byTenant[tenantId] || 0) + 1;
		}

		// 按用户统计
		if (errorInfo.context.userId) {
			const userId = errorInfo.context.userId;
			this.statistics.byUser[userId] = (this.statistics.byUser[userId] || 0) + 1;
		}

		this.statistics.lastUpdatedAt = new Date();
	}

	/**
	 * 更新时间统计
	 */
	private updateTimeStatistics(): void {
		// 这里需要从错误队列或存储中统计时间范围内的错误
		// 暂时使用简单的实现
		this.statistics.byTime.lastHour = 0;
		this.statistics.byTime.lastDay = 0;
		this.statistics.byTime.lastWeek = 0;
		this.statistics.byTime.lastMonth = 0;
	}

	/**
	 * 更新平均处理时间
	 */
	private updateAverageProcessingTime(duration: number): void {
		const total = this.statistics.processing.successful;
		const current = this.statistics.processing.averageProcessingTime;
		this.statistics.processing.averageProcessingTime = (current * (total - 1) + duration) / total;
	}
}
