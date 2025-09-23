/**
 * 查询处理器接口
 *
 * 定义查询处理器的基础契约，查询处理器是CQRS模式中负责处理查询的组件。
 * 查询处理器执行只读操作，从读模型中检索数据。
 *
 * @description 查询处理器接口定义了处理查询的标准方式
 *
 * ## 业务规则
 *
 * ### 查询处理器职责规则
 * - 查询处理器负责执行具体的查询操作
 * - 查询处理器应该验证查询的有效性
 * - 查询处理器只能执行只读操作
 * - 查询处理器应该优化查询性能
 *
 * ### 查询处理器只读规则
 * - 查询处理器不能修改系统状态
 * - 查询处理器不能产生领域事件
 * - 查询处理器不能启动事务
 * - 查询处理器的所有操作都应该是幂等的
 *
 * ### 查询处理器性能规则
 * - 查询处理器应该优先使用读模型
 * - 查询处理器可以使用缓存提升性能
 * - 查询处理器应该支持分页和过滤
 * - 查询处理器应该避免N+1查询问题
 *
 * @example
 * ```typescript
 * @QueryHandler(GetUserQuery)
 * export class GetUserQueryHandler implements IQueryHandler<GetUserQuery, GetUserResult> {
 *   constructor(
 *     private readonly userReadRepository: IUserReadRepository,
 *     private readonly cache: IApplicationCache
 *   ) {}
 *
 *   async handle(query: GetUserQuery): Promise<GetUserResult> {
 *     // 1. 验证查询
 *     this.validateQuery(query);
 *
 *     // 2. 检查缓存
 *     const cached = await this.cache.get(this.getCacheKey(query));
 *     if (cached) return cached;
 *
 *     // 3. 执行查询
 *     const user = await this.userReadRepository.findById(query.userId);
 *     if (!user) throw new ResourceNotFoundException('用户不存在');
 *
 *     // 4. 构建结果
 *     const result = new GetUserResult(user);
 *
 *     // 5. 缓存结果
 *     await this.cache.set(this.getCacheKey(query), result, 300);
 *
 *     return result;
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { IQuery } from '../base/query.interface';

/**
 * 查询处理器接口
 *
 * 定义查询处理器必须实现的基础能力
 *
 * @template TQuery - 查询类型
 * @template TResult - 处理结果类型
 */
export interface IQueryHandler<TQuery extends IQuery, TResult> {
  /**
   * 处理查询
   *
   * @description 执行查询的核心方法，包含完整的查询逻辑
   *
   * @param query - 要处理的查询
   * @returns 查询结果的Promise
   *
   * @throws {QueryValidationError} 当查询验证失败时
   * @throws {DataAccessDeniedError} 当数据访问权限验证失败时
   * @throws {ResourceNotFoundException} 当查询资源不存在时
   *
   * @example
   * ```typescript
   * async handle(query: GetUserQuery): Promise<GetUserResult> {
   *   this.validateQuery(query);
   *
   *   const user = await this.userReadRepository.findById(query.userId);
   *   if (!user) throw new ResourceNotFoundException('用户不存在');
   *
   *   return new GetUserResult(user);
   * }
   * ```
   */
  handle(query: TQuery): Promise<TResult>;

  /**
   * 获取处理器名称
   *
   * @description 返回处理器的唯一标识名称，用于：
   * - 处理器注册和发现
   * - 日志记录和调试
   * - 性能监控和指标收集
   * - 错误追踪和诊断
   *
   * @returns 处理器名称
   *
   * @example
   * ```typescript
   * getHandlerName(): string {
   *   return 'GetUserQueryHandler';
   * }
   * ```
   */
  getHandlerName(): string;

  /**
   * 获取处理的查询类型
   *
   * @description 返回此处理器能够处理的查询类型
   *
   * @returns 查询类型标识
   *
   * @example
   * ```typescript
   * getQueryType(): string {
   *   return 'GetUser';
   * }
   * ```
   */
  getQueryType(): string;

