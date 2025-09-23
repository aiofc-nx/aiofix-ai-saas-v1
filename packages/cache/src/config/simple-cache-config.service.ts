/**
 * 简化Cache模块配置服务
 *
 * @description 基于现有配置结构的简化配置服务
 * 适配当前的统一配置管理系统，后续将完善
 *
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import type { IConfigManager } from '@aiofix/config';

/**
 * 简化Cache配置接口
 */
export interface ISimpleCacheConfig {
	enabled: boolean;
	defaultStrategy: string;
	memory: {
		maxSize: number;
		ttl: number;
		checkPeriod: number;
	};
	redis: {
		host: string;
		port: number;
		db: number;
		keyPrefix: string;
		ttl: number;
	};
	strategies: Record<string, unknown>;
}

/**
 * 简化Cache模块配置服务实现
 */
@Injectable()
export class SimpleCacheConfigService {
	private readonly configManager: IConfigManager;
	private config: ISimpleCacheConfig | null = null;
	private initialized = false;

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
			this.configManager.onChange('cache', () => {
				this.handleConfigChange();
			});

			this.initialized = true;
		} catch (error) {
			throw new Error(`SimpleCacheConfigService初始化失败: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * 获取完整的cache配置
	 */
	async getConfig(): Promise<ISimpleCacheConfig> {
		await this.ensureInitialized();
		if (!this.config) {
			throw new Error('Cache配置未正确初始化');
		}
		return this.config;
	}

	/**
	 * 获取内存配置
	 */
	async getMemoryConfig(): Promise<ISimpleCacheConfig['memory']> {
		const config = await this.getConfig();
		return config.memory;
	}

	/**
	 * 获取Redis配置
	 */
	async getRedisConfig(): Promise<ISimpleCacheConfig['redis']> {
		const config = await this.getConfig();
		return config.redis;
	}

	/**
	 * 检查是否启用
	 */
	async isEnabled(): Promise<boolean> {
		const config = await this.getConfig();
		return config.enabled;
	}

	/**
	 * 获取默认策略
	 */
	async getDefaultStrategy(): Promise<string> {
		const config = await this.getConfig();
		return config.defaultStrategy;
	}

	/**
	 * 销毁配置服务
	 */
	async destroy(): Promise<void> {
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
			this.config = await this.configManager.getModuleConfig<ISimpleCacheConfig>('cache');
		} catch (error) {
			throw new Error(`加载cache配置失败: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * 处理配置变化事件
	 */
	private async handleConfigChange(): Promise<void> {
		try {
			// 重新加载配置
			await this.loadConfig();
		} catch {
			// 处理配置变化错误
		}
	}
}

/**
 * 创建简化cache配置服务
 */
export async function createSimpleCacheConfigService(configManager: IConfigManager): Promise<SimpleCacheConfigService> {
	const service = new SimpleCacheConfigService(configManager);
	await service.initialize();
	return service;
}
