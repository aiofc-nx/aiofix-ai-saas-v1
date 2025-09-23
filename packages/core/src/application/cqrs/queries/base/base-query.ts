/**
 * 基础查询类
 *
 * 查询是 CQRS 模式中的读操作，表示用户或系统想要获取的数据请求。
 * 查询封装了查询条件、分页信息、排序规则等，并包含必要的元数据。
 *
 * ## 业务规则
 *
 * ### 查询标识规则
 * - 每个查询必须具有唯一的查询标识符
 * - 查询标识符用于查询的去重和追踪
 * - 查询标识符必须符合 EntityId 的格式要求
 *
 * ### 租户隔离规则
 * - 每个查询必须包含租户标识符
 * - 支持多租户架构的查询隔离
 * - 租户信息不可为空
 *
 * ### 时间戳规则
 * - 查询创建时间使用 UTC 时区
 * - 时间戳精度到毫秒级别
 * - 查询时间不可修改
 *
 * ### 分页规则
 * - 查询支持分页功能
 * - 默认页码为 1，默认页大小为 10
 * - 页大小有最大值限制
 *
 * ### 排序规则
 * - 查询支持多字段排序
 * - 排序方向可以是升序或降序
 * - 排序字段可以是嵌套字段
 *
 * ### 元数据规则
 * - 查询必须包含必要的元数据
 * - 包括用户信息、IP 地址、用户代理等
 * - 元数据用于审计和追踪
 *
 * @description 所有查询的基类，提供查询的一致行为
 * @example
 * ```typescript
 * class GetUsersQuery extends BaseQuery {
 *   constructor(
 *     public readonly status?: string,
 *     public readonly role?: string,
 *     tenantId: string,
 *     userId: string,
 *     page: number = 1,
 *     pageSize: number = 10
 *   ) {
 *     super(tenantId, userId, page, pageSize);
 *   }
 *
 *   get queryType(): string {
 *     return 'GetUsers';
 *   }
 * }
 *
 * // 创建查询
 * const query = new GetUsersQuery(
 *   'active',
 *   'admin',
 *   'tenant-123',
 *   'user-456',
 *   1,
 *   20
 * );
 * ```
 *
 * @since 1.0.0
 */
import { EntityId } from '../../../../domain/value-objects/entity-id';

/**
 * 排序方向枚举
 */
export enum SortDirection {
	ASC = 'ASC',
	DESC = 'DESC'
}

/**
 * 排序规则接口
 */
export interface ISortRule {
	/**
	 * 排序字段名
	 */
	field: string;

	/**
	 * 排序方向
	 */
	direction: SortDirection;
}

/**
 * 分页信息接口
 */
export interface IPaginationInfo {
	/**
	 * 当前页码（从 1 开始）
	 */
	page: number;

	/**
	 * 页大小
	 */
	pageSize: number;

	/**
	 * 总记录数
	 */
	totalCount?: number;

	/**
	 * 总页数
	 */
	totalPages?: number;

	/**
	 * 是否有下一页
	 */
	hasNextPage?: boolean;

	/**
	 * 是否有上一页
	 */
	hasPreviousPage?: boolean;
}

/**
 * 查询结果接口
 */
export interface IQueryResult {
	/**
	 * 获取分页信息
	 *
	 * @returns 分页信息
	 */
	getPaginationInfo(): IPaginationInfo;

	/**
	 * 获取结果数据
	 *
	 * @returns 结果数据
	 */
	getData(): unknown[];

	/**
	 * 获取结果总数
	 *
	 * @returns 结果总数
	 */
	getTotalCount(): number;

	/**
	 * 检查是否有数据
	 *
	 * @returns 如果有数据则返回 true，否则返回 false
	 */
	hasData(): boolean;

	/**
	 * 将结果转换为 JSON 表示
	 *
	 * @returns JSON 表示
	 */
	toJSON(): Record<string, unknown>;
}

export abstract class BaseQuery {
	/**
	 * 最大页大小限制
	 */
	private static readonly MAX_PAGE_SIZE = 1000;

	/**
	 * 默认页大小
	 */
	private static readonly DEFAULT_PAGE_SIZE = 10;

	private readonly _queryId: EntityId;
	private readonly _tenantId: string;
	private readonly _userId: string;
	private readonly _createdAt: Date;
	private readonly _queryVersion: number;
	private readonly _page: number;
	private readonly _pageSize: number;
	private readonly _sortRules: ISortRule[];
	private readonly _metadata: Record<string, unknown>;

