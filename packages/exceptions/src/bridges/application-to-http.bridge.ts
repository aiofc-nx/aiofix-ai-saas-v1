/**
 * 应用层到HTTP异常转换桥梁
 *
 * 负责将应用层异常转换为HTTP异常，实现应用层异常到HTTP响应的映射。
 * 支持多种应用层异常类型到HTTP状态码的转换。
 *
 * @description 应用层到HTTP异常转换桥梁实现类
 * @example
 * ```typescript
 * const bridge = new ApplicationToHttpBridge();
 * const httpException = bridge.convert(appException);
 * ```
 *
 * @since 1.0.0
 */

import { Injectable, HttpStatus } from '@nestjs/common';
import type { IApplicationToHttpBridge } from '../interfaces/exception-bridge.interface';
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
import type { AbstractHttpException } from '../http-exceptions/abstract-http.exception';
import { GeneralBadRequestException } from '../http-exceptions/general-bad-request.exception';
import { GeneralForbiddenException } from '../http-exceptions/general-forbidden.exception';
import { GeneralNotFoundException } from '../http-exceptions/general-not-found.exception';
import { GeneralUnprocessableEntityException } from '../http-exceptions/general-unprocessable-entity.exception';
import { GeneralInternalServerException } from '../http-exceptions/general-internal-server.exception';
import { OptimisticLockException } from '../http-exceptions/optimistic-lock.exception';
// import { InternalServiceUnavailableHttpException } from '../http-exceptions/internal-service-unavailable-http.exception';

/**
 * 验证错误接口
 */
interface ValidationError {
	field: string;
	message: string;
	value?: unknown;
	constraints?: Record<string, string>;
}

/**
 * 应用层到HTTP异常转换桥梁
 */
@Injectable()
export class ApplicationToHttpBridge implements IApplicationToHttpBridge {
	/**
	 * HTTP状态码映射表
	 */
	private static readonly statusMapping: Record<ApplicationExceptionType, HttpStatus> = {
		[ApplicationExceptionType.VALIDATION]: HttpStatus.BAD_REQUEST,
		[ApplicationExceptionType.AUTHORIZATION]: HttpStatus.FORBIDDEN,
		[ApplicationExceptionType.RESOURCE_NOT_FOUND]: HttpStatus.NOT_FOUND,
		[ApplicationExceptionType.CONCURRENCY]: HttpStatus.CONFLICT,
		[ApplicationExceptionType.EXTERNAL_SERVICE]: HttpStatus.SERVICE_UNAVAILABLE,
		[ApplicationExceptionType.BUSINESS_LOGIC]: HttpStatus.UNPROCESSABLE_ENTITY,
		[ApplicationExceptionType.INFRASTRUCTURE]: HttpStatus.INTERNAL_SERVER_ERROR,
		[ApplicationExceptionType.CONFIGURATION]: HttpStatus.INTERNAL_SERVER_ERROR
	};

	readonly name = 'application-to-http-bridge';
	readonly priority = 90;

	/**
	 * 检查是否支持转换
	 *
	 * @param source - 源异常对象
	 * @returns 如果支持转换则返回 true，否则返回 false
	 */
	canTransform(source: unknown): boolean {
		return source instanceof BaseApplicationException;
	}

	/**
	 * 转换应用层异常为HTTP异常
	 *
	 * @param appException - 应用层异常
	 * @returns HTTP异常对象
	 */
	convert(appException: BaseApplicationException): AbstractHttpException {
		const errorCode = appException.errorCode;
		const context = appException.context;
		const userMessage = this.getUserFriendlyMessage(appException);

		try {
			switch (appException.errorType) {
				case ApplicationExceptionType.VALIDATION:
					return this.convertValidationException(appException, errorCode, context, userMessage);

				case ApplicationExceptionType.AUTHORIZATION:
					return new GeneralForbiddenException(errorCode, appException);

				case ApplicationExceptionType.RESOURCE_NOT_FOUND:
					return new GeneralNotFoundException(errorCode, appException);

				case ApplicationExceptionType.CONCURRENCY:
					return this.convertConcurrencyException(appException, errorCode, context);

				case ApplicationExceptionType.EXTERNAL_SERVICE:
					return this.convertExternalServiceException(appException, errorCode, context);

				case ApplicationExceptionType.BUSINESS_LOGIC:
					return new GeneralUnprocessableEntityException(userMessage, errorCode, appException);

				case ApplicationExceptionType.INFRASTRUCTURE:
				case ApplicationExceptionType.CONFIGURATION:
					return new GeneralInternalServerException(errorCode, appException);

				default:
					return new GeneralInternalServerException('UNKNOWN_APPLICATION_ERROR', appException);
			}
		} catch {
			// 转换失败时的降级处理
			return new GeneralInternalServerException('CONVERSION_ERROR', appException);
		}
	}

