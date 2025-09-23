/**
 * 消息接口
 *
 * @description 定义消息队列中消息的基本结构和行为
 * 消息是异步通信的基本单位，用于在系统组件之间传递数据
 *
 * ## 业务规则
 *
 * ### 消息标识规则
 * - 每个消息必须具有唯一的消息标识符
 * - 消息标识符用于消息的去重和追踪
 * - 消息标识符必须符合 EntityId 的格式要求
 *
 * ### 消息类型规则
 * - 消息必须具有明确的类型标识
 * - 消息类型用于路由和处理器匹配
 * - 支持消息类型的版本管理
 *
 * ### 消息优先级规则
 * - 支持消息优先级设置
 * - 高优先级消息优先处理
 * - 默认优先级为普通级别
 *
 * ### 消息过期规则
 * - 支持消息过期时间设置
 * - 过期消息自动丢弃
 * - 防止消息积压和内存泄漏
 *
 * ### 多租户规则
 * - 消息必须包含租户标识符
 * - 支持跨租户的消息隔离
 * - 租户信息不可为空
 *
 * @example
 * ```typescript
 * const message: IMessage = {
 *   id: EntityId.generate(),
 *   type: 'UserCreated',
 *   payload: { userId: 'user-123', email: 'user@example.com' },
 *   priority: MessagePriority.NORMAL,
 *   tenantId: 'tenant-123',
 *   createdAt: new Date(),
 *   expiresAt: new Date(Date.now() + 3600000), // 1小时后过期
 *   retryCount: 0,
 *   maxRetries: 3
 * };
 * ```
 *
 * @since 1.0.0
 */

import type { EntityId } from '../../../domain/value-objects/entity-id';

/**
 * 消息优先级枚举
 *
 * @description 定义消息处理的优先级级别
 */
export enum MessagePriority {
  /** 低优先级 */
  LOW = 1,
  /** 普通优先级 */
  NORMAL = 5,
  /** 高优先级 */
  HIGH = 10,
  /** 紧急优先级 */
  URGENT = 15,
}

/**
 * 消息状态枚举
 *
 * @description 定义消息在队列中的状态
 */
export enum MessageStatus {
  /** 待处理 */
  PENDING = 'pending',
  /** 处理中 */
  PROCESSING = 'processing',
  /** 处理成功 */
  COMPLETED = 'completed',
  /** 处理失败 */
  FAILED = 'failed',
  /** 已过期 */
  EXPIRED = 'expired',
  /** 已取消 */
  CANCELLED = 'cancelled',
}

/**
 * 消息接口
 *
 * @description 定义消息的基本结构
 */
export interface IMessage {
  /** 消息唯一标识符 */
  readonly id: EntityId;
  /** 消息类型 */
  readonly type: string;
  /** 消息载荷数据 */
  readonly payload: Record<string, unknown>;
  /** 消息优先级 */
  readonly priority: MessagePriority;
  /** 租户标识符 */
  readonly tenantId: string;
  /** 消息创建时间 */
  readonly createdAt: Date;
  /** 消息过期时间 */
  readonly expiresAt?: Date;
  /** 重试次数 */
  readonly retryCount: number;
  /** 最大重试次数 */
  readonly maxRetries: number;
  /** 消息状态 */
  readonly status: MessageStatus;
  /** 关联ID，用于消息关联 */
  readonly correlationId?: string;
  /** 回复地址，用于请求-响应模式 */
  readonly replyTo?: string;
  /** 消息元数据 */
  readonly metadata?: Record<string, unknown>;
}

/**
 * 消息选项接口
 *
 * @description 定义创建消息时的选项
 */
export interface IMessageOptions {
  /** 消息优先级 */
  priority?: MessagePriority;
  /** 消息过期时间（毫秒） */
  ttl?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 关联ID */
  correlationId?: string;
  /** 回复地址 */
  replyTo?: string;
  /** 消息元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 消息处理结果接口
 *
 * @description 定义消息处理的结果
 */
export interface IMessageResult {
  /** 处理是否成功 */
  readonly success: boolean;
  /** 处理结果数据 */
  readonly data?: unknown;
  /** 错误信息 */
  readonly error?: string;
  /** 处理时间（毫秒） */
  readonly processingTime: number;
  /** 是否需要重试 */
  readonly shouldRetry: boolean;
  /** 重试延迟（毫秒） */
  readonly retryDelay?: number;
}
