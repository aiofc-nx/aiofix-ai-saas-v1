/**
 * 查询处理器装饰器
 *
 * 用于标记和配置查询处理器类，提供查询处理器的元数据管理。
 * 装饰器支持自动注册、依赖注入和运行时发现。
 *
 * @description 查询处理器装饰器提供了声明式的查询处理器定义方式
 *
 * ## 业务规则
 *
 * ### 装饰器注册规则
 * - 每个查询类型只能有一个处理器
 * - 处理器必须实现IQueryHandler接口
 * - 处理器应该提供明确的元数据
 * - 处理器支持运行时动态注册
 *
 * ### 装饰器配置规则
 * - 装饰器配置应该是声明式的
 * - 配置选项应该支持默认值
 * - 配置应该在编译时验证
 * - 配置支持环境特定的覆盖
 *
 * @example
 * ```typescript
 * @QueryHandler(GetUserQuery, {
 *   description: '获取用户查询处理器',
 *   version: '1.0.0',
 *   cache: { enabled: true, ttl: 300 },
 *   timeout: { execution: 3000 }
 * })
 * export class GetUserQueryHandler extends BaseQueryHandler<GetUserQuery, GetUserResult> {
 *   // 处理器实现
 * }
 * ```
 *
 * @since 1.0.0
 */

import { IQuery, IQueryMetadata } from '../base/query.interface';

/**
 * 查询处理器选项接口
 */
export interface IQueryHandlerOptions {
	/**
	 * 处理器描述
	 */
	description?: string;

	/**
	 * 处理器版本
	 */
	version?: string;

	/**
	 * 所需权限
	 */
	requiredPermissions?: string[];

	/**
	 * 处理器分类
	 */
	category?: string;

	/**
	 * 处理器标签
	 */
	tags?: string[];

	/**
	 * 缓存配置
	 */
	cache?: {
		enabled: boolean;
		ttl: number;
		keyPrefix?: string;
	};

	/**
	 * 超时配置
	 */
	timeout?: {
		execution: number;
		alertOnTimeout?: boolean;
	};

	/**
	 * 复杂度限制
	 */
	complexity?: {
		maxScore: number;
		alertOnHigh?: boolean;
	};

	/**
	 * 监控配置
	 */
	monitoring?: {
		enabled: boolean;
		slowThreshold: number;
		errorThreshold: number;
	};
}

/**
 * 查询处理器元数据键
 */
export const QUERY_HANDLER_METADATA_KEY = Symbol('queryHandler');

/**
 * 查询处理器装饰器
 *
 * @description 用于标记查询处理器类并设置元数据
 *
 * @param queryClass - 查询类构造函数
 * @param options - 处理器配置选项
 * @returns 类装饰器函数
 *
 * @example
 * ```typescript
 * @QueryHandler(GetUserQuery, {
 *   description: '获取用户处理器',
 *   cache: { enabled: true, ttl: 300 }
 * })
 * export class GetUserQueryHandler extends BaseQueryHandler<GetUserQuery, GetUserResult> {
 *   // 实现
 * }
 * ```
 */
export function QueryHandler<TQuery extends IQuery>(
	queryClass: new (...args: any[]) => TQuery,
	options: IQueryHandlerOptions = {}
): <T extends new (...args: any[]) => any>(target: T) => T {
	return function <T extends new (...args: any[]) => any>(target: T): T {
		// 获取查询类型
		const queryInstance = new queryClass();
		const queryType = queryInstance.queryType;

		// 创建完整的元数据
		const metadata: IQueryMetadata = {
			queryType,
			description: options.description || `${target.name} 查询处理器`,
			version: options.version || '1.0.0',
			requiredPermissions: options.requiredPermissions || [],
			category: options.category,
			tags: options.tags,
			cache: options.cache,
			timeout: options.timeout,
			complexity: options.complexity
		};

		// 设置元数据
		Reflect.defineMetadata(QUERY_HANDLER_METADATA_KEY, metadata, target);

		// 设置查询类型属性
		Object.defineProperty(target.prototype, 'queryType', {
			value: queryType,
			writable: false,
			enumerable: true,
			configurable: false
		});

		return target;
	};
}

/**
 * 获取查询处理器元数据
 *
 * @param target - 目标类或实例
 * @returns 查询处理器元数据
 */
export function getQueryHandlerMetadata(target: any): IQueryMetadata | undefined {
	return Reflect.getMetadata(QUERY_HANDLER_METADATA_KEY, target);
}

/**
 * 检查是否为查询处理器
 *
 * @param target - 要检查的目标
 * @returns 如果是查询处理器返回true，否则返回false
 */
export function isQueryHandler(target: any): boolean {
	return Reflect.hasMetadata(QUERY_HANDLER_METADATA_KEY, target);
}

/**
 * 查询装饰器元数据键
 */
export const QUERY_METADATA_KEY = Symbol('query');

/**
 * 查询装饰器
 *
 * @description 用于标记查询类并设置元数据
 *
 * @param options - 查询配置选项
 * @returns 类装饰器函数
 *
 * @example
 * ```typescript
 * @Query({
 *   type: 'GetUser',
 *   description: '获取用户查询',
 *   version: '1.0.0'
 * })
 * export class GetUserQuery implements IQuery {
 *   // 查询实现
 * }
 * ```
 */
export function Query(options: {
	type: string;
	description?: string;
	version?: string;
	requiredPermissions?: string[];
	category?: string;
	tags?: string[];
	cache?: {
		enabled: boolean;
		ttl: number;
		keyPrefix?: string;
	};
}): <T extends new (...args: any[]) => any>(target: T) => T {
	return function <T extends new (...args: any[]) => any>(target: T): T {
		const metadata: IQueryMetadata = {
			queryType: options.type,
			description: options.description || `${options.type} 查询`,
			version: options.version || '1.0.0',
			requiredPermissions: options.requiredPermissions || [],
			category: options.category,
			tags: options.tags,
			cache: options.cache
		};

		// 设置元数据
		Reflect.defineMetadata(QUERY_METADATA_KEY, metadata, target);

		// 设置查询类型属性
		Object.defineProperty(target.prototype, 'queryType', {
			value: options.type,
			writable: false,
			enumerable: true,
			configurable: false
		});

		return target;
	};
}

/**
 * 获取查询元数据
 *
 * @param target - 目标类或实例
 * @returns 查询元数据
 */
export function getQueryMetadata(target: any): IQueryMetadata | undefined {
	return Reflect.getMetadata(QUERY_METADATA_KEY, target);
}

/**
 * 检查是否为查询
 *
 * @param target - 要检查的目标
 * @returns 如果是查询返回true，否则返回false
 */
export function isQuery(target: any): boolean {
	return Reflect.hasMetadata(QUERY_METADATA_KEY, target);
}
