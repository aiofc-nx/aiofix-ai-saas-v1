/**
 * 异步上下文中间件实现
 *
 * 提供了多种异步上下文中间件，用于在请求处理过程中自动管理上下文信息。
 * 包括多租户支持、用户身份验证、请求追踪、性能监控等功能。
 *
 * @description 异步上下文中间件实现
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import {
  IAsyncContext,
  IAsyncContextMiddleware,
} from './async-context.interface';

/**
 * 多租户中间件
 */
@Injectable()
export class MultiTenantMiddleware implements IAsyncContextMiddleware {
  public readonly name = 'MultiTenantMiddleware';
  public readonly priority = 100;

  constructor(private readonly logger: ILoggerService) {}

  /**
   * 执行中间件
   */
  public async execute(
    context: IAsyncContext,
    next: () => Promise<void>,
  ): Promise<void> {
    const tenantId = context.getTenantId();
    if (tenantId) {
      this.logger.debug(
        `Processing request for tenant: ${tenantId}`,
        LogContext.SYSTEM,
        { tenantId },
      );
      // 这里可以添加租户特定的逻辑，如数据隔离、权限检查等
    }

    await next();
  }

  /**
   * 检查是否应该执行此中间件
   */
  public shouldExecute(context: IAsyncContext): boolean {
    return context.isMultiTenant();
  }
}

/**
 * 用户身份验证中间件
 */
@Injectable()
export class UserAuthenticationMiddleware implements IAsyncContextMiddleware {
  public readonly name = 'UserAuthenticationMiddleware';
  public readonly priority = 90;

  constructor(private readonly logger: ILoggerService) {}

  /**
   * 执行中间件
   */
  public async execute(
    context: IAsyncContext,
    next: () => Promise<void>,
  ): Promise<void> {
    const userId = context.getUserId();
    if (userId) {
      this.logger.debug(
        `Processing request for user: ${userId}`,
        LogContext.SYSTEM,
        { userId },
      );
      // 这里可以添加用户身份验证逻辑
    }

    await next();
  }

  /**
   * 检查是否应该执行此中间件
   */
  public shouldExecute(context: IAsyncContext): boolean {
    return context.isUserLevel();
  }
}

/**
 * 请求追踪中间件
 */
@Injectable()
export class RequestTracingMiddleware implements IAsyncContextMiddleware {
  public readonly name = 'RequestTracingMiddleware';
  public readonly priority = 80;

  constructor(private readonly logger: ILoggerService) {}

  /**
   * 执行中间件
   */
  public async execute(
    context: IAsyncContext,
    next: () => Promise<void>,
  ): Promise<void> {
    const requestId = context.getRequestId();
    const correlationId = context.getCorrelationId();
    const causationId = context.getCausationId();

    if (requestId) {
      this.logger.debug(`Processing request: ${requestId}`, LogContext.SYSTEM, {
        requestId,
      });
    }

    if (correlationId) {
      this.logger.debug(`Correlation ID: ${correlationId}`, LogContext.SYSTEM, {
        correlationId,
      });
    }

    if (causationId) {
      this.logger.debug(`Causation ID: ${causationId}`, LogContext.SYSTEM, {
        causationId,
      });
    }

    await next();
  }

  /**
   * 检查是否应该执行此中间件
   */
  public shouldExecute(context: IAsyncContext): boolean {
    return !!(
      context.getRequestId() ||
      context.getCorrelationId() ||
      context.getCausationId()
    );
  }
}

/**
 * 性能监控中间件
 */
@Injectable()
export class PerformanceMonitoringMiddleware
  implements IAsyncContextMiddleware
{
  public readonly name = 'PerformanceMonitoringMiddleware';
  public readonly priority = 70;

  constructor(private readonly logger: ILoggerService) {}

  /**
   * 执行中间件
   */
  public async execute(
    context: IAsyncContext,
    next: () => Promise<void>,
  ): Promise<void> {
    const startTime = Date.now();
    const requestId = context.getRequestId();

    try {
      await next();
    } finally {
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (requestId) {
        this.logger.debug(
          `Request ${requestId} completed in ${duration}ms`,
          LogContext.PERFORMANCE,
          { requestId, duration },
        );
      }

      // 这里可以添加性能监控逻辑，如发送到监控系统
      context.setCustomData('requestDuration', duration);
      context.setCustomData('requestEndTime', new Date());
    }
  }

  /**
   * 检查是否应该执行此中间件
   */
  public shouldExecute(context: IAsyncContext): boolean {
    return !!context.getRequestId();
  }
}

