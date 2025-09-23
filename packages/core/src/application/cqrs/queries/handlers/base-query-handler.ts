/**
 * 基础查询处理器
 *
 * 提供查询处理器的基础实现，包含通用的查询逻辑和模板方法。
 * 子类只需要实现具体的查询逻辑，基类负责处理横切关注点。
 *
 * @description 基础查询处理器为所有查询处理器提供统一的基础功能
 *
 * ## 业务规则
 *
 * ### 查询处理流程规则
 * - 查询处理按标准流程执行：验证 → 缓存检查 → 查询逻辑 → 结果缓存
 * - 每个步骤失败都会中断后续执行
 * - 查询操作必须是只读的
 * - 查询结果应该进行数据脱敏
 *
 * ### 查询处理缓存规则
 * - 优先从缓存获取查询结果
 * - 缓存未命中时执行实际查询
 * - 查询结果自动缓存以提升性能
 * - 支持缓存失效和更新策略
 *
 * ### 查询处理权限规则
 * - 验证用户的数据访问权限
 * - 支持基于角色的数据过滤
 * - 确保多租户数据隔离
 * - 记录数据访问审计日志
 *
 * @example
 * ```typescript
 * @QueryHandler(GetUserQuery)
 * export class GetUserQueryHandler extends BaseQueryHandler<GetUserQuery, GetUserResult> {
 *   constructor(
 *     private readonly userReadRepository: IUserReadRepository,
 *     private readonly cache: IApplicationCache
 *   ) {
 *     super('GetUserQueryHandler', 'GetUser');
 *   }
 *
 *   protected async executeQuery(query: GetUserQuery, context: IQueryExecutionContext): Promise<GetUserResult> {
 *     // 1. 从读模型查询
 *     const user = await this.userReadRepository.findById(query.targetUserId);
 *     if (!user) {
 *       throw new ResourceNotFoundException('用户不存在');
 *     }
 *
 *     // 2. 数据权限验证
 *     await this.validateDataAccess(user, context);
 *
 *     // 3. 数据脱敏
 *     const sanitizedUser = this.sanitizeData(user, context);
 *
 *     return new GetUserResult(sanitizedUser);
 *   }
 *
 *   protected getCacheKey(query: GetUserQuery): string {
 *     return `user:${query.targetUserId}:profile:${query.includeProfile}`;
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { IQuery } from '../base/query.interface';
import { IQueryHandler, IQueryExecutionContext } from './query-handler.interface';

/**
 * 基础查询处理器抽象类
 *
 * @template TQuery - 查询类型
 * @template TResult - 处理结果类型
 */
export abstract class BaseQueryHandler<TQuery extends IQuery, TResult> implements IQueryHandler<TQuery, TResult> {
	/**
	 * 处理器名称
	 */
	public readonly handlerName: string;

	/**
	 * 查询类型
	 */
	public readonly queryType: string;

	/**
	 * 处理器版本
	 */
	public readonly handlerVersion: string;

	/**
	 * 默认缓存生存时间（秒）
	 */
	protected readonly defaultCacheTtl: number = 300; // 5分钟

	/**
	 * 最大查询复杂度
	 */
	protected readonly maxQueryComplexity: number = 100;

	constructor(handlerName: string, queryType: string, handlerVersion: string = '1.0.0') {
		this.handlerName = handlerName;
		this.queryType = queryType;
		this.handlerVersion = handlerVersion;
	}

	/**
	 * 处理查询（模板方法）
	 *
	 * @param query - 要处理的查询
	 * @returns 查询结果
	 */
	async handle(query: TQuery): Promise<TResult> {
		const context = this.createExecutionContext(query);

		try {
			// 1. 验证查询
			await this.validateQuery(query, context);

			// 2. 检查缓存
			const cachedResult = await this.checkCache(query, context);
			if (cachedResult !== null) {
				this.logCacheHit(query, context);
				return cachedResult;
			}

			// 3. 执行查询逻辑
			const result = await this.executeQuery(query, context);

			// 4. 缓存结果
			await this.cacheResult(query, result, context);

			// 5. 记录成功日志
			this.logSuccess(query, result, context);

			return result;
		} catch (error) {
			// 记录错误日志
			this.logError(query, error, context);

			// 重新抛出异常
			throw error;
		}
	}

