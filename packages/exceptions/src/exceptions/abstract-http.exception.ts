import { ErrorResponse } from '../vo/error-response.dto';

/**
 * 抽象HTTP异常基类
 *
 * 提供统一的异常处理机制，遵循RFC7807标准。
 * 支持自定义错误数据、错误代码和根本原因追踪。
 *
 * @description HTTP异常的基础抽象类，所有业务异常都应继承此类
 *
 * ## 业务规则
 *
 * ### 异常信息规则
 * - 标题应简洁明了，描述错误类型
 * - 详细信息应提供足够的上下文帮助用户理解问题
 * - 状态码必须符合HTTP标准
 * - 错误代码应唯一标识特定的错误类型
 *
 * ### 数据附加规则
 * - 可以附加额外数据帮助客户端处理错误
 * - 数据应该是可序列化的对象
 * - 敏感信息不应包含在错误响应中
 *
 * @example
 * ```typescript
 * export class UserNotFoundError extends AbstractHttpException<{userId: string}> {
 *   constructor(userId: string) {
 *     super(
 *       'User Not Found',
 *       `User with ID ${userId} was not found`,
 *       404,
 *       { userId },
 *       'USER_NOT_FOUND'
 *     );
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export class AbstractHttpException<ADDITIONAL_DATA extends object = object> {
	constructor(
		public title: string,
		public detail: string,
		public status: number,
		public data?: ADDITIONAL_DATA | ADDITIONAL_DATA[],
		public errorCode?: string,
		public rootCause?: unknown
	) {}

	/**
	 * 将异常转换为标准的错误响应格式
	 *
	 * 遵循RFC7807标准，生成统一的错误响应结构。
	 * 支持动态参数替换和请求追踪。
	 *
	 * @param requestId - 请求唯一标识符，用于问题追踪
	 * @returns 标准化的错误响应对象
	 *
	 * @example
	 * ```typescript
	 * const exception = new UserNotFoundError('123');
	 * const response = exception.toErrorResponse('req-456');
	 * // 返回: { type: '...', title: 'User Not Found', ... }
	 * ```
	 */
	toErrorResponse(requestId: string): ErrorResponse {
		// 支持动态参数替换
		let processedDetail = this.detail;
		if (this.data && typeof this.data === 'object') {
			// 简单的模板替换 {key} -> value
			processedDetail = this.detail.replace(/\{(\w+)\}/g, (match, key) => {
				if (Array.isArray(this.data)) {
					return match; // 数组类型不支持模板替换
				}
				const value = (this.data as Record<string, unknown>)[key];
				return value !== undefined ? String(value) : match;
			});
		}

		return {
			// TODO: 从配置中获取文档链接
			type: 'https://aiofix.ai/docs/errors',
			title: this.title,
			detail: processedDetail,
			status: this.status,
			instance: requestId,
			errorCode: this.errorCode,
			...(this.data && { data: this.data })
		} satisfies ErrorResponse;
	}

	/**
	 * 获取预设的HTTP响应头
	 *
	 * 允许异常类定义特定的HTTP响应头，如缓存控制、CORS等。
	 * 子类可以重写此方法来添加特定的响应头。
	 *
	 * @returns HTTP响应头键值对
	 *
	 * @example
	 * ```typescript
	 * class AuthError extends AbstractHttpException {
	 *   getPresetHeadersValues() {
	 *     return {
	 *       'WWW-Authenticate': 'Bearer realm="api"'
	 *     };
	 *   }
	 * }
	 * ```
	 */
	getPresetHeadersValues(): Record<string, string> {
		return {};
	}
}
