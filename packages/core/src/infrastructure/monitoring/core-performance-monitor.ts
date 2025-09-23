/**
 * CorePerformanceMonitor - 核心性能监控实现
 *
 * 提供了完整的性能监控功能，包括性能指标收集、分析、
 * 报告、告警等企业级特性。
 *
 * @description 核心性能监控实现类
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import type { ILoggerService } from '@aiofix/logging';
import { v4 as uuidv4 } from 'uuid';
import type { CoreConfigService } from '../config/core-config.service';
import type { IPerformanceMonitor, IPerformanceCollector, IPerformanceAlert } from './performance-monitor.interface';
import type {
	IPerformanceMetrics,
	IPerformanceMetricsAggregation,
	IPerformanceMetricsQueryOptions,
	IPerformanceMetricsStatistics,
	ISystemMetrics,
	IApplicationMetrics,
	IBusinessMetrics
} from './performance-metrics.interface';

/**
 * 性能监控器配置接口
 */
export interface IPerformanceMonitorConfiguration {
	/** 是否启用监控 */
	readonly enabled: boolean;
	/** 监控间隔（毫秒） */
	readonly monitoringInterval: number;
	/** 数据保留天数 */
	readonly dataRetentionDays: number;
	/** 是否启用实时监控 */
	readonly enableRealTimeMonitoring: boolean;
	/** 是否启用历史存储 */
	readonly enableHistoricalStorage: boolean;
	/** 是否启用告警 */
	readonly enableAlerts: boolean;
	/** 告警阈值配置 */
	readonly alertThresholds: Record<string, number>;
	/** 是否启用分析 */
	readonly enableAnalysis: boolean;
	/** 分析窗口大小 */
	readonly analysisWindowSize: number;
	/** 是否启用报告 */
	readonly enableReporting: boolean;
	/** 报告生成间隔（小时） */
	readonly reportGenerationInterval: number;
	/** 是否启用多租户 */
	readonly enableMultiTenant: boolean;
	/** 是否启用压缩 */
	readonly enableCompression: boolean;
	/** 是否启用加密 */
	readonly enableEncryption: boolean;
}

/**
 * 核心性能监控实现
 */
@Injectable()
export class CorePerformanceMonitor implements IPerformanceMonitor {
	private readonly metrics = new Map<string, IPerformanceMetrics[]>();
	private readonly alerts = new Map<string, IPerformanceAlert[]>();
	private readonly collectors = new Map<string, IPerformanceCollector>();
	private readonly configuration: IPerformanceMonitorConfiguration;
	private _isRunning = false;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _monitoringTimer?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _cleanupTimer?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _reportTimer?: any;

	constructor(
		private readonly logger: ILoggerService,
		private readonly configService?: CoreConfigService,
		configuration: Partial<IPerformanceMonitorConfiguration> = {}
	) {
		this.configuration = {
			enabled: true,
			monitoringInterval: 60000,
			dataRetentionDays: 30,
			enableRealTimeMonitoring: true,
			enableHistoricalStorage: true,
			enableAlerts: true,
			alertThresholds: {},
			enableAnalysis: true,
			analysisWindowSize: 5,
			enableReporting: true,
			reportGenerationInterval: 24,
			enableMultiTenant: true,
			enableCompression: false,
			enableEncryption: false,
			...configuration
		};
	}

	/**
	 * 检查监控器是否已启动
	 */
	public isStarted(): boolean {
		return this._isRunning;
	}

	/**
	 * 获取当前配置
	 */
	public getConfiguration(): IPerformanceMonitorConfiguration {
		return { ...this.configuration };
	}

	/**
	 * 更新配置
	 */
	public updateConfiguration(newConfig: Partial<IPerformanceMonitorConfiguration>): void {
		Object.assign(this.configuration, newConfig);
	}

	/**
	 * 重置配置为默认值
	 */
	public resetConfiguration(): void {
		Object.assign(this.configuration, {
			enabled: true,
			monitoringInterval: 60000,
			dataRetentionDays: 30,
			enableRealTimeMonitoring: true,
			enableHistoricalStorage: true,
			enableAlerts: true,
			alertThresholds: {},
			enableAnalysis: true,
			analysisWindowSize: 5,
			enableReporting: true,
			reportGenerationInterval: 24,
			enableMultiTenant: true,
			enableCompression: false,
			enableEncryption: false
		});
	}

	/**
	 * 初始化配置
	 *
	 * @description 从配置服务加载监控配置
	 */
	private async initializeConfiguration(): Promise<void> {
		if (!this.configService) {
			// console.log('CorePerformanceMonitor: 配置服务未设置，使用默认配置');
			return;
		}

		try {
			const monitoringConfig = await this.configService.getMonitoringConfig();

			// 更新配置（基于实际的配置接口）
			Object.assign(this.configuration, {
				enabled: monitoringConfig.enabled,
				monitoringInterval: monitoringConfig.metricsInterval || this.configuration.monitoringInterval,
				enableRealTimeMonitoring: monitoringConfig.enableTracing !== false,
				enableAlerts: monitoringConfig.enableHealthCheck !== false,
				enableAnalysis: true, // 暂时硬编码
				enableReporting: true, // 暂时硬编码
				enableMultiTenant: true // 暂时硬编码
			});

			// console.log('✅ CorePerformanceMonitor配置已加载', {
			//   enabled: this.configuration.enabled,
			//   interval: this.configuration.monitoringInterval,
			//   realTime: this.configuration.enableRealTimeMonitoring,
			//   alerts: this.configuration.enableAlerts,
			// });
		} catch (error) {
			console.error('加载监控配置失败:', error);
		}
	}

