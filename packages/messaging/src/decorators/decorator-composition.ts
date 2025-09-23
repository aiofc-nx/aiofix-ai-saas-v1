/**
 * 装饰器组合工具
 *
 * @description 提供装饰器组合和链式调用功能
 * 允许将多个装饰器组合成复合装饰器，简化复杂场景的使用
 *
 * ## 核心功能
 *
 * ### 🔗 **装饰器组合**
 * - 多个装饰器的组合应用
 * - 支持类装饰器和方法装饰器
 * - 保持装饰器的执行顺序
 *
 * ### 🏗️ **构建器模式**
 * - 流式的装饰器配置接口
 * - 链式调用支持
 * - 延迟构建和应用
 *
 * ### 🎯 **条件应用**
 * - 基于条件的装饰器应用
 * - 环境感知的装饰器选择
 * - 动态装饰器配置
 *
 * @example
 * ```typescript
 * import { DecoratorComposer, composeDecorators } from '@aiofix/messaging';
 *
 * // 组合多个装饰器
 * const ComposedHandler = composeDecorators(
 *   MessageHandler('user.created'),
 *   Subscribe('user.validated'),
 *   Subscribe('user.activated')
 * );
 *
 * // 使用构建器模式
 * const CustomHandler = DecoratorComposer
 *   .messageHandler('order.created')
 *   .withHighPriority()
 *   .withRetries(5)
 *   .withTenantIsolation()
 *   .build();
 *
 * @CustomHandler
 * class OrderCreatedHandler {
 *   async handle(message: OrderCreatedMessage): Promise<void> {
 *     // 处理订单创建消息
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import {
	IMessageHandlerOptions,
	IEventHandlerOptions,
	IQueueProcessorOptions,
	ISagaOptions
} from './messaging-decorators.interface';
import { MessagePriority } from '../interfaces/messaging.interface';
import {
	createMessageHandler,
	createEventHandler,
	createQueueProcessor,
	createSaga,
	MessageHandlerPresets,
	QueueProcessorPresets
} from './decorator-helpers';

/**
 * 装饰器组合函数
 *
 * @param decorators - 要组合的装饰器数组
 * @returns 组合后的装饰器
 */
export function composeDecorators(...decorators: ClassDecorator[]): ClassDecorator {
	return function (target: any): any {
		// 按顺序应用所有装饰器
		return decorators.reduce((currentTarget, decorator) => {
			return decorator(currentTarget) || currentTarget;
		}, target);
	};
}

/**
 * 装饰器构建器接口
 */
export interface IDecoratorBuilder {
	/**
	 * 构建最终的装饰器
	 */
	build(): ClassDecorator;
}

/**
 * 消息处理器构建器
 */
export class MessageHandlerBuilder implements IDecoratorBuilder {
	private topic: string;
	private options: IMessageHandlerOptions = {};

	constructor(topic: string) {
		this.topic = topic;
	}

	/**
	 * 设置为高优先级
	 */
	withHighPriority(): this {
		this.options.priority = MessagePriority.HIGH;
		return this;
	}

	/**
	 * 设置为低优先级
	 */
	withLowPriority(): this {
		this.options.priority = MessagePriority.LOW;
		return this;
	}

	/**
	 * 设置优先级
	 */
	withPriority(priority: MessagePriority): this {
		this.options.priority = priority;
		return this;
	}

	/**
	 * 设置最大重试次数
	 */
	withRetries(maxRetries: number): this {
		this.options.maxRetries = maxRetries;
		return this;
	}

	/**
	 * 设置超时时间
	 */
	withTimeout(timeout: number): this {
		this.options.timeout = timeout;
		return this;
	}

	/**
	 * 启用租户隔离
	 */
	withTenantIsolation(enabled: boolean = true): this {
		this.options.enableTenantIsolation = enabled;
		return this;
	}

	/**
	 * 设置队列名称
	 */
	withQueue(queueName: string): this {
		(this.options as any).queueName = queueName;
		return this;
	}

	/**
	 * 应用预设配置
	 */
	withPreset(preset: keyof typeof MessageHandlerPresets): this {
		const presetOptions = MessageHandlerPresets[preset];
		this.options = { ...this.options, ...presetOptions };
		return this;
	}

	/**
	 * 构建装饰器
	 */
	build(): ClassDecorator {
		return createMessageHandler(this.topic, this.options);
	}
}