/**
 * 数据隔离中间件
 */
@Injectable()
export class DataIsolationMiddleware implements IAsyncContextMiddleware {
  public readonly name = 'DataIsolationMiddleware';
  public readonly priority = 60;

  constructor(private readonly logger: ILoggerService) {}

  /**
   * 执行中间件
   */
  public async execute(
    context: IAsyncContext,
    next: () => Promise<void>,
  ): Promise<void> {
    const contextLevel = context.getContextLevel();
    const tenantId = context.getTenantId();
    const organizationId = context.getOrganizationId();
    const departmentId = context.getDepartmentId();

    this.logger.debug(
      `Data isolation level: ${contextLevel}`,
      LogContext.SYSTEM,
      { contextLevel },
    );

    // 根据上下文级别设置数据隔离策略
    switch (contextLevel) {
      case 'TENANT':
        this.logger.debug(`Tenant isolation: ${tenantId}`, LogContext.SYSTEM, {
          tenantId,
        });
        break;
      case 'ORGANIZATION':
        this.logger.debug(
          `Organization isolation: ${organizationId} (tenant: ${tenantId})`,
        );
        break;
      case 'DEPARTMENT':
        this.logger.debug(
          `Department isolation: ${departmentId} (org: ${organizationId}, tenant: ${tenantId})`,
        );
        break;
      case 'USER':
        this.logger.debug(
          `User isolation: ${context.getUserId()} (dept: ${departmentId}, org: ${organizationId}, tenant: ${tenantId})`,
        );
        break;
      case 'PUBLIC':
        this.logger.debug('Public access - no isolation', LogContext.SYSTEM);
        break;
    }

    await next();
  }

  /**
   * 检查是否应该执行此中间件
   */
  public shouldExecute(_context: IAsyncContext): boolean {
    return true; // 所有请求都需要数据隔离检查
  }
}

/**
 * 审计日志中间件
 */
@Injectable()
export class AuditLoggingMiddleware implements IAsyncContextMiddleware {
  public readonly name = 'AuditLoggingMiddleware';
  public readonly priority = 50;

  constructor(private readonly logger: ILoggerService) {}

