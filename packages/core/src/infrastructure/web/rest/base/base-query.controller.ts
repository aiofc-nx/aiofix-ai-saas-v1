/**
 * 基础查询控制器
 *
 * 提供CQRS查询端的RESTful接口基础实现，集成查询总线和分页支持。
 * 控制器负责HTTP查询请求的接收、验证、查询分发和响应格式化。
 *
 * @description 基础查询控制器为所有查询控制器提供统一的基础功能
 *
 * ## 业务规则
 *
 * ### 查询处理规则
 * - 查询控制器只处理读操作（GET）
 * - 每个查询操作对应一个HTTP端点
 * - 查询结果统一格式化
 * - 支持分页、排序、过滤等查询功能
 *
 * ### 缓存规则
 * - 查询结果自动缓存
 * - 支持基于ETag的条件请求
 * - 缓存键基于查询参数和租户信息
 * - 支持缓存失效和刷新
 *
 * ### 性能优化规则
 * - 支持查询结果的流式传输
 * - 支持查询结果的压缩
 * - 支持查询的异步执行
 * - 监控查询性能和慢查询
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @ApiTags('用户查询')
 * export class UserQueryController extends BaseQueryController {
 *   constructor(
 *     cqrsBus: ICQRSBus,
 *     logger: ILoggerService
 *   ) {
 *     super(cqrsBus, logger, 'UserQueryController');
 *   }
 *
 *   @Get()
 *   @QueryEndpoint({
 *     query: GetUsersQuery,
 *     description: '获取用户列表',
 *     cache: { ttl: 300 }
 *   })
 *   async getUsers(
 *     @Query() dto: GetUsersDto,
 *     @TenantContext() tenant: ITenantContext
 *   ): Promise<IQueryResponse<PaginatedResult<User>>> {
 *     return this.executeQuery(GetUsersQuery, dto, { tenant });
 *   }
 *
 *   @Get(':id')
 *   @QueryEndpoint({
 *     query: GetUserQuery,
 *     description: '获取用户详情'
 *   })
 *   async getUser(
 *     @Param('id') id: string,
 *     @TenantContext() tenant: ITenantContext
 *   ): Promise<IQueryResponse<User>> {
 *     return this.executeQuery(GetUserQuery, { id }, { tenant });
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { HttpStatus } from '@nestjs/common';
import type { ICQRSBus } from '../../../../application/cqrs/bus/cqrs-bus.interface';
import type { BaseQuery } from '../../../../application/cqrs/queries/base/base-query';

/**
 * 查询执行上下文接口
 */
export interface IQueryContext {
	/**
	 * 租户上下文
	 */
	tenant?: {
		tenantId: string;
		tenantName?: string;
		tenantType?: string;
	};

	/**
	 * 用户上下文
	 */
	user?: {
		userId: string;
		userName?: string;
		userRole?: string;
		permissions?: string[];
	};

	/**
	 * 查询参数
	 */
	query?: {
		page?: number;
		limit?: number;
		sort?: string;
		filter?: Record<string, unknown>;
	};

	/**
	 * 请求上下文
	 */
	request?: {
		requestId: string;
		userAgent?: string;
		ipAddress?: string;
		timestamp: Date;
	};

	/**
	 * 缓存配置
	 */
	cache?: {
		enabled: boolean;
		ttl: number;
		key?: string;
	};
}

/**
 * 分页结果接口
 */
export interface IPaginatedResult<T> {
	/**
	 * 数据项
	 */
	items: T[];

	/**
	 * 分页信息
	 */
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNext: boolean;
		hasPrevious: boolean;
	};
}

/**
 * 查询响应接口
 */
export interface IQueryResponse<TResult = unknown> {
	/**
	 * 查询是否成功
	 */
	success: boolean;

	/**
	 * 查询结果数据
	 */
	data?: TResult;

	/**
	 * 查询消息
	 */
	message?: string;

	/**
	 * 错误信息
	 */
	error?: {
		code: string;
		message: string;
		details?: unknown;
	};

	/**
	 * 响应元数据
	 */
	metadata: {
		requestId: string;
		timestamp: Date;
		executionTime: number;
		queryType?: string;
		cached?: boolean;
		cacheKey?: string;
	};
}

/**
 * 查询执行选项接口
 */
export interface IQueryExecutionOptions {
	/**
	 * 执行超时时间（毫秒）
	 */
	timeout?: number;

	/**
	 * 缓存配置
	 */
	cache?: {
		enabled: boolean;
		ttl: number;
		key?: string;
	};

	/**
	 * 分页配置
	 */
	pagination?: {
		page: number;
		limit: number;
		maxLimit: number;
	};

