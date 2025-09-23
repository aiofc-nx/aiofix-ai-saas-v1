/**
 * Core模块配置接口定义
 *
 * @description 定义Core模块专用的配置接口
 * 包含多租户、监控、错误处理、CQRS等配置
 *
 * @since 1.0.0
 */

/**
 * Core模块配置接口
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
 * Core模块配置更新事件
 */
export interface ICoreConfigChangeEvent {
  /** 配置路径 */
  path: string;
  /** 旧值 */
  oldValue: any;
  /** 新值 */
  newValue: any;
  /** 更新时间 */
  timestamp: Date;
}

/**
 * Core模块配置状态
 */
export interface ICoreConfigStatus {
  /** 是否已初始化 */
  initialized: boolean;
  /** 配置版本 */
  version: string;
  /** 最后更新时间 */
  lastUpdated: Date | null;
  /** 监听器数量 */
  listenersCount: number;
  /** 是否启用热更新 */
  hotReloadEnabled: boolean;
}
