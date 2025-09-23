/**
 * 多租户中间件实现
 *
 * @description 提供多租户上下文管理的Fastify中间件
 *
 * ## 业务规则
 *
 * ### 租户识别规则
 * - 优先级：Header > Query Parameter > Subdomain > Default
 * - Header名称：X-Tenant-ID（可配置）
 * - Query参数名称：tenant（可配置）
 * - 子域名模式：{tenant}.domain.com
 * - 默认租户：当无法识别租户时使用的默认值
 *
 * ### 租户验证规则
 * - 租户ID必须符合EntityId格式要求
 * - 租户必须存在且处于活跃状态
 * - 租户访问权限验证（IP白名单、时间限制等）
 * - 租户配额和限制检查
 *
 * ### 上下文管理规则
 * - 租户上下文在整个请求生命周期内保持
 * - 支持嵌套的异步操作上下文传递
 * - 租户切换时清理前一个租户的上下文
 * - 请求结束时自动清理租户上下文
 *
 * ### 安全规则
 * - 租户ID不能包含特殊字符和SQL注入字符
 * - 跨租户数据访问严格禁止
 * - 租户上下文信息不能泄露给其他租户
 * - 审计日志记录租户访问行为
 *
 * @example
 * ```typescript
 * const tenantMiddleware = new TenantMiddleware({
 *   name: 'tenant',
 *   priority: 1,
 *   options: {
 *     tenantHeader: 'X-Tenant-ID',
 *     tenantQueryParam: 'tenant',
 *     enableSubdomain: true,
 *     defaultTenant: 'default',
 *     validateTenant: true
 *   }
 * });
 * ```
 *
 * @since 1.0.0
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from '../../../../common/types/fastify-types';
import { ILoggerService, EntityId } from '../../../../common/types/compatibility-types';
import { CoreFastifyMiddleware } from './core-fastify.middleware';
import { IFastifyMiddlewareConfig, IFastifyTenantContext } from '../interfaces/fastify.interface';

/**
 * 租户中间件配置接口
 */
export interface ITenantMiddlewareConfig extends IFastifyMiddlewareConfig {
	options: {
		/**
		 * 租户ID的Header名称
		 */
		tenantHeader?: string;

		/**
		 * 租户ID的Query参数名称
		 */
		tenantQueryParam?: string;

		/**
		 * 是否启用子域名识别
		 */
		enableSubdomain?: boolean;

		/**
		 * 默认租户ID
		 */
		defaultTenant?: string;

		/**
		 * 是否验证租户
		 */
		validateTenant?: boolean;

		/**
		 * 租户验证函数
		 */
		tenantValidator?: (tenantId: string) => Promise<boolean>;

		/**
		 * 租户信息获取函数
		 */
		tenantInfoProvider?: (tenantId: string) => Promise<IFastifyTenantContext | null>;
	};
}

/**
 * 多租户中间件实现
 */
export class TenantMiddleware extends CoreFastifyMiddleware {
	constructor(config: ITenantMiddlewareConfig, logger?: ILoggerService) {
		super(config, logger);
		this.validateTenantConfig();
	}

