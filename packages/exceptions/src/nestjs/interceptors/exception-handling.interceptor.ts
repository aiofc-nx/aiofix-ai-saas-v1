import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { IUnifiedExceptionManager } from '../../interfaces';
import { getExceptionHandlingOptions } from '../decorators/exception-handling.decorator';

/**
 * 异常处理拦截器
 *
 * @description 拦截方法执行过程中的异常
 * 使用统一异常管理器处理异常
 *
 * ## 功能特性
 *
 * ### 异常拦截
 * - 拦截方法执行过程中的所有异常
 * - 支持异步和同步方法的异常拦截
 * - 支持异常的分类和处理
 *
 * ### 装饰器集成
 * - 读取方法上的异常处理装饰器配置
 * - 根据装饰器配置应用相应的异常处理策略
 * - 支持自定义异常处理逻辑
 *
 * ### 统一异常管理
 * - 使用统一异常管理器处理异常
 * - 支持异常的分类、转换、通知等
 * - 支持异常处理的统计和监控
 *
 * ### 性能监控
 * - 监控异常处理的性能指标
 * - 记录异常处理的响应时间
 * - 支持异常处理的性能分析
 *
 * ## 使用示例
 *
 * ### 基础用法
 * ```typescript
 * @Injectable()
 * export class SomeService {
 *   constructor(
 *     private readonly exceptionInterceptor: ExceptionHandlingInterceptor
 *   ) {}
 *
 *   @ExceptionHandler()
 *   async someMethod(): Promise<void> {
 *     // 方法实现
 *   }
 * }
 * ```
 *
 * ### 自定义配置
 * ```typescript
 * @Injectable()
 * export class SomeService {
 *   @ExceptionHandler({
 *     enableRetry: true,
 *     maxRetries: 3,
 *     enableMonitoring: true
 *   })
 *   async customMethod(): Promise<void> {
 *     // 方法实现
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class ExceptionHandlingInterceptor implements NestInterceptor {
	private readonly logger = new Logger(ExceptionHandlingInterceptor.name);

	constructor(private readonly exceptionManager: IUnifiedExceptionManager) {}

	/**
	 * 拦截方法执行
	 *
	 * @description 拦截方法执行过程中的异常
	 * 使用统一异常管理器处理异常
	 *
	 * @param context 执行上下文
	 * @param next 下一个处理器
	 * @returns 处理结果
	 *
	 * @example
	 * ```typescript
	 * // 拦截器会自动处理异常
	 * const result = await this.interceptor.intercept(context, next);
	 * ```
	 *
	 * @since 1.0.0
	 */
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const startTime = Date.now();
		const handler = context.getHandler();
		const className = context.getClass().name;
		const methodName = handler.name;

		// 获取异常处理配置
		const exceptionOptions = getExceptionHandlingOptions(context.getClass(), handler.name);

		this.logger.debug(`拦截方法执行: ${className}.${methodName}`, {
			hasExceptionHandling: !!exceptionOptions,
			options: exceptionOptions
		});

		return next.handle().pipe(
			tap(() => {
				// 记录成功执行的性能指标
				const duration = Date.now() - startTime;
				this.logger.debug(`方法执行成功: ${className}.${methodName}`, {
					duration,
					timestamp: new Date().toISOString()
				});
			}),
			catchError((error) => {
				// 记录异常处理的性能指标
				const duration = Date.now() - startTime;

				this.logger.error(`方法执行异常: ${className}.${methodName}`, {
					error: error.message,
					stack: error.stack,
					duration,
					timestamp: new Date().toISOString()
				});

				// 使用统一异常管理器处理异常
				return this.handleException(error, context, exceptionOptions, duration);
			})
		);
	}

	/**
	 * 处理异常
	 *
	 * @description 使用统一异常管理器处理异常
	 * 根据装饰器配置应用相应的异常处理策略
	 *
	 * @param error 异常对象
	 * @param context 执行上下文
	 * @param options 异常处理配置
	 * @param duration 执行持续时间
	 * @returns 处理结果
	 *
	 * @example
	 * ```typescript
	 * const result = await this.handleException(error, context, options, duration);
	 * ```
	 *
	 * @since 1.0.0
	 */
	private async handleException(
		error: Error,
		context: ExecutionContext,
		options: any,
		duration: number
	): Promise<Observable<any>> {
		try {
			// 创建异常上下文
			const exceptionContext = {
				className: context.getClass().name,
				methodName: context.getHandler().name,
				duration,
				options,
				timestamp: new Date().toISOString()
			};

			// 使用统一异常管理器处理异常
			await this.exceptionManager.handle(error, context);

			// 根据配置决定是否重新抛出异常
			if (options?.enableRetry && options?.maxRetries > 0) {
				// 实现重试逻辑
				return this.handleRetry(error, context, options);
			}

			// 根据配置决定是否使用降级处理
			if (options?.enableFallback && options?.fallbackHandler) {
				try {
					const fallbackResult = await options.fallbackHandler(error, exceptionContext);
					return new Observable((subscriber) => {
						subscriber.next(fallbackResult);
						subscriber.complete();
					});
				} catch (fallbackError) {
					this.logger.error('降级处理失败', {
						originalError: error.message,
						fallbackError: fallbackError.message
					});
				}
			}

			// 重新抛出异常
			return throwError(() => error);
		} catch (handlingError) {
			this.logger.error('异常处理失败', {
				originalError: error.message,
				handlingError: handlingError.message
			});

			// 重新抛出原始异常
			return throwError(() => error);
		}
	}

	/**
	 * 处理重试逻辑
	 *
	 * @description 根据配置实现重试逻辑
	 * 支持指数退避和最大重试次数限制
	 *
	 * @param error 异常对象
	 * @param context 执行上下文
	 * @param options 异常处理配置
	 * @returns 处理结果
	 *
	 * @example
	 * ```typescript
	 * const result = await this.handleRetry(error, context, options);
	 * ```
	 *
	 * @since 1.0.0
	 */
	private async handleRetry(error: Error, context: ExecutionContext, options: any): Promise<Observable<any>> {
		const maxRetries = options.maxRetries || 3;
		const retryDelay = options.retryDelay || 1000;
		let retryCount = 0;

		while (retryCount < maxRetries) {
			retryCount++;

			this.logger.debug(`重试第 ${retryCount} 次`, {
				error: error.message,
				retryCount,
				maxRetries
			});

			try {
				// 等待重试延迟
				await this.delay(retryDelay * retryCount);

				// 重新执行方法
				const handler = context.getHandler();
				const instance = context.getClass();
				const args = context.getArgs();

				const result = await handler.apply(instance, args);

				this.logger.debug(`重试成功`, {
					retryCount,
					result: typeof result
				});

				return new Observable((subscriber) => {
					subscriber.next(result);
					subscriber.complete();
				});
			} catch (retryError) {
				this.logger.debug(`重试第 ${retryCount} 次失败`, {
					error: retryError.message,
					retryCount,
					maxRetries
				});

				if (retryCount >= maxRetries) {
					this.logger.error(`重试次数已达上限`, {
						maxRetries,
						finalError: retryError.message
					});
					break;
				}
			}
		}

		// 重试失败，抛出异常
		return throwError(() => error);
	}

	/**
	 * 延迟执行
	 *
	 * @description 实现延迟执行功能
	 * 用于重试机制中的延迟等待
	 *
	 * @param ms 延迟时间（毫秒）
	 * @returns Promise
	 *
	 * @example
	 * ```typescript
	 * await this.delay(1000); // 延迟1秒
	 * ```
	 *
	 * @since 1.0.0
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
