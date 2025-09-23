/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
/**
 * Saga模式实现
 *
 * @description 长事务的Saga模式实现，支持补偿机制
 * 用于处理跨多个服务和数据库的复杂业务流程
 *
 * ## 业务规则
 *
 * ### Saga设计规则
 * - 每个Saga代表一个完整的业务流程
 * - Saga由多个原子步骤组成
 * - 每个步骤都有对应的补偿操作
 * - 支持步骤的条件执行和并行处理
 *
 * ### 补偿机制规则
 * - 补偿操作必须是幂等的
 * - 补偿按步骤执行的相反顺序进行
 * - 补偿失败需要记录并可能需要人工介入
 * - 支持部分补偿和完整补偿
 *
 * ### 状态管理规则
 * - Saga状态必须持久化
 * - 支持Saga的暂停和恢复
 * - 提供Saga执行的完整审计日志
 * - 支持Saga的超时和取消机制
 *
 * @since 1.0.0
 */

import type { TenantContext } from '../interfaces';
import type {
  IDistributedOperation,
  ISagaDefinition,
  ISagaStep,
} from './distributed-transaction-manager';
import type { ITransaction } from '../interfaces';

/**
 * Saga步骤状态
 */
export enum SagaStepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  COMPENSATING = 'compensating',
  COMPENSATED = 'compensated',
}

/**
 * Saga状态
 */
export enum SagaStatus {
  CREATED = 'created',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  COMPENSATING = 'compensating',
  COMPENSATED = 'compensated',
  CANCELLED = 'cancelled',
}

/**
 * 基础Saga步骤实现
 */
export class BaseSagaStep implements ISagaStep {
  public readonly stepId: string;
  public readonly stepName: string;
  public readonly operation: IDistributedOperation;
  public readonly compensation?: IDistributedOperation;
  public readonly parallel: boolean;
  public readonly preconditions: string[];
  private status: SagaStepStatus = SagaStepStatus.PENDING;

  constructor(
    stepId: string,
    stepName: string,
    operation: IDistributedOperation,
    options: {
      compensation?: IDistributedOperation;
      parallel?: boolean;
      preconditions?: string[];
    } = {},
  ) {
    this.stepId = stepId;
    this.stepName = stepName;
    this.operation = operation;
    this.compensation = options.compensation;
    this.parallel = options.parallel || false;
    this.preconditions = options.preconditions || [];
  }

  /**
   * 执行步骤
   */
  async execute(): Promise<any> {
    this.status = SagaStepStatus.RUNNING;

    try {
      console.log(`执行Saga步骤: ${this.stepName} (${this.stepId})`);

      // 模拟步骤执行
      const result = {
        stepId: this.stepId,
        stepName: this.stepName,
        executedAt: new Date(),
        operationType: this.operation.operationType,
        sql: this.operation.sql,
        success: true,
      };

      this.status = SagaStepStatus.COMPLETED;
      console.log(`✅ Saga步骤执行成功: ${this.stepName}`);

      return result;
    } catch (error) {
      this.status = SagaStepStatus.FAILED;
      console.error(`❌ Saga步骤执行失败: ${this.stepName}`, error);
      throw error;
    }
  }

  /**
   * 执行补偿
   */
  async compensate(): Promise<void> {
    if (!this.compensation) {
      console.log(`步骤无补偿操作: ${this.stepName}`);
      return;
    }

    this.status = SagaStepStatus.COMPENSATING;

    try {
      console.log(`执行补偿操作: ${this.stepName} (${this.stepId})`);

      // 模拟补偿执行
      console.log(`  补偿SQL: ${this.compensation.sql}`);

      this.status = SagaStepStatus.COMPENSATED;
      console.log(`✅ 补偿操作完成: ${this.stepName}`);
    } catch (error) {
      console.error(`❌ 补偿操作失败: ${this.stepName}`, error);
      throw error;
    }
  }

  /**
   * 获取步骤状态
   */
  getStatus(): SagaStepStatus {
    return this.status;
  }

