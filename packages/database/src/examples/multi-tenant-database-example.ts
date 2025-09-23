/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 多租户数据库功能演示
 *
 * @description 展示Database模块的多租户数据隔离功能
 * 包含不同隔离级别、租户权限验证、数据清理等功能演示
 *
 * @example
 * ```typescript
 * // 运行演示
 * import './multi-tenant-database-example';
 * ```
 *
 * @since 1.0.0
 */

/* eslint-disable no-console */

import {
  SimpleDatabaseManager,
  TenantAwareDatabaseService,
  createTenantAwareDatabaseService,
  createDatabaseIsolationStrategy,
  DEFAULT_ISOLATION_CONFIG,
  DatabaseIsolationLevel,
} from '../index';

// ==================== 多租户功能演示 ====================

/**
 * 多租户数据隔离演示
 */
export async function multiTenantIsolationExample(): Promise<void> {
  console.log('=== 多租户数据隔离演示 ===\n');

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
          database: 'aiofix_multi_tenant',
          ssl: false,
        },
      },
      multiTenant: {
        enabled: true,
        strategy: 'row',
        tenantDatabasePrefix: 'tenant_db_',
        tenantSchemaPrefix: 'tenant_',
        enableAutoMigration: true,
        enableTenantDiscovery: true,
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

  // Mock租户上下文管理器
  let currentTenantContext: any = null;
  const mockTenantContextManager = {
    getCurrentContext: jest
      .fn()
      .mockImplementation(() => Promise.resolve(currentTenantContext)),
    setContext: jest.fn().mockImplementation((context: any) => {
      currentTenantContext = context;
      return Promise.resolve();
    }),
    clearContext: jest.fn().mockImplementation(() => {
      currentTenantContext = null;
      return Promise.resolve();
    }),
  };

  // 创建基础数据库管理器
  const baseDatabaseManager = new SimpleDatabaseManager(mockConfigManager);
  await baseDatabaseManager.initialize();

  // 创建隔离策略
  const isolationStrategy = createDatabaseIsolationStrategy(
    DEFAULT_ISOLATION_CONFIG,
  );

  // 创建租户感知数据库服务
  const tenantDatabaseService = createTenantAwareDatabaseService(
    baseDatabaseManager,
    isolationStrategy,
    mockTenantContextManager,
  );

  console.log('✅ 多租户数据库服务初始化完成\n');

  // 演示不同租户的数据操作
  await demonstrateTenantDataIsolation(
    tenantDatabaseService,
    mockTenantContextManager,
  );

  // 演示不同隔离级别
  await demonstrateIsolationLevels(baseDatabaseManager);

  // 演示租户数据清理
  await demonstrateTenantDataCleanup(tenantDatabaseService);

  // 演示权限验证
  await demonstratePermissionValidation(
    tenantDatabaseService,
    mockTenantContextManager,
  );

  await baseDatabaseManager.destroy();
  console.log('✅ 多租户演示完成\n');
}

/**
 * 演示租户数据隔离
 */
async function demonstrateTenantDataIsolation(
  tenantService: TenantAwareDatabaseService,
  contextManager: any,
): Promise<void> {
  console.log('📋 租户数据隔离演示:');

  // 租户A的操作
  console.log('\n🏢 租户A的数据操作:');
  await contextManager.setContext({
    tenantId: 'company-a',
    createdAt: new Date(),
  });

  await tenantService.execute(
    'INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
    ['张三', 'zhangsan@company-a.com', 'admin'],
  );

  await tenantService.execute(
    'INSERT INTO orders (user_id, amount, status) VALUES (?, ?, ?)',
    [1, 299.99, 'pending'],
  );

  const usersA = await tenantService.query(
    'SELECT * FROM users WHERE role = ?',
    ['admin'],
  );
  console.log('✅ 租户A查询结果:', usersA.length, '条记录');

  // 租户B的操作
  console.log('\n🏢 租户B的数据操作:');
  await contextManager.setContext({
    tenantId: 'company-b',
    createdAt: new Date(),
  });

  await tenantService.execute(
    'INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
    ['李四', 'lisi@company-b.com', 'user'],
  );

  await tenantService.execute(
    'INSERT INTO products (name, price, category) VALUES (?, ?, ?)',
    ['产品B', 199.99, 'electronics'],
  );

  const usersB = await tenantService.query(
    'SELECT * FROM users WHERE role = ?',
    ['user'],
  );
  console.log('✅ 租户B查询结果:', usersB.length, '条记录');

  // 验证数据隔离
  console.log('\n🔒 验证数据隔离:');
  await contextManager.setContext({
    tenantId: 'company-a',
    createdAt: new Date(),
  });
  const isolatedUsersA = await tenantService.query('SELECT * FROM users');
  console.log('✅ 租户A只能看到自己的数据:', isolatedUsersA.length, '条记录');

  await contextManager.setContext({
    tenantId: 'company-b',
    createdAt: new Date(),
  });
  const isolatedUsersB = await tenantService.query('SELECT * FROM users');
  console.log('✅ 租户B只能看到自己的数据:', isolatedUsersB.length, '条记录');
}

