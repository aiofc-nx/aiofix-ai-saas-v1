/**
 * 消息传递核心接口
 *
 * @description 定义消息传递系统的核心接口和类型
 * 支持多种消息队列技术（Bull、RabbitMQ、Kafka等）的统一抽象
 *
 * ## 业务规则
 *
 * ### 消息传递规则
 * - 支持点对点消息传递
 * - 支持发布订阅模式
 * - 支持消息路由和分发
 * - 支持消息持久化和可靠性保证
 *
 * ### 事件驱动规则
 * - 支持领域事件的异步传递
 * - 支持事件流处理和聚合
 * - 支持事件重放和状态重建
 * - 支持最终一致性保证
 *
 * ### 多租户规则
 * - 支持租户级别的消息隔离
 * - 支持租户特定的队列配置
 * - 支持跨租户的消息路由
 * - 支持租户数据的安全传递
 *
 * @since 1.0.0
 */

import type { EntityId } from '@aiofix/core';

/**
 * 消息传递模式枚举
 */
export enum MessagingPattern {
  /** 点对点模式 */
  POINT_TO_POINT = 'point_to_point',
  /** 发布订阅模式 */
  PUBLISH_SUBSCRIBE = 'publish_subscribe',
  /** 请求响应模式 */
  REQUEST_RESPONSE = 'request_response',
  /** 事件流模式 */
  EVENT_STREAMING = 'event_streaming',
}

/**
 * 消息传递类型枚举
 */
export enum MessageType {
  /** 命令消息 */
  COMMAND = 'command',
  /** 查询消息 */
  QUERY = 'query',
  /** 事件消息 */
  EVENT = 'event',
  /** 通知消息 */
  NOTIFICATION = 'notification',
  /** 系统消息 */
  SYSTEM = 'system',
}

/**
 * 消息优先级枚举
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
  /** 关键优先级 */
  CRITICAL = 20,
}

/**
 * 消息状态枚举
 */
export enum MessageStatus {
  /** 待发送 */
  PENDING = 'pending',
  /** 已发送 */
  SENT = 'sent',
  /** 已接收 */
  RECEIVED = 'received',
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
  /** 死信 */
  DEAD_LETTER = 'dead_letter',
}

/**
 * 消息接口
 */
export interface IMessage {
  /** 消息唯一标识符 */
  readonly id: EntityId;

  /** 消息类型 */
  readonly type: MessageType;

  /** 消息主题/队列名称 */
  readonly topic: string;

  /** 消息载荷数据 */
  readonly payload: Record<string, unknown>;

  /** 消息优先级 */
  readonly priority: MessagePriority;

  /** 消息状态 */
  status: MessageStatus;

  /** 租户标识符 */
  readonly tenantId: string;

  /** 发送者标识 */
  readonly senderId: string;

  /** 接收者标识（可选） */
  readonly receiverId?: string;

  /** 消息创建时间 */
  readonly createdAt: Date;

  /** 消息发送时间 */
  sentAt?: Date;

  /** 消息接收时间 */
  receivedAt?: Date;

  /** 消息过期时间 */
  readonly expiresAt?: Date;

  /** 重试次数 */
  retryCount: number;

  /** 最大重试次数 */
  readonly maxRetries: number;

  /** 关联ID，用于消息关联 */
  readonly correlationId?: string;

  /** 会话ID，用于会话跟踪 */
  readonly conversationId?: string;

  /** 回复地址，用于请求-响应模式 */
  readonly replyTo?: string;

  /** 消息路由键 */
  readonly routingKey?: string;

  /** 消息元数据 */
  readonly metadata: Record<string, unknown>;

  /** 消息头信息 */
  readonly headers: Record<string, string>;
}

/**
 * 消息发送选项
 */
export interface IMessageSendOptions {
  /** 消息优先级 */
  priority?: MessagePriority;

  /** 消息过期时间（毫秒） */
  ttl?: number;

  /** 最大重试次数 */
  maxRetries?: number;

  /** 延迟发送时间（毫秒） */
  delay?: number;

  /** 关联ID */
  correlationId?: string;

  /** 会话ID */
  conversationId?: string;

  /** 回复地址 */
  replyTo?: string;

  /** 路由键 */
  routingKey?: string;

  /** 是否持久化 */
  persistent?: boolean;

  /** 消息元数据 */
  metadata?: Record<string, unknown>;

  /** 消息头信息 */
  headers?: Record<string, string>;
}

/**
 * 消息处理器接口
 */
export interface IMessageHandler {
  /** 处理器名称 */
  readonly name: string;

  /** 支持的消息类型 */
  readonly supportedMessageTypes: MessageType[];

  /** 支持的主题列表 */
  readonly supportedTopics: string[];

  /**
   * 处理消息
   */
  handle(message: IMessage): Promise<void>;

  /**
   * 检查是否可以处理指定消息
   */
  canHandle(message: IMessage): boolean;

  /**
   * 获取处理器优先级
   */
  getPriority(): number;

  /**
   * 处理失败时的回调
   */
  onFailure?(message: IMessage, error: Error): Promise<void>;

