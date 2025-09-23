/**
 * 命令处理器接口
 *
 * 定义命令处理器的基础契约，命令处理器是CQRS模式中负责处理命令的组件。
 * 命令处理器执行状态变更操作，并可能产生领域事件。
 *
 * @description 命令处理器接口定义了处理命令的标准方式
 *
 * ## 业务规则
 *
 * ### 命令处理器职责规则
 * - 命令处理器负责执行具体的命令操作
 * - 命令处理器应该验证命令的有效性
 * - 命令处理器应该处理业务逻辑和状态变更
 * - 命令处理器应该产生和发布领域事件
 *
 * ### 命令处理器事务规则
 * - 命令处理器是事务边界的实现者
 * - 命令处理器应该确保操作的原子性
 * - 命令处理器失败时应该回滚所有变更
 * - 命令处理器应该处理并发冲突
 *
 * ### 命令处理器依赖规则
 * - 命令处理器可以依赖领域服务
 * - 命令处理器可以依赖仓储接口
 * - 命令处理器不应该依赖其他命令处理器
 * - 命令处理器可以通过事件与其他处理器通信
 *
 * @example
 * ```typescript
 * @CommandHandler(CreateUserCommand)
 * export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand, CreateUserResult> {
 *   constructor(
 *     private readonly userRepository: IUserRepository,
 *     private readonly eventBus: IEventBus
 *   ) {}
 *
 *   async handle(command: CreateUserCommand): Promise<CreateUserResult> {
 *     // 1. 验证命令
 *     this.validateCommand(command);
 *
 *     // 2. 创建聚合根
 *     const user = UserAggregate.create(
 *       EntityId.generate(),
 *       command.name,
 *       command.email
 *     );
 *
 *     // 3. 保存聚合根
 *     await this.userRepository.save(user);
 *
 *     // 4. 发布事件
 *     const events = user.getUncommittedEvents();
 *     await this.eventBus.publishAll(events);
 *     user.clearEvents();
 *
 *     return new CreateUserResult(user.id);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { ICommand } from '../base/command.interface';

/**
 * 命令处理器接口
 *
 * 定义命令处理器必须实现的基础能力
 *
 * @template TCommand - 命令类型
 * @template TResult - 处理结果类型
 */
export interface ICommandHandler<TCommand extends ICommand, TResult = void> {
  /**
   * 处理命令
   *
   * @description 执行命令的核心方法，包含完整的业务逻辑
   *
   * @param command - 要处理的命令
   * @returns 处理结果的Promise
   *
   * @throws {CommandValidationError} 当命令验证失败时
   * @throws {BusinessRuleViolationError} 当业务规则验证失败时
   * @throws {ConcurrencyError} 当发生并发冲突时
   *
   * @example
   * ```typescript
   * async handle(command: CreateUserCommand): Promise<CreateUserResult> {
   *   this.validateCommand(command);
   *
   *   const user = UserAggregate.create(command.name, command.email);
   *   await this.userRepository.save(user);
   *
   *   return new CreateUserResult(user.id);
   * }
   * ```
   */
  handle(command: TCommand): Promise<TResult>;

  /**
   * 获取处理器名称
   *
   * @description 返回处理器的唯一标识名称，用于：
   * - 处理器注册和发现
   * - 日志记录和调试
   * - 性能监控和指标收集
   * - 错误追踪和诊断
   *
   * @returns 处理器名称
   *
   * @example
   * ```typescript
   * getHandlerName(): string {
   *   return 'CreateUserCommandHandler';
   * }
   * ```
   */
  getHandlerName(): string;

  /**
   * 获取处理的命令类型
   *
   * @description 返回此处理器能够处理的命令类型
   *
   * @returns 命令类型标识
   *
   * @example
   * ```typescript
   * getCommandType(): string {
   *   return 'CreateUserCommand';
   * }
   * ```
   */
  getCommandType(): string;

