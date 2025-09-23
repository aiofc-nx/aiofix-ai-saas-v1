/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 数据库隔离策略接口定义
 *
 * @description 定义多租户数据隔离的策略和级别
 * 支持多种隔离模式，确保租户数据的安全隔离
 *
 * ## 设计原则
 *
 * ### 隔离级别原则
 * - 支持从无隔离到完全隔离的多个级别
 * - 隔离级别可以根据业务需求灵活配置
 * - 不同隔离级别有不同的性能和安全特性
 *
 * ### 策略实现原则
 * - 隔离策略必须透明，不影响业务逻辑
 * - 支持动态切换隔离策略
 * - 隔离策略必须保证数据安全
 * - 提供隔离效果的验证机制
 *
 * @since 1.0.0
 */

import type { TenantContext } from './tenant-context.interface';
import type { ICleanupResult } from './cleanup-result.interface';

/**
 * 数据库隔离级别枚举
 *
 * @description 定义多租户数据隔离的不同级别
 * 从无隔离到完全隔离，提供灵活的隔离选择
 *
 * ## 隔离级别说明
 *
 * ### NONE - 无隔离
 * - 所有租户共享相同的数据空间
 * - 性能最高，但无数据隔离保证
 * - 适用于非多租户场景或测试环境
 *
 * ### ROW - 行级隔离
 * - 通过行级过滤实现租户隔离
 * - 在SQL查询中自动添加租户条件
 * - 性能较好，但需要应用层保证
 *
 * ### SCHEMA - 模式隔离
 * - 每个租户使用独立的数据库模式
 * - 提供更好的隔离性和安全性
 * - 支持租户级别的数据库管理
 *
 * ### DATABASE - 数据库隔离
 * - 每个租户使用完全独立的数据库
 * - 最高级别的隔离和安全性
 * - 支持独立的备份、恢复、扩展
 *
 * @example
 * ```typescript
 * // 配置不同的隔离级别
 * const rowLevelConfig = {
 *   isolationLevel: DatabaseIsolationLevel.ROW,
 *   tenantColumn: 'tenant_id'
 * };
 *
 * const schemaLevelConfig = {
 *   isolationLevel: DatabaseIsolationLevel.SCHEMA,
 *   schemaPrefix: 'tenant_'
 * };
 * ```
 */
export enum DatabaseIsolationLevel {
  /** 无隔离 - 所有租户共享数据 */
  NONE = 'none',

  /** 行级隔离 - 通过WHERE条件隔离 */
  ROW = 'row',

  /** 模式隔离 - 每个租户独立模式 */
  SCHEMA = 'schema',

  /** 数据库隔离 - 每个租户独立数据库 */
  DATABASE = 'database',
}

/**
 * 数据库隔离策略接口
 *
 * @description 定义多租户数据隔离的具体实现策略
 * 提供SQL隔离、参数处理、权限验证等功能
 *
 * ## 策略职责
 *
 * ### SQL隔离职责
 * - 自动修改SQL语句添加租户条件
 * - 确保查询只能访问租户数据
 * - 支持复杂查询的隔离处理
 *
 * ### 参数处理职责
 * - 自动注入租户相关参数
 * - 验证参数的租户一致性
 * - 处理参数的安全转换
 *
 * ### 权限验证职责
 * - 验证租户对数据的访问权限
 * - 检查跨租户操作的合法性
 * - 提供细粒度的权限控制
 *
 * @example
 * ```typescript
 * // 实现行级隔离策略
 * class RowLevelIsolationStrategy implements IDatabaseIsolationStrategy {
 *   isolateQuery(sql: string, context: TenantContext): string {
 *     // 自动添加租户条件
 *     if (sql.toLowerCase().includes('where')) {
 *       return sql + ` AND tenant_id = '${context.tenantId}'`;
 *     } else {
 *       return sql + ` WHERE tenant_id = '${context.tenantId}'`;
 *     }
 *   }
 *
 *   isolateParams(params: any[], context: TenantContext): any[] {
 *     return [...params, context.tenantId];
 *   }
 * }
 * ```
 */
export interface IDatabaseIsolationStrategy {
  /**
   * 隔离SQL查询
   *
   * @description 修改SQL查询语句，添加租户隔离条件
   * 确保查询只能访问当前租户的数据
   *
   * @param sql - 原始SQL查询语句
   * @param context - 租户上下文信息
   * @returns 隔离后的SQL语句
   *
   * @example
   * ```typescript
   * const isolatedSql = strategy.isolateQuery(
   *   'SELECT * FROM users WHERE status = ?',
   *   { tenantId: 'tenant-123' }
   * );
   * // 结果: 'SELECT * FROM users WHERE status = ? AND tenant_id = ?'
   * ```
   */
  isolateQuery(sql: string, context: TenantContext): string;

  /**
   * 隔离查询参数
   *
   * @description 修改查询参数，添加租户相关参数
   * 确保参数与隔离后的SQL语句匹配
   *
   * @param params - 原始查询参数数组
   * @param context - 租户上下文信息
   * @returns 隔离后的参数数组
   *
   * @example
   * ```typescript
   * const isolatedParams = strategy.isolateParams(
   *   ['active'],
   *   { tenantId: 'tenant-123' }
   * );
   * // 结果: ['active', 'tenant-123']
   * ```
   */
  isolateParams(params: any[], context: TenantContext): any[];

  /**
   * 获取租户数据库连接配置
   *
   * @description 根据租户上下文生成特定的数据库连接配置
   * 支持模式级和数据库级隔离
   *
   * @param baseConfig - 基础数据库配置
   * @param context - 租户上下文信息
   * @returns 租户特定的连接配置
   *
   * @example
   * ```typescript
   * const tenantConfig = strategy.getTenantConnectionConfig(
   *   { host: 'localhost', database: 'myapp' },
   *   { tenantId: 'tenant-123' }
   * );
   * // 可能结果: { host: 'localhost', database: 'myapp_tenant_123' }
   * ```
   */
  getTenantConnectionConfig(baseConfig: any, context: TenantContext): any;

  /**
   * 验证租户数据访问权限
   *
   * @description 验证租户是否有权限执行指定的数据库操作
   * 提供细粒度的权限控制
   *
   * @param sql - 要执行的SQL语句
   * @param context - 租户上下文信息
   * @returns 是否有访问权限
   *
   * @throws {TenantAccessError} 权限验证失败时抛出
   *
   * @example
   * ```typescript
   * const hasAccess = await strategy.validateTenantAccess(
   *   'SELECT * FROM sensitive_data',
   *   { tenantId: 'tenant-123', userId: 'user-456' }
   * );
   * if (!hasAccess) {
   *   throw new Error('租户权限不足');
   * }
   * ```
   */
  validateTenantAccess(sql: string, context: TenantContext): Promise<boolean>;

  /**
   * 清理租户数据
   *
   * @description 安全清理指定租户的所有数据
   * 支持级联删除和数据完整性检查
   *
   * @param tenantId - 要清理的租户ID
   * @returns 清理操作结果统计
   *
   * @throws {TenantAccessError} 租户权限验证失败
   * @throws {DatabaseError} 数据清理失败
   *
   * @example
   * ```typescript
   * const result = await strategy.cleanupTenantData('tenant-to-delete');
   * console.log(`清理完成: ${result.deletedRecords}/${result.totalRecords}`);
   * ```
   */
  cleanupTenantData(tenantId: string): Promise<ICleanupResult>;
}
