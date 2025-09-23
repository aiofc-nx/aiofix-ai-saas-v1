/**
 * 领域事件装饰器
 *
 * 用于标记和配置领域事件类，提供事件的元数据管理和自动发现功能。
 * 这个装饰器使得框架能够自动识别领域事件，并为其提供相应的基础设施支持。
 *
 * @description 领域事件装饰器提供了声明式的事件定义方式
 *
 * ## 业务规则
 *
 * ### 事件标识规则
 * - 每个事件类型必须有唯一的名称标识
 * - 事件名称用于事件路由和处理器匹配
 * - 事件名称应该反映业务领域概念
 * - 事件名称在系统内必须唯一
 *
 * ### 版本管理规则
 * - 事件支持版本控制，用于模式演进
 * - 版本变更时需要提供向后兼容策略
 * - 版本号遵循语义化版本规范
 * - 向后兼容的变更可以使用补丁版本
 *
 * ### 序列化规则
 * - 事件必须支持序列化和反序列化
 * - 序列化格式应该是跨语言兼容的
 * - 敏感数据应该在序列化时被排除
 * - 序列化后的数据应该包含足够的重建信息
 *
 * @example
 * ```typescript
 * @DomainEvent({
 *   name: 'UserCreated',
 *   version: '1.0.0',
 *   description: '用户创建事件'
 * })
 * export class UserCreatedEvent extends BaseDomainEvent {
 *   constructor(
 *     public readonly userId: EntityId,
 *     public readonly name: string,
 *     public readonly email: string
 *   ) {
 *     super(userId, 'UserCreated');
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import 'reflect-metadata';

/**
 * 领域事件配置选项
 */
export interface DomainEventOptions {
	/**
	 * 事件名称
	 *
	 * @description 事件的唯一标识名称，用于：
	 * - 事件处理器路由
	 * - 事件序列化类型标识
	 * - 事件存储和查询
	 * - 监控和日志记录
	 *
	 * @example 'UserCreated', 'OrderPlaced', 'PaymentProcessed'
	 */
	name: string;

	/**
	 * 事件版本
	 *
	 * @description 事件的版本号，用于：
	 * - 模式演进和兼容性管理
	 * - 事件序列化版本控制
	 * - 处理器版本匹配
	 *
	 * @default '1.0.0'
	 * @example '1.0.0', '2.1.0', '3.0.0-beta.1'
	 */
	version?: string;

	/**
	 * 事件描述
	 *
	 * @description 事件的业务描述，用于：
	 * - 文档生成
	 * - 开发工具提示
	 * - 业务理解
	 *
	 * @example '用户创建事件，在新用户注册时触发'
	 */
	description?: string;

	/**
	 * 事件分类
	 *
	 * @description 事件的业务分类，用于：
	 * - 事件分组和管理
	 * - 监控指标分类
	 * - 权限控制
	 *
	 * @example 'user-management', 'order-processing', 'payment'
	 */
	category?: string;

	/**
	 * 事件标签
	 *
	 * @description 事件的分类标签，用于：
	 * - 事件分组和过滤
	 * - 监控指标分类
	 * - 批量操作
	 *
	 * @example ['core', 'user'], ['business', 'order']
	 */
	tags?: string[];

	/**
	 * 是否为关键事件
	 *
	 * @description 标记事件是否为业务关键事件
	 * - true: 关键事件，失败时需要特殊处理
	 * - false: 普通事件，失败时可以重试或忽略
	 *
	 * @default false
	 */
	critical?: boolean;

	/**
	 * 事件保留期（天）
	 *
	 * @description 事件在存储中的保留期限
	 * - 0: 永久保留
	 * - 正整数: 保留天数
	 *
	 * @default 0 (永久保留)
	 */
	retentionDays?: number;

	/**
	 * 是否启用加密
	 *
	 * @description 是否对事件数据进行加密存储
	 * - true: 加密存储敏感数据
	 * - false: 明文存储
	 *
	 * @default false
	 */
	encrypted?: boolean;

