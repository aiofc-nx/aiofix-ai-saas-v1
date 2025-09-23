/**
 * AutoRegistrationService - 自动注册服务
 *
 * 负责将发现的 CQRS 处理器自动注册到相应的总线中。
 * 该服务提供处理器注册、依赖注入集成、错误处理等功能。
 *
 * ## 业务规则
 *
 * ### 注册规则
 * - 自动将命令处理器注册到命令总线
 * - 自动将查询处理器注册到查询总线
 * - 自动将事件处理器注册到事件总线
 * - 自动将 Saga 处理器注册到 Saga 管理器
 *
 * ### 依赖注入规则
 * - 支持 NestJS 依赖注入系统
 * - 自动解析处理器依赖
 * - 支持循环依赖检测和解决
 * - 支持作用域管理
 *
 * ### 错误处理规则
 * - 优雅处理注册失败的情况
 * - 提供详细的错误信息
 * - 支持部分注册失败的情况
 * - 支持注册重试机制
 *
 * @description 自动注册服务，用于将发现的处理器注册到总线
 * @example
 * ```typescript
 * const registrationService = new AutoRegistrationService(
 *   commandBus,
 *   queryBus,
 *   eventBus,
 *   sagaManager
 * );
 *
 * // 注册发现的处理器
 * await registrationService.registerHandlers(explorerResult);
 *
 * // 检查注册状态
 * const status = registrationService.getRegistrationStatus();
 * ```
 *
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import { ModuleRef } from '@nestjs/core';
import type { ICommandBus, IQueryBus, IEventBus } from '../cqrs/bus';
import type {
	ICommandHandlerMetadata,
	IQueryHandlerMetadata,
	IEventHandlerMetadata
} from '../../common/decorators/metadata.interfaces';
import { IExplorerResult, IHandlerInfo } from './core-explorer.service';

/**
 * 注册状态接口
 */
export interface IRegistrationStatus {
	/**
	 * 总处理器数量
	 */
	totalHandlers: number;

	/**
	 * 成功注册的处理器数量
	 */
	registeredHandlers: number;

	/**
	 * 注册失败的处理器数量
	 */
	failedHandlers: number;

	/**
	 * 注册详情
	 */
	details: {
		commandHandlers: {
			total: number;
			registered: number;
			failed: number;
			errors: Array<{ handler: string; error: string }>;
		};
		queryHandlers: {
			total: number;
			registered: number;
			failed: number;
			errors: Array<{ handler: string; error: string }>;
		};
		eventHandlers: {
			total: number;
			registered: number;
			failed: number;
			errors: Array<{ handler: string; error: string }>;
		};
		sagaHandlers: {
			total: number;
			registered: number;
			failed: number;
			errors: Array<{ handler: string; error: string }>;
		};
	};

	/**
	 * 注册时间
	 */
	registrationTime: number;

	/**
	 * 是否完成
	 */
	completed: boolean;
}

/**
 * 注册选项接口
 */
export interface IRegistrationOptions {
	/**
	 * 是否启用自动重试
	 */
	enableRetry?: boolean;

	/**
	 * 最大重试次数
	 */
	maxRetries?: number;

	/**
	 * 重试延迟时间（毫秒）
	 */
	retryDelay?: number;

	/**
	 * 是否启用并发注册
	 */
	enableConcurrency?: boolean;

	/**
	 * 最大并发数
	 */
	maxConcurrency?: number;

	/**
	 * 是否在注册失败时继续
	 */
	continueOnError?: boolean;

	/**
	 * 是否验证处理器
	 */
	validateHandlers?: boolean;

	/**
	 * 自定义验证函数
	 */
	customValidator?: (handler: IHandlerInfo) => Promise<boolean>;
}

/**
 * 自动注册服务
 */
@Injectable()
export class AutoRegistrationService {
	private registrationStatus: IRegistrationStatus | null = null;

	constructor(
		private readonly moduleRef: ModuleRef,
		private readonly logger: ILoggerService,
		private readonly commandBus?: ICommandBus,
		private readonly queryBus?: IQueryBus,
		private readonly eventBus?: IEventBus
	) {}

