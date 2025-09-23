/**
 * 简化数据库管理器测试
 *
 * @description 测试简化版本的数据库管理器功能
 *
 * @since 1.0.0
 */

import { SimpleDatabaseManager } from '../core/simple-database-manager';

// Mock配置管理器
const mockConfigManager = {
  getModuleConfig: jest.fn().mockResolvedValue({
    enabled: true,
    default: 'primary',
    connections: {
      primary: {
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'password',
        database: 'test_db',
        ssl: false,
        pool: {
          min: 2,
          max: 10,
          idle: 30000,
          acquire: 30000,
        },
      },
      secondary: {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'mysql',
        password: 'password',
        database: 'test_db',
      },
    },
    multiTenant: {
      enabled: true,
      strategy: 'schema',
      tenantDatabasePrefix: 'tenant_',
      tenantSchemaPrefix: 'tenant_',
    },
    transaction: {
      enabled: true,
      isolationLevel: 'READ_COMMITTED',
      timeout: 30000,
      enableDistributed: false,
    },
    monitoring: {
      enabled: true,
      interval: 60000,
      enableSlowQueryLog: true,
      slowQueryThreshold: 1000,
      enableConnectionPoolMonitoring: true,
    },
    migrations: {
      enabled: true,
      directory: './migrations',
      tableName: 'migrations',
      autoRun: false,
    },
  }),
  onChange: jest.fn(),
} as any;

describe('SimpleDatabaseManager', () => {
  let databaseManager: SimpleDatabaseManager;

  beforeEach(async () => {
    databaseManager = new SimpleDatabaseManager(mockConfigManager);
    await databaseManager.initialize();
  });

  afterEach(async () => {
    await databaseManager.destroy();
  });

  describe('基础功能', () => {
    it('应该能够执行查询', async () => {
      const sql = 'SELECT * FROM users WHERE id = ?';
      const params = ['123'];

      const result = await databaseManager.query(sql, params);
      expect(Array.isArray(result)).toBe(true);
    });

    it('应该能够执行命令', async () => {
      const sql = 'INSERT INTO users (name, email) VALUES (?, ?)';
      const params = ['张三', 'zhangsan@example.com'];

      const result = await databaseManager.execute(sql, params);
      expect(result.success).toBe(true);
      expect(result.affectedRows).toBe(1);
      expect(typeof result.executionTime).toBe('number');
    });

    it('应该能够获取数据库连接', async () => {
      const connection = await databaseManager.getConnection();
      expect(connection).toBeDefined();
      expect(connection.name).toBe('primary');
      expect(connection.type).toBe('postgresql');
      expect(connection.isConnected).toBe(true);
    });

    it('应该能够获取指定的数据库连接', async () => {
      const connection = await databaseManager.getConnection('secondary');
      expect(connection).toBeDefined();
      expect(connection.name).toBe('secondary');
      expect(connection.type).toBe('mysql');
    });
  });

  describe('事务功能', () => {
    it('应该能够执行事务', async () => {
      const result = await databaseManager.executeTransaction(async (trx) => {
        await trx.execute('INSERT INTO users (name) VALUES (?)', ['用户1']);
        await trx.execute('INSERT INTO orders (user_id) VALUES (?)', ['123']);
        return { created: 2 };
      });

      expect(result.created).toBe(2);
    });

    it('应该能够处理事务回滚', async () => {
      await expect(
        databaseManager.executeTransaction(async (trx) => {
          await trx.execute('INSERT INTO users (name) VALUES (?)', ['用户1']);
          throw new Error('模拟错误');
        }),
      ).rejects.toThrow('事务执行失败');
    });
  });

  describe('统计功能', () => {
    it('应该能够获取数据库统计信息', async () => {
      // 执行一些操作
      await databaseManager.query('SELECT 1');
      await databaseManager.execute('INSERT INTO test VALUES (1)');

      const stats = await databaseManager.getStats();

      expect(stats).toBeDefined();
      expect(stats.queries.total).toBe(1);
      expect(stats.connections.total).toBe(2);
      expect(stats.lastUpdated).toBeInstanceOf(Date);
    });

    it('应该能够获取健康状态', async () => {
      const health = await databaseManager.getHealth();

      expect(health).toBeDefined();
      expect(health.overall).toBe('healthy');
      expect(health.connections).toHaveLength(2);
      expect(health.connections[0].name).toBe('primary');
      expect(health.connections[1].name).toBe('secondary');
    });
  });

  describe('错误处理', () => {
    it('应该在未初始化时自动初始化', async () => {
      const newManager = new SimpleDatabaseManager(mockConfigManager);

      // 直接调用方法应该自动初始化
      const result = await newManager.query('SELECT 1');
      expect(Array.isArray(result)).toBe(true);

      await newManager.destroy();
    });

    it('应该正确处理连接错误', async () => {
      await expect(
        databaseManager.getConnection('nonexistent'),
      ).rejects.toThrow('连接不存在: nonexistent');
    });
  });
});
