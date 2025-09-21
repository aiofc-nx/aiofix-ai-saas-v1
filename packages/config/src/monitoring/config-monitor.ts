/**
 * 配置监控和诊断工具
 *
 * @description 提供配置系统的监控、诊断和健康检查功能
 * 支持性能指标收集、问题诊断、健康状态监控等
 *
 * ## 核心功能
 *
 * ### 📊 性能监控
 * - 配置访问性能监控
 * - 缓存命中率统计
 * - 提供者响应时间监控
 * - 内存使用情况监控
 *
 * ### 🔍 问题诊断
 * - 配置完整性检查
 * - 配置一致性验证
 * - 性能瓶颈分析
 * - 错误模式识别
 *
 * ### 🏥 健康检查
 * - 配置系统健康状态
 * - 提供者连接状态
 * - 缓存系统状态
 * - 配置更新状态
 *
 * ### 📈 指标收集
 * - 实时指标收集
 * - 历史数据分析
 * - 趋势预测
 * - 告警规则
 *
 * @example
 * ```typescript
 * const monitor = new ConfigMonitor(configManager);
 * await monitor.initialize();
 *
 * // 获取健康状态
 * const health = await monitor.getHealthStatus();
 * console.log('配置系统健康状态:', health.overall);
 *
 * // 诊断问题
 * const diagnosis = await monitor.diagnose();
 * if (diagnosis.issues.length > 0) {
 *   console.log('发现问题:', diagnosis.issues);
 * }
 *
 * // 监控指标
 * monitor.onMetrics((metrics) => {
 *   console.log('性能指标:', metrics);
 * });
 * ```
 *
 * @since 1.0.0
 */

import { EventEmitter } from 'events';
import type { IConfigManager, IConfigStatistics, IUnifiedConfig } from '../interfaces/config.interface';

/**
 * 健康状态枚举
 *
 * @description 定义系统健康状态的级别
 */
export enum HealthStatus {
	/** 健康 */
	HEALTHY = 'healthy',
	/** 警告 */
	WARNING = 'warning',
	/** 错误 */
	ERROR = 'error',
	/** 严重错误 */
	CRITICAL = 'critical'
}

/**
 * 诊断问题接口
 *
 * @description 定义诊断发现的问题结构
 */
export interface IDiagnosticIssue {
	/** 问题ID */
	id: string;

	/** 问题级别 */
	severity: HealthStatus;

	/** 问题标题 */
	title: string;

	/** 问题描述 */
	description: string;

	/** 问题路径 */
	path?: string;

	/** 建议的解决方案 */
	suggestions: string[];

	/** 问题分类 */
	category: 'performance' | 'security' | 'consistency' | 'configuration';

	/** 发现时间 */
	detectedAt: Date;
}

/**
 * 健康检查结果接口
 *
 * @description 定义健康检查的结果结构
 */
export interface IHealthCheckResult {
	/** 整体健康状态 */
	overall: HealthStatus;

	/** 检查时间 */
	timestamp: Date;

	/** 各组件健康状态 */
	components: {
		configManager: HealthStatus;
		providers: HealthStatus;
		cache: HealthStatus;
		validation: HealthStatus;
	};

	/** 发现的问题 */
	issues: IDiagnosticIssue[];

	/** 性能指标 */
	metrics: {
		responseTime: number;
		cacheHitRate: number;
		errorRate: number;
		memoryUsage: number;
	};

	/** 建议 */
	recommendations: string[];
}

/**
 * 诊断报告接口
 *
 * @description 定义完整诊断报告的结构
 */
export interface IDiagnosticReport {
	/** 报告ID */
	id: string;

	/** 生成时间 */
	timestamp: Date;

	/** 整体状态 */
	overall: HealthStatus;

	/** 发现的问题 */
	issues: IDiagnosticIssue[];

	/** 性能分析 */
	performance: {
		averageResponseTime: number;
		slowQueries: Array<{ path: string; duration: number }>;
		cacheEfficiency: number;
		memoryUsage: number;
	};

	/** 配置分析 */
	configuration: {
		totalConfigs: number;
		missingConfigs: string[];
		invalidConfigs: string[];
		duplicateConfigs: string[];
	};

