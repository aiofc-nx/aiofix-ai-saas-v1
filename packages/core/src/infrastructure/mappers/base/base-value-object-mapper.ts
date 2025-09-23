/**
 * 基础值对象映射器
 *
 * 提供值对象映射的基础实现，支持值对象与原始类型之间的转换。
 * 值对象映射器专门处理不可变值对象的序列化和反序列化。
 *
 * @description 基础值对象映射器为所有值对象映射器提供统一的基础功能
 *
 * ## 业务规则
 *
 * ### 值对象映射规则
 * - 值对象映射必须保持不可变性
 * - 映射结果必须通过值对象的验证规则
 * - 支持复杂值对象的嵌套映射
 * - 映射失败时必须提供明确的错误信息
 *
 * ### 原始类型转换规则
 * - 支持基础类型的直接转换
 * - 支持复合类型的结构化转换
 * - 支持自定义序列化格式
 * - 保持类型安全的转换过程
 *
 * ### 验证规则
 * - 映射前验证原始数据的有效性
 * - 映射后验证值对象的业务规则
 * - 支持自定义验证逻辑
 * - 验证失败时提供详细的错误信息
 *
 * @example
 * ```typescript
 * export class EmailMapper extends BaseValueObjectMapper<Email, string> {
 *   constructor() {
 *     super('EmailMapper');
 *   }
 *
 *   protected mapToPrimitive(valueObject: Email): string {
 *     return valueObject.value;
 *   }
 *
 *   protected mapFromPrimitive(primitive: string): Email {
 *     return new Email(primitive);
 *   }
 *
 *   protected validatePrimitive(primitive: string): void {
 *     if (!primitive || typeof primitive !== 'string') {
 *       throw new Error('Email必须是非空字符串');
 *     }
 *     if (!primitive.includes('@')) {
 *       throw new Error('Email格式无效');
 *     }
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import type { IValueObjectMapper } from './mapper.interface';
import { MappingError } from './base-domain-mapper';

/**
 * 基础值对象映射器抽象类
 *
 * @template TValueObject - 值对象类型
 * @template TPrimitive - 原始类型
 */
export abstract class BaseValueObjectMapper<TValueObject, TPrimitive>
  implements IValueObjectMapper<TValueObject, TPrimitive>
{
  protected readonly mapperName: string;

  /**
   * 构造函数
   *
   * @param mapperName - 映射器名称
   */
  protected constructor(mapperName: string) {
    this.mapperName = mapperName;
  }

  /**
   * 将值对象映射为原始值
   *
   * @param valueObject - 值对象
   * @returns 原始值
   * @throws {MappingError} 当映射失败时
   */
  public toPrimitive(valueObject: TValueObject): TPrimitive {
    try {
      this.validateValueObject(valueObject);
      const result = this.mapToPrimitive(valueObject);
      this.validatePrimitive(result);
      return result;
    } catch (error) {
      throw new MappingError(
        `值对象映射到原始值失败: ${error instanceof Error ? error.message : String(error)}`,
        'ValueObject',
        'Primitive',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 将原始值映射为值对象
   *
   * @param primitive - 原始值
   * @returns 值对象
   * @throws {MappingError} 当映射失败时
   */
  public fromPrimitive(primitive: TPrimitive): TValueObject {
    try {
      this.validatePrimitive(primitive);
      const result = this.mapFromPrimitive(primitive);
      this.validateValueObject(result);
      return result;
    } catch (error) {
      throw new MappingError(
        `原始值映射到值对象失败: ${error instanceof Error ? error.message : String(error)}`,
        'Primitive',
        'ValueObject',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 批量映射值对象为原始值
   *
   * @param valueObjects - 值对象数组
   * @returns 原始值数组
   */
  public toPrimitiveBatch(valueObjects: TValueObject[]): TPrimitive[] {
    return valueObjects.map((vo) => this.toPrimitive(vo));
  }

  /**
   * 批量映射原始值为值对象
   *
   * @param primitives - 原始值数组
   * @returns 值对象数组
   */
  public fromPrimitiveBatch(primitives: TPrimitive[]): TValueObject[] {
    return primitives.map((primitive) => this.fromPrimitive(primitive));
  }

  /**
   * 检查值对象是否可以映射为指定的原始值
   *
   * @param valueObject - 值对象
   * @returns 是否可以映射
   */
  public canMapToPrimitive(valueObject: TValueObject): boolean {
    try {
      this.validateValueObject(valueObject);
      const primitive = this.mapToPrimitive(valueObject);
      this.validatePrimitive(primitive);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 检查原始值是否可以映射为值对象
   *
   * @param primitive - 原始值
   * @returns 是否可以映射
   */
  public canMapFromPrimitive(primitive: TPrimitive): boolean {
    try {
      this.validatePrimitive(primitive);
      const valueObject = this.mapFromPrimitive(primitive);
      this.validateValueObject(valueObject);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 映射值对象到原始值的具体实现
   *
   * @param valueObject - 值对象
   * @returns 原始值
   * @protected
   */
  protected abstract mapToPrimitive(valueObject: TValueObject): TPrimitive;

  /**
   * 映射原始值到值对象的具体实现
   *
   * @param primitive - 原始值
   * @returns 值对象
   * @protected
   */
  protected abstract mapFromPrimitive(primitive: TPrimitive): TValueObject;

  /**
   * 验证值对象的有效性
   *
   * @param valueObject - 值对象
   * @throws {Error} 当验证失败时
   * @protected
   */
  protected validateValueObject(valueObject: TValueObject): void {
    if (valueObject === null || valueObject === undefined) {
      throw new Error('值对象不能为空');
    }
  }

  /**
   * 验证原始值的有效性
   *
   * @param primitive - 原始值
   * @throws {Error} 当验证失败时
   * @protected
   */
  protected validatePrimitive(primitive: TPrimitive): void {
    if (primitive === null || primitive === undefined) {
      throw new Error('原始值不能为空');
    }
  }

  /**
   * 记录映射日志
   *
   * @param level - 日志级别
   * @param message - 日志消息
   * @param context - 上下文信息
   * @protected
   */
  protected log(
    _level: string,
    _message: string,
    _context?: Record<string, unknown>,
  ): void {
    // TODO: 替换为实际的日志系统
    // console.log(`[${_level.toUpperCase()}] [${this.mapperName}] ${_message}`, _context);
  }
}
