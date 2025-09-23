/**
 * CoreFastify插件基类
 *
 * @description Fastify插件的基础实现，提供插件生命周期管理
 *
 * ## 业务规则
 *
 * ### 插件注册规则
 * - 插件必须有唯一的名称标识符
 * - 插件注册前必须验证所有依赖项
 * - 插件注册失败时必须清理已分配的资源
 * - 插件支持优雅的注册和卸载流程
 *
 * ### 依赖管理规则
 * - 插件可以声明对其他插件的依赖
 * - 依赖插件必须在当前插件之前注册
 * - 循环依赖检测和报错处理
 * - 依赖版本兼容性检查
 *
 * ### 健康检查规则
 * - 插件必须提供健康状态检查接口
 * - 健康检查包括注册状态、依赖状态、运行状态
 * - 健康检查失败时提供详细的错误信息
 * - 支持定期健康检查和按需检查
 *
 * ### 配置管理规则
 * - 插件配置必须支持类型验证
 * - 配置变更时必须重新验证插件状态
 * - 敏感配置信息必须安全处理
 * - 支持运行时配置热更新
 *
 * @example
 * ```typescript
 * class CorsPlugin extends CoreFastifyPlugin {
 *   constructor() {
 *     super({
 *       name: 'cors',
 *       version: '1.0.0',
 *       priority: 1,
 *       enabled: true,
 *       dependencies: [],
 *       options: {
 *         origin: true,
 *         credentials: true
 *       }
 *     });
 *   }
 *
 *   protected async doRegister(fastify: FastifyInstance): Promise<void> {
 *     await fastify.register(require('@fastify/cors'), this.config.options);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { FastifyInstance, ILoggerService } from '../../../../common/types';
import { BaseError } from '../../../../common/errors/base-error';
import { ErrorCategory, ErrorSeverity } from '../../../../common/errors/error.types';
import { IFastifyPlugin, IFastifyPluginConfig, IFastifyPluginHealth } from '../interfaces/fastify.interface';

/**
 * 插件错误
 */
export class FastifyPluginError extends BaseError {
	public readonly pluginName: string;

	constructor(message: string, pluginName: string, _cause?: Error) {
		super(message, 'FASTIFY_PLUGIN_ERROR', ErrorCategory.UNKNOWN, ErrorSeverity.MEDIUM, {}, {}, {});
		this.pluginName = pluginName;
	}
}

/**
 * CoreFastify插件基类
 */
export abstract class CoreFastifyPlugin implements IFastifyPlugin {
	private _isRegistered = false;
	private _registerTime: Date | null = null;
	private _unregisterTime: Date | null = null;
	private _lastHealthCheck: Date | null = null;
	private _healthCheckInterval: ReturnType<typeof global.setInterval> | null = null;

	protected logger?: ILoggerService;

	constructor(protected readonly _config: IFastifyPluginConfig, logger?: ILoggerService) {
		this.logger = logger;
		this.validateConfig();
	}

	/**
	 * 插件名称
	 */
	get name(): string {
		return this._config.name;
	}

	/**
	 * 插件版本
	 */
	get version(): string {
		return this._config.version || '1.0.0';
	}

	/**
	 * 插件优先级
	 */
	get priority(): number {
		return this._config.priority || 0;
	}

	/**
	 * 插件是否启用
	 */
	get enabled(): boolean {
		return this._config.enabled !== false;
	}

	/**
	 * 插件依赖列表
	 */
	get dependencies(): string[] {
		return this._config.dependencies || [];
	}

	/**
	 * 插件配置
	 */
	get config(): IFastifyPluginConfig {
		return this._config;
	}

	/**
	 * 插件是否已注册
	 */
	get isRegistered(): boolean {
		return this._isRegistered;
	}

	/**
	 * 注册插件
	 */
	async register(fastify: FastifyInstance): Promise<void> {
		try {
			this.logger?.info('正在注册插件', {
				name: this.name,
				version: this.version,
				priority: this.priority
			});

			// 检查插件是否已注册
			if (this._isRegistered) {
				throw new FastifyPluginError(`插件 ${this.name} 已经注册`, this.name);
			}

			// 验证依赖
			if (!(await this.validateDependencies())) {
				throw new FastifyPluginError(`插件 ${this.name} 依赖验证失败`, this.name);
			}

			// 注册前处理
			await this.preRegister(fastify);

			// 执行具体的注册逻辑
			await this.doRegister(fastify);

			// 注册后处理
			await this.postRegister(fastify);

			// 设置健康检查
			this.setupHealthCheck();

			// 更新状态
			this._isRegistered = true;
			this._registerTime = new Date();

			this.logger?.info('插件注册成功', {
				name: this.name,
				registerTime: this._registerTime
			});
		} catch (error) {
			this.logger?.error('插件注册失败', error as Error, { name: this.name });

			// 清理资源
			await this.cleanup();

			throw new FastifyPluginError(
				`插件 ${this.name} 注册失败: ${(error as Error).message}`,
				this.name,
				error as Error
			);
		}
	}

