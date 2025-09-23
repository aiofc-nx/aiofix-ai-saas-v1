/**
 * 上下文装饰器
 *
 * 提供请求上下文的自动注入功能，包括租户上下文、用户上下文、请求上下文等。
 * 装饰器支持多租户架构和权限控制的自动化处理。
 *
 * @description 上下文装饰器提供请求上下文的自动注入和管理
 *
 * ## 业务规则
 *
 * ### 租户上下文规则
 * - 每个请求必须包含有效的租户信息
 * - 租户信息可以从Header、Token或路径参数获取
 * - 租户上下文在请求生命周期内保持不变
 * - 支持租户权限的验证和控制
 *
 * ### 用户上下文规则
 * - 用户上下文从认证Token中提取
 * - 包含用户身份、角色、权限等信息
 * - 用户上下文用于权限验证和审计
 * - 支持用户会话的管理和验证
 *
 * ### 请求上下文规则
 * - 记录请求的完整上下文信息
 * - 包含请求ID、时间戳、IP地址等
 * - 用于请求追踪和性能监控
 * - 支持分布式追踪和日志关联
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Post()
 *   async createUser(
 *     @Body() dto: CreateUserDto,
 *     @TenantContext() tenant: ITenantContext,
 *     @UserContext() user: IUserContext,
 *     @RequestContext() request: IRequestContext
 *   ) {
 *     // 自动注入的上下文可以直接使用
 *     return this.userService.createUser(dto, { tenant, user, request });
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 租户上下文接口
 */
export interface ITenantContext {
  /**
   * 租户ID
   */
  tenantId: string;

  /**
   * 租户名称
   */
  tenantName?: string;

  /**
   * 租户类型
   */
  tenantType?: 'enterprise' | 'community' | 'team' | 'personal';

  /**
   * 租户状态
   */
  tenantStatus?: 'active' | 'suspended' | 'inactive';

  /**
   * 租户配置
   */
  tenantConfig?: Record<string, unknown>;
}

/**
 * 用户上下文接口
 */
export interface IUserContext {
  /**
   * 用户ID
   */
  userId: string;

  /**
   * 用户名
   */
  userName?: string;

  /**
   * 用户邮箱
   */
  userEmail?: string;

  /**
   * 用户角色
   */
  userRole?: string;

  /**
   * 用户权限
   */
  permissions?: string[];

  /**
   * 用户状态
   */
  userStatus?: 'active' | 'inactive' | 'locked';

  /**
   * 会话信息
   */
  session?: {
    sessionId: string;
    expiresAt: Date;
    lastActivity: Date;
  };
}

/**
 * 请求上下文接口
 */
export interface IRequestContext {
  /**
   * 请求ID
   */
  requestId: string;

  /**
   * 请求时间戳
   */
  timestamp: Date;

  /**
   * 客户端IP地址
   */
  ipAddress?: string;

  /**
   * 用户代理
   */
  userAgent?: string;

  /**
   * 请求方法
   */
  method?: string;

  /**
   * 请求URL
   */
  url?: string;

  /**
   * 请求头
   */
  headers?: Record<string, string>;

  /**
   * 追踪ID
   */
  traceId?: string;
}

/**
 * 租户上下文装饰器
 *
 * 从请求中提取租户上下文信息
 */
export const TenantContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ITenantContext => {
    const request = ctx.switchToHttp().getRequest();

    // 从多个来源尝试获取租户信息
    const tenantId =
      request.headers['x-tenant-id'] ||
      request.headers['tenant-id'] ||
      request.params?.tenantId ||
      request.query?.tenantId ||
      request.user?.tenantId;

    if (!tenantId) {
      throw new Error('租户信息缺失');
    }

    return {
      tenantId: tenantId as string,
      tenantName: request.headers['x-tenant-name'] as string,
      tenantType: request.headers[
        'x-tenant-type'
      ] as ITenantContext['tenantType'],
      tenantStatus: request.headers[
        'x-tenant-status'
      ] as ITenantContext['tenantStatus'],
      tenantConfig: request.user?.tenantConfig as Record<string, unknown>,
    };
  },
);

/**
 * 用户上下文装饰器
 *
 * 从请求中提取用户上下文信息
 */
export const UserContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): IUserContext => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new Error('用户信息缺失');
    }

    return {
      userId: user.userId || user.id,
      userName: user.userName || user.name,
      userEmail: user.userEmail || user.email,
      userRole: user.userRole || user.role,
      permissions: user.permissions || [],
      userStatus: user.userStatus || user.status,
      session: user.session
        ? {
            sessionId: user.session.sessionId,
            expiresAt: new Date(user.session.expiresAt),
            lastActivity: new Date(user.session.lastActivity),
          }
        : undefined,
    };
  },
);

/**
 * 请求上下文装饰器
 *
 * 从请求中提取请求上下文信息
 */
export const RequestContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): IRequestContext => {
    const request = ctx.switchToHttp().getRequest();

    return {
      requestId: request.headers['x-request-id'] || generateRequestId(),
      timestamp: new Date(),
      ipAddress: request.ip || request.connection?.remoteAddress,
      userAgent: request.headers['user-agent'],
      method: request.method,
      url: request.url,
      headers: request.headers,
      traceId: request.headers['x-trace-id'] as string,
    };
  },
);

/**
 * 完整上下文装饰器
 *
 * 组合租户、用户、请求上下文为完整上下文
 */
export const FullContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    // 提取租户上下文
    const tenantId =
      request.headers['x-tenant-id'] ||
      request.headers['tenant-id'] ||
      request.params?.tenantId ||
      request.query?.tenantId ||
      request.user?.tenantId;

    const tenantContext: ITenantContext | undefined = tenantId
      ? {
          tenantId: tenantId as string,
          tenantName: request.headers['x-tenant-name'] as string,
          tenantType: request.headers[
            'x-tenant-type'
          ] as ITenantContext['tenantType'],
          tenantStatus: request.headers[
            'x-tenant-status'
          ] as ITenantContext['tenantStatus'],
          tenantConfig: request.user?.tenantConfig as Record<string, unknown>,
        }
      : undefined;

    // 提取用户上下文
    const user = request.user;
    const userContext: IUserContext | undefined = user
      ? {
          userId: user.userId || user.id,
          userName: user.userName || user.name,
          userEmail: user.userEmail || user.email,
          userRole: user.userRole || user.role,
          permissions: user.permissions || [],
          userStatus: user.userStatus || user.status,
          session: user.session
            ? {
                sessionId: user.session.sessionId,
                expiresAt: new Date(user.session.expiresAt),
                lastActivity: new Date(user.session.lastActivity),
              }
            : undefined,
        }
      : undefined;

    // 提取请求上下文
    const requestContext: IRequestContext = {
      requestId: request.headers['x-request-id'] || generateRequestId(),
      timestamp: new Date(),
      ipAddress: request.ip || request.connection?.remoteAddress,
      userAgent: request.headers['user-agent'],
      method: request.method,
      url: request.url,
      headers: request.headers,
      traceId: request.headers['x-trace-id'] as string,
    };

    return {
      tenant: tenantContext,
      user: userContext,
      request: requestContext,
    };
  },
);

/**
 * 生成请求ID
 *
 * @returns 请求ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