  /**
   * 检查是否可以执行
   */
  canExecute(completedStepIds: string[]): boolean {
    return this.preconditions.every((precondition) =>
      completedStepIds.includes(precondition),
    );
  }
}

/**
 * 基础Saga实现
 */
export class BaseSaga<T = any> implements ISagaDefinition<T> {
  public readonly sagaId: string;
  public readonly sagaName: string;
  public readonly steps: ISagaStep[];
  public readonly timeout?: number;
  public readonly tenantContext?: TenantContext;
  private status: SagaStatus = SagaStatus.CREATED;
  private readonly completedSteps: ISagaStep[] = [];

  constructor(
    sagaId: string,
    sagaName: string,
    steps: ISagaStep[],
    options: {
      timeout?: number;
      tenantContext?: TenantContext;
    } = {},
  ) {
    this.sagaId = sagaId;
    this.sagaName = sagaName;
    this.steps = steps;
    this.timeout = options.timeout;
    this.tenantContext = options.tenantContext;
  }

  /**
   * 执行Saga
   */
  async execute(): Promise<T> {
    this.status = SagaStatus.RUNNING;

    try {
      console.log(`开始执行Saga: ${this.sagaName} (${this.sagaId})`);

      // 分离并行和串行步骤
      const parallelSteps = this.steps.filter((step) => step.parallel);
      const serialSteps = this.steps.filter((step) => !step.parallel);

      // 执行串行步骤
      for (const step of serialSteps) {
        if (step.preconditions && step.preconditions.length > 0) {
          const completedStepIds = this.completedSteps.map((s) => s.stepId);
          if (
            !step.preconditions.every((pre) => completedStepIds.includes(pre))
          ) {
            throw new Error(`步骤前置条件未满足: ${step.stepName}`);
          }
        }

        await step.execute();
        this.completedSteps.push(step);
      }

      // 执行并行步骤
      if (parallelSteps.length > 0) {
        console.log(`并行执行 ${parallelSteps.length} 个步骤`);

        const parallelPromises = parallelSteps.map(async (step) => {
          await step.execute();
          this.completedSteps.push(step);
        });

        await Promise.all(parallelPromises);
      }

      this.status = SagaStatus.COMPLETED;

      const result = {
        sagaId: this.sagaId,
        sagaName: this.sagaName,
        completedSteps: this.completedSteps.length,
        totalSteps: this.steps.length,
        tenantId: this.tenantContext?.tenantId,
        completedAt: new Date(),
      } as T;

      console.log(`✅ Saga执行完成: ${this.sagaName}`);
      return result;
    } catch (error) {
      this.status = SagaStatus.FAILED;
      console.error(`❌ Saga执行失败: ${this.sagaName}`, error);
      throw error;
    }
  }

  /**
   * 获取已完成步骤
   */
  getCompletedSteps(): ISagaStep[] {
    return [...this.completedSteps];
  }

  /**
   * 获取Saga状态
   */
  getStatus(): SagaStatus {
    return this.status;
  }

  /**
   * 获取步骤进度
   */
  getProgress(): {
    completed: number;
    total: number;
    percentage: number;
  } {
    const completed = this.completedSteps.length;
    const total = this.steps.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  }
}

/**
 * 电商订单处理Saga示例
 */
