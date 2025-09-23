/**
 * 基础仓储接口
 *
 * 定义仓储的基础契约，仓储是DDD中用于封装数据访问逻辑的模式。
 * 仓储提供了领域层与基础设施层之间的抽象，使领域层不依赖具体的持久化技术。
 *
 * @description 基础仓储接口定义了所有仓储必须实现的基础能力
 *
 * ## 业务规则
 *
 * ### 仓储职责规则
 * - 仓储负责聚合根和实体的持久化
 * - 仓储提供基于业务意义的查询方法
 * - 仓储隐藏底层存储技术的复杂性
 * - 仓储确保数据的一致性和完整性
 *
 * ### 仓储查询规则
 * - 仓储查询应该基于业务概念而非技术实现
 * - 仓储查询应该返回完整的领域对象
 * - 仓储查询应该支持业务级别的过滤和排序
 * - 仓储查询应该处理数据不存在的情况
 *
 * ### 仓储持久化规则
 * - 仓储保存操作应该是原子性的
 * - 仓储应该处理并发冲突
 * - 仓储应该验证数据完整性
 * - 仓储应该支持事务操作
 *
 * ### 仓储依赖规则
 * - 仓储接口定义在领域层
 * - 仓储实现在基础设施层
 * - 仓储不应该依赖其他仓储
 * - 仓储可以依赖领域服务
 *
 * @example
 * ```typescript
 * export interface IUserRepository extends IRepository<User, EntityId> {
 *   findByEmail(email: string): Promise<User | null>;
 *   findByTenant(tenantId: EntityId): Promise<User[]>;
 *   isEmailUnique(email: string, excludeId?: EntityId): Promise<boolean>;
 * }
 *
 * // 使用示例
 * class UserService {
 *   constructor(private userRepository: IUserRepository) {}
 *
 *   async createUser(name: string, email: string): Promise<User> {
 *     const isUnique = await this.userRepository.isEmailUnique(email);
 *     if (!isUnique) {
 *       throw new Error('邮箱已存在');
 *     }
 *
 *     const user = User.create(EntityId.generate(), name, email);
 *     await this.userRepository.save(user);
 *     return user;
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { EntityId } from '../../value-objects/entity-id';
import { IEntity } from '../../entities/base/entity.interface';

/**
 * 基础仓储接口
 *
 * 定义仓储必须实现的基础能力
 *
 * @template TEntity - 实体类型
 * @template TId - 标识符类型
 */
export interface IRepository<TEntity extends IEntity, TId = EntityId> {
  /**
   * 根据ID查找实体
   *
   * @description 根据唯一标识符查找实体
   *
   * @param id - 实体标识符
   * @returns 实体实例，如果不存在返回null
   *
   * @example
   * ```typescript
   * const user = await userRepository.findById(userId);
   * if (user) {
   *   console.log(`找到用户: ${user.getName()}`);
   * } else {
   *   console.log('用户不存在');
   * }
   * ```
   */
  findById(id: TId): Promise<TEntity | null>;

  /**
   * 保存实体
   *
   * @description 保存实体到持久化存储
   * 如果实体是新创建的则插入，如果已存在则更新
   *
   * @param entity - 要保存的实体
   * @returns 保存操作的Promise
   *
   * @throws {ConcurrencyError} 当发生并发冲突时
   * @throws {ValidationError} 当数据验证失败时
   *
   * @example
   * ```typescript
   * const user = User.create(EntityId.generate(), '张三', 'zhangsan@example.com');
   * await userRepository.save(user);
   * console.log('用户保存成功');
   * ```
   */
  save(entity: TEntity): Promise<void>;

  /**
   * 删除实体
   *
   * @description 从持久化存储中删除实体
   *
   * @param id - 要删除的实体标识符
   * @returns 删除操作的Promise
   *
   * @example
   * ```typescript
   * await userRepository.delete(userId);
   * console.log('用户删除成功');
   * ```
   */
  delete(id: TId): Promise<void>;

  /**
   * 检查实体是否存在
   *
   * @description 检查指定ID的实体是否存在
   *
   * @param id - 实体标识符
   * @returns 如果存在返回true，否则返回false
   *
   * @example
   * ```typescript
   * const exists = await userRepository.exists(userId);
   * if (exists) {
   *   console.log('用户存在');
   * }
   * ```
   */
  exists(id: TId): Promise<boolean>;

