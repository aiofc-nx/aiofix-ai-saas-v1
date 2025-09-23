/**
 * 异常上下文管理器
 *
 * 负责管理异常上下文信息的提取、构建和转换。
 * 支持从NestJS ArgumentsHost中提取上下文信息，并构建标准化的异常上下文。
 *
 * @description 异常上下文管理器实现类
 * @example
 * ```typescript
 * const contextManager = new ExceptionContextManager();
 * const context = await contextManager.extractContext(host);
 * ```
 *
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { IExceptionContext } from '../interfaces/exception.interface';

/**
 * HTTP请求对象类型定义
 */
interface HttpRequest {
	id?: string;
	method?: string;
	url?: string;
	headers?: Record<string, string>;
	query?: Record<string, unknown>;
	params?: Record<string, unknown>;
	body?: unknown;
	ip?: string;
	connection?: {
		remoteAddress?: string;
	};
	socket?: {
		remoteAddress?: string;
	};
	tenant?: {
		id?: string;
	};
	user?: {
		id?: string;
		userId?: string;
		tenantId?: string;
		organizationId?: string;
		departmentId?: string;
	};
}

/**
 * HTTP响应对象类型定义
 */
interface HttpResponse {
	statusCode?: number;
}

/**
 * WebSocket客户端类型定义
 */
interface WebSocketClient {
	id?: string;
	socket?: {
		id?: string;
	};
	handshake?: {
		query?: Record<string, string>;
	};
	tenant?: {
		id?: string;
	};
	user?: {
		id?: string;
	};
}

/**
 * 异常上下文管理器
 */
@Injectable()
export class ExceptionContextManager {
	/**
	 * 从ArgumentsHost中提取异常上下文
	 *
	 * @param host - NestJS执行上下文
	 * @returns 异常上下文对象
	 */
	async extractContext(host: ArgumentsHost): Promise<IExceptionContext> {
		const contextId = uuidv4();
		const occurredAt = new Date();

		const baseContext: IExceptionContext = {
			id: contextId,
			occurredAt
		};

		try {
			// 根据上下文类型提取特定信息
			const contextType = host.getType();

			switch (contextType) {
				case 'http':
					return this.extractHttpContext(host, baseContext);
				case 'ws':
					return this.extractWebSocketContext(host, baseContext);
				case 'rpc':
					return this.extractRpcContext(host, baseContext);
				default:
					return this.extractGenericContext(host, baseContext);
			}
		} catch (error) {
			// 如果提取失败，返回基础上下文
			return {
				...baseContext,
				customData: {
					extractionError: error instanceof Error ? error.message : String(error)
				}
			};
		}
	}

	/**
	 * 提取HTTP上下文信息
	 *
	 * @param host - HTTP执行上下文
	 * @param baseContext - 基础上下文
	 * @returns 完整的异常上下文
	 */
	private extractHttpContext(host: ArgumentsHost, baseContext: IExceptionContext): IExceptionContext {
		const ctx = host.switchToHttp();
		const request = ctx.getRequest() as HttpRequest;
		const response = ctx.getResponse() as HttpResponse;

		return {
			...baseContext,
			requestId: this.extractRequestId(request),
			correlationId: this.extractCorrelationId(request),
			userAgent: this.extractUserAgent(request),
			ipAddress: this.extractIpAddress(request),
			source: 'WEB',
			tenantId: this.extractTenantId(request),
			userId: this.extractUserId(request),
			organizationId: this.extractOrganizationId(request),
			departmentId: this.extractDepartmentId(request),
			customData: {
				method: request.method,
				url: request.url,
				headers: request.headers,
				query: request.query,
				params: request.params,
				body: this.sanitizeRequestBody(request.body),
				responseStatus: response?.statusCode
			}
		};
	}

	/**
	 * 提取WebSocket上下文信息
	 *
	 * @param host - WebSocket执行上下文
	 * @param baseContext - 基础上下文
	 * @returns 完整的异常上下文
	 */
	private extractWebSocketContext(host: ArgumentsHost, baseContext: IExceptionContext): IExceptionContext {
		const ctx = host.switchToWs();
		const client = ctx.getClient() as WebSocketClient;
		const data = ctx.getData();

		return {
			...baseContext,
			source: 'WEB',
			tenantId: this.extractTenantIdFromWebSocket(client),
			userId: this.extractUserIdFromWebSocket(client),
			customData: {
				event: ctx.getPattern(),
				data: data,
				clientId: client?.id,
				socketId: client?.socket?.id
			}
		};
	}

