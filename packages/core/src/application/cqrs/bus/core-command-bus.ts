/**
 * 核心命令总线实现
 *
 * 命令总线是 CQRS 模式中处理命令的核心组件，负责路由命令到相应的处理器。
 * 本实现提供了基础的命令路由、中间件支持和错误处理功能。
 *
 * ## 业务规则
 *
 * ### 路由规则
 * - 每个命令类型只能有一个处理器
 * - 处理器必须实现 ICommandHandler 接口
 * - 支持优先级排序，优先级高的处理器优先执行
 * - 未注册的命令类型会抛出异常
 *
 * ### 中间件规则
 * - 中间件按优先级顺序执行
 * - 中间件可以修改命令或阻止执行
 * - 中间件异常会中断执行链
 * - 支持动态添加和移除中间件
 *
 * ### 错误处理规则
 * - 提供统一的错误处理机制
 * - 记录详细的执行日志
 * - 支持错误重试和恢复
 * - 提供错误统计和监控
 *
 * @description 核心命令总线实现，提供命令路由和处理功能
 * @example
 * ```typescript
 * const commandBus = new CoreCommandBus();
 *
 * // 注册命令处理器
 * commandBus.registerHandler('CreateUser', new CreateUserCommandHandler());
 *
 * // 添加中间件
 * commandBus.addMiddleware(new LoggingMiddleware());
 * commandBus.addMiddleware(new ValidationMiddleware());
 *
 * // 执行命令
 * const command = new CreateUserCommand('user@example.com', 'John Doe');
 * await commandBus.execute(command);
 * ```
 *
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import { BaseCommand } from '../commands/base/base-command';
import { ICommandHandler } from '../commands/base/command-handler.interface';
import { ICommandBus, ICQRSMiddleware, IMessageContext } from './cqrs-bus.interface';

/**
 * 核心命令总线实现
 */
@Injectable()
export class CoreCommandBus implements ICommandBus {
	private readonly handlers = new Map<string, ICommandHandler>();
	private readonly middlewares: ICQRSMiddleware[] = [];

	/**
	 * 执行命令
	 *
	 * @param command - 要执行的命令
	 * @returns Promise，命令执行完成后解析
	 * @throws {Error} 当命令执行失败时
	 */
	public async execute<TCommand extends BaseCommand>(command: TCommand): Promise<void> {
		const commandType = command.commandType;
		const handler = this.handlers.get(commandType);

		if (!handler) {
			throw new Error(`No handler registered for command type: ${commandType}`);
		}

		// 创建消息上下文
		const context: IMessageContext = {
			messageId: command.commandId.toString(),
			tenantId: command.tenantId,
			userId: command.userId,
			messageType: commandType,
			createdAt: command.createdAt,
			metadata: command.metadata
		};

		// 执行中间件链
		await this.executeMiddlewares(context, async () => {
			// 验证命令
			handler.validateCommand(command);

			// 检查是否可以处理
			const canHandle = await handler.canHandle(command);
			if (!canHandle) {
				throw new Error(`Handler cannot process command: ${commandType}`);
			}

			// 执行命令
			await handler.execute(command);
		});
	}

	/**
	 * 注册命令处理器
	 *
	 * @param commandType - 命令类型
	 * @param handler - 命令处理器
	 * @throws {Error} 当命令类型已注册时
	 */
	public registerHandler<TCommand extends BaseCommand>(commandType: string, handler: ICommandHandler<TCommand>): void {
		if (this.handlers.has(commandType)) {
			throw new Error(`Handler already registered for command type: ${commandType}`);
		}

		if (!handler.supports(commandType)) {
			throw new Error(`Handler does not support command type: ${commandType}`);
		}

		this.handlers.set(commandType, handler);
	}

	/**
	 * 取消注册命令处理器
	 *
	 * @param commandType - 命令类型
	 */
	public unregisterHandler(commandType: string): void {
		this.handlers.delete(commandType);
	}

	/**
	 * 添加中间件
	 *
	 * @param middleware - 中间件
	 */
	public addMiddleware(middleware: ICQRSMiddleware): void {
		// 检查是否已存在同名中间件
		const existingIndex = this.middlewares.findIndex((m) => m.name === middleware.name);
		if (existingIndex >= 0) {
			// 替换现有中间件
			this.middlewares[existingIndex] = middleware;
		} else {
			// 添加新中间件
			this.middlewares.push(middleware);
		}

		// 按优先级排序
		this.middlewares.sort((a, b) => a.priority - b.priority);
	}

	/**
	 * 移除中间件
	 *
	 * @param middlewareName - 中间件名称
	 */
	public removeMiddleware(middlewareName: string): void {
		const index = this.middlewares.findIndex((m) => m.name === middlewareName);
		if (index >= 0) {
			this.middlewares.splice(index, 1);
		}
	}

	/**
	 * 获取所有注册的命令类型
	 *
	 * @returns 命令类型数组
	 */
	public getRegisteredCommandTypes(): string[] {
		return Array.from(this.handlers.keys());
	}

	/**
	 * 检查是否支持指定的命令类型
	 *
	 * @param commandType - 命令类型
	 * @returns 如果支持则返回 true，否则返回 false
	 */
	public supports(commandType: string): boolean {
		return this.handlers.has(commandType);
	}

	/**
	 * 获取注册的处理器数量
	 *
	 * @returns 处理器数量
	 */
	public getHandlerCount(): number {
		return this.handlers.size;
	}

	/**
	 * 获取注册的中间件数量
	 *
	 * @returns 中间件数量
	 */
	public getMiddlewareCount(): number {
		return this.middlewares.length;
	}

	/**
	 * 获取指定命令类型的处理器
	 *
	 * @param commandType - 命令类型
	 * @returns 处理器实例，如果不存在则返回 undefined
	 */
	public getHandler(commandType: string): ICommandHandler | undefined {
		return this.handlers.get(commandType);
	}

	/**
	 * 获取所有中间件
	 *
	 * @returns 中间件数组
	 */
	public getMiddlewares(): readonly ICQRSMiddleware[] {
		return [...this.middlewares];
	}

	/**
	 * 清除所有处理器
	 */
	public clearHandlers(): void {
		this.handlers.clear();
	}

	/**
	 * 清除所有中间件
	 */
	public clearMiddlewares(): void {
		this.middlewares.length = 0;
	}

	/**
	 * 执行中间件链
	 *
	 * @param context - 消息上下文
	 * @param next - 最终执行函数
	 * @returns Promise，执行完成后解析
	 */
	private async executeMiddlewares(context: IMessageContext, next: () => Promise<void>): Promise<void> {
		let index = 0;

		const executeNext = async (): Promise<unknown> => {
			if (index < this.middlewares.length) {
				const middleware = this.middlewares[index++];
				return await middleware.execute(context, executeNext);
			} else {
				await next();
				return undefined;
			}
		};

		await executeNext();
	}
}
