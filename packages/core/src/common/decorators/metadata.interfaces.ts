/**
 * 装饰器元数据接口
 *
 * 定义了所有 CQRS 装饰器使用的元数据接口。
 * 这些接口用于类型安全的元数据存储和检索。
 *
 * ## 业务规则
 *
 * ### 接口设计规则
 * - 所有元数据接口都继承自基础接口
 * - 接口属性使用可选类型，支持渐进式配置
 * - 接口提供默认值和验证逻辑
 *
 * ### 类型安全规则
 * - 使用 TypeScript 泛型确保类型安全
 * - 接口属性使用字面量类型
 * - 支持编译时类型检查
 *
 * ### 扩展性规则
 * - 接口设计支持未来扩展
 * - 新属性可以添加到现有接口
 * - 支持向后兼容的接口演化
 *
 * @description 装饰器元数据接口定义
 * @since 1.0.0
 */
import { DecoratorType, HandlerType } from './metadata.constants';

/**
 * 基础元数据接口
 */
export interface IBaseMetadata {
  /**
   * 装饰器类型
   */
  decoratorType: DecoratorType;

  /**
   * 元数据版本
   */
  version: string;

  /**
   * 创建时间
   */
  createdAt: Date;

  /**
   * 是否启用
   */
  enabled: boolean;

  /**
   * 优先级（数值越小优先级越高）
   */
  priority: number;

  /**
   * 超时时间（毫秒）
   */
  timeout?: number;

  /**
   * 是否启用日志记录
   */
  enableLogging?: boolean;

  /**
   * 是否启用审计
   */
  enableAudit?: boolean;

  /**
   * 是否启用性能监控
   */
  enablePerformanceMonitor?: boolean;

  /**
   * 自定义配置
   */
  customConfig?: Record<string, unknown>;
}

/**
 * 重试配置接口
 */
export interface IRetryConfig {
  /**
   * 最大重试次数
   */
  maxRetries: number;

  /**
   * 重试延迟时间（毫秒）
   */
  retryDelay: number;

  /**
   * 重试延迟增长因子
   */
  backoffMultiplier?: number;

  /**
   * 最大重试延迟时间（毫秒）
   */
  maxRetryDelay?: number;

  /**
   * 重试条件函数
   */
  retryCondition?: (error: Error) => boolean;
}

/**
 * 缓存配置接口
 */
export interface ICacheConfig {
  /**
   * 缓存键生成器
   */
  keyGenerator?: (args: unknown[]) => string;

  /**
   * 缓存过期时间（秒）
   */
  expiration?: number;

  /**
   * 缓存条件函数
   */
  cacheCondition?: (args: unknown[]) => boolean;

  /**
   * 缓存失效条件函数
   */
  invalidateCondition?: (args: unknown[]) => boolean;
}

/**
 * 验证配置接口
 */
export interface IValidationConfig {
  /**
   * 验证规则
   */
  rules?: Record<string, unknown>;

  /**
   * 验证组
   */
  groups?: string[];

  /**
   * 是否跳过验证
   */
  skipValidation?: boolean;

  /**
   * 自定义验证器
   */
  customValidators?: Array<(value: unknown) => boolean>;
}

/**
 * 授权配置接口
 */
export interface IAuthorizationConfig {
  /**
   * 需要的权限
   */
  permissions?: string[];

  /**
   * 需要的角色
   */
  roles?: string[];

  /**
   * 授权策略
   */
  policy?: string;

  /**
   * 是否跳过授权
   */
  skipAuthorization?: boolean;

  /**
   * 自定义授权检查器
   */
  customAuthorizer?: (context: unknown) => Promise<boolean>;
}

/**
 * 事务配置接口
 */
export interface ITransactionConfig {
  /**
   * 事务传播行为
   */
  propagation?:
    | 'REQUIRED'
    | 'REQUIRES_NEW'
    | 'SUPPORTS'
    | 'NOT_SUPPORTED'
    | 'NEVER'
    | 'MANDATORY'
    | 'NESTED';

