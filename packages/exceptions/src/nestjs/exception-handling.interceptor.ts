/**
 * 异常处理拦截器
 *
 * 提供异常处理的NestJS拦截器，包括：
 * - 异常监控拦截器
 * - 异常统计拦截器
 * - 异常恢复拦截器
 * - 异常分类拦截器
 *
 * @description NestJS异常处理拦截器实现
 * @since 2.0.0
 */

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { getExceptionHandlingMetadata } from './exception-handling.decorator';
import { UnifiedExceptionManager } from '../core';
import { ExceptionStrategyManager } from '../strategies';
import { CoreErrorBusBridge } from '../bridges';

/**
 * 异常处理拦截器
 *
 * 提供异常处理的拦截功能，包括：
 * - 方法执行监控
 * - 异常捕获和处理
 * - 性能统计
 * - 异常分类和恢复
 * - 与统一异常管理器集成
 *
 * ## 业务规则
 *
 * ### 监控规则
 * - 监控方法执行时间和成功率
 * - 记录异常发生频率和类型
 * - 提供性能指标和统计信息
 * - 支持自定义监控指标
 *
 * ### 异常处理规则
 * - 捕获方法执行过程中的异常
 * - 根据装饰器元数据进行异常分类
 * - 应用异常恢复策略
 * - 发布异常到统一异常管理器
 *
 * ### 性能规则
 * - 拦截器执行时间不能影响业务性能
 * - 支持异步异常处理
 * - 提供熔断和降级机制
 * - 支持异常处理的配置化
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UsersController {
 *   @Get(':id')
 *   @HandleException({
 *     category: 'APPLICATION',
 *     level: 'ERROR',
 *     retryable: true,
 *     retryCount: 3,
 *     trackPerformance: true
 *   })
 *   async getUser(@Param('id') id: string) {
 *     // 业务逻辑
 *   }
 * }
 * ```
 *
 * @since 2.0.0
 */
@Injectable()
export class ExceptionHandlingInterceptor implements NestInterceptor {
	private readonly logger = new Logger(ExceptionHandlingInterceptor.name);

	/**
	 * 构造函数
	 *
	 * @param exceptionManager 统一异常管理器
	 * @param strategyManager 策略管理器
	 * @param coreErrorBusBridge Core错误总线桥梁
	 */
	constructor(
		private readonly exceptionManager: UnifiedExceptionManager,
		private readonly strategyManager: ExceptionStrategyManager,
		private readonly coreErrorBusBridge: CoreErrorBusBridge
	) {}

	/**
	 * 拦截方法执行
	 *
	 * @param context 执行上下文
	 * @param next 下一个处理器
	 * @returns 可观察对象
	 */
	public intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const startTime = Date.now();
		const className = context.getClass().name;
		const methodName = context.getHandler().name;
		const methodKey = `${className}.${methodName}`;

		// 获取异常处理元数据
		const metadata = getExceptionHandlingMetadata(context.getHandler());

		// 如果没有元数据，直接执行
		if (!metadata) {
			return next.handle();
		}

		this.logger.debug(`Intercepting method: ${methodKey}`);

