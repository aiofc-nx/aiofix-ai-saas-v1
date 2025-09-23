/**
 * Cache模块使用示例
 *
 * @description 展示如何使用重构后的Cache模块
 * 包含基础使用、NestJS集成和高级功能示例
 *
 * @example
 * ```typescript
 * // 运行示例
 * import './cache-usage-example';
 * ```
 *
 * @since 1.0.0
 */

/* eslint-disable no-console */

import {
  SimpleCacheManager,
  SimpleCacheModule,
  InjectSimpleCacheManager,
  CacheIsolationStrategy,
  CacheIsolationLevel,
} from '../index';
import { Module, Injectable } from '@nestjs/common';

// ==================== 基础使用示例 ====================

/**
 * 基础缓存使用示例
 */
export async function basicCacheExample(): Promise<void> {
  console.log('=== 基础缓存使用示例 ===\n');

  // Mock配置管理器
  const mockConfigManager = {
    getModuleConfig: jest.fn().mockResolvedValue({
      enabled: true,
      defaultStrategy: 'memory',
      memory: {
        maxSize: 100,
        ttl: 300000,
        checkPeriod: 60000,
      },
      redis: {
        host: 'localhost',
        port: 6379,
        db: 0,
        keyPrefix: 'example:',
        ttl: 3600,
      },
      strategies: {},
    }),
    onChange: jest.fn(),
  } as any;

  // 创建缓存管理器
  const cacheManager = new SimpleCacheManager(mockConfigManager);
  await cacheManager.initialize();

  console.log('✅ 缓存管理器初始化完成');

  // 基础操作
  await cacheManager.set('user:123', {
    name: '张三',
    email: 'zhangsan@example.com',
  });
  console.log('✅ 设置用户缓存');

  const user = await cacheManager.get('user:123');
  console.log('✅ 获取用户缓存:', user);

  const exists = await cacheManager.exists('user:123');
  console.log('✅ 检查缓存存在:', exists);

  // TTL示例
  await cacheManager.set('temp:data', 'temporary', { ttl: 1000 });
  console.log('✅ 设置临时缓存（1秒TTL）');

  setTimeout(async () => {
    const tempData = await cacheManager.get('temp:data');
    console.log('✅ 1秒后获取临时缓存:', tempData); // 应该为null
  }, 1100);

  // 统计信息
  const stats = await cacheManager.getStats();
  console.log('✅ 缓存统计信息:', {
    currentSize: stats.currentSize,
    hitRate: stats.hitRate,
  });

  // 健康检查
  const health = await cacheManager.getHealth();
  console.log('✅ 缓存健康状态:', health.overall);

  await cacheManager.destroy();
  console.log('✅ 缓存管理器销毁完成\n');
}

// ==================== NestJS集成示例 ====================

/**
 * 示例服务，使用缓存
 */
@Injectable()
export class ExampleCacheServiceImpl {
  constructor(
    @InjectSimpleCacheManager()
    private readonly cacheManager: SimpleCacheManager,
  ) {}

  /**
   * 获取用户信息（带缓存）
   */
  async getUserInfo(userId: string): Promise<any> {
    const cacheKey = `user:info:${userId}`;

    // 尝试从缓存获取
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log(`✅ 从缓存获取用户信息: ${userId}`);
      return cached;
    }

    // 模拟从数据库获取
    const userInfo = {
      id: userId,
      name: `用户${userId}`,
      email: `user${userId}@example.com`,
      createdAt: new Date(),
    };

    // 缓存结果
    await this.cacheManager.set(cacheKey, userInfo, { ttl: 300000 }); // 5分钟
    console.log(`✅ 缓存用户信息: ${userId}`);

    return userInfo;
  }

  /**
   * 更新用户信息（清除缓存）
   */
  async updateUserInfo(userId: string, updates: any): Promise<void> {
    // 模拟更新数据库
    console.log(`✅ 更新用户信息: ${userId}`, updates);

    // 清除相关缓存
    const cacheKey = `user:info:${userId}`;
    await this.cacheManager.delete(cacheKey);
    console.log(`✅ 清除用户缓存: ${userId}`);
  }

  /**
   * 批量获取用户信息
   */
  async getBatchUserInfo(userIds: string[]): Promise<Map<string, any>> {
    const results = new Map();

    for (const userId of userIds) {
      const userInfo = await this.getUserInfo(userId);
      results.set(userId, userInfo);
    }

    return results;
  }
}

/**
 * 示例应用模块
 */
@Module({
  imports: [
    SimpleCacheModule.forRoot({
      enableMonitoring: true,
    }),
  ],
  providers: [ExampleCacheServiceImpl],
  exports: [ExampleCacheServiceImpl],
})
export class ExampleCacheModuleImpl {}

