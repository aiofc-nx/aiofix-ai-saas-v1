/**
 * CoreQueryBus 测试
 *
 * @description 测试核心查询总线的功能
 * @since 1.0.0
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CoreQueryBus } from './core-query-bus';
import { BaseQuery, IQueryResult, IPaginationInfo } from '../queries/base/base-query';
import { IQueryHandler } from '../queries/base/query-handler.interface';
import { ICQRSMiddleware, IMessageContext } from './cqrs-bus.interface';

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

	get queryData(): Record<string, unknown> {
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
	constructor(private readonly data: unknown[], private readonly pagination: IPaginationInfo) {}

	getData(): unknown[] {
		return this.data;
	}

	getPaginationInfo(): IPaginationInfo {
		return this.pagination;
	}

	getTotalCount(): number {
		return this.pagination.totalCount || 0;
	}

	hasData(): boolean {
		return this.data.length > 0;
	}

	toJSON(): Record<string, unknown> {
		return {
			data: this.data,
			pagination: this.pagination
		};
	}
}

/**
 * 测试查询处理器
 */
class TestQueryHandler implements IQueryHandler<TestQuery, TestQueryResult> {
	public executedQueries: TestQuery[] = [];
	public cacheExpiration = 300; // 5分钟

	async execute(query: TestQuery): Promise<TestQueryResult> {
		this.executedQueries.push(query);

		const pagination: IPaginationInfo = {
			page: query.page,
			pageSize: query.pageSize,
			totalCount: 100,
			totalPages: 10,
			hasNextPage: query.page < 10,
			hasPreviousPage: query.page > 1
		};

		return new TestQueryResult([{ id: 1, name: 'test' }], pagination);
	}

	getSupportedQueryType(): string {
		return 'TestQuery';
	}

	supports(queryType: string): boolean {
		return queryType === 'TestQuery';
	}

	validateQuery(query: TestQuery): void {
		if (!query.filter) {
			throw new Error('Query filter is required');
		}
	}

	getPriority(): number {
		return 0;
	}

	async canHandle(_query: TestQuery): Promise<boolean> {
		return true;
	}

	generateCacheKey(_query: TestQuery): string {
		return `test-query-${_query.filter}-${_query.page}-${_query.pageSize}`;
	}

