/**
 * 错误处理接口定义
 *
 * 定义了统一的错误处理机制，包括异常分类、错误总线、异常过滤器等。
 * 支持企业级的错误处理、监控、报告和恢复策略。
 *
 * @description 错误处理接口定义
 * @since 1.0.0
 */

/**
 * 错误严重级别枚举
 */
export enum ErrorSeverity {
  /**
   * 低级别 - 不影响系统正常运行
   */
  LOW = 'LOW',

  /**
   * 中级别 - 可能影响部分功能
   */
  MEDIUM = 'MEDIUM',

  /**
   * 高级别 - 影响核心功能
   */
  HIGH = 'HIGH',

  /**
   * 严重级别 - 系统不可用
   */
  CRITICAL = 'CRITICAL',
}

/**
 * 错误类型枚举
 */
export enum ErrorType {
  /**
   * 业务逻辑错误
   */
  BUSINESS = 'BUSINESS',

  /**
   * 验证错误
   */
  VALIDATION = 'VALIDATION',

  /**
   * 认证错误
   */
  AUTHENTICATION = 'AUTHENTICATION',

  /**
   * 授权错误
   */
  AUTHORIZATION = 'AUTHORIZATION',

  /**
   * 数据访问错误
   */
  DATA_ACCESS = 'DATA_ACCESS',

  /**
   * 网络错误
   */
  NETWORK = 'NETWORK',

  /**
   * 系统错误
   */
  SYSTEM = 'SYSTEM',

  /**
   * 第三方服务错误
   */
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',

  /**
   * 配置错误
   */
  CONFIGURATION = 'CONFIGURATION',

  /**
   * 超时错误
   */
  TIMEOUT = 'TIMEOUT',

  /**
   * 资源不足错误
   */
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',

  /**
   * 未知错误
   */
  UNKNOWN = 'UNKNOWN',
}

/**
 * 错误分类接口
 */
export interface IErrorClassification {
  /**
   * 错误类型
   */
  type: ErrorType;

  /**
   * 错误严重级别
   */
  severity: ErrorSeverity;

  /**
   * 错误代码
   */
  code: string;

  /**
   * 错误消息
   */
  message: string;

  /**
   * 错误描述
   */
  description?: string;

  /**
   * 错误分类
   */
  category: string;

  /**
   * 是否可恢复
   */
  recoverable: boolean;

  /**
   * 是否应该重试
   */
  retryable: boolean;

  /**
   * 最大重试次数
   */
  maxRetries?: number;

  /**
   * 重试延迟（毫秒）
   */
  retryDelay?: number;

  /**
   * 错误标签
   */
  tags?: string[];

  /**
   * 错误元数据
   */
  metadata?: Record<string, unknown>;
}

/**
 * 错误上下文接口
 */
export interface IErrorContext {
  /**
   * 错误ID
   */
  errorId: string;

  /**
   * 租户ID
   */
  tenantId?: string;

  /**
   * 用户ID
   */
  userId?: string;

  /**
   * 组织ID
   */
  organizationId?: string;

  /**
   * 部门ID
   */
  departmentId?: string;

  /**
   * 请求ID
   */
  requestId?: string;

  /**
   * 关联ID
   */
  correlationId?: string;

  /**
   * 原因ID
   */
  causationId?: string;

  /**
   * 用户代理
   */
  userAgent?: string;

  /**
   * IP地址
   */
  ipAddress?: string;

  /**
   * 请求来源
   */
  source?: 'WEB' | 'API' | 'CLI' | 'SYSTEM';

  /**
   * 错误发生时间
   */
  timestamp: Date;

  /**
   * 错误堆栈信息
   */
  stack?: string;

  /**
   * 错误发生位置
   */
  location?: {
    file?: string;
    line?: number;
    column?: number;
    function?: string;
  };

  /**
   * 系统信息
   */
  systemInfo?: {
    nodeVersion?: string;
    platform?: string;
    arch?: string;
    memory?: {
      used: number;
      total: number;
      free: number;
    };
    cpu?: {
      usage: number;
      loadAverage: number[];
    };
  };

