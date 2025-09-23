/**
 * 聚合根装饰器
 *
 * 用于标记和配置聚合根类，提供聚合根的元数据管理和自动发现功能。
 * 这个装饰器使得框架能够自动识别聚合根，并为其提供相应的基础设施支持。
 *
 * @description 聚合根装饰器提供了声明式的聚合根定义方式
 *
 * ## 业务规则
 *
 * ### 聚合根标识规则
 * - 每个聚合根必须有唯一的名称标识
 * - 聚合根名称用于事件溯源和读模型映射
 * - 聚合根名称应该反映业务领域概念
 * - 聚合根名称在系统内必须唯一
 *
 * ### 版本管理规则
 * - 聚合根支持版本控制，用于模式演进
 * - 版本变更时需要提供迁移策略
 * - 版本号遵循语义化版本规范
 * - 向后兼容的变更可以使用补丁版本
 *
 * ### 快照策略规则
 * - 快照用于优化事件溯源的性能
 * - 快照频率可以根据业务需求配置
 * - 快照应该包含聚合根的完整状态
 * - 快照创建不应该影响业务逻辑
 *
 * @example
 * ```typescript
 * @Aggregate({
 *   name: 'User',
 *   version: '1.0.0',
 *   snapshotFrequency: 10
 * })
 * export class UserAggregate extends BaseAggregateRoot {
 *   constructor(
 *     id: EntityId,
 *     private name: string,
 *     private email: string
 *   ) {
 *     super(id);
 *   }
 *
 *   // 业务方法...
 * }
 * ```
 *
 * @since 1.0.0
 */

import 'reflect-metadata';
import { DecoratorTarget } from '../../../common/types/decorator-types';

/**
 * 聚合根配置选项
 */
export interface AggregateOptions {
	/**
	 * 聚合根名称
	 *
	 * @description 聚合根的唯一标识名称，用于：
	 * - 事件存储中的聚合根类型标识
	 * - 读模型投射器的路由
	 * - 监控和日志记录
	 * - 性能指标收集
	 *
	 * @example 'User', 'Order', 'Product'
	 */
	name: string;

	/**
	 * 聚合根版本
	 *
	 * @description 聚合根的版本号，用于：
	 * - 模式演进和兼容性管理
	 * - 事件序列化版本控制
	 * - 迁移策略识别
	 *
	 * @default '1.0.0'
	 * @example '1.0.0', '2.1.0', '3.0.0-beta.1'
	 */
	version?: string;

	/**
	 * 快照频率
	 *
	 * @description 每隔多少个事件创建一次快照，用于优化事件溯源性能
	 * - 设置为0表示不创建快照
	 * - 设置为正整数表示事件间隔
	 * - 较小的值会增加存储开销但提升读取性能
	 * - 较大的值会减少存储开销但降低读取性能
	 *
	 * @default 0 (不创建快照)
	 * @example 10, 50, 100
	 */
	snapshotFrequency?: number;

	/**
	 * 聚合根描述
	 *
	 * @description 聚合根的业务描述，用于：
	 * - 文档生成
	 * - 开发工具提示
	 * - 业务理解
	 *
	 * @example '用户聚合根，管理用户的基本信息和认证状态'
	 */
	description?: string;

	/**
	 * 聚合根标签
	 *
	 * @description 聚合根的分类标签，用于：
	 * - 聚合根分组和管理
	 * - 监控指标分类
	 * - 批量操作过滤
	 *
	 * @example ['core', 'user-management'], ['billing', 'subscription']
	 */
	tags?: string[];

	/**
	 * 是否启用审计
	 *
	 * @description 是否为这个聚合根启用审计功能
	 * - true: 记录所有状态变更
	 * - false: 不记录审计信息
	 *
	 * @default true
	 */
	auditEnabled?: boolean;

	/**
	 * 是否启用缓存
	 *
	 * @description 是否为这个聚合根启用缓存
	 * - true: 启用聚合根实例缓存
	 * - false: 每次都从存储加载
	 *
	 * @default false
	 */
	cacheEnabled?: boolean;

	/**
	 * 缓存TTL（秒）
	 *
	 * @description 聚合根缓存的生存时间
	 * 只有在cacheEnabled为true时才有效
	 *
	 * @default 300 (5分钟)
	 */
	cacheTtl?: number;
}

/**
 * 聚合根元数据键
 */
export const AGGREGATE_METADATA_KEY = Symbol('aggregate');

/**
 * 聚合根装饰器
 *
 * @description 用于标记聚合根类并提供配置选项
 *
 * @param options - 聚合根配置选项
 * @returns 类装饰器函数
 *
 * @example
 * ```typescript
 * @Aggregate({
 *   name: 'User',
 *   version: '1.0.0',
 *   snapshotFrequency: 10,
 *   description: '用户聚合根',
 *   tags: ['core', 'user-management'],
 *   auditEnabled: true,
 *   cacheEnabled: true,
 *   cacheTtl: 600
 * })
 * export class UserAggregate extends BaseAggregateRoot {
 *   // 聚合根实现...
 * }
 * ```
 */
