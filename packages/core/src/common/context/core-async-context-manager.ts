/**
 * CoreAsyncContextManager - 核心异步上下文管理器
 *
 * 提供了完整的异步上下文管理功能，包括上下文创建、存储、生命周期管理、
 * 多租户支持、请求追踪等企业级特性。
 *
 * ## 业务规则
 *
 * ### 上下文管理规则
 * - 支持创建、获取、设置、清除异步上下文
 * - 上下文具有唯一的标识符和生命周期
 * - 支持上下文的嵌套和继承
 *
 * ### 生命周期规则
 * - 上下文管理器具有启动和停止生命周期
 * - 支持自动清理过期的上下文
 * - 提供上下文统计信息
 *
 * ### 执行规则
 * - 支持在指定上下文中执行函数
 * - 支持同步和异步函数执行
 * - 支持函数包装以自动传递上下文
 *
 * ### 多租户规则
 * - 支持租户级别的上下文隔离
 * - 支持组织、部门级别的上下文管理
 * - 提供上下文级别检查
 *
 * @description 核心异步上下文管理器实现类
 * @example
 * ```typescript
 * const manager = new CoreAsyncContextManager();
 * await manager.start();
 *
 * // 创建上下文
 * const context = manager.createContext({
 *   tenantId: 'tenant-1',
 *   userId: 'user-123'
 * });
 *
 * // 在上下文中执行函数
 * const result = await manager.runInContext(context, async () => {
 *   const currentContext = manager.getCurrentContext();
 *   return currentContext?.getTenantId();
 * });
 *
 * await manager.stop();
 * ```
 *
 * @since 1.0.0
 */
import { Injectable, Inject } from '@nestjs/common';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import { AsyncLocalStorage } from 'async_hooks';
import { IAsyncContext, IAsyncContextManager, IContextData } from './async-context.interface';
import { CoreAsyncContext } from './core-async-context';

/**
 * 上下文统计信息接口
 */
export interface IContextStatistics {
	/**
	 * 总上下文数量
	 */
	totalContexts: number;

	/**
	 * 活跃上下文数量
	 */
	activeContexts: number;

	/**
	 * 过期上下文数量
	 */
	expiredContexts: number;

	/**
	 * 平均生命周期（毫秒）
	 */
	averageLifetime: number;

	/**
	 * 创建时间
	 */
	createdAt: Date;

	/**
	 * 最后更新时间
	 */
	lastUpdatedAt: Date;
}

/**
 * 核心异步上下文管理器
 */
@Injectable()
export class CoreAsyncContextManager implements IAsyncContextManager {
	private readonly asyncLocalStorage = new AsyncLocalStorage<IAsyncContext>();

	private readonly contexts = new Map<string, IAsyncContext>();
	private readonly statistics: IContextStatistics = {
		totalContexts: 0,
		activeContexts: 0,
		expiredContexts: 0,
		averageLifetime: 0,
		createdAt: new Date(),
		lastUpdatedAt: new Date()
	};
	private _isStarted = false;
	private _cleanupInterval?: ReturnType<typeof globalThis.setInterval>;

	constructor(@Inject('ILoggerService') private readonly logger: ILoggerService) {}

	/**
	 * 创建新的异步上下文
	 */
	public createContext(data?: Partial<IContextData>): IAsyncContext {
		const context = new CoreAsyncContext(data);
		this.contexts.set(context.getId(), context);
		this.updateStatistics();
		this.logger.debug(`Created context: ${context.getId()}`, LogContext.SYSTEM, { contextId: context.getId() });
		return context;
	}

	/**
	 * 获取当前异步上下文
	 */
	public getCurrentContext(): IAsyncContext | undefined {
		return this.asyncLocalStorage.getStore();
	}

	/**
	 * 设置当前异步上下文
	 */
	public setCurrentContext(context: IAsyncContext): void {
		// 使用 run 方法设置上下文
		this.asyncLocalStorage.run(context, () => {
			// 设置上下文，无需额外操作
		});
		this.logger.debug(`Set current context: ${context.getId()}`, LogContext.SYSTEM, { contextId: context.getId() });
	}

	/**
	 * 清除当前异步上下文
	 */
	public clearCurrentContext(): void {
		// 使用 exit 方法退出当前上下文
		this.asyncLocalStorage.exit(() => {
			// 退出上下文，无需额外操作
		});
		this.logger.debug('Cleared current context', LogContext.SYSTEM);
	}

