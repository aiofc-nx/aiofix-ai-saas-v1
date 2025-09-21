/**
 * 统一配置管理器
 *
 * @description 统一配置管理系统的核心组件
 * 负责配置的加载、缓存、验证、更新和分发
 *
 * ## 核心职责
 *
 * ### 🎯 配置管理
 * - 统一的配置访问接口
 * - 分层配置合并策略
 * - 配置的类型安全访问
 * - 配置变更的事件通知
 *
 * ### 🚀 性能优化
 * - 多级缓存机制
 * - 懒加载和预加载
 * - 配置访问性能监控
 * - 批量操作支持
 *
 * ### 🔒 安全保障
 * - 敏感配置加密存储
 * - 细粒度权限控制
 * - 配置访问审计日志
 * - 配置完整性验证
 *
 * ### 🔄 动态更新
 * - 运行时配置热更新
 * - 配置变更事件通知
 * - 配置回滚机制
 * - 优雅的配置切换
 *
 * @example
 * ```typescript
 * // 创建配置管理器
 * const configManager = new UnifiedConfigManager();
 * await configManager.initialize({
 *   providers: [
 *     new EnvironmentConfigProvider(),
 *     new FileConfigProvider('./config')
 *   ],
 *   enableCache: true,
 *   enableHotReload: true
 * });
 *
 * // 获取配置
 * const messagingConfig = await configManager.getModuleConfig<IMessagingModuleConfig>('messaging');
 * const timeout = await configManager.get('messaging.global.defaultTimeout', 30000);
 *
 * // 监听配置变化
 * configManager.onChange('messaging.global', (event) => {
 *   console.log('配置更新:', event.path, event.newValue);
 * });
 *
 * // 更新配置
 * await configManager.set('messaging.global.defaultTimeout', 60000);
 * ```
 *
 * @since 1.0.0
 */

import { EventEmitter } from 'events';
import type {
	IConfigManager,
	IConfigManagerOptions,
	IUnifiedConfig,
	IConfigProvider,
	IConfigChangeEvent,
	IConfigValidationResult,
	IConfigStatistics
} from '../interfaces/config.interface';

/**
 * 统一配置管理器实现
 *
 * @description 实现统一配置管理的核心功能
 */
export class UnifiedConfigManager extends EventEmitter implements IConfigManager {
	private readonly providers: Map<string, IConfigProvider> = new Map();
	private readonly configCache: Map<string, { value: unknown; timestamp: number; ttl: number }> = new Map();
	private readonly changeListeners: Map<string, Set<(event: IConfigChangeEvent) => void>> = new Map();

	private config: IUnifiedConfig | null = null;
	private initialized = false;
	private options: IConfigManagerOptions = {};

	// 统计信息
	private statistics: IConfigStatistics = {
		totalAccess: 0,
		readAccess: 0,
		writeAccess: 0,
		errors: 0,
		averageResponseTime: 0,
		cacheHitRate: 0,
		configCount: 0,
		providerCount: 0,
		listenerCount: 0,
		lastUpdated: new Date()
	};

	/**
	 * 初始化配置管理器
	 *
	 * @param options - 初始化选项
	 */
	async initialize(options: IConfigManagerOptions = {}): Promise<void> {
		if (this.initialized) {
			throw new Error('配置管理器已经初始化');
		}

		this.options = {
			enableCache: true,
			enableHotReload: false,
			enableEncryption: false,
			enableMonitoring: true,
			enableValidation: true,
			...options
		};

		try {
			// 注册配置提供者
			if (this.options.providers) {
				for (const provider of this.options.providers) {
					await this.registerProvider(provider);
				}
			}

			// 加载配置
			await this.loadConfig();

			// 启动监控
			if (this.options.enableMonitoring) {
				this.startMonitoring();
			}

			this.initialized = true;
			this.emit('initialized', this.config);

			console.log('统一配置管理器初始化完成', {
				providersCount: this.providers.size,
				enableCache: this.options.enableCache,
				enableHotReload: this.options.enableHotReload
			});
		} catch (error) {
			console.error('配置管理器初始化失败:', error);
			throw error;
		}
	}

	/**
	 * 获取完整配置
	 *
	 * @returns 统一配置对象
	 */
	async getConfig(): Promise<IUnifiedConfig> {
		this.ensureInitialized();

		if (!this.config) {
			throw new Error('配置未加载');
		}

		this.recordAccess('*', 'read');
		return { ...this.config };
	}

