/**
 * 用例接口
 *
 * 定义用例的基础契约，用例是Clean Architecture应用层的核心概念。
 * 用例表达系统能够执行的具体业务操作，是业务需求的直接体现。
 *
 * @description 用例接口定义了所有用例必须实现的基础能力
 *
 * ## 业务规则
 *
 * ### 用例职责规则
 * - 用例表达一个完整的业务操作或流程
 * - 用例协调领域层组件完成业务目标
 * - 用例不包含技术实现细节
 * - 用例只依赖领域层的接口
 *
 * ### 用例输入输出规则
 * - 用例的输入应该是明确的请求对象
 * - 用例的输出应该是明确的响应对象
 * - 输入输出对象应该是简单的数据结构
 * - 避免在接口中暴露领域对象
 *
 * ### 用例执行规则
 * - 用例执行应该是原子性的
 * - 用例应该处理所有业务异常
 * - 用例执行失败时应该提供清晰的错误信息
 * - 用例应该记录执行日志用于审计
 *
 * ### 用例依赖规则
 * - 用例只能依赖领域层的接口
 * - 用例不能直接依赖基础设施层
 * - 用例之间应该避免直接依赖
 * - 用例可以通过事件进行间接通信
 *
 * @example
 * ```typescript
 * export class CreateUserUseCase implements IUseCase<CreateUserRequest, CreateUserResponse> {
 *   constructor(
 *     private readonly userRepository: IUserRepository,
 *     private readonly domainEventBus: IDomainEventBus
 *   ) {}
 *
 *   async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
 *     // 1. 验证输入
 *     this.validateRequest(request);
 *
 *     // 2. 执行业务逻辑
 *     const user = User.create(request.name, request.email);
 *     await this.userRepository.save(user);
 *
 *     // 3. 发布事件
 *     const events = user.getUncommittedEvents();
 *     await this.domainEventBus.publishAll(events);
 *
 *     // 4. 返回结果
 *     return new CreateUserResponse(user.id);
 *   }
 *
 *   getUseCaseName(): string {
 *     return 'CreateUser';
 *   }
 *
 *   getUseCaseDescription(): string {
 *     return '创建新用户，包括验证、持久化和事件发布';
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

/**
 * 用例接口
 *
 * 定义用例必须实现的基础能力
 *
 * @template TRequest - 用例请求类型
 * @template TResponse - 用例响应类型
 */
export interface IUseCase<TRequest, TResponse> {
  /**
   * 执行用例
   *
   * @description 执行具体的业务操作，这是用例的核心方法
   *
   * @param request - 用例请求参数
   * @returns 用例执行结果的Promise
   *
   * @throws {UseCaseValidationError} 当请求参数验证失败时
   * @throws {BusinessRuleViolationError} 当业务规则验证失败时
   * @throws {UseCaseExecutionError} 当用例执行失败时
   *
   * @example
   * ```typescript
   * const request = new CreateUserRequest('张三', 'zhangsan@example.com');
   * const response = await useCase.execute(request);
   * console.log(`用户创建成功，ID: ${response.userId}`);
   * ```
   */
  execute(request: TRequest): Promise<TResponse>;

  /**
   * 获取用例名称
   *
   * @description 返回用例的唯一标识名称，用于：
   * - 用例注册和发现
   * - 日志记录和调试
   * - 性能监控和指标收集
   * - 权限控制和访问控制
   *
   * @returns 用例名称
   *
   * @example
   * ```typescript
   * getUseCaseName(): string {
   *   return 'CreateUser';
   * }
   * ```
   */
  getUseCaseName(): string;

  /**
   * 获取用例描述
   *
   * @description 返回用例的业务描述，用于：
   * - 文档生成和业务理解
   * - 开发工具提示
   * - API文档生成
   * - 业务分析和审计
   *
   * @returns 用例描述
   *
   * @example
   * ```typescript
   * getUseCaseDescription(): string {
   *   return '创建新用户，包括验证、持久化和事件发布';
   * }
   * ```
   */
  getUseCaseDescription(): string;

