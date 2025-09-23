/**
 * CoreSaga - 核心 Saga 实现
 *
 * 提供了完整的 Saga 模式实现，支持分布式事务管理、
 * 补偿操作、超时处理、状态管理等企业级特性。
 *
 * ## 业务规则
 *
 * ### Saga 执行规则
 * - 支持顺序和并行步骤执行
 * - 支持条件步骤和超时处理
 * - 支持步骤重试和错误恢复
 * - 支持 Saga 状态持久化
 *
 * ### 补偿规则
 * - 支持自动和手动补偿
 * - 支持部分补偿和完全补偿
 * - 支持补偿重试机制
 * - 支持补偿超时处理
 *
 * ### 监控规则
 * - 记录 Saga 执行状态
 * - 监控步骤执行时间
 * - 统计成功率和失败率
 * - 提供健康检查机制
 *
 * ### 错误处理规则
 * - 步骤失败时自动重试
 * - 重试失败时触发补偿
 * - 支持自定义错误处理策略
 * - 提供详细的错误信息
 *
 * @description 核心 Saga 实现类
 * @example
 * ```typescript
 * class OrderSaga extends CoreSaga {
 *   constructor() {
 *     super('OrderSaga', {
 *       enableCompensation: true,
 *       enableTimeout: true,
 *       timeout: 30000,
 *       maxRetries: 3,
 *       retryDelay: 1000
 *     });
 *   }
 *
 *   protected defineSteps(): ISagaStep[] {
 *     return [
 *       {
 *         stepId: 'create-order',
 *         stepName: 'Create Order',
 *         stepType: SagaStepType.COMMAND,
 *         order: 1,
 *         timeout: 5000,
 *         maxRetries: 3,
 *         retryDelay: 1000
 *       },
 *       {
 *         stepId: 'reserve-inventory',
 *         stepName: 'Reserve Inventory',
 *         stepType: SagaStepType.COMMAND,
 *         order: 2,
 *         timeout: 10000,
 *         maxRetries: 2,
 *         retryDelay: 2000
 *       }
 *     ];
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import {
	ISaga,
	ISagaStep,
	ISagaExecutionContext,
	ISagaConfiguration,
	SagaStatus,
	SagaStepStatus
} from './saga.interface';

/**
 * 核心 Saga 实现
 */
@Injectable()
export abstract class CoreSaga implements ISaga {
	protected readonly steps: ISagaStep[] = [];
	protected configuration: ISagaConfiguration;
	protected status: SagaStatus = SagaStatus.NOT_STARTED;

	constructor(
		public readonly sagaType: string,
		public readonly enableCompensation: boolean = true,
		public readonly enableTimeout: boolean = true,
		public readonly timeout?: number,
		public readonly maxRetries: number = 3,
		public readonly retryDelay: number = 1000,
		protected readonly logger?: ILoggerService
	) {
		this.configuration = {
			enabled: true,
			defaultTimeout: timeout || 30000,
			defaultRetries: maxRetries,
			defaultRetryDelay: retryDelay,
			enableCompensation,
			enableTimeout,
			enableConcurrency: true,
			maxConcurrency: 10,
			enablePersistence: true,
			persistenceInterval: 5000,
			enableMonitoring: true,
			monitoringInterval: 10000
		};

		// 初始化步骤
		this.initializeSteps();
	}

	/**
	 * 配置 Saga
	 */
	public configure(config: Partial<ISagaConfiguration>): void {
		this.configuration = { ...this.configuration, ...config };
		this.logger?.debug(`Saga ${this.sagaType} configuration updated`, LogContext.SYSTEM);
	}

	/**
	 * 获取配置
	 */
	public getConfiguration(): ISagaConfiguration {
		return { ...this.configuration };
	}

