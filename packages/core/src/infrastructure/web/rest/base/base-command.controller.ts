/**
 * 基础命令控制器
 *
 * 提供CQRS命令端的RESTful接口基础实现，集成命令总线和用例执行。
 * 控制器负责HTTP请求的接收、验证、命令分发和响应格式化。
 *
 * @description 基础命令控制器为所有命令控制器提供统一的基础功能
 *
 * ## 业务规则
 *
 * ### 命令处理规则
 * - 命令控制器只处理写操作（POST、PUT、DELETE）
 * - 每个命令操作对应一个HTTP端点
 * - 命令执行结果统一格式化
 * - 命令失败时返回标准错误格式
 *
 * ### 请求验证规则
 * - 请求参数必须通过DTO验证
 * - 业务规则验证在命令处理器中执行
 * - 权限验证在控制器层执行
 * - 租户隔离在控制器层应用
 *
 * ### 响应格式规则
 * - 成功响应包含操作结果和元数据
 * - 错误响应包含错误码和详细信息
 * - 支持多种响应格式（JSON、XML等）
 * - 响应头包含操作追踪信息
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @ApiTags('用户管理')
 * export class UserCommandController extends BaseCommandController {
 *   constructor(
 *     cqrsBus: ICQRSBus,
 *     logger: ILoggerService
 *   ) {
 *     super(cqrsBus, logger, 'UserCommandController');
 *   }
 *
 *   @Post()
 *   @CommandEndpoint({
 *     command: CreateUserCommand,
 *     description: '创建用户',
 *     permissions: ['user:create']
 *   })
 *   async createUser(
 *     @Body() dto: CreateUserDto,
 *     @TenantContext() tenant: ITenantContext,
 *     @UserContext() user: IUserContext
 *   ): Promise<ICommandResponse<CreateUserResult>> {
 *     return this.executeCommand(CreateUserCommand, dto, { tenant, user });
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { HttpStatus } from '@nestjs/common';
import type { ICQRSBus } from '../../../../application/cqrs/bus/cqrs-bus.interface';
import type { BaseCommand } from '../../../../application/cqrs/commands/base/base-command';

/**
 * 命令执行上下文接口
 */
export interface ICommandContext {
	/**
	 * 租户上下文
	 */
	tenant?: {
		tenantId: string;
		tenantName?: string;
		tenantType?: string;
	};

	/**
	 * 用户上下文
	 */
	user?: {
		userId: string;
		userName?: string;
		userRole?: string;
		permissions?: string[];
	};

	/**
	 * 请求上下文
	 */
	request?: {
		requestId: string;
		userAgent?: string;
		ipAddress?: string;
		timestamp: Date;
	};

	/**
	 * 其他元数据
	 */
	metadata?: Record<string, unknown>;
}

/**
 * 命令响应接口
 */
export interface ICommandResponse<TResult = unknown> {
	/**
	 * 操作是否成功
	 */
	success: boolean;

	/**
	 * 操作结果数据
	 */
	data?: TResult;

	/**
	 * 操作消息
	 */
	message?: string;

	/**
	 * 错误信息
	 */
	error?: {
		code: string;
		message: string;
		details?: unknown;
	};

	/**
	 * 响应元数据
	 */
	metadata: {
		requestId: string;
		timestamp: Date;
		executionTime: number;
		commandType?: string;
	};
}

/**
 * 命令执行选项接口
 */
export interface ICommandExecutionOptions {
	/**
	 * 执行超时时间（毫秒）
	 */
	timeout?: number;

	/**
	 * 是否异步执行
	 */
	async?: boolean;

	/**
	 * 重试配置
	 */
	retry?: {
		maxAttempts: number;
		backoffStrategy: 'fixed' | 'exponential';
		baseDelay: number;
	};

	/**
	 * 验证选项
	 */
	validation?: {
		skipBusinessRules?: boolean;
		skipPermissions?: boolean;
	};
}

/**
 * 基础命令控制器抽象类
 */
export abstract class BaseCommandController {
	protected readonly controllerName: string;

