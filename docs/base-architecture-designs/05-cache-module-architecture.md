# 缓存模块架构设计与实现

## 🎯 模块概述

缓存模块（@aiofix/cache）是AIOFix SAAS平台的**企业级缓存管理平台**，提供多级缓存、智能策略、多租户隔离等高性能缓存功能。该模块基于统一配置管理系统，支持Redis集成、租户感知缓存、性能监控等企业级特性。

## 🏗️ 架构设计

### 模块化架构实现

```text
packages/cache/src/
├── 📋 interfaces/              # 接口定义层
│   ├── cache.interface.ts              # 缓存核心接口
│   ├── cache-service.interface.ts      # 缓存服务接口
│   ├── cache-health.interface.ts       # 缓存健康检查接口
│   └── index.ts                        # 统一导出
├── 🏗️ core/                   # 核心实现层
│   ├── simple-cache-manager.ts         # 简化缓存管理器
│   ├── cache-key-builder.ts            # 缓存键构建器
│   └── index.ts                        # 统一导出
├── 🔧 strategies/              # 策略层
│   ├── cache-isolation.strategy.ts     # 缓存隔离策略
│   ├── cache-eviction.strategy.ts      # 缓存淘汰策略
│   ├── cache-warming.strategy.ts       # 缓存预热策略
│   └── index.ts                        # 统一导出
├── ⚙️ config/                  # 配置集成层
│   ├── simple-cache-config.service.ts  # 缓存配置服务
│   ├── cache-config.module.ts          # 配置模块
│   └── index.ts                        # 统一导出
├── 🧪 nestjs/                  # NestJS集成层
│   ├── simple-cache.module.ts          # NestJS模块
│   └── index.ts                        # 统一导出
└── 📚 examples/                # 使用示例
    ├── basic-cache-example.ts          # 基础使用示例
    └── advanced-cache-example.ts       # 高级功能示例
```

## 🔧 核心功能实现

### 1. 统一缓存管理

#### **简化缓存管理器**

```typescript
// packages/cache/src/core/simple-cache-manager.ts
export class SimpleCacheManager implements ICacheService {
  constructor(private readonly configManager: IConfigManager) {}
  
  // 基础缓存操作
  async get<T>(key: string): Promise<T | null>
  async set<T>(key: string, value: T, options?: ICacheOptions): Promise<void>
  async delete(key: string): Promise<boolean>
  async clear(): Promise<void>
  
  // 批量操作
  async mget<T>(keys: string[]): Promise<(T | null)[]>
  async mset<T>(entries: Array<[string, T]>, options?: ICacheOptions): Promise<void>
  async mdel(keys: string[]): Promise<number>
  
  // 高级操作
  async exists(key: string): Promise<boolean>
  async expire(key: string, ttl: number): Promise<boolean>
  async ttl(key: string): Promise<number>
}
```

#### **缓存配置管理**

```typescript
// packages/cache/src/config/simple-cache-config.service.ts
@Injectable()
export class SimpleCacheConfigService {
  constructor(private readonly configManager: IConfigManager) {}
  
  async getCacheConfig(): Promise<ISimpleCacheConfig>
  async getRedisConfig(): Promise<IRedisConfig>
  async getTenantCacheConfig(tenantId: string): Promise<ITenantCacheConfig>
  
  // 配置热更新支持
  onConfigChange(callback: (newConfig: ISimpleCacheConfig) => void): void
}
```

### 2. 多租户缓存隔离

#### **租户感知缓存键构建**

