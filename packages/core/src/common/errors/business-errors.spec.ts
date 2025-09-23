/**
 * BusinessErrors 测试
 *
 * 测试业务错误类的功能，包括实体操作、业务规则验证等错误。
 *
 * @description 业务错误类的单元测试
 * @since 1.0.0
 */

import {
  EntityNotFoundError,
  EntityAlreadyExistsError,
  BusinessRuleViolationError,
  OperationNotAllowedError,
  InsufficientPermissionsError,
  QuotaExceededError,
  OperationTimeoutError,
  ConcurrentModificationError,
} from './business-errors';
import { CommonErrorCodes, ErrorSeverity } from './error.types';
import { IErrorContext } from './error.types';

describe('BusinessErrors', () => {
  let testContext: Partial<IErrorContext>;

  beforeEach(() => {
    testContext = {
      tenantId: 'tenant-123',
      userId: 'user-456',
      requestId: 'req-789',
      correlationId: 'corr-101',
      causationId: 'cause-202',
      userAgent: 'TestAgent/1.0',
      ipAddress: '192.168.1.1',
      timestamp: new Date(),
      source: 'SYSTEM',
    };
  });

  describe('EntityNotFoundError', () => {
    it('应该正确创建实体不存在错误', () => {
      const error = new EntityNotFoundError('User', 'user-123', testContext);

      expect(error.message).toBe("User with ID 'user-123' not found");
      expect(error.code).toBe(CommonErrorCodes.BIZ_ENTITY_NOT_FOUND);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.isRecoverable()).toBe(true);
      expect(error.isRetryable()).toBe(false);
      expect(error.hasTag('entity')).toBe(true);
      expect(error.hasTag('not-found')).toBe(true);
      expect(error.hasTag('user')).toBe(true);
    });

    it('应该使用默认上下文创建错误', () => {
      const error = new EntityNotFoundError('Product', 'prod-456');

      expect(error.message).toBe("Product with ID 'prod-456' not found");
      expect(error.code).toBe(CommonErrorCodes.BIZ_ENTITY_NOT_FOUND);
      expect(error.hasTag('product')).toBe(true);
    });

    it('应该处理特殊字符的实体ID', () => {
      const specialId = 'user@domain.com';
      const error = new EntityNotFoundError('User', specialId);

      expect(error.message).toBe(`User with ID '${specialId}' not found`);
    });
  });

  describe('EntityAlreadyExistsError', () => {
    it('应该正确创建实体已存在错误', () => {
      const error = new EntityAlreadyExistsError(
        'User',
        'user-123',
        testContext,
      );

      expect(error.message).toBe("User with ID 'user-123' already exists");
      expect(error.code).toBe(CommonErrorCodes.BIZ_ENTITY_ALREADY_EXISTS);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.isRecoverable()).toBe(true);
      expect(error.isRetryable()).toBe(false);
      expect(error.hasTag('entity')).toBe(true);
      expect(error.hasTag('already-exists')).toBe(true);
      expect(error.hasTag('user')).toBe(true);
    });

    it('应该使用默认上下文创建错误', () => {
      const error = new EntityAlreadyExistsError('Product', 'prod-456');

      expect(error.message).toBe("Product with ID 'prod-456' already exists");
      expect(error.code).toBe(CommonErrorCodes.BIZ_ENTITY_ALREADY_EXISTS);
      expect(error.hasTag('product')).toBe(true);
    });
  });

  describe('BusinessRuleViolationError', () => {
    it('应该正确创建业务规则违反错误', () => {
      const error = new BusinessRuleViolationError(
        'User age must be at least 18',
        'User age validation rule',
        testContext,
      );

      expect(error.message).toBe(
        'Business rule violation: User age must be at least 18',
      );
      expect(error.code).toBe(CommonErrorCodes.BIZ_BUSINESS_RULE_VIOLATION);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.isRecoverable()).toBe(true);
      expect(error.isRetryable()).toBe(false);
      expect(error.hasTag('business-rule')).toBe(true);
      expect(error.hasTag('violation')).toBe(true);
    });

    it('应该使用默认上下文创建错误', () => {
      const error = new BusinessRuleViolationError(
        'Order total must be positive',
        'Order validation rule',
      );

      expect(error.message).toBe(
        'Business rule violation: Order total must be positive',
      );
      expect(error.code).toBe(CommonErrorCodes.BIZ_BUSINESS_RULE_VIOLATION);
    });
  });

  describe('OperationNotAllowedError', () => {
    it('应该正确创建操作不允许错误', () => {
      const error = new OperationNotAllowedError(
        'DELETE',
        'User',
        undefined,
        testContext,
      );

      expect(error.message).toBe("Operation 'DELETE' is not allowed on User");
      expect(error.code).toBe(CommonErrorCodes.BIZ_OPERATION_NOT_ALLOWED);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.isRecoverable()).toBe(true);
      expect(error.isRetryable()).toBe(false);
      expect(error.hasTag('operation')).toBe(true);
      expect(error.hasTag('not-allowed')).toBe(true);
      expect(error.hasTag('user')).toBe(true);
    });

    it('应该使用默认上下文创建错误', () => {
      const error = new OperationNotAllowedError('UPDATE', 'Product');

      expect(error.message).toBe(
        "Operation 'UPDATE' is not allowed on Product",
      );
      expect(error.code).toBe(CommonErrorCodes.BIZ_OPERATION_NOT_ALLOWED);
      expect(error.hasTag('product')).toBe(true);
    });
  });

  describe('InsufficientPermissionsError', () => {
    it('应该正确创建权限不足错误', () => {
      const error = new InsufficientPermissionsError(
        'READ',
        ['read:user'],
        testContext,
      );

      expect(error.message).toBe(
        "Insufficient permissions for operation 'READ'",
      );
      expect(error.code).toBe(CommonErrorCodes.BIZ_INSUFFICIENT_PERMISSIONS);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.isRecoverable()).toBe(true);
      expect(error.isRetryable()).toBe(false);
      expect(error.hasTag('permissions')).toBe(true);
      expect(error.hasTag('insufficient')).toBe(true);
      expect(error.hasTag('read')).toBe(true);
    });

    it('应该使用默认上下文创建错误', () => {
      const error = new InsufficientPermissionsError('WRITE', [
        'write:product',
      ]);

      expect(error.message).toBe(
        "Insufficient permissions for operation 'WRITE'",
      );
      expect(error.code).toBe(CommonErrorCodes.BIZ_INSUFFICIENT_PERMISSIONS);
      expect(error.hasTag('write')).toBe(true);
    });
  });

  describe('QuotaExceededError', () => {
    it('应该正确创建配额超限错误', () => {
      const error = new QuotaExceededError('API_CALLS', 1000, 500, testContext);

      expect(error.message).toBe('Quota exceeded for API_CALLS: 1000/500');
      expect(error.code).toBe(CommonErrorCodes.BIZ_QUOTA_EXCEEDED);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.isRecoverable()).toBe(true);
      expect(error.isRetryable()).toBe(false);
      expect(error.hasTag('quota')).toBe(true);
      expect(error.hasTag('exceeded')).toBe(true);
      expect(error.hasTag('api_calls')).toBe(true);
    });

    it('应该使用默认上下文创建错误', () => {
      const error = new QuotaExceededError('STORAGE', 1024, 512);

      expect(error.message).toBe('Quota exceeded for STORAGE: 1024/512');
      expect(error.code).toBe(CommonErrorCodes.BIZ_QUOTA_EXCEEDED);
      expect(error.hasTag('storage')).toBe(true);
    });
  });

  describe('OperationTimeoutError', () => {
    it('应该正确创建操作超时错误', () => {
      const error = new OperationTimeoutError(
        'Database query',
        5000,
        testContext,
      );

      expect(error.message).toBe(
        "Operation 'Database query' timed out after 5000ms",
      );
      expect(error.code).toBe(CommonErrorCodes.BIZ_OPERATION_TIMEOUT);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.isRecoverable()).toBe(true);
      expect(error.isRetryable()).toBe(true);
      expect(error.hasTag('timeout')).toBe(true);
      expect(error.hasTag('operation')).toBe(true);
    });

    it('应该使用默认上下文创建错误', () => {
      const error = new OperationTimeoutError('API call', 30000);

      expect(error.message).toBe(
        "Operation 'API call' timed out after 30000ms",
      );
      expect(error.code).toBe(CommonErrorCodes.BIZ_OPERATION_TIMEOUT);
    });
  });

  describe('ConcurrentModificationError', () => {
    it('应该正确创建并发修改错误', () => {
      const error = new ConcurrentModificationError(
        'User',
        'user-123',
        1,
        2,
        testContext,
      );

      expect(error.message).toBe(
        "Concurrent modification detected for User 'user-123'",
      );
      expect(error.code).toBe(CommonErrorCodes.BIZ_CONCURRENT_MODIFICATION);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.isRecoverable()).toBe(true);
      expect(error.isRetryable()).toBe(true);
      expect(error.hasTag('concurrent')).toBe(true);
      expect(error.hasTag('modification')).toBe(true);
      expect(error.hasTag('user')).toBe(true);
    });

    it('应该使用默认上下文创建错误', () => {
      const error = new ConcurrentModificationError(
        'Product',
        'prod-123',
        5,
        6,
      );

      expect(error.message).toBe(
        "Concurrent modification detected for Product 'prod-123'",
      );
      expect(error.code).toBe(CommonErrorCodes.BIZ_CONCURRENT_MODIFICATION);
      expect(error.hasTag('product')).toBe(true);
    });
  });

  describe('边界情况', () => {
    it('应该处理空字符串参数', () => {
      const error = new EntityNotFoundError('', '');
      expect(error.message).toBe(" with ID '' not found");
    });

    it('应该处理特殊字符参数', () => {
      const specialChars = '@#$%^&*()';
      const error = new EntityNotFoundError(specialChars, specialChars);
      expect(error.message).toBe(
        `${specialChars} with ID '${specialChars}' not found`,
      );
    });

    it('应该处理长字符串参数', () => {
      const longString = 'A'.repeat(100);
      const error = new EntityNotFoundError(longString, longString);
      expect(error.message).toBe(
        `${longString} with ID '${longString}' not found`,
      );
    });

    it('应该处理数字参数', () => {
      const error = new QuotaExceededError('API_CALLS', 1000, 500);
      expect(error.message).toBe('Quota exceeded for API_CALLS: 1000/500');
    });

    it('应该处理零值参数', () => {
      const error = new OperationTimeoutError('Test operation', 0);
      expect(error.message).toBe(
        "Operation 'Test operation' timed out after 0ms",
      );
    });

    it('应该处理极大数值', () => {
      const error = new QuotaExceededError(
        'STORAGE',
        Number.MAX_SAFE_INTEGER,
        Number.MAX_VALUE,
      );
      expect(error.message).toContain(Number.MAX_SAFE_INTEGER.toString());
    });

    it('应该处理负数参数', () => {
      const error = new QuotaExceededError('API_CALLS', -10, 100);
      expect(error.message).toBe('Quota exceeded for API_CALLS: -10/100');
    });

    it('应该处理Unicode字符', () => {
      const error = new EntityNotFoundError('用户', '用户-123');
      expect(error.message).toBe("用户 with ID '用户-123' not found");
    });

    it('应该处理换行符和制表符', () => {
      const error = new BusinessRuleViolationError(
        'Rule\nwith\ttabs',
        'Test rule',
      );
      expect(error.message).toBe('Business rule violation: Rule\nwith\ttabs');
    });

    it('应该处理简单的操作名称', () => {
      const error = new OperationNotAllowedError('delete', 'User');
      expect(error.message).toBe("Operation 'delete' is not allowed on User");
    });

    it('应该处理大型对象的错误创建', () => {
      const largeData = {
        users: new Array(1000)
          .fill(0)
          .map((_, i) => ({ id: i, name: `User${i}` })),
        metadata: { version: '1.0.0', timestamp: new Date() },
      };

      expect(() => {
        new EntityNotFoundError('User', 'user-123', { customData: largeData });
      }).not.toThrow();
    });
  });

  describe('错误类型验证', () => {
    it('应该正确设置错误类型', () => {
      const errors = [
        new EntityNotFoundError('User', 'user-123'),
        new EntityAlreadyExistsError('User', 'user-123'),
        new BusinessRuleViolationError('Test rule', 'Test rule name'),
        new OperationNotAllowedError('delete', 'User'),
        new InsufficientPermissionsError('read', ['read', 'write']),
        new QuotaExceededError('API_CALLS', 100, 50),
        new OperationTimeoutError('Test operation', 5000),
        new ConcurrentModificationError('Resource', 'resource-123', 1, 2),
      ];

      errors.forEach((error) => {
        expect(error.name).toBeDefined();
        expect(error.message).toBeDefined();
        expect(error.code).toBeDefined();
        expect(error.severity).toBeDefined();
      });
    });

    it('应该正确处理错误的基本属性', () => {
      const error = new EntityNotFoundError('User', 'user-123');

      expect(typeof error.isRecoverable()).toBe('boolean');
      expect(typeof error.isRetryable()).toBe('boolean');
      expect(typeof error.isLoggable()).toBe('boolean');
      expect(typeof error.isAlertable()).toBe('boolean');
      expect(typeof error.isMonitorable()).toBe('boolean');
    });

    it('应该支持错误的字符串表示', () => {
      const error = new EntityNotFoundError('User', 'user-123');
      const str = error.toString();

      expect(typeof str).toBe('string');
      expect(str).toContain('EntityNotFoundError');
      expect(str).toContain('user-123');
    });

    it('应该支持错误的JSON序列化', () => {
      const error = new EntityNotFoundError('User', 'user-123');
      const json = error.toJSON();

      expect(typeof json).toBe('object');
      expect(json).toBeDefined();
    });
  });

  describe('性能和压力测试', () => {
    it('应该能够快速创建大量错误', () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        new EntityNotFoundError('User', `user-${i}`, {});
      }

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成
    });

    it('应该支持错误的批量处理', () => {
      const errors: EntityNotFoundError[] = [];
      for (let i = 0; i < 100; i++) {
        errors.push(new EntityNotFoundError('User', `user-${i}`, {}));
      }

      expect(errors).toHaveLength(100);
      errors.forEach((error, index) => {
        expect(error.message).toContain(`user-${index}`);
      });
    });

    it('应该能够处理并发错误创建', async () => {
      const promises: Array<Promise<void>> = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          new Promise<void>((resolve) => {
            new EntityNotFoundError('User', `user-${i}`, {});
            resolve();
          }),
        );
      }

      await Promise.all(promises);
      expect(promises).toHaveLength(50);
    });
  });
});
