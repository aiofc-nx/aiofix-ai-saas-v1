/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 仓储接口定义
 *
 * @description 提供标准的数据访问方法，实现Repository模式
 * 封装数据访问逻辑，提供面向对象的数据操作接口
 *
 * @since 1.0.0
 */

import type { TenantContext } from './tenant-context.interface';
import type { IQueryOptions, IQueryCriteria } from './query-options.interface';

/**
 * 通用仓储接口
 */
export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(options?: IQueryOptions): Promise<T[]>;
  findBy(criteria: IQueryCriteria, options?: IQueryOptions): Promise<T[]>;
  save(entity: T): Promise<void>;
  delete(id: string): Promise<boolean>;
  saveBatch(entities: T[]): Promise<void>;
  count(criteria?: IQueryCriteria): Promise<number>;
}

/**
 * 租户感知仓储接口
 */
export interface ITenantAwareRepository<T> extends IRepository<T> {
  findByTenant(
    criteria?: IQueryCriteria,
    options?: IQueryOptions,
  ): Promise<T[]>;
  saveTenant(entity: T, tenantContext?: TenantContext): Promise<void>;
  deleteTenant(id: string, tenantContext?: TenantContext): Promise<boolean>;
  countByTenant(criteria?: IQueryCriteria): Promise<number>;
}
