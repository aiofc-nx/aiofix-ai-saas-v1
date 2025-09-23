/**
 * 查询端口导出
 *
 * @description 导出查询侧专用的输出端口接口
 * @since 1.0.0
 */

// 查询侧端口接口
export type {
  IReadRepositoryPort,
  IQueryCriteria,
  IQueryOptions,
  IPaginationOptions,
  IPaginatedResult,
  IAggregationConfig,
  IAggregationResult,
  ICachePort,
  IPermissionValidationPort,
} from './query-ports.interface';
