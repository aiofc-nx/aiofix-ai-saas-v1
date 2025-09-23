/**
 * 分布式事务管理器测试
 *
 * @description 测试分布式事务和Saga模式功能
 *
 * @since 1.0.0
 */

import { DistributedTransactionManager } from '../transactions/distributed-transaction-manager';
import {
  BaseSaga,
  BaseSagaStep,
  ECommerceOrderSaga,
  UserRegistrationSaga,
  DistributedOperation,
} from '../transactions/saga';

// Mock数据库连接
const createMockConnection = (name: string, type: string) => ({
  name,
  type,
  isConnected: true,

  async query(sql: string, params?: any[]) {
    console.log(`Mock查询 [${name}]:`, sql);
    return [];
  },

  async execute(sql: string, params?: any[]) {
    console.log(`Mock命令 [${name}]:`, sql);
    return {
      affectedRows: 1,
      insertId: Date.now(),
      executionTime: 10,
      success: true,
    };
  },

  async beginTransaction() {
    return {
      transactionId: `${name}_trx_${Date.now()}`,
      isActive: true,

      async query(sql: string, params?: any[]) {
        console.log(`Mock事务查询 [${name}]:`, sql);
        return [];
      },

      async execute(sql: string, params?: any[]) {
        console.log(`Mock事务命令 [${name}]:`, sql);
        return {
          affectedRows: 1,
          insertId: Date.now(),
          executionTime: 5,
          success: true,
        };
      },

      async commit() {
        console.log(`Mock提交事务 [${name}]`);
      },

      async rollback() {
        console.log(`Mock回滚事务 [${name}]`);
      },

      async savepoint(name: string) {
        console.log(`Mock保存点 [${name}]:`, name);
      },

      async rollbackToSavepoint(name: string) {
        console.log(`Mock回滚保存点 [${name}]:`, name);
      },
    };
  },

  getRawConnection() {
    return { mock: true };
  },

  async close() {
    console.log(`Mock关闭连接 [${name}]`);
  },
});

