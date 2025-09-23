/**
 * Fastify集成核心接口定义
 *
 * @description 定义Fastify集成所需的核心接口，包括适配器、插件、中间件、路由等
 *
 * ## 业务规则
 *
 * ### 适配器规则
 * - 适配器负责管理Fastify服务器实例的生命周期
 * - 适配器必须支持健康检查和性能监控
 * - 适配器必须支持优雅关闭和错误恢复
 *
 * ### 插件规则
 * - 插件必须有唯一的名称标识
 * - 插件支持优先级排序和依赖管理
 * - 插件支持动态启用/禁用
 * - 插件必须提供健康检查接口
 *
 * ### 中间件规则
 * - 中间件按优先级顺序执行
 * - 中间件支持路径和方法过滤
 * - 中间件必须支持性能监控
 * - 中间件支持异步执行和错误处理
 *
 * ### 监控规则
 * - 所有组件都必须提供健康状态
 * - 性能指标必须实时收集和聚合
 * - 监控数据必须支持多租户隔离
 *
 * @since 1.0.0
 */

import {
	FastifyInstance,
	FastifyRequest,
	FastifyReply,
	FastifyPluginOptions,
	EntityId
} from '../../../../common/types';

/**
 * Fastify适配器接口
 *
 * @description 核心适配器接口，管理Fastify服务器实例
 */
export interface IFastifyAdapter {
	/**
	 * 启动服务器
	 */
	start(): Promise<void>;

	/**
	 * 停止服务器
	 */
	stop(): Promise<void>;

	/**
	 * 获取Fastify实例
	 */
	getInstance(): FastifyInstance;

	/**
	 * 获取健康状态
	 */
	getHealthStatus(): Promise<IFastifyHealthStatus>;

	/**
	 * 获取性能指标
	 */
	getPerformanceMetrics(): Promise<IFastifyPerformanceMetrics>;

	/**
	 * 注册插件
	 */
	registerPlugin(plugin: IFastifyPlugin): Promise<void>;

	/**
	 * 注册中间件
	 */
	registerMiddleware(middleware: IFastifyMiddleware): Promise<void>;

	/**
	 * 注册路由
	 */
	registerRoute(route: IFastifyRoute): Promise<void>;
}

/**
 * Fastify插件接口
 *
 * @description 插件管理接口，支持插件生命周期管理
 */
export interface IFastifyPlugin {
	/**
	 * 插件名称（唯一标识）
	 */
	readonly name: string;

	/**
	 * 插件版本
	 */
	readonly version: string;

	/**
	 * 插件优先级（数字越小优先级越高）
	 */
	readonly priority: number;

	/**
	 * 插件是否启用
	 */
	readonly enabled: boolean;

	/**
	 * 插件依赖列表
	 */
	readonly dependencies: string[];

	/**
	 * 插件配置
	 */
	readonly config: IFastifyPluginConfig;

	/**
	 * 注册插件
	 */
	register(fastify: FastifyInstance): Promise<void>;

	/**
	 * 卸载插件
	 */
	unregister(fastify: FastifyInstance): Promise<void>;

	/**
	 * 获取插件健康状态
	 */
	getHealthStatus(): Promise<IFastifyPluginHealth>;

	/**
	 * 验证插件依赖
	 */
	validateDependencies(): Promise<boolean>;
}

/**
 * Fastify中间件接口
 *
 * @description 中间件管理接口，支持智能中间件管理
 */
export interface IFastifyMiddleware {
	/**
	 * 中间件名称（唯一标识）
	 */
	readonly name: string;

	/**
	 * 中间件优先级（数字越小优先级越高）
	 */
	readonly priority: number;

	/**
	 * 中间件是否启用
	 */
	readonly enabled: boolean;

	/**
	 * 中间件配置
	 */
	readonly config: IFastifyMiddlewareConfig;

	/**
	 * 注册中间件
	 */
	register(fastify: FastifyInstance): Promise<void>;

	/**
	 * 卸载中间件
	 */
	unregister(fastify: FastifyInstance): Promise<void>;

	/**
	 * 获取中间件健康状态
	 */
	getHealthStatus(): Promise<IFastifyMiddlewareHealth>;

	/**
	 * 处理请求
	 */
	handle(request: FastifyRequest, reply: FastifyReply): Promise<void>;
}

/**
 * Fastify路由接口
 *
 * @description 路由管理接口，支持动态路由注册
 */
export interface IFastifyRoute {
	/**
	 * 路由路径
	 */
	readonly path: string;

	/**
	 * HTTP方法
	 */
	readonly method: string | string[];

	/**
	 * 路由处理器
	 */
	readonly handler: (request: FastifyRequest, reply: FastifyReply) => Promise<unknown>;

	/**
	 * 路由配置
	 */
	readonly config: IFastifyRouteConfig;

	/**
	 * 注册路由
	 */
	register(fastify: FastifyInstance): Promise<void>;

	/**
	 * 获取路由健康状态
	 */
	getHealthStatus(): Promise<IFastifyRouteHealth>;
}

/**
 * Fastify配置接口
 *
 * @description 完整的Fastify配置接口
 */
