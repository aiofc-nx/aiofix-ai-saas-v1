/**
 * 基础事件投射器
 *
 * 提供事件投射器的基础实现，包含通用的投射逻辑和模板方法。
 * 子类只需要实现具体的投射逻辑，基类负责处理横切关注点。
 *
 * @description 基础事件投射器为所有投射器提供统一的基础功能
 *
 * ## 业务规则
 *
 * ### 投射处理流程规则
 * - 投射处理按标准流程执行：验证 → 数据提取 → 读模型更新
 * - 每个步骤失败都会中断后续执行
 * - 投射操作必须是幂等的
 * - 投射失败时应该支持重试机制
 *
 * ### 投射处理一致性规则
 * - 投射器确保读模型与写模型的最终一致性
 * - 投射器应该处理事件的顺序性
 * - 投射器应该处理重复事件和乱序事件
 * - 投射器应该支持事件版本控制
 *
 * ### 投射处理性能规则
 * - 投射器应该异步处理事件
 * - 投射器应该支持批量处理
 * - 投射器应该优化读模型的更新性能
 * - 投射器应该支持增量更新策略
 *
 * @example
 * ```typescript
 * @EventProjector('UserCreatedEvent')
 * export class UserCreatedProjector extends BaseReadModelProjector<UserCreatedEvent, UserReadModel> {
 *   constructor(
 *     private readonly userReadRepository: IUserReadRepository
 *   ) {
 *     super('UserCreatedProjector', ['UserCreatedEvent'], 'UserReadModel');
 *   }
 *
 *   protected async projectToReadModel(event: UserCreatedEvent): Promise<void> {
 *     const readModel = new UserReadModel({
 *       id: event.userId,
 *       name: event.name,
 *       email: event.email,
 *       status: 'ACTIVE',
 *       createdAt: event.occurredAt
 *     });
 *
 *     await this.userReadRepository.save(readModel);
 *   }
 *
 *   protected extractEventData(event: UserCreatedEvent): any {
 *     return {
 *       userId: event.userId,
 *       name: event.name,
 *       email: event.email
 *     };
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { BaseDomainEvent } from '../../../../domain/events/base/base-domain-event';
import { IEventProjector, IReadModelProjector, IProjectionExecutionContext } from './event-projector.interface';

/**
 * 基础事件投射器抽象类
 *
 * @template TEvent - 事件类型
 */
export abstract class BaseEventProjector<TEvent extends BaseDomainEvent> implements IEventProjector<TEvent> {
	/**
	 * 投射器名称
	 */
	public readonly projectorName: string;

	/**
	 * 处理的事件类型列表
	 */
	public readonly eventTypes: string[];

	/**
	 * 投射器版本
	 */
	public readonly projectorVersion: string;

	/**
	 * 最大重试次数
	 */
	protected readonly maxRetryCount: number = 3;

	/**
	 * 重试延迟（毫秒）
	 */
	protected readonly retryDelay: number = 1000;

	constructor(projectorName: string, eventTypes: string[], projectorVersion: string = '1.0.0') {
		this.projectorName = projectorName;
		this.eventTypes = eventTypes;
		this.projectorVersion = projectorVersion;
	}

	/**
	 * 投射事件（模板方法）
	 *
	 * @param event - 要投射的事件
	 * @returns 投射结果
	 */
	async project(event: TEvent): Promise<void> {
		const context = this.createExecutionContext(event);

		try {
			// 1. 验证事件
			await this.validateEvent(event, context);

			// 2. 检查幂等性
			const alreadyProcessed = await this.checkIdempotency(event, context);
			if (alreadyProcessed) {
				this.logIdempotencySkip(event, context);
				return;
			}

			// 3. 执行投射逻辑
			await this.executeProjection(event, context);

			// 4. 记录投射状态
			await this.recordProjectionState(event, context);

			// 5. 记录成功日志
			this.logSuccess(event, context);
		} catch (error) {
			// 记录错误日志
			this.logError(event, error, context);

			// 检查是否需要重试
			if (context.retryCount < this.maxRetryCount) {
				await this.scheduleRetry(event, context);
			} else {
				// 重试次数用尽，记录到死信队列
				await this.handleDeadLetter(event, error, context);
				throw error;
			}
		}
	}

