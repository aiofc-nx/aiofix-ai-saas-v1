/**
 * 统一配置管理系统接口定义
 *
 * @description 定义统一配置管理系统的核心接口和类型
 * 为整个 AIOFix SAAS 平台提供统一的配置管理能力
 *
 * ## 设计原则
 *
 * ### 🎯 统一性原则
 * - 所有模块的配置都通过统一的接口管理
 * - 提供一致的配置访问和更新机制
 * - 统一的配置验证和错误处理
 *
 * ### 🔒 安全性原则
 * - 敏感配置支持加密存储
 * - 细粒度的权限控制
 * - 完整的审计日志记录
 *
 * ### 🚀 性能原则
 * - 多级缓存机制
 * - 懒加载和预加载策略
 * - 高效的配置查询和更新
 *
 * ### 🔄 可扩展性原则
 * - 插件化的配置提供者
 * - 模块化的配置结构
 * - 支持动态配置注册
 *
 * @example
 * ```typescript
 * // 获取配置
 * const config = await configManager.get<MessagingConfig>('messaging');
 * const timeout = await configManager.get('messaging.global.defaultTimeout', 30000);
 *
 * // 监听配置变化
 * configManager.onChange('messaging.global', (event) => {
 *   console.log('配置更新:', event.newValue);
 * });
 *
 * // 验证配置
 * const result = await configManager.validate('messaging', messagingConfig);
 * ```
 *
 * @since 1.0.0
 */

/**
 * 环境类型枚举
 *
 * @description 定义系统支持的运行环境类型
 */
export enum Environment {
  /** 开发环境 */
  DEVELOPMENT = 'development',
  /** 测试环境 */
  TEST = 'test',
  /** 预发布环境 */
  STAGING = 'staging',
  /** 生产环境 */
  PRODUCTION = 'production',
}

/**
 * 配置加载策略枚举
 *
 * @description 定义配置的加载顺序和优先级策略
 */
export enum ConfigLoadStrategy {
  /** 环境变量优先 */
  ENV_FIRST = 'env-first',
  /** 文件优先 */
  FILE_FIRST = 'file-first',
  /** 远程配置优先 */
  REMOTE_FIRST = 'remote-first',
  /** 合并所有来源 */
  MERGE = 'merge',
}

/**
 * 配置更新策略枚举
 *
 * @description 定义配置更新时的处理策略
 */
export enum ConfigUpdateStrategy {
  /** 立即生效 */
  IMMEDIATE = 'immediate',
  /** 优雅更新，等待当前任务完成 */
  GRACEFUL = 'graceful',
  /** 延迟更新，在下次重启时生效 */
  DEFERRED = 'deferred',
}

/**
 * 配置敏感级别枚举
 *
 * @description 定义配置的敏感程度，用于安全控制
 */
export enum ConfigSensitivityLevel {
  /** 公开配置 */
  PUBLIC = 'public',
  /** 内部配置 */
  INTERNAL = 'internal',
  /** 敏感配置 */
  SENSITIVE = 'sensitive',
  /** 机密配置 */
  SECRET = 'secret',
}

/**
 * 系统配置接口
 *
 * @description 定义系统级别的基础配置
 */
export interface ISystemConfig {
  /** 系统名称 */
  name: string;

  /** 系统版本 */
  version: string;

  /** 运行环境 */
  environment: Environment;

  /** 系统描述 */
  description?: string;

  /** 启动时间 */
  startTime: Date;

  /** 配置版本 */
  configVersion: string;

  /** 功能开关 */
  features: Record<string, boolean>;

  /** 系统标签 */
  tags?: Record<string, string>;

  /** 维护模式 */
  maintenanceMode?: {
    enabled: boolean;
    message?: string;
    allowedIPs?: string[];
  };
}

/**
 * 核心模块配置接口
 *
 * @description 定义核心模块的配置结构
 */
export interface ICoreModuleConfig {
  /** 是否启用Core模块 */
  enabled: boolean;

