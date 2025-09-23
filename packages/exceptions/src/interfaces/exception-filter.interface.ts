/**
 * 异常过滤器接口定义
 *
 * 定义了异常过滤器的标准接口，用于处理不同类型的异常。
 * 支持HTTP、WebSocket、RPC等多种上下文的异常处理。
 *
 * @description 异常过滤器接口定义
 * @since 1.0.0
 */

import type { ArgumentsHost, ExceptionFilter as NestJSExceptionFilter } from '@nestjs/common';
import type { IUnifiedException, BaseException } from './exception.interface';

/**
 * 统一异常过滤器接口
 */
export interface IUnifiedExceptionFilter extends NestJSExceptionFilter {
	/**
	 * 过滤器名称
	 */
	readonly name: string;

	/**
	 * 过滤器优先级
	 */
	readonly priority: number;

	/**
	 * 捕获异常
	 *
	 * @param exception - 异常对象
	 * @param host - 执行上下文
	 */
	catch(exception: BaseException, host: ArgumentsHost): Promise<void>;

	/**
	 * 检查是否应该捕获此异常
	 *
	 * @param exception - 异常对象
	 * @param host - 执行上下文
	 * @returns 如果应该捕获则返回 true，否则返回 false
	 */
	shouldCatch(exception: BaseException, host: ArgumentsHost): boolean;

	/**
	 * 转换异常为统一异常
	 *
	 * @param exception - 原始异常
	 * @param host - 执行上下文
	 * @returns 统一异常对象
	 */
	transformException(exception: BaseException, host: ArgumentsHost): Promise<IUnifiedException>;
}

/**
 * HTTP异常过滤器接口
 */
export interface IHttpExceptionFilter extends IUnifiedExceptionFilter {
	/**
	 * 处理HTTP异常
	 *
	 * @param exception - 统一异常
	 * @param host - HTTP执行上下文
	 */
	handleHttpException(exception: IUnifiedException, host: ArgumentsHost): Promise<void>;
}

/**
 * 应用异常过滤器接口
 */
export interface IApplicationExceptionFilter extends IUnifiedExceptionFilter {
	/**
	 * 处理应用层异常
	 *
	 * @param exception - 统一异常
	 * @param host - 执行上下文
	 */
	handleApplicationException(exception: IUnifiedException, host: ArgumentsHost): Promise<void>;
}

/**
 * 领域异常过滤器接口
 */
export interface IDomainExceptionFilter extends IUnifiedExceptionFilter {
	/**
	 * 处理领域异常
	 *
	 * @param exception - 统一异常
	 * @param host - 执行上下文
	 */
	handleDomainException(exception: IUnifiedException, host: ArgumentsHost): Promise<void>;
}

/**
 * 基础设施异常过滤器接口
 */
export interface IInfrastructureExceptionFilter extends IUnifiedExceptionFilter {
	/**
	 * 处理基础设施异常
	 *
	 * @param exception - 统一异常
	 * @param host - 执行上下文
	 */
	handleInfrastructureException(exception: IUnifiedException, host: ArgumentsHost): Promise<void>;
}
