/**
 * 基础映射器导出
 *
 * @description 导出映射器基础设施的所有核心组件
 * @since 1.0.0
 */

// 映射器接口
export type {
  IMapper,
  IDomainMapper,
  IAggregateMapper,
  IValueObjectMapper,
  IDtoMapper,
} from './mapper.interface';

// 基础映射器类
export {
  BaseDomainMapper,
  MappingError,
  type IMappingValidationResult,
} from './base-domain-mapper';

export {
  BaseAggregateMapper,
  type IAggregateRootMappingResult,
  type IEventMappingResult,
} from './base-aggregate-mapper';

export { BaseValueObjectMapper } from './base-value-object-mapper';

export { BaseDtoMapper, type IDtoMappingOptions } from './base-dto-mapper';
