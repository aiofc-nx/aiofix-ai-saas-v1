/**
 * 应用层异常基类
 *
 * 定义应用层异常的基础实现，应用层异常用于表示用例执行过程中的错误。
 * 应用层异常是领域异常向外部接口层的转换桥梁。
 *
 * @description 应用层异常基类为所有应用层异常提供统一的基础功能
 *
 * ## 业务规则
 *
 * ### 应用层异常职责规则
 * - 应用层异常表示用例执行过程中的错误
 * - 应用层异常应该包含足够的上下文信息
 * - 应用层异常应该提供用户友好的错误消息
 * - 应用层异常应该支持错误分类和处理策略
 *
 * ### 应用层异常转换规则
 * - 领域异常应该转换为应用层异常
 * - 基础设施异常应该转换为应用层异常
 * - 应用层异常应该隐藏技术实现细节
 * - 应用层异常应该提供业务相关的错误信息
 *
 * ### 应用层异常处理规则
 * - 应用层异常应该在用例边界被捕获
 * - 应用层异常应该记录详细的日志信息
 * - 应用层异常应该支持错误恢复策略
 * - 应用层异常应该提供错误诊断信息
 *
 * @example
 * ```typescript
 * export class UserCreationFailedException extends BaseApplicationException {
 *   constructor(reason: string, userId?: string, context: Record<string, unknown> = {}) {
 *     super(
 *       `用户创建失败: ${reason}`,
 *       'USER_CREATION_FAILED',
 *       ApplicationExceptionType.BUSINESS_LOGIC,
 *       { reason, userId, ...context },
 *       ApplicationExceptionSeverity.HIGH
 *     );
 *   }
 * }
 *
 * // 使用示例
 * try {
 *   const user = await createUserUseCase.execute(request);
 * } catch (error) {
 *   if (error instanceof UserCreationFailedException) {
 *     return { success: false, message: error.getUserFriendlyMessage() };
 *   }
 *   throw error;
 * }
 * ```
 *
 * @since 1.0.0
 */

/**
 * 应用层异常类型枚举
 */
export enum ApplicationExceptionType {
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  AUTHORIZATION = 'authorization',
  RESOURCE_NOT_FOUND = 'resource_not_found',
  CONCURRENCY = 'concurrency',
  EXTERNAL_SERVICE = 'external_service',
  CONFIGURATION = 'configuration',
  INFRASTRUCTURE = 'infrastructure',
}

/**
 * 应用层异常严重级别枚举
 */
export enum ApplicationExceptionSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * 应用层异常恢复策略枚举
 */
export enum ApplicationExceptionRecoveryStrategy {
  NONE = 'none',
  RETRY = 'retry',
  FALLBACK = 'fallback',
  COMPENSATE = 'compensate',
}

/**
 * 基础应用层异常类
 *
 * @description 所有应用层异常的基类，提供统一的异常处理机制
 */
export abstract class BaseApplicationException extends Error {
  /**
   * 异常代码
   */
  public readonly errorCode: string;

  /**
   * 异常类型
   */
  public readonly errorType: ApplicationExceptionType;

  /**
   * 异常严重级别
   */
  public readonly severity: ApplicationExceptionSeverity;

  /**
   * 异常上下文数据
   */
  public readonly context: Record<string, unknown>;

  /**
   * 异常发生时间
   */
  public readonly occurredAt: Date;

  /**
   * 异常ID
   */
  public readonly exceptionId: string;

  /**
   * 用例名称
   */
  public readonly useCaseName?: string;

  /**
   * 恢复策略
   */
  public readonly recoveryStrategy: ApplicationExceptionRecoveryStrategy;