// 导出类型，避免运行时冲突
export type ExampleCacheService = typeof ExampleCacheServiceImpl;
export type ExampleCacheModule = typeof ExampleCacheModuleImpl;

// ==================== 多租户示例 ====================

/**
 * 多租户缓存示例
 */
export async function tenantCacheExample(): Promise<void> {
  console.log('=== 多租户缓存示例 ===\n');

  // 创建隔离策略
  const isolationStrategy = new CacheIsolationStrategy(
    CacheIsolationLevel.TENANT,
  );

  // 模拟租户上下文
  const tenantA = {
    tenantId: 'tenant-a',
    organizationId: 'org-1',
    userId: 'user-1',
    createdAt: new Date(),
  };
  const tenantB = {
    tenantId: 'tenant-b',
    organizationId: 'org-2',
    userId: 'user-2',
    createdAt: new Date(),
  };

  // 生成隔离的缓存键
  const keyA = isolationStrategy.isolateKey('user:profile', tenantA);
  const keyB = isolationStrategy.isolateKey('user:profile', tenantB);

  console.log('✅ 租户A缓存键:', keyA);
  console.log('✅ 租户B缓存键:', keyB);

  // 验证键的不同
  expect(keyA).not.toBe(keyB);
  console.log('✅ 租户缓存键隔离验证通过');

  // 验证访问权限
  const hasAccessA = await isolationStrategy.validateAccess(keyA, tenantA);
  const hasAccessB = await isolationStrategy.validateAccess(keyA, tenantB); // 跨租户访问

  console.log('✅ 租户A访问自己的缓存:', hasAccessA); // 应该为true
  console.log('✅ 租户B访问租户A的缓存:', hasAccessB); // 应该为false

  expect(hasAccessA).toBe(true);
  expect(hasAccessB).toBe(false);
  console.log('✅ 租户访问权限验证通过\n');
}

// ==================== 性能测试示例 ====================

/**
 * 性能测试示例
 */
export async function performanceExample(): Promise<void> {
  console.log('=== 缓存性能测试示例 ===\n');

  const mockConfigManager = {
    getModuleConfig: jest.fn().mockResolvedValue({
      enabled: true,
      defaultStrategy: 'memory',
      memory: { maxSize: 1000, ttl: 300000, checkPeriod: 60000 },
      redis: {
        host: 'localhost',
        port: 6379,
        db: 0,
        keyPrefix: 'perf:',
        ttl: 3600,
      },
      strategies: {},
    }),
    onChange: jest.fn(),
  } as any;

  const cacheManager = new SimpleCacheManager(mockConfigManager);
  await cacheManager.initialize();

  // 批量设置测试
  const batchSize = 1000;
  const startTime = performance.now();

  const setPromises = Array.from({ length: batchSize }, (_, i) =>
    cacheManager.set(`perf:key:${i}`, `value:${i}`),
  );

  await Promise.all(setPromises);
  const setDuration = performance.now() - startTime;

  console.log(
    `✅ 批量设置 ${batchSize} 个缓存项耗时: ${setDuration.toFixed(2)}ms`,
  );
  console.log(`✅ 平均设置时间: ${(setDuration / batchSize).toFixed(2)}ms/项`);

  // 批量获取测试
  const getStartTime = performance.now();

  const getPromises = Array.from({ length: batchSize }, (_, i) =>
    cacheManager.get(`perf:key:${i}`),
  );

  const results = await Promise.all(getPromises);
  const getDuration = performance.now() - getStartTime;

  console.log(
    `✅ 批量获取 ${batchSize} 个缓存项耗时: ${getDuration.toFixed(2)}ms`,
  );
  console.log(`✅ 平均获取时间: ${(getDuration / batchSize).toFixed(2)}ms/项`);
  console.log(
    `✅ 命中率: ${((results.filter((r) => r !== null).length / batchSize) * 100).toFixed(1)}%`,
  );

  await cacheManager.destroy();
  console.log('✅ 性能测试完成\n');
}

// ==================== 演示函数 ====================

/**
 * 运行所有示例
 */
export async function runAllExamples(): Promise<void> {
  console.log('🚀 开始Cache模块功能演示\n');

  try {
    await basicCacheExample();
    await tenantCacheExample();
    await performanceExample();

    console.log('🎉 所有Cache模块示例运行完成！');
    console.log('✅ Cache模块重构第一阶段成功！');
  } catch (error) {
    console.error('❌ 示例运行失败:', error);
  }
}

// 如果直接运行此文件，执行演示
if (require.main === module) {
  runAllExamples();
}
