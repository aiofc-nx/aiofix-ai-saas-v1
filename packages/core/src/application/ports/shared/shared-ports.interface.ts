/**
 * 共享输出端口接口
 *
 * 定义命令和查询处理器共同需要的外部依赖接口。
 * 这些端口接口可以被命令处理器和查询处理器共同使用。
 *
 * @description 共享端口接口定义了应用层与外部世界交互的通用契约
 *
 * ## 业务规则
 *
 * ### 共享端口设计规则
 * - 共享端口应该是技术无关的
 * - 共享端口应该支持命令和查询的共同需求
 * - 共享端口应该保持接口的稳定性
 * - 共享端口应该支持依赖注入和测试
 *
 * ### 共享端口职责规则
 * - 提供日志记录和监控功能
 * - 提供配置管理和环境适配
 * - 提供时间和ID生成服务
 * - 提供数据验证和转换功能
 *
 * @example
 * ```typescript
 * // 在处理器中使用共享端口
 * export class SomeHandler {
 *   constructor(
 *     private readonly logger: ILoggerPort,
 *     private readonly idGenerator: IIdGeneratorPort,
 *     private readonly timeProvider: ITimeProviderPort,
 *     private readonly validator: IValidationPort
 *   ) {}
 *
 *   async handle(request: any): Promise<any> {
 *     const requestId = this.idGenerator.generate();
 *     const startTime = this.timeProvider.now();
 *
 *     this.logger.info('开始处理请求', { requestId });
 *
 *     const validationResult = await this.validator.validate(request);
 *     if (!validationResult.isValid) {
 *       throw new ValidationError('请求验证失败');
 *     }
 *
 *     // 处理逻辑...
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { EntityId } from '../../../domain/value-objects/entity-id';

/**
 * 日志记录端口接口
 */
export interface ILoggerPort {
  /**
   * 记录调试日志
   *
   * @param message - 日志消息
   * @param context - 上下文信息
   */
  debug(message: string, context?: Record<string, unknown>): void;

  /**
   * 记录信息日志
   *
   * @param message - 日志消息
   * @param context - 上下文信息
   */
  info(message: string, context?: Record<string, unknown>): void;

  /**
   * 记录警告日志
   *
   * @param message - 日志消息
   * @param context - 上下文信息
   */
  warn(message: string, context?: Record<string, unknown>): void;

  /**
   * 记录错误日志
   *
   * @param message - 日志消息
   * @param error - 错误对象
   * @param context - 上下文信息
   */
  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>,
  ): void;

  /**
   * 创建子日志器
   *
   * @param name - 子日志器名称
   * @returns 子日志器实例
   */
  child(name: string): ILoggerPort;
}

/**
 * ID生成器端口接口
 */
export interface IIdGeneratorPort {
  /**
   * 生成新的EntityId
   *
   * @returns 新的EntityId实例
   */
  generate(): EntityId;

  /**
   * 生成UUID字符串
   *
   * @returns UUID字符串
   */
  generateUuid(): string;

  /**
   * 生成短ID
   *
   * @param length - ID长度
   * @returns 短ID字符串
   */
  generateShortId(length?: number): string;

  /**
   * 验证ID格式
   *
   * @param id - 要验证的ID
   * @returns 如果格式正确返回true，否则返回false
   */
  isValidId(id: string): boolean;
}

/**
 * 时间提供者端口接口
 */
export interface ITimeProviderPort {
  /**
   * 获取当前时间
   *
   * @returns 当前时间
   */
  now(): Date;

  /**
   * 获取当前时间戳
   *
   * @returns 当前时间戳（毫秒）
   */
  timestamp(): number;

  /**
   * 格式化时间
   *
   * @param date - 要格式化的时间
   * @param format - 格式字符串
   * @returns 格式化后的时间字符串
   */
  format(date: Date, format: string): string;

  /**
   * 解析时间字符串
   *
   * @param dateString - 时间字符串
   * @param format - 格式字符串
   * @returns 解析后的时间
   */
  parse(dateString: string, format?: string): Date;

  /**
   * 添加时间
   *
   * @param date - 基础时间
   * @param amount - 添加的数量
   * @param unit - 时间单位
   * @returns 新的时间
   */
  add(date: Date, amount: number, unit: 'ms' | 's' | 'm' | 'h' | 'd'): Date;

  /**
   * 比较时间
   *
   * @param date1 - 时间1
   * @param date2 - 时间2
   * @returns 比较结果（-1: date1 < date2, 0: 相等, 1: date1 > date2）
   */
  compare(date1: Date, date2: Date): number;
}

/**
 * 验证端口接口
 */
export interface IValidationPort {
  /**
   * 验证数据
   *
   * @param data - 要验证的数据
   * @param schema - 验证模式
   * @returns 验证结果
   */
  validate(
    data: unknown,
    schema: IValidationSchema,
  ): Promise<IValidationResult>;

