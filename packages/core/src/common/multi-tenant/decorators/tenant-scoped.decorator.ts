/**
 * 租户作用域装饰器
 *
 * @description 确保方法在租户上下文中执行的装饰器
 * 这是纯技术实现，用于方法级别的租户隔离控制
 *
 * ## 技术规则
 *
 * ### 装饰器应用规则
 * - 自动检查租户上下文的存在性
 * - 在方法执行前验证租户权限
 * - 提供详细的错误信息和调试支持
 * - 支持异步和同步方法
 *
 * ### 性能考虑
 * - 装饰器检查应该快速执行
 * - 避免在装饰器中进行复杂的业务逻辑
 * - 支持缓存和优化机制
 *
 * @example
 * ```typescript
 * class UserService {
 *   @TenantScoped()
 *   async getUsers(): Promise<User[]> {
 *     // 此方法必须在租户上下文中调用
 *     const tenantId = TenantContextManager.getCurrentTenantId();
 *     return this.userRepository.findByTenant(tenantId);
 *   }
 *
 *   @RequireTenant('admin-tenant')
 *   async getSystemStats(): Promise<Stats> {
 *     // 此方法只能在admin-tenant上下文中调用
 *     return this.statsService.getSystemStats();
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { TenantContextManager } from '../context/tenant-context-manager';

/**
 * 租户作用域装饰器
 *
 * @description 确保方法在租户上下文中执行的装饰器
 *
 * @example
 * ```typescript
 * class UserService {
 *   @TenantScoped()
 *   async getUsers(): Promise<User[]> {
 *     // 此方法必须在租户上下文中调用
 *     const tenantId = TenantContextManager.getCurrentTenantId();
 *     return this.userRepository.findByTenant(tenantId);
 *   }
 * }
 * ```
 */
export function TenantScoped() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      // 验证租户上下文存在
      TenantContextManager.requireTenantContext();

      // 执行原始方法
      return originalMethod.apply(this, args);
    };

    // 保留原始方法名称，便于调试
    Object.defineProperty(descriptor.value, 'name', {
      value: `TenantScoped(${originalMethod.name})`,
    });

    return descriptor;
  };
}

/**
 * 要求特定租户装饰器
 *
 * @description 确保方法在指定租户上下文中执行的装饰器
 *
 * @param tenantId 租户ID
 *
 * @example
 * ```typescript
 * class AdminService {
 *   @RequireTenant('admin-tenant')
 *   async getSystemStats(): Promise<Stats> {
 *     // 此方法只能在admin-tenant上下文中调用
 *     return this.statsService.getSystemStats();
 *   }
 * }
 * ```
 */
export function RequireTenant(tenantId: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      // 验证是否在指定租户上下文中
      TenantContextManager.requireTenant(tenantId);

      // 执行原始方法
      return originalMethod.apply(this, args);
    };

    // 保留原始方法名称，便于调试
    Object.defineProperty(descriptor.value, 'name', {
      value: `RequireTenant(${tenantId})(${originalMethod.name})`,
    });

    return descriptor;
  };
}

/**
 * 租户数据隔离装饰器
 *
 * @description 自动为方法应用租户数据隔离的装饰器
 *
 * @param isolationLevel 隔离级别，默认为租户级别
 *
 * @example
 * ```typescript
 * class DataService {
 *   @TenantIsolated('organization')
 *   async getData(): Promise<Data[]> {
 *     // 此方法自动应用组织级别的数据隔离
 *     return this.dataRepository.findAll();
 *   }
 * }
 * ```
 */
export function TenantIsolated(
  isolationLevel:
    | 'tenant'
    | 'organization'
    | 'department'
    | 'personal' = 'tenant',
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      // 获取当前租户上下文
      const context = TenantContextManager.requireTenantContext();

      // 在方法执行前设置隔离级别
      const enhancedContext = {
        ...context,
        isolationLevel,
        metadata: {
          ...context.metadata,
          appliedIsolation: isolationLevel,
          methodName: propertyKey,
        },
      };

      // 在增强的上下文中执行方法
      return TenantContextManager.run(enhancedContext, () => {
        return originalMethod.apply(this, args);
      });
    };

    // 保留原始方法名称，便于调试
    Object.defineProperty(descriptor.value, 'name', {
      value: `TenantIsolated(${isolationLevel})(${originalMethod.name})`,
    });

    return descriptor;
  };
}

/**
 * 租户上下文验证装饰器
 *
 * @description 在方法执行前验证租户上下文有效性的装饰器
 *
 * @example
 * ```typescript
 * class SecurityService {
 *   @ValidateTenantContext()
 *   async performSecureOperation(): Promise<void> {
 *     // 此方法会自动验证租户上下文的有效性
 *     // 包括租户ID格式、状态等
 *   }
 * }
 * ```
 */
export function ValidateTenantContext() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // 验证租户上下文
      const validation = await TenantContextManager.validateContext();
      if (!validation.valid) {
        throw new Error(`租户上下文验证失败: ${validation.errors.join(', ')}`);
      }

      // 执行原始方法
      return originalMethod.apply(this, args);
    };

    // 保留原始方法名称，便于调试
    Object.defineProperty(descriptor.value, 'name', {
      value: `ValidateTenantContext(${originalMethod.name})`,
    });

    return descriptor;
  };
}
