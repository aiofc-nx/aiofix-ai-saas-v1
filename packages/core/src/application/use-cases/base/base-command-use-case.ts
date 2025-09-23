/**
 * 基础命令用例抽象类
 *
 * 专门用于处理状态变更的用例，继承自BaseUseCase并添加了命令用例特有的功能。
 * 命令用例负责协调领域层组件来完成状态变更操作，如创建、更新、删除等。
 *
 * @description 基础命令用例类为所有命令用例提供统一的基础功能
 *
 * ## 业务规则
 *
 * ### 命令用例职责规则
 * - 命令用例负责处理系统状态变更操作
 * - 命令用例必须确保业务规则的一致性
 * - 命令用例负责协调聚合根和领域服务
 * - 命令用例必须处理事务边界和事件发布
 *
 * ### 命令用例事务规则
 * - 每个命令用例代表一个业务事务
 * - 事务失败时必须回滚所有变更
 * - 事务成功时必须发布所有领域事件
 * - 事务边界应该与聚合边界对齐
 *
 * ### 命令用例事件规则
 * - 命令用例执行后必须发布领域事件
 * - 事件发布失败不应该影响主要业务逻辑
 * - 事件应该在事务提交后发布
 * - 事件发布应该是异步的
 *
 * ### 命令用例验证规则
 * - 命令用例必须验证业务规则
 * - 验证应该在状态变更之前进行
 * - 验证失败时应该抛出业务异常
 * - 验证逻辑应该是领域逻辑的一部分
 *
 * @example
 * ```typescript
 * export class CreateUserUseCase extends BaseCommandUseCase<CreateUserRequest, CreateUserResponse> {
 *   constructor(
 *     private readonly userRepository: IUserRepository,
 *     private readonly userValidationService: IUserValidationService
 *   ) {
 *     super('CreateUser', '创建用户命令用例', '1.0.0', ['user:create']);
 *   }
 *
 *   protected async executeCommand(
 *     request: CreateUserRequest,
 *     context: IUseCaseContext
 *   ): Promise<CreateUserResponse> {
 *     // 1. 业务验证
 *     await this.validateBusinessRules(request);
 *
 *     // 2. 创建聚合根
 *     const user = User.create(request.name, request.email);
 *
 *     // 3. 保存聚合根（事务边界）
 *     await this.userRepository.save(user);
 *
 *     // 4. 发布事件
 *     await this.publishDomainEvents(user);
 *
 *     return new CreateUserResponse(user.id);
 *   }
 *
 *   private async validateBusinessRules(request: CreateUserRequest): Promise<void> {
 *     const isEmailUnique = await this.userValidationService.isEmailUnique(request.email);
 *     if (!isEmailUnique) {
 *       throw new BusinessRuleViolationError('邮箱已存在');
 *     }
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { BaseUseCase, IUseCaseExecutionResult } from './base-use-case';
import { IUseCaseContext } from './use-case.interface';
import { IAggregateRoot } from '../../../domain/aggregates/base/aggregate-root.interface';
import { BaseDomainEvent } from '../../../domain/events/base/base-domain-event';

/**
 * 基础命令用例抽象类
 *
 * @template TRequest - 命令请求类型
 * @template TResponse - 命令响应类型
 */
export abstract class BaseCommandUseCase<TRequest, TResponse> extends BaseUseCase<TRequest, TResponse> {
	constructor(
		useCaseName: string,
		useCaseDescription: string,
		useCaseVersion: string = '1.0.0',
		requiredPermissions: string[] = []
	) {
		super(useCaseName, useCaseDescription, useCaseVersion, requiredPermissions);
	}

	/**
	 * 执行用例逻辑
	 *
	 * @description 实现基础用例的抽象方法，为命令用例提供标准的执行流程
	 */
	protected async executeUseCase(request: TRequest, context: IUseCaseContext): Promise<TResponse> {
		// 命令用例的标准执行流程
		return await this.executeCommand(request, context);
	}

	/**
	 * 执行命令逻辑
	 *
	 * @description 子类必须实现此方法来定义具体的命令执行逻辑
	 *
	 * @param request - 命令请求
	 * @param context - 执行上下文
	 * @returns 命令响应
	 */
	protected abstract executeCommand(request: TRequest, context: IUseCaseContext): Promise<TResponse>;