/**
 * 演示不同隔离级别
 */
async function demonstrateIsolationLevels(
  baseDatabaseManager: SimpleDatabaseManager,
): Promise<void> {
  console.log('\n📋 不同隔离级别演示:');

  const tenantContext = { tenantId: 'demo-tenant', createdAt: new Date() };

  // 行级隔离
  console.log('\n🔹 行级隔离 (ROW):');
  const rowIsolationStrategy = createDatabaseIsolationStrategy({
    strategy: DatabaseIsolationLevel.ROW,
    tenantDatabasePrefix: 'tenant_db_',
    tenantSchemaPrefix: 'tenant_',
    tenantIdColumn: 'tenant_id',
    strictMode: false,
  });

  const rowIsolatedSql = rowIsolationStrategy.isolateQuery(
    'SELECT * FROM users WHERE active = ?',
    tenantContext,
  );
  const rowIsolatedParams = rowIsolationStrategy.isolateParams(
    [true],
    tenantContext,
  );
  console.log('✅ 行级隔离SQL:', rowIsolatedSql);
  console.log('✅ 行级隔离参数:', rowIsolatedParams);

  // 模式级隔离
  console.log('\n🔹 模式级隔离 (SCHEMA):');
  const schemaIsolationStrategy = createDatabaseIsolationStrategy({
    strategy: DatabaseIsolationLevel.SCHEMA,
    tenantDatabasePrefix: 'tenant_db_',
    tenantSchemaPrefix: 'tenant_',
    tenantIdColumn: 'tenant_id',
    strictMode: false,
  });

  const schemaIsolatedSql = schemaIsolationStrategy.isolateQuery(
    'SELECT * FROM users WHERE active = ?',
    tenantContext,
  );
  console.log('✅ 模式级隔离SQL:', schemaIsolatedSql);

  // 数据库级隔离
  console.log('\n🔹 数据库级隔离 (DATABASE):');
  const dbIsolationStrategy = createDatabaseIsolationStrategy({
    strategy: DatabaseIsolationLevel.DATABASE,
    tenantDatabasePrefix: 'tenant_db_',
    tenantSchemaPrefix: 'tenant_',
    tenantIdColumn: 'tenant_id',
    strictMode: false,
  });

  const connection = await baseDatabaseManager.getConnection();
  const dbIsolatedConnection = dbIsolationStrategy.getTenantConnectionConfig(
    connection,
    tenantContext,
  );
  console.log('✅ 数据库级隔离连接:', dbIsolatedConnection.name);
}

/**
 * 演示租户数据清理
 */