	/**
	 * 检查是否可以投射指定事件
	 */
	canProject(event: BaseDomainEvent): boolean {
		return this.eventTypes.includes(event.eventType);
	}

	/**
	 * 获取投射器名称
	 */
	getProjectorName(): string {
		return this.projectorName;
	}

	/**
	 * 获取处理的事件类型
	 */
	getProjectedEventTypes(): string[] {
		return [...this.eventTypes];
	}

	/**
	 * 执行具体的投射逻辑（抽象方法）
	 *
	 * @description 子类必须实现此方法来定义具体的投射逻辑
	 *
	 * @param event - 事件实例
	 * @param context - 执行上下文
	 * @returns 投射结果
	 */
	protected abstract executeProjection(event: TEvent, context: IProjectionExecutionContext): Promise<void>;

	/**
	 * 验证事件
	 *
	 * @description 验证事件的有效性和投射条件
	 *
	 * @param event - 要验证的事件
	 * @param context - 执行上下文
	 * @throws {ProjectionValidationError} 当事件验证失败时
	 */
	protected async validateEvent(event: TEvent, _context: IProjectionExecutionContext): Promise<void> {
		// 1. 基础验证
		if (!event.eventId) {
			throw new Error('事件ID不能为空');
		}

		if (!event.eventType) {
			throw new Error('事件类型不能为空');
		}

		if (!event.aggregateId) {
			throw new Error('聚合根ID不能为空');
		}

		if (!event.occurredAt) {
			throw new Error('事件发生时间不能为空');
		}

		// 2. 事件类型验证
		if (!this.canProject(event)) {
			throw new Error(`投射器 ${this.projectorName} 无法处理事件类型 ${event.eventType}`);
		}

		this.log('debug', '事件验证通过', {
			eventId: event.eventId,
			eventType: event.eventType,
			aggregateId: event.aggregateId
		});
	}

	/**
	 * 检查幂等性
	 *
	 * @description 检查事件是否已经被投射过
	 *
	 * @param event - 事件实例
	 * @param context - 执行上下文
	 * @returns 如果已处理返回true，否则返回false
	 */
	protected async checkIdempotency(_event: TEvent, _context: IProjectionExecutionContext): Promise<boolean> {
		// 幂等性检查逻辑将在具体实现中注入
		// 这里可以检查投射状态表或使用其他机制
		return false; // 临时返回false
	}

	/**
	 * 记录投射状态
	 *
	 * @description 记录事件投射的状态，用于幂等性检查
	 *
	 * @param event - 事件实例
	 * @param context - 执行上下文
	 */
	protected async recordProjectionState(event: TEvent, _context: IProjectionExecutionContext): Promise<void> {
		// 投射状态记录逻辑将在具体实现中注入
		this.log('debug', '投射状态已记录', {
			eventId: event.eventId,
			projectorName: this.projectorName
		});
	}

	/**
	 * 安排重试
	 *
	 * @param event - 事件实例
	 * @param context - 执行上下文
	 */
	protected async scheduleRetry(_event: TEvent, context: IProjectionExecutionContext): Promise<void> {
		const delay = this.calculateRetryDelay(context.retryCount);

		this.log('warn', '投射失败，安排重试', {
			eventId: _event.eventId,
			projectorName: this.projectorName,
			retryCount: context.retryCount,
			delay
		});

		// 重试调度逻辑将在具体实现中注入
		// 这里可以使用消息队列或定时器
	}