	/**
	 * 构造函数
	 *
	 * @param tenantId - 租户标识符
	 * @param userId - 用户标识符
	 * @param page - 页码，默认为 1
	 * @param pageSize - 页大小，默认为 10
	 * @param sortRules - 排序规则，默认为空数组
	 * @param queryVersion - 查询版本号，默认为 1
	 * @param metadata - 额外的元数据
	 */
	protected constructor(
		tenantId: string,
		userId: string,
		page: number = 1,
		pageSize: number = BaseQuery.DEFAULT_PAGE_SIZE,
		sortRules: ISortRule[] = [],
		queryVersion: number = 1,
		metadata: Record<string, unknown> = {}
	) {
		this._queryId = EntityId.generate();
		this._tenantId = tenantId;
		this._userId = userId;
		this._createdAt = new Date();
		this._queryVersion = queryVersion;
		this._page = Math.max(1, page);
		this._pageSize = Math.min(Math.max(1, pageSize), BaseQuery.MAX_PAGE_SIZE);
		this._sortRules = [...sortRules];
		this._metadata = { ...metadata };

		this.validate();
	}

	/**
	 * 获取查询标识符
	 *
	 * @returns 查询唯一标识符
	 */
	public get queryId(): EntityId {
		return this._queryId;
	}

	/**
	 * 获取租户标识符
	 *
	 * @returns 租户标识符
	 */
	public get tenantId(): string {
		return this._tenantId;
	}

	/**
	 * 获取用户标识符
	 *
	 * @returns 用户标识符
	 */
	public get userId(): string {
		return this._userId;
	}

	/**
	 * 获取查询创建时间
	 *
	 * @returns 查询创建时间
	 */
	public get createdAt(): Date {
		return this._createdAt;
	}

	/**
	 * 获取查询版本号
	 *
	 * @returns 查询版本号
	 */
	public get queryVersion(): number {
		return this._queryVersion;
	}

	/**
	 * 获取页码
	 *
	 * @returns 页码
	 */
	public get page(): number {
		return this._page;
	}

	/**
	 * 获取页大小
	 *
	 * @returns 页大小
	 */
	public get pageSize(): number {
		return this._pageSize;
	}

	/**
	 * 获取排序规则
	 *
	 * @returns 排序规则数组
	 */
	public get sortRules(): readonly ISortRule[] {
		return [...this._sortRules];
	}

	/**
	 * 获取查询元数据
	 *
	 * @returns 查询元数据
	 */
	public get metadata(): Record<string, unknown> {
		return { ...this._metadata };
	}

	/**
	 * 获取查询类型名称
	 *
	 * 子类必须重写此方法以返回具体的查询类型名称。
	 *
	 * @returns 查询类型名称
	 */
	public abstract get queryType(): string;

	/**
	 * 获取查询的业务数据
	 *
	 * 子类应该重写此方法以返回查询的业务数据。
	 * 默认实现返回空对象。
	 *
	 * @returns 查询的业务数据
	 */
	public get queryData(): Record<string, unknown> {
		return {};
	}

	/**
	 * 计算偏移量
	 *
	 * @returns 偏移量
	 */
	public get offset(): number {
		return (this._page - 1) * this._pageSize;
	}

	/**
	 * 计算限制数量
	 *
	 * @returns 限制数量
	 */
	public get limit(): number {
		return this._pageSize;
	}

	/**
	 * 检查两个查询是否相等
	 *
	 * 查询的相等性基于查询标识符比较。
	 *
	 * @param other - 要比较的另一个查询
	 * @returns 如果两个查询相等则返回 true，否则返回 false
	 */
	public equals(other: BaseQuery | null | undefined): boolean {
		if (other === null || other === undefined) {
			return false;
		}

		if (!(other instanceof this.constructor)) {
			return false;
		}

		return this._queryId.equals(other._queryId);
	}

	/**
	 * 获取查询的哈希码
	 *
	 * 用于在 Map 或 Set 中使用查询作为键。
	 *
	 * @returns 哈希码字符串
	 */
	public getHashCode(): string {
		return this._queryId.getHashCode();
	}

	/**
	 * 将查询转换为字符串表示
	 *
	 * @returns 字符串表示
	 */
	public toString(): string {
		return `${this.queryType}(${this._queryId.toString()})`;
	}

	/**
	 * 将查询转换为 JSON 表示
	 *
	 * @returns JSON 表示
	 */
	public toJSON(): Record<string, unknown> {
		return {
			queryId: this._queryId.toString(),
			queryType: this.queryType,
			tenantId: this._tenantId,
			userId: this._userId,
			createdAt: this._createdAt.toISOString(),
			queryVersion: this._queryVersion,
			page: this._page,
			pageSize: this._pageSize,
			offset: this.offset,
			limit: this.limit,
			sortRules: this._sortRules,
			queryData: this.queryData,
			metadata: this._metadata
		};
	}

