import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from './abstract-http.exception';

/**
 * 通用未找到异常
 *
 * 当请求的资源不存在或用户没有访问权限时抛出此异常。
 * 遵循HTTP 404状态码标准。
 *
 * @description 通用的404异常，用于资源不存在的场景
 *
 * ## 业务规则
 *
 * ### 使用场景
 * - 请求的资源不存在
 * - 用户没有访问权限（出于安全考虑不暴露资源存在性）
 * - API端点不存在
 *
 * ### 安全考虑
 * - 不应暴露敏感信息
 * - 统一的错误消息避免信息泄露
 *
 * @example
 * ```typescript
 * // 基本使用
 * throw new GeneralNotFoundException('RESOURCE_NOT_FOUND');
 *
 * // 带根本原因
 * throw new GeneralNotFoundException('USER_NOT_FOUND', originalError);
 * ```
 *
 * @since 1.0.0
 */
export class GeneralNotFoundException extends AbstractHttpException {
	constructor(errorCode?: string, rootCause?: unknown) {
		super(
			'Not Found',
			'The requested resource could not be found. It may not exist or you may not have access to it.',
			HttpStatus.NOT_FOUND,
			undefined,
			errorCode,
			rootCause
		);
	}
}
