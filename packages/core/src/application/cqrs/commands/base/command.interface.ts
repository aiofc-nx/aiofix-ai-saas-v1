/**
 * 命令接口
 *
 * 定义命令的基础契约，命令是CQRS模式中表示状态变更意图的数据传输对象。
 * 命令包含执行操作所需的所有数据和元数据。
 *
 * @description 命令接口定义了所有命令必须实现的基础能力
 *
 * ## 业务规则
 *
 * ### 命令标识规则
 * - 每个命令必须有唯一的命令标识符
 * - 命令标识符用于去重、追踪和审计
 * - 命令标识符在命令生命周期内不可变更
 * - 命令标识符必须符合UUID格式要求
 *
 * ### 命令时间戳规则
 * - 命令创建时间使用UTC时区
 * - 时间戳用于命令排序和过期检查
 * - 时间戳精度到毫秒级别
 * - 时间戳不可修改
 *
 * ### 命令上下文规则
 * - 命令必须包含执行上下文信息
 * - 用户信息用于权限验证和审计
 * - 租户信息用于多租户隔离
 * - 请求信息用于安全审计
 *
 * ### 命令不变性规则
 * - 命令一旦创建不可修改
 * - 所有命令属性都应该是只读的
 * - 命令应该是纯数据对象
 * - 命令不包含业务逻辑
 *
 * @example
 * ```typescript
 * export class CreateUserCommand implements ICommand {
 *   public readonly commandId: string;
 *   public readonly commandType: string;
 *   public readonly timestamp: Date;
 *   public readonly userId?: string;
 *   public readonly tenantId?: string;
 *
 *   constructor(
 *     public readonly name: string,
 *     public readonly email: string,
 *     userId?: string,
 *     tenantId?: string
 *   ) {
 *     this.commandId = EntityId.generate().value;
 *     this.commandType = 'CreateUser';
 *     this.timestamp = new Date();
 *     this.userId = userId;
 *     this.tenantId = tenantId;
 *   }
 *
 *   validate(): ICommandValidationResult {
 *     const errors: any[] = [];
 *
 *     if (!this.name) errors.push({ field: 'name', message: '用户名不能为空' });
 *     if (!this.email) errors.push({ field: 'email', message: '邮箱不能为空' });
 *
 *     return { isValid: errors.length === 0, errors };
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

/**
 * 命令验证结果接口
 */
export interface ICommandValidationResult {
  /**
   * 验证是否通过
   */
  isValid: boolean;

  /**
   * 验证错误列表
   */
  errors: Array<{
    field: string;
    message: string;
    code?: string;
  }>;

  /**
   * 验证警告列表
   */
  warnings?: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
}

/**
 * 命令接口
 *
 * 定义命令必须实现的基础能力
 */
export interface ICommand {
  /**
   * 命令标识符
   *
   * @description 命令的唯一标识符，用于：
   * - 命令去重和幂等性保证
   * - 命令追踪和审计
   * - 命令关联和引用
   * - 错误诊断和调试
   *
   * @readonly
   */
  readonly commandId: string;

  /**
   * 命令类型
   *
   * @description 命令的类型标识，用于：
   * - 命令路由和分发
   * - 处理器注册和发现
   * - 日志记录和监控
   * - 权限控制和验证
   *
   * @readonly
   */
  readonly commandType: string;

  /**
   * 命令创建时间
   *
   * @description 命令创建的时间戳，用于：
   * - 命令排序和过期检查
   * - 审计追踪和分析
   * - 性能监控和统计
   * - 时间范围查询
   *
   * @readonly
   */
  readonly timestamp: Date;

  /**
   * 执行用户ID
   *
   * @description 执行命令的用户标识符，用于：
   * - 权限验证和访问控制
   * - 审计日志和操作追踪
   * - 用户行为分析
   * - 数据隔离和安全
   *
   * @readonly
   */
  readonly userId?: string;

  /**
   * 租户ID
   *
   * @description 命令所属的租户标识符，用于：
   * - 多租户数据隔离
   * - 租户级别的权限控制
   * - 租户资源配额管理
   * - 租户级别的审计
   *
   * @readonly
   */
  readonly tenantId?: string;