  /** 多租户配置 */
  multiTenant: {
    /** 是否启用多租户 */
    enabled: boolean;
    /** 默认隔离级别 */
    defaultIsolationLevel: 'none' | 'tenant' | 'organization' | 'user' | 'full';
    /** 租户上下文超时时间（毫秒） */
    contextTimeout: number;
    /** 是否启用租户上下文缓存 */
    enableContextCache: boolean;
  };

  /** 监控配置 */
  monitoring: {
    /** 是否启用监控 */
    enabled: boolean;
    /** 指标收集间隔（毫秒） */
    metricsInterval: number;
    /** 是否启用性能追踪 */
    enableTracing: boolean;
    /** 是否启用健康检查 */
    enableHealthCheck: boolean;
    /** 健康检查间隔（毫秒） */
    healthCheckInterval: number;
  };

  /** 错误处理配置 */
  errorHandling: {
    /** 是否启用统一错误处理 */
    enabled: boolean;
    /** 是否启用错误上报 */
    enableReporting: boolean;
    /** 错误重试配置 */
    retry: {
      /** 默认最大重试次数 */
      maxRetries: number;
      /** 默认重试延迟（毫秒） */
      retryDelay: number;
      /** 是否启用指数退避 */
      enableBackoff: boolean;
    };
  };

  /** CQRS配置 */
  cqrs: {
    /** 是否启用CQRS */
    enabled: boolean;
    /** 命令总线配置 */
    commandBus: {
      /** 是否启用中间件 */
      enableMiddleware: boolean;
      /** 命令超时时间（毫秒） */
      timeout: number;
    };
    /** 查询总线配置 */
    queryBus: {
      /** 是否启用中间件 */
      enableMiddleware: boolean;
      /** 查询超时时间（毫秒） */
      timeout: number;
      /** 是否启用查询缓存 */
      enableCache: boolean;
    };
    /** 事件总线配置 */
    eventBus: {
      /** 是否启用中间件 */
      enableMiddleware: boolean;
      /** 事件超时时间（毫秒） */
      timeout: number;
      /** 是否启用事件持久化 */
      enablePersistence: boolean;
    };
  };

  /** Web集成配置 */
  web: {
    /** 是否启用Web集成 */
    enabled: boolean;
    /** Fastify配置 */
    fastify: {
      /** 是否启用企业级Fastify适配器 */
      enableEnterpriseAdapter: boolean;
      /** 是否启用CORS */
      enableCors: boolean;
      /** 是否启用请求日志 */
      enableRequestLogging: boolean;
      /** 是否启用性能监控 */
      enablePerformanceMonitoring: boolean;
    };
  };

  /** 数据库集成配置 */
  database: {
    /** 是否启用数据库集成 */
    enabled: boolean;
    /** 是否启用租户感知仓储 */
    enableTenantAwareRepository: boolean;
    /** 是否启用事务管理 */
    enableTransactionManagement: boolean;
  };

  /** 消息队列集成配置 */
  messaging: {
    /** 是否启用消息队列集成 */
    enabled: boolean;
    /** 是否启用简化Bull队列适配器 */
    enableSimpleBullQueue: boolean;
  };
}

/**
 * 消息传递模块配置接口
 *
 * @description 定义消息传递模块的配置结构
 */
export interface IMessagingModuleConfig {
  /** 是否启用 */
  enabled: boolean;

  /** 全局配置 */
  global: {
    defaultTimeout: number;
    maxRetries: number;
    retryDelay: number;
    enableMetrics: boolean;
    enableVerboseLogging: boolean;
    enableTenantIsolation: boolean;
    serializationFormat: 'json' | 'msgpack' | 'protobuf';
    enableCompression: boolean;
    enableEncryption: boolean;
  };

  /** Redis配置 */
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
    cluster?: {
      enabled: boolean;
      nodes: Array<{ host: string; port: number }>;
    };
  };

  /** 队列配置 */
  queues: Record<string, IQueueConfig>;

  /** 处理器配置 */
  handlers: Record<string, IHandlerConfig>;

  /** 监控配置 */
  monitoring: {
    enabled: boolean;
    metricsInterval: number;
    enableTracing: boolean;
    tracingSampleRate: number;
  };
}

/**
 * 队列配置接口
 *
 * @description 定义消息队列的配置选项
 */
export interface IQueueConfig {
  /** 队列名称 */
  name: string;