  /**
   * 执行中间件
   */
  public async execute(
    context: IAsyncContext,
    next: () => Promise<void>,
  ): Promise<void> {
    const requestId = context.getRequestId();
    const userId = context.getUserId();
    const tenantId = context.getTenantId();
    const source = context.getSource();
    const ipAddress = context.getIpAddress();
    // const userAgent = context.getUserAgent();

    // 记录请求开始
    this.logger.info(
      `Request started - ID: ${requestId}, User: ${userId}, Tenant: ${tenantId}, Source: ${source}, IP: ${ipAddress}`,
      LogContext.HTTP_REQUEST,
      { requestId, userId, tenantId, source, ipAddress },
    );

    try {
      await next();

      // 记录请求成功
      this.logger.info(
        `Request completed successfully - ID: ${requestId}`,
        LogContext.HTTP_REQUEST,
        { requestId },
      );
    } catch (error) {
      // 记录请求失败
      this.logger.error(
        `Request failed - ID: ${requestId}, Error: ${(error as Error).message}`,
        LogContext.HTTP_REQUEST,
        { requestId, error: (error as Error).message },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 检查是否应该执行此中间件
   */
  public shouldExecute(context: IAsyncContext): boolean {
    return !!(
      context.getRequestId() ||
      context.getUserId() ||
      context.getTenantId()
    );
  }
}

/**
 * 本地化中间件
 */
@Injectable()
export class LocalizationMiddleware implements IAsyncContextMiddleware {
  public readonly name = 'LocalizationMiddleware';
  public readonly priority = 40;

  constructor(private readonly logger: ILoggerService) {}

  /**
   * 执行中间件
   */
  public async execute(
    context: IAsyncContext,
    next: () => Promise<void>,
  ): Promise<void> {
    const locale = context.getLocale();
    const timezone = context.getTimezone();

    if (locale) {
      this.logger.debug(`Setting locale: ${locale}`, LogContext.SYSTEM, {
        locale,
      });
      // 这里可以设置应用程序的本地化设置
    }

    if (timezone) {
      this.logger.debug(`Setting timezone: ${timezone}`, LogContext.SYSTEM, {
        timezone,
      });
      // 这里可以设置应用程序的时区设置
    }

    await next();
  }

  /**
   * 检查是否应该执行此中间件
   */
  public shouldExecute(context: IAsyncContext): boolean {
    return !!(context.getLocale() || context.getTimezone());
  }
}

/**
 * 自定义数据中间件
 */
@Injectable()
export class CustomDataMiddleware implements IAsyncContextMiddleware {
  public readonly name = 'CustomDataMiddleware';
  public readonly priority = 30;

  constructor(private readonly logger: ILoggerService) {}

  /**
   * 执行中间件
   */
  public async execute(
    context: IAsyncContext,
    next: () => Promise<void>,
  ): Promise<void> {
    const customData = context.getAllCustomData();

    if (Object.keys(customData).length > 0) {
      this.logger.debug(
        `Processing custom data: ${JSON.stringify(customData)}`,
        LogContext.SYSTEM,
        { customData },
      );
      // 这里可以处理自定义数据
    }

    await next();
  }

  /**
   * 检查是否应该执行此中间件
   */
  public shouldExecute(context: IAsyncContext): boolean {
    const customData = context.getAllCustomData();
    return Object.keys(customData).length > 0;
  }
}

/**
 * 中间件链管理器
 */
@Injectable()
export class AsyncContextMiddlewareChain {
  private readonly middlewares: IAsyncContextMiddleware[] = [];

  constructor(private readonly logger: ILoggerService) {}

  /**
   * 添加中间件
   */
  public addMiddleware(middleware: IAsyncContextMiddleware): void {
    this.middlewares.push(middleware);
    // 按优先级排序
    this.middlewares.sort((a, b) => b.priority - a.priority);
    this.logger.debug(
      `Added middleware: ${middleware.name}`,
      LogContext.SYSTEM,
      { middlewareName: middleware.name },
    );
  }

  /**
   * 移除中间件
   */
  public removeMiddleware(name: string): boolean {
    const index = this.middlewares.findIndex((m) => m.name === name);
    if (index !== -1) {
      this.middlewares.splice(index, 1);
      this.logger.debug(`Removed middleware: ${name}`, LogContext.SYSTEM, {
        middlewareName: name,
      });
      return true;
    }
    return false;
  }

  /**
   * 获取所有中间件
   */
  public getMiddlewares(): IAsyncContextMiddleware[] {
    return [...this.middlewares];
  }

  /**
   * 执行中间件链
   */
  public async execute(context: IAsyncContext): Promise<void> {
    const applicableMiddlewares = this.middlewares.filter((middleware) =>
      middleware.shouldExecute(context),
    );

    this.logger.debug(
      `Executing ${applicableMiddlewares.length} applicable middlewares`,
      LogContext.SYSTEM,
      { middlewareCount: applicableMiddlewares.length },
    );

    await this.executeMiddlewares(applicableMiddlewares, context, 0);
  }

  /**
   * 递归执行中间件
   */
  private async executeMiddlewares(
    middlewares: IAsyncContextMiddleware[],
    context: IAsyncContext,
    index: number,
  ): Promise<void> {
    if (index >= middlewares.length) {
      return;
    }

    const middleware = middlewares[index];
    const next = () => this.executeMiddlewares(middlewares, context, index + 1);

    await middleware.execute(context, next);
  }

  /**
   * 清除所有中间件
   */
  public clear(): void {
    this.middlewares.length = 0;
    this.logger.debug('Cleared all middlewares', LogContext.SYSTEM);
  }

  /**
   * 获取中间件统计信息
   */
  public getStatistics(): {
    totalMiddlewares: number;
    middlewareNames: string[];
    priorityRange: { min: number; max: number };
  } {
    const priorities = this.middlewares.map((m) => m.priority);
    return {
      totalMiddlewares: this.middlewares.length,
      middlewareNames: this.middlewares.map((m) => m.name),
      priorityRange: {
        min: priorities.length > 0 ? Math.min(...priorities) : 0,
        max: priorities.length > 0 ? Math.max(...priorities) : 0,
      },
    };
  }
}
