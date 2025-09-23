/**
 * 装饰器辅助函数
 *
 * @description 提供便捷的装饰器创建和配置函数
 * 简化装饰器的使用，提供更友好的API
 *
 * ## 核心功能
 *
 * ### 🛠️ **便捷创建**
 * - 简化装饰器创建流程
 * - 提供常用配置的快捷方式
 * - 支持链式调用和流式配置
 *
 * ### ⚙️ **智能默认值**
 * - 基于上下文的智能默认配置
 * - 环境感知的配置调整
 * - 最佳实践的默认设置
 *
 * ### 🎯 **类型安全**
 * - 强类型的配置选项
 * - 编译时参数验证
 * - 智能的类型推断
 *
 * @example
 * ```typescript
 * import { createMessageHandler, createEventHandler } from '@aiofix/messaging';
 *
 * // 创建高优先级消息处理器
 * const HighPriorityMessageHandler = createMessageHandler('critical.alert', {
 *   priority: MessagePriority.HIGH,
 *   maxRetries: 5,
 *   timeout: 10000
 * });
 *
 * // 创建批量事件处理器
 * const BatchEventHandler = createEventHandler(['user.created', 'user.updated'], {
 *   enableBatch: true,
 *   batchSize: 100
 * });
 * ```
 *
 * @since 1.0.0
 */

import {
  IMessageHandlerOptions,
  IEventHandlerOptions,
  IQueueProcessorOptions,
  ISagaOptions,
  ISubscribeOptions,
} from './messaging-decorators.interface';
import { MessagePriority } from '../interfaces/messaging.interface';
import { decoratorFactory } from './decorator-factory';

/**
 * 创建消息处理器装饰器的便捷函数
 *
 * @param topic - 消息主题
 * @param options - 装饰器选项
 * @returns 类装饰器
 */
export function createMessageHandler(
  topic: string,
  options: IMessageHandlerOptions = {},
): ClassDecorator {
  return decoratorFactory.createMessageHandler(topic, options);
}

/**
 * 创建高优先级消息处理器装饰器
 *
 * @param topic - 消息主题
 * @param options - 装饰器选项
 * @returns 类装饰器
 */
export function createHighPriorityMessageHandler(
  topic: string,
  options: Omit<IMessageHandlerOptions, 'priority'> = {},
): ClassDecorator {
  return createMessageHandler(topic, {
    ...options,
    priority: MessagePriority.HIGH,
    maxRetries: options.maxRetries || 5,
    timeout: options.timeout || 30000,
  });
}

/**
 * 创建低优先级消息处理器装饰器
 *
 * @param topic - 消息主题
 * @param options - 装饰器选项
 * @returns 类装饰器
 */
export function createLowPriorityMessageHandler(
  topic: string,
  options: Omit<IMessageHandlerOptions, 'priority'> = {},
): ClassDecorator {
  return createMessageHandler(topic, {
    ...options,
    priority: MessagePriority.LOW,
    maxRetries: options.maxRetries || 1,
    timeout: options.timeout || 60000,
  });
}

/**
 * 创建事件处理器装饰器的便捷函数
 *
 * @param events - 事件名称或事件名称数组
 * @param options - 装饰器选项
 * @returns 类装饰器
 */
export function createEventHandler(
  events: string | string[],
  options: IEventHandlerOptions = {},
): ClassDecorator {
  return decoratorFactory.createEventHandler(events, options);
}

/**
 * 创建批量事件处理器装饰器
 *
 * @param events - 事件名称或事件名称数组
 * @param batchSize - 批量大小
 * @param options - 装饰器选项
 * @returns 类装饰器
 */
export function createBatchEventHandler(
  events: string | string[],
  batchSize: number = 50,
  options: Omit<IEventHandlerOptions, 'enableBatch' | 'batchSize'> = {},
): ClassDecorator {
  return createEventHandler(events, {
    ...options,
    enableBatch: true,
    batchSize,
    batchTimeout: options.batchTimeout || 5000,
  });
}

