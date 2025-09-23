/**
 * 基础消息类
 *
 * @description 提供消息的基本实现，包含消息的核心属性和行为
 * 所有具体的消息类型都应该继承此类
 *
 * ## 业务规则
 *
 * ### 消息创建规则
 * - 消息ID自动生成，确保唯一性
 * - 消息类型必须明确指定
 * - 消息载荷不能为空
 *
 * ### 消息验证规则
 * - 消息类型必须符合命名规范
 * - 消息载荷必须是有效的JSON对象
 * - 租户ID不能为空
 *
 * ### 消息序列化规则
 * - 支持JSON序列化和反序列化
 * - 保持消息的完整性和一致性
 * - 支持消息的深度克隆
 *
 * @example
 * ```typescript
 * class UserCreatedMessage extends BaseMessage {
 *   constructor(
 *     payload: { userId: string; email: string },
 *     tenantId: string,
 *     options?: IMessageOptions
 *   ) {
 *     super('UserCreated', payload, tenantId, options);
 *   }
 * }
 *
 * const message = new UserCreatedMessage(
 *   { userId: 'user-123', email: 'user@example.com' },
 *   'tenant-123',
 *   { priority: MessagePriority.HIGH }
 * );
 * ```
 *
 * @since 1.0.0
 */

import { EntityId } from '../../../domain/value-objects/entity-id';
import type { IMessage, IMessageOptions } from './message.interface';
import { MessagePriority, MessageStatus } from './message.interface';

/**
 * 基础消息类
 *
 * @description 提供消息的基本实现
 */
export abstract class BaseMessage implements IMessage {
	public readonly id: EntityId;
	public readonly type: string;
	public readonly payload: Record<string, unknown>;
	public readonly priority: MessagePriority;
	public readonly tenantId: string;
	public readonly createdAt: Date;
	public readonly expiresAt?: Date;
	public readonly retryCount: number;
	public readonly maxRetries: number;
	public readonly status: MessageStatus;
	public readonly correlationId?: string;
	public readonly replyTo?: string;
	public readonly metadata?: Record<string, unknown>;

	/**
	 * 从JSON字符串创建消息
	 *
	 * @param json JSON字符串
	 * @returns 消息对象
	 */
	public static fromJSON(json: string): IMessage {
		const data = JSON.parse(json);
		return {
			id: EntityId.fromString(data.id),
			type: data.type,
			payload: data.payload,
			priority: data.priority,
			tenantId: data.tenantId,
			createdAt: new Date(data.createdAt),
			expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
			retryCount: data.retryCount,
			maxRetries: data.maxRetries,
			status: data.status,
			correlationId: data.correlationId,
			replyTo: data.replyTo,
			metadata: data.metadata
		};
	}

	/**
	 * 构造函数
	 *
	 * @param type 消息类型
	 * @param payload 消息载荷
	 * @param tenantId 租户ID
	 * @param options 消息选项
	 */
	constructor(type: string, payload: Record<string, unknown>, tenantId: string, options: IMessageOptions = {}) {
		this.id = EntityId.generate();
		this.type = type;
		this.payload = payload;
		this.priority = options.priority || MessagePriority.NORMAL;
		this.tenantId = tenantId;
		this.createdAt = new Date();
		this.retryCount = 0;
		this.maxRetries = options.maxRetries || 3;
		this.status = MessageStatus.PENDING;
		this.correlationId = options.correlationId;
		this.replyTo = options.replyTo;
		this.metadata = options.metadata;

		// 设置过期时间
		if (options.ttl) {
			this.expiresAt = new Date(this.createdAt.getTime() + options.ttl);
		}

		this.validate();
	}

	/**
	 * 验证消息的有效性
	 *
	 * @throws {Error} 当消息无效时
	 * @protected
	 */
	protected validate(): void {
		if (!this.type || this.type.trim().length === 0) {
			throw new Error('Message type cannot be empty');
		}

		if (!this.payload || typeof this.payload !== 'object') {
			throw new Error('Message payload must be a valid object');
		}

		if (!this.tenantId || this.tenantId.trim().length === 0) {
			throw new Error('Tenant ID cannot be empty');
		}

		if (this.maxRetries < 0) {
			throw new Error('Max retries cannot be negative');
		}

		if (this.retryCount < 0) {
			throw new Error('Retry count cannot be negative');
		}

		if (this.retryCount > this.maxRetries) {
			throw new Error('Retry count cannot exceed max retries');
		}
	}

	/**
	 * 检查消息是否已过期
	 *
	 * @returns 是否已过期
	 */
	public isExpired(): boolean {
		if (!this.expiresAt) {
			return false;
		}
		return new Date() > this.expiresAt;
	}

	/**
	 * 检查消息是否可以重试
	 *
	 * @returns 是否可以重试
	 */
	public canRetry(): boolean {
		return this.retryCount < this.maxRetries && !this.isExpired();
	}

	/**
	 * 创建消息的副本
	 *
	 * @param updates 要更新的属性
	 * @returns 消息副本
	 */
	public clone(updates: Partial<IMessage> = {}): IMessage {
		const cloned = Object.create(Object.getPrototypeOf(this));
		Object.assign(cloned, this, updates);
		return cloned;
	}

	/**
	 * 将消息转换为JSON字符串
	 *
	 * @returns JSON字符串
	 */
	public toJSON(): string {
		return JSON.stringify({
			id: this.id.toString(),
			type: this.type,
			payload: this.payload,
			priority: this.priority,
			tenantId: this.tenantId,
			createdAt: this.createdAt.toISOString(),
			expiresAt: this.expiresAt?.toISOString(),
			retryCount: this.retryCount,
			maxRetries: this.maxRetries,
			status: this.status,
			correlationId: this.correlationId,
			replyTo: this.replyTo,
			metadata: this.metadata
		});
	}

	/**
	 * 获取消息的字符串表示
	 *
	 * @returns 字符串表示
	 */
	public toString(): string {
		return `${this.type}(${this.id.toString()})`;
	}

	/**
	 * 比较两个消息是否相等
	 *
	 * @param other 另一个消息
	 * @returns 是否相等
	 */
	public equals(other: IMessage | null | undefined): boolean {
		if (!other) {
			return false;
		}
		return this.id.equals(other.id);
	}

	/**
	 * 获取消息的哈希码
	 *
	 * @returns 哈希码
	 */
	public getHashCode(): string {
		return this.id.getHashCode();
	}
}
