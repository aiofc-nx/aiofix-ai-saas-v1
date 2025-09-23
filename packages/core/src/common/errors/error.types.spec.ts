/**
 * ErrorTypes 测试
 *
 * 测试错误类型定义的功能，包括错误分类、严重性、错误代码等。
 *
 * @description 错误类型定义的单元测试
 * @since 1.0.0
 */

import {
  ErrorSeverity,
  ErrorCategory,
  CommonErrorCodes,
  SystemErrorCodes,
  ValidationErrorCodes,
  AuthorizationErrorCodes,
  NetworkErrorCodes,
  IErrorContext,
  IErrorMetadata,
  IErrorInfo,
} from './error.types';

describe('ErrorTypes', () => {
  describe('ErrorSeverity', () => {
    it('应该定义所有严重性级别', () => {
      expect(ErrorSeverity.INFO).toBe('INFO');
      expect(ErrorSeverity.LOW).toBe('LOW');
      expect(ErrorSeverity.MEDIUM).toBe('MEDIUM');
      expect(ErrorSeverity.HIGH).toBe('HIGH');
      expect(ErrorSeverity.CRITICAL).toBe('CRITICAL');
    });

    it('应该包含所有严重性值', () => {
      const severities = Object.values(ErrorSeverity);
      expect(severities).toHaveLength(5);
      expect(severities).toContain('INFO');
      expect(severities).toContain('LOW');
      expect(severities).toContain('MEDIUM');
      expect(severities).toContain('HIGH');
      expect(severities).toContain('CRITICAL');
    });
  });

  describe('ErrorCategory', () => {
    it('应该定义所有错误类别', () => {
      expect(ErrorCategory.BUSINESS).toBe('BUSINESS');
      expect(ErrorCategory.SYSTEM).toBe('SYSTEM');
      expect(ErrorCategory.VALIDATION).toBe('VALIDATION');
      expect(ErrorCategory.AUTHORIZATION).toBe('AUTHORIZATION');
      expect(ErrorCategory.NETWORK).toBe('NETWORK');
    });

    it('应该包含所有类别值', () => {
      const categories = Object.values(ErrorCategory);
      expect(categories).toHaveLength(10);
      expect(categories).toContain('BUSINESS');
      expect(categories).toContain('SYSTEM');
      expect(categories).toContain('VALIDATION');
      expect(categories).toContain('AUTHORIZATION');
      expect(categories).toContain('NETWORK');
      expect(categories).toContain('DATABASE');
      expect(categories).toContain('EXTERNAL_SERVICE');
      expect(categories).toContain('CONFIGURATION');
      expect(categories).toContain('RESOURCE');
      expect(categories).toContain('UNKNOWN');
    });
  });

  describe('CommonErrorCodes', () => {
    it('应该定义所有通用错误代码', () => {
      expect(CommonErrorCodes.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
      expect(CommonErrorCodes.BIZ_ENTITY_NOT_FOUND).toBe('BIZ-0001');
      expect(CommonErrorCodes.BIZ_ENTITY_ALREADY_EXISTS).toBe('BIZ-0002');
      expect(CommonErrorCodes.BIZ_OPERATION_NOT_ALLOWED).toBe('BIZ-0003');
      expect(CommonErrorCodes.BIZ_BUSINESS_RULE_VIOLATION).toBe('BIZ-0004');
      expect(CommonErrorCodes.BIZ_INSUFFICIENT_PERMISSIONS).toBe('BIZ-0005');
      expect(CommonErrorCodes.BIZ_QUOTA_EXCEEDED).toBe('BIZ-0006');
      expect(CommonErrorCodes.BIZ_OPERATION_TIMEOUT).toBe('BIZ-0007');
      expect(CommonErrorCodes.BIZ_CONCURRENT_MODIFICATION).toBe('BIZ-0008');
    });

    it('应该包含所有通用错误代码值', () => {
      const codes = Object.values(CommonErrorCodes);
      expect(codes.length).toBeGreaterThan(0);
      expect(codes).toContain('UNKNOWN_ERROR');
      expect(codes).toContain('BIZ-0001');
      expect(codes).toContain('BIZ-0002');
    });
  });

  describe('SystemErrorCodes', () => {
    it('应该定义所有系统错误代码', () => {
      expect(SystemErrorCodes.SYS_INTERNAL_ERROR).toBe('SYS-0001');
      expect(SystemErrorCodes.SYS_SERVICE_UNAVAILABLE).toBe('SYS-0002');
      expect(SystemErrorCodes.SYS_OUT_OF_MEMORY).toBe('SYS-0003');
      expect(SystemErrorCodes.SYS_DISK_FULL).toBe('SYS-0004');
      expect(SystemErrorCodes.SYS_CPU_OVERLOAD).toBe('SYS-0005');
      expect(SystemErrorCodes.SYS_NETWORK_ERROR).toBe('SYS-0006');
      expect(SystemErrorCodes.SYS_FILE_SYSTEM_ERROR).toBe('SYS-0007');
      expect(SystemErrorCodes.SYS_PROCESS_CRASH).toBe('SYS-0008');
    });

    it('应该包含所有系统错误代码值', () => {
      const codes = Object.values(SystemErrorCodes);
      expect(codes.length).toBeGreaterThan(0);
      expect(codes).toContain('SYS-0001');
      expect(codes).toContain('SYS-0002');
      expect(codes).toContain('SYS-0003');
    });
  });

  describe('ValidationErrorCodes', () => {
    it('应该定义所有验证错误代码', () => {
      expect(ValidationErrorCodes.VAL_INVALID_INPUT).toBe('VAL-0001');
      expect(ValidationErrorCodes.VAL_REQUIRED_FIELD_MISSING).toBe('VAL-0002');
      expect(ValidationErrorCodes.VAL_INVALID_FORMAT).toBe('VAL-0003');
      expect(ValidationErrorCodes.VAL_VALUE_OUT_OF_RANGE).toBe('VAL-0004');
      expect(ValidationErrorCodes.VAL_DUPLICATE_VALUE).toBe('VAL-0005');
      expect(ValidationErrorCodes.VAL_INVALID_REFERENCE).toBe('VAL-0006');
      expect(ValidationErrorCodes.VAL_CONSTRAINT_VIOLATION).toBe('VAL-0007');
      expect(ValidationErrorCodes.VAL_DATA_TYPE_MISMATCH).toBe('VAL-0008');
    });

    it('应该包含所有验证错误代码值', () => {
      const codes = Object.values(ValidationErrorCodes);
      expect(codes.length).toBeGreaterThan(0);
      expect(codes).toContain('VAL-0001');
      expect(codes).toContain('VAL-0002');
      expect(codes).toContain('VAL-0003');
    });
  });

  describe('AuthorizationErrorCodes', () => {
    it('应该定义所有授权错误代码', () => {
      expect(AuthorizationErrorCodes.AUTH_UNAUTHORIZED).toBe('AUTH-0001');
      expect(AuthorizationErrorCodes.AUTH_FORBIDDEN).toBe('AUTH-0002');
      expect(AuthorizationErrorCodes.AUTH_TOKEN_EXPIRED).toBe('AUTH-0003');
      expect(AuthorizationErrorCodes.AUTH_TOKEN_INVALID).toBe('AUTH-0004');
      expect(AuthorizationErrorCodes.AUTH_INSUFFICIENT_ROLE).toBe('AUTH-0005');
      expect(AuthorizationErrorCodes.AUTH_ACCOUNT_LOCKED).toBe('AUTH-0006');
      expect(AuthorizationErrorCodes.AUTH_ACCOUNT_DISABLED).toBe('AUTH-0007');
      expect(AuthorizationErrorCodes.AUTH_SESSION_EXPIRED).toBe('AUTH-0008');
    });

    it('应该包含所有授权错误代码值', () => {
      const codes = Object.values(AuthorizationErrorCodes);
      expect(codes.length).toBeGreaterThan(0);
      expect(codes).toContain('AUTH-0001');
      expect(codes).toContain('AUTH-0002');
      expect(codes).toContain('AUTH-0003');
    });
  });

  describe('NetworkErrorCodes', () => {
    it('应该定义所有网络错误代码', () => {
      expect(NetworkErrorCodes.NET_CONNECTION_TIMEOUT).toBe('NET-0001');
      expect(NetworkErrorCodes.NET_CONNECTION_REFUSED).toBe('NET-0002');
      expect(NetworkErrorCodes.NET_DNS_RESOLUTION_FAILED).toBe('NET-0003');
      expect(NetworkErrorCodes.NET_SSL_HANDSHAKE_FAILED).toBe('NET-0004');
      expect(NetworkErrorCodes.NET_PROXY_ERROR).toBe('NET-0005');
      expect(NetworkErrorCodes.NET_FIREWALL_BLOCKED).toBe('NET-0006');
      expect(NetworkErrorCodes.NET_BANDWIDTH_EXCEEDED).toBe('NET-0007');
      expect(NetworkErrorCodes.NET_PACKET_LOSS).toBe('NET-0008');
    });

    it('应该包含所有网络错误代码值', () => {
      const codes = Object.values(NetworkErrorCodes);
      expect(codes.length).toBeGreaterThan(0);
      expect(codes).toContain('NET-0001');
      expect(codes).toContain('NET-0002');
      expect(codes).toContain('NET-0003');
    });
  });

  describe('IErrorContext', () => {
    it('应该正确定义错误上下文接口', () => {
      const context: IErrorContext = {
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

      expect(context.tenantId).toBe('tenant-123');
      expect(context.userId).toBe('user-456');
      expect(context.requestId).toBe('req-789');
      expect(context.correlationId).toBe('corr-101');
      expect(context.causationId).toBe('cause-202');
      expect(context.userAgent).toBe('TestAgent/1.0');
      expect(context.ipAddress).toBe('192.168.1.1');
      expect(context.timestamp).toBeInstanceOf(Date);
      expect(context.source).toBe('SYSTEM');
    });

    it('应该支持可选属性', () => {
      const context: IErrorContext = {
        tenantId: 'tenant-123',
        timestamp: new Date(),
      };

      expect(context.tenantId).toBe('tenant-123');
      expect(context.timestamp).toBeInstanceOf(Date);
      expect(context.userId).toBeUndefined();
      expect(context.requestId).toBeUndefined();
    });
  });

  describe('IErrorMetadata', () => {
    it('应该正确定义错误元数据接口', () => {
      const metadata: IErrorMetadata = {
        code: CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
        category: ErrorCategory.BUSINESS,
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        retryable: false,
        loggable: true,
        alertable: false,
        monitorable: true,
        tags: ['entity', 'not-found'],
        description: 'The requested entity does not exist',
        solution: 'Verify the entity ID and try again',
        documentationUrl: 'https://docs.example.com/errors/entity-not-found',
      };

      expect(metadata.code).toBe(CommonErrorCodes.BIZ_ENTITY_NOT_FOUND);
      expect(metadata.severity).toBe(ErrorSeverity.MEDIUM);
      expect(metadata.recoverable).toBe(true);
      expect(metadata.retryable).toBe(false);
      expect(metadata.loggable).toBe(true);
      expect(metadata.alertable).toBe(false);
      expect(metadata.monitorable).toBe(true);
      expect(metadata.tags).toEqual(['entity', 'not-found']);
      expect(metadata.description).toBe('The requested entity does not exist');
      expect(metadata.solution).toBe('Verify the entity ID and try again');
      expect(metadata.documentationUrl).toBe(
        'https://docs.example.com/errors/entity-not-found',
      );
    });

    it('应该支持可选属性', () => {
      const metadata: IErrorMetadata = {
        code: CommonErrorCodes.UNKNOWN_ERROR,
        category: ErrorCategory.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        retryable: false,
        loggable: true,
        alertable: false,
        monitorable: true,
        tags: [],
      };

      expect(metadata.code).toBe(CommonErrorCodes.UNKNOWN_ERROR);
      expect(metadata.severity).toBe(ErrorSeverity.MEDIUM);
      expect(metadata.recoverable).toBe(true);
      expect(metadata.retryable).toBe(false);
    });
  });

  describe('IErrorInfo', () => {
    it('应该正确定义错误信息接口', () => {
      const errorInfo: IErrorInfo = {
        message: 'Test error message',
        details: 'Detailed error information',
        cause: 'Root cause of the error',
        suggestion: 'Suggested solution',
        parameters: {
          entityId: 'user-123',
          entityType: 'User',
        },
        localization: {
          'zh-CN': {
            message: '测试错误消息',
            details: '详细错误信息',
            cause: '错误根本原因',
            suggestion: '建议解决方案',
          },
        },
      };

      expect(errorInfo.message).toBe('Test error message');
      expect(errorInfo.details).toBe('Detailed error information');
      expect(errorInfo.cause).toBe('Root cause of the error');
      expect(errorInfo.suggestion).toBe('Suggested solution');
      expect(errorInfo.parameters).toEqual({
        entityId: 'user-123',
        entityType: 'User',
      });
      expect(errorInfo.localization).toBeDefined();
      expect(errorInfo.localization?.['zh-CN']?.message).toBe('测试错误消息');
    });

    it('应该支持可选属性', () => {
      const errorInfo: IErrorInfo = {
        message: 'Simple error message',
      };

      expect(errorInfo.message).toBe('Simple error message');
      expect(errorInfo.details).toBeUndefined();
      expect(errorInfo.cause).toBeUndefined();
      expect(errorInfo.suggestion).toBeUndefined();
      expect(errorInfo.parameters).toBeUndefined();
      expect(errorInfo.localization).toBeUndefined();
    });
  });

  describe('错误代码格式验证', () => {
    it('应该验证业务错误代码格式', () => {
      const bizCodes = Object.values(CommonErrorCodes).filter((code) =>
        code.startsWith('BIZ-'),
      );
      bizCodes.forEach((code) => {
        expect(code).toMatch(/^BIZ-/);
      });
    });

    it('应该验证系统错误代码格式', () => {
      const sysCodes = Object.values(SystemErrorCodes);
      sysCodes.forEach((code) => {
        expect(code).toMatch(/^SYS-/);
      });
    });

    it('应该验证验证错误代码格式', () => {
      const valCodes = Object.values(ValidationErrorCodes);
      valCodes.forEach((code) => {
        expect(code).toMatch(/^VAL-/);
      });
    });

    it('应该验证授权错误代码格式', () => {
      const authCodes = Object.values(AuthorizationErrorCodes);
      authCodes.forEach((code) => {
        expect(code).toMatch(/^AUTH-/);
      });
    });

    it('应该验证网络错误代码格式', () => {
      const netCodes = Object.values(NetworkErrorCodes);
      netCodes.forEach((code) => {
        expect(code).toMatch(/^NET-/);
      });
    });
  });

  describe('错误严重性级别验证', () => {
    it('应该验证严重性级别的顺序', () => {
      const severities = [
        ErrorSeverity.INFO,
        ErrorSeverity.LOW,
        ErrorSeverity.MEDIUM,
        ErrorSeverity.HIGH,
        ErrorSeverity.CRITICAL,
      ];

      expect(severities).toEqual(['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
    });

    it('应该验证严重性级别的唯一性', () => {
      const severities = Object.values(ErrorSeverity);
      const uniqueSeverities = [...new Set(severities)];
      expect(severities).toHaveLength(uniqueSeverities.length);
    });
  });

  describe('错误类别验证', () => {
    it('应该验证错误类别的唯一性', () => {
      const categories = Object.values(ErrorCategory);
      const uniqueCategories = [...new Set(categories)];
      expect(categories).toHaveLength(uniqueCategories.length);
    });

    it('应该验证错误类别的完整性', () => {
      const categories = Object.values(ErrorCategory);
      expect(categories).toContain('BUSINESS');
      expect(categories).toContain('SYSTEM');
      expect(categories).toContain('VALIDATION');
      expect(categories).toContain('AUTHORIZATION');
      expect(categories).toContain('NETWORK');
    });
  });
});