  /**
   * 检查是否可以处理指定命令
   *
   * @description 检查此处理器是否可以处理给定的命令
   *
   * @param command - 要检查的命令
   * @returns 如果可以处理返回true，否则返回false
   *
   * @example
   * ```typescript
   * canHandle(command: ICommand): boolean {
   *   return command instanceof CreateUserCommand;
   * }
   * ```
   */
  canHandle(command: ICommand): boolean;
}

/**
 * 命令处理器工厂接口
 */
export interface ICommandHandlerFactory<
  THandler extends ICommandHandler<any, any>,
> {
  /**
   * 创建命令处理器实例
   *
   * @param dependencies - 处理器依赖
   * @returns 处理器实例
   */
  create(dependencies?: Record<string, unknown>): THandler;

  /**
   * 获取处理器类型
   *
   * @returns 处理器类型标识
   */
  getHandlerType(): string;
}

/**
 * 命令处理器注册表接口
 */
export interface ICommandHandlerRegistry {
  /**
   * 注册命令处理器
   *
   * @param commandType - 命令类型
   * @param handlerFactory - 处理器工厂
   */
  register<TCommand extends ICommand, TResult>(
    commandType: string,
    handlerFactory: ICommandHandlerFactory<ICommandHandler<TCommand, TResult>>,
  ): void;

  /**
   * 获取命令处理器
   *
   * @param commandType - 命令类型
   * @returns 处理器实例
   */
  get<TCommand extends ICommand, TResult>(
    commandType: string,
  ): ICommandHandler<TCommand, TResult> | undefined;

  /**
   * 检查处理器是否已注册
   *
   * @param commandType - 命令类型
   * @returns 如果已注册返回true，否则返回false
   */
  has(commandType: string): boolean;

  /**
   * 获取所有已注册的命令类型
   *
   * @returns 命令类型数组
   */
  getRegisteredCommandTypes(): string[];

  /**
   * 清空所有注册的处理器
   */
  clear(): void;
}

/**
 * 命令执行上下文接口
 */
export interface ICommandExecutionContext {
  /**
   * 命令ID
   */
  commandId: string;

  /**
   * 执行开始时间
   */
  startTime: Date;

  /**
   * 用户信息
   */
  user?: {
    id: string;
    name?: string;
    roles?: string[];
  };

  /**
   * 租户信息
   */
  tenant?: {
    id: string;
    name?: string;
  };

  /**
   * 请求信息
   */
  request?: {
    id: string;
    ip?: string;
    userAgent?: string;
  };

  /**
   * 事务信息
   */
  transaction?: {
    id: string;
    isolationLevel?: string;
  };

  /**
   * 自定义上下文
   */
  custom: Record<string, unknown>;
}

/**
 * 命令执行结果接口
 */
export interface ICommandExecutionResult<TResult = any> {
  /**
   * 执行是否成功
   */
  success: boolean;

  /**
   * 执行结果
   */
  result?: TResult;

  /**
   * 错误信息
   */
  error?: Error;

  /**
   * 执行时间（毫秒）
   */
  executionTime: number;

  /**
   * 产生的事件数量
   */
  eventCount: number;

  /**
   * 执行上下文
   */
  context: ICommandExecutionContext;
}

/**
 * 命令验证器接口
 */
export interface ICommandValidator<TCommand extends ICommand> {
  /**
   * 验证命令
   *
   * @param command - 要验证的命令
   * @returns 验证结果
   */
  validate(command: TCommand): Promise<ICommandValidationResult>;

  /**
   * 获取验证器名称
   *
   * @returns 验证器名称
   */
  getValidatorName(): string;
}

/**
 * 命令验证结果接口
 */
export interface ICommandValidationResult {
  /**
   * 验证是否通过
   */
  isValid: boolean;

  /**
   * 验证错误列表
   */
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;

  /**
   * 验证警告列表
   */
  warnings: Array<{
    field: string;
    message: string;
    code: string;
  }>;

  /**
   * 验证上下文
   */
  context: Record<string, unknown>;
}