	/**
	 * 处理死信
	 *
	 * @param event - 事件实例
	 * @param error - 错误对象
	 * @param context - 执行上下文
	 */
	protected async handleDeadLetter(
		event: TEvent,
		error: unknown,
		_context: IProjectionExecutionContext
	): Promise<void> {
		this.log('error', '投射失败，记录到死信队列', {
			eventId: event.eventId,
			projectorName: this.projectorName,
			error: error instanceof Error ? error.message : String(error),
			retryCount: _context.retryCount
		});

		// 死信处理逻辑将在具体实现中注入
	}

	/**
	 * 计算重试延迟
	 *
	 * @param retryCount - 当前重试次数
	 * @returns 延迟时间（毫秒）
	 */
	protected calculateRetryDelay(retryCount: number): number {
		// 指数退避策略
		return this.retryDelay * Math.pow(2, retryCount);
	}

	/**
	 * 创建执行上下文
	 *
	 * @param event - 事件实例
	 * @returns 执行上下文
	 */
	protected createExecutionContext(event: TEvent): IProjectionExecutionContext {
		return {
			eventId: event.eventId.value,
			startTime: new Date(),
			aggregateId: event.aggregateId.value,
			eventVersion: event.eventVersion,
			projectorName: this.projectorName,
			retryCount: 0,
			custom: {}
		};
	}

	/**
	 * 记录幂等性跳过日志
	 *
	 * @param event - 事件实例
	 * @param context - 执行上下文
	 */
	protected logIdempotencySkip(event: TEvent, _context: IProjectionExecutionContext): void {
		this.log('debug', '事件已投射，跳过处理', {
			projectorName: this.projectorName,
			eventId: event.eventId,
			eventType: event.eventType
		});
	}

	/**
	 * 记录成功日志
	 *
	 * @param event - 事件实例
	 * @param context - 执行上下文
	 */
	protected logSuccess(event: TEvent, context: IProjectionExecutionContext): void {
		const executionTime = Date.now() - context.startTime.getTime();

		this.log('info', '事件投射成功', {
			projectorName: this.projectorName,
			eventId: event.eventId,
			eventType: event.eventType,
			aggregateId: event.aggregateId,
			executionTime
		});
	}

	/**
	 * 记录错误日志
	 *
	 * @param event - 事件实例
	 * @param error - 错误对象
	 * @param context - 执行上下文
	 */
	protected logError(event: TEvent, error: unknown, context: IProjectionExecutionContext): void {
		const executionTime = Date.now() - context.startTime.getTime();

		this.log('error', '事件投射失败', {
			projectorName: this.projectorName,
			eventId: event.eventId,
			eventType: event.eventType,
			aggregateId: event.aggregateId,
			executionTime,
			error: error instanceof Error ? error.message : String(error),
			retryCount: context.retryCount
		});
	}

	/**
	 * 记录日志
	 *
	 * @param level - 日志级别
	 * @param message - 日志消息
	 * @param context - 上下文信息
	 */
	protected log(level: string, message: string, context?: Record<string, unknown>): void {
		// 日志记录将在运行时注入
		// 测试环境不需要实际日志输出
		if (level === 'error' || level === 'warn') {
			console.warn(`[${level.toUpperCase()}] [${this.projectorName}] ${message}`, context);
		}
	}
}

/**
 * 基础读模型投射器
 *
 * @template TEvent - 事件类型
 * @template TReadModel - 读模型类型
 */
