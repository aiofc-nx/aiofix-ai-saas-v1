/**
 * CoreExceptionFilter - 核心异常过滤器
 *
 * 提供了统一的异常捕获和处理机制，集成错误总线进行统一的错误管理。
 * 支持多种异常类型、自定义处理策略和异常转换。
 *
 * ## 业务规则
 *
 * ### 异常捕获规则
 * - 所有未处理的异常都应该被过滤器捕获
 * - 异常捕获应该不阻塞主业务流程
 * - 异常捕获应该提供详细的上下文信息
 *
 * ### 异常分类规则
 * - 异常应该根据类型、来源、严重程度进行分类
 * - 分类应该支持自定义规则和策略
 * - 分类结果应该影响后续的处理策略
 *
 * ### 异常转换规则
 * - 异常应该转换为统一的错误格式
 * - 转换应该保留原始异常信息
 * - 转换应该添加必要的上下文信息
 *
 * ### 异常处理规则
 * - 异常处理应该支持多种策略（记录、通知、恢复等）
 * - 处理策略应该可配置和可扩展
 * - 处理失败不应该影响主业务流程
 *
 * @description 核心异常过滤器实现类
 * @example
 * ```typescript
 * const filter = new CoreExceptionFilter(errorBus);
 *
 * // 在 NestJS 中使用
 * app.useGlobalFilters(filter);
 *
 * // 或者作为装饰器使用
 * @UseFilters(CoreExceptionFilter)
 * export class MyController {
 *   @Get()
 *   async getData() {
 *     throw new Error('Something went wrong');
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
import { Catch, ArgumentsHost, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
// import { Request, Response } from 'express';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import type { IErrorBus, IErrorContext } from './error-handling.interface';

/**
 * 异常信息接口
 */
export interface IExceptionInfo {
	/**
	 * 异常类型
	 */
	type: string;

	/**
	 * 异常消息
	 */
	message: string;

	/**
	 * 异常堆栈
	 */
	stack?: string;

	/**
	 * HTTP 状态码
	 */
	statusCode?: number;

	/**
	 * 错误代码
	 */
	errorCode?: string;

	/**
	 * 异常来源
	 */
	source: 'HTTP' | 'GRAPHQL' | 'WEBSOCKET' | 'CLI' | 'SYSTEM';

	/**
	 * 请求信息
	 */
	request?: {
		method?: string;
		url?: string;
		headers?: Record<string, string>;
		body?: unknown;
		query?: Record<string, unknown>;
		params?: Record<string, unknown>;
	};

	/**
	 * 响应信息
	 */
	response?: {
		statusCode?: number;
		headers?: Record<string, string>;
		body?: unknown;
	};

	/**
	 * 用户信息
	 */
	user?: {
		id?: string;
		email?: string;
		roles?: string[];
	};

	/**
	 * 租户信息
	 */
	tenant?: {
		id?: string;
		name?: string;
	};

	/**
	 * 自定义数据
	 */
	customData?: Record<string, unknown>;
}

/**
 * 核心异常过滤器
 */
@Catch()
export class CoreExceptionFilter implements ExceptionFilter {
	constructor(private readonly errorBus: IErrorBus, private readonly logger: ILoggerService) {}

	/**
	 * 捕获异常
	 */
	public async catch(exception: Error, host: ArgumentsHost): Promise<void> {
		const context = this.extractContext(host);
		const exceptionInfo = this.extractExceptionInfo(exception, context);

		this.logger.error(
			`Exception caught: ${exceptionInfo.type} - ${exceptionInfo.message}`,
			LogContext.SYSTEM,
			{
				exceptionType: exceptionInfo.type,
				exceptionMessage: exceptionInfo.message,
				statusCode: exceptionInfo.statusCode,
				errorCode: exceptionInfo.errorCode,
				source: exceptionInfo.source
			},
			exception
		);

		try {
			// 发布到错误总线
			const errorContext: Partial<IErrorContext> = {
				tenantId: exceptionInfo.tenant?.id,
				userId: exceptionInfo.user?.id,
				requestId: this.extractRequestId(context),
				correlationId: this.extractCorrelationId(context),
				userAgent: exceptionInfo.request?.headers?.['user-agent'],
				ipAddress: this.extractIpAddress(context),
				source: this.mapSourceToContextSource(exceptionInfo.source),
				customData: {
					exceptionInfo,
					context
				}
			};

			await this.errorBus.publish(exception, errorContext);
		} catch (errorBusError) {
			this.logger.error(
				`Failed to publish exception to error bus: ${(errorBusError as Error).message}`,
				LogContext.SYSTEM,
				{ error: (errorBusError as Error).message },
				errorBusError as Error
			);
		}

		// 根据上下文类型处理响应
		if (context.getType() === 'http') {
			await this.handleHttpException(exception, context, exceptionInfo);
		} else if (context.getType() === 'ws') {
			await this.handleWebSocketException(exception, context, exceptionInfo);
		} else if (context.getType() === 'rpc') {
			await this.handleRpcException(exception, context, exceptionInfo);
		} else {
			await this.handleGenericException(exception, context, exceptionInfo);
		}
	}