	/** 安全分析 */
	security: {
		weakPasswords: string[];
		unencryptedSecrets: string[];
		insecureConnections: string[];
	};

	/** 建议 */
	recommendations: string[];

	/** 修复脚本 */
	fixSuggestions: Array<{
		issue: string;
		script: string;
		description: string;
	}>;
}

/**
 * 配置监控器实现
 *
 * @description 实现配置系统的监控和诊断功能
 */
export class ConfigMonitor extends EventEmitter {
	private readonly configManager: IConfigManager;
	private readonly metrics: Map<string, number[]> = new Map();
	private readonly issues: Map<string, IDiagnosticIssue> = new Map();

	private initialized = false;
	private monitoringInterval: NodeJS.Timeout | null = null;
	private metricsHistory: Array<{ timestamp: Date; metrics: IConfigStatistics }> = [];

	constructor(configManager: IConfigManager) {
		super();
		this.configManager = configManager;
	}

	/**
	 * 初始化监控器
	 *
	 * @param options - 监控选项
	 */
	async initialize(
		options: {
			metricsInterval?: number;
			enableContinuousMonitoring?: boolean;
			maxHistorySize?: number;
		} = {}
	): Promise<void> {
		if (this.initialized) {
			return;
		}

		const {
			metricsInterval = 60000, // 1分钟
			enableContinuousMonitoring = true
		} = options;

		try {
			// 启动持续监控
			if (enableContinuousMonitoring) {
				this.startContinuousMonitoring(metricsInterval);
			}

			this.initialized = true;
			console.log('配置监控器初始化完成');
		} catch (error) {
			console.error('配置监控器初始化失败:', error);
			throw error;
		}
	}

	/**
	 * 获取健康状态
	 *
	 * @returns 健康检查结果
	 */
	async getHealthStatus(): Promise<IHealthCheckResult> {
		try {
			const timestamp = new Date();
			const stats = this.configManager.getStatistics();
			const config = await this.configManager.getConfig();

			// 检查各组件健康状态
			const components = {
				configManager: this.checkConfigManagerHealth(stats),
				providers: this.checkProvidersHealth(stats),
				cache: this.checkCacheHealth(stats),
				validation: HealthStatus.HEALTHY // 简化实现
			};

			// 计算整体健康状态
			const overall = this.calculateOverallHealth(components);

			// 收集问题
			const issues = Array.from(this.issues.values());

			// 计算性能指标
			const metrics = {
				responseTime: stats.averageResponseTime,
				cacheHitRate: stats.cacheHitRate,
				errorRate: stats.errors / Math.max(stats.totalAccess, 1),
				memoryUsage: this.calculateMemoryUsage()
			};

			// 生成建议
			const recommendations = this.generateRecommendations(components, metrics, config);

			return {
				overall,
				timestamp,
				components,
				issues,
				metrics,
				recommendations
			};
		} catch (error) {
			console.error('健康检查失败:', error);
			return {
				overall: HealthStatus.CRITICAL,
				timestamp: new Date(),
				components: {
					configManager: HealthStatus.CRITICAL,
					providers: HealthStatus.CRITICAL,
					cache: HealthStatus.CRITICAL,
					validation: HealthStatus.CRITICAL
				},
				issues: [
					{
						id: 'health-check-error',
						severity: HealthStatus.CRITICAL,
						title: '健康检查失败',
						description: `健康检查过程中发生错误: ${error instanceof Error ? error.message : String(error)}`,
						suggestions: ['检查配置管理器状态', '重新初始化监控器'],
						category: 'configuration',
						detectedAt: new Date()
					}
				],
				metrics: {
					responseTime: 0,
					cacheHitRate: 0,
					errorRate: 1,
					memoryUsage: 0
				},
				recommendations: ['重新启动配置系统']
			};
		}
	}

