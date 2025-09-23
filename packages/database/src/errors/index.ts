/**
 * 数据库错误类统一导出
 *
 * @description 统一导出所有数据库相关的错误类
 * 提供清晰的错误类层次结构和便捷的导入方式
 *
 * ## 错误类层次结构
 *
 * ```text
 * DatabaseError (基类)
 * ├── DatabaseConnectionError (连接错误)
 * ├── DatabaseTransactionError (事务错误)
 * └── DatabaseQueryError (查询错误)
 * ```
 *
 * ## 使用指南
 *
 * ### 错误捕获和处理
 * ```typescript
 * import {
 *   DatabaseError,
 *   DatabaseConnectionError,
 *   DatabaseTransactionError,
 *   DatabaseQueryError
 * } from '@aiofix/database/errors';
 *
 * try {
 *   await databaseOperation();
 * } catch (error) {
 *   if (error instanceof DatabaseConnectionError) {
 *     // 处理连接错误
 *     await handleConnectionError(error);
 *   } else if (error instanceof DatabaseTransactionError) {
 *     // 处理事务错误
 *     await handleTransactionError(error);
 *   } else if (error instanceof DatabaseQueryError) {
 *     // 处理查询错误
 *     await handleQueryError(error);
 *   } else if (error instanceof DatabaseError) {
 *     // 处理其他数据库错误
 *     await handleGenericDatabaseError(error);
 *   }
 * }
 * ```
 *
 * ### 错误创建和抛出
 * ```typescript
 * // 根据具体场景选择合适的错误类型
 * if (connectionFailed) {
 *   throw new DatabaseConnectionError('连接失败', context, originalError);
 * } else if (transactionFailed) {
 *   throw new DatabaseTransactionError('事务失败', context, originalError);
 * } else if (queryFailed) {
 *   throw new DatabaseQueryError('查询失败', context, originalError);
 * }
 * ```
 *
 * @since 1.0.0
 */

// 基础错误类
export { DatabaseError } from './database-error';

// 专用错误类
export { DatabaseConnectionError } from './database-connection-error';
export { DatabaseTransactionError } from './database-transaction-error';
export { DatabaseQueryError } from './database-query-error';