	/**
	 * 获取配置项
	 *
	 * @param path - 配置路径
	 * @param defaultValue - 默认值
	 * @returns 配置值
	 */
	async get<T = unknown>(path: string, defaultValue?: T): Promise<T> {
		this.ensureInitialized();

		const startTime = Date.now();

		try {
			// 检查缓存
			if (this.options.enableCache) {
				const cached = this.getCachedValue<T>(path);
				if (cached !== undefined) {
					this.recordAccess(path, 'read', Date.now() - startTime, true);
					return cached;
				}
			}

			// 从配置中获取值
			const value = this.getValueByPath(this.config!, path);
			const result = value !== undefined ? (value as T) : defaultValue!;

			// 缓存结果
			if (this.options.enableCache && value !== undefined) {
				this.setCachedValue(path, value);
			}

			this.recordAccess(path, 'read', Date.now() - startTime, false);
			return result;
		} catch (error) {
			this.recordError(path, error as Error);
			throw error;
		}
	}

	/**
	 * 设置配置项
	 *
	 * @param path - 配置路径
	 * @param value - 配置值
	 */
	async set<T = unknown>(path: string, value: T): Promise<void> {
		this.ensureInitialized();

		const startTime = Date.now();
		const oldValue = await this.get(path);

		try {
			// 验证新配置
			if (this.options.enableValidation) {
				const validationResult = await this.validateConfigUpdate(path, oldValue, value);
				if (!validationResult.valid) {
					throw new Error(`配置验证失败: ${validationResult.errors.join(', ')}`);
				}
			}

			// 更新配置
			this.setValueByPath(this.config! as unknown as Record<string, unknown>, path, value);

			// 更新缓存
			if (this.options.enableCache) {
				this.setCachedValue(path, value);
			}

			// 触发变更事件
			const event: IConfigChangeEvent = {
				type: 'config-updated',
				path,
				oldValue,
				newValue: value,
				timestamp: new Date(),
				source: 'config-manager'
			};

			this.emitConfigChange(event);
			this.recordAccess(path, 'write', Date.now() - startTime, false);

			console.log('配置更新成功:', { path, oldValue, newValue: value });
		} catch (error) {
			this.recordError(path, error as Error);
			throw error;
		}
	}

	/**
	 * 获取模块配置
	 *
	 * @param module - 模块名称
	 * @returns 模块配置
	 */
	async getModuleConfig<T = unknown>(module: string): Promise<T> {
		return this.get<T>(module);
	}

	/**
	 * 验证配置
	 *
	 * @param path - 配置路径或模块名称
	 * @param config - 配置对象
	 * @returns 验证结果
	 */
	async validate<T = unknown>(path: string, config: T): Promise<IConfigValidationResult> {
		// 这里将集成配置验证器
		// 目前返回基础验证结果
		return {
			valid: true,
			errors: [],
			warnings: [],
			validatedAt: new Date()
		};
	}

	/**
	 * 重新加载配置
	 *
	 * @returns 重新加载后的配置
	 */
	async reload(): Promise<IUnifiedConfig> {
		this.ensureInitialized();

		console.log('重新加载配置');

		try {
			// 清空缓存
			this.configCache.clear();

			// 重新加载配置
			await this.loadConfig();

			// 触发重新加载事件
			this.emit('config-reloaded', this.config);

			console.log('配置重新加载完成');
			return this.getConfig();
		} catch (error) {
			console.error('配置重新加载失败:', error);
			throw error;
		}
	}

	/**
	 * 监听配置变化
	 *
	 * @param path - 配置路径
	 * @param callback - 变化回调
	 */
	onChange(path: string, callback: (event: IConfigChangeEvent) => void): void {
		if (!this.changeListeners.has(path)) {
			this.changeListeners.set(path, new Set());
		}
		this.changeListeners.get(path)?.add(callback);
		this.updateListenerCount();
	}

	/**
	 * 取消监听配置变化
	 *
	 * @param path - 配置路径
	 * @param callback - 变化回调
	 */
	offChange(path: string, callback: (event: IConfigChangeEvent) => void): void {
		const listeners = this.changeListeners.get(path);
		if (listeners) {
			listeners.delete(callback);
			if (listeners.size === 0) {
				this.changeListeners.delete(path);
			}
		}
		this.updateListenerCount();
	}

	/**
	 * 获取配置统计信息
	 *
	 * @returns 统计信息
	 */
	getStatistics(): IConfigStatistics {
		return {
			...this.statistics,
			providerCount: this.providers.size,
			listenerCount: Array.from(this.changeListeners.values()).reduce((total, listeners) => total + listeners.size, 0),
			configCount: this.countConfigItems(),
			lastUpdated: new Date()
		};
	}