	/**
	 * 在指定上下文中执行函数
	 */
	public async runInContext<T>(context: IAsyncContext, fn: () => T | Promise<T>): Promise<T> {
		return new Promise((resolve, reject) => {
			this.asyncLocalStorage.run(context, async () => {
				try {
					const result = await fn();
					resolve(result);
				} catch (error) {
					reject(error);
				}
			});
		});
	}

	/**
	 * 在指定上下文中执行函数（同步版本）
	 */
	public runInContextSync<T>(context: IAsyncContext, fn: () => T): T {
		// 使用 run 方法替代 runSyncAndReturn（Node.js 版本兼容性）
		let result: T | undefined;
		this.asyncLocalStorage.run(context, () => {
			result = fn();
		});
		if (result === undefined) {
			throw new Error('Synchronous context execution failed: no result returned');
		}
		return result;
	}

	/**
	 * 包装函数以在指定上下文中执行
	 */
	public wrapInContext<T extends (...args: unknown[]) => unknown>(context: IAsyncContext, fn: T): T {
		return ((...args: unknown[]) => {
			return this.runInContextSync(context, () => fn(...args));
		}) as T;
	}

	/**
	 * 包装异步函数以在指定上下文中执行
	 */
	public wrapInContextAsync<T extends (...args: unknown[]) => Promise<unknown>>(context: IAsyncContext, fn: T): T {
		return ((...args: unknown[]) => {
			return this.runInContext(context, () => fn(...args));
		}) as T;
	}

	/**
	 * 获取上下文统计信息
	 */
	public getStatistics(): IContextStatistics {
		this.updateStatistics();
		return { ...this.statistics };
	}

	/**
	 * 清理过期的上下文
	 */
	public cleanupExpiredContexts(): void {
		const expiredContexts: string[] = [];

		for (const [id, context] of this.contexts.entries()) {
			if (context.isExpired()) {
				expiredContexts.push(id);
			}
		}

		for (const id of expiredContexts) {
			this.contexts.delete(id);
			this.logger.debug(`Cleaned up expired context: ${id}`, LogContext.SYSTEM, { contextId: id });
		}

		if (expiredContexts.length > 0) {
			this.updateStatistics();
			this.logger.info(`Cleaned up ${expiredContexts.length} expired contexts`, LogContext.SYSTEM, {
				expiredCount: expiredContexts.length
			});
		}
	}

	/**
	 * 启动上下文管理器
	 */
	public async start(): Promise<void> {
		if (this._isStarted) {
			this.logger.warn('Context manager is already started', LogContext.SYSTEM);
			return;
		}

		this.logger.info('Starting async context manager...', LogContext.SYSTEM);

		// 启动自动清理任务
		this._cleanupInterval = globalThis.setInterval(() => {
			this.cleanupExpiredContexts();
		}, 60000); // 每分钟清理一次

		this._isStarted = true;
		this.logger.info('Async context manager started successfully', LogContext.SYSTEM);
	}

	/**
	 * 停止上下文管理器
	 */
	public async stop(): Promise<void> {
		if (!this._isStarted) {
			this.logger.warn('Context manager is not started', LogContext.SYSTEM);
			return;
		}

		this.logger.info('Stopping async context manager...', LogContext.SYSTEM);

		// 停止自动清理任务
		if (this._cleanupInterval) {
			globalThis.clearInterval(this._cleanupInterval);
			this._cleanupInterval = undefined;
		}

		// 清理所有上下文
		this.contexts.clear();
		this.clearCurrentContext();

		this._isStarted = false;
		this.updateStatistics();
		this.logger.info('Async context manager stopped successfully', LogContext.SYSTEM);
	}

	/**
	 * 检查是否已启动
	 */
	public isStarted(): boolean {
		return this._isStarted;
	}

	/**
	 * 获取指定 ID 的上下文
	 */
	public getContext(id: string): IAsyncContext | undefined {
		return this.contexts.get(id);
	}

	/**
	 * 删除指定 ID 的上下文
	 */
	public removeContext(id: string): boolean {
		const removed = this.contexts.delete(id);
		if (removed) {
			this.updateStatistics();
			this.logger.debug(`Removed context: ${id}`, LogContext.SYSTEM, {
				contextId: id
			});
		}
		return removed;
	}

	/**
	 * 获取所有上下文
	 */
	public getAllContexts(): IAsyncContext[] {
		return Array.from(this.contexts.values());
	}

	/**
	 * 获取活跃上下文
	 */
	public getActiveContexts(): IAsyncContext[] {
		return this.getAllContexts().filter((context) => !context.isExpired());
	}

	/**
	 * 获取过期上下文
	 */
	public getExpiredContexts(): IAsyncContext[] {
		return this.getAllContexts().filter((context) => context.isExpired());
	}

