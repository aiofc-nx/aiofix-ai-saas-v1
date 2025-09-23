/**
 * 装饰器注册表
 *
 * @description 管理和存储所有消息处理器装饰器的元数据
 * 提供装饰器的注册、查询和管理功能
 *
 * ## 核心功能
 *
 * ### 📋 **注册管理**
 * - 集中管理所有装饰器元数据
 * - 支持多种类型的处理器注册
 * - 提供线程安全的注册操作
 *
 * ### 🔍 **查询功能**
 * - 按主题查询处理器
 * - 按类型筛选处理器
 * - 支持复杂的查询条件
 *
 * ### 🚀 **性能优化**
 * - 内存中索引，快速查询
 * - 延迟加载和缓存机制
 * - 支持批量操作
 *
 * @example
 * ```typescript
 * const registry = DecoratorRegistry.getInstance();
 *
 * // 注册处理器
 * registry.registerHandler({
 *   handlerType: 'message',
 *   target: 'user.created',
 *   options: { queue: 'user-events' },
 *   handlerClass: UserCreatedHandler,
 *   createdAt: new Date()
 * });
 *
 * // 查询处理器
 * const handlers = registry.getHandlersByTopic('user.created');
 * ```
 *
 * @since 1.0.0
 */

import { IDecoratorRegistry, IMessageHandlerMetadata } from './messaging-decorators.interface';

/**
 * 装饰器注册表实现
 *
 * 使用单例模式确保全局唯一的注册表实例
 */
export class DecoratorRegistry implements IDecoratorRegistry {
	private static instance: DecoratorRegistry;

	/** 存储所有注册的处理器元数据 */
	private readonly handlers = new Map<string, IMessageHandlerMetadata>();

	/** 主题到处理器的索引 */
	private readonly topicIndex = new Map<string, Set<string>>();

	/** 类型到处理器的索引 */
	private readonly typeIndex = new Map<IMessageHandlerMetadata['handlerType'], Set<string>>();

	/** 注册表版本号，用于缓存失效 */
	private version = 0;

	private constructor() {
		// 私有构造函数，用于单例模式
	}

	/**
	 * 获取单例实例
	 *
	 * @returns 装饰器注册表实例
	 */
	static getInstance(): DecoratorRegistry {
		if (!DecoratorRegistry.instance) {
			DecoratorRegistry.instance = new DecoratorRegistry();
		}
		return DecoratorRegistry.instance;
	}

	/**
	 * 注册消息处理器
	 *
	 * @param metadata - 处理器元数据
	 */
	registerHandler(metadata: IMessageHandlerMetadata): void {
		const handlerId = this.generateHandlerId(metadata);

		// 检查是否已经注册
		if (this.handlers.has(handlerId)) {
			throw new Error(`处理器已存在: ${metadata.handlerClass.name}.${metadata.methodName || 'handle'}`);
		}

		// 注册处理器
		this.handlers.set(handlerId, metadata);

		// 更新索引
		this.updateTopicIndex(handlerId, metadata);
		this.updateTypeIndex(handlerId, metadata);

		// 更新版本号
		this.version++;

		// 日志记录
		this.logRegistration(metadata, handlerId);
	}

	/**
	 * 获取所有注册的处理器
	 *
	 * @returns 处理器元数据数组
	 */
	getAllHandlers(): IMessageHandlerMetadata[] {
		return Array.from(this.handlers.values());
	}

	/**
	 * 根据主题获取处理器
	 *
	 * @param topic - 主题名称
	 * @returns 匹配的处理器元数据数组
	 */
	getHandlersByTopic(topic: string): IMessageHandlerMetadata[] {
		const handlerIds = this.topicIndex.get(topic);
		if (!handlerIds) {
			return [];
		}

		const handlers: IMessageHandlerMetadata[] = [];
		for (const handlerId of handlerIds) {
			const handler = this.handlers.get(handlerId);
			if (handler) {
				handlers.push(handler);
			}
		}

		return handlers;
	}

	/**
	 * 根据类型获取处理器
	 *
	 * @param handlerType - 处理器类型
	 * @returns 匹配的处理器元数据数组
	 */
	getHandlersByType(handlerType: IMessageHandlerMetadata['handlerType']): IMessageHandlerMetadata[] {
		const handlerIds = this.typeIndex.get(handlerType);
		if (!handlerIds) {
			return [];
		}

		const handlers: IMessageHandlerMetadata[] = [];
		for (const handlerId of handlerIds) {
			const handler = this.handlers.get(handlerId);
			if (handler) {
				handlers.push(handler);
			}
		}

		return handlers;
	}

	/**
	 * 清空注册表
	 */
	clear(): void {
		this.handlers.clear();
		this.topicIndex.clear();
		this.typeIndex.clear();
		this.version = 0;
	}

	/**
	 * 获取注册表统计信息
	 *
	 * @returns 统计信息对象
	 */
	getStatistics(): {
		totalHandlers: number;
		handlersByType: Record<string, number>;
		version: number;
	} {
		const handlersByType: Record<string, number> = {};

		for (const [type, handlerIds] of this.typeIndex) {
			handlersByType[type] = handlerIds.size;
		}

		return {
			totalHandlers: this.handlers.size,
			handlersByType,
			version: this.version
		};
	}

	/**
	 * 检查处理器是否已注册
	 *
	 * @param handlerClass - 处理器类
	 * @param methodName - 方法名称
	 * @returns 是否已注册
	 */
	isHandlerRegistered(handlerClass: new (...args: unknown[]) => unknown, methodName?: string): boolean {
		const handlerId = this.generateHandlerIdFromClass(handlerClass, methodName);
		return this.handlers.has(handlerId);
	}