	/**
	 * 构造函数
	 *
	 * @param cqrsBus - CQRS总线
	 * @param controllerName - 控制器名称
	 */
	protected constructor(protected readonly cqrsBus: ICQRSBus, controllerName: string) {
		this.controllerName = controllerName;
	}

	/**
	 * 执行命令
	 *
	 * @template TCommand - 命令类型
	 * @template TResult - 结果类型
	 * @param commandClass - 命令类构造函数
	 * @param dto - 数据传输对象
	 * @param context - 命令执行上下文
	 * @param options - 执行选项
	 * @returns 命令执行结果
	 */
	protected async executeCommand<TCommand, TResult>(
		commandClass: new (...args: unknown[]) => TCommand,
		dto: unknown,
		context: ICommandContext,
		options?: ICommandExecutionOptions
	): Promise<ICommandResponse<TResult>> {
		const startTime = Date.now();
		const requestId = this.generateRequestId();

		try {
			// 创建命令实例
			const command = this.createCommand(commandClass, dto, context);

			// 执行命令
			const result = await this.executeCommandWithTimeout(command, options?.timeout);

			// 返回成功响应
			return this.createSuccessResponse<TResult>(result as TResult, {
				requestId,
				startTime,
				commandType: command?.constructor?.name
			});
		} catch (error) {
			// 返回错误响应
			return this.createErrorResponse(error, {
				requestId,
				startTime,
				commandType: commandClass.name
			});
		}
	}

	/**
	 * 批量执行命令
	 *
	 * @template TCommand - 命令类型
	 * @template TResult - 结果类型
	 * @param commandClass - 命令类构造函数
	 * @param dtos - 数据传输对象数组
	 * @param context - 命令执行上下文
	 * @param options - 执行选项
	 * @returns 批量命令执行结果
	 */
	protected async executeCommandBatch<TCommand, TResult>(
		commandClass: new (...args: unknown[]) => TCommand,
		dtos: unknown[],
		context: ICommandContext,
		options?: ICommandExecutionOptions
	): Promise<ICommandResponse<TResult[]>> {
		const startTime = Date.now();
		const requestId = this.generateRequestId();

		try {
			// 创建命令实例数组
			const commands = dtos.map((dto) => this.createCommand(commandClass, dto, context));

			// 批量执行命令
			const results = await Promise.all(
				commands.map((command) => this.executeCommandWithTimeout(command, options?.timeout))
			);

			// 返回成功响应
			return this.createSuccessResponse<TResult[]>(results as TResult[], {
				requestId,
				startTime,
				commandType: commandClass.name
			});
		} catch (error) {
			// 返回错误响应
			return this.createErrorResponse(error, {
				requestId,
				startTime,
				commandType: commandClass.name
			});
		}
	}

	/**
	 * 创建命令实例
	 *
	 * @param commandClass - 命令类构造函数
	 * @param dto - 数据传输对象
	 * @param context - 命令执行上下文
	 * @returns 命令实例
	 * @protected
	 */
	protected createCommand<TCommand>(
		commandClass: new (...args: unknown[]) => TCommand,
		dto: unknown,
		context: ICommandContext
	): TCommand {
		// 默认实现假设命令构造函数接受DTO和上下文
		// 子类可以重写此方法以适应不同的命令构造方式
		return new commandClass(dto, context);
	}

	/**
	 * 带超时的命令执行
	 *
	 * @param command - 命令实例
	 * @param timeout - 超时时间（毫秒）
	 * @returns 执行结果
	 * @protected
	 */
	protected async executeCommandWithTimeout<TResult>(command: unknown, timeout?: number): Promise<TResult> {
		if (timeout && timeout > 0) {
			return Promise.race([
				this.cqrsBus.executeCommand(command as BaseCommand),
				this.createTimeoutPromise(timeout)
			]) as Promise<TResult>;
		}

		return this.cqrsBus.executeCommand(command as BaseCommand) as TResult;
	}