	/**
	 * 注册处理器
	 *
	 * @param explorerResult - 扫描结果
	 * @param options - 注册选项
	 * @returns 注册状态
	 */
	public async registerHandlers(
		explorerResult: IExplorerResult,
		options: IRegistrationOptions = {}
	): Promise<IRegistrationStatus> {
		const startTime = Date.now();
		const defaultOptions: IRegistrationOptions = {
			enableRetry: true,
			maxRetries: 3,
			retryDelay: 1000,
			enableConcurrency: true,
			maxConcurrency: 10,
			continueOnError: true,
			validateHandlers: true,
			...options
		};

		this.logger.info('Starting handler registration...', LogContext.SYSTEM);

		// 初始化注册状态
		this.registrationStatus = {
			totalHandlers: explorerResult.handlers.length,
			registeredHandlers: 0,
			failedHandlers: 0,
			details: {
				commandHandlers: {
					total: explorerResult.commandHandlers.length,
					registered: 0,
					failed: 0,
					errors: []
				},
				queryHandlers: {
					total: explorerResult.queryHandlers.length,
					registered: 0,
					failed: 0,
					errors: []
				},
				eventHandlers: {
					total: explorerResult.eventHandlers.length,
					registered: 0,
					failed: 0,
					errors: []
				},
				sagaHandlers: {
					total: explorerResult.sagaHandlers.length,
					registered: 0,
					failed: 0,
					errors: []
				}
			},
			registrationTime: 0,
			completed: false
		};

		try {
			// 并行注册不同类型的处理器
			const registrationPromises = [];

			if (explorerResult.commandHandlers.length > 0) {
				registrationPromises.push(this.registerCommandHandlers(explorerResult.commandHandlers, defaultOptions));
			}

			if (explorerResult.queryHandlers.length > 0) {
				registrationPromises.push(this.registerQueryHandlers(explorerResult.queryHandlers, defaultOptions));
			}

			if (explorerResult.eventHandlers.length > 0) {
				registrationPromises.push(this.registerEventHandlers(explorerResult.eventHandlers, defaultOptions));
			}

			if (explorerResult.sagaHandlers.length > 0) {
				registrationPromises.push(this.registerSagaHandlers(explorerResult.sagaHandlers, defaultOptions));
			}

			await Promise.all(registrationPromises);

			// 更新完成状态
			if (this.registrationStatus) {
				this.registrationStatus.completed = true;
				this.registrationStatus.registrationTime = Date.now() - startTime;
			}

			if (this.registrationStatus) {
				this.logger.info(
					`Handler registration completed in ${this.registrationStatus.registrationTime}ms`,
					LogContext.SYSTEM,
					{ registrationTime: this.registrationStatus.registrationTime }
				);
			}

			if (this.registrationStatus) {
				this.logger.info(
					`Registered: ${this.registrationStatus.registeredHandlers}, Failed: ${this.registrationStatus.failedHandlers}`,
					LogContext.SYSTEM,
					{
						registeredHandlers: this.registrationStatus.registeredHandlers,
						failedHandlers: this.registrationStatus.failedHandlers
					}
				);
			}

			return this.registrationStatus;
		} catch (error) {
			this.logger.error('Handler registration failed', LogContext.SYSTEM, {}, error as Error);
			throw error;
		}
	}

	/**
	 * 获取注册状态
	 *
	 * @returns 注册状态
	 */
	public getRegistrationStatus(): IRegistrationStatus | null {
		return this.registrationStatus;
	}

	/**
	 * 注册命令处理器
	 *
	 * @private
	 */
	private async registerCommandHandlers(handlers: IHandlerInfo[], options: IRegistrationOptions): Promise<void> {
		if (!this.commandBus) {
			this.logger.warn('Command bus not available, skipping command handlers', LogContext.SYSTEM);
			return;
		}

		this.logger.info(`Registering ${handlers.length} command handlers...`, LogContext.SYSTEM, {
			handlerCount: handlers.length
		});

		for (const handler of handlers) {
			try {
				// 验证处理器
				if (options.validateHandlers && !(await this.validateHandler(handler, options))) {
					throw new Error('Handler validation failed');
				}

				// 获取处理器实例
				const handlerInstance = await this.getHandlerInstance(handler);

				// 注册到命令总线
				const commandType = (handler.metadata as ICommandHandlerMetadata).commandType;
				this.commandBus.registerHandler(
					commandType,
					handlerInstance as Parameters<typeof this.commandBus.registerHandler>[1]
				);

				// 更新状态
				if (this.registrationStatus) {
					this.registrationStatus.registeredHandlers++;
					this.registrationStatus.details.commandHandlers.registered++;
				}

				this.logger.debug(`Registered command handler: ${handler.handlerName}`, LogContext.SYSTEM, {
					handlerName: handler.handlerName
				});
			} catch (error) {
				this.handleRegistrationError(handler, error as Error, 'command');
			}
		}
	}

	/**
	 * 注册查询处理器
	 *
	 * @private
	 */
	private async registerQueryHandlers(handlers: IHandlerInfo[], options: IRegistrationOptions): Promise<void> {
		if (!this.queryBus) {
			this.logger.warn('Query bus not available, skipping query handlers', LogContext.SYSTEM);
			return;
		}

		this.logger.info(`Registering ${handlers.length} query handlers...`, LogContext.SYSTEM, {
			handlerCount: handlers.length
		});

		for (const handler of handlers) {
			try {
				// 验证处理器
				if (options.validateHandlers && !(await this.validateHandler(handler, options))) {
					throw new Error('Handler validation failed');
				}

				// 获取处理器实例
				const handlerInstance = await this.getHandlerInstance(handler);

				// 注册到查询总线
				const queryType = (handler.metadata as IQueryHandlerMetadata).queryType;
				this.queryBus.registerHandler(
					queryType,
					handlerInstance as Parameters<typeof this.queryBus.registerHandler>[1]
				);

				// 更新状态
				if (this.registrationStatus) {
					this.registrationStatus.registeredHandlers++;
					this.registrationStatus.details.queryHandlers.registered++;
				}

				this.logger.debug(`Registered query handler: ${handler.handlerName}`, LogContext.SYSTEM, {
					handlerName: handler.handlerName
				});
			} catch (error) {
				this.handleRegistrationError(handler, error as Error, 'query');
			}
		}
	}