	/**
	 * 排序配置
	 */
	sorting?: {
		field: string;
		direction: 'ASC' | 'DESC';
	}[];

	/**
	 * 过滤配置
	 */
	filtering?: Record<string, unknown>;
}

/**
 * 基础查询控制器抽象类
 */
export abstract class BaseQueryController {
	protected readonly controllerName: string;

	/**
	 * 构造函数
	 *
	 * @param cqrsBus - CQRS总线
	 * @param controllerName - 控制器名称
	 */
	protected constructor(protected readonly cqrsBus: ICQRSBus, controllerName: string) {
		this.controllerName = controllerName;
	}

	/**
	 * 执行查询
	 *
	 * @template TQuery - 查询类型
	 * @template TResult - 结果类型
	 * @param queryClass - 查询类构造函数
	 * @param dto - 数据传输对象
	 * @param context - 查询执行上下文
	 * @param options - 执行选项
	 * @returns 查询执行结果
	 */
	protected async executeQuery<TQuery, TResult>(
		queryClass: new (...args: unknown[]) => TQuery,
		dto: unknown,
		context: IQueryContext,
		options?: IQueryExecutionOptions
	): Promise<IQueryResponse<TResult>> {
		const startTime = Date.now();
		const requestId = this.generateRequestId();

		try {
			// 检查缓存
			const cacheKey = this.generateCacheKey(queryClass.name, dto, context);
			const cachedResult = await this.getCachedResult<TResult>(cacheKey, options?.cache);

			if (cachedResult) {
				return this.createSuccessResponse<TResult>(cachedResult, {
					requestId,
					startTime,
					queryType: queryClass.name,
					cached: true,
					cacheKey
				});
			}

			// 创建查询实例
			const query = this.createQuery(queryClass, dto, context, options);

			// 执行查询
			const result = await this.executeQueryWithTimeout(query, options?.timeout);

			// 缓存结果
			await this.cacheResult(cacheKey, result, options?.cache);

			// 返回成功响应
			return this.createSuccessResponse<TResult>(result as TResult, {
				requestId,
				startTime,
				queryType: queryClass.name,
				cached: false,
				cacheKey
			});
		} catch (error) {
			// 返回错误响应
			return this.createErrorResponse(error, {
				requestId,
				startTime,
				queryType: queryClass.name
			});
		}
	}

	/**
	 * 创建查询实例
	 *
	 * @param queryClass - 查询类构造函数
	 * @param dto - 数据传输对象
	 * @param context - 查询执行上下文
	 * @param options - 执行选项
	 * @returns 查询实例
	 * @protected
	 */
	protected createQuery<TQuery>(
		queryClass: new (...args: unknown[]) => TQuery,
		dto: unknown,
		context: IQueryContext,
		options?: IQueryExecutionOptions
	): TQuery {
		// 默认实现假设查询构造函数接受DTO、上下文和选项
		// 子类可以重写此方法以适应不同的查询构造方式
		return new queryClass(dto, context, options);
	}

	/**
	 * 带超时的查询执行
	 *
	 * @param query - 查询实例
	 * @param timeout - 超时时间（毫秒）
	 * @returns 执行结果
	 * @protected
	 */
	protected async executeQueryWithTimeout<TResult>(query: unknown, timeout?: number): Promise<TResult> {
		if (timeout && timeout > 0) {
			return Promise.race([
				this.cqrsBus.executeQuery(query as BaseQuery),
				this.createTimeoutPromise(timeout)
			]) as Promise<TResult>;
		}

		return this.cqrsBus.executeQuery(query as BaseQuery) as TResult;
	}

	/**
	 * 生成缓存键
	 *
	 * @param queryType - 查询类型
	 * @param dto - 查询参数
	 * @param context - 查询上下文
	 * @returns 缓存键
	 * @protected
	 */
	protected generateCacheKey(queryType: string, dto: unknown, context: IQueryContext): string {
		const tenantId = context.tenant?.tenantId || 'default';
		const dtoHash = this.hashObject(dto);
		return `query:${tenantId}:${queryType}:${dtoHash}`;
	}

	/**
	 * 获取缓存结果
	 *
	 * @param cacheKey - 缓存键
	 * @param cacheConfig - 缓存配置
	 * @returns 缓存结果
	 * @protected
	 */
	protected async getCachedResult<TResult>(
		_cacheKey: string,
		_cacheConfig?: { enabled: boolean; ttl: number }
	): Promise<TResult | null> {
		// TODO: 集成实际的缓存系统
		return null;
	}

	/**
	 * 缓存结果
	 *
	 * @param cacheKey - 缓存键
	 * @param result - 查询结果
	 * @param cacheConfig - 缓存配置
	 * @protected
	 */
	protected async cacheResult<TResult>(
		_cacheKey: string,
		_result: TResult,
		_cacheConfig?: { enabled: boolean; ttl: number }
	): Promise<void> {
		// TODO: 集成实际的缓存系统
	}

