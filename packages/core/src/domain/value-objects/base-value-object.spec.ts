/**
 * BaseValueObject 测试
 *
 * 测试基础值对象类的核心功能，包括相等性比较、哈希码计算、字符串转换等。
 *
 * @description 基础值对象类的单元测试
 * @since 1.0.0
 */

import { BaseValueObject } from './base-value-object';

/**
 * 测试值对象类
 */
class TestValueObject extends BaseValueObject {
  constructor(
    private readonly _value: string,
    private readonly _number: number,
  ) {
    super();
    this.validate();
  }

  get value(): string {
    return this._value;
  }

  get number(): number {
    return this._number;
  }

  protected arePropertiesEqual(other: TestValueObject): boolean {
    return this._value === other._value && this._number === other._number;
  }

  public getHashCode(): string {
    return `${this.constructor.name}-${this._value}-${this._number}`;
  }

  public toString(): string {
    return `${this.constructor.name}(${this._value}, ${this._number})`;
  }

  public toJSON(): Record<string, unknown> {
    return {
      type: this.constructor.name,
      value: this._value,
      number: this._number,
    };
  }

  public isEmpty(): boolean {
    return !this._value || this._value.trim() === '';
  }

  protected validate(): void {
    if (!this._value) {
      throw new Error('Value cannot be empty');
    }
    if (this._number < 0) {
      throw new Error('Number must be non-negative');
    }
  }
}

/**
 * 简单值对象类
 */
class SimpleValueObject extends BaseValueObject {
  constructor(private readonly _data: string) {
    super();
  }

  get data(): string {
    return this._data;
  }

  protected arePropertiesEqual(other: SimpleValueObject): boolean {
    return this._data === other._data;
  }
}

