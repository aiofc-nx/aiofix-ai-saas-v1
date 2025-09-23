/**
 * 错误处理器实现
 *
 * 提供了多种错误处理器，用于处理不同类型的错误。
 * 包括日志记录、监控、告警、恢复等处理器。
 *
 * @description 错误处理器实现
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import {
  IErrorHandler,
  IErrorInfo,
  IErrorProcessingStep,
  ErrorType,
  ErrorSeverity,
} from './error-handling.interface';

/**
 * 日志记录错误处理器
 */
@Injectable()
export class LoggingErrorHandler implements IErrorHandler {
  public readonly name = 'LoggingErrorHandler';
  public readonly priority = 100;
  public readonly type = ErrorType.UNKNOWN;

  constructor(private readonly logger: ILoggerService) {}

  /**
   * 处理错误
   */
  public async handle(errorInfo: IErrorInfo): Promise<IErrorProcessingStep> {
    const startTime = Date.now();

    try {
      // 根据严重级别选择日志级别
      const message = `${errorInfo.classification.severity} ERROR: ${errorInfo.classification.code} - ${errorInfo.classification.message}`;
      const metadata = {
        errorId: errorInfo.context.errorId,
        tenantId: errorInfo.context.tenantId,
        userId: errorInfo.context.userId,
        requestId: errorInfo.context.requestId,
        errorCode: errorInfo.classification.code,
        errorType: errorInfo.classification.type,
        stack: errorInfo.originalError.stack,
        ...errorInfo.classification.metadata,
      };

      switch (errorInfo.classification.severity) {
        case ErrorSeverity.CRITICAL:
          this.logger.fatal(
            message,
            LogContext.SYSTEM,
            metadata,
            errorInfo.originalError,
          );
          break;
        case ErrorSeverity.HIGH:
          this.logger.error(
            message,
            LogContext.SYSTEM,
            metadata,
            errorInfo.originalError,
          );
          break;
        case ErrorSeverity.MEDIUM:
          this.logger.warn(
            message,
            LogContext.SYSTEM,
            metadata,
            errorInfo.originalError,
          );
          break;
        case ErrorSeverity.LOW:
          this.logger.info(
            message,
            LogContext.SYSTEM,
            metadata,
            errorInfo.originalError,
          );
          break;
      }

      const duration = Date.now() - startTime;

      return {
        stepId: `logging-${Date.now()}`,
        stepName: 'LoggingErrorHandler',
        stepType: 'LOGGING',
        executedAt: new Date(),
        status: 'SUCCESS',
        result: {
          logged: true,
          severity: errorInfo.classification.severity,
          errorId: errorInfo.context.errorId,
        },
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        stepId: `logging-${Date.now()}`,
        stepName: 'LoggingErrorHandler',
        stepType: 'LOGGING',
        executedAt: new Date(),
        status: 'FAILED',
        error: (error as Error).message,
        duration,
      };
    }
  }

  /**
   * 检查是否应该处理此错误
   */
  public shouldHandle(_errorInfo: IErrorInfo): boolean {
    return true; // 所有错误都应该被记录
  }

  /**
   * 检查是否支持此错误类型
   */
  public supports(_errorType: ErrorType): boolean {
    return true; // 支持所有错误类型
  }
}

/**
 * 监控错误处理器
 */
@Injectable()
export class MonitoringErrorHandler implements IErrorHandler {
  public readonly name = 'MonitoringErrorHandler';
  public readonly priority = 90;
  public readonly type = ErrorType.UNKNOWN;

  constructor(private readonly logger: ILoggerService) {}

  /**
   * 处理错误
   */
  public async handle(errorInfo: IErrorInfo): Promise<IErrorProcessingStep> {
    const startTime = Date.now();

    try {
      // 这里可以集成监控系统，如 Prometheus、DataDog、New Relic 等
      // 暂时只记录日志
      this.logger.debug(
        `Monitoring error: ${errorInfo.classification.code} - ${errorInfo.classification.severity}`,
        LogContext.PERFORMANCE,
        {
          errorId: errorInfo.context.errorId,
          errorCode: errorInfo.classification.code,
          errorType: errorInfo.classification.type,
          severity: errorInfo.classification.severity,
        },
      );

      // 模拟监控指标收集
      const metrics = {
        errorType: errorInfo.classification.type,
        errorSeverity: errorInfo.classification.severity,
        errorCode: errorInfo.classification.code,
        tenantId: errorInfo.context.tenantId,
        userId: errorInfo.context.userId,
        timestamp: errorInfo.context.timestamp,
      };

      const duration = Date.now() - startTime;

      return {
        stepId: `monitoring-${Date.now()}`,
        stepName: 'MonitoringErrorHandler',
        stepType: 'MONITORING',
        executedAt: new Date(),
        status: 'SUCCESS',
        result: {
          metrics,
          monitored: true,
        },
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        stepId: `monitoring-${Date.now()}`,
        stepName: 'MonitoringErrorHandler',
        stepType: 'MONITORING',
        executedAt: new Date(),
        status: 'FAILED',
        error: (error as Error).message,
        duration,
      };
    }
  }