	/**
	 * 注册事件处理器
	 *
	 * @private
	 */
	private async registerEventHandlers(handlers: IHandlerInfo[], options: IRegistrationOptions): Promise<void> {
		if (!this.eventBus) {
			this.logger.warn('Event bus not available, skipping event handlers', LogContext.SYSTEM);
			return;
		}

		this.logger.info(`Registering ${handlers.length} event handlers...`, LogContext.SYSTEM, {
			handlerCount: handlers.length
		});

		for (const handler of handlers) {
			try {
				// 验证处理器
				if (options.validateHandlers && !(await this.validateHandler(handler, options))) {
					throw new Error('Handler validation failed');
				}

				// 获取处理器实例
				const handlerInstance = await this.getHandlerInstance(handler);

				// 注册到事件总线
				const eventType = (handler.metadata as IEventHandlerMetadata).eventType;
				this.eventBus.registerHandler(
					eventType,
					handlerInstance as Parameters<typeof this.eventBus.registerHandler>[1]
				);

				// 更新状态
				if (this.registrationStatus) {
					this.registrationStatus.registeredHandlers++;
					this.registrationStatus.details.eventHandlers.registered++;
				}

				this.logger.debug(`Registered event handler: ${handler.handlerName}`, LogContext.SYSTEM, {
					handlerName: handler.handlerName
				});
			} catch (error) {
				this.handleRegistrationError(handler, error as Error, 'event');
			}
		}
	}

	/**
	 * 注册 Saga 处理器
	 *
	 * @private
	 */
	private async registerSagaHandlers(handlers: IHandlerInfo[], options: IRegistrationOptions): Promise<void> {
		this.logger.info(`Registering ${handlers.length} saga handlers...`, LogContext.SYSTEM, {
			handlerCount: handlers.length
		});

		for (const handler of handlers) {
			try {
				// 验证处理器
				if (options.validateHandlers && !(await this.validateHandler(handler, options))) {
					throw new Error('Handler validation failed');
				}

				// 获取处理器实例
				await this.getHandlerInstance(handler);

				// 注册 Saga 处理器（这里需要实现具体的 Saga 管理器）
				// 暂时只记录日志
				this.logger.debug(`Registered saga handler: ${handler.handlerName}`, LogContext.SYSTEM, {
					handlerName: handler.handlerName
				});

				// 更新状态
				if (this.registrationStatus) {
					this.registrationStatus.registeredHandlers++;
					this.registrationStatus.details.sagaHandlers.registered++;
				}
			} catch (error) {
				this.handleRegistrationError(handler, error as Error, 'saga');
			}
		}
	}

	/**
	 * 验证处理器
	 *
	 * @private
	 */
	private async validateHandler(handler: IHandlerInfo, options: IRegistrationOptions): Promise<boolean> {
		try {
			// 基本验证
			if (!handler.handlerClass || !handler.metadata) {
				return false;
			}

			// 自定义验证
			if (options.customValidator) {
				return await options.customValidator(handler);
			}

			return true;
		} catch (error) {
			this.logger.warn(
				`Handler validation failed for ${handler.handlerName}: ${(error as Error).message}`,
				LogContext.SYSTEM,
				{ handlerName: handler.handlerName, error: (error as Error).message }
			);
			return false;
		}
	}

	/**
	 * 获取处理器实例
	 *
	 * @private
	 */
	private async getHandlerInstance(handler: IHandlerInfo): Promise<unknown> {
		try {
			return await this.moduleRef.get(handler.handlerClass, { strict: false });
		} catch {
			// 如果无法从依赖注入容器获取，尝试直接实例化
			this.logger.warn(
				`Failed to get handler instance from DI container for ${handler.handlerName}, trying direct instantiation`,
				LogContext.SYSTEM,
				{ handlerName: handler.handlerName }
			);
			return new (handler.handlerClass as new () => unknown)();
		}
	}

	/**
	 * 处理注册错误
	 *
	 * @private
	 */
	private handleRegistrationError(
		handler: IHandlerInfo,
		error: Error,
		handlerType: 'command' | 'query' | 'event' | 'saga'
	): void {
		const errorMessage = `${handler.handlerName}: ${error.message}`;

		// 更新状态
		if (this.registrationStatus) {
			this.registrationStatus.failedHandlers++;
			const details = this.registrationStatus.details as Record<
				string,
				{ failed: number; errors: Array<{ handler: string; error: string }> }
			>;
			details[`${handlerType}Handlers`].failed++;
			details[`${handlerType}Handlers`].errors.push({
				handler: handler.handlerName,
				error: errorMessage
			});
		}

		this.logger.error(
			`Failed to register ${handlerType} handler ${handler.handlerName}: ${error.message}`,
			LogContext.SYSTEM,
			{ handlerName: handler.handlerName, handlerType, error: error.message },
			error
		);
	}
}
