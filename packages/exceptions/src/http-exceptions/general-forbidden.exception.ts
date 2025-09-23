import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from './abstract-http.exception';

/**
 * 通用禁止访问异常
 *
 * 当用户没有权限访问请求的资源时抛出此异常。
 * 遵循HTTP 403状态码标准。
 *
 * @description 通用的403异常，用于权限不足的场景
 *
 * @example
 * ```typescript
 * throw new GeneralForbiddenException('ACCESS_DENIED');
 * ```
 *
 * @since 1.0.0
 */
export class GeneralForbiddenException extends AbstractHttpException {
	constructor(errorCode?: string, rootCause?: unknown) {
		super(
			'Access Denied',
			'You do not have permission to access this resource.',
			HttpStatus.FORBIDDEN,
			undefined,
			errorCode,
			rootCause
		);
	}
}
