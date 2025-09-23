/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 数据库查询和操作选项接口定义
 *
 * @description 定义数据库查询、执行、事务等操作的选项接口
 * 提供灵活的配置能力，支持性能优化和行为定制
 *
 * ## 设计原则
 *
 * ### 灵活性原则
 * - 所有选项都是可选的，提供合理的默认值
 * - 支持渐进式配置，从简单到复杂
 * - 选项之间相互独立，可以任意组合
 *
 * ### 性能优化原则
 * - 支持查询结果的分页和排序
 * - 提供缓存控制选项
 * - 支持超时控制避免长时间阻塞
 *
 * ### 安全性原则
 * - 事务隔离级别的精确控制
 * - 只读事务的明确标识
 * - 操作标签用于审计和监控
 *
 * @since 1.0.0
 */

/**
 * 查询选项接口
 *
 * @description 数据库查询操作的配置选项
 * 支持分页、排序、缓存等功能
 *
 * ## 使用场景
 * - SELECT查询的结果控制
 * - 分页查询的参数配置
 * - 查询性能的优化设置
 * - 缓存策略的控制
 *
 * @example
 * ```typescript
 * // 基本查询选项
 * const options: IQueryOptions = {
 *   limit: 20,
 *   offset: 0,
 *   orderBy: { createdAt: 'DESC' }
 * };
 *
 * // 启用缓存的查询
 * const cachedOptions: IQueryOptions = {
 *   enableCache: true,
 *   cacheTTL: 300, // 5分钟缓存
 *   timeout: 10000 // 10秒超时
 * };
 * ```
 */
export interface IQueryOptions {
  /** 排序规则 - 指定查询结果的排序字段和方向 */
  orderBy?: Record<string, 'ASC' | 'DESC'>;

  /** 限制条数 - 查询返回的最大记录数，用于分页 */
  limit?: number;

  /** 偏移量 - 查询结果的起始位置，用于分页 */
  offset?: number;

  /** 是否启用缓存 - 控制查询结果是否缓存 */
  enableCache?: boolean;

  /** 缓存TTL - 缓存生存时间（秒），enableCache为true时有效 */
  cacheTTL?: number;

  /** 超时时间 - 查询操作的最大执行时间（毫秒） */
  timeout?: number;
}

/**
 * 执行选项接口
 *
 * @description 数据库命令执行操作的配置选项
 * 主要用于INSERT、UPDATE、DELETE等命令
 *
 * ## 使用场景
 * - 命令执行的超时控制
 * - 执行结果的详细程度控制
 * - 性能监控的配置
 *
 * @example
 * ```typescript
 * const options: IExecuteOptions = {
 *   timeout: 30000,      // 30秒超时
 *   returnDetails: true  // 返回详细执行信息
 * };
 * ```
 */
export interface IExecuteOptions {
  /** 超时时间 - 命令执行的最大时间（毫秒） */
  timeout?: number;

  /** 是否返回详细结果 - 控制返回信息的详细程度 */
  returnDetails?: boolean;
}

/**
 * 事务选项接口
 *
 * @description 数据库事务的配置选项
 * 控制事务的隔离级别、超时、只读等特性
 *
 * ## 隔离级别说明
 * - **READ_UNCOMMITTED**: 可读取未提交数据，最低隔离级别
 * - **READ_COMMITTED**: 只能读取已提交数据，防止脏读
 * - **REPEATABLE_READ**: 可重复读，防止脏读和不可重复读
 * - **SERIALIZABLE**: 串行化，最高隔离级别，防止所有并发问题
 *
 * @example
 * ```typescript
 * // 高隔离级别事务
 * const strictOptions: ITransactionOptions = {
 *   isolationLevel: 'SERIALIZABLE',
 *   timeout: 60000,  // 1分钟超时
 *   readOnly: false
 * };
 *
 * // 只读事务
 * const readOnlyOptions: ITransactionOptions = {
 *   isolationLevel: 'READ_COMMITTED',
 *   readOnly: true,
 *   timeout: 30000
 * };
 * ```
 */
export interface ITransactionOptions {
  /**
   * 事务隔离级别 - 控制并发事务之间的隔离程度
   *
   * @description 隔离级别从低到高：
   * - READ_UNCOMMITTED: 允许脏读、不可重复读、幻读
   * - READ_COMMITTED: 防止脏读，允许不可重复读、幻读
   * - REPEATABLE_READ: 防止脏读、不可重复读，允许幻读
   * - SERIALIZABLE: 防止所有并发问题，性能最低
   */
  isolationLevel?:
    | 'READ_UNCOMMITTED'
    | 'READ_COMMITTED'
    | 'REPEATABLE_READ'
    | 'SERIALIZABLE';

  /** 事务超时时间 - 事务的最大执行时间（毫秒） */
  timeout?: number;

  /** 连接名称 - 指定使用的数据库连接 */
  connectionName?: string;

  /** 是否只读 - 只读事务不能执行修改操作 */
  readOnly?: boolean;
}

/**
 * 查询条件接口
 *
 * @description 灵活的查询条件定义，支持复杂查询
 * 使用键值对形式定义查询条件
 *
 * ## 支持的条件类型
 * - 简单相等条件：`{ name: 'John' }`
 * - 范围条件：`{ age: { $gte: 18, $lte: 65 } }`
 * - 数组条件：`{ status: { $in: ['active', 'pending'] } }`
 * - 模糊查询：`{ name: { $like: '%John%' } }`
 *
 * @example
 * ```typescript
 * // 简单条件
 * const criteria: IQueryCriteria = {
 *   status: 'active',
 *   age: 25
 * };
 *
 * // 复杂条件
 * const complexCriteria: IQueryCriteria = {
 *   age: { $gte: 18, $lte: 65 },
 *   status: { $in: ['active', 'verified'] },
 *   name: { $like: '%admin%' },
 *   createdAt: { $gte: '2024-01-01' }
 * };
 * ```
 */
export interface IQueryCriteria {
  /** 字段条件 - 支持简单值或复杂查询操作符 */
  [field: string]: any;
}
