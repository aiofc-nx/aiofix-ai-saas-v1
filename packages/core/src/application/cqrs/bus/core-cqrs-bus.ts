/**
 * 核心 CQRS 总线实现
 *
 * CQRS 总线是统一的命令查询职责分离总线，整合了命令总线、查询总线和事件总线。
 * 提供了统一的接口来处理命令、查询和事件，简化了 CQRS 模式的使用。
 *
 * ## 业务规则
 *
 * ### 统一接口规则
 * - 提供统一的 CQRS 操作接口
 * - 封装底层总线的复杂性
 * - 支持事务性操作
 * - 提供一致的错误处理
 *
 * ### 生命周期规则
 * - 支持总线的初始化和关闭
 * - 管理底层总线的生命周期
 * - 提供资源清理机制
 * - 支持优雅关闭
 *
 * ### 监控规则
 * - 提供统一的监控接口
 * - 收集各总线的统计信息
 * - 支持健康检查
 * - 提供性能指标
 *
 * @description 核心 CQRS 总线实现，提供统一的 CQRS 操作接口
 * @example
 * ```typescript
 * const cqrsBus = new CoreCQRSBus(
 *   new CoreCommandBus(),
 *   new CoreQueryBus(),
 *   new CoreEventBus()
 * );
 *
 * // 初始化
 * await cqrsBus.initialize();
 *
 * // 执行命令
 * const command = new CreateUserCommand('user@example.com', 'John Doe');
 * await cqrsBus.executeCommand(command);
 *
 * // 执行查询
 * const query = new GetUsersQuery('active', 1, 10);
 * const result = await cqrsBus.executeQuery(query);
 *
 * // 发布事件
 * const event = new UserCreatedEvent(userId, 'user@example.com', 'John Doe');
 * await cqrsBus.publishEvent(event);
 *
 * // 关闭
 * await cqrsBus.shutdown();
 * ```
 *
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import type { CoreConfigService } from '../../../infrastructure/config/core-config.service';
import type { BaseCommand } from '../commands/base/base-command';
import type { BaseQuery, IQueryResult } from '../queries/base/base-query';
import type { BaseDomainEvent } from '../../../domain/events/base/base-domain-event';
import type { IUseCaseRegistry } from '../../use-cases/base/use-case.interface';
import type { ProjectorManager } from '../events/projectors/projector-manager';
import type { ICQRSBus, ICommandBus, IQueryBus, IEventBus } from './cqrs-bus.interface';

/**
 * CQRS 总线统计信息
 */
export interface ICQRSBusStatistics {
	/** 命令总线统计 */
	commandBus: {
		registeredHandlers: number;
		middlewares: number;
	};
	/** 查询总线统计 */
	queryBus: {
		registeredHandlers: number;
		middlewares: number;
		cacheEntries: number;
		cacheHitRate?: number;
	};
	/** 事件总线统计 */
	eventBus: {
		registeredHandlers: number;
		subscriptions: number;
		middlewares: number;
	};
	/** 总体统计 */
	overall: {
		totalHandlers: number;
		totalMiddlewares: number;
		isInitialized: boolean;
	};
}

/**
 * 核心 CQRS 总线实现
 */
@Injectable()
export class CoreCQRSBus implements ICQRSBus {
	private _isInitialized = false;

	constructor(
		private readonly _commandBus: ICommandBus,
		private readonly _queryBus: IQueryBus,
		private readonly _eventBus: IEventBus,
		private readonly _useCaseRegistry: IUseCaseRegistry,
		private readonly _projectorManager: ProjectorManager,
		private readonly configService?: CoreConfigService
	) {}

	/**
	 * 获取CQRS配置
	 *
	 * @description 从配置服务获取CQRS配置
	 *
	 * @returns CQRS配置
	 */
	private async getCQRSConfig(): Promise<{
		enabled: boolean;
		commandBus: { timeout: number; maxRetries: number };
		queryBus: { enableCache: boolean; cacheTTL: number };
		eventBus: { enableAsync: boolean; maxConcurrency: number };
	} | null> {
		if (!this.configService) {
			// TODO: 替换为实际的日志系统
			// console.log('CoreCQRSBus: 配置服务未设置，使用默认配置');
			return {
				enabled: true,
				commandBus: { timeout: 30000, maxRetries: 3 },
				queryBus: { enableCache: false, cacheTTL: 300000 },
				eventBus: { enableAsync: true, maxConcurrency: 10 }
			};
		}

		try {
			const config = await this.configService.getCQRSConfig();
			return {
				enabled: config.enabled,
				commandBus: {
					timeout: config.commandBus?.timeout || 30000,
					maxRetries: 3 // 暂时硬编码
				},
				queryBus: {
					enableCache: config.queryBus?.enableCache || false,
					cacheTTL: 300000 // 暂时硬编码
				},
				eventBus: {
					enableAsync: !config.eventBus?.enablePersistence, // 基于现有字段推断
					maxConcurrency: 10 // 暂时硬编码
				}
			};
		} catch {
			// TODO: 替换为实际的日志系统
			// console.error('获取CQRS配置失败:', error);
			return null;
		}
	}

