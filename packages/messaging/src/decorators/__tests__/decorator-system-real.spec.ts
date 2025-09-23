/**
 * 装饰器系统实际测试
 *
 * @description 测试消息传递装饰器系统的实际功能
 * 验证装饰器的注册、查询和元数据管理
 *
 * @since 1.0.0
 */

import 'reflect-metadata';
import {
  MessageHandler,
  EventHandler,
  QueueProcessor,
  Saga,
  Subscribe,
  DecoratorRegistryUtils,
  getHandlerMetadata,
  isMessageHandler,
  isEventHandler,
  isQueueProcessor,
  isSaga,
  getAllSubscribeMethods,
} from '../index';
import { MessagePriority } from '../../interfaces/messaging.interface';

// 测试处理器类
@MessageHandler('test.message', {
  queue: 'test-queue',
  priority: MessagePriority.HIGH,
  maxRetries: 3,
})
class TestMessageHandler {
  async handle(message: unknown): Promise<void> {
    console.log('Handling message:', message);
  }
}

@EventHandler(['test.event1', 'test.event2'], {
  queue: 'event-queue',
  enableBatch: true,
  batchSize: 10,
})
class TestEventHandler {
  async handle(event: unknown): Promise<void> {
    console.log('Handling event:', event);
  }

  @Subscribe('test.event1')
  async onEvent1(event: unknown): Promise<void> {
    console.log('Handling event1:', event);
  }

  @Subscribe('test.event2')
  async onEvent2(event: unknown): Promise<void> {
    console.log('Handling event2:', event);
  }
}

@QueueProcessor({
  queueName: 'test-processor-queue',
  concurrency: 5,
  maxRetries: 2,
})
class TestQueueProcessor {
  async process(job: unknown): Promise<void> {
    console.log('Processing job:', job);
  }
}

@Saga({
  sagaName: 'test-saga',
  triggerEvents: ['saga.start'],
  timeout: 30000,
})
class TestSaga {
  async handle(event: unknown): Promise<void> {
    console.log('Handling saga event:', event);
  }
}

