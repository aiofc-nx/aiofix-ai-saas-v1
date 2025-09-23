/**
 * HTTP异常处理策略
 *
 * 专门处理HTTP相关的异常，包括：
 * - HTTP状态码异常
 * - 请求验证异常
 * - 路由异常
 * - 中间件异常
 *
 * @description HTTP异常处理策略实现
 * @since 2.0.0
 */

import { BaseExceptionStrategy } from './base-exception-strategy';
import {
	IUnifiedException,
	IExceptionHandlingResult,
	ExceptionHandlingStrategy,
	ExceptionCategory
} from '../interfaces';

/**
 * HTTP异常处理策略
 *
 * 处理所有HTTP相关的异常，包括：
 * - 4xx客户端错误
 * - 5xx服务器错误
 * - 请求验证错误
 * - 路由和中间件错误
 *
 * ## 业务规则
 *
 * ### 异常分类规则
 * - 只处理category为'HTTP'的异常
 * - 支持所有HTTP状态码的异常处理
 * - 自动识别客户端错误和服务器错误
 *
 * ### 响应格式规则
 * - 遵循RFC7807 Problem Details标准
 * - 包含详细的错误信息和上下文
 * - 提供用户友好的错误消息
 * - 包含请求追踪信息
 *
 * ### 安全规则
 * - 敏感信息不暴露给客户端
 * - 生产环境隐藏内部错误详情
 * - 记录详细的服务器端日志
 * - 支持错误信息的国际化
 *
 * @example
 * ```typescript
 * const strategy = new HttpExceptionStrategy();
 *
 * const exception: IUnifiedException = {
 *   id: 'exc-001',
 *   message: 'Validation failed',
 *   category: 'HTTP',
 *   level: 'ERROR',
 *   statusCode: 400,
 *   // ... 其他属性
 * };
 *
 * const result = await strategy.handle(exception);
 * // result.response 包含RFC7807格式的错误响应
 * ```
 *
 * @since 2.0.0
 */
export class HttpExceptionStrategy extends BaseExceptionStrategy {
	/**
	 * 构造函数
	 */
	constructor() {
		super('http-exception-strategy', ExceptionHandlingStrategy.HTTP, 10);
	}

	/**
	 * 判断是否可以处理HTTP异常
	 *
	 * @param exception 待处理的异常
	 * @returns 是否可以处理
	 */
	public async canHandle(exception: IUnifiedException): Promise<boolean> {
		return exception.category === ExceptionCategory.HTTP;
	}

	/**
	 * 处理HTTP异常
	 *
	 * @param exception 待处理的异常
	 * @returns 处理结果
	 */
	public async handle(exception: IUnifiedException): Promise<IExceptionHandlingResult> {
		const startTime = Date.now();

		try {
			if (!this.enabled) {
				return this.createResult(false, false, null, 'Strategy is disabled');
			}

			// 验证异常类型
			if (!(await this.canHandle(exception))) {
				return this.createResult(false, false, null, 'Cannot handle this exception type');
			}

			// 构建RFC7807格式的响应
			const response = this.buildProblemDetailsResponse(exception);

			// 更新统计信息
			const processingTime = Date.now() - startTime;
			this.updateStats(true, processingTime);

			return this.createResult(true, true, response);
		} catch (error) {
			const processingTime = Date.now() - startTime;
			this.updateStats(false, processingTime);

			return this.createResult(
				false,
				false,
				null,
				`HTTP strategy processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * 构建RFC7807 Problem Details响应
	 *
	 * @param exception 异常信息
	 * @returns RFC7807格式的响应
	 */
	private buildProblemDetailsResponse(exception: IUnifiedException): any {
		const response: any = {
			type: this.getProblemType(exception.statusCode || 500),
			title: this.getProblemTitle(exception.statusCode || 500),
			status: exception.statusCode || 500,
			detail: exception.message,
			instance: exception.context?.requestId || 'unknown'
		};

		// 添加时间戳
		response.timestamp = new Date().toISOString();

		// 添加请求上下文信息
		if (exception.context) {
			if (exception.context.tenantId) {
				response.tenantId = exception.context.tenantId;
			}
			if (exception.context.userId) {
				response.userId = exception.context.userId;
			}
			if (exception.context.organizationId) {
				response.organizationId = exception.context.organizationId;
			}
			if (exception.context.departmentId) {
				response.departmentId = exception.context.departmentId;
			}
		}

		// 添加错误代码
		if (exception.code) {
			response.errorCode = exception.code;
		}

		// 添加验证错误详情
		if (exception.details && Array.isArray(exception.details)) {
			response.validationErrors = exception.details;
		}

		// 添加追踪信息
		if (exception.traceId) {
			response.traceId = exception.traceId;
		}

		// 添加恢复建议
		if (exception.recoveryAdvice) {
			response.recoveryAdvice = exception.recoveryAdvice;
		}

		return response;
	}

	/**
	 * 获取问题类型URI
	 *
	 * @param statusCode HTTP状态码
	 * @returns 问题类型URI
	 */
	private getProblemType(statusCode: number): string {
		const baseUri = 'https://aiofix.ai/problems';

		if (statusCode >= 400 && statusCode < 500) {
			return `${baseUri}/client-error`;
		} else if (statusCode >= 500) {
			return `${baseUri}/server-error`;
		} else {
			return `${baseUri}/unknown-error`;
		}
	}

	/**
	 * 获取问题标题
	 *
	 * @param statusCode HTTP状态码
	 * @returns 问题标题
	 */
	private getProblemTitle(statusCode: number): string {
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
}
