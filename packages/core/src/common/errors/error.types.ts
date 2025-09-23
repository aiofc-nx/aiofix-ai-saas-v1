/**
 * 错误类型定义
 *
 * 定义了系统中使用的各种错误类型，包括业务错误、系统错误、验证错误等。
 * 提供类型安全的错误处理和分类机制。
 *
 * ## 业务规则
 *
 * ### 错误分类规则
 * - 业务错误：由业务逻辑引起的错误，通常可以恢复
 * - 系统错误：由系统问题引起的错误，通常需要系统管理员处理
 * - 验证错误：由数据验证失败引起的错误，通常可以修复
 * - 授权错误：由权限不足引起的错误，通常需要重新授权
 * - 网络错误：由网络问题引起的错误，通常可以重试
 *
 * ### 错误严重性规则
 * - CRITICAL：严重错误，系统无法继续运行
 * - HIGH：高优先级错误，影响核心功能
 * - MEDIUM：中等优先级错误，影响部分功能
 * - LOW：低优先级错误，不影响核心功能
 * - INFO：信息性错误，仅用于记录
 *
 * ### 错误代码规则
 * - 错误代码使用统一的格式：PREFIX-XXXX
 * - PREFIX 表示错误类别（如 BIZ、SYS、VAL 等）
 * - XXXX 表示具体的错误编号
 * - 错误代码应该是唯一的和可追溯的
 *
 * @description 错误类型定义
 * @since 1.0.0
 */

/**
 * 错误严重性枚举
 */
export enum ErrorSeverity {
  /**
   * 信息性错误
   */
  INFO = 'INFO',

  /**
   * 低优先级错误
   */
  LOW = 'LOW',

  /**
   * 中等优先级错误
   */
  MEDIUM = 'MEDIUM',

  /**
   * 高优先级错误
   */
  HIGH = 'HIGH',

  /**
   * 严重错误
   */
  CRITICAL = 'CRITICAL',
}

/**
 * 错误类别枚举
 */
export enum ErrorCategory {
  /**
   * 业务错误
   */
  BUSINESS = 'BUSINESS',

  /**
   * 系统错误
   */
  SYSTEM = 'SYSTEM',

  /**
   * 验证错误
   */
  VALIDATION = 'VALIDATION',

  /**
   * 授权错误
   */
  AUTHORIZATION = 'AUTHORIZATION',

  /**
   * 网络错误
   */
  NETWORK = 'NETWORK',

  /**
   * 数据库错误
   */
  DATABASE = 'DATABASE',

  /**
   * 外部服务错误
   */
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',

  /**
   * 配置错误
   */
  CONFIGURATION = 'CONFIGURATION',

  /**
   * 资源错误
   */
  RESOURCE = 'RESOURCE',

  /**
   * 未知错误
   */
  UNKNOWN = 'UNKNOWN',
}

/**
 * 错误代码前缀
 */
export enum ErrorCodePrefix {
  /**
   * 业务错误
   */
  BUSINESS = 'BIZ',

  /**
   * 系统错误
   */
  SYSTEM = 'SYS',

  /**
   * 验证错误
   */
  VALIDATION = 'VAL',

  /**
   * 授权错误
   */
  AUTHORIZATION = 'AUTH',

  /**
   * 网络错误
   */
  NETWORK = 'NET',

  /**
   * 数据库错误
   */
  DATABASE = 'DB',

  /**
   * 外部服务错误
   */
  EXTERNAL_SERVICE = 'EXT',

  /**
   * 配置错误
   */
  CONFIGURATION = 'CFG',

  /**
   * 资源错误
   */
  RESOURCE = 'RES',

  /**
   * 未知错误
   */
  UNKNOWN = 'UNK',
}

/**
 * 常见错误代码
 */
export enum CommonErrorCodes {
  // 业务错误 (BIZ-XXXX)
  BIZ_ENTITY_NOT_FOUND = 'BIZ-0001',
  BIZ_ENTITY_ALREADY_EXISTS = 'BIZ-0002',
  BIZ_OPERATION_NOT_ALLOWED = 'BIZ-0003',
  BIZ_BUSINESS_RULE_VIOLATION = 'BIZ-0004',
  BIZ_INSUFFICIENT_PERMISSIONS = 'BIZ-0005',
  BIZ_QUOTA_EXCEEDED = 'BIZ-0006',
  BIZ_OPERATION_TIMEOUT = 'BIZ-0007',
  BIZ_CONCURRENT_MODIFICATION = 'BIZ-0008',