  /** 并发处理数量 */
  concurrency: number;

  /** 最大重试次数 */
  maxRetries: number;

  /** 重试延迟时间（毫秒） */
  retryDelay: number;

  /** 是否启用延迟队列 */
  enableDelayedJobs: boolean;

  /** 是否启用死信队列 */
  enableDeadLetterQueue: boolean;

  /** 死信队列名称 */
  deadLetterQueueName?: string;

  /** 消息TTL（生存时间，毫秒） */
  messageTTL?: number;

  /** 队列优先级 */
  priority: number;
}

/**
 * 处理器配置接口
 *
 * @description 定义消息处理器的配置选项
 */
export interface IHandlerConfig {
  /** 处理器名称 */
  name: string;

  /** 处理器类型 */
  type: 'message' | 'event' | 'queue' | 'saga';

  /** 是否启用处理器 */
  enabled: boolean;

  /** 超时时间（毫秒） */
  timeout: number;

  /** 最大重试次数 */
  maxRetries: number;

  /** 重试延迟时间（毫秒） */
  retryDelay: number;

  /** 中间件列表 */
  middleware: string[];

  /** 自定义配置 */
  custom: Record<string, unknown>;
}

/**
 * 认证模块配置接口
 *
 * @description 定义认证和授权模块的配置结构
 */
export interface IAuthModuleConfig {
  /** 是否启用 */
  enabled: boolean;

  /** JWT配置 */
  jwt: {
    secret: string;
    expiresIn: string;
    issuer: string;
    audience: string;
  };

  /** OAuth配置 */
  oauth?: {
    providers: Record<
      string,
      {
        clientId: string;
        clientSecret: string;
        redirectUri: string;
        scope: string[];
      }
    >;
  };

  /** 密码策略 */
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expiryDays: number;
  };

  /** 会话配置 */
  session: {
    timeout: number;
    maxConcurrentSessions: number;
    enableSingleSignOn: boolean;
  };
}

/**
 * 租户模块配置接口
 *
 * @description 定义多租户系统的配置结构
 */
export interface ITenantModuleConfig {
  /** 是否启用 */
  enabled: boolean;

  /** 数据隔离策略 */
  isolationStrategy: 'database' | 'schema' | 'table' | 'row';

  /** 默认租户配置 */
  defaultTenant: {
    maxUsers: number;
    maxStorage: number; // MB
    enabledFeatures: string[];
  };

  /** 租户限制 */
  limits: {
    maxTenantsPerInstance: number;
    maxDatabaseConnections: number;
    maxCacheSize: number; // MB
  };

  /** 计费配置 */
  billing?: {
    enabled: boolean;
    currency: string;
    billingCycle: 'monthly' | 'yearly';
  };
}

/**
 * AI模块配置接口
 *
 * @description 定义AI集成模块的配置结构
 */
export interface IAIModuleConfig {
  /** 是否启用 */
  enabled: boolean;

  /** 默认AI提供者 */
  defaultProvider: string;

  /** AI提供者配置 */
  providers: Record<
    string,
    {
      type: 'openai' | 'anthropic' | 'azure' | 'local';
      apiKey?: string;
      endpoint?: string;
      model: string;
      maxTokens: number;
      temperature: number;
      timeout: number;
    }
  >;

  /** 使用限制 */
  limits: {
    maxRequestsPerMinute: number;
    maxTokensPerDay: number;
    maxConcurrentRequests: number;
  };

  /** 缓存配置 */
  cache: {
    enabled: boolean;
    ttl: number; // 秒
    maxSize: number; // MB
  };
}

/**
 * 日志模块配置接口
 *
 * @description 定义日志系统的配置结构
 */
export interface ILoggingModuleConfig {
  /** 是否启用 */
  enabled: boolean;

  /** 日志级别 */
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

  /** 输出目标 */
  targets: Array<{
    type: 'console' | 'file' | 'database' | 'remote';
    config: Record<string, unknown>;
  }>;

  /** 日志格式 */
  format: {
    type: 'json' | 'text' | 'pretty';
    includeTimestamp: boolean;
    includeLevel: boolean;
    includeContext: boolean;
  };

