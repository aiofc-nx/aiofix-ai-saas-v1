/**
 * CoreCommandPublisher 测试
 *
 * @description 测试核心命令发布者的功能
 * @since 1.0.0
 */
import { CoreCommandPublisher } from './core-command-publisher';

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

// Test command implementation
class TestCommand {
  constructor(
    private readonly id: string,
    private readonly type: string,
    private readonly tenantId?: string,
  ) {}

  getCommandType(): string {
    return this.type;
  }

  getCommandId(): string {
    return this.id;
  }

  getTenantId(): string | undefined {
    return this.tenantId;
  }
}

describe('CoreCommandPublisher', () => {
  let publisher: CoreCommandPublisher;

  beforeEach(() => {
    jest.clearAllMocks();
    publisher = new CoreCommandPublisher(mockLogger as any);
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

    it('应该防止在未启动时停止', async () => {
      await publisher.stop(); // 在未启动时停止应该被忽略
      expect(publisher.isStarted()).toBe(false);
    });
  });

  describe('命令发布', () => {
    beforeEach(async () => {
      await publisher.start();
    });

    it('应该能够发布单个命令', async () => {
      const command = new TestCommand('cmd-123', 'TestCommand', 'tenant-123');
      const result = await publisher.publish(command);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('应该在未启动时拒绝发布命令', async () => {
      await publisher.stop();
      const command = new TestCommand('cmd-123', 'TestCommand');

      await expect(publisher.publish(command)).rejects.toThrow(
        'Command publisher is not started',
      );
    });

    it('应该能够发布并等待结果', async () => {
      const command = new TestCommand('cmd-123', 'TestCommand');
      const result = await publisher.publishAndWait(command);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('应该能够批量发布命令', async () => {
      const commands = [
        new TestCommand('cmd-1', 'TestCommand1'),
        new TestCommand('cmd-2', 'TestCommand2'),
        new TestCommand('cmd-3', 'TestCommand3'),
      ];

      const result = await publisher.publishBatch(commands);

      expect(result).toBeDefined();
      expect(result.total).toBe(3);
      expect(result.successful).toBeGreaterThanOrEqual(0);
      expect(result.results).toHaveLength(3);
    });
  });

  describe('配置管理', () => {
    it('应该能够获取默认配置', () => {
      const config = publisher.getConfiguration();
      expect(config).toBeDefined();
      expect(config.enabled).toBe(true);
      expect(config.batchSize).toBeDefined();
      expect(config.maxRetries).toBeDefined();
    });

    it('应该能够更新配置', () => {
      const newConfig = {
        enabled: false,
        batchSize: 100,
        maxRetries: 10,
      };

      publisher.configure(newConfig);
      const config = publisher.getConfiguration();

      expect(config.enabled).toBe(false);
      expect(config.batchSize).toBe(100);
      expect(config.maxRetries).toBe(10);
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
      expect(stats.byType).toBeDefined();
      expect(stats.byTenant).toBeDefined();
    });

    it('应该在发布命令时更新统计信息', async () => {
      const command = new TestCommand('cmd-123', 'TestCommand');
      await publisher.publish(command);

      const stats = publisher.getStatistics();
      expect(stats.totalPublished).toBe(1);
      expect(stats.successfulPublished).toBe(1);
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

  describe('命令状态管理', () => {
    beforeEach(async () => {
      await publisher.start();
    });

    it('应该能够获取命令执行状态', async () => {
      const command = new TestCommand('cmd-123', 'TestCommand');
      const result = await publisher.publish(command);

      const status = publisher.getCommandStatus(result.messageId);
      expect(status).toBeDefined();
      expect(status!.commandId).toBe(result.messageId);
    });

    it('应该能够取消命令执行', async () => {
      const command = new TestCommand('cmd-123', 'TestCommand');
      const result = await publisher.publish(command, { async: true });

      const cancelled = await publisher.cancelCommand(result.messageId);
      expect(cancelled).toBe(true);
    });

    it('应该处理取消不存在的命令', async () => {
      const cancelled = await publisher.cancelCommand('non-existent-id');
      expect(cancelled).toBe(false);
    });
  });

  describe('边界情况', () => {
    beforeEach(async () => {
      await publisher.start();
    });

    it('应该处理空的命令批量', async () => {
      const result = await publisher.publishBatch([]);
      expect(result.total).toBe(0);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('应该处理特殊字符的命令类型', async () => {
      const command = new TestCommand('cmd-123', 'Special_Command_José_🚀');
      const result = await publisher.publish(command);
      expect(result.success).toBe(true);
    });

    it('应该处理大量命令发布', async () => {
      const commands = Array.from(
        { length: 100 },
        (_, i) => new TestCommand(`cmd-${i}`, 'TestCommand', 'tenant-123'),
      );

      const result = await publisher.publishBatch(commands);
      expect(result.total).toBe(100);
      expect(result.successful).toBeGreaterThanOrEqual(0);
    });

    it('应该处理异步发布', async () => {
      const command = new TestCommand('cmd-123', 'TestCommand');
      const result = await publisher.publish(command, { async: true });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });
});