  // 系统错误 (SYS-XXXX)
  SYS_INTERNAL_ERROR = 'SYS-0001',
  SYS_SERVICE_UNAVAILABLE = 'SYS-0002',
  SYS_OUT_OF_MEMORY = 'SYS-0003',
  SYS_DISK_FULL = 'SYS-0004',
  SYS_CPU_OVERLOAD = 'SYS-0005',
  SYS_NETWORK_ERROR = 'SYS-0006',
  SYS_FILE_SYSTEM_ERROR = 'SYS-0007',
  SYS_PROCESS_CRASH = 'SYS-0008',

  // 验证错误 (VAL-XXXX)
  VAL_INVALID_INPUT = 'VAL-0001',
  VAL_REQUIRED_FIELD_MISSING = 'VAL-0002',
  VAL_INVALID_FORMAT = 'VAL-0003',
  VAL_VALUE_OUT_OF_RANGE = 'VAL-0004',
  VAL_DUPLICATE_VALUE = 'VAL-0005',
  VAL_INVALID_REFERENCE = 'VAL-0006',
  VAL_CONSTRAINT_VIOLATION = 'VAL-0007',
  VAL_DATA_TYPE_MISMATCH = 'VAL-0008',

  // 授权错误 (AUTH-XXXX)
  AUTH_UNAUTHORIZED = 'AUTH-0001',
  AUTH_FORBIDDEN = 'AUTH-0002',
  AUTH_TOKEN_EXPIRED = 'AUTH-0003',
  AUTH_TOKEN_INVALID = 'AUTH-0004',
  AUTH_INSUFFICIENT_ROLE = 'AUTH-0005',
  AUTH_ACCOUNT_LOCKED = 'AUTH-0006',
  AUTH_ACCOUNT_DISABLED = 'AUTH-0007',
  AUTH_SESSION_EXPIRED = 'AUTH-0008',

  // 网络错误 (NET-XXXX)
  NET_CONNECTION_TIMEOUT = 'NET-0001',
  NET_CONNECTION_REFUSED = 'NET-0002',
  NET_DNS_RESOLUTION_FAILED = 'NET-0003',
  NET_SSL_HANDSHAKE_FAILED = 'NET-0004',
  NET_PROXY_ERROR = 'NET-0005',
  NET_FIREWALL_BLOCKED = 'NET-0006',
  NET_BANDWIDTH_EXCEEDED = 'NET-0007',
  NET_PACKET_LOSS = 'NET-0008',

  // 数据库错误 (DB-XXXX)
  DB_CONNECTION_FAILED = 'DB-0001',
  DB_QUERY_TIMEOUT = 'DB-0002',
  DB_DEADLOCK_DETECTED = 'DB-0003',
  DB_CONSTRAINT_VIOLATION = 'DB-0004',
  DB_TRANSACTION_FAILED = 'DB-0005',
  DB_SCHEMA_MISMATCH = 'DB-0006',
  DB_INDEX_CORRUPTION = 'DB-0007',
  DB_BACKUP_FAILED = 'DB-0008',

  // 外部服务错误 (EXT-XXXX)
  EXT_SERVICE_UNAVAILABLE = 'EXT-0001',
  EXT_API_RATE_LIMIT = 'EXT-0002',
  EXT_API_QUOTA_EXCEEDED = 'EXT-0003',
  EXT_SERVICE_TIMEOUT = 'EXT-0004',
  EXT_INVALID_RESPONSE = 'EXT-0005',
  EXT_AUTHENTICATION_FAILED = 'EXT-0006',
  EXT_PERMISSION_DENIED = 'EXT-0007',
  EXT_SERVICE_DEPRECATED = 'EXT-0008',

  // 配置错误 (CFG-XXXX)
  CFG_MISSING_CONFIG = 'CFG-0001',
  CFG_INVALID_CONFIG = 'CFG-0002',
  CFG_CONFIG_CONFLICT = 'CFG-0003',
  CFG_ENVIRONMENT_MISMATCH = 'CFG-0004',
  CFG_SECRET_NOT_FOUND = 'CFG-0005',
  CFG_PERMISSION_DENIED = 'CFG-0006',
  CFG_VALIDATION_FAILED = 'CFG-0007',
  CFG_LOAD_FAILED = 'CFG-0008',

  // 资源错误 (RES-XXXX)
  RES_FILE_NOT_FOUND = 'RES-0001',
  RES_FILE_ACCESS_DENIED = 'RES-0002',
  RES_FILE_CORRUPTED = 'RES-0003',
  RES_DISK_SPACE_INSUFFICIENT = 'RES-0004',
  RES_MEMORY_INSUFFICIENT = 'RES-0005',
  RES_CPU_RESOURCE_EXHAUSTED = 'RES-0006',
  RES_NETWORK_BANDWIDTH_INSUFFICIENT = 'RES-0007',
  RES_LICENSE_EXPIRED = 'RES-0008',

