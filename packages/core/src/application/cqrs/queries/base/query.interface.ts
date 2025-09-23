/**
 * 查询接口
 *
 * 定义查询的基础契约，查询是CQRS模式中表示数据检索意图的数据传输对象。
 * 查询包含检索数据所需的所有参数和元数据。
 *
 * @description 查询接口定义了所有查询必须实现的基础能力
 *
 * ## 业务规则
 *
 * ### 查询标识规则
 * - 每个查询必须有唯一的查询标识符
 * - 查询标识符用于缓存键生成和追踪
 * - 查询标识符在查询生命周期内不可变更
 * - 查询标识符必须符合UUID格式要求
 *
 * ### 查询时间戳规则
 * - 查询创建时间使用UTC时区
 * - 时间戳用于查询排序和缓存失效
 * - 时间戳精度到毫秒级别
 * - 时间戳不可修改
 *
 * ### 查询上下文规则
 * - 查询必须包含执行上下文信息
 * - 用户信息用于权限验证和数据过滤
 * - 租户信息用于多租户数据隔离
 * - 请求信息用于性能监控
 *
 * ### 查询不变性规则
 * - 查询一旦创建不可修改
 * - 所有查询属性都应该是只读的
 * - 查询应该是纯数据对象
 * - 查询不包含业务逻辑
 *
 * @example
 * ```typescript
 * export class GetUserQuery implements IQuery {
 *   public readonly queryId: string;
 *   public readonly queryType: string;
 *   public readonly timestamp: Date;
 *   public readonly userId?: string;
 *   public readonly tenantId?: string;
 *
 *   constructor(
 *     public readonly targetUserId: string,
 *     public readonly includeProfile: boolean = false,
 *     userId?: string,
 *     tenantId?: string
 *   ) {
 *     this.queryId = EntityId.generate().value;
 *     this.queryType = 'GetUser';
 *     this.timestamp = new Date();
 *     this.userId = userId;
 *     this.tenantId = tenantId;
 *   }
 *
 *   validate(): IQueryValidationResult {
 *     const errors: any[] = [];
 *
 *     if (!this.targetUserId) {
 *       errors.push({ field: 'targetUserId', message: '用户ID不能为空' });
 *     }
 *
 *     return { isValid: errors.length === 0, errors };
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

/**
 * 查询验证结果接口
 */
export interface IQueryValidationResult {
	/**
	 * 验证是否通过
	 */
	isValid: boolean;

	/**
	 * 验证错误列表
	 */
	errors: Array<{
		field: string;
		message: string;
		code?: string;
	}>;

	/**
	 * 验证警告列表
	 */
	warnings?: Array<{
		field: string;
		message: string;
		code?: string;
	}>;
}

/**
 * 查询接口
 *
 * 定义查询必须实现的基础能力
 */
export interface IQuery {
	/**
	 * 查询标识符
	 *
	 * @description 查询的唯一标识符，用于：
	 * - 查询缓存键生成
	 * - 查询追踪和审计
	 * - 查询关联和引用
	 * - 错误诊断和调试
	 *
	 * @readonly
	 */
	readonly queryId: string;

	/**
	 * 查询类型
	 *
	 * @description 查询的类型标识，用于：
	 * - 查询路由和分发
	 * - 处理器注册和发现
	 * - 日志记录和监控
	 * - 权限控制和验证
	 *
	 * @readonly
	 */
	readonly queryType: string;

	/**
	 * 查询创建时间
	 *
	 * @description 查询创建的时间戳，用于：
	 * - 查询排序和过期检查
	 * - 缓存失效和更新
	 * - 性能监控和统计
	 * - 时间范围分析
	 *
	 * @readonly
	 */
	readonly timestamp: Date;

	/**
	 * 执行用户ID
	 *
	 * @description 执行查询的用户标识符，用于：
	 * - 权限验证和访问控制
	 * - 数据过滤和脱敏
	 * - 用户行为分析
	 * - 个性化查询优化
	 *
	 * @readonly
	 */
	readonly userId?: string;

	/**
	 * 租户ID
	 *
	 * @description 查询所属的租户标识符，用于：
	 * - 多租户数据隔离
	 * - 租户级别的权限控制
	 * - 租户资源配额管理
	 * - 租户级别的缓存
	 *
	 * @readonly
	 */
	readonly tenantId?: string;