	/**
	 * 根据租户 ID 获取上下文
	 */
	public getContextsByTenant(tenantId: string): IAsyncContext[] {
		return this.getAllContexts().filter((context) => context.getTenantId() === tenantId);
	}

	/**
	 * 根据用户 ID 获取上下文
	 */
	public getContextsByUser(userId: string): IAsyncContext[] {
		return this.getAllContexts().filter((context) => context.getUserId() === userId);
	}

	/**
	 * 根据组织 ID 获取上下文
	 */
	public getContextsByOrganization(organizationId: string): IAsyncContext[] {
		return this.getAllContexts().filter((context) => context.getOrganizationId() === organizationId);
	}

	/**
	 * 根据部门 ID 获取上下文
	 */
	public getContextsByDepartment(departmentId: string): IAsyncContext[] {
		return this.getAllContexts().filter((context) => context.getDepartmentId() === departmentId);
	}

	/**
	 * 根据请求 ID 获取上下文
	 */
	public getContextByRequest(requestId: string): IAsyncContext | undefined {
		return this.getAllContexts().find((context) => context.getRequestId() === requestId);
	}

	/**
	 * 根据关联 ID 获取上下文
	 */
	public getContextsByCorrelation(correlationId: string): IAsyncContext[] {
		return this.getAllContexts().filter((context) => context.getCorrelationId() === correlationId);
	}

	/**
	 * 创建子上下文
	 */
	public createChildContext(parentContext: IAsyncContext, data?: Partial<IContextData>): IAsyncContext {
		const parentData = parentContext.getData();
		const childData = {
			...parentData,
			...data,
			// 子上下文继承父上下文的关联信息
			correlationId: parentData.correlationId || parentContext.getId(),
			causationId: parentContext.getId()
		};

		const childContext = this.createContext(childData);
		this.logger.debug(
			`Created child context: ${childContext.getId()} from parent: ${parentContext.getId()}`,
			LogContext.SYSTEM,
			{
				childContextId: childContext.getId(),
				parentContextId: parentContext.getId()
			}
		);
		return childContext;
	}

	/**
	 * 更新统计信息
	 */
	private updateStatistics(): void {
		const now = new Date();
		const allContexts = this.getAllContexts();
		const activeContexts = this.getActiveContexts();
		const expiredContexts = this.getExpiredContexts();

		// 计算平均生命周期
		let totalLifetime = 0;
		for (const context of allContexts) {
			const lifetime = now.getTime() - context.getCreatedAt().getTime();
			totalLifetime += lifetime;
		}

		this.statistics.totalContexts = allContexts.length;
		this.statistics.activeContexts = activeContexts.length;
		this.statistics.expiredContexts = expiredContexts.length;
		this.statistics.averageLifetime = allContexts.length > 0 ? totalLifetime / allContexts.length : 0;
		this.statistics.lastUpdatedAt = now;
	}

	/**
	 * 获取详细统计信息
	 */
	public getDetailedStatistics(): {
		basic: IContextStatistics;
		byLevel: Record<string, number>;
		byTenant: Record<string, number>;
		bySource: Record<string, number>;
		lifetimeDistribution: {
			min: number;
			max: number;
			avg: number;
			median: number;
		};
	} {
		this.updateStatistics();
		const allContexts = this.getAllContexts();

		// 按级别统计
		const byLevel: Record<string, number> = {};
		for (const context of allContexts) {
			const level = context.getContextLevel();
			byLevel[level] = (byLevel[level] || 0) + 1;
		}

		// 按租户统计
		const byTenant: Record<string, number> = {};
		for (const context of allContexts) {
			const tenantId = context.getTenantId() || 'unknown';
			byTenant[tenantId] = (byTenant[tenantId] || 0) + 1;
		}

		// 按来源统计
		const bySource: Record<string, number> = {};
		for (const context of allContexts) {
			const source = context.getSource() || 'unknown';
			bySource[source] = (bySource[source] || 0) + 1;
		}

		// 生命周期分布
		const lifetimes = allContexts.map((context) => {
			const now = new Date();
			return now.getTime() - context.getCreatedAt().getTime();
		});

		const lifetimeDistribution = {
			min: lifetimes.length > 0 ? Math.min(...lifetimes) : 0,
			max: lifetimes.length > 0 ? Math.max(...lifetimes) : 0,
			avg: this.statistics.averageLifetime,
			median: lifetimes.length > 0 ? lifetimes.sort((a, b) => a - b)[Math.floor(lifetimes.length / 2)] : 0
		};

		return {
			basic: this.statistics,
			byLevel,
			byTenant,
			bySource,
			lifetimeDistribution
		};
	}
}