export function Aggregate(options: AggregateOptions): ClassDecorator {
	return function (target: DecoratorTarget): void {
		// 验证配置选项
		validateAggregateOptions(options);

		// 设置默认值
		const metadata: Required<AggregateOptions> = {
			name: options.name,
			version: options.version || '1.0.0',
			snapshotFrequency: options.snapshotFrequency || 0,
			description: options.description || '',
			tags: options.tags || [],
			auditEnabled: options.auditEnabled !== false, // 默认启用
			cacheEnabled: options.cacheEnabled || false,
			cacheTtl: options.cacheTtl || 300
		};

		// 存储元数据
		Reflect.defineMetadata(AGGREGATE_METADATA_KEY, metadata, target);
	};
}

/**
 * 获取聚合根元数据
 *
 * @description 从聚合根类中获取元数据信息
 *
 * @param target - 聚合根类或实例
 * @returns 聚合根元数据，如果没有找到返回undefined
 *
 * @example
 * ```typescript
 * const metadata = getAggregateMetadata(UserAggregate);
 * console.log(`聚合根名称: ${metadata?.name}`);
 * ```
 */
export function getAggregateMetadata(target: unknown): Required<AggregateOptions> | undefined {
	const targetClass = typeof target === 'function' ? target : (target as { constructor: unknown }).constructor;
	return Reflect.getMetadata(AGGREGATE_METADATA_KEY, targetClass as object);
}

/**
 * 检查类是否是聚合根
 *
 * @description 检查给定的类是否被@Aggregate装饰器标记
 *
 * @param target - 要检查的类或实例
 * @returns 如果是聚合根返回true，否则返回false
 *
 * @example
 * ```typescript
 * if (isAggregate(UserAggregate)) {
 *   console.log('这是一个聚合根');
 * }
 * ```
 */
export function isAggregate(target: unknown): boolean {
	return getAggregateMetadata(target) !== undefined;
}

/**
 * 验证聚合根配置选项
 *
 * @param options - 要验证的配置选项
 * @throws {Error} 当配置选项无效时抛出错误
 */
function validateAggregateOptions(options: AggregateOptions): void {
	if (!options.name || typeof options.name !== 'string' || options.name.trim().length === 0) {
		throw new Error('聚合根名称不能为空');
	}

	if (options.version && typeof options.version !== 'string') {
		throw new Error('聚合根版本必须是字符串');
	}

	if (
		options.snapshotFrequency !== undefined &&
		(typeof options.snapshotFrequency !== 'number' || options.snapshotFrequency < 0)
	) {
		throw new Error('快照频率必须是非负整数');
	}

	if (options.description && typeof options.description !== 'string') {
		throw new Error('聚合根描述必须是字符串');
	}

	if (options.tags && !Array.isArray(options.tags)) {
		throw new Error('聚合根标签必须是字符串数组');
	}

	if (options.tags && options.tags.some((tag) => typeof tag !== 'string')) {
		throw new Error('聚合根标签必须都是字符串');
	}

	if (options.cacheTtl !== undefined && (typeof options.cacheTtl !== 'number' || options.cacheTtl <= 0)) {
		throw new Error('缓存TTL必须是正整数');
	}
}

/**
 * 聚合根注册表
 *
 * @description 用于管理系统中所有已注册的聚合根
 */
export class AggregateRegistry {
	private static aggregates = new Map<string, new (...args: unknown[]) => unknown>();

	/**
	 * 注册聚合根
	 *
	 * @param aggregateClass - 聚合根类
	 */
	static register(aggregateClass: new (...args: unknown[]) => unknown): void {
		const metadata = getAggregateMetadata(aggregateClass);
		if (!metadata) {
			throw new Error(`类 ${aggregateClass.name} 没有@Aggregate装饰器`);
		}

		if (this.aggregates.has(metadata.name)) {
			throw new Error(`聚合根名称 "${metadata.name}" 已经被注册`);
		}

		this.aggregates.set(metadata.name, aggregateClass);
	}

	/**
	 * 获取聚合根类
	 *
	 * @param name - 聚合根名称
	 * @returns 聚合根类，如果没有找到返回undefined
	 */
	static get(name: string): (new (...args: unknown[]) => unknown) | undefined {
		return this.aggregates.get(name);
	}

	/**
	 * 获取所有已注册的聚合根
	 *
	 * @returns 聚合根名称到类的映射
	 */
	static getAll(): Map<string, new (...args: unknown[]) => unknown> {
		return new Map(this.aggregates);
	}

	/**
	 * 清除所有注册的聚合根
	 *
	 * @description 主要用于测试环境
	 */
	static clear(): void {
		this.aggregates.clear();
	}
}