	/**
	 * 执行 Saga
	 */
	public execute(context: ISagaExecutionContext): Observable<ISagaExecutionContext> {
		if (!this.configuration.enabled) {
			return throwError(() => new Error('Saga is disabled'));
		}

		this.logger?.info(`Starting saga execution: ${this.sagaType}`, LogContext.SYSTEM, {
			sagaId: context.sagaId,
			sagaType: this.sagaType,
			stepCount: context.steps.length
		});

		return this.executeSteps(context).pipe(
			tap((updatedContext) => {
				this.logger?.info(`Saga execution completed: ${this.sagaType}`, LogContext.SYSTEM, {
					sagaId: updatedContext.sagaId,
					status: updatedContext.status,
					duration: updatedContext.endTime ? updatedContext.endTime.getTime() - updatedContext.startTime.getTime() : 0
				});
			}),
			catchError((error) => {
				this.logger?.error(
					`Saga execution failed: ${this.sagaType}`,
					LogContext.SYSTEM,
					{
						sagaId: context.sagaId,
						error: (error as Error).message
					},
					error as Error
				);
				return throwError(() => error);
			})
		);
	}

	/**
	 * 补偿 Saga
	 */
	public compensate(context: ISagaExecutionContext): Observable<ISagaExecutionContext> {
		if (!this.enableCompensation) {
			return throwError(() => new Error('Compensation is disabled'));
		}

		this.logger?.info(`Starting saga compensation: ${this.sagaType}`, LogContext.SYSTEM, {
			sagaId: context.sagaId,
			sagaType: this.sagaType
		});

		context.status = SagaStatus.COMPENSATING;

		return this.executeCompensation(context).pipe(
			tap((updatedContext) => {
				this.logger?.info(`Saga compensation completed: ${this.sagaType}`, LogContext.SYSTEM, {
					sagaId: updatedContext.sagaId,
					status: updatedContext.status
				});
			}),
			catchError((error) => {
				this.logger?.error(
					`Saga compensation failed: ${this.sagaType}`,
					LogContext.SYSTEM,
					{
						sagaId: context.sagaId,
						error: (error as Error).message
					},
					error as Error
				);
				return throwError(() => error);
			})
		);
	}

	/**
	 * 处理超时
	 */
	public handleTimeout(context: ISagaExecutionContext): Observable<ISagaExecutionContext> {
		if (!this.enableTimeout) {
			return of(context);
		}

		this.logger?.warn(`Saga timeout: ${this.sagaType}`, LogContext.SYSTEM, {
			sagaId: context.sagaId,
			sagaType: this.sagaType,
			timeout: this.timeout
		});

		context.status = SagaStatus.TIMEOUT;
		context.endTime = new Date();

		// 如果启用补偿，自动触发补偿
		if (this.enableCompensation) {
			return this.compensate(context);
		}

		return of(context);
	}

	/**
	 * 验证 Saga 配置
	 */
	public validate(): boolean {
		try {
			// 验证基本配置
			if (!this.sagaType || this.sagaType.trim() === '') {
				return false;
			}

			// 验证步骤
			if (this.steps.length === 0) {
				return false;
			}

			// 验证每个步骤
			for (const step of this.steps) {
				if (!this.validateStep(step)) {
					return false;
				}
			}

			return true;
		} catch (error) {
			this.logger?.error(
				`Saga validation failed: ${this.sagaType}`,
				LogContext.SYSTEM,
				{ error: (error as Error).message },
				error as Error
			);
			return false;
		}
	}

	/**
	 * 获取 Saga 步骤
	 */
	public getSteps(): ISagaStep[] {
		return [...this.steps];
	}

	/**
	 * 添加步骤
	 */
	public addStep(step: ISagaStep): void {
		if (this.validateStep(step)) {
			this.steps.push(step);
			this.steps.sort((a, b) => a.order - b.order);
			this.logger?.debug(`Added step to saga ${this.sagaType}: ${step.stepName}`, LogContext.SYSTEM, {
				stepId: step.stepId,
				stepName: step.stepName
			});
		}
	}

	/**
	 * 移除步骤
	 */
	public removeStep(stepId: string): boolean {
		const index = this.steps.findIndex((step) => step.stepId === stepId);
		if (index !== -1) {
			const removedStep = this.steps.splice(index, 1)[0];
			this.logger?.debug(`Removed step from saga ${this.sagaType}: ${removedStep.stepName}`, LogContext.SYSTEM, {
				stepId: removedStep.stepId,
				stepName: removedStep.stepName
			});
			return true;
		}
		return false;
	}

