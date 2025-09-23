/**
 * 基础命令处理器
 *
 * 提供命令处理器的基础实现，包含通用的处理逻辑和模板方法。
 * 子类只需要实现具体的业务逻辑，基类负责处理横切关注点。
 *
 * @description 基础命令处理器为所有命令处理器提供统一的基础功能
 *
 * ## 业务规则
 *
 * ### 命令处理流程规则
 * - 命令处理按标准流程执行：验证 → 业务逻辑 → 事件发布
 * - 每个步骤失败都会中断后续执行
 * - 异常处理应该提供详细的错误信息
 * - 执行过程应该记录完整的日志
 *
 * ### 命令处理事务规则
 * - 命令处理在事务中执行
 * - 事务失败时自动回滚
 * - 事件发布在事务提交后执行
 * - 支持分布式事务协调
 *
 * ### 命令处理监控规则
 * - 记录命令处理的性能指标
 * - 监控命令处理的成功率
 * - 追踪命令处理的异常情况
 * - 支持命令处理的告警机制
 *
 * @example
 * ```typescript
 * @CommandHandler(CreateUserCommand)
 * export class CreateUserCommandHandler extends BaseCommandHandler<CreateUserCommand, CreateUserResult> {
 *   constructor(
 *     private readonly userRepository: IUserRepository,
 *     private readonly eventBus: IEventBus
 *   ) {
 *     super('CreateUserCommandHandler', 'CreateUser');
 *   }
 *
 *   protected async executeCommand(command: CreateUserCommand): Promise<CreateUserResult> {
 *     // 1. 创建聚合根
 *     const user = UserAggregate.create(
 *       EntityId.generate(),
 *       command.name,
 *       command.email
 *     );
 *
 *     // 2. 保存聚合根
 *     await this.userRepository.save(user);
 *
 *     // 3. 返回结果
 *     return new CreateUserResult(user.id);
 *   }
 *
 *   protected async publishEvents(command: CreateUserCommand, result: CreateUserResult): Promise<void> {
 *     // 发布用户创建事件
 *     await this.eventBus.publish(new UserCreatedEvent(result.userId, command.name, command.email));
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { ICommand } from '../base/command.interface';
import {
  ICommandHandler,
  ICommandExecutionContext,
} from './command-handler.interface';

/**
 * 基础命令处理器抽象类
 *
 * @template TCommand - 命令类型
 * @template TResult - 处理结果类型
 */
export abstract class BaseCommandHandler<
  TCommand extends ICommand,
  TResult = void,
