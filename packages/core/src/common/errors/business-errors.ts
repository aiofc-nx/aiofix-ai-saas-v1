/**
 * 业务错误类定义
 *
 * 定义了系统中常见的业务错误类，包括实体操作、业务规则验证等错误。
 * 这些错误类提供了具体的错误消息和上下文信息。
 *
 * ## 业务规则
 *
 * ### 实体错误规则
 * - 实体不存在错误：当请求的实体不存在时抛出
 * - 实体已存在错误：当尝试创建已存在的实体时抛出
 * - 实体状态错误：当实体状态不允许执行操作时抛出
 *
 * ### 业务规则错误规则
 * - 业务规则违反错误：当业务规则被违反时抛出
 * - 操作不允许错误：当操作不被允许时抛出
 * - 权限不足错误：当用户权限不足时抛出
 *
 * ### 配额和限制错误规则
 * - 配额超限错误：当资源配额超限时抛出
 * - 操作超时错误：当操作超时时抛出
 * - 并发修改错误：当并发修改冲突时抛出
 *
 * @description 业务错误类定义
 * @since 1.0.0
 */
import { BusinessError } from './base-error';
import { IErrorContext, IErrorMetadata, IErrorInfo } from './error.types';
import { CommonErrorCodes, ErrorSeverity } from './error.types';

/**
 * 实体不存在错误
 */
export class EntityNotFoundError extends BusinessError {
  constructor(
    entityType: string,
    entityId: string,
    context?: Partial<IErrorContext>,
  ) {
    const message = `${entityType} with ID '${entityId}' not found`;
    const metadata: Partial<IErrorMetadata> = {
      code: CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
      retryable: false,
      loggable: true,
      alertable: false,
      monitorable: true,
      tags: ['entity', 'not-found', entityType.toLowerCase()],
      description: `The requested ${entityType.toLowerCase()} does not exist`,
      solution: 'Verify the entity ID and try again',
    };
    const info: Partial<IErrorInfo> = {
      message,
      details: `Entity type: ${entityType}, Entity ID: ${entityId}`,
      cause: 'The entity may have been deleted or the ID may be incorrect',
      suggestion: 'Check if the entity exists and verify the ID format',
      parameters: {
        entityType,
        entityId,
      },
      localization: {
        'zh-CN': {
          message: `未找到 ${entityType}，ID: '${entityId}'`,
          details: `实体类型: ${entityType}, 实体ID: ${entityId}`,
          cause: '实体可能已被删除或ID可能不正确',
          suggestion: '检查实体是否存在并验证ID格式',
        },
      },
    };
    super(
      message,
      CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
      ErrorSeverity.MEDIUM,
      metadata,
      context,
      info,
    );
  }
}

/**
 * 实体已存在错误
 */
export class EntityAlreadyExistsError extends BusinessError {
  constructor(
    entityType: string,
    entityId: string,
    context?: Partial<IErrorContext>,
  ) {
    const message = `${entityType} with ID '${entityId}' already exists`;
    const metadata: Partial<IErrorMetadata> = {
      code: CommonErrorCodes.BIZ_ENTITY_ALREADY_EXISTS,
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
      retryable: false,
      loggable: true,
      alertable: false,
      monitorable: true,
      tags: ['entity', 'already-exists', entityType.toLowerCase()],
      description: `The ${entityType.toLowerCase()} already exists`,
      solution: 'Use a different ID or update the existing entity',
    };
    const info: Partial<IErrorInfo> = {
      message,
      details: `Entity type: ${entityType}, Entity ID: ${entityId}`,
      cause: 'An entity with this ID already exists in the system',
      suggestion: 'Choose a different ID or update the existing entity',
      parameters: {
        entityType,
        entityId,
      },
      localization: {
        'zh-CN': {
          message: `${entityType} 已存在，ID: '${entityId}'`,
          details: `实体类型: ${entityType}, 实体ID: ${entityId}`,
          cause: '系统中已存在具有此ID的实体',
          suggestion: '选择不同的ID或更新现有实体',
        },
      },
    };
    super(
      message,
      CommonErrorCodes.BIZ_ENTITY_ALREADY_EXISTS,
      ErrorSeverity.MEDIUM,
      metadata,
      context,
      info,
    );
  }
}