/**
 * 事件处理器构建器
 */
export class EventHandlerBuilder implements IDecoratorBuilder {
	private events: string | string[];
	private options: IEventHandlerOptions = {};

	constructor(events: string | string[]) {
		this.events = events;
	}

	/**
	 * 启用批量处理
	 */
	withBatch(batchSize: number = 50, batchTimeout?: number): this {
		this.options.enableBatch = true;
		this.options.batchSize = batchSize;
		if (batchTimeout) {
			this.options.batchTimeout = batchTimeout;
		}
		return this;
	}

	/**
	 * 设置并发数
	 */
	withConcurrency(concurrency: number): this {
		(this.options as any).concurrency = concurrency;
		return this;
	}

	/**
	 * 启用租户隔离
	 */
	withTenantIsolation(enabled: boolean = true): this {
		this.options.enableTenantIsolation = enabled;
		return this;
	}

	/**
	 * 设置最大重试次数
	 */
	withRetries(maxRetries: number): this {
		(this.options as any).maxRetries = maxRetries;
		return this;
	}

	/**
	 * 构建装饰器
	 */
	build(): ClassDecorator {
		return createEventHandler(this.events, this.options);
	}
}

/**
 * 队列处理器构建器
 */
export class QueueProcessorBuilder implements IDecoratorBuilder {
	private queueName: string;
	private options: Omit<IQueueProcessorOptions, 'queueName'> = {};

	constructor(queueName: string) {
		this.queueName = queueName;
	}

	/**
	 * 设置并发数
	 */
	withConcurrency(concurrency: number): this {
		this.options.concurrency = concurrency;
		return this;
	}

	/**
	 * 设置重试配置
	 */
	withRetries(maxRetries: number, retryDelay?: number): this {
		this.options.maxRetries = maxRetries;
		if (retryDelay) {
			this.options.retryDelay = retryDelay;
		}
		return this;
	}

	/**
	 * 启用死信队列
	 */
	withDeadLetterQueue(deadLetterQueueName?: string): this {
		this.options.enableDeadLetterQueue = true;
		if (deadLetterQueueName) {
			this.options.deadLetterQueueName = deadLetterQueueName;
		}
		return this;
	}

	/**
	 * 启用租户隔离
	 */
	withTenantIsolation(enabled: boolean = true): this {
		this.options.enableTenantIsolation = enabled;
		return this;
	}

	/**
	 * 应用预设配置
	 */
	withPreset(preset: keyof typeof QueueProcessorPresets): this {
		const presetOptions = QueueProcessorPresets[preset];
		this.options = { ...this.options, ...presetOptions };
		return this;
	}

	/**
	 * 构建装饰器
	 */
	build(): ClassDecorator {
		return createQueueProcessor(this.queueName, this.options);
	}
}

/**
 * Saga构建器
 */
export class SagaBuilder implements IDecoratorBuilder {
	private sagaName: string;
	private triggerEvents: string[];
	private options: Omit<ISagaOptions, 'sagaName' | 'triggerEvents'> = {};

	constructor(sagaName: string, triggerEvents: string[]) {
		this.sagaName = sagaName;
		this.triggerEvents = triggerEvents;
	}

	/**
	 * 设置超时时间
	 */
	withTimeout(timeout: number): this {
		this.options.timeout = timeout;
		return this;
	}

	/**
	 * 启用持久化
	 */
	withPersistence(enabled: boolean = true): this {
		this.options.enablePersistence = enabled;
		return this;
	}

	/**
	 * 启用租户隔离
	 */
	withTenantIsolation(enabled: boolean = true): this {
		this.options.enableTenantIsolation = enabled;
		return this;
	}

	/**
	 * 设置补偿策略
	 */
	withCompensation(compensationStrategy: string): this {
		(this.options as any).compensationStrategy = compensationStrategy;
		return this;
	}

	/**
	 * 构建装饰器
	 */
	build(): ClassDecorator {
		return createSaga(this.sagaName, this.triggerEvents, this.options);
	}
}

/**
 * 装饰器组合器主类
 */
export class DecoratorComposer {
	/**
	 * 创建消息处理器构建器
	 */
	static messageHandler(topic: string): MessageHandlerBuilder {
		return new MessageHandlerBuilder(topic);
	}

	/**
	 * 创建事件处理器构建器
	 */
	static eventHandler(events: string | string[]): EventHandlerBuilder {
		return new EventHandlerBuilder(events);
	}

