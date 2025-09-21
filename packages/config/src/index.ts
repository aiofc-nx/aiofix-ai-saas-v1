/**
 * 统一配置管理系统
 *
 * @description AIOFix SAAS平台的统一配置管理模块
 * 提供企业级的配置管理、验证、缓存和监控功能
 *
 * ## 主要功能
 *
 * ### 🎯 统一配置管理
 * - 所有模块的配置统一管理
 * - 分层配置支持（系统、模块、环境）
 * - 类型安全的配置访问
 * - 配置的动态更新和监听
 *
 * ### 🚀 高性能特性
 * - 多级缓存机制
 * - 懒加载和预加载
 * - 配置访问性能监控
 * - 批量操作支持
 *
 * ### 🔒 企业级安全
 * - 敏感配置加密存储
 * - 细粒度权限控制
 * - 配置访问审计日志
 * - 配置完整性验证
 *
 * ### 🛠️ 开发友好
 * - 丰富的预设配置
 * - 简单直观的API
 * - 完整的TypeScript支持
 * - 详细的错误信息和建议
 *
 * @example
 * ```typescript
 * import {
 *   createConfigManager,
 *   createProductionConfigManager,
 *   Environment
 * } from '@aiofix/config';
 *
 * // 创建默认配置管理器
 * const config = await createConfigManager();
 *
 * // 获取配置
 * const messagingConfig = await config.getModuleConfig('messaging');
 * const dbHost = await config.get('core.database.host', 'localhost');
 *
 * // 监听配置变化
 * config.onChange('messaging.global', (event) => {
 *   console.log('消息传递配置更新:', event.newValue);
 * });
 *
 * // 更新配置
 * await config.set('messaging.global.defaultTimeout', 60000);
 *
 * // 创建生产环境配置管理器
 * const prodConfig = await createProductionConfigManager();
 * ```
 *
 * @since 1.0.0
 */

// 核心接口和类型
export type {
  // 统一配置接口
  IUnifiedConfig,
  ISystemConfig,
  ICoreModuleConfig,
  IMessagingModuleConfig,
  IAuthModuleConfig,
  ITenantModuleConfig,
  IAIModuleConfig,
  ILoggingModuleConfig,
  ICacheModuleConfig,
  IDatabaseModuleConfig,

  // 队列和处理器配置
  IQueueConfig,
  IHandlerConfig,

  // 配置管理接口
  IConfigManager,
  IConfigManagerOptions,
  IConfigProvider,
  IConfigStore,
  IConfigValidator,

  // 配置验证接口
  IConfigValidationResult,
  IConfigSchema,
  IPropertySchema,
  IValidationRule,

  // 事件和操作接口
  IConfigChangeEvent,
  IConfigOperation,

  // 统计信息接口
  IConfigStatistics,

  // 类型别名
  ConfigPath,
  ConfigValue,
  ConfigModuleName,
  IModuleConfigMap,
  ConfigChangeCallback,
} from './interfaces/config.interface';

// 枚举类型
export {
  Environment,
  ConfigLoadStrategy,
  ConfigUpdateStrategy,
  ConfigSensitivityLevel,
} from './interfaces/config.interface';

// 核心配置管理器
export { UnifiedConfigManager } from './core/config-manager';

// 配置验证器
export {
  ConfigValidator,
  createConfigValidator,
  validateConfig,
  validateModuleConfig,
} from './validation/config-validator';

// 配置提供者
export {
  EnvironmentConfigProvider,
  createEnvironmentConfigProvider,
  getEnvConfig,
  validateEnvConfig,
} from './providers/environment-provider';

// 配置工厂
export {
  ConfigFactory,
  createConfigManager,
  createDevelopmentConfigManager,
  createProductionConfigManager,
  createTestConfigManager,
  createConfigManagerForEnvironment,
  createConfigManagerFromPreset,
} from './factories/config-factory';

export type {
  IConfigPreset,
  IConfigFactoryOptions,
} from './factories/config-factory';

// 热更新功能
export {
  ConfigHotReloader,
  createConfigHotReloader,
  createConfigManagerWithHotReload,
} from './hotreload/config-hot-reloader';

export type {
  IHotReloadConfig,
  IConfigUpdateRequest,
  IConfigHistory,
} from './hotreload/config-hot-reloader';

// 监控和诊断功能
export {
  ConfigMonitor,
  createConfigMonitor,
  quickHealthCheck,
  fullDiagnosis,
  HealthStatus,
} from './monitoring/config-monitor';

export type {
  IDiagnosticIssue,
  IHealthCheckResult,
  IDiagnosticReport,
} from './monitoring/config-monitor';

// NestJS模块集成
export {
  UnifiedConfigModule,
  InjectConfig,
  InjectModuleConfig,
} from './nestjs/config.module';

export type {
  IUnifiedConfigModuleOptions,
  IUnifiedConfigModuleAsyncOptions,
} from './nestjs/config.module';

/**
 * 配置模块版本信息
 */
export const CONFIG_MODULE_VERSION = '1.0.0';

/**
 * 配置模块元数据
 */
export const CONFIG_MODULE_META = {
  name: '@aiofix/config',
  version: CONFIG_MODULE_VERSION,
  description: '统一配置管理系统',
  author: 'AIOFix Team',
  license: 'MIT',
  features: [
    '统一配置管理',
    '多环境支持',
    '动态配置更新',
    '配置验证',
    '类型安全',
    '性能监控',
    '安全加密',
    '预设配置',
  ],
  components: [
    'UnifiedConfigManager - 统一配置管理器',
    'ConfigValidator - 配置验证器',
    'ConfigFactory - 配置工厂',
    'EnvironmentConfigProvider - 环境变量配置提供者',
    'MessagingConfigAPI - 消息传递模块配置API',
    'CoreConfigAPI - 核心模块配置API',
    'AuthConfigAPI - 认证模块配置API',
  ],
  supportedModules: [
    'system',
    'core',
    'messaging',
    'auth',
    'tenant',
    'ai',
    'logging',
    'cache',
    'database',
  ],
} as const;

/**
 * 默认导出
 *
 * @description 提供配置模块的主要功能
 */
/**
 * 默认导出 - 主要配置管理功能
 */
export default {
  CONFIG_MODULE_VERSION,
  CONFIG_MODULE_META,
};
