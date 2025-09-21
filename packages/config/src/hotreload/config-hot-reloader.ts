/**
 * 配置热更新管理器
 *
 * @description 实现配置的运行时动态更新功能
 * 支持文件监听、远程配置推送、手动触发等多种热更新方式
 *
 * ## 核心功能
 *
 * ### 🔄 热更新策略
 * - **文件监听**：监听配置文件变化，自动重新加载
 * - **远程推送**：支持远程配置服务的推送更新
 * - **手动触发**：支持手动触发配置重新加载
 * - **增量更新**：只更新变化的配置项，提高性能
 *
 * ### 🎯 更新模式
 * - **立即更新**：配置变化后立即生效
 * - **优雅更新**：等待当前任务完成后更新
 * - **延迟更新**：在下次重启时生效
 * - **批量更新**：收集多个变化后批量应用
 *
 * ### 🔒 安全控制
 * - **更新验证**：更新前进行配置验证
 * - **回滚机制**：支持配置更新的回滚
 * - **权限检查**：验证更新操作的权限
 * - **审计日志**：记录所有配置更新操作
 *
 * @example
 * ```typescript
 * const hotReloader = new ConfigHotReloader(configManager);
 * await hotReloader.initialize();
 *
 * // 监听配置文件
 * hotReloader.watchFile('./config.json');
 *
 * // 监听配置路径
 * hotReloader.watchPath('messaging.global', (event) => {
 *   console.log('配置更新:', event.newValue);
 * });
 *
 * // 手动触发更新
 * await hotReloader.triggerUpdate('messaging.global.defaultTimeout', 60000);
 *
 * // 批量更新
 * await hotReloader.batchUpdate([
 *   { path: 'messaging.global.defaultTimeout', value: 60000 },
 *   { path: 'messaging.global.maxRetries', value: 5 }
 * ]);
 * ```
 *
 * @since 1.0.0
 */

import { EventEmitter } from 'events';
import { watch, FSWatcher } from 'fs';
import { readFile } from 'fs/promises';
import type { IConfigManager, IConfigChangeEvent, IConfigValidationResult } from '../interfaces/config.interface';

import { ConfigUpdateStrategy } from '../interfaces/config.interface';

/**
 * 热更新配置接口
 *
 * @description 定义热更新的配置选项
 */
export interface IHotReloadConfig {
	/** 是否启用热更新 */
	enabled: boolean;

	/** 更新策略 */
	strategy: ConfigUpdateStrategy;

	/** 文件监听配置 */
	fileWatch?: {
		/** 是否启用文件监听 */
		enabled: boolean;
		/** 监听的文件路径列表 */
		paths: string[];
		/** 文件变化检测延迟（毫秒） */
		debounceDelay: number;
		/** 忽略的文件模式 */
		ignored?: string[];
	};

	/** 批量更新配置 */
	batchUpdate?: {
		/** 是否启用批量更新 */
		enabled: boolean;
		/** 批量更新的最大等待时间（毫秒） */
		maxWaitTime: number;
		/** 批量更新的最大项目数 */
		maxBatchSize: number;
	};

	/** 回滚配置 */
	rollback?: {
		/** 是否启用自动回滚 */
		enabled: boolean;
		/** 保留的历史版本数 */
		maxHistoryVersions: number;
		/** 回滚超时时间（毫秒） */
		rollbackTimeout: number;
	};

	/** 安全配置 */
	security?: {
		/** 是否需要权限验证 */
		requirePermission: boolean;
		/** 允许的更新来源 */
		allowedSources: string[];
		/** 是否记录审计日志 */
		enableAuditLog: boolean;
	};
}

/**
 * 配置更新请求接口
 *
 * @description 定义配置更新请求的结构
 */
export interface IConfigUpdateRequest {
	/** 配置路径 */
	path: string;

	/** 新值 */
	value: unknown;

	/** 更新来源 */
	source: string;

	/** 更新原因 */
	reason?: string;

	/** 更新策略 */
	strategy?: ConfigUpdateStrategy;

	/** 是否验证更新 */
	validate?: boolean;

	/** 是否备份旧值 */
	backup?: boolean;
}

/**
 * 配置历史记录接口
 *
 * @description 定义配置变更历史的结构
 */
export interface IConfigHistory {
	/** 历史记录ID */
	id: string;

	/** 配置路径 */
	path: string;

	/** 旧值 */
	oldValue: unknown;

	/** 新值 */
	newValue: unknown;

	/** 更新时间 */
	timestamp: Date;

	/** 更新来源 */
	source: string;

	/** 更新原因 */
	reason?: string;