	getCacheExpiration(_query: TestQuery): number {
		return this.cacheExpiration;
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

describe('CoreQueryBus', () => {
	let queryBus: CoreQueryBus;
	let testHandler: TestQueryHandler;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [CoreQueryBus]
		}).compile();

		queryBus = module.get<CoreQueryBus>(CoreQueryBus);
		testHandler = new TestQueryHandler();
	});

	describe('查询执行', () => {
		it('应该能够执行注册的查询', async () => {
			// 注册处理器
			queryBus.registerHandler('TestQuery', testHandler);

			// 创建查询
			const query = new TestQuery('test-filter', 'tenant-1', 'user-1');

			// 执行查询
			const result = await queryBus.execute(query);

			// 验证查询被执行
			expect(testHandler.executedQueries).toHaveLength(1);
			expect(testHandler.executedQueries[0]).toBe(query);
			expect(result).toBeInstanceOf(TestQueryResult);
			expect(result.getData()).toHaveLength(1);
		});

		it('应该在没有注册处理器时抛出错误', async () => {
			const query = new TestQuery('test-filter', 'tenant-1', 'user-1');

			await expect(queryBus.execute(query)).rejects.toThrow('No handler registered for query type: TestQuery');
		});

		it('应该验证查询的有效性', async () => {
			queryBus.registerHandler('TestQuery', testHandler);

			// 创建无效查询
			const invalidQuery = new TestQuery('', 'tenant-1', 'user-1');

			await expect(queryBus.execute(invalidQuery)).rejects.toThrow('Query filter is required');
		});

		it('应该检查处理器是否可以处理查询', async () => {
			// 创建不支持查询的处理器
			const unsupportedHandler = {
				...testHandler,
				supports: (type: string) => type === 'TestQuery',
				validateQuery: () => {
					/* 测试环境不需要实际验证 */
				},
				canHandle: async () => false,
				generateCacheKey: () => 'test-key',
				getCacheExpiration: () => 300,
				execute: async () =>
					new TestQueryResult([], {
						page: 1,
						pageSize: 10,
						totalCount: 0,
						totalPages: 0,
						hasNextPage: false,
						hasPreviousPage: false
					}),
				getSupportedQueryType: () => 'TestQuery',
				getPriority: () => 0
			};

			queryBus.registerHandler('TestQuery', unsupportedHandler);

			const query = new TestQuery('test-filter', 'tenant-1', 'user-1');

			await expect(queryBus.execute(query)).rejects.toThrow('Handler cannot process query: TestQuery');
		});
	});

	describe('缓存管理', () => {
		it('应该缓存查询结果', async () => {
			queryBus.registerHandler('TestQuery', testHandler);

			const query = new TestQuery('test-filter', 'tenant-1', 'user-1');

			// 第一次执行
			const result1 = await queryBus.execute(query);
			expect(testHandler.executedQueries).toHaveLength(1);

			// 第二次执行（应该从缓存获取）
			const result2 = await queryBus.execute(query);
			expect(testHandler.executedQueries).toHaveLength(1); // 没有增加
			expect(result2).toBe(result1); // 应该是同一个实例
		});

		it('应该处理缓存过期', async () => {
			// 创建短缓存时间的处理器
			const shortCacheHandler = {
				...testHandler,
				supports: (type: string) => type === 'TestQuery',
				validateQuery: () => {
					/* 测试环境不需要实际验证 */
				},
				canHandle: async () => true,
				generateCacheKey: () => 'test-key',
				getCacheExpiration: () => 0.001, // 1毫秒
				async execute(query: TestQuery) {
					testHandler.executedQueries.push(query);
					return new TestQueryResult([{ id: 1, name: 'test' }], {
						page: 1,
						pageSize: 10,
						totalCount: 1,
						totalPages: 1,
						hasNextPage: false,
						hasPreviousPage: false
					});
				},
				getSupportedQueryType: () => 'TestQuery',
				getPriority: () => 0
			};

			queryBus.registerHandler('TestQuery', shortCacheHandler);

			const query = new TestQuery('test-filter', 'tenant-1', 'user-1');

			// 第一次执行
			await queryBus.execute(query);
			expect(testHandler.executedQueries).toHaveLength(1);

			// 等待缓存过期
			await new Promise((resolve) => setTimeout(resolve, 10));

			// 第二次执行（应该重新执行）
			await queryBus.execute(query);
			expect(testHandler.executedQueries).toHaveLength(2);
		});

		it('应该支持不缓存的查询', async () => {
			const noCacheHandler = {
				...testHandler,
				supports: (type: string) => type === 'TestQuery',
				validateQuery: () => {
					/* 测试环境不需要实际验证 */
				},
				canHandle: async () => true,
				generateCacheKey: () => 'test-key',
				getCacheExpiration: () => 0, // 不缓存
				async execute(query: TestQuery) {
					testHandler.executedQueries.push(query);
					return new TestQueryResult([{ id: 1, name: 'test' }], {
						page: 1,
						pageSize: 10,
						totalCount: 1,
						totalPages: 1,
						hasNextPage: false,
						hasPreviousPage: false
					});
				},
				getSupportedQueryType: () => 'TestQuery',
				getPriority: () => 0
			};

			queryBus.registerHandler('TestQuery', noCacheHandler);

			const query = new TestQuery('test-filter', 'tenant-1', 'user-1');

			// 两次执行都应该调用处理器
			await queryBus.execute(query);
			await queryBus.execute(query);

			expect(testHandler.executedQueries).toHaveLength(2);
		});

		it('应该提供缓存统计信息', async () => {
			queryBus.registerHandler('TestQuery', testHandler);

			const query = new TestQuery('test-filter', 'tenant-1', 'user-1');

			// 执行查询
			await queryBus.execute(query);

			const stats = queryBus.getCacheStats();
			expect(stats.totalEntries).toBe(1);
			expect(stats.activeEntries).toBe(1);
			expect(stats.expiredEntries).toBe(0);
		});

		it('应该能够清除所有缓存', async () => {
			queryBus.registerHandler('TestQuery', testHandler);

			const query = new TestQuery('test-filter', 'tenant-1', 'user-1');

			// 执行查询
			await queryBus.execute(query);
			expect(queryBus.getCacheStats().totalEntries).toBe(1);

			// 清除缓存
			queryBus.clearCache();
			expect(queryBus.getCacheStats().totalEntries).toBe(0);
		});
	});

	describe('处理器管理', () => {
		it('应该能够注册查询处理器', () => {
			queryBus.registerHandler('TestQuery', testHandler);

			expect(queryBus.supports('TestQuery')).toBe(true);
			expect(queryBus.getRegisteredQueryTypes()).toContain('TestQuery');
			expect(queryBus.getHandlerCount()).toBe(1);
		});

		it('应该防止重复注册同一查询类型的处理器', () => {
			queryBus.registerHandler('TestQuery', testHandler);

			expect(() => {
				queryBus.registerHandler('TestQuery', testHandler);
			}).toThrow('Handler already registered for query type: TestQuery');
		});

		it('应该能够取消注册查询处理器', () => {
			queryBus.registerHandler('TestQuery', testHandler);
			expect(queryBus.supports('TestQuery')).toBe(true);

			queryBus.unregisterHandler('TestQuery');
			expect(queryBus.supports('TestQuery')).toBe(false);
			expect(queryBus.getHandlerCount()).toBe(0);
		});

		it('应该能够获取指定的处理器', () => {
			queryBus.registerHandler('TestQuery', testHandler);

			const handler = queryBus.getHandler('TestQuery');
			expect(handler).toBe(testHandler);
		});

		it('应该为不存在的处理器返回 undefined', () => {
			const handler = queryBus.getHandler('NonExistentQuery');
			expect(handler).toBeUndefined();
		});
	});

	describe('中间件管理', () => {
		it('应该能够添加中间件', () => {
			const middleware = new TestMiddleware('TestMiddleware', 1);

			queryBus.addMiddleware(middleware);

			expect(queryBus.getMiddlewareCount()).toBe(1);
			expect(queryBus.getMiddlewares()).toContain(middleware);
		});

		it('应该按优先级排序中间件', () => {
			const middleware1 = new TestMiddleware('Middleware1', 2);
			const middleware2 = new TestMiddleware('Middleware2', 1);
			const middleware3 = new TestMiddleware('Middleware3', 3);

			queryBus.addMiddleware(middleware1);
			queryBus.addMiddleware(middleware2);
			queryBus.addMiddleware(middleware3);

			const middlewares = queryBus.getMiddlewares();
			expect(middlewares[0]).toBe(middleware2); // 优先级 1
			expect(middlewares[1]).toBe(middleware1); // 优先级 2
			expect(middlewares[2]).toBe(middleware3); // 优先级 3
		});

		it('应该能够替换同名中间件', () => {
			const middleware1 = new TestMiddleware('TestMiddleware', 1);
			const middleware2 = new TestMiddleware('TestMiddleware', 2);

			queryBus.addMiddleware(middleware1);
			queryBus.addMiddleware(middleware2);

			expect(queryBus.getMiddlewareCount()).toBe(1);
			expect(queryBus.getMiddlewares()[0]).toBe(middleware2);
		});

		it('应该能够移除中间件', () => {
			const middleware = new TestMiddleware('TestMiddleware');

			queryBus.addMiddleware(middleware);
			expect(queryBus.getMiddlewareCount()).toBe(1);

			queryBus.removeMiddleware('TestMiddleware');
			expect(queryBus.getMiddlewareCount()).toBe(0);
		});

		it('应该能够清除所有中间件', () => {
			queryBus.addMiddleware(new TestMiddleware('Middleware1'));
			queryBus.addMiddleware(new TestMiddleware('Middleware2'));

			expect(queryBus.getMiddlewareCount()).toBe(2);

			queryBus.clearMiddlewares();
			expect(queryBus.getMiddlewareCount()).toBe(0);
		});
	});

	describe('中间件执行', () => {
		it('应该按顺序执行中间件', async () => {
			const middleware1 = new TestMiddleware('Middleware1', 1);
			const middleware2 = new TestMiddleware('Middleware2', 2);

			queryBus.addMiddleware(middleware1);
			queryBus.addMiddleware(middleware2);
			queryBus.registerHandler('TestQuery', testHandler);

			const query = new TestQuery('test-filter', 'tenant-1', 'user-1');
			await queryBus.execute(query);

			expect(middleware1.executedCount).toBe(1);
			expect(middleware2.executedCount).toBe(1);
			expect(testHandler.executedQueries).toHaveLength(1);
		});

		it('应该传递正确的消息上下文给中间件', async () => {
			const middleware = new TestMiddleware('TestMiddleware');

			queryBus.addMiddleware(middleware);
			queryBus.registerHandler('TestQuery', testHandler);

			const query = new TestQuery('test-filter', 'tenant-1', 'user-1');
			await queryBus.execute(query);

			expect(middleware.context).toBeDefined();
			expect(middleware.context?.messageId).toBe(query.queryId.toString());
			expect(middleware.context?.tenantId).toBe('tenant-1');
			expect(middleware.context?.userId).toBe('user-1');
			expect(middleware.context?.messageType).toBe('TestQuery');
		});

		it('应该处理中间件异常', async () => {
			const errorMiddleware = new TestMiddleware('ErrorMiddleware');
			errorMiddleware.execute = async () => {
				throw new Error('Middleware error');
			};

			queryBus.addMiddleware(errorMiddleware);
			queryBus.registerHandler('TestQuery', testHandler);

			const query = new TestQuery('test-filter', 'tenant-1', 'user-1');

			await expect(queryBus.execute(query)).rejects.toThrow('Middleware error');
			expect(testHandler.executedQueries).toHaveLength(0);
		});
	});

	describe('统计信息', () => {
		it('应该返回正确的统计信息', () => {
			queryBus.registerHandler('TestQuery', testHandler);
			queryBus.addMiddleware(new TestMiddleware('TestMiddleware'));

			expect(queryBus.getHandlerCount()).toBe(1);
			expect(queryBus.getMiddlewareCount()).toBe(1);
			expect(queryBus.getRegisteredQueryTypes()).toEqual(['TestQuery']);
		});

		it('应该支持多个查询类型', () => {
			const handler1 = {
				...new TestQueryHandler(),
				getSupportedQueryType: () => 'Query1',
				supports: (type: string) => type === 'Query1',
				execute: async () =>
					new TestQueryResult([], {
						page: 1,
						pageSize: 10,
						totalCount: 0,
						totalPages: 0,
						hasNextPage: false,
						hasPreviousPage: false
					}),
				validateQuery: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				canHandle: async () => true,
				generateCacheKey: () => 'query1-key',
				getCacheExpiration: () => 300
			};
			const handler2 = {
				...new TestQueryHandler(),
				getSupportedQueryType: () => 'Query2',
				supports: (type: string) => type === 'Query2',
				execute: async () =>
					new TestQueryResult([], {
						page: 1,
						pageSize: 10,
						totalCount: 0,
						totalPages: 0,
						hasNextPage: false,
						hasPreviousPage: false
					}),
				validateQuery: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				canHandle: async () => true,
				generateCacheKey: () => 'query2-key',
				getCacheExpiration: () => 300
			};

			queryBus.registerHandler('Query1', handler1);
			queryBus.registerHandler('Query2', handler2);

			expect(queryBus.getHandlerCount()).toBe(2);
			expect(queryBus.getRegisteredQueryTypes()).toContain('Query1');
			expect(queryBus.getRegisteredQueryTypes()).toContain('Query2');
		});
	});

	describe('清理操作', () => {
		it('应该能够清除所有处理器', () => {
			queryBus.registerHandler('TestQuery', testHandler);
			expect(queryBus.getHandlerCount()).toBe(1);

			queryBus.clearHandlers();
			expect(queryBus.getHandlerCount()).toBe(0);
			expect(queryBus.supports('TestQuery')).toBe(false);
		});
	});
});