  /**
   * 获取实体总数
   *
   * @description 获取仓储中实体的总数
   *
   * @returns 实体总数
   *
   * @example
   * ```typescript
   * const count = await userRepository.count();
   * console.log(`总共有 ${count} 个用户`);
   * ```
   */
  count(): Promise<number>;

  /**
   * 查找所有实体
   *
   * @description 查找所有实体，支持分页
   *
   * @param options - 查询选项
   * @returns 实体列表
   *
   * @example
   * ```typescript
   * const users = await userRepository.findAll({
   *   page: 1,
   *   limit: 10,
   *   sortBy: 'createdAt',
   *   sortOrder: 'desc'
   * });
   * ```
   */
  findAll(options?: IRepositoryQueryOptions): Promise<TEntity[]>;

  /**
   * 批量保存实体
   *
   * @description 批量保存多个实体，在事务中执行
   *
   * @param entities - 要保存的实体数组
   * @returns 保存操作的Promise
   *
   * @example
   * ```typescript
   * const users = [user1, user2, user3];
   * await userRepository.saveAll(users);
   * console.log('批量保存成功');
   * ```
   */
  saveAll(entities: TEntity[]): Promise<void>;

  /**
   * 批量删除实体
   *
   * @description 批量删除多个实体
   *
   * @param ids - 要删除的实体标识符数组
   * @returns 删除操作的Promise
   *
   * @example
   * ```typescript
   * const userIds = [userId1, userId2, userId3];
   * await userRepository.deleteAll(userIds);
   * console.log('批量删除成功');
   * ```
   */
  deleteAll(ids: TId[]): Promise<void>;
}

/**
 * 仓储查询选项接口
 */
export interface IRepositoryQueryOptions {
  /**
   * 页码（从1开始）
   */
  page?: number;

  /**
   * 每页大小
   */
  limit?: number;

  /**
   * 偏移量
   */
  offset?: number;

  /**
   * 排序字段
   */
  sortBy?: string;

  /**
   * 排序方向
   */
  sortOrder?: 'asc' | 'desc';

  /**
   * 过滤条件
   */
  filters?: Record<string, unknown>;

  /**
   * 包含字段
   */
  includes?: string[];

  /**
   * 排除字段
   */
  excludes?: string[];
}

/**
 * 分页结果接口
 */
export interface IPaginatedResult<T> {
  /**
   * 数据项
   */
  items: T[];

  /**
   * 总数
   */
  total: number;

  /**
   * 当前页
   */
  page: number;

  /**
   * 每页大小
   */
  limit: number;

  /**
   * 总页数
   */
  totalPages: number;

  /**
   * 是否有下一页
   */
  hasNext: boolean;

  /**
   * 是否有上一页
   */
  hasPrevious: boolean;
}

/**
 * 仓储异常基类
 */
export abstract class BaseRepositoryError extends Error {
  abstract readonly errorCode: string;
  abstract readonly errorType: string;

  constructor(
    message: string,
    public readonly repositoryName: string,
    public readonly entityId?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * 并发冲突异常
 */
export class ConcurrencyError extends BaseRepositoryError {
  readonly errorCode = 'CONCURRENCY_ERROR';
  readonly errorType = 'concurrency';

  constructor(
    message: string,
    repositoryName: string,
    entityId: string,
    public readonly expectedVersion: number,
    public readonly actualVersion: number,
  ) {
    super(message, repositoryName, entityId);
  }
}

/**
 * 实体未找到异常
 */
export class EntityNotFoundError extends BaseRepositoryError {
  readonly errorCode = 'ENTITY_NOT_FOUND';
  readonly errorType = 'notFound';

  constructor(
    message: string,
    repositoryName: string,
    entityId: string,
    public readonly entityType: string,
  ) {
    super(message, repositoryName, entityId);
  }
}

/**
 * 数据验证异常
 */
export class ValidationError extends BaseRepositoryError {
  readonly errorCode = 'VALIDATION_ERROR';
  readonly errorType = 'validation';

  constructor(
    message: string,
    repositoryName: string,
    public readonly validationErrors: Array<{
      field: string;
      message: string;
      code: string;
    }>,
    entityId?: string,
  ) {
    super(message, repositoryName, entityId);
  }
}
