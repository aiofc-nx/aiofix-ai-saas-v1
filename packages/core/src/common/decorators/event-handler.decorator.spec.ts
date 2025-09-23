/**
 * EventHandler 装饰器测试
 *
 * @description 测试 EventHandler 装饰器的功能
 * @since 1.0.0
 */
import 'reflect-metadata';
import {
  EventHandler,
  isEventHandler,
  getEventType,
  getEventHandlerPriority,
  supportsEventType,
  getEventHandlerMetadata,
  EventHandlerClass,
} from './event-handler.decorator';
import { BaseDomainEvent } from '../../domain/events/base/base-domain-event';
import { IEventHandler } from '../../application/cqrs/events/base/event-handler.interface';
import { EntityId } from '../../domain/value-objects/entity-id';

// 测试用的事件类
class TestEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: string,
    public readonly testEventData: { message: string },
  ) {
    super(aggregateId, aggregateVersion, tenantId);
  }

  get eventType(): string {
    return 'TestEvent';
  }

  get eventData(): Record<string, unknown> {
    return {
      message: this.testEventData.message,
    };
  }
}

// 测试用的事件处理器类（不使用装饰器）
class TestEventHandlerWithoutDecorator implements IEventHandler<TestEvent> {
  async handle(_event: TestEvent): Promise<void> {
    console.log(`Handling event: ${_event.testEventData.message}`);
  }

  getSupportedEventType(): string {
    return 'TestEvent';
  }

  getPriority(): number {
    return 0;
  }

  async canHandle(_event: TestEvent): Promise<boolean> {
    return true;
  }

  async handleFailure(_event: TestEvent, _error: Error): Promise<void> {
    console.error(`Failed to handle event: ${_error.message}`);
  }

  async isEventProcessed(_event: TestEvent): Promise<boolean> {
    return false;
  }

  getRetryAttempts(): number {
    return 0;
  }

  shouldRetry(
    _event: TestEvent,
    _error: Error,
    _attemptCount: number,
  ): boolean {
    return false;
  }

  supports(_eventType: string): boolean {
    return _eventType === this.getSupportedEventType();
  }

  validateEvent(_event: TestEvent): void {
    // 验证事件
  }

  getMaxRetries(): number {
    return this.getRetryAttempts();
  }

  getRetryDelay(): number {
    return 1000;
  }

  getBackoffMultiplier(): number {
    return 1.5;
  }

  getMaxRetryDelay(): number {
    return 30000;
  }

  async shouldIgnore(_event: TestEvent): Promise<boolean> {
    return false;
  }

  async markEventAsProcessed(_event: TestEvent): Promise<void> {
    // 标记事件已处理
  }
}

// 测试用的事件处理器类（使用基础装饰器）
// @ts-expect-error - TypeScript 装饰器签名误报
@EventHandler('TestEvent')
class BasicTestEventHandler implements IEventHandler<TestEvent> {
  async handle(_event: TestEvent): Promise<void> {
    console.log(`Handling event: ${_event.testEventData.message}`);
  }

  getSupportedEventType(): string {
    return 'TestEvent';
  }

  getPriority(): number {
    return 0;
  }

  async canHandle(_event: TestEvent): Promise<boolean> {
    return true;
  }

  async handleFailure(_event: TestEvent, _error: Error): Promise<void> {
    console.error(`Failed to handle event: ${_error.message}`);
  }

  async isEventProcessed(_event: TestEvent): Promise<boolean> {
    return false;
  }

  getRetryAttempts(): number {
    return 0;
  }

  shouldRetry(
    _event: TestEvent,
    _error: Error,
    _attemptCount: number,
  ): boolean {
    return false;
  }

  supports(_eventType: string): boolean {
    return _eventType === this.getSupportedEventType();
  }

  validateEvent(_event: TestEvent): void {
    // 验证事件
  }

  getMaxRetries(): number {
    return this.getRetryAttempts();
  }

  getRetryDelay(): number {
    return 1000;
  }

  getBackoffMultiplier(): number {
    return 1.5;
  }

  getMaxRetryDelay(): number {
    return 30000;
  }