  /**
   * 检查是否应该处理此错误
   */
  public shouldHandle(errorInfo: IErrorInfo): boolean {
    // 只处理中级别以上的错误
    return (
      errorInfo.classification.severity === ErrorSeverity.MEDIUM ||
      errorInfo.classification.severity === ErrorSeverity.HIGH ||
      errorInfo.classification.severity === ErrorSeverity.CRITICAL
    );
  }

  /**
   * 检查是否支持此错误类型
   */
  public supports(_errorType: ErrorType): boolean {
    return true; // 支持所有错误类型
  }
}

/**
 * 告警错误处理器
 */
@Injectable()
export class AlertingErrorHandler implements IErrorHandler {
  public readonly name = 'AlertingErrorHandler';
  public readonly priority = 80;
  public readonly type = ErrorType.UNKNOWN;

  constructor(private readonly logger: ILoggerService) {}

  /**
   * 处理错误
   */
  public async handle(errorInfo: IErrorInfo): Promise<IErrorProcessingStep> {
    const startTime = Date.now();

    try {
      // 检查是否需要发送告警
      if (this.shouldSendAlert(errorInfo)) {
        // 这里可以集成告警系统，如 PagerDuty、Slack、邮件等
        this.logger.warn(
          `ALERT: ${errorInfo.classification.severity} error occurred - ${errorInfo.classification.code}`,
          LogContext.SYSTEM,
          {
            errorId: errorInfo.context.errorId,
            errorCode: errorInfo.classification.code,
            severity: errorInfo.classification.severity,
            alertType: 'error_alert',
          },
        );

        const alert = {
          severity: errorInfo.classification.severity,
          code: errorInfo.classification.code,
          message: errorInfo.classification.message,
          errorId: errorInfo.context.errorId,
          tenantId: errorInfo.context.tenantId,
          userId: errorInfo.context.userId,
          requestId: errorInfo.context.requestId,
          timestamp: errorInfo.context.timestamp,
        };

        const duration = Date.now() - startTime;

        return {
          stepId: `alerting-${Date.now()}`,
          stepName: 'AlertingErrorHandler',
          stepType: 'NOTIFICATION',
          executedAt: new Date(),
          status: 'SUCCESS',
          result: {
            alert,
            sent: true,
          },
          duration,
        };
      } else {
        const duration = Date.now() - startTime;

        return {
          stepId: `alerting-${Date.now()}`,
          stepName: 'AlertingErrorHandler',
          stepType: 'NOTIFICATION',
          executedAt: new Date(),
          status: 'SKIPPED',
          result: {
            reason: 'Alert threshold not met',
            sent: false,
          },
          duration,
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        stepId: `alerting-${Date.now()}`,
        stepName: 'AlertingErrorHandler',
        stepType: 'NOTIFICATION',
        executedAt: new Date(),
        status: 'FAILED',
        error: (error as Error).message,
        duration,
      };
    }
  }

  /**
   * 检查是否应该处理此错误
   */
  public shouldHandle(errorInfo: IErrorInfo): boolean {
    // 只处理高级别和严重级别的错误
    return (
      errorInfo.classification.severity === ErrorSeverity.HIGH ||
      errorInfo.classification.severity === ErrorSeverity.CRITICAL
    );
  }

  /**
   * 检查是否支持此错误类型
   */
  public supports(_errorType: ErrorType): boolean {
    return true; // 支持所有错误类型
  }

  /**
   * 检查是否应该发送告警
   */
  private shouldSendAlert(errorInfo: IErrorInfo): boolean {
    // 严重错误总是发送告警
    if (errorInfo.classification.severity === ErrorSeverity.CRITICAL) {
      return true;
    }

    // 高级别错误根据类型决定
    if (errorInfo.classification.severity === ErrorSeverity.HIGH) {
      const alertableTypes = [
        ErrorType.SYSTEM,
        ErrorType.DATA_ACCESS,
        ErrorType.EXTERNAL_SERVICE,
        ErrorType.RESOURCE_EXHAUSTED,
      ];
      return alertableTypes.includes(errorInfo.classification.type);
    }

    return false;
  }
}

/**
 * 业务错误处理器
 */
@Injectable()
export class BusinessErrorHandler implements IErrorHandler {
  public readonly name = 'BusinessErrorHandler';
  public readonly priority = 70;
  public readonly type = ErrorType.BUSINESS;

