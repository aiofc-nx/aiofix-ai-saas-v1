/**
 * Core模块配置集成使用示例
 *
 * @description 演示Core模块与统一配置管理系统的集成使用
 * 展示配置驱动的Core服务行为
 *
 * 注意：此示例文件中的 any 类型用于简化复杂的类型系统，
 * 在实际生产代码中应使用具体的类型定义。
 *
 * @since 1.0.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createConfigManager } from '@aiofix/config';
import { createCoreConfigService } from '../infrastructure/config/core-config.service';
import { TenantContextManager } from '../common/multi-tenant/context/tenant-context-manager';
import { CorePerformanceMonitor } from '../infrastructure/monitoring/core-performance-monitor';
import { CoreCQRSBus } from '../application/cqrs/bus/core-cqrs-bus';
import { CoreErrorBus } from '../common/error-handling/core-error-bus';
import { EnterpriseFastifyAdapter } from '../infrastructure/web/fastify/adapters/enterprise-fastify.adapter';
import type { ILoggerService } from '@aiofix/logging';
import type { ICommandBus, IQueryBus, IEventBus, ICQRSMiddleware } from '../application/cqrs/bus/cqrs-bus.interface';
import type { BaseCommand } from '../application/cqrs/commands/base/base-command';
import type { BaseQuery, IQueryResult } from '../application/cqrs/queries/base/base-query';
import type { BaseDomainEvent } from '../domain/events/base/base-domain-event';
import type { ICommandHandler } from '../application/cqrs/commands/base/command-handler.interface';
import type { IQueryHandler } from '../application/cqrs/queries/base/query-handler.interface';
import type { IEventHandler } from '../application/cqrs/events/base/event-handler.interface';

/**
 * 用例注册表接口
 */
interface IUseCaseRegistry {
	register(useCaseName: string, useCaseFactory: unknown): void;
	get(useCaseName: string): unknown | undefined;
	has(useCaseName: string): boolean;
	getRegisteredUseCases(): string[];
	getByType(type: 'command' | 'query'): Map<string, unknown>;
}

/**
 * 投影器管理器接口
 */
interface IProjectorManager {
	register<T>(eventType: string, projector: (event: T) => Promise<void>): void;
	projectEvent<T>(event: T): Promise<void>;
	getProjectors(eventType: string): Array<(event: unknown) => Promise<void>>;
}

/**
 * 创建模拟日志服务
 */
function createMockLogger(): ILoggerService {
	return {
		debug: (message: string) => {
			console.warn(`[DEBUG] ${message}`);
		},
		info: (message: string) => {
			console.warn(`[INFO] ${message}`);
		},
		warn: (message: string) => {
			console.warn(`[WARN] ${message}`);
		},
		error: (message: string) => {
			console.error(`[ERROR] ${message}`);
		},
		fatal: (message: string) => {
			console.error(`[FATAL] ${message}`);
		},
		trace: (message: string) => {
			console.warn(`[TRACE] ${message}`);
		},
		performance: (message: string) => {
			console.warn(`[PERF] ${message}`);
		},
		business: (message: string) => {
			console.warn(`[BIZ] ${message}`);
		},
		security: (message: string) => {
			console.warn(`[SEC] ${message}`);
		},
		setLevel: (_level: string) => {
			// 模拟设置日志级别
		},
		getLevel: () => 'info',
		updateConfig: (_config: unknown) => {
			// 模拟更新配置
		},
		getConfig: () =>
			({
				level: 'info',
				format: 'json',
				colorize: false,
				timestamp: true,
				prettyPrint: false,
				serialize: false,
				redact: [],
				base: {}
			} as any),
		flush: () => Promise.resolve(),
		close: () => Promise.resolve(),
		getStats: () => ({
			totalLogs: 0,
			logsByLevel: {} as Record<string, number>,
			logsByContext: {} as Record<string, number>,
			averageLogSize: 0
		}),
		resetStats: () => {
			// 模拟重置统计信息
		},
		child: (_context: string) => {
			return createMockLogger();
		}
	};
}

/**
 * 创建模拟命令总线
 */
function createMockCommandBus(): ICommandBus {
	return {
		execute: async <TCommand extends BaseCommand>(_command: TCommand): Promise<void> => {
			// 模拟执行命令
		},
		registerHandler: <TCommand extends BaseCommand>(_commandType: string, _handler: ICommandHandler<TCommand>) => {
			// 模拟注册命令处理器
		},
		unregisterHandler: (_commandType: string) => {
			// 模拟取消注册命令处理器
		},
		addMiddleware: (_middleware: ICQRSMiddleware) => {
			// 模拟添加中间件
		},
		removeMiddleware: (_middlewareName: string) => {
			// 模拟移除中间件
		},
		getRegisteredCommandTypes: (): string[] => {
			// 模拟获取注册的命令类型
			return [];
		},
		supports: (_commandType: string): boolean => {
			// 模拟检查是否支持命令类型
			return true;
		}
	};
}