  /**
   * 自定义上下文数据
   */
  customData?: Record<string, unknown>;
}

/**
 * 错误信息接口
 */
export interface IErrorInfo {
  /**
   * 错误分类
   */
  classification: IErrorClassification;

  /**
   * 错误上下文
   */
  context: IErrorContext;

  /**
   * 原始错误
   */
  originalError: Error;

  /**
   * 错误处理状态
   */
  status: 'PENDING' | 'PROCESSING' | 'HANDLED' | 'FAILED';

  /**
   * 处理历史
   */
  processingHistory: IErrorProcessingStep[];

  /**
   * 创建时间
   */
  createdAt: Date;

  /**
   * 更新时间
   */
  updatedAt: Date;
}

/**
 * 错误处理步骤接口
 */
export interface IErrorProcessingStep {
  /**
   * 步骤ID
   */
  stepId: string;

  /**
   * 步骤名称
   */
  stepName: string;

  /**
   * 步骤类型
   */
  stepType:
    | 'CLASSIFICATION'
    | 'NOTIFICATION'
    | 'RECOVERY'
    | 'LOGGING'
    | 'MONITORING';

  /**
   * 执行时间
   */
  executedAt: Date;

  /**
   * 执行状态
   */
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';

  /**
   * 执行结果
   */
  result?: unknown;

  /**
   * 错误信息
   */
  error?: string;

  /**
   * 执行耗时（毫秒）
   */
  duration?: number;
}

/**
 * 错误处理器接口
 */
export interface IErrorHandler {
  /**
   * 处理器名称
   */
  readonly name: string;

  /**
   * 处理器优先级
   */
  readonly priority: number;

  /**
   * 处理器类型
   */
  readonly type: ErrorType;

  /**
   * 处理错误
   *
   * @param errorInfo - 错误信息
   * @returns 处理结果
   */
  handle(errorInfo: IErrorInfo): Promise<IErrorProcessingStep>;

  /**
   * 检查是否应该处理此错误
   *
   * @param errorInfo - 错误信息
   * @returns 如果应该处理则返回 true，否则返回 false
   */
  shouldHandle(errorInfo: IErrorInfo): boolean;

  /**
   * 检查是否支持此错误类型
   *
   * @param errorType - 错误类型
   * @returns 如果支持则返回 true，否则返回 false
   */
  supports(errorType: ErrorType): boolean;
}

/**
 * 错误分类器接口
 */
export interface IErrorClassifier {
  /**
   * 分类器名称
   */
  readonly name: string;

  /**
   * 分类器优先级
   */
  readonly priority: number;

  /**
   * 分类错误
   *
   * @param error - 原始错误
   * @param context - 错误上下文
   * @returns 错误分类
   */
  classify(error: Error, context: IErrorContext): Promise<IErrorClassification>;

  /**
   * 检查是否应该分类此错误
   *
   * @param error - 原始错误
   * @param context - 错误上下文
   * @returns 如果应该分类则返回 true，否则返回 false
   */
  shouldClassify(error: Error, context: IErrorContext): boolean;
}

/**
 * 错误通知器接口
 */
export interface IErrorNotifier {
  /**
   * 通知器名称
   */
  readonly name: string;

  /**
   * 通知器优先级
   */
  readonly priority: number;

  /**
   * 发送错误通知
   *
   * @param errorInfo - 错误信息
   * @returns 通知结果
   */
  notify(errorInfo: IErrorInfo): Promise<IErrorProcessingStep>;

  /**
   * 检查是否应该发送通知
   *
   * @param errorInfo - 错误信息
   * @returns 如果应该发送通知则返回 true，否则返回 false
   */
  shouldNotify(errorInfo: IErrorInfo): boolean;
}

/**
 * 错误恢复器接口
 */
export interface IErrorRecovery {
  /**
   * 恢复器名称
   */
  readonly name: string;

  /**
   * 恢复器优先级
   */
  readonly priority: number;

  /**
   * 尝试恢复错误
   *
   * @param errorInfo - 错误信息
   * @returns 恢复结果
   */
  recover(errorInfo: IErrorInfo): Promise<IErrorProcessingStep>;