  /**
   * 检查是否可以处理指定查询
   *
   * @description 检查此处理器是否可以处理给定的查询
   *
   * @param query - 要检查的查询
   * @returns 如果可以处理返回true，否则返回false
   *
   * @example
   * ```typescript
   * canHandle(query: IQuery): boolean {
   *   return query instanceof GetUserQuery;
   * }
   * ```
   */
  canHandle(query: IQuery): boolean;
}

/**
 * 查询处理器工厂接口
 */
export interface IQueryHandlerFactory<
  THandler extends IQueryHandler<any, any>,
> {
  /**
   * 创建查询处理器实例
   *
   * @param dependencies - 处理器依赖
   * @returns 处理器实例
   */
  create(dependencies?: Record<string, unknown>): THandler;

  /**
   * 获取处理器类型
   *
   * @returns 处理器类型标识
   */
  getHandlerType(): string;
}

/**
 * 查询处理器注册表接口
 */
export interface IQueryHandlerRegistry {
  /**
   * 注册查询处理器
   *
   * @param queryType - 查询类型
   * @param handlerFactory - 处理器工厂
   */
  register<TQuery extends IQuery, TResult>(
    queryType: string,
    handlerFactory: IQueryHandlerFactory<IQueryHandler<TQuery, TResult>>,
  ): void;

  /**
   * 获取查询处理器
   *
   * @param queryType - 查询类型
   * @returns 处理器实例
   */
  get<TQuery extends IQuery, TResult>(
    queryType: string,
  ): IQueryHandler<TQuery, TResult> | undefined;

  /**
   * 检查处理器是否已注册
   *
   * @param queryType - 查询类型
   * @returns 如果已注册返回true，否则返回false
   */
  has(queryType: string): boolean;

  /**
   * 获取所有已注册的查询类型
   *
   * @returns 查询类型数组
   */
  getRegisteredQueryTypes(): string[];

  /**
   * 清空所有注册的处理器
   */
  clear(): void;
}

/**
 * 查询执行上下文接口
 */
export interface IQueryExecutionContext {
  /**
   * 查询ID
   */
  queryId: string;

  /**
   * 执行开始时间
   */
  startTime: Date;

  /**
   * 用户信息
   */
  user?: {
    id: string;
    name?: string;
    roles?: string[];
  };

  /**
   * 租户信息
   */
  tenant?: {
    id: string;
    name?: string;
  };

  /**
   * 请求信息
   */
  request?: {
    id: string;
    ip?: string;
    userAgent?: string;
  };

  /**
   * 缓存信息
   */
  cache?: {
    enabled: boolean;
    key?: string;
    ttl?: number;
  };

  /**
   * 自定义上下文
   */
  custom: Record<string, unknown>;
}

/**
 * 查询执行结果接口
 */
export interface IQueryExecutionResult<TResult = any> {
  /**
   * 执行是否成功
   */
  success: boolean;

  /**
   * 查询结果
   */
  result?: TResult;

  /**
   * 错误信息
   */
  error?: Error;

  /**
   * 执行时间（毫秒）
   */
  executionTime: number;

  /**
   * 是否来自缓存
   */
  fromCache: boolean;

  /**
   * 执行上下文
   */
  context: IQueryExecutionContext;
}

/**
 * 查询验证器接口
 */
export interface IQueryValidator<TQuery extends IQuery> {
  /**
   * 验证查询
   *
   * @param query - 要验证的查询
   * @returns 验证结果
   */
  validate(query: TQuery): Promise<IQueryValidationResult>;

  /**
   * 获取验证器名称
   *
   * @returns 验证器名称
   */
  getValidatorName(): string;
}

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
    code: string;
  }>;

  /**
   * 验证警告列表
   */
  warnings: Array<{
    field: string;
    message: string;
    code: string;
  }>;

  /**
   * 验证上下文
   */
  context: Record<string, unknown>;
}