/**
 * 创建模拟查询总线
 */
function createMockQueryBus(): IQueryBus {
	return {
		execute: async <TQuery extends BaseQuery, TResult extends IQueryResult>(_query: TQuery): Promise<TResult> => {
			// 模拟执行查询
			return {} as TResult;
		},
		registerHandler: <TQuery extends BaseQuery, TResult extends IQueryResult>(
			_queryType: string,
			_handler: IQueryHandler<TQuery, TResult>
		) => {
			// 模拟注册查询处理器
		},
		unregisterHandler: (_queryType: string) => {
			// 模拟取消注册查询处理器
		},
		addMiddleware: (_middleware: ICQRSMiddleware) => {
			// 模拟添加中间件
		},
		removeMiddleware: (_middlewareName: string) => {
			// 模拟移除中间件
		},
		getRegisteredQueryTypes: (): string[] => {
			// 模拟获取注册的查询类型
			return [];
		},
		supports: (_queryType: string): boolean => {
			// 模拟检查是否支持查询类型
			return true;
		}
	};
}

/**
 * 创建模拟事件总线
 */
function createMockEventBus(): IEventBus {
	return {
		publish: async <TEvent extends BaseDomainEvent>(_event: TEvent): Promise<void> => {
			// 模拟发布事件
		},
		publishAll: async <TEvent extends BaseDomainEvent>(_events: TEvent[]): Promise<void> => {
			// 模拟批量发布事件
		},
		registerHandler: <TEvent extends BaseDomainEvent>(_eventType: string, _handler: IEventHandler<TEvent>) => {
			// 模拟注册事件处理器
		},
		unregisterHandler: (_eventType: string) => {
			// 模拟取消注册事件处理器
		},
		subscribe: <TEvent extends BaseDomainEvent>(
			_eventType: string,
			_handler: (event: TEvent) => Promise<void>
		): string => {
			// 模拟订阅事件
			return 'mock-subscription-id';
		},
		unsubscribe: (_subscriptionId: string) => {
			// 模拟取消订阅事件
		},
		addMiddleware: (_middleware: ICQRSMiddleware) => {
			// 模拟添加中间件
		},
		removeMiddleware: (_middlewareName: string) => {
			// 模拟移除中间件
		},
		getRegisteredEventTypes: (): string[] => {
			// 模拟获取注册的事件类型
			return [];
		},
		supports: (_eventType: string): boolean => {
			// 模拟检查是否支持事件类型
			return true;
		}
	};
}

/**
 * 创建模拟用例注册表
 */
function createMockUseCaseRegistry(): IUseCaseRegistry {
	return {
		register: (_useCaseName: string, _useCaseFactory: unknown) => {
			// 模拟注册用例
		},
		get: (_useCaseName: string): unknown | undefined => {
			// 模拟获取用例
			return undefined;
		},
		has: (_useCaseName: string): boolean => {
			// 模拟检查用例是否存在
			return false;
		},
		getRegisteredUseCases: (): string[] => {
			// 模拟获取注册的用例类型
			return [];
		},
		getByType: (_type: 'command' | 'query'): Map<string, unknown> => {
			// 模拟按类型获取用例
			return new Map();
		}
	};
}

/**
 * 创建模拟投影器管理器
 */
function createMockProjectorManager(): IProjectorManager {
	return {
		register: <T>(_eventType: string, _projector: (event: T) => Promise<void>) => {
			// 模拟注册投影器
		},
		projectEvent: async <T>(_event: T): Promise<void> => {
			// 模拟投影事件
		},
		getProjectors: (_eventType: string) => {
			// 模拟获取投影器
			return [];
		}
	};
}

/**
 * Core模块配置集成演示
 */
