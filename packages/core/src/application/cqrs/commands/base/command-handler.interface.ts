/**
 * 命令处理器接口
 *
 * 命令处理器是 CQRS 模式中处理命令的核心组件。
 * 每个命令处理器负责处理特定类型的命令，执行相应的业务逻辑。
 *
 * ## 业务规则
 *
 * ### 单一职责规则
 * - 每个命令处理器只处理一种类型的命令
 * - 命令处理器应该保持简单和专注
 * - 复杂的业务逻辑应该委托给领域服务
 *
 * ### 事务性规则
 * - 命令处理器在事务中执行
 * - 失败时应该回滚所有变更
 * - 成功时应该提交事务并发布事件
 *
 * ### 幂等性规则
 * - 命令处理器应该支持幂等性
 * - 重复执行相同的命令应该产生相同的结果
 * - 应该能够处理重复的命令请求
 *
 * ### 验证规则
 * - 命令处理器应该验证命令的有效性
 * - 验证失败时应该抛出相应的异常
 * - 验证应该在执行业务逻辑之前进行
 *
 * ### 错误处理规则
 * - 命令处理器应该妥善处理各种异常情况
 * - 应该提供有意义的错误信息
 * - 应该记录详细的错误日志
 *
 * @description 命令处理器接口，定义命令处理的标准行为
 * @example
 * ```typescript
 * @CommandHandler(CreateUserCommand)
 * export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand> {
 *   constructor(
 *     private readonly userRepository: IUserRepository,
 *     private readonly eventBus: IEventBus
 *   ) {}
 *
 *   async execute(command: CreateUserCommand): Promise<void> {
 *     // 验证命令
 *     this.validateCommand(command);
 *
 *     // 执行业务逻辑
 *     const user = new User(command.email, command.name);
 *     await this.userRepository.save(user);
 *
 *     // 发布领域事件
 *     await this.eventBus.publishAll(user.getUncommittedEvents());
 *     user.clearUncommittedEvents();
 *   }
 *
 *   private validateCommand(command: CreateUserCommand): void {
 *     if (!command.email || !command.name) {
 *       throw new ValidationError('Email and name are required');
 *     }
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
import { BaseCommand } from './base-command';

/**
 * 命令处理器接口
 *
 * @template TCommand - 命令类型
 */
export interface ICommandHandler<TCommand extends BaseCommand = BaseCommand> {
  /**
   * 执行命令
   *
   * 处理指定的命令，执行相应的业务逻辑。
   * 此方法应该在事务中执行，确保数据一致性。
   *
   * @param command - 要处理的命令
   * @returns Promise，命令执行完成后解析
   * @throws {Error} 当命令执行失败时
   */
  execute(command: TCommand): Promise<void>;

  /**
   * 获取处理器支持的命令类型
   *
   * @returns 命令类型名称
   */
  getSupportedCommandType(): string;

  /**
   * 检查是否支持指定的命令类型
   *
   * @param commandType - 命令类型名称
   * @returns 如果支持指定的命令类型则返回 true，否则返回 false
   */
  supports(commandType: string): boolean;

  /**
   * 验证命令
   *
   * 验证命令的有效性，包括业务规则验证。
   * 验证失败时应该抛出相应的异常。
   *
   * @param command - 要验证的命令
   * @throws {Error} 当命令验证失败时
   * @protected
   */
  validateCommand(command: TCommand): void;

  /**
   * 获取处理器的优先级
   *
   * 当有多个处理器支持同一命令类型时，优先级高的处理器会被选择。
   * 默认优先级为 0。
   *
   * @returns 处理器优先级
   */
  getPriority(): number;

  /**
   * 检查命令是否可以处理
   *
   * 在执行业务逻辑之前检查命令是否可以处理。
   * 可以用于实现复杂的业务规则检查。
   *
   * @param command - 要检查的命令
   * @returns 如果命令可以处理则返回 true，否则返回 false
   */
  canHandle(command: TCommand): Promise<boolean>;
}
