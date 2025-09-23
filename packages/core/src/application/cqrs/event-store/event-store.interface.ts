/**
 * 事件存储接口
 *
 * @description 定义事件存储的核心功能，包括事件的保存、查询、删除等操作
 * 事件存储是 CQRS + Event Sourcing 架构的核心组件，负责持久化领域事件
 *
 * ## 业务规则
 *
 * ### 事件保存规则
 * - 事件必须按版本顺序保存，确保事件流的完整性
 * - 支持乐观并发控制，防止并发修改冲突
 * - 事件保存必须具有原子性，要么全部成功，要么全部失败
 * - 支持批量事件保存，提高性能
 *
 * ### 事件查询规则
 * - 支持按聚合根ID查询事件流
 * - 支持按事件类型查询事件
 * - 支持按时间范围查询事件
 * - 支持分页查询，避免大量数据加载
 *
 * ### 数据隔离规则
 * - 支持多租户数据隔离
 * - 支持按组织、部门等维度隔离
 * - 确保数据安全和隐私保护
 *
 * ### 性能优化规则
 * - 支持事件流式处理，避免内存溢出
 * - 支持事件索引优化，提高查询性能
 * - 支持事件压缩和归档，节省存储空间
 *
 * @example
 * ```typescript
 * // 保存事件
 * await eventStore.saveEvents('order-123', events, 5);
 *
 * // 查询事件流
 * const events = await eventStore.getEvents('order-123', 1);
 *
 * // 查询事件流
 * const stream = await eventStore.getEventStream('event-456', 100);
 * ```
 *
 * @since 1.0.0
 */

import type { BaseDomainEvent } from '../../../domain/events/base/base-domain-event';

/**
 * 事件流查询结果
 *
 * @description 包含事件列表、分页信息和流控制信息
 */
export interface IEventStreamResult {
  /** 事件列表 */
  readonly events: BaseDomainEvent[];
  /** 下一个事件ID，用于分页查询 */
  readonly nextEventId?: string;
  /** 是否还有更多事件 */
  readonly hasMore: boolean;
}

/**
 * 事件存储接口
 *
 * @description 定义事件存储的核心功能
 */
export interface IEventStore {
  /**
   * 保存事件到存储
   *
   * @description 将领域事件保存到事件存储中，支持乐观并发控制
   * 事件必须按版本顺序保存，确保事件流的完整性
   *
   * @param aggregateId 聚合根ID
   * @param events 要保存的事件列表
   * @param expectedVersion 期望的当前版本号，用于乐观并发控制
   * @throws {ConcurrencyError} 当版本不匹配时抛出并发错误
   * @throws {ValidationError} 当事件数据无效时抛出验证错误
   *
   * @example
   * ```typescript
   * const events = [
   *   new OrderCreatedEvent('order-123', 'customer-456'),
   *   new OrderItemAddedEvent('order-123', 'item-789')
   * ];
   * await eventStore.saveEvents('order-123', events, 0);
   * ```
   */
  saveEvents(
    aggregateId: string,
    events: BaseDomainEvent[],
    expectedVersion: number,
  ): Promise<void>;

  /**
   * 获取聚合根的事件流
   *
   * @description 根据聚合根ID获取其完整的事件流
   * 支持从指定版本开始查询，用于事件重放和状态重建
   *
   * @param aggregateId 聚合根ID
   * @param fromVersion 起始版本号，可选
   * @returns 事件列表，按版本顺序排列
   *
   * @example
   * ```typescript
   * // 获取完整事件流
   * const allEvents = await eventStore.getEvents('order-123');
   *
   * // 从版本5开始获取事件流
   * const recentEvents = await eventStore.getEvents('order-123', 5);
   * ```
   */
  getEvents(
    aggregateId: string,
    fromVersion?: number,
  ): Promise<BaseDomainEvent[]>;

  /**
   * 根据事件类型查询事件
   *
   * @description 根据事件类型查询所有相关事件
   * 支持按时间范围过滤，用于事件分析和审计
   *
   * @param eventType 事件类型
   * @param fromDate 起始时间，可选
   * @returns 匹配的事件列表
   *
   * @example
   * ```typescript
   * // 获取所有订单创建事件
   * const orderCreatedEvents = await eventStore.getEventsByType('OrderCreatedEvent');
   *
   * // 获取最近一周的订单创建事件
   * const recentEvents = await eventStore.getEventsByType(
   *   'OrderCreatedEvent',
   *   new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
   * );
   * ```
   */
  getEventsByType(
    eventType: string,
    fromDate?: Date,
  ): Promise<BaseDomainEvent[]>;

  /**
   * 获取事件流
   *
   * @description 获取全局事件流，支持分页查询
   * 用于事件溯源、审计和系统监控
   *
   * @param fromEventId 起始事件ID，用于分页查询
   * @param limit 每页事件数量，默认100
   * @returns 事件流查询结果
   *
   * @example
   * ```typescript
   * // 获取前100个事件
   * const firstPage = await eventStore.getEventStream(undefined, 100);
   *
   * // 获取下一页事件
   * const nextPage = await eventStore.getEventStream(firstPage.nextEventId, 100);
   * ```
   */
  getEventStream(
    fromEventId?: string,
    limit?: number,
  ): Promise<IEventStreamResult>;

  /**
   * 删除聚合根的所有事件
   *
   * @description 删除指定聚合根的所有事件
   * 通常用于数据清理和合规要求
   *
   * @param aggregateId 聚合根ID
   * @throws {NotFoundError} 当聚合根不存在时抛出错误
   *
   * @example
   * ```typescript
   * // 删除订单的所有事件
   * await eventStore.deleteEvents('order-123');
   * ```
   */
  deleteEvents(aggregateId: string): Promise<void>;

  /**
   * 获取聚合根的当前版本
   *
   * @description 获取指定聚合根的当前版本号
   * 用于乐观并发控制和版本检查
   *
   * @param aggregateId 聚合根ID
   * @returns 当前版本号，如果不存在则返回0
   *
   * @example
   * ```typescript
   * const currentVersion = await eventStore.getCurrentVersion('order-123');
   * console.log(`当前版本: ${currentVersion}`);
   * ```
   */
  getCurrentVersion(aggregateId: string): Promise<number>;

  /**
   * 检查聚合根是否存在
   *
   * @description 检查指定聚合根是否存在于事件存储中
   *
   * @param aggregateId 聚合根ID
   * @returns 是否存在
   *
   * @example
   * ```typescript
   * const exists = await eventStore.exists('order-123');
   * if (exists) {
   *   // 处理已存在的聚合根
   * }
   * ```
   */
  exists(aggregateId: string): Promise<boolean>;
}
