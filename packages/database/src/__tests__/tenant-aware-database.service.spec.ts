/**
 * 租户感知数据库服务测试
 *
 * @description 测试多租户数据库隔离和安全功能
 *
 * @since 1.0.0
 */

import { TenantAwareDatabaseService } from '../services/tenant-aware-database.service';
import {
  DatabaseIsolationStrategy,
  DEFAULT_ISOLATION_CONFIG,
} from '../strategies/database-isolation.strategy';
import { DatabaseIsolationLevel } from '../interfaces';

// Mock基础数据库服务
const mockBaseDatabaseService = {
  query: jest.fn().mockResolvedValue([]),
  execute: jest.fn().mockResolvedValue({
    affectedRows: 1,
    insertId: 123,
    executionTime: 10,
    success: true,
  }),
  getConnection: jest.fn().mockResolvedValue({
    name: 'primary',
    type: 'postgresql',
    isConnected: true,
    query: jest.fn(),
    execute: jest.fn(),
    beginTransaction: jest.fn(),
    getRawConnection: jest.fn(),
    close: jest.fn(),
  }),
  executeTransaction: jest.fn().mockImplementation(async (operation) => {
    const mockTransaction = {
      transactionId: 'test-trx-123',
      isActive: true,
      query: jest.fn().mockResolvedValue([]),
      execute: jest.fn().mockResolvedValue({
        affectedRows: 1,
        executionTime: 5,
        success: true,
      }),
      commit: jest.fn(),
      rollback: jest.fn(),
      savepoint: jest.fn(),
      rollbackToSavepoint: jest.fn(),
    };
    return operation(mockTransaction);
  }),
  getRepository: jest.fn().mockResolvedValue({}),
};

// Mock租户上下文管理器
const mockTenantContextManager = {
  getCurrentContext: jest.fn(),
  setContext: jest.fn(),
  clearContext: jest.fn(),
};

