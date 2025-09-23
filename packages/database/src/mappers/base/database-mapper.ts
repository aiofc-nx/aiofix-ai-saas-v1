/**
 * 数据库映射器基础类
 *
 * 继承Core模块的映射器基础设施，集成Database模块的特定功能。
 * 提供数据库特定的映射功能，如多租户支持、事务集成、缓存集成等。
 *
 * @description 数据库映射器为Database模块提供映射功能
 *
 * ## 业务规则
 *
 * ### 多租户映射规则
 * - 所有映射操作必须考虑租户隔离
 * - 映射结果必须包含租户信息
 * - 支持租户特定的映射逻辑
 * - 验证跨租户数据访问权限
 *
 * ### 数据库集成规则
 * - 映射器与数据库连接池集成
 * - 支持数据库特定的数据类型转换
 * - 集成数据库事务上下文
 * - 支持数据库性能监控
 *
 * ### 缓存集成规则
 * - 映射结果自动缓存
 * - 支持映射缓存的失效策略
 * - 集成分布式缓存支持
 * - 缓存键基于租户和实体类型
 *
 * @example
 * ```typescript
 * @DatabaseMapper({
 *   domainType: 'User',
 *   tableSchema: 'users',
 *   tenantIsolation: true,
 *   cacheEnabled: true
 * })
 * export class UserDatabaseMapper extends DatabaseDomainMapper<User, UserDbEntity> {
 *   constructor() {
 *     super('UserDatabaseMapper');
 *   }
 *
 *   protected mapToPersistence(user: User): UserDbEntity {
 *     return {
 *       id: user.id.toString(),
 *       tenant_id: user.tenantId,
 *       name: user.name,
 *       email: user.email,
 *       created_at: user.createdAt,
 *       updated_at: user.updatedAt
 *     };
 *   }
 *
 *   protected mapToDomain(dbEntity: UserDbEntity): User {
 *     return User.reconstitute(
 *       EntityId.fromString(dbEntity.id),
 *       dbEntity.name,
 *       dbEntity.email,
 *       dbEntity.tenant_id,
 *       dbEntity.created_at,
 *       dbEntity.updated_at
 *     );
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { BaseDomainMapper, BaseAggregateMapper, MappingError } from '@aiofix/core';
import type { TenantContext } from '../../interfaces';

/**
 * 数据库映射上下文接口
 */
export interface IDatabaseMappingContext {
	/**
	 * 租户上下文
	 */
	tenantContext?: TenantContext;

	/**
	 * 数据库连接信息
	 */
	connectionInfo?: {
		database: string;
		schema?: string;
		table?: string;
	};

	/**
	 * 缓存配置
	 */
	cacheConfig?: {
		enabled: boolean;
		ttl: number;
		keyPrefix: string;
	};

	/**
	 * 性能监控配置
	 */
	performanceConfig?: {
		enabled: boolean;
		slowQueryThreshold: number;
	};
}

/**
 * 数据库映射选项接口
 */
export interface IDatabaseMappingOptions {
	/**
	 * 是否启用租户隔离
	 */
	tenantIsolation?: boolean;

	/**
	 * 是否启用缓存
	 */
	cacheEnabled?: boolean;

	/**
	 * 缓存TTL（秒）
	 */
	cacheTtl?: number;

	/**
	 * 表模式信息
	 */
	tableSchema?: {
		tableName: string;
		schemaName?: string;
		primaryKey?: string;
		tenantColumn?: string;
	};
}

/**
 * 数据库领域映射器
 *
 * @template TDomain - 领域对象类型
 * @template TDbEntity - 数据库实体类型
 */
export abstract class DatabaseDomainMapper<TDomain, TDbEntity> extends BaseDomainMapper<TDomain, TDbEntity> {
	protected readonly options: IDatabaseMappingOptions;

	/**
	 * 构造函数
	 *
	 * @param mapperName - 映射器名称
	 * @param options - 数据库映射选项
	 */
	protected constructor(mapperName: string, options: IDatabaseMappingOptions = {}) {
		super(mapperName);
		this.options = {
			tenantIsolation: true,
			cacheEnabled: true,
			cacheTtl: 300,
			...options
		};
	}

