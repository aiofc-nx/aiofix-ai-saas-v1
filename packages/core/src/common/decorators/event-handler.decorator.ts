/**
 * @EventHandler 装饰器
 *
 * 用于标记事件处理器类的装饰器。
 * 该装饰器将事件类型与处理器类关联，并提供丰富的配置选项。
 *
 * ## 业务规则
 *
 * ### 事件类型规则
 * - 每个事件处理器必须指定处理的事件类型
 * - 事件类型必须是字符串，用于标识具体的事件
 * - 事件类型在运行时用于路由事件到正确的处理器
 *
 * ### 配置规则
 * - 装饰器支持优先级配置，用于处理多个处理器的情况
 * - 支持超时配置，防止事件处理无限等待
 * - 支持重试配置，处理临时性失败
 * - 支持幂等性配置，确保重复事件处理的一致性
 * - 支持死信队列配置，处理无法处理的事件
 *
 * ### 元数据规则
 * - 装饰器将配置信息存储为元数据
 * - 元数据用于运行时行为控制和监控
 * - 支持动态配置和运行时调整
 *
 * @description 事件处理器装饰器，用于标记和配置事件处理器
 * @example
 * ```typescript
 * @EventHandler('UserCreated', {
 *   priority: 1,
 *   timeout: 10000,
 *   retry: {
 *     maxRetries: 5,
 *     retryDelay: 2000,
 *     backoffMultiplier: 2
 *   },
 *   enableIdempotency: true,
 *   enableDeadLetterQueue: true,
 *   eventFilter: (event) => event.userType === 'premium'
 * })
 * export class UserCreatedEventHandler implements IEventHandler<UserCreatedEvent> {
 *   async handle(event: UserCreatedEvent): Promise<void> {
 *     // 处理用户创建事件
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
import 'reflect-metadata';
import { BaseDomainEvent } from '../../domain/events/base/base-domain-event';
import { IEventHandler } from '../../application/cqrs/events/base/event-handler.interface';
import { setEventHandlerMetadata, getEventHandlerMetadata as getMetadata } from './metadata.utils';
import {
	IEventHandlerMetadata,
	IRetryConfig,
	IMultiTenantConfig,
	IPerformanceMonitorConfig
} from './metadata.interfaces';
import { DecoratorTarget } from '../types/decorator-types';

/**
 * 事件处理器装饰器选项
 */
export interface IEventHandlerOptions {
	/**
	 * 处理器优先级（数值越小优先级越高）
	 */
	priority?: number;

	/**
	 * 超时时间（毫秒）
	 */
	timeout?: number;

	/**
	 * 重试配置
	 */
	retry?: IRetryConfig;

	/**
	 * 多租户配置
	 */
	multiTenant?: IMultiTenantConfig;

	/**
	 * 性能监控配置
	 */
	performanceMonitor?: IPerformanceMonitorConfig;

	/**
	 * 是否启用日志记录
	 */
	enableLogging?: boolean;

	/**
	 * 是否启用审计
	 */
	enableAudit?: boolean;

	/**
	 * 是否启用性能监控
	 */
	enablePerformanceMonitor?: boolean;

	/**
	 * 是否启用幂等性
	 */
	enableIdempotency?: boolean;

	/**
	 * 是否启用死信队列
	 */
	enableDeadLetterQueue?: boolean;

	/**
	 * 事件排序键
	 */
	orderingKey?: string;

	/**
	 * 事件过滤器
	 */
	eventFilter?: (event: unknown) => boolean;

	/**
	 * 自定义配置
	 */
	customConfig?: Record<string, unknown>;
}

/**
 * 事件处理器装饰器工厂函数
 *
 * @param eventType - 事件类型
 * @param options - 装饰器选项
 * @returns 装饰器函数
 */
export function EventHandler<TEvent extends BaseDomainEvent>(eventType: string, options: IEventHandlerOptions = {}) {
	return function (target: new (...args: unknown[]) => IEventHandler<TEvent>) {
		// 验证目标类实现了 IEventHandler 接口
		const prototype = target.prototype;
		if (typeof prototype.handle !== 'function') {
			throw new Error(`Event handler ${target.name} must implement handle method`);
		}

		// 设置事件处理器元数据
		setEventHandlerMetadata(target, eventType, options);

		// 添加静态方法用于获取事件类型
		Object.defineProperty(target, 'eventType', {
			value: eventType,
			writable: false,
			enumerable: true,
			configurable: false
		});

		// 添加静态方法用于获取处理器优先级
		Object.defineProperty(target, 'priority', {
			value: options.priority || 0,
			writable: false,
			enumerable: true,
			configurable: false
		});

		// 添加静态方法用于检查是否支持指定事件类型
		Object.defineProperty(target, 'supports', {
			value: function (evtType: string): boolean {
				return evtType === eventType;
			},
			writable: false,
			enumerable: true,
			configurable: false
		});

		// 添加静态方法用于获取元数据
		Object.defineProperty(target, 'getMetadata', {
			value: function (): IEventHandlerMetadata | undefined {
				return getMetadata(target);
			},
			writable: false,
			enumerable: true,
			configurable: false
		});

		return target;
	};
}

/**
 * 检查类是否被 @EventHandler 装饰器标记
 *
 * @param target - 目标类
 * @returns 如果被标记则返回 true，否则返回 false
 */
export function isEventHandler(target: DecoratorTarget): boolean {
	return getEventHandlerMetadata(target) !== undefined;
}

/**
 * 获取事件处理器的事件类型
 *
 * @param target - 目标类
 * @returns 事件类型，如果未标记则返回 undefined
 */
export function getEventType(target: DecoratorTarget): string | undefined {
	const metadata = getEventHandlerMetadata(target);
	return metadata?.eventType;
}

/**
 * 获取事件处理器的优先级
 *
 * @param target - 目标类
 * @returns 优先级，如果未标记则返回 undefined
 */
export function getEventHandlerPriority(target: DecoratorTarget): number | undefined {
	const metadata = getEventHandlerMetadata(target);
	return metadata?.priority;
}

/**
 * 检查事件处理器是否支持指定的事件类型
 *
 * @param target - 目标类
 * @param eventType - 事件类型
 * @returns 如果支持则返回 true，否则返回 false
 */
export function supportsEventType(target: DecoratorTarget, eventType: string): boolean {
	const metadata = getEventHandlerMetadata(target);
	return metadata?.eventType === eventType;
}

/**
 * 获取事件处理器的完整元数据
 *
 * @param target - 目标类
 * @returns 事件处理器元数据，如果未标记则返回 undefined
 */
export function getEventHandlerMetadata(target: DecoratorTarget): IEventHandlerMetadata | undefined {
	return getMetadata(target);
}

/**
 * 事件处理器装饰器类型
 */
export type EventHandlerDecorator = typeof EventHandler;

/**
 * 事件处理器类类型
 */
export type EventHandlerClass<TEvent extends BaseDomainEvent = BaseDomainEvent> = new (
	...args: unknown[]
) => IEventHandler<TEvent> & {
	eventType: string;
	priority: number;
	supports(eventType: string): boolean;
	getMetadata(): IEventHandlerMetadata | undefined;
};