  constructor(private readonly logger: ILoggerService) {}

  /**
   * 处理错误
   */
  public async handle(errorInfo: IErrorInfo): Promise<IErrorProcessingStep> {
    const startTime = Date.now();

    try {
      // 业务错误处理逻辑
      this.logger.warn(
        `Business error handled: ${errorInfo.classification.code} - ${errorInfo.classification.message}`,
        LogContext.BUSINESS,
        {
          errorId: errorInfo.context.errorId,
          errorCode: errorInfo.classification.code,
          errorType: errorInfo.classification.type,
          tenantId: errorInfo.context.tenantId,
          userId: errorInfo.context.userId,
        },
      );

      // 根据错误代码执行特定的业务逻辑
      const result = await this.handleBusinessError(errorInfo);

      const duration = Date.now() - startTime;

      return {
        stepId: `business-${Date.now()}`,
        stepName: 'BusinessErrorHandler',
        stepType: 'CLASSIFICATION',
        executedAt: new Date(),
        status: 'SUCCESS',
        result,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        stepId: `business-${Date.now()}`,
        stepName: 'BusinessErrorHandler',
        stepType: 'CLASSIFICATION',
        executedAt: new Date(),
        status: 'FAILED',
        error: (error as Error).message,
        duration,
      };
    }
  }

  /**
   * 检查是否应该处理此错误
   */
  public shouldHandle(errorInfo: IErrorInfo): boolean {
    return errorInfo.classification.type === ErrorType.BUSINESS;
  }

  /**
   * 检查是否支持此错误类型
   */
  public supports(errorType: ErrorType): boolean {
    return errorType === ErrorType.BUSINESS;
  }

  /**
   * 处理业务错误
   */
  private async handleBusinessError(errorInfo: IErrorInfo): Promise<unknown> {
    const code = errorInfo.classification.code;

    switch (code) {
      case 'RESOURCE_NOT_FOUND':
        return {
          action: 'log_and_continue',
          message: 'Resource not found, continuing with default behavior',
        };
      case 'RESOURCE_ALREADY_EXISTS':
        return {
          action: 'log_and_skip',
          message: 'Resource already exists, skipping creation',
        };
      case 'PERMISSION_DENIED':
        return {
          action: 'log_and_deny',
          message: 'Permission denied, access blocked',
        };
      case 'QUOTA_EXCEEDED':
        return {
          action: 'log_and_throttle',
          message: 'Quota exceeded, implementing throttling',
        };
      default:
        return {
          action: 'log_and_continue',
          message: 'Unknown business error, continuing with default behavior',
        };
    }
  }
}

/**
 * 数据访问错误处理器
 */
@Injectable()
export class DataAccessErrorHandler implements IErrorHandler {
  public readonly name = 'DataAccessErrorHandler';
  public readonly priority = 60;
  public readonly type = ErrorType.DATA_ACCESS;

  constructor(private readonly logger: ILoggerService) {}

  /**
   * 处理错误
   */
  public async handle(errorInfo: IErrorInfo): Promise<IErrorProcessingStep> {
    const startTime = Date.now();

    try {
      // 数据访问错误处理逻辑
      this.logger.error(
        `Data access error handled: ${errorInfo.classification.code} - ${errorInfo.classification.message}`,
        LogContext.DATABASE,
        {
          errorId: errorInfo.context.errorId,
          errorCode: errorInfo.classification.code,
          errorType: errorInfo.classification.type,
          tenantId: errorInfo.context.tenantId,
          userId: errorInfo.context.userId,
        },
        errorInfo.originalError,
      );

      // 根据错误代码执行特定的数据访问错误处理
      const result = await this.handleDataAccessError(errorInfo);

      const duration = Date.now() - startTime;

      return {
        stepId: `data-access-${Date.now()}`,
        stepName: 'DataAccessErrorHandler',
        stepType: 'CLASSIFICATION',
        executedAt: new Date(),
        status: 'SUCCESS',
        result,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        stepId: `data-access-${Date.now()}`,
        stepName: 'DataAccessErrorHandler',
        stepType: 'CLASSIFICATION',
        executedAt: new Date(),
        status: 'FAILED',
        error: (error as Error).message,
        duration,
      };
    }
  }

  /**
   * 检查是否应该处理此错误
   */
  public shouldHandle(errorInfo: IErrorInfo): boolean {
    return errorInfo.classification.type === ErrorType.DATA_ACCESS;
  }

