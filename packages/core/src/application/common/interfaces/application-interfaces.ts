/**
 * 应用层通用接口
 *
 * 定义应用层组件之间通信的通用接口，这些接口用于：
 * - 用例与外部服务的交互
 * - 应用层组件之间的协作
 * - 横切关注点的实现
 *
 * @description 应用层通用接口定义了应用层的公共契约
 *
 * ## 业务规则
 *
 * ### 接口设计规则
 * - 接口应该基于业务概念而非技术实现
 * - 接口应该保持稳定，避免频繁变更
 * - 接口应该支持扩展，遵循开闭原则
 * - 接口应该明确定义输入输出和异常
 *
 * ### 接口依赖规则
 * - 应用层接口可以依赖领域层接口
 * - 应用层接口不应该依赖基础设施层
 * - 接口之间应该避免循环依赖
 * - 接口应该支持依赖注入
 *
 * @since 1.0.0
 */

/**
 * 应用层服务接口
 *
 * 定义应用层服务的基础契约
 */
export interface IApplicationService {
  /**
   * 服务名称
   */
  readonly serviceName: string;

  /**
   * 服务版本
   */
  readonly serviceVersion: string;

  /**
   * 服务状态
   */
  readonly isHealthy: boolean;

  /**
   * 获取服务健康状态
   *
   * @returns 健康检查结果
   */
  getHealthStatus(): Promise<IServiceHealthStatus>;

  /**
   * 初始化服务
   *
   * @returns 初始化结果
   */
  initialize(): Promise<void>;

  /**
   * 清理服务资源
   *
   * @returns 清理结果
   */
  dispose(): Promise<void>;
}

/**
 * 服务健康状态接口
 */
export interface IServiceHealthStatus {
  /**
   * 服务名称
   */
  serviceName: string;

  /**
   * 是否健康
   */
  isHealthy: boolean;

  /**
   * 状态描述
   */
  status: string;

  /**
   * 检查时间
   */
  checkedAt: Date;

  /**
   * 详细信息
   */
  details: Record<string, unknown>;

  /**
   * 依赖服务状态
   */
  dependencies: IServiceHealthStatus[];
}

/**
 * 应用层事件发布器接口
 */
export interface IApplicationEventPublisher {
  /**
   * 发布应用层事件
   *
   * @param event - 要发布的事件
   * @returns 发布结果
   */
  publish(event: IApplicationEvent): Promise<void>;

  /**
   * 批量发布事件
   *
   * @param events - 要发布的事件数组
   * @returns 发布结果
   */
  publishAll(events: IApplicationEvent[]): Promise<void>;
}

/**
 * 应用层事件接口
 */
export interface IApplicationEvent {
  /**
   * 事件ID
   */
  readonly eventId: string;

  /**
   * 事件类型
   */
  readonly eventType: string;

  /**
   * 事件发生时间
   */
  readonly occurredAt: Date;

  /**
   * 事件数据
   */
  readonly data: Record<string, unknown>;

  /**
   * 事件来源
   */
  readonly source: string;

  /**
   * 用例名称
   */
  readonly useCaseName?: string;

  /**
   * 用户ID
   */
  readonly userId?: string;

  /**
   * 租户ID
   */
  readonly tenantId?: string;
}

/**
 * 应用层缓存接口
 */
export interface IApplicationCache {
  /**
   * 获取缓存值
   *
   * @param key - 缓存键
   * @returns 缓存值，如果不存在返回null
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * 设置缓存值
   *
   * @param key - 缓存键
   * @param value - 缓存值
   * @param ttl - 生存时间（秒）
   * @returns 设置结果
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * 删除缓存
   *
   * @param key - 缓存键
   * @returns 删除结果
   */
  delete(key: string): Promise<void>;

  /**
   * 检查缓存是否存在
   *
   * @param key - 缓存键
   * @returns 如果存在返回true，否则返回false
   */
  exists(key: string): Promise<boolean>;

  /**
   * 清空所有缓存
   *
   * @returns 清空结果
   */
  clear(): Promise<void>;
}

/**
 * 应用层日志接口
 */
export interface IApplicationLogger {
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
}

/**
 * 应用层通知接口
 */
export interface IApplicationNotifier {
  /**
   * 发送通知
   *
   * @param notification - 通知内容
   * @returns 发送结果
   */
  send(notification: INotification): Promise<void>;

  /**
   * 批量发送通知
   *
   * @param notifications - 通知数组
   * @returns 发送结果
   */
  sendAll(notifications: INotification[]): Promise<void>;
}

/**
 * 通知接口
 */
export interface INotification {
  /**
   * 通知ID
   */
  readonly id: string;

  /**
   * 通知类型
   */
  readonly type: string;

  /**
   * 接收者
   */
  readonly recipients: string[];

  /**
   * 通知标题
   */
  readonly title: string;

  /**
   * 通知内容
   */
  readonly content: string;

  /**
   * 通知数据
   */
  readonly data: Record<string, unknown>;

  /**
   * 优先级
   */
  readonly priority: 'low' | 'medium' | 'high' | 'urgent';

  /**
   * 发送时间
   */
  readonly scheduledAt?: Date;
}

/**
 * 应用层权限验证接口
 */
export interface IApplicationPermissionValidator {
  /**
   * 验证用户权限
   *
   * @param userId - 用户ID
   * @param permissions - 所需权限
   * @param resource - 资源标识
   * @param context - 验证上下文
   * @returns 验证结果
   */
  validatePermissions(
    userId: string,
    permissions: string[],
    resource?: string,
    context?: Record<string, unknown>,
  ): Promise<IPermissionValidationResult>;

  /**
   * 检查用户是否有权限
   *
   * @param userId - 用户ID
   * @param permission - 权限
   * @param resource - 资源标识
   * @returns 如果有权限返回true，否则返回false
   */
  hasPermission(
    userId: string,
    permission: string,
    resource?: string,
  ): Promise<boolean>;
}

/**
 * 权限验证结果接口
 */
export interface IPermissionValidationResult {
  /**
   * 验证是否通过
   */
  isValid: boolean;

  /**
   * 缺失的权限
   */
  missingPermissions: string[];

  /**
   * 验证详情
   */
  details: Record<string, unknown>;

  /**
   * 验证时间
   */
  validatedAt: Date;
}

/**
 * 应用层审计接口
 */
export interface IApplicationAuditor {
  /**
   * 记录审计日志
   *
   * @param auditLog - 审计日志
   * @returns 记录结果
   */
  audit(auditLog: IAuditLog): Promise<void>;

  /**
   * 批量记录审计日志
   *
   * @param auditLogs - 审计日志数组
   * @returns 记录结果
   */
  auditAll(auditLogs: IAuditLog[]): Promise<void>;
}

/**
 * 审计日志接口
 */
export interface IAuditLog {
  /**
   * 审计ID
   */
  readonly id: string;

  /**
   * 用例名称
   */
  readonly useCaseName: string;

  /**
   * 操作类型
   */
  readonly operation: string;

  /**
   * 资源类型
   */
  readonly resourceType: string;

  /**
   * 资源ID
   */
  readonly resourceId: string;

  /**
   * 用户ID
   */
  readonly userId?: string;

  /**
   * 租户ID
   */
  readonly tenantId?: string;

  /**
   * 操作时间
   */
  readonly occurredAt: Date;

  /**
   * 操作结果
   */
  readonly result: 'success' | 'failure';

  /**
   * 操作详情
   */
  readonly details: Record<string, unknown>;

  /**
   * IP地址
   */
  readonly ipAddress?: string;

  /**
   * 用户代理
   */
  readonly userAgent?: string;
}