  /** 日志轮转 */
  rotation?: {
    enabled: boolean;
    maxSize: string; // '10MB'
    maxFiles: number;
    datePattern: string; // 'YYYY-MM-DD'
  };

  /** 性能配置 */
  performance: {
    enableAsync: boolean;
    bufferSize: number;
    flushInterval: number; // 毫秒
  };
}

/**
 * 缓存模块配置接口
 *
 * @description 定义缓存系统的配置结构
 */
export interface ICacheModuleConfig {
  /** 是否启用 */
  enabled: boolean;

  /** 默认缓存策略 */
  defaultStrategy: 'memory' | 'redis' | 'hybrid';

  /** 内存缓存配置 */
  memory: {
    maxSize: number; // MB
    ttl: number; // 秒
    checkPeriod: number; // 秒
  };

  /** Redis缓存配置 */
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
    keyPrefix: string;
    ttl: number; // 秒
  };

  /** 缓存策略 */
  strategies: Record<
    string,
    {
      type: 'lru' | 'lfu' | 'ttl' | 'custom';
      config: Record<string, unknown>;
    }
  >;
}

/**
 * 数据库模块配置接口
 *
 * @description 定义数据库系统的配置结构
 */
export interface IDatabaseModuleConfig {
  /** 是否启用 */
  enabled: boolean;

  /** 默认数据库连接 */
  default: string;

  /** 数据库连接配置 */
  connections: Record<
    string,
    {
      type: 'postgresql' | 'mysql' | 'mongodb' | 'sqlite';
      host: string;
      port: number;
      username: string;
      password: string;
      database: string;
      ssl?: boolean;
      pool?: {
        min: number;
        max: number;
        idle: number;
        acquire: number;
      };
      options?: Record<string, unknown>;
    }
  >;

  /** 多租户配置 */
  multiTenant: {
    /** 是否启用多租户 */
    enabled: boolean;
    /** 隔离策略 */
    strategy: 'database' | 'schema' | 'row';
    /** 租户数据库前缀 */
    tenantDatabasePrefix: string;
    /** 租户模式前缀 */
    tenantSchemaPrefix: string;
  };

  /** 事务配置 */
  transaction: {
    /** 是否启用事务管理 */
    enabled: boolean;
    /** 默认隔离级别 */
    isolationLevel:
      | 'READ_UNCOMMITTED'
      | 'READ_COMMITTED'
      | 'REPEATABLE_READ'
      | 'SERIALIZABLE';
    /** 事务超时时间（毫秒） */
    timeout: number;
    /** 是否启用分布式事务 */
    enableDistributed: boolean;
  };

  /** CQRS配置 */
  cqrs: {
    /** 是否启用CQRS */
    enabled: boolean;
    /** 读数据库连接名称 */
    readConnection: string;
    /** 写数据库连接名称 */
    writeConnection: string;
    /** 事件存储配置 */
    eventStore: {
      enabled: boolean;
      connection: string;
      tableName: string;
      snapshotThreshold: number;
    };
  };

  /** 监控配置 */
  monitoring: {
    /** 是否启用监控 */
    enabled: boolean;
    /** 监控间隔（毫秒） */
    interval: number;
    /** 是否启用慢查询监控 */
    enableSlowQueryLog: boolean;
    /** 慢查询阈值（毫秒） */
    slowQueryThreshold: number;
    /** 是否启用连接池监控 */
    enableConnectionPoolMonitoring: boolean;
  };

  /** 迁移配置 */
  migrations: {
    enabled: boolean;
    directory: string;
    tableName: string;
    autoRun: boolean;
  };

  /** 种子数据配置 */
  seeds?: {
    enabled: boolean;
    directory: string;
    environment: Environment[];
  };
}

/**
 * 统一配置根接口
 *
 * @description 系统所有配置的根结构，采用模块化设计
 */
export interface IUnifiedConfig {
  /** 系统元信息 */
  system: ISystemConfig;

  /** 核心模块配置 */
  core: ICoreModuleConfig;

  /** 消息传递模块配置 */
  messaging: IMessagingModuleConfig;

  /** 认证模块配置 */
  auth: IAuthModuleConfig;