export interface IFastifyConfiguration {
	/**
	 * 服务器配置
	 */
	server: {
		port: number;
		host: string;
		https?: {
			key: string;
			cert: string;
		};
		keepAliveTimeout?: number;
		headersTimeout?: number;
	};

	/**
	 * 插件配置列表
	 */
	plugins: IFastifyPluginConfig[];

	/**
	 * 中间件配置列表
	 */
	middleware: IFastifyMiddlewareConfig[];

	/**
	 * 路由配置列表
	 */
	routes: IFastifyRouteConfig[];

	/**
	 * 监控配置
	 */
	monitoring: {
		enableMetrics: boolean;
		enableHealthCheck: boolean;
		enablePerformanceMonitoring: boolean;
		metricsInterval?: number;
	};

	/**
	 * 安全配置
	 */
	security: {
		enableHelmet: boolean;
		enableCORS: boolean;
		enableRateLimit: boolean;
		rateLimitOptions?: unknown;
	};

	/**
	 * 日志配置
	 */
	logging: {
		level: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
		prettyPrint?: boolean;
		redact?: string[];
	};

	/**
	 * 多租户配置
	 */
	multiTenant?: {
		enabled: boolean;
		tenantHeader?: string;
		tenantQueryParam?: string;
	};
}

/**
 * 插件配置接口
 */
export interface IFastifyPluginConfig {
	name: string;
	version?: string;
	priority?: number;
	enabled?: boolean;
	dependencies?: string[];
	options?: FastifyPluginOptions;
	healthCheck?: {
		enabled: boolean;
		interval?: number;
	};
}

/**
 * 中间件配置接口
 */
export interface IFastifyMiddlewareConfig {
	name: string;
	priority?: number;
	enabled?: boolean;
	path?: string | string[];
	method?: string | string[];
	options?: unknown;
	performance?: {
		enabled: boolean;
		threshold?: number;
	};
}

/**
 * 路由配置接口
 */
export interface IFastifyRouteConfig {
	path: string;
	method: string | string[];
	schema?: unknown;
	preHandler?: unknown[];
	preValidation?: unknown[];
	preSerialization?: unknown[];
	onRequest?: unknown[];
	onResponse?: unknown[];
	config?: unknown;
}

/**
 * 健康状态接口
 */
export interface IFastifyHealthStatus {
	status: 'healthy' | 'unhealthy' | 'degraded';
	isStarted: boolean;
	startTime?: Date;
	uptime: number;
	plugins: Record<string, IFastifyPluginHealth>;
	middleware: Record<string, IFastifyMiddlewareHealth>;
	routes: Record<string, IFastifyRouteHealth>;
	performance: IFastifyPerformanceMetrics;
	timestamp: string;
}

/**
 * 插件健康状态接口
 */
export interface IFastifyPluginHealth {
	name: string;
	status: 'healthy' | 'unhealthy' | 'degraded';
	isRegistered: boolean;
	registerTime?: Date;
	lastCheckTime: Date;
	dependencies: Record<string, boolean>;
	metrics?: unknown;
}

/**
 * 中间件健康状态接口
 */
export interface IFastifyMiddlewareHealth {
	name: string;
	status: 'healthy' | 'unhealthy' | 'degraded';
	isRegistered: boolean;
	registerTime?: Date;
	lastCheckTime: Date;
	requestCount: number;
	errorCount: number;
	averageResponseTime: number;
}

/**
 * 路由健康状态接口
 */
export interface IFastifyRouteHealth {
	path: string;
	method: string | string[];
	status: 'healthy' | 'unhealthy' | 'degraded';
	isRegistered: boolean;
	registerTime?: Date;
	lastCheckTime: Date;
	requestCount: number;
	errorCount: number;
	averageResponseTime: number;
}

/**
 * 性能指标接口
 */
export interface IFastifyPerformanceMetrics {
	server: {
		requestCount: number;
		errorCount: number;
		successCount: number;
		successRate: number;
		averageResponseTime: number;
		peakResponseTime: number;
		minResponseTime: number;
	};
	system: {
		memoryUsage: {
			rss: number;
			heapTotal: number;
			heapUsed: number;
			external: number;
			arrayBuffers: number;
		};
		cpuUsage: {
			user: number;
			system: number;
		};
		uptime: number;
	};
	plugins: Record<string, unknown>;
	middleware: Record<string, unknown>;
	routes: Record<string, unknown>;
}

/**
 * 多租户上下文接口
 */
export interface IFastifyTenantContext {
	tenantId: EntityId;
	tenantCode: string;
	tenantName?: string;
	createdAt: Date;
	metadata?: Record<string, unknown>;
}

/**
 * 审计日志接口
 */
export interface IFastifyAuditLog {
	requestId: string;
	tenantId?: EntityId;
	userId?: EntityId;
	method: string;
	url: string;
	headers: Record<string, unknown>;
	body?: unknown;
	timestamp: Date;
	ip: string;
	userAgent?: string;
	responseStatus?: number;
	responseTime?: number;
}

/**
 * 扩展FastifyRequest接口以支持多租户
 */
declare module 'fastify' {
	interface IFastifyRequestExtended {
		tenantId?: EntityId;
		tenantContext?: IFastifyTenantContext;
		userId?: EntityId;
		auditLog?: IFastifyAuditLog;
	}
}
