/**
 * 基础领域事件类
 *
 * 领域事件是领域驱动设计中的核心概念，表示领域中发生的具有业务意义的事件。
 * 领域事件用于在聚合内部和聚合之间传播状态变化，支持最终一致性。
 *
 * ## 业务规则
 *
 * ### 事件标识规则
 * - 每个领域事件必须具有唯一的事件标识符
 * - 事件标识符用于事件的去重和追踪
 * - 事件标识符必须符合 EntityId 的格式要求
 *
 * ### 聚合关联规则
 * - 每个领域事件必须关联到特定的聚合根
 * - 聚合根标识符用于确定事件的归属
 * - 聚合根版本用于乐观锁控制
 *
 * ### 时间戳规则
 * - 事件发生时间使用 UTC 时区
 * - 时间戳精度到毫秒级别
 * - 事件时间不可修改
 *
 * ### 事件版本规则
 * - 事件版本用于事件演化管理
 * - 版本号从 1 开始递增
 * - 支持向后兼容的事件处理
 *
 * ### 多租户规则
 * - 事件必须包含租户标识符
 * - 支持跨租户的事件隔离
 * - 租户信息不可为空
 *
 * @description 所有领域事件的基类，提供事件的一致行为
 * @example
 * ```typescript
 * class UserCreatedEvent extends BaseDomainEvent {
 *   constructor(
 *     aggregateId: EntityId,
 *     aggregateVersion: number,
 *     tenantId: string,
 *     public readonly userId: EntityId,
 *     public readonly email: string,
 *     public readonly name: string
 *   ) {
 *     super(aggregateId, aggregateVersion, tenantId);
 *   }
 *
 *   get eventType(): string {
 *     return 'UserCreated';
 *   }
 * }
 *
 * // 创建领域事件
 * const event = new UserCreatedEvent(
 *   userId,
 *   1,
 *   'tenant-123',
 *   userId,
 *   'user@example.com',
 *   '张三'
 * );
 * ```
 *
 * @since 1.0.0
 */
import { EntityId } from '../../value-objects/entity-id';

abstract class BaseDomainEvent {
	private readonly _eventId: EntityId;
	private readonly _aggregateId: EntityId;
	private readonly _aggregateVersion: number;
	private readonly _tenantId: string;
	private readonly _occurredAt: Date;
	private readonly _eventVersion: number;

	/**
	 * 构造函数
	 *
	 * @param aggregateId - 聚合根标识符
	 * @param aggregateVersion - 聚合根版本号
	 * @param tenantId - 租户标识符
	 * @param eventVersion - 事件版本号，默认为 1
	 */
	protected constructor(aggregateId: EntityId, aggregateVersion: number, tenantId: string, eventVersion: number = 1) {
		this._eventId = EntityId.generate();
		this._aggregateId = aggregateId;
		this._aggregateVersion = aggregateVersion;
		this._tenantId = tenantId;
		this._occurredAt = new Date();
		this._eventVersion = eventVersion;
	}

	/**
	 * 获取事件标识符
	 *
	 * @returns 事件唯一标识符
	 */
	public get eventId(): EntityId {
		return this._eventId;
	}

	/**
	 * 获取聚合根标识符
	 *
	 * @returns 聚合根标识符
	 */
	public get aggregateId(): EntityId {
		return this._aggregateId;
	}

	/**
	 * 获取聚合根版本号
	 *
	 * @returns 聚合根版本号
	 */
	public get aggregateVersion(): number {
		return this._aggregateVersion;
	}

	/**
	 * 获取租户标识符
	 *
	 * @returns 租户标识符
	 */
	public get tenantId(): string {
		return this._tenantId;
	}

	/**
	 * 获取事件发生时间
	 *
	 * @returns 事件发生时间
	 */
	public get occurredAt(): Date {
		return this._occurredAt;
	}

	/**
	 * 获取事件版本号
	 *
	 * @returns 事件版本号
	 */
	public get eventVersion(): number {
		return this._eventVersion;
	}

	/**
	 * 获取事件类型名称
	 *
	 * 子类必须重写此方法以返回具体的事件类型名称。
	 *
	 * @returns 事件类型名称
	 */
	/**
	 * 获取事件版本号
	 *
	 * @returns 事件版本号
	 */
	public get version(): number {
		return this._eventVersion;
	}

