/**
 * 领域事件接口
 *
 * 定义领域事件的基础契约，领域事件是DDD中用于表示业务状态变化的核心概念。
 * 领域事件具有不可变性，记录了在特定时间点发生的业务事实。
 *
 * @description 领域事件接口定义了所有领域事件必须实现的基础能力
 *
 * ## 业务规则
 *
 * ### 事件不可变性规则
 * - 事件一旦创建就不能被修改
 * - 事件的所有属性都应该是只读的
 * - 事件应该包含完整的业务上下文信息
 * - 事件数据应该是自包含的，不依赖外部状态
 *
 * ### 事件标识规则
 * - 每个事件必须有唯一的事件ID
 * - 事件ID用于去重和幂等处理
 * - 事件类型用于事件路由和处理器匹配
 * - 聚合根ID标识事件的来源聚合
 *
 * ### 事件时间规则
 * - 事件发生时间反映业务事实的实际发生时间
 * - 事件创建时间记录事件对象的创建时间
 * - 时间戳采用UTC时区，确保跨时区一致性
 * - 事件顺序通过版本号和时间戳确定
 *
 * ### 事件版本规则
 * - 事件版本用于模式演进和兼容性管理
 * - 版本变更时需要提供向后兼容策略
 * - 版本号遵循语义化版本规范
 * - 事件处理器需要支持多版本事件
 *
 * @example
 * ```typescript
 * export class UserCreatedEvent extends BaseDomainEvent implements IDomainEvent {
 *   constructor(
 *     public readonly userId: EntityId,
 *     public readonly name: string,
 *     public readonly email: string,
 *     occurredAt?: Date
 *   ) {
 *     super(userId, 'UserCreated', occurredAt);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { EntityId } from '../../value-objects/entity-id';

/**
 * 领域事件接口
 *
 * 定义领域事件必须实现的基础能力
 */
export interface IDomainEvent {
  /**
   * 事件唯一标识符
   *
   * @description 事件的全局唯一标识符，用于：
   * - 事件去重处理
   * - 事件溯源存储
   * - 事件处理幂等性保证
   * - 事件调试和追踪
   *
   * @readonly
   */
  readonly eventId: EntityId;

  /**
   * 聚合根标识符
   *
   * @description 产生此事件的聚合根标识符，用于：
   * - 事件与聚合根的关联
   * - 事件流的构建
   * - 聚合根状态重建
   * - 事件权限控制
   *
   * @readonly
   */
  readonly aggregateId: EntityId;

  /**
   * 事件类型
   *
   * @description 事件的类型标识，用于：
   * - 事件处理器路由
   * - 事件序列化/反序列化
   * - 事件统计和监控
   * - 事件过滤和查询
   *
   * @readonly
   * @example 'UserCreated', 'OrderPlaced', 'PaymentProcessed'
   */
  readonly eventType: string;

  /**
   * 事件发生时间
   *
   * @description 业务事件实际发生的时间，用于：
   * - 事件时序排列
   * - 业务审计追踪
   * - 时间范围查询
   * - 性能分析
   *
   * @readonly
   */
  readonly occurredAt: Date;

  /**
   * 事件创建时间
   *
   * @description 事件对象创建的时间，通常等于或略晚于occurredAt
   * 用于技术层面的事件处理和调试
   *
   * @readonly
   */
  readonly createdAt: Date;

  /**
   * 事件版本
   *
   * @description 事件模式的版本号，用于：
   * - 事件模式演进管理
   * - 向后兼容性处理
   * - 事件迁移策略
   * - 处理器版本匹配
   *
   * @readonly
   * @default '1.0.0'
   */
  readonly version: string;

  /**
   * 事件元数据
   *
   * @description 事件的元数据信息，包含：
   * - 用户上下文信息
   * - 请求追踪信息
   * - 系统环境信息
   * - 其他扩展信息
   *
   * @readonly
   */
  readonly metadata: EventMetadata;

  /**
   * 获取事件的业务标识符
   *
   * @description 返回用于业务逻辑的事件标识符，通常用于日志和调试
   * @returns 业务标识符字符串
   *
   * @example
   * ```typescript
   * const identifier = event.getBusinessIdentifier();
   * // 返回: "UserCreated(user-123, 2024-01-01T10:00:00Z)"
   * ```
   */
  getBusinessIdentifier(): string;

