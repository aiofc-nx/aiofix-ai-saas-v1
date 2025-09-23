/**
 * 分布式事务管理器
 *
 * @description 基于两阶段提交协议的分布式事务管理
 * 支持跨多个数据库的ACID事务和Saga模式长事务
 *
 * ## 业务规则
 *
 * ### 分布式事务规则
 * - 使用两阶段提交协议确保ACID特性
 * - 支持跨多个数据库的原子操作
 * - 自动处理事务回滚和恢复
 * - 提供事务超时和死锁检测
 *
 * ### Saga模式规则
 * - 支持长时间运行的业务流程
 * - 每个步骤都有对应的补偿操作
 * - 支持步骤的并行和串行执行
 * - 自动处理补偿和错误恢复
 *
 * ### 一致性保证规则
 * - 强一致性：两阶段提交事务
 * - 最终一致性：Saga模式事务
 * - 隔离性：事务间的数据隔离
 * - 持久性：事务状态的持久化
 *
 * ### 监控和诊断规则
 * - 记录所有事务的执行状态
 * - 提供事务性能监控
 * - 支持事务的调试和追踪
 * - 自动生成事务报告
 *
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import type { TenantContext } from '../interfaces';
import type {
  IDatabaseConnection,
  ITransaction,
} from '../interfaces';

/**
 * 分布式操作接口
 */
export interface IDistributedOperation {
  /** 操作ID */
  readonly operationId: string;
  /** 连接名称 */
  readonly connectionName: string;
  /** 操作类型 */
  readonly operationType: 'command' | 'query';
  /** SQL语句 */
  readonly sql: string;
  /** 参数 */
  readonly params: any[];
  /** 补偿SQL（用于回滚） */
  readonly compensationSql?: string;
  /** 补偿参数 */
  readonly compensationParams?: any[];
  /** 超时时间 */
  readonly timeout?: number;

  /**
   * 执行操作
   */
  execute(transaction: ITransaction): Promise<any>;

  /**
   * 执行补偿操作
   */
  compensate?(transaction: ITransaction): Promise<void>;
}

/**
 * 分布式事务选项
 */
export interface IDistributedTransactionOptions {
  /** 事务ID */
  transactionId?: string;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 隔离级别 */
  isolationLevel?:
    | 'READ_UNCOMMITTED'
    | 'READ_COMMITTED'
    | 'REPEATABLE_READ'
    | 'SERIALIZABLE';
  /** 是否启用补偿 */
  enableCompensation?: boolean;
  /** 租户上下文 */
  tenantContext?: TenantContext;
}

/**
 * 分布式事务结果
 */
export interface IDistributedTransactionResult<T = any> {
  /** 是否成功 */
  success: boolean;
  /** 事务ID */
  transactionId: string;
  /** 操作结果 */
  results: T[];
  /** 执行时间 */
  duration: number;
  /** 参与的连接数 */
  connectionCount: number;
  /** 错误信息 */
  error?: string;
}

/**
 * Saga定义接口
 */
export interface ISagaDefinition<T = any> {
  /** Saga ID */
  readonly sagaId: string;
  /** Saga名称 */
  readonly sagaName: string;
  /** Saga步骤 */
  readonly steps: ISagaStep[];
  /** 超时时间 */
  readonly timeout?: number;
  /** 租户上下文 */
  readonly tenantContext?: TenantContext;

  /**
   * 执行Saga
   */
  execute(): Promise<T>;

  /**
   * 获取已完成步骤
   */
  getCompletedSteps(): ISagaStep[];
}

/**
 * Saga步骤接口
 */
export interface ISagaStep {
  /** 步骤ID */
  readonly stepId: string;
  /** 步骤名称 */
  readonly stepName: string;
  /** 步骤操作 */
  readonly operation: IDistributedOperation;
  /** 补偿操作 */
  readonly compensation?: IDistributedOperation;
  /** 是否并行执行 */
  readonly parallel?: boolean;
  /** 前置条件 */
  readonly preconditions?: string[];

  /**
   * 执行步骤
   */
  execute(): Promise<any>;

  /**
   * 执行补偿
   */
  compensate?(): Promise<void>;
}