	public abstract get eventType(): string;

	/**
	 * 获取事件的业务数据
	 *
	 * 子类应该重写此方法以返回事件的业务数据。
	 * 默认实现返回空对象。
	 *
	 * @returns 事件的业务数据
	 */
	public get eventData(): Record<string, unknown> {
		return {};
	}

	/**
	 * 检查两个领域事件是否相等
	 *
	 * 领域事件的相等性基于事件标识符比较。
	 *
	 * @param other - 要比较的另一个领域事件
	 * @returns 如果两个事件相等则返回 true，否则返回 false
	 */
	public equals(other: BaseDomainEvent | null | undefined): boolean {
		if (other === null || other === undefined) {
			return false;
		}

		if (!(other instanceof this.constructor)) {
			return false;
		}

		return this._eventId.equals(other._eventId);
	}

	/**
	 * 获取事件的哈希码
	 *
	 * 用于在 Map 或 Set 中使用事件作为键。
	 *
	 * @returns 哈希码字符串
	 */
	public getHashCode(): string {
		return this._eventId.getHashCode();
	}

	/**
	 * 将事件转换为字符串表示
	 *
	 * @returns 字符串表示
	 */
	public toString(): string {
		return `${this.eventType}(${this._eventId.toString()})`;
	}

	/**
	 * 将事件转换为 JSON 表示
	 *
	 * @returns JSON 表示
	 */
	public toJSON(): Record<string, unknown> {
		return {
			eventId: this._eventId.toString(),
			eventType: this.eventType,
			aggregateId: this._aggregateId.toString(),
			aggregateVersion: this._aggregateVersion,
			tenantId: this._tenantId,
			occurredAt: this._occurredAt.toISOString(),
			eventVersion: this._eventVersion,
			eventData: this.eventData
		};
	}

	/**
	 * 获取事件的类型名称
	 *
	 * @returns 类型名称
	 */
	public getTypeName(): string {
		return this.constructor.name;
	}

	/**
	 * 比较两个事件的大小
	 *
	 * 基于事件发生时间进行比较。
	 *
	 * @param other - 要比较的另一个事件
	 * @returns 比较结果：-1 表示小于，0 表示等于，1 表示大于
	 */
	public compareTo(other: BaseDomainEvent): number {
		if (other === null || other === undefined) {
			return 1;
		}

		if (this._occurredAt < other._occurredAt) {
			return -1;
		}
		if (this._occurredAt > other._occurredAt) {
			return 1;
		}

		// 如果时间相同，按事件ID比较
		return this._eventId.compareTo(other._eventId);
	}

	/**
	 * 检查事件是否为指定类型
	 *
	 * @param eventType - 事件类型名称
	 * @returns 如果事件是指定类型则返回 true，否则返回 false
	 */
	public isOfType(eventType: string): boolean {
		return this.eventType === eventType;
	}

	/**
	 * 检查事件是否属于指定的聚合根
	 *
	 * @param aggregateId - 聚合根标识符
	 * @returns 如果事件属于指定的聚合根则返回 true，否则返回 false
	 */
	public belongsToAggregate(aggregateId: EntityId): boolean {
		return this._aggregateId.equals(aggregateId);
	}

	/**
	 * 检查事件是否属于指定的租户
	 *
	 * @param tenantId - 租户标识符
	 * @returns 如果事件属于指定的租户则返回 true，否则返回 false
	 */
	public belongsToTenant(tenantId: string): boolean {
		return this._tenantId === tenantId;
	}

	/**
	 * 验证事件的有效性
	 *
	 * 子类应该重写此方法以实现具体的验证逻辑。
	 *
	 * @throws {Error} 当事件无效时
	 * @protected
	 */
	protected validate(): void {
		if (!this._eventId || this._eventId.isEmpty()) {
			throw new Error('Event ID cannot be null or empty');
		}

		if (!this._aggregateId || this._aggregateId.isEmpty()) {
			throw new Error('Aggregate ID cannot be null or empty');
		}

		if (!this._tenantId) {
			throw new Error('Tenant ID cannot be null or empty');
		}

		if (this._aggregateVersion < 1) {
			throw new Error('Aggregate version must be greater than 0');
		}

		if (this._eventVersion < 1) {
			throw new Error('Event version must be greater than 0');
		}
	}
}

export { BaseDomainEvent };