  /**
   * 检查是否可以恢复此错误
   *
   * @param errorInfo - 错误信息
   * @returns 如果可以恢复则返回 true，否则返回 false
   */
  canRecover(errorInfo: IErrorInfo): boolean;
}

/**
 * 错误总线接口
 */
export interface IErrorBus {
  /**
   * 发布错误
   *
   * @param error - 原始错误
   * @param context - 错误上下文
   * @returns 错误信息
   */
  publish(error: Error, context?: Partial<IErrorContext>): Promise<IErrorInfo>;

  /**
   * 订阅错误处理
   *
   * @param handler - 错误处理器
   */
  subscribe(handler: IErrorHandler): void;

  /**
   * 取消订阅错误处理
   *
   * @param handlerName - 处理器名称
   */
  unsubscribe(handlerName: string): void;

  /**
   * 获取错误统计信息
   *
   * @returns 统计信息
   */
  getStatistics(): IErrorStatistics;

  /**
   * 启动错误总线
   */
  start(): Promise<void>;

  /**
   * 停止错误总线
   */
  stop(): Promise<void>;
}

/**
 * 错误统计信息接口
 */
export interface IErrorStatistics {
  /**
   * 总错误数
   */
  totalErrors: number;

  /**
   * 按类型统计
   */
  byType: Record<ErrorType, number>;

  /**
   * 按严重级别统计
   */
  bySeverity: Record<ErrorSeverity, number>;

  /**
   * 按租户统计
   */
  byTenant: Record<string, number>;

  /**
   * 按用户统计
   */
  byUser: Record<string, number>;

  /**
   * 按时间统计
   */
  byTime: {
    lastHour: number;
    lastDay: number;
    lastWeek: number;
    lastMonth: number;
  };

  /**
   * 处理统计
   */
  processing: {
    totalProcessed: number;
    successful: number;
    failed: number;
    averageProcessingTime: number;
  };

  /**
   * 恢复统计
   */
  recovery: {
    totalAttempts: number;
    successful: number;
    failed: number;
    successRate: number;
  };

  /**
   * 通知统计
   */
  notifications: {
    totalSent: number;
    successful: number;
    failed: number;
    successRate: number;
  };

  /**
   * 最后更新时间
   */
  lastUpdatedAt: Date;
}

/**
 * 异常过滤器接口
 */
export interface IExceptionFilter {
  /**
   * 过滤器名称
   */
  readonly name: string;

  /**
   * 过滤器优先级
   */
  readonly priority: number;

  /**
   * 捕获异常
   *
   * @param exception - 异常
   * @param context - 执行上下文
   * @returns 处理结果
   */
  catch(exception: Error, context: any): Promise<void>;

  /**
   * 检查是否应该捕获此异常
   *
   * @param exception - 异常
   * @param context - 执行上下文
   * @returns 如果应该捕获则返回 true，否则返回 false
   */
  shouldCatch(exception: Error, context: any): boolean;
}

/**
 * 错误配置接口
 */
export interface IErrorConfiguration {
  /**
   * 是否启用错误处理
   */
  enabled: boolean;

  /**
   * 是否启用错误分类
   */
  enableClassification: boolean;

  /**
   * 是否启用错误通知
   */
  enableNotification: boolean;

  /**
   * 是否启用错误恢复
   */
  enableRecovery: boolean;

  /**
   * 是否启用错误监控
   */
  enableMonitoring: boolean;

  /**
   * 错误处理超时时间（毫秒）
   */
  processingTimeout: number;

  /**
   * 最大重试次数
   */
  maxRetries: number;

  /**
   * 重试延迟（毫秒）
   */
  retryDelay: number;

  /**
   * 错误保留时间（毫秒）
   */
  retentionTime: number;

  /**
   * 错误批量处理大小
   */
  batchSize: number;

  /**
   * 错误批量处理间隔（毫秒）
   */
  batchInterval: number;

  /**
   * 自定义配置
   */
  customConfig?: Record<string, unknown>;
}
