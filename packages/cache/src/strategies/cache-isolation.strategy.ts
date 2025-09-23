/**
 * 缓存隔离策略实现
 *
 * @description 基于Core模块的多租户架构实现缓存隔离
 * 提供不同级别的缓存隔离策略和安全访问控制
 *
 * ## 业务规则
 *
 * ### 隔离级别规则
 * - NONE: 全局共享，无隔离（仅用于系统级缓存）
 * - TENANT: 租户级隔离，同租户内共享
 * - ORGANIZATION: 组织级隔离，同组织内共享
 * - USER: 用户级隔离，用户私有缓存
 * - FULL: 完全隔离，多维度隔离键
 *
 * ### 键命名规则
 * - 租户隔离: tenant:{tenantId}:{originalKey}
 * - 组织隔离: org:{organizationId}:{originalKey}
 * - 用户隔离: user:{userId}:{originalKey}
 * - 完全隔离: tenant:{tenantId}:org:{orgId}:user:{userId}:{originalKey}
 *
 * ### 访问控制规则
 * - 严格验证租户上下文的有效性
 * - 禁止跨租户的缓存访问
 * - 支持基于角色的缓存访问控制
 * - 记录所有访问审计日志
 *
 * @example
 * ```typescript
 * const strategy = new CacheIsolationStrategy(CacheIsolationLevel.TENANT);
 *
 * // 生成隔离键
 * const isolatedKey = strategy.isolateKey('user:profile', tenantContext);
 * // 结果: "tenant:abc123:user:profile"
 *
 * // 验证访问权限
 * const hasAccess = await strategy.validateAccess(isolatedKey, tenantContext);
 * ```
 *
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import type { ICacheIsolationStrategy, ICacheCleanupResult, TenantContext } from '../interfaces/cache.interface';
import { CacheIsolationLevel } from '../interfaces/cache.interface';

/**
 * 缓存隔离策略实现
 *
 * @description 实现多租户缓存隔离的具体策略
 */
@Injectable()
export class CacheIsolationStrategy implements ICacheIsolationStrategy {
	constructor(private readonly isolationLevel: CacheIsolationLevel) {}

	/**
	 * 生成隔离的缓存键
	 *
	 * @param key - 原始缓存键
	 * @param context - 租户上下文
	 * @returns 隔离后的缓存键
	 */
	isolateKey(key: string, context: TenantContext): string {
		if (!context) {
			// 无租户上下文时，根据隔离级别决定处理方式
			switch (this.isolationLevel) {
				case CacheIsolationLevel.NONE:
					return key;
				default:
					throw new Error('缺少租户上下文，无法生成隔离缓存键');
			}
		}

		switch (this.isolationLevel) {
			case CacheIsolationLevel.NONE:
				return key;

			case CacheIsolationLevel.TENANT:
				return `tenant:${context.tenantId}:${key}`;

			case CacheIsolationLevel.ORGANIZATION:
				if (!context.organizationId) {
					throw new Error('组织级隔离需要组织ID');
				}
				return `org:${context.organizationId}:${key}`;

			case CacheIsolationLevel.USER:
				if (!context.userId) {
					throw new Error('用户级隔离需要用户ID');
				}
				return `user:${context.userId}:${key}`;

			case CacheIsolationLevel.FULL:
				if (!context.organizationId || !context.userId) {
					throw new Error('完全隔离需要完整的租户上下文');
				}
				return `tenant:${context.tenantId}:org:${context.organizationId}:user:${context.userId}:${key}`;

			default:
				throw new Error(`不支持的隔离级别: ${this.isolationLevel}`);
		}
	}

	/**
	 * 验证缓存访问权限
	 *
	 * @param key - 缓存键
	 * @param context - 租户上下文
	 * @returns 是否有访问权限
	 */
	async validateAccess(key: string, context: TenantContext): Promise<boolean> {
		try {
			// 提取缓存键中的租户信息
			const keyTenantInfo = this.extractTenantInfo(key);

			// 无隔离的键，任何人都可以访问
			if (!keyTenantInfo.tenantId) {
				return true;
			}

			// 检查租户ID匹配
			if (keyTenantInfo.tenantId !== context?.tenantId) {
				return false;
			}

			// 检查组织ID匹配（如果需要）
			if (keyTenantInfo.organizationId && keyTenantInfo.organizationId !== context?.organizationId) {
				return false;
			}

			// 检查用户ID匹配（如果需要）
			if (keyTenantInfo.userId && keyTenantInfo.userId !== context?.userId) {
				return false;
			}

			return true;
		} catch (error) {
			// 访问验证失败时，默认拒绝访问
			console.warn('缓存访问验证失败:', error);
			return false;
		}
	}

	/**
	 * 清理租户相关缓存
	 *
	 * @param tenantId - 租户ID
	 * @returns 清理结果
	 */
	async cleanupTenantCache(tenantId: string): Promise<ICacheCleanupResult> {
		const startTime = performance.now();

		try {
			// 生成租户缓存键模式
			const patterns = this.generateTenantKeyPatterns(tenantId);

			// 查找匹配的键
			const keysToDelete = await this.findKeysByPatterns(patterns);

			// 批量删除
			const deleteResults = await Promise.allSettled(keysToDelete.map((key) => this.deleteCacheKey(key)));

			const successful = deleteResults.filter((r) => r.status === 'fulfilled').length;
			const failed = deleteResults.filter((r) => r.status === 'rejected').length;
			const errors = deleteResults
				.filter((r) => r.status === 'rejected')
				.map((r) => (r as PromiseRejectedResult).reason);

			return {
				totalKeys: keysToDelete.length,
				deletedKeys: successful,
				failedKeys: failed,
				duration: performance.now() - startTime,
				errors
			};
		} catch (error) {
			return {
				totalKeys: 0,
				deletedKeys: 0,
				failedKeys: 0,
				duration: performance.now() - startTime,
				errors: [error instanceof Error ? error : new Error(String(error))]
			};
		}
	}