  /**
   * 事务隔离级别
   */
  isolation?:
    | 'READ_UNCOMMITTED'
    | 'READ_COMMITTED'
    | 'REPEATABLE_READ'
    | 'SERIALIZABLE';

  /**
   * 事务超时时间（秒）
   */
  timeout?: number;

  /**
   * 只读事务
   */
  readOnly?: boolean;

  /**
   * 回滚异常类型
   */
  rollbackFor?: Array<new (...args: unknown[]) => Error>;

  /**
   * 不回滚异常类型
   */
  noRollbackFor?: Array<new (...args: unknown[]) => Error>;
}

/**
 * 多租户配置接口
 */
export interface IMultiTenantConfig {
  /**
   * 租户标识符来源
   */
  tenantSource?: 'header' | 'parameter' | 'context' | 'custom';

  /**
   * 租户标识符键名
   */
  tenantKey?: string;

  /**
   * 租户解析器
   */
  tenantResolver?: (context: unknown) => Promise<string>;

  /**
   * 是否启用租户隔离
   */
  enableIsolation?: boolean;

  /**
   * 默认租户标识符
   */
  defaultTenant?: string;
}

/**
 * 数据隔离配置接口
 */
export interface IDataIsolationConfig {
  /**
   * 隔离级别
   */
  level?: 'TENANT' | 'ORGANIZATION' | 'DEPARTMENT' | 'PERSONAL' | 'PUBLIC';

  /**
   * 数据敏感性
   */
  sensitivity?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';

  /**
   * 隔离策略
   */
  strategy?: 'AUTO' | 'MANUAL' | 'CUSTOM';

  /**
   * 自定义隔离器
   */
  customIsolator?: (context: unknown) => Promise<string>;
}

/**
 * 性能监控配置接口
 */
export interface IPerformanceMonitorConfig {
  /**
   * 监控指标
   */
  metrics?: string[];

  /**
   * 监控阈值
   */
  thresholds?: Record<string, number>;

  /**
   * 是否启用详细监控
   */
  enableDetailedMonitoring?: boolean;

  /**
   * 监控数据收集器
   */
  metricsCollector?: (data: unknown) => Promise<void>;

  /**
   * 性能告警器
   */
  alertHandler?: (alert: unknown) => Promise<void>;
}

/**
 * 命令处理器元数据接口
 */
export interface ICommandHandlerMetadata extends IBaseMetadata {
  /**
   * 命令类型
   */
  commandType: string;

  /**
   * 处理器类型
   */
  handlerType: HandlerType.COMMAND;

  /**
   * 重试配置
   */
  retry?: IRetryConfig;

  /**
   * 验证配置
   */
  validation?: IValidationConfig;

  /**
   * 授权配置
   */
  authorization?: IAuthorizationConfig;

  /**
   * 事务配置
   */
  transaction?: ITransactionConfig;

  /**
   * 多租户配置
   */
  multiTenant?: IMultiTenantConfig;

  /**
   * 数据隔离配置
   */
  dataIsolation?: IDataIsolationConfig;

  /**
   * 性能监控配置
   */
  performanceMonitor?: IPerformanceMonitorConfig;
}

/**
 * 查询处理器元数据接口
 */
export interface IQueryHandlerMetadata extends IBaseMetadata {
  /**
   * 查询类型
   */
  queryType: string;

  /**
   * 处理器类型
   */
  handlerType: HandlerType.QUERY;

  /**
   * 重试配置
   */
  retry?: IRetryConfig;

  /**
   * 缓存配置
   */
  cache?: ICacheConfig;

  /**
   * 验证配置
   */
  validation?: IValidationConfig;

  /**
   * 授权配置
   */
  authorization?: IAuthorizationConfig;

  /**
   * 多租户配置
   */
  multiTenant?: IMultiTenantConfig;

  /**
   * 数据隔离配置
   */
  dataIsolation?: IDataIsolationConfig;