	/**
	 * 创建队列处理器构建器
	 */
	static queueProcessor(queueName: string): QueueProcessorBuilder {
		return new QueueProcessorBuilder(queueName);
	}

	/**
	 * 创建Saga构建器
	 */
	static saga(sagaName: string, triggerEvents: string[]): SagaBuilder {
		return new SagaBuilder(sagaName, triggerEvents);
	}
}

// ==================== 条件装饰器 ====================

/**
 * 条件装饰器选项
 */
export interface IConditionalDecoratorOptions {
	/** 条件函数 */
	condition: () => boolean;
	/** 满足条件时应用的装饰器 */
	whenTrue: ClassDecorator;
	/** 不满足条件时应用的装饰器（可选） */
	whenFalse?: ClassDecorator;
}

/**
 * 条件装饰器
 *
 * @description 根据条件动态应用不同的装饰器
 *
 * @param options - 条件装饰器选项
 * @returns 类装饰器
 */
export function conditionalDecorator(options: IConditionalDecoratorOptions): ClassDecorator {
	return function (target: any): any {
		if (options.condition()) {
			return options.whenTrue(target) || target;
		} else if (options.whenFalse) {
			return options.whenFalse(target) || target;
		}
		return target;
	};
}

/**
 * 环境感知装饰器
 *
 * @description 根据环境变量选择不同的装饰器配置
 *
 * @param topic - 消息主题
 * @param productionOptions - 生产环境选项
 * @param developmentOptions - 开发环境选项
 * @returns 类装饰器
 */
export function environmentAwareMessageHandler(
	topic: string,
	productionOptions: IMessageHandlerOptions,
	developmentOptions: IMessageHandlerOptions
): ClassDecorator {
	const isProduction = process.env.NODE_ENV === 'production';
	const options = isProduction ? productionOptions : developmentOptions;
	return createMessageHandler(topic, options);
}

/**
 * 租户感知装饰器
 *
 * @description 根据租户配置动态调整装饰器行为
 *
 * @param topic - 消息主题
 * @param baseOptions - 基础选项
 * @param tenantOverrides - 租户特定覆盖选项
 * @returns 类装饰器
 */
export function tenantAwareMessageHandler(
	topic: string,
	baseOptions: IMessageHandlerOptions,
	tenantOverrides: Record<string, Partial<IMessageHandlerOptions>> = {}
): ClassDecorator {
	return function (target: any): any {
		// 在运行时获取租户信息并应用相应的配置
		const tenantId = process.env.TENANT_ID || 'default';
		const tenantOptions = tenantOverrides[tenantId] || {};
		const finalOptions = { ...baseOptions, ...tenantOptions };

		return createMessageHandler(topic, finalOptions)(target) || target;
	};
}

// ==================== 装饰器工厂函数 ====================

/**
 * 创建通用消息处理器工厂
 *
 * @param defaultOptions - 默认选项
 * @returns 消息处理器工厂函数
 */
export function createMessageHandlerFactory(
	defaultOptions: IMessageHandlerOptions = {}
): (topic: string, options?: Partial<IMessageHandlerOptions>) => ClassDecorator {
	return (topic: string, options: Partial<IMessageHandlerOptions> = {}) => {
		return createMessageHandler(topic, { ...defaultOptions, ...options });
	};
}

/**
 * 创建通用事件处理器工厂
 *
 * @param defaultOptions - 默认选项
 * @returns 事件处理器工厂函数
 */
export function createEventHandlerFactory(
	defaultOptions: IEventHandlerOptions = {}
): (events: string | string[], options?: Partial<IEventHandlerOptions>) => ClassDecorator {
	return (events: string | string[], options: Partial<IEventHandlerOptions> = {}) => {
		return createEventHandler(events, { ...defaultOptions, ...options });
	};
}

/**
 * 创建通用队列处理器工厂
 *
 * @param defaultOptions - 默认选项
 * @returns 队列处理器工厂函数
 */
export function createQueueProcessorFactory(
	defaultOptions: Partial<IQueueProcessorOptions> = {}
): (queueName: string, options?: Partial<IQueueProcessorOptions>) => ClassDecorator {
	return (queueName: string, options: Partial<IQueueProcessorOptions> = {}) => {
		return createQueueProcessor(queueName, { ...defaultOptions, ...options });
	};
}
