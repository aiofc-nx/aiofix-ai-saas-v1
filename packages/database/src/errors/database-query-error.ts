/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 数据库查询错误类定义
 *
 * @description 数据库查询和命令执行相关的专用错误类
 * 包括SQL语法错误、权限不足、数据违规等场景
 *
 * ## 业务规则
 *
 * ### 查询错误分类
 * - **语法错误**: SQL语法不正确、关键字拼写错误等
 * - **对象不存在**: 表名、字段名、函数名不存在
 * - **权限错误**: 对表或字段没有访问权限
 * - **数据类型错误**: 数据类型不匹配、转换失败等
 *
 * ### 约束违反错误
 * - **主键约束**: 插入重复的主键值
 * - **外键约束**: 违反外键引用完整性
 * - **唯一约束**: 违反唯一性约束
 * - **检查约束**: 违反自定义检查约束
 * - **非空约束**: 必填字段为空
 *
 * ### 性能相关错误
 * - **查询超时**: 查询执行时间过长
 * - **结果集过大**: 返回结果超过内存限制
 * - **锁等待**: 等待行锁或表锁超时
 * - **资源耗尽**: 临时空间或内存不足
 *
 * ### 安全相关错误
 * - **SQL注入检测**: 检测到潜在的SQL注入
 * - **权限提升**: 尝试执行超出权限的操作
 * - **数据泄露**: 尝试访问敏感数据
 * - **审计失败**: 审计日志记录失败
 *
 * @example
 * ```typescript
 * // SQL语法错误
 * throw new DatabaseQueryError(
 *   'SQL语法错误：表名不存在',
 *   {
 *     sql: 'SELECT * FROM non_existent_table',
 *     params: [],
 *     tenantId: 'tenant-123',
 *     errorCode: 'TABLE_NOT_FOUND'
 *   },
 *   new Error('Table "non_existent_table" doesn\'t exist')
 * );
 *
 * // 约束违反错误
 * throw new DatabaseQueryError(
 *   '唯一约束违反：邮箱地址已存在',
 *   {
 *     sql: 'INSERT INTO users (email) VALUES (?)',
 *     params: ['existing@example.com'],
 *     constraintName: 'users_email_unique',
 *     violatedValue: 'existing@example.com'
 *   },
 *   new Error('duplicate key value violates unique constraint')
 * );
 *
 * // 错误处理示例
 * try {
 *   await connection.query('SELECT * FROM users');
 * } catch (error) {
 *   if (error instanceof DatabaseQueryError) {
 *     console.error('查询失败:', error.message);
 *     console.error('SQL语句:', error.context.sql);
 *     console.error('参数:', error.context.params);
 *
 *     // 根据错误类型进行处理
 *     if (error.context.errorCode === 'TABLE_NOT_FOUND') {
 *       await createMissingTable();
 *     } else if (error.context.constraintName) {
 *       await handleConstraintViolation(error);
 *     }
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { DatabaseError } from './database-error';

/**
 * 数据库查询错误类
 *
 * @description 数据库查询和命令执行相关的专用错误类
 * 继承自DatabaseError，提供查询特定的错误处理
 *
 * ## 常见错误场景
 *
 * ### SQL语法和对象错误
 * - SQL语法不正确
 * - 表名或字段名不存在
 * - 函数或存储过程不存在
 * - 数据类型不匹配
 *
 * ### 数据完整性错误
 * - 主键重复插入
 * - 外键引用不存在的记录
 * - 唯一约束违反
 * - 检查约束失败
 * - 非空字段为空
 *
 * ### 权限和安全错误
 * - 表或字段访问权限不足
 * - 执行权限不足
 * - 行级安全策略阻止
 * - 租户隔离验证失败
 *
 * ### 性能和资源错误
 * - 查询执行超时
 * - 结果集过大
 * - 内存不足
 * - 临时空间耗尽
 *
 * @example
 * ```typescript
 * // 处理不同类型的查询错误
 * try {
 *   await connection.execute(sql, params);
 * } catch (error) {
 *   if (error instanceof DatabaseQueryError) {
 *     const context = error.context;
 *
 *     if (context.errorCode === 'SYNTAX_ERROR') {
 *       console.error('SQL语法错误，请检查SQL语句');
 *     } else if (context.constraintName) {
 *       console.error(`约束违反: ${context.constraintName}`);
 *     } else if (context.timeout) {
 *       console.error('查询超时，考虑优化查询或增加索引');
 *     }
 *   }
 * }
 * ```
 */
export class DatabaseQueryError extends DatabaseError {
  /**
   * 创建数据库查询错误实例
   *
   * @description 构造查询错误对象，自动设置操作类型为'query'
   *
   * @param message - 错误描述信息，应该清晰描述查询失败的原因
   * @param context - 查询相关的上下文信息，包含SQL、参数、租户等
   * @param originalError - 原始错误对象，通常来自数据库驱动
   *
   * @example
   * ```typescript
   * const queryError = new DatabaseQueryError(
   *   '查询参数类型不匹配',
   *   {
   *     sql: 'SELECT * FROM users WHERE age = ?',
   *     params: ['not_a_number'],
   *     expectedType: 'integer',
   *     actualType: 'string',
   *     parameterIndex: 0
   *   },
   *   new Error('invalid input syntax for type integer')
   * );
   * ```
   */
  constructor(message: string, context: any, originalError?: Error) {
    super(message, 'query', context, originalError);
    this.name = 'DatabaseQueryError';
  }
}
