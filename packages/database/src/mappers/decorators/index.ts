/**
 * 数据库映射器装饰器导出
 *
 * @description 导出数据库映射器装饰器和配置
 * @since 1.0.0
 */

export {
	TenantIsolationStrategy,
	DatabaseMapper,
	getDatabaseMapperMetadata,
	isDatabaseMapper
} from './database-mapper.decorator';

export type {
	ITableSchemaConfig,
	ITenantIsolationConfig,
	ICacheConfig,
	IDatabaseMapperOptions
} from './database-mapper.decorator';