  /**
   * 检查是否支持此错误类型
   */
  public supports(errorType: ErrorType): boolean {
    return errorType === ErrorType.DATA_ACCESS;
  }

  /**
   * 处理数据访问错误
   */
  private async handleDataAccessError(errorInfo: IErrorInfo): Promise<unknown> {
    const code = errorInfo.classification.code;

    switch (code) {
      case 'DATABASE_CONNECTION_ERROR':
        return {
          action: 'retry_connection',
          message: 'Database connection failed, attempting to reconnect',
          retryable: true,
        };
      case 'DATABASE_TIMEOUT':
        return {
          action: 'retry_with_backoff',
          message: 'Database operation timed out, retrying with backoff',
          retryable: true,
        };
      case 'CONSTRAINT_VIOLATION':
        return {
          action: 'log_and_fail',
          message: 'Database constraint violation, operation failed',
          retryable: false,
        };
      case 'DEADLOCK_DETECTED':
        return {
          action: 'retry_immediately',
          message: 'Database deadlock detected, retrying immediately',
          retryable: true,
        };
      case 'RECORD_NOT_FOUND':
        return {
          action: 'log_and_continue',
          message:
            'Database record not found, continuing with default behavior',
          retryable: false,
        };
      default:
        return {
          action: 'log_and_retry',
          message: 'Unknown data access error, attempting retry',
          retryable: true,
        };
    }
  }
}

/**
 * 网络错误处理器
 */
@Injectable()
export class NetworkErrorHandler implements IErrorHandler {
  public readonly name = 'NetworkErrorHandler';
  public readonly priority = 50;
  public readonly type = ErrorType.NETWORK;

  constructor(private readonly logger: ILoggerService) {}

  /**
   * 处理错误
   */
  public async handle(errorInfo: IErrorInfo): Promise<IErrorProcessingStep> {
    const startTime = Date.now();

    try {
      // 网络错误处理逻辑
      this.logger.warn(
        `Network error handled: ${errorInfo.classification.code} - ${errorInfo.classification.message}`,
        LogContext.EXTERNAL,
        {
          errorId: errorInfo.context.errorId,
          errorCode: errorInfo.classification.code,
          errorType: errorInfo.classification.type,
          tenantId: errorInfo.context.tenantId,
          userId: errorInfo.context.userId,
        },
        errorInfo.originalError,
      );

      // 根据错误代码执行特定的网络错误处理
      const result = await this.handleNetworkError(errorInfo);

      const duration = Date.now() - startTime;

      return {
        stepId: `network-${Date.now()}`,
        stepName: 'NetworkErrorHandler',
        stepType: 'CLASSIFICATION',
        executedAt: new Date(),
        status: 'SUCCESS',
        result,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        stepId: `network-${Date.now()}`,
        stepName: 'NetworkErrorHandler',
        stepType: 'CLASSIFICATION',
        executedAt: new Date(),
        status: 'FAILED',
        error: (error as Error).message,
        duration,
      };
    }
  }

  /**
   * 检查是否应该处理此错误
   */
  public shouldHandle(errorInfo: IErrorInfo): boolean {
    return errorInfo.classification.type === ErrorType.NETWORK;
  }

  /**
   * 检查是否支持此错误类型
   */
  public supports(errorType: ErrorType): boolean {
    return errorType === ErrorType.NETWORK;
  }

  /**
   * 处理网络错误
   */
  private async handleNetworkError(errorInfo: IErrorInfo): Promise<unknown> {
    const code = errorInfo.classification.code;

    switch (code) {
      case 'NETWORK_TIMEOUT':
        return {
          action: 'retry_with_backoff',
          message: 'Network request timed out, retrying with backoff',
          retryable: true,
        };
      case 'CONNECTION_REFUSED':
        return {
          action: 'retry_after_delay',
          message: 'Connection refused, retrying after delay',
          retryable: true,
        };
      case 'CONNECTION_RESET':
        return {
          action: 'retry_immediately',
          message: 'Connection reset, retrying immediately',
          retryable: true,
        };
      case 'DNS_ERROR':
        return {
          action: 'retry_with_different_dns',
          message: 'DNS resolution failed, retrying with different DNS',
          retryable: true,
        };
      case 'SSL_ERROR':
        return {
          action: 'log_and_fail',
          message: 'SSL/TLS error, operation failed',
          retryable: false,
        };
      default:
        return {
          action: 'retry_with_backoff',
          message: 'Unknown network error, retrying with backoff',
          retryable: true,
        };
    }
  }
}
