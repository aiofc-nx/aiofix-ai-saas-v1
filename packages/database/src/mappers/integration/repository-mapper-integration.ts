/**
 * Repository映射器集成
 *
 * 将映射器功能集成到Repository系统中，提供自动化的实体映射功能。
 * 支持Repository操作的透明映射，无需手动调用映射器。
 *
 * @description Repository映射器集成提供Repository与映射器的无缝协作
 *
 * ## 业务规则
 *
 * ### Repository映射集成规则
 * - Repository操作自动应用映射器
 * - 映射器错误自动转换为Repository错误
 * - 支持批量操作的映射优化
 * - 集成事务上下文的映射处理
 *
 * ### 缓存集成规则
 * - 映射结果自动缓存
 * - Repository操作触发缓存更新
 * - 支持分布式缓存的映射结果
 * - 缓存键基于租户和实体类型
 *
 * ### 性能优化规则
 * - 批量映射操作优化
 * - 映射器实例复用
 * - 映射结果预取和缓存
 * - 映射性能监控和告警
 *
 * @example
 * ```typescript
 * // Repository中使用映射器集成
 * @Repository({
 *   entity: User,
 *   mapper: UserDatabaseMapper,
 *   cache: { enabled: true, ttl: 300 }
 * })
 * export class UserRepository extends MappedRepository<User, UserDbEntity> {
 *   // Repository操作自动应用映射器
 *   // 无需手动调用映射方法
 * }
 * ```
 *
 * @since 1.0.0
 */

import { MapperRegistry } from '@aiofix/core';
import type { IDomainMapper, IAggregateMapper } from '@aiofix/core';
import type { TenantContext } from '../../interfaces';
import type { IDatabaseMappingContext } from '../base/database-mapper';
import { DatabaseDomainMapper, DatabaseAggregateMapper } from '../base/database-mapper';

/**
 * 映射Repository接口
 */
export interface IMappedRepository<TDomain, TDbEntity> {
	/**
	 * 获取映射器
	 */
	getMapper(): IDomainMapper<TDomain, TDbEntity>;

	/**
	 * 设置映射上下文
	 */
	setMappingContext(context: IDatabaseMappingContext): void;

	/**
	 * 获取映射上下文
	 */
	getMappingContext(): IDatabaseMappingContext | undefined;
}

/**
 * 映射Repository基础类
 *
 * @template TDomain - 领域对象类型
 * @template TDbEntity - 数据库实体类型
 */
export abstract class MappedRepository<TDomain, TDbEntity> implements IMappedRepository<TDomain, TDbEntity> {
	protected mappingContext?: IDatabaseMappingContext;

	constructor(
		protected readonly mapper: IDomainMapper<TDomain, TDbEntity>,
		protected readonly mapperRegistry: MapperRegistry
	) {}

	/**
	 * 获取映射器
	 *
	 * @returns 映射器实例
	 */
	public getMapper(): IDomainMapper<TDomain, TDbEntity> {
		return this.mapper;
	}

	/**
	 * 设置映射上下文
	 *
	 * @param context - 映射上下文
	 */
	public setMappingContext(context: IDatabaseMappingContext): void {
		this.mappingContext = context;
	}

	/**
	 * 获取映射上下文
	 *
	 * @returns 映射上下文
	 */
	public getMappingContext(): IDatabaseMappingContext | undefined {
		return this.mappingContext;
	}

	/**
	 * 映射领域对象到数据库实体
	 *
	 * @param domainEntity - 领域对象
	 * @returns 数据库实体
	 * @protected
	 */
	protected mapToPersistence(domainEntity: TDomain): TDbEntity {
		if (this.mappingContext && this.mapper instanceof DatabaseDomainMapper) {
			return this.mapper.toPersistenceWithContext(domainEntity, this.mappingContext);
		}
		return this.mapper.toPersistence(domainEntity);
	}

	/**
	 * 映射数据库实体到领域对象
	 *
	 * @param dbEntity - 数据库实体
	 * @returns 领域对象
	 * @protected
	 */
	protected mapToDomain(dbEntity: TDbEntity): TDomain {
		if (this.mappingContext && this.mapper instanceof DatabaseDomainMapper) {
			return this.mapper.toDomainWithContext(dbEntity, this.mappingContext);
		}
		return this.mapper.toDomain(dbEntity);
	}

	/**
	 * 批量映射领域对象到数据库实体
	 *
	 * @param domainEntities - 领域对象数组
	 * @returns 数据库实体数组
	 * @protected
	 */
	protected mapToPersistenceBatch(domainEntities: TDomain[]): TDbEntity[] {
		return this.mapper.toPersistenceBatch(domainEntities);
	}

	/**
	 * 批量映射数据库实体到领域对象
	 *
	 * @param dbEntities - 数据库实体数组
	 * @returns 领域对象数组
	 * @protected
	 */
	protected mapToDomainBatch(dbEntities: TDbEntity[]): TDomain[] {
		return this.mapper.toDomainBatch(dbEntities);
	}

	/**
	 * 创建默认映射上下文
	 *
	 * @param tenantContext - 租户上下文
	 * @returns 映射上下文
	 * @protected
	 */
	protected createMappingContext(tenantContext?: TenantContext): IDatabaseMappingContext {
		return {
			tenantContext,
			cacheConfig: {
				enabled: true,
				ttl: 300,
				keyPrefix: this.mapper.constructor.name.toLowerCase()
			},
			performanceConfig: {
				enabled: true,
				slowQueryThreshold: 1000
			}
		};
	}

	/**
	 * 记录日志
	 *
	 * @param level - 日志级别
	 * @param message - 日志消息
	 * @param context - 上下文信息
	 * @protected
	 */
	protected log(_level: string, _message: string, _context?: Record<string, unknown>): void {
		// TODO: 替换为实际的日志系统
		// console.log(`[${_level.toUpperCase()}] [${this.constructor.name}] ${_message}`, _context);
	}
}

/**
 * 聚合根映射Repository基础类
 *
 * @template TAggregateRoot - 聚合根类型
 * @template TDbEntity - 数据库实体类型
 */
export abstract class MappedAggregateRepository<TAggregateRoot, TDbEntity> extends MappedRepository<
	TAggregateRoot,
	TDbEntity
> {
	constructor(
		protected readonly aggregateMapper: IAggregateMapper<TAggregateRoot, TDbEntity>,
		mapperRegistry: MapperRegistry
	) {
		super(aggregateMapper, mapperRegistry);
	}

	/**
	 * 映射聚合根到数据库实体（包含事件）
	 *
	 * @param aggregateRoot - 聚合根
	 * @returns 数据库实体和事件
	 * @protected
	 */
	protected mapToPersistenceWithEvents(aggregateRoot: TAggregateRoot): {
		entity: TDbEntity;
		events: unknown[];
	} {
		if (this.mappingContext && this.aggregateMapper instanceof DatabaseAggregateMapper) {
			return this.aggregateMapper.toPersistenceWithEventsAndContext(aggregateRoot, this.mappingContext);
		}
		return this.aggregateMapper.toPersistenceWithEvents(aggregateRoot);
	}

	/**
	 * 从数据库实体和事件历史重建聚合根
	 *
	 * @param dbEntity - 数据库实体
	 * @param events - 事件历史
	 * @returns 聚合根
	 * @protected
	 */
	protected mapFromPersistenceWithHistory(dbEntity: TDbEntity, events: unknown[]): TAggregateRoot {
		return this.aggregateMapper.fromPersistenceWithHistory(dbEntity, events);
	}
}