		return next.handle().pipe(
			// 成功执行的处理
			tap((_result) => {
				const executionTime = Date.now() - startTime;
				this.handleSuccess(methodKey, executionTime, metadata);
			}),

			// 异常处理
			catchError((error) => {
				const executionTime = Date.now() - startTime;
				return this.handleError(error, methodKey, executionTime, metadata, context);
			})
		);
	}

	/**
	 * 处理成功执行
	 *
	 * @param methodKey 方法键
	 * @param executionTime 执行时间
	 * @param metadata 元数据
	 */
	private handleSuccess(methodKey: string, executionTime: number, metadata: any): void {
		try {
			// 记录成功统计
			if (metadata.type === 'stats' || metadata.trackSuccess) {
				this.logger.debug(`Method ${methodKey} executed successfully in ${executionTime}ms`);
			}

			// 记录性能统计
			if (metadata.trackPerformance) {
				this.logger.debug(`Performance: ${methodKey} - ${executionTime}ms`);
			}
		} catch (error) {
			this.logger.error(`Failed to handle success for method ${methodKey}:`, error);
		}
	}

	/**
	 * 处理异常
	 *
	 * @param error 异常对象
	 * @param methodKey 方法键
	 * @param executionTime 执行时间
	 * @param metadata 元数据
	 * @param context 执行上下文
	 * @returns 可观察对象
	 */
	private async handleError(
		error: any,
		methodKey: string,
		executionTime: number,
		metadata: any,
		context: ExecutionContext
	): Promise<Observable<never>> {
		try {
			this.logger.error(`Method ${methodKey} failed after ${executionTime}ms:`, error);

			// 提取请求上下文
			const requestContext = this.extractRequestContext(context);

			// 转换异常为统一格式
			const unifiedException = await this.exceptionManager.transformException(error, requestContext);

			// 应用元数据分类
			if (metadata.category) {
				unifiedException.category = metadata.category;
			}
			if (metadata.level) {
				unifiedException.level = metadata.level;
			}

			// 应用恢复策略
			if (metadata.type === 'recover') {
				await this.applyRecoveryStrategy(unifiedException, metadata);
			}

			// 发布到Core错误总线
			await this.coreErrorBusBridge.publishToCoreErrorBus(unifiedException);

			// 应用策略处理
			await this.strategyManager.handleException(unifiedException);

			// 记录异常统计
			if (metadata.type === 'stats' || metadata.trackErrors) {
				this.logger.debug(`Exception tracked for method ${methodKey}: ${unifiedException.id}`);
			}

			// 重新抛出异常
			return throwError(() => error);
		} catch (processingError) {
			this.logger.error(`Failed to process exception for method ${methodKey}:`, processingError);

			// 重新抛出原始异常
			return throwError(() => error);
		}
	}

	/**
	 * 提取请求上下文
	 *
	 * @param context 执行上下文
	 * @returns 请求上下文
	 */
	private extractRequestContext(context: ExecutionContext): any {
		const requestContext: any = {
			timestamp: new Date(),
			requestId: this.generateRequestId(),
			traceId: this.generateTraceId()
		};

		try {
			// 尝试获取HTTP请求上下文
			const request = context.switchToHttp().getRequest();
			if (request) {
				requestContext.type = 'HTTP';
				requestContext.method = request.method;
				requestContext.url = request.url;
				requestContext.userAgent = request.headers['user-agent'];
				requestContext.ip = request.ip || request.connection.remoteAddress;

				// 提取多租户信息
				requestContext.tenantId = request.headers['x-tenant-id'] || request.tenantId;
				requestContext.userId = request.headers['x-user-id'] || request.userId;
				requestContext.organizationId = request.headers['x-organization-id'] || request.organizationId;
				requestContext.departmentId = request.headers['x-department-id'] || request.departmentId;
			}
		} catch {
			// 如果不是HTTP上下文，使用默认值
			requestContext.type = 'UNKNOWN';
		}

		return requestContext;
	}

	/**
	 * 应用恢复策略
	 *
	 * @param exception 统一异常
	 * @param metadata 元数据
	 */
	private async applyRecoveryStrategy(exception: any, metadata: any): Promise<void> {
		try {
			// 设置重试信息
			if (metadata.retryable) {
				exception.retryable = true;
				exception.retryCount = metadata.retryCount || 3;
				exception.retryDelay = metadata.retryDelay || 1000;
			}

			// 设置恢复建议
			if (metadata.recoveryAdvice) {
				exception.recoveryAdvice = metadata.recoveryAdvice;
			}

			// 设置降级方法
			if (metadata.fallbackMethod) {
				exception.fallbackMethod = metadata.fallbackMethod;
			}
		} catch (error) {
			this.logger.error('Failed to apply recovery strategy:', error);
		}
	}

	/**
	 * 生成请求ID
	 *
	 * @returns 请求ID
	 */
	private generateRequestId(): string {
		return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * 生成追踪ID
	 *
	 * @returns 追踪ID
	 */
	private generateTraceId(): string {
		return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}