  /** 租户模块配置 */
  tenant: ITenantModuleConfig;

  /** AI模块配置 */
  ai: IAIModuleConfig;

  /** 日志模块配置 */
  logging: ILoggingModuleConfig;

  /** 缓存模块配置 */
  cache: ICacheModuleConfig;

  /** 数据库模块配置 */
  database: IDatabaseModuleConfig;
}

/**
 * 配置变更事件接口
 *
 * @description 定义配置更新时触发的事件结构
 */
export interface IConfigChangeEvent {
  /** 事件类型 */
  type: 'config-updated' | 'config-validated' | 'config-rollback';

  /** 配置路径 */
  path: string;

  /** 旧值 */
  oldValue: unknown;

  /** 新值 */
  newValue: unknown;

  /** 更新时间 */
  timestamp: Date;

  /** 更新来源 */
  source: string;

  /** 更新原因 */
  reason?: string;

  /** 更新用户 */
  userId?: string;

  /** 更新会话 */
  sessionId?: string;
}

/**
 * 配置验证结果接口
 *
 * @description 定义配置验证的结果结构
 */
export interface IConfigValidationResult {
  /** 验证是否通过 */
  valid: boolean;

  /** 错误信息列表 */
  errors: string[];

  /** 警告信息列表 */
  warnings: string[];

  /** 验证的配置路径 */
  path?: string;

  /** 验证时间 */
  validatedAt: Date;

  /** 验证器版本 */
  validatorVersion?: string;
}

/**
 * 配置操作接口
 *
 * @description 定义配置的批量操作结构
 */
export interface IConfigOperation {
  /** 操作类型 */
  type: 'get' | 'set' | 'delete' | 'merge';

  /** 配置路径 */
  path: string;

  /** 配置值（set/merge操作时使用） */
  value?: unknown;

  /** 操作选项 */
  options?: {
    validate?: boolean;
    encrypt?: boolean;
    backup?: boolean;
  };
}

/**
 * 配置提供者接口
 *
 * @description 定义配置数据来源的统一接口
 */
export interface IConfigProvider {
  /** 提供者名称 */
  readonly name: string;

  /** 提供者优先级 */
  readonly priority: number;

  /** 是否支持写操作 */
  readonly writable: boolean;

  /** 是否支持监听 */
  readonly watchable: boolean;

  /**
   * 初始化提供者
   */
  initialize(): Promise<void>;

  /**
   * 获取配置
   *
   * @param key - 配置键
   * @returns 配置值
   */
  get<T = unknown>(key: string): Promise<T | undefined>;

  /**
   * 设置配置
   *
   * @param key - 配置键
   * @param value - 配置值
   */
  set<T = unknown>(key: string, value: T): Promise<void>;

  /**
   * 删除配置
   *
   * @param key - 配置键
   */
  delete(key: string): Promise<void>;

  /**
   * 检查配置是否存在
   *
   * @param key - 配置键
   * @returns 是否存在
   */
  has(key: string): Promise<boolean>;

  /**
   * 获取所有配置键
   *
   * @returns 配置键列表
   */
  keys(): Promise<string[]>;

  /**
   * 监听配置变化
   *
   * @param key - 配置键
   * @param callback - 变化回调
   */
  watch?(key: string, callback: (value: unknown) => void): void;

  /**
   * 取消监听配置变化
   *
   * @param key - 配置键
   * @param callback - 变化回调
   */
  unwatch?(key: string, callback: (value: unknown) => void): void;

  /**
   * 销毁提供者
   */
  destroy(): Promise<void>;
}

/**
 * 配置存储接口
 *
 * @description 定义配置存储的核心接口
 */
export interface IConfigStore {
  /**
   * 获取配置
   *
   * @param path - 配置路径
   * @param defaultValue - 默认值
   * @returns 配置值
   */
  get<T = unknown>(path: string, defaultValue?: T): Promise<T>;

  /**
   * 设置配置
   *
   * @param path - 配置路径
   * @param value - 配置值
   */
  set<T = unknown>(path: string, value: T): Promise<void>;

  /**
   * 删除配置
   *
   * @param path - 配置路径
   */
  delete(path: string): Promise<void>;

