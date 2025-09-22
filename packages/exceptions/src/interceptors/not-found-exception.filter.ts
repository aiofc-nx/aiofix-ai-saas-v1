import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, NotFoundException } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ErrorResponse } from '../vo/error-response.dto';

/**
 * 覆盖默认未找到异常过滤器
 *
 * 捕获NestJS默认的NotFoundException并转换为统一的错误响应格式。
 *
 * @description 处理NestJS内置NotFoundException的过滤器
 *
 * ## 业务规则
 *
 * ### 异常处理规则
 * - 捕获NestJS的NotFoundException
 * - 转换为RFC7807标准格式
 * - 提供统一的404错误响应
 *
 * @example
 * ```typescript
 * // 在模块中注册
 * app.useGlobalFilters(new OverrideDefaultNotFoundFilter(httpAdapterHost));
 * ```
 *
 * @since 1.0.0
 */
@Catch(NotFoundException)
export class OverrideDefaultNotFoundFilter implements ExceptionFilter {
	constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

	/**
	 * 捕获并处理NotFoundException
	 *
	 * @param exception - 捕获的NotFoundException实例
	 * @param host - 执行上下文宿主
	 */
	catch(exception: NotFoundException, host: ArgumentsHost): void {
		// 在某些情况下，httpAdapter在构造方法中可能不可用，
		// 因此我们应该在这里解析它
		const { httpAdapter } = this.httpAdapterHost;

		const ctx = host.switchToHttp();
		const request = ctx.getRequest();

		const requestId = request.id || request.headers?.['x-request-id'] || 'unknown';
		const response = {
			type: 'https://aiofix.ai/docs/errors',
			title: 'Not Found',
			detail: 'The requested resource could not be found.',
			status: HttpStatus.NOT_FOUND,
			instance: requestId
		} satisfies ErrorResponse;

		httpAdapter.reply(ctx.getResponse(), response, response.status);
	}
}