/**
 * 操作不允许错误
 */
export class OperationNotAllowedError extends BusinessError {
  constructor(
    operation: string,
    entityType: string,
    reason?: string,
    context?: Partial<IErrorContext>,
  ) {
    const message = `Operation '${operation}' is not allowed on ${entityType}${reason ? `: ${reason}` : ''}`;
    const metadata: Partial<IErrorMetadata> = {
      code: CommonErrorCodes.BIZ_OPERATION_NOT_ALLOWED,
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
      retryable: false,
      loggable: true,
      alertable: false,
      monitorable: true,
      tags: ['operation', 'not-allowed', entityType.toLowerCase()],
      description: `The operation is not allowed on this ${entityType.toLowerCase()}`,
      solution: 'Check the entity state and permissions',
    };
    const info: Partial<IErrorInfo> = {
      message,
      details: `Operation: ${operation}, Entity type: ${entityType}${reason ? `, Reason: ${reason}` : ''}`,
      cause: 'The entity state or permissions do not allow this operation',
      suggestion: 'Verify the entity state and user permissions',
      parameters: {
        operation,
        entityType,
        reason,
      },
      localization: {
        'zh-CN': {
          message: `不允许对 ${entityType} 执行操作 '${operation}'${reason ? `: ${reason}` : ''}`,
          details: `操作: ${operation}, 实体类型: ${entityType}${reason ? `, 原因: ${reason}` : ''}`,
          cause: '实体状态或权限不允许此操作',
          suggestion: '验证实体状态和用户权限',
        },
      },
    };
    super(
      message,
      CommonErrorCodes.BIZ_OPERATION_NOT_ALLOWED,
      ErrorSeverity.MEDIUM,
      metadata,
      context,
      info,
    );
  }
}

/**
 * 业务规则违反错误
 */
export class BusinessRuleViolationError extends BusinessError {
  constructor(
    ruleName: string,
    ruleDescription: string,
    context?: Partial<IErrorContext>,
  ) {
    const message = `Business rule violation: ${ruleName}`;
    const metadata: Partial<IErrorMetadata> = {
      code: CommonErrorCodes.BIZ_BUSINESS_RULE_VIOLATION,
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
      retryable: false,
      loggable: true,
      alertable: false,
      monitorable: true,
      tags: ['business-rule', 'violation', ruleName.toLowerCase()],
      description: 'A business rule has been violated',
      solution: 'Review the business rule and correct the input',
    };
    const info: Partial<IErrorInfo> = {
      message,
      details: `Rule: ${ruleName}, Description: ${ruleDescription}`,
      cause: 'The operation violates a business rule',
      suggestion: 'Review the business rule and adjust the operation',
      parameters: {
        ruleName,
        ruleDescription,
      },
      localization: {
        'zh-CN': {
          message: `业务规则违反: ${ruleName}`,
          details: `规则: ${ruleName}, 描述: ${ruleDescription}`,
          cause: '操作违反了业务规则',
          suggestion: '审查业务规则并调整操作',
        },
      },
    };
    super(
      message,
      CommonErrorCodes.BIZ_BUSINESS_RULE_VIOLATION,
      ErrorSeverity.MEDIUM,
      metadata,
      context,
      info,
    );
  }
}

/**
 * 权限不足错误
 */
export class InsufficientPermissionsError extends BusinessError {
  constructor(
    operation: string,
    requiredPermissions: string[],
    context?: Partial<IErrorContext>,
  ) {
    const message = `Insufficient permissions for operation '${operation}'`;
    const metadata: Partial<IErrorMetadata> = {
      code: CommonErrorCodes.BIZ_INSUFFICIENT_PERMISSIONS,
      severity: ErrorSeverity.HIGH,
      recoverable: true,
      retryable: false,
      loggable: true,
      alertable: true,
      monitorable: true,
      tags: ['permissions', 'insufficient', operation.toLowerCase()],
      description: 'The user does not have sufficient permissions',
      solution: 'Grant the required permissions to the user',
    };
    const info: Partial<IErrorInfo> = {
      message,
      details: `Operation: ${operation}, Required permissions: ${requiredPermissions.join(', ')}`,
      cause: 'The user lacks the necessary permissions for this operation',
      suggestion: 'Contact an administrator to grant the required permissions',
      parameters: {
        operation,
        requiredPermissions,
      },
      localization: {
        'zh-CN': {
          message: `操作 '${operation}' 权限不足`,
          details: `操作: ${operation}, 所需权限: ${requiredPermissions.join(', ')}`,
          cause: '用户缺少执行此操作的必要权限',
          suggestion: '联系管理员授予所需权限',
        },
      },
    };
    super(
      message,
      CommonErrorCodes.BIZ_INSUFFICIENT_PERMISSIONS,
      ErrorSeverity.HIGH,
      metadata,
      context,
      info,
    );
  }
}