describe('装饰器系统实际测试', () => {
  beforeEach(() => {
    // 清空注册表，确保测试隔离
    DecoratorRegistryUtils['registry']?.clear?.();
  });

  describe('消息处理器装饰器', () => {
    it('应该正确注册消息处理器', () => {
      const metadata = getHandlerMetadata(TestMessageHandler);

      expect(metadata).toBeDefined();
      expect(metadata!.handlerType).toBe('message');
      expect(metadata!.target).toBe('test.message');
      expect(metadata!.handlerClass).toBe(TestMessageHandler);
    });

    it('应该正确识别消息处理器', () => {
      expect(isMessageHandler(TestMessageHandler)).toBe(true);
      expect(isEventHandler(TestMessageHandler)).toBe(false);
      expect(isQueueProcessor(TestMessageHandler)).toBe(false);
      expect(isSaga(TestMessageHandler)).toBe(false);
    });

    it('应该正确存储处理器选项', () => {
      const metadata = getHandlerMetadata(TestMessageHandler);
      const options = metadata!.options as any;

      expect(options.queue).toBe('test-queue');
      expect(options.priority).toBe(MessagePriority.HIGH);
      expect(options.maxRetries).toBe(3);
    });
  });

  describe('事件处理器装饰器', () => {
    it('应该正确注册事件处理器', () => {
      const metadata = getHandlerMetadata(TestEventHandler);

      expect(metadata).toBeDefined();
      expect(metadata!.handlerType).toBe('event');
      expect(metadata!.target).toEqual(['test.event1', 'test.event2']);
      expect(metadata!.handlerClass).toBe(TestEventHandler);
    });

    it('应该正确识别事件处理器', () => {
      expect(isEventHandler(TestEventHandler)).toBe(true);
      expect(isMessageHandler(TestEventHandler)).toBe(false);
      expect(isQueueProcessor(TestEventHandler)).toBe(false);
      expect(isSaga(TestEventHandler)).toBe(false);
    });

    it('应该正确注册订阅方法', () => {
      const subscribeMethods = getAllSubscribeMethods(TestEventHandler);

      expect(subscribeMethods).toHaveLength(2);
      expect(subscribeMethods.map((sm: any) => sm.methodName)).toContain(
        'onEvent1',
      );
      expect(subscribeMethods.map((sm: any) => sm.methodName)).toContain(
        'onEvent2',
      );
    });
  });

  describe('队列处理器装饰器', () => {
    it('应该正确注册队列处理器', () => {
      const metadata = getHandlerMetadata(TestQueueProcessor);

      expect(metadata).toBeDefined();
      expect(metadata!.handlerType).toBe('queue');
      expect(metadata!.target).toBe('test-processor-queue');
      expect(metadata!.handlerClass).toBe(TestQueueProcessor);
    });

    it('应该正确识别队列处理器', () => {
      expect(isQueueProcessor(TestQueueProcessor)).toBe(true);
      expect(isMessageHandler(TestQueueProcessor)).toBe(false);
      expect(isEventHandler(TestQueueProcessor)).toBe(false);
      expect(isSaga(TestQueueProcessor)).toBe(false);
    });
  });

  describe('Saga装饰器', () => {
    it('应该正确注册Saga处理器', () => {
      const metadata = getHandlerMetadata(TestSaga);

      expect(metadata).toBeDefined();
      expect(metadata!.handlerType).toBe('saga');
      expect(metadata!.target).toEqual(['saga.start']);
      expect(metadata!.handlerClass).toBe(TestSaga);
    });

    it('应该正确识别Saga处理器', () => {
      expect(isSaga(TestSaga)).toBe(true);
      expect(isMessageHandler(TestSaga)).toBe(false);
      expect(isEventHandler(TestSaga)).toBe(false);
      expect(isQueueProcessor(TestSaga)).toBe(false);
    });
  });

  describe('装饰器注册表', () => {
    it('应该正确统计注册的处理器', () => {
      // 装饰器应该在类定义时自动注册，检查注册表状态
      const summary = DecoratorRegistryUtils.getSummary();

      // 由于装饰器在类定义时注册，这些处理器应该已经存在
      expect(summary.totalHandlers).toBeGreaterThanOrEqual(4);
      expect(summary.messageHandlers).toBeGreaterThanOrEqual(1);
      expect(summary.eventHandlers).toBeGreaterThanOrEqual(1);
      expect(summary.queueProcessors).toBeGreaterThanOrEqual(1);
      expect(summary.sagaHandlers).toBeGreaterThanOrEqual(1);
    });

    it('应该能够按主题查找处理器', () => {
      const handlers =
        DecoratorRegistryUtils.findHandlersForTopic('test.message');

      expect(handlers.length).toBeGreaterThanOrEqual(1);
      const testHandler = handlers.find(
        (h) => h.handlerClass === TestMessageHandler,
      );
      expect(testHandler).toBeDefined();
    });

    it('应该能够按类型查找处理器', () => {
      const eventHandlers = DecoratorRegistryUtils.getAllEventHandlers();

      expect(eventHandlers.length).toBeGreaterThanOrEqual(1);
      const testHandler = eventHandlers.find(
        (h) => h.handlerClass === TestEventHandler,
      );
      expect(testHandler).toBeDefined();
    });
  });

  describe('错误处理', () => {
    it('应该验证队列处理器的必需选项', () => {
      expect(() => {
        const decorator = QueueProcessor({} as any);
        // 应该在装饰器创建时抛出错误
        decorator(class TestClass {});
      }).toThrow('QueueProcessor 装饰器必须指定有效的队列名称');
    });

    it('应该验证Saga的必需选项', () => {
      expect(() => {
        const decorator = Saga({} as any);
        // 应该在装饰器创建时抛出错误
        decorator(class TestClass {});
      }).toThrow('Saga 装饰器必须指定有效的Saga名称');
    });
  });
});
