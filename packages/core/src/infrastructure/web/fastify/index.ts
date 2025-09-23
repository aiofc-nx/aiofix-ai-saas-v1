/**
 * Fastify 集成模块导出
 *
 * 导出所有 Fastify 集成相关的接口、实现类和工具。
 *
 * @description Fastify 集成模块导出
 * @since 1.0.0
 */

// 核心接口导出
export * from './interfaces/fastify.interface';

// 适配器导出
export {
  CoreFastifyAdapter,
  FastifyAdapterError,
} from './adapters/core-fastify.adapter';
// 企业级适配器 - 完整替代NestJS官方适配器的企业级实现
export { EnterpriseFastifyAdapter } from './adapters/enterprise-fastify.adapter';
export type { IEnterpriseFastifyOptions } from './adapters/enterprise-fastify.adapter';

// 插件导出
export type { CoreFastifyPlugin } from './plugins/core-fastify.plugin';
export { FastifyPluginError } from './plugins/core-fastify.plugin';
export { CorsPlugin } from './plugins/cors.plugin';
export type { ICorsPluginConfig } from './plugins/cors.plugin';

// 中间件导出
export type { CoreFastifyMiddleware } from './middleware/core-fastify.middleware';
export { FastifyMiddlewareError } from './middleware/core-fastify.middleware';
export { TenantMiddleware } from './middleware/tenant.middleware';
export type { ITenantMiddlewareConfig } from './middleware/tenant.middleware';

// 基础模块导出
export * from './fastify-module';