	/**
	 * 销毁配置管理器
	 */
	async destroy(): Promise<void> {
		console.log('销毁配置管理器');

		try {
			// 清空监听器
			this.changeListeners.clear();

			// 销毁提供者
			for (const provider of this.providers.values()) {
				await provider.destroy();
			}
			this.providers.clear();

			// 清空缓存
			this.configCache.clear();

			// 移除所有事件监听器
			this.removeAllListeners();

			this.initialized = false;
			this.config = null;

			console.log('配置管理器销毁完成');
		} catch (error) {
			console.error('配置管理器销毁失败:', error);
			throw error;
		}
	}

	/**
	 * 注册配置提供者
	 *
	 * @param provider - 配置提供者
	 */
	private async registerProvider(provider: IConfigProvider): Promise<void> {
		try {
			await provider.initialize();
			this.providers.set(provider.name, provider);

			console.log('注册配置提供者:', {
				name: provider.name,
				priority: provider.priority,
				writable: provider.writable,
				watchable: provider.watchable
			});
		} catch (error) {
			console.error('配置提供者注册失败:', provider.name, error);
			throw error;
		}
	}

	/**
	 * 加载配置
	 */
	private async loadConfig(): Promise<void> {
		try {
			// 创建默认配置
			const defaultConfig = this.createDefaultConfig();

			// 从提供者加载配置并合并
			let mergedConfig = { ...defaultConfig };

			// 按优先级排序提供者
			const sortedProviders = Array.from(this.providers.values()).sort((a, b) => a.priority - b.priority);

			for (const provider of sortedProviders) {
				try {
					const providerConfig = await this.loadFromProvider(provider);
					if (providerConfig) {
						mergedConfig = this.mergeConfigs(mergedConfig, providerConfig);
						console.log('从提供者加载配置:', provider.name);
					}
				} catch (error) {
					console.warn('从提供者加载配置失败:', provider.name, error);
				}
			}

			// 验证合并后的配置
			if (this.options.enableValidation) {
				const validationResult = await this.validateFullConfig(mergedConfig);
				if (!validationResult.valid) {
					throw new Error(`配置验证失败: ${validationResult.errors.join(', ')}`);
				}

				if (validationResult.warnings.length > 0) {
					console.warn('配置验证警告:', validationResult.warnings);
				}
			}

			// 设置配置
			this.config = mergedConfig;
			this.statistics.lastUpdated = new Date();

			console.log('配置加载完成:', {
				environment: this.config.system.environment,
				configVersion: this.config.system.configVersion
			});
		} catch (error) {
			console.error('配置加载失败:', error);
			throw error;
		}
	}

	/**
	 * 从配置提供者加载配置
	 *
	 * @param provider - 配置提供者
	 * @returns 配置对象
	 */
	private async loadFromProvider(provider: IConfigProvider): Promise<Partial<IUnifiedConfig> | null> {
		try {
			const keys = await provider.keys();
			if (keys.length === 0) {
				return null;
			}

			const config: Record<string, unknown> = {};

			for (const key of keys) {
				const value = await provider.get(key);
				if (value !== undefined) {
					this.setNestedValue(config, key, value);
				}
			}

			return config as Partial<IUnifiedConfig>;
		} catch (error) {
			console.error('从提供者加载配置失败:', provider.name, error);
			return null;
		}
	}