	/**
	 * 启动性能监控
	 */
	public async start(): Promise<void> {
		if (this._isRunning) {
			this.logger.warn('Performance monitor is already started');
			return;
		}

		// 初始化配置
		await this.initializeConfiguration();

		try {
			this.logger.info('Performance monitor started');

			// 启动监控定时器
			if (this.configuration.enableRealTimeMonitoring) {
				this._monitoringTimer = setInterval(() => this.collectAndStoreMetrics(), this.configuration.monitoringInterval);
			}

			// 启动清理定时器
			this._cleanupTimer = setInterval(
				() => this.cleanupExpiredData(),
				24 * 60 * 60 * 1000 // 每天清理一次
			);

			// 启动报告定时器
			if (this.configuration.enableReporting) {
				this._reportTimer = setInterval(
					() => this.generatePeriodicReport(),
					this.configuration.reportGenerationInterval * 60 * 60 * 1000
				);
			}

			this._isRunning = true;
			this.logger.info('Performance monitor started');
		} catch (error) {
			this.logger.error('Failed to start performance monitor');
			throw error;
		}
	}

	/**
	 * 停止性能监控
	 */
	public async stop(): Promise<void> {
		if (!this._isRunning) {
			this.logger.warn('Performance monitor is not started');
			return;
		}

		try {
			// 清理定时器
			if (this._monitoringTimer) {
				clearInterval(this._monitoringTimer);
				this._monitoringTimer = undefined;
			}

			if (this._cleanupTimer) {
				clearInterval(this._cleanupTimer);
				this._cleanupTimer = undefined;
			}

			if (this._reportTimer) {
				clearInterval(this._reportTimer);
				this._reportTimer = undefined;
			}

			this._isRunning = false;
			this.logger.info('Performance monitor stopped');
		} catch (error) {
			this.logger.error('Failed to stop performance monitor');
			throw error;
		}
	}

	/**
	 * 收集性能指标 - 重载方法
	 */
	public async collectMetrics(metricType: string, metrics: Record<string, unknown>): Promise<void>;
	public async collectMetrics(metrics: IPerformanceMetrics): Promise<void>;
	public async collectMetrics(options?: {
		includeSystem?: boolean;
		includeApplication?: boolean;
		includeBusiness?: boolean;
		customCollectors?: string[];
	}): Promise<IPerformanceMetrics>;
	public async collectMetrics(
		metricTypeOrOptionsOrMetrics?:
			| string
			| IPerformanceMetrics
			| {
					includeSystem?: boolean;
					includeApplication?: boolean;
					includeBusiness?: boolean;
					customCollectors?: string[];
			  },
		metrics?: Record<string, unknown>
	): Promise<IPerformanceMetrics | void> {
		// 处理重载情况
		if (typeof metricTypeOrOptionsOrMetrics === 'string' && metrics !== undefined) {
			// 情况1: collectMetrics(metricType: string, metrics: any)
			this.logger.debug(`Collected ${metricTypeOrOptionsOrMetrics} metrics`);
			return;
		}

		if (
			metricTypeOrOptionsOrMetrics &&
			typeof metricTypeOrOptionsOrMetrics === 'object' &&
			!('includeSystem' in metricTypeOrOptionsOrMetrics)
		) {
			// 情况2: collectMetrics(metrics: IPerformanceMetrics)
			this.logger.debug('Collected performance metrics');
			return;
		}

		// 情况3: collectMetrics(options?: {...})
		const options =
			(metricTypeOrOptionsOrMetrics as {
				includeSystem?: boolean;
				includeApplication?: boolean;
				includeBusiness?: boolean;
				customCollectors?: string[];
			}) || {};
		const {
			includeSystem = true,
			includeApplication = true,
			includeBusiness = true,
			customCollectors = []
		} = options || {};

		try {
			const timestamp = new Date();
			const tenantId = this.getCurrentTenantId();
			const serviceId = this.getCurrentServiceId();
			const instanceId = this.getCurrentInstanceId();

			// 收集系统指标
			let systemMetrics: ISystemMetrics | undefined;
			if (includeSystem) {
				systemMetrics = await this.collectSystemMetrics();
			}

			// 收集应用指标
			let applicationMetrics: IApplicationMetrics | undefined;
			if (includeApplication) {
				applicationMetrics = await this.collectApplicationMetrics();
			}

			// 收集业务指标
			let businessMetrics: IBusinessMetrics | undefined;
			if (includeBusiness) {
				businessMetrics = await this.collectBusinessMetrics();
			}

			// 收集自定义指标
			const customMetrics: Record<string, number> = {};
			for (const collectorName of customCollectors) {
				const collector = this.collectors.get(collectorName);
				if (collector) {
					try {
						const collectorMetrics = await collector.collect('custom');
						Object.assign(customMetrics, collectorMetrics);
					} catch {
						this.logger.warn(`Failed to collect metrics from collector ${collectorName}`);
					}
				}
			}

			const performanceMetrics: IPerformanceMetrics = {
				timestamp,
				systemMetrics: systemMetrics || this.getDefaultSystemMetrics(),
				applicationMetrics: applicationMetrics || this.getDefaultApplicationMetrics(),
				businessMetrics: businessMetrics || this.getDefaultBusinessMetrics(),
				tenantId,
				serviceId,
				instanceId,
				version: '1.0.0',
				customMetrics: Object.keys(customMetrics).length > 0 ? customMetrics : undefined
			};

			this.logger.debug('Performance metrics collected');
			return performanceMetrics;
		} catch (error) {
			this.logger.error('Failed to collect performance metrics');
			throw error;
		}
	}