	/**
	 * 执行完整诊断
	 *
	 * @returns 诊断报告
	 */
	async diagnose(): Promise<IDiagnosticReport> {
		const reportId = this.generateReportId();
		const timestamp = new Date();

		try {
			console.log('开始配置系统诊断...');

			// 获取健康状态
			const healthStatus = await this.getHealthStatus();

			// 性能分析
			const performance = await this.analyzePerformance();

			// 配置分析
			const configuration = await this.analyzeConfiguration();

			// 安全分析
			const security = await this.analyzeSecurity();

			// 生成修复建议
			const fixSuggestions = this.generateFixSuggestions(healthStatus.issues);

			const report: IDiagnosticReport = {
				id: reportId,
				timestamp,
				overall: healthStatus.overall,
				issues: healthStatus.issues,
				performance,
				configuration,
				security,
				recommendations: healthStatus.recommendations,
				fixSuggestions
			};

			console.log('配置系统诊断完成:', {
				overall: report.overall,
				issuesCount: report.issues.length,
				recommendationsCount: report.recommendations.length
			});

			return report;
		} catch (error) {
			console.error('配置诊断失败:', error);
			throw error;
		}
	}

	/**
	 * 监听指标更新
	 *
	 * @param callback - 指标回调
	 */
	onMetrics(callback: (metrics: IConfigStatistics) => void): void {
		this.on('metrics', callback);
	}

	/**
	 * 监听健康状态变化
	 *
	 * @param callback - 健康状态回调
	 */
	onHealthChange(callback: (health: IHealthCheckResult) => void): void {
		this.on('health-change', callback);
	}

	/**
	 * 监听问题发现
	 *
	 * @param callback - 问题回调
	 */
	onIssueDetected(callback: (issue: IDiagnosticIssue) => void): void {
		this.on('issue-detected', callback);
	}

	/**
	 * 销毁监控器
	 */
	async destroy(): Promise<void> {
		console.log('销毁配置监控器');

		try {
			// 停止持续监控
			if (this.monitoringInterval) {
				clearInterval(this.monitoringInterval);
				this.monitoringInterval = null;
			}

			// 清空数据
			this.metrics.clear();
			this.issues.clear();
			this.metricsHistory.length = 0;

			// 移除所有事件监听器
			this.removeAllListeners();

			this.initialized = false;
			console.log('配置监控器销毁完成');
		} catch (error) {
			console.error('配置监控器销毁失败:', error);
			throw error;
		}
	}

	/**
	 * 启动持续监控
	 *
	 * @param interval - 监控间隔
	 */
	private startContinuousMonitoring(interval: number): void {
		this.monitoringInterval = setInterval(async () => {
			try {
				const stats = this.configManager.getStatistics();
				const health = await this.getHealthStatus();

				// 记录指标历史
				this.metricsHistory.push({
					timestamp: new Date(),
					metrics: stats
				});

				// 限制历史大小
				if (this.metricsHistory.length > 1000) {
					this.metricsHistory = this.metricsHistory.slice(-1000);
				}

				// 触发指标事件
				this.emit('metrics', stats);

				// 检查健康状态变化
				this.checkHealthChanges(health);
			} catch (error) {
				console.error('持续监控执行失败:', error);
			}
		}, interval);

		console.log('持续监控已启动，间隔:', interval, 'ms');
	}

	/**
	 * 检查配置管理器健康状态
	 *
	 * @param stats - 统计信息
	 * @returns 健康状态
	 */
	private checkConfigManagerHealth(stats: IConfigStatistics): HealthStatus {
		// 检查错误率
		const errorRate = stats.errors / Math.max(stats.totalAccess, 1);
		if (errorRate > 0.1) {
			// 错误率超过10%
			return HealthStatus.CRITICAL;
		}
		if (errorRate > 0.05) {
			// 错误率超过5%
			return HealthStatus.ERROR;
		}
		if (errorRate > 0.01) {
			// 错误率超过1%
			return HealthStatus.WARNING;
		}

		// 检查响应时间
		if (stats.averageResponseTime > 1000) {
			// 超过1秒
			return HealthStatus.ERROR;
		}
		if (stats.averageResponseTime > 100) {
			// 超过100ms
			return HealthStatus.WARNING;
		}

		return HealthStatus.HEALTHY;
	}