/**
 * 创建队列处理器装饰器的便捷函数
 *
 * @param queueName - 队列名称
 * @param options - 装饰器选项
 * @returns 类装饰器
 */
export function createQueueProcessor(
  queueName: string,
  options: Omit<IQueueProcessorOptions, 'queueName'> = {},
): ClassDecorator {
  return decoratorFactory.createQueueProcessor({
    ...options,
    queueName,
  });
}

/**
 * 创建高并发队列处理器装饰器
 *
 * @param queueName - 队列名称
 * @param concurrency - 并发数量
 * @param options - 装饰器选项
 * @returns 类装饰器
 */
export function createHighConcurrencyQueueProcessor(
  queueName: string,
  concurrency: number = 10,
  options: Omit<IQueueProcessorOptions, 'queueName' | 'concurrency'> = {},
): ClassDecorator {
  return createQueueProcessor(queueName, {
    ...options,
    concurrency,
    maxRetries: options.maxRetries || 3,
    retryDelay: options.retryDelay || 1000,
  });
}

/**
 * 创建可靠队列处理器装饰器（支持死信队列）
 *
 * @param queueName - 队列名称
 * @param options - 装饰器选项
 * @returns 类装饰器
 */
export function createReliableQueueProcessor(
  queueName: string,
  options: Omit<
    IQueueProcessorOptions,
    'queueName' | 'enableDeadLetterQueue'
  > = {},
): ClassDecorator {
  return createQueueProcessor(queueName, {
    ...options,
    enableDeadLetterQueue: true,
    deadLetterQueueName: options.deadLetterQueueName || `${queueName}-dlq`,
    maxRetries: options.maxRetries || 5,
    retryDelay: options.retryDelay || 2000,
  });
}

/**
 * 创建Saga装饰器的便捷函数
 *
 * @param sagaName - Saga名称
 * @param triggerEvents - 触发事件列表
 * @param options - 装饰器选项
 * @returns 类装饰器
 */
export function createSaga(
  sagaName: string,
  triggerEvents: string[],
  options: Omit<ISagaOptions, 'sagaName' | 'triggerEvents'> = {},
): ClassDecorator {
  return decoratorFactory.createSaga({
    ...options,
    sagaName,
    triggerEvents,
  });
}

/**
 * 创建持久化Saga装饰器
 *
 * @param sagaName - Saga名称
 * @param triggerEvents - 触发事件列表
 * @param timeout - 超时时间（毫秒）
 * @param options - 装饰器选项
 * @returns 类装饰器
 */
export function createPersistentSaga(
  sagaName: string,
  triggerEvents: string[],
  timeout: number = 300000, // 5分钟
  options: Omit<
    ISagaOptions,
    'sagaName' | 'triggerEvents' | 'enablePersistence' | 'timeout'
  > = {},
): ClassDecorator {
  return createSaga(sagaName, triggerEvents, {
    ...options,
    timeout,
    enablePersistence: true,
    enableTenantIsolation: options.enableTenantIsolation !== false, // 默认启用
  });
}

/**
 * 创建订阅装饰器的便捷函数
 *
 * @param topic - 订阅主题
 * @param options - 装饰器选项
 * @returns 方法装饰器
 */
export function createSubscribe(
  topic: string,
  options: ISubscribeOptions = {},
): MethodDecorator {
  return decoratorFactory.createSubscribe(topic, options);
}

/**
 * 创建高优先级订阅装饰器
 *
 * @param topic - 订阅主题
 * @param options - 装饰器选项
 * @returns 方法装饰器
 */
export function createHighPrioritySubscribe(
  topic: string,
  options: Omit<ISubscribeOptions, 'priority'> = {},
): MethodDecorator {
  return createSubscribe(topic, {
    ...options,
    priority: 10, // 高优先级
    maxRetries: options.maxRetries || 3,
    timeout: options.timeout || 30000,
  });
}