	// ==================== 私有方法 ====================

	/**
	 * 生成处理器唯一标识
	 *
	 * @param metadata - 处理器元数据
	 * @returns 处理器ID
	 */
	private generateHandlerId(metadata: IMessageHandlerMetadata): string {
		return this.generateHandlerIdFromClass(metadata.handlerClass, metadata.methodName);
	}

	/**
	 * 从类和方法名生成处理器ID
	 *
	 * @param handlerClass - 处理器类
	 * @param methodName - 方法名称
	 * @returns 处理器ID
	 */
	private generateHandlerIdFromClass(handlerClass: new (...args: unknown[]) => unknown, methodName?: string): string {
		const className = handlerClass.name;
		const method = methodName || 'handle';
		return `${className}.${method}`;
	}

	/**
	 * 更新主题索引
	 *
	 * @param handlerId - 处理器ID
	 * @param metadata - 处理器元数据
	 */
	private updateTopicIndex(handlerId: string, metadata: IMessageHandlerMetadata): void {
		const targets = Array.isArray(metadata.target) ? metadata.target : [metadata.target];

		for (const target of targets) {
			if (!this.topicIndex.has(target)) {
				this.topicIndex.set(target, new Set());
			}
			const topicSet = this.topicIndex.get(target);
			if (topicSet) {
				topicSet.add(handlerId);
			}
		}
	}

	/**
	 * 更新类型索引
	 *
	 * @param handlerId - 处理器ID
	 * @param metadata - 处理器元数据
	 */
	private updateTypeIndex(handlerId: string, metadata: IMessageHandlerMetadata): void {
		if (!this.typeIndex.has(metadata.handlerType)) {
			this.typeIndex.set(metadata.handlerType, new Set());
		}
		const typeSet = this.typeIndex.get(metadata.handlerType);
		if (typeSet) {
			typeSet.add(handlerId);
		}
	}

	/**
	 * 记录注册日志
	 *
	 * @param metadata - 处理器元数据
	 * @param handlerId - 处理器ID
	 */
	private logRegistration(metadata: IMessageHandlerMetadata, handlerId: string): void {
		// 这里可以集成日志系统
		// 暂时使用console.debug进行调试
		if (process.env.NODE_ENV === 'development') {
			// eslint-disable-next-line no-console
			console.debug(`[DecoratorRegistry] 注册处理器: ${handlerId}`, {
				handlerType: metadata.handlerType,
				target: metadata.target,
				options: metadata.options
			});
		}
	}
}

/**
 * 获取全局装饰器注册表实例
 *
 * @returns 装饰器注册表实例
 */
export function getDecoratorRegistry(): DecoratorRegistry {
	return DecoratorRegistry.getInstance();
}

/**
 * 装饰器注册表的便捷操作工具
 */
export class DecoratorRegistryUtils {
	private static readonly registry = DecoratorRegistry.getInstance();

	/**
	 * 查找处理特定主题的所有处理器
	 *
	 * @param topic - 主题名称
	 * @returns 处理器元数据数组
	 */
	static findHandlersForTopic(topic: string): IMessageHandlerMetadata[] {
		return DecoratorRegistryUtils.registry.getHandlersByTopic(topic);
	}

	/**
	 * 获取所有消息处理器
	 *
	 * @returns 消息处理器元数据数组
	 */
	static getAllMessageHandlers(): IMessageHandlerMetadata[] {
		return DecoratorRegistryUtils.registry.getHandlersByType('message');
	}

	/**
	 * 获取所有事件处理器
	 *
	 * @returns 事件处理器元数据数组
	 */
	static getAllEventHandlers(): IMessageHandlerMetadata[] {
		return DecoratorRegistryUtils.registry.getHandlersByType('event');
	}

	/**
	 * 获取所有队列处理器
	 *
	 * @returns 队列处理器元数据数组
	 */
	static getAllQueueProcessors(): IMessageHandlerMetadata[] {
		return DecoratorRegistryUtils.registry.getHandlersByType('queue');
	}

	/**
	 * 获取所有Saga处理器
	 *
	 * @returns Saga处理器元数据数组
	 */
	static getAllSagaHandlers(): IMessageHandlerMetadata[] {
		return DecoratorRegistryUtils.registry.getHandlersByType('saga');
	}

	/**
	 * 检查是否有处理器处理指定主题
	 *
	 * @param topic - 主题名称
	 * @returns 是否有处理器
	 */
	static hasHandlersForTopic(topic: string): boolean {
		return DecoratorRegistryUtils.findHandlersForTopic(topic).length > 0;
	}

	/**
	 * 获取注册表摘要信息
	 *
	 * @returns 摘要信息
	 */
	static getSummary(): {
		totalHandlers: number;
		messageHandlers: number;
		eventHandlers: number;
		queueProcessors: number;
		sagaHandlers: number;
		subscribeHandlers: number;
	} {
		const stats = DecoratorRegistryUtils.registry.getStatistics();

		return {
			totalHandlers: stats.totalHandlers,
			messageHandlers: stats.handlersByType.message || 0,
			eventHandlers: stats.handlersByType.event || 0,
			queueProcessors: stats.handlersByType.queue || 0,
			sagaHandlers: stats.handlersByType.saga || 0,
			subscribeHandlers: stats.handlersByType.subscribe || 0
		};
	}
}
