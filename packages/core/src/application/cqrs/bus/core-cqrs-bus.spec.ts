/**
 * CoreCQRSBus 测试
 *
 * @description 测试统一CQRS总线的功能
 * @since 1.0.0
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CoreCQRSBus } from './core-cqrs-bus';
import { CoreCommandBus } from './core-command-bus';
import { CoreQueryBus } from './core-query-bus';
import { CoreEventBus } from './core-event-bus';
import { BaseCommand } from '../commands/base/base-command';
import { BaseQuery, IQueryResult } from '../queries/base/base-query';
import { BaseDomainEvent } from '../../../domain/events/base/base-domain-event';
import { EntityId } from '../../../domain/value-objects/entity-id';

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

	override get commandData(): Record<string, unknown> {
		return { data: this.data };
	}
}

/**
 * 测试查询类
 */
class TestQuery extends BaseQuery {
	constructor(
		public readonly filter: string,
		tenantId: string,
		userId: string,
		page: number = 1,
		pageSize: number = 10
	) {
		super(tenantId, userId, page, pageSize);
	}

	get queryType(): string {
		return 'TestQuery';
	}

	override get queryData(): Record<string, unknown> {
		return { filter: this.filter };
	}

	protected createCopyWithSortRules(): this {
		return this;
	}
}

/**
 * 测试查询结果类
 */
class TestQueryResult implements IQueryResult {
	constructor(private readonly data: unknown[]) {}

	getData(): unknown[] {
		return this.data;
	}

	getPaginationInfo() {
		return {
			page: 1,
			pageSize: 10,
			totalCount: this.data.length,
			totalPages: 1,
			hasNextPage: false,
			hasPreviousPage: false
		};
	}

	getTotalCount(): number {
		return this.data.length;
	}

	hasData(): boolean {
		return this.data.length > 0;
	}

	toJSON(): Record<string, unknown> {
		return { data: this.data };
	}
}

/**
 * 测试事件类
 */
class TestEvent extends BaseDomainEvent {
	constructor(aggregateId: EntityId, aggregateVersion: number, tenantId: string, public readonly data: string) {
		super(aggregateId, aggregateVersion, tenantId);
	}

	get eventType(): string {
		return 'TestEvent';
	}

	override get eventData(): Record<string, unknown> {
		return { data: this.data };
	}
}