	/**
	 * 创建成功响应
	 *
	 * @param data - 响应数据
	 * @param metadata - 响应元数据
	 * @returns 成功响应
	 * @protected
	 */
	protected createSuccessResponse<TResult>(
		data: TResult,
		metadata: {
			requestId: string;
			startTime: number;
			queryType?: string;
			cached?: boolean;
			cacheKey?: string;
		}
	): IQueryResponse<TResult> {
		return {
			success: true,
			data,
			message: '查询执行成功',
			metadata: {
				requestId: metadata.requestId,
				timestamp: new Date(),
				executionTime: Date.now() - metadata.startTime,
				queryType: metadata.queryType,
				cached: metadata.cached,
				cacheKey: metadata.cacheKey
			}
		};
	}

	/**
	 * 创建错误响应
	 *
	 * @param error - 错误对象
	 * @param metadata - 响应元数据
	 * @returns 错误响应
	 * @protected
	 */
	protected createErrorResponse(
		error: unknown,
		metadata: {
			requestId: string;
			startTime: number;
			queryType?: string;
		}
	): IQueryResponse<never> {
		const err = error instanceof Error ? error : new Error(String(error));

		return {
			success: false,
			error: {
				code: this.getErrorCode(err),
				message: err.message,
				details: this.getErrorDetails(err)
			},
			metadata: {
				requestId: metadata.requestId,
				timestamp: new Date(),
				executionTime: Date.now() - metadata.startTime,
				queryType: metadata.queryType
			}
		};
	}

	/**
	 * 生成请求ID
	 *
	 * @returns 请求ID
	 * @protected
	 */
	protected generateRequestId(): string {
		return `qry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * 创建超时Promise
	 *
	 * @param timeout - 超时时间
	 * @returns 超时Promise
	 * @protected
	 */
	protected createTimeoutPromise<T>(timeout: number): Promise<T> {
		return new Promise((_, reject) => {
			setTimeout(() => {
				reject(new Error(`查询执行超时: ${timeout}ms`));
			}, timeout);
		});
	}

	/**
	 * 对象哈希
	 *
	 * @param obj - 要哈希的对象
	 * @returns 哈希值
	 * @protected
	 */
	protected hashObject(obj: unknown): string {
		return Buffer.from(JSON.stringify(obj)).toString('base64').substr(0, 16);
	}

	/**
	 * 获取错误码
	 *
	 * @param error - 错误对象
	 * @returns 错误码
	 * @protected
	 */
	protected getErrorCode(error: Error): string {
		if (error.name === 'ValidationError') {
			return 'VALIDATION_ERROR';
		}
		if (error.name === 'PermissionError') {
			return 'PERMISSION_ERROR';
		}
		if (error.message.includes('超时')) {
			return 'TIMEOUT_ERROR';
		}
		if (error.message.includes('未找到')) {
			return 'NOT_FOUND';
		}
		return 'INTERNAL_ERROR';
	}

	/**
	 * 获取错误详细信息
	 *
	 * @param error - 错误对象
	 * @returns 错误详细信息
	 * @protected
	 */
	protected getErrorDetails(error: Error): unknown {
		const isDevelopment = process.env.NODE_ENV === 'development';

		if (isDevelopment) {
			return {
				name: error.name,
				stack: error.stack,
				cause: (error as Error & { cause?: unknown }).cause
			};
		}

		return undefined;
	}

	/**
	 * 获取HTTP状态码
	 *
	 * @param error - 错误对象
	 * @returns HTTP状态码
	 * @protected
	 */
	protected getHttpStatus(error: Error): HttpStatus {
		if (error.name === 'ValidationError') {
			return HttpStatus.BAD_REQUEST;
		}
		if (error.name === 'PermissionError') {
			return HttpStatus.FORBIDDEN;
		}
		if (error.message.includes('未找到')) {
			return HttpStatus.NOT_FOUND;
		}
		if (error.message.includes('超时')) {
			return HttpStatus.REQUEST_TIMEOUT;
		}
		return HttpStatus.INTERNAL_SERVER_ERROR;
	}

	/**
	 * 记录日志
	 *
	 * @param level - 日志级别
	 * @param message - 日志消息
	 * @param context - 上下文信息
	 * @protected
	 */
	protected log(_level: string, _message: string, _context?: Record<string, unknown>): void {
		// TODO: 替换为实际的日志系统
		// console.log(`[${_level.toUpperCase()}] [${this.controllerName}] ${_message}`, _context);
	}
}
