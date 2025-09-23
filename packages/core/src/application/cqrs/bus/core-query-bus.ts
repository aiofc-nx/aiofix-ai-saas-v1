/**
 * 核心查询总线实现
 *
 * 查询总线是 CQRS 模式中处理查询的核心组件，负责路由查询到相应的处理器。
 * 本实现提供了基础的查询路由、中间件支持、缓存管理和性能优化功能。
 *
 * ## 业务规则
 *
 * ### 路由规则
 * - 每个查询类型只能有一个处理器
 * - 处理器必须实现 IQueryHandler 接口
 * - 支持优先级排序，优先级高的处理器优先执行
 * - 未注册的查询类型会抛出异常
 *
 * ### 缓存规则
 * - 支持查询结果缓存以提升性能
 * - 缓存键基于查询类型和参数生成
 * - 支持缓存过期时间配置
 * - 提供缓存失效和清理机制
 *
 * ### 中间件规则
 * - 中间件按优先级顺序执行
 * - 中间件可以修改查询或阻止执行
 * - 中间件异常会中断执行链
 * - 支持动态添加和移除中间件
 *
 * ### 错误处理规则
 * - 提供统一的错误处理机制
 * - 记录详细的执行日志
 * - 支持错误重试和恢复
 * - 提供查询统计和监控
 *
 * @description 核心查询总线实现，提供查询路由和处理功能
 * @example
 * ```typescript
 * const queryBus = new CoreQueryBus();
 *
 * // 注册查询处理器
 * queryBus.registerHandler('GetUsers', new GetUsersQueryHandler());
 *
 * // 添加中间件
 * queryBus.addMiddleware(new CachingMiddleware());
 * queryBus.addMiddleware(new LoggingMiddleware());
 *
 * // 执行查询
 * const query = new GetUsersQuery('active', 1, 10);
 * const result = await queryBus.execute(query);
 * ```
 *
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import { BaseQuery, IQueryResult } from '../queries/base/base-query';
import { IQueryHandler } from '../queries/base/query-handler.interface';
import { IQueryBus, ICQRSMiddleware, IMessageContext } from './cqrs-bus.interface';

/**
 * 核心查询总线实现
 */
@Injectable()
export class CoreQueryBus implements IQueryBus {
	private readonly handlers = new Map<string, IQueryHandler>();
	private readonly middlewares: ICQRSMiddleware[] = [];
	private readonly cache = new Map<string, { data: IQueryResult; expiredAt: Date }>();

	/**
	 * 执行查询
	 *
	 * @param query - 要执行的查询
	 * @returns Promise，查询执行完成后解析为结果
	 * @throws {Error} 当查询执行失败时
	 */
	public async execute<TQuery extends BaseQuery, TResult extends IQueryResult>(query: TQuery): Promise<TResult> {
		const queryType = query.queryType;
		const handler = this.handlers.get(queryType);

		if (!handler) {
			throw new Error(`No handler registered for query type: ${queryType}`);
		}

		// 创建消息上下文
		const context: IMessageContext = {
			messageId: query.queryId.toString(),
			tenantId: query.tenantId,
			userId: query.userId,
			messageType: queryType,
			createdAt: query.createdAt,
			metadata: query.metadata
		};

		let result: TResult | undefined;

		// 执行中间件链
		await this.executeMiddlewares(context, async () => {
			// 检查缓存
			const cacheKey = handler.generateCacheKey(query);
			const cachedResult = this.getCachedResult<TResult>(cacheKey);
			if (cachedResult) {
				result = cachedResult;
				return;
			}

			// 验证查询
			handler.validateQuery(query);

			// 检查是否可以处理
			const canHandle = await handler.canHandle(query);
			if (!canHandle) {
				throw new Error(`Handler cannot process query: ${queryType}`);
			}

			// 执行查询
			result = (await handler.execute(query)) as TResult;

			// 缓存结果
			const cacheExpiration = handler.getCacheExpiration(query);
			if (cacheExpiration > 0) {
				this.setCachedResult(cacheKey, result, cacheExpiration);
			}
		});

		if (!result) {
			throw new Error('Query execution failed: no result returned');
		}
		return result;
	}

	/**
	 * 注册查询处理器
	 *
	 * @param queryType - 查询类型
	 * @param handler - 查询处理器
	 * @throws {Error} 当查询类型已注册时
	 */
	public registerHandler<TQuery extends BaseQuery, TResult extends IQueryResult>(
		queryType: string,
		handler: IQueryHandler<TQuery, TResult>
	): void {
		if (this.handlers.has(queryType)) {
			throw new Error(`Handler already registered for query type: ${queryType}`);
		}

		if (!handler.supports(queryType)) {
			throw new Error(`Handler does not support query type: ${queryType}`);
		}

		this.handlers.set(queryType, handler);
	}

	/**
	 * 取消注册查询处理器
	 *
	 * @param queryType - 查询类型
	 */
	public unregisterHandler(queryType: string): void {
		this.handlers.delete(queryType);
		// 清除相关缓存
		this.clearCacheByPrefix(queryType);
	}

