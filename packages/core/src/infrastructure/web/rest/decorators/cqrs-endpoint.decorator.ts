/**
 * CQRS端点装饰器
 *
 * 提供CQRS命令和查询端点的声明式配置，集成权限验证、缓存、监控等功能。
 * 装饰器支持自动API文档生成和运行时元数据管理。
 *
 * @description CQRS端点装饰器提供声明式的API端点配置
 *
 * ## 业务规则
 *
 * ### 端点配置规则
 * - 每个端点必须指定对应的命令或查询类型
 * - 端点配置必须包含权限要求
 * - 支持端点级别的缓存配置
 * - 支持端点级别的性能监控
 *
 * ### 权限验证规则
 * - 端点执行前必须验证用户权限
 * - 支持资源级别的权限控制
 * - 支持动态权限计算
 * - 权限验证失败时返回403错误
 *
 * ### 缓存配置规则
 * - 查询端点支持结果缓存
 * - 缓存键基于请求参数和用户上下文
 * - 支持条件缓存和缓存失效
 * - 命令端点执行后清除相关缓存
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Post()
 *   @CommandEndpoint({
 *     command: CreateUserCommand,
 *     description: '创建用户',
 *     permissions: ['user:create'],
 *     audit: { operation: 'create', resourceType: 'user' }
 *   })
 *   async createUser(@Body() dto: CreateUserDto) {
 *     // 控制器实现
 *   }
 *
 *   @Get()
 *   @QueryEndpoint({
 *     query: GetUsersQuery,
 *     description: '获取用户列表',
 *     permissions: ['user:read'],
 *     cache: { ttl: 300, keyPrefix: 'users' }
 *   })
 *   async getUsers(@Query() dto: GetUsersDto) {
 *     // 控制器实现
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

/**
 * 命令端点配置接口
 */
export interface ICommandEndpointOptions {
  /**
   * 命令类型
   */
  command: new (...args: unknown[]) => unknown;

  /**
   * 端点描述
   */
  description?: string;

  /**
   * 所需权限
   */
  permissions?: string[];

  /**
   * 审计配置
   */
  audit?: {
    operation: string;
    resourceType: string;
    logRequest?: boolean;
    logResponse?: boolean;
  };

  /**
   * 超时配置
   */
  timeout?: {
    execution: number;
    alertOnTimeout?: boolean;
  };

  /**
   * 重试配置
   */
  retry?: {
    maxAttempts: number;
    backoffStrategy: 'fixed' | 'exponential';
    baseDelay: number;
  };

  /**
   * 限流配置
   */
  rateLimit?: {
    requests: number;
    windowMs: number;
    skipSuccessfulRequests?: boolean;
  };

  /**
   * 验证配置
   */
  validation?: {
    skipBusinessRules?: boolean;
    customValidators?: string[];
  };
}

/**
 * 查询端点配置接口
 */
export interface IQueryEndpointOptions {
  /**
   * 查询类型
   */
  query: new (...args: unknown[]) => unknown;

  /**
   * 端点描述
   */
  description?: string;

  /**
   * 所需权限
   */
  permissions?: string[];

  /**
   * 缓存配置
   */
  cache?: {
    ttl: number;
    keyPrefix?: string;
    condition?: (result: unknown) => boolean;
    invalidateOn?: string[];
  };

  /**
   * 分页配置
   */
  pagination?: {
    defaultLimit: number;
    maxLimit: number;
    allowDisable?: boolean;
  };

  /**
   * 排序配置
   */
  sorting?: {
    defaultSort?: string;
    allowedFields?: string[];
  };

  /**
   * 过滤配置
   */
  filtering?: {
    allowedFields?: string[];
    operators?: string[];
  };

  /**
   * 超时配置
   */
  timeout?: {
    execution: number;
    alertOnTimeout?: boolean;
  };
}

/**
 * 命令端点元数据键
 */
export const COMMAND_ENDPOINT_METADATA_KEY = Symbol('commandEndpoint');

/**
 * 查询端点元数据键
 */
export const QUERY_ENDPOINT_METADATA_KEY = Symbol('queryEndpoint');

/**
 * 命令端点装饰器
 *
 * @param options - 命令端点配置
 * @returns 方法装饰器
 */
export function CommandEndpoint(
  options: ICommandEndpointOptions,
): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    // 设置元数据
    Reflect.defineMetadata(
      COMMAND_ENDPOINT_METADATA_KEY,
      options,
      target,
      propertyKey,
    );

    // 设置命令类型属性
    Reflect.defineMetadata(
      'commandType',
      options.command.name,
      target,
      propertyKey,
    );

    return descriptor;
  };
}

/**
 * 查询端点装饰器
 *
 * @param options - 查询端点配置
 * @returns 方法装饰器
 */
export function QueryEndpoint(options: IQueryEndpointOptions): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    // 设置元数据
    Reflect.defineMetadata(
      QUERY_ENDPOINT_METADATA_KEY,
      options,
      target,
      propertyKey,
    );

    // 设置查询类型属性
    Reflect.defineMetadata(
      'queryType',
      options.query.name,
      target,
      propertyKey,
    );

    return descriptor;
  };
}

/**
 * 获取命令端点元数据
 *
 * @param target - 目标对象
 * @param propertyKey - 属性键
 * @returns 命令端点配置
 */
export function getCommandEndpointMetadata(
  target: object,
  propertyKey: string,
): ICommandEndpointOptions | undefined {
  return Reflect.getMetadata(
    COMMAND_ENDPOINT_METADATA_KEY,
    target,
    propertyKey,
  );
}

/**
 * 获取查询端点元数据
 *
 * @param target - 目标对象
 * @param propertyKey - 属性键
 * @returns 查询端点配置
 */
export function getQueryEndpointMetadata(
  target: object,
  propertyKey: string,
): IQueryEndpointOptions | undefined {
  return Reflect.getMetadata(QUERY_ENDPOINT_METADATA_KEY, target, propertyKey);
}

/**
 * 检查是否为命令端点
 *
 * @param target - 目标对象
 * @param propertyKey - 属性键
 * @returns 是否为命令端点
 */
export function isCommandEndpoint(
  target: object,
  propertyKey: string,
): boolean {
  return Reflect.hasMetadata(
    COMMAND_ENDPOINT_METADATA_KEY,
    target,
    propertyKey,
  );
}

/**
 * 检查是否为查询端点
 *
 * @param target - 目标对象
 * @param propertyKey - 属性键
 * @returns 是否为查询端点
 */
export function isQueryEndpoint(target: object, propertyKey: string): boolean {
  return Reflect.hasMetadata(QUERY_ENDPOINT_METADATA_KEY, target, propertyKey);
}
