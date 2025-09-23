/**
 * 异常处理策略管理器
 *
 * 管理所有异常处理策略的注册、发现、排序和执行。
 * 提供策略的生命周期管理和性能监控。
 *
 * @description 异常处理策略管理器实现
 * @since 2.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { IExceptionHandlingStrategy, IUnifiedException, IExceptionHandlingResult } from '../interfaces';
import { BaseExceptionStrategy } from './base-exception-strategy';
import { HttpExceptionStrategy } from './http-exception-strategy';
import { ApplicationExceptionStrategy } from './application-exception-strategy';
import { DatabaseExceptionStrategy } from './database-exception-strategy';
import { NetworkExceptionStrategy } from './network-exception-strategy';

/**
 * 异常处理策略管理器
 *
 * 负责管理所有异常处理策略，包括：
 * - 策略注册和发现
 * - 策略排序和选择
 * - 策略执行和监控
 * - 策略生命周期管理
 * - 策略性能统计
 *
 * ## 业务规则
 *
 * ### 策略注册规则
 * - 策略名称必须唯一
 * - 策略类型必须有效
 * - 策略优先级决定执行顺序
 * - 策略必须实现IExceptionHandlingStrategy接口
 *
 * ### 策略执行规则
 * - 按优先级顺序执行策略
 * - 只有匹配的策略才会被执行
 * - 策略执行失败不影响其他策略
 * - 支持策略的启用/禁用状态
 *
 * ### 性能规则
 * - 策略执行时间不能超过配置的超时时间
 * - 支持策略执行的熔断机制
 * - 提供策略性能统计和监控
 * - 支持策略的动态配置更新
 *
 * @example
 * ```typescript
 * const manager = new ExceptionStrategyManager();
 *
 * // 注册策略
 * manager.registerStrategy(new HttpExceptionStrategy());
 * manager.registerStrategy(new ApplicationExceptionStrategy());
 *
 * // 处理异常
 * const exception: IUnifiedException = { ... };
 * const results = await manager.handleException(exception);
 *
 * // 获取策略统计
 * const stats = manager.getStrategyStats();
 * ```
 *
 * @since 2.0.0
 */
@Injectable()
export class ExceptionStrategyManager {
	private readonly logger = new Logger(ExceptionStrategyManager.name);

	/**
	 * 注册的策略列表
	 */
	private strategies: Map<string, IExceptionHandlingStrategy> = new Map();

	/**
	 * 策略执行统计
	 */
	private executionStats = {
		totalExecutions: 0,
		successfulExecutions: 0,
		failedExecutions: 0,
		averageExecutionTime: 0,
		lastExecutionAt: null as Date | null
	};

	/**
	 * 构造函数
	 * 自动注册默认策略
	 */
	constructor() {
		this.registerDefaultStrategies();
	}

	/**
	 * 注册异常处理策略
	 *
	 * @param strategy 异常处理策略
	 * @throws 如果策略名称已存在
	 */
	public registerStrategy(strategy: IExceptionHandlingStrategy): void {
		if (this.strategies.has(strategy.name)) {
			throw new Error(`Strategy with name '${strategy.name}' is already registered`);
		}

		this.strategies.set(strategy.name, strategy);
		this.logger.log(`Registered exception strategy: ${strategy.name}`);
	}

	/**
	 * 注销异常处理策略
	 *
	 * @param strategyName 策略名称
	 * @returns 是否成功注销
	 */
	public unregisterStrategy(strategyName: string): boolean {
		const removed = this.strategies.delete(strategyName);
		if (removed) {
			this.logger.log(`Unregistered exception strategy: ${strategyName}`);
		}
		return removed;
	}

	/**
	 * 获取所有注册的策略
	 *
	 * @returns 策略列表
	 */
	public getStrategies(): IExceptionHandlingStrategy[] {
		return Array.from(this.strategies.values());
	}

	/**
	 * 获取指定名称的策略
	 *
	 * @param strategyName 策略名称
	 * @returns 策略实例，如果不存在则返回undefined
	 */
	public getStrategy(strategyName: string): IExceptionHandlingStrategy | undefined {
		return this.strategies.get(strategyName);
	}