  /**
   * 处理成功时的回调
   */
  onSuccess?(message: IMessage): Promise<void>;
}

/**
 * 消息队列接口
 */
export interface IMessageQueue {
  /** 队列名称 */
  readonly name: string;

  /** 队列类型 */
  readonly type: string;

  /**
   * 启动队列
   */
  start(): Promise<void>;

  /**
   * 停止队列
   */
  stop(): Promise<void>;

  /**
   * 发送消息
   */
  send(message: IMessage, options?: IMessageSendOptions): Promise<void>;

  /**
   * 批量发送消息
   */
  sendBatch(messages: IMessage[], options?: IMessageSendOptions): Promise<void>;

  /**
   * 订阅消息
   */
  subscribe(topic: string, handler: IMessageHandler): Promise<string>;

  /**
   * 取消订阅
   */
  unsubscribe(subscriptionId: string): Promise<void>;

  /**
   * 获取队列统计信息
   */
  getStatistics(): Promise<IQueueStatistics>;

  /**
   * 清空队列
   */
  clear(topic?: string): Promise<number>;

  /**
   * 健康检查
   */
  healthCheck(): Promise<IQueueHealth>;
}

/**
 * 队列统计信息接口
 */
export interface IQueueStatistics {
  /** 队列名称 */
  queueName: string;

  /** 总消息数 */
  totalMessages: number;

  /** 待处理消息数 */
  pendingMessages: number;

  /** 处理中消息数 */
  processingMessages: number;

  /** 已完成消息数 */
  completedMessages: number;

  /** 失败消息数 */
  failedMessages: number;

  /** 延迟消息数 */
  delayedMessages: number;

  /** 平均处理时间（毫秒） */
  averageProcessingTime: number;

  /** 吞吐量（每秒消息数） */
  throughput: number;

  /** 错误率 */
  errorRate: number;

  /** 最后更新时间 */
  lastUpdatedAt: Date;
}

/**
 * 队列健康状态接口
 */
export interface IQueueHealth {
  /** 是否健康 */
  healthy: boolean;

  /** 状态描述 */
  status: string;

  /** 连接状态 */
  connected: boolean;

  /** 最后检查时间 */
  lastCheckAt: Date;

  /** 详细信息 */
  details: Record<string, unknown>;
}

/**
 * 消息路由器接口
 */
export interface IMessageRouter {
  /**
   * 路由消息到目标队列
   */
  route(message: IMessage): Promise<string[]>;

  /**
   * 添加路由规则
   */
  addRoute(pattern: string, targetQueue: string): void;

  /**
   * 移除路由规则
   */
  removeRoute(pattern: string): void;

  /**
   * 获取所有路由规则
   */
  getRoutes(): Record<string, string>;
}

/**
 * 消息分发器接口
 */
export interface IMessageDistributor {
  /**
   * 分发消息到多个目标
   */
  distribute(message: IMessage, targets: string[]): Promise<void>;

  /**
   * 广播消息到所有订阅者
   */
  broadcast(message: IMessage): Promise<void>;

  /**
   * 多播消息到指定组
   */
  multicast(message: IMessage, groups: string[]): Promise<void>;
}

/**
 * 消息传递服务接口
 */
export interface IMessagingService {
  /**
   * 发送消息
   */
  send(
    topic: string,
    payload: unknown,
    options?: IMessageSendOptions,
  ): Promise<void>;

  /**
   * 发布事件
   */
  publish(
    eventType: string,
    eventData: unknown,
    options?: IMessageSendOptions,
  ): Promise<void>;

  /**
   * 订阅主题
   */
  subscribe(
    topic: string,
    handler: (message: unknown) => Promise<void>,
  ): Promise<string>;

  /**
   * 取消订阅
   */
  unsubscribe(subscriptionId: string): Promise<void>;

  /**
   * 请求响应模式
   */
  request<T>(topic: string, payload: unknown, timeout?: number): Promise<T>;

  /**
   * 响应请求
   */
  reply(message: IMessage, response: unknown): Promise<void>;
}

/**
 * 消息传递配置接口
 */
export interface IMessagingConfig {
  /** 默认队列类型 */
  defaultQueueType: 'bull' | 'rabbitmq' | 'kafka';

  /** 队列配置 */
  queues: {
    [queueName: string]: {
      type: 'bull' | 'rabbitmq' | 'kafka';
      config: Record<string, unknown>;
    };
  };

  /** 是否启用多租户隔离 */
  enableTenantIsolation: boolean;

  /** 是否启用消息持久化 */
  enablePersistence: boolean;

  /** 是否启用消息压缩 */
  enableCompression: boolean;

  /** 是否启用消息加密 */
  enableEncryption: boolean;

  /** 默认消息过期时间（毫秒） */
  defaultTTL: number;

  /** 默认重试次数 */
  defaultMaxRetries: number;

  /** 死信队列配置 */
  deadLetterQueue?: {
    enabled: boolean;
    queueName: string;
    maxAge: number;
  };

  /** 监控配置 */
  monitoring?: {
    enabled: boolean;
    metricsInterval: number;
    healthCheckInterval: number;
  };
}
