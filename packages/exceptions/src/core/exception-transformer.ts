/**
 * 异常转换器
 *
 * 负责将各种类型的异常转换为统一异常格式。
 * 支持从原始异常、应用层异常、HTTP异常等转换为IUnifiedException。
 *
 * @description 异常转换器实现类
 * @example
 * ```typescript
 * const transformer = new ExceptionTransformer();
 * const unifiedException = await transformer.transform(exception, context);
 * ```
 *
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { ArgumentsHost } from '@nestjs/common';
import type {
	IUnifiedException,
	IExceptionContext,
	ExceptionCategory,
	ExceptionLevel
} from '../interfaces/exception.interface';
import type { BaseApplicationException } from '@aiofix/core';
import { ExceptionContextManager } from './exception-context-manager';
import { ExceptionClassifier, IExceptionClassification } from './exception-classifier';

/**
 * 异常转换器
 */
@Injectable()
export class ExceptionTransformer {
	constructor(
		private readonly contextManager: ExceptionContextManager,
		private readonly classifier: ExceptionClassifier
	) {}

	/**
	 * 转换异常为统一异常格式
	 *
	 * @param exception - 原始异常对象
	 * @param host - NestJS执行上下文
	 * @returns 统一异常对象
	 */
	async transform(exception: unknown, host: ArgumentsHost): Promise<IUnifiedException> {
		try {
			// 提取异常上下文
			const context = await this.contextManager.extractContext(host);

			// 分类异常
			const classification = await this.classifier.classify(exception, context);

			// 构建统一异常
			return this.buildUnifiedException(exception, context, classification);
		} catch {
			// 转换失败时的降级处理
			return this.buildFallbackUnifiedException(exception, host);
		}
	}

	/**
	 * 构建统一异常对象
	 *
	 * @param exception - 原始异常
	 * @param context - 异常上下文
	 * @param classification - 异常分类结果
	 * @returns 统一异常对象
	 */
	private buildUnifiedException(
		exception: unknown,
		context: IExceptionContext,
		classification: IExceptionClassification
	): IUnifiedException {
		const exceptionId = uuidv4();
		const occurredAt = new Date();

		return {
			id: exceptionId,
			category: classification.category,
			level: classification.level,
			message: this.extractMessage(exception),
			code: classification.code,
			context: {
				...context,
				id: exceptionId,
				occurredAt
			},
			originalError: this.extractOriginalError(exception),
			occurredAt,

			toErrorResponse: (requestId: string) => this.buildErrorResponse(exception, classification, requestId),
			getUserFriendlyMessage: () => classification.userFriendlyMessage,
			getRecoveryAdvice: () => classification.recoveryAdvice,
			shouldNotify: () => classification.shouldNotify,
			shouldLog: () => classification.shouldLog
		};
	}

	/**
	 * 构建降级统一异常对象
	 *
	 * @param exception - 原始异常
	 * @param host - 执行上下文
	 * @returns 降级统一异常对象
	 */
	private buildFallbackUnifiedException(exception: unknown, _host: ArgumentsHost): IUnifiedException {
		const exceptionId = uuidv4();
		const occurredAt = new Date();
		const message = this.extractMessage(exception);

		return {
			id: exceptionId,
			category: ExceptionCategory.APPLICATION,
			level: ExceptionLevel.ERROR,
			message,
			code: 'TRANSFORM_ERROR',
			context: {
				id: exceptionId,
				occurredAt,
				source: 'SYSTEM',
				customData: {
					transformError: true,
					originalException: exception
				}
			},
			originalError: this.extractOriginalError(exception),
			occurredAt,

			toErrorResponse: (requestId: string) => ({
				type: 'about:blank',
				title: 'Internal Server Error',
				status: 500,
				detail: 'An internal server error occurred',
				instance: requestId,
				timestamp: occurredAt.toISOString()
			}),
			getUserFriendlyMessage: () => '系统发生未知错误，请稍后重试',
			getRecoveryAdvice: () => '请联系系统管理员或稍后重试',
			shouldNotify: () => true,
			shouldLog: () => true
		};
	}

	/**
	 * 提取异常消息
	 *
	 * @param exception - 异常对象
	 * @returns 异常消息
	 */
	private extractMessage(exception: unknown): string {
		if (exception instanceof Error) {
			return exception.message;
		}

		if (typeof exception === 'string') {
			return exception;
		}

		if (exception && typeof exception === 'object') {
			if ('message' in exception) {
				return String((exception as any).message);
			}

			if ('error' in exception) {
				return String((exception as any).error);
			}
		}

		return 'Unknown error occurred';
	}

	/**
	 * 提取原始错误对象
	 *
	 * @param exception - 异常对象
	 * @returns 原始错误对象
	 */
	private extractOriginalError(exception: unknown): Error | undefined {
		if (exception instanceof Error) {
			return exception;
		}

		if (exception && typeof exception === 'object' && 'error' in exception) {
			const error = (exception as any).error;
			if (error instanceof Error) {
				return error;
			}
		}

		return undefined;
	}

