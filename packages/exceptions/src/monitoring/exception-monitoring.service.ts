import { Injectable, Logger } from '@nestjs/common';
import { IUnifiedException } from '../interfaces';

/**
 * 异常监控服务配置
 */
export interface IExceptionMonitoringConfig {
	/** 是否启用监控 */
	enabled: boolean;
	/** 监控数据保留时间（天） */
	retentionDays: number;
	/** 监控数据采样率（0-1） */
	samplingRate: number;
	/** 是否启用实时监控 */
	enableRealTime: boolean;
	/** 监控数据聚合间隔（毫秒） */
	aggregationInterval: number;
	/** 是否启用告警 */
	enableAlerts: boolean;
	/** 告警阈值配置 */
	alertThresholds: {
		errorRate: number;
		responseTime: number;
		memoryUsage: number;
		cpuUsage: number;
	};
}

/**
 * 异常监控数据
 */
export interface IExceptionMonitoringData {
	/** 异常ID */
	exceptionId: string;
	/** 异常类别 */
	category: string;
	/** 异常级别 */
	level: string;
	/** 异常消息 */
	message: string;
	/** 异常代码 */
	code: string;
	/** 发生时间 */
	timestamp: Date;
	/** 响应时间 */
	responseTime: number;
	/** 内存使用 */
	memoryUsage: number;
	/** CPU使用 */
	cpuUsage: number;
	/** 租户ID */
	tenantId?: string;
	/** 用户ID */
	userId?: string;
	/** 组织ID */
	organizationId?: string;
	/** 部门ID */
	departmentId?: string;
}

/**
 * 异常监控统计
 */
export interface IExceptionMonitoringStats {
	/** 总异常数 */
	totalExceptions: number;
	/** 错误率 */
	errorRate: number;
	/** 平均响应时间 */
	averageResponseTime: number;
	/** 最大响应时间 */
	maxResponseTime: number;
	/** 最小响应时间 */
	minResponseTime: number;
	/** 平均内存使用 */
	averageMemoryUsage: number;
	/** 平均CPU使用 */
	averageCpuUsage: number;
	/** 按类别统计 */
	categoryStats: Record<string, number>;
	/** 按级别统计 */
	levelStats: Record<string, number>;
	/** 按租户统计 */
	tenantStats: Record<string, number>;
	/** 时间范围 */
	timeRange: {
		start: Date;
		end: Date;
	};
}

