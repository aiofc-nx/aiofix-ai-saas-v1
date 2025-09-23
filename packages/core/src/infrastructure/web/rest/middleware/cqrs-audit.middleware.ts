/**
 * CQRS审计中间件
 *
 * 提供CQRS操作的审计日志功能，记录所有命令和查询的执行情况。
 * 中间件在请求处理前后记录详细的审计信息，支持合规性要求。
 *
 * @description CQRS审计中间件提供操作审计和日志记录功能
 *
 * ## 业务规则
 *
 * ### 审计记录规则
 * - 记录所有CQRS操作的完整信息
 * - 包含操作前后的数据状态
 * - 记录操作的执行时间和结果
 * - 支持敏感数据的脱敏处理
 *
 * ### 审计数据规则
 * - 审计数据必须包含操作追踪信息
 * - 支持审计数据的结构化存储
 * - 审计数据必须不可篡改
 * - 支持审计数据的查询和导出
 *
 * ### 合规性规则
 * - 满足数据保护法规要求
 * - 支持审计数据的保留策略
 * - 提供审计数据的访问控制
 * - 支持合规性报告生成
 *
 * @example
 * ```typescript
 * // 在控制器中使用
 * @Controller('users')
 * @UseMiddleware(CqrsAuditMiddleware)
 * export class UserController {
 *   @Post()
 *   @CommandEndpoint({
 *     command: CreateUserCommand,
 *     audit: { operation: 'create', resourceType: 'user' }
 *   })
 *   async createUser() {
 *     // 操作自动记录审计日志
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from '../../../../common/types/fastify-types';

/**
 * 审计记录接口
 */
export interface IAuditRecord {
	/**
	 * 审计ID
	 */
	auditId: string;

	/**
	 * 操作类型
	 */
	operation: string;

	/**
	 * 资源类型
	 */
	resourceType: string;

	/**
	 * 资源ID
	 */
	resourceId?: string;

	/**
	 * 用户信息
	 */
	user: {
		userId: string;
		userName?: string;
		userRole?: string;
	};

	/**
	 * 租户信息
	 */
	tenant: {
		tenantId: string;
		tenantName?: string;
	};

	/**
	 * 请求信息
	 */
	request: {
		requestId: string;
		method: string;
		url: string;
		ipAddress?: string;
		userAgent?: string;
	};

	/**
	 * 操作前数据
	 */
	beforeData?: Record<string, unknown>;

	/**
	 * 操作后数据
	 */
	afterData?: Record<string, unknown>;

	/**
	 * 操作结果
	 */
	result: {
		success: boolean;
		errorCode?: string;
		errorMessage?: string;
	};

	/**
	 * 时间信息
	 */
	timing: {
		startTime: Date;
		endTime: Date;
		executionTime: number;
	};

	/**
	 * 其他元数据
	 */
	metadata?: Record<string, unknown>;
}

/**
 * 审计配置接口
 */
export interface IAuditConfig {
	/**
	 * 是否启用审计
	 */
	enabled: boolean;

	/**
	 * 是否记录请求数据
	 */
	logRequestData: boolean;

	/**
	 * 是否记录响应数据
	 */
	logResponseData: boolean;

	/**
	 * 敏感字段列表
	 */
	sensitiveFields: string[];

	/**
	 * 审计数据保留天数
	 */
	retentionDays: number;

	/**
	 * 审计存储配置
	 */
	storage: {
		type: 'database' | 'file' | 'external';
		config: Record<string, unknown>;
	};
}

/**
 * CQRS审计中间件
 */
@Injectable()
export class CqrsAuditMiddleware implements NestMiddleware {
	private readonly config: IAuditConfig;

	constructor() {
		this.config = {
			enabled: true,
			logRequestData: true,
			logResponseData: true,
			sensitiveFields: ['password', 'token', 'secret', 'key'],
			retentionDays: 90,
			storage: {
				type: 'database',
				config: {}
			}
		};
	}

	/**
	 * 中间件处理函数
	 *
	 * @param req - HTTP请求
	 * @param res - HTTP响应
	 * @param next - 下一个处理函数
	 */
	use(req: FastifyRequest, res: FastifyReply, next: () => void): void {
		if (!this.config.enabled) {
			return next();
		}

		const startTime = new Date();
		const auditId = this.generateAuditId();

		// 扩展请求对象以包含审计信息
		(req as unknown as Record<string, unknown>).auditId = auditId;
		(req as unknown as Record<string, unknown>).auditStartTime = startTime;

		// 捕获原始响应数据
		const originalSend = res.send;
		let responseData: unknown;

		res.send = function (data: unknown) {
			responseData = data;
			return originalSend.call(this, data);
		};

		// 监听响应完成 (Fastify 使用不同的方式)
		res.raw.on('finish', async () => {
			try {
				await this.createAuditRecord(req, res, {
					auditId,
					startTime,
					endTime: new Date(),
					responseData
				});
			} catch (error) {
				this.log('error', '创建审计记录失败', {
					auditId,
					error: error instanceof Error ? error.message : String(error)
				});
			}
		});

		next();
	}