async function demonstrateTenantDataCleanup(
  tenantService: TenantAwareDatabaseService,
): Promise<void> {
  console.log('\n📋 租户数据清理演示:');

  // 清理指定租户的数据
  const tenantIdToCleanup = 'tenant-to-delete';
  console.log(`🗑️ 开始清理租户: ${tenantIdToCleanup}`);

  const cleanupResult =
    await tenantService.cleanupTenantData(tenantIdToCleanup);

  console.log('✅ 清理结果统计:', {
    totalRecords: cleanupResult.totalRecords,
    deletedRecords: cleanupResult.deletedRecords,
    failedRecords: cleanupResult.failedRecords,
    duration: `${cleanupResult.duration.toFixed(2)}ms`,
    errors: cleanupResult.errors?.length || 0,
  });

  // 验证清理结果
  if (cleanupResult.deletedRecords === cleanupResult.totalRecords) {
    console.log('✅ 租户数据清理完全成功');
  } else {
    console.log('⚠️ 租户数据清理部分成功，需要检查失败记录');
  }
}

/**
 * 演示权限验证
 */
async function demonstratePermissionValidation(
  tenantService: TenantAwareDatabaseService,
  contextManager: any,
): Promise<void> {
  console.log('\n📋 权限验证演示:');

  // 设置租户上下文
  await contextManager.setContext({
    tenantId: 'security-test',
    createdAt: new Date(),
  });

  // 正常操作应该成功
  console.log('\n✅ 正常操作权限验证:');
  try {
    await tenantService.query('SELECT * FROM users WHERE active = ?', [true]);
    console.log('✅ 正常SELECT查询 - 权限验证通过');
  } catch (error) {
    console.log(
      '❌ 正常SELECT查询 - 权限验证失败:',
      error instanceof Error ? error.message : String(error),
    );
  }

  try {
    await tenantService.execute(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      ['测试用户', 'test@example.com'],
    );
    console.log('✅ 正常INSERT操作 - 权限验证通过');
  } catch (error) {
    console.log(
      '❌ 正常INSERT操作 - 权限验证失败:',
      error instanceof Error ? error.message : String(error),
    );
  }

  // 危险操作应该被拒绝
  console.log('\n🚫 危险操作权限验证:');
  const dangerousOperations = [
    'DROP TABLE users',
    'TRUNCATE TABLE orders',
    'DELETE FROM users',
    'ALTER TABLE users ADD COLUMN dangerous_field TEXT',
  ];

  for (const sql of dangerousOperations) {
    try {
      await tenantService.execute(sql);
      console.log(`❌ 危险操作被允许: ${sql}`);
    } catch (error) {
      console.log(
        `✅ 危险操作被拒绝: ${sql} - ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // 系统级查询测试
  console.log('\n🔧 系统级查询权限验证:');
  await contextManager.clearContext();

  const systemQueries = [
    'SELECT * FROM migrations',
    'SELECT * FROM system_config',
    'SELECT * FROM admin_users',
  ];

  for (const sql of systemQueries) {
    try {
      await tenantService.query(sql);
      console.log(`✅ 系统级查询被允许: ${sql}`);
    } catch (error) {
      console.log(
        `❌ 系统级查询被拒绝: ${sql} - ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

// ==================== 事务演示 ====================

/**
 * 多租户事务演示
 */
export async function multiTenantTransactionExample(): Promise<void> {
  console.log('=== 多租户事务演示 ===\n');

  // 创建服务实例（简化版本）
  const mockConfigManager = {
    getModuleConfig: jest.fn().mockResolvedValue({
      enabled: true,
      default: 'primary',
      connections: { primary: { type: 'postgresql', host: 'localhost' } },
      multiTenant: { enabled: true, strategy: 'row' },
      transaction: {
        enabled: true,
        isolationLevel: 'READ_COMMITTED',
        timeout: 30000,
      },
      monitoring: { enabled: true },
      migrations: { enabled: true },
    }),
    onChange: jest.fn(),
  } as any;

  let currentTenantContext: any = {
    tenantId: 'transaction-demo',
    createdAt: new Date(),
  };
  const mockTenantContextManager = {
    getCurrentContext: jest
      .fn()
      .mockImplementation(() => Promise.resolve(currentTenantContext)),
    setContext: jest.fn().mockImplementation((context: any) => {
      currentTenantContext = context;
      return Promise.resolve();
    }),
    clearContext: jest.fn().mockImplementation(() => {
      currentTenantContext = null;
      return Promise.resolve();
    }),
  };

  const baseDatabaseManager = new SimpleDatabaseManager(mockConfigManager);
  await baseDatabaseManager.initialize();

  const isolationStrategy = createDatabaseIsolationStrategy(
    DEFAULT_ISOLATION_CONFIG,
  );
  const tenantDatabaseService = createTenantAwareDatabaseService(
    baseDatabaseManager,
    isolationStrategy,
    mockTenantContextManager,
  );

  console.log('📋 租户感知事务演示:');

  // 设置租户上下文
  await mockTenantContextManager.setContext({
    tenantId: 'ecommerce-tenant',
    createdAt: new Date(),
  });

  // 执行复杂的多步骤事务
  try {
    const result = await tenantDatabaseService.executeTransaction(
      async (trx) => {
        console.log('🔄 开始事务步骤...');

        // 步骤1：创建用户
        console.log('  📝 步骤1：创建用户');
        const userResult = await trx.execute(
          'INSERT INTO users (name, email, status) VALUES (?, ?, ?)',
          ['电商用户', 'ecommerce@example.com', 'active'],
        );

        // 步骤2：创建订单
        console.log('  📝 步骤2：创建订单');
        const orderResult = await trx.execute(
          'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
          [userResult.insertId, 599.99, 'pending'],
        );

        // 步骤3：减少库存
        console.log('  📝 步骤3：减少库存');
        await trx.execute(
          'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
          [2, 101, 2],
        );

        // 步骤4：创建支付记录
        console.log('  📝 步骤4：创建支付记录');
        await trx.execute(
          'INSERT INTO payments (order_id, amount, method, status) VALUES (?, ?, ?, ?)',
          [orderResult.insertId, 599.99, 'credit_card', 'processing'],
        );

        // 步骤5：记录审计日志
        console.log('  📝 步骤5：记录审计日志');
        await trx.execute(
          'INSERT INTO audit_logs (action, entity_type, entity_id, details) VALUES (?, ?, ?, ?)',
          [
            'order_created',
            'order',
            orderResult.insertId,
            JSON.stringify({ userId: userResult.insertId, amount: 599.99 }),
          ],
        );

        return {
          userId: userResult.insertId,
          orderId: orderResult.insertId,
          amount: 599.99,
          steps: 5,
        };
      },
    );

    console.log('✅ 多步骤事务执行成功:', result);
  } catch (error) {
    console.log(
      '❌ 事务执行失败:',
      error instanceof Error ? error.message : String(error),
    );
  }

  // 演示事务回滚
  console.log('\n📋 事务回滚演示:');
  try {
    await tenantDatabaseService.executeTransaction(async (trx) => {
      console.log('🔄 开始会失败的事务...');

      await trx.execute('INSERT INTO users (name, email) VALUES (?, ?)', [
        '临时用户',
        'temp@example.com',
      ]);

      await trx.execute(
        'INSERT INTO orders (user_id, amount) VALUES (?, ?)',
        [999, 100.0],
      );

      // 故意触发错误
      throw new Error('模拟业务逻辑错误');
    });
  } catch (error) {
    console.log(
      '✅ 事务正确回滚:',
      error instanceof Error ? error.message : String(error),
    );
  }

  await baseDatabaseManager.destroy();
  console.log('✅ 多租户事务演示完成\n');
}

// ==================== 仓储演示 ====================

/**
 * 租户感知仓储演示
 */
export async function tenantAwareRepositoryExample(): Promise<void> {
  console.log('=== 租户感知仓储演示 ===\n');

  // 创建服务（简化版本）
  const mockConfigManager = {
    getModuleConfig: jest.fn().mockResolvedValue({
      enabled: true,
      default: 'primary',
      connections: { primary: { type: 'postgresql' } },
      multiTenant: { enabled: true, strategy: 'row' },
      transaction: { enabled: true },
      monitoring: { enabled: true },
      migrations: { enabled: true },
    }),
    onChange: jest.fn(),
  } as any;

  let currentTenantContext: any = {
    tenantId: 'repository-demo',
    createdAt: new Date(),
  };
  const mockTenantContextManager = {
    getCurrentContext: jest
      .fn()
      .mockImplementation(() => Promise.resolve(currentTenantContext)),
    setContext: jest.fn().mockImplementation((context: any) => {
      currentTenantContext = context;
      return Promise.resolve();
    }),
    clearContext: jest.fn().mockImplementation(() => {
      currentTenantContext = null;
      return Promise.resolve();
    }),
  };

  const baseDatabaseManager = new SimpleDatabaseManager(mockConfigManager);
  await baseDatabaseManager.initialize();

  const isolationStrategy = createDatabaseIsolationStrategy(
    DEFAULT_ISOLATION_CONFIG,
  );
  const tenantDatabaseService = createTenantAwareDatabaseService(
    baseDatabaseManager,
    isolationStrategy,
    mockTenantContextManager,
  );

  // 定义实体类
  class User {
    constructor(
      public id?: string,
      public name?: string,
      public email?: string,
      public tenantId?: string,
    ) {}
  }

  class Order {
    constructor(
      public id?: string,
      public userId?: string,
      public amount?: number,
      public status?: string,
      public tenantId?: string,
    ) {}
  }

  console.log('📋 租户感知仓储功能演示:');

  // 设置租户上下文
  await mockTenantContextManager.setContext({
    tenantId: 'repo-tenant-123',
    createdAt: new Date(),
  });

  // 获取租户感知仓储
  const userRepository = await tenantDatabaseService.getTenantRepository(User);
  const orderRepository =
    await tenantDatabaseService.getTenantRepository(Order);

  console.log('✅ 创建租户感知仓储成功');

  // 演示仓储操作
  console.log('\n📝 仓储CRUD操作演示:');

  // 保存实体
  const newUser = new User(undefined, '仓储用户', 'repo-user@example.com');
  await userRepository.saveTenant(newUser);
  console.log('✅ 保存用户实体');

  const newOrder = new Order(undefined, 'user-123', 299.99, 'pending');
  await orderRepository.saveTenant(newOrder);
  console.log('✅ 保存订单实体');

  // 查询实体
  const users = await userRepository.findByTenant({ status: 'active' });
  console.log('✅ 查询租户用户:', users.length, '条记录');

  const orders = await orderRepository.findByTenant({ status: 'pending' });
  console.log('✅ 查询租户订单:', orders.length, '条记录');

  // 根据ID查找
  const user = await userRepository.findById('user-123');
  console.log('✅ 根据ID查找用户:', user ? '找到' : '未找到');

  // 计数操作
  const userCount = await userRepository.countByTenant({ active: true });
  console.log('✅ 活跃用户计数:', userCount);

  const orderCount = await orderRepository.countByTenant({
    status: 'completed',
  });
  console.log('✅ 已完成订单计数:', orderCount);

  // 删除操作
  await userRepository.deleteTenant('user-to-delete');
  console.log('✅ 删除用户实体');

  // 批量操作
  const batchUsers = [
    new User(undefined, '批量用户1', 'batch1@example.com'),
    new User(undefined, '批量用户2', 'batch2@example.com'),
    new User(undefined, '批量用户3', 'batch3@example.com'),
  ];
  await userRepository.saveBatch(batchUsers);
  console.log('✅ 批量保存用户:', batchUsers.length, '个');

  await baseDatabaseManager.destroy();
  console.log('✅ 租户感知仓储演示完成\n');
}

// ==================== 演示运行函数 ====================

/**
 * 运行所有多租户演示
 */
export async function runAllMultiTenantExamples(): Promise<void> {
  console.log('🚀 开始Database模块多租户功能演示\n');

  try {
    await multiTenantIsolationExample();
    await multiTenantTransactionExample();
    await tenantAwareRepositoryExample();

    console.log('🎉 所有多租户功能演示运行完成！');
    console.log('✅ Database模块多租户功能开发成功！');
  } catch (error) {
    console.error('❌ 演示运行失败:', error);
  }
}

// 如果直接运行此文件，执行演示
if (require.main === module) {
  runAllMultiTenantExamples();
}
