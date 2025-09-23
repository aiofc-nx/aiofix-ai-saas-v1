/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 数据库连接接口定义
 *
 * @description 统一数据库连接的抽象接口，支持多种数据库类型
 * 提供标准化的数据库操作方法，确保跨数据库的一致性
 *
 * ## 业务规则
 *
 * ### 连接管理规则
 * - 连接必须具有唯一的名称标识
 * - 连接状态必须实时反映实际连接状态
 * - 连接必须支持优雅关闭和资源清理
 * - 连接池中的连接必须可复用
 *
 * ### 多租户规则
 * - 连接可以绑定特定的租户上下文
 * - 租户上下文影响数据访问权限和隔离策略
 * - 跨租户操作必须通过明确的权限验证
 *
 * ### 事务规则
 * - 每个连接支持独立的事务管理
 * - 事务必须支持嵌套和保存点
 * - 事务失败时必须自动回滚
 * - 长时间事务必须有超时保护
 *
 * ### 性能规则
 * - 查询和命令执行必须支持参数化，防止SQL注入
 * - 支持批量操作以提高性能
 * - 连接复用以减少建立连接的开销
 * - 提供原始连接访问以支持高级操作
 *
 * @example
 * ```typescript
 * // 获取数据库连接
 * const connection = await databaseService.getConnection('primary');
 *
 * // 执行查询
 * const users = await connection.query<User>(
 *   'SELECT * FROM users WHERE status = ?',
 *   ['active']
 * );
 *
 * // 执行事务
 * const transaction = await connection.beginTransaction();
 * try {
 *   await transaction.execute('UPDATE users SET status = ?', ['inactive']);
 *   await transaction.commit();
 * } catch (error) {
 *   await transaction.rollback();
 *   throw error;
 * }
 *
 * // 关闭连接
 * await connection.close();
 * ```
 *
 * @since 1.0.0
 */

import type { TenantContext } from './tenant-context.interface';
import type { ITransaction } from './transaction.interface';
import type { IExecuteResult } from './execute-result.interface';

/**
 * 数据库连接接口
 *
 * @description 提供统一的数据库连接抽象，支持多种数据库后端
 *
 * @template T - 原始连接对象的类型（如Pool、MongoClient等）
 */
export interface IDatabaseConnection<T = any> {
  /** 连接名称 - 用于标识和管理连接实例 */
  readonly name: string;

  /** 连接类型 - 支持的数据库类型 */
  readonly type: 'postgresql' | 'mysql' | 'mongodb' | 'redis' | 'sqlite';

  /** 是否已连接 - 实时连接状态 */
  readonly isConnected: boolean;

  /** 租户上下文 - 多租户数据隔离的上下文信息 */
  readonly tenantContext?: TenantContext;

  /**
   * 执行查询操作
   *
   * @description 执行SELECT查询，返回结果集
   * 支持参数化查询，自动处理租户隔离
   *
   * @param sql - SQL查询语句，支持参数化占位符
   * @param params - 查询参数数组，防止SQL注入
   * @returns 查询结果数组
   *
   * @throws {DatabaseQueryError} 查询执行失败时抛出
   *
   * @example
   * ```typescript
   * const users = await connection.query<User>(
   *   'SELECT * FROM users WHERE age > ? AND status = ?',
   *   [18, 'active']
   * );
   * ```
   */
  query<R = T>(sql: string, params?: any[]): Promise<R[]>;

  /**
   * 执行命令操作
   *
   * @description 执行INSERT、UPDATE、DELETE等命令
   * 返回执行结果信息，包括影响行数等
   *
   * @param sql - SQL命令语句
   * @param params - 命令参数数组
   * @returns 执行结果信息
   *
   * @throws {DatabaseQueryError} 命令执行失败时抛出
   *
   * @example
   * ```typescript
   * const result = await connection.execute(
   *   'UPDATE users SET status = ? WHERE id = ?',
   *   ['inactive', userId]
   * );
   * console.log(`更新了 ${result.affectedRows} 行数据`);
   * ```
   */
  execute(sql: string, params?: any[]): Promise<IExecuteResult>;

  /**
   * 开始数据库事务
   *
   * @description 创建新的数据库事务，支持ACID特性
   * 事务内的操作要么全部成功，要么全部回滚
   *
   * @returns 事务实例
   *
   * @throws {DatabaseTransactionError} 事务创建失败时抛出
   *
   * @example
   * ```typescript
   * const transaction = await connection.beginTransaction();
   * try {
   *   await transaction.execute('INSERT INTO orders ...', [orderData]);
   *   await transaction.execute('UPDATE inventory ...', [inventoryData]);
   *   await transaction.commit();
   * } catch (error) {
   *   await transaction.rollback();
   *   throw error;
   * }
   * ```
   */
  beginTransaction(): Promise<ITransaction>;

  /**
   * 获取原始连接对象
   *
   * @description 获取底层数据库驱动的原始连接对象
   * 用于执行特定数据库的高级操作或优化
   *
   * @returns 原始连接对象（类型取决于数据库驱动）
   *
   * @example
   * ```typescript
   * // PostgreSQL原始连接
   * const pgConnection = connection.getRawConnection() as Pool;
   *
   * // MongoDB原始连接
   * const mongoDb = connection.getRawConnection() as Db;
   * ```
   */
  getRawConnection(): T;

  /**
   * 关闭数据库连接
   *
   * @description 优雅关闭数据库连接，释放相关资源
   * 确保所有待处理的操作完成后再关闭
   *
   * @throws {DatabaseConnectionError} 关闭连接失败时抛出
   *
   * @example
   * ```typescript
   * try {
   *   await connection.close();
   *   console.log('连接已安全关闭');
   * } catch (error) {
   *   console.error('关闭连接失败:', error);
   * }
   * ```
   */
  close(): Promise<void>;
}
