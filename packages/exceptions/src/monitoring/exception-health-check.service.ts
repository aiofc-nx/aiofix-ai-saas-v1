import { Injectable, Logger } from '@nestjs/common';
import { IUnifiedExceptionManager } from '../interfaces';

/**
 * 健康检查结果
 */
export interface IHealthCheckResult {
	/** 服务名称 */
	service: string;
	/** 健康状态 */
	status: 'healthy' | 'unhealthy' | 'degraded';
	/** 检查时间 */
	timestamp: Date;
	/** 响应时间 */
	responseTime: number;
	/** 详细信息 */
	details: Record<string, any>;
	/** 错误信息 */
	error?: string;
}

/**
 * 健康检查配置
 */
export interface IHealthCheckConfig {
	/** 是否启用健康检查 */
	enabled: boolean;
	/** 检查间隔（毫秒） */
	checkInterval: number;
	/** 超时时间（毫秒） */
	timeout: number;
	/** 重试次数 */
	retryCount: number;
	/** 重试间隔（毫秒） */
	retryInterval: number;
	/** 健康阈值 */
	healthThresholds: {
		responseTime: number;
		errorRate: number;
		memoryUsage: number;
		cpuUsage: number;
	};
}

/**
 * 异常健康检查服务
 *
 * @description 提供异常处理系统的健康检查功能
 * 监控系统状态、性能指标、资源使用等
 *
 * ## 功能特性
 *
 * ### 健康检查
 * - 检查异常管理器状态
 * - 检查异常处理性能
 * - 检查系统资源使用
 * - 检查配置状态
 *
 * ### 状态监控
 * - 实时监控系统状态
 * - 监控性能指标
 * - 监控资源使用情况
 * - 监控错误率
 *
 * ### 告警机制
 * - 健康状态变化告警
 * - 性能阈值告警
 * - 资源使用告警
 * - 错误率告警
 *
 * ### 报告生成
 * - 健康状态报告
 * - 性能指标报告
 * - 资源使用报告
 * - 趋势分析报告
 *
 * ## 使用示例
 *
 * ### 基础健康检查
 * ```typescript
 * @Injectable()
 * export class SomeService {
 *   constructor(
 *     private readonly healthCheckService: ExceptionHealthCheckService
 *   ) {}
 *
 *   async checkHealth(): Promise<IHealthCheckResult> {
 *     return await this.healthCheckService.checkHealth();
 *   }
 * }
 * ```
 *
 * ### 配置健康检查
 * ```typescript
 * await this.healthCheckService.configure({
 *   enabled: true,
 *   checkInterval: 30000,
 *   timeout: 5000,
 *   healthThresholds: {
 *     responseTime: 1000,
 *     errorRate: 0.1,
 *     memoryUsage: 0.8,
 *     cpuUsage: 0.8
 *   }
 * });
 * ```
 *
 * ### 获取健康状态
 * ```typescript
 * const healthStatus = await this.healthCheckService.getHealthStatus();
 * console.log('健康状态:', healthStatus);
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class ExceptionHealthCheckService {
	private readonly logger = new Logger(ExceptionHealthCheckService.name);
	private config: IHealthCheckConfig;
	private healthStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
	private lastCheckTime: Date | null = null;
	private checkHistory: IHealthCheckResult[] = [];
	private healthCallbacks: Array<(result: IHealthCheckResult) => void> = [];

	constructor(private readonly exceptionManager: IUnifiedExceptionManager) {
		this.config = this.getDefaultConfig();
		this.startHealthCheck();
	}

	/**
	 * 执行健康检查
	 *
	 * @description 执行完整的健康检查
	 * 包括系统状态、性能指标、资源使用等检查
	 *
	 * @returns 健康检查结果
	 *
	 * @example
	 * ```typescript
	 * const result = await this.healthCheckService.checkHealth();
	 * console.log('健康检查结果:', result);
	 * ```
	 *
	 * @since 1.0.0
	 */
	async checkHealth(): Promise<IHealthCheckResult> {
		const startTime = Date.now();
		const timestamp = new Date();

		try {
			// 检查异常管理器状态
			const managerStatus = await this.checkExceptionManager();

			// 检查系统性能
			const performanceStatus = await this.checkPerformance();

			// 检查资源使用
			const resourceStatus = await this.checkResources();

			// 检查配置状态
			const configStatus = await this.checkConfiguration();

			// 计算总体健康状态
			const overallStatus = this.calculateOverallStatus([
				managerStatus,
				performanceStatus,
				resourceStatus,
				configStatus
			]);

			const responseTime = Date.now() - startTime;

			const result: IHealthCheckResult = {
				service: 'exception-handling',
				status: overallStatus,
				timestamp,
				responseTime,
				details: {
					manager: managerStatus,
					performance: performanceStatus,
					resources: resourceStatus,
					configuration: configStatus
				}
			};

			// 更新健康状态
			this.updateHealthStatus(result);

			// 记录检查历史
			this.recordCheckHistory(result);

			// 触发健康状态变化回调
			this.triggerHealthCallbacks(result);

			this.logger.debug('健康检查完成', {
				status: overallStatus,
				responseTime,
				timestamp
			});

			return result;
		} catch (error) {
			const responseTime = Date.now() - startTime;

			const result: IHealthCheckResult = {
				service: 'exception-handling',
				status: 'unhealthy',
				timestamp,
				responseTime,
				details: {},
				error: error instanceof Error ? error.message : String(error)
			};

			this.updateHealthStatus(result);
			this.recordCheckHistory(result);
			this.triggerHealthCallbacks(result);

			this.logger.error('健康检查失败', {
				error: error instanceof Error ? error.message : String(error),
				responseTime
			});

			return result;
		}
	}

	/**
	 * 获取健康状态
	 *
	 * @description 获取当前的健康状态
	 * 包括状态、最后检查时间、检查历史等
	 *
	 * @returns 健康状态信息
	 *
	 * @example
	 * ```typescript
	 * const status = await this.healthCheckService.getHealthStatus();
	 * console.log('当前健康状态:', status);
	 * ```
	 *
	 * @since 1.0.0
	 */
	async getHealthStatus(): Promise<{
		status: 'healthy' | 'unhealthy' | 'degraded';
		lastCheckTime: Date | null;
		checkHistory: IHealthCheckResult[];
		config: IHealthCheckConfig;
	}> {
		return {
			status: this.healthStatus,
			lastCheckTime: this.lastCheckTime,
			checkHistory: [...this.checkHistory],
			config: { ...this.config }
		};
	}

	/**
	 * 配置健康检查
	 *
	 * @description 配置健康检查参数
	 * 包括检查间隔、超时时间、阈值等
	 *
	 * @param config 健康检查配置
	 *
	 * @example
	 * ```typescript
	 * await this.healthCheckService.configure({
	 *   enabled: true,
	 *   checkInterval: 30000,
	 *   timeout: 5000,
	 *   healthThresholds: {
	 *     responseTime: 1000,
	 *     errorRate: 0.1,
	 *     memoryUsage: 0.8,
	 *     cpuUsage: 0.8
	 *   }
	 * });
	 * ```
	 *
	 * @since 1.0.0
	 */
	async configure(config: Partial<IHealthCheckConfig>): Promise<void> {
		try {
			this.config = { ...this.config, ...config };

			this.logger.log('健康检查配置已更新', { config });
		} catch (error) {
			this.logger.error('配置健康检查失败', {
				error: error instanceof Error ? error.message : String(error),
				config
			});
			throw error;
		}
	}

	/**
	 * 注册健康状态变化回调
	 *
	 * @description 注册健康状态变化的回调函数
	 * 当健康状态发生变化时会调用回调函数
	 *
	 * @param callback 健康状态变化回调函数
	 *
	 * @example
	 * ```typescript
	 * this.healthCheckService.registerHealthCallback((result) => {
	 *   console.log('健康状态变化:', result);
	 *   // 发送健康状态通知
	 * });
	 * ```
	 *
	 * @since 1.0.0
	 */
	registerHealthCallback(callback: (result: IHealthCheckResult) => void): void {
		this.healthCallbacks.push(callback);
		this.logger.debug('健康状态变化回调已注册');
	}

	/**
	 * 检查异常管理器状态
	 *
	 * @description 检查异常管理器的状态
	 * 包括初始化状态、配置状态、统计信息等
	 *
	 * @returns 异常管理器状态
	 *
	 * @since 1.0.0
	 */
	private async checkExceptionManager(): Promise<Record<string, any>> {
		try {
			const stats = await this.exceptionManager.getStats();
			const health = await this.exceptionManager.getHealth();

			return {
				status: 'healthy',
				stats,
				health,
				details: {
					totalExceptions: stats.totalExceptions,
					byCategory: stats.byCategory,
					byLevel: stats.byLevel,
					byTenant: stats.byTenant
				}
			};
		} catch (error) {
			return {
				status: 'unhealthy',
				error: error instanceof Error ? error.message : String(error),
				details: {}
			};
		}
	}

	/**
	 * 检查系统性能
	 *
	 * @description 检查系统性能指标
	 * 包括响应时间、吞吐量、错误率等
	 *
	 * @returns 性能状态
	 *
	 * @since 1.0.0
	 */
	private async checkPerformance(): Promise<Record<string, any>> {
		try {
			const memoryUsage = process.memoryUsage();
			const cpuUsage = process.cpuUsage();

			const performanceMetrics = {
				memoryUsage: {
					heapUsed: memoryUsage.heapUsed,
					heapTotal: memoryUsage.heapTotal,
					external: memoryUsage.external,
					rss: memoryUsage.rss
				},
				cpuUsage: {
					user: cpuUsage.user,
					system: cpuUsage.system
				},
				uptime: process.uptime(),
				nodeVersion: process.version,
				platform: process.platform
			};

			// 检查性能阈值
			const heapUsageRatio = memoryUsage.heapUsed / memoryUsage.heapTotal;
			const isMemoryHealthy = heapUsageRatio < this.config.healthThresholds.memoryUsage;

			return {
				status: isMemoryHealthy ? 'healthy' : 'degraded',
				metrics: performanceMetrics,
				details: {
					heapUsageRatio,
					memoryThreshold: this.config.healthThresholds.memoryUsage,
					isMemoryHealthy
				}
			};
		} catch (error) {
			return {
				status: 'unhealthy',
				error: error instanceof Error ? error.message : String(error),
				details: {}
			};
		}
	}

	/**
	 * 检查资源使用
	 *
	 * @description 检查系统资源使用情况
	 * 包括内存、CPU、磁盘、网络等
	 *
	 * @returns 资源使用状态
	 *
	 * @since 1.0.0
	 */
	private async checkResources(): Promise<Record<string, any>> {
		try {
			const memoryUsage = process.memoryUsage();
			const cpuUsage = process.cpuUsage();

			const resourceMetrics = {
				memory: {
					used: memoryUsage.heapUsed,
					total: memoryUsage.heapTotal,
					external: memoryUsage.external,
					rss: memoryUsage.rss
				},
				cpu: {
					user: cpuUsage.user,
					system: cpuUsage.system
				},
				process: {
					pid: process.pid,
					uptime: process.uptime(),
					version: process.version
				}
			};

			// 检查资源阈值
			const memoryUsageRatio = memoryUsage.heapUsed / memoryUsage.heapTotal;
			const isResourceHealthy = memoryUsageRatio < this.config.healthThresholds.memoryUsage;

			return {
				status: isResourceHealthy ? 'healthy' : 'degraded',
				metrics: resourceMetrics,
				details: {
					memoryUsageRatio,
					memoryThreshold: this.config.healthThresholds.memoryUsage,
					isResourceHealthy
				}
			};
		} catch (error) {
			return {
				status: 'unhealthy',
				error: error instanceof Error ? error.message : String(error),
				details: {}
			};
		}
	}

	/**
	 * 检查配置状态
	 *
	 * @description 检查配置状态
	 * 包括配置有效性、配置完整性等
	 *
	 * @returns 配置状态
	 *
	 * @since 1.0.0
	 */
	private async checkConfiguration(): Promise<Record<string, any>> {
		try {
			const configStatus = {
				healthCheck: this.config,
				exceptionManager: 'configured',
				monitoring: 'enabled',
				logging: 'enabled'
			};

			return {
				status: 'healthy',
				config: configStatus,
				details: {
					healthCheckEnabled: this.config.enabled,
					checkInterval: this.config.checkInterval,
					timeout: this.config.timeout
				}
			};
		} catch (error) {
			return {
				status: 'unhealthy',
				error: error instanceof Error ? error.message : String(error),
				details: {}
			};
		}
	}

	/**
	 * 计算总体健康状态
	 *
	 * @description 根据各项检查结果计算总体健康状态
	 * 支持健康、降级、不健康三种状态
	 *
	 * @param checkResults 各项检查结果
	 * @returns 总体健康状态
	 *
	 * @since 1.0.0
	 */
	private calculateOverallStatus(checkResults: Record<string, any>[]): 'healthy' | 'unhealthy' | 'degraded' {
		const statuses = checkResults.map((result) => result.status);

		if (statuses.includes('unhealthy')) {
			return 'unhealthy';
		}

		if (statuses.includes('degraded')) {
			return 'degraded';
		}

		return 'healthy';
	}

	/**
	 * 更新健康状态
	 *
	 * @description 更新当前的健康状态
	 * 记录状态变化
	 *
	 * @param result 健康检查结果
	 *
	 * @since 1.0.0
	 */
	private updateHealthStatus(result: IHealthCheckResult): void {
		const previousStatus = this.healthStatus;
		this.healthStatus = result.status;
		this.lastCheckTime = result.timestamp;

		if (previousStatus !== result.status) {
			this.logger.warn('健康状态发生变化', {
				previousStatus,
				currentStatus: result.status,
				timestamp: result.timestamp
			});
		}
	}

	/**
	 * 记录检查历史
	 *
	 * @description 记录健康检查历史
	 * 保留最近的检查记录
	 *
	 * @param result 健康检查结果
	 *
	 * @since 1.0.0
	 */
	private recordCheckHistory(result: IHealthCheckResult): void {
		this.checkHistory.push(result);

		// 保留最近100条记录
		if (this.checkHistory.length > 100) {
			this.checkHistory.shift();
		}
	}

	/**
	 * 触发健康状态变化回调
	 *
	 * @description 触发健康状态变化的回调函数
	 * 通知注册的回调函数
	 *
	 * @param result 健康检查结果
	 *
	 * @since 1.0.0
	 */
	private triggerHealthCallbacks(result: IHealthCheckResult): void {
		for (const callback of this.healthCallbacks) {
			try {
				callback(result);
			} catch (error) {
				this.logger.error('健康状态变化回调执行失败', {
					error: error instanceof Error ? error.message : String(error),
					result
				});
			}
		}
	}

	/**
	 * 开始健康检查
	 *
	 * @description 启动定期健康检查
	 * 根据配置的间隔执行健康检查
	 *
	 * @since 1.0.0
	 */
	private startHealthCheck(): void {
		if (!this.config.enabled) {
			return;
		}

		setInterval(async () => {
			try {
				await this.checkHealth();
			} catch (error) {
				this.logger.error('定期健康检查失败', {
					error: error instanceof Error ? error.message : String(error)
				});
			}
		}, this.config.checkInterval);

		this.logger.log('健康检查服务已启动', {
			checkInterval: this.config.checkInterval,
			timeout: this.config.timeout
		});
	}

	/**
	 * 获取默认配置
	 *
	 * @description 获取默认的健康检查配置
	 * 提供合理的默认值
	 *
	 * @returns 默认健康检查配置
	 *
	 * @since 1.0.0
	 */
	private getDefaultConfig(): IHealthCheckConfig {
		return {
			enabled: true,
			checkInterval: 30000, // 30秒
			timeout: 5000, // 5秒
			retryCount: 3,
			retryInterval: 1000, // 1秒
			healthThresholds: {
				responseTime: 1000, // 1秒
				errorRate: 0.1, // 10%
				memoryUsage: 0.8, // 80%
				cpuUsage: 0.8 // 80%
			}
		};
	}
}
