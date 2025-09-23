/**
 * 数据库映射器模块导出
 *
 * @description 导出数据库映射器的完整功能
 * @since 1.0.0
 */

// 基础映射器
export * from './base';

// 映射器装饰器
export * from './decorators';

// 映射器集成
export * from './integration';

// 映射器模块
export {
  DatabaseMapperModule,
  InjectMapperRegistry,
  InjectMapperIntegrationService,
  MAPPER_REGISTRY_TOKEN,
  MAPPER_INTEGRATION_SERVICE_TOKEN,
} from './database-mapper.module';

export type {
  IDatabaseMapperModuleOptions,
  IDatabaseMapperModuleAsyncOptions,
} from './database-mapper.module';
