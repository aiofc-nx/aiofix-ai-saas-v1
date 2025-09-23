/**
 * 异步上下文提供者实现
 *
 * 提供了多种异步上下文提供者，用于从不同的请求源中提取上下文信息。
 * 包括 HTTP 请求、GraphQL 请求、WebSocket 连接、CLI 命令等。
 *
 * @description 异步上下文提供者实现
 * @since 1.0.0
 */
import { Injectable, Inject } from '@nestjs/common';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import type { IUniversalRequest } from '../types/request-types';
import { getHeaderValue, getRequestProperty, getNestedProperty } from '../types/request-types';
import { IAsyncContextProvider, IContextData } from './async-context.interface';

/**
 * HTTP 请求上下文提供者
 */
@Injectable()
export class HttpRequestContextProvider implements IAsyncContextProvider {
	public readonly name = 'HttpRequestContextProvider';
	public readonly priority = 100;

	constructor(@Inject('ILoggerService') private readonly logger: ILoggerService) {}

	/**
	 * 从请求中提取上下文数据
	 */
	public extractContextData(request: IUniversalRequest): Partial<IContextData> {
		const data: Partial<IContextData> = {};

		// 从请求头中提取信息
		data.tenantId = getHeaderValue(request, 'x-tenant-id');
		data.userId = getHeaderValue(request, 'x-user-id');
		data.organizationId = getHeaderValue(request, 'x-organization-id');
		data.departmentId = getHeaderValue(request, 'x-department-id');
		data.requestId = getHeaderValue(request, 'x-request-id');
		data.correlationId = getHeaderValue(request, 'x-correlation-id');
		data.causationId = getHeaderValue(request, 'x-causation-id');
		data.userAgent = getHeaderValue(request, 'user-agent');
		data.locale = getHeaderValue(request, 'accept-language');
		data.timezone = getHeaderValue(request, 'x-timezone');

		// 从请求对象中提取信息
		data.ipAddress =
			getRequestProperty<string>(request, 'ip') || getNestedProperty<string>(request, 'connection.remoteAddress');

		// 设置请求来源
		data.source = 'WEB';

		this.logger.debug(`Extracted HTTP context data: ${JSON.stringify(data)}`, LogContext.HTTP_REQUEST, { data });
		return data;
	}

	/**
	 * 检查是否支持此请求
	 */
	public supports(request: IUniversalRequest): boolean {
		return !!(request && (request.headers || getRequestProperty<string>(request, 'ip') || request.connection));
	}
}

/**
 * GraphQL 请求上下文提供者
 */
@Injectable()
export class GraphQLRequestContextProvider implements IAsyncContextProvider {
	public readonly name = 'GraphQLRequestContextProvider';
	public readonly priority = 90;

	constructor(@Inject('ILoggerService') private readonly logger: ILoggerService) {}

	/**
	 * 从请求中提取上下文数据
	 */
	public extractContextData(request: IUniversalRequest): Partial<IContextData> {
		const data: Partial<IContextData> = {};

		// 从 GraphQL 上下文中提取信息
		if (request.context) {
			data.tenantId = getNestedProperty<string>(request, 'context.tenantId');
			data.userId = getNestedProperty<string>(request, 'context.userId');
			data.organizationId = getNestedProperty<string>(request, 'context.organizationId');
			data.departmentId = getNestedProperty<string>(request, 'context.departmentId');
			data.requestId = getNestedProperty<string>(request, 'context.requestId');
			data.correlationId = getNestedProperty<string>(request, 'context.correlationId');
			data.causationId = getNestedProperty<string>(request, 'context.causationId');
			data.userAgent = getNestedProperty<string>(request, 'context.userAgent');
			data.ipAddress = getNestedProperty<string>(request, 'context.ipAddress');
			data.locale = getNestedProperty<string>(request, 'context.locale');
			data.timezone = getNestedProperty<string>(request, 'context.timezone');
		}

		// 从请求头中提取信息（GraphQL 通常也使用 HTTP 头）
		if (!data.tenantId) {
			data.tenantId = getHeaderValue(request, 'x-tenant-id');
		}
		if (!data.userId) {
			data.userId = getHeaderValue(request, 'x-user-id');
		}
		if (!data.requestId) {
			data.requestId = getHeaderValue(request, 'x-request-id');
		}

		// 设置请求来源
		data.source = 'API';

		this.logger.debug(`Extracted GraphQL context data: ${JSON.stringify(data)}`, LogContext.HTTP_REQUEST, { data });
		return data;
	}

	/**
	 * 检查是否支持此请求
	 */
	public supports(request: IUniversalRequest): boolean {
		return !!(
			request &&
			(request.context || request.headers) &&
			(getRequestProperty<unknown>(request, 'query') || request.mutation || request.subscription)
		);
	}
}

/**
 * WebSocket 连接上下文提供者
 */