	/**
	 * 序列化选项
	 *
	 * @description 事件序列化的配置选项
	 */
	serialization?: {
		/**
		 * 排除的字段
		 *
		 * @description 序列化时需要排除的字段名称
		 */
		exclude?: string[];

		/**
		 * 包含的字段
		 *
		 * @description 序列化时只包含的字段名称
		 */
		include?: string[];

		/**
		 * 自定义序列化器
		 *
		 * @description 自定义的序列化函数名称
		 */
		customSerializer?: string;
	};
}

/**
 * 领域事件元数据键
 */
export const DOMAIN_EVENT_METADATA_KEY = Symbol('domainEvent');

/**
 * 领域事件装饰器
 *
 * @description 用于标记领域事件类并提供配置选项
 *
 * @param options - 领域事件配置选项
 * @returns 类装饰器函数
 *
 * @example
 * ```typescript
 * @DomainEvent({
 *   name: 'UserCreated',
 *   version: '1.0.0',
 *   description: '用户创建事件',
 *   category: 'user-management',
 *   tags: ['core', 'user'],
 *   critical: true,
 *   retentionDays: 365,
 *   encrypted: true
 * })
 * export class UserCreatedEvent extends BaseDomainEvent {
 *   // 事件实现...
 * }
 * ```
 */
export function DomainEvent(options: DomainEventOptions): ClassDecorator {
	return function (target: unknown): void {
		// 验证配置选项
		validateDomainEventOptions(options);

		// 设置默认值
		const metadata: Required<DomainEventOptions> = {
			name: options.name,
			version: options.version || '1.0.0',
			description: options.description || '',
			category: options.category || 'general',
			tags: options.tags || [],
			critical: options.critical || false,
			retentionDays: options.retentionDays || 0,
			encrypted: options.encrypted || false,
			serialization: {
				exclude: options.serialization?.exclude || [],
				include: options.serialization?.include || [],
				customSerializer: options.serialization?.customSerializer || ''
			}
		};

		// 存储元数据
		Reflect.defineMetadata(DOMAIN_EVENT_METADATA_KEY, metadata, target as object);
	};
}

/**
 * 获取领域事件元数据
 *
 * @description 从领域事件类中获取元数据信息
 *
 * @param target - 领域事件类或实例
 * @returns 领域事件元数据，如果没有找到返回undefined
 *
 * @example
 * ```typescript
 * const metadata = getDomainEventMetadata(UserCreatedEvent);
 * console.log(`事件名称: ${metadata?.name}`);
 * ```
 */
export function getDomainEventMetadata(target: unknown): Required<DomainEventOptions> | undefined {
	const targetClass = typeof target === 'function' ? target : (target as { constructor: unknown }).constructor;
	return Reflect.getMetadata(DOMAIN_EVENT_METADATA_KEY, targetClass as object);
}

/**
 * 检查类是否是领域事件
 *
 * @description 检查给定的类是否被@DomainEvent装饰器标记
 *
 * @param target - 要检查的类或实例
 * @returns 如果是领域事件返回true，否则返回false
 *
 * @example
 * ```typescript
 * if (isDomainEvent(UserCreatedEvent)) {
 *   console.log('这是一个领域事件');
 * }
 * ```
 */
export function isDomainEvent(target: unknown): boolean {
	return getDomainEventMetadata(target) !== undefined;
}

/**
 * 事件处理器装饰器
 *
 * @description 用于标记事件处理器方法
 *
 * @param eventTypes - 处理的事件类型数组
 * @returns 方法装饰器函数
 *
 * @example
 * ```typescript
 * class UserEventHandler {
 *   @EventHandler(['UserCreated', 'UserUpdated'])
 *   async handleUserEvents(event: IDomainEvent): Promise<void> {
 *     // 处理逻辑
 *   }
 * }
 * ```
 */
export function EventHandler(eventTypes: string[]): MethodDecorator {
	return function (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
		const existingHandlers = Reflect.getMetadata('eventHandlers', target.constructor) || [];
		existingHandlers.push({
			method: propertyKey,
			eventTypes,
			handler: descriptor.value
		});
		Reflect.defineMetadata('eventHandlers', existingHandlers, target.constructor);
	};
}

/**
 * 获取事件处理器元数据
 *
 * @param target - 处理器类
 * @returns 事件处理器元数据数组
 */
