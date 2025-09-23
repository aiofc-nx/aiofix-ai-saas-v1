/**
 * 基础错误类
 *
 * 提供了系统中所有错误的基础实现，包括错误信息、元数据、上下文等。
 * 支持错误链、本地化、序列化等企业级功能。
 *
 * ## 业务规则
 *
 * ### 错误继承规则
 * - 所有业务错误都应该继承自 BaseError
 * - 错误类应该提供有意义的错误消息和上下文
 * - 错误类应该支持错误链和原因追踪
 *
 * ### 错误序列化规则
 * - 错误应该支持 JSON 序列化
 * - 序列化应该包含所有必要的错误信息
 * - 序列化应该支持错误链的完整信息
 *
 * ### 错误本地化规则
 * - 错误消息应该支持多语言本地化
 * - 本地化信息应该包含在错误元数据中
 * - 默认使用英语，支持中文等其他语言
 *
 * @description 基础错误类实现
 * @example
 * ```typescript
 * class UserNotFoundError extends BaseError {
 *   constructor(userId: string, context?: IErrorContext) {
 *     super(
 *       `User not found: ${userId}`,
 *       CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
 *       ErrorCategory.BUSINESS,
 *       ErrorSeverity.MEDIUM,
 *       {
 *         recoverable: true,
 *         retryable: false,
 *         loggable: true,
 *         alertable: false,
 *         monitorable: true,
 *         tags: ['user', 'not-found'],
 *         description: 'The requested user does not exist',
 *         solution: 'Verify the user ID and try again'
 *       },
 *       context
 *     );
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
import {
  ErrorSeverity,
  ErrorCategory,
  CommonErrorCodes,
  IErrorContext,
  IErrorMetadata,
  IErrorInfo,
} from './error.types';

/**
 * 基础错误类
 */
export abstract class BaseError extends Error {
  private readonly _code: string;
  private readonly _category: ErrorCategory;
  private readonly _severity: ErrorSeverity;
  private readonly _metadata: IErrorMetadata;
  private readonly _context: IErrorContext;
  private readonly _info: IErrorInfo;
  private readonly _timestamp: Date;
  private readonly _id: string;
  private _cause?: Error | BaseError;

  constructor(
    message: string,
    code: string = CommonErrorCodes.UNK_UNKNOWN_ERROR,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    metadata: Partial<IErrorMetadata> = {},
    context: Partial<IErrorContext> = {},
    info: Partial<IErrorInfo> = {},
  ) {
    super(message);

    // 设置错误名称
    this.name = this.constructor.name;

    // 确保堆栈跟踪正确
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // 生成唯一错误 ID
    this._id = this.generateErrorId();

    // 设置错误时间戳
    this._timestamp = new Date();

    // 设置错误代码和类别
    this._code = code;
    this._category = category;
    this._severity = severity;

    // 构建完整的错误元数据
    this._metadata = this.buildMetadata(metadata);

    // 构建完整的错误上下文
    this._context = this.buildContext(context);

    // 构建完整的错误信息
    this._info = this.buildInfo(message, info);
  }

  /**
   * 获取错误代码
   */
  public get code(): string {
    return this._code;
  }

  /**
   * 获取错误类别
   */
  public get category(): ErrorCategory {
    return this._category;
  }

  /**
   * 获取错误严重性
   */
  public get severity(): ErrorSeverity {
    return this._severity;
  }

  /**
   * 获取错误元数据
   */
  public get metadata(): IErrorMetadata {
    return { ...this._metadata };
  }

  /**
   * 获取错误上下文
   */
  public get context(): IErrorContext {
    return { ...this._context };
  }

  /**
   * 获取错误信息
   */
  public get info(): IErrorInfo {
    return { ...this._info };
  }

  /**
   * 获取错误时间戳
   */
  public get timestamp(): Date {
    return this._timestamp;
  }

  /**
   * 获取错误 ID
   */
  public get id(): string {
    return this._id;
  }

  /**
   * 获取错误重试延迟
   */
  public get retryDelay(): number | undefined {
    return this._metadata.retryDelay;
  }

  /**
   * 获取错误最大重试次数
   */
  public get maxRetries(): number | undefined {
    return this._metadata.maxRetries;
  }