@Injectable()
export class WebSocketContextProvider implements IAsyncContextProvider {
	public readonly name = 'WebSocketContextProvider';
	public readonly priority = 80;

	constructor(@Inject('ILoggerService') private readonly logger: ILoggerService) {}

	/**
	 * 从请求中提取上下文数据
	 */
	public extractContextData(request: IUniversalRequest): Partial<IContextData> {
		const data: Partial<IContextData> = {};

		// 从 WebSocket 连接中提取信息
		if (request.connection) {
			data.tenantId = getNestedProperty<string>(request, 'connection.tenantId');
			data.userId = getNestedProperty<string>(request, 'connection.userId');
			data.organizationId = getNestedProperty<string>(request, 'connection.organizationId');
			data.departmentId = getNestedProperty<string>(request, 'connection.departmentId');
			data.requestId = getNestedProperty<string>(request, 'connection.requestId');
			data.correlationId = getNestedProperty<string>(request, 'connection.correlationId');
			data.userAgent = getNestedProperty<string>(request, 'connection.userAgent');
			data.ipAddress = getNestedProperty<string>(request, 'connection.ipAddress');
		}

		// 从握手信息中提取
		if (request.handshake) {
			if (!data.tenantId) {
				const tenantId = getNestedProperty<string>(request, 'handshake.headers.x-tenant-id');
				if (tenantId) {
					data.tenantId = Array.isArray(tenantId) ? tenantId[0] : tenantId;
				}
			}
			if (!data.userId) {
				const userId = getNestedProperty<string>(request, 'handshake.headers.x-user-id');
				if (userId) {
					data.userId = Array.isArray(userId) ? userId[0] : userId;
				}
			}
			if (!data.userAgent) {
				const userAgent = getNestedProperty<string>(request, 'handshake.headers.user-agent');
				if (userAgent) {
					data.userAgent = Array.isArray(userAgent) ? userAgent[0] : userAgent;
				}
			}
			if (!data.ipAddress) {
				data.ipAddress = getNestedProperty<string>(request, 'handshake.address');
			}
		}

		// 设置请求来源
		data.source = 'WEB';

		this.logger.debug(`Extracted WebSocket context data: ${JSON.stringify(data)}`, LogContext.HTTP_REQUEST, { data });
		return data;
	}

	/**
	 * 检查是否支持此请求
	 */
	public supports(request: IUniversalRequest): boolean {
		return !!(request && (request.connection || request.handshake) && request.type === 'websocket');
	}
}

/**
 * CLI 命令上下文提供者
 */
@Injectable()
export class CliCommandContextProvider implements IAsyncContextProvider {
	public readonly name = 'CliCommandContextProvider';
	public readonly priority = 70;

	constructor(@Inject('ILoggerService') private readonly logger: ILoggerService) {}

	/**
	 * 从请求中提取上下文数据
	 */
	public extractContextData(request: IUniversalRequest): Partial<IContextData> {
		const data: Partial<IContextData> = {};

		// 从 CLI 命令中提取信息
		if (request.command) {
			data.tenantId = getNestedProperty<string>(request, 'command.tenantId');
			data.userId = getNestedProperty<string>(request, 'command.userId');
			data.organizationId = getNestedProperty<string>(request, 'command.organizationId');
			data.departmentId = getNestedProperty<string>(request, 'command.departmentId');
			data.requestId = getNestedProperty<string>(request, 'command.requestId');
			data.correlationId = getNestedProperty<string>(request, 'command.correlationId');
		}

		// 从环境变量中提取信息（仅作为后备）
		if (!data.tenantId && process.env.TENANT_ID) {
			data.tenantId = process.env.TENANT_ID;
		}

		if (!data.userId && process.env.USER_ID) {
			data.userId = process.env.USER_ID;
		}

		if (!data.organizationId && process.env.ORGANIZATION_ID) {
			data.organizationId = process.env.ORGANIZATION_ID;
		}

		if (!data.departmentId && process.env.DEPARTMENT_ID) {
			data.departmentId = process.env.DEPARTMENT_ID;
		}

		if (!data.requestId && process.env.REQUEST_ID) {
			data.requestId = process.env.REQUEST_ID;
		}

		if (!data.correlationId && process.env.CORRELATION_ID) {
			data.correlationId = process.env.CORRELATION_ID;
		}

		// 设置请求来源
		data.source = 'CLI';

		this.logger.debug(`Extracted CLI context data: ${JSON.stringify(data)}`, LogContext.SYSTEM, { data });
		return data;
	}

	/**
	 * 检查是否支持此请求
	 */
	public supports(request: IUniversalRequest): boolean {
		return !!(
			request &&
			(request.command || process.env.TENANT_ID || process.env.USER_ID) &&
			process.env.NODE_ENV !== 'production'
		);
	}
}

/**
 * 系统任务上下文提供者
 */
