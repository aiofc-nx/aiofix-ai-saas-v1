/**
 * Messaging模块配置服务
 *
 * @description 基于统一配置管理平台的messaging模块配置服务
 * 提供类型安全的配置访问、热更新支持和配置验证功能
 *
 * @since 1.0.0
 */

import type {
	IConfigManager,
	IMessagingModuleConfig,
	IConfigChangeEvent,
	IQueueConfig,
	IHandlerConfig
} from '@aiofix/config';

// 重新导出配置接口，保持API一致性
export type { IQueueConfig, IHandlerConfig } from '@aiofix/config';

/**
 * Messaging模块配置服务实现
 *
 * @description 实现messaging模块的配置管理功能
 */
export class MessagingConfigService {
	private readonly configManager: IConfigManager;
	private config: IMessagingModuleConfig | null = null;
	private initialized = false;
	private readonly configChangeListeners: Set<(config: IMessagingModuleConfig) => void> = new Set();

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
			this.configManager.onChange('messaging', (event) => {
				this.handleConfigChange(event);
			});

			// 验证配置
			const isValid = await this.validateConfig();
			if (!isValid) {
				throw new Error('Messaging模块配置验证失败');
			}

			this.initialized = true;
		} catch (error) {
			throw new Error(`MessagingConfigService初始化失败: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * 获取完整的messaging配置
	 *
	 * @returns messaging模块配置
	 */
	async getConfig(): Promise<IMessagingModuleConfig> {
		await this.ensureInitialized();
		if (!this.config) {
			throw new Error('Messaging配置未正确初始化');
		}
		return this.config;
	}

	/**
	 * 获取全局配置
	 *
	 * @returns 全局配置
	 */
	async getGlobalConfig(): Promise<IMessagingModuleConfig['global']> {
		const config = await this.getConfig();
		return config.global;
	}

	/**
	 * 获取Redis配置
	 *
	 * @returns Redis配置
	 */
	async getRedisConfig(): Promise<IMessagingModuleConfig['redis']> {
		const config = await this.getConfig();
		return config.redis;
	}

	/**
	 * 获取队列配置
	 *
	 * @param queueName - 队列名称
	 * @returns 队列配置
	 */
	async getQueueConfig(queueName: string): Promise<IQueueConfig | undefined> {
		const config = await this.getConfig();
		const queueConfig = config.queues[queueName];
		return queueConfig ? (queueConfig as IQueueConfig) : undefined;
	}

	/**
	 * 获取所有队列配置
	 *
	 * @returns 所有队列配置
	 */
	async getAllQueueConfigs(): Promise<Record<string, IQueueConfig>> {
		const config = await this.getConfig();
		return config.queues as Record<string, IQueueConfig>;
	}

	/**
	 * 获取处理器配置
	 *
	 * @param handlerName - 处理器名称
	 * @returns 处理器配置
	 */
	async getHandlerConfig(handlerName: string): Promise<IHandlerConfig | undefined> {
		const config = await this.getConfig();
		const handlerConfig = config.handlers[handlerName];
		return handlerConfig ? (handlerConfig as IHandlerConfig) : undefined;
	}

	/**
	 * 获取所有处理器配置
	 *
	 * @returns 所有处理器配置
	 */
	async getAllHandlerConfigs(): Promise<Record<string, IHandlerConfig>> {
		const config = await this.getConfig();
		return config.handlers as Record<string, IHandlerConfig>;
	}

	/**
	 * 获取监控配置
	 *
	 * @returns 监控配置
	 */
	async getMonitoringConfig(): Promise<IMessagingModuleConfig['monitoring']> {
		const config = await this.getConfig();
		return config.monitoring;
	}

	/**
	 * 更新全局配置
	 *
	 * @param updates - 配置更新
	 */
	async updateGlobalConfig(updates: Partial<IMessagingModuleConfig['global']>): Promise<void> {
		await this.ensureInitialized();

		const currentConfig = await this.getGlobalConfig();
		const newGlobalConfig = { ...currentConfig, ...updates };

		await this.configManager.set('messaging.global', newGlobalConfig);
	}

	/**
	 * 监听配置变化
	 *
	 * @param callback - 配置变化回调
	 */
	onConfigChange(callback: (config: IMessagingModuleConfig) => void): void {
		this.configChangeListeners.add(callback);
	}

	/**
	 * 移除配置变化监听器
	 *
	 * @param callback - 配置变化回调
	 */
	offConfigChange(callback: (config: IMessagingModuleConfig) => void): void {
		this.configChangeListeners.delete(callback);
	}

	/**
	 * 验证当前配置
	 *
	 * @returns 验证结果
	 */
	async validateConfig(): Promise<boolean> {
		try {
			await this.ensureInitialized();
			const validationResult = await this.configManager.validate('messaging', this.config);
			return validationResult.valid;
		} catch {
			return false;
		}
	}

	/**
	 * 重新加载配置
	 */
	async reloadConfig(): Promise<void> {
		await this.loadConfig();

		// 通知所有监听器
		for (const listener of this.configChangeListeners) {
			try {
				if (this.config) {
					listener(this.config);
				}
			} catch {
				// 处理监听器错误
			}
		}
	}

	/**
	 * 获取配置统计信息
	 *
	 * @returns 配置统计
	 */
	getConfigStatistics(): {
		enabled: boolean;
		queuesCount: number;
		handlersCount: number;
		listenersCount: number;
		lastUpdated: Date | null;
		isValid: boolean;
	} {
		return {
			enabled: this.config?.enabled || false,
			queuesCount: this.config ? Object.keys(this.config.queues).length : 0,
			handlersCount: this.config ? Object.keys(this.config.handlers).length : 0,
			listenersCount: this.configChangeListeners.size,
			lastUpdated: null, // 可以从配置管理器获取
			isValid: this.config !== null
		};
	}

	/**
	 * 销毁配置服务
	 */
	async destroy(): Promise<void> {
		try {
			// 清空监听器
			this.configChangeListeners.clear();

			// 重置状态
			this.config = null;
			this.initialized = false;
		} catch (error) {
			throw new Error(`MessagingConfigService销毁失败: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

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
			this.config = await this.configManager.getModuleConfig<IMessagingModuleConfig>('messaging');
		} catch (error) {
			throw new Error(`加载messaging配置失败: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * 处理配置变化事件
	 *
	 * @param event - 配置变化事件
	 */
	private async handleConfigChange(_event: IConfigChangeEvent): Promise<void> {
		try {
			// 重新加载配置
			await this.loadConfig();

			// 通知所有监听器
			for (const listener of this.configChangeListeners) {
				try {
					if (this.config) {
						listener(this.config);
					}
				} catch {
					// 处理监听器错误
				}
			}
		} catch {
			// 处理配置变化错误
		}
	}
}

/**
 * 创建messaging配置服务
 *
 * @param configManager - 配置管理器
 * @returns 配置服务实例
 */
export async function createMessagingConfigService(configManager: IConfigManager): Promise<MessagingConfigService> {
	const service = new MessagingConfigService(configManager);
	await service.initialize();
	return service;
}
