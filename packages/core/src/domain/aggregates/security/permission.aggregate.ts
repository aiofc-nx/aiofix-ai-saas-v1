/**
 * 权限实体
 *
 * @description 权限是安全系统的基础单位，定义了用户可以执行的具体操作。
 * 权限采用分层设计，支持资源级别的细粒度控制。
 *
 * ## 业务规则
 *
 * ### 权限标识规则
 * - 权限代码必须全局唯一
 * - 权限代码采用层级结构：模块:资源:操作
 * - 权限代码只能包含字母、数字、冒号和下划线
 * - 权限代码长度不能超过100个字符
 *
 * ### 权限层级规则
 * - 支持权限继承，子权限自动包含父权限
 * - 权限层级最多支持5级深度
 * - 父权限被撤销时，所有子权限自动失效
 * - 权限依赖关系必须是有向无环图
 *
 * ### 权限作用域规则
 * - 系统级权限：影响整个系统的操作
 * - 租户级权限：影响特定租户的操作
 * - 组织级权限：影响特定组织的操作
 * - 部门级权限：影响特定部门的操作
 * - 资源级权限：影响特定资源的操作
 *
 * @example
 * ```typescript
 * // 创建系统级权限
 * const systemPermission = new Permission(
 *   EntityId.generate(),
 *   'system:admin:manage',
 *   '系统管理权限',
 *   '管理系统配置和用户',
 *   PermissionScope.SYSTEM,
 *   PermissionType.OPERATION,
 *   auditInfo
 * );
 *
 * // 创建资源级权限
 * const resourcePermission = new Permission(
 *   EntityId.generate(),
 *   'document:contract:read',
 *   '合同文档读取',
 *   '读取合同类型的文档',
 *   PermissionScope.RESOURCE,
 *   PermissionType.DATA,
 *   auditInfo
 * );
 *
 * // 添加权限依赖
 * resourcePermission.addDependency('document:read');
 * ```
 *
 * @since 1.0.0
 */

import { BaseAggregateRoot } from '../../aggregates/base/base-aggregate-root';
import { EntityId } from '../../value-objects/entity-id';
import type { IAuditInfo } from '../../entities/base/audit-info';

/**
 * 权限作用域枚举
 *
 * @description 定义权限的作用范围
 */
export enum PermissionScope {
  /** 系统级权限 */
  SYSTEM = 'system',
  /** 租户级权限 */
  TENANT = 'tenant',
  /** 组织级权限 */
  ORGANIZATION = 'organization',
  /** 部门级权限 */
  DEPARTMENT = 'department',
  /** 资源级权限 */
  RESOURCE = 'resource',
}

/**
 * 权限类型枚举
 *
 * @description 定义权限的类型分类
 */
export enum PermissionType {
  /** 操作权限 */
  OPERATION = 'operation',
  /** 数据权限 */
  DATA = 'data',
  /** 功能权限 */
  FEATURE = 'feature',
  /** 配置权限 */
  CONFIGURATION = 'configuration',
  /** 管理权限 */
  MANAGEMENT = 'management',
}

/**
 * 权限状态枚举
 *
 * @description 定义权限的状态
 */
export enum PermissionStatus {
  /** 活跃状态 */
  ACTIVE = 'active',
  /** 已禁用 */
  DISABLED = 'disabled',
  /** 已废弃 */
  DEPRECATED = 'deprecated',
}

/**
 * 权限实体类
 *
 * @description 权限聚合根，管理权限的完整生命周期和业务规则
 */
export class Permission extends BaseAggregateRoot {
  constructor(
    id: EntityId,
    private readonly _code: string,
    private readonly _name: string,
    private readonly _description: string,
    private readonly _scope: PermissionScope,
    private readonly _type: PermissionType,
    private _status: PermissionStatus = PermissionStatus.ACTIVE,
    private readonly _dependencies: string[] = [],
    private readonly _metadata: Record<string, unknown> = {},
    auditInfo: Partial<IAuditInfo>,
  ) {
    super(id, auditInfo);

    // 验证权限代码格式
    this.validatePermissionCode(_code);

    // 验证权限依赖
    this.validateDependencies(_dependencies);
  }

  // ==================== 访问器 ====================

  /**
   * 获取权限代码
   */
  get code(): string {
    return this._code;
  }

  /**
   * 获取权限名称
   */
  get name(): string {
    return this._name;
  }

  /**
   * 获取权限描述
   */
  get description(): string {
    return this._description;
  }

  /**
   * 获取权限作用域
   */
  get scope(): PermissionScope {
    return this._scope;
  }

  /**
   * 获取权限类型
   */
  get type(): PermissionType {
    return this._type;
  }

