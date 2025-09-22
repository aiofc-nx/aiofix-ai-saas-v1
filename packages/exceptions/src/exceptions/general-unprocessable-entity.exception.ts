import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from './abstract-http.exception';

/**
 * 通用不可处理实体异常
 *
 * 当请求格式正确但语义上无法处理时抛出此异常。
 * 遵循HTTP 422状态码标准。
 *
 * @description 通用的422异常，用于业务验证失败的场景
 *
 * @example
 * ```typescript
 * throw new GeneralUnprocessableEntityException(
 *   'Business rule validation failed',
 *   'BUSINESS_RULE_VIOLATION'
 * );
 * ```
 *
 * @since 1.0.0
 */
export class GeneralUnprocessableEntityException extends AbstractHttpException {
	constructor(detail?: string, errorCode?: string, rootCause?: unknown) {
		super(
			'Unprocessable Entity',
			detail ?? 'The request was well-formed but contains semantic errors.',
			HttpStatus.UNPROCESSABLE_ENTITY,
			undefined,
			errorCode,
			rootCause
		);
	}
}