	/**
	 * 获取处理器名称
	 */
	getHandlerName(): string {
		return this.handlerName;
	}

	/**
	 * 获取查询类型
	 */
	getQueryType(): string {
		return this.queryType;
	}

	/**
	 * 检查是否可以处理指定查询
	 */
	canHandle(query: IQuery): boolean {
		return query.queryType === this.queryType;
	}

	/**
	 * 执行具体的查询逻辑（抽象方法）
	 *
	 * @description 子类必须实现此方法来定义具体的查询逻辑
	 *
	 * @param query - 查询实例
	 * @param context - 执行上下文
	 * @returns 查询结果
	 */
	protected abstract executeQuery(query: TQuery, context: IQueryExecutionContext): Promise<TResult>;

	/**
	 * 验证查询
	 *
	 * @description 验证查询的有效性，包括数据验证和权限验证
	 *
	 * @param query - 要验证的查询
	 * @param context - 执行上下文
	 * @throws {QueryValidationError} 当查询验证失败时
	 */
	protected async validateQuery(query: TQuery, context: IQueryExecutionContext): Promise<void> {
		// 1. 基础验证
		if (!query.queryId) {
			throw new Error('查询ID不能为空');
		}

		if (!query.queryType) {
			throw new Error('查询类型不能为空');
		}

		if (!query.timestamp) {
			throw new Error('查询时间戳不能为空');
		}

		// 2. 查询自身验证
		const validationResult = query.validate();
		if (!validationResult.isValid) {
			const errorMessages = validationResult.errors.map((e) => e.message).join(', ');
			throw new Error(`查询验证失败: ${errorMessages}`);
		}

		// 3. 复杂度验证
		const complexity = query.getComplexity();
		if (complexity > this.maxQueryComplexity) {
			throw new Error(`查询复杂度过高: ${complexity} > ${this.maxQueryComplexity}`);
		}

		// 4. 权限验证（子类可重写）
		await this.validateDataAccess(query, context);

		this.log('debug', '查询验证通过', {
			queryId: query.queryId,
			queryType: query.queryType,
			complexity
		});
	}

	/**
	 * 验证数据访问权限
	 *
	 * @description 子类可以重写此方法来实现具体的数据访问权限验证
	 *
	 * @param query - 查询实例
	 * @param context - 执行上下文
	 */
	protected async validateDataAccess(_query: TQuery, _context: IQueryExecutionContext): Promise<void> {
		// 默认不做额外验证，子类可以重写
	}

	/**
	 * 检查缓存
	 *
	 * @param query - 查询实例
	 * @param context - 执行上下文
	 * @returns 缓存的结果，如果不存在返回null
	 */
	protected async checkCache(_query: TQuery, _context: IQueryExecutionContext): Promise<TResult | null> {
		try {
			// 缓存逻辑将在具体实现中注入
			// const cacheKey = this.getCacheKey(query, context);
			// return await this.cache.get<TResult>(cacheKey);
			return null; // 临时返回null
		} catch (error) {
			this.log('warn', '缓存检查失败', {
				error: error instanceof Error ? error.message : String(error)
			});
			return null;
		}
	}