	/**
	 * 获取HTTP状态码
	 *
	 * @param appExceptionType - 应用层异常类型
	 * @returns HTTP状态码
	 */
	getHttpStatusCode(appExceptionType: ApplicationExceptionType): number {
		return ApplicationToHttpBridge.statusMapping[appExceptionType] || HttpStatus.INTERNAL_SERVER_ERROR;
	}

	/**
	 * 检查是否应该记录详细日志
	 *
	 * @param appException - 应用层异常
	 * @returns 是否应该记录详细日志
	 */
	shouldLogDetailed(appException: BaseApplicationException): boolean {
		return appException.severity === 'HIGH' || appException.severity === 'CRITICAL';
	}

	/**
	 * 检查是否应该发送通知
	 *
	 * @param appException - 应用层异常
	 * @returns 是否应该发送通知
	 */
	shouldNotify(appException: BaseApplicationException): boolean {
		return appException.severity === 'CRITICAL';
	}

	/**
	 * 转换验证异常
	 *
	 * @param appException - 应用层异常
	 * @param errorCode - 错误代码
	 * @param context - 异常上下文
	 * @param userMessage - 用户友好消息
	 * @returns 验证异常对象
	 */
	private convertValidationException(
		appException: BaseApplicationException,
		errorCode: string,
		context: Record<string, unknown>,
		userMessage: string
	): GeneralBadRequestException {
		const validationError: ValidationError = {
			field: (context.fieldName as string) || 'unknown',
			message: userMessage,
			value: context.fieldValue,
			constraints: context.constraints as Record<string, string>
		};

		return new GeneralBadRequestException([validationError], errorCode, appException);
	}

	/**
	 * 转换并发异常
	 *
	 * @param appException - 应用层异常
	 * @param errorCode - 错误代码
	 * @param context - 异常上下文
	 * @returns 并发异常对象
	 */
	private convertConcurrencyException(
		appException: BaseApplicationException,
		errorCode: string,
		context: Record<string, unknown>
	): OptimisticLockException {
		const currentVersion = (context.actualVersion as number) || 0;
		return new OptimisticLockException(currentVersion, appException);
	}

	/**
	 * 转换外部服务异常
	 *
	 * @param appException - 应用层异常
	 * @param errorCode - 错误代码
	 * @param context - 异常上下文
	 * @returns 外部服务异常对象
	 */
	private convertExternalServiceException(
		appException: BaseApplicationException,
		errorCode: string,
		_context: Record<string, unknown>
	): GeneralInternalServerException {
		return new GeneralInternalServerException(errorCode, appException);
	}

	/**
	 * 获取用户友好的错误消息
	 *
	 * @param appException - 应用层异常
	 * @returns 用户友好的错误消息
	 */
	private getUserFriendlyMessage(appException: BaseApplicationException): string {
		// 根据异常类型返回更友好的消息
		const friendlyMessages: Record<ApplicationExceptionType, string> = {
			[ApplicationExceptionType.VALIDATION]: '输入数据验证失败，请检查输入内容',
			[ApplicationExceptionType.AUTHORIZATION]: '您没有权限执行此操作',
			[ApplicationExceptionType.RESOURCE_NOT_FOUND]: '请求的资源不存在',
			[ApplicationExceptionType.CONCURRENCY]: '数据已被其他用户修改，请刷新后重试',
			[ApplicationExceptionType.EXTERNAL_SERVICE]: '外部服务暂时不可用，请稍后重试',
			[ApplicationExceptionType.BUSINESS_LOGIC]: '业务逻辑错误，操作无法完成',
			[ApplicationExceptionType.INFRASTRUCTURE]: '系统基础设施错误，请联系管理员',
			[ApplicationExceptionType.CONFIGURATION]: '系统配置错误，请联系管理员'
		};

		return friendlyMessages[appException.errorType] || appException.message || '操作失败，请稍后重试';
	}

	/**
	 * 批量转换应用层异常
	 *
	 * @param appExceptions - 应用层异常数组
	 * @returns HTTP异常数组
	 */
	convertBatch(appExceptions: BaseApplicationException[]): AbstractHttpException[] {
		return appExceptions.map((appException) => this.convert(appException));
	}

	/**
	 * 获取异常转换统计信息
	 *
	 * @param appExceptions - 应用层异常数组
	 * @returns 转换统计信息
	 */
	getConversionStats(appExceptions: BaseApplicationException[]): Record<string, number> {
		const stats: Record<string, number> = {};

		for (const appException of appExceptions) {
			const httpStatus = this.getHttpStatusCode(appException.errorType);
			const statusKey = `status_${httpStatus}`;
			stats[statusKey] = (stats[statusKey] || 0) + 1;

			const typeKey = `type_${appException.errorType}`;
			stats[typeKey] = (stats[typeKey] || 0) + 1;
		}

		return stats;
	}
}
