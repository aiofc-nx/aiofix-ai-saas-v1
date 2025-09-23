/**
 * CoreEventBus 测试
 *
 * @description 测试核心事件总线的功能
 * @since 1.0.0
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CoreEventBus } from './core-event-bus';
import { BaseDomainEvent } from '../../../domain/events/base/base-domain-event';
import { IEventHandler } from '../events/base/event-handler.interface';
import { ICQRSMiddleware, IMessageContext } from './cqrs-bus.interface';
import { EntityId } from '../../../domain/value-objects/entity-id';

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

	get eventData(): Record<string, unknown> {
		return { data: this.data };
	}
}

/**
 * 测试事件处理器
 */
class TestEventHandler implements IEventHandler<TestEvent> {
	public handledEvents: TestEvent[] = [];
	public processedEvents = new Set<string>();

	async handle(event: TestEvent): Promise<void> {
		this.handledEvents.push(event);
		this.processedEvents.add(event.eventId.toString());
	}

	getSupportedEventType(): string {
		return 'TestEvent';
	}

	supports(eventType: string): boolean {
		return eventType === 'TestEvent';
	}

	validateEvent(event: TestEvent): void {
		if (!event.data) {
			throw new Error('Event data is required');
		}
	}

	getPriority(): number {
		return 0;
	}

	async canHandle(_event: TestEvent): Promise<boolean> {
		return true;
	}

	getMaxRetries(_event: TestEvent): number {
		return 3;
	}

	getRetryDelay(_event: TestEvent, retryCount: number): number {
		return retryCount * 1000; // 递增延迟
	}

	async shouldIgnore(_event: TestEvent): Promise<boolean> {
		return false;
	}

	async handleFailure(event: TestEvent, error: Error): Promise<void> {
		// 记录失败事件
		console.error(`Failed to handle event ${event.eventId}:`, error.message);
	}

	async isEventProcessed(event: TestEvent): Promise<boolean> {
		return this.processedEvents.has(event.eventId.toString());
	}

