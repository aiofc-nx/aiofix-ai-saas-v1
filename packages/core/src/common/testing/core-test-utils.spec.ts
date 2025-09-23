/**
 * CoreTestUtils 测试
 *
 * @description 测试核心测试工具的功能
 * @since 1.0.0
 */
import { CoreTestUtils } from './core-test-utils';

describe('CoreTestUtils', () => {
  let testUtils: CoreTestUtils;

  beforeEach(() => {
    testUtils = new CoreTestUtils();
  });

  describe('等待工具', () => {
    it('应该能够等待指定时间', async () => {
      const startTime = Date.now();
      await testUtils.wait(100);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(90);
      expect(endTime - startTime).toBeLessThan(200);
    });

    it('应该能够等待条件满足', async () => {
      let condition = false;
      global.setTimeout(() => {
        condition = true;
      }, 50);

      await expect(
        testUtils.waitFor(() => condition, 1000, 10),
      ).resolves.not.toThrow();
    });

    it('应该在超时时抛出错误', async () => {
      await expect(testUtils.waitFor(() => false, 100, 10)).rejects.toThrow(
        'Timeout waiting for condition after 100ms',
      );
    });

    it('应该支持自定义检查间隔', async () => {
      let checkCount = 0;
      const condition = (): boolean => {
        checkCount++;
        return checkCount >= 3;
      };

      await testUtils.waitFor(condition, 1000, 50);
      expect(checkCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('重试工具', () => {
    it('应该能够重试成功的操作', async () => {
      let attemptCount = 0;
      const operation = async (): Promise<string> => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Operation failed');
        }
        return 'success';
      };

      const result = await testUtils.retry(operation, 5, 10);
      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
    });

    it('应该在达到最大重试次数后抛出错误', async () => {
      const operation = async (): Promise<never> => {
        throw new Error('Always fails');
      };

      await expect(testUtils.retry(operation, 3, 10)).rejects.toThrow(
        'Always fails',
      );
    });

    it('应该支持同步操作的重试', async () => {
      let attemptCount = 0;
      const operation = (): string => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Sync operation failed');
        }
        return 'sync success';
      };

      const result = await testUtils.retry(operation, 3, 10);
      expect(result).toBe('sync success');
      expect(attemptCount).toBe(2);
    });
  });

  describe('错误捕获工具', () => {
    it('应该能够捕获同步函数的错误', () => {
      const fn = (): never => {
        throw new Error('Test error');
      };

      const error = testUtils.catchError(fn);
      expect(error).toBeInstanceOf(Error);
      expect(error!.message).toBe('Test error');
    });

    it('应该在没有错误时返回undefined', () => {
      const fn = (): string => {
        return 'success';
      };

      const error = testUtils.catchError(fn);
      expect(error).toBeUndefined();
    });

    it('应该能够捕获异步函数的错误', async () => {
      const fn = async (): Promise<never> => {
        throw new Error('Async test error');
      };

      const error = await testUtils.catchAsyncError(fn);
      expect(error).toBeInstanceOf(Error);
      expect(error!.message).toBe('Async test error');
    });

    it('应该在异步函数没有错误时返回undefined', async () => {
      const fn = async (): Promise<void> => {
        // 不返回值，符合 Promise<void> 类型
      };

      const error = await testUtils.catchAsyncError(fn);
      expect(error).toBeUndefined();
    });
  });

  describe('随机数据生成', () => {
    it('应该生成指定长度的随机字符串', () => {
      const str1 = testUtils.randomString(10);
      const str2 = testUtils.randomString(10);

      expect(str1).toHaveLength(10);
      expect(str2).toHaveLength(10);
      expect(str1).not.toBe(str2);
    });

    it('应该生成指定范围的随机数字', () => {
      for (let i = 0; i < 100; i++) {
        const num = testUtils.randomNumber(1, 10);
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(10);
      }
    });

    it('应该生成随机的布尔值', () => {
      const values = new Set<boolean>();
      for (let i = 0; i < 100; i++) {
        values.add(testUtils.randomBoolean());
      }
      // 应该生成过 true 和 false
      expect(values.size).toBe(2);
    });

    it('应该生成有效的随机邮箱', () => {
      const email = testUtils.randomEmail();
      expect(email).toMatch(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
    });

    it('应该生成有效的随机电话号码', () => {
      const phone = testUtils.randomPhone();
      expect(phone).toMatch(/^\+?[1-9]\d{1,14}$/);
    });

    it('应该生成有效的随机URL', () => {
      const url = testUtils.randomUrl();
      expect(url).toMatch(/^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    });

    it('应该生成随机的日期', () => {
      const date = testUtils.randomDate();
      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('应该生成指定范围内的随机日期', () => {
      const start = new Date('2023-01-01');
      const end = new Date('2023-12-31');
      const randomDate = testUtils.randomDate(start, end);

      expect(randomDate.getTime()).toBeGreaterThanOrEqual(start.getTime());
      expect(randomDate.getTime()).toBeLessThanOrEqual(end.getTime());
    });

    it('应该生成随机的UUID', () => {
      const uuid1 = testUtils.randomUuid();
      const uuid2 = testUtils.randomUuid();

      expect(uuid1).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(uuid2).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(uuid1).not.toBe(uuid2);
    });

    it('应该生成有效的随机IP地址', () => {
      const ip = testUtils.randomIpAddress();
      expect(ip).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
    });

    it('应该生成随机的JSON对象', () => {
      const json = testUtils.randomJson();
      expect(typeof json).toBe('object');
      expect(json).not.toBeNull();
    });
  });

  describe('对象操作工具', () => {
    it('应该能够深度克隆对象', () => {
      const original = {
        str: 'test',
        num: 123,
        bool: true,
        nested: {
          deep: {
            value: 'nested',
            array: [1, 2, 3],
          },
        },
        date: new Date(),
      };

      const cloned = testUtils.deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.nested).not.toBe(original.nested);
      expect(cloned.nested.deep).not.toBe(original.nested.deep);
    });

    it('应该能够深度比较对象', () => {
      const obj1 = {
        str: 'test',
        nested: { value: 123 },
        array: [1, 2, 3],
      };
      const obj2 = {
        str: 'test',
        nested: { value: 123 },
        array: [1, 2, 3],
      };
      const obj3 = {
        str: 'test',
        nested: { value: 456 },
        array: [1, 2, 3],
      };

      expect(testUtils.deepEqual(obj1, obj2)).toBe(true);
      expect(testUtils.deepEqual(obj1, obj3)).toBe(false);
    });

    it('应该能够格式化测试数据', () => {
      const data = {
        name: 'test',
        value: 123,
        nested: { key: 'value' },
      };

      const formatted = testUtils.formatTestData(data);
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('快照测试工具', () => {
    it('应该能够创建数据快照', () => {
      const data = {
        name: 'test',
        value: 123,
        array: [1, 2, 3],
      };

      const snapshot = testUtils.createSnapshot(data);
      expect(typeof snapshot).toBe('string');
      expect(snapshot.length).toBeGreaterThan(0);
    });

    it('应该能够比较数据快照', () => {
      const data = {
        name: 'test',
        value: 123,
      };

      const snapshot = testUtils.createSnapshot(data);
      const isEqual = testUtils.compareSnapshot(data, snapshot);

      expect(isEqual).toBe(true);
    });

    it('应该检测到快照差异', () => {
      const originalData = { name: 'test', value: 123 };
      const modifiedData = { name: 'test', value: 456 };

      const snapshot = testUtils.createSnapshot(originalData);
      const isEqual = testUtils.compareSnapshot(modifiedData, snapshot);

      expect(isEqual).toBe(false);
    });
  });

  describe('边界情况', () => {
    it('应该处理零延迟的等待', async () => {
      const startTime = Date.now();
      await testUtils.wait(0);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(50);
    });

    it('应该处理负数延迟', async () => {
      const startTime = Date.now();
      await testUtils.wait(-100);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(50);
    });

    it('应该处理空对象的深度克隆', () => {
      const empty = {};
      const cloned = testUtils.deepClone(empty);

      expect(cloned).toEqual({});
      expect(cloned).not.toBe(empty);
    });

    it('应该处理null和undefined的深度比较', () => {
      expect(testUtils.deepEqual(null, null)).toBe(true);
      expect(testUtils.deepEqual(undefined, undefined)).toBe(true);
      expect(testUtils.deepEqual(null, undefined)).toBe(false);
    });

    it('应该生成不同长度的随机字符串', () => {
      const str1 = testUtils.randomString(1);
      const str5 = testUtils.randomString(5);
      const str100 = testUtils.randomString(100);

      expect(str1).toHaveLength(1);
      expect(str5).toHaveLength(5);
      expect(str100).toHaveLength(100);
    });

    it('应该处理边界范围的随机数字', () => {
      const num1 = testUtils.randomNumber(0, 0);
      const num2 = testUtils.randomNumber(1, 1);
      const num3 = testUtils.randomNumber(-10, -5);

      expect(num1).toBe(0);
      expect(num2).toBe(1);
      expect(num3).toBeGreaterThanOrEqual(-10);
      expect(num3).toBeLessThanOrEqual(-5);
    });

    it('应该处理特殊字符的数据格式化', () => {
      const data = {
        unicode: '测试_José_🚀',
        special: '"quotes" & <tags>',
        newlines: 'line1\nline2\r\nline3',
      };

      const formatted = testUtils.formatTestData(data);
      expect(formatted).toContain('测试_José_🚀');
      expect(formatted).toContain('"quotes" & <tags>');
    });

    it('应该处理循环引用的对象格式化', () => {
      const obj: Record<string, unknown> = { name: 'test' };
      obj.self = obj;

      // 循环引用会导致栈溢出，这是预期的行为
      expect(() => {
        testUtils.formatTestData(obj);
      }).toThrow('Maximum call stack size exceeded');
    });

    it('应该处理大型对象的快照创建', () => {
      const largeData: Record<string, unknown> = {};
      for (let i = 0; i < 1000; i++) {
        largeData[`key${i}`] = `value${i}`;
      }

      const snapshot = testUtils.createSnapshot(largeData);
      expect(typeof snapshot).toBe('string');
      expect(snapshot.length).toBeGreaterThan(0);
    });
  });

  describe('数据生成工具', () => {
    it('应该生成有效的随机邮箱地址', () => {
      for (let i = 0; i < 10; i++) {
        const email = testUtils.randomEmail();
        expect(email).toMatch(
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        );
      }
    });

    it('应该生成有效的随机电话号码', () => {
      const phone = testUtils.randomPhone();
      expect(phone).toMatch(/^\+?[1-9]\d{1,14}$/);
    });

    it('应该生成有效的随机URL', () => {
      const url = testUtils.randomUrl();
      expect(url).toMatch(/^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    });

    it('应该生成有效的随机IP地址', () => {
      const ip = testUtils.randomIpAddress();
      const parts = ip.split('.');
      expect(parts).toHaveLength(4);
      parts.forEach((part) => {
        const num = parseInt(part, 10);
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThanOrEqual(255);
      });
    });

    it('应该生成随机的JSON对象', () => {
      const json = testUtils.randomJson();
      expect(typeof json).toBe('object');
      expect(json).not.toBeNull();
      expect(Array.isArray(json)).toBe(false);
    });
  });

  describe('性能测试', () => {
    it('应该能够处理大量随机数据生成', () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        testUtils.randomString(10);
        testUtils.randomNumber(1, 100);
        testUtils.randomBoolean();
        testUtils.randomUuid();
      }

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成
    });

    it('应该能够处理大量对象操作', () => {
      const obj = {
        data: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          value: `value${i}`,
        })),
      };

      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        const cloned = testUtils.deepClone(obj);
        testUtils.deepEqual(obj, cloned);
      }

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(2000); // 应该在2秒内完成
    });
  });
});
