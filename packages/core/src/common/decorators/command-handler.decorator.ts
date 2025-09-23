/**
 * @CommandHandler 装饰器
 *
 * 用于标记命令处理器类的装饰器。
 * 该装饰器将命令类型与处理器类关联，并提供丰富的配置选项。
 *
 * ## 业务规则
 *
 * ### 命令类型规则
 * - 每个命令处理器必须指定处理的命令类型
 * - 命令类型必须是字符串，用于标识具体的命令
 * - 命令类型在运行时用于路由命令到正确的处理器
 *
 * ### 配置规则
 * - 装饰器支持优先级配置，用于处理多个处理器的情况
 * - 支持超时配置，防止命令处理无限等待
 * - 支持重试配置，处理临时性失败
 * - 支持验证、授权、事务等企业级配置
 *
 * ### 元数据规则
 * - 装饰器将配置信息存储为元数据
 * - 元数据用于运行时行为控制和监控
 * - 支持动态配置和运行时调整
 *
 * @description 命令处理器装饰器，用于标记和配置命令处理器
 * @example
 * ```typescript
 * @CommandHandler('CreateUser', {
 *   priority: 1,
 *   timeout: 30000,
 *   retry: {
 *     maxRetries: 3,
 *     retryDelay: 1000
 *   },
 *   validation: {
 *     rules: { email: 'required|email', name: 'required|string' }
 *   },
 *   authorization: {
 *     permissions: ['user.create']
 *   }
 * })
 * export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand> {
 *   async execute(command: CreateUserCommand): Promise<void> {
 *     // 处理创建用户命令
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
import 'reflect-metadata';
import { BaseCommand } from '../../application/cqrs/commands/base/base-command';
import { ICommandHandler } from '../../application/cqrs/commands/base/command-handler.interface';
import { setCommandHandlerMetadata, getCommandHandlerMetadata as getMetadata } from './metadata.utils';
import {
	ICommandHandlerMetadata,
	IRetryConfig,
	IValidationConfig,
	IAuthorizationConfig,
	ITransactionConfig,
	IMultiTenantConfig,
	IDataIsolationConfig,
	IPerformanceMonitorConfig
} from './metadata.interfaces';
import { DecoratorTarget } from '../types/decorator-types';

/**
 * 命令处理器装饰器选项
 */
export interface ICommandHandlerOptions {
	/**
	 * 处理器优先级（数值越小优先级越高）
	 */
	priority?: number;

	/**
	 * 超时时间（毫秒）
	 */
	timeout?: number;

	/**
	 * 重试配置
	 */
	retry?: IRetryConfig;

	/**
	 * 验证配置
	 */
	validation?: IValidationConfig;

	/**
	 * 授权配置
	 */
	authorization?: IAuthorizationConfig;

	/**
	 * 事务配置
	 */
	transaction?: ITransactionConfig;

	/**
	 * 多租户配置
	 */
	multiTenant?: IMultiTenantConfig;

	/**
	 * 数据隔离配置
	 */
	dataIsolation?: IDataIsolationConfig;

	/**
	 * 性能监控配置
	 */
	performanceMonitor?: IPerformanceMonitorConfig;

	/**
	 * 是否启用日志记录
	 */
	enableLogging?: boolean;

	/**
	 * 是否启用审计
	 */
	enableAudit?: boolean;

	/**
	 * 是否启用性能监控
	 */
	enablePerformanceMonitor?: boolean;

	/**
	 * 自定义配置
	 */
	customConfig?: Record<string, unknown>;
}

/**
 * 命令处理器装饰器工厂函数
 *
 * @param commandType - 命令类型
 * @param options - 装饰器选项
 * @returns 装饰器函数
 */
export function CommandHandler<TCommand extends BaseCommand>(
	commandType: string,
	options: ICommandHandlerOptions = {}
) {
	return function (target: new (...args: unknown[]) => ICommandHandler<TCommand>) {
		// 验证目标类实现了 ICommandHandler 接口
		const prototype = target.prototype;
		if (typeof prototype.execute !== 'function') {
			throw new Error(`Command handler ${target.name} must implement execute method`);
		}

		// 设置命令处理器元数据
		setCommandHandlerMetadata(target, commandType, options);

		// 添加静态方法用于获取命令类型
		Object.defineProperty(target, 'commandType', {
			value: commandType,
			writable: false,
			enumerable: true,
			configurable: false
		});

		// 添加静态方法用于获取处理器优先级
		Object.defineProperty(target, 'priority', {
			value: options.priority || 0,
			writable: false,
			enumerable: true,
			configurable: false
		});

		// 添加静态方法用于检查是否支持指定命令类型
		Object.defineProperty(target, 'supports', {
			value: function (cmdType: string): boolean {
				return cmdType === commandType;
			},
			writable: false,
			enumerable: true,
			configurable: false
		});

		// 添加静态方法用于获取元数据
		Object.defineProperty(target, 'getMetadata', {
			value: function (): ICommandHandlerMetadata | undefined {
				return getMetadata(target);
			},
			writable: false,
			enumerable: true,
			configurable: false
		});

		return target;
	};
}

/**
 * 检查类是否被 @CommandHandler 装饰器标记
 *
 * @param target - 目标类
 * @returns 如果被标记则返回 true，否则返回 false
 */
export function isCommandHandler(target: DecoratorTarget): boolean {
	return getCommandHandlerMetadata(target) !== undefined;
}

/**
 * 获取命令处理器的命令类型
 *
 * @param target - 目标类
 * @returns 命令类型，如果未标记则返回 undefined
 */
export function getCommandType(target: DecoratorTarget): string | undefined {
	const metadata = getCommandHandlerMetadata(target);
	return metadata?.commandType;
}

/**
 * 获取命令处理器的优先级
 *
 * @param target - 目标类
 * @returns 优先级，如果未标记则返回 undefined
 */
export function getCommandHandlerPriority(target: DecoratorTarget): number | undefined {
	const metadata = getCommandHandlerMetadata(target);
	return metadata?.priority;
}

/**
 * 检查命令处理器是否支持指定的命令类型
 *
 * @param target - 目标类
 * @param commandType - 命令类型
 * @returns 如果支持则返回 true，否则返回 false
 */
export function supportsCommandType(target: DecoratorTarget, commandType: string): boolean {
	const metadata = getCommandHandlerMetadata(target);
	return metadata?.commandType === commandType;
}

/**
 * 获取命令处理器的完整元数据
 *
 * @param target - 目标类
 * @returns 命令处理器元数据，如果未标记则返回 undefined
 */
export function getCommandHandlerMetadata(target: DecoratorTarget): ICommandHandlerMetadata | undefined {
	return getMetadata(target);
}

/**
 * 命令处理器装饰器类型
 */
export type CommandHandlerDecorator = typeof CommandHandler;

/**
 * 命令处理器类类型
 */
export type CommandHandlerClass<TCommand extends BaseCommand = BaseCommand> = new (
	...args: unknown[]
) => ICommandHandler<TCommand> & {
	commandType: string;
	priority: number;
	supports(commandType: string): boolean;
	getMetadata(): ICommandHandlerMetadata | undefined;
};