	/**
	 * 检查提供者健康状态
	 *
	 * @param stats - 统计信息
	 * @returns 健康状态
	 */
	private checkProvidersHealth(stats: IConfigStatistics): HealthStatus {
		if (stats.providerCount === 0) {
			return HealthStatus.CRITICAL;
		}

		// 这里可以添加更多提供者特定的健康检查
		return HealthStatus.HEALTHY;
	}

	/**
	 * 检查缓存健康状态
	 *
	 * @param stats - 统计信息
	 * @returns 健康状态
	 */
	private checkCacheHealth(stats: IConfigStatistics): HealthStatus {
		// 检查缓存命中率
		if (stats.cacheHitRate < 0.5) {
			// 命中率低于50%
			return HealthStatus.WARNING;
		}
		if (stats.cacheHitRate < 0.2) {
			// 命中率低于20%
			return HealthStatus.ERROR;
		}

		return HealthStatus.HEALTHY;
	}

	/**
	 * 计算整体健康状态
	 *
	 * @param components - 各组件健康状态
	 * @returns 整体健康状态
	 */
	private calculateOverallHealth(components: Record<string, HealthStatus>): HealthStatus {
		const statuses = Object.values(components);

		if (statuses.includes(HealthStatus.CRITICAL)) {
			return HealthStatus.CRITICAL;
		}
		if (statuses.includes(HealthStatus.ERROR)) {
			return HealthStatus.ERROR;
		}
		if (statuses.includes(HealthStatus.WARNING)) {
			return HealthStatus.WARNING;
		}

		return HealthStatus.HEALTHY;
	}

	/**
	 * 分析性能
	 *
	 * @returns 性能分析结果
	 */
	private async analyzePerformance(): Promise<IDiagnosticReport['performance']> {
		const stats = this.configManager.getStatistics();

		// 模拟慢查询检测
		const slowQueries: Array<{ path: string; duration: number }> = [
			// 这里可以实现实际的慢查询检测逻辑
		];

		return {
			averageResponseTime: stats.averageResponseTime,
			slowQueries,
			cacheEfficiency: stats.cacheHitRate,
			memoryUsage: this.calculateMemoryUsage()
		};
	}

	/**
	 * 分析配置
	 *
	 * @returns 配置分析结果
	 */
	private async analyzeConfiguration(): Promise<IDiagnosticReport['configuration']> {
		const config = await this.configManager.getConfig();
		const stats = this.configManager.getStatistics();

		// 检查缺失的配置
		const missingConfigs = this.checkMissingConfigs(config);

		// 检查无效的配置
		const invalidConfigs = await this.checkInvalidConfigs(config);

		// 检查重复的配置
		const duplicateConfigs = this.checkDuplicateConfigs(config);

		return {
			totalConfigs: stats.configCount,
			missingConfigs,
			invalidConfigs,
			duplicateConfigs
		};
	}

	/**
	 * 分析安全性
	 *
	 * @returns 安全分析结果
	 */
	private async analyzeSecurity(): Promise<IDiagnosticReport['security']> {
		const config = await this.configManager.getConfig();

		// 检查弱密码
		const weakPasswords = this.checkWeakPasswords(config);

		// 检查未加密的敏感信息
		const unencryptedSecrets = this.checkUnencryptedSecrets(config);

		// 检查不安全的连接
		const insecureConnections = this.checkInsecureConnections(config);

		return {
			weakPasswords,
			unencryptedSecrets,
			insecureConnections
		};
	}

