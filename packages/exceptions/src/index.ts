/**
 * @aiofix/exceptions
 *
 * 企业级异常处理平台，基于Cache模块设计模式重构。
 * 提供统一、可扩展的异常处理能力，支持多租户、配置管理、策略模式等企业级特性。
 *
 * @description 企业级异常处理平台
 * @since 2.0.0
 */

// ===== 重构后的新架构 =====

// 接口定义层
export * from './interfaces';

// 核心实现层
export * from './core';

// 重新导出以解决歧义
export { ApplicationExceptionType, BaseApplicationException } from './core/exception-classifier';

// 异常转换桥梁
export * from './bridges';

// 配置服务
export * from './config';

// 异常处理策略
export * from './strategies';

// NestJS深度集成
export * from './nestjs';

// 监控系统
export * from './monitoring';

// ===== 保留的现有功能 =====

// 基础异常类
export * from './http-exceptions/abstract-http.exception';

// 通用异常类
export * from './http-exceptions/general-bad-request.exception';
export * from './http-exceptions/general-forbidden.exception';
export * from './http-exceptions/general-internal-server.exception';
export * from './http-exceptions/general-not-found.exception';
export * from './http-exceptions/general-unauthorized.exception';
export * from './http-exceptions/general-unprocessable-entity.exception';

// 特定异常类
export * from './http-exceptions/conflict-entity-creation.exception';
export * from './http-exceptions/internal-service-unavailable.exception';
export * from './http-exceptions/missing-configuration-for-feature.exception';
export * from './http-exceptions/object-not-found.exception';
export * from './http-exceptions/optimistic-lock.exception';

// 注意：旧的异常过滤器已被新的UnifiedExceptionFilter替代
// 请使用新的NestJS集成层中的异常过滤器

// DTO和接口
export * from './vo/error-response.dto';

// 工具函数
export * from './utils/default-response-body-formatter';

// Swagger装饰器
export * from './swagger';

// 使用示例
export * from './examples/exception-handling-example';

// 集成示例
export * from './integration/exception-handling-integration-example';
