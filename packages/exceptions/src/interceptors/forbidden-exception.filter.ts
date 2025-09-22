import { ArgumentsHost, Catch, ExceptionFilter, ForbiddenException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ErrorResponse } from '../vo/error-response.dto';

/**
 * 覆盖默认禁止访问异常过滤器
 *
 * 捕获NestJS默认的ForbiddenException并转换为统一的错误响应格式。
 *
 * @description 处理NestJS内置ForbiddenException的过滤器
 *
 * ## 业务规则
 *
 * ### 异常处理规则
 * - 捕获NestJS的ForbiddenException
 * - 转换为RFC7807标准格式
 * - 提供统一的403错误响应
 *
 * @example
 * ```typescript
 * // 在模块中注册
 * app.useGlobalFilters(new OverrideDefaultForbiddenExceptionFilter(httpAdapterHost));
 * ```
 *
 * @since 1.0.0
 */
@Catch(ForbiddenException)
export class OverrideDefaultForbiddenExceptionFilter implements ExceptionFilter {
	constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

	/**
	 * 捕获并处理ForbiddenException
	 *
	 * @param exception - 捕获的ForbiddenException实例
	 * @param host - 执行上下文宿主
	 */
	catch(exception: ForbiddenException, host: ArgumentsHost): void {
		// 在某些情况下，httpAdapter在构造方法中可能不可用，
		// 因此我们应该在这里解析它
		const { httpAdapter } = this.httpAdapterHost;

		const ctx = host.switchToHttp();
		const request = ctx.getRequest();

		const requestId = request.id || request.headers?.['x-request-id'] || 'unknown';
		const response = {
			type: 'https://aiofix.ai/docs/errors',
			title: 'Forbidden',
			detail: 'Access to this resource is forbidden. Please check your permissions.',
			status: HttpStatus.FORBIDDEN,
			instance: requestId
		} satisfies ErrorResponse;

		httpAdapter.reply(ctx.getResponse(), response, response.status);
	}
}
