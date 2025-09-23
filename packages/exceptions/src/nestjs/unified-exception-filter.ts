/**
 * 统一异常过滤器
 *
 * 基于新的异常处理架构实现的NestJS全局异常过滤器。
 * 集成统一异常管理器、策略系统和Core模块错误总线。
 *
 * @description NestJS统一异常过滤器实现
 * @since 2.0.0
 */

import { Injectable, Logger, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { IUnifiedExceptionFilter, BaseException, IUnifiedException } from '../interfaces';
import { UnifiedExceptionManager } from '../core';
import { ExceptionStrategyManager } from '../strategies';
import { CoreErrorBusBridge } from '../bridges';

/**
 * 统一异常过滤器
 *
 * 提供全局异常处理能力，包括：
 * - 异常捕获和转换
 * - 统一异常管理
 * - 策略系统集成
 * - Core模块错误总线集成
 * - 多租户支持
 * - 监控和统计
 *
 * ## 业务规则
 *
 * ### 异常捕获规则
 * - 捕获所有未处理的异常
 * - 支持HTTP、WebSocket、RPC等不同上下文
 * - 自动提取请求上下文信息
 * - 生成唯一的异常ID和追踪ID
 *
 * ### 异常处理规则
 * - 使用统一异常管理器处理异常
 * - 应用策略系统进行异常分类和处理
 * - 发布异常到Core模块错误总线
 * - 记录详细的异常日志
 *
 * ### 响应规则
 * - 根据异常类型返回适当的HTTP状态码
 * - 遵循RFC7807 Problem Details标准
 * - 提供用户友好的错误消息
 * - 包含请求追踪信息
 *
 * @example
 * ```typescript
 * // 在main.ts中注册全局过滤器
 * app.useGlobalFilters(new UnifiedExceptionFilter());
 *
 * // 或者在模块中注册
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_FILTER,
 *       useClass: UnifiedExceptionFilter,
 *     },
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @since 2.0.0
 */
@Injectable()
export class UnifiedExceptionFilter implements IUnifiedExceptionFilter {
	private readonly logger = new Logger(UnifiedExceptionFilter.name);

	/**
	 * 过滤器名称
	 */
	public readonly name = 'UnifiedExceptionFilter';

	/**
	 * 过滤器优先级
	 */
	public readonly priority = 100;

	/**
	 * 构造函数
	 *
	 * @param exceptionManager 统一异常管理器
	 * @param strategyManager 策略管理器
	 * @param coreErrorBusBridge Core错误总线桥梁
	 */
	constructor(
		private readonly exceptionManager: UnifiedExceptionManager,
		private readonly strategyManager: ExceptionStrategyManager,
		private readonly coreErrorBusBridge: CoreErrorBusBridge
	) {}

	/**
	 * 检查是否应该捕获此异常
	 *
	 * @param exception 异常对象
	 * @param host 执行上下文
	 * @returns 如果应该捕获则返回 true，否则返回 false
	 */
	public shouldCatch(_exception: BaseException, _host: ArgumentsHost): boolean {
		// 默认捕获所有异常
		return true;
	}

	/**
	 * 转换异常为统一异常
	 *
	 * @param exception 原始异常
	 * @param host 执行上下文
	 * @returns 统一异常对象
	 */
	public async transformException(exception: BaseException, host: ArgumentsHost): Promise<IUnifiedException> {
		// 使用统一异常管理器处理异常
		await this.exceptionManager.handle(exception, host);
		// 返回一个基本的统一异常对象
		const context = this.extractContext(host);
		return {
			id: this.generateRequestId(),
			category: 'UNKNOWN' as any,
			level: 'ERROR' as any,
			message: exception instanceof Error ? exception.message : 'Unknown error',
			code: 'UNKNOWN_ERROR',
			context: {
				id: context.requestId || this.generateRequestId(),
				occurredAt: new Date(),
				...context
			} as any,
			originalError: exception instanceof Error ? exception : new Error('Unknown error'),
			occurredAt: new Date(),
			toErrorResponse: () => ({}),
			getUserFriendlyMessage: () => 'Unknown error',
			getRecoveryAdvice: () => 'Please contact support',
			shouldNotify: () => false,
			shouldLog: () => true
		};
	}

	/**
	 * 捕获异常
	 *
	 * @param exception 异常对象
	 * @param host 参数主机
	 */
	public async catch(exception: BaseException, host: ArgumentsHost): Promise<void> {
		const startTime = Date.now();

		try {
			// 转换异常为统一格式
			const unifiedException = await this.transformException(exception, host);

			// 发布到Core错误总线
			await this.coreErrorBusBridge.publishToCoreErrorBus(unifiedException, unifiedException.context);

			// 应用策略处理
			const results = await this.strategyManager.handleException(unifiedException as any);

			// 构建响应
			const response = this.buildResponse(unifiedException as any, results);

			// 发送响应
			await this.sendResponse(host, response);

			// 记录处理统计
			const processingTime = Date.now() - startTime;
			this.logger.debug(`Exception ${unifiedException.id} processed in ${processingTime}ms`);
		} catch (error) {
			this.logger.error('Failed to process exception in UnifiedExceptionFilter:', error);

			// 发送默认错误响应
			await this.sendDefaultErrorResponse(host, exception);
		}
	}

	/**
	 * 提取请求上下文
	 *
	 * @param host 参数主机
	 * @returns 请求上下文
	 */
	private extractContext(host: ArgumentsHost): Record<string, unknown> {
		const context: Record<string, unknown> = {
			timestamp: new Date(),
			requestId: this.generateRequestId(),
			traceId: this.generateTraceId()
		};

		// 根据上下文类型提取信息
		switch (host.getType()) {
			case 'http': {
				const httpContext = host.switchToHttp();
				const request = httpContext.getRequest();
				// const response = httpContext.getResponse(); // 暂时不需要使用

				context.type = 'HTTP';
				context.method = request.method;
				context.url = request.url;
				context.userAgent = request.headers['user-agent'];
				context.ip = request.ip || request.connection.remoteAddress;
				context.headers = request.headers;
				context.body = request.body;
				context.params = request.params;
				context.query = request.query;

				// 提取多租户信息
				context.tenantId = request.headers['x-tenant-id'] || request.tenantId;
				context.userId = request.headers['x-user-id'] || request.userId;
				context.organizationId = request.headers['x-organization-id'] || request.organizationId;
				context.departmentId = request.headers['x-department-id'] || request.departmentId;

				break;
			}

			case 'ws': {
				const wsContext = host.switchToWs();
				const client = wsContext.getClient();

				context.type = 'WEBSOCKET';
				context.clientId = client.id;
				context.data = wsContext.getData();

				// 提取多租户信息
				context.tenantId = client.tenantId;
				context.userId = client.userId;
				context.organizationId = client.organizationId;
				context.departmentId = client.departmentId;

				break;
			}

			case 'rpc': {
				const rpcContext = host.switchToRpc();
				const data = rpcContext.getData();

				context.type = 'RPC';
				context.data = data;

				// 提取多租户信息
				context.tenantId = data.tenantId;
				context.userId = data.userId;
				context.organizationId = data.organizationId;
				context.departmentId = data.departmentId;

				break;
			}

			default:
				context.type = 'UNKNOWN';
				break;
		}

		return context;
	}

	/**
	 * 构建响应
	 *
	 * @param exception 统一异常
	 * @param results 策略处理结果
	 * @returns 响应对象
	 */
	private buildResponse(exception: BaseException, results: unknown[]): Record<string, unknown> {
		// 查找成功的处理结果
		const successfulResult = results.find(
			(result) =>
				result && typeof result === 'object' && 'success' in result && (result as { success: boolean }).success
		);

		if (successfulResult && typeof successfulResult === 'object' && 'response' in successfulResult) {
			return (successfulResult as { response: Record<string, unknown> }).response;
		}

		// 如果没有成功的处理结果，构建默认响应
		return this.buildDefaultResponse(exception);
	}

	/**
	 * 构建默认响应
	 *
	 * @param exception 统一异常
	 * @returns 默认响应
	 */
	private buildDefaultResponse(exception: BaseException): Record<string, unknown> {
		const statusCode = this.getStatusCode(exception);

		return {
			type: 'https://aiofix.ai/problems/error',
			title: this.getTitle(statusCode),
			status: statusCode,
			detail: 'message' in exception ? String(exception.message) : 'An error occurred',
			instance: 'unknown',
			timestamp: new Date().toISOString()
		};
	}

	/**
	 * 获取HTTP状态码
	 *
	 * @param exception 异常对象
	 * @returns HTTP状态码
	 */
	private getStatusCode(exception: BaseException): number {
		if (exception instanceof HttpException) {
			return exception.getStatus();
		}

		if ('statusCode' in exception) {
			return (exception as { statusCode: number }).statusCode;
		}

		if ('status' in exception) {
			return (exception as { status: number }).status;
		}

		return HttpStatus.INTERNAL_SERVER_ERROR;
	}

	/**
	 * 获取错误标题
	 *
	 * @param statusCode HTTP状态码
	 * @returns 错误标题
	 */
	private getTitle(statusCode: number): string {
		const titles: Record<number, string> = {
			400: 'Bad Request',
			401: 'Unauthorized',
			403: 'Forbidden',
			404: 'Not Found',
			409: 'Conflict',
			422: 'Unprocessable Entity',
			429: 'Too Many Requests',
			500: 'Internal Server Error',
			502: 'Bad Gateway',
			503: 'Service Unavailable',
			504: 'Gateway Timeout'
		};

		return titles[statusCode] || 'Unknown Error';
	}

	/**
	 * 发送响应
	 *
	 * @param host 参数主机
	 * @param response 响应对象
	 */
	private async sendResponse(host: ArgumentsHost, response: Record<string, unknown>): Promise<void> {
		switch (host.getType()) {
			case 'http': {
				const httpContext = host.switchToHttp();
				const res = httpContext.getResponse();

				res.status(response.status || 500).json(response);
				break;
			}

			case 'ws': {
				const wsContext = host.switchToWs();
				const client = wsContext.getClient();

				client.emit('error', response);
				break;
			}

			case 'rpc':
				// RPC响应通常由框架处理
				break;
		}
	}

	/**
	 * 发送默认错误响应
	 *
	 * @param host 参数主机
	 * @param exception 原始异常
	 */
	private async sendDefaultErrorResponse(host: ArgumentsHost, _exception: BaseException): Promise<void> {
		const defaultResponse = {
			type: 'https://aiofix.ai/problems/error',
			title: 'Internal Server Error',
			status: 500,
			detail: 'An unexpected error occurred',
			timestamp: new Date().toISOString()
		};

		await this.sendResponse(host, defaultResponse);
	}

	/**
	 * 生成请求ID
	 *
	 * @returns 请求ID
	 */
	private generateRequestId(): string {
		return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * 生成追踪ID
	 *
	 * @returns 追踪ID
	 */
	private generateTraceId(): string {
		return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}
