/**
 * 事件投射器接口
 *
 * 定义事件投射器的基础契约，事件投射器是CQRS+ES架构中负责更新读模型的关键组件。
 * 事件投射器监听领域事件，并将事件数据投射到读模型中，确保最终一致性。
 *
 * @description 事件投射器接口定义了事件投射的标准方式
 *
 * ## 业务规则
 *
 * ### 事件投射器职责规则
 * - 事件投射器负责监听特定类型的领域事件
 * - 事件投射器将事件数据转换并更新到读模型
 * - 事件投射器确保读模型与写模型的最终一致性
 * - 事件投射器应该是幂等的，支持重复投射
 *
 * ### 事件投射器一致性规则
 * - 事件投射必须保证最终一致性
 * - 事件投射失败时应该支持重试机制
 * - 事件投射应该按顺序处理事件
 * - 事件投射应该处理事件版本和冲突
 *
 * ### 事件投射器性能规则
 * - 事件投射应该是异步执行的
 * - 事件投射应该支持批量处理
 * - 事件投射应该优化读模型的查询性能
 * - 事件投射应该支持增量更新
 *
 * @example
 * ```typescript
 * @EventProjector('UserCreatedEvent')
 * export class UserCreatedProjector implements IEventProjector<UserCreatedEvent> {
 *   constructor(
 *     private readonly userReadRepository: IUserReadRepository
 *   ) {}
 *
 *   async project(event: UserCreatedEvent): Promise<void> {
 *     // 1. 提取事件数据
 *     const eventData = this.extractEventData(event);
 *
 *     // 2. 创建或更新读模型
 *     const userReadModel = new UserReadModel({
 *       id: eventData.userId,
 *       name: eventData.name,
 *       email: eventData.email,
 *       createdAt: event.occurredAt
 *     });
 *
 *     // 3. 保存读模型
 *     await this.userReadRepository.save(userReadModel);
 *   }
 *
 *   canProject(event: IDomainEvent): boolean {
 *     return event.eventType === 'UserCreatedEvent';
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { BaseDomainEvent } from '../../../../domain/events/base/base-domain-event';

/**
 * 事件投射器接口
 *
 * 定义事件投射器必须实现的基础能力
 *
 * @template TEvent - 事件类型
 */
export interface IEventProjector<TEvent extends BaseDomainEvent> {
	/**
	 * 投射事件
	 *
	 * @description 将领域事件投射到读模型，这是投射器的核心方法
	 *
	 * @param event - 要投射的领域事件
	 * @returns 投射操作的Promise
	 *
	 * @throws {ProjectionError} 当投射失败时
	 * @throws {ConcurrencyError} 当发生读模型并发冲突时
	 * @throws {ValidationError} 当读模型数据验证失败时
	 *
	 * @example
	 * ```typescript
	 * async project(event: UserCreatedEvent): Promise<void> {
	 *   const userReadModel = new UserReadModel({
	 *     id: event.userId,
	 *     name: event.name,
	 *     email: event.email,
	 *     createdAt: event.occurredAt
	 *   });
	 *
	 *   await this.userReadRepository.save(userReadModel);
	 * }
	 * ```
	 */
	project(event: TEvent): Promise<void>;

	/**
	 * 检查是否可以投射指定事件
	 *
	 * @description 检查此投射器是否可以处理给定的事件
	 *
	 * @param event - 要检查的事件
	 * @returns 如果可以投射返回true，否则返回false
	 *
	 * @example
	 * ```typescript
	 * canProject(event: BaseDomainEvent): boolean {
	 *   return event.eventType === 'UserCreatedEvent';
	 * }
	 * ```
	 */
	canProject(event: BaseDomainEvent): boolean;

	/**
	 * 获取投射器名称
	 *
	 * @description 返回投射器的唯一标识名称，用于：
	 * - 投射器注册和发现
	 * - 日志记录和调试
	 * - 性能监控和指标收集
	 * - 错误追踪和诊断
	 *
	 * @returns 投射器名称
	 *
	 * @example
	 * ```typescript
	 * getProjectorName(): string {
	 *   return 'UserCreatedProjector';
	 * }
	 * ```
	 */
	getProjectorName(): string;

