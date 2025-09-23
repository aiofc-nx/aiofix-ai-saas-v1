/**
 * 统一数据库管理平台 - 重构第一阶段
 *
 * @description 企业级多租户数据库系统（重构进行中）
 * 当前提供基础数据库功能，后续将逐步完善
 *
 * @since 1.0.0
 */

// 导出核心接口和类型（已拆分为多个文件，提高可维护性）
export * from './interfaces';

// 导出核心服务（第一阶段：简化版本）
export { SimpleDatabaseManager } from './core/simple-database-manager';

// 导出多租户服务（第二阶段：租户隔离）
export {
  TenantAwareDatabaseService,
  createTenantAwareDatabaseService,
} from './services/tenant-aware-database.service';
export {
  DatabaseIsolationStrategy,
  createDatabaseIsolationStrategy,
  DEFAULT_ISOLATION_CONFIG,
} from './strategies/database-isolation.strategy';

export type { IDatabaseIsolationConfig } from './strategies/database-isolation.strategy';

// 导出CQRS功能（第三阶段：CQRS和事件溯源）
export * from './cqrs';

// 导出分布式事务功能（第四阶段：分布式事务和Saga模式）
export * from './transactions';

// 导出Repository功能（第五阶段：Repository装饰器系统）
export * from './repositories';

// 导出性能监控功能（第六阶段：性能监控和优化）
export * from './performance';

// 导出映射器功能（Core模块映射器集成）
export * from './mappers';

// 导出配置服务（基于统一配置系统）
export {
  DatabaseConfigService,
  createDatabaseConfigService,
} from './config/database-config.service';

export {
  DatabaseConfigModule,
  InjectDatabaseConfig,
  InjectDatabaseConfigService,
} from './config/database-config.module';

// 导出NestJS模块（简化版本）
export {
  SimpleDatabaseModule,
  InjectSimpleDatabaseManager,
  InjectSimpleDatabaseConfig,
} from './nestjs/simple-database.module';

export type { ISimpleDatabaseModuleOptions } from './nestjs/simple-database.module';

// 保留旧的导出以确保向后兼容性（标记为deprecated）
// 注意：以下导出已暂时移除，等待重构完成后重新实现
// export {
//   DatabaseConfig,
//   RedisConfig,
//   IsolationConfigService,
//   IsolationStrategy,
// } from './config';

// 注意：以下功能将在Core模块完善后实现
// - UnifiedDatabaseManager: 完整的企业级数据库管理器
// - TenantAwareDatabaseService: 多租户感知数据库服务
// - CQRSDatabaseManager: CQRS模式数据库支持
// - EventStore: 事件溯源数据库存储
// - DistributedTransactionManager: 分布式事务管理
// - Repository装饰器系统: @Entity, @Repository 等
