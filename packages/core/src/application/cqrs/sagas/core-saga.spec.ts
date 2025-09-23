/**
 * CoreSaga 测试
 *
 * @description 测试核心 Saga 实现的功能
 * @since 1.0.0
 */

import { CoreSaga } from './core-saga';
import { SagaStatus, SagaStepType, SagaStepStatus } from './saga.interface';
import type { ISagaStep, ISagaExecutionContext } from './saga.interface';
import { Observable, of } from 'rxjs';

/**
 * 测试 Saga 实现
 */
export class TestSaga extends CoreSaga {
  constructor() {
    super('TestSaga', true, true, 10000, 3, 1000);
  }

  protected defineSteps(): ISagaStep[] {
    return [
      {
        stepId: 'step1',
        stepName: 'Step 1',
        stepType: SagaStepType.COMMAND,
        status: SagaStepStatus.PENDING,
        order: 1,
        timeout: 5000,
        retryCount: 0,
        maxRetries: 3,
        retryDelay: 1000,
      },
      {
        stepId: 'step2',
        stepName: 'Step 2',
        stepType: SagaStepType.COMMAND,
        status: SagaStepStatus.PENDING,
        order: 2,
        timeout: 5000,
        retryCount: 0,
        maxRetries: 2,
        retryDelay: 1000,
      },
    ];
  }

  protected executeStep(
    step: ISagaStep,
    _context: ISagaExecutionContext,
  ): Observable<unknown> {
    // 只执行第一个步骤，保持 RUNNING 状态
    if (step.stepId === 'step1') {
      return of({ success: true, data: 'step1-completed' });
    } else if (step.stepId === 'step2') {
      // 第二个步骤不执行，保持 RUNNING 状态
      return of({ success: true, data: 'step2-pending' });
    }
    return of({ success: false, error: 'Unknown step' });
  }

  protected executeCompensationStep(
    step: ISagaStep,
    _context: ISagaExecutionContext,
  ): Observable<unknown> {
    if (step.stepId === 'step1') {
      return of({ success: true, data: 'step1-compensated' });
    } else if (step.stepId === 'step2') {
      return of({ success: true, data: 'step2-compensated' });
    }
    return of({ success: false, error: 'Unknown step' });
  }
}

describe('CoreSaga', () => {
  let saga: TestSaga;

  beforeEach(async () => {
    saga = new TestSaga();
  });

  describe('构造函数', () => {
    it('应该正确初始化 Saga', () => {
      expect(saga.sagaType).toBe('TestSaga');
      expect(saga.enableCompensation).toBe(true);
      expect(saga.enableTimeout).toBe(true);
      expect(saga.timeout).toBe(10000);
      expect(saga.maxRetries).toBe(3);
      expect(saga.retryDelay).toBe(1000);
    });

    it('应该定义正确的步骤', () => {
      const steps = saga.getSteps();
      expect(steps).toHaveLength(2);
      expect(steps[0].stepId).toBe('step1');
      expect(steps[1].stepId).toBe('step2');
    });
  });

  describe('步骤执行', () => {
    it('应该能够执行单个步骤', async () => {
      const context: ISagaExecutionContext = {
        sagaId: 'test-saga-1',
        sagaType: 'TestSaga',
        status: SagaStatus.RUNNING,
        currentStepIndex: 0,
        data: {},
        startTime: new Date(),
        steps: saga.getSteps(),
        retryCount: 0,
        maxRetries: 3,
        enableCompensation: true,
        enableTimeout: true,
      };

      const result = await saga.executeStepById('step1', context);
      expect(result.success).toBe(true);
      expect((result.data as any).data).toBe('step1-completed');
    });

    it('应该能够补偿单个步骤', async () => {
      const context: ISagaExecutionContext = {
        sagaId: 'test-saga-1',
        sagaType: 'TestSaga',
        status: SagaStatus.COMPENSATING,
        currentStepIndex: 0,
        data: {},
        startTime: new Date(),
        steps: saga.getSteps(),
        retryCount: 0,
        maxRetries: 3,
        enableCompensation: true,
        enableTimeout: true,
      };

      const result = await saga.compensateStepById('step1', context);
      expect(result.success).toBe(true);
      expect((result.data as any).data).toBe('step1-compensated');
    });
  });

  describe('状态管理', () => {
    it('应该能够获取 Saga 状态', () => {
      const status = saga.getStatus();
      expect(status).toBe(SagaStatus.NOT_STARTED);
    });

    it('应该能够更新 Saga 状态', () => {
      saga.updateStatus(SagaStatus.RUNNING);
      expect(saga.getStatus()).toBe(SagaStatus.RUNNING);
    });
  });

  describe('配置管理', () => {
    it('应该能够获取 Saga 配置', () => {
      const config = saga.getConfiguration();
      expect(config.enableCompensation).toBe(true);
      expect(config.enableTimeout).toBe(true);
      expect(config.defaultTimeout).toBe(10000);
      expect(config.defaultRetries).toBe(3);
      expect(config.defaultRetryDelay).toBe(1000);
    });

    it('应该能够更新 Saga 配置', () => {
      saga.updateConfiguration({
        enableCompensation: false,
        enableTimeout: true,
        defaultTimeout: 15000,
        defaultRetries: 5,
        defaultRetryDelay: 2000,
      });

      const config = saga.getConfiguration();
      expect(config.enableCompensation).toBe(false);
      expect(config.defaultTimeout).toBe(15000);
      expect(config.defaultRetries).toBe(5);
      expect(config.defaultRetryDelay).toBe(2000);
    });
  });
});
