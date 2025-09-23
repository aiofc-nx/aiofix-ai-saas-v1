/**
 * 装饰器元数据常量
 *
 * 定义了所有 CQRS 装饰器使用的元数据键名和值。
 * 这些常量用于 Reflect API 来存储和检索装饰器元数据。
 *
 * ## 业务规则
 *
 * ### 命名规范规则
 * - 所有元数据键名使用 PascalCase 格式
 * - 键名前缀表示元数据类型（Command、Query、Event、Saga）
 * - 键名后缀表示元数据用途（Handler、Metadata、Options）
 *
 * ### 版本控制规则
 * - 元数据键名包含版本信息，支持元数据演化
 * - 新版本的元数据键名应该保持向后兼容
 * - 废弃的元数据键名应该在文档中标记
 *
 * ### 类型安全规则
 * - 元数据键名使用 TypeScript 字面量类型
 * - 元数据值类型通过接口定义
 * - 支持编译时类型检查
 *
 * @description 装饰器元数据常量定义
 * @since 1.0.0
 */

/**
 * 命令处理器元数据键名
 */
export const COMMAND_HANDLER_METADATA = 'CommandHandlerMetadata' as const;

/**
 * 查询处理器元数据键名
 */
export const QUERY_HANDLER_METADATA = 'QueryHandlerMetadata' as const;

/**
 * 事件处理器元数据键名
 */
export const EVENT_HANDLER_METADATA = 'EventHandlerMetadata' as const;

/**
 * Saga 处理器元数据键名
 */
export const SAGA_METADATA = 'SagaMetadata' as const;

/**
 * 性能监控元数据键名
 */
export const PERFORMANCE_MONITOR_METADATA =
  'PerformanceMonitorMetadata' as const;

/**
 * 数据隔离元数据键名
 */
export const DATA_ISOLATION_METADATA = 'DataIsolationMetadata' as const;

/**
 * 缓存元数据键名
 */
export const CACHE_METADATA = 'CacheMetadata' as const;

/**
 * 验证元数据键名
 */
export const VALIDATION_METADATA = 'ValidationMetadata' as const;

/**
 * 授权元数据键名
 */
export const AUTHORIZATION_METADATA = 'AuthorizationMetadata' as const;

/**
 * 事务元数据键名
 */
export const TRANSACTION_METADATA = 'TransactionMetadata' as const;

/**
 * 重试元数据键名
 */
export const RETRY_METADATA = 'RetryMetadata' as const;

/**
 * 超时元数据键名
 */
export const TIMEOUT_METADATA = 'TimeoutMetadata' as const;

/**
 * 日志记录元数据键名
 */
export const LOGGING_METADATA = 'LoggingMetadata' as const;

/**
 * 审计元数据键名
 */
export const AUDIT_METADATA = 'AuditMetadata' as const;

/**
 * 多租户元数据键名
 */
export const MULTI_TENANT_METADATA = 'MultiTenantMetadata' as const;

/**
 * 异步上下文元数据键名
 */
export const ASYNC_CONTEXT_METADATA = 'AsyncContextMetadata' as const;

/**
 * 中间件元数据键名
 */
export const MIDDLEWARE_METADATA = 'MiddlewareMetadata' as const;

/**
 * 拦截器元数据键名
 */
export const INTERCEPTOR_METADATA = 'InterceptorMetadata' as const;

/**
 * 装饰器类型枚举
 */
export enum DecoratorType {
  COMMAND_HANDLER = 'CommandHandler',
  QUERY_HANDLER = 'QueryHandler',
  EVENT_HANDLER = 'EventHandler',
  SAGA = 'Saga',
  PERFORMANCE_MONITOR = 'PerformanceMonitor',
  DATA_ISOLATION = 'DataIsolation',
  CACHE = 'Cache',
  VALIDATION = 'Validation',
  AUTHORIZATION = 'Authorization',
  TRANSACTION = 'Transaction',
  RETRY = 'Retry',
  TIMEOUT = 'Timeout',
  LOGGING = 'Logging',
  AUDIT = 'Audit',
  MULTI_TENANT = 'MultiTenant',
  ASYNC_CONTEXT = 'AsyncContext',
  MIDDLEWARE = 'Middleware',
  INTERCEPTOR = 'Interceptor',
}

/**
 * 处理器类型枚举
 */
export enum HandlerType {
  COMMAND = 'Command',
  QUERY = 'Query',
  EVENT = 'Event',
  SAGA = 'Saga',
}

/**
 * 元数据键名映射
 */
export const METADATA_KEYS = {
  [DecoratorType.COMMAND_HANDLER]: COMMAND_HANDLER_METADATA,
  [DecoratorType.QUERY_HANDLER]: QUERY_HANDLER_METADATA,
  [DecoratorType.EVENT_HANDLER]: EVENT_HANDLER_METADATA,
  [DecoratorType.SAGA]: SAGA_METADATA,
  [DecoratorType.PERFORMANCE_MONITOR]: PERFORMANCE_MONITOR_METADATA,
  [DecoratorType.DATA_ISOLATION]: DATA_ISOLATION_METADATA,
  [DecoratorType.CACHE]: CACHE_METADATA,
  [DecoratorType.VALIDATION]: VALIDATION_METADATA,
  [DecoratorType.AUTHORIZATION]: AUTHORIZATION_METADATA,
  [DecoratorType.TRANSACTION]: TRANSACTION_METADATA,
  [DecoratorType.RETRY]: RETRY_METADATA,
  [DecoratorType.TIMEOUT]: TIMEOUT_METADATA,
  [DecoratorType.LOGGING]: LOGGING_METADATA,
  [DecoratorType.AUDIT]: AUDIT_METADATA,
  [DecoratorType.MULTI_TENANT]: MULTI_TENANT_METADATA,
  [DecoratorType.ASYNC_CONTEXT]: ASYNC_CONTEXT_METADATA,
  [DecoratorType.MIDDLEWARE]: MIDDLEWARE_METADATA,
  [DecoratorType.INTERCEPTOR]: INTERCEPTOR_METADATA,
} as const;