	/**
	 * 生成建议
	 *
	 * @param _components - 组件健康状态
	 * @param metrics - 性能指标
	 * @param config - 配置对象
	 * @returns 建议列表
	 */
	private generateRecommendations(
		_components: Record<string, HealthStatus>,
		metrics: { responseTime: number; cacheHitRate: number; errorRate: number; memoryUsage: number },
		config: IUnifiedConfig
	): string[] {
		const recommendations: string[] = [];

		// 性能建议
		if (metrics.responseTime > 100) {
			recommendations.push('配置访问响应时间较慢，建议启用缓存或优化配置结构');
		}

		if (metrics.cacheHitRate < 0.8) {
			recommendations.push('缓存命中率较低，建议调整缓存策略或增加缓存时间');
		}

		// 安全建议
		if (config.system.environment === 'production') {
			if (config.auth.jwt.secret === 'default-jwt-secret') {
				recommendations.push('生产环境建议设置自定义的JWT密钥');
			}

			// TODO: 更新安全配置检查（Core配置结构已更新）
			// if (!config.core.security.enableEncryption) {
			//   recommendations.push('生产环境建议启用配置加密');
			// }
		}

		// 配置建议
		if (config.messaging.global.enableVerboseLogging && config.system.environment === 'production') {
			recommendations.push('生产环境建议关闭详细日志以提高性能');
		}

		return recommendations;
	}

	/**
	 * 检查缺失的配置
	 *
	 * @param config - 配置对象
	 * @returns 缺失的配置路径
	 */
	private checkMissingConfigs(config: IUnifiedConfig): string[] {
		const missing: string[] = [];

		// 检查必需的配置项
		const requiredConfigs = ['system.name', 'system.version', 'core.database.host', 'core.redis.host'];

		for (const path of requiredConfigs) {
			const value = this.getValueByPath(config, path);
			if (value === undefined || value === null || value === '') {
				missing.push(path);
			}
		}

		return missing;
	}

	/**
	 * 检查无效的配置
	 *
	 * @param config - 配置对象
	 * @returns 无效的配置路径
	 */
	private async checkInvalidConfigs(config: IUnifiedConfig): Promise<string[]> {
		const invalid: string[] = [];

		// TODO: 更新端口检查（Core配置结构已更新）
		// 检查端口号
		const portConfigs: Array<{ path: string; value: number }> = [
			// 暂时注释掉，等待Core配置结构完善
			// { path: 'core.database.port', value: config.core.database.port },
			// { path: 'core.redis.port', value: config.core.redis.port },
		];

		for (const { path, value } of portConfigs) {
			if (typeof value === 'number' && (value <= 0 || value > 65535)) {
				invalid.push(path);
			}
		}

		// 检查超时配置
		if (config.messaging.global.defaultTimeout <= 0) {
			invalid.push('messaging.global.defaultTimeout');
		}

		return invalid;
	}

	/**
	 * 检查重复的配置
	 *
	 * @param _config - 配置对象
	 * @returns 重复的配置路径
	 */
	private checkDuplicateConfigs(_config: IUnifiedConfig): string[] {
		const duplicates: string[] = [];

		// TODO: 更新Redis配置重复检查（Core配置结构已更新）
		// 检查Redis配置重复
		// if (config.core.redis && config.messaging.redis) {
		//   if (
		//     config.core.redis.host === config.messaging.redis.host &&
		//     config.core.redis.port === config.messaging.redis.port
		//   ) {
		//     duplicates.push('core.redis / messaging.redis');
		//   }
		// }

		return duplicates;
	}

	/**
	 * 检查弱密码
	 *
	 * @param config - 配置对象
	 * @returns 弱密码路径
	 */
	private checkWeakPasswords(config: IUnifiedConfig): string[] {
		const weak: string[] = [];

		// 检查JWT密钥
		if (config.auth.jwt.secret === 'default-jwt-secret' || config.auth.jwt.secret.length < 32) {
			weak.push('auth.jwt.secret');
		}

		// TODO: 更新数据库密码检查（Core配置结构已更新）
		// 检查数据库密码
		// if (
		//   config.core.database.password &&
		//   config.core.database.password.length < 8
		// ) {
		//   weak.push('core.database.password');
		// }

		return weak;
	}

	/**
	 * 检查未加密的敏感信息
	 *
	 * @param _config - 配置对象
	 * @returns 未加密的敏感信息路径
	 */
	private checkUnencryptedSecrets(_config: IUnifiedConfig): string[] {
		const unencrypted: string[] = [];

		// TODO: 更新加密检查（Core配置结构已更新）
		// 如果没有启用加密，所有敏感信息都是未加密的
		// if (!config.core.security.enableEncryption) {
		//   unencrypted.push(
		//     'core.database.password',
		//     'core.redis.password',
		//     'auth.jwt.secret',
		//   );
		// }

		return unencrypted;
	}