	/**
	 * 创建审计记录
	 *
	 * @param req - HTTP请求
	 * @param res - HTTP响应
	 * @param timing - 时间信息
	 * @private
	 */
	private async createAuditRecord(
		req: FastifyRequest,
		res: FastifyReply,
		timing: {
			auditId: string;
			startTime: Date;
			endTime: Date;
			responseData?: unknown;
		}
	): Promise<void> {
		try {
			// 提取操作信息
			const operation = this.extractOperation(req);
			const resourceInfo = this.extractResourceInfo(req);

			// 提取用户和租户信息
			const userInfo = this.extractUserInfo(req);
			const tenantInfo = this.extractTenantInfo(req);

			// 创建审计记录
			const auditRecord: IAuditRecord = {
				auditId: timing.auditId,
				operation: operation.type,
				resourceType: resourceInfo.type,
				resourceId: resourceInfo.id,
				user: userInfo,
				tenant: tenantInfo,
				request: {
					requestId: ((req as unknown as Record<string, unknown>).requestId as string) || timing.auditId,
					method: req.method,
					url: req.url,
					ipAddress: req.ip,
					userAgent: req.headers['user-agent'] as string
				},
				beforeData: this.config.logRequestData ? (this.sanitizeData(req.body) as Record<string, unknown>) : undefined,
				afterData: this.config.logResponseData
					? (this.sanitizeData(timing.responseData) as Record<string, unknown>)
					: undefined,
				result: {
					success: res.statusCode < 400,
					errorCode: res.statusCode >= 400 ? res.statusCode.toString() : undefined,
					errorMessage: res.statusCode >= 400 ? res.raw.statusMessage : undefined
				},
				timing: {
					startTime: timing.startTime,
					endTime: timing.endTime,
					executionTime: timing.endTime.getTime() - timing.startTime.getTime()
				}
			};

			// 存储审计记录
			await this.storeAuditRecord(auditRecord);

			this.log('info', '审计记录创建成功', {
				auditId: timing.auditId,
				operation: operation.type,
				resourceType: resourceInfo.type,
				executionTime: auditRecord.timing.executionTime
			});
		} catch (error) {
			this.log('error', '创建审计记录异常', {
				auditId: timing.auditId,
				error: error instanceof Error ? error.message : String(error)
			});
		}
	}

	/**
	 * 提取操作信息
	 *
	 * @param req - HTTP请求
	 * @returns 操作信息
	 * @private
	 */
	private extractOperation(req: FastifyRequest): {
		type: string;
		description?: string;
	} {
		// 从路由和方法推断操作类型
		const method = req.method.toLowerCase();
		const path = req.url;

		let operationType = 'unknown';
		if (method === 'post') operationType = 'create';
		else if (method === 'get') operationType = 'read';
		else if (method === 'put' || method === 'patch') operationType = 'update';
		else if (method === 'delete') operationType = 'delete';

		return {
			type: operationType,
			description: `${method.toUpperCase()} ${path}`
		};
	}

	/**
	 * 提取资源信息
	 *
	 * @param req - HTTP请求
	 * @returns 资源信息
	 * @private
	 */
	private extractResourceInfo(req: FastifyRequest): { type: string; id?: string } {
		const path = req.url;
		const pathSegments = path.split('/').filter(Boolean);

		// 从路径推断资源类型
		const resourceType = pathSegments[0] || 'unknown';
		const params = req.params as Record<string, unknown>;
		const resourceId = (params?.id as string) || (params?.resourceId as string);

		return {
			type: resourceType,
			id: resourceId
		};
	}

	/**
	 * 提取用户信息
	 *
	 * @param req - HTTP请求
	 * @returns 用户信息
	 * @private
	 */
	private extractUserInfo(req: FastifyRequest): IAuditRecord['user'] {
		const user = (req as unknown as Record<string, unknown>).user as Record<string, unknown>;

		return {
			userId: (user?.userId as string) || (user?.id as string) || 'anonymous',
			userName: (user?.userName as string) || (user?.name as string),
			userRole: (user?.userRole as string) || (user?.role as string)
		};
	}

	/**
	 * 提取租户信息
	 *
	 * @param req - HTTP请求
	 * @returns 租户信息
	 * @private
	 */
	private extractTenantInfo(req: FastifyRequest): IAuditRecord['tenant'] {
		const params = req.params as Record<string, unknown>;
		const user = (req as unknown as Record<string, unknown>).user as Record<string, unknown>;
		const tenantId =
			req.headers['x-tenant-id'] || req.headers['tenant-id'] || params?.tenantId || user?.tenantId || 'default';

		return {
			tenantId: tenantId as string,
			tenantName: req.headers['x-tenant-name'] as string
		};
	}

	/**
	 * 数据脱敏处理
	 *
	 * @param data - 原始数据
	 * @returns 脱敏后的数据
	 * @private
	 */
	private sanitizeData(data: unknown): unknown {
		if (!data || typeof data !== 'object') {
			return data;
		}

		const sanitized = { ...(data as Record<string, unknown>) };

		this.config.sensitiveFields.forEach((field) => {
			if (field in sanitized) {
				sanitized[field] = '***';
			}
		});

		return sanitized;
	}

	/**
	 * 存储审计记录
	 *
	 * @param auditRecord - 审计记录
	 * @private
	 */
	private async storeAuditRecord(auditRecord: IAuditRecord): Promise<void> {
		// TODO: 集成实际的审计存储系统
		// 根据配置选择存储方式：数据库、文件、外部系统等
		this.log('debug', '审计记录已存储', {
			auditId: auditRecord.auditId,
			storageType: this.config.storage.type
		});
	}

	/**
	 * 生成审计ID
	 *
	 * @returns 审计ID
	 * @private
	 */
	private generateAuditId(): string {
		return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * 记录日志
	 *
	 * @param level - 日志级别
	 * @param message - 日志消息
	 * @param context - 上下文信息
	 * @private
	 */
	private log(_level: string, _message: string, _context?: Record<string, unknown>): void {
		// TODO: 替换为实际的日志系统
		// console.log(`[${_level.toUpperCase()}] [CqrsAuditMiddleware] ${_message}`, _context);
	}
}
