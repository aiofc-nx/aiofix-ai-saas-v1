/**
 * 基础查询用例抽象类
 *
 * 专门用于处理数据检索的用例，继承自BaseUseCase并添加了查询用例特有的功能。
 * 查询用例负责协调查询处理器和读模型来完成数据检索操作。
 *
 * @description 基础查询用例类为所有查询用例提供统一的基础功能
 *
 * ## 业务规则
 *
 * ### 查询用例职责规则
 * - 查询用例负责处理系统数据检索操作
 * - 查询用例不能修改系统状态
 * - 查询用例应该优化查询性能
 * - 查询用例可以使用缓存来提升性能
 *
 * ### 查询用例只读规则
 * - 查询用例不能调用任何状态变更方法
 * - 查询用例不能产生领域事件
 * - 查询用例不能启动事务
 * - 查询用例的所有操作都应该是幂等的
 *
 * ### 查询用例性能规则
 * - 查询用例应该优先使用读模型
 * - 查询用例可以使用缓存来提升性能
 * - 查询用例应该支持分页和过滤
 * - 查询用例应该避免N+1查询问题
 *
 * ### 查询用例安全规则
 * - 查询用例必须验证数据访问权限
 * - 查询用例必须进行数据脱敏
 * - 查询用例必须支持多租户数据隔离
 * - 查询用例不能返回敏感数据
 *
 * @example
 * ```typescript
 * export class GetUserUseCase extends BaseQueryUseCase<GetUserRequest, GetUserResponse> {
 *   constructor(
 *     private readonly userQueryRepository: IUserQueryRepository,
 *     private readonly cacheService: ICacheService
 *   ) {
 *     super('GetUser', '获取用户查询用例', '1.0.0', ['user:read']);
 *   }
 *
 *   protected async executeQuery(
 *     request: GetUserRequest,
 *     context: IUseCaseContext
 *   ): Promise<GetUserResponse> {
 *     // 1. 尝试从缓存获取
 *     const cached = await this.getFromCache(request.userId);
 *     if (cached) {
 *       return cached;
 *     }
 *
 *     // 2. 从读模型查询
 *     const user = await this.userQueryRepository.findById(request.userId);
 *     if (!user) {
 *       throw new EntityNotFoundError('用户不存在');
 *     }
 *
 *     // 3. 数据脱敏
 *     const response = this.sanitizeUserData(user);
 *
 *     // 4. 缓存结果
 *     await this.cacheResult(request.userId, response);
 *
 *     return response;
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { BaseUseCase } from './base-use-case';
import { IUseCaseContext } from './use-case.interface';
import { BaseQuery } from '../../cqrs/queries/base/base-query';

/**
 * 查询选项接口
 */
export interface QueryOptions {
	/**
	 * 分页选项
	 */
	pagination?: {
		page: number;
		limit: number;
		offset?: number;
	};

	/**
	 * 排序选项
	 */
	sorting?: {
		field: string;
		direction: 'asc' | 'desc';
	}[];

	/**
	 * 过滤选项
	 */
	filters?: Record<string, unknown>;

	/**
	 * 包含字段
	 */
	includes?: string[];

	/**
	 * 排除字段
	 */
	excludes?: string[];

	/**
	 * 缓存选项
	 */
	cache?: {
		enabled: boolean;
		ttl?: number;
		key?: string;
	};
}

/**
 * 查询结果接口
 */
export interface QueryResult<T> {
	/**
	 * 查询数据
	 */
	data: T;

	/**
	 * 总数（用于分页）
	 */
	total?: number;

	/**
	 * 分页信息
	 */
	pagination?: {
		page: number;
		limit: number;
		totalPages: number;
		hasNext: boolean;
		hasPrevious: boolean;
	};

	/**
	 * 查询元数据
	 */
	metadata?: {
		executionTime: number;
		fromCache: boolean;
		queryComplexity?: number;
	};
}

/**
 * 基础查询用例抽象类
 *
 * @template TRequest - 查询请求类型
 * @template TResponse - 查询响应类型
 */