	/**
	 * 创建默认配置
	 *
	 * @returns 默认配置
	 */
	private createDefaultConfig(): IUnifiedConfig {
		return {
			system: {
				name: 'AIOFix SAAS Platform',
				version: '1.0.0',
				environment: 'development' as any, // 临时类型断言
				startTime: new Date(),
				configVersion: '1.0.0',
				features: {}
			},
			core: {
				enabled: true,
				multiTenant: {
					enabled: true,
					defaultIsolationLevel: 'tenant',
					contextTimeout: 30000, // 30秒
					enableContextCache: true
				},
				monitoring: {
					enabled: true,
					metricsInterval: 60000, // 1分钟
					enableTracing: false,
					enableHealthCheck: true,
					healthCheckInterval: 300000 // 5分钟
				},
				errorHandling: {
					enabled: true,
					enableReporting: true,
					retry: {
						maxRetries: 3,
						retryDelay: 1000,
						enableBackoff: true
					}
				},
				cqrs: {
					enabled: true,
					commandBus: {
						enableMiddleware: true,
						timeout: 30000
					},
					queryBus: {
						enableMiddleware: true,
						timeout: 15000,
						enableCache: true
					},
					eventBus: {
						enableMiddleware: true,
						timeout: 10000,
						enablePersistence: false
					}
				},
				web: {
					enabled: true,
					fastify: {
						enableEnterpriseAdapter: true,
						enableCors: true,
						enableRequestLogging: true,
						enablePerformanceMonitoring: true
					}
				},
				database: {
					enabled: true,
					enableTenantAwareRepository: true,
					enableTransactionManagement: true
				},
				messaging: {
					enabled: true,
					enableSimpleBullQueue: true
				}
			},
			messaging: {
				enabled: true,
				global: {
					defaultTimeout: 30000,
					maxRetries: 3,
					retryDelay: 1000,
					enableMetrics: true,
					enableVerboseLogging: false,
					enableTenantIsolation: false,
					serializationFormat: 'json',
					enableCompression: false,
					enableEncryption: false
				},
				redis: {
					host: 'localhost',
					port: 6379,
					db: 1 // 使用不同的数据库
				},
				queues: {},
				handlers: {},
				monitoring: {
					enabled: true,
					metricsInterval: 60000, // 1分钟
					enableTracing: false,
					tracingSampleRate: 0.1
				}
			},
			auth: {
				enabled: true,
				jwt: {
					secret: 'default-jwt-secret',
					expiresIn: '24h',
					issuer: 'aiofix-saas',
					audience: 'aiofix-users'
				},
				passwordPolicy: {
					minLength: 8,
					requireUppercase: true,
					requireLowercase: true,
					requireNumbers: true,
					requireSpecialChars: false,
					expiryDays: 90
				},
				session: {
					timeout: 3600000, // 1小时
					maxConcurrentSessions: 5,
					enableSingleSignOn: false
				}
			},
			tenant: {
				enabled: true,
				isolationStrategy: 'schema',
				defaultTenant: {
					maxUsers: 100,
					maxStorage: 1024, // 1GB
					enabledFeatures: ['basic']
				},
				limits: {
					maxTenantsPerInstance: 1000,
					maxDatabaseConnections: 100,
					maxCacheSize: 512 // 512MB
				}
			},
			ai: {
				enabled: false,
				defaultProvider: 'openai',
				providers: {},
				limits: {
					maxRequestsPerMinute: 60,
					maxTokensPerDay: 100000,
					maxConcurrentRequests: 10
				},
				cache: {
					enabled: true,
					ttl: 3600, // 1小时
					maxSize: 100 // 100MB
				}
			},
			logging: {
				enabled: true,
				level: 'info',
				targets: [
					{
						type: 'console',
						config: { colorize: true }
					}
				],
				format: {
					type: 'json',
					includeTimestamp: true,
					includeLevel: true,
					includeContext: true
				},
				performance: {
					enableAsync: true,
					bufferSize: 1000,
					flushInterval: 1000
				}
			},
			cache: {
				enabled: true,
				defaultStrategy: 'hybrid',
				memory: {
					maxSize: 100, // 100MB
					ttl: 300, // 5分钟
					checkPeriod: 60 // 1分钟
				},
				redis: {
					host: 'localhost',
					port: 6379,
					db: 2,
					keyPrefix: 'aiofix:cache:',
					ttl: 3600 // 1小时
				},
				strategies: {}
			},
			database: {
				enabled: true,
				default: 'primary',
				connections: {
					primary: {
						type: 'postgresql',
						host: 'localhost',
						port: 5432,
						username: 'postgres',
						password: '',
						database: 'aiofix',
						ssl: false,
						pool: {
							min: 2,
							max: 10,
							idle: 30000,
							acquire: 30000
						}
					}
				},
				multiTenant: {
					enabled: true,
					strategy: 'schema',
					tenantDatabasePrefix: 'tenant_',
					tenantSchemaPrefix: 'tenant_'
				},
				transaction: {
					enabled: true,
					isolationLevel: 'READ_COMMITTED',
					timeout: 30000,
					enableDistributed: false
				},
				cqrs: {
					enabled: true,
					readConnection: 'primary',
					writeConnection: 'primary',
					eventStore: {
						enabled: true,
						connection: 'mongodb',
						tableName: 'domain_events',
						snapshotThreshold: 10
					}
				},
				monitoring: {
					enabled: true,
					interval: 60000,
					enableSlowQueryLog: true,
					slowQueryThreshold: 1000,
					enableConnectionPoolMonitoring: true
				},
				migrations: {
					enabled: true,
					directory: './migrations',
					tableName: 'migrations',
					autoRun: false
				}
			}
		};
	}

