import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from './abstract-http.exception';

/**
 * 通用未授权异常
 *
 * 当用户未提供有效的身份验证凭据时抛出此异常。
 * 遵循HTTP 401状态码标准。
 *
 * @description 通用的401异常，用于身份验证失败的场景
 *
 * @example
 * ```typescript
 * throw new GeneralUnauthorizedException('INVALID_TOKEN');
 * ```
 *
 * @since 1.0.0
 */
export class GeneralUnauthorizedException extends AbstractHttpException {
	constructor(errorCode?: string, rootCause?: unknown) {
		super(
			'Unauthorized',
			'Authentication is required to access this resource.',
			HttpStatus.UNAUTHORIZED,
			undefined,
			errorCode,
			rootCause
		);
	}

	override getPresetHeadersValues(): Record<string, string> {
		return {
			'WWW-Authenticate': 'Bearer realm="api"'
		};
	}
}