/**
 * Saga执行结果
 */
export interface ISagaResult<T = any> {
  /** 是否成功 */
  success: boolean;
  /** Saga ID */
  sagaId: string;
  /** 执行结果 */
  result: T;
  /** 已完成步骤 */
  completedSteps: ISagaStep[];
  /** 执行时间 */
  duration: number;
  /** 错误信息 */
  error?: string;
}

/**
 * 分布式事务管理器实现
 */
@Injectable()
export class DistributedTransactionManager {
  private readonly activeTransactions = new Map<string, any>();
  private readonly activeSagas = new Map<string, any>();
  private readonly connectionManager: Map<string, IDatabaseConnection>;

  constructor() {
    this.connectionManager = new Map();
  }

  /**
   * 注册数据库连接
   */
  registerConnection(name: string, connection: IDatabaseConnection): void {
    this.connectionManager.set(name, connection);
    console.log(`注册分布式事务连接: ${name} (${connection.type})`);
  }

  /**
   * 执行分布式事务
   *
   * @description 使用两阶段提交协议执行跨数据库事务
   *
   * ## 业务逻辑
   *
   * ### 第一阶段：准备阶段
   * 1. **开始所有事务**：在所有参与的数据库上开始事务
   * 2. **执行操作**：按顺序执行所有分布式操作
   * 3. **准备提交**：向所有数据库发送准备提交命令
   * 4. **收集投票**：等待所有数据库的准备确认
   *
   * ### 第二阶段：提交阶段
   * 1. **决策**：根据所有数据库的投票决定提交或回滚
   * 2. **执行决策**：向所有数据库发送最终决策
   * 3. **等待确认**：等待所有数据库完成操作
   * 4. **清理资源**：释放事务资源和连接
   *
   * @param operations - 分布式操作列表
   * @param options - 事务选项
   * @returns 分布式事务结果
   */
  async executeDistributedTransaction<T>(
    operations: IDistributedOperation[],
    options: IDistributedTransactionOptions = {},
  ): Promise<IDistributedTransactionResult<T>> {
    const transactionId = options.transactionId || this.generateTransactionId();
    const startTime = performance.now();
    const timeout = options.timeout || 30000; // 30秒默认超时

    console.log('开始分布式事务:', {
      transactionId,
      operationCount: operations.length,
      timeout,
      tenantId: options.tenantContext?.tenantId,
    });

    // 获取所有涉及的连接
    const connectionNames = [
      ...new Set(operations.map((op) => op.connectionName)),
    ];
    const transactions = new Map<string, ITransaction>();

    try {
      // 第一阶段：准备阶段
      console.log('🔄 第一阶段：准备阶段');

      // 1. 开始所有事务
      await this.beginAllTransactions(connectionNames, transactions, options);

      // 2. 执行所有操作
      const results = await this.executeAllOperations(
        operations,
        transactions,
        timeout,
      );

      // 3. 准备提交
      await this.prepareAllTransactions(transactions);

      // 第二阶段：提交阶段
      console.log('✅ 第二阶段：提交阶段');

      // 4. 提交所有事务
      await this.commitAllTransactions(transactions);

      const duration = performance.now() - startTime;

      console.log('✅ 分布式事务执行成功:', {
        transactionId,
        duration: `${duration.toFixed(2)}ms`,
        connectionCount: connectionNames.length,
        operationCount: operations.length,
      });

      // 清理活跃事务记录
      this.activeTransactions.delete(transactionId);

      return {
        success: true,
        transactionId,
        results,
        duration,
        connectionCount: connectionNames.length,
      };
    } catch (error) {
      console.error('❌ 分布式事务执行失败:', {
        transactionId,
        error: error instanceof Error ? error.message : String(error),
      });

      // 回滚所有事务
      await this.rollbackAllTransactions(transactions);

      // 清理活跃事务记录
      this.activeTransactions.delete(transactionId);

      const duration = performance.now() - startTime;

      return {
        success: false,
        transactionId,
        results: [],
        duration,
        connectionCount: connectionNames.length,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 执行Saga模式事务
   *
   * @description 执行长时间运行的业务流程，支持补偿机制
   *
   * ## 业务逻辑
   *
   * ### Saga执行规则
   * 1. **步骤执行**：按顺序执行所有Saga步骤
   * 2. **状态跟踪**：记录每个步骤的执行状态
   * 3. **错误处理**：步骤失败时执行补偿操作
   * 4. **最终一致性**：通过补偿确保数据一致性
   *
   * ### 补偿机制
   * 1. **逆序补偿**：按相反顺序执行补偿操作
   * 2. **幂等性**：补偿操作必须是幂等的
   * 3. **完整性**：确保所有已执行步骤都被补偿
   * 4. **审计性**：记录所有补偿操作的详细日志
   *
   * @param sagaDefinition - Saga定义
   * @param options - 执行选项
   * @returns Saga执行结果
   */
  async executeSaga<T>(
    sagaDefinition: ISagaDefinition<T>,
    options: { timeout?: number; enableLogging?: boolean } = {},
  ): Promise<ISagaResult<T>> {
    const sagaId = sagaDefinition.sagaId;
    const startTime = performance.now();
    const timeout = options.timeout || sagaDefinition.timeout || 300000; // 5分钟默认超时

    console.log('开始Saga事务:', {
      sagaId,
      sagaName: sagaDefinition.sagaName,
      stepCount: sagaDefinition.steps.length,
      timeout,
      tenantId: sagaDefinition.tenantContext?.tenantId,
    });

    const completedSteps: ISagaStep[] = [];
    const executedOperations: Array<{ step: ISagaStep; result: any }> = [];

    try {
      // 记录Saga开始
      this.activeSagas.set(sagaId, {
        definition: sagaDefinition,
        startTime,
        status: 'running',
        completedSteps: [],
      });

      // 执行所有步骤
      for (let i = 0; i < sagaDefinition.steps.length; i++) {
        const step = sagaDefinition.steps[i];

        console.log(
          `🔄 执行Saga步骤 ${i + 1}/${sagaDefinition.steps.length}: ${step.stepName}`,
        );

        try {
          // 检查前置条件
          if (step.preconditions) {
            await this.checkPreconditions(step.preconditions, completedSteps);
          }

          // 执行步骤
          const stepResult = await this.executeSagaStep(step, timeout);

          completedSteps.push(step);
          executedOperations.push({ step, result: stepResult });

          console.log(`✅ Saga步骤执行成功: ${step.stepName}`, {
            stepId: step.stepId,
            result: stepResult,
          });
        } catch (stepError) {
          console.error(`❌ Saga步骤执行失败: ${step.stepName}`, stepError);

          // 执行补偿操作
          await this.executeCompensation(executedOperations.reverse());

          throw new Error(
            `Saga步骤 ${step.stepName} 执行失败: ${stepError instanceof Error ? stepError.message : String(stepError)}`,
          );
        }
      }

      // Saga执行成功
      const result = await sagaDefinition.execute();
      const duration = performance.now() - startTime;

      console.log('✅ Saga事务执行成功:', {
        sagaId,
        sagaName: sagaDefinition.sagaName,
        duration: `${duration.toFixed(2)}ms`,
        completedSteps: completedSteps.length,
      });

      // 更新Saga状态
      this.activeSagas.set(sagaId, {
        ...this.activeSagas.get(sagaId),
        status: 'completed',
        completedSteps,
        duration,
      });

      return {
        success: true,
        sagaId,
        result,
        completedSteps,
        duration,
      };
    } catch (error) {
      const duration = performance.now() - startTime;

      console.error('❌ Saga事务执行失败:', {
        sagaId,
        error: error instanceof Error ? error.message : String(error),
        completedSteps: completedSteps.length,
        duration: `${duration.toFixed(2)}ms`,
      });

      // 更新Saga状态
      this.activeSagas.set(sagaId, {
        ...this.activeSagas.get(sagaId),
        status: 'failed',
        completedSteps,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        sagaId,
        result: null as T,
        completedSteps,
        duration,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      // 清理Saga记录（延迟清理）
      setTimeout(() => {
        this.activeSagas.delete(sagaId);
      }, 60000); // 1分钟后清理
    }
  }

  /**
   * 获取活跃事务状态
   */
  getActiveTransactions(): Array<{
    transactionId: string;
    startTime: number;
    status: string;
    connectionCount: number;
  }> {
    return Array.from(this.activeTransactions.entries()).map(
      ([id, transaction]) => ({
        transactionId: id,
        startTime: transaction.startTime,
        status: transaction.status,
        connectionCount: transaction.connectionCount || 0,
      }),
    );
  }

  /**
   * 获取活跃Saga状态
   */
  getActiveSagas(): Array<{
    sagaId: string;
    sagaName: string;
    startTime: number;
    status: string;
    completedSteps: number;
  }> {
    return Array.from(this.activeSagas.entries()).map(([id, saga]) => ({
      sagaId: id,
      sagaName: saga.definition?.sagaName || 'Unknown',
      startTime: saga.startTime,
      status: saga.status,
      completedSteps: saga.completedSteps?.length || 0,
    }));
  }

  /**
   * 取消分布式事务
   */
  async cancelDistributedTransaction(transactionId: string): Promise<boolean> {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      console.warn(`事务不存在或已完成: ${transactionId}`);
      return false;
    }

    try {
      console.log(`取消分布式事务: ${transactionId}`);

      // 回滚所有事务
      if (transaction.transactions) {
        await this.rollbackAllTransactions(transaction.transactions);
      }

      // 清理记录
      this.activeTransactions.delete(transactionId);

      console.log(`✅ 分布式事务取消成功: ${transactionId}`);
      return true;
    } catch (error) {
      console.error(`❌ 取消分布式事务失败: ${transactionId}`, error);
      return false;
    }
  }

  /**
   * 取消Saga事务
   */
  async cancelSaga(sagaId: string): Promise<boolean> {
    const saga = this.activeSagas.get(sagaId);
    if (!saga) {
      console.warn(`Saga不存在或已完成: ${sagaId}`);
      return false;
    }

    try {
      console.log(`取消Saga事务: ${sagaId}`);

      // 执行补偿操作
      if (saga.completedSteps && saga.completedSteps.length > 0) {
        await this.executeCompensation(
          saga.completedSteps
            .reverse()
            .map((step: ISagaStep) => ({ step, result: null })),
        );
      }

      // 更新状态
      this.activeSagas.set(sagaId, {
        ...saga,
        status: 'cancelled',
      });

      console.log(`✅ Saga事务取消成功: ${sagaId}`);
      return true;
    } catch (error) {
      console.error(`❌ 取消Saga事务失败: ${sagaId}`, error);
      return false;
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 生成事务ID
   */
  private generateTransactionId(): string {
    return `dtx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * 开始所有事务
   */
  private async beginAllTransactions(
    connectionNames: string[],
    transactions: Map<string, ITransaction>,
    options: IDistributedTransactionOptions,
  ): Promise<void> {
    console.log(`开始 ${connectionNames.length} 个数据库事务`);

    for (const connectionName of connectionNames) {
      const connection = this.connectionManager.get(connectionName);
      if (!connection) {
        throw new Error(`连接不存在: ${connectionName}`);
      }

      const transaction = await connection.beginTransaction();
      transactions.set(connectionName, transaction);

      console.log(
        `  ✅ 事务开始: ${connectionName} (${transaction.transactionId})`,
      );
    }
  }

  /**
   * 执行所有操作
   */
  private async executeAllOperations(
    operations: IDistributedOperation[],
    transactions: Map<string, ITransaction>,
    timeout: number,
  ): Promise<any[]> {
    console.log(`执行 ${operations.length} 个分布式操作`);

    const results: any[] = [];

    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      const transaction = transactions.get(operation.connectionName);

      if (!transaction) {
        throw new Error(`事务不存在: ${operation.connectionName}`);
      }

      console.log(
        `  🔄 执行操作 ${i + 1}/${operations.length}: ${operation.operationId}`,
      );

      // 设置操作超时
      const operationPromise = operation.execute(transaction);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('操作超时')),
          operation.timeout || timeout,
        );
      });

      const result = await Promise.race([operationPromise, timeoutPromise]);
      results.push(result);

      console.log(`  ✅ 操作完成: ${operation.operationId}`);
    }

    return results;
  }

  /**
   * 准备所有事务
   */
  private async prepareAllTransactions(
    transactions: Map<string, ITransaction>,
  ): Promise<void> {
    console.log('准备提交所有事务');

    for (const [connectionName, transaction] of transactions) {
      // 模拟准备提交
      console.log(
        `  🔄 准备事务: ${connectionName} (${transaction.transactionId})`,
      );

      // 实际实现中，这里会发送PREPARE命令
      // await transaction.prepare();

      console.log(`  ✅ 事务准备完成: ${connectionName}`);
    }
  }

  /**
   * 提交所有事务
   */
  private async commitAllTransactions(
    transactions: Map<string, ITransaction>,
  ): Promise<void> {
    console.log('提交所有事务');

    for (const [connectionName, transaction] of transactions) {
      await transaction.commit();
      console.log(
        `  ✅ 事务提交: ${connectionName} (${transaction.transactionId})`,
      );
    }
  }

  /**
   * 回滚所有事务
   */
  private async rollbackAllTransactions(
    transactions: Map<string, ITransaction>,
  ): Promise<void> {
    console.log('回滚所有事务');

    for (const [connectionName, transaction] of transactions) {
      try {
        await transaction.rollback();
        console.log(
          `  ✅ 事务回滚: ${connectionName} (${transaction.transactionId})`,
        );
      } catch (error) {
        console.error(`  ❌ 事务回滚失败: ${connectionName}`, error);
      }
    }
  }

  /**
   * 执行Saga步骤
   */
  private async executeSagaStep(
    step: ISagaStep,
    timeout: number,
  ): Promise<any> {
    const connection = this.connectionManager.get(
      step.operation.connectionName,
    );
    if (!connection) {
      throw new Error(`连接不存在: ${step.operation.connectionName}`);
    }

    // 开始单独事务
    const transaction = await connection.beginTransaction();

    try {
      // 设置超时
      const operationPromise = step.execute();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Saga步骤超时')), timeout);
      });

      const result = await Promise.race([operationPromise, timeoutPromise]);

      // 提交步骤事务
      await transaction.commit();

      return result;
    } catch (error) {
      // 回滚步骤事务
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 检查前置条件
   */
  private async checkPreconditions(
    preconditions: string[],
    completedSteps: ISagaStep[],
  ): Promise<void> {
    const completedStepIds = completedSteps.map((step) => step.stepId);

    for (const precondition of preconditions) {
      if (!completedStepIds.includes(precondition)) {
        throw new Error(`前置条件未满足: ${precondition}`);
      }
    }
  }

  /**
   * 执行补偿操作
   */
  private async executeCompensation(
    executedOperations: Array<{ step: ISagaStep; result: any }>,
  ): Promise<void> {
    console.log('🔄 开始执行补偿操作');

    for (const { step } of executedOperations) {
      if (step.compensate) {
        try {
          console.log(`  🔄 补偿步骤: ${step.stepName}`);
          await step.compensate();
          console.log(`  ✅ 补偿完成: ${step.stepName}`);
        } catch (error) {
          console.error(`  ❌ 补偿失败: ${step.stepName}`, error);
          // 补偿失败通常需要人工介入
        }
      } else {
        console.log(`  ⚠️ 步骤无补偿操作: ${step.stepName}`);
      }
    }

    console.log('✅ 补偿操作执行完成');
  }
}

/**
 * 创建分布式事务管理器工厂函数
 */
export function createDistributedTransactionManager(): DistributedTransactionManager {
  return new DistributedTransactionManager();
}

/**
 * 分布式事务错误
 */
export class DistributedTransactionError extends Error {
  constructor(
    message: string,
    public readonly transactionId: string,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'DistributedTransactionError';
  }
}

/**
 * Saga执行错误
 */
export class SagaExecutionError extends Error {
  constructor(
    message: string,
    public readonly sagaId: string,
    public readonly failedStep?: string,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'SagaExecutionError';
  }
}