	/**
	 * 请求ID
	 *
	 * @description 触发查询的请求标识符，用于：
	 * - 请求追踪和关联
	 * - 分布式链路追踪
	 * - 请求性能分析
	 * - 错误诊断和调试
	 *
	 * @readonly
	 */
	readonly requestId?: string;

	/**
	 * 相关性ID
	 *
	 * @description 查询关联的业务流程标识符，用于：
	 * - 业务流程追踪
	 * - 查询关联和分组
	 * - 缓存策略优化
	 * - 流程状态监控
	 *
	 * @readonly
	 */
	readonly correlationId?: string;

	/**
	 * 验证查询
	 *
	 * @description 验证查询的数据有效性和业务规则
	 *
	 * @returns 验证结果
	 *
	 * @example
	 * ```typescript
	 * validate(): IQueryValidationResult {
	 *   const errors: any[] = [];
	 *
	 *   if (!this.targetUserId || this.targetUserId.trim().length === 0) {
	 *     errors.push({
	 *       field: 'targetUserId',
	 *       message: '用户ID不能为空',
	 *       code: 'USER_ID_REQUIRED'
	 *     });
	 *   }
	 *
	 *   return {
	 *     isValid: errors.length === 0,
	 *     errors
	 *   };
	 * }
	 * ```
	 */
	validate(): IQueryValidationResult;

	/**
	 * 获取查询的业务标识符
	 *
	 * @description 返回用于业务逻辑的标识符，通常用于日志和调试
	 * @returns 业务标识符字符串
	 *
	 * @example
	 * ```typescript
	 * getBusinessIdentifier(): string {
	 *   return `GetUser(${this.queryId}, ${this.targetUserId})`;
	 * }
	 * ```
	 */
	getBusinessIdentifier(): string;

	/**
	 * 转换为纯数据对象
	 *
	 * @description 将查询转换为纯数据对象，用于缓存键生成和传输
	 * @returns 包含所有查询数据的纯对象
	 *
	 * @example
	 * ```typescript
	 * toData(): Record<string, unknown> {
	 *   return {
	 *     queryId: this.queryId,
	 *     queryType: this.queryType,
	 *     timestamp: this.timestamp,
	 *     userId: this.userId,
	 *     tenantId: this.tenantId,
	 *     targetUserId: this.targetUserId,
	 *     includeProfile: this.includeProfile
	 *   };
	 * }
	 * ```
	 */
	toData(): Record<string, unknown>;

	/**
	 * 获取查询版本
	 *
	 * @description 返回查询的版本号，用于版本兼容性管理
	 * @returns 查询版本号
	 * @default '1.0.0'
	 */
	getVersion(): string;

	/**
	 * 获取查询复杂度
	 *
	 * @description 返回查询的复杂度分数，用于性能监控和限制
	 * @returns 复杂度分数（数字越大复杂度越高）
	 * @default 1
	 */
	getComplexity(): number;

	/**
	 * 获取缓存键
	 *
	 * @description 生成查询结果的缓存键
	 * @returns 缓存键字符串
	 *
	 * @example
	 * ```typescript
	 * getCacheKey(): string {
	 *   return `user:${this.targetUserId}:profile:${this.includeProfile}`;
	 * }
	 * ```
	 */
	getCacheKey(): string;

	/**
	 * 检查查询是否过期
	 *
	 * @description 检查查询是否已过期，过期的查询结果可能不准确
	 * @param expirationTime - 过期时间（可选，使用默认过期策略）
	 * @returns 如果已过期返回true，否则返回false
	 */
	isExpired(expirationTime?: number): boolean;
}

/**
 * 查询元数据接口
 */
export interface IQueryMetadata {
	/**
	 * 查询类型
	 */
	queryType: string;

	/**
	 * 查询描述
	 */
	description: string;

	/**
	 * 查询版本
	 */
	version: string;

	/**
	 * 所需权限
	 */
	requiredPermissions: string[];

	/**
	 * 查询分类
	 */
	category?: string;

	/**
	 * 查询标签
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
}

/**
 * 查询工厂接口
 */
export interface IQueryFactory<T extends IQuery> {
	/**
	 * 创建查询实例
	 *
	 * @param data - 创建查询所需的数据
	 * @returns 新创建的查询实例
	 */
	create(data: Record<string, unknown>): T;

	/**
	 * 获取查询类型
	 *
	 * @returns 查询类型标识
	 */
	getQueryType(): string;

	/**
	 * 验证查询数据
	 *
	 * @param data - 要验证的数据
	 * @returns 验证结果
	 */
	validateData(data: Record<string, unknown>): IQueryValidationResult;
}