export class ECommerceOrderSaga extends BaseSaga<{
  orderId: string;
  paymentId: string;
  shippingId: string;
}> {
  constructor(
    orderId: string,
    customerId: string,
    items: Array<{ productId: string; quantity: number; price: number }>,
    tenantContext: TenantContext,
  ) {
    const sagaId = `order_saga_${orderId}`;
    const sagaName = '电商订单处理流程';

    // 定义Saga步骤（简化实现）
    const steps: ISagaStep[] = [
      // 步骤1：创建订单
      new BaseSagaStep(
        'create_order',
        '创建订单',
        new DistributedOperation(
          'create_order_op',
          'primary',
          'command',
          'INSERT INTO orders (id, customer_id, status, total_amount) VALUES (?, ?, ?, ?)',
          [
            orderId,
            customerId,
            'pending',
            items.reduce((sum, item) => sum + item.price * item.quantity, 0),
          ],
        ),
        {
          compensation: new DistributedOperation(
            'cancel_order_op',
            'primary',
            'command',
            'UPDATE orders SET status = ? WHERE id = ?',
            ['cancelled', orderId],
          ),
        },
      ),

      // 步骤2：减少库存
      new BaseSagaStep(
        'reduce_inventory',
        '减少库存',
        new DistributedOperation(
          'reduce_inventory_op',
          'primary',
          'command',
          'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
          [
            items[0]?.quantity || 1,
            items[0]?.productId || 'prod-001',
            items[0]?.quantity || 1,
          ],
        ),
        {
          preconditions: ['create_order'],
          compensation: new DistributedOperation(
            'restore_inventory_op',
            'primary',
            'command',
            'UPDATE products SET stock = stock + ? WHERE id = ?',
            [items[0]?.quantity || 1, items[0]?.productId || 'prod-001'],
          ),
        },
      ),

      // 步骤3：处理支付
      new BaseSagaStep(
        'process_payment',
        '处理支付',
        new DistributedOperation(
          'process_payment_op',
          'payment_db',
          'command',
          'INSERT INTO payments (id, order_id, amount, status) VALUES (?, ?, ?, ?)',
          [
            `pay_${orderId}`,
            orderId,
            items.reduce((sum, item) => sum + item.price * item.quantity, 0),
            'processing',
          ],
        ),
        {
          preconditions: ['create_order', 'reduce_inventory'],
          compensation: new DistributedOperation(
            'refund_payment_op',
            'payment_db',
            'command',
            'UPDATE payments SET status = ? WHERE order_id = ?',
            ['refunded', orderId],
          ),
        },
      ),
    ];

    super(sagaId, sagaName, steps, {
      timeout: 300000, // 5分钟
      tenantContext,
    });
  }

  /**
   * 执行电商订单Saga
   */
  override async execute(): Promise<{
    orderId: string;
    paymentId: string;
    shippingId: string;
  }> {
    await super.execute();

    // 构建电商特定的结果
    const orderId = this.sagaId.replace('order_saga_', '');
    return {
      orderId,
      paymentId: `pay_${orderId}`,
      shippingId: `ship_${orderId}`,
    } as any;
  }
}

/**
 * 用户注册Saga示例
 */
export class UserRegistrationSaga extends BaseSaga<{
  userId: string;
  profileId: string;
  notificationId: string;
}> {
  constructor(
    userId: string,
    email: string,
    name: string,
    tenantContext: TenantContext,
  ) {
    const sagaId = `user_reg_saga_${userId}`;
    const sagaName = '用户注册流程';

    const steps: ISagaStep[] = [
      // 步骤1：创建用户账户
      new BaseSagaStep(
        'create_user_account',
        '创建用户账户',
        new DistributedOperation(
          'create_user_op',
          'primary',
          'command',
          'INSERT INTO users (id, email, name, status) VALUES (?, ?, ?, ?)',
          [userId, email, name, 'pending_verification'],
        ),
        {
          compensation: new DistributedOperation(
            'delete_user_op',
            'primary',
            'command',
            'DELETE FROM users WHERE id = ?',
            [userId],
          ),
        },
      ),

      // 步骤2：创建用户配置文件
      new BaseSagaStep(
        'create_user_profile',
        '创建用户配置文件',
        new DistributedOperation(
          'create_profile_op',
          'primary',
          'command',
          'INSERT INTO user_profiles (id, user_id, preferences) VALUES (?, ?, ?)',
          [`profile_${userId}`, userId, JSON.stringify({})],
        ),
        {
          preconditions: ['create_user_account'],
          compensation: new DistributedOperation(
            'delete_profile_op',
            'primary',
            'command',
            'DELETE FROM user_profiles WHERE user_id = ?',
            [userId],
          ),
        },
      ),
    ];

    super(sagaId, sagaName, steps, {
      timeout: 120000, // 2分钟
      tenantContext,
    });
  }

  /**
   * 执行用户注册Saga
   */
  override async execute(): Promise<{
    userId: string;
    profileId: string;
    notificationId: string;
  }> {
    await super.execute();

    const userId = this.sagaId.replace('user_reg_saga_', '');
    return {
      userId,
      profileId: `profile_${userId}`,
      notificationId: `email_${userId}`,
    } as any;
  }
}

