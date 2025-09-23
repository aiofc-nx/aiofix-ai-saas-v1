/**
 * 命令处理器装饰器
 *
 * 用于标记和配置命令处理器类，提供命令处理器的元数据管理。
 * 装饰器支持自动注册、依赖注入和运行时发现。
 *
 * @description 命令处理器装饰器提供了声明式的命令处理器定义方式
 *
 * ## 业务规则
 *
 * ### 装饰器注册规则
 * - 每个命令类型只能有一个处理器
 * - 处理器必须实现ICommandHandler接口
 * - 处理器应该提供明确的元数据
 * - 处理器支持运行时动态注册
 *
 * ### 装饰器配置规则
 * - 装饰器配置应该是声明式的
 * - 配置选项应该支持默认值
 * - 配置应该在编译时验证
 * - 配置支持环境特定的覆盖
 *
 * @example
 * ```typescript
 * @CommandHandler(CreateUserCommand, {
 *   description: '创建用户命令处理器',
 *   version: '1.0.0',
 *   timeout: { execution: 5000 },
 *   retry: { maxAttempts: 3, backoffStrategy: 'exponential' }
 * })
 * export class CreateUserCommandHandler extends BaseCommandHandler<CreateUserCommand, CreateUserResult> {
 *   // 处理器实现
 * }
 * ```
 *
 * @since 1.0.0
 */

import { ICommand, ICommandMetadata } from '../base/command.interface';

/**
 * 命令处理器选项接口
 */
export interface ICommandHandlerOptions {
  /**
   * 处理器描述
   */
  description?: string;

  /**
   * 处理器版本
   */
  version?: string;

  /**
   * 所需权限
   */
  requiredPermissions?: string[];

  /**
   * 处理器分类
   */
  category?: string;

  /**
   * 处理器标签
   */
  tags?: string[];

  /**
   * 是否需要事务
   */
  requiresTransaction?: boolean;

  /**
   * 超时配置
   */
  timeout?: {
    execution: number;
    alertOnTimeout?: boolean;
  };

  /**
   * 重试配置
   */
  retry?: {
    maxAttempts: number;
    backoffStrategy: 'fixed' | 'exponential' | 'linear';
    baseDelay: number;
  };

  /**
   * 缓存配置
   */
  cache?: {
    enabled: boolean;
    ttl: number;
    keyPrefix: string;
  };

  /**
   * 监控配置
   */
  monitoring?: {
    enabled: boolean;
    slowThreshold: number;
    errorThreshold: number;
  };
}

/**
 * 命令处理器元数据键
 */
export const COMMAND_HANDLER_METADATA_KEY = Symbol('commandHandler');

/**
 * 命令处理器装饰器
 *
 * @description 用于标记命令处理器类并设置元数据
 *
 * @param commandClass - 命令类构造函数
 * @param options - 处理器配置选项
 * @returns 类装饰器函数
 *
 * @example
 * ```typescript
 * @CommandHandler(CreateUserCommand, {
 *   description: '创建用户处理器',
 *   timeout: { execution: 5000 }
 * })
 * export class CreateUserCommandHandler extends BaseCommandHandler<CreateUserCommand, CreateUserResult> {
 *   // 实现
 * }
 * ```
 */
export function CommandHandler<TCommand extends ICommand>(
  commandClass: new (...args: unknown[]) => TCommand,
  options: ICommandHandlerOptions = {},
): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (target: any) {
    // 获取命令类型
    const commandInstance = new commandClass();
    const commandType = commandInstance.commandType;

    // 创建完整的元数据
    const metadata: ICommandMetadata = {
      commandType,
      description: options.description || `${target.name} 命令处理器`,
      version: options.version || '1.0.0',
      requiredPermissions: options.requiredPermissions || [],
      category: options.category,
      tags: options.tags,
      requiresTransaction: options.requiresTransaction ?? true,
      timeout: options.timeout
        ? {
            execution: options.timeout.execution,
            alertOnTimeout: options.timeout.alertOnTimeout ?? false,
          }
        : undefined,
      retry: options.retry,
    };

    // 设置元数据
    Reflect.defineMetadata(COMMAND_HANDLER_METADATA_KEY, metadata, target);

    // 设置命令类型属性
    Object.defineProperty(target.prototype, 'commandType', {
      value: commandType,
      writable: false,
      enumerable: true,
      configurable: false,
    });

    return target;
  };
}

/**
 * 获取命令处理器元数据
 *
 * @param target - 目标类或实例
 * @returns 命令处理器元数据
 */
export function getCommandHandlerMetadata(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any,
): ICommandMetadata | undefined {
  return Reflect.getMetadata(COMMAND_HANDLER_METADATA_KEY, target);
}

/**
 * 检查是否为命令处理器
 *
 * @param target - 要检查的目标
 * @returns 如果是命令处理器返回true，否则返回false
 */
export function isCommandHandler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any,
): boolean {
  return Reflect.hasMetadata(COMMAND_HANDLER_METADATA_KEY, target);
}

/**
 * 命令装饰器元数据键
 */
export const COMMAND_METADATA_KEY = Symbol('command');

/**
 * 命令装饰器
 *
 * @description 用于标记命令类并设置元数据
 *
 * @param options - 命令配置选项
 * @returns 类装饰器函数
 *
 * @example
 * ```typescript
 * @Command({
 *   type: 'CreateUser',
 *   description: '创建用户命令',
 *   version: '1.0.0'
 * })
 * export class CreateUserCommand implements ICommand {
 *   // 命令实现
 * }
 * ```
 */
export function Command(options: {
  type: string;
  description?: string;
  version?: string;
  requiredPermissions?: string[];
  category?: string;
  tags?: string[];
}): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (target: any) {
    const metadata: ICommandMetadata = {
      commandType: options.type,
      description: options.description || `${options.type} 命令`,
      version: options.version || '1.0.0',
      requiredPermissions: options.requiredPermissions || [],
      category: options.category,
      tags: options.tags,
    };

    // 设置元数据
    Reflect.defineMetadata(COMMAND_METADATA_KEY, metadata, target);

    // 设置命令类型属性
    Object.defineProperty(target.prototype, 'commandType', {
      value: options.type,
      writable: false,
      enumerable: true,
      configurable: false,
    });

    return target;
  };
}

/**
 * 获取命令元数据
 *
 * @param target - 目标类或实例
 * @returns 命令元数据
 */
export function getCommandMetadata(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any,
): ICommandMetadata | undefined {
  return Reflect.getMetadata(COMMAND_METADATA_KEY, target);
}

/**
 * 检查是否为命令
 *
 * @param target - 要检查的目标
 * @returns 如果是命令返回true，否则返回false
 */
export function isCommand(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any,
): boolean {
  return Reflect.hasMetadata(COMMAND_METADATA_KEY, target);
}
