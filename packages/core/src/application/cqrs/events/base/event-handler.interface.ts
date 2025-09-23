/**
 * 事件处理器接口
 *
 * 事件处理器是 CQRS 模式中处理领域事件的核心组件。
 * 每个事件处理器负责处理特定类型的领域事件，执行相应的副作用。
 *
 * ## 业务规则
 *
 * ### 单一职责规则
 * - 每个事件处理器只处理一种类型的事件
 * - 事件处理器应该保持简单和专注
 * - 复杂的业务逻辑应该委托给领域服务
 *
 * ### 幂等性规则
 * - 事件处理器应该支持幂等性
 * - 重复处理相同的事件应该产生相同的结果
 * - 应该能够处理重复的事件
 *
 * ### 异步处理规则
 * - 事件处理器通常是异步的
 * - 应该支持重试机制
 * - 应该处理处理失败的情况
 *
 * ### 错误处理规则
 * - 事件处理器应该妥善处理各种异常情况
 * - 应该提供有意义的错误信息
 * - 应该记录详细的错误日志
 * - 应该支持死信队列机制
 *
 * ### 顺序性规则
 * - 某些事件可能需要按顺序处理
 * - 应该支持事件排序和去重
 * - 应该处理乱序事件的情况
 *
 * @description 事件处理器接口，定义事件处理的标准行为
 * @example
 * ```typescript
 * @EventsHandler(UserCreatedEvent)
 * export class UserCreatedEventHandler implements IEventHandler<UserCreatedEvent> {
 *   constructor(
 *     private readonly emailService: IEmailService,
 *     private readonly auditService: IAuditService
 *   ) {}
 *
 *   async handle(event: UserCreatedEvent): Promise<void> {
 *     try {
 *       // 发送欢迎邮件
 *       await this.emailService.sendWelcomeEmail(event.email, event.name);
 *
 *       // 记录审计日志
 *       await this.auditService.logUserCreation(event);
 *
 *       // 其他副作用...
 *     } catch (error) {
 *       // 记录错误并重试
 *       this.logger.error('Failed to handle UserCreatedEvent', error);
 *       throw error;
 *     }
 *   }
 *
 *   getSupportedEventType(): string {
 *     return 'UserCreated';
 *   }
 *
 *   supports(eventType: string): boolean {
 *     return eventType === 'UserCreated';
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
import { BaseDomainEvent } from '../../../../domain/events/base/base-domain-event';

/**
 * 事件处理器接口
 *
 * @template TEvent - 事件类型
 */
export interface IEventHandler<
  TEvent extends BaseDomainEvent = BaseDomainEvent,
> {
  /**
   * 处理事件
   *
   * 处理指定的领域事件，执行相应的副作用。
   * 此方法应该是异步的，支持重试机制。
   *
   * @param event - 要处理的事件
   * @returns Promise，事件处理完成后解析
   * @throws {Error} 当事件处理失败时
   */
  handle(event: TEvent): Promise<void>;

  /**
   * 获取处理器支持的事件类型
   *
   * @returns 事件类型名称
   */
  getSupportedEventType(): string;

  /**
   * 检查是否支持指定的事件类型
   *
   * @param eventType - 事件类型名称
   * @returns 如果支持指定的事件类型则返回 true，否则返回 false
   */
  supports(eventType: string): boolean;

  /**
   * 验证事件
   *
   * 验证事件的有效性，包括业务规则验证。
   * 验证失败时应该抛出相应的异常。
   *
   * @param event - 要验证的事件
   * @throws {Error} 当事件验证失败时
   * @protected
   */
  validateEvent(event: TEvent): void;

  /**
   * 获取处理器的优先级
   *
   * 当有多个处理器支持同一事件类型时，优先级高的处理器会被选择。
   * 默认优先级为 0。
   *
   * @returns 处理器优先级
   */
  getPriority(): number;

  /**
   * 检查事件是否可以处理
   *
   * 在处理事件之前检查事件是否可以处理。
   * 可以用于实现复杂的业务规则检查。
   *
   * @param event - 要检查的事件
   * @returns 如果事件可以处理则返回 true，否则返回 false
   */
  canHandle(event: TEvent): Promise<boolean>;

  /**
   * 获取最大重试次数
   *
   * 当事件处理失败时的最大重试次数。
   * 返回 0 表示不重试。
   *
   * @param event - 事件对象
   * @returns 最大重试次数
   */
  getMaxRetries(event: TEvent): number;

  /**
   * 获取重试延迟时间（毫秒）
   *
   * 重试之间的延迟时间。
   * 可以返回固定值或根据重试次数计算。
   *
   * @param event - 事件对象
   * @param retryCount - 当前重试次数
   * @returns 重试延迟时间（毫秒）
   */
  getRetryDelay(event: TEvent, retryCount: number): number;

  /**
   * 检查事件是否应该被忽略
   *
   * 某些情况下，事件可能应该被忽略而不处理。
   * 例如，过期的事件或重复的事件。
   *
   * @param event - 要检查的事件
   * @returns 如果事件应该被忽略则返回 true，否则返回 false
   */
  shouldIgnore(event: TEvent): Promise<boolean>;

  /**
   * 处理事件失败
   *
   * 当事件处理失败且达到最大重试次数时调用此方法。
   * 可以用于实现死信队列或其他失败处理机制。
   *
   * @param event - 失败的事件
   * @param error - 失败的错误信息
   * @returns Promise，失败处理完成后解析
   */
  handleFailure(event: TEvent, error: Error): Promise<void>;

  /**
   * 检查事件是否已处理
   *
   * 检查事件是否已经被处理过，用于实现幂等性。
   * 可以通过事件ID或其他唯一标识符来判断。
   *
   * @param event - 要检查的事件
   * @returns 如果事件已处理则返回 true，否则返回 false
   */
  isEventProcessed(event: TEvent): Promise<boolean>;

  /**
   * 标记事件为已处理
   *
   * 标记事件为已处理状态，用于实现幂等性。
   * 应该存储事件ID或其他唯一标识符。
   *
   * @param event - 要标记的事件
   * @returns Promise，标记完成后解析
   */
  markEventAsProcessed(event: TEvent): Promise<void>;
}
