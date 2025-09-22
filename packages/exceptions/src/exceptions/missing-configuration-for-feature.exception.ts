import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from './abstract-http.exception';

/**
 * 缺少功能配置异常
 *
 * 当请求的功能缺少必要的配置时抛出此异常。
 * 遵循HTTP 404状态码标准。
 *
 * @description 功能配置缺失的404异常，包含功能名称信息
 *
 * ## 业务规则
 *
 * ### 使用场景
 * - 功能开关未配置
 * - 缺少必要的配置参数
 * - 第三方服务配置缺失
 *
 * ### 数据结构
 * - 包含功能名称
 * - 支持模板参数替换
 *
 * @example
 * ```typescript
 * throw new MissingConfigurationForFeatureException(
 *   'Email Service',
 *   'EMAIL_CONFIG_MISSING'
 * );
 * ```
 *
 * @since 1.0.0
 */
export class MissingConfigurationForFeatureException extends AbstractHttpException<{ featureName: string }> {
	constructor(featureName: string, errorCode?: string, rootCause?: unknown) {
		super(
			'Configuration Missing',
			'Configuration for feature "{featureName}" is missing or incomplete.',
			HttpStatus.NOT_FOUND,
			{ featureName },
			errorCode,
			rootCause
		);
	}
}