  /**
   * 性能监控配置
   */
  performanceMonitor?: IPerformanceMonitorConfig;
}

/**
 * 事件处理器元数据接口
 */
export interface IEventHandlerMetadata extends IBaseMetadata {
  /**
   * 事件类型
   */
  eventType: string;

  /**
   * 处理器类型
   */
  handlerType: HandlerType.EVENT;

  /**
   * 重试配置
   */
  retry?: IRetryConfig;

  /**
   * 多租户配置
   */
  multiTenant?: IMultiTenantConfig;

  /**
   * 性能监控配置
   */
  performanceMonitor?: IPerformanceMonitorConfig;

  /**
   * 是否启用幂等性
   */
  enableIdempotency?: boolean;

  /**
   * 是否启用死信队列
   */
  enableDeadLetterQueue?: boolean;

  /**
   * 事件排序键
   */
  orderingKey?: string;

  /**
   * 事件过滤器
   */
  eventFilter?: (event: unknown) => boolean;
}

/**
 * Saga 元数据接口
 */
export interface ISagaMetadata extends IBaseMetadata {
  /**
   * Saga 类型
   */
  sagaType: string;

  /**
   * 处理器类型
   */
  handlerType: HandlerType.SAGA;

  /**
   * 重试配置
   */
  retry?: IRetryConfig;

  /**
   * 验证配置
   */
  validation?: IValidationConfig;

  /**
   * 授权配置
   */
  authorization?: IAuthorizationConfig;

  /**
   * 事务配置
   */
  transaction?: ITransactionConfig;

  /**
   * 多租户配置
   */
  multiTenant?: IMultiTenantConfig;

  /**
   * 数据隔离配置
   */
  dataIsolation?: IDataIsolationConfig;

  /**
   * 性能监控配置
   */
  performanceMonitor?: IPerformanceMonitorConfig;

  /**
   * 是否启用补偿机制
   */
  enableCompensation?: boolean;

  /**
   * 是否启用超时处理
   */
  enableTimeout?: boolean;

  /**
   * Saga 超时时间（毫秒）
   */
  sagaTimeout?: number;

  /**
   * 补偿超时时间（毫秒）
   */
  compensationTimeout?: number;
}

/**
 * 联合元数据类型
 */
export type IMetadata =
  | ICommandHandlerMetadata
  | IQueryHandlerMetadata
  | IEventHandlerMetadata
  | ISagaMetadata;

/**
 * 元数据构建器接口
 */
export interface IMetadataBuilder<T extends IMetadata = IMetadata> {
  /**
   * 设置优先级
   */
  withPriority(priority: number): IMetadataBuilder<T>;

  /**
   * 设置超时时间
   */
  withTimeout(timeout: number): IMetadataBuilder<T>;

  /**
   * 设置重试配置
   */
  withRetry(config: IRetryConfig): IMetadataBuilder<T>;

  /**
   * 设置缓存配置
   */
  withCache(config: ICacheConfig): IMetadataBuilder<T>;

  /**
   * 设置验证配置
   */
  withValidation(config: IValidationConfig): IMetadataBuilder<T>;

  /**
   * 设置授权配置
   */
  withAuthorization(config: IAuthorizationConfig): IMetadataBuilder<T>;

  /**
   * 设置事务配置
   */
  withTransaction(config: ITransactionConfig): IMetadataBuilder<T>;

  /**
   * 设置多租户配置
   */
  withMultiTenant(config: IMultiTenantConfig): IMetadataBuilder<T>;

  /**
   * 设置数据隔离配置
   */
  withDataIsolation(config: IDataIsolationConfig): IMetadataBuilder<T>;

  /**
   * 设置性能监控配置
   */
  withPerformanceMonitor(
    config: IPerformanceMonitorConfig,
  ): IMetadataBuilder<T>;

  /**
   * 设置自定义配置
   */
  withCustomConfig(config: Record<string, unknown>): IMetadataBuilder<T>;

  /**
   * 构建元数据
   */
  build(): T;
}
