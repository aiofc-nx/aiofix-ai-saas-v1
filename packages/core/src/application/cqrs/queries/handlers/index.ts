/**
 * 查询处理器导出
 *
 * @description 导出查询处理器相关的接口和基类
 * @since 1.0.0
 */

// 查询处理器接口
export type {
  IQueryHandler,
  IQueryHandlerFactory,
  IQueryHandlerRegistry,
  IQueryExecutionContext,
  IQueryExecutionResult,
  IQueryValidator,
  IQueryValidationResult,
} from './query-handler.interface';

// 基础查询处理器
export { BaseQueryHandler } from './base-query-handler';
