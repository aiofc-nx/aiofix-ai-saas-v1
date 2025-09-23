/**
 * 安全策略实体
 *
 * @description 安全策略定义了系统的安全规则和约束条件。
 * 包括密码策略、访问控制策略、审计策略等。
 *
 * ## 业务规则
 *
 * ### 策略唯一性规则
 * - 策略名称在作用域内必须唯一
 * - 策略版本支持演进和回滚
 * - 同一类型的策略在作用域内只能有一个活跃版本
 * - 策略变更需要记录完整的变更历史
 *
 * ### 策略继承规则
 * - 下级作用域继承上级作用域的策略
 * - 下级可以覆盖上级的策略配置
 * - 覆盖策略不能降低安全级别
 * - 策略继承支持多层级传递
 *
 * ### 策略生效规则
 * - 策略变更有生效延迟期
 * - 紧急策略可以立即生效
 * - 策略回滚需要管理员确认
 * - 策略冲突时以最严格的策略为准
 *
 * @example
 * ```typescript
 * // 创建密码策略
 * const passwordPolicy = new SecurityPolicy(
 *   EntityId.generate(),
 *   'password_policy',
 *   '密码安全策略',
 *   PolicyType.PASSWORD,
 *   PolicyScope.TENANT,
 *   EntityId.fromString('tenant-123'),
 *   {
 *     minLength: 12,
 *     requireUppercase: true,
 *     requireLowercase: true,
 *     requireNumbers: true,
 *     requireSpecialChars: true,
 *     maxAge: 90,
 *     historyCount: 12
 *   },
 *   auditInfo
 * );
 *
 * // 创建访问控制策略
 * const accessPolicy = new SecurityPolicy(
 *   EntityId.generate(),
 *   'access_control_policy',
 *   '访问控制策略',
 *   PolicyType.ACCESS_CONTROL,
 *   PolicyScope.ORGANIZATION,
 *   EntityId.fromString('org-456'),
 *   {
 *     allowedIpRanges: ['192.168.1.0/24', '10.0.0.0/8'],
 *     sessionTimeout: 480, // 8小时
 *     maxConcurrentSessions: 3,
 *     requireTwoFactor: true
 *   },
 *   auditInfo
 * );
 * ```
 *
 * @since 1.0.0
 */

import { BaseAggregateRoot } from '../../aggregates/base/base-aggregate-root';
import { EntityId } from '../../value-objects/entity-id';
import type { IAuditInfo } from '../../entities/base/audit-info';

/**
 * 策略类型枚举
 *
 * @description 定义安全策略的类型分类
 */
export enum PolicyType {
  /** 密码策略 */
  PASSWORD = 'password',
  /** 访问控制策略 */
  ACCESS_CONTROL = 'access_control',
  /** 审计策略 */
  AUDIT = 'audit',
  /** 数据保护策略 */
  DATA_PROTECTION = 'data_protection',
  /** 会话管理策略 */
  SESSION_MANAGEMENT = 'session_management',
  /** 认证策略 */
  AUTHENTICATION = 'authentication',
  /** 授权策略 */
  AUTHORIZATION = 'authorization',
}

/**
 * 策略作用域枚举
 *
 * @description 定义安全策略的作用范围
 */
export enum PolicyScope {
  /** 系统级策略 */
  SYSTEM = 'system',
  /** 租户级策略 */
  TENANT = 'tenant',
  /** 组织级策略 */
  ORGANIZATION = 'organization',
  /** 部门级策略 */
  DEPARTMENT = 'department',
}

/**
 * 策略状态枚举
 *
 * @description 定义安全策略的状态
 */
export enum PolicyStatus {
  /** 草稿状态 */
  DRAFT = 'draft',
  /** 活跃状态 */
  ACTIVE = 'active',
  /** 已暂停 */
  SUSPENDED = 'suspended',
  /** 已废弃 */
  DEPRECATED = 'deprecated',
}

/**
 * 安全策略实体类
 *
 * @description 安全策略聚合根，管理安全规则和约束条件
 */
export class SecurityPolicy extends BaseAggregateRoot {
  constructor(
    id: EntityId,
    private readonly _name: string,
    private readonly _description: string,
    private readonly _type: PolicyType,
    private readonly _scope: PolicyScope,
    private readonly _scopeId: EntityId,
    private _configuration: Record<string, unknown>,
    auditInfo: Partial<IAuditInfo>,
    private _version: number = 1,
    private _status: PolicyStatus = PolicyStatus.DRAFT,
    private _effectiveDate?: Date,
    private readonly _expirationDate?: Date,
    private readonly _parentPolicyId?: EntityId,
  ) {
    super(id, auditInfo);

    // 验证策略配置
    this.validatePolicyConfiguration();
  }

  // ==================== 访问器 ====================

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get type(): PolicyType {
    return this._type;
  }

  get scope(): PolicyScope {
    return this._scope;
  }

  get scopeId(): EntityId {
    return this._scopeId;
  }

  get configuration(): Readonly<Record<string, unknown>> {
    return { ...this._configuration };
  }

  get policyVersion(): number {
    return this._version;
  }

  get status(): PolicyStatus {
    return this._status;
  }