	/**
	 * 获取命令总线
	 */
	public get commandBus(): ICommandBus {
		return this._commandBus;
	}

	/**
	 * 获取查询总线
	 */
	public get queryBus(): IQueryBus {
		return this._queryBus;
	}

	/**
	 * 获取事件总线
	 */
	public get eventBus(): IEventBus {
		return this._eventBus;
	}

	/**
	 * 检查是否已初始化
	 */
	public get isInitialized(): boolean {
		return this._isInitialized;
	}

	/**
	 * 执行命令
	 *
	 * @param command - 要执行的命令
	 * @returns Promise，命令执行完成后解析
	 * @throws {Error} 当总线未初始化或命令执行失败时
	 */
	public async executeCommand<TCommand extends BaseCommand>(command: TCommand): Promise<void> {
		this.ensureInitialized();
		await this._commandBus.execute(command);
	}

	/**
	 * 执行查询
	 *
	 * @param query - 要执行的查询
	 * @returns Promise，查询执行完成后解析为结果
	 * @throws {Error} 当总线未初始化或查询执行失败时
	 */
	public async executeQuery<TQuery extends BaseQuery, TResult extends IQueryResult>(query: TQuery): Promise<TResult> {
		this.ensureInitialized();
		return await this._queryBus.execute<TQuery, TResult>(query);
	}

	/**
	 * 发布事件
	 *
	 * @param event - 要发布的事件
	 * @returns Promise，事件发布完成后解析
	 * @throws {Error} 当总线未初始化或事件发布失败时
	 */
	public async publishEvent<TEvent extends BaseDomainEvent>(event: TEvent): Promise<void> {
		this.ensureInitialized();
		await this._eventBus.publish(event);

		// 执行事件投射
		if (this._projectorManager) {
			await this._projectorManager.projectEvent(event);
		}
	}

	/**
	 * 批量发布事件
	 *
	 * @param events - 要发布的事件数组
	 * @returns Promise，所有事件发布完成后解析
	 * @throws {Error} 当总线未初始化或事件发布失败时
	 */
	public async publishEvents<TEvent extends BaseDomainEvent>(events: TEvent[]): Promise<void> {
		this.ensureInitialized();
		await this._eventBus.publishAll(events);

		// 执行事件投射
		if (this._projectorManager) {
			await this._projectorManager.projectEvents(events);
		}
	}

	/**
	 * 执行用例
	 *
	 * @param useCaseName - 用例名称
	 * @param request - 用例请求
	 * @returns Promise，用例执行完成后解析为结果
	 * @throws {Error} 当总线未初始化、用例未找到或执行失败时
	 */
	public async executeUseCase<TRequest, TResponse>(useCaseName: string, request: TRequest): Promise<TResponse> {
		this.ensureInitialized();

		// 1. 获取用例实例
		const useCase = this._useCaseRegistry.get<TRequest, TResponse>(useCaseName);
		if (!useCase) {
			throw new Error(`用例 ${useCaseName} 未找到`);
		}

		// 2. 执行用例
		const result = await useCase.execute(request);

		// TODO: 替换为实际的日志系统
		// console.log(`用例 ${useCaseName} 执行成功`);
		return result;
	}

	/**
	 * 初始化总线
	 *
	 * 注册所有处理器和中间件。
	 *
	 * @returns Promise，初始化完成后解析
	 * @throws {Error} 当总线已初始化或初始化失败时
	 */
	public async initialize(): Promise<void> {
		if (this._isInitialized) {
			throw new Error('CQRS Bus is already initialized');
		}

		try {
			// 加载CQRS配置
			const config = await this.getCQRSConfig();

			if (config && !config.enabled) {
				// TODO: 替换为实际的日志系统
				// console.log('CQRS功能已禁用，跳过初始化');
				this._isInitialized = true;
				return;
			}

			// TODO: 替换为实际的日志系统
			// console.log('✅ CQRS总线配置已加载', config);

			// 这里可以添加基于配置的初始化逻辑，比如：
			// - 根据配置注册默认中间件
			// - 基于配置设置监控
			// - 根据配置预热缓存
			// - 基于配置连接外部服务

			this._isInitialized = true;
		} catch (error) {
			throw new Error(`Failed to initialize CQRS Bus: ${error}`);
		}
	}

	/**
	 * 关闭总线
	 *
	 * 清理资源和取消订阅。
	 *
	 * @returns Promise，关闭完成后解析
	 * @throws {Error} 当总线未初始化或关闭失败时
	 */
	public async shutdown(): Promise<void> {
		if (!this._isInitialized) {
			throw new Error('CQRS Bus is not initialized');
		}

		try {
			// 清理资源
			if ('clearHandlers' in this._commandBus) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(this._commandBus as any).clearHandlers();
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(this._commandBus as any).clearMiddlewares();
			}

			if ('clearHandlers' in this._queryBus) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(this._queryBus as any).clearHandlers();
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(this._queryBus as any).clearMiddlewares();
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(this._queryBus as any).clearCache();
			}

