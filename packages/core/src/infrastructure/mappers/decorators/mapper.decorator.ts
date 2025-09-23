/**
 * 映射器装饰器
 *
 * 用于标记和配置映射器类，提供映射器的元数据管理和自动注册功能。
 * 装饰器支持运行时发现和依赖注入集成。
 *
 * @description 映射器装饰器提供了声明式的映射器定义方式
 *
 * ## 业务规则
 *
 * ### 装饰器注册规则
 * - 每个领域类型只能有一个主映射器
 * - 映射器必须实现对应的映射器接口
 * - 映射器应该提供明确的元数据
 * - 支持运行时动态注册和发现
 *
 * ### 装饰器配置规则
 * - 装饰器配置应该是声明式的
 * - 配置选项应该支持默认值
 * - 配置应该在编译时验证
 * - 配置支持环境特定的覆盖
 *
 * @example
 * ```typescript
 * @DomainMapper({
 *   domainType: 'User',
 *   persistenceType: 'UserDbEntity',
 *   description: '用户聚合根映射器'
 * })
 * export class UserMapper extends BaseAggregateMapper<User, UserDbEntity> {
 *   // 映射器实现
 * }
 *
 * @ValueObjectMapper({
 *   valueObjectType: 'Email',
 *   primitiveType: 'string'
 * })
 * export class EmailMapper extends BaseValueObjectMapper<Email, string> {
 *   // 映射器实现
 * }
 * ```
 *
 * @since 1.0.0
 */

/**
 * 映射器类型枚举
 */
export enum MapperType {
  DOMAIN = 'domain',
  AGGREGATE = 'aggregate',
  VALUE_OBJECT = 'value_object',
  DTO = 'dto',
  EVENT = 'event',
}

/**
 * 映射器元数据接口
 */
export interface IMapperMetadata {
  /**
   * 映射器类型
   */
  mapperType: MapperType;

  /**
   * 源类型名称
   */
  sourceType: string;

  /**
   * 目标类型名称
   */
  targetType: string;

  /**
   * 映射器描述
   */
  description?: string;

  /**
   * 映射器版本
   */
  version?: string;

  /**
   * 是否为双向映射
   */
  bidirectional?: boolean;

  /**
   * 映射器分类
   */
  category?: string;

  /**
   * 映射器标签
   */
  tags?: string[];

  /**
   * 性能配置
   */
  performance?: {
    enableCaching?: boolean;
    batchSize?: number;
    timeout?: number;
  };
}

/**
 * 领域映射器选项接口
 */
export interface IDomainMapperOptions {
  /**
   * 领域类型名称
   */
  domainType: string;

  /**
   * 持久化类型名称
   */
  persistenceType: string;

  /**
   * 映射器描述
   */
  description?: string;

  /**
   * 映射器版本
   */
  version?: string;

  /**
   * 映射器分类
   */
  category?: string;

  /**
   * 映射器标签
   */
  tags?: string[];

  /**
   * 性能配置
   */
  performance?: {
    enableCaching?: boolean;
    batchSize?: number;
    timeout?: number;
  };
}

/**
 * 值对象映射器选项接口
 */
export interface IValueObjectMapperOptions {
  /**
   * 值对象类型名称
   */
  valueObjectType: string;

  /**
   * 原始类型名称
   */
  primitiveType: string;

  /**
   * 映射器描述
   */
  description?: string;

  /**
   * 映射器版本
   */
  version?: string;
}

/**
 * DTO映射器选项接口
 */
export interface IDtoMapperOptions {
  /**
   * 领域类型名称
   */
  domainType: string;

  /**
   * DTO类型名称
   */
  dtoType: string;

  /**
   * 映射器描述
   */
  description?: string;

  /**
   * DTO版本
   */
  version?: string;

  /**
   * 敏感字段列表
   */
  sensitiveFields?: string[];
}

/**
 * 映射器元数据键
 */
export const MAPPER_METADATA_KEY = Symbol('mapper');

/**
 * 领域映射器装饰器
 *
 * @param options - 映射器配置选项
 * @returns 类装饰器函数
 */
export function DomainMapper(options: IDomainMapperOptions): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (target: any) {
    const metadata: IMapperMetadata = {
      mapperType: MapperType.DOMAIN,
      sourceType: options.domainType,
      targetType: options.persistenceType,
      description: options.description || `${options.domainType} 领域映射器`,
      version: options.version || '1.0.0',
      bidirectional: true,
      category: options.category,
      tags: options.tags,
      performance: options.performance,
    };

    Reflect.defineMetadata(MAPPER_METADATA_KEY, metadata, target);
    return target;
  };
}

/**
 * 聚合根映射器装饰器
 *
 * @param options - 映射器配置选项
 * @returns 类装饰器函数
 */
export function AggregateMapper(options: IDomainMapperOptions): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (target: any) {
    const metadata: IMapperMetadata = {
      mapperType: MapperType.AGGREGATE,
      sourceType: options.domainType,
      targetType: options.persistenceType,
      description: options.description || `${options.domainType} 聚合根映射器`,
      version: options.version || '1.0.0',
      bidirectional: true,
      category: options.category,
      tags: options.tags,
      performance: options.performance,
    };

    Reflect.defineMetadata(MAPPER_METADATA_KEY, metadata, target);
    return target;
  };
}

/**
 * 值对象映射器装饰器
 *
 * @param options - 映射器配置选项
 * @returns 类装饰器函数
 */
export function ValueObjectMapper(
  options: IValueObjectMapperOptions,
): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (target: any) {
    const metadata: IMapperMetadata = {
      mapperType: MapperType.VALUE_OBJECT,
      sourceType: options.valueObjectType,
      targetType: options.primitiveType,
      description:
        options.description || `${options.valueObjectType} 值对象映射器`,
      version: options.version || '1.0.0',
      bidirectional: true,
    };

    Reflect.defineMetadata(MAPPER_METADATA_KEY, metadata, target);
    return target;
  };
}

/**
 * DTO映射器装饰器
 *
 * @param options - 映射器配置选项
 * @returns 类装饰器函数
 */
export function DtoMapper(options: IDtoMapperOptions): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (target: any) {
    const metadata: IMapperMetadata = {
      mapperType: MapperType.DTO,
      sourceType: options.domainType,
      targetType: options.dtoType,
      description: options.description || `${options.domainType} DTO映射器`,
      version: options.version || '1.0.0',
      bidirectional: true,
    };

    Reflect.defineMetadata(MAPPER_METADATA_KEY, metadata, target);
    return target;
  };
}

/**
 * 获取映射器元数据
 *
 * @param target - 目标类或实例
 * @returns 映射器元数据
 */
export function getMapperMetadata(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any,
): IMapperMetadata | undefined {
  return Reflect.getMetadata(MAPPER_METADATA_KEY, target);
}

/**
 * 检查是否为映射器
 *
 * @param target - 要检查的目标
 * @returns 如果是映射器返回true，否则返回false
 */
export function isMapper(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any,
): boolean {
  return Reflect.hasMetadata(MAPPER_METADATA_KEY, target);
}

/**
 * 检查是否为指定类型的映射器
 *
 * @param target - 要检查的目标
 * @param mapperType - 映射器类型
 * @returns 如果是指定类型的映射器返回true，否则返回false
 */
export function isMapperOfType(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any,
  mapperType: MapperType,
): boolean {
  const metadata = getMapperMetadata(target);
  return metadata?.mapperType === mapperType;
}
