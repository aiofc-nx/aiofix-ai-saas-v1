/**
 * CoreFastify中间件基类
 *
 * @description Fastify中间件的基础实现，提供智能中间件管理
 *
 * ## 业务规则
 *
 * ### 中间件执行规则
 * - 中间件按优先级顺序执行，优先级数字越小越先执行
 * - 中间件支持路径和HTTP方法过滤
 * - 中间件异常不应影响其他中间件的执行
 * - 中间件执行时间超过阈值时记录警告日志
 *
 * ### 性能监控规则
 * - 记录中间件执行次数和执行时间
 * - 统计成功和失败的请求数量
 * - 计算平均响应时间和峰值响应时间
 * - 支持性能阈值告警和降级策略
 *
 * ### 路径过滤规则
 * - 支持精确路径匹配和通配符匹配
 * - 支持路径排除模式（以!开头）
 * - 路径匹配区分大小写
 * - 支持正则表达式路径匹配
 *
 * ### 方法过滤规则
 * - 支持单个或多个HTTP方法过滤
 * - 方法名称不区分大小写
 * - 支持ALL方法表示所有HTTP方法
 * - 默认应用于所有HTTP方法
 *
 * @example
 * ```typescript
 * class AuthMiddleware extends CoreFastifyMiddleware {
 *   constructor() {
 *     super({
 *       name: 'auth',
 *       priority: 1,
 *       enabled: true,
 *       path: ['/api/*', '!/api/public/*'],
 *       method: ['GET', 'POST', 'PUT', 'DELETE']
 *     });
 *   }
 *
 *   protected async doHandle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
 *     const token = request.headers.authorization;
 *     if (!token) {
 *       return reply.status(401).send({ error: 'Unauthorized' });
 *     }
 *     // 验证token逻辑...
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import {
	FastifyInstance,
	FastifyRequest,
	FastifyReply,
	preHandlerHookHandler,
	ILoggerService
} from '../../../../common/types';
import { BaseError } from '../../../../common/errors/base-error';
import { TenantContextManager } from '../../../../common/multi-tenant/context/tenant-context-manager';
import {
	IFastifyMiddleware,
	IFastifyMiddlewareConfig,
	IFastifyMiddlewareHealth
} from '../interfaces/fastify.interface';

/**
 * 中间件错误
 */
export class FastifyMiddlewareError extends BaseError {
	public readonly middlewareName: string;

	constructor(message: string, middlewareName: string, cause?: Error) {
		super(message, 'FASTIFY_MIDDLEWARE_ERROR');
		this.middlewareName = middlewareName;
		if (cause) {
			Object.defineProperty(this, '_cause', { value: cause, writable: false });
		}
	}
}

/**
 * CoreFastify中间件基类
 */
export abstract class CoreFastifyMiddleware implements IFastifyMiddleware {
	private _isRegistered = false;
	private _registerTime: Date | null = null;
	private _unregisterTime: Date | null = null;
	private _lastHealthCheck: Date | null = null;

	// 性能统计
	private _requestCount = 0;
	private _errorCount = 0;
	private _successCount = 0;
	private _totalExecutionTime = 0;
	private _peakExecutionTime = 0;
	private _minExecutionTime = Number.MAX_VALUE;

	protected logger?: ILoggerService;

	constructor(protected readonly _config: IFastifyMiddlewareConfig, logger?: ILoggerService) {
		this.logger = logger;
		this.validateConfig();
	}

	/**
	 * 中间件名称
	 */
	get name(): string {
		return this._config.name;
	}

	/**
	 * 中间件优先级
	 */
	get priority(): number {
		return this._config.priority || 0;
	}

	/**
	 * 中间件是否启用
	 */
	get enabled(): boolean {
		return this._config.enabled !== false;
	}

	/**
	 * 中间件配置
	 */
	get config(): IFastifyMiddlewareConfig {
		return this._config;
	}

	/**
	 * 中间件是否已注册
	 */
	get isRegistered(): boolean {
		return this._isRegistered;
	}

	/**
	 * 注册中间件
	 */
	async register(fastify: FastifyInstance): Promise<void> {
		try {
			this.logger?.info('正在注册中间件', {
				name: this.name,
				priority: this.priority,
				path: this._config.path,
				method: this._config.method
			});

			// 检查中间件是否已注册
			if (this._isRegistered) {
				throw new FastifyMiddlewareError(`中间件 ${this.name} 已经注册`, this.name);
			}

			// 注册前处理
			await this.preRegister(fastify);

			// 创建中间件处理器
			const middlewareHandler = this.createMiddlewareHandler();

			// 注册到Fastify
			await this.registerToFastify(fastify, middlewareHandler);

			// 注册后处理
			await this.postRegister(fastify);

			// 更新状态
			this._isRegistered = true;
			this._registerTime = new Date();

			this.logger?.info('中间件注册成功', {
				name: this.name,
				registerTime: this._registerTime
			});
		} catch (error) {
			this.logger?.error('中间件注册失败', error as Error, { name: this.name });

			// 清理资源
			await this.cleanup();

			throw new FastifyMiddlewareError(
				`中间件 ${this.name} 注册失败: ${(error as Error).message}`,
				this.name,
				error as Error
			);
		}
	}

