import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from './abstract-http.exception';

/**
 * 内部服务不可用异常
 *
 * 当调用内部服务失败或服务不可用时抛出此异常。
 * 遵循HTTP 503状态码标准。
 *
 * @description 内部服务不可用的503异常，包含服务标识符信息
 *
 * ## 业务规则
 *
 * ### 使用场景
 * - 外部服务调用失败
 * - 第三方API不可用
 * - 内部微服务故障
 * - 数据库连接失败
 *
 * ### 数据结构
 * - 包含外部服务标识符
 * - 支持模板参数替换
 *
 * @example
 * ```typescript
 * throw new InternalServiceUnavailableHttpException(
 *   'payment-service',
 *   'PAYMENT_SERVICE_DOWN'
 * );
 * ```
 *
 * @since 1.0.0
 */
export class InternalServiceUnavailableHttpException extends AbstractHttpException<{
	externalServiceIdentifier?: string;
}> {
	constructor(externalServiceIdentifier?: string, errorCode?: string, rootCause?: unknown) {
		super(
			'Service Unavailable',
			externalServiceIdentifier
				? `External service "{externalServiceIdentifier}" is currently unavailable`
				: 'An external service is currently unavailable. Please try again later.',
			HttpStatus.SERVICE_UNAVAILABLE,
			{ externalServiceIdentifier },
			errorCode,
			rootCause
		);
	}
}
