/**
 * 查询处理器接口
 *
 * 查询处理器是 CQRS 模式中处理查询的核心组件。
 * 每个查询处理器负责处理特定类型的查询，返回相应的数据。
 *
 * ## 业务规则
 *
 * ### 单一职责规则
 * - 每个查询处理器只处理一种类型的查询
 * - 查询处理器应该保持简单和专注
 * - 复杂的数据聚合应该委托给专门的查询服务
 *
 * ### 性能规则
 * - 查询处理器应该优化查询性能
 * - 应该支持分页、排序、过滤等功能
 * - 应该使用适当的索引和查询优化技术
 *
 * ### 缓存规则
 * - 查询处理器应该支持结果缓存
 * - 应该根据数据变更情况更新缓存
 * - 应该提供缓存失效机制
 *
 * ### 权限规则
 * - 查询处理器应该检查用户权限
 * - 应该根据用户角色过滤数据
 * - 应该确保数据安全性和隐私性
 *
 * ### 错误处理规则
 * - 查询处理器应该妥善处理各种异常情况
 * - 应该提供有意义的错误信息
 * - 应该记录详细的错误日志
 *
 * @description 查询处理器接口，定义查询处理的标准行为
 * @example
 * ```typescript
 * @QueryHandler(GetUsersQuery)
 * export class GetUsersQueryHandler implements IQueryHandler<GetUsersQuery, UserListResult> {
 *   constructor(
 *     private readonly userRepository: IUserRepository,
 *     private readonly cacheService: ICacheService
 *   ) {}
 *
 *   async execute(query: GetUsersQuery): Promise<UserListResult> {
 *     // 检查缓存
 *     const cacheKey = this.generateCacheKey(query);
 *     const cachedResult = await this.cacheService.get(cacheKey);
 *     if (cachedResult) {
 *       return cachedResult;
 *     }
 *
 *     // 执行查询
 *     const users = await this.userRepository.findByStatus(
 *       query.status,
 *       query.page,
 *       query.pageSize
 *     );
 *
 *     // 构建结果
 *     const result = new UserListResult(users, query.page, query.pageSize);
 *
 *     // 缓存结果
 *     await this.cacheService.set(cacheKey, result, 300); // 5分钟缓存
 *
 *     return result;
 *   }
 *
 *   getSupportedQueryType(): string {
 *     return 'GetUsers';
 *   }
 *
 *   supports(queryType: string): boolean {
 *     return queryType === 'GetUsers';
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
import { BaseQuery, IQueryResult } from './base-query';

/**
 * 查询处理器接口
 *
 * @template TQuery - 查询类型
 * @template TResult - 查询结果类型
 */
export interface IQueryHandler<
  TQuery extends BaseQuery = BaseQuery,
  TResult extends IQueryResult = IQueryResult,
> {
  /**
   * 执行查询
   *
   * 处理指定的查询，返回相应的数据。
   * 此方法应该优化性能，支持缓存和分页。
   *
   * @param query - 要处理的查询
   * @returns Promise，查询执行完成后解析为结果
   * @throws {Error} 当查询执行失败时
   */
  execute(query: TQuery): Promise<TResult>;

  /**
   * 获取处理器支持的查询类型
   *
   * @returns 查询类型名称
   */
  getSupportedQueryType(): string;

  /**
   * 检查是否支持指定的查询类型
   *
   * @param queryType - 查询类型名称
   * @returns 如果支持指定的查询类型则返回 true，否则返回 false
   */
  supports(queryType: string): boolean;

  /**
   * 验证查询
   *
   * 验证查询的有效性，包括参数验证。
   * 验证失败时应该抛出相应的异常。
   *
   * @param query - 要验证的查询
   * @throws {Error} 当查询验证失败时
   * @protected
   */
  validateQuery(query: TQuery): void;

  /**
   * 获取处理器的优先级
   *
   * 当有多个处理器支持同一查询类型时，优先级高的处理器会被选择。
   * 默认优先级为 0。
   *
   * @returns 处理器优先级
   */
  getPriority(): number;

  /**
   * 检查查询是否可以处理
   *
   * 在执行查询之前检查查询是否可以处理。
   * 可以用于实现权限检查等。
   *
   * @param query - 要检查的查询
   * @returns 如果查询可以处理则返回 true，否则返回 false
   */
  canHandle(query: TQuery): Promise<boolean>;

  /**
   * 生成缓存键
   *
   * 根据查询参数生成唯一的缓存键。
   * 用于查询结果的缓存管理。
   *
   * @param query - 查询对象
   * @returns 缓存键字符串
   */
  generateCacheKey(query: TQuery): string;

  /**
   * 获取缓存过期时间（秒）
   *
   * 返回查询结果的缓存过期时间。
   * 返回 0 表示不缓存。
   *
   * @param query - 查询对象
   * @returns 缓存过期时间（秒）
   */
  getCacheExpiration(query: TQuery): number;
}