	/**
	 * 验证业务规则
	 *
	 * @description 验证命令执行的业务规则
	 * 子类可以重写此方法来添加特定的业务验证
	 *
	 * @param request - 命令请求
	 * @param context - 执行上下文
	 * @throws {BusinessRuleViolationError} 当业务规则验证失败时
	 */
	protected async validateBusinessRules(_request: TRequest, _context: IUseCaseContext): Promise<void> {
		// 子类可以重写此方法来实现具体的业务规则验证
	}

	/**
	 * 发布领域事件
	 *
	 * @description 发布聚合根产生的领域事件
	 *
	 * @param aggregateRoot - 聚合根实例
	 */
	protected async publishDomainEvents(aggregateRoot: IAggregateRoot): Promise<void> {
		if (!aggregateRoot) {
			return;
		}

		const events = aggregateRoot.getUncommittedEvents();
		if (events.length === 0) {
			return;
		}

		try {
			// 这里需要注入事件总线来发布事件
			// await this.eventBus.publishAll(events);

			// 清除已发布的事件
			aggregateRoot.clearEvents();

			this.logEventPublication(events);
		} catch (error) {
			this.logEventPublicationError(events, error);
			throw new Error(`[${this.useCaseName}] 事件发布失败: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * 开始事务
	 *
	 * @description 开始数据库事务
	 * 子类可以重写此方法来自定义事务行为
	 */
	protected async beginTransaction(): Promise<void> {
		// 事务逻辑将在具体实现中注入
		this.log('debug', '开始事务');
	}

	/**
	 * 提交事务
	 *
	 * @description 提交数据库事务
	 */
	protected async commitTransaction(): Promise<void> {
		// 事务逻辑将在具体实现中注入
		this.log('debug', '提交事务');
	}

	/**
	 * 回滚事务
	 *
	 * @description 回滚数据库事务
	 */
	protected async rollbackTransaction(): Promise<void> {
		// 事务逻辑将在具体实现中注入
		this.log('debug', '回滚事务');
	}

	/**
	 * 记录事件发布日志
	 */
	private logEventPublication(events: BaseDomainEvent[]): void {
		this.log('info', `发布了 ${events.length} 个领域事件`, {
			eventTypes: events.map((event) => event.eventType || event.constructor.name)
		});
	}

	/**
	 * 记录事件发布失败日志
	 */
	private logEventPublicationError(events: BaseDomainEvent[], error: unknown): void {
		this.log('error', '事件发布失败', {
			eventCount: events.length,
			error: error instanceof Error ? error.message : String(error)
		});
	}

	/**
	 * 记录日志
	 *
	 * @param level - 日志级别
	 * @param message - 日志消息
	 * @param data - 附加数据
	 */
	protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown): void {
		const logMessage = `[${this.useCaseName}] ${message}`;

		if (data) {
			console.warn(logMessage, data);
		} else {
			console.warn(logMessage);
		}
	}

	/**
	 * 创建命令执行结果
	 *
	 * @param success - 是否成功
	 * @param data - 响应数据
	 * @param error - 错误信息
	 * @param context - 执行上下文
	 * @param executionTime - 执行时间
	 * @returns 执行结果
	 */
	protected createExecutionResult(
		success: boolean,
		data?: TResponse,
		error?: unknown,
		context?: IUseCaseContext,
		executionTime?: number
	): IUseCaseExecutionResult<TResponse> {
		return {
			success,
			data,
			error:
				error instanceof Error
					? {
							code: (error as { errorCode?: string }).errorCode || 'UNKNOWN_ERROR',
							message: error.message,
							details: error
					  }
					: undefined,
			metadata: {
				useCaseName: this.useCaseName,
				executionTime: executionTime || 0,
				timestamp: new Date(),
				context: context || this.createContext()
			}
		};
	}
}

/**
 * 业务规则违反异常
 */
export class BusinessRuleViolationError extends Error {
	readonly errorCode = 'BUSINESS_RULE_VIOLATION';
	readonly errorType = 'business';

	constructor(message: string, public readonly ruleName?: string, public readonly ruleDetails?: unknown) {
		super(message);
		this.name = 'BusinessRuleViolationError';
	}
}
