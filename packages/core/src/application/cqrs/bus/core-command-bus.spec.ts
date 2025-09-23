/**
 * CoreCommandBus 测试
 *
 * @description 测试核心命令总线的功能
 * @since 1.0.0
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CoreCommandBus } from './core-command-bus';
import { BaseCommand } from '../commands/base/base-command';
import { ICommandHandler } from '../commands/base/command-handler.interface';
import { ICQRSMiddleware, IMessageContext } from './cqrs-bus.interface';

/**
 * 测试命令类
 */
class TestCommand extends BaseCommand {
	constructor(public readonly data: string, tenantId: string, userId: string) {
		super(tenantId, userId);
	}

	get commandType(): string {
		return 'TestCommand';
	}

	get commandData(): Record<string, unknown> {
		return { data: this.data };
	}
}

/**
 * 测试命令处理器
 */
class TestCommandHandler implements ICommandHandler<TestCommand> {
	public executedCommands: TestCommand[] = [];

	async execute(command: TestCommand): Promise<void> {
		this.executedCommands.push(command);
	}

	getSupportedCommandType(): string {
		return 'TestCommand';
	}

	supports(commandType: string): boolean {
		return commandType === 'TestCommand';
	}

	validateCommand(command: TestCommand): void {
		if (!command.data) {
			throw new Error('Command data is required');
		}
	}

	getPriority(): number {
		return 0;
	}

	async canHandle(_command: TestCommand): Promise<boolean> {
		return true;
	}
}

/**
 * 测试中间件
 */
class TestMiddleware implements ICQRSMiddleware {
	public executedCount = 0;
	public context: IMessageContext | null = null;

	constructor(public name: string, public priority: number = 0) {}

	async execute(context: IMessageContext, next: () => Promise<unknown>): Promise<unknown> {
		this.executedCount++;
		this.context = context;
		return await next();
	}
}

