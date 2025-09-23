/**
 * 查询侧输出端口接口
 *
 * 定义查询处理过程中需要的外部依赖接口，这些接口遵循Clean Architecture的端口适配器模式。
 * 查询侧端口主要用于只读操作和数据检索。
 *
 * @description 查询侧端口接口定义了查询处理器与外部世界交互的契约
 *
 * ## 业务规则
 *
 * ### 端口设计规则
 * - 端口接口定义在应用层，实现在基础设施层
 * - 端口接口应该基于业务概念而非技术实现
 * - 端口接口应该保持稳定，避免频繁变更
 * - 端口接口应该支持测试替身和模拟
 *
 * ### 查询端口职责规则
 * - 查询端口负责只读数据访问操作
 * - 查询端口支持复杂查询和聚合操作
 * - 查询端口负责缓存和性能优化
 * - 查询端口支持数据脱敏和权限过滤
 *
 * @example
 * ```typescript
 * // 在查询处理器中使用端口
 * @QueryHandler(GetUserQuery)
 * export class GetUserQueryHandler extends BaseQueryHandler<GetUserQuery, GetUserResult> {
 *   constructor(
 *     private readonly userReadRepository: IUserReadRepository,
 *     private readonly cacheService: ICachePort,
 *     private readonly permissionService: IPermissionValidationPort
 *   ) {
 *     super('GetUserQueryHandler', 'GetUser');
 *   }
 *
 *   protected async executeQuery(query: GetUserQuery): Promise<GetUserResult> {
 *     // 1. 权限验证
 *     await this.permissionService.validateDataAccess(query.userId, 'user:read');
 *
 *     // 2. 缓存检查
 *     const cached = await this.cacheService.get(this.getCacheKey(query));
 *     if (cached) return cached;
 *
 *     // 3. 查询数据
 *     const user = await this.userReadRepository.findById(query.targetUserId);
 *
 *     return new GetUserResult(user);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

/**
 * 读仓储端口接口
 *
 * 定义读模型访问的端口契约
 *
 * @template TReadModel - 读模型类型
 */
export interface IReadRepositoryPort<TReadModel> {
	/**
	 * 根据ID查找读模型
	 *
	 * @param id - 读模型标识符
	 * @returns 读模型实例，如果不存在返回null
	 */
	findById(id: string): Promise<TReadModel | null>;

	/**
	 * 查找多个读模型
	 *
	 * @param criteria - 查询条件
	 * @param options - 查询选项
	 * @returns 读模型列表
	 */
	findMany(criteria: IQueryCriteria, options?: IQueryOptions): Promise<TReadModel[]>;

	/**
	 * 分页查询读模型
	 *
	 * @param criteria - 查询条件
	 * @param pagination - 分页参数
	 * @returns 分页结果
	 */
	findPaginated(criteria: IQueryCriteria, pagination: IPaginationOptions): Promise<IPaginatedResult<TReadModel>>;

	/**
	 * 计算读模型数量
	 *
	 * @param criteria - 查询条件
	 * @returns 数量
	 */
	count(criteria: IQueryCriteria): Promise<number>;

	/**
	 * 聚合查询
	 *
	 * @param aggregation - 聚合配置
	 * @returns 聚合结果
	 */
	aggregate(aggregation: IAggregationConfig): Promise<IAggregationResult>;
}

/**
 * 查询条件接口
 */
export interface IQueryCriteria {
	/**
	 * 字段过滤条件
	 */
	filters?: Record<string, unknown>;

	/**
	 * 文本搜索
	 */
	search?: {
		query: string;
		fields: string[];
	};

	/**
	 * 日期范围
	 */
	dateRange?: {
		field: string;
		start?: Date;
		end?: Date;
	};

	/**
	 * 租户过滤
	 */
	tenantId?: string;

	/**
	 * 用户过滤
	 */
	userId?: string;
}

/**
 * 查询选项接口
 */
export interface IQueryOptions {
	/**
	 * 排序
	 */
	sort?: {
		field: string;
		direction: 'asc' | 'desc';
	}[];