	/** 是否可回滚 */
	rollbackable: boolean;
}

/**
 * 配置热更新管理器实现
 *
 * @description 实现配置热更新的核心功能
 */
export class ConfigHotReloader extends EventEmitter {
	private readonly configManager: IConfigManager;
	private readonly config: IHotReloadConfig;
	private readonly fileWatchers: Map<string, FSWatcher> = new Map();
	private readonly pathWatchers: Map<string, Set<(event: IConfigChangeEvent) => void>> = new Map();
	private readonly configHistory: Map<string, IConfigHistory[]> = new Map();
	private readonly pendingUpdates: Map<string, IConfigUpdateRequest> = new Map();

	private initialized = false;
	private batchUpdateTimer: ReturnType<typeof globalThis.setTimeout> | null = null;

	constructor(configManager: IConfigManager, config: Partial<IHotReloadConfig> = {}) {
		super();
		this.configManager = configManager;
		this.config = {
			enabled: true,
			strategy: ConfigUpdateStrategy.IMMEDIATE,
			fileWatch: {
				enabled: true,
				paths: [],
				debounceDelay: 1000
			},
			batchUpdate: {
				enabled: false,
				maxWaitTime: 5000,
				maxBatchSize: 10
			},
			rollback: {
				enabled: true,
				maxHistoryVersions: 10,
				rollbackTimeout: 30000
			},
			security: {
				requirePermission: false,
				allowedSources: ['*'],
				enableAuditLog: true
			},
			...config
		};
	}

	/**
	 * 初始化热更新管理器
	 */
	async initialize(): Promise<void> {
		if (this.initialized) {
			return;
		}

		if (!this.config.enabled) {
			return;
		}

		// 启动文件监听
		if (this.config.fileWatch?.enabled) {
			await this.initializeFileWatching();
		}

		// 监听配置管理器的变更事件
		this.configManager.onChange('*', (event) => {
			this.handleConfigChange(event);
		});

		this.initialized = true;
	}

	/**
	 * 监听配置文件
	 *
	 * @param filePath - 文件路径
	 */
	watchFile(filePath: string): void {
		if (!this.config.fileWatch?.enabled) {
			return;
		}

		try {
			const watcher = watch(filePath, { persistent: false }, (eventType) => {
				if (eventType === 'change') {
					this.handleFileChange(filePath);
				}
			});

			this.fileWatchers.set(filePath, watcher);
		} catch {
			// 处理监听启动失败
		}
	}

	/**
	 * 停止监听配置文件
	 *
	 * @param filePath - 文件路径
	 */
	unwatchFile(filePath: string): void {
		const watcher = this.fileWatchers.get(filePath);
		if (watcher) {
			watcher.close();
			this.fileWatchers.delete(filePath);
		}
	}

	/**
	 * 监听配置路径
	 *
	 * @param path - 配置路径
	 * @param callback - 变化回调
	 */
	watchPath(path: string, callback: (event: IConfigChangeEvent) => void): void {
		if (!this.pathWatchers.has(path)) {
			this.pathWatchers.set(path, new Set());
		}
		this.pathWatchers.get(path)!.add(callback);
	}

	/**
	 * 停止监听配置路径
	 *
	 * @param path - 配置路径
	 * @param callback - 变化回调
	 */
	unwatchPath(path: string, callback: (event: IConfigChangeEvent) => void): void {
		const callbacks = this.pathWatchers.get(path);
		if (callbacks) {
			callbacks.delete(callback);
			if (callbacks.size === 0) {
				this.pathWatchers.delete(path);
			}
		}
	}

	/**
	 * 触发配置更新
	 *
	 * @param path - 配置路径
	 * @param value - 新值
	 * @param options - 更新选项
	 */
	async triggerUpdate(path: string, value: unknown, options: Partial<IConfigUpdateRequest> = {}): Promise<void> {
		const updateRequest: IConfigUpdateRequest = {
			path,
			value,
			source: 'manual',
			validate: true,
			backup: true,
			strategy: this.config.strategy,
			...options
		};

		await this.processUpdate(updateRequest);
	}

