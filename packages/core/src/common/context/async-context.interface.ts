/**
 * 异步上下文接口定义
 *
 * 定义了异步上下文管理的核心接口，用于在异步操作中传递和共享上下文信息。
 * 支持请求追踪、多租户隔离、用户身份验证等企业级功能。
 *
 * @description 异步上下文管理接口
 * @since 1.0.0
 */

/**
 * 上下文数据接口
 */
export interface IContextData {
  /**
   * 租户标识符
   */
  tenantId?: string;

  /**
   * 用户标识符
   */
  userId?: string;

  /**
   * 组织标识符
   */
  organizationId?: string;

  /**
   * 部门标识符
   */
  departmentId?: string;

  /**
   * 请求标识符
   */
  requestId?: string;

  /**
   * 关联标识符
   */
  correlationId?: string;

  /**
   * 原因标识符
   */
  causationId?: string;

  /**
   * 用户代理
   */
  userAgent?: string;

  /**
   * IP 地址
   */
  ipAddress?: string;

  /**
   * 请求来源
   */
  source?: 'WEB' | 'API' | 'CLI' | 'SYSTEM';

  /**
   * 语言设置
   */
  locale?: string;

  /**
   * 时区设置
   */
  timezone?: string;

  /**
   * 自定义数据
   */
  customData?: Record<string, unknown>;

  /**
   * 创建时间
   */
  createdAt?: Date;

  /**
   * 过期时间
   */
  expiresAt?: Date;
}

/**
 * 异步上下文接口
 */
export interface IAsyncContext {
  /**
   * 获取上下文数据
   *
   * @returns 上下文数据
   */
  getData(): IContextData;

  /**
   * 设置上下文数据
   *
   * @param data - 上下文数据
   */
  setData(data: Partial<IContextData>): void;

  /**
   * 获取指定键的值
   *
   * @param key - 键名
   * @returns 值
   */
  getValue<K extends keyof IContextData>(key: K): IContextData[K];

  /**
   * 设置指定键的值
   *
   * @param key - 键名
   * @param value - 值
   */
  setValue<K extends keyof IContextData>(key: K, value: IContextData[K]): void;

  /**
   * 检查是否包含指定键
   *
   * @param key - 键名
   * @returns 如果包含则返回 true，否则返回 false
   */
  hasValue<K extends keyof IContextData>(key: K): boolean;

  /**
   * 删除指定键
   *
   * @param key - 键名
   */
  removeValue<K extends keyof IContextData>(key: K): void;

  /**
   * 清除所有数据
   */
  clear(): void;

  /**
   * 克隆上下文
   *
   * @returns 克隆的上下文
   */
  clone(): IAsyncContext;

  /**
   * 合并上下文数据
   *
   * @param other - 其他上下文
   */
  merge(other: IAsyncContext): void;

  /**
   * 检查上下文是否有效
   *
   * @returns 如果有效则返回 true，否则返回 false
   */
  isValid(): boolean;

  /**
   * 获取上下文标识符
   *
   * @returns 上下文标识符
   */
  getId(): string;

  /**
   * 获取上下文创建时间
   *
   * @returns 创建时间
   */
  getCreatedAt(): Date;

  /**
   * 获取上下文过期时间
   *
   * @returns 过期时间
   */
  getExpiresAt(): Date | undefined;

  /**
   * 检查上下文是否已过期
   *
   * @returns 如果已过期则返回 true，否则返回 false
   */
  isExpired(): boolean;

  /**
   * 设置过期时间
   *
   * @param expiresAt - 过期时间
   */
  setExpiresAt(expiresAt: Date): void;

  /**
   * 获取自定义数据
   *
   * @param key - 键名
   * @returns 值
   */
  getCustomData(key: string): unknown;

  /**
   * 设置自定义数据
   *
   * @param key - 键名
   * @param value - 值
   */
  setCustomData(key: string, value: unknown): void;

  /**
   * 删除自定义数据
   *
   * @param key - 键名
   */
  removeCustomData(key: string): void;

  /**
   * 获取所有自定义数据
   *
   * @returns 自定义数据对象
   */
  getAllCustomData(): Record<string, unknown>;

  /**
   * 转换为 JSON 表示
   *
   * @returns JSON 表示
   */
  toJSON(): Record<string, unknown>;

  /**
   * 转换为字符串表示
   *
   * @returns 字符串表示
   */
  toString(): string;

