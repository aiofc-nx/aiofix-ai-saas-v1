/**
 * 装饰器类型定义
 *
 * @description 定义装饰器中使用的通用类型，避免使用any类型
 * @since 1.0.0
 */

/**
 * 装饰器目标类型
 * 表示可以被装饰器装饰的类或对象
 * 兼容TypeScript原生的装饰器类型，使用object类型更符合标准
 */
export type DecoratorTarget = object;

/**
 * 类构造函数类型
 * 用于表示类的构造函数
 */
export type ClassConstructor = new (...args: unknown[]) => unknown;

/**
 * 方法装饰器目标类型
 * 兼容TypeScript原生MethodDecorator的object类型
 * 与DecoratorTarget保持一致
 */
export type MethodDecoratorTarget = object;

/**
 * 属性装饰器目标类型
 * 用于属性装饰器
 */
export type PropertyDecoratorTarget = object;

/**
 * 参数装饰器目标类型
 * 用于参数装饰器
 */
export type ParameterDecoratorTarget = object;