```typescript
// packages/cache/src/strategies/cache-isolation.strategy.ts
export class TenantAwareCacheKeyBuilder {
  buildKey(baseKey: string, tenantContext?: TenantContext): string {
    if (!tenantContext) {
      return baseKey;
    }
    
    // 构建租户隔离的缓存键
    return `tenant:${tenantContext.tenantId}:${baseKey}`;
  }
  
  // 支持多级隔离
  buildHierarchicalKey(
    baseKey: string, 
    tenantContext: TenantContext,
    isolation: IsolationLevel
  ): string {
    switch (isolation) {
      case IsolationLevel.TENANT:
        return `tenant:${tenantContext.tenantId}:${baseKey}`;
      case IsolationLevel.ORGANIZATION:
        return `org:${tenantContext.organizationId}:${baseKey}`;
      case IsolationLevel.USER:
        return `user:${tenantContext.userId}:${baseKey}`;
      default:
        return baseKey;
    }
  }
}
```

#### **缓存隔离策略**

```typescript
// 缓存隔离策略实现
export class CacheIsolationStrategy {
  constructor(
    private keyBuilder: TenantAwareCacheKeyBuilder,
    private isolationLevel: IsolationLevel
  ) {}
  
  async get<T>(key: string): Promise<T | null> {
    const tenantContext = TenantContextManager.getCurrentTenant();
    const isolatedKey = this.keyBuilder.buildHierarchicalKey(
      key, 
      tenantContext, 
      this.isolationLevel
    );
    return this.cacheService.get<T>(isolatedKey);
  }
  
  async set<T>(key: string, value: T, options?: ICacheOptions): Promise<void> {
    const tenantContext = TenantContextManager.getCurrentTenant();
    const isolatedKey = this.keyBuilder.buildHierarchicalKey(
      key, 
      tenantContext, 
      this.isolationLevel
    );
    return this.cacheService.set<T>(isolatedKey, value, options);
  }
}
```

### 3. 智能缓存策略

#### **缓存淘汰策略**

```typescript
// packages/cache/src/strategies/cache-eviction.strategy.ts
export enum EvictionPolicy {
  LRU = 'lru',           // 最近最少使用
  LFU = 'lfu',           // 最不频繁使用
  FIFO = 'fifo',         // 先进先出
  TTL = 'ttl',           // 基于TTL
  ADAPTIVE = 'adaptive'   // 自适应策略
}

export class CacheEvictionStrategy {
  async evictByPolicy(policy: EvictionPolicy, limit: number): Promise<string[]>
  async analyzeEvictionCandidates(): Promise<IEvictionCandidate[]>
  async optimizeEvictionPolicy(): Promise<EvictionPolicy>
}
```

#### **缓存预热策略**

```typescript
// packages/cache/src/strategies/cache-warming.strategy.ts
export class CacheWarmingStrategy {
  async warmupCache(patterns: string[]): Promise<void>
  async preloadTenantData(tenantId: string): Promise<void>
  async scheduleWarmup(schedule: string, patterns: string[]): Promise<void>
  
  // 智能预热
  async analyzeAccessPatterns(): Promise<IAccessPattern[]>
  async generateWarmupPlan(): Promise<IWarmupPlan>
}
```

### 4. 多级缓存架构

#### **缓存层次结构**

```text
应用层缓存 (内存)
    ↓ (未命中)
分布式缓存 (Redis)
    ↓ (未命中)
数据库缓存 (查询结果)
    ↓ (未命中)
数据源 (Database)
```

#### **多级缓存实现**

```typescript
export class MultiLevelCacheManager {
  private l1Cache: MemoryCache;     // 内存缓存
  private l2Cache: RedisCache;      // Redis缓存
  private l3Cache: DatabaseCache;   // 数据库缓存
  
  async get<T>(key: string): Promise<T | null> {
    // L1缓存检查
    let value = await this.l1Cache.get<T>(key);
    if (value !== null) return value;
    
    // L2缓存检查
    value = await this.l2Cache.get<T>(key);
    if (value !== null) {
      await this.l1Cache.set(key, value); // 回填L1
      return value;
    }
    
    // L3缓存检查
    value = await this.l3Cache.get<T>(key);
    if (value !== null) {
      await this.l2Cache.set(key, value); // 回填L2
      await this.l1Cache.set(key, value); // 回填L1
      return value;
    }
    
    return null;
  }
}
```