export abstract class BaseQueryUseCase<TRequest, TResponse> extends BaseUseCase<TRequest, TResponse> {
	protected readonly defaultCacheTtl: number = 300; // 5分钟
	protected readonly maxQueryComplexity: number = 100;

	constructor(
		useCaseName: string,
		useCaseDescription: string,
		useCaseVersion: string = '1.0.0',
		requiredPermissions: string[] = []
	) {
		super(useCaseName, useCaseDescription, useCaseVersion, requiredPermissions);
	}

	/**
	 * 执行用例逻辑
	 *
	 * @description 实现基础用例的抽象方法，为查询用例提供标准的执行流程
	 */
	protected async executeUseCase(request: TRequest, context: IUseCaseContext): Promise<TResponse> {
		// 查询用例的标准执行流程
		return await this.executeQuery(request, context);
	}

	/**
	 * 执行查询逻辑
	 *
	 * @description 子类必须实现此方法来定义具体的查询执行逻辑
	 *
	 * @param request - 查询请求
	 * @param context - 执行上下文
	 * @returns 查询响应
	 */
	protected abstract executeQuery(request: TRequest, context: IUseCaseContext): Promise<TResponse>;

	/**
	 * 验证查询权限
	 *
	 * @description 验证用户是否有权限访问查询的数据
	 *
	 * @param request - 查询请求
	 * @param context - 执行上下文
	 * @throws {DataAccessDeniedError} 当数据访问权限验证失败时
	 */
	protected async validateDataAccess(request: TRequest, context: IUseCaseContext): Promise<void> {
		// 子类可以重写此方法来实现具体的数据访问权限验证

		// 基础的租户隔离检查
		if (context.tenant && this.requiresTenantIsolation()) {
			await this.validateTenantAccess(request, context);
		}
	}

	/**
	 * 验证租户访问权限
	 *
	 * @description 验证用户是否有权限访问指定租户的数据
	 */
	protected async validateTenantAccess(request: TRequest, context: IUseCaseContext): Promise<void> {
		// 基础的租户隔离验证
		if (!context.tenant?.id) {
			throw new Error(`[${this.useCaseName}] 缺少租户上下文`);
		}

		if (!context.user?.id) {
			throw new Error(`[${this.useCaseName}] 缺少用户上下文`);
		}

		// 具体的租户权限验证逻辑需要在子类中实现
	}

	/**
	 * 检查是否需要租户隔离
	 *
	 * @description 子类可以重写此方法来指定是否需要租户隔离
	 * @returns 如果需要租户隔离返回true，否则返回false
	 */
	protected requiresTenantIsolation(): boolean {
		return true; // 默认需要租户隔离
	}

	/**
	 * 获取缓存键
	 *
	 * @description 生成查询结果的缓存键
	 *
	 * @param request - 查询请求
	 * @param context - 执行上下文
	 * @returns 缓存键
	 */
	protected getCacheKey(request: TRequest, context: IUseCaseContext): string {
		const baseKey = `usecase:${this.useCaseName}`;
		const requestHash = this.hashRequest(request);
		const tenantId = context.tenant?.id || 'global';

		return `${baseKey}:${tenantId}:${requestHash}`;
	}

	/**
	 * 从缓存获取结果
	 *
	 * @param cacheKey - 缓存键
	 * @returns 缓存的结果，如果不存在返回null
	 */
	protected async getFromCache(cacheKey: string): Promise<TResponse | null> {
		try {
			// 缓存逻辑将在具体实现中注入
			// return await this.cacheService.get(cacheKey);
			return null;
		} catch (error) {
			console.warn(`[${this.useCaseName}] 缓存读取失败`, { cacheKey, error: (error as Error).message });
			return null;
		}
	}

	/**
	 * 缓存查询结果
	 *
	 * @param cacheKey - 缓存键
	 * @param result - 查询结果
	 * @param ttl - 缓存生存时间（秒）
	 */
	protected async cacheResult(cacheKey: string, result: TResponse, ttl?: number): Promise<void> {
		try {
			const cacheTtl = ttl || this.defaultCacheTtl;
			// 缓存逻辑将在具体实现中注入
			// await this.cacheService.set(cacheKey, result, cacheTtl);

			console.warn(`[${this.useCaseName}] 查询结果已缓存`, { cacheKey, ttl: cacheTtl });
		} catch (error) {
			console.warn(`[${this.useCaseName}] 缓存写入失败`, { cacheKey, error: (error as Error).message });
			// 缓存失败不应该影响查询结果
		}
	}

