/**
 * 租户上下文类型定义
 *
 * @description 数据库模块使用的租户上下文类型定义
 * 基于Core模块的权威租户上下文定义，避免重复实现
 *
 * ## 设计原则
 *
 * ### 类型统一原则
 * - 使用Core模块的ITenantContextData作为权威定义
 * - 避免在Database模块中重复定义租户上下文
 * - 保持类型系统的一致性和可维护性
 *
 * ### 依赖方向原则
 * - Database模块依赖Core模块的类型定义
 * - 符合Clean Architecture的依赖倒置原则
 * - 确保模块边界的清晰性
 *
 * @example
 * ```typescript
 * import type { TenantContext } from './tenant-context.interface';
 *
 * // 在数据库操作中使用租户上下文
 * async function queryUsersByTenant(
 *   tenantContext: TenantContext
 * ): Promise<User[]> {
 *   return databaseService.queryByTenant(
 *     'SELECT * FROM users WHERE tenant_id = ?',
 *     [tenantContext.tenantId]
 *   );
 * }
 * ```
 *
 * @since 1.0.0
 */

// 导入Core模块的权威租户上下文定义
import type { TenantContext as CoreTenantContext } from '@aiofix/core';

/**
 * 租户上下文类型别名
 *
 * @description 数据库模块使用的租户上下文类型
 * 直接引用Core模块的TenantContext，确保类型一致性
 *
 * ## 包含的信息
 * - **tenantId**: 租户唯一标识符
 * - **tenantCode**: 租户代码（可选）
 * - **organizationId**: 组织ID（可选）
 * - **userId**: 用户ID（可选）
 * - **metadata**: 扩展元数据（可选）
 * - **其他扩展属性**: 支持动态扩展
 *
 * @since 1.0.0
 */
export type TenantContext = CoreTenantContext;