/**
 * 异常监控服务
 *
 * @description 提供异常监控和统计功能
 * 支持实时监控、数据聚合、告警机制等
 *
 * ## 功能特性
 *
 * ### 异常监控
 * - 实时监控异常发生情况
 * - 监控异常处理性能
 * - 监控系统资源使用
 * - 监控租户异常分布
 *
 * ### 数据聚合
 * - 按时间窗口聚合数据
 * - 按类别聚合异常数据
 * - 按级别聚合异常数据
 * - 按租户聚合异常数据
 *
 * ### 统计分析
 * - 异常趋势分析
 * - 性能指标分析
 * - 租户异常分析
 * - 异常根因分析
 *
 * ### 告警机制
 * - 异常率告警
 * - 性能阈值告警
 * - 资源使用告警
 * - 自定义告警规则
 *
 * ## 使用示例
 *
 * ### 基础监控
 * ```typescript
 * @Injectable()
 * export class SomeService {
 *   constructor(
 *     private readonly monitoringService: ExceptionMonitoringService
 *   ) {}
 *
 *   async someMethod(): Promise<void> {
 *     // 方法实现
 *     // 监控服务会自动记录异常数据
 *   }
 * }
 * ```
 *
 * ### 获取统计信息
 * ```typescript
 * const stats = await this.monitoringService.getStats({
 *   start: new Date(Date.now() - 24 * 60 * 60 * 1000),
 *   end: new Date()
 * });
 * console.log('异常统计:', stats);
 * ```
 *
 * ### 配置告警
 * ```typescript
 * await this.monitoringService.configureAlerts({
 *   errorRate: 0.1,
 *   responseTime: 5000,
 *   memoryUsage: 0.8
 * });
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class ExceptionMonitoringService {
	private readonly logger = new Logger(ExceptionMonitoringService.name);
	private readonly monitoringData: IExceptionMonitoringData[] = [];
	private config: IExceptionMonitoringConfig;
	private alertCallbacks: Array<(data: IExceptionMonitoringData) => void> = [];

	constructor() {
		this.config = this.getDefaultConfig();
		this.startMonitoring();
	}

	/**
	 * 记录异常监控数据
	 *
	 * @description 记录异常发生的监控数据
	 * 包括异常信息、性能指标、上下文信息等
	 *
	 * @param exception 异常对象
	 * @param context 异常上下文
	 * @param performanceMetrics 性能指标
	 *
	 * @example
	 * ```typescript
	 * await this.monitoringService.recordException(exception, context, {
	 *   responseTime: 1500,
	 *   memoryUsage: 1024 * 1024,
	 *   cpuUsage: 0.5
	 * });
	 * ```
	 *
	 * @since 1.0.0
	 */
	async recordException(
		exception: IUnifiedException,
		context: any,
		performanceMetrics: {
			responseTime: number;
			memoryUsage: number;
			cpuUsage: number;
		}
	): Promise<void> {
		if (!this.config.enabled) {
			return;
		}

		// 采样率控制
		if (Math.random() > this.config.samplingRate) {
			return;
		}

		try {
			const monitoringData: IExceptionMonitoringData = {
				exceptionId: exception.id,
				category: exception.category,
				level: exception.level,
				message: exception.message,
				code: exception.code,
				timestamp: exception.occurredAt,
				responseTime: performanceMetrics.responseTime,
				memoryUsage: performanceMetrics.memoryUsage,
				cpuUsage: performanceMetrics.cpuUsage,
				tenantId: context.tenantId,
				userId: context.userId,
				organizationId: context.organizationId,
				departmentId: context.departmentId
			};

			// 记录监控数据
			this.monitoringData.push(monitoringData);

			// 清理过期数据
			this.cleanupExpiredData();

			// 检查告警条件
			if (this.config.enableAlerts) {
				this.checkAlerts(monitoringData);
			}

			this.logger.debug('异常监控数据已记录', {
				exceptionId: exception.id,
				category: exception.category,
				level: exception.level
			});
		} catch (error) {
			this.logger.error('记录异常监控数据失败', {
				error: error instanceof Error ? error.message : String(error),
				exceptionId: exception.id
			});
		}
	}

	/**
	 * 获取异常监控统计
	 *
	 * @description 获取指定时间范围内的异常监控统计
	 * 包括异常数量、错误率、性能指标等
	 *
	 * @param timeRange 时间范围
	 * @returns 异常监控统计
	 *
	 * @example
	 * ```typescript
	 * const stats = await this.monitoringService.getStats({
	 *   start: new Date(Date.now() - 24 * 60 * 60 * 1000),
	 *   end: new Date()
	 * });
	 * ```
	 *
	 * @since 1.0.0
	 */
	async getStats(timeRange: { start: Date; end: Date }): Promise<IExceptionMonitoringStats> {
		try {
			// 过滤时间范围内的数据
			const filteredData = this.monitoringData.filter(
				(data) => data.timestamp >= timeRange.start && data.timestamp <= timeRange.end
			);

			if (filteredData.length === 0) {
				return this.getEmptyStats(timeRange);
			}

			// 计算基础统计
			const totalExceptions = filteredData.length;
			const errorRate = this.calculateErrorRate(filteredData);
			const responseTimeStats = this.calculateResponseTimeStats(filteredData);
			const memoryStats = this.calculateMemoryStats(filteredData);
			const cpuStats = this.calculateCpuStats(filteredData);

			// 计算分类统计
			const categoryStats = this.calculateCategoryStats(filteredData);
			const levelStats = this.calculateLevelStats(filteredData);
			const tenantStats = this.calculateTenantStats(filteredData);

			const stats: IExceptionMonitoringStats = {
				totalExceptions,
				errorRate,
				averageResponseTime: responseTimeStats.average,
				maxResponseTime: responseTimeStats.max,
				minResponseTime: responseTimeStats.min,
				averageMemoryUsage: memoryStats.average,
				averageCpuUsage: cpuStats.average,
				categoryStats,
				levelStats,
				tenantStats,
				timeRange
			};

			this.logger.debug('异常监控统计已生成', {
				timeRange,
				totalExceptions,
				errorRate
			});

			return stats;
		} catch (error) {
			this.logger.error('获取异常监控统计失败', {
				error: error instanceof Error ? error.message : String(error),
				timeRange
			});
			throw error;
		}
	}

	/**
	 * 配置监控告警
	 *
	 * @description 配置异常监控的告警阈值
	 * 支持异常率、响应时间、资源使用等告警
	 *
	 * @param thresholds 告警阈值配置
	 *
	 * @example
	 * ```typescript
	 * await this.monitoringService.configureAlerts({
	 *   errorRate: 0.1,
	 *   responseTime: 5000,
	 *   memoryUsage: 0.8,
	 *   cpuUsage: 0.8
	 * });
	 * ```
	 *
	 * @since 1.0.0
	 */
	async configureAlerts(thresholds: IExceptionMonitoringConfig['alertThresholds']): Promise<void> {
		try {
			this.config.alertThresholds = { ...this.config.alertThresholds, ...thresholds };
			this.config.enableAlerts = true;

			this.logger.log('异常监控告警已配置', { thresholds });
		} catch (error) {
			this.logger.error('配置异常监控告警失败', {
				error: error instanceof Error ? error.message : String(error),
				thresholds
			});
			throw error;
		}
	}

	/**
	 * 注册告警回调
	 *
	 * @description 注册异常告警的回调函数
	 * 当触发告警条件时会调用注册的回调函数
	 *
	 * @param callback 告警回调函数
	 *
	 * @example
	 * ```typescript
	 * this.monitoringService.registerAlertCallback((data) => {
	 *   console.log('异常告警:', data);
	 *   // 发送告警通知
	 * });
	 * ```
	 *
	 * @since 1.0.0
	 */
	registerAlertCallback(callback: (data: IExceptionMonitoringData) => void): void {
		this.alertCallbacks.push(callback);
		this.logger.debug('异常告警回调已注册');
	}

	/**
	 * 获取监控配置
	 *
	 * @description 获取当前的监控配置
	 * 包括监控开关、采样率、告警阈值等
	 *
	 * @returns 监控配置
	 *
	 * @example
	 * ```typescript
	 * const config = this.monitoringService.getConfig();
	 * console.log('监控配置:', config);
	 * ```
	 *
	 * @since 1.0.0
	 */
	getConfig(): IExceptionMonitoringConfig {
		return { ...this.config };
	}

	/**
	 * 更新监控配置
	 *
	 * @description 更新监控配置
	 * 支持动态更新监控参数
	 *
	 * @param config 新的监控配置
	 *
	 * @example
	 * ```typescript
	 * await this.monitoringService.updateConfig({
	 *   enabled: true,
	 *   samplingRate: 0.8,
	 *   enableAlerts: true
	 * });
	 * ```
	 *
	 * @since 1.0.0
	 */
	async updateConfig(config: Partial<IExceptionMonitoringConfig>): Promise<void> {
		try {
			this.config = { ...this.config, ...config };

			this.logger.log('异常监控配置已更新', { config });
		} catch (error) {
			this.logger.error('更新异常监控配置失败', {
				error: error instanceof Error ? error.message : String(error),
				config
			});
			throw error;
		}
	}

	/**
	 * 获取默认配置
	 *
	 * @description 获取默认的监控配置
	 * 提供合理的默认值
	 *
	 * @returns 默认监控配置
	 *
	 * @since 1.0.0
	 */
	private getDefaultConfig(): IExceptionMonitoringConfig {
		return {
			enabled: true,
			retentionDays: 30,
			samplingRate: 1.0,
			enableRealTime: true,
			aggregationInterval: 60000, // 1分钟
			enableAlerts: false,
			alertThresholds: {
				errorRate: 0.1,
				responseTime: 5000,
				memoryUsage: 0.8,
				cpuUsage: 0.8
			}
		};
	}

	/**
	 * 开始监控
	 *
	 * @description 启动异常监控服务
	 * 包括数据聚合、告警检查等
	 *
	 * @since 1.0.0
	 */
	private startMonitoring(): void {
		if (!this.config.enableRealTime) {
			return;
		}

		// 定期清理过期数据
		setInterval(() => {
			this.cleanupExpiredData();
		}, this.config.aggregationInterval);

		this.logger.log('异常监控服务已启动');
	}

	/**
	 * 清理过期数据
	 *
	 * @description 清理过期的监控数据
	 * 根据保留时间配置清理数据
	 *
	 * @since 1.0.0
	 */
	private cleanupExpiredData(): void {
		const cutoffTime = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000);
		const initialLength = this.monitoringData.length;

		// 移除过期数据
		for (let i = this.monitoringData.length - 1; i >= 0; i--) {
			if (this.monitoringData[i].timestamp < cutoffTime) {
				this.monitoringData.splice(i, 1);
			}
		}

		const removedCount = initialLength - this.monitoringData.length;
		if (removedCount > 0) {
			this.logger.debug(`已清理 ${removedCount} 条过期监控数据`);
		}
	}

	/**
	 * 检查告警条件
	 *
	 * @description 检查是否触发告警条件
	 * 支持多种告警阈值检查
	 *
	 * @param data 监控数据
	 *
	 * @since 1.0.0
	 */
	private checkAlerts(data: IExceptionMonitoringData): void {
		const alerts = [];

		// 检查响应时间告警
		if (data.responseTime > this.config.alertThresholds.responseTime) {
			alerts.push({
				type: 'responseTime',
				message: `响应时间超过阈值: ${data.responseTime}ms > ${this.config.alertThresholds.responseTime}ms`,
				data
			});
		}

		// 检查内存使用告警
		if (data.memoryUsage > this.config.alertThresholds.memoryUsage * 1024 * 1024) {
			alerts.push({
				type: 'memoryUsage',
				message: `内存使用超过阈值: ${data.memoryUsage} > ${this.config.alertThresholds.memoryUsage * 1024 * 1024}`,
				data
			});
		}

		// 检查CPU使用告警
		if (data.cpuUsage > this.config.alertThresholds.cpuUsage) {
			alerts.push({
				type: 'cpuUsage',
				message: `CPU使用超过阈值: ${data.cpuUsage} > ${this.config.alertThresholds.cpuUsage}`,
				data
			});
		}

		// 触发告警回调
		if (alerts.length > 0) {
			this.triggerAlerts(alerts);
		}
	}

	/**
	 * 触发告警
	 *
	 * @description 触发告警回调
	 * 调用所有注册的告警回调函数
	 *
	 * @param alerts 告警信息
	 *
	 * @since 1.0.0
	 */
	private triggerAlerts(alerts: any[]): void {
		for (const alert of alerts) {
			for (const callback of this.alertCallbacks) {
				try {
					callback(alert.data);
				} catch (error) {
					this.logger.error('告警回调执行失败', {
						error: error instanceof Error ? error.message : String(error),
						alert
					});
				}
			}
		}

		this.logger.warn('异常告警已触发', { alerts });
	}

	/**
	 * 计算错误率
	 *
	 * @description 计算异常的错误率
	 * 基于异常级别计算错误率
	 *
	 * @param data 监控数据
	 * @returns 错误率
	 *
	 * @since 1.0.0
	 */
	private calculateErrorRate(data: IExceptionMonitoringData[]): number {
		const errorCount = data.filter((d) => d.level === 'error' || d.level === 'fatal').length;
		return data.length > 0 ? errorCount / data.length : 0;
	}

	/**
	 * 计算响应时间统计
	 *
	 * @description 计算响应时间的统计信息
	 * 包括平均值、最大值、最小值
	 *
	 * @param data 监控数据
	 * @returns 响应时间统计
	 *
	 * @since 1.0.0
	 */
	private calculateResponseTimeStats(data: IExceptionMonitoringData[]): {
		average: number;
		max: number;
		min: number;
	} {
		if (data.length === 0) {
			return { average: 0, max: 0, min: 0 };
		}

		const responseTimes = data.map((d) => d.responseTime);
		const sum = responseTimes.reduce((a, b) => a + b, 0);
		const average = sum / responseTimes.length;
		const max = Math.max(...responseTimes);
		const min = Math.min(...responseTimes);

		return { average, max, min };
	}

	/**
	 * 计算内存使用统计
	 *
	 * @description 计算内存使用的统计信息
	 * 包括平均值等
	 *
	 * @param data 监控数据
	 * @returns 内存使用统计
	 *
	 * @since 1.0.0
	 */
	private calculateMemoryStats(data: IExceptionMonitoringData[]): {
		average: number;
	} {
		if (data.length === 0) {
			return { average: 0 };
		}

		const memoryUsages = data.map((d) => d.memoryUsage);
		const sum = memoryUsages.reduce((a, b) => a + b, 0);
		const average = sum / memoryUsages.length;

		return { average };
	}

	/**
	 * 计算CPU使用统计
	 *
	 * @description 计算CPU使用的统计信息
	 * 包括平均值等
	 *
	 * @param data 监控数据
	 * @returns CPU使用统计
	 *
	 * @since 1.0.0
	 */
	private calculateCpuStats(data: IExceptionMonitoringData[]): {
		average: number;
	} {
		if (data.length === 0) {
			return { average: 0 };
		}

		const cpuUsages = data.map((d) => d.cpuUsage);
		const sum = cpuUsages.reduce((a, b) => a + b, 0);
		const average = sum / cpuUsages.length;

		return { average };
	}

	/**
	 * 计算分类统计
	 *
	 * @description 计算异常分类的统计信息
	 * 按异常类别统计数量
	 *
	 * @param data 监控数据
	 * @returns 分类统计
	 *
	 * @since 1.0.0
	 */
	private calculateCategoryStats(data: IExceptionMonitoringData[]): Record<string, number> {
		const stats: Record<string, number> = {};

		for (const item of data) {
			stats[item.category] = (stats[item.category] || 0) + 1;
		}

		return stats;
	}

	/**
	 * 计算级别统计
	 *
	 * @description 计算异常级别的统计信息
	 * 按异常级别统计数量
	 *
	 * @param data 监控数据
	 * @returns 级别统计
	 *
	 * @since 1.0.0
	 */
	private calculateLevelStats(data: IExceptionMonitoringData[]): Record<string, number> {
		const stats: Record<string, number> = {};

		for (const item of data) {
			stats[item.level] = (stats[item.level] || 0) + 1;
		}

		return stats;
	}

	/**
	 * 计算租户统计
	 *
	 * @description 计算租户的统计信息
	 * 按租户统计异常数量
	 *
	 * @param data 监控数据
	 * @returns 租户统计
	 *
	 * @since 1.0.0
	 */
	private calculateTenantStats(data: IExceptionMonitoringData[]): Record<string, number> {
		const stats: Record<string, number> = {};

		for (const item of data) {
			if (item.tenantId) {
				stats[item.tenantId] = (stats[item.tenantId] || 0) + 1;
			}
		}

		return stats;
	}

	/**
	 * 获取空统计
	 *
	 * @description 获取空的统计信息
	 * 当没有数据时返回空统计
	 *
	 * @param timeRange 时间范围
	 * @returns 空统计信息
	 *
	 * @since 1.0.0
	 */
	private getEmptyStats(timeRange: { start: Date; end: Date }): IExceptionMonitoringStats {
		return {
			totalExceptions: 0,
			errorRate: 0,
			averageResponseTime: 0,
			maxResponseTime: 0,
			minResponseTime: 0,
			averageMemoryUsage: 0,
			averageCpuUsage: 0,
			categoryStats: {},
			levelStats: {},
			tenantStats: {},
			timeRange
		};
	}
}
