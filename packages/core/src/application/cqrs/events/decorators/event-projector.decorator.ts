/**
 * 事件投射器装饰器
 *
 * 用于标记和配置事件投射器类，提供投射器的元数据管理。
 * 装饰器支持自动注册、依赖注入和运行时发现。
 *
 * @description 事件投射器装饰器提供了声明式的投射器定义方式
 *
 * ## 业务规则
 *
 * ### 装饰器注册规则
 * - 同一事件类型可以有多个投射器
 * - 投射器必须实现IEventProjector接口
 * - 投射器应该提供明确的元数据
 * - 投射器支持运行时动态注册
 *
 * ### 装饰器配置规则
 * - 装饰器配置应该是声明式的
 * - 配置选项应该支持默认值
 * - 配置应该在编译时验证
 * - 配置支持环境特定的覆盖
 *
 * @example
 * ```typescript
 * @EventProjector('UserCreatedEvent', {
 *   description: '用户创建事件投射器',
 *   readModelType: 'UserReadModel',
 *   retry: { maxAttempts: 3, backoffStrategy: 'exponential' }
 * })
 * export class UserCreatedProjector extends BaseReadModelProjector<UserCreatedEvent, UserReadModel> {
 *   // 投射器实现
 * }
 * ```
 *
 * @since 1.0.0
 */

/**
 * 事件投射器选项接口
 */
export interface IEventProjectorOptions {
	/**
	 * 投射器描述
	 */
	description?: string;

	/**
	 * 投射器版本
	 */
	version?: string;

	/**
	 * 读模型类型
	 */
	readModelType?: string;

	/**
	 * 投射器分类
	 */
	category?: string;

	/**
	 * 投射器标签
	 */
	tags?: string[];

	/**
	 * 重试配置
	 */
	retry?: {
		maxAttempts: number;
		backoffStrategy: 'fixed' | 'exponential' | 'linear';
		baseDelay: number;
	};

	/**
	 * 超时配置
	 */
	timeout?: {
		execution: number;
		alertOnTimeout?: boolean;
	};

	/**
	 * 监控配置
	 */
	monitoring?: {
		enabled: boolean;
		slowThreshold: number;
		errorThreshold: number;
	};

	/**
	 * 批处理配置
	 */
	batch?: {
		enabled: boolean;
		size: number;
		timeout: number;
	};
}

/**
 * 事件投射器元数据接口
 */
export interface IEventProjectorMetadata {
	/**
	 * 处理的事件类型
	 */
	eventTypes: string[];

	/**
	 * 投射器描述
	 */
	description: string;

	/**
	 * 投射器版本
	 */
	version: string;

	/**
	 * 读模型类型
	 */
	readModelType?: string;

	/**
	 * 投射器分类
	 */
	category?: string;

	/**
	 * 投射器标签
	 */
	tags?: string[];

	/**
	 * 重试配置
	 */
	retry?: {
		maxAttempts: number;
		backoffStrategy: 'fixed' | 'exponential' | 'linear';
		baseDelay: number;
	};

	/**
	 * 超时配置
	 */
	timeout?: {
		execution: number;
		alertOnTimeout?: boolean;
	};

	/**
	 * 监控配置
	 */
	monitoring?: {
		enabled: boolean;
		slowThreshold: number;
		errorThreshold: number;
	};

	/**
	 * 批处理配置
	 */
	batch?: {
		enabled: boolean;
		size: number;
		timeout: number;
	};
}

/**
 * 事件投射器元数据键
 */
export const EVENT_PROJECTOR_METADATA_KEY = Symbol('eventProjector');

/**
 * 事件投射器装饰器
 *
 * @description 用于标记事件投射器类并设置元数据
 *
 * @param eventTypes - 处理的事件类型（单个或数组）
 * @param options - 投射器配置选项
 * @returns 类装饰器函数
 *
 * @example
 * ```typescript
 * @EventProjector('UserCreatedEvent', {
 *   description: '用户创建投射器',
 *   readModelType: 'UserReadModel'
 * })
 * export class UserCreatedProjector extends BaseReadModelProjector<UserCreatedEvent, UserReadModel> {
 *   // 实现
 * }
 *
 * // 处理多个事件类型
 * @EventProjector(['UserCreatedEvent', 'UserUpdatedEvent'], {
 *   description: '用户信息投射器',
 *   readModelType: 'UserReadModel'
 * })
 * export class UserInfoProjector extends BaseReadModelProjector<UserEvent, UserReadModel> {
 *   // 实现
 * }
 * ```
 */