  /**
   * 请求ID
   *
   * @description 触发命令的请求标识符，用于：
   * - 请求追踪和关联
   * - 分布式链路追踪
   * - 请求性能分析
   * - 错误诊断和调试
   *
   * @readonly
   */
  readonly requestId?: string;

  /**
   * 相关性ID
   *
   * @description 命令关联的业务流程标识符，用于：
   * - 业务流程追踪
   * - 事务关联和管理
   * - 补偿操作执行
   * - 流程状态监控
   *
   * @readonly
   */
  readonly correlationId?: string;

  /**
   * 验证命令
   *
   * @description 验证命令的数据有效性和业务规则
   *
   * @returns 验证结果
   *
   * @example
   * ```typescript
   * validate(): ICommandValidationResult {
   *   const errors: any[] = [];
   *
   *   if (!this.name || this.name.trim().length === 0) {
   *     errors.push({
   *       field: 'name',
   *       message: '名称不能为空',
   *       code: 'NAME_REQUIRED'
   *     });
   *   }
   *
   *   return {
   *     isValid: errors.length === 0,
   *     errors
   *   };
   * }
   * ```
   */
  validate(): ICommandValidationResult;

  /**
   * 获取命令的业务标识符
   *
   * @description 返回用于业务逻辑的标识符，通常用于日志和调试
   * @returns 业务标识符字符串
   *
   * @example
   * ```typescript
   * getBusinessIdentifier(): string {
   *   return `CreateUser(${this.commandId}, ${this.email})`;
   * }
   * ```
   */
  getBusinessIdentifier(): string;

  /**
   * 转换为纯数据对象
   *
   * @description 将命令转换为纯数据对象，用于序列化和传输
   * @returns 包含所有命令数据的纯对象
   *
   * @example
   * ```typescript
   * toData(): Record<string, unknown> {
   *   return {
   *     commandId: this.commandId,
   *     commandType: this.commandType,
   *     timestamp: this.timestamp,
   *     userId: this.userId,
   *     tenantId: this.tenantId,
   *     name: this.name,
   *     email: this.email
   *   };
   * }
   * ```
   */
  toData(): Record<string, unknown>;

  /**
   * 获取命令版本
   *
   * @description 返回命令的版本号，用于版本兼容性管理
   * @returns 命令版本号
   * @default '1.0.0'
   */
  getVersion(): string;

  /**
   * 获取命令优先级
   *
   * @description 返回命令的执行优先级，用于队列排序
   * @returns 优先级（数字越大优先级越高）
   * @default 0
   */
  getPriority(): number;

  /**
   * 检查命令是否过期
   *
   * @description 检查命令是否已过期，过期的命令不应该被执行
   * @param expirationTime - 过期时间（可选，使用默认过期策略）
   * @returns 如果已过期返回true，否则返回false
   */
  isExpired(expirationTime?: number): boolean;
}

/**
 * 命令元数据接口
 */
export interface ICommandMetadata {
  /**
   * 命令类型
   */
  commandType: string;

  /**
   * 命令描述
   */
  description: string;

  /**
   * 命令版本
   */
  version: string;

  /**
   * 所需权限
   */
  requiredPermissions: string[];

  /**
   * 命令分类
   */
  category?: string;

  /**
   * 命令标签
   */
  tags?: string[];

  /**
   * 是否需要事务
   */
  requiresTransaction?: boolean;

  /**
   * 超时配置
   */
  timeout?: {
    execution: number;
    alertOnTimeout: boolean;
  };

  /**
   * 重试配置
   */
  retry?: {
    maxAttempts: number;
    backoffStrategy: 'fixed' | 'exponential' | 'linear';
    baseDelay: number;
  };
}

/**
 * 命令工厂接口
 */
export interface ICommandFactory<T extends ICommand> {
  /**
   * 创建命令实例
   *
   * @param data - 创建命令所需的数据
   * @returns 新创建的命令实例
   */
  create(data: Record<string, unknown>): T;

  /**
   * 获取命令类型
   *
   * @returns 命令类型标识
   */
  getCommandType(): string;

  /**
   * 验证命令数据
   *
   * @param data - 要验证的数据
   * @returns 验证结果
   */
  validateData(data: Record<string, unknown>): ICommandValidationResult;
}
