/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 数据库基础错误类定义
 *
 * @description 所有数据库相关错误的基类
 * 提供统一的错误结构和上下文信息，便于错误处理和调试
 *
 * ## 设计原则
 *
 * ### 错误信息结构原则
 * - **message**: 错误描述信息，应该清晰易懂
 * - **operation**: 发生错误的操作类型，便于分类处理
 * - **context**: 错误发生时的上下文信息，包含调试所需的详细信息
 * - **originalError**: 原始错误对象，保持错误链的完整性
 *
 * ### 错误处理原则
 * - 错误信息应该详细且有助于调试
 * - 支持错误的分类处理和恢复
 * - 错误上下文包含足够的诊断信息
 * - 原始错误链的完整保留
 *
 * ### 继承层次原则
 * - 所有数据库错误都继承自DatabaseError
 * - 子类按操作类型分类：连接、事务、查询等
 * - 每个子类提供特定的错误处理逻辑
 * - 支持instanceof进行错误类型判断
 *
 * @example
 * ```typescript
 * // 创建基础数据库错误
 * throw new DatabaseError(
 *   '数据库操作失败',
 *   'query',
 *   {
 *     sql: 'SELECT * FROM users',
 *     params: [],
 *     tenantId: 'tenant-123'
 *   },
 *   originalError
 * );
 *
 * // 错误处理示例
 * try {
 *   await databaseOperation();
 * } catch (error) {
 *   if (error instanceof DatabaseError) {
 *     console.error(`数据库${error.operation}操作失败:`, error.message);
 *     console.error('错误上下文:', error.context);
 *
 *     if (error.originalError) {
 *       console.error('原始错误:', error.originalError);
 *     }
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

/**
 * 数据库基础错误类
 *
 * @description 所有数据库相关错误的基类
 * 提供统一的错误结构和上下文信息
 *
 * ## 错误信息结构
 * - **message**: 错误描述信息
 * - **operation**: 发生错误的操作类型
 * - **context**: 错误发生时的上下文信息
 * - **originalError**: 原始错误对象（如果有）
 *
 * ## 使用场景
 * - 作为所有数据库错误的基类
 * - 提供统一的错误处理接口
 * - 支持错误分类和上下文传递
 * - 便于错误监控和日志记录
 *
 * @example
 * ```typescript
 * throw new DatabaseError(
 *   '数据库操作失败',
 *   'query',
 *   { sql: 'SELECT * FROM users', params: [] },
 *   originalError
 * );
 * ```
 */
export class DatabaseError extends Error {
  /**
   * 创建数据库错误实例
   *
   * @description 构造数据库错误对象，包含完整的错误信息和上下文
   *
   * @param message - 错误描述信息，应该清晰描述错误原因
   * @param operation - 发生错误的操作类型（如：query、connection、transaction）
   * @param context - 错误上下文信息，包含调试所需的详细信息
   * @param originalError - 原始错误对象，保持错误链的完整性
   *
   * @example
   * ```typescript
   * const dbError = new DatabaseError(
   *   '查询执行超时',
   *   'query',
   *   {
   *     sql: 'SELECT * FROM large_table',
   *     params: [],
   *     timeout: 30000,
   *     tenantId: 'tenant-123'
   *   },
   *   new Error('Query timeout')
   * );
   * ```
   */
  constructor(
    message: string,
    public readonly operation: string,
    public readonly context: any,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'DatabaseError';

    // 确保错误堆栈信息的正确性
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError);
    }
  }
}
