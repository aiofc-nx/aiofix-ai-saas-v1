/**
 * 映射器集成组件导出
 *
 * @description 导出映射器集成服务和Repository集成
 * @since 1.0.0
 */

export {
  MapperIntegrationService,
  type IMapperIntegrationConfig,
  type IMapperIntegrationStats,
} from './mapper-integration.service';

export {
  MappedRepository,
  MappedAggregateRepository,
  type IMappedRepository,
} from './repository-mapper-integration';
