import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from './abstract-http.exception';

/**
 * 通用内部服务器异常
 *
 * 当服务器内部发生不可预期的错误时抛出此异常。
 * 遵循HTTP 500状态码标准。
 *
 * @description 通用的500异常，用于内部服务器错误的场景
 *
 * @example
 * ```typescript
 * throw new GeneralInternalServerException('DATABASE_ERROR');
 * ```
 *
 * @since 1.0.0
 */
export class GeneralInternalServerException extends AbstractHttpException {
	constructor(errorCode?: string, rootCause?: unknown) {
		super(
			'Internal Server Error',
			'An internal server error occurred. Please try again later.',
			HttpStatus.INTERNAL_SERVER_ERROR,
			undefined,
			errorCode,
			rootCause
		);
	}
}
