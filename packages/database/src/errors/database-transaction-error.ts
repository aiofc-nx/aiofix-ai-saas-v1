/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 数据库事务错误类定义
 *
 * @description 数据库事务相关的专用错误类
 * 包括事务创建失败、提交失败、回滚失败、死锁等场景
 *
 * ## 业务规则
 *
 * ### 事务错误分类
 * - **事务创建失败**: 连接不可用、权限不足等
 * - **事务执行失败**: SQL错误、约束违反等
 * - **事务提交失败**: 死锁、超时、冲突等
 * - **事务回滚失败**: 系统错误、连接中断等
 *
 * ### 错误恢复策略
 * - 死锁检测和自动重试
 * - 事务超时的优雅处理
 * - 并发冲突的解决方案
 * - 事务状态的一致性保证
 *
 * ### 性能和监控
 * - 事务错误率统计
 * - 死锁频率监控
 * - 事务执行时间分析
 * - 资源竞争诊断
 *
 * @example
 * ```typescript
 * // 事务死锁错误
 * throw new DatabaseTransactionError(
 *   '事务提交失败，检测到死锁',
 *   {
 *     transactionId: 'txn-123',
 *     isolationLevel: 'SERIALIZABLE',
 *     startTime: new Date(),
 *     operations: ['INSERT INTO orders', 'UPDATE inventory'],
 *     deadlockVictim: true
 *   },
 *   new Error('Deadlock detected')
 * );
 *
 * // 事务超时错误
 * throw new DatabaseTransactionError(
 *   '事务执行超时',
 *   {
 *     transactionId: 'txn-456',
 *     timeout: 60000,
 *     executionTime: 65000,
 *     operationsCount: 15
 *   },
 *   new Error('Transaction timeout')
 * );
 * ```
 *
 * @since 1.0.0
 */

import { DatabaseError } from './database-error';

/**
 * 数据库事务错误类
 *
 * @description 数据库事务相关的专用错误类
 * 继承自DatabaseError，提供事务特定的错误处理
 *
 * ## 常见错误场景
 *
 * ### 并发控制错误
 * - **死锁(Deadlock)**: 多个事务相互等待资源
 * - **锁等待超时**: 等待锁资源超过指定时间
 * - **乐观锁冲突**: 并发修改导致版本冲突
 * - **悲观锁竞争**: 排他锁竞争激烈
 *
 * ### 事务状态错误
 * - **事务已提交**: 尝试在已提交事务上执行操作
 * - **事务已回滚**: 尝试在已回滚事务上执行操作
 * - **事务超时**: 事务执行时间超过限制
 * - **嵌套事务错误**: 嵌套事务处理失败
 *
 * ### 约束违反错误
 * - **主键冲突**: 插入重复的主键值
 * - **外键约束**: 违反外键引用完整性
 * - **唯一约束**: 违反唯一性约束
 * - **检查约束**: 违反自定义检查约束
 *
 * ### 资源相关错误
 * - **内存不足**: 事务占用内存过多
 * - **磁盘空间不足**: 事务日志空间不足
 * - **连接中断**: 事务执行过程中连接断开
 * - **服务器重启**: 数据库服务器意外重启
 *
 * @example
 * ```typescript
 * // 死锁处理示例
 * try {
 *   await executeTransaction();
 * } catch (error) {
 *   if (error instanceof DatabaseTransactionError) {
 *     if (error.context.deadlockVictim) {
 *       console.log('检测到死锁，准备重试...');
 *       await retryTransaction();
 *     } else if (error.context.timeout) {
 *       console.log('事务超时，检查性能问题...');
 *       await analyzePerformance();
 *     }
 *   }
 * }
 * ```
 */
export class DatabaseTransactionError extends DatabaseError {
  /**
   * 创建数据库事务错误实例
   *
   * @description 构造事务错误对象，自动设置操作类型为'transaction'
   *
   * @param message - 错误描述信息，应该清晰描述事务失败的原因
   * @param context - 事务相关的上下文信息，包含事务ID、状态、配置等
   * @param originalError - 原始错误对象，通常来自数据库驱动
   *
   * @example
   * ```typescript
   * const transactionError = new DatabaseTransactionError(
   *   '事务提交时发生约束违反',
   *   {
   *     transactionId: 'txn-789',
   *     isolationLevel: 'READ_COMMITTED',
   *     operationsCount: 5,
   *     constraintName: 'users_email_unique',
   *     violatedValue: 'duplicate@example.com'
   *   },
   *   new Error('duplicate key value violates unique constraint')
   * );
   * ```
   */
  constructor(message: string, context: any, originalError?: Error) {
    super(message, 'transaction', context, originalError);
    this.name = 'DatabaseTransactionError';
  }
}
