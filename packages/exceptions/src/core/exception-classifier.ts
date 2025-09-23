/**
 * 异常分类器
 *
 * 负责对异常进行分类和级别判断，为异常处理策略提供决策依据。
 * 支持多种异常类型的自动识别和分类。
 *
 * @description 异常分类器实现类
 * @example
 * ```typescript
 * const classifier = new ExceptionClassifier();
 * const classification = await classifier.classify(exception);
 * ```
 *
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
// import type { Error } from '@nestjs/common';
import { ExceptionCategory, ExceptionLevel, IExceptionContext, BaseException } from '../interfaces/exception.interface';
// import type { BaseApplicationException, ApplicationExceptionType } from '@aiofix/core';

/**
 * 临时类型定义 - 等待Core模块集成
 */
export enum ApplicationExceptionType {
	VALIDATION = 'VALIDATION',
	AUTHORIZATION = 'AUTHORIZATION',
	RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
	CONCURRENCY = 'CONCURRENCY',
	EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
	BUSINESS_LOGIC = 'BUSINESS_LOGIC',
	INFRASTRUCTURE = 'INFRASTRUCTURE',
	CONFIGURATION = 'CONFIGURATION'
}

export abstract class BaseApplicationException extends Error {
	abstract readonly errorType: ApplicationExceptionType;
	abstract readonly errorCode: string;
	abstract readonly context: Record<string, unknown>;
	abstract readonly severity: string;
	abstract getUserFriendlyMessage(): string;
}

/**
 * 异常分类结果接口
 */
export interface IExceptionClassification {
	/**
	 * 异常分类
	 */
	category: ExceptionCategory;

	/**
	 * 异常级别
	 */
	level: ExceptionLevel;

	/**
	 * 异常代码
	 */
	code: string;

	/**
	 * 用户友好消息
	 */
	userFriendlyMessage: string;

	/**
	 * 恢复建议
	 */
	recoveryAdvice: string;

	/**
	 * 是否应该发送通知
	 */
	shouldNotify: boolean;

	/**
	 * 是否应该记录日志
	 */
	shouldLog: boolean;

	/**
	 * 分类置信度 (0-1)
	 */
	confidence: number;
}

/**
 * 异常分类器
 */
@Injectable()
export class ExceptionClassifier {
	/**
	 * 分类异常
	 *
	 * @param exception - 异常对象
	 * @param context - 异常上下文
	 * @returns 异常分类结果
	 */
	async classify(exception: BaseException, context: IExceptionContext): Promise<IExceptionClassification> {
		try {
			// 首先尝试识别已知的异常类型
			if (this.isApplicationException(exception)) {
				return this.classifyApplicationException(exception as unknown as BaseApplicationException, context);
			}

			if (this.isHttpException(exception)) {
				return this.classifyHttpException(exception, context);
			}

			if (this.isValidationException(exception)) {
				return this.classifyValidationException(exception, context);
			}

			if (this.isDatabaseException(exception)) {
				return this.classifyDatabaseException(exception, context);
			}

			if (this.isNetworkException(exception)) {
				return this.classifyNetworkException(exception, context);
			}

			// 默认分类
			return this.classifyGenericException(exception, context);
		} catch {
			// 分类失败时的降级处理
			return this.getDefaultClassification(exception, context);
		}
	}

	/**
	 * 检查是否为应用层异常
	 */
	private isApplicationException(exception: BaseException): boolean {
		return exception instanceof BaseApplicationException;
	}

	/**
	 * 检查是否为HTTP异常
	 */
	private isHttpException(exception: BaseException): boolean {
		return 'status' in exception && 'response' in exception && typeof exception.status === 'number';
	}

	/**
	 * 检查是否为验证异常
	 */
	private isValidationException(exception: BaseException): boolean {
		if ('message' in exception && typeof exception.message === 'string') {
			const message = exception.message;
			return message.includes('validation') || message.includes('invalid') || message.includes('required');
		}
		return false;
	}

	/**
	 * 检查是否为数据库异常
	 */
	private isDatabaseException(exception: BaseException): boolean {
		const message = this.getExceptionMessage(exception);
		return (
			message.includes('database') ||
			message.includes('connection') ||
			message.includes('query') ||
			message.includes('constraint') ||
			message.includes('duplicate') ||
			message.includes('foreign key')
		);
	}

	/**
	 * 检查是否为网络异常
	 */
	private isNetworkException(exception: BaseException): boolean {
		const message = this.getExceptionMessage(exception);
		return (
			message.includes('network') ||
			message.includes('timeout') ||
			message.includes('connection') ||
			message.includes('ECONNREFUSED') ||
			message.includes('ENOTFOUND')
		);
	}