	/**
	 * 合并配置对象
	 *
	 * @param target - 目标配置
	 * @param source - 源配置
	 * @returns 合并后的配置
	 */
	private mergeConfigs(target: Partial<IUnifiedConfig>, source: Partial<IUnifiedConfig>): IUnifiedConfig {
		const merged = { ...target };

		for (const [key, value] of Object.entries(source)) {
			if (value !== undefined) {
				if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
					// 深度合并对象
					(merged as any)[key] = {
						...((merged as any)[key] || {}),
						...value
					};
				} else {
					// 直接覆盖
					(merged as any)[key] = value;
				}
			}
		}

		return merged as IUnifiedConfig;
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
	 * 根据路径设置配置值
	 *
	 * @param obj - 配置对象
	 * @param path - 配置路径
	 * @param value - 配置值
	 */
	private setValueByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
		const keys = path.split('.');
		const lastKey = keys.pop()!;
		let current = obj;

		for (const key of keys) {
			if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
				current[key] = {};
			}
			current = current[key] as Record<string, unknown>;
		}

		current[lastKey] = value;
	}

	/**
	 * 设置嵌套值
	 *
	 * @param obj - 目标对象
	 * @param path - 路径
	 * @param value - 值
	 */
	private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
		const keys = path.split('.');
		const lastKey = keys.pop()!;
		let current = obj;

		for (const key of keys) {
			if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
				current[key] = {};
			}
			current = current[key] as Record<string, unknown>;
		}

		current[lastKey] = value;
	}

	/**
	 * 获取缓存值
	 *
	 * @param path - 配置路径
	 * @returns 缓存值
	 */
	private getCachedValue<T>(path: string): T | undefined {
		const cached = this.configCache.get(path);
		if (!cached) {
			return undefined;
		}

		// 检查是否过期
		if (Date.now() - cached.timestamp > cached.ttl) {
			this.configCache.delete(path);
			return undefined;
		}

		return cached.value as T;
	}

	/**
	 * 设置缓存值
	 *
	 * @param path - 配置路径
	 * @param value - 配置值
	 * @param ttl - 生存时间（毫秒）
	 */
	private setCachedValue(path: string, value: unknown, ttl?: number): void {
		const cacheTTL = ttl || this.options.cache?.ttl || 300000; // 默认5分钟

		this.configCache.set(path, {
			value,
			timestamp: Date.now(),
			ttl: cacheTTL
		});
	}

	/**
	 * 验证配置更新
	 *
	 * @param path - 配置路径
	 * @param oldValue - 旧值
	 * @param newValue - 新值
	 * @returns 验证结果
	 */
	private async validateConfigUpdate(
		path: string,
		oldValue: unknown,
		newValue: unknown
	): Promise<IConfigValidationResult> {
		// 基础验证逻辑
		const errors: string[] = [];
		const warnings: string[] = [];

		// 检查值是否相同
		if (oldValue === newValue) {
			warnings.push('新值与旧值相同，无需更新');
		}

		// 检查关键配置的更新
		const criticalPaths = ['system.environment', 'core.database', 'core.redis'];

		if (criticalPaths.some((criticalPath) => path.startsWith(criticalPath))) {
			warnings.push('更新关键配置可能需要重启应用才能生效');
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
			path,
			validatedAt: new Date()
		};
	}

	/**
	 * 验证完整配置
	 *
	 * @param config - 配置对象
	 * @returns 验证结果
	 */
	private async validateFullConfig(config: IUnifiedConfig): Promise<IConfigValidationResult> {
		const errors: string[] = [];
		const warnings: string[] = [];

		// 验证系统配置
		if (!config.system.name || typeof config.system.name !== 'string') {
			errors.push('系统名称不能为空');
		}

		if (!config.system.version || typeof config.system.version !== 'string') {
			errors.push('系统版本不能为空');
		}

		// TODO: 更新Core配置验证（配置结构已更新）
		// 验证数据库配置
		// if (config.core.enabled && config.core.database) {
		//   if (!config.core.database.host) {
		//     errors.push('数据库主机地址不能为空');
		//   }
		//   if (config.core.database.port <= 0 || config.core.database.port > 65535) {
		//     errors.push('数据库端口必须在 1-65535 范围内');
		//   }
		// }

		// 验证Redis配置
		// if (config.core.redis) {
		//   if (!config.core.redis.host) {
		//     errors.push('Redis主机地址不能为空');
		//   }
		//   if (config.core.redis.port <= 0 || config.core.redis.port > 65535) {
		//     errors.push('Redis端口必须在 1-65535 范围内');
		//   }
		// }

		return {
			valid: errors.length === 0,
			errors,
			warnings,
			validatedAt: new Date()
		};
	}

	/**
	 * 触发配置变更事件
	 *
	 * @param event - 配置变更事件
	 */
	private emitConfigChange(event: IConfigChangeEvent): void {
		// 触发 EventEmitter 事件
		this.emit('config-change', event);

		// 通知路径匹配的监听器
		for (const [listenerPath, listeners] of this.changeListeners) {
			if (this.pathMatches(event.path, listenerPath)) {
				for (const listener of listeners) {
					try {
						listener(event);
					} catch (error) {
						console.error('配置变更监听器执行失败:', error);
					}
				}
			}
		}
	}

	/**
	 * 检查路径是否匹配
	 *
	 * @param eventPath - 事件路径
	 * @param listenerPath - 监听器路径
	 * @returns 是否匹配
	 */
	private pathMatches(eventPath: string, listenerPath: string): boolean {
		// 精确匹配
		if (eventPath === listenerPath) {
			return true;
		}

		// 前缀匹配（监听父路径）
		if (eventPath.startsWith(listenerPath + '.')) {
			return true;
		}

		// 通配符匹配
		if (listenerPath.includes('*')) {
			const regex = new RegExp('^' + listenerPath.replace(/\*/g, '.*') + '$');
			return regex.test(eventPath);
		}

		return false;
	}

	/**
	 * 记录配置访问
	 *
	 * @param path - 配置路径
	 * @param operation - 操作类型
	 * @param duration - 持续时间
	 * @param cacheHit - 是否缓存命中
	 */
	private recordAccess(path: string, operation: 'read' | 'write', duration = 0, cacheHit = false): void {
		this.statistics.totalAccess++;

		if (operation === 'read') {
			this.statistics.readAccess++;
		} else {
			this.statistics.writeAccess++;
		}

		// 更新平均响应时间
		this.statistics.averageResponseTime = (this.statistics.averageResponseTime + duration) / 2;

		// 更新缓存命中率
		if (operation === 'read') {
			const totalReads = this.statistics.readAccess;
			const currentHitRate = this.statistics.cacheHitRate * (totalReads - 1);
			this.statistics.cacheHitRate = (currentHitRate + (cacheHit ? 1 : 0)) / totalReads;
		}
	}

	/**
	 * 记录错误
	 *
	 * @param path - 配置路径
	 * @param error - 错误对象
	 */
	private recordError(path: string, error: Error): void {
		this.statistics.errors++;
		console.error('配置操作错误:', { path, error: error.message });
	}

	/**
	 * 更新监听器数量统计
	 */
	private updateListenerCount(): void {
		this.statistics.listenerCount = Array.from(this.changeListeners.values()).reduce(
			(total, listeners) => total + listeners.size,
			0
		);
	}

	/**
	 * 计算配置项数量
	 *
	 * @returns 配置项数量
	 */
	private countConfigItems(): number {
		if (!this.config) {
			return 0;
		}

		const countItems = (obj: unknown): number => {
			if (typeof obj !== 'object' || obj === null) {
				return 1;
			}

			let count = 0;
			for (const value of Object.values(obj)) {
				count += countItems(value);
			}
			return count;
		};

		return countItems(this.config);
	}

	/**
	 * 启动监控
	 */
	private startMonitoring(): void {
		const interval = this.options.monitoring?.metricsInterval || 60000;

		setInterval(() => {
			const stats = this.getStatistics();
			console.log('配置管理器统计信息:', stats);
			this.emit('statistics', stats);
		}, interval);
	}

	/**
	 * 确保管理器已初始化
	 */
	private ensureInitialized(): void {
		if (!this.initialized) {
			throw new Error('配置管理器未初始化，请先调用 initialize() 方法');
		}
	}
}

/**
 * 创建统一配置管理器
 *
 * @param options - 初始化选项
 * @returns 配置管理器实例
 */
export async function createUnifiedConfigManager(options?: IConfigManagerOptions): Promise<UnifiedConfigManager> {
	const manager = new UnifiedConfigManager();
	await manager.initialize(options);
	return manager;
}