  get effectiveDate(): Date | undefined {
    return this._effectiveDate;
  }

  get expirationDate(): Date | undefined {
    return this._expirationDate;
  }

  get parentPolicyId(): EntityId | undefined {
    return this._parentPolicyId;
  }

  // ==================== 状态检查 ====================

  get isActive(): boolean {
    return this._status === PolicyStatus.ACTIVE;
  }

  get isDraft(): boolean {
    return this._status === PolicyStatus.DRAFT;
  }

  get isEffective(): boolean {
    if (!this.isActive) {
      return false;
    }

    const now = new Date();

    if (this._effectiveDate && this._effectiveDate > now) {
      return false;
    }

    if (this._expirationDate && this._expirationDate <= now) {
      return false;
    }

    return true;
  }

  // ==================== 业务方法 ====================

  /**
   * 激活策略
   */
  activate(effectiveDate?: Date): void {
    if (this._status === PolicyStatus.ACTIVE) {
      return;
    }

    this._status = PolicyStatus.ACTIVE;
    this._effectiveDate = effectiveDate || new Date();
  }

  /**
   * 暂停策略
   */
  suspend(_reason: string): void {
    this._status = PolicyStatus.SUSPENDED;
  }

  /**
   * 废弃策略
   */
  deprecate(_reason: string, _replacementPolicyId?: EntityId): void {
    this._status = PolicyStatus.DEPRECATED;
  }

  /**
   * 更新策略配置
   */
  updateConfiguration(newConfiguration: Record<string, unknown>): void {
    this.validateConfigurationUpdate(newConfiguration);

    this._configuration = { ...this._configuration, ...newConfiguration };
    this._version += 1;
  }

  /**
   * 获取配置值
   */
  getConfigurationValue<T>(key: string, defaultValue?: T): T | undefined {
    return (this._configuration[key] as T) || defaultValue;
  }

  /**
   * 检查配置是否存在
   */
  hasConfiguration(key: string): boolean {
    return key in this._configuration;
  }

  // ==================== 验证方法 ====================

  /**
   * 验证策略配置
   */
  private validatePolicyConfiguration(): void {
    if (!this._name || typeof this._name !== 'string') {
      throw new Error('策略名称不能为空');
    }

    if (!this._configuration || typeof this._configuration !== 'object') {
      throw new Error('策略配置不能为空');
    }

    // 根据策略类型验证特定配置
    this.validateTypeSpecificConfiguration();
  }

  /**
   * 验证类型特定的配置
   */
  private validateTypeSpecificConfiguration(): void {
    switch (this._type) {
      case PolicyType.PASSWORD:
        this.validatePasswordPolicyConfiguration();
        break;
      case PolicyType.ACCESS_CONTROL:
        this.validateAccessControlPolicyConfiguration();
        break;
      case PolicyType.SESSION_MANAGEMENT:
        this.validateSessionManagementPolicyConfiguration();
        break;
      // 其他策略类型的验证...
    }
  }

  /**
   * 验证密码策略配置
   */
  private validatePasswordPolicyConfiguration(): void {
    const config = this._configuration;

    const minLength = config.minLength as number;
    if (minLength && (minLength < 6 || minLength > 128)) {
      throw new Error('密码最小长度必须在6-128之间');
    }

    const maxAge = config.maxAge as number;
    if (maxAge && (maxAge < 1 || maxAge > 365)) {
      throw new Error('密码有效期必须在1-365天之间');
    }

    const historyCount = config.historyCount as number;
    if (historyCount && (historyCount < 0 || historyCount > 50)) {
      throw new Error('密码历史记录数量必须在0-50之间');
    }
  }

  /**
   * 验证访问控制策略配置
   */
  private validateAccessControlPolicyConfiguration(): void {
    const config = this._configuration;

    const sessionTimeout = config.sessionTimeout as number;
    if (sessionTimeout && (sessionTimeout < 5 || sessionTimeout > 1440)) {
      throw new Error('会话超时时间必须在5-1440分钟之间');
    }

    const maxConcurrentSessions = config.maxConcurrentSessions as number;
    if (
      maxConcurrentSessions &&
      (maxConcurrentSessions < 1 || maxConcurrentSessions > 100)
    ) {
      throw new Error('最大并发会话数必须在1-100之间');
    }
  }

  /**
   * 验证会话管理策略配置
   */
  private validateSessionManagementPolicyConfiguration(): void {
    const config = this._configuration;

    const idleTimeout = config.idleTimeout as number;
    if (idleTimeout && (idleTimeout < 1 || idleTimeout > 480)) {
      throw new Error('空闲超时时间必须在1-480分钟之间');
    }
  }

  /**
   * 验证配置更新
   */
  private validateConfigurationUpdate(
    newConfiguration: Record<string, unknown>,
  ): void {
    // 检查是否降低了安全级别
    if (this.isSecurityDowngrade(newConfiguration)) {
      throw new Error('不能降低安全策略的安全级别');
    }
  }

  /**
   * 检查是否为安全降级
   */
  private isSecurityDowngrade(
    _newConfiguration: Record<string, unknown>,
  ): boolean {
    // 简化实现，实际需要根据策略类型进行具体检查
    return false;
  }
}