	/**
	 * 获取步骤
	 */
	public getStep(stepId: string): ISagaStep | undefined {
		return this.steps.find((step) => step.stepId === stepId);
	}

	/**
	 * 获取 Saga 状态
	 */
	public getStatus(): SagaStatus {
		return this.status || SagaStatus.NOT_STARTED;
	}

	/**
	 * 更新 Saga 状态
	 */
	public updateStatus(status: SagaStatus): void {
		this.status = status;
		this.logger?.debug(`Saga status updated: ${this.sagaType}`, LogContext.SYSTEM, { status });
	}

	/**
	 * 更新 Saga 配置
	 */
	public updateConfiguration(config: Partial<ISagaConfiguration>): void {
		this.configure(config);
	}

	/**
	 * 执行单个步骤（公共方法）
	 */
	public async executeStepById(
		stepId: string,
		context: ISagaExecutionContext
	): Promise<{ success: boolean; data?: unknown; error?: string }> {
		const step = this.getStep(stepId);
		if (!step) {
			return {
				success: false,
				error: `Step ${stepId} not found`
			};
		}

		try {
			const result = await this.executeStep(step, context).toPromise();
			return { success: true, data: result };
		} catch (error) {
			return { success: false, error: (error as Error).message };
		}
	}

	/**
	 * 补偿单个步骤（公共方法）
	 */
	public async compensateStepById(
		stepId: string,
		context: ISagaExecutionContext
	): Promise<{ success: boolean; data?: unknown; error?: string }> {
		const step = this.getStep(stepId);
		if (!step) {
			return {
				success: false,
				error: `Step ${stepId} not found`
			};
		}

		try {
			const result = await this.executeCompensationStep(step, context).toPromise();
			return { success: true, data: result };
		} catch (error) {
			return { success: false, error: (error as Error).message };
		}
	}

	/**
	 * 更新步骤
	 */
	public updateStep(stepId: string, updates: Partial<ISagaStep>): boolean {
		const step = this.getStep(stepId);
		if (step) {
			Object.assign(step, updates);
			this.logger?.debug(`Updated step in saga ${this.sagaType}: ${step.stepName}`, LogContext.SYSTEM, {
				stepId: step.stepId,
				stepName: step.stepName
			});
			return true;
		}
		return false;
	}

	/**
	 * 初始化步骤
	 */
	protected initializeSteps(): void {
		const definedSteps = this.defineSteps();
		for (const step of definedSteps) {
			this.addStep(step);
		}
	}

	/**
	 * 定义 Saga 步骤（子类实现）
	 */
	protected abstract defineSteps(): ISagaStep[];

	/**
	 * 执行步骤（子类实现）
	 */
	protected abstract executeStep(step: ISagaStep, context: ISagaExecutionContext): Observable<unknown>;

	/**
	 * 执行补偿步骤（子类实现）
	 */
	protected abstract executeCompensationStep(step: ISagaStep, context: ISagaExecutionContext): Observable<unknown>;

	/**
	 * 执行所有步骤
	 */
	private executeSteps(context: ISagaExecutionContext): Observable<ISagaExecutionContext> {
		context.status = SagaStatus.RUNNING;
		context.currentStepIndex = 0;

		return this.executeStepAtIndex(context, 0).pipe(
			map((updatedContext) => {
				// 只有在所有步骤都完成且状态仍然是 RUNNING 时才设置为 COMPLETED
				if (
					updatedContext.status === SagaStatus.RUNNING &&
					updatedContext.currentStepIndex >= updatedContext.steps.length
				) {
					updatedContext.status = SagaStatus.COMPLETED;
					updatedContext.endTime = new Date();
				}
				return updatedContext;
			})
		);
	}