	/**
	 * 构建错误响应对象
	 *
	 * @param exception - 原始异常
	 * @param classification - 异常分类结果
	 * @param requestId - 请求ID
	 * @returns 错误响应对象
	 */
	private buildErrorResponse(
		exception: unknown,
		classification: IExceptionClassification,
		requestId: string
	): Record<string, unknown> {
		const baseResponse = {
			type: 'about:blank',
			title: this.getErrorTitle(classification.category, classification.level),
			status: this.getHttpStatus(classification.category, classification.level),
			detail: classification.userFriendlyMessage,
			instance: requestId,
			timestamp: new Date().toISOString(),
			code: classification.code
		};

		// 根据异常类型添加特定字段
		if (this.isApplicationException(exception)) {
			const appException = exception as BaseApplicationException;
			return {
				...baseResponse,
				errorCode: appException.errorCode,
				errorType: appException.errorType,
				severity: appException.severity,
				context: appException.context,
				recoveryStrategy: appException.recoveryStrategy
			};
		}

		if (this.isHttpException(exception)) {
			const httpException = exception as any;
			return {
				...baseResponse,
				status: httpException.status,
				response: httpException.response
			};
		}

		if (this.isValidationException(exception)) {
			return {
				...baseResponse,
				validationErrors: this.extractValidationErrors(exception)
			};
		}

		return baseResponse;
	}

	/**
	 * 获取错误标题
	 */
	private getErrorTitle(category: ExceptionCategory, level: ExceptionLevel): string {
		const titles: Record<string, Record<string, string>> = {
			[ExceptionCategory.HTTP]: {
				[ExceptionLevel.INFO]: 'Information',
				[ExceptionLevel.WARN]: 'Client Error',
				[ExceptionLevel.ERROR]: 'Server Error',
				[ExceptionLevel.FATAL]: 'Critical Error'
			},
			[ExceptionCategory.APPLICATION]: {
				[ExceptionLevel.INFO]: 'Application Information',
				[ExceptionLevel.WARN]: 'Application Warning',
				[ExceptionLevel.ERROR]: 'Application Error',
				[ExceptionLevel.FATAL]: 'Application Critical Error'
			},
			[ExceptionCategory.VALIDATION]: {
				[ExceptionLevel.INFO]: 'Validation Information',
				[ExceptionLevel.WARN]: 'Validation Warning',
				[ExceptionLevel.ERROR]: 'Validation Error',
				[ExceptionLevel.FATAL]: 'Validation Critical Error'
			},
			[ExceptionCategory.INFRASTRUCTURE]: {
				[ExceptionLevel.INFO]: 'Infrastructure Information',
				[ExceptionLevel.WARN]: 'Infrastructure Warning',
				[ExceptionLevel.ERROR]: 'Infrastructure Error',
				[ExceptionLevel.FATAL]: 'Infrastructure Critical Error'
			},
			[ExceptionCategory.EXTERNAL]: {
				[ExceptionLevel.INFO]: 'External Service Information',
				[ExceptionLevel.WARN]: 'External Service Warning',
				[ExceptionLevel.ERROR]: 'External Service Error',
				[ExceptionLevel.FATAL]: 'External Service Critical Error'
			}
		};

		return titles[category]?.[level] || 'Error';
	}

	/**
	 * 获取HTTP状态码
	 */
	private getHttpStatus(category: ExceptionCategory, level: ExceptionLevel): number {
		if (category === ExceptionCategory.HTTP) {
			switch (level) {
				case ExceptionLevel.INFO:
					return 200;
				case ExceptionLevel.WARN:
					return 400;
				case ExceptionLevel.ERROR:
					return 500;
				case ExceptionLevel.FATAL:
					return 503;
			}
		}

		if (category === ExceptionCategory.VALIDATION) {
			return 422;
		}

		if (category === ExceptionCategory.APPLICATION) {
			switch (level) {
				case ExceptionLevel.INFO:
					return 200;
				case ExceptionLevel.WARN:
					return 400;
				case ExceptionLevel.ERROR:
					return 500;
				case ExceptionLevel.FATAL:
					return 503;
			}
		}

		if (category === ExceptionCategory.INFRASTRUCTURE || category === ExceptionCategory.EXTERNAL) {
			return 503;
		}

		return 500;
	}

	/**
	 * 检查是否为应用层异常
	 */
	private isApplicationException(exception: unknown): boolean {
		return exception instanceof BaseApplicationException;
	}

	/**
	 * 检查是否为HTTP异常
	 */
	private isHttpException(exception: unknown): boolean {
		return exception && typeof exception === 'object' && 'status' in exception && 'response' in exception;
	}

	/**
	 * 检查是否为验证异常
	 */
	private isValidationException(exception: unknown): boolean {
		return (
			exception &&
			typeof exception === 'object' &&
			'message' in exception &&
			typeof (exception as any).message === 'string' &&
			((exception as any).message.includes('validation') || (exception as any).message.includes('invalid'))
		);
	}

	/**
	 * 提取验证错误
	 */
	private extractValidationErrors(exception: unknown): any[] {
		if (exception && typeof exception === 'object' && 'errors' in exception) {
			return (exception as any).errors || [];
		}

		return [];
	}
}