	/**
	 * 卸载中间件
	 */
	async unregister(fastify: FastifyInstance): Promise<void> {
		try {
			this.logger?.info('正在卸载中间件', { name: this.name });

			// 检查中间件是否已注册
			if (!this._isRegistered) {
				this.logger?.warn('中间件未注册，跳过卸载', { name: this.name });
				return;
			}

			// 卸载前处理
			await this.preUnregister(fastify);

			// 执行具体的卸载逻辑
			await this.doUnregister(fastify);

			// 卸载后处理
			await this.postUnregister();

			// 清理资源
			await this.cleanup();

			// 更新状态
			this._isRegistered = false;
			this._unregisterTime = new Date();

			this.logger?.info('中间件卸载成功', {
				name: this.name,
				unregisterTime: this._unregisterTime
			});
		} catch (error) {
			this.logger?.error('中间件卸载失败', error as Error, { name: this.name });
			throw new FastifyMiddlewareError(
				`中间件 ${this.name} 卸载失败: ${(error as Error).message}`,
				this.name,
				error as Error
			);
		}
	}

	/**
	 * 获取中间件健康状态
	 */
	async getHealthStatus(): Promise<IFastifyMiddlewareHealth> {
		try {
			const averageResponseTime = this._requestCount > 0 ? this._totalExecutionTime / this._requestCount : 0;

			const status = this.calculateHealthStatus(averageResponseTime);

			this._lastHealthCheck = new Date();

			return {
				name: this.name,
				status,
				isRegistered: this._isRegistered,
				registerTime: this._registerTime || undefined,
				lastCheckTime: this._lastHealthCheck,
				requestCount: this._requestCount,
				errorCount: this._errorCount,
				averageResponseTime
			};
		} catch (error) {
			this.logger?.error('获取中间件健康状态失败', error as Error, {
				name: this.name
			});

			return {
				name: this.name,
				status: 'unhealthy',
				isRegistered: this._isRegistered,
				registerTime: this._registerTime || undefined,
				lastCheckTime: new Date(),
				requestCount: this._requestCount,
				errorCount: this._errorCount,
				averageResponseTime: 0
			};
		}
	}

	/**
	 * 处理请求（由子类实现具体逻辑）
	 */
	async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
		const startTime = Date.now();
		this._requestCount++;

