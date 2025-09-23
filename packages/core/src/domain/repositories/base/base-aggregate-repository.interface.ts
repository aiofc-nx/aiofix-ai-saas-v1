/**
 * 基础聚合根仓储接口
 *
 * 定义聚合根仓储的基础契约，聚合根仓储是DDD中专门用于管理聚合根的持久化模式。
 * 聚合根仓储除了基础的CRUD操作外，还需要处理领域事件的存储和发布。
 *
 * @description 基础聚合根仓储接口定义了聚合根仓储必须实现的基础能力
 *
 * ## 业务规则
 *
 * ### 聚合根仓储职责规则
 * - 聚合根仓储负责聚合根的完整生命周期管理
 * - 聚合根仓储必须处理领域事件的存储和发布
 * - 聚合根仓储确保聚合边界内的一致性
 * - 聚合根仓储是事务边界的实现者
 *
 * ### 聚合根事件规则
 * - 聚合根保存时必须同时保存产生的事件
 * - 事件保存和聚合根保存在同一事务中
 * - 事件发布应该在事务提交后进行
 * - 事件发布失败不应该影响聚合根保存
 *
 * ### 聚合根版本规则
 * - 聚合根支持版本控制用于乐观锁
 * - 版本冲突时抛出并发异常
 * - 版本号在每次保存时自动递增
 * - 版本号用于事件溯源的排序
 *
 * ### 聚合根快照规则
 * - 聚合根支持快照机制优化性能
 * - 快照创建不应该影响业务逻辑
 * - 快照应该包含聚合根的完整状态
 * - 快照用于加速聚合根的重建过程
 *
 * @example
 * ```typescript
 * export interface IUserRepository extends IAggregateRepository<UserAggregate, EntityId> {
 *   findByEmail(email: string): Promise<UserAggregate | null>;
 *   findByTenant(tenantId: EntityId): Promise<UserAggregate[]>;
 *   saveWithEvents(user: UserAggregate): Promise<void>;
 * }
 *
 * // 使用示例
 * class UserService {
 *   constructor(private userRepository: IUserRepository) {}
 *
 *   async createUser(name: string, email: string): Promise<UserAggregate> {
 *     const user = UserAggregate.create(EntityId.generate(), name, email);
 *
 *     // 保存聚合根和事件
 *     await this.userRepository.saveWithEvents(user);
 *
 *     return user;
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { EntityId } from '../../value-objects/entity-id';
import { IAggregateRoot } from '../../aggregates/base/aggregate-root.interface';
import { BaseDomainEvent } from '../../events/base/base-domain-event';
import {
  IRepository,
  IRepositoryQueryOptions,
  IPaginatedResult,
} from './base-repository.interface';

/**
 * 聚合根仓储接口
 *
 * 定义聚合根仓储必须实现的基础能力
 *
 * @template TAggregateRoot - 聚合根类型
 * @template TId - 标识符类型
 */
export interface IAggregateRepository<
  TAggregateRoot extends IAggregateRoot,
  TId = EntityId,
> extends IRepository<TAggregateRoot, TId> {
  /**
   * 保存聚合根和事件
   *
   * @description 在事务中保存聚合根和其产生的领域事件
   *
   * @param aggregateRoot - 要保存的聚合根
   * @returns 保存操作的Promise
   *
   * @throws {ConcurrencyError} 当发生版本冲突时
   * @throws {ValidationError} 当数据验证失败时
   *
   * @example
   * ```typescript
   * const user = UserAggregate.create(EntityId.generate(), '张三', 'zhangsan@example.com');
   * user.updateEmail('newemail@example.com'); // 产生领域事件
   *
   * await userRepository.saveWithEvents(user); // 保存聚合根和事件
   * ```
   */
  saveWithEvents(aggregateRoot: TAggregateRoot): Promise<void>;

  /**
   * 根据版本加载聚合根
   *
   * @description 加载指定版本的聚合根，用于事件溯源
   *
   * @param id - 聚合根标识符
   * @param version - 目标版本号
   * @returns 指定版本的聚合根实例
   *
   * @example
   * ```typescript
   * const user = await userRepository.loadAtVersion(userId, 5);
   * console.log(`用户在版本5时的状态: ${user.getName()}`);
   * ```
   */
  loadAtVersion(id: TId, version: number): Promise<TAggregateRoot | null>;

  /**
   * 获取聚合根的事件历史
   *
   * @description 获取聚合根的所有历史事件
   *
   * @param id - 聚合根标识符
   * @param fromVersion - 起始版本（可选）
   * @returns 事件历史列表
   *
   * @example
   * ```typescript
   * const events = await userRepository.getEventHistory(userId);
   * console.log(`用户共产生了 ${events.length} 个事件`);
   * ```
   */
  getEventHistory(id: TId, fromVersion?: number): Promise<BaseDomainEvent[]>;

  /**
   * 重建聚合根
   *
   * @description 从事件历史重建聚合根状态
   *
   * @param id - 聚合根标识符
   * @param toVersion - 目标版本（可选）
   * @returns 重建的聚合根实例
   *
   * @example
   * ```typescript
   * const user = await userRepository.rebuild(userId, 10);
   * console.log(`重建到版本10的用户状态`);
   * ```
   */
  rebuild(id: TId, toVersion?: number): Promise<TAggregateRoot | null>;

  /**
   * 创建快照
   *
   * @description 为聚合根创建快照以优化性能
   *
   * @param aggregateRoot - 聚合根实例
   * @returns 创建快照的Promise
   *
   * @example
   * ```typescript
   * await userRepository.createSnapshot(user);
   * console.log('用户快照创建成功');
   * ```
   */
  createSnapshot(aggregateRoot: TAggregateRoot): Promise<void>;

  /**
   * 获取最新快照
   *
   * @description 获取聚合根的最新快照
   *
   * @param id - 聚合根标识符
   * @returns 最新快照，如果不存在返回null
   *
   * @example
   * ```typescript
   * const snapshot = await userRepository.getLatestSnapshot(userId);
   * if (snapshot) {
   *   console.log(`快照版本: ${snapshot.version}`);
   * }
   * ```
   */
  getLatestSnapshot(
    id: TId,
  ): Promise<IAggregateSnapshot<TAggregateRoot> | null>;

  /**
   * 批量保存聚合根和事件
   *
   * @description 批量保存多个聚合根和它们的事件
   *
   * @param aggregateRoots - 要保存的聚合根数组
   * @returns 保存操作的Promise
   *
   * @example
   * ```typescript
   * const users = [user1, user2, user3];
   * await userRepository.saveAllWithEvents(users);
   * console.log('批量保存聚合根和事件成功');
   * ```
   */
  saveAllWithEvents(aggregateRoots: TAggregateRoot[]): Promise<void>;
}