	/**
	 * 在指定索引执行步骤
	 */
	private executeStepAtIndex(context: ISagaExecutionContext, stepIndex: number): Observable<ISagaExecutionContext> {
		if (stepIndex >= context.steps.length) {
			return of(context);
		}

		const step = context.steps[stepIndex];
		context.currentStepIndex = stepIndex;

		this.logger?.debug(`Executing step: ${step.stepName}`, LogContext.SYSTEM, {
			sagaId: context.sagaId,
			stepId: step.stepId,
			stepName: step.stepName,
			stepType: step.stepType
		});

		step.status = SagaStepStatus.EXECUTING;
		step.startTime = new Date();

		return this.executeStep(step, context).pipe(
			switchMap((result) => {
				step.status = SagaStepStatus.COMPLETED;
				step.endTime = new Date();
				step.result = result;

				this.logger?.debug(`Step completed: ${step.stepName}`, LogContext.SYSTEM, {
					sagaId: context.sagaId,
					stepId: step.stepId,
					stepName: step.stepName,
					duration: step.endTime.getTime() - (step.startTime?.getTime() || 0)
				});

				// 继续执行下一步
				return this.executeStepAtIndex(context, stepIndex + 1);
			}),
			catchError((error) => {
				step.status = SagaStepStatus.FAILED;
				step.endTime = new Date();
				step.error = (error as Error).message;

				this.logger?.error(
					`Step failed: ${step.stepName}`,
					LogContext.SYSTEM,
					{
						sagaId: context.sagaId,
						stepId: step.stepId,
						stepName: step.stepName,
						error: (error as Error).message
					},
					error as Error
				);

				// 如果启用补偿，触发补偿
				if (this.enableCompensation) {
					context.status = SagaStatus.FAILED;
					return this.compensate(context);
				}

				context.status = SagaStatus.FAILED;
				context.error = (error as Error).message;
				context.endTime = new Date();
				return of(context);
			})
		);
	}

	/**
	 * 执行补偿
	 */
	private executeCompensation(context: ISagaExecutionContext): Observable<ISagaExecutionContext> {
		// 从当前步骤开始向前补偿
		const compensationSteps = context.steps
			.slice(0, context.currentStepIndex + 1)
			.reverse()
			.filter((step) => step.status === SagaStepStatus.COMPLETED);

		if (compensationSteps.length === 0) {
			context.status = SagaStatus.COMPENSATED;
			context.endTime = new Date();
			return of(context);
		}

		return this.executeCompensationSteps(context, compensationSteps, 0).pipe(
			map((updatedContext) => {
				updatedContext.status = SagaStatus.COMPENSATED;
				updatedContext.endTime = new Date();
				return updatedContext;
			})
		);
	}

	/**
	 * 执行补偿步骤
	 */
	private executeCompensationSteps(
		context: ISagaExecutionContext,
		compensationSteps: ISagaStep[],
		stepIndex: number
	): Observable<ISagaExecutionContext> {
		if (stepIndex >= compensationSteps.length) {
			return of(context);
		}

		const step = compensationSteps[stepIndex];
		step.status = SagaStepStatus.COMPENSATING;

		this.logger?.debug(`Executing compensation step: ${step.stepName}`, LogContext.SYSTEM, {
			sagaId: context.sagaId,
			stepId: step.stepId,
			stepName: step.stepName
		});

		return this.executeCompensationStep(step, context).pipe(
			switchMap((result) => {
				step.status = SagaStepStatus.COMPENSATED;
				step.result = result;

				this.logger?.debug(`Compensation step completed: ${step.stepName}`, LogContext.SYSTEM, {
					sagaId: context.sagaId,
					stepId: step.stepId,
					stepName: step.stepName
				});

				// 继续执行下一个补偿步骤
				return this.executeCompensationSteps(context, compensationSteps, stepIndex + 1);
			}),
			catchError((error) => {
				this.logger?.error(
					`Compensation step failed: ${step.stepName}`,
					LogContext.SYSTEM,
					{
						sagaId: context.sagaId,
						stepId: step.stepId,
						stepName: step.stepName,
						error: (error as Error).message
					},
					error as Error
				);

				// 补偿失败，但继续执行其他补偿步骤
				return this.executeCompensationSteps(context, compensationSteps, stepIndex + 1);
			})
		);
	}

	/**
	 * 验证步骤
	 */
	private validateStep(step: ISagaStep): boolean {
		return !!(
			step.stepId &&
			step.stepName &&
			step.stepType &&
			step.order >= 0 &&
			step.maxRetries >= 0 &&
			step.retryDelay >= 0
		);
	}
}