  async shouldIgnore(_event: TestEvent): Promise<boolean> {
    return false;
  }

  async markEventAsProcessed(_event: TestEvent): Promise<void> {
    // 标记事件已处理
  }
}

// 测试用的事件处理器类（使用高级装饰器）
// @ts-expect-error - TypeScript 装饰器签名误报
@EventHandler('AdvancedTestEvent', {
  priority: 10,
  timeout: 5000,
  retry: {
    maxRetries: 5,
    retryDelay: 2000,
    backoffMultiplier: 1.5,
  },
  multiTenant: {
    tenantResolver: async (_context: unknown): Promise<string> => 'test-tenant',
  },
  performanceMonitor: {
    thresholds: {
      warning: 1000,
      error: 5000,
    },
    metrics: ['processing_time', 'event_count'],
  },
  enableLogging: true,
  enableAudit: true,
  enablePerformanceMonitor: true,
  enableIdempotency: true,
  enableDeadLetterQueue: true,
  orderingKey: 'aggregateId',
  eventFilter: (event) => event !== null && event !== undefined,
  customConfig: {
    batchSize: 10,
    enableBatching: true,
  },
})
class AdvancedTestEventHandler implements IEventHandler<TestEvent> {
  async handle(event: TestEvent): Promise<void> {
    console.log(`Advanced handling event: ${event.eventData.message}`);
  }

  getSupportedEventType(): string {
    return 'AdvancedTestEvent';
  }

  getPriority(): number {
    return 10;
  }

  async canHandle(_event: TestEvent): Promise<boolean> {
    return true;
  }

  async handleFailure(event: TestEvent, error: Error): Promise<void> {
    console.error(`Advanced failed to handle event: ${error.message}`);
  }

  async isEventProcessed(_event: TestEvent): Promise<boolean> {
    return false;
  }

  getRetryAttempts(): number {
    return 5;
  }

  shouldRetry(
    _event: TestEvent,
    _error: Error,
    _attemptCount: number,
  ): boolean {
    return _attemptCount < 5;
  }

  supports(_eventType: string): boolean {
    return _eventType === this.getSupportedEventType();
  }

  validateEvent(_event: TestEvent): void {
    // 验证事件
  }

  getMaxRetries(): number {
    return this.getRetryAttempts();
  }

  getRetryDelay(): number {
    return 2000;
  }

  getBackoffMultiplier(): number {
    return 1.5;
  }

  getMaxRetryDelay(): number {
    return 30000;
  }

  async shouldIgnore(_event: TestEvent): Promise<boolean> {
    return false;
  }

  async markEventAsProcessed(_event: TestEvent): Promise<void> {
    // 标记事件已处理
  }
}

// 无效的事件处理器类（缺少 handle 方法）
class InvalidEventHandler {
  // 缺少 handle 方法
}

