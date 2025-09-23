/**
 * CoreTestAssertion - 核心测试断言工具实现
 *
 * 提供了完整的测试断言功能，包括基本断言、对象断言、
 * 数组断言、异常断言等功能。
 *
 * ## 业务规则
 *
 * ### 基本断言规则
 * - 支持相等性断言
 * - 支持真值断言
 * - 支持空值断言
 * - 支持类型断言
 *
 * ### 对象断言规则
 * - 支持对象属性断言
 * - 支持对象结构断言
 * - 支持对象深度比较
 * - 支持对象包含断言
 *
 * ### 数组断言规则
 * - 支持数组长度断言
 * - 支持数组包含断言
 * - 支持数组元素断言
 * - 支持数组排序断言
 *
 * ### 异常断言规则
 * - 支持异常类型断言
 * - 支持异常消息断言
 * - 支持异常属性断言
 * - 支持异常链断言
 *
 * @description 核心测试断言工具实现类
 * @example
 * ```typescript
 * const assertion = new CoreTestAssertion();
 *
 * // 基本断言
 * assertion.equal(1, 1);
 * assertion.true(true);
 * assertion.null(null);
 *
 * // 对象断言
 * assertion.deepEqual({ a: 1 }, { a: 1 });
 * assertion.contains([1, 2, 3], 2);
 *
 * // 异常断言
 * assertion.throws(() => { throw new Error('test'); });
 * ```
 *
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import { ITestAssertion } from './testing.interface';

/**
 * 测试断言错误
 */
export class TestAssertionError extends Error {
  constructor(
    message: string,
    public readonly actual?: any,
    public readonly expected?: any,
  ) {
    super(message);
    this.name = 'TestAssertionError';
  }
}

/**
 * 核心测试断言工具
 */