  /**
   * 批量操作
   *
   * @param operations - 操作列表
   */
  batch(operations: IConfigOperation[]): Promise<void>;

  /**
   * 监听配置变化
   *
   * @param path - 配置路径
   * @param callback - 变化回调
   */
  watch(path: string, callback: (event: IConfigChangeEvent) => void): void;

  /**
   * 取消监听
   *
   * @param path - 配置路径
   * @param callback - 变化回调
   */
  unwatch(path: string, callback: (event: IConfigChangeEvent) => void): void;
}

/**
 * 配置验证器接口
 *
 * @description 定义配置验证的核心接口
 */
export interface IConfigValidator {
  /**
   * 验证配置
   *
   * @param schema - 配置模式
   * @param config - 配置对象
   * @returns 验证结果
   */
  validate<T = unknown>(
    schema: IConfigSchema<T>,
    config: unknown,
  ): Promise<IConfigValidationResult>;

  /**
   * 注册验证规则
   *
   * @param name - 规则名称
   * @param rule - 验证规则
   */
  registerRule(name: string, rule: IValidationRule): void;

  /**
   * 验证配置更新
   *
   * @param path - 配置路径
   * @param oldValue - 旧值
   * @param newValue - 新值
   * @returns 验证结果
   */
  validateUpdate(
    path: string,
    oldValue: unknown,
    newValue: unknown,
  ): Promise<IConfigValidationResult>;
}

/**
 * 配置模式接口
 *
 * @description 定义配置的JSON Schema结构
 */
export interface IConfigSchema<T = unknown> {
  /** 模式ID */
  $id: string;

  /** 模式版本 */
  version: string;

  /** 类型定义 */
  type: string;

  /** 属性定义 */
  properties: Record<string, IPropertySchema>;

  /** 必需属性 */
  required?: string[];

  /** 是否允许附加属性 */
  additionalProperties?: boolean;

  /** 自定义验证规则 */
  customRules?: IValidationRule[];

  /** 模式描述 */
  description?: string;

  /** 示例配置 */
  examples?: T[];
}

/**
 * 属性模式接口
 *
 * @description 定义配置属性的验证规则
 */
export interface IPropertySchema {
  /** 属性类型 */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';

  /** 属性描述 */
  description?: string;

  /** 默认值 */
  default?: unknown;

  /** 枚举值 */
  enum?: unknown[];

  /** 最小值（数字类型） */
  minimum?: number;

  /** 最大值（数字类型） */
  maximum?: number;

  /** 正则模式（字符串类型） */
  pattern?: string;

  /** 格式验证（字符串类型） */
  format?: string;

  /** 数组项模式（数组类型） */
  items?: IPropertySchema;

  /** 对象属性模式（对象类型） */
  properties?: Record<string, IPropertySchema>;

  /** 敏感级别 */
  sensitivity?: ConfigSensitivityLevel;

  /** 是否可在运行时更新 */
  mutable?: boolean;
}

/**
 * 验证规则接口
 *
 * @description 定义自定义验证规则的结构
 */
export interface IValidationRule {
  /** 规则名称 */
  name: string;

  /** 验证函数 */
  validate: (value: unknown, context?: unknown) => boolean | Promise<boolean>;

  /** 错误消息 */
  message: string;

  /** 是否为警告（否则为错误） */
  isWarning?: boolean;

  /** 规则优先级 */
  priority?: number;
}

/**
 * 配置管理器接口
 *
 * @description 定义配置管理的核心功能接口
 */
export interface IConfigManager {
  /**
   * 初始化配置管理器
   *
   * @param options - 初始化选项
   */
  initialize(options?: IConfigManagerOptions): Promise<void>;

  /**
   * 获取完整配置
   *
   * @returns 统一配置对象
   */
  getConfig(): Promise<IUnifiedConfig>;

  /**
   * 获取配置项
   *
   * @param path - 配置路径
   * @param defaultValue - 默认值
   * @returns 配置值
   */
  get<T = unknown>(path: string, defaultValue?: T): Promise<T>;

  /**
   * 设置配置项
   *
   * @param path - 配置路径
   * @param value - 配置值
   */
  set<T = unknown>(path: string, value: T): Promise<void>;