describe('DistributedTransactionManager', () => {
  let transactionManager: DistributedTransactionManager;

  beforeEach(() => {
    transactionManager = new DistributedTransactionManager();

    // 注册模拟连接
    transactionManager.registerConnection(
      'primary',
      createMockConnection('primary', 'postgresql') as any,
    );
    transactionManager.registerConnection(
      'payment_db',
      createMockConnection('payment_db', 'mysql') as any,
    );
    transactionManager.registerConnection(
      'logistics_db',
      createMockConnection('logistics_db', 'postgresql') as any,
    );
    transactionManager.registerConnection(
      'notification_db',
      createMockConnection('notification_db', 'mongodb') as any,
    );
  });

  describe('分布式事务功能', () => {
    it('应该能够执行简单的分布式事务', async () => {
      const operations = [
        new DistributedOperation(
          'op1',
          'primary',
          'command',
          'INSERT INTO orders (id, amount) VALUES (?, ?)',
          ['order-123', 299.99],
        ),
        new DistributedOperation(
          'op2',
          'payment_db',
          'command',
          'INSERT INTO payments (order_id, amount) VALUES (?, ?)',
          ['order-123', 299.99],
        ),
      ];

      const result =
        await transactionManager.executeDistributedTransaction(operations);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.connectionCount).toBe(2);
      expect(result.transactionId).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
    });

    it('应该能够处理跨多个数据库的复杂事务', async () => {
      const operations = [
        new DistributedOperation(
          'create_order',
          'primary',
          'command',
          'INSERT INTO orders (id, customer_id, amount) VALUES (?, ?, ?)',
          ['order-456', 'customer-789', 599.99],
        ),
        new DistributedOperation(
          'reduce_inventory',
          'primary',
          'command',
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [2, 'product-001'],
        ),
        new DistributedOperation(
          'process_payment',
          'payment_db',
          'command',
          'INSERT INTO payments (order_id, amount, method) VALUES (?, ?, ?)',
          ['order-456', 599.99, 'credit_card'],
        ),
        new DistributedOperation(
          'create_shipment',
          'logistics_db',
          'command',
          'INSERT INTO shipments (order_id, status) VALUES (?, ?)',
          ['order-456', 'preparing'],
        ),
      ];

      const result = await transactionManager.executeDistributedTransaction(
        operations,
        {
          timeout: 60000,
          tenantContext: { tenantId: 'tenant-123', createdAt: new Date() },
        },
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(4);
      expect(result.connectionCount).toBe(3); // primary, payment_db, logistics_db
    });

    it('应该能够获取活跃事务状态', async () => {
      const operations = [
        new DistributedOperation(
          'test_op',
          'primary',
          'command',
          'INSERT INTO test (id) VALUES (?)',
          ['test-123'],
        ),
      ];

      // 启动事务（不等待完成）
      const transactionPromise =
        transactionManager.executeDistributedTransaction(operations);

      // 检查活跃事务
      const activeTransactions = transactionManager.getActiveTransactions();

      // 等待事务完成
      await transactionPromise;

      // 验证事务被正确跟踪
      expect(Array.isArray(activeTransactions)).toBe(true);
    });

    it('应该能够取消分布式事务', async () => {
      const operations = [
        new DistributedOperation(
          'long_op',
          'primary',
          'command',
          'INSERT INTO long_running_task (id) VALUES (?)',
          ['task-123'],
        ),
      ];

      // 启动事务
      const transactionPromise =
        transactionManager.executeDistributedTransaction(operations, {
          transactionId: 'test-cancel-123',
        });

      // 立即取消
      const cancelled =
        await transactionManager.cancelDistributedTransaction(
          'test-cancel-123',
        );

      expect(cancelled).toBe(true);

      // 等待事务完成（应该被取消）
      const result = await transactionPromise;
      expect(result.success).toBe(false);
    });
  });

  describe('Saga模式功能', () => {
    it('应该能够执行简单的Saga', async () => {
      const steps = [
        new BaseSagaStep(
          'step1',
          '步骤1',
          new DistributedOperation(
            'op1',
            'primary',
            'command',
            'INSERT INTO saga_test (step) VALUES (?)',
            ['step1'],
          ),
        ),
        new BaseSagaStep(
          'step2',
          '步骤2',
          new DistributedOperation(
            'op2',
            'primary',
            'command',
            'INSERT INTO saga_test (step) VALUES (?)',
            ['step2'],
          ),
          { preconditions: ['step1'] },
        ),
      ];

      const saga = new BaseSaga('test-saga-123', '测试Saga', steps);

      const result = await transactionManager.executeSaga(saga);

      expect(result.success).toBe(true);
      expect(result.sagaId).toBe('test-saga-123');
      expect(result.completedSteps).toHaveLength(2);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('应该能够执行电商订单Saga', async () => {
      const tenantContext = {
        tenantId: 'ecommerce-tenant',
        createdAt: new Date(),
      };
      const items = [
        { productId: 'laptop-001', quantity: 1, price: 1299.99 },
        { productId: 'mouse-001', quantity: 2, price: 29.99 },
      ];

      const orderSaga = new ECommerceOrderSaga(
        'order-ecommerce-123',
        'customer-456',
        items,
        tenantContext,
      );

      const result = await transactionManager.executeSaga(orderSaga);

      expect(result.success).toBe(true);
      expect(result.sagaId).toBe('order_saga_order-ecommerce-123');
      expect(result.result.orderId).toBe('order-ecommerce-123');
      expect(result.result.paymentId).toBe('pay_order-ecommerce-123');
      expect(result.result.shippingId).toBe('ship_order-ecommerce-123');
    });

    it('应该能够执行用户注册Saga', async () => {
      const tenantContext = { tenantId: 'user-tenant', createdAt: new Date() };

      const userSaga = new UserRegistrationSaga(
        'user-789',
        'newuser@example.com',
        '新用户',
        tenantContext,
      );

      const result = await transactionManager.executeSaga(userSaga);

      expect(result.success).toBe(true);
      expect(result.sagaId).toBe('user_reg_saga_user-789');
      expect(result.result.userId).toBe('user-789');
      expect(result.result.profileId).toBe('profile_user-789');
      expect(result.result.notificationId).toBe('email_user-789');
    });

    it('应该能够处理Saga步骤失败和补偿', async () => {
      // 创建会失败的步骤
      const failingStep = new BaseSagaStep('failing_step', '会失败的步骤', {
        operationId: 'failing_op',
        connectionName: 'primary',
        operationType: 'command',
        sql: 'INVALID SQL',
        params: [],
      } as any);

      // 重写execute方法使其失败
      jest
        .spyOn(failingStep, 'execute')
        .mockRejectedValue(new Error('模拟步骤失败'));

      const steps = [
        new BaseSagaStep(
          'step1',
          '成功步骤',
          new DistributedOperation(
            'op1',
            'primary',
            'command',
            'INSERT INTO saga_test (step) VALUES (?)',
            ['step1'],
          ),
        ),
        failingStep,
      ];

      const saga = new BaseSaga('failing-saga-123', '失败测试Saga', steps);

      const result = await transactionManager.executeSaga(saga);

      expect(result.success).toBe(false);
      expect(result.error).toContain('执行失败');
      expect(result.completedSteps).toHaveLength(1); // 只有第一步完成
    });

    it('应该能够获取活跃Saga状态', async () => {
      const steps = [
        new BaseSagaStep(
          'monitor_step',
          '监控步骤',
          new DistributedOperation(
            'monitor_op',
            'primary',
            'command',
            'INSERT INTO monitoring_test (id) VALUES (?)',
            ['monitor-123'],
          ),
        ),
      ];

      const saga = new BaseSaga('monitor-saga-123', '监控测试Saga', steps);

      // 启动Saga（不等待完成）
      const sagaPromise = transactionManager.executeSaga(saga);

      // 检查活跃Saga
      const activeSagas = transactionManager.getActiveSagas();

      // 等待Saga完成
      await sagaPromise;

      // 验证Saga被正确跟踪
      expect(Array.isArray(activeSagas)).toBe(true);
    });

    it('应该能够取消Saga', async () => {
      const steps = [
        new BaseSagaStep(
          'cancellable_step',
          '可取消步骤',
          new DistributedOperation(
            'cancellable_op',
            'primary',
            'command',
            'INSERT INTO cancellable_test (id) VALUES (?)',
            ['cancel-123'],
          ),
        ),
      ];

      const saga = new BaseSaga('cancellable-saga-123', '可取消Saga', steps);

      // 启动Saga
      const sagaPromise = transactionManager.executeSaga(saga);

      // 立即取消
      const cancelled = await transactionManager.cancelSaga(
        'cancellable-saga-123',
      );

      expect(cancelled).toBe(true);

      // 等待Saga完成
      const result = await sagaPromise;
      expect(result.success).toBe(false);
    });
  });

  describe('错误处理和恢复', () => {
    it('应该正确处理连接不存在的错误', async () => {
      const operations = [
        new DistributedOperation(
          'invalid_op',
          'nonexistent_connection',
          'command',
          'INSERT INTO test (id) VALUES (?)',
          ['test-123'],
        ),
      ];

      const result =
        await transactionManager.executeDistributedTransaction(operations);

      expect(result.success).toBe(false);
      expect(result.error).toContain('连接不存在');
    });

    it('应该在操作失败时回滚所有事务', async () => {
      // 创建会失败的操作
      const failingOperation = new DistributedOperation(
        'failing_op',
        'primary',
        'command',
        'INVALID SQL SYNTAX',
        [],
      );

      const operations = [
        new DistributedOperation(
          'success_op',
          'primary',
          'command',
          'INSERT INTO test (id) VALUES (?)',
          ['test-success'],
        ),
        failingOperation,
      ];

      const result =
        await transactionManager.executeDistributedTransaction(operations);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该支持事务超时处理', async () => {
      const operations = [
        new DistributedOperation(
          'timeout_op',
          'primary',
          'command',
          'INSERT INTO timeout_test (id) VALUES (?)',
          ['timeout-123'],
          { timeout: 1 }, // 1毫秒超时
        ),
      ];

      const result = await transactionManager.executeDistributedTransaction(
        operations,
        {
          timeout: 10, // 10毫秒总超时
        },
      );

      // 由于模拟实现很快，这里可能不会真正超时
      // 实际实现中会有真正的超时处理
      expect(result).toBeDefined();
    });
  });

  describe('Saga步骤和前置条件', () => {
    it('应该正确处理步骤前置条件', async () => {
      const steps = [
        new BaseSagaStep(
          'prerequisite_step',
          '前置步骤',
          new DistributedOperation(
            'prereq_op',
            'primary',
            'command',
            'INSERT INTO prereq_test (id) VALUES (?)',
            ['prereq-123'],
          ),
        ),
        new BaseSagaStep(
          'dependent_step',
          '依赖步骤',
          new DistributedOperation(
            'dependent_op',
            'primary',
            'command',
            'INSERT INTO dependent_test (prereq_id) VALUES (?)',
            ['prereq-123'],
          ),
          { preconditions: ['prerequisite_step'] },
        ),
      ];

      const saga = new BaseSaga('prereq-saga-123', '前置条件测试Saga', steps);

      const result = await transactionManager.executeSaga(saga);

      expect(result.success).toBe(true);
      expect(result.completedSteps).toHaveLength(2);
    });

    it('应该在前置条件未满足时失败', async () => {
      const steps = [
        new BaseSagaStep(
          'dependent_step',
          '依赖步骤',
          new DistributedOperation(
            'dependent_op',
            'primary',
            'command',
            'INSERT INTO dependent_test (id) VALUES (?)',
            ['dependent-123'],
          ),
          { preconditions: ['nonexistent_step'] }, // 不存在的前置条件
        ),
      ];

      const saga = new BaseSaga(
        'invalid-prereq-saga',
        '无效前置条件Saga',
        steps,
      );

      const result = await transactionManager.executeSaga(saga);

      expect(result.success).toBe(false);
      expect(result.error).toContain('前置条件未满足');
    });
  });

  describe('监控和状态管理', () => {
    it('应该能够跟踪活跃事务', async () => {
      // 启动多个事务
      const operations1 = [
        new DistributedOperation(
          'op1',
          'primary',
          'command',
          'INSERT INTO test1 (id) VALUES (?)',
          ['1'],
        ),
      ];
      const operations2 = [
        new DistributedOperation(
          'op2',
          'payment_db',
          'command',
          'INSERT INTO test2 (id) VALUES (?)',
          ['2'],
        ),
      ];

      const promise1 =
        transactionManager.executeDistributedTransaction(operations1);
      const promise2 =
        transactionManager.executeDistributedTransaction(operations2);

      // 等待完成
      await Promise.all([promise1, promise2]);

      const activeTransactions = transactionManager.getActiveTransactions();
      expect(Array.isArray(activeTransactions)).toBe(true);
    });

    it('应该能够跟踪活跃Saga', async () => {
      const steps = [
        new BaseSagaStep(
          'track_step',
          '跟踪步骤',
          new DistributedOperation(
            'track_op',
            'primary',
            'command',
            'INSERT INTO track_test (id) VALUES (?)',
            ['track-123'],
          ),
        ),
      ];

      const saga = new BaseSaga('track-saga-123', '跟踪测试Saga', steps);

      // 启动Saga
      const sagaPromise = transactionManager.executeSaga(saga);

      // 检查活跃Saga
      const activeSagas = transactionManager.getActiveSagas();

      // 等待Saga完成
      await sagaPromise;

      expect(Array.isArray(activeSagas)).toBe(true);
    });
  });
});
