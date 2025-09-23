import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from './abstract-http.exception';

/**
 * 验证错误接口
 */
export interface ValidationError {
	field: string;
	message: string;
	value?: unknown;
	constraints?: Record<string, string>;
}

/**
 * 通用请求错误异常
 *
 * 当客户端请求格式不正确、缺少必要参数或验证失败时抛出此异常。
 * 遵循HTTP 400状态码标准。
 *
 * @description 通用的400异常，用于请求验证失败的场景
 *
 * ## 业务规则
 *
 * ### 使用场景
 * - 请求参数验证失败
 * - 请求格式不正确
 * - 缺少必要的请求头或参数
 * - 业务规则验证失败
 *
 * ### 错误信息结构
 * - 包含具体的验证错误信息
 * - 支持多个验证错误
 * - 提供字段级别的错误描述
 *
 * @example
 * ```typescript
 * // 单个验证错误
 * const error = { field: 'email', message: 'Invalid email format' };
 * throw new GeneralBadRequestException([error], 'VALIDATION_FAILED');
 *
 * // 多个验证错误
 * const errors = [
 *   { field: 'name', message: 'Name is required' },
 *   { field: 'age', message: 'Age must be positive' }
 * ];
 * throw new GeneralBadRequestException(errors, 'VALIDATION_FAILED');
 * ```
 *
 * @since 1.0.0
 */
export class GeneralBadRequestException extends AbstractHttpException<ValidationError[]> {
	constructor(errors: ValidationError | ValidationError[], errorCode?: string, rootCause?: unknown) {
		const errorArray = Array.isArray(errors) ? errors : [errors];
		const detail =
			errorArray.length === 1
				? `Validation failed: ${errorArray[0].message}`
				: `Validation failed with ${errorArray.length} errors`;

		super('Bad Request', detail, HttpStatus.BAD_REQUEST, errorArray, errorCode, rootCause);
	}
}