  constructor(
    message: string,
    errorCode: string,
    errorType: ApplicationExceptionType,
    context: Record<string, unknown> = {},
    severity: ApplicationExceptionSeverity = ApplicationExceptionSeverity.MEDIUM,
    recoveryStrategy: ApplicationExceptionRecoveryStrategy = ApplicationExceptionRecoveryStrategy.NONE,
    useCaseName?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.errorCode = errorCode;
    this.errorType = errorType;
    this.severity = severity;
    this.context = { ...context };
    this.occurredAt = new Date();
    this.exceptionId = this.generateExceptionId();
    this.useCaseName = useCaseName;
    this.recoveryStrategy = recoveryStrategy;

    // 确保堆栈跟踪正确
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * 获取异常的业务标识符
   *
   * @returns 业务标识符字符串
   */
  getBusinessIdentifier(): string {
    return `${this.name}(${this.errorCode}, ${this.errorType})`;
  }

  /**
   * 转换为纯数据对象
   *
   * @returns 包含所有异常数据的纯对象
   */
  toData(): Record<string, unknown> {
    return {
      exceptionId: this.exceptionId,
      name: this.name,
      message: this.message,
      errorCode: this.errorCode,
      errorType: this.errorType,
      severity: this.severity,
      context: this.context,
      occurredAt: this.occurredAt,
      useCaseName: this.useCaseName,
      recoveryStrategy: this.recoveryStrategy,
      stack: this.stack,
    };
  }

  /**
   * 检查是否为指定类型的异常
   *
   * @param type - 异常类型
   * @returns 如果是指定类型返回true，否则返回false
   */
  isOfType(type: ApplicationExceptionType): boolean {
    return this.errorType === type;
  }

  /**
   * 检查是否为关键异常
   *
   * @returns 如果是关键异常返回true，否则返回false
   */
  isCritical(): boolean {
    return this.severity === ApplicationExceptionSeverity.CRITICAL;
  }

  /**
   * 检查是否支持重试
   *
   * @returns 如果支持重试返回true，否则返回false
   */
  isRetryable(): boolean {
    return this.recoveryStrategy === ApplicationExceptionRecoveryStrategy.RETRY;
  }

  /**
   * 获取用户友好的错误消息
   *
   * @description 子类可以重写此方法来提供用户友好的错误消息
   * @returns 用户友好的错误消息
   */
  getUserFriendlyMessage(): string {
    return this.message;
  }

  /**
   * 获取错误恢复建议
   *
   * @description 子类可以重写此方法来提供错误恢复建议
   * @returns 错误恢复建议
   */
  getRecoveryAdvice(): string {
    switch (this.recoveryStrategy) {
      case ApplicationExceptionRecoveryStrategy.RETRY:
        return '请稍后重试';
      case ApplicationExceptionRecoveryStrategy.FALLBACK:
        return '系统将使用备用方案';
      case ApplicationExceptionRecoveryStrategy.COMPENSATE:
        return '系统将执行补偿操作';
      default:
        return '请联系系统管理员';
    }
  }

  /**
   * 生成异常ID
   *
   * @returns 唯一的异常ID
   */
  private generateExceptionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 用例验证异常
 */
export class UseCaseValidationException extends BaseApplicationException {
  constructor(
    message: string,
    fieldName: string,
    fieldValue: unknown,
    useCaseName?: string,
    context: Record<string, unknown> = {},
  ) {
    super(
      message,
      `USE_CASE_VALIDATION_${fieldName.toUpperCase()}`,
      ApplicationExceptionType.VALIDATION,
      { fieldName, fieldValue, ...context },
      ApplicationExceptionSeverity.MEDIUM,
      ApplicationExceptionRecoveryStrategy.NONE,
      useCaseName,
    );
  }

  override getUserFriendlyMessage(): string {
    return `输入验证失败：${this.message}`;
  }
}

/**
 * 用例执行异常
 */
export class UseCaseExecutionException extends BaseApplicationException {
  constructor(
    message: string,
    useCaseName: string,
    originalError?: Error,
    context: Record<string, unknown> = {},
  ) {
    super(
      message,
      `USE_CASE_EXECUTION_${useCaseName.toUpperCase()}`,
      ApplicationExceptionType.BUSINESS_LOGIC,
      { originalError: originalError?.message, ...context },
      ApplicationExceptionSeverity.HIGH,
      ApplicationExceptionRecoveryStrategy.RETRY,
      useCaseName,
    );
  }

  override getUserFriendlyMessage(): string {
    return `操作执行失败：${this.message}`;
  }
}

/**
 * 权限拒绝异常
 */
export class PermissionDeniedException extends BaseApplicationException {
  constructor(
    message: string,
    requiredPermission: string,
    resource: string,
    useCaseName?: string,
    context: Record<string, unknown> = {},
  ) {
    super(
      message,
      `PERMISSION_DENIED_${requiredPermission.toUpperCase()}`,
      ApplicationExceptionType.AUTHORIZATION,
      { requiredPermission, resource, ...context },
      ApplicationExceptionSeverity.HIGH,
      ApplicationExceptionRecoveryStrategy.NONE,
      useCaseName,
    );
  }

  override getUserFriendlyMessage(): string {
    return `权限不足：${this.message}`;
  }
}

/**
 * 资源未找到异常
 */
export class ResourceNotFoundException extends BaseApplicationException {
  constructor(
    message: string,
    resourceType: string,
    resourceId: string,
    useCaseName?: string,
    context: Record<string, unknown> = {},
  ) {
    super(
      message,
      `RESOURCE_NOT_FOUND_${resourceType.toUpperCase()}`,
      ApplicationExceptionType.RESOURCE_NOT_FOUND,
      { resourceType, resourceId, ...context },
      ApplicationExceptionSeverity.MEDIUM,
      ApplicationExceptionRecoveryStrategy.NONE,
      useCaseName,
    );
  }

  override getUserFriendlyMessage(): string {
    return `资源不存在：${this.message}`;
  }
}

/**
 * 并发冲突异常
 */
export class ConcurrencyConflictException extends BaseApplicationException {
  constructor(
    message: string,
    resourceId: string,
    expectedVersion: number,
    actualVersion: number,
    useCaseName?: string,
    context: Record<string, unknown> = {},
  ) {
    super(
      message,
      'CONCURRENCY_CONFLICT',
      ApplicationExceptionType.CONCURRENCY,
      { resourceId, expectedVersion, actualVersion, ...context },
      ApplicationExceptionSeverity.HIGH,
      ApplicationExceptionRecoveryStrategy.RETRY,
      useCaseName,
    );
  }

  override getUserFriendlyMessage(): string {
    return `数据已被其他用户修改，请刷新后重试`;
  }
}

/**
 * 外部服务异常
 */
export class ExternalServiceException extends BaseApplicationException {
  constructor(
    message: string,
    serviceName: string,
    operation: string,
    useCaseName?: string,
    context: Record<string, unknown> = {},
  ) {
    super(
      message,
      `EXTERNAL_SERVICE_${serviceName.toUpperCase()}_${operation.toUpperCase()}`,
      ApplicationExceptionType.EXTERNAL_SERVICE,
      { serviceName, operation, ...context },
      ApplicationExceptionSeverity.HIGH,
      ApplicationExceptionRecoveryStrategy.FALLBACK,
      useCaseName,
    );
  }

  override getUserFriendlyMessage(): string {
    return `外部服务暂时不可用，请稍后重试`;
  }
}