@Injectable()
export class SystemTaskContextProvider implements IAsyncContextProvider {
	public readonly name = 'SystemTaskContextProvider';
	public readonly priority = 60;

	constructor(@Inject('ILoggerService') private readonly logger: ILoggerService) {}

	/**
	 * 从请求中提取上下文数据
	 */
	public extractContextData(request: IUniversalRequest): Partial<IContextData> {
		const data: Partial<IContextData> = {};

		// 从系统任务中提取信息
		if (request.task) {
			data.tenantId = getNestedProperty<string>(request, 'task.tenantId');
			data.userId = getNestedProperty<string>(request, 'task.userId');
			data.organizationId = getNestedProperty<string>(request, 'task.organizationId');
			data.departmentId = getNestedProperty<string>(request, 'task.departmentId');
			data.requestId = getNestedProperty<string>(request, 'task.requestId');
			data.correlationId = getNestedProperty<string>(request, 'task.correlationId');
			data.causationId = getNestedProperty<string>(request, 'task.causationId');
		}

		// 从环境变量中提取信息（仅作为后备）
		if (!data.tenantId && process.env.SYSTEM_TENANT_ID) {
			data.tenantId = process.env.SYSTEM_TENANT_ID;
		}

		if (!data.userId && process.env.SYSTEM_USER_ID) {
			data.userId = process.env.SYSTEM_USER_ID;
		}

		// 设置请求来源
		data.source = 'SYSTEM';

		this.logger.debug(`Extracted system task context data: ${JSON.stringify(data)}`, LogContext.SYSTEM, { data });
		return data;
	}

	/**
	 * 检查是否支持此请求
	 */
	public supports(request: IUniversalRequest): boolean {
		return !!(request && (request.task || process.env.SYSTEM_TENANT_ID || process.env.SYSTEM_USER_ID));
	}
}

/**
 * 上下文提供者管理器
 */
@Injectable()
export class AsyncContextProviderManager {
	private readonly providers: IAsyncContextProvider[] = [];

	constructor(@Inject('ILoggerService') private readonly logger: ILoggerService) {}

	/**
	 * 添加提供者
	 */
	public addProvider(provider: IAsyncContextProvider): void {
		this.providers.push(provider);
		// 按优先级排序
		this.providers.sort((a, b) => b.priority - a.priority);
		this.logger.debug(`Added context provider: ${provider.name}`, LogContext.SYSTEM, { providerName: provider.name });
	}

	/**
	 * 移除提供者
	 */
	public removeProvider(name: string): boolean {
		const index = this.providers.findIndex((p) => p.name === name);
		if (index !== -1) {
			this.providers.splice(index, 1);
			this.logger.debug(`Removed context provider: ${name}`, LogContext.SYSTEM, { providerName: name });
			return true;
		}
		return false;
	}

	/**
	 * 获取所有提供者
	 */
	public getProviders(): IAsyncContextProvider[] {
		return [...this.providers];
	}

	/**
	 * 从请求中提取上下文数据
	 */
	public extractContextData(request: IUniversalRequest): Partial<IContextData> {
		const data: Partial<IContextData> = {};

		// 找到支持此请求的提供者
		const applicableProviders = this.providers.filter((provider) => provider.supports(request));

		this.logger.debug(`Found ${applicableProviders.length} applicable providers for request`, LogContext.SYSTEM, {
			providerCount: applicableProviders.length
		});

		// 按优先级顺序提取数据
		for (const provider of applicableProviders) {
			try {
				const providerData = provider.extractContextData(request);
				Object.assign(data, providerData);
				this.logger.debug(`Extracted data from ${provider.name}: ${JSON.stringify(providerData)}`, LogContext.SYSTEM, {
					providerName: provider.name,
					providerData
				});
			} catch (error) {
				this.logger.warn(
					`Failed to extract data from ${provider.name}: ${(error as Error).message}`,
					LogContext.SYSTEM,
					{ providerName: provider.name, error: (error as Error).message }
				);
			}
		}

		this.logger.debug(`Final extracted context data: ${JSON.stringify(data)}`, LogContext.SYSTEM, { data });
		return data;
	}

	/**
	 * 清除所有提供者
	 */
	public clear(): void {
		this.providers.length = 0;
		this.logger.debug('Cleared all context providers', LogContext.SYSTEM);
	}

	/**
	 * 获取提供者统计信息
	 */
	public getStatistics(): {
		totalProviders: number;
		providerNames: string[];
		priorityRange: { min: number; max: number };
	} {
		const priorities = this.providers.map((p) => p.priority);
		return {
			totalProviders: this.providers.length,
			providerNames: this.providers.map((p) => p.name),
			priorityRange: {
				min: priorities.length > 0 ? Math.min(...priorities) : 0,
				max: priorities.length > 0 ? Math.max(...priorities) : 0
			}
		};
	}
}
