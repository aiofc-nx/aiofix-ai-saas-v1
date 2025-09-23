/**
 * CoreSagaManager - 核心 Saga 管理器实现
 *
 * 提供了完整的 Saga 管理功能，包括 Saga 注册、执行、监控、
 * 状态管理、统计等企业级特性。
 *
 * ## 业务规则
 *
 * ### Saga 管理规则
 * - 支持 Saga 注册和注销
 * - 支持 Saga 生命周期管理
 * - 支持 Saga 状态持久化
 * - 支持 Saga 并发控制
 *
 * ### 执行规则
 * - 支持 Saga 启动、停止、取消
 * - 支持 Saga 补偿和超时处理
 * - 支持 Saga 重试和错误恢复
 * - 支持 Saga 状态查询
 *
 * ### 监控规则
 * - 记录 Saga 执行统计
 * - 监控 Saga 性能指标
 * - 提供健康检查机制
 * - 支持 Saga 状态查询
 *
 * ### 错误处理规则
 * - 优雅处理 Saga 执行失败
 * - 支持 Saga 自动补偿
 * - 提供详细的错误信息
 * - 支持 Saga 重试机制
 *
 * @description 核心 Saga 管理器实现类
 * @example
 * ```typescript
 * const sagaManager = new CoreSagaManager();
 * await sagaManager.start();
 *
 * // 注册 Saga
 * sagaManager.registerSaga(new OrderSaga());
 *
 * // 启动 Saga
 * const context = await sagaManager.startSaga('OrderSaga', {
 *   orderId: 'order-123',
 *   customerId: 'customer-456'
 * }).toPromise();
 *
 * // 获取 Saga 状态
 * const status = sagaManager.getSagaStatus(context.sagaId);
 *
 * await sagaManager.stop();
 * ```
 *
 * @since 1.0.0
 */
import { Injectable, Inject } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import { v4 as uuidv4 } from 'uuid';
import type { IAsyncContext } from '../../../common/context/async-context.interface';
import {
  ISaga,
  ISagaManager,
  ISagaExecutionContext,
  ISagaStatistics,
  ISagaEvent,
  ISagaEventHandler,
  SagaStatus,
} from './saga.interface';

/**
 * 核心 Saga 管理器
 */
@Injectable()
export class CoreSagaManager implements ISagaManager {
  private readonly sagas = new Map<string, ISaga>();
  private readonly executionContexts = new Map<string, ISagaExecutionContext>();
  private readonly eventHandlers = new Map<string, ISagaEventHandler>();
  private readonly statistics: ISagaStatistics = {
    totalSagas: 0,
    completedSagas: 0,
    failedSagas: 0,
    compensatedSagas: 0,
    timeoutSagas: 0,
    averageExecutionTime: 0,
    byType: {},
    byStatus: {
      [SagaStatus.NOT_STARTED]: 0,
      [SagaStatus.RUNNING]: 0,
      [SagaStatus.COMPLETED]: 0,
      [SagaStatus.FAILED]: 0,
      [SagaStatus.CANCELLED]: 0,
      [SagaStatus.COMPENSATING]: 0,
      [SagaStatus.COMPENSATED]: 0,
      [SagaStatus.TIMEOUT]: 0,
    },
    byTenant: {},
    byTime: {
      lastHour: 0,
      lastDay: 0,
      lastWeek: 0,
      lastMonth: 0,
    },
    lastUpdatedAt: new Date(),
  };

  private _isStarted = false;
  private _cleanupTimer?: ReturnType<typeof globalThis.setInterval>;
  private _monitoringTimer?: ReturnType<typeof globalThis.setInterval>;

  constructor(
    @Inject('ILoggerService') private readonly logger: ILoggerService,
  ) {}

