/**
 * CoreEventPublisher 测试
 *
 * @description 测试核心事件发布者的功能
 * @since 1.0.0
 */
import { CoreEventPublisher } from './core-event-publisher';

// Mock logger
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
  trace: jest.fn(),
  performance: jest.fn(),
  business: jest.fn(),
  security: jest.fn(),
  child: jest.fn(),
  setLevel: jest.fn(),
  getLevel: jest.fn(),
  updateConfig: jest.fn(),
  getConfig: jest.fn(),
  flush: jest.fn(),
  close: jest.fn(),
  getStats: jest.fn(),
  resetStats: jest.fn(),
};

// Test event implementation
class TestEvent {
  constructor(
    private readonly id: string,
    private readonly type: string,
    private readonly tenantId?: string,
  ) {}

  getEventType(): string {
    return this.type;
  }

  getEventId(): string {
    return this.id;
  }

  getTenantId(): string | undefined {
    return this.tenantId;
  }
}

describe('CoreEventPublisher', () => {
  let publisher: CoreEventPublisher;

  beforeEach(() => {
    jest.clearAllMocks();
    publisher = new CoreEventPublisher(mockLogger as any);
  });

  afterEach(async () => {
    if (publisher.isStarted()) {
      await publisher.stop();
    }
  });

  describe('生命周期管理', () => {
    it('应该正确初始化发布者', () => {
      expect(publisher).toBeDefined();
      expect(publisher.isStarted()).toBe(false);
    });

    it('应该能够启动发布者', async () => {
      await publisher.start();
      expect(publisher.isStarted()).toBe(true);
    });

    it('应该能够停止发布者', async () => {
      await publisher.start();
      await publisher.stop();
      expect(publisher.isStarted()).toBe(false);
    });

    it('应该防止重复启动', async () => {
      await publisher.start();
      await publisher.start(); // 第二次启动应该被忽略
      expect(publisher.isStarted()).toBe(true);
    });
  });

  describe('事件发布', () => {
    beforeEach(async () => {
      await publisher.start();
    });

    it('应该能够发布单个事件', async () => {
      const event = new TestEvent('evt-123', 'TestEvent', 'tenant-123');
      const result = await publisher.publish(event);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('应该在未启动时拒绝发布事件', async () => {
      await publisher.stop();
      const event = new TestEvent('evt-123', 'TestEvent');

      await expect(publisher.publish(event)).rejects.toThrow(
        'Event publisher is not started',
      );
    });

    it('应该能够批量发布事件', async () => {
      const events = [
        new TestEvent('evt-1', 'TestEvent1'),
        new TestEvent('evt-2', 'TestEvent2'),
        new TestEvent('evt-3', 'TestEvent3'),
      ];

      const result = await publisher.publishBatch(events);

      expect(result).toBeDefined();
      expect(result.total).toBe(3);
      expect(result.results).toHaveLength(3);
    });
  });

  describe('配置管理', () => {
    it('应该能够获取默认配置', () => {
      const config = publisher.getConfiguration();
      expect(config).toBeDefined();
      expect(config.enabled).toBe(true);
      expect(config.batchSize).toBeDefined();
    });

    it('应该能够更新配置', () => {
      const newConfig = {
        enabled: false,
        batchSize: 200,
      };

      publisher.configure(newConfig);
      const config = publisher.getConfiguration();

      expect(config.enabled).toBe(false);
      expect(config.batchSize).toBe(200);
    });
  });

  describe('统计信息', () => {
    beforeEach(async () => {
      await publisher.start();
    });

    it('应该能够获取统计信息', () => {
      const stats = publisher.getStatistics();
      expect(stats).toBeDefined();
      expect(stats.totalPublished).toBe(0);
      expect(stats.successfulPublished).toBe(0);
      expect(stats.failedPublished).toBe(0);
    });

    it('应该在发布事件时更新统计信息', async () => {
      const event = new TestEvent('evt-123', 'TestEvent');
      await publisher.publish(event);

      const stats = publisher.getStatistics();
      expect(stats.totalPublished).toBeGreaterThanOrEqual(0);
      expect(stats).toBeDefined();
    });
  });

  describe('健康检查', () => {
    it('应该在未启动时返回不健康', async () => {
      const health = await publisher.healthCheck();
      expect(health).toBe(false);
    });

    it('应该在启动后返回健康', async () => {
      await publisher.start();
      const health = await publisher.healthCheck();
      expect(health).toBe(true);
    });

    it('应该检查可用性', async () => {
      expect(publisher.isAvailable()).toBe(false);
      await publisher.start();
      expect(publisher.isAvailable()).toBe(true);
    });
  });

  describe('边界情况', () => {
    beforeEach(async () => {
      await publisher.start();
    });

    it('应该处理空的事件批量', async () => {
      const result = await publisher.publishBatch([]);
      expect(result.total).toBe(0);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('应该处理特殊字符的事件类型', async () => {
      const event = new TestEvent('evt-123', 'Special_Event_José_🚀');
      const result = await publisher.publish(event);
      expect(result.success).toBe(true);
    });

    it('应该处理异步发布', async () => {
      const event = new TestEvent('evt-123', 'TestEvent');
      const result = await publisher.publish(event, { async: true });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });
});
