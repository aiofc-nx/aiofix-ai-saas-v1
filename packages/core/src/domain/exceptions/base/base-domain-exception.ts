/**
 * 基础领域异常类
 *
 * 定义领域层异常的基础实现，领域异常用于表示业务规则违反和领域逻辑错误。
 * 领域异常应该具有明确的业务含义，并提供足够的信息用于错误处理和用户提示。
 *
 * @description 基础领域异常类为所有领域异常提供统一的基础功能
 *
 * ## 业务规则
 *
 * ### 领域异常职责规则
 * - 领域异常表示业务规则的违反
 * - 领域异常应该包含明确的错误代码和消息
 * - 领域异常应该提供足够的上下文信息
 * - 领域异常不应该包含技术实现细节
 *
 * ### 领域异常分类规则
 * - 业务规则异常：违反业务规则时抛出
 * - 领域验证异常：数据验证失败时抛出
 * - 领域状态异常：无效状态变更时抛出
 * - 领域权限异常：权限不足时抛出
 *
 * ### 领域异常处理规则
 * - 领域异常应该在领域层边界被捕获
 * - 领域异常应该转换为适当的应用层异常
 * - 领域异常应该记录详细的日志信息
 * - 领域异常应该提供用户友好的错误消息
 *
 * @example
 * ```typescript
 * export class UserEmailAlreadyExistsError extends BaseDomainException {
 *   constructor(email: string, existingUserId: EntityId) {
 *     super(
 *       `邮箱 ${email} 已被其他用户使用`,
 *       'USER_EMAIL_ALREADY_EXISTS',
 *       'validation',
 *       { email, existingUserId: existingUserId.value }
 *     );
 *   }
 * }
 *
 * // 使用示例
 * class UserService {
 *   async createUser(name: string, email: string): Promise<User> {
 *     const existingUser = await this.userRepository.findByEmail(email);
 *     if (existingUser) {
 *       throw new UserEmailAlreadyExistsError(email, existingUser.id);
 *     }
 *
 *     return User.create(EntityId.generate(), name, email);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

/**
 * 领域异常类型枚举
 */
export enum DomainExceptionType {
  BUSINESS_RULE = 'business_rule',
  VALIDATION = 'validation',
  STATE = 'state',
  PERMISSION = 'permission',
  CONCURRENCY = 'concurrency',
  NOT_FOUND = 'not_found',
}

/**
 * 领域异常严重级别枚举
 */
export enum DomainExceptionSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * 基础领域异常类
 *
 * @description 所有领域异常的基类，提供统一的异常处理机制
 */
export abstract class BaseDomainException extends Error {
  /**
   * 异常代码
   */
  public readonly errorCode: string;

  /**
   * 异常类型
   */
  public readonly errorType: DomainExceptionType;

  /**
   * 异常严重级别
   */
  public readonly severity: DomainExceptionSeverity;

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

  constructor(
    message: string,
    errorCode: string,
    errorType: DomainExceptionType,
    context: Record<string, unknown> = {},
    severity: DomainExceptionSeverity = DomainExceptionSeverity.MEDIUM,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.errorCode = errorCode;
    this.errorType = errorType;
    this.severity = severity;
    this.context = { ...context };
    this.occurredAt = new Date();
    this.exceptionId = this.generateExceptionId();

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
      stack: this.stack,
    };
  }

  /**
   * 检查是否为指定类型的异常
   *
   * @param type - 异常类型
   * @returns 如果是指定类型返回true，否则返回false
   */
  isOfType(type: DomainExceptionType): boolean {
    return this.errorType === type;
  }

  /**
   * 检查是否为关键异常
   *
   * @returns 如果是关键异常返回true，否则返回false
   */
  isCritical(): boolean {
    return this.severity === DomainExceptionSeverity.CRITICAL;
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
   * 生成异常ID
   *
   * @returns 唯一的异常ID
   */
  private generateExceptionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 业务规则违反异常
 */
export class BusinessRuleViolationException extends BaseDomainException {
  constructor(
    message: string,
    ruleName: string,
    context: Record<string, unknown> = {},
  ) {
    super(
      message,
      `BUSINESS_RULE_VIOLATION_${ruleName.toUpperCase()}`,
      DomainExceptionType.BUSINESS_RULE,
      { ruleName, ...context },
      DomainExceptionSeverity.HIGH,
    );
  }

  override getUserFriendlyMessage(): string {
    return `业务规则验证失败：${this.message}`;
  }
}

/**
 * 领域验证异常
 */
export class DomainValidationException extends BaseDomainException {
  constructor(
    message: string,
    fieldName: string,
    fieldValue: unknown,
    context: Record<string, unknown> = {},
  ) {
    super(
      message,
      `DOMAIN_VALIDATION_${fieldName.toUpperCase()}`,
      DomainExceptionType.VALIDATION,
      { fieldName, fieldValue, ...context },
      DomainExceptionSeverity.MEDIUM,
    );
  }

  override getUserFriendlyMessage(): string {
    return `数据验证失败：${this.message}`;
  }
}

/**
 * 领域状态异常
 */
export class DomainStateException extends BaseDomainException {
  constructor(
    message: string,
    currentState: string,
    requestedOperation: string,
    context: Record<string, unknown> = {},
  ) {
    super(
      message,
      `DOMAIN_STATE_${requestedOperation.toUpperCase()}`,
      DomainExceptionType.STATE,
      { currentState, requestedOperation, ...context },
      DomainExceptionSeverity.MEDIUM,
    );
  }

  override getUserFriendlyMessage(): string {
    return `操作失败：${this.message}`;
  }
}

/**
 * 领域权限异常
 */
export class DomainPermissionException extends BaseDomainException {
  constructor(
    message: string,
    requiredPermission: string,
    resource: string,
    context: Record<string, unknown> = {},
  ) {
    super(
      message,
      `DOMAIN_PERMISSION_${requiredPermission.toUpperCase()}`,
      DomainExceptionType.PERMISSION,
      { requiredPermission, resource, ...context },
      DomainExceptionSeverity.HIGH,
    );
  }

  override getUserFriendlyMessage(): string {
    return `权限不足：${this.message}`;
  }
}