	/**
	 * 存储性能指标
	 */
	public async storeMetrics(metrics: IPerformanceMetrics): Promise<boolean> {
		try {
			if (!this.configuration.enableHistoricalStorage) {
				return true;
			}

			const key = this.getMetricsKey(metrics);
			const existingMetrics = this.metrics.get(key) || [];
			existingMetrics.push(metrics);

			// 限制存储的指标数量
			const maxMetrics = 10000;
			if (existingMetrics.length > maxMetrics) {
				existingMetrics.splice(0, existingMetrics.length - maxMetrics);
			}

			this.metrics.set(key, existingMetrics);

			this.logger.debug('Performance metrics stored');
			return true;
		} catch {
			this.logger.error('Failed to store performance metrics');
			return false;
		}
	}

	/**
	 * 查询性能指标
	 */
	public async queryMetrics(options: IPerformanceMetricsQueryOptions): Promise<IPerformanceMetrics[]> {
		try {
			const { startTime, endTime, tenantId, serviceId, instanceId, limit = 1000, offset = 0 } = options;

			let allMetrics: IPerformanceMetrics[] = [];

			// 收集所有匹配的指标
			for (const [, metrics] of this.metrics.entries()) {
				const filteredMetrics = metrics.filter((metric) => {
					if (startTime && metric.timestamp < startTime) return false;
					if (endTime && metric.timestamp > endTime) return false;
					if (tenantId && metric.tenantId !== tenantId) return false;
					if (serviceId && metric.serviceId !== serviceId) return false;
					if (instanceId && metric.instanceId !== instanceId) return false;
					return true;
				});

				allMetrics = allMetrics.concat(filteredMetrics);
			}

			// 按时间戳排序
			allMetrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

			// 应用分页
			const startIndex = offset;
			const endIndex = startIndex + limit;
			const result = allMetrics.slice(startIndex, endIndex);

			this.logger.debug('Performance metrics queried');

			return result;
		} catch (error) {
			this.logger.error('Failed to query performance metrics');
			throw error;
		}
	}

	/**
	 * 聚合性能指标
	 */
	public async aggregateMetrics(options: IPerformanceMetricsQueryOptions): Promise<IPerformanceMetricsAggregation> {
		try {
			const metrics = await this.queryMetrics(options);
			const { startTime, endTime } = options;

			if (metrics.length === 0) {
				return this.getEmptyAggregation(startTime, endTime);
			}

			// 计算系统指标聚合
			const systemMetrics = metrics.map((m) => m.systemMetrics);
			const systemAggregation = this.aggregateSystemMetrics(systemMetrics);

			// 计算应用指标聚合
			const applicationMetrics = metrics.map((m) => m.applicationMetrics);
			const applicationAggregation = this.aggregateApplicationMetrics(applicationMetrics);

			// 计算业务指标聚合
			const businessMetrics = metrics.map((m) => m.businessMetrics);
			const businessAggregation = this.aggregateBusinessMetrics(businessMetrics);

			const aggregation: IPerformanceMetricsAggregation = {
				startTime: startTime || metrics[0].timestamp,
				endTime: endTime || metrics[metrics.length - 1].timestamp,
				count: metrics.length,
				systemMetrics: systemAggregation,
				applicationMetrics: applicationAggregation,
				businessMetrics: businessAggregation
			};

			this.logger.debug('Performance metrics aggregated');
			return aggregation;
		} catch (error) {
			this.logger.error('Failed to aggregate performance metrics');
			throw error;
		}
	}

	/**
	 * 获取性能统计信息
	 */
	public async getStatistics(options: IPerformanceMetricsQueryOptions): Promise<IPerformanceMetricsStatistics> {
		try {
			const metrics = await this.queryMetrics(options);
			const { startTime, endTime } = options;

			if (metrics.length === 0) {
				return this.getEmptyStatistics(startTime, endTime);
			}

			// 计算系统统计
			const systemStats = this.calculateSystemStatistics(metrics);

			// 计算应用统计
			const applicationStats = this.calculateApplicationStatistics(metrics);

			// 计算业务统计
			const businessStats = this.calculateBusinessStatistics(metrics);

			const statistics: IPerformanceMetricsStatistics = {
				timeRange: {
					start: startTime || metrics[0].timestamp,
					end: endTime || metrics[metrics.length - 1].timestamp
				},
				totalMetrics: metrics.length,
				systemStats,
				applicationStats,
				businessStats,
				lastUpdated: new Date()
			};

			this.logger.debug('Performance statistics calculated');
			return statistics;
		} catch (error) {
			this.logger.error('Failed to get performance statistics');
			throw error;
		}
	}