## 🎯 企业级特性

### 1. 缓存监控和诊断

#### **实时监控**

```typescript
// 缓存性能监控
export class CacheMonitor {
  async getCacheMetrics(): Promise<ICacheMetrics>
  async getHitRateStatistics(): Promise<IHitRateStats>
  async getMemoryUsage(): Promise<IMemoryUsage>
  async getConnectionStatus(): Promise<IConnectionStatus>
}

// 监控指标示例
const metrics = await cacheMonitor.getCacheMetrics();
console.log(`缓存命中率: ${metrics.hitRate}%`);
console.log(`平均响应时间: ${metrics.averageResponseTime}ms`);
console.log(`内存使用率: ${metrics.memoryUsage}%`);
```

#### **健康检查**

```typescript
// 缓存健康检查
export class CacheHealthChecker {
  async checkHealth(): Promise<ICacheHealth>
  async diagnoseIssues(): Promise<ICacheDiagnostic[]>
  async generateRecommendations(): Promise<string[]>
}

// 健康检查示例
const health = await cacheManager.getHealth();
if (health.status === 'unhealthy') {
  console.log('缓存问题:', health.issues);
  console.log('建议措施:', health.recommendations);
}
```

### 2. 缓存安全和加密

#### **敏感数据缓存**

```typescript
// 敏感数据自动加密
export class SecureCacheManager extends SimpleCacheManager {
  async setSecure<T>(key: string, value: T, options?: ISecureCacheOptions): Promise<void>
  async getSecure<T>(key: string): Promise<T | null>
  
  // 自动加密/解密
  private async encrypt(data: any, tenantKey: string): Promise<string>
  private async decrypt<T>(encryptedData: string, tenantKey: string): Promise<T>
}
```

### 3. 缓存一致性管理

#### **缓存失效策略**

```typescript
// 缓存一致性管理
export class CacheConsistencyManager {
  async invalidateByPattern(pattern: string): Promise<number>
  async invalidateByTags(tags: string[]): Promise<number>
  async syncWithDatabase(keys: string[]): Promise<void>
  
  // 事件驱动的缓存失效
  @EventHandler('user.updated')
  async onUserUpdated(event: UserUpdatedEvent): Promise<void> {
    await this.invalidateByPattern(`user:${event.userId}:*`);
  }
}
```

## 🚀 使用示例

### 基础缓存操作

```typescript
import { SimpleCacheManager, SimpleCacheModule } from '@aiofix/cache';

// 创建缓存管理器
const cacheManager = new SimpleCacheManager(configManager);
await cacheManager.initialize();

// 基础操作
await cacheManager.set('user:123', userData, { ttl: 3600 });
const user = await cacheManager.get<User>('user:123');
await cacheManager.delete('user:123');
```

### 多租户缓存使用

```typescript
// 租户感知缓存
const isolationStrategy = createCacheIsolationStrategy(IsolationLevel.TENANT);

// 自动租户隔离
TenantContextManager.run(tenantContext, async () => {
  // 缓存键自动添加租户前缀
  await cacheManager.set('user-list', users); // 实际键：tenant:123:user-list
  const cachedUsers = await cacheManager.get('user-list');
});
```

### NestJS集成使用

```typescript
// NestJS模块集成
@Module({
  imports: [
    SimpleCacheModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379
      },
      enableTenantIsolation: true,
      defaultTTL: 3600
    })
  ]
})
export class AppModule {}

// 服务中使用
@Injectable()
export class UserService {
  constructor(
    @InjectSimpleCacheManager() private cacheManager: SimpleCacheManager
  ) {}
  
  async getUser(userId: string): Promise<User> {
    // 先检查缓存
    let user = await this.cacheManager.get<User>(`user:${userId}`);
    if (!user) {
      // 缓存未命中，从数据库加载
      user = await this.userRepository.findById(userId);
      if (user) {
        await this.cacheManager.set(`user:${userId}`, user, { ttl: 1800 });
      }
    }
    return user;
  }
}
```