  /**
   * 获取模块配置
   *
   * @param module - 模块名称
   * @returns 模块配置
   */
  getModuleConfig<T = unknown>(module: string): Promise<T>;

  /**
   * 验证配置
   *
   * @param path - 配置路径或模块名称
   * @param config - 配置对象
   * @returns 验证结果
   */
  validate<T = unknown>(
    path: string,
    config: T,
  ): Promise<IConfigValidationResult>;

  /**
   * 重新加载配置
   *
   * @returns 重新加载后的配置
   */
  reload(): Promise<IUnifiedConfig>;

  /**
   * 监听配置变化
   *
   * @param path - 配置路径
   * @param callback - 变化回调
   */
  onChange(path: string, callback: (event: IConfigChangeEvent) => void): void;

  /**
   * 取消监听配置变化
   *
   * @param path - 配置路径
   * @param callback - 变化回调
   */
  offChange(path: string, callback: (event: IConfigChangeEvent) => void): void;

  /**
   * 获取配置统计信息
   *
   * @returns 统计信息
   */
  getStatistics(): IConfigStatistics;

  /**
   * 销毁配置管理器
   */
  destroy(): Promise<void>;
}

/**
 * 配置管理器选项接口
 *
 * @description 定义配置管理器的初始化选项
 */
export interface IConfigManagerOptions {
  /** 配置提供者列表 */
  providers?: IConfigProvider[];

  /** 加载策略 */
  loadStrategy?: ConfigLoadStrategy;

  /** 是否启用缓存 */
  enableCache?: boolean;

  /** 是否启用热更新 */
  enableHotReload?: boolean;

  /** 是否启用加密 */
  enableEncryption?: boolean;

  /** 是否启用监控 */
  enableMonitoring?: boolean;

  /** 是否启用验证 */
  enableValidation?: boolean;

  /** 缓存配置 */
  cache?: {
    ttl: number;
    maxSize: number;
    strategy: 'memory' | 'redis' | 'hybrid';
  };

  /** 加密配置 */
  encryption?: {
    algorithm: string;
    key: string;
    sensitivityLevels: ConfigSensitivityLevel[];
  };

  /** 监控配置 */
  monitoring?: {
    metricsInterval: number;
    enableTracing: boolean;
    enableAuditLog: boolean;
  };
}

/**
 * 配置统计信息接口
 *
 * @description 定义配置使用统计信息的结构
 */
export interface IConfigStatistics {
  /** 总访问次数 */
  totalAccess: number;

  /** 读取访问次数 */
  readAccess: number;

  /** 写入访问次数 */
  writeAccess: number;

  /** 错误次数 */
  errors: number;

  /** 平均响应时间（毫秒） */
  averageResponseTime: number;

  /** 缓存命中率 */
  cacheHitRate: number;

  /** 配置项数量 */
  configCount: number;

  /** 提供者数量 */
  providerCount: number;

  /** 监听器数量 */
  listenerCount: number;

  /** 最后更新时间 */
  lastUpdated: Date;
}

/**
 * 配置变更回调类型
 *
 * @description 定义配置变更时的回调函数类型
 */
export type ConfigChangeCallback = (event: IConfigChangeEvent) => void;

/**
 * 配置路径类型
 *
 * @description 定义配置路径的类型约束
 */
export type ConfigPath = string;

/**
 * 配置值类型
 *
 * @description 定义配置值的通用类型
 */
export type ConfigValue = string | number | boolean | object | null | undefined;

/**
 * 模块配置类型映射
 *
 * @description 定义模块名称到配置类型的映射
 */
export interface IModuleConfigMap {
  system: ISystemConfig;
  core: ICoreModuleConfig;
  messaging: IMessagingModuleConfig;
  auth: IAuthModuleConfig;
  tenant: ITenantModuleConfig;
  ai: IAIModuleConfig;
  logging: ILoggingModuleConfig;
  cache: ICacheModuleConfig;
  database: IDatabaseModuleConfig;
}

/**
 * 配置模块名称类型
 *
 * @description 定义支持的配置模块名称
 */
export type ConfigModuleName = keyof IModuleConfigMap;
