import { ArgumentsHost, Catch, ExceptionFilter, Logger, ServiceUnavailableException } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ErrorResponse } from '../vo/error-response.dto';

/**
 * 通用异常过滤器
 *
 * 捕获所有未被其他过滤器处理的异常，
 * 作为异常处理的最后一道防线。
 *
 * @description 处理所有未知异常的兜底过滤器
 *
 * ## 业务规则
 *
 * ### 异常处理规则
 * - 捕获所有类型的异常
 * - 特殊处理ServiceUnavailableException（用于健康检查）
 * - 生成统一的500错误响应
 * - 记录详细的错误日志用于问题追踪
 *
 * ### 安全考虑
 * - 不暴露内部错误详情给客户端
 * - 统一的错误消息避免信息泄露
 * - 完整的错误日志便于问题诊断
 *
 * @example
 * ```typescript
 * // 在模块中注册（应该是第一个注册的过滤器）
 * app.useGlobalFilters(new AnyExceptionFilter(httpAdapterHost));
 * ```
 *
 * @since 1.0.0
 */
@Catch()
export class AnyExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(AnyExceptionFilter.name);

	constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

	/**
	 * 捕获并处理任意异常
	 *
	 * @param exception - 捕获的异常（任意类型）
	 * @param host - 执行上下文宿主
	 */
	catch(exception: unknown, host: ArgumentsHost): void {
		// 在某些情况下，httpAdapter在构造方法中可能不可用，
		// 因此我们应该在这里解析它
		const { httpAdapter } = this.httpAdapterHost;

		const ctx = host.switchToHttp();
		const request = ctx.getRequest();

		// 特殊处理ServiceUnavailableException（健康检查端点需要）
		if (exception instanceof ServiceUnavailableException) {
			httpAdapter.reply(ctx.getResponse(), exception.getResponse(), 503);
			return;
		}

		// 生成标准的500错误响应
		const requestId = request.id || request.headers?.['x-request-id'] || 'unknown';
		const response = {
			type: 'https://aiofix.ai/docs/errors',
			title: 'Internal Server Error',
			detail: 'An unexpected error occurred. We have been notified and are working to resolve it.',
			status: 500,
			instance: requestId
		} satisfies ErrorResponse;

		// 记录详细的错误信息
		this.logger.error(
			{
				err: exception,
				requestId,
				url: request.url,
				method: request.method,
				userAgent: request.headers?.['user-agent'],
				ip: request.ip || request.connection?.remoteAddress
			},
			'Unexpected error occurred - requires immediate attention!'
		);

		httpAdapter.reply(ctx.getResponse(), response, response.status);
	}
}