	/**
	 * 获取处理的事件类型
	 *
	 * @description 返回此投射器能够处理的事件类型列表
	 *
	 * @returns 事件类型数组
	 *
	 * @example
	 * ```typescript
	 * getProjectedEventTypes(): string[] {
	 *   return ['UserCreatedEvent', 'UserUpdatedEvent'];
	 * }
	 * ```
	 */
	getProjectedEventTypes(): string[];
}

/**
 * 读模型投射器接口
 *
 * 专门用于读模型投射的投射器接口
 *
 * @template TEvent - 事件类型
 * @template TReadModel - 读模型类型
 */
export interface IReadModelProjector<TEvent extends BaseDomainEvent> extends IEventProjector<TEvent> {
	/**
	 * 重建读模型
	 *
	 * @description 从事件历史重建指定聚合的完整读模型
	 *
	 * @param aggregateId - 聚合根标识符
	 * @param events - 事件历史
	 * @returns 重建操作的Promise
	 *
	 * @example
	 * ```typescript
	 * async rebuildReadModel(aggregateId: string, events: UserEvent[]): Promise<void> {
	 *   // 1. 删除现有读模型
	 *   await this.userReadRepository.deleteByAggregateId(aggregateId);
	 *
	 *   // 2. 按顺序重放事件
	 *   for (const event of events) {
	 *     await this.project(event);
	 *   }
	 * }
	 * ```
	 */
	rebuildReadModel(aggregateId: string, events: TEvent[]): Promise<void>;

	/**
	 * 获取读模型类型
	 *
	 * @description 返回此投射器维护的读模型类型
	 *
	 * @returns 读模型类型标识
	 */
	getReadModelType(): string;
}

/**
 * 投射器管理器接口
 */
export interface IProjectorManager {
	/**
	 * 注册事件投射器
	 *
	 * @param projector - 投射器实例
	 */
	register(projector: IEventProjector<any>): void;

	/**
	 * 投射事件
	 *
	 * @param event - 要投射的事件
	 * @returns 投射操作的Promise
	 */
	projectEvent(event: BaseDomainEvent): Promise<void>;

	/**
	 * 批量投射事件
	 *
	 * @param events - 要投射的事件数组
	 * @returns 投射操作的Promise
	 */
	projectEvents(events: BaseDomainEvent[]): Promise<void>;

	/**
	 * 重建所有读模型
	 *
	 * @param aggregateId - 聚合根标识符
	 * @param events - 事件历史
	 * @returns 重建操作的Promise
	 */
	rebuildAllReadModels(aggregateId: string, events: BaseDomainEvent[]): Promise<void>;

	/**
	 * 获取已注册的投射器
	 *
	 * @param eventType - 事件类型
	 * @returns 投射器列表
	 */
	getProjectors(eventType: string): IEventProjector<any>[];

	/**
	 * 获取所有已注册的投射器
	 *
	 * @returns 投射器列表
	 */
	getAllProjectors(): IEventProjector<any>[];

	/**
	 * 检查投射器是否已注册
	 *
	 * @param projectorName - 投射器名称
	 * @returns 如果已注册返回true，否则返回false
	 */
	hasProjector(projectorName: string): boolean;

	/**
	 * 移除投射器
	 *
	 * @param projectorName - 投射器名称
	 */
	removeProjector(projectorName: string): void;

	/**
	 * 清空所有投射器
	 */
	clear(): void;
}

/**
 * 投射执行上下文接口
 */
export interface IProjectionExecutionContext {
	/**
	 * 事件ID
	 */
	eventId: string;

	/**
	 * 投射开始时间
	 */
	startTime: Date;

	/**
	 * 聚合根ID
	 */
	aggregateId: string;

	/**
	 * 事件版本
	 */
	eventVersion: number;

	/**
	 * 投射器名称
	 */
	projectorName: string;

	/**
	 * 读模型类型
	 */
	readModelType?: string;

	/**
	 * 重试次数
	 */
	retryCount: number;

	/**
	 * 自定义上下文
	 */
	custom: Record<string, unknown>;
}

/**
 * 投射执行结果接口
 */
export interface IProjectionExecutionResult {
	/**
	 * 投射是否成功
	 */
	success: boolean;

	/**
	 * 错误信息
	 */
	error?: Error;

	/**
	 * 执行时间（毫秒）
	 */
	executionTime: number;

	/**
	 * 影响的读模型数量
	 */
	affectedReadModels: number;

	/**
	 * 执行上下文
	 */
	context: IProjectionExecutionContext;
}