/**
 * 创建容错订阅装饰器
 *
 * @param topic - 订阅主题
 * @param maxRetries - 最大重试次数
 * @param options - 装饰器选项
 * @returns 方法装饰器
 */
export function createFaultTolerantSubscribe(
  topic: string,
  maxRetries: number = 5,
  options: Omit<ISubscribeOptions, 'maxRetries'> = {},
): MethodDecorator {
  return createSubscribe(topic, {
    ...options,
    maxRetries,
    timeout: options.timeout || 60000,
  });
}

// ==================== 配置预设 ====================

/**
 * 消息处理器配置预设
 */
export const MessageHandlerPresets = {
  /**
   * 实时处理预设 - 高优先级，快速响应
   */
  REAL_TIME: {
    priority: MessagePriority.HIGH,
    maxRetries: 2,
    timeout: 5000,
    enableTenantIsolation: true,
  } as IMessageHandlerOptions,

  /**
   * 批量处理预设 - 正常优先级，较长超时
   */
  BATCH_PROCESSING: {
    priority: MessagePriority.NORMAL,
    maxRetries: 3,
    timeout: 60000,
    enableTenantIsolation: true,
  } as IMessageHandlerOptions,

  /**
   * 后台任务预设 - 低优先级，长时间运行
   */
  BACKGROUND_TASK: {
    priority: MessagePriority.LOW,
    maxRetries: 1,
    timeout: 300000, // 5分钟
    enableTenantIsolation: false,
  } as IMessageHandlerOptions,

  /**
   * 关键任务预设 - 高优先级，高可靠性
   */
  CRITICAL_TASK: {
    priority: MessagePriority.HIGH,
    maxRetries: 5,
    timeout: 30000,
    enableTenantIsolation: true,
  } as IMessageHandlerOptions,
};

/**
 * 队列处理器配置预设
 */
export const QueueProcessorPresets = {
  /**
   * 高吞吐量预设 - 高并发，快速处理
   */
  HIGH_THROUGHPUT: {
    concurrency: 20,
    maxRetries: 2,
    retryDelay: 500,
    enableDeadLetterQueue: true,
  } as Partial<IQueueProcessorOptions>,

  /**
   * 可靠处理预设 - 中等并发，高可靠性
   */
  RELIABLE_PROCESSING: {
    concurrency: 5,
    maxRetries: 5,
    retryDelay: 2000,
    enableDeadLetterQueue: true,
    enableTenantIsolation: true,
  } as Partial<IQueueProcessorOptions>,

  /**
   * 资源敏感预设 - 低并发，长时间运行
   */
  RESOURCE_SENSITIVE: {
    concurrency: 1,
    maxRetries: 3,
    retryDelay: 5000,
    enableDeadLetterQueue: false,
  } as Partial<IQueueProcessorOptions>,
};

/**
 * 使用预设创建消息处理器
 *
 * @param topic - 消息主题
 * @param preset - 预设配置
 * @param overrides - 覆盖选项
 * @returns 类装饰器
 */
export function createMessageHandlerWithPreset(
  topic: string,
  preset: keyof typeof MessageHandlerPresets,
  overrides: Partial<IMessageHandlerOptions> = {},
): ClassDecorator {
  const presetOptions = MessageHandlerPresets[preset];
  return createMessageHandler(topic, { ...presetOptions, ...overrides });
}

/**
 * 使用预设创建队列处理器
 *
 * @param queueName - 队列名称
 * @param preset - 预设配置
 * @param overrides - 覆盖选项
 * @returns 类装饰器
 */
export function createQueueProcessorWithPreset(
  queueName: string,
  preset: keyof typeof QueueProcessorPresets,
  overrides: Partial<IQueueProcessorOptions> = {},
): ClassDecorator {
  const presetOptions = QueueProcessorPresets[preset];
  return createQueueProcessor(queueName, { ...presetOptions, ...overrides });
}