export abstract class BaseReadModelProjector<TEvent extends BaseDomainEvent, TReadModel>
	extends BaseEventProjector<TEvent>
	implements IReadModelProjector<TEvent>
{
	/**
	 * 读模型类型
	 */
	public readonly readModelType: string;

	constructor(projectorName: string, eventTypes: string[], readModelType: string, projectorVersion: string = '1.0.0') {
		super(projectorName, eventTypes, projectorVersion);
		this.readModelType = readModelType;
	}

	/**
	 * 获取读模型类型
	 */
	getReadModelType(): string {
		return this.readModelType;
	}

	/**
	 * 重建读模型
	 *
	 * @param aggregateId - 聚合根标识符
	 * @param events - 事件历史
	 */
	async rebuildReadModel(aggregateId: string, events: TEvent[]): Promise<void> {
		this.log('info', '开始重建读模型', {
			aggregateId,
			eventCount: events.length,
			readModelType: this.readModelType
		});

		try {
			// 1. 删除现有读模型
			await this.deleteExistingReadModel(aggregateId);

			// 2. 按顺序重放事件
			for (const event of events.sort((a, b) => a.version - b.version)) {
				await this.project(event);
			}

			this.log('info', '读模型重建完成', {
				aggregateId,
				eventCount: events.length,
				readModelType: this.readModelType
			});
		} catch (error) {
			this.log('error', '读模型重建失败', {
				aggregateId,
				error: error instanceof Error ? error.message : String(error)
			});
			throw error;
		}
	}

	/**
	 * 执行投射逻辑
	 *
	 * @param event - 事件实例
	 * @param context - 执行上下文
	 */
	protected async executeProjection(event: TEvent, _context: IProjectionExecutionContext): Promise<void> {
		// 1. 提取事件数据
		const eventData = this.extractEventData(event);

		// 2. 查找或创建读模型
		const readModel = await this.findOrCreateReadModel(eventData, event);

		// 3. 更新读模型
		await this.updateReadModel(readModel, eventData, event);

		// 4. 保存读模型
		await this.saveReadModel(readModel, event);
	}

	/**
	 * 提取事件数据（抽象方法）
	 *
	 * @description 子类必须实现此方法来提取事件中的相关数据
	 *
	 * @param event - 事件实例
	 * @returns 提取的事件数据
	 */
	protected abstract extractEventData(event: TEvent): Record<string, unknown>;

	/**
	 * 查找或创建读模型（抽象方法）
	 *
	 * @description 子类必须实现此方法来查找现有读模型或创建新的读模型
	 *
	 * @param eventData - 事件数据
	 * @param event - 事件实例
	 * @returns 读模型实例
	 */
	protected abstract findOrCreateReadModel(eventData: Record<string, unknown>, event: TEvent): Promise<TReadModel>;

	/**
	 * 更新读模型（抽象方法）
	 *
	 * @description 子类必须实现此方法来更新读模型的数据
	 *
	 * @param readModel - 读模型实例
	 * @param eventData - 事件数据
	 * @param event - 事件实例
	 * @returns 更新操作的Promise
	 */
	protected abstract updateReadModel(
		readModel: TReadModel,
		eventData: Record<string, unknown>,
		event: TEvent
	): Promise<void>;

	/**
	 * 保存读模型（抽象方法）
	 *
	 * @description 子类必须实现此方法来保存更新后的读模型
	 *
	 * @param readModel - 读模型实例
	 * @param event - 事件实例
	 * @returns 保存操作的Promise
	 */
	protected abstract saveReadModel(readModel: TReadModel, event: TEvent): Promise<void>;

	/**
	 * 删除现有读模型
	 *
	 * @description 子类可以重写此方法来实现读模型的删除逻辑
	 *
	 * @param aggregateId - 聚合根标识符
	 */
	protected async deleteExistingReadModel(aggregateId: string): Promise<void> {
		// 默认实现，子类可以重写
		this.log('debug', '删除现有读模型', {
			aggregateId,
			readModelType: this.readModelType
		});
	}

	/**
	 * 创建执行上下文
	 *
	 * @param event - 事件实例
	 * @returns 执行上下文
	 */
	protected override createExecutionContext(event: TEvent): IProjectionExecutionContext {
		return {
			eventId: event.eventId.value,
			startTime: new Date(),
			aggregateId: event.aggregateId.value,
			eventVersion: event.eventVersion,
			projectorName: this.projectorName,
			readModelType: this.readModelType,
			retryCount: 0,
			custom: {}
		};
	}
}
