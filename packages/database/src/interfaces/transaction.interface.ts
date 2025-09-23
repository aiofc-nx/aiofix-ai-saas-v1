/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 数据库事务接口定义
 *
 * @description 数据库事务的抽象接口，提供ACID特性保证
 * 支持嵌套事务、保存点、自动回滚等企业级事务功能
 *
 * ## 业务规则
 *
 * ### 事务ACID规则
 * - **原子性(Atomicity)**：事务内的操作要么全部成功，要么全部失败
 * - **一致性(Consistency)**：事务执行前后数据库状态保持一致
 * - **隔离性(Isolation)**：并发事务之间相互隔离，不会相互影响
 * - **持久性(Durability)**：事务提交后的更改永久保存
 *
 * ### 事务生命周期规则
 * - 事务创建后必须明确提交或回滚
 * - 长时间未操作的事务会自动超时回滚
 * - 事务失败时必须自动回滚所有操作
 * - 嵌套事务支持保存点机制
 *
 * ### 多租户事务规则
 * - 事务继承创建时的租户上下文
 * - 事务内的所有操作自动应用租户隔离
 * - 跨租户事务操作被严格禁止
 * - 租户上下文在事务生命周期内保持不变
 *
 * ### 性能和安全规则
 * - 事务内的SQL语句必须使用参数化查询
 * - 支持批量操作以提高事务性能
 * - 事务锁定时间应尽可能短
 * - 提供保存点机制支持部分回滚
 *
 * @example
 * ```typescript
 * // 基本事务操作
 * const transaction = await connection.beginTransaction();
 * try {
 *   // 创建订单
 *   await transaction.execute(
 *     'INSERT INTO orders (user_id, total) VALUES (?, ?)',
 *     [userId, orderTotal]
 *   );
 *
 *   // 更新库存
 *   await transaction.execute(
 *     'UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?',
 *     [quantity, productId]
 *   );
 *
 *   await transaction.commit();
 * } catch (error) {
 *   await transaction.rollback();
 *   throw error;
 * }
 *
 * // 使用保存点的复杂事务
 * const transaction = await connection.beginTransaction();
 * try {
 *   await transaction.execute('INSERT INTO users ...', [userData]);
 *
 *   await transaction.savepoint('before_profile');
 *   try {
 *     await transaction.execute('INSERT INTO profiles ...', [profileData]);
 *   } catch (profileError) {
 *     await transaction.rollbackToSavepoint('before_profile');
 *     // 继续其他操作
 *   }
 *
 *   await transaction.commit();
 * } catch (error) {
 *   await transaction.rollback();
 *   throw error;
 * }
 * ```
 *
 * @since 1.0.0
 */

import type { TenantContext } from './tenant-context.interface';
import type { IExecuteResult } from './execute-result.interface';

/**
 * 数据库事务接口
 *
 * @description 提供ACID特性的数据库事务抽象
 * 支持复杂的事务操作和保存点机制
 */
export interface ITransaction {
  /** 事务唯一标识符 - 用于跟踪和管理事务 */
  readonly transactionId: string;

  /** 事务活跃状态 - 指示事务是否仍然可用 */
  readonly isActive: boolean;

  /** 租户上下文 - 事务绑定的租户信息，确保数据隔离 */
  readonly tenantContext?: TenantContext;

  /**
   * 在事务中执行查询
   *
   * @description 在当前事务上下文中执行SELECT查询
   * 查询结果受事务隔离级别影响，可能看到未提交的数据
   *
   * @param sql - SQL查询语句
   * @param params - 查询参数数组
   * @returns 查询结果数组
   *
   * @throws {DatabaseQueryError} 查询执行失败时抛出
   * @throws {DatabaseTransactionError} 事务已失效时抛出
   */
  query<T>(sql: string, params?: any[]): Promise<T[]>;

  /**
   * 在事务中执行命令
   *
   * @description 在当前事务上下文中执行INSERT、UPDATE、DELETE命令
   * 命令的更改在事务提交前对其他连接不可见
   *
   * @param sql - SQL命令语句
   * @param params - 命令参数数组
   * @returns 执行结果信息
   *
   * @throws {DatabaseQueryError} 命令执行失败时抛出
   * @throws {DatabaseTransactionError} 事务已失效时抛出
   */
  execute(sql: string, params?: any[]): Promise<IExecuteResult>;

  /**
   * 提交事务
   *
   * @description 提交事务中的所有更改，使其永久生效
   * 提交后事务变为非活跃状态，不能再执行操作
   *
   * @throws {DatabaseTransactionError} 提交失败时抛出
   *
   * @example
   * ```typescript
   * try {
   *   await transaction.commit();
   *   console.log('事务提交成功');
   * } catch (error) {
   *   console.error('事务提交失败:', error);
   *   // 事务会自动回滚
   * }
   * ```
   */
  commit(): Promise<void>;

  /**
   * 回滚事务
   *
   * @description 撤销事务中的所有更改，恢复到事务开始前的状态
   * 回滚后事务变为非活跃状态，不能再执行操作
   *
   * @throws {DatabaseTransactionError} 回滚失败时抛出
   *
   * @example
   * ```typescript
   * try {
   *   await transaction.rollback();
   *   console.log('事务回滚成功');
   * } catch (error) {
   *   console.error('事务回滚失败:', error);
   * }
   * ```
   */
  rollback(): Promise<void>;

  /**
   * 设置事务保存点
   *
   * @description 在事务中创建一个保存点，可以回滚到此点
   * 支持嵌套保存点，实现部分回滚功能
   *
   * @param name - 保存点名称，必须在事务中唯一
   *
   * @throws {DatabaseTransactionError} 保存点创建失败时抛出
   *
   * @example
   * ```typescript
   * await transaction.savepoint('before_critical_operation');
   * try {
   *   await transaction.execute('CRITICAL OPERATION ...');
   * } catch (error) {
   *   await transaction.rollbackToSavepoint('before_critical_operation');
   * }
   * ```
   */
  savepoint(name: string): Promise<void>;

  /**
   * 回滚到指定保存点
   *
   * @description 撤销保存点之后的所有更改，保留保存点之前的操作
   * 实现部分回滚，不影响整个事务
   *
   * @param name - 保存点名称
   *
   * @throws {DatabaseTransactionError} 回滚到保存点失败时抛出
   *
   * @example
   * ```typescript
   * await transaction.rollbackToSavepoint('checkpoint1');
   * // 继续执行其他操作
   * await transaction.execute('INSERT INTO logs ...', [logData]);
   * ```
   */
  rollbackToSavepoint(name: string): Promise<void>;
}