> implements ICommandHandler<TCommand, TResult>
{
  /**
   * 处理器名称
   */
  public readonly handlerName: string;

  /**
   * 命令类型
   */
  public readonly commandType: string;

  /**
   * 处理器版本
   */
  public readonly handlerVersion: string;

  constructor(
    handlerName: string,
    commandType: string,
    handlerVersion: string = '1.0.0',
  ) {
    this.handlerName = handlerName;
    this.commandType = commandType;
    this.handlerVersion = handlerVersion;
  }

  /**
   * 处理命令（模板方法）
   *
   * @param command - 要处理的命令
   * @returns 处理结果
   */
  async handle(command: TCommand): Promise<TResult> {
    const context = this.createExecutionContext(command);

    try {
      // 1. 验证命令
      await this.validateCommand(command, context);

      // 2. 开始事务
      await this.beginTransaction(context);

      // 3. 执行业务逻辑
      const result = await this.executeCommand(command, context);

      // 4. 提交事务
      await this.commitTransaction(context);

      // 5. 发布事件
      await this.publishEvents(command, result, context);

      // 6. 记录成功日志
      this.logSuccess(command, result, context);

      return result;
    } catch (error) {
      // 回滚事务
      await this.rollbackTransaction(context);

      // 记录错误日志
      this.logError(command, error, context);

      // 重新抛出异常
      throw error;
    }
  }

  /**
   * 获取处理器名称
   */
  getHandlerName(): string {
    return this.handlerName;
  }

  /**
   * 获取命令类型
   */
  getCommandType(): string {
    return this.commandType;
  }

  /**
   * 检查是否可以处理指定命令
   */
  canHandle(command: ICommand): boolean {
    return command.commandType === this.commandType;
  }

  /**
   * 执行具体的命令逻辑（抽象方法）
   *
   * @description 子类必须实现此方法来定义具体的业务逻辑
   *
   * @param command - 命令实例
   * @param context - 执行上下文
   * @returns 执行结果
   */
  protected abstract executeCommand(
    command: TCommand,
    context: ICommandExecutionContext,
  ): Promise<TResult>;

  /**
   * 验证命令
   *
   * @description 验证命令的有效性，包括数据验证和业务规则验证
   *
   * @param command - 要验证的命令
   * @param context - 执行上下文
   * @throws {CommandValidationError} 当命令验证失败时
   */
  protected async validateCommand(
    command: TCommand,
    context: ICommandExecutionContext,
  ): Promise<void> {
    // 1. 基础验证
    if (!command.commandId) {
      throw new Error('命令ID不能为空');
    }

    if (!command.commandType) {
      throw new Error('命令类型不能为空');
    }

    if (!command.timestamp) {
      throw new Error('命令时间戳不能为空');
    }

    // 2. 命令自身验证
    const validationResult = command.validate();
    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors
        .map((e) => e.message)
        .join(', ');
      throw new Error(`命令验证失败: ${errorMessages}`);
    }

    // 3. 业务规则验证（子类可重写）
    await this.validateBusinessRules(command, context);

    this.log('debug', '命令验证通过', {
      commandId: command.commandId,
      commandType: command.commandType,
    });
  }

  /**
   * 验证业务规则
   *
   * @description 子类可以重写此方法来实现具体的业务规则验证
   *
   * @param command - 命令实例
   * @param context - 执行上下文
   */
  protected async validateBusinessRules(
    _command: TCommand,
    _context: ICommandExecutionContext,
  ): Promise<void> {
    // 默认不做额外验证，子类可以重写
  }

  /**
   * 发布事件
   *
   * @description 子类可以重写此方法来发布特定的领域事件
   *
   * @param command - 命令实例
   * @param result - 执行结果
   * @param context - 执行上下文
   */
  protected async publishEvents(
    _command: TCommand,
    _result: TResult,
    _context: ICommandExecutionContext,
  ): Promise<void> {
    // 默认不发布事件，子类可以重写
  }

  /**
   * 开始事务
   *
   * @param context - 执行上下文
   */
  protected async beginTransaction(
    context: ICommandExecutionContext,
  ): Promise<void> {
    // 事务逻辑将在具体实现中注入
    this.log('debug', '开始事务', { transactionId: context.transaction?.id });
  }

  /**
   * 提交事务
   *
   * @param context - 执行上下文
   */
  protected async commitTransaction(
    context: ICommandExecutionContext,
  ): Promise<void> {
    // 事务逻辑将在具体实现中注入
    this.log('debug', '提交事务', { transactionId: context.transaction?.id });
  }

  /**
   * 回滚事务
   *
   * @param context - 执行上下文
   */
  protected async rollbackTransaction(
    context: ICommandExecutionContext,
  ): Promise<void> {
    // 事务逻辑将在具体实现中注入
    this.log('warn', '回滚事务', { transactionId: context.transaction?.id });
  }

  /**
   * 创建执行上下文
   *
   * @param command - 命令实例
   * @returns 执行上下文
   */
  protected createExecutionContext(
    command: TCommand,
  ): ICommandExecutionContext {
    return {
      commandId: command.commandId,
      startTime: new Date(),
      user: command.userId ? { id: command.userId } : undefined,
      tenant: command.tenantId ? { id: command.tenantId } : undefined,
      request: command.requestId ? { id: command.requestId } : undefined,
      transaction: {
        id: this.generateTransactionId(),
        isolationLevel: 'READ_COMMITTED',
      },
      custom: {},
    };
  }

  /**
   * 记录成功日志
   *
   * @param command - 命令实例
   * @param result - 执行结果
   * @param context - 执行上下文
   */
  protected logSuccess(
    command: TCommand,
    result: TResult,
    context: ICommandExecutionContext,
  ): void {
    const executionTime = Date.now() - context.startTime.getTime();

    this.log('info', '命令处理成功', {
      handlerName: this.handlerName,
      commandId: command.commandId,
      commandType: command.commandType,
      executionTime,
      userId: command.userId,
      tenantId: command.tenantId,
    });
  }

  /**
   * 记录错误日志
   *
   * @param command - 命令实例
   * @param error - 错误对象
   * @param context - 执行上下文
   */
  protected logError(
    command: TCommand,
    error: unknown,
    context: ICommandExecutionContext,
  ): void {
    const executionTime = Date.now() - context.startTime.getTime();

    this.log('error', '命令处理失败', {
      handlerName: this.handlerName,
      commandId: command.commandId,
      commandType: command.commandType,
      executionTime,
      error: error instanceof Error ? error.message : String(error),
      userId: command.userId,
      tenantId: command.tenantId,
    });
  }

  /**
   * 记录日志
   *
   * @param level - 日志级别
   * @param message - 日志消息
   * @param context - 上下文信息
   */
  protected log(
    _level: string,
    _message: string,
    _context?: Record<string, unknown>,
  ): void {
    // 日志记录将在运行时注入
    // TODO: 替换为实际的日志系统
    // console.log(
    //   `[${level.toUpperCase()}] [${this.handlerName}] ${message}`,
    //   context,
    // );
  }

  /**
   * 生成事务ID
   *
   * @returns 唯一的事务ID
   */
  private generateTransactionId(): string {
    return `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
