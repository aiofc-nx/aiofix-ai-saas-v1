/**
 * 装饰器工厂
 *
 * @description 创建和管理各种消息传递装饰器
 * 提供统一的装饰器创建接口，简化装饰器的使用
 *
 * ## 核心功能
 *
 * ### 🏭 **工厂模式**
 * - 统一的装饰器创建接口
 * - 封装装饰器的复杂实现细节
 * - 支持装饰器的参数验证和默认值
 *
 * ### 🔧 **类型安全**
 * - 强类型的装饰器参数
 * - 编译时类型检查
 * - 智能的类型推断
 *
 * ### 📝 **元数据管理**
 * - 自动收集和存储装饰器元数据
 * - 支持反射和运行时查询
 * - 集成装饰器注册表
 *
 * @example
 * ```typescript
 * const factory = new DecoratorFactory();
 *
 * // 创建消息处理器装饰器
 * const MessageHandler = factory.createMessageHandler('user.created', {
 *   queue: 'user-events',
 *   priority: MessagePriority.HIGH
 * });
 *
 * // 使用装饰器
 * @MessageHandler
 * export class UserCreatedHandler {
 *   async handle(message: UserCreatedMessage): Promise<void> {
 *     // 处理逻辑
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import {
	IDecoratorFactory,
	IMessageHandlerOptions,
	IEventHandlerOptions,
	IQueueProcessorOptions,
	ISagaOptions,
	ISubscribeOptions,
	IMessageHandlerMetadata
} from './messaging-decorators.interface';
import { getDecoratorRegistry } from './decorator-registry';

/**
 * 装饰器工厂实现
 *
 * 负责创建各种类型的消息传递装饰器
 */
export class DecoratorFactory implements IDecoratorFactory {
	private readonly registry = getDecoratorRegistry();

	/**
	 * 创建消息处理器装饰器
	 *
	 * @param topic - 消息主题
	 * @param options - 装饰器选项
	 * @returns 类装饰器函数
	 */
	createMessageHandler(topic: string, options: IMessageHandlerOptions = {}): ClassDecorator {
		return (target: object) => {
			this.validateTarget(target, 'MessageHandler');

			const metadata: IMessageHandlerMetadata = {
				handlerType: 'message',
				target: topic,
				options,
				handlerClass: target as new (...args: unknown[]) => unknown,
				createdAt: new Date()
			};

			this.registry.registerHandler(metadata);

			// 添加元数据到类上，便于运行时访问
			Reflect.defineMetadata('messaging:handler', metadata, target);

			// 返回原始类
			return target as any;
		};
	}

	/**
	 * 创建事件处理器装饰器
	 *
	 * @param events - 事件列表
	 * @param options - 装饰器选项
	 * @returns 类装饰器函数
	 */
	createEventHandler(events: string | string[], options: IEventHandlerOptions = {}): ClassDecorator {
		return (target: object) => {
			this.validateTarget(target, 'EventHandler');

			const eventList = Array.isArray(events) ? events : [events];

			const metadata: IMessageHandlerMetadata = {
				handlerType: 'event',
				target: eventList,
				options,
				handlerClass: target as new (...args: unknown[]) => unknown,
				createdAt: new Date()
			};

			this.registry.registerHandler(metadata);

			// 添加元数据到类上
			Reflect.defineMetadata('messaging:handler', metadata, target);

			// 返回原始类
			return target as any;
		};
	}

	/**
	 * 创建队列处理器装饰器
	 *
	 * @param options - 装饰器选项
	 * @returns 类装饰器函数
	 */
	createQueueProcessor(options: IQueueProcessorOptions): ClassDecorator {
		return (target: object) => {
			this.validateTarget(target, 'QueueProcessor');
			this.validateQueueProcessorOptions(options);

			const metadata: IMessageHandlerMetadata = {
				handlerType: 'queue',
				target: options.queueName,
				options,
				handlerClass: target as new (...args: unknown[]) => unknown,
				createdAt: new Date()
			};

			this.registry.registerHandler(metadata);

			// 添加元数据到类上
			Reflect.defineMetadata('messaging:handler', metadata, target);

			// 返回原始类
			return target as any;
		};
	}