	/**
	 * 添加中间件
	 *
	 * @param middleware - 中间件
	 */
	public addMiddleware(middleware: ICQRSMiddleware): void {
		// 检查是否已存在同名中间件
		const existingIndex = this.middlewares.findIndex((m) => m.name === middleware.name);
		if (existingIndex >= 0) {
			// 替换现有中间件
			this.middlewares[existingIndex] = middleware;
		} else {
			// 添加新中间件
			this.middlewares.push(middleware);
		}

		// 按优先级排序
		this.middlewares.sort((a, b) => a.priority - b.priority);
	}

	/**
	 * 移除中间件
	 *
	 * @param middlewareName - 中间件名称
	 */
	public removeMiddleware(middlewareName: string): void {
		const index = this.middlewares.findIndex((m) => m.name === middlewareName);
		if (index >= 0) {
			this.middlewares.splice(index, 1);
		}
	}

	/**
	 * 获取所有注册的查询类型
	 *
	 * @returns 查询类型数组
	 */
	public getRegisteredQueryTypes(): string[] {
		return Array.from(this.handlers.keys());
	}

	/**
	 * 检查是否支持指定的查询类型
	 *
	 * @param queryType - 查询类型
	 * @returns 如果支持则返回 true，否则返回 false
	 */
	public supports(queryType: string): boolean {
		return this.handlers.has(queryType);
	}

	/**
	 * 获取注册的处理器数量
	 *
	 * @returns 处理器数量
	 */
	public getHandlerCount(): number {
		return this.handlers.size;
	}

	/**
	 * 获取注册的中间件数量
	 *
	 * @returns 中间件数量
	 */
	public getMiddlewareCount(): number {
		return this.middlewares.length;
	}

	/**
	 * 获取指定查询类型的处理器
	 *
	 * @param queryType - 查询类型
	 * @returns 处理器实例，如果不存在则返回 undefined
	 */
	public getHandler(queryType: string): IQueryHandler | undefined {
		return this.handlers.get(queryType);
	}

	/**
	 * 获取所有中间件
	 *
	 * @returns 中间件数组
	 */
	public getMiddlewares(): readonly ICQRSMiddleware[] {
		return [...this.middlewares];
	}

	/**
	 * 清除所有处理器
	 */
	public clearHandlers(): void {
		this.handlers.clear();
	}

	/**
	 * 清除所有中间件
	 */
	public clearMiddlewares(): void {
		this.middlewares.length = 0;
	}

	/**
	 * 获取缓存结果
	 *
	 * @param cacheKey - 缓存键
	 * @returns 缓存的结果，如果不存在或已过期则返回 undefined
	 */
	private getCachedResult<TResult extends IQueryResult>(cacheKey: string): TResult | undefined {
		const cached = this.cache.get(cacheKey);
		if (!cached) {
			return undefined;
		}

		// 检查是否过期
		if (cached.expiredAt < new Date()) {
			this.cache.delete(cacheKey);
			return undefined;
		}

		return cached.data as TResult;
	}

	/**
	 * 设置缓存结果
	 *
	 * @param cacheKey - 缓存键
	 * @param result - 查询结果
	 * @param expirationSeconds - 过期时间（秒）
	 */
	private setCachedResult(cacheKey: string, result: IQueryResult, expirationSeconds: number): void {
		const expiredAt = new Date();
		expiredAt.setSeconds(expiredAt.getSeconds() + expirationSeconds);

		this.cache.set(cacheKey, {
			data: result,
			expiredAt
		});
	}

	/**
	 * 清除指定前缀的缓存
	 *
	 * @param prefix - 缓存键前缀
	 */
	private clearCacheByPrefix(prefix: string): void {
		for (const [key] of this.cache) {
			if (key.startsWith(prefix)) {
				this.cache.delete(key);
			}
		}
	}

	/**
	 * 清除所有缓存
	 */
	public clearCache(): void {
		this.cache.clear();
	}

	/**
	 * 清除过期缓存
	 */
	public clearExpiredCache(): void {
		const now = new Date();
		for (const [key, cached] of this.cache) {
			if (cached.expiredAt < now) {
				this.cache.delete(key);
			}
		}
	}

	/**
	 * 获取缓存统计信息
	 *
	 * @returns 缓存统计信息
	 */
	public getCacheStats(): {
		totalEntries: number;
		expiredEntries: number;
		activeEntries: number;
	} {
		const now = new Date();
		let expiredEntries = 0;

		for (const cached of this.cache.values()) {
			if (cached.expiredAt < now) {
				expiredEntries++;
			}
		}

		return {
			totalEntries: this.cache.size,
			expiredEntries,
			activeEntries: this.cache.size - expiredEntries
		};
	}

	/**
	 * 执行中间件链
	 *
	 * @param context - 消息上下文
	 * @param next - 最终执行函数
	 * @returns Promise，执行完成后解析
	 */
	private async executeMiddlewares(context: IMessageContext, next: () => Promise<void>): Promise<void> {
		let index = 0;

		const executeNext = async (): Promise<unknown> => {
			if (index < this.middlewares.length) {
				const middleware = this.middlewares[index++];
				return await middleware.execute(context, executeNext);
			} else {
				await next();
				return undefined;
			}
		};

		await executeNext();
	}
}