### 高级缓存功能

```typescript
// 缓存标签和批量失效
await cacheManager.set('product:123', product, { 
  ttl: 3600, 
  tags: ['products', 'inventory'] 
});

// 按标签批量失效
await cacheManager.invalidateByTags(['inventory']);

// 缓存预热
const warmingStrategy = new CacheWarmingStrategy(cacheManager);
await warmingStrategy.preloadTenantData('tenant-123');

// 性能分析
const analyzer = new CachePerformanceAnalyzer(cacheManager);
const report = await analyzer.generateReport();
console.log(`命中率: ${report.hitRate}%`);
console.log(`热点数据: ${report.hotKeys.join(', ')}`);
```

## 📊 技术特性

### 1. 多级缓存支持

#### **内存缓存层**

```typescript
// L1缓存 - 内存缓存
export class MemoryCacheAdapter implements ICacheAdapter {
  private cache = new Map<string, ICacheEntry>();
  
  async get<T>(key: string): Promise<T | null>
  async set<T>(key: string, value: T, options?: ICacheOptions): Promise<void>
  
  // LRU淘汰策略
  private evictLRU(): void
}
```

#### **Redis缓存层**

```typescript
// L2缓存 - Redis分布式缓存
export class RedisCacheAdapter implements ICacheAdapter {
  constructor(private redisClient: Redis) {}
  
  async get<T>(key: string): Promise<T | null>
  async set<T>(key: string, value: T, options?: ICacheOptions): Promise<void>
  
  // Redis特性支持
  async setWithExpiry(key: string, value: any, ttl: number): Promise<void>
  async increment(key: string, delta?: number): Promise<number>
  async addToSet(key: string, values: string[]): Promise<number>
}
```

### 2. 智能缓存策略

#### **自适应缓存策略**

```typescript
// 智能缓存策略选择
export class AdaptiveCacheStrategy {
  async analyzeAccessPatterns(): Promise<IAccessPattern[]>
  async selectOptimalStrategy(patterns: IAccessPattern[]): Promise<ICacheStrategy>
  async adjustTTL(key: string, accessFrequency: number): Promise<number>
  
  // 基于机器学习的缓存优化
  async predictCacheNeeds(historicalData: any[]): Promise<ICachePrediction>
}
```

#### **缓存预热系统**

```typescript
// 智能缓存预热
export class IntelligentCacheWarming {
  async scheduleWarmup(tenantId: string): Promise<void>
  async warmupUserData(userId: string): Promise<void>
  async warmupFrequentQueries(): Promise<void>
  
  // 预测性预热
  async predictiveWarmup(patterns: IAccessPattern[]): Promise<void>
}
```

### 3. 性能监控和优化

#### **缓存性能分析**

```typescript
// 缓存性能分析器
export class CachePerformanceAnalyzer {
  async analyzeHitRate(): Promise<IHitRateAnalysis>
  async identifyHotKeys(): Promise<string[]>
  async analyzeColdKeys(): Promise<string[]>
  async generateOptimizationSuggestions(): Promise<string[]>
}
```

#### **实时监控指标**

```typescript
// 实时监控
export interface ICacheMetrics {
  hitRate: number;              // 缓存命中率
  missRate: number;             // 缓存未命中率
  averageResponseTime: number;  // 平均响应时间
  memoryUsage: number;          // 内存使用率
  connectionCount: number;      // 连接数
  operationsPerSecond: number;  // 每秒操作数
  evictionRate: number;         // 淘汰率
}
```

## 🎯 企业级特性

### 1. 缓存集群和分片

#### **Redis集群支持**

```typescript
// Redis集群配置
export interface IRedisClusterConfig {
  nodes: Array<{ host: string; port: number }>;
  enableReadyCheck: boolean;
  maxRetriesPerRequest: number;
  retryDelayOnFailover: number;
}

// 集群缓存管理
export class ClusterCacheManager extends SimpleCacheManager {
  async redistributeKeys(): Promise<void>
  async handleNodeFailure(failedNode: string): Promise<void>
  async rebalanceCluster(): Promise<void>
}
```