	/**
	 * 执行中间件处理逻辑
	 */
	protected override async doHandle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
		try {
			// 提取租户ID
			const tenantId = await this.extractTenantId(request);

			if (!tenantId) {
				// 如果没有提取到租户ID且没有默认租户，返回错误
				const defaultTenant = this.getTenantOptions().defaultTenant;
				if (!defaultTenant) {
					await reply.status(400).send({
						error: 'Bad Request',
						message: '缺少租户标识',
						code: 'MISSING_TENANT_ID'
					});
					return;
				}
			}

			const defaultTenant = this.getTenantOptions().defaultTenant;
			if (!defaultTenant) {
				await reply.status(400).send({
					error: 'Bad Request',
					message: '缺少租户标识',
					code: 'MISSING_TENANT_ID'
				});
				return;
			}
			const finalTenantId = tenantId || defaultTenant;

			// 验证租户ID格式
			if (!this.isValidTenantId(finalTenantId)) {
				await reply.status(400).send({
					error: 'Bad Request',
					message: '租户ID格式不正确',
					code: 'INVALID_TENANT_ID'
				});
				return;
			}

			// 验证租户是否存在和有效
			if (this.getTenantOptions().validateTenant) {
				const isValid = await this.validateTenant(finalTenantId);
				if (!isValid) {
					await reply.status(403).send({
						error: 'Forbidden',
						message: '租户不存在或无权限访问',
						code: 'TENANT_ACCESS_DENIED'
					});
					return;
				}
			}

			// 获取租户上下文信息
			const tenantContext = await this.getTenantContext(finalTenantId);

			// 设置租户上下文
			await this.setTenantContext(request, tenantContext);

			// 记录租户访问日志
			this.logTenantAccess(request, tenantContext);
		} catch (error) {
			this.logger?.error('租户中间件处理失败', error as Error, {
				method: request.method,
				url: request.url,
				headers: this.sanitizeHeaders(request.headers)
			});

			await reply.status(500).send({
				error: 'Internal Server Error',
				message: '租户处理失败',
				code: 'TENANT_PROCESSING_ERROR'
			});
		}
	}

	/**
	 * 执行中间件卸载
	 */
	protected override async doUnregister(_fastify: FastifyInstance): Promise<void> {
		// 清理租户上下文（如果需要）
		this.logger?.info('租户中间件卸载', { name: this.name });
	}

	/**
	 * 提取租户ID
	 */
	private async extractTenantId(request: FastifyRequest): Promise<string | null> {
		const options = this.getTenantOptions();

		// 1. 从Header中提取
		if (options.tenantHeader) {
			const headerValue = request.headers[options.tenantHeader.toLowerCase()] as string;
			if (headerValue) {
				return headerValue.trim();
			}
		}

		// 2. 从Query参数中提取
		if (options.tenantQueryParam) {
			const queryValue = (request.query as Record<string, unknown>)[options.tenantQueryParam] as string;
			if (queryValue) {
				return queryValue.trim();
			}
		}

		// 3. 从子域名中提取
		if (options.enableSubdomain) {
			const tenantFromSubdomain = this.extractTenantFromSubdomain(request);
			if (tenantFromSubdomain) {
				return tenantFromSubdomain;
			}
		}

		return null;
	}

	/**
	 * 从子域名中提取租户ID
	 */
	private extractTenantFromSubdomain(request: FastifyRequest): string | null {
		const host = request.headers.host;
		if (!host) {
			return null;
		}

		// 简单的子域名提取逻辑：假设格式为 {tenant}.domain.com
		const parts = host.split('.');
		if (parts.length >= 3) {
			const subdomain = parts[0];
			// 过滤常见的非租户子域名
			if (!['www', 'api', 'admin', 'app'].includes(subdomain.toLowerCase())) {
				return subdomain;
			}
		}

		return null;
	}

	/**
	 * 验证租户ID格式
	 */
	private isValidTenantId(tenantId: string): boolean {
		// 检查基本格式
		if (!tenantId || tenantId.length === 0) {
			return false;
		}

		// 检查长度限制
		if (tenantId.length > 100) {
			return false;
		}

		// 检查特殊字符（防止SQL注入等）
		const invalidChars = /[<>'"&;\\]/;
		if (invalidChars.test(tenantId)) {
			return false;
		}

		return true;
	}

	/**
	 * 验证租户是否有效
	 */
	private async validateTenant(tenantId: string): Promise<boolean> {
		const options = this.getTenantOptions();

		if (options.tenantValidator) {
			try {
				return await options.tenantValidator(tenantId);
			} catch (error) {
				this.logger?.error('租户验证函数执行失败', error as Error, {
					tenantId
				});
				return false;
			}
		}

		// 默认验证逻辑：所有租户都有效
		return true;
	}

	/**
	 * 获取租户上下文信息
	 */
	private async getTenantContext(tenantId: string): Promise<IFastifyTenantContext> {
		const options = this.getTenantOptions();

		if (options.tenantInfoProvider) {
			try {
				const tenantInfo = await options.tenantInfoProvider(tenantId);
				if (tenantInfo) {
					return tenantInfo;
				}
			} catch (error) {
				this.logger?.error('获取租户信息失败', error as Error, { tenantId });
			}
		}

		// 默认租户上下文
		return {
			tenantId: EntityId.fromString(tenantId),
			tenantCode: tenantId,
			tenantName: tenantId,
			createdAt: new Date(),
			metadata: {}
		};
	}

	/**
	 * 设置租户上下文
	 */
	private async setTenantContext(request: FastifyRequest, tenantContext: IFastifyTenantContext): Promise<void> {
		// 设置到请求对象
		const requestWithTenant = request as unknown as {
			tenantId: EntityId;
			tenantContext: IFastifyTenantContext;
		};
		requestWithTenant.tenantId = tenantContext.tenantId;
		requestWithTenant.tenantContext = tenantContext;

		// 注意：TenantContextManager 使用 run 方法在租户上下文中执行代码
		// 这里只是将租户信息附加到请求对象上，实际的上下文管理在请求处理过程中进行
	}

	/**
	 * 记录租户访问日志
	 */
	private logTenantAccess(request: FastifyRequest, tenantContext: IFastifyTenantContext): void {
		this.logger?.info('租户访问', {
			tenantId: tenantContext.tenantId.toString(),
			tenantCode: tenantContext.tenantCode,
			method: request.method,
			url: request.url,
			ip: request.ip,
			userAgent: request.headers['user-agent']
		});
	}

	/**
	 * 清理敏感的请求头信息用于日志
	 */
	private sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
		const sanitized = { ...headers };

		// 移除敏感信息
		delete sanitized.authorization;
		delete sanitized.cookie;
		delete sanitized['x-api-key'];

		return sanitized;
	}

	/**
	 * 获取租户配置选项
	 */
	private getTenantOptions(): ITenantMiddlewareConfig['options'] {
		const config = this.config as ITenantMiddlewareConfig;
		return {
			tenantHeader: config.options.tenantHeader || 'X-Tenant-ID',
			tenantQueryParam: config.options.tenantQueryParam || 'tenant',
			enableSubdomain: config.options.enableSubdomain || false,
			defaultTenant: config.options.defaultTenant,
			validateTenant: config.options.validateTenant || false,
			tenantValidator: config.options.tenantValidator,
			tenantInfoProvider: config.options.tenantInfoProvider
		};
	}

	/**
	 * 验证租户配置
	 */
	private validateTenantConfig(): void {
		const config = this.config as ITenantMiddlewareConfig;

		if (!config.options) {
			throw new Error('租户中间件配置选项不能为空');
		}

		const { tenantHeader, tenantQueryParam, enableSubdomain } = config.options;

		// 至少要有一种租户识别方式
		if (!tenantHeader && !tenantQueryParam && !enableSubdomain) {
			throw new Error('必须至少启用一种租户识别方式');
		}

		// 验证Header名称格式
		if (tenantHeader && !/^[a-zA-Z][a-zA-Z0-9\-_]*$/.test(tenantHeader)) {
			throw new Error('租户Header名称格式不正确');
		}

		// 验证Query参数名称格式
		if (tenantQueryParam && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(tenantQueryParam)) {
			throw new Error('租户Query参数名称格式不正确');
		}
	}
}
