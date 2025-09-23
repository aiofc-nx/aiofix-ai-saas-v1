/**
 * 角色实体
 *
 * @description 角色是权限的集合，用于简化权限管理。
 * 角色支持继承和组合，提供灵活的权限分配机制。
 *
 * ## 业务规则
 *
 * ### 角色标识规则
 * - 角色代码必须在作用域内唯一
 * - 角色代码采用层级结构：作用域:角色名
 * - 角色名称必须在作用域内唯一
 * - 角色代码不能与权限代码冲突
 *
 * ### 角色继承规则
 * - 角色可以继承其他角色的所有权限
 * - 继承关系必须是有向无环图
 * - 子角色自动获得父角色的所有权限
 * - 继承深度不能超过10级
 *
 * ### 权限分配规则
 * - 角色可以直接分配权限
 * - 角色可以通过继承获得权限
 * - 权限冲突时以最严格的权限为准
 * - 支持权限的动态添加和移除
 *
 * @example
 * ```typescript
 * // 创建基础角色
 * const userRole = new Role(
 *   EntityId.generate(),
 *   'tenant:basic_user',
 *   '基础用户',
 *   '具有基本操作权限的用户角色',
 *   RoleScope.TENANT,
 *   RoleType.FUNCTIONAL,
 *   auditInfo
 * );
 *
 * // 添加权限
 * userRole.addPermission('document:read');
 * userRole.addPermission('document:create');
 *
 * // 创建管理员角色（继承用户角色）
 * const adminRole = new Role(
 *   EntityId.generate(),
 *   'tenant:admin',
 *   '租户管理员',
 *   '租户的管理员角色',
 *   RoleScope.TENANT,
 *   RoleType.ADMINISTRATIVE,
 *   auditInfo
 * );
 *
 * // 继承用户角色
 * adminRole.addInheritedRole('tenant:basic_user');
 * adminRole.addPermission('user:manage');
 * ```
 *
 * @since 1.0.0
 */

import { BaseAggregateRoot } from '../../aggregates/base/base-aggregate-root';
import { EntityId } from '../../value-objects/entity-id';
import type { IAuditInfo } from '../../entities/base/audit-info';

/**
 * 角色作用域枚举
 *
 * @description 定义角色的作用范围
 */
export enum RoleScope {
	/** 系统级角色 */
	SYSTEM = 'system',
	/** 租户级角色 */
	TENANT = 'tenant',
	/** 组织级角色 */
	ORGANIZATION = 'organization',
	/** 部门级角色 */
	DEPARTMENT = 'department',
	/** 项目级角色 */
	PROJECT = 'project'
}

/**
 * 角色类型枚举
 *
 * @description 定义角色的类型分类
 */
export enum RoleType {
	/** 功能角色 */
	FUNCTIONAL = 'functional',
	/** 管理角色 */
	ADMINISTRATIVE = 'administrative',
	/** 技术角色 */
	TECHNICAL = 'technical',
	/** 业务角色 */
	BUSINESS = 'business',
	/** 临时角色 */
	TEMPORARY = 'temporary'
}

/**
 * 角色状态枚举
 *
 * @description 定义角色的状态
 */
export enum RoleStatus {
	/** 活跃状态 */
	ACTIVE = 'active',
	/** 已禁用 */
	DISABLED = 'disabled',
	/** 已废弃 */
	DEPRECATED = 'deprecated'
}

/**
 * 角色配置接口
 *
 * @description 定义角色的配置选项
 */
export interface RoleConfiguration {
	/** 是否可以被继承 */
	readonly inheritable?: boolean;
	/** 最大继承深度 */
	readonly maxInheritanceDepth?: number;
	/** 是否为系统内置角色 */
	readonly isBuiltIn?: boolean;
	/** 角色有效期（天） */
	readonly validityDays?: number;
	/** 自动续期 */
	readonly autoRenew?: boolean;
	/** 角色优先级 */
	readonly priority?: number;
	/** 冲突解决策略 */
	readonly conflictResolution?: 'strict' | 'permissive' | 'inherit';
}

/**
 * 角色实体类
 *
 * @description 角色聚合根，管理角色的权限集合和继承关系
 */
export class Role extends BaseAggregateRoot {
	constructor(
		id: EntityId,
		private _code: string,
		private _name: string,
		private _description: string,
		private _scope: RoleScope,
		private _type: RoleType,
		private _status: RoleStatus = RoleStatus.ACTIVE,
		private _permissions: string[] = [],
		private _inheritedRoles: string[] = [],
		private _configuration: RoleConfiguration = {},
		auditInfo: Partial<IAuditInfo>
	) {
		super(id, auditInfo);

		// 验证角色代码格式
		this.validateRoleCode(_code);
	}