  // 未知错误 (UNK-XXXX)
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  UNK_UNKNOWN_ERROR = 'UNK-0001',
  UNK_UNEXPECTED_ERROR = 'UNK-0002',
  UNK_UNHANDLED_ERROR = 'UNK-0003',
  UNK_UNDEFINED_ERROR = 'UNK-0004',
}

/**
 * 系统错误代码
 */
export enum SystemErrorCodes {
  SYS_INTERNAL_ERROR = 'SYS-0001',
  SYS_SERVICE_UNAVAILABLE = 'SYS-0002',
  SYS_OUT_OF_MEMORY = 'SYS-0003',
  SYS_DISK_FULL = 'SYS-0004',
  SYS_CPU_OVERLOAD = 'SYS-0005',
  SYS_NETWORK_ERROR = 'SYS-0006',
  SYS_FILE_SYSTEM_ERROR = 'SYS-0007',
  SYS_PROCESS_CRASH = 'SYS-0008',
}

/**
 * 验证错误代码
 */
export enum ValidationErrorCodes {
  VAL_INVALID_INPUT = 'VAL-0001',
  VAL_REQUIRED_FIELD_MISSING = 'VAL-0002',
  VAL_INVALID_FORMAT = 'VAL-0003',
  VAL_VALUE_OUT_OF_RANGE = 'VAL-0004',
  VAL_DUPLICATE_VALUE = 'VAL-0005',
  VAL_INVALID_REFERENCE = 'VAL-0006',
  VAL_CONSTRAINT_VIOLATION = 'VAL-0007',
  VAL_DATA_TYPE_MISMATCH = 'VAL-0008',
}

/**
 * 授权错误代码
 */
export enum AuthorizationErrorCodes {
  AUTH_UNAUTHORIZED = 'AUTH-0001',
  AUTH_FORBIDDEN = 'AUTH-0002',
  AUTH_TOKEN_EXPIRED = 'AUTH-0003',
  AUTH_TOKEN_INVALID = 'AUTH-0004',
  AUTH_INSUFFICIENT_ROLE = 'AUTH-0005',
  AUTH_ACCOUNT_LOCKED = 'AUTH-0006',
  AUTH_ACCOUNT_DISABLED = 'AUTH-0007',
  AUTH_SESSION_EXPIRED = 'AUTH-0008',
}

/**
 * 网络错误代码
 */
export enum NetworkErrorCodes {
  NET_CONNECTION_TIMEOUT = 'NET-0001',
  NET_CONNECTION_REFUSED = 'NET-0002',
  NET_DNS_RESOLUTION_FAILED = 'NET-0003',
  NET_SSL_HANDSHAKE_FAILED = 'NET-0004',
  NET_PROXY_ERROR = 'NET-0005',
  NET_FIREWALL_BLOCKED = 'NET-0006',
  NET_BANDWIDTH_EXCEEDED = 'NET-0007',
  NET_PACKET_LOSS = 'NET-0008',
}

/**
 * 错误上下文接口
 */
export interface IErrorContext {
  /**
   * 错误发生的时间
   */
  timestamp: Date;

  /**
   * 错误发生的服务名称
   */
  serviceName?: string;

  /**
   * 错误发生的模块名称
   */
  moduleName?: string;

  /**
   * 错误发生的函数名称
   */
  functionName?: string;

  /**
   * 错误发生的文件路径
   */
  filePath?: string;

  /**
   * 错误发生的行号
   */
  lineNumber?: number;

  /**
   * 错误发生的列号
   */
  columnNumber?: number;

  /**
   * 错误发生的堆栈跟踪
   */
  stackTrace?: string;

  /**
   * 错误发生的请求 ID
   */
  requestId?: string;

  /**
   * 错误发生的用户 ID
   */
  userId?: string;

  /**
   * 错误发生的租户 ID
   */
  tenantId?: string;

  /**
   * 错误发生的组织 ID
   */
  organizationId?: string;

  /**
   * 错误发生的部门 ID
   */
  departmentId?: string;

  /**
   * 错误发生的关联 ID
   */
  correlationId?: string;

  /**
   * 错误发生的原因 ID
   */
  causationId?: string;

  /**
   * 错误发生的 IP 地址
   */
  ipAddress?: string;

  /**
   * 错误发生的用户代理
   */
  userAgent?: string;

  /**
   * 错误发生的请求来源
   */
  source?: 'WEB' | 'API' | 'CLI' | 'SYSTEM';

  /**
   * 错误发生的环境
   */
  environment?: 'development' | 'staging' | 'production';

  /**
   * 错误发生的版本
   */
  version?: string;

  /**
   * 错误发生的部署 ID
   */
  deploymentId?: string;

  /**
   * 错误发生的实例 ID
   */
  instanceId?: string;

  /**
   * 错误发生的区域
   */
  region?: string;

  /**
   * 错误发生的可用区
   */
  availabilityZone?: string;