describe('CoreCommandBus', () => {
	let commandBus: CoreCommandBus;
	let testHandler: TestCommandHandler;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [CoreCommandBus]
		}).compile();

		commandBus = module.get<CoreCommandBus>(CoreCommandBus);
		testHandler = new TestCommandHandler();
	});

	describe('命令执行', () => {
		it('应该能够执行注册的命令', async () => {
			// 注册处理器
			commandBus.registerHandler('TestCommand', testHandler);

			// 创建命令
			const command = new TestCommand('test-data', 'tenant-1', 'user-1');

			// 执行命令
			await commandBus.execute(command);

			// 验证命令被执行
			expect(testHandler.executedCommands).toHaveLength(1);
			expect(testHandler.executedCommands[0]).toBe(command);
		});

		it('应该在没有注册处理器时抛出错误', async () => {
			const command = new TestCommand('test-data', 'tenant-1', 'user-1');

			await expect(commandBus.execute(command)).rejects.toThrow('No handler registered for command type: TestCommand');
		});

		it('应该验证命令的有效性', async () => {
			commandBus.registerHandler('TestCommand', testHandler);

			// 创建无效命令
			const invalidCommand = new TestCommand('', 'tenant-1', 'user-1');

			await expect(commandBus.execute(invalidCommand)).rejects.toThrow('Command data is required');
		});

		it('应该检查处理器是否可以处理命令', async () => {
			// 创建不支持命令的处理器
			const unsupportedHandler = {
				...testHandler,
				supports: (type: string) => type === 'TestCommand',
				validateCommand: () => {
					/* 测试环境不需要实际验证 */
				},
				canHandle: async () => false,
				execute: async () => {
					/* 测试环境不需要实际执行 */
				},
				getSupportedCommandType: () => 'TestCommand',
				getPriority: () => 0
			};

			commandBus.registerHandler('TestCommand', unsupportedHandler);

			const command = new TestCommand('test-data', 'tenant-1', 'user-1');

			await expect(commandBus.execute(command)).rejects.toThrow('Handler cannot process command: TestCommand');
		});
	});

	describe('处理器管理', () => {
		it('应该能够注册命令处理器', () => {
			commandBus.registerHandler('TestCommand', testHandler);

			expect(commandBus.supports('TestCommand')).toBe(true);
			expect(commandBus.getRegisteredCommandTypes()).toContain('TestCommand');
			expect(commandBus.getHandlerCount()).toBe(1);
		});

		it('应该防止重复注册同一命令类型的处理器', () => {
			commandBus.registerHandler('TestCommand', testHandler);

			expect(() => {
				commandBus.registerHandler('TestCommand', testHandler);
			}).toThrow('Handler already registered for command type: TestCommand');
		});

		it('应该能够取消注册命令处理器', () => {
			commandBus.registerHandler('TestCommand', testHandler);
			expect(commandBus.supports('TestCommand')).toBe(true);

			commandBus.unregisterHandler('TestCommand');
			expect(commandBus.supports('TestCommand')).toBe(false);
			expect(commandBus.getHandlerCount()).toBe(0);
		});

		it('应该能够获取指定的处理器', () => {
			commandBus.registerHandler('TestCommand', testHandler);

			const handler = commandBus.getHandler('TestCommand');
			expect(handler).toBe(testHandler);
		});

		it('应该为不存在的处理器返回 undefined', () => {
			const handler = commandBus.getHandler('NonExistentCommand');
			expect(handler).toBeUndefined();
		});
	});

	describe('中间件管理', () => {
		it('应该能够添加中间件', () => {
			const middleware = new TestMiddleware('TestMiddleware', 1);

			commandBus.addMiddleware(middleware);

			expect(commandBus.getMiddlewareCount()).toBe(1);
			expect(commandBus.getMiddlewares()).toContain(middleware);
		});

		it('应该按优先级排序中间件', () => {
			const middleware1 = new TestMiddleware('Middleware1', 2);
			const middleware2 = new TestMiddleware('Middleware2', 1);
			const middleware3 = new TestMiddleware('Middleware3', 3);

			commandBus.addMiddleware(middleware1);
			commandBus.addMiddleware(middleware2);
			commandBus.addMiddleware(middleware3);

			const middlewares = commandBus.getMiddlewares();
			expect(middlewares[0]).toBe(middleware2); // 优先级 1
			expect(middlewares[1]).toBe(middleware1); // 优先级 2
			expect(middlewares[2]).toBe(middleware3); // 优先级 3
		});

		it('应该能够替换同名中间件', () => {
			const middleware1 = new TestMiddleware('TestMiddleware', 1);
			const middleware2 = new TestMiddleware('TestMiddleware', 2);

			commandBus.addMiddleware(middleware1);
			commandBus.addMiddleware(middleware2);

			expect(commandBus.getMiddlewareCount()).toBe(1);
			expect(commandBus.getMiddlewares()[0]).toBe(middleware2);
		});

		it('应该能够移除中间件', () => {
			const middleware = new TestMiddleware('TestMiddleware');

			commandBus.addMiddleware(middleware);
			expect(commandBus.getMiddlewareCount()).toBe(1);

			commandBus.removeMiddleware('TestMiddleware');
			expect(commandBus.getMiddlewareCount()).toBe(0);
		});

		it('应该能够清除所有中间件', () => {
			commandBus.addMiddleware(new TestMiddleware('Middleware1'));
			commandBus.addMiddleware(new TestMiddleware('Middleware2'));

			expect(commandBus.getMiddlewareCount()).toBe(2);

			commandBus.clearMiddlewares();
			expect(commandBus.getMiddlewareCount()).toBe(0);
		});
	});

	describe('中间件执行', () => {
		it('应该按顺序执行中间件', async () => {
			const middleware1 = new TestMiddleware('Middleware1', 1);
			const middleware2 = new TestMiddleware('Middleware2', 2);

			commandBus.addMiddleware(middleware1);
			commandBus.addMiddleware(middleware2);
			commandBus.registerHandler('TestCommand', testHandler);

			const command = new TestCommand('test-data', 'tenant-1', 'user-1');
			await commandBus.execute(command);

			expect(middleware1.executedCount).toBe(1);
			expect(middleware2.executedCount).toBe(1);
			expect(testHandler.executedCommands).toHaveLength(1);
		});

		it('应该传递正确的消息上下文给中间件', async () => {
			const middleware = new TestMiddleware('TestMiddleware');

			commandBus.addMiddleware(middleware);
			commandBus.registerHandler('TestCommand', testHandler);

			const command = new TestCommand('test-data', 'tenant-1', 'user-1');
			await commandBus.execute(command);

			expect(middleware.context).toBeDefined();
			expect(middleware.context?.messageId).toBe(command.commandId.toString());
			expect(middleware.context?.tenantId).toBe('tenant-1');
			expect(middleware.context?.userId).toBe('user-1');
			expect(middleware.context?.messageType).toBe('TestCommand');
		});

		it('应该处理中间件异常', async () => {
			const errorMiddleware = new TestMiddleware('ErrorMiddleware');
			errorMiddleware.execute = async () => {
				throw new Error('Middleware error');
			};

			commandBus.addMiddleware(errorMiddleware);
			commandBus.registerHandler('TestCommand', testHandler);

			const command = new TestCommand('test-data', 'tenant-1', 'user-1');

			await expect(commandBus.execute(command)).rejects.toThrow('Middleware error');
			expect(testHandler.executedCommands).toHaveLength(0);
		});
	});

	describe('统计信息', () => {
		it('应该返回正确的统计信息', () => {
			commandBus.registerHandler('TestCommand', testHandler);
			commandBus.addMiddleware(new TestMiddleware('TestMiddleware'));

			expect(commandBus.getHandlerCount()).toBe(1);
			expect(commandBus.getMiddlewareCount()).toBe(1);
			expect(commandBus.getRegisteredCommandTypes()).toEqual(['TestCommand']);
		});

		it('应该支持多个命令类型', () => {
			const handler1 = {
				...new TestCommandHandler(),
				getSupportedCommandType: () => 'Command1',
				supports: (type: string) => type === 'Command1',
				execute: async () => {
					/* 测试环境不需要实际执行 */
				},
				validateCommand: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				canHandle: async () => true
			};
			const handler2 = {
				...new TestCommandHandler(),
				getSupportedCommandType: () => 'Command2',
				supports: (type: string) => type === 'Command2',
				execute: async () => {
					/* 测试环境不需要实际执行 */
				},
				validateCommand: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				canHandle: async () => true
			};

			commandBus.registerHandler('Command1', handler1);
			commandBus.registerHandler('Command2', handler2);

			expect(commandBus.getHandlerCount()).toBe(2);
			expect(commandBus.getRegisteredCommandTypes()).toContain('Command1');
			expect(commandBus.getRegisteredCommandTypes()).toContain('Command2');
		});
	});

	describe('清理操作', () => {
		it('应该能够清除所有处理器', () => {
			commandBus.registerHandler('TestCommand', testHandler);
			expect(commandBus.getHandlerCount()).toBe(1);

			commandBus.clearHandlers();
			expect(commandBus.getHandlerCount()).toBe(0);
			expect(commandBus.supports('TestCommand')).toBe(false);
		});
	});
});
