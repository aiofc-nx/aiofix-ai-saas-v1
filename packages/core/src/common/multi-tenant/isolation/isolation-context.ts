/**
 * 数据隔离上下文
 *
 * @description 数据隔离上下文是多租户架构的核心技术组件，定义了数据访问的边界和规则
 * 这是纯技术实现，不包含业务逻辑
 * @since 1.0.0
 */

import { EntityId } from '../../../domain/value-objects/entity-id';

/**
 * 数据隔离层级枚举
 */
export enum IsolationLevel {
  TENANT = 'tenant',
  ORGANIZATION = 'organization',
  DEPARTMENT = 'department',
  PERSONAL = 'personal',
  PUBLIC = 'public',
}

/**
 * 数据敏感度枚举
 */
export enum DataSensitivity {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted',
  TOP_SECRET = 'top_secret',
}

/**
 * 数据隔离上下文选项
 */
export interface IDataIsolationContextOptions {
  tenantId: EntityId;
  organizationId?: EntityId;
  departmentId?: EntityId;
  userId?: EntityId;
  isolationLevel?: IsolationLevel;
  dataSensitivity?: DataSensitivity;
  accessPermissions?: string[];
  customAttributes?: Record<string, unknown>;
}

/**
 * 数据隔离上下文类
 *
 * @description 提供数据访问隔离的技术实现
 */
export class DataIsolationContext {
  public readonly tenantId: EntityId;
  public readonly organizationId?: EntityId;
  public readonly departmentId?: EntityId;
  public readonly userId?: EntityId;
  public readonly isolationLevel: IsolationLevel;
  public readonly dataSensitivity: DataSensitivity;
  public readonly accessPermissions: string[];
  public readonly customAttributes: Record<string, unknown>;

  constructor(options: IDataIsolationContextOptions) {
    this.tenantId = options.tenantId;
    this.organizationId = options.organizationId;
    this.departmentId = options.departmentId;
    this.userId = options.userId;
    this.isolationLevel = options.isolationLevel || IsolationLevel.TENANT;
    this.dataSensitivity = options.dataSensitivity || DataSensitivity.INTERNAL;
    this.accessPermissions = options.accessPermissions || [];
    this.customAttributes = options.customAttributes || {};
  }

  /**
   * 检查是否包含指定层级
   */
  hasLevel(level: IsolationLevel): boolean {
    switch (level) {
      case IsolationLevel.TENANT:
        return !!this.tenantId;
      case IsolationLevel.ORGANIZATION:
        return !!this.organizationId;
      case IsolationLevel.DEPARTMENT:
        return !!this.departmentId;
      case IsolationLevel.PERSONAL:
        return !!this.userId;
      case IsolationLevel.PUBLIC:
        return true;
      default:
        return false;
    }
  }

  /**
   * 获取隔离条件
   *
   * @description 生成数据库查询的隔离条件
   * @returns 查询条件对象
   */
  getIsolationConditions(): Record<string, unknown> {
    const conditions: Record<string, unknown> = {};

    // 租户隔离（必须）
    conditions.tenant_id = this.tenantId.toString();

    // 根据隔离层级添加条件
    if (this.isolationLevel === IsolationLevel.PERSONAL && this.userId) {
      conditions.user_id = this.userId.toString();
      conditions.department_id = this.departmentId?.toString();
      conditions.organization_id = this.organizationId?.toString();
    } else if (
      this.isolationLevel === IsolationLevel.DEPARTMENT &&
      this.departmentId
    ) {
      conditions.department_id = this.departmentId.toString();
      conditions.organization_id = this.organizationId?.toString();
    } else if (
      this.isolationLevel === IsolationLevel.ORGANIZATION &&
      this.organizationId
    ) {
      conditions.organization_id = this.organizationId.toString();
    } else if (this.isolationLevel === IsolationLevel.PUBLIC) {
      // 公共数据不需要隔离条件
      delete conditions.tenant_id;
    }
    // IsolationLevel.TENANT 只需要租户ID，已经添加了

    return conditions;
  }

  /**
   * 检查是否有权限访问
   */
  hasPermission(permission: string): boolean {
    return this.accessPermissions.includes(permission);
  }

  /**
   * 检查数据敏感度是否允许访问
   */
  canAccessSensitivity(requiredSensitivity: DataSensitivity): boolean {
    const sensitivityLevels = {
      [DataSensitivity.PUBLIC]: 0,
      [DataSensitivity.INTERNAL]: 1,
      [DataSensitivity.CONFIDENTIAL]: 2,
      [DataSensitivity.RESTRICTED]: 3,
      [DataSensitivity.TOP_SECRET]: 4,
    };

    const currentLevel = sensitivityLevels[this.dataSensitivity];
    const requiredLevel = sensitivityLevels[requiredSensitivity];

    return currentLevel >= requiredLevel;
  }

  /**
   * 获取自定义属性
   */
  getAttribute(key: string): unknown {
    return this.customAttributes[key];
  }

  /**
   * 转换为字符串
   */
  toString(): string {
    return `DataIsolationContext(tenant:${this.tenantId.toString()}, level:${this.isolationLevel}, sensitivity:${this.dataSensitivity})`;
  }

  /**
   * 转换为JSON对象
   */
  toJSON(): Record<string, unknown> {
    return {
      tenantId: this.tenantId.toString(),
      organizationId: this.organizationId?.toString(),
      departmentId: this.departmentId?.toString(),
      userId: this.userId?.toString(),
      isolationLevel: this.isolationLevel,
      dataSensitivity: this.dataSensitivity,
      accessPermissions: this.accessPermissions,
      customAttributes: this.customAttributes,
    };
  }

  /**
   * 克隆隔离上下文
   */
  clone(
    overrides: Partial<IDataIsolationContextOptions> = {},
  ): DataIsolationContext {
    return new DataIsolationContext({
      tenantId: overrides.tenantId || this.tenantId,
      organizationId: overrides.organizationId || this.organizationId,
      departmentId: overrides.departmentId || this.departmentId,
      userId: overrides.userId || this.userId,
      isolationLevel: overrides.isolationLevel || this.isolationLevel,
      dataSensitivity: overrides.dataSensitivity || this.dataSensitivity,
      accessPermissions: overrides.accessPermissions || [
        ...this.accessPermissions,
      ],
      customAttributes: overrides.customAttributes || {
        ...this.customAttributes,
      },
    });
  }
}
