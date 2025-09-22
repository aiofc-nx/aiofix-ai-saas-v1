import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { HttpAdapterHost } from '@nestjs/core';
import { AbstractHttpException } from '../exceptions/abstract-http.exception';

/**
 * HTTP异常过滤器
 *
 * 捕获和处理继承自AbstractHttpException的异常，
 * 将其转换为标准的HTTP响应格式。
 *
 * @description 处理自定义HTTP异常的过滤器
 *
 * ## 业务规则
 *
 * ### 异常处理规则
 * - 捕获所有AbstractHttpException类型的异常
 * - 自动设置预定义的HTTP响应头
 * - 根据状态码进行不同级别的日志记录
 * - 生成符合RFC7807标准的错误响应
 *
 * ### 日志记录规则
 * - 500+错误使用error级别日志
 * - 其他错误使用log级别日志
 * - 包含完整的异常上下文信息
 *
 * @example
 * ```typescript
 * // 在模块中注册
 * app.useGlobalFilters(new HttpExceptionFilter(httpAdapterHost));
 * ```
 *
 * @since 1.0.0
 */
@Catch(AbstractHttpException)
export class HttpExceptionFilter implements ExceptionFilter {
	private readonly logger: Logger = new Logger(HttpExceptionFilter.name);

	constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

	/**
	 * 捕获并处理HTTP异常
	 *
	 * @param exception - 捕获的异常实例
	 * @param host - 执行上下文宿主
	 */
	catch(exception: AbstractHttpException, host: ArgumentsHost): void {
		// 在某些情况下，httpAdapter在构造方法中可能不可用，
		// 因此我们应该在这里解析它
		const { httpAdapter } = this.httpAdapterHost;

		const ctx = host.switchToHttp();
		const request = ctx.getRequest();

		// 设置预定义的响应头
		this.presetHeaders(exception, ctx);

		// 根据状态码记录不同级别的日志
		if (exception.status > 499) {
			this.logger.error(
				{
					err: exception,
					requestId: request.id,
					url: request.url,
					method: request.method
				},
				'Internal server error. Require immediate attention!'
			);
		} else {
			this.logger.log(
				{
					err: exception,
					requestId: request.id,
					url: request.url,
					method: request.method
				},
				`Exception happened with status ${exception.status}`
			);
		}

		// 生成标准错误响应
		const requestId = request.id || request.headers?.['x-request-id'] || 'unknown';
		const response = exception.toErrorResponse(requestId);

		httpAdapter.reply(ctx.getResponse(), response, response.status);
	}

	/**
	 * 设置预定义的HTTP响应头
	 *
	 * 警告：这是一个非纯函数，会修改响应对象的头部
	 *
	 * @param exception - 异常实例
	 * @param ctx - HTTP上下文
	 * @private
	 */
	private presetHeaders(exception: AbstractHttpException, ctx: HttpArgumentsHost): void {
		for (const [key, value] of Object.entries(exception.getPresetHeadersValues())) {
			ctx.getResponse().header(key, value);
		}
	}
}