	/**
	 * 创建Saga装饰器
	 *
	 * @param options - 装饰器选项
	 * @returns 类装饰器函数
	 */
	createSaga(options: ISagaOptions): ClassDecorator {
		return (target: object) => {
			this.validateTarget(target, 'Saga');
			this.validateSagaOptions(options);

			const metadata: IMessageHandlerMetadata = {
				handlerType: 'saga',
				target: options.triggerEvents,
				options,
				handlerClass: target as new (...args: unknown[]) => unknown,
				createdAt: new Date()
			};

			this.registry.registerHandler(metadata);

			// 添加元数据到类上
			Reflect.defineMetadata('messaging:handler', metadata, target);

			// 返回原始类
			return target as any;
		};
	}

	/**
	 * 创建订阅装饰器
	 *
	 * @param topic - 订阅主题
	 * @param options - 装饰器选项
	 * @returns 方法装饰器函数
	 */
	createSubscribe(topic: string, options: ISubscribeOptions = {}): MethodDecorator {
		return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
			this.validateMethod(target, propertyKey, descriptor, 'Subscribe');

			const methodName = String(propertyKey);
			const handlerClass = target.constructor as new (...args: unknown[]) => unknown;

			const metadata: IMessageHandlerMetadata = {
				handlerType: 'subscribe',
				target: topic,
				options,
				handlerClass,
				methodName,
				createdAt: new Date()
			};

			this.registry.registerHandler(metadata);

			// 添加元数据到方法上
			Reflect.defineMetadata('messaging:subscribe', metadata, target, propertyKey);

			// 返回原始描述符
			return descriptor;
		};
	}

	// ==================== 私有验证方法 ====================

	/**
	 * 验证装饰器目标类
	 *
	 * @param target - 目标类
	 * @param decoratorName - 装饰器名称
	 */
	private validateTarget(target: object, decoratorName: string): void {
		if (typeof target !== 'function') {
			throw new Error(`@${decoratorName} 装饰器只能用于类`);
		}

		// 检查是否已经应用了其他处理器装饰器
		const existingMetadata = Reflect.getMetadata('messaging:handler', target);
		if (existingMetadata) {
			throw new Error(`类 ${(target as new (...args: unknown[]) => unknown).name} 已经应用了消息处理器装饰器`);
		}
	}

	/**
	 * 验证方法装饰器目标
	 *
	 * @param target - 目标对象
	 * @param propertyKey - 属性键
	 * @param descriptor - 属性描述符
	 * @param decoratorName - 装饰器名称
	 */
	private validateMethod(
		target: object,
		propertyKey: string | symbol,
		descriptor: PropertyDescriptor,
		decoratorName: string
	): void {
		if (typeof descriptor.value !== 'function') {
			throw new Error(`@${decoratorName} 装饰器只能用于方法`);
		}

		// 检查方法是否已经应用了订阅装饰器
		const existingMetadata = Reflect.getMetadata('messaging:subscribe', target, propertyKey);
		if (existingMetadata) {
			throw new Error(`方法 ${target.constructor.name}.${String(propertyKey)} 已经应用了订阅装饰器`);
		}
	}

	/**
	 * 验证队列处理器选项
	 *
	 * @param options - 队列处理器选项
	 */
	private validateQueueProcessorOptions(options: IQueueProcessorOptions): void {
		if (!options.queueName || typeof options.queueName !== 'string') {
			throw new Error('QueueProcessor 装饰器必须指定有效的队列名称');
		}

		if (options.concurrency !== undefined && (options.concurrency < 1 || !Number.isInteger(options.concurrency))) {
			throw new Error('并发数量必须是大于0的整数');
		}

		if (options.maxRetries !== undefined && (options.maxRetries < 0 || !Number.isInteger(options.maxRetries))) {
			throw new Error('最大重试次数必须是非负整数');
		}
	}

	/**
	 * 验证Saga选项
	 *
	 * @param options - Saga选项
	 */
	private validateSagaOptions(options: ISagaOptions): void {
		if (!options.sagaName || typeof options.sagaName !== 'string') {
			throw new Error('Saga 装饰器必须指定有效的Saga名称');
		}

		if (!Array.isArray(options.triggerEvents) || options.triggerEvents.length === 0) {
			throw new Error('Saga 装饰器必须指定至少一个触发事件');
		}

		if (options.timeout !== undefined && (options.timeout <= 0 || !Number.isInteger(options.timeout))) {
			throw new Error('超时时间必须是大于0的整数');
		}
	}
}