  /**
   * 获取错误标签
   */
  public get tags(): string[] {
    return this._metadata.tags || [];
  }

  /**
   * 获取错误描述
   */
  public get description(): string | undefined {
    return this._metadata.description;
  }

  /**
   * 获取错误解决方案
   */
  public get solution(): string | undefined {
    return this._metadata.solution;
  }

  /**
   * 获取错误文档链接
   */
  public get documentationUrl(): string | undefined {
    return this._metadata.documentationUrl;
  }

  /**
   * 获取错误支持联系信息
   */
  public get supportContact(): string | undefined {
    return this._metadata.supportContact;
  }

  /**
   * 获取错误详细信息
   */
  public get details(): string | undefined {
    return this._info.details;
  }

  /**
   * 获取错误原因
   */
  public override get cause(): Error | BaseError | undefined {
    return this._cause;
  }

  /**
   * 获取错误建议
   */
  public get suggestion(): string | undefined {
    return this._info.suggestion;
  }

  /**
   * 获取错误参数
   */
  public get parameters(): Record<string, unknown> | undefined {
    return this._info.parameters;
  }

  /**
   * 获取本地化错误消息
   */
  public getLocalizedMessage(locale: string = 'en'): string {
    if (this._info.localization && this._info.localization[locale]) {
      return this._info.localization[locale].message;
    }
    return this.message;
  }

  /**
   * 获取本地化错误详细信息
   */
  public getLocalizedDetails(locale: string = 'en'): string | undefined {
    if (this._info.localization && this._info.localization[locale]) {
      return this._info.localization[locale].details;
    }
    return this._info.details;
  }

  /**
   * 获取本地化错误原因
   */
  public getLocalizedCause(locale: string = 'en'): string | undefined {
    if (this._info.localization && this._info.localization[locale]) {
      return this._info.localization[locale].cause;
    }
    return this._info.cause;
  }

  /**
   * 获取本地化错误建议
   */
  public getLocalizedSuggestion(locale: string = 'en'): string | undefined {
    if (this._info.localization && this._info.localization[locale]) {
      return this._info.localization[locale].suggestion;
    }
    return this._info.suggestion;
  }

