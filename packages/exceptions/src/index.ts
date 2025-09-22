/**
 * @aiofix/exceptions
 *
 * 统一的异常处理库，遵循RFC7807标准。
 * 提供完整的HTTP异常处理解决方案。
 *
 * @description 企业级异常处理库
 * @since 1.0.0
 */

// 基础异常类
export * from './exceptions/abstract-http.exception';

// 通用异常类
export * from './exceptions/general-bad-request.exception';
export * from './exceptions/general-forbidden.exception';
export * from './exceptions/general-internal-server.exception';
export * from './exceptions/general-not-found.exception';
export * from './exceptions/general-unauthorized.exception';
export * from './exceptions/general-unprocessable-entity.exception';

// 特定异常类
export * from './exceptions/conflict-entity-creation.exception';
export * from './exceptions/internal-service-unavailable.exception';
export * from './exceptions/missing-configuration-for-feature.exception';
export * from './exceptions/object-not-found.exception';
export * from './exceptions/optimistic-lock.exception';

// 异常过滤器
export * from './interceptors/any-exception.filter';
export * from './interceptors/forbidden-exception.filter';
export * from './interceptors/http-exception.filter';
export * from './interceptors/not-found-exception.filter';

// DTO和接口
export * from './vo/error-response.dto';

// 工具函数
export * from './utils/default-response-body-formatter';

// Swagger装饰器
export * from './swagger';
