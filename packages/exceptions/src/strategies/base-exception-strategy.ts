/**
 * 基础异常处理策略
 *
 * 提供异常处理策略的基础实现，定义策略的通用行为和接口。
 * 所有具体的异常处理策略都应该继承此基类。
 *
 * @description 异常处理策略的抽象基类
 * @since 2.0.0
 */

import {
	IExceptionHandlingStrategy,
	IUnifiedException,
	IExceptionHandlingResult,
	ExceptionHandlingStrategy
} from '../interfaces';
import { ArgumentsHost } from '@nestjs/common';

/**
 * 基础异常处理策略抽象类
 *
 * 提供异常处理策略的通用实现，包括：
 * - 策略名称和类型管理
 * - 异常分类和优先级处理
 * - 通用处理流程和错误处理
 * - 统计和监控支持
 *
 * ## 业务规则
 *
 * ### 策略注册规则
 * - 每个策略必须具有唯一的名称
 * - 策略类型必须与异常分类匹配
 * - 策略优先级决定处理顺序
 * - 策略必须支持启用/禁用状态
 *
 * ### 异常处理规则
 * - 策略只能处理匹配的异常类型
 * - 处理失败时必须有降级机制
 * - 处理结果必须包含明确的成功/失败状态
 * - 处理过程必须记录详细的日志信息
 *
 * ### 性能规则
 * - 策略处理时间不能超过配置的超时时间
 * - 策略必须支持异步处理
 * - 策略必须提供性能统计信息
 * - 策略必须支持熔断机制
 *
 * @example
 * ```typescript
 * class HttpExceptionStrategy extends BaseExceptionStrategy {
 *   constructor() {
 *     super('http-exception-strategy', ExceptionHandlingStrategy.HTTP);
 *   }
 *
 *   async canHandle(exception: IUnifiedException): Promise<boolean> {
 *     return exception.category === 'HTTP';
 *   }
 *
 *   async handle(exception: IUnifiedException): Promise<IExceptionHandlingResult> {
 *     // 具体的HTTP异常处理逻辑
 *     return {
 *       success: true,
 *       handled: true,
 *       response: { statusCode: 400, message: 'Bad Request' }
 *     };
 *   }
 * }
 * ```
 *
 * @since 2.0.0
 */
export abstract class BaseExceptionStrategy implements IExceptionHandlingStrategy {
	/**
	 * 策略名称
	 */
	public readonly name: string;

	/**
	 * 策略类型
	 */
	public readonly type: ExceptionHandlingStrategy;

	/**
	 * 策略优先级（数字越小优先级越高）
	 */
	public readonly priority: number;

	/**
	 * 策略是否启用
	 */
	public enabled = true;

	/**
	 * 策略处理统计
	 */
	protected stats = {
		totalHandled: 0,
		successCount: 0,
		failureCount: 0,
		averageProcessingTime: 0,
		lastProcessedAt: null as Date | null
	};

	/**
	 * 构造函数
	 *
	 * @param name 策略名称
	 * @param type 策略类型
	 * @param priority 策略优先级，默认为100
	 */
	constructor(name: string, type: ExceptionHandlingStrategy, priority: number = 100) {
		this.name = name;
		this.type = type;
		this.priority = priority;
	}

	/**
	 * 判断策略是否可以处理指定的异常
	 *
	 * @param exception 待处理的异常
	 * @returns 是否可以处理
	 */
	public abstract canHandle(exception: IUnifiedException): Promise<boolean>;

	/**
	 * 处理异常
	 *
	 * @param exception 待处理的异常
	 * @returns 处理结果
	 */
	public abstract handle(exception: IUnifiedException): Promise<IExceptionHandlingResult>;

	/**
	 * 获取策略统计信息
	 *
	 * @returns 策略统计信息
	 */
	public getStats() {
		return { ...this.stats };
	}

	/**
	 * 重置策略统计信息
	 */
	public resetStats(): void {
		this.stats = {
			totalHandled: 0,
			successCount: 0,
			failureCount: 0,
			averageProcessingTime: 0,
			lastProcessedAt: null
		};
	}

	/**
	 * 启用策略
	 */
	public enable(): void {
		this.enabled = true;
	}

	/**
	 * 禁用策略
	 */
	public disable(): void {
		this.enabled = false;
	}

	/**
	 * 更新统计信息
	 *
	 * @param success 是否成功
	 * @param processingTime 处理时间（毫秒）
	 */
	protected updateStats(success: boolean, processingTime: number): void {
		this.stats.totalHandled++;
		this.stats.lastProcessedAt = new Date();

		if (success) {
			this.stats.successCount++;
		} else {
			this.stats.failureCount++;
		}

		// 计算平均处理时间
		this.stats.averageProcessingTime =
			(this.stats.averageProcessingTime * (this.stats.totalHandled - 1) + processingTime) / this.stats.totalHandled;
	}

	/**
	 * 检查是否应该应用此策略
	 *
	 * @param exception - 统一异常
	 * @returns 如果应该应用则返回 true，否则返回 false
	 */
	shouldApply(_exception: IUnifiedException): boolean {
		return this.enabled;
	}

	/**
	 * 应用策略
	 *
	 * @param exception - 统一异常
	 * @param host - 执行上下文
	 * @returns 处理结果
	 */
	async apply(exception: IUnifiedException, _host: ArgumentsHost): Promise<IExceptionHandlingResult> {
		const startTime = Date.now();

		try {
			// 检查是否可以处理此异常
			if (!(await this.canHandle(exception))) {
				return this.createResult(false, 'cannot_handle', undefined, 'Strategy cannot handle this exception');
			}

			const result = await this.handle(exception);
			const processingTime = Date.now() - startTime;

			this.updateStats(true, processingTime);
			return result;
		} catch (error) {
			const processingTime = Date.now() - startTime;
			this.updateStats(false, processingTime);

			return this.createResult(
				false,
				'strategy_failed',
				{ error: error instanceof Error ? error.message : String(error) },
				'Strategy execution failed'
			);
		}
	}

	/**
	 * 创建处理结果
	 *
	 * @param success 是否成功
	 * @param action 执行的动作
	 * @param metadata 元数据
	 * @param reason 失败原因
	 * @returns 处理结果
	 */
	protected createResult(
		success: boolean,
		action: string,
		metadata?: Record<string, unknown>,
		reason?: string
	): IExceptionHandlingResult {
		return {
			success,
			action,
			metadata,
			reason
		};
	}
}
