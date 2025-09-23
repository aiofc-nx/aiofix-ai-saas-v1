/**
 * Core模块配置服务
 *
 * @description 基于统一配置管理系统的Core模块配置服务
 * 提供Core模块专用的配置管理功能，支持热更新和监控
 *
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import type { IConfigManager, IConfigChangeEvent } from '@aiofix/config';
import type { ICoreModuleConfig, ICoreConfigStatus } from './core-config.interface';

/**
 * Core模块配置服务实现
 */
@Injectable()
export class CoreConfigService {
	private readonly configManager: IConfigManager;
	private config: ICoreModuleConfig | null = null;
	private initialized = false;
	private readonly configChangeListeners: Set<(config: ICoreModuleConfig) => void> = new Set();

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
			this.configManager.onChange('core', (event: IConfigChangeEvent) => {
				this.handleConfigChange(event);
			});

			this.initialized = true;
		} catch (error) {
			throw new Error(`CoreConfigService初始化失败: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * 获取完整的Core配置
	 */
	async getConfig(): Promise<ICoreModuleConfig> {
		await this.ensureInitialized();
		if (!this.config) {
			throw new Error('Core配置未正确加载');
		}
		return this.config;
	}

	/**
	 * 获取多租户配置
	 */
	async getMultiTenantConfig(): Promise<ICoreModuleConfig['multiTenant']> {
		const config = await this.getConfig();
		return config.multiTenant;
	}

	/**
	 * 获取监控配置
	 */
	async getMonitoringConfig(): Promise<ICoreModuleConfig['monitoring']> {
		const config = await this.getConfig();
		return config.monitoring;
	}

	/**
	 * 获取错误处理配置
	 */
	async getErrorHandlingConfig(): Promise<ICoreModuleConfig['errorHandling']> {
		const config = await this.getConfig();
		return config.errorHandling;
	}

	/**
	 * 获取CQRS配置
	 */
	async getCQRSConfig(): Promise<ICoreModuleConfig['cqrs']> {
		const config = await this.getConfig();
		return config.cqrs;
	}

	/**
	 * 获取Web集成配置
	 */
	async getWebConfig(): Promise<ICoreModuleConfig['web']> {
		const config = await this.getConfig();
		return config.web;
	}

	/**
	 * 获取数据库集成配置
	 */
	async getDatabaseConfig(): Promise<ICoreModuleConfig['database']> {
		const config = await this.getConfig();
		return config.database;
	}

	/**
	 * 获取消息队列集成配置
	 */
	async getMessagingConfig(): Promise<ICoreModuleConfig['messaging']> {
		const config = await this.getConfig();
		return config.messaging;
	}

	/**
	 * 检查Core模块是否启用
	 */
	async isEnabled(): Promise<boolean> {
		const config = await this.getConfig();
		return config.enabled;
	}

	/**
	 * 检查多租户是否启用
	 */
	async isMultiTenantEnabled(): Promise<boolean> {
		const config = await this.getConfig();
		return config.multiTenant.enabled;
	}

	/**
	 * 检查监控是否启用
	 */
	async isMonitoringEnabled(): Promise<boolean> {
		const config = await this.getConfig();
		return config.monitoring.enabled;
	}

	/**
	 * 检查CQRS是否启用
	 */
	async isCQRSEnabled(): Promise<boolean> {
		const config = await this.getConfig();
		return config.cqrs.enabled;
	}

	/**
	 * 监听配置变化
	 */
	onConfigChange(listener: (config: ICoreModuleConfig) => void): void {
		this.configChangeListeners.add(listener);
	}

	/**
	 * 移除配置变化监听器
	 */
	offConfigChange(listener: (config: ICoreModuleConfig) => void): void {
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
	getStatus(): ICoreConfigStatus {
		return {
			initialized: this.initialized,
			version: '1.0.0',
			lastUpdated: null, // 可以从配置管理器获取
			listenersCount: this.configChangeListeners.size,
			hotReloadEnabled: true
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
			this.config = await this.configManager.getModuleConfig<ICoreModuleConfig>('core');
		} catch (error) {
			throw new Error(`加载Core配置失败: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * 处理配置变化事件
	 */
	private async handleConfigChange(_event: IConfigChangeEvent): Promise<void> {
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
 * 创建Core配置服务
 */
export async function createCoreConfigService(configManager: IConfigManager): Promise<CoreConfigService> {
	const service = new CoreConfigService(configManager);
	await service.initialize();
	return service;
}
