import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { ErrorResponse } from '../vo/error-response.dto';
import { GeneralBadRequestException } from '../exceptions/general-bad-request.exception';

/**
 * 默认响应体格式化器
 *
 * 将验证异常转换为标准的错误响应格式。
 *
 * @description 用于格式化验证错误响应的工具函数
 *
 * ## 业务规则
 *
 * ### 格式化规则
 * - 优先使用GeneralBadRequestException的格式
 * - 为其他BadRequestException提供统一格式
 * - 包含详细的验证错误信息
 *
 * @param host - 执行上下文宿主
 * @param exc - 捕获的异常实例
 * @param formattedErrors - 格式化后的错误信息
 * @returns 标准化的错误响应
 *
 * @example
 * ```typescript
 * const response = responseBodyFormatter(host, exception, validationErrors);
 * ```
 *
 * @since 1.0.0
 */
export function responseBodyFormatter(
	host: ArgumentsHost,
	exc: BadRequestException | GeneralBadRequestException,
	formattedErrors: object
): Record<string, unknown> {
	const request = host.switchToHttp().getRequest();
	const instance = request.requestId || request.id || request.headers?.['x-request-id'] || 'unknown';

	if (exc instanceof GeneralBadRequestException) {
		return {
			...exc.toErrorResponse(instance),
			data: formattedErrors
		} satisfies ErrorResponse;
	}

	return {
		type: 'https://aiofix.ai/docs/errors',
		title: 'Bad Request',
		detail: 'Validation failed for the request body.',
		status: exc.getStatus(),
		instance,
		data: formattedErrors
	} satisfies ErrorResponse;
}