  /**
   * 错误发生的自定义数据
   */
  customData?: Record<string, unknown>;
}

/**
 * 错误元数据接口
 */
export interface IErrorMetadata {
  /**
   * 错误代码
   */
  code: string;

  /**
   * 错误类别
   */
  category: ErrorCategory;

  /**
   * 错误严重性
   */
  severity: ErrorSeverity;

  /**
   * 错误是否可恢复
   */
  recoverable: boolean;

  /**
   * 错误是否可重试
   */
  retryable: boolean;

  /**
   * 错误重试延迟（毫秒）
   */
  retryDelay?: number;

  /**
   * 错误最大重试次数
   */
  maxRetries?: number;

  /**
   * 错误是否应该记录
   */
  loggable: boolean;

  /**
   * 错误是否应该告警
   */
  alertable: boolean;

  /**
   * 错误是否应该监控
   */
  monitorable: boolean;

  /**
   * 错误标签
   */
  tags?: string[];

  /**
   * 错误描述
   */
  description?: string;

  /**
   * 错误解决方案
   */
  solution?: string;

  /**
   * 错误文档链接
   */
  documentationUrl?: string;

  /**
   * 错误支持联系信息
   */
  supportContact?: string;
}

/**
 * 错误信息接口
 */
export interface IErrorInfo {
  /**
   * 错误消息
   */
  message: string;

  /**
   * 错误详细信息
   */
  details?: string;

  /**
   * 错误原因
   */
  cause?: string;

  /**
   * 错误建议
   */
  suggestion?: string;

  /**
   * 错误参数
   */
  parameters?: Record<string, unknown>;

  /**
   * 错误本地化信息
   */
  localization?: {
    [locale: string]: {
      message: string;
      details?: string;
      cause?: string;
      suggestion?: string;
    };
  };
}

/**
 * 错误类型检查函数
 */
export function isErrorSeverity(value: string): value is ErrorSeverity {
  return Object.values(ErrorSeverity).includes(value as ErrorSeverity);
}

export function isErrorCategory(value: string): value is ErrorCategory {
  return Object.values(ErrorCategory).includes(value as ErrorCategory);
}

export function isErrorCodePrefix(value: string): value is ErrorCodePrefix {
  return Object.values(ErrorCodePrefix).includes(value as ErrorCodePrefix);
}

export function isCommonErrorCode(value: string): value is CommonErrorCodes {
  return Object.values(CommonErrorCodes).includes(value as CommonErrorCodes);
}

/**
 * 错误代码工具函数
 */
export function getErrorCodePrefix(code: string): string {
  const parts = code.split('-');
  return parts.length > 0 ? parts[0] : '';
}

export function getErrorCodeNumber(code: string): string {
  const parts = code.split('-');
  return parts.length > 1 ? parts[1] : '';
}

export function getErrorCategoryFromCode(code: string): ErrorCategory {
  const prefix = getErrorCodePrefix(code);
  switch (prefix) {
    case ErrorCodePrefix.BUSINESS:
      return ErrorCategory.BUSINESS;
    case ErrorCodePrefix.SYSTEM:
      return ErrorCategory.SYSTEM;
    case ErrorCodePrefix.VALIDATION:
      return ErrorCategory.VALIDATION;
    case ErrorCodePrefix.AUTHORIZATION:
      return ErrorCategory.AUTHORIZATION;
    case ErrorCodePrefix.NETWORK:
      return ErrorCategory.NETWORK;
    case ErrorCodePrefix.DATABASE:
      return ErrorCategory.DATABASE;
    case ErrorCodePrefix.EXTERNAL_SERVICE:
      return ErrorCategory.EXTERNAL_SERVICE;
    case ErrorCodePrefix.CONFIGURATION:
      return ErrorCategory.CONFIGURATION;
    case ErrorCodePrefix.RESOURCE:
      return ErrorCategory.RESOURCE;
    default:
      return ErrorCategory.UNKNOWN;
  }
}

export function getErrorSeverityFromCategory(
  category: ErrorCategory,
): ErrorSeverity {
  switch (category) {
    case ErrorCategory.SYSTEM:
    case ErrorCategory.DATABASE:
      return ErrorSeverity.CRITICAL;
    case ErrorCategory.AUTHORIZATION:
    case ErrorCategory.EXTERNAL_SERVICE:
      return ErrorSeverity.HIGH;
    case ErrorCategory.BUSINESS:
    case ErrorCategory.VALIDATION:
    case ErrorCategory.NETWORK:
      return ErrorSeverity.MEDIUM;
    case ErrorCategory.CONFIGURATION:
    case ErrorCategory.RESOURCE:
      return ErrorSeverity.LOW;
    default:
      return ErrorSeverity.INFO;
  }
}