/**
 * 配额超限错误
 */
export class QuotaExceededError extends BusinessError {
  constructor(
    resourceType: string,
    currentUsage: number,
    quotaLimit: number,
    context?: Partial<IErrorContext>,
  ) {
    const message = `Quota exceeded for ${resourceType}: ${currentUsage}/${quotaLimit}`;
    const metadata: Partial<IErrorMetadata> = {
      code: CommonErrorCodes.BIZ_QUOTA_EXCEEDED,
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
      retryable: false,
      loggable: true,
      alertable: true,
      monitorable: true,
      tags: ['quota', 'exceeded', resourceType.toLowerCase()],
      description: 'The resource quota has been exceeded',
      solution: 'Upgrade the quota or reduce resource usage',
    };
    const info: Partial<IErrorInfo> = {
      message,
      details: `Resource type: ${resourceType}, Current usage: ${currentUsage}, Quota limit: ${quotaLimit}`,
      cause: 'The resource usage has exceeded the allocated quota',
      suggestion: 'Consider upgrading the quota or optimizing resource usage',
      parameters: {
        resourceType,
        currentUsage,
        quotaLimit,
      },
      localization: {
        'zh-CN': {
          message: `${resourceType} 配额超限: ${currentUsage}/${quotaLimit}`,
          details: `资源类型: ${resourceType}, 当前使用: ${currentUsage}, 配额限制: ${quotaLimit}`,
          cause: '资源使用量已超过分配的配额',
          suggestion: '考虑升级配额或优化资源使用',
        },
      },
    };
    super(
      message,
      CommonErrorCodes.BIZ_QUOTA_EXCEEDED,
      ErrorSeverity.MEDIUM,
      metadata,
      context,
      info,
    );
  }
}

/**
 * 操作超时错误
 */
export class OperationTimeoutError extends BusinessError {
  constructor(
    operation: string,
    timeoutMs: number,
    context?: Partial<IErrorContext>,
  ) {
    const message = `Operation '${operation}' timed out after ${timeoutMs}ms`;
    const metadata: Partial<IErrorMetadata> = {
      code: CommonErrorCodes.BIZ_OPERATION_TIMEOUT,
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
      retryable: true,
      retryDelay: 1000,
      maxRetries: 3,
      loggable: true,
      alertable: false,
      monitorable: true,
      tags: ['operation', 'timeout', operation.toLowerCase()],
      description: 'The operation exceeded the timeout limit',
      solution: 'Retry the operation or increase the timeout',
    };
    const info: Partial<IErrorInfo> = {
      message,
      details: `Operation: ${operation}, Timeout: ${timeoutMs}ms`,
      cause: 'The operation took longer than the allowed timeout',
      suggestion:
        'Retry the operation or contact support if the issue persists',
      parameters: {
        operation,
        timeoutMs,
      },
      localization: {
        'zh-CN': {
          message: `操作 '${operation}' 超时，耗时 ${timeoutMs}ms`,
          details: `操作: ${operation}, 超时时间: ${timeoutMs}ms`,
          cause: '操作耗时超过了允许的超时时间',
          suggestion: '重试操作或如果问题持续存在请联系支持',
        },
      },
    };
    super(
      message,
      CommonErrorCodes.BIZ_OPERATION_TIMEOUT,
      ErrorSeverity.MEDIUM,
      metadata,
      context,
      info,
    );
  }
}

/**
 * 并发修改错误
 */