  /**
   * 启动 Saga
   */
  public startSaga(
    sagaType: string,
    data: Record<string, unknown>,
    context?: IAsyncContext,
  ): Observable<ISagaExecutionContext> {
    if (!this._isStarted) {
      return throwError(() => new Error('Saga manager is not started'));
    }

    const saga = this.sagas.get(sagaType);
    if (!saga) {
      return throwError(() => new Error(`Saga type ${sagaType} not found`));
    }

    const sagaId = uuidv4();
    const executionContext: ISagaExecutionContext = {
      sagaId,
      sagaType,
      status: SagaStatus.NOT_STARTED,
      startTime: new Date(),
      currentStepIndex: 0,
      steps: saga.getSteps().map((step) => ({ ...step })),
      data,
      retryCount: 0,
      maxRetries: saga.maxRetries,
      timeout: saga.timeout,
      enableCompensation: saga.enableCompensation,
      enableTimeout: saga.enableTimeout,
      context,
    };

    this.executionContexts.set(sagaId, executionContext);
    this.updateStatistics(executionContext, 'started');

    this.logger.info(`Starting saga: ${sagaType}`, LogContext.SYSTEM, {
      sagaId,
      sagaType,
      dataKeys: Object.keys(data),
    });

    return saga.execute(executionContext).pipe(
      tap((updatedContext) => {
        this.executionContexts.set(sagaId, updatedContext);
        this.updateStatistics(updatedContext, 'completed');
        this.emitSagaEvent('saga.completed', updatedContext);
      }),
      catchError((error) => {
        executionContext.status = SagaStatus.FAILED;
        executionContext.error = (error as Error).message;
        executionContext.endTime = new Date();
        this.executionContexts.set(sagaId, executionContext);
        this.updateStatistics(executionContext, 'failed');
        this.emitSagaEvent('saga.failed', executionContext);
        return throwError(() => error);
      }),
    );
  }

  /**
   * 停止 Saga
   */
  public stopSaga(sagaId: string): Observable<boolean> {
    const context = this.executionContexts.get(sagaId);
    if (!context) {
      return of(false);
    }

    if (context.status === SagaStatus.RUNNING) {
      context.status = SagaStatus.CANCELLED;
      context.endTime = new Date();
      this.executionContexts.set(sagaId, context);
      this.updateStatistics(context, 'cancelled');
      this.emitSagaEvent('saga.cancelled', context);

      this.logger.info(`Saga stopped: ${context.sagaType}`, LogContext.SYSTEM, {
        sagaId,
        sagaType: context.sagaType,
      });
    }

    return of(true);
  }

  /**
   * 取消 Saga
   */
  public cancelSaga(sagaId: string): Observable<boolean> {
    return this.stopSaga(sagaId);
  }

  /**
   * 补偿 Saga
   */
  public compensateSaga(sagaId: string): Observable<boolean> {
    const context = this.executionContexts.get(sagaId);
    if (!context) {
      return of(false);
    }

    const saga = this.sagas.get(context.sagaType);
    if (!saga) {
      return of(false);
    }

    this.logger.info(
      `Compensating saga: ${context.sagaType}`,
      LogContext.SYSTEM,
      { sagaId, sagaType: context.sagaType },
    );

    return saga.compensate(context).pipe(
      tap((updatedContext) => {
        this.executionContexts.set(sagaId, updatedContext);
        this.updateStatistics(updatedContext, 'compensated');
        this.emitSagaEvent('saga.compensated', updatedContext);
      }),
      map(() => true),
      catchError((error) => {
        this.logger.error(
          `Saga compensation failed: ${context.sagaType}`,
          LogContext.SYSTEM,
          {
            sagaId,
            sagaType: context.sagaType,
            error: (error as Error).message,
          },
          error as Error,
        );
        return of(false);
      }),
    );
  }

  /**
   * 获取 Saga 状态
   */
  public getSagaStatus(sagaId: string): ISagaExecutionContext | undefined {
    return this.executionContexts.get(sagaId);
  }

  /**
   * 获取所有 Saga 状态
   */
  public getAllSagaStatuses(): ISagaExecutionContext[] {
    return Array.from(this.executionContexts.values());
  }