	/**
	 * 分类应用层异常
	 */
	private classifyApplicationException(
		exception: BaseApplicationException,
		_context: IExceptionContext
	): IExceptionClassification {
		const category = this.mapApplicationExceptionTypeToCategory(exception.errorType);
		const level = this.mapApplicationExceptionSeverityToLevel(exception.severity);

		return {
			category,
			level,
			code: exception.errorCode,
			userFriendlyMessage: this.getUserFriendlyMessage(exception),
			recoveryAdvice: this.getRecoveryAdvice(exception),
			shouldNotify: this.shouldNotify(exception),
			shouldLog: this.shouldLog(exception),
			confidence: 1.0 // 应用层异常分类置信度最高
		};
	}

	/**
	 * 分类HTTP异常
	 */
	private classifyHttpException(exception: BaseException, _context: IExceptionContext): IExceptionClassification {
		const status = 'status' in exception && typeof exception.status === 'number' ? exception.status : 500;
		const level = this.mapHttpStatusToLevel(status);
		const category = ExceptionCategory.HTTP;

		return {
			category,
			level,
			code: `HTTP_${status}`,
			userFriendlyMessage: this.getHttpUserFriendlyMessage(status),
			recoveryAdvice: this.getHttpRecoveryAdvice(status),
			shouldNotify: level === ExceptionLevel.ERROR || level === ExceptionLevel.FATAL,
			shouldLog: true,
			confidence: 0.9
		};
	}

	/**
	 * 分类验证异常
	 */
	private classifyValidationException(
		_exception: BaseException,
		_context: IExceptionContext
	): IExceptionClassification {
		return {
			category: ExceptionCategory.VALIDATION,
			level: ExceptionLevel.WARN,
			code: 'VALIDATION_ERROR',
			userFriendlyMessage: '输入数据验证失败，请检查输入内容',
			recoveryAdvice: '请检查输入数据的格式和内容，确保符合要求',
			shouldNotify: false,
			shouldLog: true,
			confidence: 0.8
		};
	}

	/**
	 * 分类数据库异常
	 */
	private classifyDatabaseException(_exception: BaseException, _context: IExceptionContext): IExceptionClassification {
		return {
			category: ExceptionCategory.INFRASTRUCTURE,
			level: ExceptionLevel.ERROR,
			code: 'DATABASE_ERROR',
			userFriendlyMessage: '数据库操作失败，请稍后重试',
			recoveryAdvice: '请检查数据库连接状态，或联系系统管理员',
			shouldNotify: true,
			shouldLog: true,
			confidence: 0.8
		};
	}

	/**
	 * 分类网络异常
	 */
	private classifyNetworkException(_exception: BaseException, _context: IExceptionContext): IExceptionClassification {
		return {
			category: ExceptionCategory.EXTERNAL,
			level: ExceptionLevel.ERROR,
			code: 'NETWORK_ERROR',
			userFriendlyMessage: '网络连接异常，请检查网络状态',
			recoveryAdvice: '请检查网络连接，或稍后重试',
			shouldNotify: true,
			shouldLog: true,
			confidence: 0.7
		};
	}

	/**
	 * 分类通用异常
	 */
	private classifyGenericException(exception: BaseException, _context: IExceptionContext): IExceptionClassification {
		const message = this.getExceptionMessage(exception);
		const level = this.determineLevelFromMessage(message);

		return {
			category: ExceptionCategory.APPLICATION,
			level,
			code: 'GENERIC_ERROR',
			userFriendlyMessage: '系统发生未知错误，请稍后重试',
			recoveryAdvice: '请联系系统管理员或稍后重试',
			shouldNotify: level === ExceptionLevel.ERROR || level === ExceptionLevel.FATAL,
			shouldLog: true,
			confidence: 0.5
		};
	}

	/**
	 * 获取默认分类
	 */
	private getDefaultClassification(_exception: BaseException, _context: IExceptionContext): IExceptionClassification {
		return {
			category: ExceptionCategory.APPLICATION,
			level: ExceptionLevel.ERROR,
			code: 'UNKNOWN_ERROR',
			userFriendlyMessage: '系统发生未知错误',
			recoveryAdvice: '请联系系统管理员',
			shouldNotify: true,
			shouldLog: true,
			confidence: 0.1
		};
	}