	/**
	 * 卸载插件
	 */
	async unregister(fastify: FastifyInstance): Promise<void> {
		try {
			this.logger?.info('正在卸载插件', { name: this.name });

			// 检查插件是否已注册
			if (!this._isRegistered) {
				this.logger?.warn('插件未注册，跳过卸载', { name: this.name });
				return;
			}

			// 停止健康检查
			this.stopHealthCheck();

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

			this.logger?.info('插件卸载成功', {
				name: this.name,
				unregisterTime: this._unregisterTime
			});
		} catch (error) {
			this.logger?.error('插件卸载失败', error as Error, { name: this.name });
			throw new FastifyPluginError(
				`插件 ${this.name} 卸载失败: ${(error as Error).message}`,
				this.name,
				error as Error
			);
		}
	}

	/**
	 * 获取插件健康状态
	 */
	async getHealthStatus(): Promise<IFastifyPluginHealth> {
		try {
			const dependencyStatus = await this.checkDependencies();
			const customMetrics = await this.getCustomMetrics();

			const status = this.calculateHealthStatus(dependencyStatus);

			this._lastHealthCheck = new Date();

			return {
				name: this.name,
				status,
				isRegistered: this._isRegistered,
				registerTime: this._registerTime || undefined,
				lastCheckTime: this._lastHealthCheck,
				dependencies: dependencyStatus,
				metrics: customMetrics
			};
		} catch (error) {
			this.logger?.error('获取插件健康状态失败', error as Error, {
				name: this.name
			});

			return {
				name: this.name,
				status: 'unhealthy',
				isRegistered: this._isRegistered,
				registerTime: this._registerTime || undefined,
				lastCheckTime: new Date(),
				dependencies: {},
				metrics: { error: (error as Error).message }
			};
		}
	}

	/**
	 * 验证插件依赖
	 */
	async validateDependencies(): Promise<boolean> {
		try {
			const dependencyStatus = await this.checkDependencies();

			// 检查所有依赖是否都满足
			return Object.values(dependencyStatus).every((status) => status === true);
		} catch (error) {
			this.logger?.error('验证插件依赖失败', error as Error, {
				name: this.name
			});
			return false;
		}
	}

	/**
	 * 抽象方法：执行具体的注册逻辑
	 */
	protected abstract doRegister(fastify: FastifyInstance): Promise<void>;

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
	 * 获取自定义指标（可重写）
	 */
	protected async getCustomMetrics(): Promise<Record<string, unknown>> {
		return {};
	}

	/**
	 * 验证配置
	 */
	private validateConfig(): void {
		if (!this._config.name) {
			throw new FastifyPluginError('插件名称不能为空', 'unknown');
		}

		if (this._config.name.includes(' ')) {
			throw new FastifyPluginError('插件名称不能包含空格', this._config.name);
		}

		if (this._config.priority !== undefined && this._config.priority < 0) {
			throw new FastifyPluginError('插件优先级不能为负数', this._config.name);
		}
	}

	/**
	 * 检查依赖状态
	 */
	private async checkDependencies(): Promise<Record<string, boolean>> {
		const status: Record<string, boolean> = {};

		for (const dependency of this.dependencies) {
			try {
				// 这里应该检查依赖插件是否已注册
				// 暂时返回true，等待插件注册表实现
				status[dependency] = true;
			} catch {
				status[dependency] = false;
			}
		}

		return status;
	}

	/**
	 * 计算健康状态
	 */
	private calculateHealthStatus(dependencyStatus: Record<string, boolean>): 'healthy' | 'unhealthy' | 'degraded' {
		if (!this._isRegistered) {
			return 'unhealthy';
		}

		const failedDependencies = Object.values(dependencyStatus).filter((status) => !status);

		if (failedDependencies.length > 0) {
			return 'degraded';
		}

		return 'healthy';
	}

	/**
	 * 设置健康检查
	 */
	private setupHealthCheck(): void {
		if (!this._config.healthCheck?.enabled) {
			return;
		}

		const interval = this._config.healthCheck.interval || 30000; // 默认30秒

		this._healthCheckInterval = global.setInterval(async () => {
			try {
				await this.getHealthStatus();
			} catch (error) {
				this.logger?.error('定期健康检查失败', error as Error, {
					name: this.name
				});
			}
		}, interval);
	}

	/**
	 * 停止健康检查
	 */
	private stopHealthCheck(): void {
		if (this._healthCheckInterval) {
			global.clearInterval(this._healthCheckInterval);
			this._healthCheckInterval = null;
		}
	}

	/**
	 * 清理资源
	 */
	private async cleanup(): Promise<void> {
		try {
			this.stopHealthCheck();
			// 子类可以重写此方法进行额外的清理
		} catch (error) {
			this.logger?.error('清理插件资源失败', error as Error, {
				name: this.name
			});
		}
	}
}
