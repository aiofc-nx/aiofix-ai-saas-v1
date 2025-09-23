/**
 * 领域服务接口
 *
 * 定义领域服务的基础契约，领域服务用于实现跨聚合根的业务逻辑，
 * 或者那些不自然地属于任何特定实体或值对象的业务逻辑。
 *
 * @description 领域服务接口定义了领域服务必须实现的基础能力
 *
 * ## 业务规则
 *
 * ### 领域服务职责规则
 * - 领域服务包含不属于任何特定实体的业务逻辑
 * - 领域服务协调多个聚合根之间的交互
 * - 领域服务实现复杂的业务计算和验证
 * - 领域服务不应该包含基础设施相关的逻辑
 *
 * ### 领域服务状态规则
 * - 领域服务应该是无状态的
 * - 领域服务不应该持有业务数据
 * - 领域服务的所有依赖都应该通过构造函数注入
 * - 领域服务的方法应该是纯函数或明确的副作用
 *
 * ### 领域服务依赖规则
 * - 领域服务可以依赖其他领域服务
 * - 领域服务可以依赖仓储接口
 * - 领域服务不应该依赖应用服务或基础设施服务
 * - 领域服务的依赖应该通过接口定义
 *
 * ### 领域服务命名规则
 * - 领域服务名称应该反映其业务意图
 * - 领域服务名称通常以Service结尾
 * - 领域服务方法名称应该是动词或动词短语
 * - 领域服务应该位于相关的业务领域模块中
 *
 * @example
 * ```typescript
 * export class UserValidationService implements IDomainService {
 *   constructor(
 *     private readonly userRepository: IUserRepository
 *   ) {}
 *
 *   async isEmailUnique(email: string): Promise<boolean> {
 *     const existingUser = await this.userRepository.findByEmail(email);
 *     return existingUser === null;
 *   }
 *
 *   validatePasswordStrength(password: string): boolean {
 *     // 密码强度验证逻辑
 *     return password.length >= 8 && /[A-Z]/.test(password);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

/**
 * 领域服务接口
 *
 * 定义领域服务必须实现的基础能力
 */
export interface IDomainService {
  /**
   * 获取服务名称
   *
   * @description 返回服务的唯一标识名称，用于：
   * - 服务注册和发现
   * - 日志记录和调试
   * - 性能监控
   * - 依赖关系追踪
   *
   * @returns 服务名称
   *
   * @example
   * ```typescript
   * getServiceName(): string {
   *   return 'UserValidationService';
   * }
   * ```
   */
  getServiceName(): string;

  /**
   * 获取服务版本
   *
   * @description 返回服务的版本号，用于：
   * - 版本兼容性管理
   * - 服务演进追踪
   * - 问题定位和调试
   *
   * @returns 服务版本号
   * @default '1.0.0'
   *
   * @example
   * ```typescript
   * getServiceVersion(): string {
   *   return '2.1.0';
   * }
   * ```
   */
  getServiceVersion?(): string;

  /**
   * 获取服务描述
   *
   * @description 返回服务的业务描述，用于：
   * - 文档生成
   * - 开发工具提示
   * - 业务理解
   *
   * @returns 服务描述
   *
   * @example
   * ```typescript
   * getServiceDescription(): string {
   *   return '用户验证服务，提供用户数据验证和唯一性检查';
   * }
   * ```
   */
  getServiceDescription?(): string;
}

/**
 * 领域服务工厂接口
 *
 * 定义创建领域服务的工厂方法
 */
export interface IDomainServiceFactory<T extends IDomainService> {
  /**
   * 创建服务实例
   *
   * @param dependencies - 服务依赖
   * @returns 服务实例
   */
  create(dependencies?: Record<string, unknown>): T;

  /**
   * 获取服务类型
   *
   * @returns 服务类型标识
   */
  getServiceType(): string;
}

/**
 * 领域服务注册表接口
 *
 * 定义领域服务注册和发现的契约
 */
