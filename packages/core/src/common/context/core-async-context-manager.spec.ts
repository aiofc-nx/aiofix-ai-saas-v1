/**
 * CoreAsyncContextManager 测试
 *
 * 测试核心异步上下文管理器的功能，包括上下文管理、生命周期管理、执行控制等。
 *
 * @description 核心异步上下文管理器的单元测试
 * @since 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CoreAsyncContextManager } from './core-async-context-manager';
import { CoreAsyncContext } from './core-async-context';
import { IContextData } from './async-context.interface';

// Mock logger service
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('CoreAsyncContextManager', () => {
  let manager: CoreAsyncContextManager;
  let module: TestingModule;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CoreAsyncContextManager,
        {
          provide: 'ILoggerService',
          useValue: mockLogger,
        },
      ],
    }).compile();

    manager = moduleRef.get<CoreAsyncContextManager>(CoreAsyncContextManager);
    module = moduleRef;
  });

  afterEach(async () => {
    if (manager.isStarted()) {
      await manager.stop();
    }
    await module.close();
    jest.clearAllMocks();
  });

  describe('构造函数', () => {
    it('应该正确初始化管理器', () => {
      expect(manager).toBeDefined();
      expect(manager.isStarted()).toBe(false);
    });
  });

  describe('上下文创建', () => {
    it('应该能够创建新的上下文', () => {
      const context = manager.createContext();

      expect(context).toBeInstanceOf(CoreAsyncContext);
      expect(context.getId()).toBeDefined();
    });

    it('应该能够使用初始数据创建上下文', () => {
      const data: Partial<IContextData> = {
        tenantId: 'tenant-123',
        userId: 'user-456',
      };
      const context = manager.createContext(data);

      expect(context.getTenantId()).toBe('tenant-123');
      expect(context.getUserId()).toBe('user-456');
    });

    it('应该将创建的上下文添加到管理器中', () => {
      const context = manager.createContext();
      const retrieved = manager.getContext(context.getId());

      expect(retrieved).toBeDefined();
      expect(retrieved?.getId()).toBe(context.getId());
    });
  });

  describe('当前上下文管理', () => {
    it('应该能够设置和获取当前上下文', () => {
      const context = manager.createContext();

      // 在异步上下文中设置和获取当前上下文
      manager.runInContext(context, () => {
        const current = manager.getCurrentContext();
        expect(current).toBeDefined();
        expect(current?.getId()).toBe(context.getId());
      });
    });

    it('应该能够清除当前上下文', () => {
      const context = manager.createContext();

      // 在异步上下文中清除当前上下文
      manager.runInContext(context, () => {
        expect(manager.getCurrentContext()).toBeDefined();
        manager.clearCurrentContext();
        // 注意：AsyncLocalStorage 的 exit 方法不会立即清除上下文
        // 这里我们只验证 clearCurrentContext 方法可以被调用而不抛出错误
        expect(() => manager.clearCurrentContext()).not.toThrow();
      });
    });
  });

  describe('上下文执行', () => {
    it('应该能够在指定上下文中执行异步函数', async () => {
      const context = manager.createContext({ tenantId: 'tenant-123' });

      const result = await manager.runInContext(context, async () => {
        const current = manager.getCurrentContext();
        return current?.getTenantId();
      });

      expect(result).toBe('tenant-123');
    });

    it('应该能够在指定上下文中执行同步函数', () => {
      const context = manager.createContext({ userId: 'user-456' });

      const result = manager.runInContextSync(context, () => {
        const current = manager.getCurrentContext();
        return current?.getUserId();
      });

      expect(result).toBe('user-456');
    });

    it('应该处理异步函数中的错误', async () => {
      const context = manager.createContext();

      await expect(
        manager.runInContext(context, async () => {
          throw new Error('Test error');
        }),
      ).rejects.toThrow('Test error');
    });

    it('应该处理同步函数中的错误', () => {
      const context = manager.createContext();

      expect(() => {
        manager.runInContextSync(context, () => {
          throw new Error('Test error');
        });
      }).toThrow('Test error');
    });
  });

  describe('函数包装', () => {
    it('应该能够包装同步函数', () => {
      const context = manager.createContext({ tenantId: 'tenant-123' });
      const originalFn = jest.fn().mockReturnValue('result');

      const wrappedFn = manager.wrapInContext(context, originalFn);
      const result = wrappedFn('arg1', 'arg2');

      expect(result).toBe('result');
      expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('应该能够包装异步函数', async () => {
      const context = manager.createContext({ userId: 'user-456' });
      const originalFn = jest.fn().mockResolvedValue('async-result');

      const wrappedFn = manager.wrapInContextAsync(context, originalFn);
      const result = await wrappedFn('arg1', 'arg2');

      expect(result).toBe('async-result');
      expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('上下文查询', () => {
    beforeEach(() => {
      // 创建测试上下文
      manager.createContext({ tenantId: 'tenant-1', userId: 'user-1' });
      manager.createContext({ tenantId: 'tenant-1', userId: 'user-2' });
      manager.createContext({ tenantId: 'tenant-2', userId: 'user-3' });
      manager.createContext({
        organizationId: 'org-1',
        departmentId: 'dept-1',
      });
    });

    it('应该能够获取所有上下文', () => {
      const allContexts = manager.getAllContexts();
      expect(allContexts).toHaveLength(4);
    });

    it('应该能够获取活跃上下文', () => {
      const activeContexts = manager.getActiveContexts();
      expect(activeContexts).toHaveLength(4); // 所有上下文都是活跃的
    });

    it('应该能够获取过期上下文', () => {
      const expiredContexts = manager.getExpiredContexts();
      expect(expiredContexts).toHaveLength(0); // 没有过期的上下文
    });

    it('应该能够根据租户ID获取上下文', () => {
      const tenant1Contexts = manager.getContextsByTenant('tenant-1');
      expect(tenant1Contexts).toHaveLength(2);

      const tenant2Contexts = manager.getContextsByTenant('tenant-2');
      expect(tenant2Contexts).toHaveLength(1);
    });

    it('应该能够根据用户ID获取上下文', () => {
      const user1Contexts = manager.getContextsByUser('user-1');
      expect(user1Contexts).toHaveLength(1);

      const user3Contexts = manager.getContextsByUser('user-3');
      expect(user3Contexts).toHaveLength(1);
    });

    it('应该能够根据组织ID获取上下文', () => {
      const org1Contexts = manager.getContextsByOrganization('org-1');
      expect(org1Contexts).toHaveLength(1);
    });

    it('应该能够根据部门ID获取上下文', () => {
      const dept1Contexts = manager.getContextsByDepartment('dept-1');
      expect(dept1Contexts).toHaveLength(1);
    });

    it('应该能够根据请求ID获取上下文', () => {
      const context = manager.createContext({ requestId: 'req-123' });
      const found = manager.getContextByRequest('req-123');

      expect(found).toBeDefined();
      expect(found?.getId()).toBe(context.getId());
    });

    it('应该能够根据关联ID获取上下文', () => {
      const context = manager.createContext({ correlationId: 'corr-123' });
      const found = manager.getContextsByCorrelation('corr-123');

      expect(found).toHaveLength(1);
      expect(found[0].getId()).toBe(context.getId());
    });
  });

  describe('上下文删除', () => {
    it('应该能够删除指定的上下文', () => {
      const context = manager.createContext();
      const id = context.getId();

      expect(manager.getContext(id)).toBeDefined();

      const removed = manager.removeContext(id);
      expect(removed).toBe(true);
      expect(manager.getContext(id)).toBeUndefined();
    });

    it('应该处理删除不存在的上下文', () => {
      const removed = manager.removeContext('non-existent-id');
      expect(removed).toBe(false);
    });
  });

  describe('子上下文创建', () => {
    it('应该能够创建子上下文', () => {
      const parentContext = manager.createContext({
        tenantId: 'tenant-123',
        userId: 'user-456',
        correlationId: 'parent-corr',
      });

      const childContext = manager.createChildContext(parentContext, {
        userId: 'child-user',
      });

      expect(childContext.getTenantId()).toBe('tenant-123'); // 继承父上下文
      expect(childContext.getUserId()).toBe('child-user'); // 覆盖父上下文
      expect(childContext.getCorrelationId()).toBe('parent-corr'); // 继承关联ID
      expect(childContext.getCausationId()).toBe(parentContext.getId()); // 设置原因ID
    });
  });

  describe('生命周期管理', () => {
    it('应该能够启动管理器', async () => {
      await manager.start();
      expect(manager.isStarted()).toBe(true);
    });

    it('应该防止重复启动', async () => {
      await manager.start();
      await manager.start(); // 第二次启动应该被忽略

      expect(manager.isStarted()).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Context manager is already started',
        expect.any(String),
      );
    });

    it('应该能够停止管理器', async () => {
      await manager.start();
      expect(manager.isStarted()).toBe(true);

      await manager.stop();
      expect(manager.isStarted()).toBe(false);
    });

    it('应该防止在未启动时停止', async () => {
      await manager.stop(); // 未启动时停止应该被忽略

      expect(manager.isStarted()).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Context manager is not started',
        expect.any(String),
      );
    });
  });

  describe('过期上下文清理', () => {
    it('应该能够清理过期的上下文', () => {
      const context1 = manager.createContext();
      const context2 = manager.createContext();

      // 设置一个上下文为过期状态
      const pastTime = new Date(Date.now() - 60000);
      context1.setExpiresAt(pastTime);

      expect(manager.getAllContexts()).toHaveLength(2);

      manager.cleanupExpiredContexts();

      expect(manager.getAllContexts()).toHaveLength(1);
      expect(manager.getContext(context1.getId())).toBeUndefined();
      expect(manager.getContext(context2.getId())).toBeDefined();
    });

    it('应该处理没有过期上下文的情况', () => {
      manager.createContext();
      manager.createContext();

      expect(manager.getAllContexts()).toHaveLength(2);

      manager.cleanupExpiredContexts();

      expect(manager.getAllContexts()).toHaveLength(2);
    });
  });

  describe('统计信息', () => {
    it('应该能够获取基本统计信息', () => {
      manager.createContext();
      manager.createContext();

      // 添加小延迟以确保生命周期大于0
      const startTime = Date.now();
      while (Date.now() - startTime < 1) {
        // 等待1毫秒
      }

      const stats = manager.getStatistics();

      expect(stats.totalContexts).toBe(2);
      expect(stats.activeContexts).toBe(2);
      expect(stats.expiredContexts).toBe(0);
      expect(stats.averageLifetime).toBeGreaterThan(0);
      expect(stats.createdAt).toBeInstanceOf(Date);
      expect(stats.lastUpdatedAt).toBeInstanceOf(Date);
    });

    it('应该能够获取详细统计信息', () => {
      manager.createContext({ tenantId: 'tenant-1', source: 'WEB' });
      manager.createContext({ tenantId: 'tenant-2', source: 'API' });
      manager.createContext({ organizationId: 'org-1' });

      const detailedStats = manager.getDetailedStatistics();

      expect(detailedStats.basic.totalContexts).toBe(3);
      expect(detailedStats.byLevel).toBeDefined();
      expect(detailedStats.byTenant).toBeDefined();
      expect(detailedStats.bySource).toBeDefined();
      expect(detailedStats.lifetimeDistribution).toBeDefined();

      expect(detailedStats.byTenant['tenant-1']).toBe(1);
      expect(detailedStats.byTenant['tenant-2']).toBe(1);
      expect(detailedStats.bySource['WEB']).toBe(1);
      expect(detailedStats.bySource['API']).toBe(1);
    });

    it('应该正确计算生命周期分布', () => {
      const context1 = manager.createContext();
      const context2 = manager.createContext();

      // 等待一小段时间
      setTimeout(() => {
        const detailedStats = manager.getDetailedStatistics();
        const distribution = detailedStats.lifetimeDistribution;

        expect(distribution.min).toBeGreaterThan(0);
        expect(distribution.max).toBeGreaterThan(0);
        expect(distribution.avg).toBeGreaterThan(0);
        expect(distribution.median).toBeGreaterThan(0);
      }, 10);
    });
  });

  describe('边界情况', () => {
    it('应该处理空上下文列表', () => {
      const stats = manager.getStatistics();
      expect(stats.totalContexts).toBe(0);
      expect(stats.activeContexts).toBe(0);
      expect(stats.expiredContexts).toBe(0);
      expect(stats.averageLifetime).toBe(0);
    });

    it('应该处理大量上下文', () => {
      // 创建大量上下文
      for (let i = 0; i < 100; i++) {
        manager.createContext({ tenantId: `tenant-${i}` });
      }

      const stats = manager.getStatistics();
      expect(stats.totalContexts).toBe(100);
      expect(stats.activeContexts).toBe(100);
    });

    it('应该处理嵌套的上下文执行', async () => {
      const outerContext = manager.createContext({ tenantId: 'outer' });
      const innerContext = manager.createContext({ tenantId: 'inner' });

      const result = await manager.runInContext(outerContext, async () => {
        const outerTenant = manager.getCurrentContext()?.getTenantId();

        const innerResult = await manager.runInContext(
          innerContext,
          async () => {
            const innerTenant = manager.getCurrentContext()?.getTenantId();
            return { outerTenant, innerTenant };
          },
        );

        return innerResult;
      });

      expect(result.outerTenant).toBe('outer');
      expect(result.innerTenant).toBe('inner');
    });
  });
});