/**
 * 默认元数据值
 */
export const DEFAULT_METADATA_VALUES = {
  [DecoratorType.COMMAND_HANDLER]: {
    priority: 0,
    timeout: 30000, // 30秒
    retryCount: 3,
    retryDelay: 1000, // 1秒
    enableLogging: true,
    enableAudit: true,
    enablePerformanceMonitor: true,
    enableTransaction: true,
    enableValidation: true,
    enableAuthorization: true,
    enableMultiTenant: true,
    enableDataIsolation: true,
  },
  [DecoratorType.QUERY_HANDLER]: {
    priority: 0,
    timeout: 15000, // 15秒
    retryCount: 2,
    retryDelay: 500, // 0.5秒
    enableLogging: true,
    enableAudit: false,
    enablePerformanceMonitor: true,
    enableTransaction: false,
    enableValidation: true,
    enableAuthorization: true,
    enableMultiTenant: true,
    enableDataIsolation: true,
    enableCache: true,
    cacheExpiration: 300, // 5分钟
  },
  [DecoratorType.EVENT_HANDLER]: {
    priority: 0,
    timeout: 10000, // 10秒
    retryCount: 5,
    retryDelay: 2000, // 2秒
    enableLogging: true,
    enableAudit: true,
    enablePerformanceMonitor: true,
    enableTransaction: false,
    enableValidation: false,
    enableAuthorization: false,
    enableMultiTenant: true,
    enableDataIsolation: false,
    enableIdempotency: true,
    enableDeadLetterQueue: true,
  },
  [DecoratorType.SAGA]: {
    priority: 0,
    timeout: 60000, // 60秒
    retryCount: 3,
    retryDelay: 5000, // 5秒
    enableLogging: true,
    enableAudit: true,
    enablePerformanceMonitor: true,
    enableTransaction: true,
    enableValidation: true,
    enableAuthorization: true,
    enableMultiTenant: true,
    enableDataIsolation: true,
    enableCompensation: true,
    enableTimeout: true,
  },
} as const;

/**
 * 元数据版本
 */
export const METADATA_VERSION = '1.0.0' as const;

/**
 * 元数据命名空间
 */
export const METADATA_NAMESPACE = 'aiofix:core' as const;

/**
 * 获取完整的元数据键名
 *
 * @param decoratorType - 装饰器类型
 * @returns 完整的元数据键名
 */
export function getMetadataKey(decoratorType: DecoratorType): string {
  return `${METADATA_NAMESPACE}:${METADATA_KEYS[decoratorType]}`;
}

/**
 * 获取默认元数据值
 *
 * @param decoratorType - 装饰器类型
 * @returns 默认元数据值
 */
export function getDefaultMetadata(
  decoratorType: DecoratorType,
): Record<string, unknown> {
  return (
    DEFAULT_METADATA_VALUES[
      decoratorType as keyof typeof DEFAULT_METADATA_VALUES
    ] || {}
  );
}

/**
 * 检查是否为有效的装饰器类型
 *
 * @param type - 要检查的类型
 * @returns 如果为有效的装饰器类型则返回 true，否则返回 false
 */
export function isValidDecoratorType(type: string): type is DecoratorType {
  return Object.values(DecoratorType).includes(type as DecoratorType);
}

/**
 * 检查是否为有效的处理器类型
 *
 * @param type - 要检查的类型
 * @returns 如果为有效的处理器类型则返回 true，否则返回 false
 */
export function isValidHandlerType(type: string): type is HandlerType {
  return Object.values(HandlerType).includes(type as HandlerType);
}

/**
 * 获取装饰器类型对应的处理器类型
 *
 * @param decoratorType - 装饰器类型
 * @returns 处理器类型
 */
export function getHandlerType(
  decoratorType: DecoratorType,
): HandlerType | null {
  switch (decoratorType) {
    case DecoratorType.COMMAND_HANDLER:
      return HandlerType.COMMAND;
    case DecoratorType.QUERY_HANDLER:
      return HandlerType.QUERY;
    case DecoratorType.EVENT_HANDLER:
      return HandlerType.EVENT;
    case DecoratorType.SAGA:
      return HandlerType.SAGA;
    default:
      return null;
  }
}

/**
 * 获取所有支持的装饰器类型
 *
 * @returns 装饰器类型数组
 */
export function getAllDecoratorTypes(): DecoratorType[] {
  return Object.values(DecoratorType);
}

/**
 * 获取所有支持的处理器类型
 *
 * @returns 处理器类型数组
 */
export function getAllHandlerTypes(): HandlerType[] {
  return Object.values(HandlerType);
}
