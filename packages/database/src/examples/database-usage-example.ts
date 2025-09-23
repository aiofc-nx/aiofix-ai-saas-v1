/**
 * Database模块使用示例
 *
 * @description 展示如何使用重构后的Database模块
 * 包含基础使用、NestJS集成和高级功能示例
 *
 * @example
 * ```typescript
 * // 运行示例
 * import './database-usage-example';
 * ```
 *
 * @since 1.0.0
 */

/* eslint-disable no-console, @typescript-eslint/no-explicit-any */

import { performance } from 'perf_hooks';
import {
  SimpleDatabaseManager,
  SimpleDatabaseModule,
  InjectSimpleDatabaseManager,
} from '../index';
import { Module, Injectable } from '@nestjs/common';

// ==================== 基础使用示例 ====================

/**
 * 基础数据库使用示例
 */
export async function basicDatabaseExample(): Promise<void> {
  console.log('=== 基础数据库使用示例 ===\n');

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
          database: 'aiofix_dev',
          ssl: false,
          pool: {
            min: 2,
            max: 10,
            idle: 30000,
            acquire: 30000,
          },
        },
        readonly: {
          type: 'postgresql',
          host: 'localhost',
          port: 5432,
          username: 'readonly_user',
          password: 'readonly_pass',
          database: 'aiofix_dev',
          ssl: false,
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

  // 创建数据库管理器
  const databaseManager = new SimpleDatabaseManager(mockConfigManager);
  await databaseManager.initialize();

  console.log('✅ 数据库管理器初始化完成');

  // 基础查询操作
  console.log('\n📋 基础查询操作:');
  const users = await databaseManager.query(
    'SELECT * FROM users WHERE active = ?',
    [true],
  );
  console.log('✅ 查询用户:', users.length, '条记录');

  // 基础命令操作
  console.log('\n📋 基础命令操作:');
  const insertResult = await databaseManager.execute(
    'INSERT INTO users (name, email) VALUES (?, ?)',
    ['张三', 'zhangsan@example.com'],
  );
  console.log('✅ 插入用户:', {
    affected: insertResult.affectedRows,
    insertId: insertResult.insertId,
    time: insertResult.executionTime,
  });

  // 连接管理
  console.log('\n📋 连接管理:');
  const primaryConnection = await databaseManager.getConnection('primary');
  console.log('✅ 获取主连接:', {
    name: primaryConnection.name,
    type: primaryConnection.type,
    connected: primaryConnection.isConnected,
  });

  const readonlyConnection = await databaseManager.getConnection('readonly');
  console.log('✅ 获取只读连接:', {
    name: readonlyConnection.name,
    type: readonlyConnection.type,
    connected: readonlyConnection.isConnected,
  });

  // 事务操作
  console.log('\n📋 事务操作:');
  const transactionResult = await databaseManager.executeTransaction(
    async (trx) => {
      await trx.execute(
        'INSERT INTO orders (user_id, amount) VALUES (?, ?)',
        [123, 99.99],
      );
      await trx.execute(
        'UPDATE users SET order_count = order_count + 1 WHERE id = ?',
        [123],
      );
      return { orderId: 456, userId: 123 };
    },
  );
  console.log('✅ 事务执行结果:', transactionResult);

  // 统计信息
  console.log('\n📊 统计信息:');
  const stats = await databaseManager.getStats();
  console.log('✅ 数据库统计:', {
    connections: stats.connections,
    queries: {
      total: stats.queries.total,
      successful: stats.queries.successful,
      averageTime: stats.queries.averageTime.toFixed(2) + 'ms',
    },
    transactions: {
      committed: stats.transactions.committed,
      averageTime: stats.transactions.averageTime.toFixed(2) + 'ms',
    },
  });

  // 健康检查
  console.log('\n🏥 健康检查:');
  const health = await databaseManager.getHealth();
  console.log('✅ 数据库健康状态:', {
    overall: health.overall,
    connections: health.connections.map((c) => ({
      name: c.name,
      status: c.status,
      responseTime: c.responseTime + 'ms',
    })),
    recommendations: health.recommendations,
  });

  await databaseManager.destroy();
  console.log('\n✅ 数据库管理器销毁完成\n');
}