	/**
	 * 获取查询的类型名称
	 *
	 * @returns 类型名称
	 */
	public getTypeName(): string {
		return this.constructor.name;
	}

	/**
	 * 比较两个查询的大小
	 *
	 * 基于查询创建时间进行比较。
	 *
	 * @param other - 要比较的另一个查询
	 * @returns 比较结果：-1 表示小于，0 表示等于，1 表示大于
	 */
	public compareTo(other: BaseQuery): number {
		if (other === null || other === undefined) {
			return 1;
		}

		if (this._createdAt < other._createdAt) {
			return -1;
		}
		if (this._createdAt > other._createdAt) {
			return 1;
		}

		// 如果时间相同，按查询ID比较
		return this._queryId.compareTo(other._queryId);
	}

	/**
	 * 检查查询是否为指定类型
	 *
	 * @param queryType - 查询类型名称
	 * @returns 如果查询是指定类型则返回 true，否则返回 false
	 */
	public isOfType(queryType: string): boolean {
		return this.queryType === queryType;
	}

	/**
	 * 检查查询是否属于指定的租户
	 *
	 * @param tenantId - 租户标识符
	 * @returns 如果查询属于指定的租户则返回 true，否则返回 false
	 */
	public belongsToTenant(tenantId: string): boolean {
		return this._tenantId === tenantId;
	}

	/**
	 * 检查查询是否属于指定的用户
	 *
	 * @param userId - 用户标识符
	 * @returns 如果查询属于指定的用户则返回 true，否则返回 false
	 */
	public belongsToUser(userId: string): boolean {
		return this._userId === userId;
	}

	/**
	 * 获取元数据值
	 *
	 * @param key - 元数据键
	 * @returns 元数据值，如果不存在则返回 undefined
	 */
	public getMetadata(key: string): unknown {
		return this._metadata[key];
	}

	/**
	 * 检查是否包含指定的元数据键
	 *
	 * @param key - 元数据键
	 * @returns 如果包含指定的元数据键则返回 true，否则返回 false
	 */
	public hasMetadata(key: string): boolean {
		return key in this._metadata;
	}

	/**
	 * 添加排序规则
	 *
	 * @param field - 排序字段
	 * @param direction - 排序方向
	 * @returns 新的查询实例（不可变性）
	 */
	public addSortRule(field: string, direction: SortDirection): this {
		const newSortRules = [...this._sortRules, { field, direction }];
		return this.createCopyWithSortRules(newSortRules);
	}

	/**
	 * 移除排序规则
	 *
	 * @param field - 要移除的排序字段
	 * @returns 新的查询实例（不可变性）
	 */
	public removeSortRule(field: string): this {
		const newSortRules = this._sortRules.filter((rule) => rule.field !== field);
		return this.createCopyWithSortRules(newSortRules);
	}

	/**
	 * 清除所有排序规则
	 *
	 * @returns 新的查询实例（不可变性）
	 */
	public clearSortRules(): this {
		return this.createCopyWithSortRules([]);
	}

	/**
	 * 验证查询的有效性
	 *
	 * 子类应该重写此方法以实现具体的验证逻辑。
	 *
	 * @throws {Error} 当查询无效时
	 * @protected
	 */
	protected validate(): void {
		if (!this._queryId || this._queryId.isEmpty()) {
			throw new Error('Query ID cannot be null or empty');
		}

		if (!this._tenantId) {
			throw new Error('Tenant ID cannot be null or empty');
		}

		if (!this._userId) {
			throw new Error('User ID cannot be null or empty');
		}

		if (this._queryVersion < 1) {
			throw new Error('Query version must be greater than 0');
		}

		if (this._page < 1) {
			throw new Error('Page must be greater than 0');
		}

		if (this._pageSize < 1) {
			throw new Error('Page size must be greater than 0');
		}

		if (this._pageSize > BaseQuery.MAX_PAGE_SIZE) {
			throw new Error(`Page size cannot exceed ${BaseQuery.MAX_PAGE_SIZE}`);
		}
	}

	/**
	 * 创建带有新排序规则的查询副本
	 *
	 * 子类应该重写此方法以实现具体的副本创建逻辑。
	 *
	 * @param sortRules - 新的排序规则
	 * @returns 新的查询实例
	 * @protected
	 */
	protected abstract createCopyWithSortRules(sortRules: ISortRule[]): this;
}
