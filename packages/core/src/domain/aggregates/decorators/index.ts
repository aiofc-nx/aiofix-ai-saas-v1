/**
 * 聚合根装饰器导出
 *
 * @description 导出聚合根相关的装饰器和元数据工具
 * @since 1.0.0
 */

// 聚合根装饰器
export {
  Aggregate,
  getAggregateMetadata,
  isAggregate,
  AggregateRegistry,
  AGGREGATE_METADATA_KEY,
} from './aggregate.decorator';

// 聚合根配置类型
export type { AggregateOptions } from './aggregate.decorator';
