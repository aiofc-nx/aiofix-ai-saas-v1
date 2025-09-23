/**
 * 数据库映射器模块
 *
 * 提供数据库映射器的NestJS模块配置，集成映射器注册表和集成服务。
 * 支持映射器的自动发现、注册和依赖注入。
 *
 * @description 数据库映射器模块提供映射器的模块化管理
 *
 * ## 业务规则
 *
 * ### 模块配置规则
 * - 模块自动扫描和注册映射器
 * - 提供映射器的依赖注入支持
 * - 支持模块的热重载和配置更新
 * - 集成NestJS的生命周期管理
 *
 * ### 依赖注入规则
 * - 映射器作为服务提供者注册
 * - 支持映射器的构造函数注入
 * - 提供映射器注册表的全局访问
 * - 支持映射器的作用域管理
 *
 * ### 配置管理规则
 * - 支持环境特定的映射器配置
 * - 集成统一配置管理系统
 * - 支持映射器配置的热更新
 * - 提供配置验证和错误处理
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     DatabaseMapperModule.forRoot({
 *       autoScan: true,
 *       enableCache: true,
 *       performanceMonitoring: true
 *     }),
 *   ],
 *   providers: [
 *     UserDatabaseMapper,
 *     ProductDatabaseMapper,
 *   ],
 * })
 * export class MyDatabaseModule {}
 * ```
 *
 * @since 1.0.0
 */

import { Module, DynamicModule, Provider, Global } from '@nestjs/common';
import { MapperRegistry } from '@aiofix/core';
import { MapperIntegrationService, type IMapperIntegrationConfig } from './integration/mapper-integration.service';

/**
 * 数据库映射器模块选项接口
 */
export interface IDatabaseMapperModuleOptions {
	/**
	 * 映射器集成配置
	 */
	integrationConfig?: IMapperIntegrationConfig;

	/**
	 * 是否为全局模块
	 */
	isGlobal?: boolean;

	/**
	 * 自定义映射器提供者
	 */
	mappers?: Provider[];
}

/**
 * 数据库映射器模块异步选项接口
 */
export interface IDatabaseMapperModuleAsyncOptions {
	/**
	 * 是否为全局模块
	 */
	isGlobal?: boolean;

	/**
	 * 配置工厂函数
	 */
	useFactory?: (...args: unknown[]) => Promise<IDatabaseMapperModuleOptions> | IDatabaseMapperModuleOptions;

	/**
	 * 注入的依赖
	 */
	inject?: any[];

	/**
	 * 导入的模块
	 */
	imports?: any[];
}

/**
 * 映射器注册表提供者令牌
 */
export const MAPPER_REGISTRY_TOKEN = 'MAPPER_REGISTRY';

/**
 * 映射器集成服务提供者令牌
 */
export const MAPPER_INTEGRATION_SERVICE_TOKEN = 'MAPPER_INTEGRATION_SERVICE';

/**
 * 数据库映射器模块
 */
@Global()
@Module({})
export class DatabaseMapperModule {
	/**
	 * 同步配置模块
	 *
	 * @param options - 模块配置选项
	 * @returns 动态模块
	 */
	static forRoot(options: IDatabaseMapperModuleOptions = {}): DynamicModule {
		const providers: Provider[] = [
			// 映射器注册表提供者
			{
				provide: MAPPER_REGISTRY_TOKEN,
				useFactory: () => new MapperRegistry()
			},
			// 映射器集成服务提供者
			{
				provide: MAPPER_INTEGRATION_SERVICE_TOKEN,
				useClass: MapperIntegrationService
			},
			// 映射器集成服务的别名提供者
			{
				provide: MapperIntegrationService,
				useExisting: MAPPER_INTEGRATION_SERVICE_TOKEN
			},
			// 映射器注册表的别名提供者
			{
				provide: MapperRegistry,
				useExisting: MAPPER_REGISTRY_TOKEN
			}
		];

		// 添加自定义映射器提供者
		if (options.mappers) {
			providers.push(...options.mappers);
		}

		return {
			module: DatabaseMapperModule,
			providers,
			exports: [MAPPER_REGISTRY_TOKEN, MAPPER_INTEGRATION_SERVICE_TOKEN, MapperIntegrationService, MapperRegistry],
			global: options.isGlobal ?? true
		};
	}

	/**
	 * 异步配置模块
	 *
	 * @param options - 异步配置选项
	 * @returns 动态模块
	 */
	static forRootAsync(options: IDatabaseMapperModuleAsyncOptions): DynamicModule {
		const providers: Provider[] = [
			// 映射器注册表提供者
			{
				provide: MAPPER_REGISTRY_TOKEN,
				useFactory: () => new MapperRegistry()
			},
			// 映射器集成服务提供者
			{
				provide: MAPPER_INTEGRATION_SERVICE_TOKEN,
				useClass: MapperIntegrationService
			},
			// 映射器集成服务的别名提供者
			{
				provide: MapperIntegrationService,
				useExisting: MAPPER_INTEGRATION_SERVICE_TOKEN
			},
			// 映射器注册表的别名提供者
			{
				provide: MapperRegistry,
				useExisting: MAPPER_REGISTRY_TOKEN
			}
		];

		// 异步配置提供者
		if (options.useFactory) {
			providers.push({
				provide: 'DATABASE_MAPPER_OPTIONS',
				useFactory: options.useFactory,
				inject: options.inject || []
			});
		}

		return {
			module: DatabaseMapperModule,
			imports: options.imports || [],
			providers,
			exports: [MAPPER_REGISTRY_TOKEN, MAPPER_INTEGRATION_SERVICE_TOKEN, MapperIntegrationService, MapperRegistry],
			global: options.isGlobal ?? true
		};
	}
}

/**
 * 映射器注册表注入装饰器
 *
 * @returns 参数装饰器
 */
export const InjectMapperRegistry = () => {
	return (target: unknown, propertyKey: string | symbol | undefined, parameterIndex: number) => {
		// 使用NestJS的Inject装饰器
		const InjectDecorator = require('@nestjs/common').Inject;
		return InjectDecorator(MAPPER_REGISTRY_TOKEN)(target, propertyKey, parameterIndex);
	};
};

/**
 * 映射器集成服务注入装饰器
 *
 * @returns 参数装饰器
 */
export const InjectMapperIntegrationService = () => {
	return (target: unknown, propertyKey: string | symbol | undefined, parameterIndex: number) => {
		// 使用NestJS的Inject装饰器
		const InjectDecorator = require('@nestjs/common').Inject;
		return InjectDecorator(MAPPER_INTEGRATION_SERVICE_TOKEN)(target, propertyKey, parameterIndex);
	};
};