/**
 * 全局装饰器工厂实例
 */
export const decoratorFactory = new DecoratorFactory();

// ==================== 导出的装饰器函数 ====================

/**
 * 消息处理器装饰器
 *
 * 用于标记一个类为消息处理器，处理特定主题的消息
 *
 * @param topic - 消息主题
 * @param options - 装饰器选项
 * @returns 类装饰器
 *
 * @example
 * ```typescript
 * @MessageHandler('user.created', {
 *   queue: 'user-events',
 *   priority: MessagePriority.HIGH,
 *   maxRetries: 3
 * })
 * export class UserCreatedHandler {
 *   async handle(message: UserCreatedMessage): Promise<void> {
 *     // 处理用户创建消息
 *   }
 * }
 * ```
 */
export function MessageHandler(topic: string, options?: IMessageHandlerOptions): ClassDecorator {
	return decoratorFactory.createMessageHandler(topic, options);
}

/**
 * 事件处理器装饰器
 *
 * 用于标记一个类为事件处理器，处理一个或多个事件
 *
 * @param events - 事件名称或事件名称数组
 * @param options - 装饰器选项
 * @returns 类装饰器
 *
 * @example
 * ```typescript
 * @EventHandler(['order.created', 'order.updated'])
 * export class OrderEventHandler {
 *   async handle(event: OrderEvent): Promise<void> {
 *     // 处理订单事件
 *   }
 * }
 * ```
 */
export function EventHandler(events: string | string[], options?: IEventHandlerOptions): ClassDecorator {
	return decoratorFactory.createEventHandler(events, options);
}

/**
 * 队列处理器装饰器
 *
 * 用于标记一个类为队列处理器，处理特定队列的消息
 *
 * @param options - 装饰器选项
 * @returns 类装饰器
 *
 * @example
 * ```typescript
 * @QueueProcessor({
 *   queueName: 'email-queue',
 *   concurrency: 5,
 *   maxRetries: 3
 * })
 * export class EmailQueueProcessor {
 *   async process(job: EmailJob): Promise<void> {
 *     // 处理邮件发送任务
 *   }
 * }
 * ```
 */
export function QueueProcessor(options: IQueueProcessorOptions): ClassDecorator {
	return decoratorFactory.createQueueProcessor(options);
}

/**
 * Saga装饰器
 *
 * 用于标记一个类为Saga，处理长时间运行的业务流程
 *
 * @param options - 装饰器选项
 * @returns 类装饰器
 *
 * @example
 * ```typescript
 * @Saga({
 *   sagaName: 'order-processing',
 *   triggerEvents: ['order.created'],
 *   timeout: 300000 // 5分钟
 * })
 * export class OrderProcessingSaga {
 *   async handle(event: OrderCreatedEvent): Promise<void> {
 *     // 处理订单处理流程
 *   }
 * }
 * ```
 */
export function Saga(options: ISagaOptions): ClassDecorator {
	return decoratorFactory.createSaga(options);
}

/**
 * 订阅装饰器
 *
 * 用于标记一个方法为消息订阅处理器
 *
 * @param topic - 订阅主题
 * @param options - 装饰器选项
 * @returns 方法装饰器
 *
 * @example
 * ```typescript
 * export class UserEventHandler {
 *   @Subscribe('user.created')
 *   async onUserCreated(event: UserCreatedEvent): Promise<void> {
 *     // 处理用户创建事件
 *   }
 *
 *   @Subscribe('user.updated')
 *   async onUserUpdated(event: UserUpdatedEvent): Promise<void> {
 *     // 处理用户更新事件
 *   }
 * }
 * ```
 */
export function Subscribe(topic: string, options?: ISubscribeOptions): MethodDecorator {
	return decoratorFactory.createSubscribe(topic, options);
}