	/**
	 * 带上下文的映射到持久化对象
	 *
	 * @param domainEntity - 领域对象
	 * @param context - 映射上下文
	 * @returns 持久化对象
	 */
	public toPersistenceWithContext(domainEntity: TDomain, context: IDatabaseMappingContext): TDbEntity {
		try {
			// 验证租户上下文
			if (this.options.tenantIsolation && context.tenantContext) {
				this.validateTenantAccess(domainEntity, context.tenantContext);
			}

			// 执行映射
			const result = this.toPersistence(domainEntity);

			// 应用数据库特定的转换
			return this.applyDatabaseTransforms(result, context);
		} catch (error) {
			throw new MappingError(
				`数据库映射失败: ${error instanceof Error ? error.message : String(error)}`,
				'Domain',
				'Database',
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * 带上下文的映射到领域对象
	 *
	 * @param dbEntity - 数据库实体
	 * @param context - 映射上下文
	 * @returns 领域对象
	 */
	public toDomainWithContext(dbEntity: TDbEntity, context: IDatabaseMappingContext): TDomain {
		try {
			// 应用数据库特定的反转换
			const normalizedEntity = this.reverseDatabaseTransforms(dbEntity, context);

			// 执行映射
			const result = this.toDomain(normalizedEntity);

			// 验证租户上下文
			if (this.options.tenantIsolation && context.tenantContext) {
				this.validateTenantAccess(result, context.tenantContext);
			}

			return result;
		} catch (error) {
			throw new MappingError(
				`数据库映射失败: ${error instanceof Error ? error.message : String(error)}`,
				'Database',
				'Domain',
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * 获取缓存键
	 *
	 * @param entityId - 实体ID
	 * @param tenantId - 租户ID
	 * @returns 缓存键
	 */
	public getCacheKey(entityId: string, tenantId?: string): string {
		const baseKey = `${this.mapperName}:${entityId}`;
		return tenantId ? `${tenantId}:${baseKey}` : baseKey;
	}

	/**
	 * 验证租户访问权限
	 *
	 * @param entity - 实体对象
	 * @param tenantContext - 租户上下文
	 * @throws {Error} 当访问权限验证失败时
	 * @protected
	 */
	protected validateTenantAccess(entity: unknown, tenantContext: TenantContext): void {
		// 默认实现检查实体是否有tenantId属性
		if (entity && typeof entity === 'object' && 'tenantId' in entity) {
			const entityTenantId = (entity as any).tenantId;
			if (entityTenantId !== tenantContext.tenantId) {
				throw new Error(
					`租户访问权限验证失败: 实体租户ID ${entityTenantId} 与上下文租户ID ${tenantContext.tenantId} 不匹配`
				);
			}
		}
	}

	/**
	 * 应用数据库特定的转换
	 *
	 * @param entity - 实体对象
	 * @param context - 映射上下文
	 * @returns 转换后的实体
	 * @protected
	 */
	protected applyDatabaseTransforms(entity: TDbEntity, _context: IDatabaseMappingContext): TDbEntity {
		// 默认实现不做转换，子类可以重写
		return entity;
	}

	/**
	 * 反转数据库特定的转换
	 *
	 * @param entity - 数据库实体
	 * @param context - 映射上下文
	 * @returns 反转换后的实体
	 * @protected
	 */
	protected reverseDatabaseTransforms(entity: TDbEntity, _context: IDatabaseMappingContext): TDbEntity {
		// 默认实现不做转换，子类可以重写
		return entity;
	}
}

/**
 * 数据库聚合根映射器
 *
 * @template TAggregateRoot - 聚合根类型
 * @template TDbEntity - 数据库实体类型
 */
export abstract class DatabaseAggregateMapper<TAggregateRoot, TDbEntity> extends BaseAggregateMapper<
	TAggregateRoot,
	TDbEntity
> {
	protected readonly options: IDatabaseMappingOptions;

	/**
	 * 构造函数
	 *
	 * @param mapperName - 映射器名称
	 * @param options - 数据库映射选项
	 */
	protected constructor(mapperName: string, options: IDatabaseMappingOptions = {}) {
		super(mapperName);
		this.options = {
			tenantIsolation: true,
			cacheEnabled: true,
			cacheTtl: 300,
			...options
		};
	}

	/**
	 * 带上下文的聚合根映射（包含事件）
	 *
	 * @param aggregateRoot - 聚合根
	 * @param context - 映射上下文
	 * @returns 持久化对象和事件
	 */
	public toPersistenceWithEventsAndContext(
		aggregateRoot: TAggregateRoot,
		context: IDatabaseMappingContext
	): { entity: TDbEntity; events: unknown[] } {
		try {
			// 验证租户上下文
			if (this.options.tenantIsolation && context.tenantContext) {
				this.validateTenantAccess(aggregateRoot, context.tenantContext);
			}

			// 执行聚合根映射
			const result = this.toPersistenceWithEvents(aggregateRoot);

			// 应用数据库特定的转换
			const transformedEntity = this.applyDatabaseTransforms(result.entity, context);

			return {
				entity: transformedEntity,
				events: result.events
			};
		} catch (error) {
			throw new MappingError(
				`聚合根数据库映射失败: ${error instanceof Error ? error.message : String(error)}`,
				'AggregateRoot',
				'DatabaseWithEvents',
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * 验证租户访问权限
	 *
	 * @param entity - 实体对象
	 * @param tenantContext - 租户上下文
	 * @throws {Error} 当访问权限验证失败时
	 * @protected
	 */
	protected validateTenantAccess(entity: unknown, tenantContext: TenantContext): void {
		// 默认实现检查实体是否有tenantId属性
		if (entity && typeof entity === 'object' && 'tenantId' in entity) {
			const entityTenantId = (entity as any).tenantId;
			if (entityTenantId !== tenantContext.tenantId) {
				throw new Error(
					`租户访问权限验证失败: 实体租户ID ${entityTenantId} 与上下文租户ID ${tenantContext.tenantId} 不匹配`
				);
			}
		}
	}

	/**
	 * 应用数据库特定的转换
	 *
	 * @param entity - 实体对象
	 * @param context - 映射上下文
	 * @returns 转换后的实体
	 * @protected
	 */
	protected applyDatabaseTransforms(entity: TDbEntity, _context: IDatabaseMappingContext): TDbEntity {
		// 默认实现不做转换，子类可以重写
		return entity;
	}
}