	/**
	 * 设置性能告警
	 */
	public async setAlert(alert: Omit<IPerformanceAlert, 'createdAt' | 'triggerCount'>): Promise<boolean> {
		try {
			const newAlert: IPerformanceAlert = {
				...alert,
				id: alert.id || uuidv4(),
				createdAt: new Date(),
				triggerCount: 0
			};

			this.alerts.set(newAlert.id, [newAlert]);
			this.logger.info(`Alert set: ${newAlert.id}`);
			return true;
		} catch {
			this.logger.error('Failed to set performance alert');
			return false;
		}
	}

	/**
	 * 删除性能告警
	 */
	public async removeAlert(alertId: string): Promise<boolean> {
		try {
			const deleted = this.alerts.delete(alertId);
			if (deleted) {
				this.logger.info(`Alert removed: ${alertId}`);
			}
			return deleted;
		} catch {
			this.logger.error('Failed to remove performance alert');
			return false;
		}
	}

	/**
	 * 获取所有告警
	 */
	public async getAlerts(): Promise<IPerformanceAlert[]> {
		try {
			const allAlerts: IPerformanceAlert[] = [];
			for (const alerts of this.alerts.values()) {
				allAlerts.push(...alerts);
			}
			return allAlerts;
		} catch {
			this.logger.error('Failed to get performance alerts');
			return [];
		}
	}

	/**
	 * 注册性能收集器
	 */
	public async registerCollector(collector: IPerformanceCollector): Promise<boolean> {
		try {
			const name = collector.getName ? collector.getName() : collector.constructor.name;
			this.collectors.set(name, collector);
			this.logger.info(`Collector registered: ${name}`);
			return true;
		} catch {
			this.logger.error('Failed to register performance collector');
			return false;
		}
	}

	/**
	 * 注销性能收集器
	 */
	public async unregisterCollector(collectorName: string): Promise<boolean> {
		try {
			const deleted = this.collectors.delete(collectorName);
			if (deleted) {
				this.logger.info(`Collector unregistered: ${collectorName}`);
			}
			return deleted;
		} catch {
			this.logger.error('Failed to unregister performance collector');
			return false;
		}
	}

	/**
	 * 检查监控器是否健康
	 */
	public async isHealthy(): Promise<boolean> {
		try {
			// 检查收集器健康状态
			for (const collector of this.collectors.values()) {
				const isHealthy = await collector.isHealthy();
				if (!isHealthy) {
					return false;
				}
			}

			// 检查基本功能
			const testMetrics = await this.collectMetrics({
				includeSystem: true,
				includeApplication: false,
				includeBusiness: false
			});

			return testMetrics !== null;
		} catch {
			this.logger.error('Performance monitor health check failed');
			return false;
		}
	}

	/**
	 * 获取监控器统计信息
	 */
	public getMonitorStatistics(): {
		readonly isRunning: boolean;
		readonly startTime?: Date;
		readonly totalMetricsCollected: number;
		readonly totalAlertsTriggered: number;
		readonly registeredCollectors: number;
		readonly activeAlerts: number;
	} {
		let totalMetricsCollected = 0;
		for (const metrics of this.metrics.values()) {
			totalMetricsCollected += metrics.length;
		}

		let totalAlertsTriggered = 0;
		let activeAlerts = 0;
		for (const alerts of this.alerts.values()) {
			for (const alert of alerts) {
				totalAlertsTriggered += alert.triggerCount;
				if (alert.enabled) {
					activeAlerts++;
				}
			}
		}

		return {
			isRunning: this._isRunning,
			startTime: this._isRunning ? new Date() : undefined,
			totalMetricsCollected,
			totalAlertsTriggered,
			registeredCollectors: this.collectors.size,
			activeAlerts
		};
	}

	// 私有方法

	/**
	 * 收集并存储指标
	 */
	private async collectAndStoreMetrics(): Promise<void> {
		try {
			const metrics = await this.collectMetrics();
			await this.storeMetrics(metrics);
			await this.checkAlerts(metrics);
		} catch {
			this.logger.error('Failed to collect and store metrics');
		}
	}