describe('CoreCQRSBus', () => {
	let cqrsBus: CoreCQRSBus;
	let commandBus: CoreCommandBus;
	let queryBus: CoreQueryBus;
	let eventBus: CoreEventBus;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CoreCommandBus,
				CoreQueryBus,
				CoreEventBus,
				{
					provide: CoreCQRSBus,
					useFactory: (_commandBus: CoreCommandBus, _queryBus: CoreQueryBus, _eventBus: CoreEventBus) =>
						new CoreCQRSBus(_commandBus, _queryBus, _eventBus, null as any, null as any),
					inject: [CoreCommandBus, CoreQueryBus, CoreEventBus]
				}
			]
		}).compile();

		cqrsBus = module.get<CoreCQRSBus>(CoreCQRSBus);
		commandBus = module.get<CoreCommandBus>(CoreCommandBus);
		queryBus = module.get<CoreQueryBus>(CoreQueryBus);
		eventBus = module.get<CoreEventBus>(CoreEventBus);
	});

	describe('初始化', () => {
		it('应该正确初始化CQRS总线', () => {
			expect(cqrsBus).toBeDefined();
			expect(cqrsBus.commandBus).toBe(commandBus);
			expect(cqrsBus.queryBus).toBe(queryBus);
			expect(cqrsBus.eventBus).toBe(eventBus);
			expect(cqrsBus.isInitialized).toBe(false);
		});

		it('应该能够初始化总线', async () => {
			await cqrsBus.initialize();
			expect(cqrsBus.isInitialized).toBe(true);
		});

		it('应该防止重复初始化', async () => {
			await cqrsBus.initialize();
			expect(cqrsBus.isInitialized).toBe(true);

			await expect(cqrsBus.initialize()).rejects.toThrow('CQRS Bus is already initialized');
		});
	});

	describe('命令执行', () => {
		it('应该能够执行命令', async () => {
			await cqrsBus.initialize();

			// 注册命令处理器
			const executedCommands: TestCommand[] = [];
			commandBus.registerHandler('TestCommand', {
				async execute(command: TestCommand) {
					executedCommands.push(command);
				},
				getSupportedCommandType: () => 'TestCommand',
				supports: (type) => type === 'TestCommand',
				validateCommand: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				async canHandle() {
					return true;
				}
			});

			const command = new TestCommand('test-data', 'tenant-1', 'user-1');
			await cqrsBus.executeCommand(command);

			expect(executedCommands).toHaveLength(1);
			expect(executedCommands[0]).toBe(command);
		});

		it('应该在未初始化时拒绝执行命令', async () => {
			const command = new TestCommand('test-data', 'tenant-1', 'user-1');

			await expect(cqrsBus.executeCommand(command)).rejects.toThrow(
				'CQRS Bus is not initialized. Call initialize() first.'
			);
		});
	});

	describe('查询执行', () => {
		it('应该能够执行查询', async () => {
			await cqrsBus.initialize();

			// 注册查询处理器
			const executedQueries: TestQuery[] = [];
			queryBus.registerHandler('TestQuery', {
				async execute(query: TestQuery) {
					executedQueries.push(query);
					return new TestQueryResult([{ id: 1, name: 'test' }]);
				},
				getSupportedQueryType: () => 'TestQuery',
				supports: (type) => type === 'TestQuery',
				validateQuery: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				async canHandle() {
					return true;
				},
				generateCacheKey: () => 'test-key',
				getCacheExpiration: () => 300
			});

			const query = new TestQuery('test-filter', 'tenant-1', 'user-1');
			const result = await cqrsBus.executeQuery<TestQuery, TestQueryResult>(query);

			expect(executedQueries).toHaveLength(1);
			expect(executedQueries[0]).toBe(query);
			expect(result).toBeInstanceOf(TestQueryResult);
		});

		it('应该在未初始化时拒绝执行查询', async () => {
			const query = new TestQuery('test-filter', 'tenant-1', 'user-1');

			await expect(cqrsBus.executeQuery(query)).rejects.toThrow(
				'CQRS Bus is not initialized. Call initialize() first.'
			);
		});
	});

	describe('事件发布', () => {
		it('应该能够发布事件', async () => {
			await cqrsBus.initialize();

			// 注册事件处理器
			const handledEvents: TestEvent[] = [];
			eventBus.registerHandler('TestEvent', {
				async handle(event: TestEvent) {
					handledEvents.push(event);
				},
				getSupportedEventType: () => 'TestEvent',
				supports: (type) => type === 'TestEvent',
				validateEvent: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				async canHandle() {
					return true;
				},
				getMaxRetries: () => 3,
				getRetryDelay: () => 1000,
				async shouldIgnore() {
					return false;
				},
				async handleFailure() {
					/* 测试环境不需要实际处理 */
				},
				async isEventProcessed() {
					return false;
				},
				async markEventAsProcessed() {
					/* 测试环境不需要实际处理 */
				}
			});

			const aggregateId = EntityId.generate();
			const event = new TestEvent(aggregateId, 1, 'tenant-1', 'test-data');
			await cqrsBus.publishEvent(event);

			expect(handledEvents).toHaveLength(1);
			expect(handledEvents[0]).toBe(event);
		});

		it('应该能够批量发布事件', async () => {
			await cqrsBus.initialize();

			// 注册事件处理器
			const handledEvents: TestEvent[] = [];
			eventBus.registerHandler('TestEvent', {
				async handle(event: TestEvent) {
					handledEvents.push(event);
				},
				getSupportedEventType: () => 'TestEvent',
				supports: (type) => type === 'TestEvent',
				validateEvent: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				async canHandle() {
					return true;
				},
				getMaxRetries: () => 3,
				getRetryDelay: () => 1000,
				async shouldIgnore() {
					return false;
				},
				async handleFailure() {
					/* 测试环境不需要实际处理 */
				},
				async isEventProcessed() {
					return false;
				},
				async markEventAsProcessed() {
					/* 测试环境不需要实际处理 */
				}
			});

			const aggregateId = EntityId.generate();
			const events = [
				new TestEvent(aggregateId, 1, 'tenant-1', 'data1'),
				new TestEvent(aggregateId, 2, 'tenant-1', 'data2'),
				new TestEvent(aggregateId, 3, 'tenant-1', 'data3')
			];

			await cqrsBus.publishEvents(events);

			expect(handledEvents).toHaveLength(3);
			expect(handledEvents).toEqual(events);
		});

		it('应该在未初始化时拒绝发布事件', async () => {
			const aggregateId = EntityId.generate();
			const event = new TestEvent(aggregateId, 1, 'tenant-1', 'test-data');

			await expect(cqrsBus.publishEvent(event)).rejects.toThrow(
				'CQRS Bus is not initialized. Call initialize() first.'
			);
		});
	});

	describe('关闭操作', () => {
		it('应该能够关闭总线', async () => {
			await cqrsBus.initialize();
			expect(cqrsBus.isInitialized).toBe(true);

			await cqrsBus.shutdown();
			expect(cqrsBus.isInitialized).toBe(false);
		});

		it('应该防止在未初始化时关闭', async () => {
			await expect(cqrsBus.shutdown()).rejects.toThrow('CQRS Bus is not initialized');
		});
	});

	describe('健康检查', () => {
		it('应该在初始化后返回健康状态', async () => {
			await cqrsBus.initialize();
			const isHealthy = await cqrsBus.healthCheck();
			expect(isHealthy).toBe(true);
		});

		it('应该在未初始化时返回不健康状态', async () => {
			const isHealthy = await cqrsBus.healthCheck();
			expect(isHealthy).toBe(false);
		});
	});

	describe('统计信息', () => {
		it('应该返回正确的统计信息', async () => {
			await cqrsBus.initialize();

			// 注册一些处理器
			commandBus.registerHandler('TestCommand', {
				async execute() {
					/* 测试环境不需要实际执行 */
				},
				getSupportedCommandType: () => 'TestCommand',
				supports: () => true,
				validateCommand: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				async canHandle() {
					return true;
				}
			});

			queryBus.registerHandler('TestQuery', {
				async execute() {
					return new TestQueryResult([]);
				},
				getSupportedQueryType: () => 'TestQuery',
				supports: () => true,
				validateQuery: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				async canHandle() {
					return true;
				},
				generateCacheKey: () => 'test',
				getCacheExpiration: () => 300
			});

			eventBus.registerHandler('TestEvent', {
				async handle() {
					/* 测试环境不需要实际处理 */
				},
				getSupportedEventType: () => 'TestEvent',
				supports: () => true,
				validateEvent: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				async canHandle() {
					return true;
				},
				getMaxRetries: () => 3,
				getRetryDelay: () => 1000,
				async shouldIgnore() {
					return false;
				},
				async handleFailure() {
					/* 测试环境不需要实际处理 */
				},
				async isEventProcessed() {
					return false;
				},
				async markEventAsProcessed() {
					/* 测试环境不需要实际处理 */
				}
			});

			const stats = cqrsBus.getStatistics();

			expect(stats.commandBus.registeredHandlers).toBe(1);
			expect(stats.queryBus.registeredHandlers).toBe(1);
			expect(stats.eventBus.registeredHandlers).toBe(1);
			expect(stats.overall.totalHandlers).toBe(3);
			expect(stats.overall.isInitialized).toBe(true);
		});
	});

	describe('支持检查', () => {
		it('应该能够检查命令支持', async () => {
			await cqrsBus.initialize();

			commandBus.registerHandler('TestCommand', {
				async execute() {
					/* 测试环境不需要实际执行 */
				},
				getSupportedCommandType: () => 'TestCommand',
				supports: (type) => type === 'TestCommand',
				validateCommand: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				async canHandle() {
					return true;
				}
			});

			expect(cqrsBus.supportsCommand('TestCommand')).toBe(true);
			expect(cqrsBus.supportsCommand('NonExistentCommand')).toBe(false);
		});

		it('应该能够检查查询支持', async () => {
			await cqrsBus.initialize();

			queryBus.registerHandler('TestQuery', {
				async execute() {
					return new TestQueryResult([]);
				},
				getSupportedQueryType: () => 'TestQuery',
				supports: (type) => type === 'TestQuery',
				validateQuery: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				async canHandle() {
					return true;
				},
				generateCacheKey: () => 'test',
				getCacheExpiration: () => 300
			});

			expect(cqrsBus.supportsQuery('TestQuery')).toBe(true);
			expect(cqrsBus.supportsQuery('NonExistentQuery')).toBe(false);
		});

		it('应该能够检查事件支持', async () => {
			await cqrsBus.initialize();

			eventBus.registerHandler('TestEvent', {
				async handle() {
					/* 测试环境不需要实际处理 */
				},
				getSupportedEventType: () => 'TestEvent',
				supports: (type) => type === 'TestEvent',
				validateEvent: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				async canHandle() {
					return true;
				},
				getMaxRetries: () => 3,
				getRetryDelay: () => 1000,
				async shouldIgnore() {
					return false;
				},
				async handleFailure() {
					/* 测试环境不需要实际处理 */
				},
				async isEventProcessed() {
					return false;
				},
				async markEventAsProcessed() {
					/* 测试环境不需要实际处理 */
				}
			});

			expect(cqrsBus.supportsEvent('TestEvent')).toBe(true);
			expect(cqrsBus.supportsEvent('NonExistentEvent')).toBe(false);
		});
	});

	describe('类型获取', () => {
		it('应该能够获取支持的命令类型', async () => {
			await cqrsBus.initialize();

			commandBus.registerHandler('Command1', {
				async execute() {
					/* 测试环境不需要实际执行 */
				},
				getSupportedCommandType: () => 'Command1',
				supports: () => true,
				validateCommand: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				async canHandle() {
					return true;
				}
			});

			commandBus.registerHandler('Command2', {
				async execute() {
					/* 测试环境不需要实际执行 */
				},
				getSupportedCommandType: () => 'Command2',
				supports: () => true,
				validateCommand: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				async canHandle() {
					return true;
				}
			});

			const types = cqrsBus.getSupportedCommandTypes();
			expect(types).toContain('Command1');
			expect(types).toContain('Command2');
		});

		it('应该能够获取支持的查询类型', async () => {
			await cqrsBus.initialize();

			queryBus.registerHandler('Query1', {
				async execute() {
					return new TestQueryResult([]);
				},
				getSupportedQueryType: () => 'Query1',
				supports: () => true,
				validateQuery: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				async canHandle() {
					return true;
				},
				generateCacheKey: () => 'test',
				getCacheExpiration: () => 300
			});

			const types = cqrsBus.getSupportedQueryTypes();
			expect(types).toContain('Query1');
		});

		it('应该能够获取支持的事件类型', async () => {
			await cqrsBus.initialize();

			eventBus.registerHandler('Event1', {
				async handle() {
					/* 测试环境不需要实际处理 */
				},
				getSupportedEventType: () => 'Event1',
				supports: () => true,
				validateEvent: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				async canHandle() {
					return true;
				},
				getMaxRetries: () => 3,
				getRetryDelay: () => 1000,
				async shouldIgnore() {
					return false;
				},
				async handleFailure() {
					/* 测试环境不需要实际处理 */
				},
				async isEventProcessed() {
					return false;
				},
				async markEventAsProcessed() {
					/* 测试环境不需要实际处理 */
				}
			});

			const types = cqrsBus.getSupportedEventTypes();
			expect(types).toContain('Event1');
		});
	});
});
