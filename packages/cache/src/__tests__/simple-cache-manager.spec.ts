/**
 * 简化缓存管理器测试
 *
 * @description 测试简化版本的缓存管理器功能
 *
 * @since 1.0.0
 */

import { SimpleCacheManager } from '../core/simple-cache-manager';

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
      keyPrefix: 'test:',
      ttl: 3600,
    },
    strategies: {},
  }),
  onChange: jest.fn(),
} as any;

describe('SimpleCacheManager', () => {
  let cacheManager: SimpleCacheManager;

  beforeEach(async () => {
    cacheManager = new SimpleCacheManager(mockConfigManager);
    await cacheManager.initialize();
  });

  afterEach(async () => {
    await cacheManager.destroy();
  });

  describe('基础功能', () => {
    it('应该能够设置和获取缓存值', async () => {
      const key = 'test:key';
      const value = { message: 'Hello World' };

      // 设置缓存
      const setResult = await cacheManager.set(key, value);
      expect(setResult).toBe(true);

      // 获取缓存
      const getResult = await cacheManager.get(key);
      expect(getResult).toEqual(value);
    });

    it('应该能够检查缓存是否存在', async () => {
      const key = 'test:exists';
      const value = 'test value';

      // 缓存不存在
      expect(await cacheManager.exists(key)).toBe(false);

      // 设置缓存
      await cacheManager.set(key, value);

      // 缓存存在
      expect(await cacheManager.exists(key)).toBe(true);
    });

    it('应该能够删除缓存', async () => {
      const key = 'test:delete';
      const value = 'test value';

      // 设置缓存
      await cacheManager.set(key, value);
      expect(await cacheManager.exists(key)).toBe(true);

      // 删除缓存
      const deleteResult = await cacheManager.delete(key);
      expect(deleteResult).toBe(true);
      expect(await cacheManager.exists(key)).toBe(false);
    });

    it('应该能够清空所有缓存', async () => {
      // 设置多个缓存项
      await cacheManager.set('key1', 'value1');
      await cacheManager.set('key2', 'value2');
      await cacheManager.set('key3', 'value3');

      // 清空缓存
      const clearResult = await cacheManager.clear();
      expect(clearResult).toBe(3);

      // 验证缓存已清空
      expect(await cacheManager.exists('key1')).toBe(false);
      expect(await cacheManager.exists('key2')).toBe(false);
      expect(await cacheManager.exists('key3')).toBe(false);
    });
  });

  describe('TTL功能', () => {
    it('应该支持TTL过期', async () => {
      const key = 'test:ttl';
      const value = 'test value';
      const ttl = 100; // 100毫秒

      // 设置带TTL的缓存
      await cacheManager.set(key, value, { ttl });
      expect(await cacheManager.exists(key)).toBe(true);

      // 等待过期
      await new Promise((resolve) => setTimeout(resolve, 150));

      // 验证已过期
      expect(await cacheManager.exists(key)).toBe(false);
      expect(await cacheManager.get(key)).toBe(null);
    });
  });

  describe('统计功能', () => {
    it('应该能够获取缓存统计信息', async () => {
      // 设置一些缓存
      await cacheManager.set('stat1', 'value1');
      await cacheManager.set('stat2', 'value2');

      const stats = await cacheManager.getStats();

      expect(stats).toBeDefined();
      expect(stats.currentSize).toBe(2);
      expect(stats.lastUpdated).toBeInstanceOf(Date);
    });

    it('应该能够获取健康状态', async () => {
      const health = await cacheManager.getHealth();

      expect(health).toBeDefined();
      expect(health.overall).toBe('healthy');
      expect(health.layers).toHaveLength(1);
      expect(health.layers[0].name).toBe('memory');
    });
  });

  describe('错误处理', () => {
    it('应该在未初始化时自动初始化', async () => {
      const newManager = new SimpleCacheManager(mockConfigManager);

      // 直接调用方法应该自动初始化
      const result = await newManager.set('test', 'value');
      expect(result).toBe(true);

      await newManager.destroy();
    });
  });
});
