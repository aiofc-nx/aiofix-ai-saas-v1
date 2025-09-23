/**
 * 数据库命令执行结果接口定义
 *
 * @description 数据库INSERT、UPDATE、DELETE命令的执行结果
 * 提供详细的执行信息，用于业务逻辑判断和性能监控
 *
 * ## 业务规则
 *
 * ### 结果完整性规则
 * - 必须包含影响的行数信息
 * - INSERT操作必须返回新记录的ID（如果适用）
 * - 必须包含准确的执行时间用于性能监控
 * - 必须明确指示操作是否成功
 *
 * ### 性能监控规则
 * - 执行时间用于识别慢查询
 * - 影响行数用于验证操作预期结果
 * - 成功标志用于错误处理和重试逻辑
 *
 * @example
 * ```typescript
 * // INSERT操作结果
 * const insertResult = await connection.execute(
 *   'INSERT INTO users (name, email) VALUES (?, ?)',
 *   ['张三', 'zhangsan@example.com']
 * );
 * console.log(`插入成功，新用户ID: ${insertResult.insertId}`);
 * console.log(`执行时间: ${insertResult.executionTime}ms`);
 *
 * // UPDATE操作结果
 * const updateResult = await connection.execute(
 *   'UPDATE users SET status = ? WHERE age > ?',
 *   ['inactive', 65]
 * );
 * if (updateResult.success) {
 *   console.log(`更新了 ${updateResult.affectedRows} 个用户`);
 * }
 * ```
 *
 * @since 1.0.0
 */

/**
 * 数据库命令执行结果接口
 *
 * @description 封装数据库命令执行的详细结果信息
 * 用于业务逻辑判断、性能监控和错误处理
 */
export interface IExecuteResult {
  /** 影响的行数 - INSERT、UPDATE、DELETE操作影响的记录数量 */
  affectedRows: number;

  /** 插入的ID - INSERT操作生成的新记录主键ID（如果适用） */
  insertId?: string | number;

  /** 执行时间 - 命令执行耗时（毫秒），用于性能监控 */
  executionTime: number;

  /** 是否成功 - 命令是否成功执行，用于错误处理 */
  success: boolean;
}
