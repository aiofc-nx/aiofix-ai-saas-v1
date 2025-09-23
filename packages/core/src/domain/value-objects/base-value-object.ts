/**
 * 基础值对象抽象类
 *
 * 值对象是领域驱动设计中的核心概念，表示没有概念标识的描述性对象。
 * 值对象的相等性基于其属性值，而不是标识符。
 *
 * ## 业务规则
 *
 * ### 不可变性规则
 * - 值对象一旦创建，其属性值不可变更
 * - 所有修改操作都应返回新的值对象实例
 * - 值对象不包含业务标识符
 *
 * ### 相等性规则
 * - 值对象的相等性基于所有属性的值
 * - 相同类型且相同属性值的值对象被视为相等
 * - 不同类型但相同属性值的值对象被视为不相等
 * - null 和 undefined 与任何值对象都不相等
 *
 * ### 验证规则
 * - 值对象创建时必须通过所有验证规则
 * - 验证失败时应抛出相应的异常
 * - 验证逻辑应该封装在值对象内部
 *
 * @description 所有值对象的基类，提供值对象的一致行为
 * @example
 * ```typescript
 * class Email extends BaseValueObject {
 *   constructor(private readonly _value: string) {
 *     super();
 *     this.validate();
 *   }
 *
 *   get value(): string {
 *     return this._value;
 *   }
 *
 *   private validate(): void {
 *     if (!this._value || !this._value.includes('@')) {
 *       throw new Error('Invalid email format');
 *     }
 *   }
 *
 *   equals(other: Email | null | undefined): boolean {
 *     return super.equals(other) && this._value === other._value;
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export abstract class BaseValueObject {
  /**
   * 检查两个值对象是否相等
   *
   * 子类应该重写此方法以实现具体的相等性比较逻辑。
   * 默认实现检查对象类型是否相同。
   *
   * @param other - 要比较的另一个值对象
   * @returns 如果两个值对象相等则返回 true，否则返回 false
   */
  public equals(other: BaseValueObject | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (!(other instanceof this.constructor)) {
      return false;
    }

    return this.arePropertiesEqual(other);
  }

  /**
   * 检查两个值对象的属性是否相等
   *
   * 子类应该重写此方法以实现具体的属性比较逻辑。
   * 默认实现返回 true（仅类型检查）。
   *
   * @param other - 要比较的另一个值对象
   * @returns 如果属性相等则返回 true，否则返回 false
   */
  protected arePropertiesEqual(_other: BaseValueObject): boolean {
    return true;
  }

  /**
   * 获取值对象的哈希码
   *
   * 用于在 Map 或 Set 中使用值对象作为键。
   * 子类应该重写此方法以实现具体的哈希码计算逻辑。
   *
   * @returns 哈希码字符串
   */
  public getHashCode(): string {
    return this.constructor.name;
  }

  /**
   * 将值对象转换为字符串表示
   *
   * 子类应该重写此方法以提供有意义的字符串表示。
   *
   * @returns 字符串表示
   */
  public toString(): string {
    return this.constructor.name;
  }

  /**
   * 将值对象转换为 JSON 表示
   *
   * 子类应该重写此方法以提供 JSON 序列化支持。
   *
   * @returns JSON 表示
   */
  public toJSON(): Record<string, unknown> {
    return {
      type: this.constructor.name,
    };
  }

  /**
   * 创建值对象的副本
   *
   * 由于值对象是不可变的，此方法返回当前实例。
   *
   * @returns 当前值对象实例
   */
  public clone(): BaseValueObject {
    return this;
  }

  /**
   * 检查值对象是否为空
   *
   * 子类应该重写此方法以实现具体的空值检查逻辑。
   *
   * @returns 如果值对象为空则返回 true，否则返回 false
   */
  public isEmpty(): boolean {
    return false;
  }

  /**
   * 验证值对象的有效性
   *
   * 子类应该重写此方法以实现具体的验证逻辑。
   * 验证失败时应抛出相应的异常。
   *
   * @throws {Error} 当值对象无效时
   */
  protected validate(): void {
    // 子类实现
  }

  /**
   * 获取值对象的类型名称
   *
   * @returns 类型名称
   */
  public getTypeName(): string {
    return this.constructor.name;
  }

  /**
   * 比较两个值对象的大小
   *
   * 子类应该重写此方法以实现具体的比较逻辑。
   * 默认实现基于类型名称进行比较。
   *
   * @param other - 要比较的另一个值对象
   * @returns 比较结果：-1 表示小于，0 表示等于，1 表示大于
   */
  public compareTo(other: BaseValueObject): number {
    if (other === null || other === undefined) {
      return 1;
    }

    const thisType = this.getTypeName();
    const otherType = other.getTypeName();

    if (thisType < otherType) {
      return -1;
    }
    if (thisType > otherType) {
      return 1;
    }
    return 0;
  }
}