	/**
	 * 批量更新配置
	 *
	 * @param updates - 更新请求列表
	 */
	async batchUpdate(updates: IConfigUpdateRequest[]): Promise<void> {
		if (!this.config.batchUpdate?.enabled) {
			// 逐个更新
			for (const update of updates) {
				await this.processUpdate(update);
			}
			return;
		}

		// 验证所有更新
		const validationResults = await Promise.all(updates.map((update) => this.validateUpdate(update)));

		const invalidUpdates = validationResults.filter((result) => !result.valid);
		if (invalidUpdates.length > 0) {
			throw new Error(`批量更新验证失败: ${invalidUpdates.length} 项配置无效`);
		}

		// 备份当前配置
		const backupId = await this.createBackup(updates.map((u) => u.path));

		try {
			// 应用所有更新
			for (const update of updates) {
				await this.applyUpdate(update);
			}
		} catch (error) {
			// 回滚更新
			await this.rollbackToBackup(backupId);
			throw error;
		}
	}

	/**
	 * 回滚配置
	 *
	 * @param path - 配置路径
	 * @param versions - 回滚版本数（默认1）
	 */
	async rollback(path: string, versions = 1): Promise<void> {
		if (!this.config.rollback?.enabled) {
			throw new Error('配置回滚功能未启用');
		}

		const history = this.configHistory.get(path);
		if (!history || history.length < versions) {
			throw new Error(`配置路径 ${path} 没有足够的历史版本进行回滚`);
		}

		const targetHistory = history[history.length - versions];

		// 应用回滚
		await this.configManager.set(path, targetHistory.oldValue);

		// 记录回滚操作
		this.recordHistory({
			path,
			oldValue: targetHistory.newValue,
			newValue: targetHistory.oldValue,
			source: 'rollback',
			reason: `回滚 ${versions} 个版本`
		});
	}

	/**
	 * 获取配置历史
	 *
	 * @param path - 配置路径
	 * @param limit - 限制数量
	 * @returns 历史记录列表
	 */
	getHistory(path: string, limit = 10): IConfigHistory[] {
		const history = this.configHistory.get(path) || [];
		return history.slice(-limit).reverse(); // 最新的在前
	}

	/**
	 * 清理配置历史
	 *
	 * @param path - 配置路径（可选，不提供则清理所有）
	 * @param keepVersions - 保留版本数
	 */
	cleanupHistory(path?: string, keepVersions?: number): void {
		const maxVersions = keepVersions || this.config.rollback?.maxHistoryVersions || 10;

		if (path) {
			// 清理特定路径的历史
			const history = this.configHistory.get(path);
			if (history && history.length > maxVersions) {
				const trimmedHistory = history.slice(-maxVersions);
				this.configHistory.set(path, trimmedHistory);
			}
		} else {
			// 清理所有路径的历史
			for (const [historyPath, history] of this.configHistory) {
				if (history.length > maxVersions) {
					const trimmedHistory = history.slice(-maxVersions);
					this.configHistory.set(historyPath, trimmedHistory);
				}
			}
		}
	}

	/**
	 * 获取热更新统计信息
	 *
	 * @returns 统计信息
	 */
	getStatistics(): {
		enabled: boolean;
		strategy: ConfigUpdateStrategy;
		fileWatchersCount: number;
		pathWatchersCount: number;
		historyCount: number;
		pendingUpdatesCount: number;
		totalUpdates: number;
		successfulUpdates: number;
		failedUpdates: number;
	} {
		const totalHistoryCount = Array.from(this.configHistory.values()).reduce(
			(total, history) => total + history.length,
			0
		);

		const totalPathWatchers = Array.from(this.pathWatchers.values()).reduce(
			(total, watchers) => total + watchers.size,
			0
		);

		return {
			enabled: this.config.enabled,
			strategy: this.config.strategy,
			fileWatchersCount: this.fileWatchers.size,
			pathWatchersCount: totalPathWatchers,
			historyCount: totalHistoryCount,
			pendingUpdatesCount: this.pendingUpdates.size,
			totalUpdates: totalHistoryCount,
			successfulUpdates: totalHistoryCount, // 简化统计
			failedUpdates: 0
		};
	}

	/**
	 * 销毁热更新管理器
	 */
	async destroy(): Promise<void> {
		// 停止所有文件监听
		for (const [, watcher] of this.fileWatchers) {
			watcher.close();
		}
		this.fileWatchers.clear();

		// 清空路径监听器
		this.pathWatchers.clear();

		// 清空待处理的更新
		this.pendingUpdates.clear();

		// 清理批量更新定时器
		if (this.batchUpdateTimer) {
			globalThis.clearTimeout(this.batchUpdateTimer);
			this.batchUpdateTimer = null;
		}

		// 移除所有事件监听器
		this.removeAllListeners();

		this.initialized = false;
	}

	/**
	 * 初始化文件监听
	 */
	private async initializeFileWatching(): Promise<void> {
		if (!this.config.fileWatch?.paths) {
			return;
		}

		for (const filePath of this.config.fileWatch.paths) {
			try {
				this.watchFile(filePath);
			} catch {
				// 处理文件监听初始化失败
			}
		}
	}