	/**
	 * 缓存查询结果
	 *
	 * @param query - 查询实例
	 * @param result - 查询结果
	 * @param context - 执行上下文
	 */
	protected async cacheResult(query: TQuery, result: TResult, context: IQueryExecutionContext): Promise<void> {
		try {
			const cacheKey = this.getCacheKey(query, context);
			const ttl = this.getCacheTtl(query, result);

			// 缓存逻辑将在具体实现中注入
			// await this.cache.set(cacheKey, result, ttl);

			this.log('debug', '查询结果已缓存', { cacheKey, ttl });
		} catch (error) {
			this.log('warn', '缓存结果失败', {
				error: error instanceof Error ? error.message : String(error)
			});
		}
	}

	/**
	 * 获取缓存键
	 *
	 * @description 子类可以重写此方法来自定义缓存键生成逻辑
	 *
	 * @param query - 查询实例
	 * @param context - 执行上下文
	 * @returns 缓存键
	 */
	protected getCacheKey(query: TQuery, _context: IQueryExecutionContext): string {
		const baseKey = `${this.queryType}:${query.queryId}`;
		const tenantId = query.tenantId || 'global';
		return `${baseKey}:${tenantId}`;
	}

	/**
	 * 获取缓存生存时间
	 *
	 * @description 子类可以重写此方法来自定义缓存生存时间
	 *
	 * @param query - 查询实例
	 * @param result - 查询结果
	 * @returns 缓存生存时间（秒）
	 */
	protected getCacheTtl(_query: TQuery, _result: TResult): number {
		return this.defaultCacheTtl;
	}

	/**
	 * 创建执行上下文
	 *
	 * @param query - 查询实例
	 * @returns 执行上下文
	 */
	protected createExecutionContext(query: TQuery): IQueryExecutionContext {
		return {
			queryId: query.queryId,
			startTime: new Date(),
			user: query.userId ? { id: query.userId } : undefined,
			tenant: query.tenantId ? { id: query.tenantId } : undefined,
			request: query.requestId ? { id: query.requestId } : undefined,
			cache: {
				enabled: true,
				key: this.getCacheKey(query, {} as any),
				ttl: this.defaultCacheTtl
			},
			custom: {}
		};
	}

	/**
	 * 记录缓存命中日志
	 *
	 * @param query - 查询实例
	 * @param context - 执行上下文
	 */
	protected logCacheHit(query: TQuery, context: IQueryExecutionContext): void {
		this.log('debug', '缓存命中', {
			handlerName: this.handlerName,
			queryId: query.queryId,
			queryType: query.queryType,
			cacheKey: context.cache?.key
		});
	}

	/**
	 * 记录成功日志
	 *
	 * @param query - 查询实例
	 * @param result - 查询结果
	 * @param context - 执行上下文
	 */
	protected logSuccess(query: TQuery, result: TResult, context: IQueryExecutionContext): void {
		const executionTime = Date.now() - context.startTime.getTime();

		this.log('info', '查询处理成功', {
			handlerName: this.handlerName,
			queryId: query.queryId,
			queryType: query.queryType,
			executionTime,
			fromCache: false,
			userId: query.userId,
			tenantId: query.tenantId
		});
	}

	/**
	 * 记录错误日志
	 *
	 * @param query - 查询实例
	 * @param error - 错误对象
	 * @param context - 执行上下文
	 */
	protected logError(query: TQuery, error: unknown, context: IQueryExecutionContext): void {
		const executionTime = Date.now() - context.startTime.getTime();

		this.log('error', '查询处理失败', {
			handlerName: this.handlerName,
			queryId: query.queryId,
			queryType: query.queryType,
			executionTime,
			error: error instanceof Error ? error.message : String(error),
			userId: query.userId,
			tenantId: query.tenantId
		});
	}

	/**
	 * 记录日志
	 *
	 * @param level - 日志级别
	 * @param message - 日志消息
	 * @param context - 上下文信息
	 */
	protected log(level: string, message: string, context?: Record<string, unknown>): void {
		// 日志记录将在运行时注入
		if (level === 'error' || level === 'warn') {
			console.warn(`[${level.toUpperCase()}] [${this.handlerName}] ${message}`, context);
		}
	}
}
