/**
 * 映射器集成服务
 *
 * 负责将Core模块的映射器基础设施与Database模块的功能进行集成。
 * 提供映射器的自动发现、注册和生命周期管理。
 *
 * @description 映射器集成服务提供映射器与数据库功能的无缝集成
 *
 * ## 业务规则
 *
 * ### 映射器发现规则
 * - 自动扫描和发现数据库映射器
 * - 验证映射器的配置和元数据
 * - 支持映射器的依赖注入
 * - 提供映射器的生命周期管理
 *
 * ### 集成规则
 * - 映射器与Repository系统集成
 * - 映射器与缓存系统集成
 * - 映射器与事务系统集成
 * - 映射器与性能监控系统集成
 *
 * ### 配置规则
 * - 支持环境特定的映射器配置
 * - 支持映射器的热重载
 * - 支持映射器的版本管理
 * - 提供映射器的健康检查
 *
 * @example
 * ```typescript
 * // 在模块中使用
 * @Module({
 *   providers: [
 *     MapperIntegrationService,
 *     UserDatabaseMapper,
 *     ProductDatabaseMapper,
 *   ],
 * })
 * export class DatabaseModule {
 *   constructor(
 *     private readonly mapperIntegration: MapperIntegrationService,
 *   ) {}
 *
 *   async onModuleInit() {
 *     await this.mapperIntegration.initializeMappers();
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { MapperRegistry } from '@aiofix/core';
import {
	getDatabaseMapperMetadata,
	isDatabaseMapper,
	TenantIsolationStrategy,
	type IDatabaseMapperOptions
} from '../decorators/database-mapper.decorator';

/**
 * 映射器集成配置接口
 */
export interface IMapperIntegrationConfig {
	/**
	 * 是否启用自动扫描
	 */
	autoScan?: boolean;

	/**
	 * 扫描的包路径
	 */
	scanPaths?: string[];

	/**
	 * 是否启用映射器缓存
	 */
	enableCache?: boolean;

	/**
	 * 映射器实例池大小
	 */
	poolSize?: number;

	/**
	 * 是否启用性能监控
	 */
	enablePerformanceMonitoring?: boolean;
}

/**
 * 映射器集成统计信息接口
 */
export interface IMapperIntegrationStats {
	/**
	 * 注册的映射器数量
	 */
	registeredMappers: number;

	/**
	 * 数据库映射器数量
	 */
	databaseMappers: number;

	/**
	 * 聚合根映射器数量
	 */
	aggregateMappers: number;

	/**
	 * 映射操作总数
	 */
	totalMappingOperations: number;

	/**
	 * 映射错误总数
	 */
	totalMappingErrors: number;

	/**
	 * 平均映射时间（毫秒）
	 */
	averageMappingTime: number;
}

/**
 * 映射器集成服务
 */
@Injectable()
export class MapperIntegrationService implements OnModuleInit {
	private readonly mapperRegistry: MapperRegistry;
	private readonly config: IMapperIntegrationConfig;
	private readonly stats: IMapperIntegrationStats;
	private isInitialized = false;

	constructor(private readonly moduleRef: ModuleRef) {
		this.mapperRegistry = new MapperRegistry();
		this.config = {
			autoScan: true,
			enableCache: true,
			poolSize: 10,
			enablePerformanceMonitoring: true
		};
		this.stats = {
			registeredMappers: 0,
			databaseMappers: 0,
			aggregateMappers: 0,
			totalMappingOperations: 0,
			totalMappingErrors: 0,
			averageMappingTime: 0
		};
	}

	/**
	 * 模块初始化时自动扫描和注册映射器
	 */
	async onModuleInit(): Promise<void> {
		if (this.config.autoScan) {
			await this.initializeMappers();
		}
	}

	/**
	 * 初始化映射器
	 */
	async initializeMappers(): Promise<void> {
		try {
			this.log('info', '开始初始化映射器...');

			// 扫描和注册映射器
			await this.scanAndRegisterMappers();

			// 验证映射器配置
			this.validateMapperConfigurations();

			// 设置性能监控
			if (this.config.enablePerformanceMonitoring) {
				this.setupPerformanceMonitoring();
			}

			this.isInitialized = true;
			this.log('info', '映射器初始化完成', {
				registeredMappers: this.stats.registeredMappers,
				databaseMappers: this.stats.databaseMappers
			});
		} catch (error) {
			this.log('error', '映射器初始化失败', {
				error: error instanceof Error ? error.message : String(error)
			});
			throw error;
		}
	}

	/**
	 * 获取映射器注册表
	 *
	 * @returns 映射器注册表实例
	 */
	public getMapperRegistry(): MapperRegistry {
		this.ensureInitialized();
		return this.mapperRegistry;
	}

	/**
	 * 获取映射器统计信息
	 *
	 * @returns 统计信息
	 */
	public getStats(): IMapperIntegrationStats {
		return { ...this.stats };
	}

