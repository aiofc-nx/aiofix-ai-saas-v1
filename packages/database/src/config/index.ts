/**
 * @fileoverview 数据库配置模块导出
 * @description 导出所有数据库相关的配置类
 */

// 新的统一配置管理系统
export {
  DatabaseConfigService,
  createDatabaseConfigService,
} from './database-config.service';
export {
  DatabaseConfigModule,
  InjectDatabaseConfig,
  InjectDatabaseConfigService,
} from './database-config.module';

// 保留旧的配置类以确保向后兼容性（标记为deprecated）
// 注意：以下导出已暂时移除，等待重构完成后重新实现
// export { DatabaseConfig } from './database.config';
// export { RedisConfig } from './redis.config';
// export { IsolationConfigService, IsolationStrategy } from './isolation.config';
