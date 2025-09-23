/**
 * 实体标识符值对象
 *
 * 实体标识符是领域驱动设计中的核心概念，用于唯一标识实体。
 * 本实现使用 UUID v4 格式，确保全局唯一性和类型安全。
 *
 * ## 业务规则
 *
 * ### 唯一性规则
 * - 每个实体标识符在系统中必须唯一
 * - 标识符一旦创建不可变更
 * - 标识符用于实体的相等性比较
 * - 标识符必须符合 UUID v4 格式要求
 *
 * ### 类型安全规则
 * - 标识符具有强类型约束，防止类型混淆
 * - 标识符与普通字符串不可互换
 * - 标识符支持序列化和反序列化操作
 * - 标识符支持数据库存储和检索
 *
 * ### 验证规则
 * - 标识符必须为有效的 UUID v4 格式
 * - 空字符串或无效格式的标识符将被拒绝
 * - 标识符比较基于值相等性，而非引用相等性
 * - 标识符支持字符串转换和解析操作
 *
 * @description 实体标识符值对象，提供类型安全的唯一标识符管理
 * @example
 * ```typescript
 * // 生成新的实体标识符
 * const userId = EntityId.generate();
 *
 * // 从字符串创建实体标识符
 * const existingId = EntityId.fromString('550e8400-e29b-41d4-a716-446655440000');
 *
 * // 比较实体标识符
 * const isEqual = userId.equals(existingId);
 *
 * // 转换为字符串
 * const idString = userId.toString();
 * ```
 *
 * @since 1.0.0
 */
import {
  v4 as uuidv4,
  validate as validateUuid,
  version as uuidVersion,
} from 'uuid';

export class EntityId {
  private readonly _value: string;

  /**
   * 构造函数
   *
   * @param value - UUID v4 格式的字符串值
   * @throws {Error} 当提供的值不是有效的 UUID v4 格式时
   */
  private constructor(value: string) {
    if (!EntityId.isValid(value)) {
      throw new Error(`Invalid EntityId: ${value} is not a valid UUID v4`);
    }
    this._value = value;
  }

  /**
   * 获取标识符的字符串值
   *
   * @returns UUID v4 格式的字符串
   */
  public get value(): string {
    return this._value;
  }

  /**
   * 生成新的实体标识符
   *
   * 使用 UUID v4 算法生成全局唯一的标识符。
   *
   * @returns 新的 EntityId 实例
   */
  public static generate(): EntityId {
    return new EntityId(uuidv4());
  }

  /**
   * 从字符串创建实体标识符
   *
   * @param value - UUID v4 格式的字符串
   * @returns EntityId 实例
   * @throws {Error} 当提供的值不是有效的 UUID v4 格式时
   */
  public static fromString(value: string): EntityId {
    return new EntityId(value);
  }

  /**
   * 验证字符串是否为有效的 UUID v4 格式
   *
   * @param value - 要验证的字符串
   * @returns 如果字符串是有效的 UUID v4 格式则返回 true，否则返回 false
   */
  public static isValid(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    if (!validateUuid(value)) {
      return false;
    }

    // 确保是 UUID v4 格式
    return uuidVersion(value) === 4;
  }

  /**
   * 检查两个实体标识符是否相等
   *
   * @param other - 要比较的另一个 EntityId
   * @returns 如果两个标识符相等则返回 true，否则返回 false
   */
  public equals(other: EntityId | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (!(other instanceof EntityId)) {
      return false;
    }

    return this._value === other._value;
  }

  /**
   * 将实体标识符转换为字符串
   *
   * @returns UUID v4 格式的字符串
   */
  public toString(): string {
    return this._value;
  }

  /**
   * 将实体标识符转换为 JSON
   *
   * @returns UUID v4 格式的字符串
   */
  public toJSON(): string {
    return this._value;
  }

  /**
   * 获取实体标识符的哈希值
   *
   * 用于在 Map 或 Set 中使用实体标识符作为键。
   *
   * @returns 字符串哈希值
   */
  public getHashCode(): string {
    return this._value;
  }

  /**
   * 检查实体标识符是否为空
   *
   * @returns 如果标识符为空则返回 true，否则返回 false
   */
  public isEmpty(): boolean {
    return !this._value || this._value.trim().length === 0;
  }

  /**
   * 创建实体标识符的副本
   *
   * @returns 新的 EntityId 实例，具有相同的值
   */
  public clone(): EntityId {
    return new EntityId(this._value);
  }

  /**
   * 获取实体标识符的版本信息
   *
   * @returns UUID 版本号（应该是 4）
   */
  public getVersion(): number {
    return uuidVersion(this._value);
  }

  /**
   * 比较两个实体标识符的大小
   *
   * 基于字符串的字典序进行比较。
   *
   * @param other - 要比较的另一个 EntityId
   * @returns 比较结果：-1 表示小于，0 表示等于，1 表示大于
   */
  public compareTo(other: EntityId): number {
    if (this._value < other._value) {
      return -1;
    }
    if (this._value > other._value) {
      return 1;
    }
    return 0;
  }
}
