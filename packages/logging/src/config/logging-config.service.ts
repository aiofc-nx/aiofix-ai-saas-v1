/**
 * 日志模块配置服务
 *
 * @description 基于统一配置管理系统的日志模块配置服务
 * 提供日志模块专用的配置管理功能，支持热更新和监控
 *
 * @since 1.0.0
 */

import type { IConfigManager, ILoggingModuleConfig, IConfigChangeEvent } from '@aiofix/config';

/**
 * 日志模块配置服务实现
 */
export class LoggingConfigService {
	private readonly configManager: IConfigManager;
	private config: ILoggingModuleConfig | null = null;
	private initialized = false;
	private readonly configChangeListeners: Set<(config: ILoggingModuleConfig) => void> = new Set();

	constructor(configManager: IConfigManager) {
		this.configManager = configManager;
	}

	/**
	 * 初始化配置服务
	 */
	async initialize(): Promise<void> {
		if (this.initialized) {
			return;
		}

		try {
			// 加载初始配置
			await this.loadConfig();

			// 监听配置变化
			this.configManager.onChange('logging', (event: IConfigChangeEvent) => {
				this.handleConfigChange(event);
			});

			this.initialized = true;
		} catch (error) {
			throw new Error(`LoggingConfigService初始化失败: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * 获取完整的日志配置
	 */
	async getConfig(): Promise<ILoggingModuleConfig> {
		await this.ensureInitialized();
		if (!this.config) {
			throw new Error('日志配置未加载');
		}
		return this.config;
	}

	/**
	 * 获取日志级别
	 */
	async getLogLevel(): Promise<string> {
		const config = await this.getConfig();
		return config.level;
	}

	/**
	 * 获取日志目标配置
	 */
	async getTargets(): Promise<ILoggingModuleConfig['targets']> {
		const config = await this.getConfig();
		return config.targets;
	}

	/**
	 * 获取格式化配置
	 */
	async getFormatConfig(): Promise<ILoggingModuleConfig['format']> {
		const config = await this.getConfig();
		return config.format;
	}

	/**
	 * 获取轮转配置
	 */
	async getRotationConfig(): Promise<ILoggingModuleConfig['rotation']> {
		const config = await this.getConfig();
		return config.rotation;
	}

	/**
	 * 获取性能配置
	 */
	async getPerformanceConfig(): Promise<ILoggingModuleConfig['performance']> {
		const config = await this.getConfig();
		return config.performance;
	}

	/**
	 * 检查日志模块是否启用
	 */
	async isEnabled(): Promise<boolean> {
		const config = await this.getConfig();
		return config.enabled;
	}

	/**
	 * 检查结构化日志是否启用
	 */
	async isStructuredLoggingEnabled(): Promise<boolean> {
		const config = await this.getConfig();
		return config.format.type === 'json';
	}

	/**
	 * 检查多租户隔离是否启用（暂时返回false，等待配置接口完善）
	 */
	async isTenantIsolationEnabled(): Promise<boolean> {
		// TODO: 等待日志配置接口添加多租户支持
		return false;
	}

	/**
	 * 监听配置变化
	 */
	onConfigChange(listener: (config: ILoggingModuleConfig) => void): void {
		this.configChangeListeners.add(listener);
	}

	/**
	 * 移除配置变化监听器
	 */
	offConfigChange(listener: (config: ILoggingModuleConfig) => void): void {
		this.configChangeListeners.delete(listener);
	}

	/**
	 * 重新加载配置
	 */
	async reloadConfig(): Promise<void> {
		await this.loadConfig();
		this.notifyConfigChange();
	}

	/**
	 * 获取配置状态
	 */
	getStatus(): {
		initialized: boolean;
		version: string;
		lastUpdated: Date | null;
		listenersCount: number;
	} {
		return {
			initialized: this.initialized,
			version: '1.0.0',
			lastUpdated: null, // 可以从配置管理器获取
			listenersCount: this.configChangeListeners.size
		};
	}

	/**
	 * 销毁配置服务
	 */
	async destroy(): Promise<void> {
		this.configChangeListeners.clear();
		this.config = null;
		this.initialized = false;
	}

	// ==================== 私有方法 ====================

	/**
	 * 确保服务已初始化
	 */
	private async ensureInitialized(): Promise<void> {
		if (!this.initialized) {
			await this.initialize();
		}
	}

	/**
	 * 加载配置
	 */
	private async loadConfig(): Promise<void> {
		try {
			this.config = await this.configManager.getModuleConfig<ILoggingModuleConfig>('logging');
		} catch (error) {
			throw new Error(`加载日志配置失败: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * 处理配置变化事件
	 */
	private async handleConfigChange(event: IConfigChangeEvent): Promise<void> {
		try {
			// 重新加载配置
			await this.loadConfig();

			// 通知监听器
			this.notifyConfigChange();
		} catch {
			// 处理配置变化错误
		}
	}

	/**
	 * 通知配置变化
	 */
	private notifyConfigChange(): void {
		if (this.config) {
			this.configChangeListeners.forEach((listener) => {
				try {
					if (this.config) {
						listener(this.config);
					}
				} catch {
					// 忽略监听器错误
				}
			});
		}
	}
}

/**
 * 创建日志配置服务
 */
export async function createLoggingConfigService(configManager: IConfigManager): Promise<LoggingConfigService> {
	const service = new LoggingConfigService(configManager);
	await service.initialize();
	return service;
}
