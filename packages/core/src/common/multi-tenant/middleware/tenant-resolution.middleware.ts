/**
 * 租户解析中间件
 *
 * @description 从HTTP请求中解析租户信息并设置租户上下文的中间件
 * 这是纯技术实现，负责租户信息的提取和上下文设置
 *
 * ## 技术规则
 *
 * ### 租户信息来源优先级
 * 1. HTTP请求头 x-tenant-id 或 x-tenant-code
 * 2. JWT令牌中的租户信息
 * 3. 子域名解析 (tenant.example.com)
 * 4. 查询参数 tenant_id
 *
 * ### 错误处理规则
 * - 无法解析租户信息时返回401错误
 * - 租户状态异常时返回403错误
 * - 提供详细的错误信息用于调试
 * - 记录审计日志用于安全监控
 *
 * @example
 * ```typescript
 * // 在NestJS中使用
 * @Injectable()
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer
 *       .apply(TenantResolutionMiddleware)
 *       .forRoutes('*');
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { TenantContextManager, ITenantContextData } from '../context/tenant-context-manager';

// 使用通用的请求响应接口，避免依赖express
interface IRequest {
	path: string;
	headers: Record<string, string | string[] | undefined>;
	query: Record<string, string | string[] | undefined>;
	ip?: string;
	method: string;
}

interface IResponse {
	status(code: number): IResponse;
	json(body: unknown): void;
}

type NextFunction = () => void;

/**
 * 租户解析选项
 */
export interface ITenantResolutionOptions {
	/** 是否启用子域名解析 */
	enableSubdomainResolution?: boolean;

	/** 是否启用查询参数解析 */
	enableQueryParameterResolution?: boolean;

	/** 默认租户ID（用于开发环境） */
	defaultTenantId?: string;

	/** 跳过租户解析的路径 */
	skipPaths?: string[];

	/** 租户数据提供者函数 */
	tenantDataProvider?: (tenantIdentifier: string) => Promise<ITenantContextData>;
}

/**
 * 租户解析中间件
 */
@Injectable()
export class TenantResolutionMiddleware implements NestMiddleware {
	constructor(private readonly options: ITenantResolutionOptions = {}) {}

	async use(req: IRequest, res: IResponse, next: NextFunction): Promise<void> {
		try {
			// 检查是否跳过租户解析
			if (this.shouldSkipPath(req.path)) {
				return next();
			}

			// 解析租户信息
			const tenantIdentifier = this.extractTenantIdentifier(req);
			if (!tenantIdentifier) {
				return this.handleMissingTenant(res);
			}

			// 获取租户上下文数据
			const tenantContext = await this.resolveTenantContext(tenantIdentifier, req);
			if (!tenantContext) {
				return this.handleInvalidTenant(res, tenantIdentifier);
			}

			// 在租户上下文中执行后续中间件
			TenantContextManager.run(tenantContext, () => {
				next();
			});
		} catch (error) {
			this.handleError(res, error);
		}
	}

	/**
	 * 提取租户标识符
	 */
	private extractTenantIdentifier(req: IRequest): string | null {
		// 1. 从请求头获取
		const headerTenant = req.headers['x-tenant-id'] || req.headers['x-tenant-code'];
		if (headerTenant && typeof headerTenant === 'string') {
			return headerTenant;
		}

		// 2. 从JWT令牌获取
		const jwtTenant = this.extractTenantFromJWT(req);
		if (jwtTenant) {
			return jwtTenant;
		}

		// 3. 从子域名获取
		if (this.options.enableSubdomainResolution) {
			const subdomainTenant = this.extractTenantFromSubdomain(req);
			if (subdomainTenant) {
				return subdomainTenant;
			}
		}

		// 4. 从查询参数获取
		if (this.options.enableQueryParameterResolution) {
			const queryTenant = req.query.tenant_id || req.query.tenantId;
			if (queryTenant && typeof queryTenant === 'string') {
				return queryTenant;
			}
		}

		// 5. 使用默认租户（开发环境）
		return this.options.defaultTenantId || null;
	}

	/**
	 * 从JWT令牌提取租户信息
	 */
	private extractTenantFromJWT(req: IRequest): string | null {
		const authorization = req.headers.authorization;
		if (!authorization || typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
			return null;
		}

		// TODO: 集成JWT库解析令牌中的租户信息
		// const token = authorization.substring(7);
		// const decoded = jwt.decode(token);
		// return decoded?.tenantId || null;

		return null;
	}

	/**
	 * 从子域名提取租户信息
	 */
	private extractTenantFromSubdomain(req: IRequest): string | null {
		const host = req.headers.host;
		if (!host || typeof host !== 'string') return null;

		// 支持子域名模式：tenant-code.example.com
		const parts = host.split('.');
		if (parts.length >= 3) {
			return parts[0];
		}

		return null;
	}

	/**
	 * 解析租户上下文
	 */
	private async resolveTenantContext(tenantIdentifier: string, req: IRequest): Promise<ITenantContextData | null> {
		// 如果提供了租户数据提供者，使用它获取完整的租户信息
		if (this.options.tenantDataProvider) {
			try {
				return await this.options.tenantDataProvider(tenantIdentifier);
			} catch {
				return null;
			}
		}

		// 否则创建基础的租户上下文
		return {
			tenantId: tenantIdentifier,
			tenantCode: tenantIdentifier,
			createdAt: new Date(),
			requestId: req.headers['x-request-id'] as string,
			correlationId: req.headers['x-correlation-id'] as string,
			metadata: {
				userAgent: req.headers['user-agent'],
				ip: req.ip,
				path: req.path,
				method: req.method
			}
		};
	}

	/**
	 * 检查是否应该跳过路径
	 */
	private shouldSkipPath(path: string): boolean {
		if (!this.options.skipPaths) {
			return false;
		}

		return this.options.skipPaths.some((skipPath) => {
			// 支持通配符匹配
			if (skipPath.includes('*')) {
				const regex = new RegExp(skipPath.replace(/\*/g, '.*'));
				return regex.test(path);
			}
			return path.startsWith(skipPath);
		});
	}

	/**
	 * 处理缺失租户信息
	 */
	private handleMissingTenant(res: IResponse): void {
		res.status(401).json({
			error: 'TENANT_REQUIRED',
			message: '请求必须包含有效的租户信息',
			details: {
				supportedHeaders: ['x-tenant-id', 'x-tenant-code'],
				supportedSources: ['headers', 'jwt', 'subdomain', 'query']
			}
		});
	}

	/**
	 * 处理无效租户
	 */
	private handleInvalidTenant(res: IResponse, tenantIdentifier: string): void {
		res.status(403).json({
			error: 'INVALID_TENANT',
			message: '无效的租户信息',
			details: {
				tenantIdentifier,
				suggestion: '请检查租户ID是否正确，或联系管理员'
			}
		});
	}

	/**
	 * 处理错误
	 */
	private handleError(res: IResponse, error: unknown): void {
		res.status(500).json({
			error: 'TENANT_RESOLUTION_ERROR',
			message: '租户解析过程中发生错误',
			details: {
				error: error instanceof Error ? error.message : String(error),
				timestamp: new Date().toISOString()
			}
		});
	}
}

/**
 * 创建租户解析中间件
 *
 * @param options 中间件选项
 * @returns 中间件实例
 */
export function createTenantResolutionMiddleware(options: ITenantResolutionOptions = {}): TenantResolutionMiddleware {
	return new TenantResolutionMiddleware(options);
}
