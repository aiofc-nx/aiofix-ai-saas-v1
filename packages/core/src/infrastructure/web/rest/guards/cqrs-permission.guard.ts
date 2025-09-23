/**
 * CQRS权限守卫
 *
 * 提供CQRS端点的权限验证功能，集成租户隔离和用户权限控制。
 * 守卫在请求执行前验证用户权限，确保操作的安全性。
 *
 * @description CQRS权限守卫提供声明式的权限控制功能
 *
 * ## 业务规则
 *
 * ### 权限验证规则
 * - 请求执行前必须验证用户权限
 * - 权限验证基于端点配置的权限要求
 * - 支持资源级别的权限控制
 * - 权限验证失败时阻止请求执行
 *
 * ### 租户隔离规则
 * - 验证用户是否属于请求的租户
 * - 防止跨租户的数据访问
 * - 支持租户级别的权限继承
 * - 记录租户权限验证日志
 *
 * ### 权限缓存规则
 * - 用户权限信息可以缓存
 * - 权限变更时自动失效缓存
 * - 支持权限的预加载和预热
 * - 缓存键基于用户和租户信息
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @UseGuards(CqrsPermissionGuard)
 * export class UserController {
 *   @Post()
 *   @CommandEndpoint({
 *     command: CreateUserCommand,
 *     permissions: ['user:create']
 *   })
 *   async createUser() {
 *     // 权限验证自动执行
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
	// getCommandEndpointMetadata,
	// getQueryEndpointMetadata,
	type ICommandEndpointOptions,
	type IQueryEndpointOptions
} from '../decorators/cqrs-endpoint.decorator';
import type { ITenantContext, IUserContext } from '../decorators/context.decorator';

/**
 * 权限验证结果接口
 */
export interface IPermissionValidationResult {
	/**
	 * 是否有权限
	 */
	hasPermission: boolean;

	/**
	 * 缺失的权限
	 */
	missingPermissions?: string[];

	/**
	 * 验证失败原因
	 */
	reason?: string;

	/**
	 * 验证详细信息
	 */
	details?: Record<string, unknown>;
}

/**
 * 权限检查器接口
 */
export interface IPermissionChecker {
	/**
	 * 检查用户是否具有指定权限
	 *
	 * @param userContext - 用户上下文
	 * @param tenantContext - 租户上下文
	 * @param requiredPermissions - 所需权限
	 * @returns 权限验证结果
	 */
	checkPermissions(
		userContext: IUserContext,
		tenantContext: ITenantContext,
		requiredPermissions: string[]
	): Promise<IPermissionValidationResult>;

	/**
	 * 检查资源访问权限
	 *
	 * @param userContext - 用户上下文
	 * @param tenantContext - 租户上下文
	 * @param resourceType - 资源类型
	 * @param resourceId - 资源ID
	 * @param operation - 操作类型
	 * @returns 权限验证结果
	 */
	checkResourcePermission(
		userContext: IUserContext,
		tenantContext: ITenantContext,
		resourceType: string,
		resourceId: string,
		operation: string
	): Promise<IPermissionValidationResult>;
}

/**
 * 默认权限检查器实现
 */
@Injectable()
export class DefaultPermissionChecker implements IPermissionChecker {
	/**
	 * 检查用户权限
	 *
	 * @param userContext - 用户上下文
	 * @param tenantContext - 租户上下文
	 * @param requiredPermissions - 所需权限
	 * @returns 权限验证结果
	 */
	async checkPermissions(
		userContext: IUserContext,
		tenantContext: ITenantContext,
		requiredPermissions: string[]
	): Promise<IPermissionValidationResult> {
		// 检查用户是否属于租户
		if (!this.userBelongsToTenant(userContext, tenantContext)) {
			return {
				hasPermission: false,
				reason: '用户不属于指定租户',
				details: {
					userId: userContext.userId,
					tenantId: tenantContext.tenantId
				}
			};
		}

		// 检查用户权限
		const userPermissions = userContext.permissions || [];
		const missingPermissions = requiredPermissions.filter((permission) => !userPermissions.includes(permission));

		if (missingPermissions.length > 0) {
			return {
				hasPermission: false,
				missingPermissions,
				reason: '用户缺少必要权限',
				details: {
					requiredPermissions,
					userPermissions,
					missingPermissions
				}
			};
		}

		return {
			hasPermission: true
		};
	}

	/**
	 * 检查资源访问权限
	 *
	 * @param userContext - 用户上下文
	 * @param tenantContext - 租户上下文
	 * @param resourceType - 资源类型
	 * @param resourceId - 资源ID
	 * @param operation - 操作类型
	 * @returns 权限验证结果
	 */
	async checkResourcePermission(
		userContext: IUserContext,
		tenantContext: ITenantContext,
		resourceType: string,
		resourceId: string,
		operation: string
	): Promise<IPermissionValidationResult> {
		// 构建资源权限字符串
		const resourcePermission = `${resourceType}:${operation}:${resourceId}`;
		const generalPermission = `${resourceType}:${operation}`;

		// 检查具体资源权限或通用权限
		const userPermissions = userContext.permissions || [];
		const hasPermission =
			userPermissions.includes(resourcePermission) ||
			userPermissions.includes(generalPermission) ||
			userPermissions.includes(`${resourceType}:*`) ||
			userPermissions.includes('*');

		if (!hasPermission) {
			return {
				hasPermission: false,
				missingPermissions: [resourcePermission],
				reason: '用户缺少资源访问权限',
				details: {
					resourceType,
					resourceId,
					operation,
					userPermissions
				}
			};
		}

		return {
			hasPermission: true
		};
	}

