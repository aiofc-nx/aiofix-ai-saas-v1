/**
 * 映射器装饰器导出
 *
 * @description 导出映射器装饰器和元数据工具
 * @since 1.0.0
 */

export {
  MapperType,
  DomainMapper,
  AggregateMapper,
  ValueObjectMapper,
  DtoMapper,
  getMapperMetadata,
  isMapper,
  isMapperOfType,
} from './mapper.decorator';

export type {
  IMapperMetadata,
  IDomainMapperOptions,
  IValueObjectMapperOptions,
  IDtoMapperOptions,
} from './mapper.decorator';
