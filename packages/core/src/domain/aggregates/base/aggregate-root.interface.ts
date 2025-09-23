/**
 * 聚合根接口
 *
 * 定义聚合根的基础契约，聚合根是DDD中的核心概念，负责：
 * - 维护聚合内的业务不变性
 * - 管理聚合的生命周期
 * - 发布领域事件
 * - 作为聚合的唯一入口点
 *
 * @description 聚合根接口定义了聚合根必须实现的基础能力
 *
 * ## 业务规则
 *
 * ### 聚合边界规则
 * - 聚合根是聚合的唯一公开接口
 * - 外部对象只能通过聚合根访问聚合内的实体
 * - 聚合根负责维护整个聚合的一致性
 * - 聚合根是事务边界的定义者
 *
 * ### 事件发布规则
 * - 聚合根负责收集和发布领域事件
 * - 事件应该在业务操作完成后发布
 * - 事件发布不应该影响聚合的业务逻辑
 * - 事件应该包含足够的信息供其他聚合使用
 *
 * ### 标识符规则
 * - 每个聚合根必须有唯一的标识符
 * - 标识符在聚合根的整个生命周期内不变
 * - 标识符用于聚合根的相等性比较
 * - 标识符必须是不可变的值对象
 *
 * @example
 * ```typescript
 * class UserAggregate extends BaseAggregateRoot implements IAggregateRoot {
 *   constructor(
 *     id: EntityId,
 *     private name: string,
 *     private email: string
 *   ) {
 *     super(id);
 *   }
 *
 *   updateEmail(newEmail: string): void {
 *     if (this.email !== newEmail) {
 *       this.email = newEmail;
 *       this.addDomainEvent(new UserEmailUpdatedEvent(this.id, newEmail));
 *     }
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { BaseDomainEvent } from '../../events/base/base-domain-event';
import { IEntity } from '../../entities/base/entity.interface';

/**
 * 聚合根接口
 *
 * 定义聚合根必须实现的基础能力，继承实体的基础能力
 */
export interface IAggregateRoot extends IEntity {
  /**
   * 获取未提交的领域事件
   *
   * @description 返回聚合根产生的所有未提交的领域事件
   * 这些事件将在聚合根保存时被发布
   *
   * @returns 未提交的领域事件数组
   *
   * @example
   * ```typescript
   * const events = aggregateRoot.getUncommittedEvents();
   * console.log(`聚合根产生了 ${events.length} 个事件`);
   * ```
   */
  getUncommittedEvents(): BaseDomainEvent[];

  /**
   * 清除未提交的领域事件
   *
   * @description 清除所有未提交的领域事件，通常在事件发布完成后调用
   * 这个方法应该在事件成功发布到事件总线后调用
   *
   * @example
   * ```typescript
   * // 发布事件
   * const events = aggregateRoot.getUncommittedEvents();
   * await eventBus.publishAll(events);
   *
   * // 清除已发布的事件
   * aggregateRoot.clearEvents();
   * ```
   */
  clearEvents(): void;

  /**
   * 添加领域事件
   *
   * @description 向聚合根添加一个领域事件，事件将在聚合根保存时发布
   * 这个方法通常在业务方法内部调用，用于记录业务状态的变化
   *
   * @param event - 要添加的领域事件
   *
   * @example
   * ```typescript
   * protected addEvent(event: BaseDomainEvent): void {
   *   this.addDomainEvent(new UserCreatedEvent(this.id, this.name));
   * }
   * ```
   */
  addDomainEvent(event: BaseDomainEvent): void;

  /**
   * 获取聚合根版本
   *
   * @description 返回聚合根的版本号，用于乐观锁控制
   * 版本号在每次聚合根状态变更时递增
   *
   * @returns 聚合根版本号
   *
   * @example
   * ```typescript
   * const version = aggregateRoot.getVersion();
   * console.log(`当前聚合根版本: ${version}`);
   * ```
   */
  getVersion(): number;

  /**
   * 检查聚合根是否为新创建的
   *
   * @description 检查聚合根是否是新创建的（尚未持久化）
   * 这个信息对于仓储模式的实现很重要
   *
   * @returns 如果是新创建的返回true，否则返回false
   *
   * @example
   * ```typescript
   * if (aggregateRoot.isNew()) {
   *   await repository.save(aggregateRoot);
   * } else {
   *   await repository.update(aggregateRoot);
   * }
   * ```
   */
  isNew(): boolean;
}

/**
 * 聚合根工厂接口
 *
 * 定义创建聚合根的工厂方法
 */
export interface IAggregateRootFactory<T extends IAggregateRoot> {
  /**
   * 创建新的聚合根实例
   *
   * @param data - 创建聚合根所需的数据
   * @returns 新创建的聚合根实例
   */
  create(data: Record<string, unknown>): T;

  /**
   * 从持久化数据重建聚合根
   *
   * @param data - 持久化的数据
   * @returns 重建的聚合根实例
   */
  reconstitute(data: Record<string, unknown>): T;
}