  /**
   * 获取权限状态
   */
  get status(): PermissionStatus {
    return this._status;
  }

  /**
   * 获取权限依赖
   */
  get dependencies(): readonly string[] {
    return [...this._dependencies];
  }

  /**
   * 获取权限元数据
   */
  get metadata(): Readonly<Record<string, unknown>> {
    return { ...this._metadata };
  }

  // ==================== 状态检查 ====================

  /**
   * 检查权限是否活跃
   */
  get isActive(): boolean {
    return this._status === PermissionStatus.ACTIVE;
  }

  /**
   * 检查权限是否被禁用
   */
  get isDisabled(): boolean {
    return this._status === PermissionStatus.DISABLED;
  }

  /**
   * 检查权限是否已废弃
   */
  get isDeprecated(): boolean {
    return this._status === PermissionStatus.DEPRECATED;
  }

  // ==================== 业务方法 ====================

  /**
   * 禁用权限
   */
  disable(reason: string): void {
    if (this._status === PermissionStatus.DISABLED) {
      return;
    }

    this._status = PermissionStatus.DISABLED;
    this._metadata.disableReason = reason;
    this._metadata.disabledAt = new Date();
  }

  /**
   * 启用权限
   */
  enable(): void {
    if (this._status === PermissionStatus.ACTIVE) {
      return;
    }

    this._status = PermissionStatus.ACTIVE;
    delete this._metadata.disableReason;
    delete this._metadata.disabledAt;
    this._metadata.enabledAt = new Date();
  }

  /**
   * 标记权限为废弃
   */
  deprecate(reason: string, replacementPermission?: string): void {
    this._status = PermissionStatus.DEPRECATED;
    this._metadata.deprecationReason = reason;
    this._metadata.deprecatedAt = new Date();

    if (replacementPermission) {
      this._metadata.replacementPermission = replacementPermission;
    }
  }

  /**
   * 添加权限依赖
   */
  addDependency(dependencyCode: string): void {
    if (this._dependencies.includes(dependencyCode)) {
      return;
    }

    // 验证不会造成循环依赖
    if (this.wouldCreateCircularDependency(dependencyCode)) {
      throw new Error(`添加依赖 ${dependencyCode} 会造成循环依赖`);
    }

    this._dependencies.push(dependencyCode);
  }

  /**
   * 移除权限依赖
   */
  removeDependency(dependencyCode: string): void {
    const index = this._dependencies.indexOf(dependencyCode);
    if (index > -1) {
      this._dependencies.splice(index, 1);
    }
  }

  /**
   * 检查是否依赖于指定权限
   */
  dependsOn(permissionCode: string): boolean {
    return this._dependencies.includes(permissionCode);
  }

  /**
   * 获取权限层级
   */
  getHierarchyLevel(): number {
    return this._code.split(':').length;
  }

  /**
   * 获取父权限代码
   */
  getParentPermissionCode(): string | null {
    const parts = this._code.split(':');
    if (parts.length <= 1) {
      return null;
    }
    return parts.slice(0, -1).join(':');
  }

  /**
   * 检查是否为指定权限的子权限
   */
  isChildOf(parentCode: string): boolean {
    return this._code.startsWith(parentCode + ':');
  }

  /**
   * 检查是否为指定权限的父权限
   */
  isParentOf(childCode: string): boolean {
    return childCode.startsWith(this._code + ':');
  }

  // ==================== 验证方法 ====================

  /**
   * 验证权限代码格式
   */
  private validatePermissionCode(code: string): void {
    if (!code || typeof code !== 'string') {
      throw new Error('权限代码不能为空');
    }

    if (code.length > 100) {
      throw new Error('权限代码长度不能超过100个字符');
    }

    const codeRegex = /^[a-zA-Z0-9][a-zA-Z0-9:_]*[a-zA-Z0-9]$/;
    if (!codeRegex.test(code)) {
      throw new Error('权限代码只能包含字母、数字、冒号和下划线');
    }

    // 验证层级结构
    const parts = code.split(':');
    if (parts.length > 5) {
      throw new Error('权限层级不能超过5级');
    }

    for (const part of parts) {
      if (part.length === 0) {
        throw new Error('权限代码不能包含空的层级部分');
      }
    }
  }

  /**
   * 验证权限依赖
   */
  private validateDependencies(dependencies: string[]): void {
    for (const dependency of dependencies) {
      this.validatePermissionCode(dependency);
    }
  }

  /**
   * 检查是否会造成循环依赖
   */
  private wouldCreateCircularDependency(dependencyCode: string): boolean {
    // 简化的循环依赖检查
    // 实际实现需要递归检查整个依赖链
    return dependencyCode === this._code;
  }
}