  /**
   * 转换为 JSON 表示
   */
  public toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      name: this.name,
      message: this.message,
      code: this._code,
      category: this._category,
      severity: this._severity,
      metadata: this._metadata,
      context: this._context,
      info: this._info,
      timestamp: this._timestamp.toISOString(),
      stack: this.stack,
      cause: this._cause,
    };
  }

  /**
   * 转换为字符串表示
   */
  public override toString(): string {
    return JSON.stringify(this.toJSON(), null, 2);
  }

  /**
   * 获取错误摘要
   */
  public getSummary(): {
    id: string;
    name: string;
    message: string;
    code: string;
    category: string;
    severity: string;
    timestamp: string;
    recoverable: boolean;
    retryable: boolean;
    tags: string[];
  } {
    return {
      id: this._id,
      name: this.name,
      message: this.message,
      code: this._code,
      category: this._category,
      severity: this._severity,
      timestamp: this._timestamp.toISOString(),
      recoverable: this._metadata.recoverable,
      retryable: this._metadata.retryable,
      tags: this._metadata.tags || [],
    };
  }

  /**
   * 获取错误消息
   */
  public getMessage(): string {
    return this.message;
  }

  /**
   * 获取错误代码
   */
  public getCode(): string {
    return this._code;
  }

  /**
   * 获取错误类别
   */
  public getCategory(): ErrorCategory {
    return this._category;
  }

  /**
   * 获取错误严重性
   */
  public getSeverity(): ErrorSeverity {
    return this._severity;
  }

  /**
   * 获取错误元数据
   */
  public getMetadata(): IErrorMetadata {
    return { ...this._metadata };
  }

  /**
   * 获取错误上下文
   */
  public getContext(): IErrorContext {
    return { ...this._context };
  }

  /**
   * 设置错误原因
   */
  public setCause(cause: Error | BaseError): void {
    this._cause = cause;
  }

  /**
   * 获取错误原因
   */
  public getCause(): Error | BaseError | undefined {
    return this._cause;
  }

  /**
   * 获取错误链
   */
  public getErrorChain(): Array<BaseError | Error> {
    const chain: Array<BaseError | Error> = [this];
    let current = this.getCause();

    while (current) {
      chain.push(current);
      if (current instanceof BaseError) {
        current = current.getCause();
      } else {
        break;
      }
    }

    return chain;
  }

  /**
   * 检查错误是否可恢复
   */
  public isRecoverable(): boolean {
    return this._metadata.recoverable;
  }

  /**
   * 检查错误是否可重试
   */
  public isRetryable(): boolean {
    return this._metadata.retryable;
  }

  /**
   * 检查错误是否应该记录
   */
  public isLoggable(): boolean {
    return this._metadata.loggable;
  }

  /**
   * 检查错误是否应该告警
   */
  public isAlertable(): boolean {
    return this._metadata.alertable;
  }

  /**
   * 检查错误是否应该监控
   */
  public isMonitorable(): boolean {
    return this._metadata.monitorable;
  }

  /**
   * 检查错误是否有指定标签
   */
  public hasTag(tag: string): boolean {
    return this._metadata.tags?.includes(tag) || false;
  }

  /**
   * 获取所有错误标签
   */
  public getTags(): string[] {
    return this._metadata.tags || [];
  }

  /**
   * 比较错误类型
   */
  public isSameType(other: BaseError): boolean {
    return this.constructor.name === other.constructor.name;
  }

  /**
   * 比较错误严重性
   */
  public isSameSeverity(other: BaseError): boolean {
    return this._severity === other._severity;
  }

  /**
   * 生成错误 ID
   */
  private generateErrorId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `ERR-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * 构建错误元数据
   */
  private buildMetadata(metadata: Partial<IErrorMetadata>): IErrorMetadata {
    const defaultMetadata: IErrorMetadata = {
      code: this._code,
      category: this._category,
      severity: this._severity,
      recoverable: this._severity !== ErrorSeverity.CRITICAL,
      retryable:
        this._category === ErrorCategory.NETWORK ||
        this._category === ErrorCategory.EXTERNAL_SERVICE,
      loggable: true,
      alertable:
        this._severity === ErrorSeverity.HIGH ||
        this._severity === ErrorSeverity.CRITICAL,
      monitorable: true,
      tags: [],
      description: undefined,
      solution: undefined,
      documentationUrl: undefined,
      supportContact: undefined,
    };

    return {
      ...defaultMetadata,
      ...metadata,
    };
  }

  /**
   * 构建错误上下文
   */
  private buildContext(context: Partial<IErrorContext>): IErrorContext {
    const defaultContext: IErrorContext = {
      timestamp: this._timestamp,
      serviceName: undefined,
      moduleName: undefined,
      functionName: undefined,
      filePath: undefined,
      lineNumber: undefined,
      columnNumber: undefined,
      stackTrace: this.stack,
      requestId: undefined,
      userId: undefined,
      tenantId: undefined,
      organizationId: undefined,
      departmentId: undefined,
      correlationId: undefined,
      causationId: undefined,
      ipAddress: undefined,
      userAgent: undefined,
      source: undefined,
      environment: undefined,
      version: undefined,
      deploymentId: undefined,
      instanceId: undefined,
      region: undefined,
      availabilityZone: undefined,
      customData: undefined,
    };

    return {
      ...defaultContext,
      ...context,
    };
  }

  /**
   * 构建错误信息
   */
  private buildInfo(message: string, info: Partial<IErrorInfo>): IErrorInfo {
    const defaultInfo: IErrorInfo = {
      message,
      details: undefined,
      cause: undefined,
      suggestion: undefined,
      parameters: undefined,
      localization: undefined,
    };

    return {
      ...defaultInfo,
      ...info,
    };
  }
}

/**
 * 业务错误基类
 */
export abstract class BusinessError extends BaseError {
  constructor(
    message: string,
    code: string = CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    metadata: Partial<IErrorMetadata> = {},
    context: Partial<IErrorContext> = {},
    info: Partial<IErrorInfo> = {},
  ) {
    super(
      message,
      code,
      ErrorCategory.BUSINESS,
      severity,
      metadata,
      context,
      info,
    );
  }
}

/**
 * 系统错误基类
 */
export abstract class SystemError extends BaseError {
  constructor(
    message: string,
    code: string = CommonErrorCodes.SYS_INTERNAL_ERROR,
    severity: ErrorSeverity = ErrorSeverity.HIGH,
    metadata: Partial<IErrorMetadata> = {},
    context: Partial<IErrorContext> = {},
    info: Partial<IErrorInfo> = {},
  ) {
    super(
      message,
      code,
      ErrorCategory.SYSTEM,
      severity,
      metadata,
      context,
      info,
    );
  }
}

/**
 * 验证错误基类
 */
export abstract class ValidationError extends BaseError {
  constructor(
    message: string,
    code: string = CommonErrorCodes.VAL_INVALID_INPUT,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    metadata: Partial<IErrorMetadata> = {},
    context: Partial<IErrorContext> = {},
    info: Partial<IErrorInfo> = {},
  ) {
    super(
      message,
      code,
      ErrorCategory.VALIDATION,
      severity,
      metadata,
      context,
      info,
    );
  }
}

/**
 * 授权错误基类
 */
export abstract class AuthorizationError extends BaseError {
  constructor(
    message: string,
    code: string = CommonErrorCodes.AUTH_UNAUTHORIZED,
    severity: ErrorSeverity = ErrorSeverity.HIGH,
    metadata: Partial<IErrorMetadata> = {},
    context: Partial<IErrorContext> = {},
    info: Partial<IErrorInfo> = {},
  ) {
    super(
      message,
      code,
      ErrorCategory.AUTHORIZATION,
      severity,
      metadata,
      context,
      info,
    );
  }
}

/**
 * 网络错误基类
 */
export abstract class NetworkError extends BaseError {
  constructor(
    message: string,
    code: string = CommonErrorCodes.NET_CONNECTION_TIMEOUT,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    metadata: Partial<IErrorMetadata> = {},
    context: Partial<IErrorContext> = {},
    info: Partial<IErrorInfo> = {},
  ) {
    super(
      message,
      code,
      ErrorCategory.NETWORK,
      severity,
      metadata,
      context,
      info,
    );
  }
}

/**
 * 数据库错误基类
 */
export abstract class DatabaseError extends BaseError {
  constructor(
    message: string,
    code: string = CommonErrorCodes.DB_CONNECTION_FAILED,
    severity: ErrorSeverity = ErrorSeverity.CRITICAL,
    metadata: Partial<IErrorMetadata> = {},
    context: Partial<IErrorContext> = {},
    info: Partial<IErrorInfo> = {},
  ) {
    super(
      message,
      code,
      ErrorCategory.DATABASE,
      severity,
      metadata,
      context,
      info,
    );
  }
}

/**
 * 外部服务错误基类
 */
export abstract class ExternalServiceError extends BaseError {
  constructor(
    message: string,
    code: string = CommonErrorCodes.EXT_SERVICE_UNAVAILABLE,
    severity: ErrorSeverity = ErrorSeverity.HIGH,
    metadata: Partial<IErrorMetadata> = {},
    context: Partial<IErrorContext> = {},
    info: Partial<IErrorInfo> = {},
  ) {
    super(
      message,
      code,
      ErrorCategory.EXTERNAL_SERVICE,
      severity,
      metadata,
      context,
      info,
    );
  }
}

/**
 * 配置错误基类
 */
export abstract class ConfigurationError extends BaseError {
  constructor(
    message: string,
    code: string = CommonErrorCodes.CFG_MISSING_CONFIG,
    severity: ErrorSeverity = ErrorSeverity.LOW,
    metadata: Partial<IErrorMetadata> = {},
    context: Partial<IErrorContext> = {},
    info: Partial<IErrorInfo> = {},
  ) {
    super(
      message,
      code,
      ErrorCategory.CONFIGURATION,
      severity,
      metadata,
      context,
      info,
    );
  }
}

/**
 * 资源错误基类
 */
export abstract class ResourceError extends BaseError {
  constructor(
    message: string,
    code: string = CommonErrorCodes.RES_FILE_NOT_FOUND,
    severity: ErrorSeverity = ErrorSeverity.LOW,
    metadata: Partial<IErrorMetadata> = {},
    context: Partial<IErrorContext> = {},
    info: Partial<IErrorInfo> = {},
  ) {
    super(
      message,
      code,
      ErrorCategory.RESOURCE,
      severity,
      metadata,
      context,
      info,
    );
  }
}
