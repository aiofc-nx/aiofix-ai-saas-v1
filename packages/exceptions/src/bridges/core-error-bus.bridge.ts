/**
 * Core错误总线桥梁
 *
 * 负责连接Exceptions模块和Core模块的错误总线，实现异常信息的双向转换和传递。
 * 这是Exceptions模块与Core模块集成的重要桥梁组件。
 *
 * @description Core错误总线桥梁实现类
 * @example
 * ```typescript
 * const bridge = new CoreErrorBusBridge(coreErrorBus, logger);
 * await bridge.publishToCoreErrorBus(unifiedException, context);
 * ```
 *
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import type { CoreErrorBus, IErrorContext } from '@aiofix/core';
import type {
	ICoreErrorBusBridge,
	IUnifiedException,
	IExceptionContext,
	IExceptionTransformResult
} from '../interfaces/exception-bridge.interface';

/**
 * Core错误总线桥梁
 */
@Injectable()
export class CoreErrorBusBridge implements ICoreErrorBusBridge {
	readonly name = 'core-error-bus-bridge';
	readonly priority = 100;

	constructor(private readonly coreErrorBus: CoreErrorBus, private readonly logger: ILoggerService) {}

	/**
	 * 检查是否支持转换
	 *
	 * @param source - 源异常对象
	 * @returns 如果支持转换则返回 true，否则返回 false
	 */
	canTransform(source: unknown): boolean {
		// 支持所有类型的异常转换
		return source !== null && source !== undefined;
	}

	/**
	 * 发布异常到Core错误总线
	 *
	 * @param exception - 统一异常
	 * @param context - 异常上下文
	 */
	async publishToCoreErrorBus(exception: IUnifiedException, context: IExceptionContext): Promise<void> {
		try {
			this.logger.debug('开始发布异常到Core错误总线', LogContext.EXCEPTION, {
				exceptionId: exception.id,
				category: exception.category,
				level: exception.level
			});

			// 转换为Core错误格式
			const coreError = this.convertToCoreError(exception);
			const coreContext = this.convertToCoreContext(context);

			// 发布到Core错误总线
			await this.coreErrorBus.publish(coreError, coreContext);

			this.logger.debug('异常已成功发布到Core错误总线', LogContext.EXCEPTION, {
				exceptionId: exception.id
			});
		} catch (error) {
			this.logger.error(
				'发布异常到Core错误总线失败',
				LogContext.EXCEPTION,
				{
					exceptionId: exception.id,
					error: error instanceof Error ? error.message : String(error)
				},
				error as Error
			);
			throw error;
		}
	}

	/**
	 * 转换统一异常为Core错误格式
	 *
	 * @param exception - 统一异常
	 * @returns Core错误对象
	 */
	convertToCoreError(exception: IUnifiedException): Error {
		try {
			// 创建Core错误对象
			const coreError = new Error(exception.message);
			coreError.name = this.mapCategoryToErrorName(exception.category);

			// 添加自定义属性
			(coreError as any).exceptionId = exception.id;
			(coreError as any).category = exception.category;
			(coreError as any).level = exception.level;
			(coreError as any).code = exception.code;
			(coreError as any).context = exception.context;
			(coreError as any).occurredAt = exception.occurredAt;
			(coreError as any).originalError = exception.originalError;

			return coreError;
		} catch (error) {
			this.logger.error(
				'转换统一异常为Core错误格式失败',
				LogContext.EXCEPTION,
				{
					exceptionId: exception.id,
					error: error instanceof Error ? error.message : String(error)
				},
				error as Error
			);

			// 降级处理：返回基本错误对象
			return new Error(`Exception conversion failed: ${exception.message}`);
		}
	}