export function EventProjector(
	eventTypes: string | string[],
	options: IEventProjectorOptions = {}
): <T extends new (...args: any[]) => any>(target: T) => T {
	return function <T extends new (...args: any[]) => any>(target: T): T {
		// 规范化事件类型
		const normalizedEventTypes = Array.isArray(eventTypes) ? eventTypes : [eventTypes];

		// 创建完整的元数据
		const metadata: IEventProjectorMetadata = {
			eventTypes: normalizedEventTypes,
			description: options.description || `${target.name} 事件投射器`,
			version: options.version || '1.0.0',
			readModelType: options.readModelType,
			category: options.category,
			tags: options.tags,
			retry: options.retry,
			timeout: options.timeout,
			monitoring: options.monitoring,
			batch: options.batch
		};

		// 设置元数据
		Reflect.defineMetadata(EVENT_PROJECTOR_METADATA_KEY, metadata, target);

		// 设置事件类型属性
		Object.defineProperty(target.prototype, 'eventTypes', {
			value: normalizedEventTypes,
			writable: false,
			enumerable: true,
			configurable: false
		});

		return target;
	};
}

/**
 * 获取事件投射器元数据
 *
 * @param target - 目标类或实例
 * @returns 事件投射器元数据
 */
export function getEventProjectorMetadata(target: any): IEventProjectorMetadata | undefined {
	return Reflect.getMetadata(EVENT_PROJECTOR_METADATA_KEY, target);
}

/**
 * 检查是否为事件投射器
 *
 * @param target - 要检查的目标
 * @returns 如果是事件投射器返回true，否则返回false
 */
export function isEventProjector(target: any): boolean {
	return Reflect.hasMetadata(EVENT_PROJECTOR_METADATA_KEY, target);
}

/**
 * 读模型投射器装饰器
 *
 * @description 专门用于读模型投射器的装饰器
 *
 * @param eventTypes - 处理的事件类型
 * @param readModelType - 读模型类型
 * @param options - 投射器配置选项
 * @returns 类装饰器函数
 *
 * @example
 * ```typescript
 * @ReadModelProjector('UserCreatedEvent', 'UserReadModel', {
 *   description: '用户读模型投射器'
 * })
 * export class UserReadModelProjector extends BaseReadModelProjector<UserCreatedEvent, UserReadModel> {
 *   // 实现
 * }
 * ```
 */
export function ReadModelProjector(
	eventTypes: string | string[],
	readModelType: string,
	options: Omit<IEventProjectorOptions, 'readModelType'> = {}
): <T extends new (...args: any[]) => any>(target: T) => T {
	return EventProjector(eventTypes, {
		...options,
		readModelType
	});
}

/**
 * 投射器注册表装饰器
 *
 * @description 用于自动注册投射器到投射器管理器
 *
 * @example
 * ```typescript
 * @AutoRegisterProjector()
 * @EventProjector('UserCreatedEvent')
 * export class UserCreatedProjector extends BaseEventProjector<UserCreatedEvent> {
 *   // 投射器将自动注册到ProjectorManager
 * }
 * ```
 */
export function AutoRegisterProjector(): <T extends new (...args: any[]) => any>(target: T) => T {
	return function <T extends new (...args: any[]) => any>(target: T): T {
		// 标记为自动注册
		Reflect.defineMetadata('autoRegister', true, target);
		return target;
	};
}

/**
 * 检查是否为自动注册投射器
 *
 * @param target - 要检查的目标
 * @returns 如果是自动注册投射器返回true，否则返回false
 */
export function isAutoRegisterProjector(target: any): boolean {
	return Reflect.getMetadata('autoRegister', target) === true;
}