  // 便捷方法
  getTenantId(): string | undefined;
  setTenantId(tenantId: string): void;
  getUserId(): string | undefined;
  setUserId(userId: string): void;
  getOrganizationId(): string | undefined;
  setOrganizationId(organizationId: string): void;
  getDepartmentId(): string | undefined;
  setDepartmentId(departmentId: string): void;
  getRequestId(): string | undefined;
  setRequestId(requestId: string): void;
  getCorrelationId(): string | undefined;
  setCorrelationId(correlationId: string): void;
  getCausationId(): string | undefined;
  setCausationId(causationId: string): void;
  getUserAgent(): string | undefined;
  setUserAgent(userAgent: string): void;
  getIpAddress(): string | undefined;
  setIpAddress(ipAddress: string): void;
  getSource(): 'WEB' | 'API' | 'CLI' | 'SYSTEM' | undefined;
  setSource(source: 'WEB' | 'API' | 'CLI' | 'SYSTEM'): void;
  getLocale(): string | undefined;
  setLocale(locale: string): void;
  getTimezone(): string | undefined;
  setTimezone(timezone: string): void;
  isMultiTenant(): boolean;
  isOrganizationLevel(): boolean;
  isDepartmentLevel(): boolean;
  isUserLevel(): boolean;
  getContextLevel():
    | 'TENANT'
    | 'ORGANIZATION'
    | 'DEPARTMENT'
    | 'USER'
    | 'PUBLIC';
}

/**
 * 异步上下文管理器接口
 */
export interface IAsyncContextManager {
  /**
   * 创建新的异步上下文
   *
   * @param data - 初始上下文数据
   * @returns 异步上下文
   */
  createContext(data?: Partial<IContextData>): IAsyncContext;

  /**
   * 获取当前异步上下文
   *
   * @returns 当前异步上下文，如果不存在则返回 undefined
   */
  getCurrentContext(): IAsyncContext | undefined;

  /**
   * 设置当前异步上下文
   *
   * @param context - 异步上下文
   */
  setCurrentContext(context: IAsyncContext): void;

  /**
   * 清除当前异步上下文
   */
  clearCurrentContext(): void;

  /**
   * 在指定上下文中执行函数
   *
   * @param context - 异步上下文
   * @param fn - 要执行的函数
   * @returns 函数执行结果
   */
  runInContext<T>(context: IAsyncContext, fn: () => T | Promise<T>): Promise<T>;

  /**
   * 在指定上下文中执行函数（同步版本）
   *
   * @param context - 异步上下文
   * @param fn - 要执行的函数
   * @returns 函数执行结果
   */
  runInContextSync<T>(context: IAsyncContext, fn: () => T): T;

  /**
   * 包装函数以在指定上下文中执行
   *
   * @param context - 异步上下文
   * @param fn - 要包装的函数
   * @returns 包装后的函数
   */
  wrapInContext<T extends (...args: any[]) => any>(
    context: IAsyncContext,
    fn: T,
  ): T;

  /**
   * 包装异步函数以在指定上下文中执行
   *
   * @param context - 异步上下文
   * @param fn - 要包装的异步函数
   * @returns 包装后的异步函数
   */
  wrapInContextAsync<T extends (...args: any[]) => Promise<any>>(
    context: IAsyncContext,
    fn: T,
  ): T;

  /**
   * 获取上下文统计信息
   *
   * @returns 统计信息
   */
  getStatistics(): {
    totalContexts: number;
    activeContexts: number;
    expiredContexts: number;
    averageLifetime: number;
  };

  /**
   * 清理过期的上下文
   */
  cleanupExpiredContexts(): void;

  /**
   * 启动上下文管理器
   */
  start(): Promise<void>;

  /**
   * 停止上下文管理器
   */
  stop(): Promise<void>;
}

/**
 * 异步上下文中间件接口
 */
export interface IAsyncContextMiddleware {
  /**
   * 中间件名称
   */
  readonly name: string;

  /**
   * 中间件优先级
   */
  readonly priority: number;

  /**
   * 执行中间件
   *
   * @param context - 异步上下文
   * @param next - 下一个中间件或处理函数
   * @returns 处理结果
   */
  execute(context: IAsyncContext, next: () => Promise<void>): Promise<void>;

  /**
   * 检查是否应该执行此中间件
   *
   * @param context - 异步上下文
   * @returns 如果应该执行则返回 true，否则返回 false
   */
  shouldExecute(context: IAsyncContext): boolean;
}

/**
 * 异步上下文提供者接口
 */
export interface IAsyncContextProvider {
  /**
   * 提供者名称
   */
  readonly name: string;

  /**
   * 提供者优先级
   */
  readonly priority: number;

  /**
   * 从请求中提取上下文数据
   *
   * @param request - 请求对象
   * @returns 上下文数据
   */
  extractContextData(request: any): Partial<IContextData>;

  /**
   * 检查是否支持此请求
   *
   * @param request - 请求对象
   * @returns 如果支持则返回 true，否则返回 false
   */
  supports(request: any): boolean;
}