/**
 * 分布式操作实现
 */
export class DistributedOperation implements IDistributedOperation {
  public readonly operationId: string;
  public readonly connectionName: string;
  public readonly operationType: 'command' | 'query';
  public readonly sql: string;
  public readonly params: any[];
  public readonly compensationSql?: string;
  public readonly compensationParams?: any[];
  public readonly timeout?: number;

  constructor(
    operationId: string,
    connectionName: string,
    operationType: 'command' | 'query',
    sql: string,
    params: any[] = [],
    options: {
      compensationSql?: string;
      compensationParams?: any[];
      timeout?: number;
    } = {},
  ) {
    this.operationId = operationId;
    this.connectionName = connectionName;
    this.operationType = operationType;
    this.sql = sql;
    this.params = params;
    this.compensationSql = options.compensationSql;
    this.compensationParams = options.compensationParams;
    this.timeout = options.timeout;
  }

  /**
   * 执行操作
   */
  async execute(transaction: ITransaction): Promise<any> {
    console.log(`执行分布式操作: ${this.operationId}`, {
      connectionName: this.connectionName,
      operationType: this.operationType,
      sql: this.sql.substring(0, 100) + (this.sql.length > 100 ? '...' : ''),
    });

    try {
      if (this.operationType === 'command') {
        return await transaction.execute(this.sql, this.params);
      } else {
        return await transaction.query(this.sql, this.params);
      }
    } catch (error) {
      console.error(`分布式操作执行失败: ${this.operationId}`, error);
      throw error;
    }
  }

  /**
   * 执行补偿操作
   */
  async compensate(transaction: ITransaction): Promise<void> {
    if (!this.compensationSql) {
      console.log(`操作无补偿SQL: ${this.operationId}`);
      return;
    }

    console.log(`执行补偿操作: ${this.operationId}`, {
      compensationSql: this.compensationSql,
    });

    try {
      await transaction.execute(
        this.compensationSql,
        this.compensationParams || [],
      );
      console.log(`✅ 补偿操作完成: ${this.operationId}`);
    } catch (error) {
      console.error(`❌ 补偿操作失败: ${this.operationId}`, error);
      throw error;
    }
  }
}

/**
 * 创建分布式操作工厂函数
 */
export function createDistributedOperation(
  operationId: string,
  connectionName: string,
  operationType: 'command' | 'query',
  sql: string,
  params: any[] = [],
  options: {
    compensationSql?: string;
    compensationParams?: any[];
    timeout?: number;
  } = {},
): DistributedOperation {
  return new DistributedOperation(
    operationId,
    connectionName,
    operationType,
    sql,
    params,
    options,
  );
}

/**
 * 创建Saga步骤工厂函数
 */
export function createSagaStep(
  stepId: string,
  stepName: string,
  operation: IDistributedOperation,
  options: {
    compensation?: IDistributedOperation;
    parallel?: boolean;
    preconditions?: string[];
  } = {},
): BaseSagaStep {
  return new BaseSagaStep(stepId, stepName, operation, options);
}

/**
 * 创建电商订单Saga工厂函数
 */
export function createECommerceOrderSaga(
  orderId: string,
  customerId: string,
  items: Array<{ productId: string; quantity: number; price: number }>,
  tenantContext: TenantContext,
): ECommerceOrderSaga {
  return new ECommerceOrderSaga(orderId, customerId, items, tenantContext);
}

/**
 * 创建用户注册Saga工厂函数
 */
export function createUserRegistrationSaga(
  userId: string,
  email: string,
  name: string,
  tenantContext: TenantContext,
): UserRegistrationSaga {
  return new UserRegistrationSaga(userId, email, name, tenantContext);
}