	/**
	 * 处理异常
	 *
	 * @param exception 待处理的异常
	 * @returns 处理结果列表
	 */
	public async handleException(exception: IUnifiedException): Promise<IExceptionHandlingResult[]> {
		const startTime = Date.now();
		const results: IExceptionHandlingResult[] = [];

		try {
			// 获取可以处理此异常的策略
			const applicableStrategies = await this.getApplicableStrategies(exception);

			if (applicableStrategies.length === 0) {
				this.logger.warn(`No applicable strategies found for exception: ${exception.id}`);
				return results;
			}

			// 按优先级执行策略
			for (const strategy of applicableStrategies) {
				try {
					const result = await strategy.apply(exception, {} as any);
					results.push(result);

					if (result.success) {
						this.logger.debug(`Exception ${exception.id} handled by strategy: ${strategy.name}`);
						break; // 如果策略已处理异常，则停止执行后续策略
					}
				} catch (error) {
					this.logger.error(`Strategy ${strategy.name} failed to handle exception ${exception.id}:`, error);

					// 添加失败结果
					results.push({
						success: false,
						action: 'strategy_failed',
						reason: `Strategy execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
					});
				}
			}

			// 更新执行统计
			const executionTime = Date.now() - startTime;
			this.updateExecutionStats(true, executionTime);

			return results;
		} catch (error) {
			const executionTime = Date.now() - startTime;
			this.updateExecutionStats(false, executionTime);

			this.logger.error(`Failed to handle exception ${exception.id}:`, error);

			// 返回失败结果
			return [
				{
					success: false,
					action: 'manager_failed',
					reason: `Exception handling failed: ${error instanceof Error ? error.message : 'Unknown error'}`
				}
			];
		}
	}

	/**
	 * 获取可以处理指定异常的策略
	 *
	 * @param exception 异常信息
	 * @returns 可用的策略列表，按优先级排序
	 */
	private async getApplicableStrategies(exception: IUnifiedException): Promise<IExceptionHandlingStrategy[]> {
		const applicableStrategies: IExceptionHandlingStrategy[] = [];

		for (const strategy of this.strategies.values()) {
			if (strategy instanceof BaseExceptionStrategy && strategy.enabled && (await strategy.canHandle(exception))) {
				applicableStrategies.push(strategy);
			}
		}

		// 按优先级排序（数字越小优先级越高）
		return applicableStrategies.sort((a, b) => {
			if (a instanceof BaseExceptionStrategy && b instanceof BaseExceptionStrategy) {
				return a.priority - b.priority;
			}
			return 0;
		});
	}

	/**
	 * 注册默认策略
	 */
	private registerDefaultStrategies(): void {
		this.registerStrategy(new HttpExceptionStrategy());
		this.registerStrategy(new ApplicationExceptionStrategy());
		this.registerStrategy(new DatabaseExceptionStrategy());
		this.registerStrategy(new NetworkExceptionStrategy());
	}

	/**
	 * 更新执行统计信息
	 *
	 * @param success 是否成功
	 * @param executionTime 执行时间（毫秒）
	 */
	private updateExecutionStats(success: boolean, executionTime: number): void {
		this.executionStats.totalExecutions++;
		this.executionStats.lastExecutionAt = new Date();

		if (success) {
			this.executionStats.successfulExecutions++;
		} else {
			this.executionStats.failedExecutions++;
		}

		// 计算平均执行时间
		this.executionStats.averageExecutionTime =
			(this.executionStats.averageExecutionTime * (this.executionStats.totalExecutions - 1) + executionTime) /
			this.executionStats.totalExecutions;
	}

	/**
	 * 获取策略执行统计信息
	 *
	 * @returns 统计信息
	 */
	public getExecutionStats() {
		return { ...this.executionStats };
	}

	/**
	 * 获取所有策略的统计信息
	 *
	 * @returns 策略统计信息映射
	 */
	public getStrategyStats(): Record<string, any> {
		const stats: Record<string, any> = {};

		for (const [name, strategy] of this.strategies) {
			if (strategy instanceof BaseExceptionStrategy) {
				stats[name] = strategy.getStats();
			}
		}

		return stats;
	}

	/**
	 * 重置所有统计信息
	 */
	public resetStats(): void {
		this.executionStats = {
			totalExecutions: 0,
			successfulExecutions: 0,
			failedExecutions: 0,
			averageExecutionTime: 0,
			lastExecutionAt: null
		};

		for (const strategy of this.strategies.values()) {
			if (strategy instanceof BaseExceptionStrategy) {
				strategy.resetStats();
			}
		}
	}

	/**
	 * 启用指定策略
	 *
	 * @param strategyName 策略名称
	 * @returns 是否成功启用
	 */
	public enableStrategy(strategyName: string): boolean {
		const strategy = this.strategies.get(strategyName);
		if (strategy && strategy instanceof BaseExceptionStrategy) {
			strategy.enable();
			this.logger.log(`Enabled strategy: ${strategyName}`);
			return true;
		}
		return false;
	}

	/**
	 * 禁用指定策略
	 *
	 * @param strategyName 策略名称
	 * @returns 是否成功禁用
	 */
	public disableStrategy(strategyName: string): boolean {
		const strategy = this.strategies.get(strategyName);
		if (strategy && strategy instanceof BaseExceptionStrategy) {
			strategy.disable();
			this.logger.log(`Disabled strategy: ${strategyName}`);
			return true;
		}
		return false;
	}
}
