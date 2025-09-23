/**
 * 事件存储接口定义
 *
 * 定义了事件存储系统的核心接口，包括事件存储、事件流、
 * 快照、版本控制等功能。
 *
 * ## 业务规则
 *
 * ### 事件存储规则
 * - 事件必须按顺序存储，不能乱序
 * - 事件必须具有唯一标识符和版本号
 * - 事件必须支持多租户隔离
 * - 事件必须支持事务性存储
 *
 * ### 事件流规则
 * - 事件流必须按聚合根ID组织
 * - 事件流必须支持版本控制
 * - 事件流必须支持分页查询
 * - 事件流必须支持过滤和排序
 *
 * ### 快照规则
 * - 快照必须定期创建以优化性能
 * - 快照必须支持版本控制
 * - 快照必须支持压缩和清理
 * - 快照必须支持多租户隔离
 *
 * ### 性能规则
 * - 支持批量操作以提高性能
 * - 支持异步处理以提高吞吐量
 * - 支持缓存机制以提高查询性能
 * - 支持索引优化以提高查询效率
 *
 * @description 事件存储接口定义
 * @since 1.0.0
 */

import { Observable } from 'rxjs';
import type { EntityId } from '../../../domain/value-objects/entity-id';
import type { BaseDomainEvent } from '../../../domain/events/base/base-domain-event';
import type { IAsyncContext } from '../../../common/context/async-context.interface';

/**
 * 事件存储选项
 */
export interface IEventStoreOptions {
  /**
   * 是否启用事务
   */
  enableTransaction?: boolean;

  /**
   * 事务超时时间（毫秒）
   */
  transactionTimeout?: number;

  /**
   * 是否启用批量操作
   */
  enableBatch?: boolean;

  /**
   * 批量大小
   */
  batchSize?: number;

  /**
   * 是否启用压缩
   */
  enableCompression?: boolean;

  /**
   * 是否启用加密
   */
  enableEncryption?: boolean;

  /**
   * 是否启用多租户隔离
   */
  enableMultiTenant?: boolean;

  /**
   * 是否启用版本控制
   */
  enableVersioning?: boolean;

  /**
   * 是否启用快照
   */
  enableSnapshot?: boolean;

  /**
   * 快照间隔（事件数量）
   */
  snapshotInterval?: number;

  /**
   * 是否启用缓存
   */
  enableCache?: boolean;

  /**
   * 缓存大小
   */
  cacheSize?: number;

  /**
   * 缓存过期时间（毫秒）
   */
  cacheExpiration?: number;
}

/**
 * 事件存储结果
 */
export interface IEventStoreResult {
  /**
   * 是否成功
   */
  success: boolean;

  /**
   * 错误信息
   */
  error?: string;

  /**
   * 存储的事件数量
   */
  eventCount: number;

  /**
   * 存储时间（毫秒）
   */
  storageTime: number;

  /**
   * 版本信息
   */
  version?: number;

  /**
   * 事务ID
   */
  transactionId?: string;

  /**
   * 元数据
   */
  metadata?: Record<string, unknown>;
}

/**
 * 事件流选项
 */
export interface IEventStreamOptions {
  /**
   * 起始版本号
   */
  fromVersion?: number;

  /**
   * 结束版本号
   */
  toVersion?: number;

  /**
   * 最大事件数量
   */
  maxEvents?: number;

  /**
   * 是否包含已删除的事件
   */
  includeDeleted?: boolean;

  /**
   * 事件类型过滤器
   */
  eventTypes?: string[];

  /**
   * 时间范围过滤器
   */
  timeRange?: {
    from: Date;
    to: Date;
  };

  /**
   * 排序方式
   */
  sortOrder?: 'asc' | 'desc';

  /**
   * 是否启用分页
   */
  enablePagination?: boolean;

  /**
   * 页码
   */
  page?: number;

  /**
   * 每页大小
   */
  pageSize?: number;
}

/**
 * 事件流结果
 */
export interface IEventStreamResult {
  /**
   * 事件列表
   */
  events: BaseDomainEvent[];

  /**
   * 总事件数量
   */
  totalCount: number;

  /**
   * 当前版本号
   */
  currentVersion: number;

  /**
   * 是否有更多事件
   */
  hasMore: boolean;

  /**
   * 下一页页码
   */
  nextPage?: number;

  /**
   * 查询时间（毫秒）
   */
  queryTime: number;

  /**
   * 元数据
   */
  metadata?: Record<string, unknown>;
}

/**
 * 快照选项
 */
export interface ISnapshotOptions {
  /**
   * 快照版本号
   */
  version: number;

  /**
   * 快照数据
   */
  data: Record<string, unknown>;