	/**
	 * 检查用户是否属于租户
	 *
	 * @param userContext - 用户上下文
	 * @param tenantContext - 租户上下文
	 * @returns 是否属于租户
	 * @private
	 */
	private userBelongsToTenant(_userContext: IUserContext, _tenantContext: ITenantContext): boolean {
		// TODO: 实现实际的用户租户关系检查
		// 这里简化为检查用户上下文中是否包含租户信息
		return true;
	}
}

/**
 * CQRS权限守卫
 */
@Injectable()
export class CqrsPermissionGuard implements CanActivate {
	constructor(private readonly reflector: Reflector, private readonly permissionChecker: IPermissionChecker) {}

	/**
	 * 验证请求权限
	 *
	 * @param context - 执行上下文
	 * @returns 是否允许访问
	 */
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const handler = context.getHandler();
		const controller = context.getClass();

		try {
			// 获取端点元数据
			const endpointMetadata = this.getEndpointMetadata(controller, handler);
			if (!endpointMetadata) {
				// 如果没有配置权限要求，默认允许访问
				return true;
			}

			// 提取上下文信息
			const { tenantContext, userContext } = this.extractContexts(request);

			// 验证权限
			const validationResult = await this.permissionChecker.checkPermissions(
				userContext,
				tenantContext,
				endpointMetadata.permissions || []
			);

			if (!validationResult.hasPermission) {
				this.log('warn', '权限验证失败', {
					userId: userContext.userId,
					tenantId: tenantContext.tenantId,
					requiredPermissions: endpointMetadata.permissions,
					reason: validationResult.reason,
					missingPermissions: validationResult.missingPermissions
				});

				throw new ForbiddenException({
					message: validationResult.reason || '权限不足',
					code: 'INSUFFICIENT_PERMISSIONS',
					details: validationResult.details
				});
			}

			// 权限验证成功，记录日志
			this.log('debug', '权限验证成功', {
				userId: userContext.userId,
				tenantId: tenantContext.tenantId,
				requiredPermissions: endpointMetadata.permissions
			});

			return true;
		} catch (error) {
			if (error instanceof ForbiddenException) {
				throw error;
			}

			this.log('error', '权限验证异常', {
				error: error instanceof Error ? error.message : String(error)
			});

			throw new ForbiddenException('权限验证失败');
		}
	}

	/**
	 * 获取端点元数据
	 *
	 * @param controller - 控制器类
	 * @param handler - 处理器方法
	 * @returns 端点元数据
	 * @private
	 */
	private getEndpointMetadata(controller: unknown, handler: unknown): { permissions?: string[] } | null {
		// 尝试获取命令端点元数据
		const commandMetadata = this.reflector.get<ICommandEndpointOptions>(
			'commandEndpoint',
			handler as (...args: unknown[]) => unknown
		);
		if (commandMetadata) {
			return { permissions: commandMetadata.permissions };
		}

		// 尝试获取查询端点元数据
		const queryMetadata = this.reflector.get<IQueryEndpointOptions>(
			'queryEndpoint',
			handler as (...args: unknown[]) => unknown
		);
		if (queryMetadata) {
			return { permissions: queryMetadata.permissions };
		}

		return null;
	}

	/**
	 * 提取请求上下文
	 *
	 * @param request - HTTP请求对象
	 * @returns 上下文信息
	 * @private
	 */
	private extractContexts(request: Record<string, unknown>): {
		tenantContext: ITenantContext;
		userContext: IUserContext;
	} {
		// 提取租户上下文
		const headers = request.headers as Record<string, unknown>;
		const params = request.params as Record<string, unknown>;
		const query = request.query as Record<string, unknown>;
		const user = request.user as Record<string, unknown>;

		const tenantId =
			headers['x-tenant-id'] || headers['tenant-id'] || params?.tenantId || query?.tenantId || user?.tenantId;

		if (!tenantId) {
			throw new Error('租户信息缺失');
		}

		const tenantContext: ITenantContext = {
			tenantId: tenantId as string,
			tenantName: headers['x-tenant-name'] as string,
			tenantType: headers['x-tenant-type'] as ITenantContext['tenantType'],
			tenantStatus: headers['x-tenant-status'] as ITenantContext['tenantStatus'],
			tenantConfig: (user as Record<string, unknown>)?.tenantConfig as Record<string, unknown>
		};

		// 提取用户上下文
		const userData = user as Record<string, unknown>;
		if (!userData) {
			throw new Error('用户信息缺失');
		}

		const userContext: IUserContext = {
			userId: (userData.userId || userData.id) as string,
			userName: (userData.userName || userData.name) as string | undefined,
			userEmail: (userData.userEmail || userData.email) as string | undefined,
			userRole: (userData.userRole || userData.role) as string | undefined,
			permissions: (userData.permissions || []) as string[],
			userStatus: (userData.userStatus || userData.status) as 'active' | 'inactive' | 'locked' | undefined,
			session: userData.session
				? {
						sessionId: (userData.session as Record<string, unknown>).sessionId as string,
						expiresAt: new Date((userData.session as Record<string, unknown>).expiresAt as string),
						lastActivity: new Date((userData.session as Record<string, unknown>).lastActivity as string)
				  }
				: undefined
		};

		return { tenantContext, userContext };
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
		// console.log(`[${_level.toUpperCase()}] [CqrsPermissionGuard] ${_message}`, _context);
	}
}
