/**
 * 异常处理装饰器
 *
 * 提供用于异常处理的NestJS装饰器，包括：
 * - 异常监控装饰器
 * - 异常分类装饰器
 * - 异常恢复装饰器
 * - 异常统计装饰器
 *
 * @description NestJS异常处理装饰器实现
 * @since 2.0.0
 */

import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ExceptionLevel, ExceptionCategory } from '../interfaces';

/**
 * 异常处理元数据键
 */
export const EXCEPTION_HANDLING_METADATA = 'exception_handling_metadata';

/**
 * 异常监控装饰器
 *
 * 用于标记需要监控异常的方法或类
 *
 * @param options 监控选项
 * @returns 装饰器
 */
export function MonitorException(options?: {
	level?: ExceptionLevel;
	category?: ExceptionCategory;
	trackPerformance?: boolean;
	trackErrors?: boolean;
}) {
	return applyDecorators(
		SetMetadata(EXCEPTION_HANDLING_METADATA, {
			type: 'monitor',
			...options
		})
	);
}

/**
 * 异常分类装饰器
 *
 * 用于指定异常的分类信息
 *
 * @param category 异常分类
 * @param level 异常级别
 * @returns 装饰器
 */
export function ClassifyException(category: ExceptionCategory, level: ExceptionLevel = ExceptionLevel.ERROR) {
	return applyDecorators(
		SetMetadata(EXCEPTION_HANDLING_METADATA, {
			type: 'classify',
			category,
			level
		})
	);
}

/**
 * 异常恢复装饰器
 *
 * 用于指定异常恢复策略
 *
 * @param options 恢复选项
 * @returns 装饰器
 */
export function RecoverFromException(options?: {
	retryable?: boolean;
	retryCount?: number;
	retryDelay?: number;
	fallbackMethod?: string;
	recoveryAdvice?: string;
}) {
	return applyDecorators(
		SetMetadata(EXCEPTION_HANDLING_METADATA, {
			type: 'recover',
			...options
		})
	);
}

/**
 * 异常统计装饰器
 *
 * 用于标记需要统计异常的方法或类
 *
 * @param options 统计选项
 * @returns 装饰器
 */
export function TrackExceptionStats(options?: {
	trackSuccess?: boolean;
	trackFailure?: boolean;
	trackPerformance?: boolean;
	customMetrics?: string[];
}) {
	return applyDecorators(
		SetMetadata(EXCEPTION_HANDLING_METADATA, {
			type: 'stats',
			...options
		})
	);
}

/**
 * 异常处理装饰器
 *
 * 组合多个异常处理装饰器
 *
 * @param options 异常处理选项
 * @returns 装饰器
 */
export function HandleException(options: {
	level?: ExceptionLevel;
	category?: ExceptionCategory;
	retryable?: boolean;
	retryCount?: number;
	retryDelay?: number;
	fallbackMethod?: string;
	recoveryAdvice?: string;
	trackPerformance?: boolean;
	trackErrors?: boolean;
	customMetrics?: string[];
}) {
	const decorators = [];

	// 添加监控装饰器
	if (options.trackPerformance || options.trackErrors) {
		decorators.push(
			MonitorException({
				level: options.level,
				category: options.category,
				trackPerformance: options.trackPerformance,
				trackErrors: options.trackErrors
			})
		);
	}

	// 添加分类装饰器
	if (options.category) {
		decorators.push(ClassifyException(options.category, options.level));
	}

	// 添加恢复装饰器
	if (options.retryable || options.fallbackMethod || options.recoveryAdvice) {
		decorators.push(
			RecoverFromException({
				retryable: options.retryable,
				retryCount: options.retryCount,
				retryDelay: options.retryDelay,
				fallbackMethod: options.fallbackMethod,
				recoveryAdvice: options.recoveryAdvice
			})
		);
	}

	// 添加统计装饰器
	if (options.customMetrics) {
		decorators.push(
			TrackExceptionStats({
				trackSuccess: true,
				trackFailure: true,
				trackPerformance: options.trackPerformance,
				customMetrics: options.customMetrics
			})
		);
	}

	return applyDecorators(...decorators);
}

/**
 * 获取异常处理元数据
 *
 * @param target 目标对象
 * @param propertyKey 属性键
 * @returns 异常处理元数据
 */
export function getExceptionHandlingMetadata(target: any, propertyKey?: string): any {
	if (propertyKey) {
		return Reflect.getMetadata(EXCEPTION_HANDLING_METADATA, target, propertyKey);
	}
	return Reflect.getMetadata(EXCEPTION_HANDLING_METADATA, target);
}

/**
 * 检查是否有异常处理元数据
 *
 * @param target 目标对象
 * @param propertyKey 属性键
 * @returns 是否有异常处理元数据
 */
export function hasExceptionHandlingMetadata(target: any, propertyKey?: string): boolean {
	return getExceptionHandlingMetadata(target, propertyKey) !== undefined;
}