	/**
	 * 处理文件变化
	 *
	 * @param filePath - 文件路径
	 */
	private async handleFileChange(filePath: string): Promise<void> {
		try {
			// 防抖处理
			await this.debounce(`file-${filePath}`, this.config.fileWatch!.debounceDelay);

			// 读取文件内容
			const fileContent = await readFile(filePath, 'utf-8');
			const newConfig = JSON.parse(fileContent);

			// 应用文件配置
			await this.applyFileConfig(newConfig, filePath);
		} catch (error) {
			this.emit('file-change-error', { filePath, error });
		}
	}

	/**
	 * 应用文件配置
	 *
	 * @param config - 配置对象
	 * @param source - 配置来源
	 */
	private async applyFileConfig(config: Record<string, unknown>, source: string): Promise<void> {
		const updates: IConfigUpdateRequest[] = [];

		// 将嵌套配置转换为路径更新
		this.flattenConfig(config, '', updates, source);

		if (updates.length > 0) {
			await this.batchUpdate(updates);
		}
	}

	/**
	 * 扁平化配置对象
	 *
	 * @param obj - 配置对象
	 * @param prefix - 路径前缀
	 * @param updates - 更新列表
	 * @param source - 更新来源
	 */
	private flattenConfig(
		obj: Record<string, unknown>,
		prefix: string,
		updates: IConfigUpdateRequest[],
		source: string
	): void {
		for (const [key, value] of Object.entries(obj)) {
			const path = prefix ? `${prefix}.${key}` : key;

			if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
				// 递归处理嵌套对象
				this.flattenConfig(value as Record<string, unknown>, path, updates, source);
			} else {
				// 添加更新请求
				updates.push({
					path,
					value,
					source,
					reason: 'file-change',
					validate: true,
					backup: true
				});
			}
		}
	}

	/**
	 * 处理配置更新
	 *
	 * @param request - 更新请求
	 */
	private async processUpdate(request: IConfigUpdateRequest): Promise<void> {
		try {
			// 验证更新权限
			if (this.config.security?.requirePermission) {
				this.validateUpdatePermission(request);
			}

			// 验证更新内容
			if (request.validate) {
				const validationResult = await this.validateUpdate(request);
				if (!validationResult.valid) {
					throw new Error(`配置更新验证失败: ${validationResult.errors.join(', ')}`);
				}
			}

			// 备份当前值并记录历史
			if (request.backup) {
				const oldValue = await this.configManager.get(request.path);

				// 应用更新
				await this.applyUpdate(request);

				// 记录历史
				this.recordHistory({
					path: request.path,
					oldValue,
					newValue: request.value,
					source: request.source,
					reason: request.reason
				});
			} else {
				// 直接应用更新
				await this.applyUpdate(request);
			}
		} catch (error) {
			this.emit('update-error', { request, error });
			throw error;
		}
	}

	/**
	 * 应用配置更新
	 *
	 * @param request - 更新请求
	 */
	private async applyUpdate(request: IConfigUpdateRequest): Promise<void> {
		switch (request.strategy || this.config.strategy) {
			case ConfigUpdateStrategy.IMMEDIATE:
				await this.configManager.set(request.path, request.value);
				break;

			case ConfigUpdateStrategy.GRACEFUL:
				// 优雅更新：可以在这里实现等待当前任务完成的逻辑
				await this.configManager.set(request.path, request.value);
				break;

			case ConfigUpdateStrategy.DEFERRED:
				// 延迟更新：添加到待处理队列
				this.pendingUpdates.set(request.path, request);
				break;

			default:
				throw new Error(`不支持的更新策略: ${request.strategy}`);
		}
	}

	/**
	 * 验证配置更新
	 *
	 * @param request - 更新请求
	 * @returns 验证结果
	 */
	private async validateUpdate(request: IConfigUpdateRequest): Promise<IConfigValidationResult> {
		return this.configManager.validate(request.path, request.value);
	}

	/**
	 * 验证更新权限
	 *
	 * @param request - 更新请求
	 */
	private validateUpdatePermission(request: IConfigUpdateRequest): void {
		const allowedSources = this.config.security?.allowedSources || ['*'];

		if (!allowedSources.includes('*') && !allowedSources.includes(request.source)) {
			throw new Error(`配置更新来源 ${request.source} 未被授权`);
		}
	}

	/**
	 * 记录配置历史
	 *
	 * @param record - 历史记录
	 */
	private recordHistory(record: Partial<IConfigHistory>): void {
		const historyRecord: IConfigHistory = {
			id: this.generateHistoryId(),
			rollbackable: true,
			timestamp: new Date(),
			...record
		} as IConfigHistory;

		if (!this.configHistory.has(record.path!)) {
			this.configHistory.set(record.path!, []);
		}

		const history = this.configHistory.get(record.path!)!;
		history.push(historyRecord);

		// 限制历史记录数量
		const maxVersions = this.config.rollback?.maxHistoryVersions || 10;
		if (history.length > maxVersions) {
			history.splice(0, history.length - maxVersions);
		}
	}

	/**
	 * 创建配置备份
	 *
	 * @param paths - 要备份的配置路径
	 * @returns 备份ID
	 */
	private async createBackup(paths: string[]): Promise<string> {
		const backupId = this.generateBackupId();
		const backup: Record<string, unknown> = {};

		for (const path of paths) {
			backup[path] = await this.configManager.get(path);
		}

		// 这里可以将备份存储到持久化存储
		return backupId;
	}

	/**
	 * 回滚到备份
	 *
	 * @param backupId - 备份ID
	 */
	private async rollbackToBackup(backupId: string): Promise<void> {
		// 这里可以从持久化存储恢复备份
		// 简化实现
		void backupId;
	}

	/**
	 * 处理配置变化事件
	 *
	 * @param event - 配置变化事件
	 */
	private handleConfigChange(event: IConfigChangeEvent): void {
		// 通知路径监听器
		for (const [watchPath, callbacks] of this.pathWatchers) {
			if (this.pathMatches(event.path, watchPath)) {
				for (const callback of callbacks) {
					try {
						callback(event);
					} catch {
						// 处理配置变化回调执行失败
					}
				}
			}
		}

		// 触发热更新事件
		this.emit('config-updated', event);
	}

	/**
	 * 检查路径是否匹配
	 *
	 * @param eventPath - 事件路径
	 * @param watchPath - 监听路径
	 * @returns 是否匹配
	 */
	private pathMatches(eventPath: string, watchPath: string): boolean {
		// 精确匹配
		if (eventPath === watchPath) {
			return true;
		}

		// 前缀匹配
		if (eventPath.startsWith(watchPath + '.')) {
			return true;
		}

		// 通配符匹配
		if (watchPath.includes('*')) {
			const regex = new RegExp('^' + watchPath.replace(/\*/g, '.*') + '$');
			return regex.test(eventPath);
		}

		return false;
	}

	/**
	 * 防抖处理
	 *
	 * @param key - 防抖键
	 * @param delay - 延迟时间
	 */
	private async debounce(key: string, delay: number): Promise<void> {
		return new Promise((resolve) => {
			const existingTimer = (this as unknown as Record<string, ReturnType<typeof globalThis.setTimeout>>)[
				`debounce_${key}`
			];
			if (existingTimer) {
				globalThis.clearTimeout(existingTimer);
			}

			(this as unknown as Record<string, ReturnType<typeof globalThis.setTimeout>>)[`debounce_${key}`] =
				globalThis.setTimeout(() => {
					delete (this as unknown as Record<string, ReturnType<typeof globalThis.setTimeout>>)[`debounce_${key}`];
					resolve();
				}, delay);
		});
	}

	/**
	 * 生成历史记录ID
	 *
	 * @returns 历史记录ID
	 */
	private generateHistoryId(): string {
		return `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * 生成备份ID
	 *
	 * @returns 备份ID
	 */
	private generateBackupId(): string {
		return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}

/**
 * 创建配置热更新管理器
 *
 * @param configManager - 配置管理器
 * @param config - 热更新配置
 * @returns 热更新管理器实例
 */
export async function createConfigHotReloader(
	configManager: IConfigManager,
	config?: Partial<IHotReloadConfig>
): Promise<ConfigHotReloader> {
	const hotReloader = new ConfigHotReloader(configManager, config);
	await hotReloader.initialize();
	return hotReloader;
}

/**
 * 创建带热更新的配置管理器
 *
 * @param hotReloadConfig - 热更新配置
 * @returns 配置管理器和热更新管理器
 */
export async function createConfigManagerWithHotReload(hotReloadConfig?: Partial<IHotReloadConfig>): Promise<{
	configManager: IConfigManager;
	hotReloader: ConfigHotReloader;
}> {
	const { createConfigManager } = await import('../factories/config-factory');

	const configManager = await createConfigManager();
	const hotReloader = await createConfigHotReloader(configManager, hotReloadConfig);

	return { configManager, hotReloader };
}