	/**
	 * 手动注册映射器
	 *
	 * @param sourceType - 源类型名称
	 * @param targetType - 目标类型名称
	 * @param mapper - 映射器实例
	 */
	public registerMapper(sourceType: string, targetType: string, mapper: unknown): void {
		try {
			this.mapperRegistry.registerMapper(sourceType, targetType, mapper);
			this.updateStats(mapper);

			this.log('info', '映射器注册成功', {
				sourceType,
				targetType,
				mapperName: mapper?.constructor?.name
			});
		} catch (error) {
			this.log('error', '映射器注册失败', {
				sourceType,
				targetType,
				error: error instanceof Error ? error.message : String(error)
			});
			throw error;
		}
	}

	/**
	 * 获取映射器
	 *
	 * @template TDomain - 领域对象类型
	 * @template TPersistence - 持久化对象类型
	 * @param sourceType - 源类型名称
	 * @param targetType - 目标类型名称
	 * @returns 映射器实例
	 */
	public getMapper<TDomain, TPersistence>(sourceType: string, targetType: string): any {
		this.ensureInitialized();
		return this.mapperRegistry.getMapper<TDomain, TPersistence>(sourceType, targetType);
	}

	/**
	 * 检查映射器是否存在
	 *
	 * @param sourceType - 源类型名称
	 * @param targetType - 目标类型名称
	 * @returns 是否存在
	 */
	public hasMapper(sourceType: string, targetType: string): boolean {
		return this.mapperRegistry.hasMapper(sourceType, targetType);
	}

	/**
	 * 扫描和注册映射器
	 *
	 * @private
	 */
	private async scanAndRegisterMappers(): Promise<void> {
		// 从NestJS容器中获取所有映射器实例
		const providers = (this.moduleRef as any)['container']?.getModules()?.values() || [];

		for (const provider of providers) {
			const instance = provider.instance;

			if (instance && isDatabaseMapper(instance.constructor)) {
				const metadata = getDatabaseMapperMetadata(instance.constructor);
				if (metadata) {
					this.mapperRegistry.registerMapper(metadata.domainType, metadata.persistenceType, instance);
					this.updateStats(instance);
				}
			}
		}
	}

	/**
	 * 验证映射器配置
	 *
	 * @private
	 */
	private validateMapperConfigurations(): void {
		const allMappers = this.mapperRegistry.getAllMappers();

		for (const registration of allMappers) {
			const metadata = getDatabaseMapperMetadata(registration.mapper);
			if (metadata) {
				this.validateMapperConfiguration(metadata);
			}
		}
	}

	/**
	 * 验证单个映射器配置
	 *
	 * @param metadata - 映射器元数据
	 * @private
	 */
	private validateMapperConfiguration(metadata: IDatabaseMapperOptions): void {
		// 验证表模式配置
		if (metadata.tableSchema) {
			if (!metadata.tableSchema.tableName) {
				throw new Error(`映射器缺少表名配置: ${metadata.domainType}`);
			}
		}

		// 验证租户隔离配置
		if (metadata.tenantIsolation?.enabled) {
			if (metadata.tenantIsolation.strategy === TenantIsolationStrategy.ROW_LEVEL) {
				if (!metadata.tenantIsolation.tenantColumn && !metadata.tableSchema?.tenantColumn) {
					throw new Error(`行级租户隔离需要配置租户列: ${metadata.domainType}`);
				}
			}
		}
	}

	/**
	 * 设置性能监控
	 *
	 * @private
	 */
	private setupPerformanceMonitoring(): void {
		// TODO: 集成性能监控系统
		this.log('info', '性能监控已启用');
	}

	/**
	 * 更新统计信息
	 *
	 * @param mapper - 映射器实例
	 * @private
	 */
	private updateStats(mapper: unknown): void {
		this.stats.registeredMappers++;

		if (isDatabaseMapper(mapper?.constructor)) {
			this.stats.databaseMappers++;

			const metadata = getDatabaseMapperMetadata(mapper?.constructor);
			if (metadata?.category === 'database-aggregate') {
				this.stats.aggregateMappers++;
			}
		}
	}

	/**
	 * 确保服务已初始化
	 *
	 * @private
	 */
	private ensureInitialized(): void {
		if (!this.isInitialized) {
			throw new Error('映射器集成服务尚未初始化，请先调用 initializeMappers()');
		}
	}

	/**
	 * 记录日志
	 *
	 * @param level - 日志级别
	 * @param message - 日志消息
	 * @param context - 上下文信息
	 * @private
	 */
	private log(_level: string, _message: string, _context?: Record<string, unknown>): void {
		// TODO: 替换为实际的日志系统
		// console.log(`[${_level.toUpperCase()}] [MapperIntegrationService] ${_message}`, _context);
	}
}