export class CoreConfigIntegrationExample {
	/**
	 * 演示Core模块配置集成的完整流程
	 */
	static async demonstrateConfigIntegration(): Promise<void> {
		const logger = createMockLogger();
		logger.info('🚀 开始Core模块配置集成演示');

		try {
			// 第一步：创建统一配置管理器
			logger.info('📋 第一步：创建统一配置管理器');
			const configManager = await createConfigManager();
			const coreConfigService = await createCoreConfigService(configManager);

			// 第二步：集成TenantContextManager
			logger.info('🏢 第二步：集成TenantContextManager');
			TenantContextManager.setConfigService(coreConfigService);

			// 检查多租户配置
			const multiTenantConfig = await TenantContextManager.getMultiTenantConfig();
			logger.info(`多租户配置: ${JSON.stringify(multiTenantConfig)}`);

			// 检查多租户是否启用
			const multiTenantEnabled = await TenantContextManager.isMultiTenantEnabled();
			logger.info(`多租户启用状态: ${multiTenantEnabled}`);

			// 第三步：集成CorePerformanceMonitor
			logger.info('📊 第三步：集成CorePerformanceMonitor');
			const performanceMonitor = new CorePerformanceMonitor(logger, coreConfigService);
			await performanceMonitor.start();

			const monitorConfig = performanceMonitor.getConfiguration();
			logger.info(
				`性能监控配置: ${JSON.stringify({
					enabled: monitorConfig.enabled,
					interval: monitorConfig.monitoringInterval,
					realTime: monitorConfig.enableRealTimeMonitoring
				})}`
			);

			// 第四步：集成CoreCQRSBus
			logger.info('🔄 第四步：集成CoreCQRSBus');
			const commandBus = createMockCommandBus();
			const queryBus = createMockQueryBus();
			const eventBus = createMockEventBus();
			const useCaseRegistry = createMockUseCaseRegistry();
			const projectorManager = createMockProjectorManager();

			const cqrsBus = new CoreCQRSBus(
				commandBus,
				queryBus,
				eventBus,
				useCaseRegistry as any,
				projectorManager as any,
				coreConfigService
			);

			await cqrsBus.initialize();
			logger.info(`CQRS总线初始化状态: ${cqrsBus.isInitialized}`);

			// 第五步：集成CoreErrorBus
			logger.info('❌ 第五步：集成CoreErrorBus');
			const errorBus = new CoreErrorBus(logger, coreConfigService);
			const errorHandlingEnabled = await errorBus.isErrorHandlingEnabled();
			logger.info(`错误处理启用状态: ${errorHandlingEnabled}`);

			// 第六步：集成EnterpriseFastifyAdapter
			logger.info('🌐 第六步：集成EnterpriseFastifyAdapter');
			const fastifyAdapter = new EnterpriseFastifyAdapter(
				{
					logger: true,
					enterprise: {
						enableHealthCheck: true,
						enablePerformanceMonitoring: true,
						enableMultiTenant: true
					}
				},
				coreConfigService
			);

			await fastifyAdapter.initializeEnterpriseFeatures();
			const webEnabled = await fastifyAdapter.isWebEnabled();
			logger.info(`Web功能启用状态: ${webEnabled}`);

			// 第七步：演示配置驱动的行为
			logger.info('🎛️ 第七步：演示配置驱动的行为');

			// 在租户上下文中进行验证
			await TenantContextManager.run('demo-tenant-123', async () => {
				const validation = await TenantContextManager.validateContext();
				logger.info(
					`租户上下文验证结果: ${JSON.stringify({
						valid: validation.valid,
						errors: validation.errors,
						config: validation.config
					})}`
				);
			});

			// 获取健康状态
			const healthStatus = await fastifyAdapter.getEnterpriseHealthStatus();
			logger.info(`企业级健康状态: ${JSON.stringify(healthStatus)}`);

			// 第八步：演示配置热更新响应
			logger.info('🔄 第八步：演示配置热更新响应');

			// 监听配置变化
			coreConfigService.onConfigChange((newConfig) => {
				logger.info(
					`🔥 配置已更新: ${JSON.stringify({
						multiTenant: newConfig.multiTenant.enabled,
						monitoring: newConfig.monitoring.enabled,
						cqrs: newConfig.cqrs.enabled
					})}`
				);
			});

			logger.info('✅ Core模块配置集成演示完成！');

			// 清理资源
			await performanceMonitor.stop();
			await cqrsBus.shutdown();
			await errorBus.stop();
		} catch (error) {
			logger.error(`❌ Core模块配置集成演示失败: ${(error as Error).message}`);
			throw error;
		}
	}

	/**
	 * 演示配置驱动的多租户行为
	 */
	static async demonstrateConfigDrivenMultiTenant(): Promise<void> {
		const logger = createMockLogger();
		logger.info('🏢 配置驱动的多租户行为演示');

		try {
			// 创建配置管理器
			const configManager = await createConfigManager();
			const coreConfigService = await createCoreConfigService(configManager);

			// 设置配置服务
			TenantContextManager.setConfigService(coreConfigService);

			// 演示不同的租户上下文
			const tenants = ['tenant-a', 'tenant-b', 'tenant-c'];

			for (const tenantId of tenants) {
				await TenantContextManager.run(tenantId, async () => {
					logger.info(`处理租户: ${tenantId}`);

					// 获取当前租户上下文
					const currentTenant = TenantContextManager.getCurrentTenant();
					logger.info(`当前租户上下文: ${JSON.stringify(currentTenant)}`);

					// 验证租户上下文
					const validation = await TenantContextManager.validateContext();
					logger.info(
						`验证结果: ${JSON.stringify({
							valid: validation.valid,
							strictMode: validation.config?.strictMode,
							validationEnabled: validation.config?.validationEnabled
						})}`
					);

					// 检查租户是否在上下文中
					const inContext = TenantContextManager.hasTenantContext();
					logger.info(`是否在租户上下文中: ${inContext}`);
				});
			}

			logger.info('✅ 配置驱动的多租户行为演示完成！');
		} catch (error) {
			logger.error(`❌ 多租户行为演示失败: ${(error as Error).message}`);
			throw error;
		}
	}

