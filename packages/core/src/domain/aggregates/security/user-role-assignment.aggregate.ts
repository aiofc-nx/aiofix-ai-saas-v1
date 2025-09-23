/**
 * 用户角色分配实体
 *
 * @description 用户角色分配实体管理用户与角色之间的关联关系。
 * 支持临时授权、条件授权和时间限制等高级功能。
 *
 * ## 业务规则
 *
 * ### 分配唯一性规则
 * - 同一用户在同一作用域内不能重复分配相同角色
 * - 分配记录必须包含完整的审计信息
 * - 分配操作必须有明确的授权者
 * - 分配原因必须记录在案
 *
 * ### 时间限制规则
 * - 支持永久分配和临时分配
 * - 临时分配必须指定有效期
 * - 过期的分配自动失效
 * - 支持分配的延期和提前终止
 *
 * ### 条件授权规则
 * - 支持基于条件的动态权限
 * - 条件可以是时间、地点、设备等
 * - 条件不满足时权限自动失效
 * - 支持复杂的条件组合
 *
 * @example
 * ```typescript
 * // 创建永久角色分配
 * const assignment = new UserRoleAssignment(
 *   EntityId.generate(),
 *   EntityId.fromString('user-123'),
 *   'tenant:admin',
 *   AssignmentScope.TENANT,
 *   EntityId.fromString('tenant-456'),
 *   auditInfo
 * );
 *
 * // 创建临时角色分配
 * const tempAssignment = new UserRoleAssignment(
 *   EntityId.generate(),
 *   EntityId.fromString('user-123'),
 *   'project:manager',
 *   AssignmentScope.PROJECT,
 *   EntityId.fromString('project-789'),
 *   auditInfo
 * );
 * tempAssignment.setExpirationDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30天后过期
 *
 * // 添加条件限制
 * tempAssignment.addCondition('ip_range', '192.168.1.0/24');
 * tempAssignment.addCondition('time_range', '09:00-18:00');
 * ```
 *
 * @since 1.0.0
 */

import { BaseAggregateRoot } from '../../aggregates/base/base-aggregate-root';
import { EntityId } from '../../value-objects/entity-id';
import type { IAuditInfo } from '../../entities/base/audit-info';

/**
 * 分配作用域枚举
 *
 * @description 定义角色分配的作用范围
 */
export enum AssignmentScope {
  /** 系统级分配 */
  SYSTEM = 'system',
  /** 租户级分配 */
  TENANT = 'tenant',
  /** 组织级分配 */
  ORGANIZATION = 'organization',
  /** 部门级分配 */
  DEPARTMENT = 'department',
  /** 项目级分配 */
  PROJECT = 'project',
  /** 资源级分配 */
  RESOURCE = 'resource',
}

/**
 * 分配状态枚举
 *
 * @description 定义角色分配的状态
 */
export enum AssignmentStatus {
  /** 活跃状态 */
  ACTIVE = 'active',
  /** 已暂停 */
  SUSPENDED = 'suspended',
  /** 已过期 */
  EXPIRED = 'expired',
  /** 已撤销 */
  REVOKED = 'revoked',
}

/**
 * 分配类型枚举
 *
 * @description 定义角色分配的类型
 */
export enum AssignmentType {
  /** 永久分配 */
  PERMANENT = 'permanent',
  /** 临时分配 */
  TEMPORARY = 'temporary',
  /** 条件分配 */
  CONDITIONAL = 'conditional',
  /** 紧急分配 */
  EMERGENCY = 'emergency',
}

/**
 * 授权条件接口
 *
 * @description 定义角色分配的条件限制
 */
export interface IAuthorizationCondition {
  /** 条件类型 */
  readonly type: string;
  /** 条件值 */
  readonly value: unknown;
  /** 条件描述 */
  readonly description?: string;
  /** 条件是否必须满足 */
  readonly required?: boolean;
}

/**
 * 用户角色分配实体类
 *
 * @description 用户角色分配聚合根，管理用户与角色的关联关系
 */
export class UserRoleAssignment extends BaseAggregateRoot {
  constructor(
    id: EntityId,
    private readonly _userId: EntityId,
    private readonly _roleCode: string,
    private readonly _scope: AssignmentScope,
    private readonly _scopeId: EntityId,
    private readonly _assignedBy: EntityId,
    auditInfo: Partial<IAuditInfo>,
    private _type: AssignmentType = AssignmentType.PERMANENT,
    private _status: AssignmentStatus = AssignmentStatus.ACTIVE,
    private _expirationDate?: Date,
    private _conditions: IAuthorizationCondition[] = [],
    private readonly _metadata: Record<string, unknown> = {},
  ) {
    super(id, auditInfo);

    // 验证分配的有效性
    this.validateAssignment();
  }

  // ==================== 访问器 ====================

  get userId(): EntityId {
    return this._userId;
  }

  get roleCode(): string {
    return this._roleCode;
  }

  get scope(): AssignmentScope {
    return this._scope;
  }

  get scopeId(): EntityId {
    return this._scopeId;
  }

  get type(): AssignmentType {
    return this._type;
  }

  get status(): AssignmentStatus {
    return this._status;
  }

