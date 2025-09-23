/**
 * 租户上下文管理器
 *
 * @description 基于AsyncLocalStorage实现的租户上下文技术管理
 * 提供跨异步操作的租户信息传递能力，这是纯技术实现
 *
 * ## 技术规则
 *
 * ### 上下文传递规则
 * - 租户上下文必须在异步操作中正确传递
 * - 支持嵌套异步操作的上下文继承
 * - 上下文信息应该是只读的，避免意外修改
 * - 支持上下文的安全传递和验证
 *
 * ### 租户隔离规则
 * - 确保不同租户的操作完全隔离
 * - 防止跨租户的数据泄露
 * - 支持租户级别的资源限制
 * - 提供租户上下文的审计追踪
 *
 * @example
 * ```typescript
 * // 设置租户上下文
 * TenantContextManager.run({ tenantId: 'tenant-123' }, async () => {
 *   // 在此作用域内，所有操作都在tenant-123的上下文中
 *   const data = await someService.getData();
 *   // data 自动应用租户隔离
 * });
 *
 * // 获取当前租户上下文
 * const currentTenant = TenantContextManager.getCurrentTenant();
 * if (currentTenant) {
 *   console.log('当前租户:', currentTenant.tenantId);
 * }
 * ```
 *
 * @since 1.0.0
 */

import { AsyncLocalStorage } from 'async_hooks';
import type { CoreConfigService } from '../../../infrastructure/config/core-config.service';

/**
 * 租户上下文数据接口（技术层面）
 */
export interface ITenantContextData {
	/** 租户ID */
	readonly tenantId: string;

	/** 租户代码 */
	readonly tenantCode?: string;

	/** 隔离策略 */
	readonly isolationStrategy?: string;

	/** 数据库连接信息 */
	readonly databaseConfig?: {
		database?: string;
		schema?: string;
		connectionString?: string;
	};

	/** 缓存前缀 */
	readonly cachePrefix?: string;

	/** 扩展属性 */
	readonly metadata?: Record<string, unknown>;

	/** 上下文创建时间 */
	readonly createdAt: Date;

	/** 用户ID */
	readonly userId?: string;

	/** 组织ID */
	readonly organizationId?: string;

	/** 部门ID */
	readonly departmentId?: string;

	/** 请求ID */
	readonly requestId?: string;

	/** 关联ID */
	readonly correlationId?: string;
}

/**
 * 租户上下文管理器
 *
 * @description 基于AsyncLocalStorage实现的租户上下文管理，确保异步操作中的租户隔离
 */
export class TenantContextManager {
	private static readonly storage = new AsyncLocalStorage<ITenantContextData>();
	private static configService: CoreConfigService | null = null;
	private static readonly metrics = {
		contextsCreated: 0,
		contextsDestroyed: 0,
		currentActive: 0
	};

	/**
	 * 设置配置服务
	 *
	 * @description 注入Core配置服务以支持配置驱动的租户行为
	 *
	 * @param configService Core配置服务实例
	 */
	static setConfigService(configService: CoreConfigService): void {
		this.configService = configService;
		// console.log('TenantContextManager配置服务已设置');
	}

	/**
	 * 获取多租户配置
	 *
	 * @description 获取当前的多租户配置
	 *
	 * @returns 多租户配置
	 */
	static async getMultiTenantConfig(): Promise<{
		enabled: boolean;
		strictMode: boolean;
		defaultIsolationLevel: string;
		enableContextValidation: boolean;
	} | null> {
		if (!this.configService) {
			console.warn('TenantContextManager: 配置服务未设置，使用默认配置');
			return {
				enabled: true,
				strictMode: false,
				defaultIsolationLevel: 'ROW',
				enableContextValidation: true
			};
		}

		try {
			const config = await this.configService.getMultiTenantConfig();
			return {
				enabled: config.enabled,
				strictMode: false, // 暂时硬编码，等待配置接口扩展
				defaultIsolationLevel: config.defaultIsolationLevel || 'tenant',
				enableContextValidation: config.enableContextCache !== false // 使用现有字段
			};
		} catch (error) {
			console.error('获取多租户配置失败:', error);
			return null;
		}
	}

	/**
	 * 检查多租户是否启用
	 *
	 * @description 基于配置检查多租户功能是否启用
	 *
	 * @returns 是否启用多租户
	 */
	static async isMultiTenantEnabled(): Promise<boolean> {
		const config = await this.getMultiTenantConfig();
		return config?.enabled ?? true;
	}

	/**
	 * 在指定租户上下文中执行函数
	 *
	 * @param tenantId 租户ID
	 * @param fn 要执行的函数
	 * @returns 函数执行结果
	 */
	static run<T>(tenantIdOrContext: string | ITenantContextData, fn: () => T): T {
		const context =
			typeof tenantIdOrContext === 'string'
				? { tenantId: tenantIdOrContext, createdAt: new Date() }
				: tenantIdOrContext;

		this.metrics.contextsCreated++;
		this.metrics.currentActive++;

		try {
			return this.storage.run(context, fn);
		} finally {
			this.metrics.contextsDestroyed++;
			this.metrics.currentActive--;
		}
	}

	/**
	 * 获取当前租户上下文
	 *
	 * @returns 当前租户上下文，如果不存在则返回undefined
	 */
	static getCurrentTenant(): ITenantContextData | undefined {
		return this.storage.getStore();
	}

	/**
	 * 获取当前租户ID
	 *
	 * @returns 当前租户ID，如果不存在则返回undefined
	 */
	static getCurrentTenantId(): string | undefined {
		return this.getCurrentTenant()?.tenantId;
	}