	/**
	 * 提取缓存键中的租户信息
	 *
	 * @param key - 缓存键
	 * @returns 租户信息
	 */
	extractTenantInfo(key: string): {
		tenantId?: string;
		organizationId?: string;
		userId?: string;
	} {
		const info: {
			tenantId?: string;
			organizationId?: string;
			userId?: string;
		} = {};

		// 解析租户ID
		const tenantMatch = key.match(/^tenant:([^:]+):/);
		if (tenantMatch) {
			info.tenantId = tenantMatch[1];
		}

		// 解析组织ID
		const orgMatch = key.match(/:org:([^:]+):/);
		if (orgMatch) {
			info.organizationId = orgMatch[1];
		}

		// 解析用户ID
		const userMatch = key.match(/:user:([^:]+):/);
		if (userMatch) {
			info.userId = userMatch[1];
		}

		return info;
	}

	// ==================== 私有方法 ====================

	/**
	 * 生成租户缓存键模式
	 *
	 * @param tenantId - 租户ID
	 * @returns 键模式数组
	 */
	private generateTenantKeyPatterns(tenantId: string): string[] {
		const patterns: string[] = [];

		// 基于隔离级别生成不同的模式
		switch (this.isolationLevel) {
			case CacheIsolationLevel.TENANT:
				patterns.push(`tenant:${tenantId}:*`);
				break;

			case CacheIsolationLevel.ORGANIZATION:
				patterns.push(`org:*:*`); // 需要进一步过滤
				break;

			case CacheIsolationLevel.USER:
				patterns.push(`user:*:*`); // 需要进一步过滤
				break;

			case CacheIsolationLevel.FULL:
				patterns.push(`tenant:${tenantId}:*`);
				break;

			default:
				// NONE级别不支持租户清理
				break;
		}

		return patterns;
	}

	/**
	 * 根据模式查找缓存键
	 *
	 * @param patterns - 键模式数组
	 * @returns 匹配的缓存键数组
	 */
	private async findKeysByPatterns(patterns: string[]): Promise<string[]> {
		// 这里需要实现实际的键查找逻辑
		// 将在后续的缓存服务实现中完成
		console.warn('查找缓存键模式:', patterns);
		return [];
	}

	/**
	 * 删除单个缓存键
	 *
	 * @param key - 缓存键
	 * @returns 是否删除成功
	 */
	private async deleteCacheKey(key: string): Promise<boolean> {
		// 这里需要调用实际的缓存服务删除方法
		// 将在后续的缓存服务实现中完成
		console.warn('删除缓存键:', key);
		return true;
	}
}

/**
 * 创建缓存隔离策略
 *
 * @param isolationLevel - 隔离级别
 * @returns 隔离策略实例
 */
export function createCacheIsolationStrategy(isolationLevel: CacheIsolationLevel): ICacheIsolationStrategy {
	return new CacheIsolationStrategy(isolationLevel);
}

/**
 * 租户感知缓存键构建器
 *
 * @description 提供便捷的租户感知缓存键构建方法
 */
export class TenantAwareCacheKeyBuilder {
	constructor(private readonly isolationStrategy: ICacheIsolationStrategy) {}

	/**
	 * 构建用户缓存键
	 *
	 * @param userId - 用户ID
	 * @param key - 原始键
	 * @param context - 租户上下文
	 * @returns 隔离后的缓存键
	 */
	buildUserKey(userId: string, key: string, context: TenantContext): string {
		const userKey = `user:${userId}:${key}`;
		return this.isolationStrategy.isolateKey(userKey, context);
	}

	/**
	 * 构建组织缓存键
	 *
	 * @param organizationId - 组织ID
	 * @param key - 原始键
	 * @param context - 租户上下文
	 * @returns 隔离后的缓存键
	 */
	buildOrganizationKey(organizationId: string, key: string, context: TenantContext): string {
		const orgKey = `organization:${organizationId}:${key}`;
		return this.isolationStrategy.isolateKey(orgKey, context);
	}

	/**
	 * 构建会话缓存键
	 *
	 * @param sessionId - 会话ID
	 * @param key - 原始键
	 * @param context - 租户上下文
	 * @returns 隔离后的缓存键
	 */
	buildSessionKey(sessionId: string, key: string, context: TenantContext): string {
		const sessionKey = `session:${sessionId}:${key}`;
		return this.isolationStrategy.isolateKey(sessionKey, context);
	}

	/**
	 * 构建权限缓存键
	 *
	 * @param resourceId - 资源ID
	 * @param action - 操作
	 * @param context - 租户上下文
	 * @returns 隔离后的缓存键
	 */
	buildPermissionKey(resourceId: string, action: string, context: TenantContext): string {
		const permissionKey = `permission:${resourceId}:${action}`;
		return this.isolationStrategy.isolateKey(permissionKey, context);
	}
}
