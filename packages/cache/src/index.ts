/**
 * 统一缓存管理平台 - 重构第一阶段
 *
 * @description 企业级多租户缓存系统（重构进行中）
 * 当前提供基础缓存功能，后续将逐步完善
 *
 * @since 1.0.0
 */

// 导出核心接口和类型
export * from './interfaces/cache.interface';

// 导出核心服务（第一阶段：简化版本）
export { SimpleCacheManager } from './core/simple-cache-manager';

// 导出配置服务（简化版本）
export {
  SimpleCacheConfigService,
  createSimpleCacheConfigService,
} from './config/simple-cache-config.service';

export type { ISimpleCacheConfig } from './config/simple-cache-config.service';

// 导出NestJS模块（简化版本）
export {
  SimpleCacheModule,
  InjectSimpleCacheManager,
  InjectSimpleCacheConfig,
} from './nestjs/simple-cache.module';

export type { ISimpleCacheModuleOptions } from './nestjs/simple-cache.module';

// 导出隔离策略
export {
  CacheIsolationStrategy,
  createCacheIsolationStrategy,
  TenantAwareCacheKeyBuilder,
} from './strategies/cache-isolation.strategy';

// 注意：以下功能将在Core模块完善后实现
// - UnifiedCacheManager: 完整的企业级缓存管理器
// - TenantAwareCacheService: 多租户感知缓存服务
// - UnifiedCacheModule: 完整的NestJS模块集成
// - 缓存装饰器系统: @Cacheable, @CacheEvict 等
// - 智能缓存策略: 自适应策略选择
// - 性能监控集成: 实时监控和分析
