/**
 * 查询基础设施导出
 *
 * @description 导出查询相关的基础类和接口
 * @since 1.0.0
 */

// 基础查询类
export { BaseQuery } from './base-query';

// 基础查询结果类
export { BaseQueryResult } from './base-query-result';

// 查询接口
export type {
  IQuery,
  IQueryValidationResult,
  IQueryMetadata,
  IQueryFactory,
} from './query.interface';

// 查询处理器接口
export * from './query-handler.interface';
