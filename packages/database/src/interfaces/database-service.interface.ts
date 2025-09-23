/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 数据库服务接口定义
 *
 * @description 统一数据库服务的核心接口，提供高级数据库操作
 * 封装了连接管理、事务处理、仓储模式等企业级功能
 *
 * @since 1.0.0
 */

import type { IDatabaseConnection } from './connection.interface';
import type { ITransaction } from './transaction.interface';
import type { IExecuteResult } from './execute-result.interface';
import type {
  IQueryOptions,
  IExecuteOptions,
  ITransactionOptions,
} from './query-options.interface';

/**
 * 数据库服务接口
 */
export interface IDatabaseService {
  query<T>(sql: string, params?: any[], options?: IQueryOptions): Promise<T[]>;
  execute(
    sql: string,
    params?: any[],
    options?: IExecuteOptions,
  ): Promise<IExecuteResult>;
  getConnection(connectionName?: string): Promise<IDatabaseConnection>;
  executeTransaction<T>(
    operation: (trx: ITransaction) => Promise<T>,
    options?: ITransactionOptions,
  ): Promise<T>;
  getRepository<T>(entityClass: new () => T): Promise<IRepository<T>>;
}

/**
 * 租户感知数据库服务接口
 */
export interface ITenantAwareDatabaseService extends IDatabaseService {
  queryByTenant<T>(
    sql: string,
    params?: any[],
    tenantContext?: TenantContext,
  ): Promise<T[]>;
  executeByTenant(
    sql: string,
    params?: any[],
    tenantContext?: TenantContext,
  ): Promise<IExecuteResult>;
  getTenantRepository<T>(
    entityClass: new () => T,
  ): Promise<ITenantAwareRepository<T>>;
  cleanupTenantData(tenantId: string): Promise<ICleanupResult>;
}

// 临时导入，避免循环依赖
import type { TenantContext } from './tenant-context.interface';
import type { ICleanupResult } from './cleanup-result.interface';
import type {
  IRepository,
  ITenantAwareRepository,
} from './repository.interface';