	/**
	 * 创建成功响应
	 *
	 * @param data - 响应数据
	 * @param metadata - 响应元数据
	 * @returns 成功响应
	 * @protected
	 */
	protected createSuccessResponse<TResult>(
		data: TResult,
		metadata: {
			requestId: string;
			startTime: number;
			commandType?: string;
		}
	): ICommandResponse<TResult> {
		return {
			success: true,
			data,
			message: '命令执行成功',
			metadata: {
				requestId: metadata.requestId,
				timestamp: new Date(),
				executionTime: Date.now() - metadata.startTime,
				commandType: metadata.commandType
			}
		};
	}

	/**
	 * 创建错误响应
	 *
	 * @param error - 错误对象
	 * @param metadata - 响应元数据
	 * @returns 错误响应
	 * @protected
	 */
	protected createErrorResponse(
		error: unknown,
		metadata: {
			requestId: string;
			startTime: number;
			commandType?: string;
		}
	): ICommandResponse<never> {
		const err = error instanceof Error ? error : new Error(String(error));

		return {
			success: false,
			error: {
				code: this.getErrorCode(err),
				message: err.message,
				details: this.getErrorDetails(err)
			},
			metadata: {
				requestId: metadata.requestId,
				timestamp: new Date(),
				executionTime: Date.now() - metadata.startTime,
				commandType: metadata.commandType
			}
		};
	}

	/**
	 * 生成请求ID
	 *
	 * @returns 请求ID
	 * @protected
	 */
	protected generateRequestId(): string {
		return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * 创建超时Promise
	 *
	 * @param timeout - 超时时间
	 * @returns 超时Promise
	 * @protected
	 */
	protected createTimeoutPromise<T>(timeout: number): Promise<T> {
		return new Promise((_, reject) => {
			setTimeout(() => {
				reject(new Error(`命令执行超时: ${timeout}ms`));
			}, timeout);
		});
	}

	/**
	 * 获取错误码
	 *
	 * @param error - 错误对象
	 * @returns 错误码
	 * @protected
	 */
	protected getErrorCode(error: Error): string {
		// 根据错误类型返回相应的错误码
		if (error.name === 'ValidationError') {
			return 'VALIDATION_ERROR';
		}
		if (error.name === 'BusinessError') {
			return 'BUSINESS_ERROR';
		}
		if (error.name === 'PermissionError') {
			return 'PERMISSION_ERROR';
		}
		if (error.message.includes('超时')) {
			return 'TIMEOUT_ERROR';
		}
		return 'INTERNAL_ERROR';
	}

	/**
	 * 获取错误详细信息
	 *
	 * @param error - 错误对象
	 * @returns 错误详细信息
	 * @protected
	 */
	protected getErrorDetails(error: Error): unknown {
		// 在开发环境返回详细信息，生产环境返回简化信息
		const isDevelopment = process.env.NODE_ENV === 'development';

		if (isDevelopment) {
			return {
				name: error.name,
				stack: error.stack,
				cause: (error as Error & { cause?: unknown }).cause
			};
		}

		return undefined;
	}

	/**
	 * 获取HTTP状态码
	 *
	 * @param error - 错误对象
	 * @returns HTTP状态码
	 * @protected
	 */
	protected getHttpStatus(error: Error): HttpStatus {
		if (error.name === 'ValidationError') {
			return HttpStatus.BAD_REQUEST;
		}
		if (error.name === 'BusinessError') {
			return HttpStatus.UNPROCESSABLE_ENTITY;
		}
		if (error.name === 'PermissionError') {
			return HttpStatus.FORBIDDEN;
		}
		if (error.message.includes('未找到')) {
			return HttpStatus.NOT_FOUND;
		}
		if (error.message.includes('超时')) {
			return HttpStatus.REQUEST_TIMEOUT;
		}
		return HttpStatus.INTERNAL_SERVER_ERROR;
	}

	/**
	 * 记录日志
	 *
	 * @param level - 日志级别
	 * @param message - 日志消息
	 * @param context - 上下文信息
	 * @protected
	 */
	protected log(_level: string, _message: string, _context?: Record<string, unknown>): void {
		// TODO: 替换为实际的日志系统
		// console.log(`[${_level.toUpperCase()}] [${this.controllerName}] ${_message}`, _context);
	}
}