/**
 * 聚合根快照接口
 */
export interface IAggregateSnapshot<TAggregateRoot extends IAggregateRoot> {
  /**
   * 聚合根标识符
   */
  aggregateId: EntityId;

  /**
   * 快照版本
   */
  version: number;

  /**
   * 聚合根数据
   */
  data: Record<string, unknown>;

  /**
   * 快照创建时间
   */
  createdAt: Date;

  /**
   * 快照类型
   */
  snapshotType: string;

  /**
   * 重建聚合根
   *
   * @returns 重建的聚合根实例
   */
  restore(): TAggregateRoot;
}

/**
 * 事件存储仓储接口
 */
export interface IEventStoreRepository {
  /**
   * 保存事件
   *
   * @param events - 要保存的事件数组
   * @param expectedVersion - 期望的版本号
   * @returns 保存操作的Promise
   */
  saveEvents(events: BaseDomainEvent[], expectedVersion: number): Promise<void>;

  /**
   * 获取事件流
   *
   * @param aggregateId - 聚合根标识符
   * @param fromVersion - 起始版本
   * @returns 事件流
   */
  getEventStream(
    aggregateId: EntityId,
    fromVersion?: number,
  ): Promise<BaseDomainEvent[]>;

  /**
   * 获取所有事件
   *
   * @param fromTimestamp - 起始时间戳
   * @param toTimestamp - 结束时间戳
   * @returns 事件列表
   */
  getAllEvents(
    fromTimestamp?: Date,
    toTimestamp?: Date,
  ): Promise<BaseDomainEvent[]>;
}

/**
 * 读模型仓储接口
 */
export interface IReadModelRepository<TReadModel> {
  /**
   * 根据ID查找读模型
   *
   * @param id - 读模型标识符
   * @returns 读模型实例
   */
  findById(id: string): Promise<TReadModel | null>;

  /**
   * 保存读模型
   *
   * @param readModel - 要保存的读模型
   * @returns 保存操作的Promise
   */
  save(readModel: TReadModel): Promise<void>;

  /**
   * 删除读模型
   *
   * @param id - 读模型标识符
   * @returns 删除操作的Promise
   */
  delete(id: string): Promise<void>;

  /**
   * 根据聚合根ID删除读模型
   *
   * @param aggregateId - 聚合根标识符
   * @returns 删除操作的Promise
   */
  deleteByAggregateId(aggregateId: string): Promise<void>;

  /**
   * 查找多个读模型
   *
   * @param criteria - 查询条件
   * @param options - 查询选项
   * @returns 读模型列表
   */
  findMany(
    criteria: Record<string, unknown>,
    options?: IRepositoryQueryOptions,
  ): Promise<TReadModel[]>;

  /**
   * 分页查询读模型
   *
   * @param criteria - 查询条件
   * @param options - 查询选项
   * @returns 分页结果
   */
  findPaginated(
    criteria: Record<string, unknown>,
    options: IRepositoryQueryOptions,
  ): Promise<IPaginatedResult<TReadModel>>;
}