	/**
	 * 包含字段
	 */
	includes?: string[];

	/**
	 * 排除字段
	 */
	excludes?: string[];

	/**
	 * 关联查询
	 */
	relations?: string[];
}

/**
 * 分页选项接口
 */
export interface IPaginationOptions {
	/**
	 * 页码（从1开始）
	 */
	page: number;

	/**
	 * 每页大小
	 */
	limit: number;

	/**
	 * 排序
	 */
	sort?: {
		field: string;
		direction: 'asc' | 'desc';
	}[];
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
	 * 总数
	 */
	total: number;

	/**
	 * 当前页
	 */
	page: number;

	/**
	 * 每页大小
	 */
	limit: number;

	/**
	 * 总页数
	 */
	totalPages: number;

	/**
	 * 是否有下一页
	 */
	hasNext: boolean;

	/**
	 * 是否有上一页
	 */
	hasPrevious: boolean;
}

/**
 * 聚合配置接口
 */
export interface IAggregationConfig {
	/**
	 * 分组字段
	 */
	groupBy: string[];

	/**
	 * 聚合操作
	 */
	aggregations: {
		field: string;
		operation: 'count' | 'sum' | 'avg' | 'min' | 'max';
		alias?: string;
	}[];

	/**
	 * 过滤条件
	 */
	filters?: Record<string, unknown>;
}

/**
 * 聚合结果接口
 */
export interface IAggregationResult {
	/**
	 * 分组结果
	 */
	groups: Array<{
		key: Record<string, unknown>;
		values: Record<string, unknown>;
	}>;

	/**
	 * 总计
	 */
	totals: Record<string, unknown>;
}

/**
 * 缓存端口接口
 */
export interface ICachePort {
	/**
	 * 获取缓存值
	 *
	 * @param key - 缓存键
	 * @returns 缓存值，如果不存在返回null
	 */
	get<T>(key: string): Promise<T | null>;

	/**
	 * 设置缓存值
	 *
	 * @param key - 缓存键
	 * @param value - 缓存值
	 * @param ttl - 生存时间（秒）
	 * @returns 设置操作的Promise
	 */
	set<T>(key: string, value: T, ttl?: number): Promise<void>;

	/**
	 * 删除缓存
	 *
	 * @param key - 缓存键
	 * @returns 删除操作的Promise
	 */
	delete(key: string): Promise<void>;

	/**
	 * 批量删除缓存
	 *
	 * @param pattern - 键模式
	 * @returns 删除操作的Promise
	 */
	deleteByPattern(pattern: string): Promise<void>;

	/**
	 * 检查缓存是否存在
	 *
	 * @param key - 缓存键
	 * @returns 如果存在返回true，否则返回false
	 */
	exists(key: string): Promise<boolean>;
}

/**
 * 权限验证端口接口
 */
export interface IPermissionValidationPort {
	/**
	 * 验证用户权限
	 *
	 * @param userId - 用户ID
	 * @param permission - 所需权限
	 * @param resource - 资源标识
	 * @returns 验证结果
	 */
	validatePermission(userId: string, permission: string, resource?: string): Promise<boolean>;

	/**
	 * 验证数据访问权限
	 *
	 * @param userId - 用户ID
	 * @param dataType - 数据类型
	 * @param dataId - 数据ID
	 * @returns 验证结果
	 */
	validateDataAccess(userId: string, dataType: string, dataId?: string): Promise<boolean>;

	/**
	 * 获取用户权限列表
	 *
	 * @param userId - 用户ID
	 * @returns 权限列表
	 */
	getUserPermissions(userId: string): Promise<string[]>;

	/**
	 * 过滤用户可访问的数据
	 *
	 * @param userId - 用户ID
	 * @param data - 原始数据
	 * @param dataType - 数据类型
	 * @returns 过滤后的数据
	 */
	filterAccessibleData<T>(userId: string, data: T[], dataType: string): Promise<T[]>;
}
