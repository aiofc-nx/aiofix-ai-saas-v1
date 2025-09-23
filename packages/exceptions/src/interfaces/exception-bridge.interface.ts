/**
 * 异常转换桥梁接口定义
 *
 * 定义了异常转换桥梁的标准接口，用于连接不同层级和模块之间的异常处理。
 * 支持应用层到HTTP层、领域层到应用层、Core模块错误总线等转换。
 *
 * @description 异常转换桥梁接口定义
 * @since 1.0.0
 */

import type { IUnifiedException, IExceptionContext } from './exception.interface';
// import type { BaseApplicationException, ApplicationExceptionType } from '@aiofix/core';
import type { AbstractHttpException } from '../http-exceptions/abstract-http.exception';

/**
 * 临时类型定义 - 等待Core模块集成
 */
export enum ApplicationExceptionType {
	VALIDATION = 'validation',
	AUTHORIZATION = 'authorization',
	RESOURCE_NOT_FOUND = 'resource_not_found',
	CONCURRENCY = 'concurrency',
	EXTERNAL_SERVICE = 'external_service',
	BUSINESS_LOGIC = 'business_logic',
	INFRASTRUCTURE = 'infrastructure',
	CONFIGURATION = 'configuration'
}

export abstract class BaseApplicationException extends Error {
	public readonly errorCode: string;
	public readonly errorType: ApplicationExceptionType;
	public readonly context: Record<string, unknown>;
	public readonly severity: string;

	constructor(
		message: string,
		errorCode: string,
		errorType: ApplicationExceptionType,
		context: Record<string, unknown> = {},
		severity: string = 'MEDIUM'
	) {
		super(message);
		this.errorCode = errorCode;
		this.errorType = errorType;
		this.context = context;
		this.severity = severity;
	}
}

/**
 * 异常转换桥梁基础接口
 */
export interface IExceptionBridge {
	/**
	 * 桥梁名称
	 */
	readonly name: string;

	/**
	 * 桥梁优先级
	 */
	readonly priority: number;

	/**
	 * 检查是否支持转换
	 *
	 * @param source - 源异常对象
	 * @returns 如果支持转换则返回 true，否则返回 false
	 */
	canTransform(source: unknown): boolean;
}

/**
 * 应用层到HTTP异常转换桥梁接口
 */
export interface IApplicationToHttpBridge extends IExceptionBridge {
	/**
	 * 转换应用层异常为HTTP异常
	 *
	 * @param appException - 应用层异常
	 * @returns HTTP异常对象
	 */
	convert(appException: BaseApplicationException): AbstractHttpException;

	/**
	 * 获取HTTP状态码
	 *
	 * @param appExceptionType - 应用层异常类型
	 * @returns HTTP状态码
	 */
	getHttpStatusCode(appExceptionType: ApplicationExceptionType): number;

	/**
	 * 检查是否应该记录详细日志
	 *
	 * @param appException - 应用层异常
	 * @returns 是否应该记录详细日志
	 */
	shouldLogDetailed(appException: BaseApplicationException): boolean;

	/**
	 * 检查是否应该发送通知
	 *
	 * @param appException - 应用层异常
	 * @returns 是否应该发送通知
	 */
	shouldNotify(appException: BaseApplicationException): boolean;
}

/**
 * 领域层到应用层异常转换桥梁接口
 */
export interface IDomainToApplicationBridge extends IExceptionBridge {
	/**
	 * 转换领域异常为应用层异常
	 *
	 * @param domainException - 领域异常
	 * @param context - 异常上下文
	 * @returns 应用层异常对象
	 */
	convert(domainException: Error, context: IExceptionContext): BaseApplicationException;
}

/**
 * Core错误总线桥梁接口
 */
export interface ICoreErrorBusBridge extends IExceptionBridge {
	/**
	 * 发布异常到Core错误总线
	 *
	 * @param exception - 统一异常
	 * @param context - 异常上下文
	 */
	publishToCoreErrorBus(exception: IUnifiedException, context: IExceptionContext): Promise<void>;

	/**
	 * 转换统一异常为Core错误格式
	 *
	 * @param exception - 统一异常
	 * @returns Core错误对象
	 */
	convertToCoreError(exception: IUnifiedException): Error;

	/**
	 * 转换异常上下文为Core上下文格式
	 *
	 * @param context - 异常上下文
	 * @returns Core上下文对象
	 */
	convertToCoreContext(context: IExceptionContext): Record<string, unknown>;
}

/**
 * 异常转换结果接口
 */
export interface IExceptionTransformResult {
	/**
	 * 转换是否成功
	 */
	success: boolean;

	/**
	 * 转换后的异常对象
	 */
	transformedException?: unknown;

	/**
	 * 转换失败原因
	 */
	error?: string;

	/**
	 * 转换元数据
	 */
	metadata?: Record<string, unknown>;
}