// ==================== NestJS集成示例 ====================

/**
 * 示例服务，使用数据库
 */
@Injectable()
export class ExampleDatabaseServiceImpl {
  constructor(
    @InjectSimpleDatabaseManager()
    private readonly databaseManager: SimpleDatabaseManager,
  ) {}

  /**
   * 获取用户信息
   */
  async getUserInfo(userId: string): Promise<any> {
    const users = await this.databaseManager.query(
      'SELECT * FROM users WHERE id = ?',
      [userId],
    );

    if (users.length === 0) {
      return null;
    }

    console.log(`✅ 获取用户信息: ${userId}`);
    return users[0];
  }

  /**
   * 创建用户（带事务）
   */
  async createUser(userData: any): Promise<any> {
    const result = await this.databaseManager.executeTransaction(
      async (trx) => {
        // 插入用户
        const userResult = await trx.execute(
          'INSERT INTO users (name, email, created_at) VALUES (?, ?, ?)',
          [userData.name, userData.email, new Date()],
        );

        // 创建用户配置
        await trx.execute(
          'INSERT INTO user_profiles (user_id, preferences) VALUES (?, ?)',
          [userResult.insertId, JSON.stringify(userData.preferences || {})],
        );

        return {
          userId: userResult.insertId,
          name: userData.name,
          email: userData.email,
        };
      },
    );

    console.log('✅ 创建用户成功:', result);
    return result;
  }

  /**
   * 批量查询用户
   */
  async getBatchUsers(userIds: string[]): Promise<IUser[]> {
    const placeholders = userIds.map(() => '?').join(',');
    const users = await this.databaseManager.query<IUser>(
      `SELECT * FROM users WHERE id IN (${placeholders})`,
      userIds,
    );

    console.log(
      `✅ 批量查询 ${userIds.length} 个用户，返回 ${users.length} 条记录`,
    );
    return users;
  }

  /**
   * 获取数据库统计
   */
  async getDatabaseStats(): Promise<any> {
    const stats = await this.databaseManager.getStats();
    console.log('✅ 数据库统计信息:', stats);
    return stats;
  }
}

/**
 * 示例应用模块
 */
@Module({
  imports: [
    SimpleDatabaseModule.forRoot({
      enableMonitoring: true,
      enableMultiTenant: true,
    }),
  ],
  providers: [ExampleDatabaseServiceImpl],
  exports: [ExampleDatabaseServiceImpl],
})
export class ExampleDatabaseModuleImpl {}

// 导出类型，避免运行时冲突
export type ExampleDatabaseService = typeof ExampleDatabaseServiceImpl;
export type ExampleDatabaseModule = typeof ExampleDatabaseModuleImpl;

// ==================== 高级功能示例 ====================

/**
 * 高级数据库功能示例
 */