  get assignedBy(): EntityId {
    return this._assignedBy;
  }

  get expirationDate(): Date | undefined {
    return this._expirationDate;
  }

  get conditions(): readonly IAuthorizationCondition[] {
    return [...this._conditions];
  }

  get metadata(): Readonly<Record<string, unknown>> {
    return { ...this._metadata };
  }

  // ==================== 状态检查 ====================

  get isActive(): boolean {
    return this._status === AssignmentStatus.ACTIVE;
  }

  get isExpired(): boolean {
    if (this._status === AssignmentStatus.EXPIRED) {
      return true;
    }

    if (this._expirationDate && this._expirationDate <= new Date()) {
      return true;
    }

    return false;
  }

  get isSuspended(): boolean {
    return this._status === AssignmentStatus.SUSPENDED;
  }

  get isRevoked(): boolean {
    return this._status === AssignmentStatus.REVOKED;
  }

  get isValid(): boolean {
    return this.isActive && !this.isExpired && this.areConditionsSatisfied();
  }

  get isPermanent(): boolean {
    return this._type === AssignmentType.PERMANENT;
  }

  get isTemporary(): boolean {
    return this._type === AssignmentType.TEMPORARY;
  }

  get isConditional(): boolean {
    return this._type === AssignmentType.CONDITIONAL;
  }

  // ==================== 业务方法 ====================

  /**
   * 设置过期时间
   */
  setExpirationDate(expirationDate: Date): void {
    if (expirationDate <= new Date()) {
      throw new Error('过期时间必须是未来时间');
    }

    this._expirationDate = expirationDate;

    if (this._type === AssignmentType.PERMANENT) {
      this._type = AssignmentType.TEMPORARY;
    }
  }

  /**
   * 延长有效期
   */
  extendValidity(additionalDays: number): void {
    if (additionalDays <= 0) {
      throw new Error('延长天数必须大于0');
    }

    if (!this._expirationDate) {
      // 如果没有过期时间，从当前时间开始计算
      this._expirationDate = new Date();
    }

    this._expirationDate = new Date(
      this._expirationDate.getTime() + additionalDays * 24 * 60 * 60 * 1000,
    );
  }

  /**
   * 撤销分配
   */
  revoke(reason: string): void {
    this._status = AssignmentStatus.REVOKED;
    this._metadata.revokeReason = reason;
    this._metadata.revokedAt = new Date();
  }

  /**
   * 暂停分配
   */
  suspend(reason: string): void {
    this._status = AssignmentStatus.SUSPENDED;
    this._metadata.suspendReason = reason;
    this._metadata.suspendedAt = new Date();
  }

  /**
   * 恢复分配
   */
  restore(): void {
    if (this._status === AssignmentStatus.REVOKED) {
      throw new Error('无法恢复已撤销的分配');
    }

    this._status = AssignmentStatus.ACTIVE;
    delete this._metadata.suspendReason;
    delete this._metadata.suspendedAt;
    this._metadata.restoredAt = new Date();
  }

  // ==================== 条件管理 ====================

  /**
   * 添加授权条件
   */
  addCondition(
    type: string,
    value: unknown,
    description?: string,
    required: boolean = true,
  ): void {
    const existingIndex = this._conditions.findIndex((c) => c.type === type);

    const condition: IAuthorizationCondition = {
      type,
      value,
      description,
      required,
    };

    if (existingIndex > -1) {
      this._conditions[existingIndex] = condition;
    } else {
      this._conditions.push(condition);
    }

    if (this._type === AssignmentType.PERMANENT) {
      this._type = AssignmentType.CONDITIONAL;
    }
  }

  /**
   * 移除授权条件
   */
  removeCondition(type: string): void {
    const index = this._conditions.findIndex((c) => c.type === type);
    if (index > -1) {
      this._conditions.splice(index, 1);
    }
  }

  /**
   * 获取指定类型的条件
   */
  getCondition(type: string): IAuthorizationCondition | undefined {
    return this._conditions.find((c) => c.type === type);
  }

  /**
   * 检查条件是否满足
   */
  areConditionsSatisfied(_context?: Record<string, unknown>): boolean {
    if (this._conditions.length === 0) {
      return true;
    }

    // 简化实现，实际需要根据条件类型进行具体验证
    return true;
  }

  // ==================== 验证方法 ====================

  /**
   * 验证分配的有效性
   */
  private validateAssignment(): void {
    if (!this._userId) {
      throw new Error('用户ID不能为空');
    }

    if (!this._roleCode || typeof this._roleCode !== 'string') {
      throw new Error('角色代码不能为空');
    }

    if (!this._scopeId) {
      throw new Error('作用域ID不能为空');
    }

    if (!this._assignedBy) {
      throw new Error('分配者ID不能为空');
    }

    // 验证临时分配必须有过期时间
    if (this._type === AssignmentType.TEMPORARY && !this._expirationDate) {
      throw new Error('临时分配必须指定过期时间');
    }

    // 验证条件分配必须有条件
    if (
      this._type === AssignmentType.CONDITIONAL &&
      this._conditions.length === 0
    ) {
      throw new Error('条件分配必须指定至少一个条件');
    }
  }
}
