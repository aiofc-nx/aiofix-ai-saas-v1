/**
 * 错误类型工具函数测试
 *
 * @description 测试错误类型相关的工具函数
 * @since 1.0.0
 */
import {
  ErrorSeverity,
  ErrorCategory,
  ErrorCodePrefix,
  CommonErrorCodes,
  isErrorSeverity,
  isErrorCategory,
  isErrorCodePrefix,
  isCommonErrorCode,
  getErrorCodePrefix,
  getErrorCodeNumber,
  getErrorCategoryFromCode,
  getErrorSeverityFromCategory,
} from './error.types';

describe('错误类型工具函数', () => {
  describe('类型检查函数', () => {
    describe('isErrorSeverity', () => {
      it('应该正确识别有效的错误严重性', () => {
        expect(isErrorSeverity('INFO')).toBe(true);
        expect(isErrorSeverity('LOW')).toBe(true);
        expect(isErrorSeverity('MEDIUM')).toBe(true);
        expect(isErrorSeverity('HIGH')).toBe(true);
        expect(isErrorSeverity('CRITICAL')).toBe(true);
      });

      it('应该拒绝无效的错误严重性', () => {
        expect(isErrorSeverity('INVALID')).toBe(false);
        expect(isErrorSeverity('info')).toBe(false);
        expect(isErrorSeverity('')).toBe(false);
        expect(isErrorSeverity('UNKNOWN')).toBe(false);
      });

      it('应该处理边界情况', () => {
        expect(isErrorSeverity(' INFO ')).toBe(false);
        expect(isErrorSeverity('INFO_EXTRA')).toBe(false);
        expect(isErrorSeverity('123')).toBe(false);
        expect(isErrorSeverity('null')).toBe(false);
      });
    });

    describe('isErrorCategory', () => {
      it('应该正确识别有效的错误类别', () => {
        expect(isErrorCategory('BUSINESS')).toBe(true);
        expect(isErrorCategory('SYSTEM')).toBe(true);
        expect(isErrorCategory('VALIDATION')).toBe(true);
        expect(isErrorCategory('AUTHORIZATION')).toBe(true);
        expect(isErrorCategory('NETWORK')).toBe(true);
        expect(isErrorCategory('DATABASE')).toBe(true);
        expect(isErrorCategory('EXTERNAL_SERVICE')).toBe(true);
        expect(isErrorCategory('CONFIGURATION')).toBe(true);
        expect(isErrorCategory('RESOURCE')).toBe(true);
        expect(isErrorCategory('UNKNOWN')).toBe(true);
      });

      it('应该拒绝无效的错误类别', () => {
        expect(isErrorCategory('INVALID')).toBe(false);
        expect(isErrorCategory('business')).toBe(false);
        expect(isErrorCategory('')).toBe(false);
        expect(isErrorCategory('OTHER')).toBe(false);
      });

      it('应该处理边界情况', () => {
        expect(isErrorCategory(' BUSINESS ')).toBe(false);
        expect(isErrorCategory('BUSINESS_LOGIC')).toBe(false);
        expect(isErrorCategory('456')).toBe(false);
      });
    });

    describe('isErrorCodePrefix', () => {
      it('应该正确识别有效的错误代码前缀', () => {
        expect(isErrorCodePrefix('BIZ')).toBe(true);
        expect(isErrorCodePrefix('SYS')).toBe(true);
        expect(isErrorCodePrefix('VAL')).toBe(true);
        expect(isErrorCodePrefix('AUTH')).toBe(true);
        expect(isErrorCodePrefix('NET')).toBe(true);
        expect(isErrorCodePrefix('DB')).toBe(true);
        expect(isErrorCodePrefix('EXT')).toBe(true);
        expect(isErrorCodePrefix('CFG')).toBe(true);
        expect(isErrorCodePrefix('RES')).toBe(true);
      });

      it('应该拒绝无效的错误代码前缀', () => {
        expect(isErrorCodePrefix('INVALID')).toBe(false);
        expect(isErrorCodePrefix('biz')).toBe(false);
        expect(isErrorCodePrefix('')).toBe(false);
        expect(isErrorCodePrefix('OTHER')).toBe(false);
      });

      it('应该处理边界情况', () => {
        expect(isErrorCodePrefix(' BIZ ')).toBe(false);
        expect(isErrorCodePrefix('BIZ-001')).toBe(false);
        expect(isErrorCodePrefix('789')).toBe(false);
      });
    });

    describe('isCommonErrorCode', () => {
      it('应该正确识别有效的通用错误代码', () => {
        expect(isCommonErrorCode('BIZ-0001')).toBe(true);
        expect(isCommonErrorCode('BIZ-0002')).toBe(true);
        expect(isCommonErrorCode('SYS-0001')).toBe(true);
        expect(isCommonErrorCode('SYS-0002')).toBe(true);
        expect(isCommonErrorCode('VAL-0001')).toBe(true);
        expect(isCommonErrorCode('AUTH-0001')).toBe(true);
        expect(isCommonErrorCode('NET-0001')).toBe(true);
      });

      it('应该拒绝无效的通用错误代码', () => {
        expect(isCommonErrorCode('INVALID')).toBe(false);
        expect(isCommonErrorCode('not_found')).toBe(false);
        expect(isCommonErrorCode('')).toBe(false);
        expect(isCommonErrorCode('CUSTOM_ERROR')).toBe(false);
        expect(isCommonErrorCode('BIZ-9999')).toBe(false);
        expect(isCommonErrorCode('UNKNOWN-0001')).toBe(false);
      });

      it('应该处理边界情况', () => {
        expect(isCommonErrorCode(' BIZ-0001 ')).toBe(false);
        expect(isCommonErrorCode('BIZ-0001_EXTRA')).toBe(false);
        expect(isCommonErrorCode('999')).toBe(false);
      });
    });
  });

  describe('错误代码解析函数', () => {
    describe('getErrorCodePrefix', () => {
      it('应该正确提取错误代码前缀', () => {
        expect(getErrorCodePrefix('BIZ-001')).toBe('BIZ');
        expect(getErrorCodePrefix('SYS-500')).toBe('SYS');
        expect(getErrorCodePrefix('VAL-400')).toBe('VAL');
        expect(getErrorCodePrefix('AUTH-401')).toBe('AUTH');
        expect(getErrorCodePrefix('NET-503')).toBe('NET');
      });

      it('应该处理没有分隔符的代码', () => {
        expect(getErrorCodePrefix('BIZ')).toBe('BIZ');
        expect(getErrorCodePrefix('ERROR')).toBe('ERROR');
        expect(getErrorCodePrefix('123')).toBe('123');
      });

      it('应该处理多个分隔符的代码', () => {
        expect(getErrorCodePrefix('BIZ-USER-001')).toBe('BIZ');
        expect(getErrorCodePrefix('SYS-DB-CONN-500')).toBe('SYS');
      });

      it('应该处理边界情况', () => {
        expect(getErrorCodePrefix('')).toBe('');
        expect(getErrorCodePrefix('-')).toBe('');
        expect(getErrorCodePrefix('-001')).toBe('');
        expect(getErrorCodePrefix('BIZ-')).toBe('BIZ');
      });

      it('应该处理特殊字符', () => {
        expect(getErrorCodePrefix('BIZ_USER-001')).toBe('BIZ_USER');
        expect(getErrorCodePrefix('SYS@CONN-500')).toBe('SYS@CONN');
        expect(getErrorCodePrefix('错误-001')).toBe('错误');
      });
    });

    describe('getErrorCodeNumber', () => {
      it('应该正确提取错误代码编号', () => {
        expect(getErrorCodeNumber('BIZ-001')).toBe('001');
        expect(getErrorCodeNumber('SYS-500')).toBe('500');
        expect(getErrorCodeNumber('VAL-400')).toBe('400');
        expect(getErrorCodeNumber('AUTH-401')).toBe('401');
        expect(getErrorCodeNumber('NET-503')).toBe('503');
      });

      it('应该处理没有分隔符的代码', () => {
        expect(getErrorCodeNumber('BIZ')).toBe('');
        expect(getErrorCodeNumber('ERROR')).toBe('');
        expect(getErrorCodeNumber('123')).toBe('');
      });

      it('应该处理多个分隔符的代码', () => {
        expect(getErrorCodeNumber('BIZ-USER-001')).toBe('USER');
        expect(getErrorCodeNumber('SYS-DB-CONN-500')).toBe('DB');
      });

      it('应该处理边界情况', () => {
        expect(getErrorCodeNumber('')).toBe('');
        expect(getErrorCodeNumber('-')).toBe('');
        expect(getErrorCodeNumber('-001')).toBe('001');
        expect(getErrorCodeNumber('BIZ-')).toBe('');
      });

      it('应该处理特殊字符', () => {
        expect(getErrorCodeNumber('BIZ_USER-001')).toBe('001');
        expect(getErrorCodeNumber('SYS@CONN-500')).toBe('500');
        expect(getErrorCodeNumber('错误-001')).toBe('001');
      });
    });
  });

  describe('错误分类映射函数', () => {
    describe('getErrorCategoryFromCode', () => {
      it('应该正确映射业务错误前缀', () => {
        expect(getErrorCategoryFromCode('BIZ-001')).toBe(
          ErrorCategory.BUSINESS,
        );
        expect(getErrorCategoryFromCode('BIZ-USER-001')).toBe(
          ErrorCategory.BUSINESS,
        );
      });

      it('应该正确映射系统错误前缀', () => {
        expect(getErrorCategoryFromCode('SYS-500')).toBe(ErrorCategory.SYSTEM);
        expect(getErrorCategoryFromCode('SYS-INTERNAL-500')).toBe(
          ErrorCategory.SYSTEM,
        );
      });

      it('应该正确映射验证错误前缀', () => {
        expect(getErrorCategoryFromCode('VAL-400')).toBe(
          ErrorCategory.VALIDATION,
        );
        expect(getErrorCategoryFromCode('VAL-FIELD-400')).toBe(
          ErrorCategory.VALIDATION,
        );
      });

      it('应该正确映射授权错误前缀', () => {
        expect(getErrorCategoryFromCode('AUTH-401')).toBe(
          ErrorCategory.AUTHORIZATION,
        );
        expect(getErrorCategoryFromCode('AUTH-TOKEN-401')).toBe(
          ErrorCategory.AUTHORIZATION,
        );
      });

      it('应该正确映射网络错误前缀', () => {
        expect(getErrorCategoryFromCode('NET-503')).toBe(ErrorCategory.NETWORK);
        expect(getErrorCategoryFromCode('NET-TIMEOUT-503')).toBe(
          ErrorCategory.NETWORK,
        );
      });

      it('应该正确映射数据库错误前缀', () => {
        expect(getErrorCategoryFromCode('DB-500')).toBe(ErrorCategory.DATABASE);
        expect(getErrorCategoryFromCode('DB-CONN-500')).toBe(
          ErrorCategory.DATABASE,
        );
      });

      it('应该正确映射外部服务错误前缀', () => {
        expect(getErrorCategoryFromCode('EXT-503')).toBe(
          ErrorCategory.EXTERNAL_SERVICE,
        );
        expect(getErrorCategoryFromCode('EXT-API-503')).toBe(
          ErrorCategory.EXTERNAL_SERVICE,
        );
      });

      it('应该正确映射配置错误前缀', () => {
        expect(getErrorCategoryFromCode('CFG-500')).toBe(
          ErrorCategory.CONFIGURATION,
        );
        expect(getErrorCategoryFromCode('CFG-MISSING-500')).toBe(
          ErrorCategory.CONFIGURATION,
        );
      });

      it('应该正确映射资源错误前缀', () => {
        expect(getErrorCategoryFromCode('RES-429')).toBe(
          ErrorCategory.RESOURCE,
        );
        expect(getErrorCategoryFromCode('RES-LIMIT-429')).toBe(
          ErrorCategory.RESOURCE,
        );
      });

      it('应该处理未知前缀', () => {
        expect(getErrorCategoryFromCode('UNKNOWN-001')).toBe(
          ErrorCategory.UNKNOWN,
        );
        expect(getErrorCategoryFromCode('CUSTOM-001')).toBe(
          ErrorCategory.UNKNOWN,
        );
        expect(getErrorCategoryFromCode('xyz-001')).toBe(ErrorCategory.UNKNOWN);
        expect(getErrorCategoryFromCode('123-001')).toBe(ErrorCategory.UNKNOWN);
      });

      it('应该处理边界情况', () => {
        expect(getErrorCategoryFromCode('')).toBe(ErrorCategory.UNKNOWN);
        expect(getErrorCategoryFromCode('-')).toBe(ErrorCategory.UNKNOWN);
        expect(getErrorCategoryFromCode('001')).toBe(ErrorCategory.UNKNOWN);
      });
    });

    describe('getErrorSeverityFromCategory', () => {
      it('应该正确映射严重错误类别', () => {
        expect(getErrorSeverityFromCategory(ErrorCategory.SYSTEM)).toBe(
          ErrorSeverity.CRITICAL,
        );
        expect(getErrorSeverityFromCategory(ErrorCategory.DATABASE)).toBe(
          ErrorSeverity.CRITICAL,
        );
      });

      it('应该正确映射高优先级错误类别', () => {
        expect(getErrorSeverityFromCategory(ErrorCategory.AUTHORIZATION)).toBe(
          ErrorSeverity.HIGH,
        );
        expect(
          getErrorSeverityFromCategory(ErrorCategory.EXTERNAL_SERVICE),
        ).toBe(ErrorSeverity.HIGH);
      });

      it('应该正确映射中等优先级错误类别', () => {
        expect(getErrorSeverityFromCategory(ErrorCategory.BUSINESS)).toBe(
          ErrorSeverity.MEDIUM,
        );
        expect(getErrorSeverityFromCategory(ErrorCategory.VALIDATION)).toBe(
          ErrorSeverity.MEDIUM,
        );
        expect(getErrorSeverityFromCategory(ErrorCategory.NETWORK)).toBe(
          ErrorSeverity.MEDIUM,
        );
      });

      it('应该正确映射低优先级错误类别', () => {
        expect(getErrorSeverityFromCategory(ErrorCategory.CONFIGURATION)).toBe(
          ErrorSeverity.LOW,
        );
        expect(getErrorSeverityFromCategory(ErrorCategory.RESOURCE)).toBe(
          ErrorSeverity.LOW,
        );
      });

      it('应该正确映射未知错误类别', () => {
        expect(getErrorSeverityFromCategory(ErrorCategory.UNKNOWN)).toBe(
          ErrorSeverity.INFO,
        );
      });
    });
  });

  describe('集成测试', () => {
    it('应该正确处理完整的错误代码流程', () => {
      const errorCode = 'BIZ-USER-001';

      // 提取前缀和编号
      const prefix = getErrorCodePrefix(errorCode);
      const number = getErrorCodeNumber(errorCode);

      expect(prefix).toBe('BIZ');
      expect(number).toBe('USER');

      // 获取错误类别
      const category = getErrorCategoryFromCode(errorCode);
      expect(category).toBe(ErrorCategory.BUSINESS);

      // 获取错误严重性
      const severity = getErrorSeverityFromCategory(category);
      expect(severity).toBe(ErrorSeverity.MEDIUM);

      // 验证类型检查
      expect(isErrorCategory(category)).toBe(true);
      expect(isErrorSeverity(severity)).toBe(true);
      expect(isErrorCodePrefix(prefix)).toBe(true);
    });

    it('应该处理各种错误代码格式', () => {
      const testCases = [
        {
          code: 'SYS-500',
          expectedPrefix: 'SYS',
          expectedNumber: '500',
          expectedCategory: ErrorCategory.SYSTEM,
          expectedSeverity: ErrorSeverity.CRITICAL,
        },
        {
          code: 'VAL-FIELD-REQUIRED-400',
          expectedPrefix: 'VAL',
          expectedNumber: 'FIELD',
          expectedCategory: ErrorCategory.VALIDATION,
          expectedSeverity: ErrorSeverity.MEDIUM,
        },
        {
          code: 'AUTH-TOKEN-EXPIRED-401',
          expectedPrefix: 'AUTH',
          expectedNumber: 'TOKEN',
          expectedCategory: ErrorCategory.AUTHORIZATION,
          expectedSeverity: ErrorSeverity.HIGH,
        },
      ];

      testCases.forEach(
        ({
          code,
          expectedPrefix,
          expectedNumber,
          expectedCategory,
          expectedSeverity,
        }) => {
          expect(getErrorCodePrefix(code)).toBe(expectedPrefix);
          expect(getErrorCodeNumber(code)).toBe(expectedNumber);
          expect(getErrorCategoryFromCode(code)).toBe(expectedCategory);
          expect(getErrorSeverityFromCategory(expectedCategory)).toBe(
            expectedSeverity,
          );
        },
      );
    });
  });

  describe('性能测试', () => {
    it('应该能够快速处理大量错误代码', () => {
      const startTime = Date.now();
      const testCodes = Array.from(
        { length: 1000 },
        (_, i) => `BIZ-${i.toString().padStart(3, '0')}`,
      );

      testCodes.forEach((code) => {
        getErrorCodePrefix(code);
        getErrorCodeNumber(code);
        getErrorCategoryFromCode(code);
      });

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // 应该在100毫秒内完成
    });

    it('应该能够高效进行类型检查', () => {
      const startTime = Date.now();
      const testValues = [
        'INFO',
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL',
        'BUSINESS',
        'SYSTEM',
        'VALIDATION',
        'AUTHORIZATION',
        'BIZ',
        'SYS',
        'VAL',
        'AUTH',
        'NET',
        'BIZ-0001',
        'SYS-0001',
        'VAL-0001',
      ];

      for (let i = 0; i < 1000; i++) {
        testValues.forEach((value) => {
          isErrorSeverity(value);
          isErrorCategory(value);
          isErrorCodePrefix(value);
          isCommonErrorCode(value);
        });
      }

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(200); // 应该在200毫秒内完成
    });
  });

  describe('边界和异常情况', () => {
    it('应该处理Unicode字符', () => {
      expect(getErrorCodePrefix('错误-001')).toBe('错误');
      expect(getErrorCodeNumber('BIZ-用户-001')).toBe('用户');
      expect(getErrorCategoryFromCode('测试-001')).toBe(ErrorCategory.UNKNOWN);
    });

    it('应该处理特殊字符', () => {
      expect(getErrorCodePrefix('BIZ@USER-001')).toBe('BIZ@USER');
      expect(getErrorCodeNumber('SYS#DB-500')).toBe('500');
      expect(getErrorCodePrefix('VAL$FIELD-400')).toBe('VAL$FIELD');
    });

    it('应该处理极长的错误代码', () => {
      const longCode = 'BIZ-' + 'A'.repeat(1000);
      expect(getErrorCodePrefix(longCode)).toBe('BIZ');
      expect(getErrorCodeNumber(longCode)).toBe('A'.repeat(1000));
    });

    it('应该处理空白字符', () => {
      expect(getErrorCodePrefix(' BIZ - 001 ')).toBe(' BIZ ');
      expect(getErrorCodeNumber(' BIZ - 001 ')).toBe(' 001 ');
    });
  });
});