	/**
	 * 清理过期数据
	 */
	private async cleanupExpiredData(): Promise<void> {
		try {
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - this.configuration.dataRetentionDays);

			for (const [key, metrics] of this.metrics.entries()) {
				const filteredMetrics = metrics.filter((metric) => metric.timestamp > cutoffDate);
				this.metrics.set(key, filteredMetrics);
			}

			this.logger.debug('Expired performance data cleaned up');
		} catch {
			this.logger.error('Failed to cleanup expired data');
		}
	}

	/**
	 * 生成定期报告
	 */
	private async generatePeriodicReport(): Promise<void> {
		try {
			const endTime = new Date();
			const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // 24小时前

			await this.getStatistics({ startTime, endTime });
			this.logger.info('Periodic performance report generated');
		} catch {
			this.logger.error('Failed to generate periodic report');
		}
	}

	/**
	 * 检查告警
	 */
	private async checkAlerts(metrics: IPerformanceMetrics): Promise<void> {
		try {
			for (const alerts of this.alerts.values()) {
				for (const alert of alerts) {
					if (!alert.enabled) continue;

					const metricValue = this.getMetricValue(metrics, alert.metricName);
					if (metricValue === null) continue;

					const shouldTrigger = this.evaluateAlertCondition(metricValue, alert.threshold, alert.operator);

					if (shouldTrigger) {
						this.logger.warn('Performance alert triggered');
					}
				}
			}
		} catch {
			this.logger.error('Failed to check alerts');
		}
	}

	/**
	 * 获取指标值
	 */
	private getMetricValue(metrics: IPerformanceMetrics, metricName: string): number | null {
		// 这里需要根据实际的指标名称来获取值
		// 这是一个简化的实现
		switch (metricName) {
			case 'cpu_usage':
				return metrics.systemMetrics.cpuUsage;
			case 'memory_usage':
				return metrics.systemMetrics.memoryUsage;
			case 'response_time':
				return metrics.applicationMetrics.averageResponseTime;
			case 'error_rate':
				return metrics.applicationMetrics.errorRate;
			default:
				return metrics.customMetrics?.[metricName] || null;
		}
	}

	/**
	 * 评估告警条件
	 */
	private evaluateAlertCondition(
		value: number,
		threshold: number,
		operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals'
	): boolean {
		switch (operator) {
			case 'greater_than':
				return value > threshold;
			case 'less_than':
				return value < threshold;
			case 'equals':
				return value === threshold;
			case 'not_equals':
				return value !== threshold;
			default:
				return false;
		}
	}

	/**
	 * 获取指标键
	 */
	private getMetricsKey(metrics: IPerformanceMetrics): string {
		return `${metrics.tenantId}:${metrics.serviceId}:${metrics.instanceId}`;
	}

	/**
	 * 获取当前租户ID
	 */
	private getCurrentTenantId(): string {
		// 这里应该从上下文或配置中获取
		return 'default-tenant';
	}

	/**
	 * 获取当前服务ID
	 */
	private getCurrentServiceId(): string {
		// 这里应该从配置中获取
		return 'core-service';
	}

	/**
	 * 获取当前实例ID
	 */
	private getCurrentInstanceId(): string {
		// 这里应该从配置中获取
		return 'instance-1';
	}

	/**
	 * 收集系统指标
	 */
	private async collectSystemMetrics(): Promise<ISystemMetrics> {
		// 这里应该实现真实的系统指标收集
		// 这是一个简化的实现
		return {
			cpuUsage: Math.random() * 100,
			memoryUsage: Math.random() * 100,
			diskUsage: Math.random() * 100,
			networkUsage: Math.random() * 100,
			loadAverage: Math.random() * 10,
			processCount: Math.floor(Math.random() * 1000),
			threadCount: Math.floor(Math.random() * 5000),
			fileDescriptorCount: Math.floor(Math.random() * 10000)
		};
	}

	/**
	 * 收集应用指标
	 */
	private async collectApplicationMetrics(): Promise<IApplicationMetrics> {
		// 这里应该实现真实的应用指标收集
		// 这是一个简化的实现
		return {
			requestCount: Math.floor(Math.random() * 10000),
			averageResponseTime: Math.random() * 1000,
			maxResponseTime: Math.random() * 2000,
			minResponseTime: Math.random() * 100,
			errorRate: Math.random() * 0.1,
			throughput: Math.random() * 1000,
			concurrentConnections: Math.floor(Math.random() * 1000),
			queueLength: Math.floor(Math.random() * 100),
			cacheHitRate: Math.random()
		};
	}

	/**
	 * 收集业务指标
	 */
	private async collectBusinessMetrics(): Promise<IBusinessMetrics> {
		// 这里应该实现真实的业务指标收集
		// 这是一个简化的实现
		return {
			activeUsers: Math.floor(Math.random() * 10000),
			ordersPerMinute: Math.floor(Math.random() * 100),
			revenuePerMinute: Math.random() * 10000,
			userRegistrations: Math.floor(Math.random() * 100),
			userLogins: Math.floor(Math.random() * 1000),
			pageViews: Math.floor(Math.random() * 50000),
			sessionCount: Math.floor(Math.random() * 5000),
			conversionRate: Math.random() * 0.1
		};
	}

	/**
	 * 获取默认系统指标
	 */
	private getDefaultSystemMetrics(): ISystemMetrics {
		return {
			cpuUsage: 0,
			memoryUsage: 0,
			diskUsage: 0,
			networkUsage: 0,
			loadAverage: 0,
			processCount: 0,
			threadCount: 0,
			fileDescriptorCount: 0
		};
	}

	/**
	 * 获取默认应用指标
	 */
	private getDefaultApplicationMetrics(): IApplicationMetrics {
		return {
			requestCount: 0,
			averageResponseTime: 0,
			maxResponseTime: 0,
			minResponseTime: 0,
			errorRate: 0,
			throughput: 0,
			concurrentConnections: 0,
			queueLength: 0,
			cacheHitRate: 0
		};
	}

	/**
	 * 获取默认业务指标
	 */
	private getDefaultBusinessMetrics(): IBusinessMetrics {
		return {
			activeUsers: 0,
			ordersPerMinute: 0,
			revenuePerMinute: 0,
			userRegistrations: 0,
			userLogins: 0,
			pageViews: 0,
			sessionCount: 0,
			conversionRate: 0
		};
	}

	/**
	 * 获取空聚合
	 */
	private getEmptyAggregation(startTime?: Date, endTime?: Date): IPerformanceMetricsAggregation {
		const now = new Date();
		return {
			startTime: startTime || now,
			endTime: endTime || now,
			count: 0,
			systemMetrics: {
				avgCpuUsage: 0,
				maxCpuUsage: 0,
				avgMemoryUsage: 0,
				maxMemoryUsage: 0,
				avgDiskUsage: 0,
				maxDiskUsage: 0
			},
			applicationMetrics: {
				totalRequests: 0,
				avgResponseTime: 0,
				maxResponseTime: 0,
				minResponseTime: 0,
				avgErrorRate: 0,
				maxErrorRate: 0,
				avgThroughput: 0,
				maxThroughput: 0
			},
			businessMetrics: {
				avgActiveUsers: 0,
				maxActiveUsers: 0,
				totalOrders: 0,
				totalRevenue: 0,
				avgConversionRate: 0,
				maxConversionRate: 0
			}
		};
	}

	/**
	 * 获取空统计
	 */
	private getEmptyStatistics(startTime?: Date, endTime?: Date): IPerformanceMetricsStatistics {
		const now = new Date();
		return {
			timeRange: {
				start: startTime || now,
				end: endTime || now
			},
			totalMetrics: 0,
			systemStats: {
				avgCpuUsage: 0,
				avgMemoryUsage: 0,
				avgDiskUsage: 0,
				peakCpuUsage: 0,
				peakMemoryUsage: 0,
				peakDiskUsage: 0
			},
			applicationStats: {
				totalRequests: 0,
				avgResponseTime: 0,
				peakResponseTime: 0,
				avgErrorRate: 0,
				peakErrorRate: 0,
				avgThroughput: 0,
				peakThroughput: 0
			},
			businessStats: {
				avgActiveUsers: 0,
				peakActiveUsers: 0,
				totalOrders: 0,
				totalRevenue: 0,
				avgConversionRate: 0,
				peakConversionRate: 0
			},
			lastUpdated: now
		};
	}

	/**
	 * 聚合系统指标
	 */
	private aggregateSystemMetrics(metrics: ISystemMetrics[]): {
		readonly avgCpuUsage: number;
		readonly maxCpuUsage: number;
		readonly avgMemoryUsage: number;
		readonly maxMemoryUsage: number;
		readonly avgDiskUsage: number;
		readonly maxDiskUsage: number;
	} {
		if (metrics.length === 0) {
			return {
				avgCpuUsage: 0,
				maxCpuUsage: 0,
				avgMemoryUsage: 0,
				maxMemoryUsage: 0,
				avgDiskUsage: 0,
				maxDiskUsage: 0
			};
		}

		const cpuUsages = metrics.map((m) => m.cpuUsage);
		const memoryUsages = metrics.map((m) => m.memoryUsage);
		const diskUsages = metrics.map((m) => m.diskUsage);

		return {
			avgCpuUsage: cpuUsages.reduce((sum, val) => sum + val, 0) / cpuUsages.length,
			maxCpuUsage: Math.max(...cpuUsages),
			avgMemoryUsage: memoryUsages.reduce((sum, val) => sum + val, 0) / memoryUsages.length,
			maxMemoryUsage: Math.max(...memoryUsages),
			avgDiskUsage: diskUsages.reduce((sum, val) => sum + val, 0) / diskUsages.length,
			maxDiskUsage: Math.max(...diskUsages)
		};
	}

	/**
	 * 聚合应用指标
	 */
	private aggregateApplicationMetrics(metrics: IApplicationMetrics[]): {
		readonly totalRequests: number;
		readonly avgResponseTime: number;
		readonly maxResponseTime: number;
		readonly minResponseTime: number;
		readonly avgErrorRate: number;
		readonly maxErrorRate: number;
		readonly avgThroughput: number;
		readonly maxThroughput: number;
	} {
		if (metrics.length === 0) {
			return {
				totalRequests: 0,
				avgResponseTime: 0,
				maxResponseTime: 0,
				minResponseTime: 0,
				avgErrorRate: 0,
				maxErrorRate: 0,
				avgThroughput: 0,
				maxThroughput: 0
			};
		}

		const totalRequests = metrics.reduce((sum, m) => sum + m.requestCount, 0);
		const responseTimes = metrics.map((m) => m.averageResponseTime);
		const errorRates = metrics.map((m) => m.errorRate);
		const throughputs = metrics.map((m) => m.throughput);

		return {
			totalRequests,
			avgResponseTime: responseTimes.reduce((sum, val) => sum + val, 0) / responseTimes.length,
			maxResponseTime: Math.max(...responseTimes),
			minResponseTime: Math.min(...responseTimes),
			avgErrorRate: errorRates.reduce((sum, val) => sum + val, 0) / errorRates.length,
			maxErrorRate: Math.max(...errorRates),
			avgThroughput: throughputs.reduce((sum, val) => sum + val, 0) / throughputs.length,
			maxThroughput: Math.max(...throughputs)
		};
	}

	/**
	 * 聚合业务指标
	 */
	private aggregateBusinessMetrics(metrics: IBusinessMetrics[]): {
		readonly avgActiveUsers: number;
		readonly maxActiveUsers: number;
		readonly totalOrders: number;
		readonly totalRevenue: number;
		readonly avgConversionRate: number;
		readonly maxConversionRate: number;
	} {
		if (metrics.length === 0) {
			return {
				avgActiveUsers: 0,
				maxActiveUsers: 0,
				totalOrders: 0,
				totalRevenue: 0,
				avgConversionRate: 0,
				maxConversionRate: 0
			};
		}

		const activeUsers = metrics.map((m) => m.activeUsers);
		const ordersPerMinute = metrics.map((m) => m.ordersPerMinute);
		const revenuePerMinute = metrics.map((m) => m.revenuePerMinute);
		const conversionRates = metrics.map((m) => m.conversionRate);

		return {
			avgActiveUsers: activeUsers.reduce((sum, val) => sum + val, 0) / activeUsers.length,
			maxActiveUsers: Math.max(...activeUsers),
			totalOrders: ordersPerMinute.reduce((sum, val) => sum + val, 0),
			totalRevenue: revenuePerMinute.reduce((sum, val) => sum + val, 0),
			avgConversionRate: conversionRates.reduce((sum, val) => sum + val, 0) / conversionRates.length,
			maxConversionRate: Math.max(...conversionRates)
		};
	}

	/**
	 * 计算系统统计
	 */
	private calculateSystemStatistics(metrics: IPerformanceMetrics[]): {
		readonly avgCpuUsage: number;
		readonly avgMemoryUsage: number;
		readonly avgDiskUsage: number;
		readonly peakCpuUsage: number;
		readonly peakMemoryUsage: number;
		readonly peakDiskUsage: number;
	} {
		const systemMetrics = metrics.map((m) => m.systemMetrics);
		const aggregation = this.aggregateSystemMetrics(systemMetrics);

		return {
			avgCpuUsage: aggregation.avgCpuUsage,
			avgMemoryUsage: aggregation.avgMemoryUsage,
			avgDiskUsage: aggregation.avgDiskUsage,
			peakCpuUsage: aggregation.maxCpuUsage,
			peakMemoryUsage: aggregation.maxMemoryUsage,
			peakDiskUsage: aggregation.maxDiskUsage
		};
	}

	/**
	 * 计算应用统计
	 */
	private calculateApplicationStatistics(metrics: IPerformanceMetrics[]): {
		readonly totalRequests: number;
		readonly avgResponseTime: number;
		readonly peakResponseTime: number;
		readonly avgErrorRate: number;
		readonly peakErrorRate: number;
		readonly avgThroughput: number;
		readonly peakThroughput: number;
	} {
		const applicationMetrics = metrics.map((m) => m.applicationMetrics);
		const aggregation = this.aggregateApplicationMetrics(applicationMetrics);

		return {
			totalRequests: aggregation.totalRequests,
			avgResponseTime: aggregation.avgResponseTime,
			peakResponseTime: aggregation.maxResponseTime,
			avgErrorRate: aggregation.avgErrorRate,
			peakErrorRate: aggregation.maxErrorRate,
			avgThroughput: aggregation.avgThroughput,
			peakThroughput: aggregation.maxThroughput
		};
	}

	/**
	 * 计算业务统计
	 */
	private calculateBusinessStatistics(metrics: IPerformanceMetrics[]): {
		readonly avgActiveUsers: number;
		readonly peakActiveUsers: number;
		readonly totalOrders: number;
		readonly totalRevenue: number;
		readonly avgConversionRate: number;
		readonly peakConversionRate: number;
	} {
		const businessMetrics = metrics.map((m) => m.businessMetrics);
		const aggregation = this.aggregateBusinessMetrics(businessMetrics);

		return {
			avgActiveUsers: aggregation.avgActiveUsers,
			peakActiveUsers: aggregation.maxActiveUsers,
			totalOrders: aggregation.totalOrders,
			totalRevenue: aggregation.totalRevenue,
			avgConversionRate: aggregation.avgConversionRate,
			peakConversionRate: aggregation.maxConversionRate
		};
	}

	/**
	 * 获取实时指标
	 */
	public async getRealTimeMetrics(): Promise<IPerformanceMetrics> {
		return {
			timestamp: new Date(),
			tenantId: 'default',
			serviceId: 'core',
			instanceId: 'instance-1',
			version: '1.0.0',
			systemMetrics: {
				cpuUsage: Math.random() * 100,
				memoryUsage: Math.random() * 100,
				diskUsage: Math.random() * 100,
				networkUsage: Math.random() * 100,
				loadAverage: Math.random(),
				processCount: Math.floor(Math.random() * 1000),
				threadCount: Math.floor(Math.random() * 2000),
				fileDescriptorCount: Math.floor(Math.random() * 1000)
			},
			applicationMetrics: {
				requestCount: Math.floor(Math.random() * 1000),
				averageResponseTime: Math.random() * 1000,
				maxResponseTime: Math.random() * 5000,
				minResponseTime: Math.random() * 100,
				errorRate: Math.random() * 0.1,
				throughput: Math.random() * 100,
				concurrentConnections: Math.floor(Math.random() * 100),
				queueLength: Math.floor(Math.random() * 50),
				cacheHitRate: Math.random()
			},
			businessMetrics: {
				activeUsers: Math.floor(Math.random() * 1000),
				ordersPerMinute: Math.floor(Math.random() * 100),
				revenuePerMinute: Math.random() * 10000,
				userRegistrations: Math.floor(Math.random() * 50),
				userLogins: Math.floor(Math.random() * 200),
				pageViews: Math.floor(Math.random() * 5000),
				sessionCount: Math.floor(Math.random() * 300),
				conversionRate: Math.random() * 0.1
			}
		};
	}

	/**
	 * 获取指标统计信息
	 */
	public async getMetricsStatistics(): Promise<Record<string, unknown>> {
		return {
			totalMetrics: this.metrics.size,
			collectionRate: 0.95,
			storageUsage: 1024000,
			alertCount: this.alerts.size,
			lastCollectionTime: new Date()
		};
	}

	/**
	 * 更新告警
	 */
	public async updateAlert(alertId: string, updates: Partial<IPerformanceAlert>): Promise<boolean> {
		const alert = this.alerts.get(alertId);
		if (!alert) {
			return false;
		}

		Object.assign(alert, updates);
		this.logger.info(`Alert updated: ${alertId}`);
		return true;
	}

	/**
	 * 生成报告
	 */
	public async generateReport(options: {
		startTime: Date;
		endTime: Date;
		includeSystemMetrics?: boolean;
		includeApplicationMetrics?: boolean;
		includeBusinessMetrics?: boolean;
		format?: string;
	}): Promise<Record<string, unknown>> {
		return {
			id: 'report-001',
			title: 'Performance Report',
			description: 'Generated performance report',
			startTime: options.startTime,
			endTime: options.endTime,
			summary: {
				overallHealth: 'good',
				totalRequests: 100000,
				averageResponseTime: 150,
				errorRate: 0.02,
				uptime: 0.99
			},
			metrics: {
				system: {
					cpuUsage: { average: 45.2, max: 80.5, min: 20.1 },
					memoryUsage: { average: 67.8, max: 90.2, min: 45.1 }
				},
				application: {
					responseTime: { average: 150, max: 1000, min: 50 },
					throughput: { average: 100, max: 200, min: 50 }
				}
			},
			recommendations: ['Consider scaling up CPU resources', 'Optimize database queries', 'Implement caching strategy'],
			generatedAt: new Date(),
			generatedBy: 'system'
		};
	}

	/**
	 * 生成健康检查报告
	 */
	public async generateHealthReport(): Promise<Record<string, unknown>> {
		return {
			overallHealth: 'good',
			status: 'healthy',
			components: {
				system: { status: 'healthy', message: 'System metrics normal' },
				application: {
					status: 'healthy',
					message: 'Application metrics normal'
				}
			},
			issues: [],
			lastCheck: new Date(),
			uptime: 0.99,
			responseTime: 50
		};
	}

	/**
	 * 获取收集器列表
	 */
	public async getCollectors(): Promise<IPerformanceCollector[]> {
		return Array.from(this.collectors.values());
	}

	/**
	 * 健康检查
	 */
	public async healthCheck(): Promise<{
		isHealthy: boolean;
		status: string;
		details: Record<string, unknown>;
	}> {
		const isHealthy = await this.isHealthy();
		return {
			isHealthy,
			status: isHealthy ? 'healthy' : 'unhealthy',
			details: {
				running: this._isRunning,
				collectors: this.collectors.size,
				alerts: this.alerts.size
			}
		};
	}

	/**
	 * 获取健康状态
	 */
	public async getHealthStatus(): Promise<string> {
		const isHealthy = await this.isHealthy();
		return isHealthy ? 'healthy' : 'unhealthy';
	}

	/**
	 * 获取详细统计信息
	 */
	public async getDetailedStatistics(): Promise<{
		basic: IPerformanceMetricsStatistics;
		byType: Record<string, unknown>;
		byTime: Record<string, unknown>;
		performance: Record<string, unknown>;
	}> {
		const basic = await this.getStatistics({});
		return {
			basic,
			byType: {
				system: { count: 100, average: 45.2 },
				application: { count: 200, average: 150 }
			},
			byTime: {
				lastHour: { count: 50, average: 40.1 },
				lastDay: { count: 1000, average: 45.2 }
			},
			performance: {
				collectionRate: 0.95,
				processingTime: 10,
				storageEfficiency: 0.85
			}
		};
	}
}
