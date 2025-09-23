/**
 * 消息处理器接口
 *
 * @description 定义消息处理器的基本结构和行为
 * 消息处理器负责处理特定类型的消息，是消息队列系统的核心组件
 *
 * ## 业务规则
 *
 * ### 处理器注册规则
 * - 每个处理器必须注册到消息队列管理器
 * - 处理器与消息类型一一对应
 * - 支持一个消息类型对应多个处理器
 *
 * ### 消息处理规则
 * - 处理器必须实现异步处理逻辑
 * - 支持消息处理的成功和失败状态
 * - 提供详细的处理结果信息
 *
 * ### 错误处理规则
 * - 处理器必须处理各种异常情况
 * - 支持消息重试机制
 * - 提供错误恢复策略
 *
 * ### 性能监控规则
 * - 记录消息处理时间
 * - 监控处理器性能指标
 * - 支持处理器的健康检查
 *
 * @example
 * ```typescript
 * @MessageHandler('UserCreated')
 * export class UserCreatedHandler implements IMessageHandler {
 *   async handle(message: IMessage): Promise<IMessageResult> {
 *     const startTime = Date.now();
 *
 *     try {
 *       const userData = message.payload as UserData;
 *       await this.userService.createUser(userData);
 *
 *       return {
 *         success: true,
 *         data: { userId: userData.id },
 *         processingTime: Date.now() - startTime,
 *         shouldRetry: false
 *       };
 *     } catch (error) {
 *       return {
 *         success: false,
 *         error: error.message,
 *         processingTime: Date.now() - startTime,
 *         shouldRetry: true,
 *         retryDelay: 5000
 *       };
 *     }
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import type { IMessage, IMessageResult } from './message.interface';

/**
 * 消息处理器接口
 *
 * @description 定义消息处理器的基本行为
 */
export interface IMessageHandler {
  /**
   * 处理消息
   *
   * @description 处理指定类型的消息，返回处理结果
   * 处理器应该实现具体的业务逻辑，并返回详细的处理结果
   *
   * @param message 要处理的消息
   * @returns 消息处理结果
   *
   * @example
   * ```typescript
   * const result = await handler.handle(message);
   * if (result.success) {
   *   console.log('消息处理成功:', result.data);
   * } else {
   *   console.error('消息处理失败:', result.error);
   * }
   * ```
   */
  handle(message: IMessage): Promise<IMessageResult>;

  /**
   * 获取处理器支持的消息类型
   *
   * @description 返回此处理器支持的消息类型列表
   * 用于消息路由和处理器匹配
   *
   * @returns 支持的消息类型列表
   *
   * @example
   * ```typescript
   * const supportedTypes = handler.getSupportedTypes();
   * console.log('支持的消息类型:', supportedTypes);
   * ```
   */
  getSupportedTypes(): string[];

  /**
   * 检查处理器是否支持指定消息类型
   *
   * @description 检查此处理器是否能够处理指定类型的消息
   *
   * @param messageType 消息类型
   * @returns 是否支持该消息类型
   *
   * @example
   * ```typescript
   * if (handler.supports('UserCreated')) {
   *   await handler.handle(message);
   * }
   * ```
   */
  supports(messageType: string): boolean;

  /**
   * 获取处理器名称
   *
   * @description 返回处理器的唯一名称
   * 用于日志记录和监控
   *
   * @returns 处理器名称
   */
  getName(): string;

  /**
   * 获取处理器优先级
   *
   * @description 返回处理器的优先级
   * 当多个处理器处理同一消息类型时，优先级高的处理器优先执行
   *
   * @returns 处理器优先级（数字越大优先级越高）
   */
  getPriority(): number;

  /**
   * 检查处理器是否健康
   *
   * @description 检查处理器的健康状态
   * 用于监控和故障检测
   *
   * @returns 处理器是否健康
   *
   * @example
   * ```typescript
   * const isHealthy = await handler.isHealthy();
   * if (!isHealthy) {
   *   // 处理不健康的处理器
   * }
   * ```
   */
  isHealthy(): Promise<boolean>;

  /**
   * 获取处理器统计信息
   *
   * @description 返回处理器的性能统计信息
   * 包括处理消息数量、成功率、平均处理时间等
   *
   * @returns 处理器统计信息
   *
   * @example
   * ```typescript
   * const stats = handler.getStatistics();
   * console.log('处理消息数量:', stats.totalMessages);
   * console.log('成功率:', stats.successRate);
   * ```
   */
  getStatistics(): IHandlerStatistics;
}

/**
 * 处理器统计信息接口
 *
 * @description 定义处理器的性能统计信息
 */
export interface IHandlerStatistics {
  /** 处理器名称 */
  readonly name: string;
  /** 总处理消息数量 */
  readonly totalMessages: number;
  /** 成功处理消息数量 */
  readonly successfulMessages: number;
  /** 失败处理消息数量 */
  readonly failedMessages: number;
  /** 成功率（0-1之间的小数） */
  readonly successRate: number;
  /** 平均处理时间（毫秒） */
  readonly averageProcessingTime: number;
  /** 最后处理时间 */
  readonly lastProcessedAt?: Date;
  /** 最后更新时间 */
  readonly lastUpdatedAt: Date;
}

/**
 * 消息处理器工厂接口
 *
 * @description 定义创建消息处理器的工厂接口
 */
export interface IMessageHandlerFactory {
  /**
   * 创建消息处理器
   *
   * @param handlerType 处理器类型
   * @param options 创建选项
   * @returns 消息处理器实例
   */
  createHandler(
    handlerType: string,
    options?: Record<string, unknown>,
  ): Promise<IMessageHandler>;

  /**
   * 注册处理器类型
   *
   * @param handlerType 处理器类型
   * @param handlerClass 处理器类
   */
  registerHandlerType(
    handlerType: string,
    handlerClass: new (...args: any[]) => IMessageHandler,
  ): void;

  /**
   * 获取已注册的处理器类型
   *
   * @returns 已注册的处理器类型列表
   */
  getRegisteredTypes(): string[];
}
