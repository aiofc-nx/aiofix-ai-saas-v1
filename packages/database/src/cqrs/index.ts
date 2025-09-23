/**
 * Database模块CQRS功能导出
 *
 * @description 导出Database模块的CQRS相关功能
 * 包括命令、查询、事件存储等核心组件
 *
 * @since 1.0.0
 */

// 核心CQRS管理器
export {
  CQRSDatabaseManager,
  createCQRSDatabaseManager,
} from './cqrs-database-manager';

export type {
  IDatabaseCommand,
  IDatabaseQuery,
  IDomainEvent,
  ICommandResult,
  IQueryResult,
  IEventStore,
} from './cqrs-database-manager';

// 数据库命令
export {
  DatabaseCommand,
  TenantAwareDatabaseCommand,
  BatchDatabaseCommand,
  createDatabaseCommand,
  createTenantAwareDatabaseCommand,
  createBatchDatabaseCommand,
} from './database-command';

// 数据库查询
export {
  DatabaseQuery,
  TenantAwareDatabaseQuery,
  PaginatedDatabaseQuery,
  AggregateDatabaseQuery,
  createPaginatedQuery,
  createAggregateQuery,
} from './database-query';

export type { IQueryExecutionOptions } from './database-query';

// 事件存储
export {
  MongoEventStore,
  PostgreSQLEventStore,
  createMongoEventStore,
  createPostgreSQLEventStore,
} from './event-store';

export type { IEventStoreStats, ISnapshotInfo } from './event-store';