  /**
   * 快照元数据
   */
  metadata?: Record<string, unknown>;

  /**
   * 是否压缩
   */
  compress?: boolean;

  /**
   * 是否加密
   */
  encrypt?: boolean;

  /**
   * 过期时间
   */
  expirationTime?: Date;
}

/**
 * 快照结果
 */
export interface ISnapshotResult {
  /**
   * 是否成功
   */
  success: boolean;

  /**
   * 错误信息
   */
  error?: string;

  /**
   * 快照ID
   */
  snapshotId: string;

  /**
   * 快照版本号
   */
  version: number;

  /**
   * 快照大小（字节）
   */
  size: number;

  /**
   * 创建时间
   */
  createdAt: Date;

  /**
   * 元数据
   */
  metadata?: Record<string, unknown>;
}

/**
 * 事件存储统计信息
 */
export interface IEventStoreStatistics {
  /**
   * 总事件数量
   */
  totalEvents: number;

  /**
   * 总聚合根数量
   */
  totalAggregates: number;

  /**
   * 总快照数量
   */
  totalSnapshots: number;

  /**
   * 存储大小（字节）
   */
  storageSize: number;

  /**
   * 平均事件大小（字节）
   */
  averageEventSize: number;

  /**
   * 按类型统计
   */
  byEventType: Record<string, number>;

  /**
   * 按聚合根类型统计
   */
  byAggregateType: Record<string, number>;

  /**
   * 按租户统计
   */
  byTenant: Record<string, number>;

  /**
   * 按时间统计
   */
  byTime: {
    lastHour: number;
    lastDay: number;
    lastWeek: number;
    lastMonth: number;
  };

  /**
   * 最后更新时间
   */
  lastUpdatedAt: Date;
}

/**
 * 事件存储接口
 */
export interface IEventStore {
  /**
   * 存储事件
   */
  storeEvents(
    aggregateId: EntityId,
    events: BaseDomainEvent[],
    expectedVersion: number,
    options?: IEventStoreOptions,
    context?: IAsyncContext,
  ): Observable<IEventStoreResult>;

  /**
   * 获取事件流
   */
  getEventStream(
    aggregateId: EntityId,
    options?: IEventStreamOptions,
    context?: IAsyncContext,
  ): Observable<IEventStreamResult>;

  /**
   * 获取所有事件流
   */
  getAllEventStreams(
    options?: IEventStreamOptions,
    context?: IAsyncContext,
  ): Observable<IEventStreamResult>;

  /**
   * 获取事件
   */
  getEvent(
    eventId: string,
    context?: IAsyncContext,
  ): Observable<BaseDomainEvent | null>;

  /**
   * 获取聚合根版本
   */
  getAggregateVersion(
    aggregateId: EntityId,
    context?: IAsyncContext,
  ): Observable<number>;

  /**
   * 检查聚合根是否存在
   */
  existsAggregate(
    aggregateId: EntityId,
    context?: IAsyncContext,
  ): Observable<boolean>;

  /**
   * 删除聚合根
   */
  deleteAggregate(
    aggregateId: EntityId,
    context?: IAsyncContext,
  ): Observable<boolean>;

  /**
   * 创建快照
   */
  createSnapshot(
    aggregateId: EntityId,
    options: ISnapshotOptions,
    context?: IAsyncContext,
  ): Observable<ISnapshotResult>;

  /**
   * 获取快照
   */
  getSnapshot(
    aggregateId: EntityId,
    version?: number,
    context?: IAsyncContext,
  ): Observable<ISnapshotResult | null>;

  /**
   * 删除快照
   */
  deleteSnapshot(
    aggregateId: EntityId,
    version: number,
    context?: IAsyncContext,
  ): Observable<boolean>;

  /**
   * 获取统计信息
   */
  getStatistics(context?: IAsyncContext): Observable<IEventStoreStatistics>;

  /**
   * 清理过期数据
   */
  cleanupExpiredData(
    retentionDays: number,
    context?: IAsyncContext,
  ): Observable<number>;

  /**
   * 备份数据
   */
  backupData(
    backupPath: string,
    options?: Record<string, unknown>,
    context?: IAsyncContext,
  ): Observable<boolean>;

  /**
   * 恢复数据
   */
  restoreData(
    backupPath: string,
    options?: Record<string, unknown>,
    context?: IAsyncContext,
  ): Observable<boolean>;

  /**
   * 健康检查
   */
  healthCheck(context?: IAsyncContext): Observable<boolean>;

  /**
   * 启动存储
   */
  start(): Promise<void>;

  /**
   * 停止存储
   */
  stop(): Promise<void>;

  /**
   * 检查是否已启动
   */
  isStarted(): boolean;
}
