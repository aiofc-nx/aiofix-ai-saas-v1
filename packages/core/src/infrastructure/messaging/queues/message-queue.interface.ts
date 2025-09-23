/**
 * 消息队列接口
 *
 * @description 定义消息队列的核心功能，包括消息的发送、接收、处理等操作
 * 消息队列是异步通信的基础设施，支持发布-订阅、点对点等通信模式
 *
 * ## 业务规则
 *
 * ### 消息发送规则
 * - 消息必须具有有效的类型和载荷
 * - 支持消息优先级和过期时间设置
 * - 消息发送必须具有原子性
 *
 * ### 消息接收规则
 * - 支持按消息类型过滤接收
 * - 支持消息的批量接收
 * - 提供消息确认机制
 *
 * ### 消息处理规则
 * - 支持消息的异步处理
 * - 提供消息重试机制
 * - 支持死信队列处理
 *
 * ### 性能优化规则
 * - 支持消息的批量操作
 * - 提供消息的持久化存储
 * - 支持消息的压缩和序列化
 *
 * @example
 * ```typescript
 * // 发送消息
 * await messageQueue.send('UserCreated', {
 *   userId: 'user-123',
 *   email: 'user@example.com'
 * }, {
 *   priority: MessagePriority.HIGH,
 *   ttl: 3600000
 * });
 *
 * // 接收消息
 * const messages = await messageQueue.receive('UserCreated', 10);
 *
 * // 确认消息
 * await messageQueue.acknowledge(message.id);
 * ```
 *
 * @since 1.0.0
 */

import type { IMessage, IMessageOptions } from './message.interface';
import type { IMessageHandler } from './message-handler.interface';

/**
 * 消息队列统计信息接口
 *
 * @description 定义消息队列的性能统计信息
 */
export interface IQueueStatistics {
  /** 队列名称 */
  readonly queueName: string;
  /** 总消息数量 */
  readonly totalMessages: number;
  /** 待处理消息数量 */
  readonly pendingMessages: number;
  /** 处理中消息数量 */
  readonly processingMessages: number;
  /** 已完成消息数量 */
  readonly completedMessages: number;
  /** 失败消息数量 */
  readonly failedMessages: number;
  /** 平均处理时间（毫秒） */
  readonly averageProcessingTime: number;
  /** 最后更新时间 */
  readonly lastUpdatedAt: Date;
}

/**
 * 消息队列接口
 *
 * @description 定义消息队列的核心功能
 */
export interface IMessageQueue {
  /**
   * 发送消息到队列
   *
   * @description 将消息发送到指定的队列中
   * 支持消息优先级、过期时间等选项设置
   *
   * @param messageType 消息类型
   * @param payload 消息载荷
   * @param options 消息选项
   * @returns 发送的消息对象
   *
   * @example
   * ```typescript
   * const message = await messageQueue.send('UserCreated', {
   *   userId: 'user-123',
   *   email: 'user@example.com'
   * }, {
   *   priority: MessagePriority.HIGH,
   *   ttl: 3600000
   * });
   * ```
   */
  send(
    messageType: string,
    payload: Record<string, unknown>,
    options?: IMessageOptions,
  ): Promise<IMessage>;

  /**
   * 批量发送消息
   *
   * @description 批量发送多个消息到队列中
   * 提供更好的性能和原子性保证
   *
   * @param messages 消息列表
   * @returns 发送的消息对象列表
   *
   * @example
   * ```typescript
   * const messages = await messageQueue.sendBatch([
   *   { type: 'UserCreated', payload: userData1 },
   *   { type: 'UserCreated', payload: userData2 }
   * ]);
   * ```
   */
  sendBatch(
    messages: Array<{
      type: string;
      payload: Record<string, unknown>;
      options?: IMessageOptions;
    }>,
  ): Promise<IMessage[]>;