export interface IDomainServiceRegistry {
  /**
   * 注册领域服务
   *
   * @param serviceName - 服务名称
   * @param serviceFactory - 服务工厂
   */
  register<T extends IDomainService>(
    serviceName: string,
    serviceFactory: IDomainServiceFactory<T>,
  ): void;

  /**
   * 获取领域服务
   *
   * @param serviceName - 服务名称
   * @returns 服务实例
   */
  get<T extends IDomainService>(serviceName: string): T | undefined;

  /**
   * 检查服务是否已注册
   *
   * @param serviceName - 服务名称
   * @returns 如果已注册返回true，否则返回false
   */
  has(serviceName: string): boolean;

  /**
   * 获取所有已注册的服务名称
   *
   * @returns 服务名称数组
   */
  getRegisteredServices(): string[];
}

/**
 * 领域服务上下文接口
 *
 * 定义领域服务执行上下文
 */
export interface IDomainServiceContext {
  /**
   * 用户上下文
   */
  user?: {
    id: string;
    name?: string;
    roles?: string[];
  };

  /**
   * 租户上下文
   */
  tenant?: {
    id: string;
    name?: string;
  };

  /**
   * 请求上下文
   */
  request?: {
    id: string;
    timestamp: Date;
    source?: string;
  };

  /**
   * 自定义上下文
   */
  custom?: Record<string, unknown>;
}

/**
 * 基础领域服务抽象类
 *
 * 提供领域服务的基础实现
 */
export abstract class BaseDomainService implements IDomainService {
  protected readonly serviceName: string;
  protected readonly serviceVersion: string;
  protected readonly serviceDescription: string;

  constructor(
    serviceName: string,
    serviceVersion: string = '1.0.0',
    serviceDescription: string = '',
  ) {
    this.serviceName = serviceName;
    this.serviceVersion = serviceVersion;
    this.serviceDescription = serviceDescription;
  }

  /**
   * 获取服务名称
   */
  getServiceName(): string {
    return this.serviceName;
  }

  /**
   * 获取服务版本
   */
  getServiceVersion(): string {
    return this.serviceVersion;
  }

  /**
   * 获取服务描述
   */
  getServiceDescription(): string {
    return this.serviceDescription;
  }

  /**
   * 创建服务上下文
   *
   * @param context - 上下文数据
   * @returns 服务上下文
   */
  protected createContext(
    context: Partial<IDomainServiceContext> = {},
  ): IDomainServiceContext {
    return {
      request: {
        id: this.generateRequestId(),
        timestamp: new Date(),
        ...context.request,
      },
      ...context,
    };
  }

  /**
   * 生成请求ID
   *
   * @returns 唯一的请求ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 验证服务前置条件
   *
   * @param condition - 条件表达式
   * @param message - 错误消息
   * @throws {Error} 当条件不满足时
   */
  protected validatePrecondition(condition: boolean, message: string): void {
    if (!condition) {
      throw new Error(`[${this.serviceName}] 前置条件验证失败: ${message}`);
    }
  }

  /**
   * 验证服务后置条件
   *
   * @param condition - 条件表达式
   * @param message - 错误消息
   * @throws {Error} 当条件不满足时
   */
  protected validatePostcondition(condition: boolean, message: string): void {
    if (!condition) {
      throw new Error(`[${this.serviceName}] 后置条件验证失败: ${message}`);
    }
  }

  /**
   * 记录服务日志
   *
   * @param level - 日志级别
   * @param message - 日志消息
   * @param data - 附加数据
   */
  protected log(
    _level: 'debug' | 'info' | 'warn' | 'error',
    _message: string,
    _data?: unknown,
  ): void {
    // 这里可以集成实际的日志服务
    // const logMessage = `[${this.serviceName}] ${message}`;
    // TODO: 集成实际的日志服务
    // if (data) {
    //   console[level](logMessage, data);
    // } else {
    //   console[level](logMessage);
    // }
  }
}