  /**
   * 获取用例版本
   *
   * @description 返回用例的版本号，用于：
   * - 版本兼容性管理
   * - API版本控制
   * - 变更追踪
   *
   * @returns 用例版本号
   * @default '1.0.0'
   *
   * @example
   * ```typescript
   * getUseCaseVersion?(): string {
   *   return '2.1.0';
   * }
   * ```
   */
  getUseCaseVersion?(): string;

  /**
   * 获取用例权限要求
   *
   * @description 返回执行此用例所需的权限列表，用于：
   * - 权限验证和访问控制
   * - 安全审计
   * - 角色权限分配
   *
   * @returns 权限列表
   *
   * @example
   * ```typescript
   * getRequiredPermissions?(): string[] {
   *   return ['user:create', 'user:manage'];
   * }
   * ```
   */
  getRequiredPermissions?(): string[];
}

/**
 * 用例上下文接口
 *
 * 定义用例执行时的上下文信息
 */
export interface IUseCaseContext {
  /**
   * 用户上下文
   *
   * @description 执行用例的用户信息
   */
  user?: {
    id: string;
    name?: string;
    email?: string;
    roles?: string[];
    permissions?: string[];
  };

  /**
   * 租户上下文
   *
   * @description 用例执行所在的租户信息
   */
  tenant?: {
    id: string;
    name?: string;
    code?: string;
    type?: string;
  };

  /**
   * 请求上下文
   *
   * @description 触发用例执行的请求信息
   */
  request?: {
    id: string;
    timestamp: Date;
    ip?: string;
    userAgent?: string;
    source?: string;
    traceId?: string;
  };

  /**
   * 系统上下文
   *
   * @description 系统环境信息
   */
  system?: {
    service: string;
    version: string;
    environment: string;
    hostname?: string;
  };

  /**
   * 自定义上下文
   *
   * @description 业务特定的上下文信息
   */
  custom?: Record<string, any>;
}

/**
 * 用例工厂接口
 *
 * 定义创建用例的工厂方法
 */
export interface IUseCaseFactory<TUseCase extends IUseCase<any, any>> {
  /**
   * 创建用例实例
   *
   * @param dependencies - 用例依赖
   * @returns 用例实例
   */
  create(dependencies?: any): TUseCase;

  /**
   * 获取用例类型
   *
   * @returns 用例类型标识
   */
  getUseCaseType(): string;
}

/**
 * 用例注册表接口
 *
 * 定义用例注册和发现的契约
 */
export interface IUseCaseRegistry {
  /**
   * 注册用例
   *
   * @param useCaseName - 用例名称
   * @param useCaseFactory - 用例工厂
   */
  register<TRequest, TResponse>(
    useCaseName: string,
    useCaseFactory: IUseCaseFactory<IUseCase<TRequest, TResponse>>,
  ): void;

  /**
   * 获取用例
   *
   * @param useCaseName - 用例名称
   * @returns 用例实例
   */
  get<TRequest, TResponse>(
    useCaseName: string,
  ): IUseCase<TRequest, TResponse> | undefined;

  /**
   * 检查用例是否已注册
   *
   * @param useCaseName - 用例名称
   * @returns 如果已注册返回true，否则返回false
   */
  has(useCaseName: string): boolean;

  /**
   * 获取所有已注册的用例名称
   *
   * @returns 用例名称数组
   */
  getRegisteredUseCases(): string[];

  /**
   * 按类型获取用例
   *
   * @param type - 用例类型（'command' | 'query'）
   * @returns 该类型的所有用例
   */
  getByType(type: 'command' | 'query'): Map<string, IUseCase<any, any>>;
}

/**
 * 用例执行器接口
 *
 * 定义用例执行的统一入口
 */
export interface IUseCaseExecutor {
  /**
   * 执行用例
   *
   * @param useCaseName - 用例名称
   * @param request - 请求参数
   * @param context - 执行上下文
   * @returns 执行结果
   */
  execute<TRequest, TResponse>(
    useCaseName: string,
    request: TRequest,
    context?: IUseCaseContext,
  ): Promise<TResponse>;

  /**
   * 批量执行用例
   *
   * @param executions - 用例执行请求数组
   * @returns 执行结果数组
   */
  executeBatch(
    executions: Array<{
      useCaseName: string;
      request: any;
      context?: IUseCaseContext;
    }>,
  ): Promise<any[]>;
}