	/**
	 * 应用查询选项
	 *
	 * @description 应用分页、排序、过滤等查询选项
	 *
	 * @param query - 基础查询
	 * @param options - 查询选项
	 * @returns 应用选项后的查询
	 */
	protected applyQueryOptions(query: BaseQuery, _options: QueryOptions): BaseQuery {
		// 这个方法的具体实现依赖于查询技术（如ORM）
		// 子类可以重写此方法来实现特定的查询选项应用逻辑
		return query;
	}

	/**
	 * 数据脱敏
	 *
	 * @description 对查询结果进行数据脱敏处理
	 *
	 * @param data - 原始数据
	 * @param context - 执行上下文
	 * @returns 脱敏后的数据
	 */
	protected sanitizeData(data: unknown, _context: IUseCaseContext): unknown {
		// 子类可以重写此方法来实现具体的数据脱敏逻辑
		return data;
	}

	/**
	 * 计算查询复杂度
	 *
	 * @description 计算查询的复杂度，用于性能监控和限制
	 *
	 * @param request - 查询请求
	 * @returns 查询复杂度分数
	 */
	protected calculateQueryComplexity(_request: TRequest): number {
		// 子类可以重写此方法来实现具体的复杂度计算
		return 1;
	}

	/**
	 * 验证查询复杂度
	 *
	 * @param request - 查询请求
	 * @throws {QueryComplexityError} 当查询复杂度超过限制时
	 */
	protected validateQueryComplexity(request: TRequest): void {
		const complexity = this.calculateQueryComplexity(request);
		if (complexity > this.maxQueryComplexity) {
			throw new QueryComplexityError(
				`查询复杂度 ${complexity} 超过最大限制 ${this.maxQueryComplexity}`,
				this.useCaseName,
				complexity,
				this.maxQueryComplexity
			);
		}
	}

	/**
	 * 生成请求哈希
	 *
	 * @param request - 查询请求
	 * @returns 请求的哈希值
	 */
	private hashRequest(request: TRequest): string {
		try {
			const requestString = JSON.stringify(request);
			// 简单的哈希实现，生产环境可以使用更复杂的哈希算法
			let hash = 0;
			for (let i = 0; i < requestString.length; i++) {
				const char = requestString.charCodeAt(i);
				hash = (hash * 31 + char) % 2147483647; // 使用乘法替代位运算
			}
			return Math.abs(hash).toString(36);
		} catch {
			// 如果序列化失败，使用时间戳作为哈希
			return Date.now().toString(36);
		}
	}
}

/**
 * 查询复杂度异常
 */
export class QueryComplexityError extends Error {
	readonly errorCode = 'QUERY_COMPLEXITY_ERROR';
	readonly errorType = 'complexity';

	constructor(
		message: string,
		public readonly useCaseName: string,
		public readonly actualComplexity: number,
		public readonly maxComplexity: number
	) {
		super(message);
		this.name = 'QueryComplexityError';
	}
}

/**
 * 数据访问拒绝异常
 */
export class DataAccessDeniedError extends Error {
	readonly errorCode = 'DATA_ACCESS_DENIED';
	readonly errorType = 'access';

	constructor(
		message: string,
		public readonly useCaseName: string,
		public readonly resourceId?: string,
		public readonly requiredPermissions?: string[]
	) {
		super(message);
		this.name = 'DataAccessDeniedError';
	}
}

/**
 * 实体未找到异常
 */
export class EntityNotFoundError extends Error {
	readonly errorCode = 'ENTITY_NOT_FOUND';
	readonly errorType = 'notFound';

	constructor(message: string, public readonly entityType: string, public readonly entityId: string) {
		super(message);
		this.name = 'EntityNotFoundError';
	}
}