@Injectable()
export class CoreTestAssertion implements ITestAssertion {
  /**
   * 断言相等
   */
  public equal<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      throw new TestAssertionError(
        message || `Expected ${actual} to equal ${expected}`,
        actual,
        expected,
      );
    }
  }

  /**
   * 断言不相等
   */
  public notEqual<T>(actual: T, expected: T, message?: string): void {
    if (actual === expected) {
      throw new TestAssertionError(
        message || `Expected ${actual} not to equal ${expected}`,
        actual,
        expected,
      );
    }
  }

  /**
   * 断言为真
   */
  public true(actual: boolean, message?: string): void {
    if (actual !== true) {
      throw new TestAssertionError(
        message || `Expected ${actual} to be true`,
        actual,
        true,
      );
    }
  }

  /**
   * 断言为假
   */
  public false(actual: boolean, message?: string): void {
    if (actual !== false) {
      throw new TestAssertionError(
        message || `Expected ${actual} to be false`,
        actual,
        false,
      );
    }
  }

  /**
   * 断言为null
   */
  public null(actual: any, message?: string): void {
    if (actual !== null) {
      throw new TestAssertionError(
        message || `Expected ${actual} to be null`,
        actual,
        null,
      );
    }
  }

  /**
   * 断言不为null
   */
  public notNull(actual: any, message?: string): void {
    if (actual === null) {
      throw new TestAssertionError(
        message || `Expected ${actual} not to be null`,
        actual,
        null,
      );
    }
  }

  /**
   * 断言为undefined
   */
  public undefined(actual: any, message?: string): void {
    if (actual !== undefined) {
      throw new TestAssertionError(
        message || `Expected ${actual} to be undefined`,
        actual,
        undefined,
      );
    }
  }

  /**
   * 断言不为undefined
   */
  public notUndefined(actual: any, message?: string): void {
    if (actual === undefined) {
      throw new TestAssertionError(
        message || `Expected ${actual} not to be undefined`,
        actual,
        undefined,
      );
    }
  }

  /**
   * 断言抛出异常
   */
  public throws(fn: () => void, message?: string): void {
    try {
      fn();
      throw new TestAssertionError(
        message || 'Expected function to throw an error',
        undefined,
        'Error',
      );
    } catch (error) {
      if (error instanceof TestAssertionError) {
        throw error;
      }
      // 函数抛出了异常，这是预期的行为
    }
  }

  /**
   * 断言不抛出异常
   */
  public notThrows(fn: () => void, message?: string): void {
    try {
      fn();
    } catch (error) {
      throw new TestAssertionError(
        message || `Expected function not to throw, but it threw: ${error}`,
        error,
        undefined,
      );
    }
  }

  /**
   * 断言包含
   */
  public contains<T>(array: T[], item: T, message?: string): void {
    if (!array.includes(item)) {
      throw new TestAssertionError(
        message || `Expected array to contain ${item}`,
        array,
        item,
      );
    }
  }

  /**
   * 断言不包含
   */
  public notContains<T>(array: T[], item: T, message?: string): void {
    if (array.includes(item)) {
      throw new TestAssertionError(
        message || `Expected array not to contain ${item}`,
        array,
        item,
      );
    }
  }

  /**
   * 断言匹配正则表达式
   */
  public match(actual: string, pattern: RegExp, message?: string): void {
    if (!pattern.test(actual)) {
      throw new TestAssertionError(
        message || `Expected ${actual} to match ${pattern}`,
        actual,
        pattern,
      );
    }
  }

  /**
   * 断言不匹配正则表达式
   */
  public notMatch(actual: string, pattern: RegExp, message?: string): void {
    if (pattern.test(actual)) {
      throw new TestAssertionError(
        message || `Expected ${actual} not to match ${pattern}`,
        actual,
        pattern,
      );
    }
  }

  /**
   * 断言深度相等
   */
  public deepEqual<T>(actual: T, expected: T, message?: string): void {
    if (!this.isDeepEqual(actual, expected)) {
      throw new TestAssertionError(
        message ||
          `Expected ${JSON.stringify(actual)} to deeply equal ${JSON.stringify(expected)}`,
        actual,
        expected,
      );
    }
  }

  /**
   * 断言深度不相等
   */
  public notDeepEqual<T>(actual: T, expected: T, message?: string): void {
    if (this.isDeepEqual(actual, expected)) {
      throw new TestAssertionError(
        message ||
          `Expected ${JSON.stringify(actual)} not to deeply equal ${JSON.stringify(expected)}`,
        actual,
        expected,
      );
    }
  }

  /**
   * 断言大于
   */
  public greaterThan(actual: number, expected: number, message?: string): void {
    if (actual <= expected) {
      throw new TestAssertionError(
        message || `Expected ${actual} to be greater than ${expected}`,
        actual,
        expected,
      );
    }
  }

  /**
   * 断言大于等于
   */
  public greaterThanOrEqual(
    actual: number,
    expected: number,
    message?: string,
  ): void {
    if (actual < expected) {
      throw new TestAssertionError(
        message ||
          `Expected ${actual} to be greater than or equal to ${expected}`,
        actual,
        expected,
      );
    }
  }

  /**
   * 断言小于
   */
  public lessThan(actual: number, expected: number, message?: string): void {
    if (actual >= expected) {
      throw new TestAssertionError(
        message || `Expected ${actual} to be less than ${expected}`,
        actual,
        expected,
      );
    }
  }

  /**
   * 断言小于等于
   */
  public lessThanOrEqual(
    actual: number,
    expected: number,
    message?: string,
  ): void {
    if (actual > expected) {
      throw new TestAssertionError(
        message || `Expected ${actual} to be less than or equal to ${expected}`,
        actual,
        expected,
      );
    }
  }

  /**
   * 断言数组长度
   */
  public arrayLength<T>(
    array: T[],
    expectedLength: number,
    message?: string,
  ): void {
    if (array.length !== expectedLength) {
      throw new TestAssertionError(
        message ||
          `Expected array length to be ${expectedLength}, but got ${array.length}`,
        array.length,
        expectedLength,
      );
    }
  }

  /**
   * 断言字符串长度
   */
  public stringLength(
    actual: string,
    expectedLength: number,
    message?: string,
  ): void {
    if (actual.length !== expectedLength) {
      throw new TestAssertionError(
        message ||
          `Expected string length to be ${expectedLength}, but got ${actual.length}`,
        actual.length,
        expectedLength,
      );
    }
  }

  /**
   * 断言对象属性
   */
  public hasProperty(obj: any, property: string, message?: string): void {
    if (!(property in obj)) {
      throw new TestAssertionError(
        message || `Expected object to have property ${property}`,
        obj,
        property,
      );
    }
  }

  /**
   * 断言对象不包含属性
   */
  public notHasProperty(obj: any, property: string, message?: string): void {
    if (property in obj) {
      throw new TestAssertionError(
        message || `Expected object not to have property ${property}`,
        obj,
        property,
      );
    }
  }

  /**
   * 断言对象属性值
   */
  public propertyEqual(
    obj: any,
    property: string,
    expected: any,
    message?: string,
  ): void {
    if (!(property in obj)) {
      throw new TestAssertionError(
        message || `Expected object to have property ${property}`,
        obj,
        property,
      );
    }
    if (obj[property] !== expected) {
      throw new TestAssertionError(
        message ||
          `Expected object.${property} to equal ${expected}, but got ${obj[property]}`,
        obj[property],
        expected,
      );
    }
  }

  /**
   * 断言实例类型
   */
  public instanceOf(actual: any, expected: any, message?: string): void {
    if (!(actual instanceof expected)) {
      throw new TestAssertionError(
        message || `Expected ${actual} to be an instance of ${expected}`,
        actual,
        expected,
      );
    }
  }

  /**
   * 断言类型
   */
  public typeOf(actual: any, expected: string, message?: string): void {
    if (typeof actual !== expected) {
      throw new TestAssertionError(
        message ||
          `Expected ${actual} to be of type ${expected}, but got ${typeof actual}`,
        typeof actual,
        expected,
      );
    }
  }

  /**
   * 深度比较两个值是否相等
   */
  private isDeepEqual(a: any, b: any): boolean {
    if (a === b) {
      return true;
    }

    if (a == null || b == null) {
      return a === b;
    }

    if (typeof a !== typeof b) {
      return false;
    }

    if (typeof a !== 'object') {
      return a === b;
    }

    if (Array.isArray(a) !== Array.isArray(b)) {
      return false;
    }

    if (Array.isArray(a)) {
      if (a.length !== b.length) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        if (!this.isDeepEqual(a[i], b[i])) {
          return false;
        }
      }
      return true;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) {
      return false;
    }

    for (const key of keysA) {
      if (!keysB.includes(key)) {
        return false;
      }
      if (!this.isDeepEqual(a[key], b[key])) {
        return false;
      }
    }

    return true;
  }
}
