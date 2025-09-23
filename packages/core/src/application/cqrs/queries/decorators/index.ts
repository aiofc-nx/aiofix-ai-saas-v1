/**
 * 查询装饰器导出
 *
 * @description 导出查询相关的装饰器和元数据工具
 * @since 1.0.0
 */

// 装饰器配置接口
export type { IQueryHandlerOptions } from './query-handler.decorator';

// 装饰器函数
export { QueryHandler, Query } from './query-handler.decorator';

// 元数据工具
export {
  getQueryHandlerMetadata,
  isQueryHandler,
  getQueryMetadata,
  isQuery,
  QUERY_HANDLER_METADATA_KEY,
  QUERY_METADATA_KEY,
} from './query-handler.decorator';