	/**
	 * 转换异常上下文为Core上下文格式
	 *
	 * @param context - 异常上下文
	 * @returns Core上下文对象
	 */
	convertToCoreContext(context: IExceptionContext): Partial<IErrorContext> {
		try {
			return {
				tenantId: context.tenantId,
				userId: context.userId,
				requestId: context.requestId,
				correlationId: context.correlationId,
				userAgent: context.userAgent,
				ipAddress: context.ipAddress,
				source: this.mapSourceToContextSource(context.source),
				customData: {
					...context.customData,
					organizationId: context.organizationId,
					departmentId: context.departmentId,
					occurredAt: context.occurredAt
				}
			};
		} catch (error) {
			this.logger.error(
				'转换异常上下文为Core上下文格式失败',
				LogContext.EXCEPTION,
				{
					contextId: context.id,
					error: error instanceof Error ? error.message : String(error)
				},
				error as Error
			);

			// 降级处理：返回基本上下文
			return {
				requestId: context.requestId,
				customData: {
					conversionError: true,
					originalContext: context
				}
			};
		}
	}

	/**
	 * 映射异常分类到错误名称
	 *
	 * @param category - 异常分类
	 * @returns 错误名称
	 */
	private mapCategoryToErrorName(category: string): string {
		const mapping: Record<string, string> = {
			http: 'HttpException',
			application: 'ApplicationException',
			domain: 'DomainException',
			infrastructure: 'InfrastructureException',
			external: 'ExternalServiceException',
			configuration: 'ConfigurationException',
			validation: 'ValidationException'
		};

		return mapping[category] || 'UnifiedException';
	}

	/**
	 * 映射来源到上下文来源
	 *
	 * @param source - 异常来源
	 * @returns 上下文来源
	 */
	private mapSourceToContextSource(source?: string): string {
		const mapping: Record<string, string> = {
			WEB: 'web',
			API: 'api',
			CLI: 'cli',
			SYSTEM: 'system'
		};

		return mapping[source || 'SYSTEM'] || 'system';
	}

	/**
	 * 从Core错误总线获取异常信息
	 *
	 * @param coreError - Core错误对象
	 * @returns 异常转换结果
	 */
	async getExceptionFromCoreErrorBus(coreError: Error): Promise<IExceptionTransformResult> {
		try {
			this.logger.debug('开始从Core错误总线获取异常信息', LogContext.EXCEPTION, {
				errorName: coreError.name,
				errorMessage: coreError.message
			});

			// 这里可以实现从Core错误总线获取异常信息的逻辑
			// 目前返回基本的转换结果
			return {
				success: true,
				transformedException: coreError,
				metadata: {
					source: 'core-error-bus',
					timestamp: new Date().toISOString()
				}
			};
		} catch (error) {
			this.logger.error(
				'从Core错误总线获取异常信息失败',
				LogContext.EXCEPTION,
				{
					error: error instanceof Error ? error.message : String(error)
				},
				error as Error
			);

			return {
				success: false,
				error: error instanceof Error ? error.message : String(error)
			};
		}
	}

	/**
	 * 检查Core错误总线连接状态
	 *
	 * @returns 连接状态
	 */
	async checkConnectionStatus(): Promise<boolean> {
		try {
			// 这里可以实现检查Core错误总线连接状态的逻辑
			return this.coreErrorBus.isStarted();
		} catch (error) {
			this.logger.error(
				'检查Core错误总线连接状态失败',
				LogContext.EXCEPTION,
				{
					error: error instanceof Error ? error.message : String(error)
				},
				error as Error
			);
			return false;
		}
	}

	/**
	 * 获取Core错误总线统计信息
	 *
	 * @returns 统计信息
	 */
	async getCoreErrorBusStats(): Promise<any> {
		try {
			return await this.coreErrorBus.getStatistics();
		} catch (error) {
			this.logger.error(
				'获取Core错误总线统计信息失败',
				LogContext.EXCEPTION,
				{
					error: error instanceof Error ? error.message : String(error)
				},
				error as Error
			);
			return null;
		}
	}
}