  /**
   * 接收消息
   *
   * @description 从队列中接收指定类型的消息
   * 支持批量接收和消息过滤
   *
   * @param messageType 消息类型，可选
   * @param maxMessages 最大接收消息数量
   * @param timeout 接收超时时间（毫秒）
   * @returns 接收到的消息列表
   *
   * @example
   * ```typescript
   * // 接收特定类型的消息
   * const messages = await messageQueue.receive('UserCreated', 10);
   *
   * // 接收任意类型的消息
   * const anyMessages = await messageQueue.receive(undefined, 5);
   * ```
   */
  receive(
    messageType?: string,
    maxMessages?: number,
    timeout?: number,
  ): Promise<IMessage[]>;

  /**
   * 确认消息处理完成
   *
   * @description 确认消息已被成功处理
   * 消息确认后将从队列中移除
   *
   * @param messageId 消息ID
   * @returns 确认是否成功
   *
   * @example
   * ```typescript
   * await messageQueue.acknowledge(message.id);
   * ```
   */
  acknowledge(messageId: string): Promise<boolean>;

  /**
   * 拒绝消息处理
   *
   * @description 拒绝消息处理，可选择是否重新入队
   * 拒绝的消息可能会被重新处理或发送到死信队列
   *
   * @param messageId 消息ID
   * @param requeue 是否重新入队
   * @param reason 拒绝原因
   * @returns 拒绝是否成功
   *
   * @example
   * ```typescript
   * await messageQueue.reject(message.id, true, '处理失败');
   * ```
   */
  reject(
    messageId: string,
    requeue?: boolean,
    reason?: string,
  ): Promise<boolean>;

  /**
   * 注册消息处理器
   *
   * @description 注册消息处理器到队列中
   * 处理器将自动处理指定类型的消息
   *
   * @param messageType 消息类型
   * @param handler 消息处理器
   * @returns 注册是否成功
   *
   * @example
   * ```typescript
   * await messageQueue.registerHandler('UserCreated', userCreatedHandler);
   * ```
   */
  registerHandler(
    messageType: string,
    handler: IMessageHandler,
  ): Promise<boolean>;

  /**
   * 注销消息处理器
   *
   * @description 从队列中注销消息处理器
   *
   * @param messageType 消息类型
   * @param handlerName 处理器名称
   * @returns 注销是否成功
   *
   * @example
   * ```typescript
   * await messageQueue.unregisterHandler('UserCreated', 'UserCreatedHandler');
   * ```
   */
  unregisterHandler(messageType: string, handlerName: string): Promise<boolean>;

  /**
   * 获取队列统计信息
   *
   * @description 获取队列的性能统计信息
   * 包括消息数量、处理时间等指标
   *
   * @returns 队列统计信息
   *
   * @example
   * ```typescript
   * const stats = await messageQueue.getStatistics();
   * console.log('待处理消息数量:', stats.pendingMessages);
   * ```
   */
  getStatistics(): Promise<IQueueStatistics>;

  /**
   * 清空队列
   *
   * @description 清空队列中的所有消息
   * 通常用于测试或维护目的
   *
   * @param messageType 消息类型，可选
   * @returns 清空的消息数量
   *
   * @example
   * ```typescript
   * // 清空所有消息
   * const clearedCount = await messageQueue.clear();
   *
   * // 清空特定类型的消息
   * const clearedCount = await messageQueue.clear('UserCreated');
   * ```
   */
  clear(messageType?: string): Promise<number>;

  /**
   * 检查队列是否健康
   *
   * @description 检查队列的健康状态
   * 用于监控和故障检测
   *
   * @returns 队列是否健康
   *
   * @example
   * ```typescript
   * const isHealthy = await messageQueue.isHealthy();
   * if (!isHealthy) {
   *   // 处理不健康的队列
   * }
   * ```
   */
  isHealthy(): Promise<boolean>;

  /**
   * 启动队列
   *
   * @description 启动消息队列服务
   * 开始处理消息和运行处理器
   *
   * @returns 启动是否成功
   *
   * @example
   * ```typescript
   * await messageQueue.start();
   * ```
   */
  start(): Promise<void>;

  /**
   * 停止队列
   *
   * @description 停止消息队列服务
   * 停止处理消息和运行处理器
   *
   * @returns 停止是否成功
   *
   * @example
   * ```typescript
   * await messageQueue.stop();
   * ```
   */
  stop(): Promise<void>;
}