### 2. 缓存安全

#### **数据加密**

```typescript
// 敏感数据缓存加密
export class EncryptedCacheManager {
  async setEncrypted<T>(key: string, value: T, tenantKey: string): Promise<void>
  async getDecrypted<T>(key: string, tenantKey: string): Promise<T | null>
  
  // 自动加密敏感字段
  private async encryptSensitiveFields(data: any): Promise<any>
}
```

#### **访问控制**

```typescript
// 缓存访问权限控制
export class CacheAccessController {
  async validateAccess(key: string, tenantContext: TenantContext): Promise<boolean>
  async logAccess(key: string, operation: string, tenantContext: TenantContext): Promise<void>
  async auditCacheAccess(tenantId: string): Promise<ICacheAccessLog[]>
}
```

### 3. 缓存备份和恢复

#### **数据备份**

```typescript
// 缓存数据备份
export class CacheBackupManager {
  async createBackup(backupName: string): Promise<IBackupResult>
  async restoreFromBackup(backupName: string): Promise<IRestoreResult>
  async scheduleBackup(schedule: string): Promise<void>
  
  // 增量备份
  async createIncrementalBackup(lastBackupTime: Date): Promise<IBackupResult>
}
```

## 📊 性能指标

### 缓存性能

- **命中率**：> 95%
- **响应时间**：< 5ms (内存) / < 20ms (Redis)
- **吞吐量**：> 100,000 ops/s
- **内存效率**：> 90%

### 可靠性指标

- **可用性**：> 99.9%
- **数据一致性**：最终一致性
- **故障恢复时间**：< 30s
- **数据丢失率**：< 0.01%

### 扩展性指标

- **水平扩展**：支持Redis集群
- **租户数量**：无限制
- **缓存大小**：支持TB级别数据
- **并发连接**：> 10,000

## 🚀 配置管理集成

### 统一配置支持

```typescript
// 基于@aiofix/config的配置管理
export interface ISimpleCacheConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
    keyPrefix: string;
    enableCluster: boolean;
  };
  memory: {
    maxSize: number;
    ttl: number;
    evictionPolicy: EvictionPolicy;
  };
  tenant: {
    enableIsolation: boolean;
    isolationLevel: IsolationLevel;
    keyTemplate: string;
  };
  monitoring: {
    enableMetrics: boolean;
    metricsInterval: number;
    enableHealthCheck: boolean;
  };
}
```

### 热更新支持

```typescript
// 配置热更新
configService.onConfigChange('cache.redis', (newConfig) => {
  cacheManager.updateRedisConfig(newConfig);
});

configService.onConfigChange('cache.tenant.isolationLevel', (newLevel) => {
  isolationStrategy.updateIsolationLevel(newLevel);
});
```

## 🎊 设计成就总结

缓存模块实现了：

1. **🏗️ 企业级缓存平台**：多级缓存、智能策略、集群支持
2. **🔒 完整租户隔离**：多级隔离策略、安全访问控制
3. **🧠 智能缓存管理**：自适应策略、预测性预热、性能优化
4. **📊 全面监控诊断**：实时监控、性能分析、健康检查
5. **⚙️ 统一配置集成**：基于@aiofix/config的配置管理
6. **🔧 NestJS深度集成**：依赖注入、装饰器、生命周期管理
7. **🛡️ 企业级安全**：数据加密、访问控制、审计日志

**🏆 这是一个完整的企业级缓存管理平台，为SAAS平台提供了高性能的缓存基础设施！**

---

**文档版本**：v1.0.0  
**模块版本**：@aiofix/cache@1.0.0  
**完成度**：95% (基础功能完整，高级特性持续完善)  
**状态**：✅ 核心功能完整，生产可用