	/**
	 * 演示配置驱动的性能监控
	 */
	static async demonstrateConfigDrivenMonitoring(): Promise<void> {
		const logger = createMockLogger();
		logger.info('📊 配置驱动的性能监控演示');

		try {
			// 创建配置管理器
			const configManager = await createConfigManager();
			const coreConfigService = await createCoreConfigService(configManager);

			// 创建性能监控器
			const monitor = new CorePerformanceMonitor(logger, coreConfigService);
			await monitor.start();

			// 记录一些性能指标
			const operations = [
				{ name: 'database_query', duration: 120, success: true },
				{ name: 'cache_get', duration: 15, success: true },
				{ name: 'api_call', duration: 250, success: false },
				{ name: 'validation', duration: 45, success: true }
			];

			for (const op of operations) {
				logger.info(`记录性能指标: ${op.name} (${op.duration}ms) - ${op.success ? '成功' : '失败'}`);
			}

			// 获取配置信息
			const config = monitor.getConfiguration();
			logger.info(
				`性能监控配置: ${JSON.stringify({
					enabled: config.enabled,
					interval: config.monitoringInterval,
					realTime: config.enableRealTimeMonitoring
				})}`
			);

			// 停止监控
			await monitor.stop();

			logger.info('✅ 配置驱动的性能监控演示完成！');
		} catch (error) {
			logger.error(`❌ 性能监控演示失败: ${(error as Error).message}`);
			throw error;
		}
	}

	/**
	 * 演示配置驱动的错误处理
	 */
	static async demonstrateConfigDrivenErrorHandling(): Promise<void> {
		const logger = createMockLogger();
		logger.info('❌ 配置驱动的错误处理演示');

		try {
			// 创建配置管理器
			const configManager = await createConfigManager();
			const coreConfigService = await createCoreConfigService(configManager);

			// 创建错误总线
			const errorBus = new CoreErrorBus(logger, coreConfigService);

			// 检查错误处理是否启用
			const enabled = await errorBus.isErrorHandlingEnabled();
			logger.info(`错误处理启用状态: ${enabled}`);

			if (enabled) {
				await errorBus.start();

				// 模拟一些错误
				const errors = [new Error('数据库连接失败'), new Error('缓存服务不可用'), new Error('第三方API调用超时')];

				for (const error of errors) {
					logger.info(`处理错误: ${error.message}`);
				}

				// 获取错误统计
				const stats = errorBus.getStatistics();
				logger.info(
					`错误统计: ${JSON.stringify({
						totalErrors: stats.totalErrors,
						processed: stats.processing.totalProcessed,
						successful: stats.processing.successful,
						failed: stats.processing.failed
					})}`
				);

				await errorBus.stop();
			}

			logger.info('✅ 配置驱动的错误处理演示完成！');
		} catch (error) {
			logger.error(`❌ 错误处理演示失败: ${(error as Error).message}`);
			throw error;
		}
	}
}

/**
 * 运行所有演示
 */
export async function runCoreConfigIntegrationDemo(): Promise<void> {
	const logger = createMockLogger();
	logger.info('🎊 Core模块配置集成完整演示开始');

	try {
		// 主要集成演示
		await CoreConfigIntegrationExample.demonstrateConfigIntegration();

		// 多租户行为演示
		await CoreConfigIntegrationExample.demonstrateConfigDrivenMultiTenant();

		// 性能监控演示
		await CoreConfigIntegrationExample.demonstrateConfigDrivenMonitoring();

		// 错误处理演示
		await CoreConfigIntegrationExample.demonstrateConfigDrivenErrorHandling();

		logger.info('🎉 Core模块配置集成完整演示成功完成！');
	} catch (error) {
		logger.error(`💥 Core模块配置集成演示失败: ${(error as Error).message}`);
		throw error;
	}
}

// 如果直接运行此文件，则执行演示
if (require.main === module) {
	runCoreConfigIntegrationDemo()
		.then(() => {
			console.warn('演示完成，退出程序');
			process.exit(0);
		})
		.catch((error) => {
			console.error('演示失败:', error);
			process.exit(1);
		});
}
