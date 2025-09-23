/**
 * 数据库映射器装饰器
 *
 * 扩展Core模块的映射器装饰器，添加数据库特定的配置和功能。
 * 支持表模式配置、租户隔离、缓存集成等数据库特定功能。
 *
 * @description 数据库映射器装饰器提供数据库特定的映射器配置
 *
 * ## 业务规则
 *
 * ### 表模式配置规则
 * - 映射器必须指定对应的数据库表
 * - 支持多模式（schema）数据库配置
 * - 支持表名和列名的自定义映射
 * - 支持数据库特定的数据类型配置
 *
 * ### 租户隔离配置规则
 * - 映射器可以配置租户隔离策略
 * - 支持行级、模式级、数据库级隔离
 * - 自动注入租户信息到映射结果
 * - 验证租户访问权限
 *
 * ### 缓存配置规则
 * - 映射器可以配置缓存策略
 * - 支持实体级和查询级缓存
 * - 缓存键自动包含租户信息
 * - 支持缓存失效和预热策略
 *
 * @example
 * ```typescript
 * @DatabaseMapper({
 *   domainType: 'User',
 *   tableSchema: {
 *     tableName: 'users',
 *     schemaName: 'public',
 *     primaryKey: 'id',
 *     tenantColumn: 'tenant_id'
 *   },
 *   tenantIsolation: {
 *     enabled: true,
 *     strategy: 'ROW_LEVEL'
 *   },
 *   cache: {
 *     enabled: true,
 *     ttl: 300,
 *     keyPrefix: 'user'
 *   }
 * })
 * export class UserDatabaseMapper extends DatabaseDomainMapper<User, UserDbEntity> {
 *   // 映射器实现
 * }
 * ```
 *
 * @since 1.0.0
 */

import {
  DomainMapper,
  AggregateMapper,
  type IDomainMapperOptions,
} from '@aiofix/core';

/**
 * 租户隔离策略枚举
 */
export enum TenantIsolationStrategy {
  ROW_LEVEL = 'ROW_LEVEL',
  SCHEMA_LEVEL = 'SCHEMA_LEVEL',
  DATABASE_LEVEL = 'DATABASE_LEVEL',
}

/**
 * 表模式配置接口
 */
export interface ITableSchemaConfig {
  /**
   * 表名
   */
  tableName: string;

  /**
   * 模式名
   */
  schemaName?: string;

  /**
   * 主键列名
   */
  primaryKey?: string;

  /**
   * 租户列名
   */
  tenantColumn?: string;

  /**
   * 创建时间列名
   */
  createdAtColumn?: string;

  /**
   * 更新时间列名
   */
  updatedAtColumn?: string;

  /**
   * 软删除列名
   */
  deletedAtColumn?: string;
}

/**
 * 租户隔离配置接口
 */
export interface ITenantIsolationConfig {
  /**
   * 是否启用租户隔离
   */
  enabled: boolean;

  /**
   * 隔离策略
   */
  strategy: TenantIsolationStrategy;

  /**
   * 租户列名（行级隔离时使用）
   */
  tenantColumn?: string;

  /**
   * 租户模式前缀（模式级隔离时使用）
   */
  schemaPrefix?: string;
}

/**
 * 缓存配置接口
 */
export interface ICacheConfig {
  /**
   * 是否启用缓存
   */
  enabled: boolean;

  /**
   * 缓存TTL（秒）
   */
  ttl: number;

  /**
   * 缓存键前缀
   */
  keyPrefix: string;

  /**
   * 是否缓存空值
   */
  cacheNulls?: boolean;
}

/**
 * 数据库映射器选项接口
 */
export interface IDatabaseMapperOptions extends IDomainMapperOptions {
  /**
   * 表模式配置
   */
  tableSchema?: ITableSchemaConfig;

  /**
   * 租户隔离配置
   */
  tenantIsolation?: ITenantIsolationConfig;

  /**
   * 缓存配置
   */
  cache?: ICacheConfig;

  /**
   * 是否启用性能监控
   */
  performanceMonitoring?: boolean;

  /**
   * 慢查询阈值（毫秒）
   */
  slowQueryThreshold?: number;
}

/**
 * 数据库映射器元数据键
 */
export const DATABASE_MAPPER_METADATA_KEY = Symbol('databaseMapper');

/**
 * 数据库映射器装饰器
 *
 * @param options - 数据库映射器配置选项
 * @returns 类装饰器函数
 */
export function DatabaseMapper(
  options: IDatabaseMapperOptions,
): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (target: any) {
    // 设置数据库特定的元数据
    Reflect.defineMetadata(DATABASE_MAPPER_METADATA_KEY, options, target);

    // 调用Core模块的DomainMapper装饰器
    const coreOptions: IDomainMapperOptions = {
      domainType: options.domainType,
      persistenceType: options.persistenceType,
      description: options.description,
      version: options.version,
      category: options.category || 'database',
      tags: [...(options.tags || []), 'database'],
      performance: options.performance,
    };

    return DomainMapper(coreOptions)(target);
  };
}

/**
 * 数据库聚合根映射器装饰器
 *
 * @param options - 数据库映射器配置选项
 * @returns 类装饰器函数
 */
export function DatabaseAggregateMapper(
  options: IDatabaseMapperOptions,
): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (target: any) {
    // 设置数据库特定的元数据
    Reflect.defineMetadata(DATABASE_MAPPER_METADATA_KEY, options, target);

    // 调用Core模块的AggregateMapper装饰器
    const coreOptions: IDomainMapperOptions = {
      domainType: options.domainType,
      persistenceType: options.persistenceType,
      description: options.description,
      version: options.version,
      category: options.category || 'database-aggregate',
      tags: [...(options.tags || []), 'database', 'aggregate'],
      performance: options.performance,
    };

    return AggregateMapper(coreOptions)(target);
  };
}

/**
 * 获取数据库映射器元数据
 *
 * @param target - 目标类或实例
 * @returns 数据库映射器元数据
 */
export function getDatabaseMapperMetadata(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any,
): IDatabaseMapperOptions | undefined {
  return Reflect.getMetadata(DATABASE_MAPPER_METADATA_KEY, target);
}

/**
 * 检查是否为数据库映射器
 *
 * @param target - 要检查的目标
 * @returns 如果是数据库映射器返回true，否则返回false
 */
export function isDatabaseMapper(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any,
): boolean {
  return Reflect.hasMetadata(DATABASE_MAPPER_METADATA_KEY, target);
}