  /**
   * 转换为纯数据对象
   *
   * @description 将事件转换为纯数据对象，用于序列化和传输
   * @returns 包含所有事件数据的纯对象
   *
   * @example
   * ```typescript
   * const data = event.toData();
   * const json = JSON.stringify(data);
   * ```
   */
  toData(): Record<string, unknown>;

  /**
   * 检查事件是否与指定聚合根相关
   *
   * @param aggregateId - 聚合根ID
   * @returns 如果相关返回true，否则返回false
   *
   * @example
   * ```typescript
   * if (event.isRelatedTo(userId)) {
   *   console.log('这是用户相关的事件');
   * }
   * ```
   */
  isRelatedTo(aggregateId: EntityId): boolean;
}

/**
 * 事件元数据接口
 *
 * 定义事件元数据的结构
 */
export interface EventMetadata {
  /**
   * 用户上下文
   *
   * @description 触发事件的用户信息
   */
  user?: {
    id: string;
    name?: string;
    roles?: string[];
  };

  /**
   * 租户上下文
   *
   * @description 事件所属的租户信息
   */
  tenant?: {
    id: string;
    name?: string;
  };

  /**
   * 请求上下文
   *
   * @description 触发事件的请求信息
   */
  request?: {
    id: string;
    ip?: string;
    userAgent?: string;
    source?: string;
  };

  /**
   * 系统上下文
   *
   * @description 系统环境信息
   */
  system?: {
    service: string;
    version: string;
    environment: string;
    hostname?: string;
  };

  /**
   * 因果关系
   *
   * @description 事件的因果关系信息
   */
  causation?: {
    commandId?: string;
    parentEventId?: string;
    correlationId?: string;
  };

  /**
   * 自定义属性
   *
   * @description 业务特定的元数据
   */
  custom?: Record<string, unknown>;
}

/**
 * 事件处理器接口
 *
 * 定义事件处理器的基础契约
 */
export interface IDomainEventHandler<T extends IDomainEvent = IDomainEvent> {
  /**
   * 处理事件
   *
   * @param event - 要处理的事件
   * @returns 处理结果的Promise
   */
  handle(event: T): Promise<void>;

  /**
   * 获取处理器支持的事件类型
   *
   * @returns 支持的事件类型数组
   */
  getSupportedEventTypes(): string[];

  /**
   * 检查是否可以处理指定事件
   *
   * @param event - 要检查的事件
   * @returns 如果可以处理返回true，否则返回false
   */
  canHandle(event: IDomainEvent): boolean;
}

/**
 * 事件总线接口
 *
 * 定义事件总线的基础契约
 */
export interface IDomainEventBus {
  /**
   * 发布单个事件
   *
   * @param event - 要发布的事件
   * @returns 发布结果的Promise
   */
  publish(event: IDomainEvent): Promise<void>;

  /**
   * 批量发布事件
   *
   * @param events - 要发布的事件数组
   * @returns 发布结果的Promise
   */
  publishAll(events: IDomainEvent[]): Promise<void>;

  /**
   * 订阅事件
   *
   * @param eventType - 事件类型
   * @param handler - 事件处理器
   */
  subscribe(eventType: string, handler: IDomainEventHandler): void;

  /**
   * 取消订阅事件
   *
   * @param eventType - 事件类型
   * @param handler - 事件处理器
   */
  unsubscribe(eventType: string, handler: IDomainEventHandler): void;
}

/**
 * 事件存储接口
 *
 * 定义事件存储的基础契约
 */
export interface IDomainEventStore {
  /**
   * 保存事件
   *
   * @param events - 要保存的事件数组
   * @returns 保存结果的Promise
   */
  save(events: IDomainEvent[]): Promise<void>;

  /**
   * 获取聚合根的事件流
   *
   * @param aggregateId - 聚合根ID
   * @param fromVersion - 起始版本（可选）
   * @returns 事件流的Promise
   */
  getEventStream(
    aggregateId: EntityId,
    fromVersion?: number,
  ): Promise<IDomainEvent[]>;

  /**
   * 获取指定类型的事件
   *
   * @param eventType - 事件类型
   * @param fromDate - 起始时间（可选）
   * @param toDate - 结束时间（可选）
   * @returns 事件数组的Promise
   */
  getEventsByType(
    eventType: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<IDomainEvent[]>;
}