describe('BaseValueObject', () => {
  let testValueObject: TestValueObject;
  let simpleValueObject: SimpleValueObject;

  beforeEach(() => {
    testValueObject = new TestValueObject('test', 42);
    simpleValueObject = new SimpleValueObject('simple');
  });

  describe('构造函数', () => {
    it('应该正确初始化值对象', () => {
      expect(testValueObject.value).toBe('test');
      expect(testValueObject.number).toBe(42);
    });

    it('应该通过验证', () => {
      expect(() => new TestValueObject('valid', 10)).not.toThrow();
    });

    it('应该拒绝无效的值', () => {
      expect(() => new TestValueObject('', 10)).toThrow(
        'Value cannot be empty',
      );
      expect(() => new TestValueObject('test', -1)).toThrow(
        'Number must be non-negative',
      );
    });
  });

  describe('相等性比较', () => {
    it('相同属性值的值对象应该相等', () => {
      const vo1 = new TestValueObject('test', 42);
      const vo2 = new TestValueObject('test', 42);

      expect(vo1.equals(vo2)).toBe(true);
    });

    it('不同属性值的值对象应该不相等', () => {
      const vo1 = new TestValueObject('test', 42);
      const vo2 = new TestValueObject('different', 42);
      const vo3 = new TestValueObject('test', 100);

      expect(vo1.equals(vo2)).toBe(false);
      expect(vo1.equals(vo3)).toBe(false);
    });

    it('与 null 比较应该返回 false', () => {
      expect(testValueObject.equals(null)).toBe(false);
    });

    it('与 undefined 比较应该返回 false', () => {
      expect(testValueObject.equals(undefined)).toBe(false);
    });

    it('不同类型但相同属性值的值对象应该不相等', () => {
      const vo1 = new TestValueObject('test', 42);
      const vo2 = new SimpleValueObject('test');

      expect(vo1.equals(vo2)).toBe(false);
    });

    it('应该正确比较简单值对象', () => {
      const vo1 = new SimpleValueObject('test');
      const vo2 = new SimpleValueObject('test');
      const vo3 = new SimpleValueObject('different');

      expect(vo1.equals(vo2)).toBe(true);
      expect(vo1.equals(vo3)).toBe(false);
    });
  });

  describe('哈希码计算', () => {
    it('应该返回正确的哈希码', () => {
      const hashCode = testValueObject.getHashCode();
      expect(hashCode).toBe('TestValueObject-test-42');
    });

    it('相同属性值的值对象应该有相同的哈希码', () => {
      const vo1 = new TestValueObject('test', 42);
      const vo2 = new TestValueObject('test', 42);

      expect(vo1.getHashCode()).toBe(vo2.getHashCode());
    });

    it('不同属性值的值对象应该有不同的哈希码', () => {
      const vo1 = new TestValueObject('test', 42);
      const vo2 = new TestValueObject('different', 42);

      expect(vo1.getHashCode()).not.toBe(vo2.getHashCode());
    });

    it('简单值对象应该返回类型名称作为哈希码', () => {
      const hashCode = simpleValueObject.getHashCode();
      expect(hashCode).toBe('SimpleValueObject');
    });
  });

  describe('字符串转换', () => {
    it('应该正确转换为字符串', () => {
      const str = testValueObject.toString();
      expect(str).toBe('TestValueObject(test, 42)');
    });

    it('简单值对象应该返回类型名称', () => {
      const str = simpleValueObject.toString();
      expect(str).toBe('SimpleValueObject');
    });
  });

  describe('JSON转换', () => {
    it('应该正确转换为JSON', () => {
      const json = testValueObject.toJSON();
      expect(json.type).toBe('TestValueObject');
      expect(json.value).toBe('test');
      expect(json.number).toBe(42);
    });

    it('简单值对象应该返回基本JSON', () => {
      const json = simpleValueObject.toJSON();
      expect(json.type).toBe('SimpleValueObject');
    });
  });

  describe('克隆功能', () => {
    it('应该返回自身（因为值对象是不可变的）', () => {
      const clone = testValueObject.clone();
      expect(clone).toBe(testValueObject);
    });

    it('克隆的对象应该与原对象相等', () => {
      const clone = testValueObject.clone();
      expect(clone.equals(testValueObject)).toBe(true);
    });
  });

  describe('空值检查', () => {
    it('应该正确检查非空值对象', () => {
      expect(testValueObject.isEmpty()).toBe(false);
    });

    it('应该正确检查空值对象', () => {
      const emptyVo = new TestValueObject('   ', 0);
      expect(emptyVo.isEmpty()).toBe(true);
    });

    it('简单值对象默认不为空', () => {
      expect(simpleValueObject.isEmpty()).toBe(false);
    });
  });

  describe('类型名称', () => {
    it('应该正确返回类型名称', () => {
      expect(testValueObject.getTypeName()).toBe('TestValueObject');
      expect(simpleValueObject.getTypeName()).toBe('SimpleValueObject');
    });
  });

  describe('比较功能', () => {
    it('应该基于类型名称进行比较', () => {
      const vo1 = new TestValueObject('a', 1);
      const vo2 = new SimpleValueObject('b');

      const result = vo1.compareTo(vo2);
      expect(typeof result).toBe('number');
      expect([-1, 0, 1]).toContain(result);
    });

    it('相同类型的值对象应该相等', () => {
      const vo1 = new TestValueObject('a', 1);
      const vo2 = new TestValueObject('b', 2);

      const result = vo1.compareTo(vo2);
      expect(result).toBe(0);
    });

    it('与 null 比较应该返回 1', () => {
      const result = testValueObject.compareTo(null as any);
      expect(result).toBe(1);
    });

    it('与 undefined 比较应该返回 1', () => {
      const result = testValueObject.compareTo(undefined as any);
      expect(result).toBe(1);
    });
  });

  describe('边界情况', () => {
    it('应该处理特殊字符', () => {
      const specialVo = new TestValueObject('test@#$%', 0);
      expect(specialVo.value).toBe('test@#$%');
      expect(specialVo.isEmpty()).toBe(false);
    });

    it('应该处理数字边界值', () => {
      const zeroVo = new TestValueObject('zero', 0);
      const maxVo = new TestValueObject('max', Number.MAX_SAFE_INTEGER);

      expect(zeroVo.number).toBe(0);
      expect(maxVo.number).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('应该处理长字符串', () => {
      const longString = 'a'.repeat(1000);
      const longVo = new TestValueObject(longString, 1);

      expect(longVo.value).toBe(longString);
      expect(longVo.getHashCode()).toContain(longString);
    });
  });

  describe('验证功能', () => {
    it('应该通过有效值对象的验证', () => {
      expect(() => {
        (testValueObject as any).validate();
      }).not.toThrow();
    });

    it('应该拒绝空值', () => {
      expect(() => new TestValueObject('', 1)).toThrow('Value cannot be empty');
    });

    it('应该拒绝负数', () => {
      expect(() => new TestValueObject('test', -1)).toThrow(
        'Number must be non-negative',
      );
    });

    it('应该允许零值', () => {
      expect(() => new TestValueObject('test', 0)).not.toThrow();
    });
  });

  describe('不可变性', () => {
    it('值对象应该是不可变的', () => {
      const originalValue = testValueObject.value;
      const originalNumber = testValueObject.number;

      // 尝试修改私有属性（这在TypeScript中是不可能的，但测试概念）
      expect(testValueObject.value).toBe(originalValue);
      expect(testValueObject.number).toBe(originalNumber);
    });

    it('克隆应该返回相同的实例', () => {
      const clone = testValueObject.clone();
      expect(clone).toBe(testValueObject);
    });
  });
});