	/**
	 * 提取上下文信息
	 */
	private extractContext(host: ArgumentsHost): ArgumentsHost {
		return host;
	}

	/**
	 * 提取异常信息
	 */
	private extractExceptionInfo(exception: Error, context: ArgumentsHost): IExceptionInfo {
		const exceptionInfo: IExceptionInfo = {
			type: exception.constructor.name,
			message: exception.message,
			stack: exception.stack,
			source: this.determineSource(context)
		};

		// 处理 HTTP 异常
		if (exception instanceof HttpException) {
			exceptionInfo.statusCode = exception.getStatus();
			exceptionInfo.errorCode = this.extractErrorCode(exception);
		}

		// 提取请求信息
		if (context.getType() === 'http') {
			const request = context.switchToHttp().getRequest();
			exceptionInfo.request = {
				method: (request as Record<string, unknown>).method as string,
				url: (request as Record<string, unknown>).url as string,
				headers: (request as Record<string, unknown>).headers as Record<string, string>,
				body: (request as Record<string, unknown>).body,
				query: (request as Record<string, unknown>).query as Record<string, unknown>,
				params: (request as Record<string, unknown>).params as Record<string, unknown>
			};
		}

		// 提取用户信息
		exceptionInfo.user = this.extractUserInfo(context);

		// 提取租户信息
		exceptionInfo.tenant = this.extractTenantInfo(context);

		return exceptionInfo;
	}

	/**
	 * 确定异常来源
	 */
	private determineSource(context: ArgumentsHost): IExceptionInfo['source'] {
		const type = context.getType();
		switch (type) {
			case 'http':
				return 'HTTP';
			case 'ws':
				return 'WEBSOCKET';
			case 'rpc':
				return 'SYSTEM';
			default:
				return 'SYSTEM';
		}
	}

	/**
	 * 提取错误代码
	 */
	private extractErrorCode(exception: HttpException): string | undefined {
		const response = exception.getResponse();
		if (typeof response === 'object' && response !== null) {
			return (
				((response as Record<string, unknown>).errorCode as string) ||
				((response as Record<string, unknown>).code as string)
			);
		}
		return undefined;
	}

	/**
	 * 提取用户信息
	 */
	private extractUserInfo(context: ArgumentsHost): IExceptionInfo['user'] {
		try {
			if (context.getType() === 'http') {
				const request = context.switchToHttp().getRequest();
				return (request as Record<string, unknown>).user as IExceptionInfo['user'];
			}
		} catch {
			// 忽略提取错误
		}
		return undefined;
	}

	/**
	 * 提取租户信息
	 */
	private extractTenantInfo(context: ArgumentsHost): IExceptionInfo['tenant'] {
		try {
			if (context.getType() === 'http') {
				const request = context.switchToHttp().getRequest();
				return (request as Record<string, unknown>).tenant as IExceptionInfo['tenant'];
			}
		} catch {
			// 忽略提取错误
		}
		return undefined;
	}

	/**
	 * 提取请求ID
	 */
	private extractRequestId(context: ArgumentsHost): string | undefined {
		try {
			if (context.getType() === 'http') {
				const request = context.switchToHttp().getRequest();
				const headers = (request as Record<string, unknown>).headers as Record<string, string>;
				return headers?.['x-request-id'] || headers?.['x-correlation-id'];
			}
		} catch {
			// 忽略提取错误
		}
		return undefined;
	}