export function getEventHandlers(target: object): Array<{
	method: string | symbol;
	eventTypes: string[];
	handler: (...args: unknown[]) => unknown;
}> {
	return Reflect.getMetadata('eventHandlers', target) || [];
}

/**
 * 验证领域事件配置选项
 *
 * @param options - 要验证的配置选项
 * @throws {Error} 当配置选项无效时抛出错误
 */
function validateDomainEventOptions(options: DomainEventOptions): void {
	if (!options.name || typeof options.name !== 'string' || options.name.trim().length === 0) {
		throw new Error('领域事件名称不能为空');
	}

	if (options.version && typeof options.version !== 'string') {
		throw new Error('领域事件版本必须是字符串');
	}

	if (options.description && typeof options.description !== 'string') {
		throw new Error('领域事件描述必须是字符串');
	}

	if (options.category && typeof options.category !== 'string') {
		throw new Error('领域事件分类必须是字符串');
	}

	if (options.tags && !Array.isArray(options.tags)) {
		throw new Error('领域事件标签必须是字符串数组');
	}

	if (options.tags && options.tags.some((tag) => typeof tag !== 'string')) {
		throw new Error('领域事件标签必须都是字符串');
	}

	if (options.retentionDays !== undefined && (typeof options.retentionDays !== 'number' || options.retentionDays < 0)) {
		throw new Error('事件保留期必须是非负整数');
	}

	if (options.serialization?.exclude && !Array.isArray(options.serialization.exclude)) {
		throw new Error('排除字段列表必须是字符串数组');
	}

	if (options.serialization?.include && !Array.isArray(options.serialization.include)) {
		throw new Error('包含字段列表必须是字符串数组');
	}
}

/**
 * 领域事件注册表
 *
 * @description 用于管理系统中所有已注册的领域事件
 */
export class DomainEventRegistry {
	private static events = new Map<string, new (...args: unknown[]) => unknown>();

	/**
	 * 注册领域事件
	 *
	 * @param eventClass - 领域事件类
	 */
	static register(eventClass: new (...args: unknown[]) => unknown): void {
		const metadata = getDomainEventMetadata(eventClass);
		if (!metadata) {
			throw new Error(`类 ${eventClass.name} 没有@DomainEvent装饰器`);
		}

		if (this.events.has(metadata.name)) {
			throw new Error(`领域事件名称 "${metadata.name}" 已经被注册`);
		}

		this.events.set(metadata.name, eventClass);
	}

	/**
	 * 获取领域事件类
	 *
	 * @param name - 领域事件名称
	 * @returns 领域事件类，如果没有找到返回undefined
	 */
	static get(name: string): (new (...args: unknown[]) => unknown) | undefined {
		return this.events.get(name);
	}

	/**
	 * 获取所有已注册的领域事件
	 *
	 * @returns 领域事件名称到类的映射
	 */
	static getAll(): Map<string, new (...args: unknown[]) => unknown> {
		return new Map(this.events);
	}

	/**
	 * 按分类获取领域事件
	 *
	 * @param category - 事件分类
	 * @returns 该分类下的所有事件
	 */
	static getByCategory(category: string): Map<string, new (...args: unknown[]) => unknown> {
		const result = new Map<string, new (...args: unknown[]) => unknown>();

		for (const [name, eventClass] of this.events) {
			const metadata = getDomainEventMetadata(eventClass);
			if (metadata?.category === category) {
				result.set(name, eventClass);
			}
		}

		return result;
	}

	/**
	 * 按标签获取领域事件
	 *
	 * @param tag - 事件标签
	 * @returns 包含该标签的所有事件
	 */
	static getByTag(tag: string): Map<string, new (...args: unknown[]) => unknown> {
		const result = new Map<string, new (...args: unknown[]) => unknown>();

		for (const [name, eventClass] of this.events) {
			const metadata = getDomainEventMetadata(eventClass);
			if (metadata?.tags.includes(tag)) {
				result.set(name, eventClass);
			}
		}

		return result;
	}

	/**
	 * 清除所有注册的领域事件
	 *
	 * @description 主要用于测试环境
	 */
	static clear(): void {
		this.events.clear();
	}
}