describe('EventHandler装饰器', () => {
  describe('基础装饰器功能', () => {
    it('应该正确标记事件处理器类', () => {
      expect(isEventHandler(BasicTestEventHandler)).toBe(true);
      expect(isEventHandler(TestEventHandlerWithoutDecorator)).toBe(false);
    });

    it('应该正确设置事件类型', () => {
      expect(getEventType(BasicTestEventHandler)).toBe('TestEvent');
      expect(getEventType(TestEventHandlerWithoutDecorator)).toBeUndefined();
    });

    it('应该正确设置静态属性', () => {
      expect(
        (BasicTestEventHandler as unknown as { eventType: string }).eventType,
      ).toBe('TestEvent');
      expect(
        (BasicTestEventHandler as unknown as { priority: number }).priority,
      ).toBe(0);
      expect(
        typeof (BasicTestEventHandler as unknown as { supports: unknown })
          .supports,
      ).toBe('function');
      expect(
        typeof (BasicTestEventHandler as unknown as { getMetadata: unknown })
          .getMetadata,
      ).toBe('function');
    });

    it('应该正确检查事件类型支持', () => {
      expect(
        (
          BasicTestEventHandler as unknown as {
            supports: (type: string) => boolean;
          }
        ).supports('TestEvent'),
      ).toBe(true);
      expect(
        (
          BasicTestEventHandler as unknown as {
            supports: (type: string) => boolean;
          }
        ).supports('OtherEvent'),
      ).toBe(false);
    });

    it('应该正确获取元数据', () => {
      const metadata = (
        BasicTestEventHandler as unknown as {
          getMetadata: () => { eventType: string; priority: number };
        }
      ).getMetadata();
      expect(metadata).toBeDefined();
      expect(metadata.eventType).toBe('TestEvent');
      expect(metadata.priority).toBe(0);
    });
  });

  describe('高级装饰器功能', () => {
    it('应该正确设置优先级', () => {
      expect(getEventHandlerPriority(AdvancedTestEventHandler)).toBe(10);
      expect(
        (AdvancedTestEventHandler as unknown as { priority: number }).priority,
      ).toBe(10);
    });

    it('应该正确设置完整配置', () => {
      const metadata = getEventHandlerMetadata(AdvancedTestEventHandler);
      expect(metadata).toBeDefined();
      expect(metadata!.eventType).toBe('AdvancedTestEvent');
      expect(metadata!.priority).toBe(10);
      expect(metadata!.timeout).toBe(5000);
      expect(metadata!.retry).toBeDefined();
      expect(metadata!.multiTenant).toBeDefined();
      expect(metadata!.performanceMonitor).toBeDefined();
      expect(metadata!.enableLogging).toBe(true);
      expect(metadata!.enableAudit).toBe(true);
      expect(metadata!.enablePerformanceMonitor).toBe(true);
      expect(metadata!.enableIdempotency).toBe(true);
      expect(metadata!.enableDeadLetterQueue).toBe(true);
      expect(metadata!.orderingKey).toBe('aggregateId');
      expect(metadata!.customConfig).toBeDefined();
    });

    it('应该正确设置重试配置', () => {
      const metadata = getEventHandlerMetadata(AdvancedTestEventHandler);
      const retry = metadata!.retry;
      expect(retry!.maxRetries).toBe(5);
      expect(retry!.retryDelay).toBe(2000);
      expect(retry!.backoffMultiplier).toBe(1.5);
    });

    it('应该正确设置多租户配置', () => {
      const metadata = getEventHandlerMetadata(AdvancedTestEventHandler);
      const multiTenant = metadata!.multiTenant;
      expect(typeof multiTenant!.tenantResolver).toBe('function');
    });

    it('应该正确设置性能监控配置', () => {
      const metadata = getEventHandlerMetadata(AdvancedTestEventHandler);
      const performanceMonitor = metadata!.performanceMonitor;
      expect(performanceMonitor!.thresholds).toEqual({
        warning: 1000,
        error: 5000,
      });
      expect(performanceMonitor!.metrics).toEqual([
        'processing_time',
        'event_count',
      ]);
    });

    it('应该正确设置事件过滤器', () => {
      const metadata = getEventHandlerMetadata(AdvancedTestEventHandler);
      const eventFilter = metadata!.eventFilter;
      expect(typeof eventFilter).toBe('function');

      if (eventFilter) {
        expect(eventFilter({})).toBe(true);
        expect(eventFilter(null)).toBe(false);
        expect(eventFilter(undefined)).toBe(false);
      }
    });

    it('应该正确设置自定义配置', () => {
      const metadata = getEventHandlerMetadata(AdvancedTestEventHandler);
      const customConfig = metadata!.customConfig;
      expect(customConfig!.batchSize).toBe(10);
      expect(customConfig!.enableBatching).toBe(true);
    });
  });

  describe('工具函数', () => {
    it('supportsEventType 应该正确检查事件类型支持', () => {
      expect(supportsEventType(BasicTestEventHandler, 'TestEvent')).toBe(true);
      expect(supportsEventType(BasicTestEventHandler, 'OtherEvent')).toBe(
        false,
      );
      expect(
        supportsEventType(AdvancedTestEventHandler, 'AdvancedTestEvent'),
      ).toBe(true);
      expect(supportsEventType(AdvancedTestEventHandler, 'TestEvent')).toBe(
        false,
      );
    });

    it('应该正确处理未标记的类', () => {
      expect(isEventHandler(TestEventHandlerWithoutDecorator)).toBe(false);
      expect(getEventType(TestEventHandlerWithoutDecorator)).toBeUndefined();
      expect(
        getEventHandlerPriority(TestEventHandlerWithoutDecorator),
      ).toBeUndefined();
      expect(
        supportsEventType(TestEventHandlerWithoutDecorator, 'TestEvent'),
      ).toBe(false);
      expect(
        getEventHandlerMetadata(TestEventHandlerWithoutDecorator),
      ).toBeUndefined();
    });
  });

  describe('错误处理', () => {
    it('应该拒绝没有 handle 方法的类', () => {
      expect(() => {
        // @ts-expect-error - TypeScript 装饰器签名误报
        @EventHandler('InvalidEvent')
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        class TestInvalidHandlerClass extends InvalidEventHandler {}
      }).toThrow(
        'Event handler TestInvalidHandlerClass must implement handle method',
      );
    });

    it('应该处理空的选项对象', () => {
      // @ts-expect-error - TypeScript 装饰器签名误报
      @EventHandler('EmptyOptionsEvent', {})
      class EmptyOptionsHandler implements IEventHandler<TestEvent> {
        async handle(_event: TestEvent): Promise<void> {
          console.log(`Handling event: ${_event.testEventData.message}`);
        }

        getSupportedEventType(): string {
          return 'EmptyOptionsEvent';
        }

        getPriority(): number {
          return 0;
        }

        async canHandle(_event: TestEvent): Promise<boolean> {
          return true;
        }

        async handleFailure(_event: TestEvent, _error: Error): Promise<void> {
          console.error(`Failed to handle event: ${_error.message}`);
        }

        async isEventProcessed(_event: TestEvent): Promise<boolean> {
          return false;
        }

        getRetryAttempts(): number {
          return 0;
        }

        shouldRetry(
          _event: TestEvent,
          _error: Error,
          _attemptCount: number,
        ): boolean {
          return false;
        }

        supports(_eventType: string): boolean {
          return _eventType === this.getSupportedEventType();
        }

        validateEvent(_event: TestEvent): void {
          // 验证事件
        }

        getMaxRetries(): number {
          return this.getRetryAttempts();
        }

        getRetryDelay(): number {
          return 1000;
        }

        getBackoffMultiplier(): number {
          return 1.5;
        }

        getMaxRetryDelay(): number {
          return 30000;
        }

        async shouldIgnore(_event: TestEvent): Promise<boolean> {
          return false;
        }

        async markEventAsProcessed(_event: TestEvent): Promise<void> {
          // 标记事件已处理
        }
      }

      expect(isEventHandler(EmptyOptionsHandler)).toBe(true);
      expect(getEventType(EmptyOptionsHandler)).toBe('EmptyOptionsEvent');
      expect(getEventHandlerPriority(EmptyOptionsHandler)).toBe(0);
    });
  });

  describe('边界情况', () => {
    it('应该处理特殊字符的事件类型', () => {
      // @ts-expect-error - TypeScript 装饰器签名误报
      @EventHandler('Special-Event_Type.123')
      class SpecialEventHandler implements IEventHandler<TestEvent> {
        async handle(_event: TestEvent): Promise<void> {
          console.log(
            `Handling special event: ${_event.testEventData.message}`,
          );
        }

        getSupportedEventType(): string {
          return 'Special-Event_Type.123';
        }

        getPriority(): number {
          return 0;
        }

        async canHandle(_event: TestEvent): Promise<boolean> {
          return true;
        }

        async handleFailure(_event: TestEvent, _error: Error): Promise<void> {
          console.error(`Failed to handle event: ${_error.message}`);
        }

        async isEventProcessed(_event: TestEvent): Promise<boolean> {
          return false;
        }

        getRetryAttempts(): number {
          return 0;
        }

        shouldRetry(
          _event: TestEvent,
          _error: Error,
          _attemptCount: number,
        ): boolean {
          return false;
        }

        supports(_eventType: string): boolean {
          return _eventType === this.getSupportedEventType();
        }

        validateEvent(_event: TestEvent): void {
          // 验证事件
        }

        getMaxRetries(): number {
          return this.getRetryAttempts();
        }

        getRetryDelay(): number {
          return 1000;
        }

        getBackoffMultiplier(): number {
          return 1.5;
        }

        getMaxRetryDelay(): number {
          return 30000;
        }

        async shouldIgnore(_event: TestEvent): Promise<boolean> {
          return false;
        }

        async markEventAsProcessed(_event: TestEvent): Promise<void> {
          // 标记事件已处理
        }
      }

      expect(getEventType(SpecialEventHandler)).toBe('Special-Event_Type.123');
      expect(
        supportsEventType(SpecialEventHandler, 'Special-Event_Type.123'),
      ).toBe(true);
    });

    it('应该处理负数优先级', () => {
      // @ts-expect-error - TypeScript 装饰器签名误报
      @EventHandler('NegativePriorityEvent', { priority: -5 })
      class NegativePriorityHandler implements IEventHandler<TestEvent> {
        async handle(_event: TestEvent): Promise<void> {
          console.log(`Handling event: ${_event.testEventData.message}`);
        }

        getSupportedEventType(): string {
          return 'NegativePriorityEvent';
        }

        getPriority(): number {
          return -5;
        }

        async canHandle(_event: TestEvent): Promise<boolean> {
          return true;
        }

        async handleFailure(_event: TestEvent, _error: Error): Promise<void> {
          console.error(`Failed to handle event: ${_error.message}`);
        }

        async isEventProcessed(_event: TestEvent): Promise<boolean> {
          return false;
        }

        getRetryAttempts(): number {
          return 0;
        }

        shouldRetry(
          _event: TestEvent,
          _error: Error,
          _attemptCount: number,
        ): boolean {
          return false;
        }

        supports(_eventType: string): boolean {
          return _eventType === this.getSupportedEventType();
        }

        validateEvent(_event: TestEvent): void {
          // 验证事件
        }

        getMaxRetries(): number {
          return this.getRetryAttempts();
        }

        getRetryDelay(): number {
          return 1000;
        }

        getBackoffMultiplier(): number {
          return 1.5;
        }

        getMaxRetryDelay(): number {
          return 30000;
        }

        async shouldIgnore(_event: TestEvent): Promise<boolean> {
          return false;
        }

        async markEventAsProcessed(_event: TestEvent): Promise<void> {
          // 标记事件已处理
        }
      }

      expect(getEventHandlerPriority(NegativePriorityHandler)).toBe(-5);
      expect(
        (NegativePriorityHandler as unknown as { priority: number }).priority,
      ).toBe(-5);
    });

    it('应该处理大数值配置', () => {
      // @ts-expect-error - TypeScript 装饰器签名误报
      @EventHandler('LargeNumbersEvent', {
        priority: Number.MAX_SAFE_INTEGER,
        timeout: Number.MAX_SAFE_INTEGER,
      })
      class LargeNumbersHandler implements IEventHandler<TestEvent> {
        async handle(_event: TestEvent): Promise<void> {
          console.log(`Handling event: ${_event.testEventData.message}`);
        }

        getSupportedEventType(): string {
          return 'LargeNumbersEvent';
        }

        getPriority(): number {
          return Number.MAX_SAFE_INTEGER;
        }

        async canHandle(_event: TestEvent): Promise<boolean> {
          return true;
        }

        async handleFailure(_event: TestEvent, _error: Error): Promise<void> {
          console.error(`Failed to handle event: ${_error.message}`);
        }

        async isEventProcessed(_event: TestEvent): Promise<boolean> {
          return false;
        }

        getRetryAttempts(): number {
          return 0;
        }

        shouldRetry(
          _event: TestEvent,
          _error: Error,
          _attemptCount: number,
        ): boolean {
          return false;
        }

        supports(_eventType: string): boolean {
          return _eventType === this.getSupportedEventType();
        }

        validateEvent(_event: TestEvent): void {
          // 验证事件
        }

        getMaxRetries(): number {
          return this.getRetryAttempts();
        }

        getRetryDelay(): number {
          return 1000;
        }

        getBackoffMultiplier(): number {
          return 1.5;
        }

        getMaxRetryDelay(): number {
          return 30000;
        }

        async shouldIgnore(_event: TestEvent): Promise<boolean> {
          return false;
        }

        async markEventAsProcessed(_event: TestEvent): Promise<void> {
          // 标记事件已处理
        }
      }

      const metadata = getEventHandlerMetadata(LargeNumbersHandler);
      expect(metadata!.priority).toBe(Number.MAX_SAFE_INTEGER);
      expect(metadata!.timeout).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('应该处理复杂的事件过滤器', () => {
      // @ts-expect-error - TypeScript 装饰器签名误报
      @EventHandler('ComplexFilterEvent', {
        eventFilter: (event) => {
          if (!event) return false;
          if (typeof event !== 'object') return false;
          return (
            'eventType' in event && event.eventType === 'ComplexFilterEvent'
          );
        },
      })
      class ComplexFilterHandler implements IEventHandler<TestEvent> {
        async handle(_event: TestEvent): Promise<void> {
          console.log(
            `Handling filtered event: ${_event.testEventData.message}`,
          );
        }

        getSupportedEventType(): string {
          return 'ComplexFilterEvent';
        }

        getPriority(): number {
          return 0;
        }

        async canHandle(_event: TestEvent): Promise<boolean> {
          return true;
        }

        async handleFailure(_event: TestEvent, _error: Error): Promise<void> {
          console.error(`Failed to handle event: ${_error.message}`);
        }

        async isEventProcessed(_event: TestEvent): Promise<boolean> {
          return false;
        }

        getRetryAttempts(): number {
          return 0;
        }

        shouldRetry(
          _event: TestEvent,
          _error: Error,
          _attemptCount: number,
        ): boolean {
          return false;
        }

        supports(_eventType: string): boolean {
          return _eventType === this.getSupportedEventType();
        }

        validateEvent(_event: TestEvent): void {
          // 验证事件
        }

        getMaxRetries(): number {
          return this.getRetryAttempts();
        }

        getRetryDelay(): number {
          return 1000;
        }

        getBackoffMultiplier(): number {
          return 1.5;
        }

        getMaxRetryDelay(): number {
          return 30000;
        }

        async shouldIgnore(_event: TestEvent): Promise<boolean> {
          return false;
        }

        async markEventAsProcessed(_event: TestEvent): Promise<void> {
          // 标记事件已处理
        }
      }

      const metadata = getEventHandlerMetadata(ComplexFilterHandler);
      const eventFilter = metadata!.eventFilter;
      expect(typeof eventFilter).toBe('function');

      if (eventFilter) {
        expect(eventFilter(null)).toBe(false);
        expect(eventFilter(undefined)).toBe(false);
        expect(eventFilter('string')).toBe(false);
        expect(eventFilter({ eventType: 'ComplexFilterEvent' })).toBe(true);
        expect(eventFilter({ eventType: 'OtherEvent' })).toBe(false);
        expect(eventFilter({})).toBe(false);
      }
    });
  });

  describe('类型检查', () => {
    it('应该正确定义 EventHandlerClass 类型', () => {
      const handlerClass =
        BasicTestEventHandler as unknown as EventHandlerClass<TestEvent>;

      expect((handlerClass as unknown as { eventType: string }).eventType).toBe(
        'TestEvent',
      );
      expect((handlerClass as unknown as { priority: number }).priority).toBe(
        0,
      );
      expect(
        typeof (handlerClass as unknown as { supports: unknown }).supports,
      ).toBe('function');
      expect(
        typeof (handlerClass as unknown as { getMetadata: unknown })
          .getMetadata,
      ).toBe('function');
    });

    it('应该支持泛型事件类型', () => {
      // @ts-expect-error - TypeScript 装饰器签名误报
      @EventHandler('GenericEvent')
      class GenericEventHandler<T extends BaseDomainEvent>
        implements IEventHandler<T>
      {
        async handle(_event: T): Promise<void> {
          console.log(`Handling generic event: ${_event.eventType}`);
        }

        getSupportedEventType(): string {
          return 'GenericEvent';
        }

        getPriority(): number {
          return 0;
        }

        async canHandle(_event: T): Promise<boolean> {
          return true;
        }

        async handleFailure(_event: T, _error: Error): Promise<void> {
          console.error(`Failed to handle generic event: ${_error.message}`);
        }

        async isEventProcessed(_event: T): Promise<boolean> {
          return false;
        }

        getRetryAttempts(): number {
          return 0;
        }

        shouldRetry(_event: T, _error: Error, _attemptCount: number): boolean {
          return false;
        }

        supports(_eventType: string): boolean {
          return _eventType === this.getSupportedEventType();
        }

        validateEvent(_event: T): void {
          // 验证事件
        }

        getMaxRetries(): number {
          return this.getRetryAttempts();
        }

        getRetryDelay(): number {
          return 1000;
        }

        getBackoffMultiplier(): number {
          return 1.5;
        }

        getMaxRetryDelay(): number {
          return 30000;
        }

        async shouldIgnore(_event: T): Promise<boolean> {
          return false;
        }

        async markEventAsProcessed(_event: T): Promise<void> {
          // 标记事件已处理
        }
      }

      expect(isEventHandler(GenericEventHandler)).toBe(true);
      expect(getEventType(GenericEventHandler)).toBe('GenericEvent');
    });
  });

  describe('事件处理特性测试', () => {
    it('应该正确处理幂等性配置', () => {
      const metadata = getEventHandlerMetadata(AdvancedTestEventHandler);
      expect(metadata!.enableIdempotency).toBe(true);
    });

    it('应该正确处理死信队列配置', () => {
      const metadata = getEventHandlerMetadata(AdvancedTestEventHandler);
      expect(metadata!.enableDeadLetterQueue).toBe(true);
    });

    it('应该正确处理排序键配置', () => {
      const metadata = getEventHandlerMetadata(AdvancedTestEventHandler);
      expect(metadata!.orderingKey).toBe('aggregateId');
    });

    it('应该正确处理批量处理配置', () => {
      // @ts-expect-error - TypeScript 装饰器签名误报
      @EventHandler('BatchEvent', {
        customConfig: {
          enableBatching: true,
          batchSize: 50,
          batchTimeout: 5000,
        },
      })
      class BatchEventHandler implements IEventHandler<TestEvent> {
        async handle(_event: TestEvent): Promise<void> {
          console.log(`Batch handling event: ${_event.testEventData.message}`);
        }

        getSupportedEventType(): string {
          return 'BatchEvent';
        }

        getPriority(): number {
          return 0;
        }

        async canHandle(_event: TestEvent): Promise<boolean> {
          return true;
        }

        async handleFailure(_event: TestEvent, _error: Error): Promise<void> {
          console.error(`Failed to handle batch event: ${_error.message}`);
        }

        async isEventProcessed(_event: TestEvent): Promise<boolean> {
          return false;
        }

        getRetryAttempts(): number {
          return 0;
        }

        shouldRetry(
          _event: TestEvent,
          _error: Error,
          _attemptCount: number,
        ): boolean {
          return false;
        }

        supports(_eventType: string): boolean {
          return _eventType === this.getSupportedEventType();
        }

        validateEvent(_event: TestEvent): void {
          // 验证事件
        }

        getMaxRetries(): number {
          return this.getRetryAttempts();
        }

        getRetryDelay(): number {
          return 1000;
        }

        getBackoffMultiplier(): number {
          return 1.5;
        }

        getMaxRetryDelay(): number {
          return 30000;
        }

        async shouldIgnore(_event: TestEvent): Promise<boolean> {
          return false;
        }

        async markEventAsProcessed(_event: TestEvent): Promise<void> {
          // 标记事件已处理
        }
      }

      const metadata = getEventHandlerMetadata(BatchEventHandler);
      const customConfig = metadata!.customConfig;
      expect(customConfig!.enableBatching).toBe(true);
      expect(customConfig!.batchSize).toBe(50);
      expect(customConfig!.batchTimeout).toBe(5000);
    });
  });
});