export async function advancedDatabaseExample(): Promise<void> {
  console.log('=== 高级数据库功能示例 ===\n');

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
          password: 'pass',
          database: 'main',
        },
        analytics: {
          type: 'mysql',
          host: 'localhost',
          port: 3306,
          username: 'mysql',
          password: 'pass',
          database: 'analytics',
        },
        cache: {
          type: 'redis',
          host: 'localhost',
          port: 6379,
          username: '',
          password: '',
          database: '0',
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

  const databaseManager = new SimpleDatabaseManager(mockConfigManager);
  await databaseManager.initialize();

  // 多连接使用
  console.log('📋 多连接使用:');

  const primaryConn = await databaseManager.getConnection('primary');
  console.log('✅ 主数据库连接:', primaryConn.type);

  const analyticsConn = await databaseManager.getConnection('analytics');
  console.log('✅ 分析数据库连接:', analyticsConn.type);

  const cacheConn = await databaseManager.getConnection('cache');
  console.log('✅ 缓存数据库连接:', cacheConn.type);

  // 复杂事务示例
  console.log('\n📋 复杂事务示例:');

  try {
    const complexResult = await databaseManager.executeTransaction(
      async (trx) => {
        // 步骤1：创建订单
        const orderResult = await trx.execute(
          'INSERT INTO orders (customer_id, total_amount, status) VALUES (?, ?, ?)',
          [123, 299.99, 'pending'],
        );

        // 步骤2：减少库存
        await trx.execute(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [2, 456],
        );

        // 步骤3：记录审计日志
        await trx.execute(
          'INSERT INTO audit_logs (action, entity_type, entity_id, user_id) VALUES (?, ?, ?, ?)',
          ['order_created', 'order', orderResult.insertId, 123],
        );

        return {
          orderId: orderResult.insertId,
          message: '订单创建成功',
          steps: 3,
        };
      },
    );

    console.log('✅ 复杂事务执行成功:', complexResult);
  } catch (error) {
    console.log(
      '❌ 复杂事务执行失败:',
      error instanceof Error ? error.message : String(error),
    );
  }

  // 性能测试
  console.log('\n📊 性能测试:');

  const batchSize = 100;
  const startTime = performance.now();

  const queryPromises = Array.from({ length: batchSize }, (_, i) =>
    databaseManager.query('SELECT * FROM users WHERE id = ?', [i + 1]),
  );

  await Promise.all(queryPromises);
  const duration = performance.now() - startTime;

  console.log(`✅ 批量查询 ${batchSize} 次耗时: ${duration.toFixed(2)}ms`);
  console.log(`✅ 平均查询时间: ${(duration / batchSize).toFixed(2)}ms/次`);

  await databaseManager.destroy();
  console.log('✅ 高级功能示例完成\n');
}

// ==================== 演示函数 ====================

/**
 * 运行所有示例
 */
export async function runAllDatabaseExamples(): Promise<void> {
  console.log('🚀 开始Database模块功能演示\n');

  try {
    await basicDatabaseExample();
    await advancedDatabaseExample();

    console.log('🎉 所有Database模块示例运行完成！');
    console.log('✅ Database模块重构第一阶段成功！');
  } catch (error) {
    console.error('❌ 示例运行失败:', error);
  }
}

// 如果直接运行此文件，执行演示
if (require.main === module) {
  runAllDatabaseExamples();
}

// ==================== 类型示例 ====================

/**
 * 展示如何使用类型安全的数据库操作
 */
interface IUser {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IOrder {
  id: number;
  userId: number;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
}

/**
 * 类型安全的用户服务
 */
@Injectable()
export class TypedUserService {
  constructor(
    @InjectSimpleDatabaseManager()
    private readonly databaseManager: SimpleDatabaseManager,
  ) {}

  async findUserById(id: number): Promise<IUser | null> {
    const users = await this.databaseManager.query<IUser>(
      'SELECT * FROM users WHERE id = ?',
      [id],
    );

    return users.length > 0 ? users[0] : null;
  }

  async createUser(
    userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<IUser> {
    const result = await this.databaseManager.execute(
      'INSERT INTO users (name, email, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [userData.name, userData.email, new Date(), new Date()],
    );

    return {
      id: result.insertId as number,
      name: userData.name,
      email: userData.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as IUser;
  }

  async createUserWithOrder(
    userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>,
    orderData: Omit<IOrder, 'id' | 'userId' | 'createdAt'>,
  ): Promise<{ user: IUser; order: IOrder }> {
    return this.databaseManager.executeTransaction(async (trx) => {
      // 创建用户
      const userResult = await trx.execute(
        'INSERT INTO users (name, email, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [userData.name, userData.email, new Date(), new Date()],
      );

      const user: IUser = {
        id: userResult.insertId as number,
        name: userData.name,
        email: userData.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 创建订单
      const orderResult = await trx.execute(
        'INSERT INTO orders (user_id, amount, status, created_at) VALUES (?, ?, ?, ?)',
        [user.id, orderData.amount, orderData.status, new Date()],
      );

      const order: IOrder = {
        id: orderResult.insertId as number,
        userId: user.id,
        amount: orderData.amount,
        status: orderData.status,
        createdAt: new Date(),
      };

      return { user, order };
    });
  }
}