	/**
	 * 映射应用层异常类型到分类
	 */
	private mapApplicationExceptionTypeToCategory(type: ApplicationExceptionType): ExceptionCategory {
		const mapping: Record<ApplicationExceptionType, ExceptionCategory> = {
			[ApplicationExceptionType.VALIDATION]: ExceptionCategory.VALIDATION,
			[ApplicationExceptionType.AUTHORIZATION]: ExceptionCategory.APPLICATION,
			[ApplicationExceptionType.RESOURCE_NOT_FOUND]: ExceptionCategory.APPLICATION,
			[ApplicationExceptionType.CONCURRENCY]: ExceptionCategory.APPLICATION,
			[ApplicationExceptionType.EXTERNAL_SERVICE]: ExceptionCategory.EXTERNAL,
			[ApplicationExceptionType.BUSINESS_LOGIC]: ExceptionCategory.APPLICATION,
			[ApplicationExceptionType.INFRASTRUCTURE]: ExceptionCategory.INFRASTRUCTURE,
			[ApplicationExceptionType.CONFIGURATION]: ExceptionCategory.CONFIGURATION
		};

		return mapping[type] || ExceptionCategory.APPLICATION;
	}

	/**
	 * 映射应用层异常严重程度到级别
	 */
	private mapApplicationExceptionSeverityToLevel(severity: string): ExceptionLevel {
		const mapping: Record<string, ExceptionLevel> = {
			LOW: ExceptionLevel.INFO,
			MEDIUM: ExceptionLevel.WARN,
			HIGH: ExceptionLevel.ERROR,
			CRITICAL: ExceptionLevel.FATAL
		};

		return mapping[severity] || ExceptionLevel.ERROR;
	}

	/**
	 * 映射HTTP状态码到异常级别
	 */
	private mapHttpStatusToLevel(status: number): ExceptionLevel {
		if (status >= 500) return ExceptionLevel.ERROR;
		if (status >= 400) return ExceptionLevel.WARN;
		return ExceptionLevel.INFO;
	}

	/**
	 * 从消息内容确定异常级别
	 */
	private determineLevelFromMessage(message: string): ExceptionLevel {
		const lowerMessage = message.toLowerCase();

		if (lowerMessage.includes('fatal') || lowerMessage.includes('critical')) {
			return ExceptionLevel.FATAL;
		}

		if (lowerMessage.includes('error') || lowerMessage.includes('failed')) {
			return ExceptionLevel.ERROR;
		}

		if (lowerMessage.includes('warning') || lowerMessage.includes('warn')) {
			return ExceptionLevel.WARN;
		}

		return ExceptionLevel.INFO;
	}

	/**
	 * 获取异常消息
	 */
	private getExceptionMessage(exception: BaseException): string {
		if (exception instanceof Error) {
			return exception.message;
		}

		if (typeof exception === 'string') {
			return exception;
		}

		if ('message' in exception) {
			return String(exception.message);
		}

		return 'Unknown error';
	}

	/**
	 * 获取用户友好消息
	 */
	private getUserFriendlyMessage(exception: BaseApplicationException): string {
		// 这里可以根据异常类型返回更友好的消息
		return exception.message || '操作失败，请稍后重试';
	}

	/**
	 * 获取恢复建议
	 */
	private getRecoveryAdvice(_exception: BaseApplicationException): string {
		// 这里可以根据异常类型返回恢复建议
		return '请检查输入数据或稍后重试';
	}

	/**
	 * 是否应该发送通知
	 */
	private shouldNotify(exception: BaseApplicationException): boolean {
		return exception.severity === 'CRITICAL' || exception.severity === 'HIGH';
	}

	/**
	 * 是否应该记录日志
	 */
	private shouldLog(_exception: BaseApplicationException): boolean {
		return true; // 所有应用层异常都应该记录日志
	}

	/**
	 * 获取HTTP用户友好消息
	 */
	private getHttpUserFriendlyMessage(status: number): string {
		const messages: Record<number, string> = {
			400: '请求参数错误',
			401: '未授权访问',
			403: '访问被拒绝',
			404: '请求的资源不存在',
			409: '资源冲突',
			422: '数据验证失败',
			429: '请求过于频繁',
			500: '服务器内部错误',
			502: '网关错误',
			503: '服务不可用',
			504: '网关超时'
		};

		return messages[status] || '请求处理失败';
	}

	/**
	 * 获取HTTP恢复建议
	 */
	private getHttpRecoveryAdvice(status: number): string {
		if (status >= 500) {
			return '服务器错误，请稍后重试或联系系统管理员';
		}

		if (status >= 400) {
			return '请检查请求参数或联系系统管理员';
		}

		return '请稍后重试';
	}
}