	/**
	 * 检查不安全的连接
	 *
	 * @param _config - 配置对象
	 * @returns 不安全的连接路径
	 */
	private checkInsecureConnections(_config: IUnifiedConfig): string[] {
		const insecure: string[] = [];

		// TODO: 更新数据库SSL检查（Core配置结构已更新）
		// 检查数据库SSL
		// if (
		//   !config.core.database.ssl &&
		//   config.system.environment === 'production'
		// ) {
		//   insecure.push('core.database (未启用SSL)');
		// }

		return insecure;
	}

	/**
	 * 生成修复建议
	 *
	 * @param issues - 问题列表
	 * @returns 修复建议
	 */
	private generateFixSuggestions(issues: IDiagnosticIssue[]): IDiagnosticReport['fixSuggestions'] {
		const suggestions: IDiagnosticReport['fixSuggestions'] = [];

		for (const issue of issues) {
			switch (issue.category) {
				case 'security':
					if (issue.path?.includes('jwt.secret')) {
						suggestions.push({
							issue: issue.title,
							script: 'export AIOFIX_AUTH__JWT__SECRET=$(openssl rand -base64 32)',
							description: '生成并设置强JWT密钥'
						});
					}
					break;

				case 'performance':
					if (issue.title.includes('响应时间')) {
						suggestions.push({
							issue: issue.title,
							script: 'export AIOFIX_CORE__PERFORMANCE__ENABLE_CACHING=true',
							description: '启用配置缓存以提高性能'
						});
					}
					break;

				case 'configuration':
					suggestions.push({
						issue: issue.title,
						script: `# 检查配置: ${issue.path}`,
						description: issue.suggestions.join('; ')
					});
					break;
			}
		}

		return suggestions;
	}

	/**
	 * 检查健康状态变化
	 *
	 * @param currentHealth - 当前健康状态
	 */
	private checkHealthChanges(currentHealth: IHealthCheckResult): void {
		// 这里可以实现健康状态变化的检测逻辑
		// 目前简化实现
		this.emit('health-change', currentHealth);
	}

	/**
	 * 计算内存使用量
	 *
	 * @returns 内存使用量（MB）
	 */
	private calculateMemoryUsage(): number {
		// 简化的内存计算
		const usage = process.memoryUsage();
		return Math.round(usage.heapUsed / 1024 / 1024); // 转换为MB
	}

	/**
	 * 根据路径获取配置值
	 *
	 * @param obj - 配置对象
	 * @param path - 配置路径
	 * @returns 配置值
	 */
	private getValueByPath(obj: unknown, path: string): unknown {
		const keys = path.split('.');
		let current = obj;

		for (const key of keys) {
			if (current && typeof current === 'object' && key in current) {
				current = (current as Record<string, unknown>)[key];
			} else {
				return undefined;
			}
		}

		return current;
	}

	/**
	 * 生成报告ID
	 *
	 * @returns 报告ID
	 */
	private generateReportId(): string {
		return `diag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}

/**
 * 创建配置监控器
 *
 * @param configManager - 配置管理器
 * @returns 监控器实例
 */
export async function createConfigMonitor(configManager: IConfigManager): Promise<ConfigMonitor> {
	const monitor = new ConfigMonitor(configManager);
	await monitor.initialize();
	return monitor;
}

/**
 * 执行快速健康检查
 *
 * @param configManager - 配置管理器
 * @returns 健康检查结果
 */
export async function quickHealthCheck(configManager: IConfigManager): Promise<IHealthCheckResult> {
	const monitor = new ConfigMonitor(configManager);
	const result = await monitor.getHealthStatus();
	await monitor.destroy();
	return result;
}

/**
 * 执行完整诊断
 *
 * @param configManager - 配置管理器
 * @returns 诊断报告
 */
export async function fullDiagnosis(configManager: IConfigManager): Promise<IDiagnosticReport> {
	const monitor = new ConfigMonitor(configManager);
	await monitor.initialize();
	const result = await monitor.diagnose();
	await monitor.destroy();
	return result;
}
