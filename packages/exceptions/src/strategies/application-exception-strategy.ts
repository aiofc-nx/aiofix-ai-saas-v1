/**
 * 应用层异常处理策略
 *
 * 专门处理应用层业务异常，包括：
 * - 用例验证异常
 * - 用例执行异常
 * - 权限拒绝异常
 * - 资源未找到异常
 * - 并发冲突异常
 * - 外部服务异常
 *
 * @description 应用层异常处理策略实现
 * @since 2.0.0
 */

import { BaseExceptionStrategy } from './base-exception-strategy';
import {
	IUnifiedException,
	IExceptionHandlingResult,
	ExceptionHandlingStrategy,
	ExceptionCategory
} from '../interfaces';

/**
 * 应用层异常处理策略
 *
 * 处理所有应用层业务异常，包括：
 * - 业务规则验证异常
 * - 用例执行异常
 * - 权限和授权异常
 * - 资源访问异常
 * - 并发控制异常
 * - 外部服务集成异常
 *
 * ## 业务规则
 *
 * ### 异常分类规则
 * - 只处理category为'APPLICATION'的异常
 * - 支持所有应用层异常类型
 * - 自动识别异常严重程度
 *
 * ### 处理规则
 * - 业务异常转换为用户友好的消息
 * - 提供具体的恢复建议
 * - 记录详细的业务上下文
 * - 支持异常的重试机制
 *
 * ### 安全规则
 * - 敏感业务信息不暴露
 * - 内部错误详情仅记录在日志中
 * - 支持业务异常的审计追踪
 * - 提供异常统计和分析
 *
 * @example
 * ```typescript
 * const strategy = new ApplicationExceptionStrategy();
 *
 * const exception: IUnifiedException = {
 *   id: 'exc-002',
 *   message: 'User not found',
 *   category: 'APPLICATION',
 *   level: 'ERROR',
 *   code: 'USER_NOT_FOUND',
 *   // ... 其他属性
 * };
 *
 * const result = await strategy.handle(exception);
 * // result.response 包含业务异常的处理结果
 * ```
 *
 * @since 2.0.0
 */
export class ApplicationExceptionStrategy extends BaseExceptionStrategy {
	/**
	 * 构造函数
	 */
	constructor() {
		super('application-exception-strategy', ExceptionHandlingStrategy.APPLICATION, 20);
	}

	/**
	 * 判断是否可以处理应用层异常
	 *
	 * @param exception 待处理的异常
	 * @returns 是否可以处理
	 */
	public async canHandle(exception: IUnifiedException): Promise<boolean> {
		return exception.category === ExceptionCategory.APPLICATION;
	}

	/**
	 * 处理应用层异常
	 *
	 * @param exception 待处理的异常
	 * @returns 处理结果
	 */
	public async handle(exception: IUnifiedException): Promise<IExceptionHandlingResult> {
		const startTime = Date.now();

		try {
			if (!this.enabled) {
				return this.createResult(false, false, null, 'Strategy is disabled');
			}

			// 验证异常类型
			if (!(await this.canHandle(exception))) {
				return this.createResult(false, false, null, 'Cannot handle this exception type');
			}

			// 构建应用层异常响应
			const response = this.buildApplicationExceptionResponse(exception);

			// 更新统计信息
			const processingTime = Date.now() - startTime;
			this.updateStats(true, processingTime);

			return this.createResult(true, true, response);
		} catch (error) {
			const processingTime = Date.now() - startTime;
			this.updateStats(false, processingTime);

			return this.createResult(
				false,
				false,
				null,
				`Application strategy processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * 构建应用层异常响应
	 *
	 * @param exception 异常信息
	 * @returns 应用层异常响应
	 */
	private buildApplicationExceptionResponse(exception: IUnifiedException): any {
		const response: any = {
			errorType: 'APPLICATION_ERROR',
			errorCode: exception.code || 'UNKNOWN_APPLICATION_ERROR',
			message: this.getUserFriendlyMessage(exception),
			severity: exception.level,
			timestamp: new Date().toISOString()
		};

		// 添加业务上下文信息
		if (exception.context) {
			response.context = {
				tenantId: exception.context.tenantId,
				userId: exception.context.userId,
				organizationId: exception.context.organizationId,
				departmentId: exception.context.departmentId,
				requestId: exception.context.requestId
			};
		}

		// 添加错误详情
		if (exception.details) {
			response.details = exception.details;
		}

		// 添加恢复建议
		if (exception.recoveryAdvice) {
			response.recoveryAdvice = exception.recoveryAdvice;
		}

		// 添加追踪信息
		if (exception.traceId) {
			response.traceId = exception.traceId;
		}

		// 添加重试信息
		if (exception.retryable) {
			response.retryable = true;
			if (exception.retryAfter) {
				response.retryAfter = exception.retryAfter;
			}
		}

		return response;
	}

	/**
	 * 获取用户友好的错误消息
	 *
	 * @param exception 异常信息
	 * @returns 用户友好的消息
	 */
	private getUserFriendlyMessage(exception: IUnifiedException): string {
		// 根据错误代码返回用户友好的消息
		const friendlyMessages: Record<string, string> = {
			USER_NOT_FOUND: '用户不存在或已被删除',
			PERMISSION_DENIED: '您没有权限执行此操作',
			RESOURCE_NOT_FOUND: '请求的资源不存在',
			VALIDATION_FAILED: '输入数据验证失败',
			CONCURRENCY_CONFLICT: '数据已被其他用户修改，请刷新后重试',
			EXTERNAL_SERVICE_ERROR: '外部服务暂时不可用，请稍后重试',
			BUSINESS_RULE_VIOLATION: '操作违反了业务规则',
			QUOTA_EXCEEDED: '已达到使用配额限制',
			ACCOUNT_LOCKED: '账户已被锁定，请联系管理员',
			INVALID_OPERATION: '无效的操作请求'
		};

		return friendlyMessages[exception.code || ''] || exception.message || '发生未知错误';
	}
}