  /**
   * 验证邮箱格式
   *
   * @param email - 邮箱地址
   * @returns 如果格式正确返回true，否则返回false
   */
  validateEmail(email: string): boolean;

  /**
   * 验证手机号格式
   *
   * @param phone - 手机号
   * @param region - 地区代码
   * @returns 如果格式正确返回true，否则返回false
   */
  validatePhone(phone: string, region?: string): boolean;

  /**
   * 验证密码强度
   *
   * @param password - 密码
   * @param policy - 密码策略
   * @returns 验证结果
   */
  validatePassword(
    password: string,
    policy?: IPasswordPolicy,
  ): IPasswordValidationResult;

  /**
   * 数据脱敏
   *
   * @param data - 原始数据
   * @param rules - 脱敏规则
   * @returns 脱敏后的数据
   */
  sanitize<T>(data: T, rules: ISanitizationRules): T;
}

/**
 * 验证模式接口
 */
export interface IValidationSchema {
  /**
   * 模式类型
   */
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';

  /**
   * 是否必需
   */
  required?: boolean;

  /**
   * 字段定义
   */
  properties?: Record<string, IValidationSchema>;

  /**
   * 数组项定义
   */
  items?: IValidationSchema;

  /**
   * 字符串长度限制
   */
  minLength?: number;
  maxLength?: number;

  /**
   * 数字范围限制
   */
  min?: number;
  max?: number;

  /**
   * 正则表达式
   */
  pattern?: string;

  /**
   * 枚举值
   */
  enum?: unknown[];

  /**
   * 自定义验证函数
   */
  validator?: (value: unknown) => boolean | Promise<boolean>;
}

/**
 * 验证结果接口
 */
export interface IValidationResult {
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
    code: string;
    value?: unknown;
  }>;

  /**
   * 验证警告列表
   */
  warnings: Array<{
    field: string;
    message: string;
    code: string;
    value?: unknown;
  }>;
}

/**
 * 密码策略接口
 */
export interface IPasswordPolicy {
  /**
   * 最小长度
   */
  minLength: number;

  /**
   * 最大长度
   */
  maxLength: number;

  /**
   * 是否需要大写字母
   */
  requireUppercase: boolean;

  /**
   * 是否需要小写字母
   */
  requireLowercase: boolean;

  /**
   * 是否需要数字
   */
  requireNumbers: boolean;

  /**
   * 是否需要特殊字符
   */
  requireSpecialChars: boolean;

  /**
   * 禁止的密码列表
   */
  forbiddenPasswords?: string[];
}

/**
 * 密码验证结果接口
 */
export interface IPasswordValidationResult {
  /**
   * 验证是否通过
   */
  isValid: boolean;

  /**
   * 密码强度分数（0-100）
   */
  strength: number;

  /**
   * 验证错误列表
   */
  errors: string[];

  /**
   * 改进建议
   */
  suggestions: string[];
}

/**
 * 数据脱敏规则接口
 */
export interface ISanitizationRules {
  /**
   * 字段脱敏规则
   */
  fields: Record<
    string,
    {
      type: 'mask' | 'remove' | 'hash' | 'encrypt';
      options?: Record<string, unknown>;
    }
  >;

  /**
   * 默认规则
   */
  defaultRule?: {
    type: 'mask' | 'remove' | 'hash' | 'encrypt';
    options?: Record<string, unknown>;
  };
}

/**
 * 配置管理端口接口
 */
export interface IConfigurationPort {
  /**
   * 获取配置值
   *
   * @param key - 配置键
   * @param defaultValue - 默认值
   * @returns 配置值
   */
  get<T>(key: string, defaultValue?: T): T;

  /**
   * 检查配置是否存在
   *
   * @param key - 配置键
   * @returns 如果存在返回true，否则返回false
   */
  has(key: string): boolean;

  /**
   * 获取所有配置
   *
   * @returns 配置对象
   */
  getAll(): Record<string, unknown>;

  /**
   * 监听配置变更
   *
   * @param key - 配置键
   * @param callback - 变更回调
   */
  watch(
    key: string,
    callback: (newValue: unknown, oldValue: unknown) => void,
  ): void;
}

/**
 * 事件总线端口接口
 */
export interface IEventBusPort {
  /**
   * 发布事件
   *
   * @param event - 要发布的事件
   * @returns 发布操作的Promise
   */
  publish(event: unknown): Promise<void>;

  /**
   * 订阅事件
   *
   * @param eventType - 事件类型
   * @param handler - 事件处理器
   */
  subscribe(
    eventType: string,
    handler: (event: unknown) => Promise<void>,
  ): void;

  /**
   * 取消订阅
   *
   * @param eventType - 事件类型
   * @param handler - 事件处理器
   */
  unsubscribe(
    eventType: string,
    handler: (event: unknown) => Promise<void>,
  ): void;
}