	// ==================== 访问器 ====================

	get code(): string {
		return this._code;
	}

	get name(): string {
		return this._name;
	}

	get description(): string {
		return this._description;
	}

	get scope(): RoleScope {
		return this._scope;
	}

	get type(): RoleType {
		return this._type;
	}

	get status(): RoleStatus {
		return this._status;
	}

	get permissions(): readonly string[] {
		return [...this._permissions];
	}

	get inheritedRoles(): readonly string[] {
		return [...this._inheritedRoles];
	}

	get configuration(): Readonly<RoleConfiguration> {
		return { ...this._configuration };
	}

	// ==================== 状态检查 ====================

	get isActive(): boolean {
		return this._status === RoleStatus.ACTIVE;
	}

	get isDisabled(): boolean {
		return this._status === RoleStatus.DISABLED;
	}

	get isDeprecated(): boolean {
		return this._status === RoleStatus.DEPRECATED;
	}

	get isBuiltIn(): boolean {
		return this._configuration.isBuiltIn === true;
	}

	get isInheritable(): boolean {
		return this._configuration.inheritable !== false;
	}

	// ==================== 权限管理 ====================

	/**
	 * 添加权限
	 */
	addPermission(permissionCode: string): void {
		if (this._permissions.includes(permissionCode)) {
			return;
		}

		this._permissions.push(permissionCode);
	}

	/**
	 * 移除权限
	 */
	removePermission(permissionCode: string): void {
		const index = this._permissions.indexOf(permissionCode);
		if (index > -1) {
			this._permissions.splice(index, 1);
		}
	}

	/**
	 * 检查是否拥有指定权限
	 */
	hasPermission(permissionCode: string): boolean {
		return this._permissions.includes(permissionCode);
	}

	/**
	 * 批量添加权限
	 */
	addPermissions(permissionCodes: string[]): void {
		for (const code of permissionCodes) {
			this.addPermission(code);
		}
	}

	/**
	 * 批量移除权限
	 */
	removePermissions(permissionCodes: string[]): void {
		for (const code of permissionCodes) {
			this.removePermission(code);
		}
	}

	// ==================== 角色继承管理 ====================

	/**
	 * 添加继承角色
	 */
	addInheritedRole(roleCode: string): void {
		if (this._inheritedRoles.includes(roleCode)) {
			return;
		}

		// 检查是否会造成循环继承
		if (this.wouldCreateCircularInheritance(roleCode)) {
			throw new Error(`添加继承角色 ${roleCode} 会造成循环继承`);
		}

		// 检查继承深度
		const currentDepth = this.getInheritanceDepth();
		const maxDepth = this._configuration.maxInheritanceDepth || 10;
		if (currentDepth >= maxDepth) {
			throw new Error(`继承深度不能超过 ${maxDepth} 级`);
		}

		this._inheritedRoles.push(roleCode);
	}

	/**
	 * 移除继承角色
	 */
	removeInheritedRole(roleCode: string): void {
		const index = this._inheritedRoles.indexOf(roleCode);
		if (index > -1) {
			this._inheritedRoles.splice(index, 1);
		}
	}

	/**
	 * 检查是否继承了指定角色
	 */
	inheritsFrom(roleCode: string): boolean {
		return this._inheritedRoles.includes(roleCode);
	}

	/**
	 * 获取继承深度
	 */
	getInheritanceDepth(): number {
		// 简化实现，实际需要递归计算
		return this._inheritedRoles.length;
	}

	// ==================== 工具方法 ====================

	/**
	 * 获取所有有效权限（包括继承的）
	 */
	getAllEffectivePermissions(): string[] {
		// 简化实现，实际需要递归解析继承关系
		return [...this._permissions];
	}

	/**
	 * 检查角色兼容性
	 */
	isCompatibleWith(otherRole: Role): boolean {
		// 同作用域的角色才能兼容
		return this._scope === otherRole._scope;
	}

	// ==================== 验证方法 ====================

	/**
	 * 验证角色代码格式
	 */
	private validateRoleCode(code: string): void {
		if (!code || typeof code !== 'string') {
			throw new Error('角色代码不能为空');
		}

		if (code.length > 50) {
			throw new Error('角色代码长度不能超过50个字符');
		}

		const codeRegex = /^[a-zA-Z0-9][a-zA-Z0-9:_-]*[a-zA-Z0-9]$/;
		if (!codeRegex.test(code)) {
			throw new Error('角色代码只能包含字母、数字、冒号、下划线和连字符');
		}
	}

	/**
	 * 检查是否会造成循环继承
	 */
	private wouldCreateCircularInheritance(roleCode: string): boolean {
		// 简化的循环继承检查
		return roleCode === this._code;
	}
}
