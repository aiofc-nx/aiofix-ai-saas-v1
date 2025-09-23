/**
 * 简化Web中间件
 *
 * @description 简化的Web中间件实现，专注于核心功能
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { TenantContextManager, type ITenantContextData } from '../../../common/multi-tenant';

/**
 * 简化Web中间件配置
 */
export interface ISimpleWebMiddlewareOptions {
	/** 是否启用租户解析 */
	enableTenantResolution?: boolean;

	/** 是否启用请求日志 */
	enableRequestLogging?: boolean;

	/** 跳过路径列表 */
	skipPaths?: string[];
}

/**
 * 请求信息接口
 */
export interface IRequestInfo {
	method: string;
	url: string;
	path: string;
	headers: Record<string, string>;
	ip?: string;
}

/**
 * 简化Web中间件
 */
@Injectable()
export class SimpleWebMiddleware {
	private readonly options: Required<ISimpleWebMiddlewareOptions>;

	constructor(options: ISimpleWebMiddlewareOptions = {}) {
		this.options = {
			enableTenantResolution: options.enableTenantResolution ?? true,
			enableRequestLogging: options.enableRequestLogging ?? true,
			skipPaths: options.skipPaths ?? ['/health', '/metrics']
		};
	}

	/**
	 * 处理请求
	 */
	async processRequest(requestInfo: IRequestInfo): Promise<void> {
		// 检查是否跳过处理
		if (this.shouldSkip(requestInfo.path)) {
			return;
		}

		// 请求日志
		if (this.options.enableRequestLogging) {
			console.warn(`[${new Date().toISOString()}] ${requestInfo.method} ${requestInfo.url}`);
		}

		// 租户解析
		if (this.options.enableTenantResolution) {
			const tenantContext = this.resolveTenantContext(requestInfo);
			if (tenantContext) {
				// 在租户上下文中处理
				TenantContextManager.run(tenantContext, () => {
					// 租户上下文已设置
				});
			}
		}
	}

	/**
	 * 创建Express中间件
	 */
	toExpressMiddleware() {
		return (req: Record<string, unknown>, res: Record<string, unknown>, next: () => void): void => {
			const requestInfo: IRequestInfo = {
				method: (req.method as string) || 'GET',
				url: (req.url as string) || '/',
				path: (req.path as string) || (req.url as string) || '/',
				headers: (req.headers as Record<string, string>) || {},
				ip: req.ip as string | undefined
			};

			this.processRequest(requestInfo)
				.then(() => next())
				.catch(next);
		};
	}

	/**
	 * 获取配置信息
	 */
	getConfig(): Required<ISimpleWebMiddlewareOptions> {
		return { ...this.options };
	}

	/**
	 * 健康检查
	 */
	healthCheck(): { healthy: boolean; status: string; config: Required<ISimpleWebMiddlewareOptions> } {
		return {
			healthy: true,
			status: 'running',
			config: this.options
		};
	}

	// ==================== 私有方法 ====================

	/**
	 * 解析租户上下文
	 */
	private resolveTenantContext(request: IRequestInfo): ITenantContextData | null {
		// 从请求头获取租户信息
		const tenantId = request.headers['x-tenant-id'];
		if (tenantId) {
			return {
				tenantId,
				tenantCode: request.headers['x-tenant-code'],
				createdAt: new Date()
			};
		}

		// 从Host头获取子域名
		const host = request.headers.host;
		if (host && host.includes('.')) {
			const subdomain = host.split('.')[0];
			if (subdomain && subdomain !== 'www') {
				return {
					tenantId: subdomain,
					tenantCode: subdomain,
					createdAt: new Date()
				};
			}
		}

		return null;
	}

	/**
	 * 检查是否应该跳过处理
	 */
	private shouldSkip(path: string): boolean {
		return this.options.skipPaths.some((skipPath) => {
			if (skipPath.includes('*')) {
				const regex = new RegExp(skipPath.replace(/\*/g, '.*'));
				return regex.test(path);
			}
			return path.startsWith(skipPath);
		});
	}
}