		try {
			// 执行具体的处理逻辑
			await this.doHandle(request, reply);

			this._successCount++;
		} catch (error) {
			this._errorCount++;
			this.logger?.error('中间件处理请求失败', error as Error, {
				name: this.name,
				method: request.method,
				url: request.url
			});
			throw error;
		} finally {
			// 记录执行时间
			const executionTime = Date.now() - startTime;
			this._totalExecutionTime += executionTime;

			if (executionTime > this._peakExecutionTime) {
				this._peakExecutionTime = executionTime;
			}

			if (executionTime < this._minExecutionTime) {
				this._minExecutionTime = executionTime;
			}

			// 性能阈值检查
			const threshold = this._config.performance?.threshold || 1000;
			if (executionTime > threshold) {
				this.logger?.warn('中间件执行时间超过阈值', {
					name: this.name,
					executionTime,
					threshold,
					method: request.method,
					url: request.url
				});
			}
		}
	}

	/**
	 * 抽象方法：执行具体的处理逻辑
	 */
	protected abstract doHandle(request: FastifyRequest, reply: FastifyReply): Promise<void>;

	/**
	 * 抽象方法：执行具体的卸载逻辑
	 */
	protected abstract doUnregister(fastify: FastifyInstance): Promise<void>;

	/**
	 * 注册前处理（可重写）
	 */
	protected async preRegister(_fastify: FastifyInstance): Promise<void> {
		// 默认实现为空，子类可重写
	}

	/**
	 * 注册后处理（可重写）
	 */
	protected async postRegister(_fastify: FastifyInstance): Promise<void> {
		// 默认实现为空，子类可重写
	}

	/**
	 * 卸载前处理（可重写）
	 */
	protected async preUnregister(_fastify: FastifyInstance): Promise<void> {
		// 默认实现为空，子类可重写
	}

	/**
	 * 卸载后处理（可重写）
	 */
	protected async postUnregister(): Promise<void> {
		// 默认实现为空，子类可重写
	}

	/**
	 * 验证配置
	 */
	private validateConfig(): void {
		if (!this._config.name) {
			throw new FastifyMiddlewareError('中间件名称不能为空', 'unknown');
		}

		if (this._config.name.includes(' ')) {
			throw new FastifyMiddlewareError('中间件名称不能包含空格', this._config.name);
		}

		if (this._config.priority !== undefined && this._config.priority < 0) {
			throw new FastifyMiddlewareError('中间件优先级不能为负数', this._config.name);
		}
	}

	/**
	 * 创建中间件处理器
	 */
	private createMiddlewareHandler(): preHandlerHookHandler {
		return async (request: FastifyRequest, reply: FastifyReply) => {
			// 检查路径过滤
			if (!this.shouldProcessRequest(request)) {
				return;
			}

			// 在多租户上下文中执行
			const tenantContext = TenantContextManager.getCurrentTenant();
			if (tenantContext) {
				await TenantContextManager.run(tenantContext, async () => {
					await this.handle(request, reply);
				});
			} else {
				await this.handle(request, reply);
			}
		};
	}

	/**
	 * 注册到Fastify
	 */
	private async registerToFastify(fastify: FastifyInstance, handler: preHandlerHookHandler): Promise<void> {
		// 注册为preHandler钩子
		fastify.addHook('preHandler', handler);
	}

	/**
	 * 检查是否应该处理请求
	 */
	private shouldProcessRequest(request: FastifyRequest): boolean {
		// 检查HTTP方法过滤
		if (!this.matchMethod(request.method)) {
			return false;
		}

		// 检查路径过滤
		if (!this.matchPath(request.url)) {
			return false;
		}

		return true;
	}

	/**
	 * 匹配HTTP方法
	 */
	private matchMethod(method: string): boolean {
		if (!this._config.method) {
			return true; // 没有方法过滤，匹配所有方法
		}

		const methods = Array.isArray(this._config.method) ? this._config.method : [this._config.method];

		return methods.some((m) => m.toUpperCase() === 'ALL' || m.toUpperCase() === method.toUpperCase());
	}

	/**
	 * 匹配路径
	 */
	private matchPath(url: string): boolean {
		if (!this._config.path) {
			return true; // 没有路径过滤，匹配所有路径
		}

		const paths = Array.isArray(this._config.path) ? this._config.path : [this._config.path];

		// 检查排除路径（以!开头）
		const excludePaths = paths.filter((p) => p.startsWith('!'));
		const includePaths = paths.filter((p) => !p.startsWith('!'));

		// 如果匹配排除路径，则不处理
		for (const excludePath of excludePaths) {
			const pattern = excludePath.substring(1); // 去掉!前缀
			if (this.matchSinglePath(url, pattern)) {
				return false;
			}
		}

		// 如果没有包含路径，则默认匹配
		if (includePaths.length === 0) {
			return true;
		}

		// 检查是否匹配包含路径
		return includePaths.some((path) => this.matchSinglePath(url, path));
	}

	/**
	 * 匹配单个路径
	 */
	private matchSinglePath(url: string, pattern: string): boolean {
		// 简单的通配符匹配
		if (pattern.includes('*')) {
			const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
			return regex.test(url);
		}

		// 精确匹配
		return url === pattern;
	}

	/**
	 * 计算健康状态
	 */
	private calculateHealthStatus(averageResponseTime: number): 'healthy' | 'unhealthy' | 'degraded' {
		if (!this._isRegistered) {
			return 'unhealthy';
		}

		// 检查错误率
		const errorRate = this._requestCount > 0 ? this._errorCount / this._requestCount : 0;
		if (errorRate > 0.1) {
			// 错误率超过10%
			return 'degraded';
		}

		// 检查平均响应时间
		const threshold = this._config.performance?.threshold || 1000;
		if (averageResponseTime > threshold) {
			return 'degraded';
		}

		return 'healthy';
	}

	/**
	 * 清理资源
	 */
	private async cleanup(): Promise<void> {
		try {
			// 重置统计数据
			this._requestCount = 0;
			this._errorCount = 0;
			this._successCount = 0;
			this._totalExecutionTime = 0;
			this._peakExecutionTime = 0;
			this._minExecutionTime = Number.MAX_VALUE;

			// 子类可以重写此方法进行额外的清理
		} catch (error) {
			this.logger?.error('清理中间件资源失败', error as Error, {
				name: this.name
			});
		}
	}
}
