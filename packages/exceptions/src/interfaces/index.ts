/**
 * 异常处理接口统一导出
 *
 * 统一导出所有异常处理相关的接口定义，提供清晰的模块边界。
 *
 * @description 异常处理接口统一导出
 * @since 1.0.0
 */

// 核心异常接口
export * from './exception.interface';

// 异常过滤器接口
export * from './exception-filter.interface';

// 异常转换桥梁接口
export * from './exception-bridge.interface';