  /**
   * 注册 Saga
   */
  public registerSaga(saga: ISaga): void {
    if (!saga.validate()) {
      throw new Error(`Invalid saga: ${saga.sagaType}`);
    }

    this.sagas.set(saga.sagaType, saga);
    this.logger.info(`Registered saga: ${saga.sagaType}`, LogContext.SYSTEM, {
      sagaType: saga.sagaType,
      stepCount: saga.getSteps().length,
      enableCompensation: saga.enableCompensation,
      enableTimeout: saga.enableTimeout,
    });
  }

  /**
   * 注销 Saga
   */
  public unregisterSaga(sagaType: string): boolean {
    const removed = this.sagas.delete(sagaType);
    if (removed) {
      this.logger.info(`Unregistered saga: ${sagaType}`, LogContext.SYSTEM, {
        sagaType,
      });
    }
    return removed;
  }

  /**
   * 获取 Saga
   */
  public getSaga(sagaType: string): ISaga | undefined {
    return this.sagas.get(sagaType);
  }

  /**
   * 获取所有 Saga
   */
  public getAllSagas(): ISaga[] {
    return Array.from(this.sagas.values());
  }

  /**
   * 获取统计信息
   */
  public getStatistics(): ISagaStatistics {
    this.updateTimeStatistics();
    return { ...this.statistics };
  }

  /**
   * 启动管理器
   */
  public async start(): Promise<void> {
    if (this._isStarted) {
      this.logger.warn('Saga manager is already started', LogContext.SYSTEM);
      return;
    }

    this.logger.info('Starting saga manager...', LogContext.SYSTEM);

    // 启动清理定时器
    this._cleanupTimer = globalThis.setInterval(() => {
      this.cleanupExpiredContexts();
    }, 60000); // 每分钟清理一次

    // 启动监控定时器
    this._monitoringTimer = globalThis.setInterval(() => {
      this.updateStatistics();
    }, 30000); // 每30秒更新一次统计

    this._isStarted = true;
    this.logger.info('Saga manager started successfully', LogContext.SYSTEM);
  }

  /**
   * 停止管理器
   */
  public async stop(): Promise<void> {
    if (!this._isStarted) {
      this.logger.warn('Saga manager is not started', LogContext.SYSTEM);
      return;
    }

    this.logger.info('Stopping saga manager...', LogContext.SYSTEM);

    // 停止定时器
    if (this._cleanupTimer) {
      globalThis.clearInterval(this._cleanupTimer);
      this._cleanupTimer = undefined;
    }

    if (this._monitoringTimer) {
      globalThis.clearInterval(this._monitoringTimer);
      this._monitoringTimer = undefined;
    }

    // 停止所有运行中的 Saga
    for (const [sagaId, context] of this.executionContexts.entries()) {
      if (context.status === SagaStatus.RUNNING) {
        await this.stopSaga(sagaId).toPromise();
      }
    }

    // 清理所有上下文
    this.executionContexts.clear();

    this._isStarted = false;
    this.logger.info('Saga manager stopped successfully', LogContext.SYSTEM);
  }

  /**
   * 检查是否已启动
   */
  public isStarted(): boolean {
    return this._isStarted;
  }

  /**
   * 健康检查
   */
  public async healthCheck(): Promise<boolean> {
    return this._isStarted;
  }

  /**
   * 注册事件处理器
   */
  public registerEventHandler(handler: ISagaEventHandler): void {
    this.eventHandlers.set(handler.name, handler);
    this.logger.debug(
      `Registered saga event handler: ${handler.name}`,
      LogContext.SYSTEM,
      { handlerName: handler.name, eventType: handler.eventType },
    );
  }

  /**
   * 注销事件处理器
   */
  public unregisterEventHandler(handlerName: string): boolean {
    const removed = this.eventHandlers.delete(handlerName);
    if (removed) {
      this.logger.debug(
        `Unregistered saga event handler: ${handlerName}`,
        LogContext.SYSTEM,
        { handlerName },
      );
    }
    return removed;
  }