	/**
	 * 提取RPC上下文信息
	 *
	 * @param host - RPC执行上下文
	 * @param baseContext - 基础上下文
	 * @returns 完整的异常上下文
	 */
	private extractRpcContext(host: ArgumentsHost, baseContext: IExceptionContext): IExceptionContext {
		const ctx = host.switchToRpc();
		const data = ctx.getData();

		return {
			...baseContext,
			source: 'SYSTEM',
			customData: {
				pattern: ctx.getContext()?.getPattern?.(),
				data: data,
				context: ctx.getContext()
			}
		};
	}

	/**
	 * 提取通用上下文信息
	 *
	 * @param host - 通用执行上下文
	 * @param baseContext - 基础上下文
	 * @returns 完整的异常上下文
	 */
	private extractGenericContext(host: ArgumentsHost, baseContext: IExceptionContext): IExceptionContext {
		return {
			...baseContext,
			source: 'SYSTEM',
			customData: {
				contextType: host.getType(),
				args: host.getArgs()
			}
		};
	}

	/**
	 * 提取请求ID
	 */
	private extractRequestId(request: HttpRequest): string | undefined {
		return (
			request.id ||
			request.headers?.['x-request-id'] ||
			request.headers?.['x-correlation-id'] ||
			request.headers?.['x-trace-id']
		);
	}

	/**
	 * 提取关联ID
	 */
	private extractCorrelationId(request: HttpRequest): string | undefined {
		return request.headers?.['x-correlation-id'];
	}

	/**
	 * 提取用户代理
	 */
	private extractUserAgent(request: HttpRequest): string | undefined {
		return request.headers?.['user-agent'];
	}

	/**
	 * 提取IP地址
	 */
	private extractIpAddress(request: HttpRequest): string | undefined {
		return (
			request.ip ||
			request.connection?.remoteAddress ||
			request.socket?.remoteAddress ||
			request.headers?.['x-forwarded-for'] ||
			request.headers?.['x-real-ip']
		);
	}

	/**
	 * 提取租户ID
	 */
	private extractTenantId(request: HttpRequest): string | undefined {
		return request.tenant?.id || request.headers?.['x-tenant-id'] || request.user?.tenantId;
	}

	/**
	 * 提取用户ID
	 */
	private extractUserId(request: HttpRequest): string | undefined {
		return request.user?.id || request.user?.userId || request.headers?.['x-user-id'];
	}

	/**
	 * 提取组织ID
	 */
	private extractOrganizationId(request: HttpRequest): string | undefined {
		return request.user?.organizationId || request.headers?.['x-organization-id'];
	}

	/**
	 * 提取部门ID
	 */
	private extractDepartmentId(request: HttpRequest): string | undefined {
		return request.user?.departmentId || request.headers?.['x-department-id'];
	}

	/**
	 * 从WebSocket客户端提取租户ID
	 */
	private extractTenantIdFromWebSocket(client: WebSocketClient): string | undefined {
		return client?.handshake?.query?.tenantId || client?.tenant?.id;
	}

	/**
	 * 从WebSocket客户端提取用户ID
	 */
	private extractUserIdFromWebSocket(client: WebSocketClient): string | undefined {
		return client?.handshake?.query?.userId || client?.user?.id;
	}

	/**
	 * 清理请求体中的敏感信息
	 */
	private sanitizeRequestBody(body: unknown): unknown {
		if (!body || typeof body !== 'object') {
			return body;
		}

		const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
		const sanitized = { ...(body as Record<string, unknown>) };

		for (const field of sensitiveFields) {
			if (field in sanitized) {
				sanitized[field] = '[REDACTED]';
			}
		}

		return sanitized;
	}

	/**
	 * 构建自定义异常上下文
	 *
	 * @param baseContext - 基础上下文
	 * @param customData - 自定义数据
	 * @returns 完整的异常上下文
	 */
	buildCustomContext(baseContext: Partial<IExceptionContext>, customData?: Record<string, unknown>): IExceptionContext {
		return {
			id: baseContext.id || uuidv4(),
			occurredAt: baseContext.occurredAt || new Date(),
			tenantId: baseContext.tenantId,
			userId: baseContext.userId,
			organizationId: baseContext.organizationId,
			departmentId: baseContext.departmentId,
			requestId: baseContext.requestId,
			correlationId: baseContext.correlationId,
			userAgent: baseContext.userAgent,
			ipAddress: baseContext.ipAddress,
			source: baseContext.source || 'SYSTEM',
			customData: {
				...baseContext.customData,
				...customData
			}
		};
	}
}