describe('TenantAwareDatabaseService', () => {
  let service: TenantAwareDatabaseService;
  let isolationStrategy: DatabaseIsolationStrategy;

  beforeEach(() => {
    isolationStrategy = new DatabaseIsolationStrategy(DEFAULT_ISOLATION_CONFIG);
    service = new TenantAwareDatabaseService(
      mockBaseDatabaseService as any,
      isolationStrategy,
      mockTenantContextManager,
    );

    // 重置所有mock
    jest.clearAllMocks();
  });

  describe('基础查询功能', () => {
    it('应该能够执行租户隔离的查询', async () => {
      const tenantContext = { tenantId: 'tenant-123', createdAt: new Date() };
      mockTenantContextManager.getCurrentContext.mockResolvedValue(
        tenantContext,
      );

      const sql = 'SELECT * FROM users WHERE active = ?';
      const params = [true];

      await service.query(sql, params);

      expect(mockBaseDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('tenant_id'),
        expect.arrayContaining([...params, 'tenant-123']),
        undefined,
      );
    });

    it('应该能够执行租户隔离的命令', async () => {
      const tenantContext = { tenantId: 'tenant-456', createdAt: new Date() };
      mockTenantContextManager.getCurrentContext.mockResolvedValue(
        tenantContext,
      );

      const sql = 'INSERT INTO users (name, email) VALUES (?, ?)';
      const params = ['张三', 'zhangsan@example.com'];

      const result = await service.execute(sql, params);

      expect(result.success).toBe(true);
      expect(mockBaseDatabaseService.execute).toHaveBeenCalledWith(
        expect.stringContaining('tenant_id'),
        expect.arrayContaining([...params, 'tenant-456']),
        undefined,
      );
    });

    it('应该能够处理系统级查询（无租户上下文）', async () => {
      // 创建非严格模式的隔离策略
      const nonStrictStrategy = new DatabaseIsolationStrategy({
        ...DEFAULT_ISOLATION_CONFIG,
        strictMode: false,
      });

      const nonStrictService = new TenantAwareDatabaseService(
        mockBaseDatabaseService as any,
        nonStrictStrategy,
        mockTenantContextManager,
      );

      mockTenantContextManager.getCurrentContext.mockResolvedValue(null);

      const sql = 'SELECT * FROM migrations';
      await nonStrictService.query(sql);

      // 系统级查询不应该被修改
      expect(mockBaseDatabaseService.query).toHaveBeenCalledWith(
        sql,
        [],
        undefined,
      );
    });
  });

  describe('租户上下文验证', () => {
    it('应该验证租户权限', async () => {
      const tenantContext = { tenantId: 'tenant-123', createdAt: new Date() };
      mockTenantContextManager.getCurrentContext.mockResolvedValue(
        tenantContext,
      );

      const sql = 'SELECT * FROM users';
      await service.query(sql);

      expect(mockTenantContextManager.getCurrentContext).toHaveBeenCalled();
    });

    it('应该拒绝危险操作', async () => {
      const tenantContext = { tenantId: 'tenant-123', createdAt: new Date() };
      mockTenantContextManager.getCurrentContext.mockResolvedValue(
        tenantContext,
      );

      const sql = 'DROP TABLE users';

      await expect(service.execute(sql)).rejects.toThrow('无权执行此操作');
    });

    it('应该支持指定租户上下文的查询', async () => {
      const tenantContext = { tenantId: 'tenant-789', createdAt: new Date() };

      const sql = 'SELECT * FROM orders';
      await service.queryByTenant(sql, [], tenantContext);

      expect(mockBaseDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('tenant_id'),
        expect.arrayContaining(['tenant-789']),
      );
    });

    it('应该在缺少租户上下文时抛出错误', async () => {
      // 确保getCurrentContext返回null
      mockTenantContextManager.getCurrentContext.mockResolvedValue(null);

      const sql = 'SELECT * FROM users';

      await expect(service.queryByTenant(sql)).rejects.toThrow(
        '租户上下文缺失',
      );
    });
  });

  describe('事务处理', () => {
    it('应该能够执行租户感知的事务', async () => {
      const tenantContext = { tenantId: 'tenant-123', createdAt: new Date() };
      mockTenantContextManager.getCurrentContext.mockResolvedValue(
        tenantContext,
      );

      const result = await service.executeTransaction(async (trx) => {
        await trx.execute('INSERT INTO users (name) VALUES (?)', ['用户1']);
        await trx.execute('INSERT INTO orders (user_id) VALUES (?)', [123]);
        return { created: 2 };
      });

      expect(result.created).toBe(2);
      expect(mockBaseDatabaseService.executeTransaction).toHaveBeenCalled();
    });

    it('应该在事务中自动应用租户隔离', async () => {
      const tenantContext = { tenantId: 'tenant-456', createdAt: new Date() };
      mockTenantContextManager.getCurrentContext.mockResolvedValue(
        tenantContext,
      );

      await service.executeTransaction(async (trx) => {
        // 事务操作会被包装以自动应用租户隔离
        await trx.query('SELECT * FROM users');
        return { success: true };
      });

      expect(mockBaseDatabaseService.executeTransaction).toHaveBeenCalled();
    });
  });

  describe('不同隔离级别测试', () => {
    it('应该支持数据库级隔离', async () => {
      const dbIsolationStrategy = new DatabaseIsolationStrategy({
        ...DEFAULT_ISOLATION_CONFIG,
        strategy: DatabaseIsolationLevel.DATABASE,
      });

      const dbService = new TenantAwareDatabaseService(
        mockBaseDatabaseService as any,
        dbIsolationStrategy,
        mockTenantContextManager,
      );

      const tenantContext = { tenantId: 'tenant-123', createdAt: new Date() };
      mockTenantContextManager.getCurrentContext.mockResolvedValue(
        tenantContext,
      );

      const sql = 'SELECT * FROM users';
      await dbService.query(sql);

      // 数据库级隔离不修改SQL
      expect(mockBaseDatabaseService.query).toHaveBeenCalledWith(
        sql,
        [],
        undefined,
      );
    });

    it('应该支持模式级隔离', async () => {
      const schemaIsolationStrategy = new DatabaseIsolationStrategy({
        ...DEFAULT_ISOLATION_CONFIG,
        strategy: DatabaseIsolationLevel.SCHEMA,
      });

      const schemaService = new TenantAwareDatabaseService(
        mockBaseDatabaseService as any,
        schemaIsolationStrategy,
        mockTenantContextManager,
      );

      const tenantContext = { tenantId: 'tenant-123', createdAt: new Date() };
      mockTenantContextManager.getCurrentContext.mockResolvedValue(
        tenantContext,
      );

      const sql = 'SELECT * FROM users';
      await schemaService.query(sql);

      // 模式级隔离会修改表名
      expect(mockBaseDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('tenant_tenant-123'),
        [],
        undefined,
      );
    });
  });

  describe('仓储功能', () => {
    it('应该能够获取租户感知的仓储', async () => {
      const tenantContext = { tenantId: 'tenant-123', createdAt: new Date() };
      mockTenantContextManager.getCurrentContext.mockResolvedValue(
        tenantContext,
      );

      class User {
        id?: string;
        name?: string;
      }

      const repository = await service.getTenantRepository(User);

      expect(repository).toBeDefined();
      expect(typeof repository.findByTenant).toBe('function');
      expect(typeof repository.saveTenant).toBe('function');
      expect(typeof repository.deleteTenant).toBe('function');
      expect(typeof repository.countByTenant).toBe('function');
    });

    it('应该支持仓储的租户操作', async () => {
      const tenantContext = { tenantId: 'tenant-123', createdAt: new Date() };
      mockTenantContextManager.getCurrentContext.mockResolvedValue(
        tenantContext,
      );

      class User {
        id?: string;
        name?: string;
      }

      const repository = await service.getTenantRepository(User);

      // 测试租户感知的仓储方法
      await repository.findByTenant({ active: true });
      await repository.saveTenant({ name: '测试用户' });
      await repository.deleteTenant('user-123');
      const count = await repository.countByTenant({ status: 'active' });

      expect(count).toBe(0); // 模拟返回值
    });
  });

  describe('数据清理功能', () => {
    it('应该能够清理租户数据', async () => {
      const tenantId = 'tenant-to-delete';

      const result = await service.cleanupTenantData(tenantId);

      expect(result).toBeDefined();
      expect(result.totalRecords).toBeGreaterThan(0);
      expect(result.deletedRecords).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('应该验证租户ID不能为空', async () => {
      await expect(service.cleanupTenantData('')).rejects.toThrow(
        '租户ID不能为空',
      );
      await expect(service.cleanupTenantData('   ')).rejects.toThrow(
        '租户ID不能为空',
      );
    });

    it('应该返回详细的清理统计信息', async () => {
      const tenantId = 'tenant-with-data';

      const result = await service.cleanupTenantData(tenantId);

      expect(result).toMatchObject({
        totalRecords: expect.any(Number),
        deletedRecords: expect.any(Number),
        failedRecords: expect.any(Number),
        duration: expect.any(Number),
      });
    });
  });

  describe('连接管理', () => {
    it('应该能够获取租户感知的连接', async () => {
      const tenantContext = { tenantId: 'tenant-123', createdAt: new Date() };
      mockTenantContextManager.getCurrentContext.mockResolvedValue(
        tenantContext,
      );

      const connection = await service.getConnection();

      expect(connection).toBeDefined();
      expect(connection.type).toBe('postgresql');
      expect(mockBaseDatabaseService.getConnection).toHaveBeenCalled();
    });

    it('应该支持指定连接名称', async () => {
      const tenantContext = { tenantId: 'tenant-123', createdAt: new Date() };
      mockTenantContextManager.getCurrentContext.mockResolvedValue(
        tenantContext,
      );

      await service.getConnection('readonly');

      expect(mockBaseDatabaseService.getConnection).toHaveBeenCalledWith(
        'readonly',
      );
    });
  });

  describe('错误处理', () => {
    it('应该正确处理隔离策略错误', async () => {
      const tenantContext = { tenantId: 'tenant-123', createdAt: new Date() };
      mockTenantContextManager.getCurrentContext.mockResolvedValue(
        tenantContext,
      );

      // 模拟隔离策略抛出错误
      jest
        .spyOn(isolationStrategy, 'validateTenantAccess')
        .mockResolvedValue(false);

      const sql = 'SELECT * FROM sensitive_data';

      await expect(service.query(sql)).rejects.toThrow('无权执行此操作');
    });

    it('应该处理租户上下文管理器错误', async () => {
      mockTenantContextManager.getCurrentContext.mockRejectedValue(
        new Error('上下文错误'),
      );

      const sql = 'SELECT * FROM users';

      await expect(service.query(sql)).rejects.toThrow('上下文错误');
    });
  });
});