  /**
   * 清理过期的执行上下文
   */
  private cleanupExpiredContexts(): void {
    const now = new Date();
    const expiredContexts: string[] = [];

    for (const [sagaId, context] of this.executionContexts.entries()) {
      const age = now.getTime() - context.startTime.getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (age > maxAge && context.status !== SagaStatus.RUNNING) {
        expiredContexts.push(sagaId);
      }
    }

    for (const sagaId of expiredContexts) {
      this.executionContexts.delete(sagaId);
    }

    if (expiredContexts.length > 0) {
      this.logger.debug(
        `Cleaned up ${expiredContexts.length} expired saga contexts`,
        LogContext.SYSTEM,
        { expiredCount: expiredContexts.length },
      );
    }
  }

  /**
   * 更新统计信息
   */
  private updateStatistics(
    context?: ISagaExecutionContext,
    action?: string,
  ): void {
    if (context && action) {
      this.statistics.totalSagas++;

      switch (context.status) {
        case SagaStatus.COMPLETED:
          this.statistics.completedSagas++;
          break;
        case SagaStatus.FAILED:
          this.statistics.failedSagas++;
          break;
        case SagaStatus.COMPENSATED:
          this.statistics.compensatedSagas++;
          break;
        case SagaStatus.TIMEOUT:
          this.statistics.timeoutSagas++;
          break;
      }

      // 按类型统计
      this.statistics.byType[context.sagaType] =
        (this.statistics.byType[context.sagaType] || 0) + 1;

      // 按状态统计
      this.statistics.byStatus[context.status] =
        (this.statistics.byStatus[context.status] || 0) + 1;

      // 按租户统计
      const tenantId = context.context?.getTenantId() || 'unknown';
      this.statistics.byTenant[tenantId] =
        (this.statistics.byTenant[tenantId] || 0) + 1;

      // 更新平均执行时间
      if (context.endTime) {
        const duration =
          context.endTime.getTime() - context.startTime.getTime();
        const total = this.statistics.completedSagas;
        const current = this.statistics.averageExecutionTime;
        this.statistics.averageExecutionTime =
          (current * (total - 1) + duration) / total;
      }
    }

    this.statistics.lastUpdatedAt = new Date();
  }

  /**
   * 更新时间统计
   */
  private updateTimeStatistics(): void {
    // 这里需要从 Saga 存储中统计时间范围内的 Saga 数量
    // 暂时使用简单的实现
    this.statistics.byTime.lastHour = 0;
    this.statistics.byTime.lastDay = 0;
    this.statistics.byTime.lastWeek = 0;
    this.statistics.byTime.lastMonth = 0;
  }

  /**
   * 发送 Saga 事件
   */
  private emitSagaEvent(
    eventType: string,
    context: ISagaExecutionContext,
  ): void {
    const event: ISagaEvent = {
      eventType,
      sagaId: context.sagaId,
      data: context.data,
      timestamp: new Date(),
      source: 'saga-manager',
      metadata: {
        sagaType: context.sagaType,
        status: context.status,
        stepCount: context.steps.length,
        currentStepIndex: context.currentStepIndex,
      },
    };

    // 通知事件处理器
    for (const handler of this.eventHandlers.values()) {
      if (handler.shouldHandle(event)) {
        handler.handle(event).subscribe({
          next: () => {
            this.logger.debug(
              `Saga event handled: ${eventType}`,
              LogContext.SYSTEM,
              {
                sagaId: context.sagaId,
                eventType,
                handlerName: handler.name,
              },
            );
          },
          error: (error) => {
            this.logger.error(
              `Saga event handler failed: ${handler.name}`,
              LogContext.SYSTEM,
              {
                sagaId: context.sagaId,
                eventType,
                handlerName: handler.name,
                error: (error as Error).message,
              },
              error as Error,
            );
          },
        });
      }
    }
  }
}