export class ConcurrentModificationError extends BusinessError {
  constructor(
    entityType: string,
    entityId: string,
    expectedVersion: number,
    actualVersion: number,
    context?: Partial<IErrorContext>,
  ) {
    const message = `Concurrent modification detected for ${entityType} '${entityId}'`;
    const metadata: Partial<IErrorMetadata> = {
      code: CommonErrorCodes.BIZ_CONCURRENT_MODIFICATION,
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
      retryable: true,
      retryDelay: 100,
      maxRetries: 5,
      loggable: true,
      alertable: false,
      monitorable: true,
      tags: ['concurrent', 'modification', entityType.toLowerCase()],
      description: 'A concurrent modification was detected',
      solution: 'Retry the operation with the latest version',
    };
    const info: Partial<IErrorInfo> = {
      message,
      details: `Entity type: ${entityType}, Entity ID: ${entityId}, Expected version: ${expectedVersion}, Actual version: ${actualVersion}`,
      cause: 'The entity was modified by another process',
      suggestion: 'Refresh the entity and retry the operation',
      parameters: {
        entityType,
        entityId,
        expectedVersion,
        actualVersion,
      },
      localization: {
        'zh-CN': {
          message: `检测到 ${entityType} '${entityId}' 的并发修改`,
          details: `实体类型: ${entityType}, 实体ID: ${entityId}, 期望版本: ${expectedVersion}, 实际版本: ${actualVersion}`,
          cause: '实体被另一个进程修改',
          suggestion: '刷新实体并重试操作',
        },
      },
    };
    super(
      message,
      CommonErrorCodes.BIZ_CONCURRENT_MODIFICATION,
      ErrorSeverity.MEDIUM,
      metadata,
      context,
      info,
    );
  }
}

/**
 * 业务错误工厂类
 */
export class BusinessErrorFactory {
  /**
   * 创建实体不存在错误
   */
  public static createEntityNotFoundError(
    entityType: string,
    entityId: string,
    context?: Partial<IErrorContext>,
  ): EntityNotFoundError {
    return new EntityNotFoundError(entityType, entityId, context);
  }

  /**
   * 创建实体已存在错误
   */
  public static createEntityAlreadyExistsError(
    entityType: string,
    entityId: string,
    context?: Partial<IErrorContext>,
  ): EntityAlreadyExistsError {
    return new EntityAlreadyExistsError(entityType, entityId, context);
  }

  /**
   * 创建操作不允许错误
   */
  public static createOperationNotAllowedError(
    operation: string,
    entityType: string,
    reason?: string,
    context?: Partial<IErrorContext>,
  ): OperationNotAllowedError {
    return new OperationNotAllowedError(operation, entityType, reason, context);
  }

  /**
   * 创建业务规则违反错误
   */
  public static createBusinessRuleViolationError(
    ruleName: string,
    ruleDescription: string,
    context?: Partial<IErrorContext>,
  ): BusinessRuleViolationError {
    return new BusinessRuleViolationError(ruleName, ruleDescription, context);
  }

  /**
   * 创建权限不足错误
   */
  public static createInsufficientPermissionsError(
    operation: string,
    requiredPermissions: string[],
    context?: Partial<IErrorContext>,
  ): InsufficientPermissionsError {
    return new InsufficientPermissionsError(
      operation,
      requiredPermissions,
      context,
    );
  }

  /**
   * 创建配额超限错误
   */
  public static createQuotaExceededError(
    resourceType: string,
    currentUsage: number,
    quotaLimit: number,
    context?: Partial<IErrorContext>,
  ): QuotaExceededError {
    return new QuotaExceededError(
      resourceType,
      currentUsage,
      quotaLimit,
      context,
    );
  }

  /**
   * 创建操作超时错误
   */
  public static createOperationTimeoutError(
    operation: string,
    timeoutMs: number,
    context?: Partial<IErrorContext>,
  ): OperationTimeoutError {
    return new OperationTimeoutError(operation, timeoutMs, context);
  }

  /**
   * 创建并发修改错误
   */
  public static createConcurrentModificationError(
    entityType: string,
    entityId: string,
    expectedVersion: number,
    actualVersion: number,
    context?: Partial<IErrorContext>,
  ): ConcurrentModificationError {
    return new ConcurrentModificationError(
      entityType,
      entityId,
      expectedVersion,
      actualVersion,
      context,
    );
  }
}