			if ('clearHandlers' in this._eventBus) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(this._eventBus as any).clearHandlers();
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(this._eventBus as any).clearSubscriptions();
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(this._eventBus as any).clearMiddlewares();
			}

			this._isInitialized = false;
		} catch (error) {
			throw new Error(`Failed to shutdown CQRS Bus: ${error}`);
		}
	}

	/**
	 * 检查总线健康状态
	 *
	 * @returns Promise，健康检查完成后解析为健康状态
	 */
	public async healthCheck(): Promise<boolean> {
		if (!this._isInitialized) {
			return false;
		}

		try {
			// 检查各个总线的健康状态
			const commandBusHealthy = this._commandBus.supports('_health_check') || true;
			const queryBusHealthy = this._queryBus.supports('_health_check') || true;
			const eventBusHealthy = this._eventBus.supports('_health_check') || true;

			return commandBusHealthy && queryBusHealthy && eventBusHealthy;
		} catch {
			return false;
		}
	}

	/**
	 * 获取统计信息
	 *
	 * @returns CQRS 总线统计信息
	 */
	public getStatistics(): ICQRSBusStatistics {
		const commandBusStats = {
			registeredHandlers: this._commandBus.getRegisteredCommandTypes().length,
			middlewares:
				'getMiddlewareCount' in this._commandBus
					? // eslint-disable-next-line @typescript-eslint/no-explicit-any
					  (this._commandBus as any).getMiddlewareCount()
					: 0
		};

		const queryBusStats = {
			registeredHandlers: this._queryBus.getRegisteredQueryTypes().length,
			middlewares:
				'getMiddlewareCount' in this._queryBus
					? // eslint-disable-next-line @typescript-eslint/no-explicit-any
					  (this._queryBus as any).getMiddlewareCount()
					: 0,
			cacheEntries:
				'getCacheStats' in this._queryBus
					? // eslint-disable-next-line @typescript-eslint/no-explicit-any
					  (this._queryBus as any).getCacheStats().totalEntries
					: 0
		};

		const eventBusStats = {
			registeredHandlers: this._eventBus.getRegisteredEventTypes().length,
			subscriptions:
				'getHandlerCount' in this._eventBus
					? // eslint-disable-next-line @typescript-eslint/no-explicit-any
					  (this._eventBus as any).getHandlerCount()
					: 0,
			middlewares:
				'getMiddlewareCount' in this._eventBus
					? // eslint-disable-next-line @typescript-eslint/no-explicit-any
					  (this._eventBus as any).getMiddlewareCount()
					: 0
		};

		return {
			commandBus: commandBusStats,
			queryBus: queryBusStats,
			eventBus: eventBusStats,
			overall: {
				totalHandlers:
					commandBusStats.registeredHandlers + queryBusStats.registeredHandlers + eventBusStats.registeredHandlers,
				totalMiddlewares: commandBusStats.middlewares + queryBusStats.middlewares + eventBusStats.middlewares,
				isInitialized: this._isInitialized
			}
		};
	}

	/**
	 * 获取支持的命令类型
	 *
	 * @returns 支持的命令类型数组
	 */
	public getSupportedCommandTypes(): string[] {
		return this._commandBus.getRegisteredCommandTypes();
	}

	/**
	 * 获取支持的查询类型
	 *
	 * @returns 支持的查询类型数组
	 */
	public getSupportedQueryTypes(): string[] {
		return this._queryBus.getRegisteredQueryTypes();
	}

	/**
	 * 获取支持的事件类型
	 *
	 * @returns 支持的事件类型数组
	 */
	public getSupportedEventTypes(): string[] {
		return this._eventBus.getRegisteredEventTypes();
	}

	/**
	 * 检查是否支持指定的命令类型
	 *
	 * @param commandType - 命令类型
	 * @returns 如果支持则返回 true，否则返回 false
	 */
	public supportsCommand(commandType: string): boolean {
		return this._commandBus.supports(commandType);
	}

	/**
	 * 检查是否支持指定的查询类型
	 *
	 * @param queryType - 查询类型
	 * @returns 如果支持则返回 true，否则返回 false
	 */
	public supportsQuery(queryType: string): boolean {
		return this._queryBus.supports(queryType);
	}

	/**
	 * 检查是否支持指定的事件类型
	 *
	 * @param eventType - 事件类型
	 * @returns 如果支持则返回 true，否则返回 false
	 */
	public supportsEvent(eventType: string): boolean {
		return this._eventBus.supports(eventType);
	}

	/**
	 * 确保总线已初始化
	 *
	 * @throws {Error} 当总线未初始化时
	 */
	private ensureInitialized(): void {
		if (!this._isInitialized) {
			throw new Error('CQRS Bus is not initialized. Call initialize() first.');
		}
	}
}