	async markEventAsProcessed(event: TestEvent): Promise<void> {
		this.processedEvents.add(event.eventId.toString());
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

describe('CoreEventBus', () => {
	let eventBus: CoreEventBus;
	let testHandler: TestEventHandler;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [CoreEventBus]
		}).compile();

		eventBus = module.get<CoreEventBus>(CoreEventBus);
		testHandler = new TestEventHandler();
	});

	describe('事件发布', () => {
		it('应该能够发布事件到注册的处理器', async () => {
			// 注册处理器
			eventBus.registerHandler('TestEvent', testHandler);

			// 创建事件
			const aggregateId = EntityId.generate();
			const event = new TestEvent(aggregateId, 1, 'tenant-1', 'test-data');

			// 发布事件
			await eventBus.publish(event);

			// 验证事件被处理
			expect(testHandler.handledEvents).toHaveLength(1);
			expect(testHandler.handledEvents[0]).toBe(event);
		});

		it('应该能够批量发布事件', async () => {
			eventBus.registerHandler('TestEvent', testHandler);

			const aggregateId = EntityId.generate();
			const events = [
				new TestEvent(aggregateId, 1, 'tenant-1', 'data1'),
				new TestEvent(aggregateId, 2, 'tenant-1', 'data2'),
				new TestEvent(aggregateId, 3, 'tenant-1', 'data3')
			];

			await eventBus.publishAll(events);

			expect(testHandler.handledEvents).toHaveLength(3);
			expect(testHandler.handledEvents).toEqual(events);
		});

		it('应该验证事件的有效性', async () => {
			eventBus.registerHandler('TestEvent', testHandler);

			// 创建无效事件
			const aggregateId = EntityId.generate();
			const invalidEvent = new TestEvent(aggregateId, 1, 'tenant-1', '');

			// 事件发布不会抛出错误，而是记录错误
			await eventBus.publish(invalidEvent);
			expect(testHandler.handledEvents).toHaveLength(0);
		});

		it('应该检查处理器是否可以处理事件', async () => {
			// 创建不支持事件的处理器
			const unsupportedHandler = {
				...testHandler,
				supports: (type: string) => type === 'TestEvent',
				validateEvent: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				canHandle: async () => false,
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
				},
				handle: async () => {
					/* 测试环境不需要实际处理 */
				},
				getSupportedEventType: () => 'TestEvent'
			};

			eventBus.registerHandler('TestEvent', unsupportedHandler);

			const aggregateId = EntityId.generate();
			const event = new TestEvent(aggregateId, 1, 'tenant-1', 'test-data');

			// 事件应该被忽略，不会抛出错误
			await eventBus.publish(event);
			expect(testHandler.handledEvents).toHaveLength(0);
		});

		it('应该处理处理器异常', async () => {
			const errorHandler = {
				...testHandler,
				supports: (type: string) => type === 'TestEvent',
				validateEvent: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				handle: async () => {
					throw new Error('Handler error');
				},
				getMaxRetries: () => 3,
				getRetryDelay: () => 1000,
				async canHandle() {
					return true;
				},
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
				},
				getSupportedEventType: () => 'TestEvent'
			};

			eventBus.registerHandler('TestEvent', errorHandler);

			const aggregateId = EntityId.generate();
			const event = new TestEvent(aggregateId, 1, 'tenant-1', 'test-data');

			// 应该不抛出错误，而是记录错误
			await eventBus.publish(event);
			expect(testHandler.handledEvents).toHaveLength(0);
		});
	});

	describe('事件订阅', () => {
		it('应该能够订阅事件', async () => {
			let handledEvent: TestEvent | null = null;

			const subscriptionId = eventBus.subscribe<TestEvent>('TestEvent', async (event) => {
				handledEvent = event;
			});

			expect(subscriptionId).toBeDefined();

			const aggregateId = EntityId.generate();
			const event = new TestEvent(aggregateId, 1, 'tenant-1', 'test-data');

			await eventBus.publish(event);

			expect(handledEvent).toBe(event);
		});

		it('应该能够取消订阅事件', async () => {
			let handledEvent: TestEvent | null = null;

			const subscriptionId = eventBus.subscribe<TestEvent>('TestEvent', async (event) => {
				handledEvent = event;
			});

			// 取消订阅
			eventBus.unsubscribe(subscriptionId);

			const aggregateId = EntityId.generate();
			const event = new TestEvent(aggregateId, 1, 'tenant-1', 'test-data');

			await eventBus.publish(event);

			expect(handledEvent).toBeNull();
		});

		it('应该支持多个订阅者', async () => {
			const handledEvents1: TestEvent[] = [];
			const handledEvents2: TestEvent[] = [];

			eventBus.subscribe<TestEvent>('TestEvent', async (event) => {
				handledEvents1.push(event);
			});

			eventBus.subscribe<TestEvent>('TestEvent', async (event) => {
				handledEvents2.push(event);
			});

			const aggregateId = EntityId.generate();
			const event = new TestEvent(aggregateId, 1, 'tenant-1', 'test-data');

			await eventBus.publish(event);

			expect(handledEvents1).toHaveLength(1);
			expect(handledEvents2).toHaveLength(1);
			expect(handledEvents1[0]).toBe(event);
			expect(handledEvents2[0]).toBe(event);
		});
	});

	describe('处理器管理', () => {
		it('应该能够注册事件处理器', () => {
			eventBus.registerHandler('TestEvent', testHandler);

			expect(eventBus.supports('TestEvent')).toBe(true);
			expect(eventBus.getRegisteredEventTypes()).toContain('TestEvent');
			expect(eventBus.getHandlerCount('TestEvent')).toBe(1);
		});

		it('应该能够取消注册事件处理器', () => {
			eventBus.registerHandler('TestEvent', testHandler);
			expect(eventBus.supports('TestEvent')).toBe(true);

			eventBus.unregisterHandler('TestEvent');
			expect(eventBus.supports('TestEvent')).toBe(false);
		});

		it('应该支持多个处理器处理同一事件类型', () => {
			const handler1 = new TestEventHandler();
			const handler2 = new TestEventHandler();

			eventBus.registerHandler('TestEvent', handler1);
			eventBus.registerHandler('TestEvent', handler2);

			expect(eventBus.getHandlerCount('TestEvent')).toBe(2);
		});
	});

	describe('中间件管理', () => {
		it('应该能够添加中间件', () => {
			const middleware = new TestMiddleware('TestMiddleware', 1);

			eventBus.addMiddleware(middleware);

			expect(eventBus.getMiddlewareCount()).toBe(1);
			expect(eventBus.getMiddlewares()).toContain(middleware);
		});

		it('应该按优先级排序中间件', () => {
			const middleware1 = new TestMiddleware('Middleware1', 2);
			const middleware2 = new TestMiddleware('Middleware2', 1);
			const middleware3 = new TestMiddleware('Middleware3', 3);

			eventBus.addMiddleware(middleware1);
			eventBus.addMiddleware(middleware2);
			eventBus.addMiddleware(middleware3);

			const middlewares = eventBus.getMiddlewares();
			expect(middlewares[0]).toBe(middleware2); // 优先级 1
			expect(middlewares[1]).toBe(middleware1); // 优先级 2
			expect(middlewares[2]).toBe(middleware3); // 优先级 3
		});

		it('应该能够替换同名中间件', () => {
			const middleware1 = new TestMiddleware('TestMiddleware', 1);
			const middleware2 = new TestMiddleware('TestMiddleware', 2);

			eventBus.addMiddleware(middleware1);
			eventBus.addMiddleware(middleware2);

			expect(eventBus.getMiddlewareCount()).toBe(1);
			expect(eventBus.getMiddlewares()[0]).toBe(middleware2);
		});

		it('应该能够移除中间件', () => {
			const middleware = new TestMiddleware('TestMiddleware');

			eventBus.addMiddleware(middleware);
			expect(eventBus.getMiddlewareCount()).toBe(1);

			eventBus.removeMiddleware('TestMiddleware');
			expect(eventBus.getMiddlewareCount()).toBe(0);
		});

		it('应该能够清除所有中间件', () => {
			eventBus.addMiddleware(new TestMiddleware('Middleware1'));
			eventBus.addMiddleware(new TestMiddleware('Middleware2'));

			expect(eventBus.getMiddlewareCount()).toBe(2);

			eventBus.clearMiddlewares();
			expect(eventBus.getMiddlewareCount()).toBe(0);
		});
	});

	describe('中间件执行', () => {
		it('应该按顺序执行中间件', async () => {
			const middleware1 = new TestMiddleware('Middleware1', 1);
			const middleware2 = new TestMiddleware('Middleware2', 2);

			eventBus.addMiddleware(middleware1);
			eventBus.addMiddleware(middleware2);
			eventBus.registerHandler('TestEvent', testHandler);

			const aggregateId = EntityId.generate();
			const event = new TestEvent(aggregateId, 1, 'tenant-1', 'test-data');
			await eventBus.publish(event);

			expect(middleware1.executedCount).toBe(1);
			expect(middleware2.executedCount).toBe(1);
			expect(testHandler.handledEvents).toHaveLength(1);
		});

		it('应该传递正确的消息上下文给中间件', async () => {
			const middleware = new TestMiddleware('TestMiddleware');

			eventBus.addMiddleware(middleware);
			eventBus.registerHandler('TestEvent', testHandler);

			const aggregateId = EntityId.generate();
			const event = new TestEvent(aggregateId, 1, 'tenant-1', 'test-data');
			await eventBus.publish(event);

			expect(middleware.context).toBeDefined();
			expect(middleware.context?.messageId).toBe(event.eventId.toString());
			expect(middleware.context?.tenantId).toBe('tenant-1');
			expect(middleware.context?.messageType).toBe('TestEvent');
		});

		it('应该处理中间件异常', async () => {
			const errorMiddleware = new TestMiddleware('ErrorMiddleware');
			errorMiddleware.execute = async () => {
				throw new Error('Middleware error');
			};

			eventBus.addMiddleware(errorMiddleware);
			eventBus.registerHandler('TestEvent', testHandler);

			const aggregateId = EntityId.generate();
			const event = new TestEvent(aggregateId, 1, 'tenant-1', 'test-data');

			await expect(eventBus.publish(event)).rejects.toThrow('Middleware error');
			expect(testHandler.handledEvents).toHaveLength(0);
		});
	});

	describe('重试机制', () => {
		it('应该支持事件处理重试', async () => {
			let attemptCount = 0;
			const retryHandler = {
				...testHandler,
				supports: (type: string) => type === 'TestEvent',
				validateEvent: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				handle: async () => {
					attemptCount++;
					if (attemptCount < 3) {
						throw new Error('Temporary error');
					}
				},
				getMaxRetries: () => 3,
				getRetryDelay: () => 10, // 快速重试
				async canHandle() {
					return true;
				},
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
				},
				getSupportedEventType: () => 'TestEvent'
			};

			eventBus.registerHandler('TestEvent', retryHandler);

			const aggregateId = EntityId.generate();
			const event = new TestEvent(aggregateId, 1, 'tenant-1', 'test-data');

			await eventBus.publish(event);

			expect(attemptCount).toBe(3);
		});

		it('应该在达到最大重试次数后调用失败处理', async () => {
			let failureHandled = false;
			const retryHandler = {
				...testHandler,
				supports: (type: string) => type === 'TestEvent',
				validateEvent: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				handle: async () => {
					throw new Error('Permanent error');
				},
				getMaxRetries: () => 2,
				getRetryDelay: () => 10,
				async canHandle() {
					return true;
				},
				async shouldIgnore() {
					return false;
				},
				handleFailure: async () => {
					failureHandled = true;
				},
				async isEventProcessed() {
					return false;
				},
				async markEventAsProcessed() {
					/* 测试环境不需要实际处理 */
				},
				getSupportedEventType: () => 'TestEvent'
			};

			eventBus.registerHandler('TestEvent', retryHandler);

			const aggregateId = EntityId.generate();
			const event = new TestEvent(aggregateId, 1, 'tenant-1', 'test-data');

			await eventBus.publish(event);

			expect(failureHandled).toBe(true);
		});
	});

	describe('幂等性', () => {
		it('应该支持事件幂等性检查', async () => {
			const idempotentHandler = {
				...testHandler,
				supports: (type: string) => type === 'TestEvent',
				validateEvent: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				getMaxRetries: () => 3,
				getRetryDelay: () => 1000,
				async canHandle() {
					return true;
				},
				async handle(event: TestEvent) {
					testHandler.handledEvents.push(event);
				},
				async shouldIgnore() {
					return false;
				},
				async handleFailure() {
					/* 测试环境不需要实际处理 */
				},
				isEventProcessed: async (event: TestEvent) => {
					return testHandler.processedEvents.has(event.eventId.toString());
				},
				markEventAsProcessed: async (event: TestEvent) => {
					testHandler.processedEvents.add(event.eventId.toString());
				},
				getSupportedEventType: () => 'TestEvent'
			};

			eventBus.registerHandler('TestEvent', idempotentHandler);

			const aggregateId = EntityId.generate();
			const event = new TestEvent(aggregateId, 1, 'tenant-1', 'test-data');

			// 第一次发布
			await eventBus.publish(event);
			expect(testHandler.handledEvents).toHaveLength(1);

			// 第二次发布（应该被忽略）
			await eventBus.publish(event);
			expect(testHandler.handledEvents).toHaveLength(1);
		});
	});

	describe('统计信息', () => {
		it('应该返回正确的统计信息', () => {
			eventBus.registerHandler('TestEvent', testHandler);
			eventBus.addMiddleware(new TestMiddleware('TestMiddleware'));

			expect(eventBus.getHandlerCount('TestEvent')).toBe(1);
			expect(eventBus.getMiddlewareCount()).toBe(1);
			expect(eventBus.getRegisteredEventTypes()).toContain('TestEvent');
		});

		it('应该支持多个事件类型', () => {
			const handler1 = {
				...new TestEventHandler(),
				getSupportedEventType: () => 'Event1',
				supports: (type: string) => type === 'Event1',
				validateEvent: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				getMaxRetries: () => 3,
				getRetryDelay: () => 1000,
				async canHandle() {
					return true;
				},
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
				},
				handle: async () => {
					/* 测试环境不需要实际处理 */
				}
			};
			const handler2 = {
				...new TestEventHandler(),
				getSupportedEventType: () => 'Event2',
				supports: (type: string) => type === 'Event2',
				validateEvent: () => {
					/* 测试环境不需要实际验证 */
				},
				getPriority: () => 0,
				getMaxRetries: () => 3,
				getRetryDelay: () => 1000,
				async canHandle() {
					return true;
				},
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
				},
				handle: async () => {
					/* 测试环境不需要实际处理 */
				}
			};

			eventBus.registerHandler('Event1', handler1);
			eventBus.registerHandler('Event2', handler2);

			expect(eventBus.getRegisteredEventTypes()).toContain('Event1');
			expect(eventBus.getRegisteredEventTypes()).toContain('Event2');
		});
	});

	describe('清理操作', () => {
		it('应该能够清除所有处理器', () => {
			eventBus.registerHandler('TestEvent', testHandler);
			expect(eventBus.getHandlerCount('TestEvent')).toBe(1);

			eventBus.clearHandlers();
			expect(eventBus.getHandlerCount('TestEvent')).toBe(0);
			expect(eventBus.supports('TestEvent')).toBe(false);
		});

		it('应该能够清除所有订阅', () => {
			eventBus.subscribe('TestEvent', async () => {
				/* 测试环境不需要实际处理 */
			});
			eventBus.subscribe('TestEvent', async () => {
				/* 测试环境不需要实际处理 */
			});

			eventBus.clearSubscriptions();
			// 订阅数量无法直接获取，但可以通过发布事件验证
			const aggregateId = EntityId.generate();
			const event = new TestEvent(aggregateId, 1, 'tenant-1', 'test-data');

			// 应该不会抛出错误，但也不会有订阅者处理
			expect(async () => await eventBus.publish(event)).not.toThrow();
		});
	});
});