	/**
	 * 提取关联ID
	 */
	private extractCorrelationId(context: ArgumentsHost): string | undefined {
		try {
			if (context.getType() === 'http') {
				const request = context.switchToHttp().getRequest();
				const headers = (request as Record<string, unknown>).headers as Record<string, string>;
				return headers?.['x-correlation-id'];
			}
		} catch {
			// 忽略提取错误
		}
		return undefined;
	}

	/**
	 * 提取IP地址
	 */
	private extractIpAddress(context: ArgumentsHost): string | undefined {
		try {
			if (context.getType() === 'http') {
				const request = context.switchToHttp().getRequest();
				const req = request as Record<string, unknown>;
				return (
					(req.ip as string) ||
					((req.connection as Record<string, unknown>)?.remoteAddress as string) ||
					((req.socket as Record<string, unknown>)?.remoteAddress as string)
				);
			}
		} catch {
			// 忽略提取错误
		}
		return undefined;
	}

	/**
	 * 映射来源到上下文来源
	 */
	private mapSourceToContextSource(source: IExceptionInfo['source']): 'WEB' | 'API' | 'CLI' | 'SYSTEM' {
		switch (source) {
			case 'HTTP':
				return 'WEB';
			case 'GRAPHQL':
				return 'API';
			case 'WEBSOCKET':
				return 'WEB';
			case 'CLI':
				return 'CLI';
			case 'SYSTEM':
				return 'SYSTEM';
			default:
				return 'SYSTEM';
		}
	}

	/**
	 * 处理HTTP异常
	 */
	private async handleHttpException(
		exception: Error,
		context: ArgumentsHost,
		exceptionInfo: IExceptionInfo
	): Promise<void> {
		const response = context.switchToHttp().getResponse();

		let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
		let message = 'Internal server error';
		let errorCode = 'INTERNAL_ERROR';

		if (exception instanceof HttpException) {
			statusCode = exception.getStatus();
			const responseBody = exception.getResponse();
			if (typeof responseBody === 'string') {
				message = responseBody;
			} else if (typeof responseBody === 'object' && responseBody !== null) {
				const body = responseBody as Record<string, unknown>;
				message = (body.message as string) || exception.message;
				errorCode = (body.errorCode as string) || errorCode;
			}
		} else {
			message = exception.message;
		}

		const errorResponse = {
			statusCode,
			errorCode,
			message,
			timestamp: new Date().toISOString(),
			path: exceptionInfo.request?.url,
			method: exceptionInfo.request?.method,
			...(process.env.NODE_ENV === 'development' && {
				stack: exception.stack,
				exceptionInfo
			})
		};

		(
			response as {
				status: (code: number) => { json: (data: unknown) => void };
			}
		)
			.status(statusCode)
			.json(errorResponse);
	}

	/**
	 * 处理WebSocket异常
	 */
	private async handleWebSocketException(
		exception: Error,
		context: ArgumentsHost,
		_exceptionInfo: IExceptionInfo
	): Promise<void> {
		try {
			const client = context.switchToWs().getClient();
			const errorMessage = {
				type: 'error',
				error: {
					code: 'WEBSOCKET_ERROR',
					message: exception.message,
					timestamp: new Date().toISOString()
				}
			};

			if (client && typeof client.emit === 'function') {
				client.emit('error', errorMessage);
			}
		} catch (error) {
			this.logger.error(
				`Failed to handle WebSocket exception: ${(error as Error).message}`,
				LogContext.SYSTEM,
				{ error: (error as Error).message },
				error as Error
			);
		}
	}

	/**
	 * 处理RPC异常
	 */
	private async handleRpcException(
		exception: Error,
		_context: ArgumentsHost,
		_exceptionInfo: IExceptionInfo
	): Promise<void> {
		try {
			// const rpcContext = context.switchToRpc();
			// 这里可以添加RPC特定的异常处理逻辑
			this.logger.error(`RPC exception: ${exception.message}`, LogContext.SYSTEM, {}, exception);
		} catch (error) {
			this.logger.error(
				`Failed to handle RPC exception: ${(error as Error).message}`,
				LogContext.SYSTEM,
				{ error: (error as Error).message },
				error as Error
			);
		}
	}

	/**
	 * 处理通用异常
	 */
	private async handleGenericException(
		exception: Error,
		_context: ArgumentsHost,
		_exceptionInfo: IExceptionInfo
	): Promise<void> {
		this.logger.error(`Generic exception: ${exception.message}`, LogContext.SYSTEM, {}, exception);
	}
}
