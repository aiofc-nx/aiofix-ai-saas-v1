/**
 * 数据库接口统一导出
 *
 * @description 统一导出所有数据库相关的接口和类型定义
 * 提供清晰的模块结构和便捷的导入方式
 *
 * ## 模块组织
 *
 * ### 核心接口
 * - **租户上下文**: TenantContext类型定义
 * - **数据库连接**: IDatabaseConnection接口
 * - **事务管理**: ITransaction接口
 * - **执行结果**: IExecuteResult接口
 *
 * ### 服务接口
 * - **数据库服务**: IDatabaseService接口（从unified文件导入）
 * - **租户感知服务**: ITenantAwareDatabaseService接口（从unified文件导入）
 *
 * ### 仓储接口
 * - **通用仓储**: IRepository接口（从unified文件导入）
 * - **租户仓储**: ITenantAwareRepository接口（从unified文件导入）
 *
 * ### 配置和选项
 * - **查询选项**: IQueryOptions, IExecuteOptions, ITransactionOptions
 * - **查询条件**: IQueryCriteria
 * - **清理结果**: ICleanupResult
 *
 * ### 隔离和错误
 * - **隔离策略**: DatabaseIsolationLevel, IDatabaseIsolationStrategy
 * - **错误类**: DatabaseError及其子类
 *
 * ### 监控和统计
 * - **统计信息**: IDatabaseStats（从unified文件导入）
 * - **健康状态**: IDatabaseHealth（从unified文件导入）
 *
 * @example
 * ```typescript
 * // 导入核心接口
 * import type {
 *   IDatabaseConnection,
 *   ITransaction,
 *   IExecuteResult
 * } from '@aiofix/database';
 *
 * // 导入服务接口
 * import type {
 *   IDatabaseService,
 *   ITenantAwareDatabaseService
 * } from '@aiofix/database';
 *
 * // 导入配置选项
 * import type {
 *   IQueryOptions,
 *   ITransactionOptions
 * } from '@aiofix/database';
 *
 * // 导入错误类
 * import {
 *   DatabaseError,
 *   DatabaseConnectionError
 * } from '@aiofix/database';
 * ```
 *
 * @since 1.0.0
 */

// ==================== 核心类型和接口 ====================

// 租户上下文类型
export type { TenantContext } from './tenant-context.interface';

// 数据库连接接口
export type { IDatabaseConnection } from './connection.interface';

// 事务接口
export type { ITransaction } from './transaction.interface';

// 执行结果接口
export type { IExecuteResult } from './execute-result.interface';

// ==================== 配置和选项接口 ====================

// 查询和操作选项
export type {
  IQueryOptions,
  IExecuteOptions,
  ITransactionOptions,
  IQueryCriteria,
} from './query-options.interface';

// 清理结果接口
export type { ICleanupResult } from './cleanup-result.interface';

// ==================== 隔离策略接口 ====================

// 隔离级别和策略
export { DatabaseIsolationLevel } from './isolation.interface';

export type { IDatabaseIsolationStrategy } from './isolation.interface';

// ==================== 错误类 ====================

// 数据库错误类族（从专门的errors目录导出）
export {
  DatabaseError,
  DatabaseConnectionError,
  DatabaseTransactionError,
  DatabaseQueryError,
} from '../errors';

// ==================== 服务接口 ====================

// 数据库服务接口
export type {
  IDatabaseService,
  ITenantAwareDatabaseService,
} from './database-service.interface';

// ==================== 仓储接口 ====================

// 仓储接口
export type {
  IRepository,
  ITenantAwareRepository,
} from './repository.interface';

// ==================== 统计和健康接口 ====================

// 统计和健康接口
export type {
  IDatabaseStats,
  IDatabaseHealth,
} from './database-stats.interface';