	/**
	 * 检查是否在租户上下文中
	 *
	 * @returns 是否存在租户上下文
	 */
	static hasTenantContext(): boolean {
		return this.getCurrentTenant() !== undefined;
	}

	/**
	 * 要求必须在租户上下文中执行
	 *
	 * @throws {Error} 如果不在租户上下文中则抛出错误
	 * @returns 当前租户上下文
	 */
	static requireTenantContext(): ITenantContextData {
		const context = this.getCurrentTenant();
		if (!context) {
			throw new Error('操作必须在租户上下文中执行');
		}
		return context;
	}

	/**
	 * 要求必须是指定租户
	 *
	 * @param expectedTenantId 期望的租户ID
	 * @throws {Error} 如果不是指定租户则抛出错误
	 * @returns 当前租户上下文
	 */
	static requireTenant(expectedTenantId: string): ITenantContextData {
		const context = this.requireTenantContext();
		if (context.tenantId !== expectedTenantId) {
			throw new Error(`操作要求租户 ${expectedTenantId}，但当前租户是 ${context.tenantId}`);
		}
		return context;
	}

	/**
	 * 创建子上下文
	 *
	 * @param updates 要更新的上下文信息
	 * @returns 新的上下文对象
	 */
	static createChildContext(updates: Partial<ITenantContextData>): ITenantContextData {
		const current = this.requireTenantContext();
		return {
			...current,
			...updates,
			createdAt: new Date()
		};
	}

	/**
	 * 在子上下文中执行函数
	 *
	 * @param updates 要更新的上下文信息
	 * @param fn 要执行的函数
	 * @returns 函数执行结果
	 */
	static runInChildContext<T>(updates: Partial<ITenantContextData>, fn: () => T): T {
		const childContext = this.createChildContext(updates);
		return this.run(childContext, fn);
	}

	/**
	 * 获取租户的数据库配置
	 *
	 * @returns 数据库配置信息
	 */
	static getDatabaseConfig(): ITenantContextData['databaseConfig'] | undefined {
		return this.getCurrentTenant()?.databaseConfig;
	}

	/**
	 * 获取租户的缓存前缀
	 *
	 * @returns 缓存前缀
	 */
	static getCachePrefix(): string {
		const context = this.getCurrentTenant();
		if (!context) {
			throw new Error('无法获取缓存前缀：不在租户上下文中');
		}
		return context.cachePrefix || `tenant:${context.tenantId}`;
	}

	/**
	 * 获取租户元数据
	 *
	 * @param key 元数据键名
	 * @returns 元数据值
	 */
	static getMetadata(key: string): unknown {
		return this.getCurrentTenant()?.metadata?.[key];
	}

	/**
	 * 验证租户上下文的有效性
	 *
	 * @description 基于配置验证租户上下文的有效性
	 *
	 * @returns 验证结果
	 */
	static async validateContext(): Promise<{
		valid: boolean;
		errors: string[];
		config?: {
			enabled: boolean;
			strictMode: boolean;
			validationEnabled: boolean;
		};
	}> {
		const context = this.getCurrentTenant();
		const errors: string[] = [];

		// 获取多租户配置
		const config = await this.getMultiTenantConfig();

		// 如果多租户未启用，则跳过验证
		if (config && !config.enabled) {
			return {
				valid: true,
				errors: [],
				config: {
					enabled: false,
					strictMode: false,
					validationEnabled: false
				}
			};
		}

		// 如果禁用上下文验证，则跳过验证
		if (config && !config.enableContextValidation) {
			return {
				valid: true,
				errors: [],
				config: {
					enabled: config.enabled,
					strictMode: config.strictMode,
					validationEnabled: false
				}
			};
		}

		if (!context) {
			errors.push('租户上下文不存在');
			return {
				valid: false,
				errors,
				config: {
					enabled: config?.enabled ?? true,
					strictMode: config?.strictMode ?? false,
					validationEnabled: config?.enableContextValidation ?? true
				}
			};
		}

		if (!context.tenantId || typeof context.tenantId !== 'string') {
			errors.push('租户ID无效');
		}

		if (context.tenantId && context.tenantId.length === 0) {
			errors.push('租户ID不能为空');
		}

		// 严格模式下的额外验证
		if (config?.strictMode) {
			if (context.tenantId && context.tenantId.length < 3) {
				errors.push('严格模式下，租户ID长度不能少于3个字符');
			}

			if (!context.tenantCode) {
				errors.push('严格模式下，必须提供租户代码');
			}
		}

		const valid = errors.length === 0;

		if (valid) {
			// console.log(`✅ 租户上下文验证通过: ${context.tenantId}`, {
			//   strictMode: config?.strictMode || false,
			//   validationEnabled: config?.enableContextValidation !== false,
			// });
		} else {
			console.warn(`⚠️ 租户上下文验证失败: ${context.tenantId}`, errors);
		}

		return {
			valid,
			errors,
			config: {
				enabled: config?.enabled ?? true,
				strictMode: config?.strictMode ?? false,
				validationEnabled: config?.enableContextValidation ?? true
			}
		};
	}

	/**
	 * 获取管理器统计信息
	 */
	static getMetrics(): {
		contextsCreated: number;
		contextsDestroyed: number;
		currentActive: number;
	} {
		return { ...this.metrics };
	}

	/**
	 * 重置统计信息
	 */
	static resetMetrics(): void {
		this.metrics.contextsCreated = 0;
		this.metrics.contextsDestroyed = 0;
		this.metrics.currentActive = 0;
	}
}
