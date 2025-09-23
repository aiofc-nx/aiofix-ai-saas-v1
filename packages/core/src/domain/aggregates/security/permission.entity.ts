/**
 * 权限实体
 *
 * @description 定义系统中的权限实体，用于控制用户对资源的访问权限
 *
 * ## 业务规则
 *
 * ### 权限定义规则
 * - 权限必须具有唯一的标识符
 * - 权限名称在租户内必须唯一
 * - 权限必须指定作用域和类型
 * - 权限状态必须是有效的枚举值
 *
 * ### 权限继承规则
 * - 权限可以继承自其他权限
 * - 继承关系不能形成循环
 * - 子权限自动获得父权限的所有能力
 *
 * ### 权限验证规则
 * - 权限验证基于作用域和资源类型
 * - 权限验证考虑用户角色和上下文
 * - 权限验证支持动态条件判断
 *
 * @example
 * ```typescript
 * const permission = new Permission(
 *   EntityId.generate(),
 *   'user:read',
 *   '用户读取权限',
 *   PermissionType.READ,
 *   PermissionScope.RESOURCE,
 *   ['user'],
 *   PermissionStatus.ACTIVE
 * );
 * ```
 *
 * @since 1.0.0
 */

import { BaseEntity } from '../../entities/base/base-entity';
import { EntityId } from '../../value-objects/entity-id';
import { IAuditInfo } from '../../entities/base/audit-info';

/**
 * 权限类型枚举
 */
export enum PermissionType {
	/** 读取权限 */
	READ = 'read',
	/** 写入权限 */
	WRITE = 'write',
	/** 删除权限 */
	DELETE = 'delete',
	/** 执行权限 */
	EXECUTE = 'execute',
	/** 管理权限 */
	ADMIN = 'admin'
}

/**
 * 权限作用域枚举
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
	/** 用户级权限 */
	USER = 'user'
}

/**
 * 权限状态枚举
 */
export enum PermissionStatus {
	/** 活跃状态 */
	ACTIVE = 'active',
	/** 禁用状态 */
	DISABLED = 'disabled',
	/** 过期状态 */
	EXPIRED = 'expired',
	/** 待审核状态 */
	PENDING = 'pending'
}

/**
 * 权限实体
 */
export class Permission extends BaseEntity {
	private readonly _name: string;
	private readonly _description: string;
	private readonly _type: PermissionType;
	private readonly _scope: PermissionScope;
	private readonly _resourceTypes: string[];
	private readonly _status: PermissionStatus;
	private readonly _parentPermissionId?: EntityId;
	private readonly _conditions?: Record<string, unknown>;
	private readonly _metadata?: Record<string, unknown>;

	/**
	 * 构造函数
	 *
	 * @param id - 权限标识符
	 * @param name - 权限名称
	 * @param description - 权限描述
	 * @param type - 权限类型
	 * @param scope - 权限作用域
	 * @param resourceTypes - 资源类型列表
	 * @param status - 权限状态
	 * @param parentPermissionId - 父权限标识符
	 * @param conditions - 权限条件
	 * @param metadata - 权限元数据
	 * @param auditInfo - 审计信息
	 */
	constructor(
		id: EntityId,
		name: string,
		description: string,
		type: PermissionType,
		scope: PermissionScope,
		resourceTypes: string[],
		status: PermissionStatus,
		parentPermissionId?: EntityId,
		conditions?: Record<string, unknown>,
		metadata?: Record<string, unknown>,
		auditInfo?: IAuditInfo
	) {
		super(id, auditInfo || {});

		this._name = name;
		this._description = description;
		this._type = type;
		this._scope = scope;
		this._resourceTypes = [...resourceTypes];
		this._status = status;
		this._parentPermissionId = parentPermissionId;
		this._conditions = conditions ? { ...conditions } : undefined;
		this._metadata = metadata ? { ...metadata } : undefined;

		this.validatePermission();
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
	 * 获取权限类型
	 */
	get type(): PermissionType {
		return this._type;
	}

	/**
	 * 获取权限作用域
	 */
	get scope(): PermissionScope {
		return this._scope;
	}

	/**
	 * 获取资源类型列表
	 */
	get resourceTypes(): readonly string[] {
		return [...this._resourceTypes];
	}

	/**
	 * 获取权限状态
	 */
	get status(): PermissionStatus {
		return this._status;
	}

	/**
	 * 获取父权限标识符
	 */
	get parentPermissionId(): EntityId | undefined {
		return this._parentPermissionId;
	}

	/**
	 * 获取权限条件
	 */
	get conditions(): Record<string, unknown> | undefined {
		return this._conditions ? { ...this._conditions } : undefined;
	}

	/**
	 * 获取权限元数据
	 */
	get metadata(): Record<string, unknown> | undefined {
		return this._metadata ? { ...this._metadata } : undefined;
	}

	/**
	 * 检查权限是否活跃
	 */
	isActive(): boolean {
		return this._status === PermissionStatus.ACTIVE;
	}

	/**
	 * 检查权限是否适用于指定资源类型
	 *
	 * @param resourceType - 资源类型
	 * @returns 如果权限适用于该资源类型返回true，否则返回false
	 */
	appliesToResourceType(resourceType: string): boolean {
		return this._resourceTypes.includes(resourceType);
	}

	/**
	 * 检查权限是否适用于指定作用域
	 *
	 * @param scope - 作用域
	 * @returns 如果权限适用于该作用域返回true，否则返回false
	 */
	appliesToScope(scope: PermissionScope): boolean {
		return this._scope === scope;
	}

	/**
	 * 检查权限是否包含指定类型
	 *
	 * @param type - 权限类型
	 * @returns 如果权限包含该类型返回true，否则返回false
	 */
	includesType(type: PermissionType): boolean {
		// 管理权限包含所有类型
		if (this._type === PermissionType.ADMIN) {
			return true;
		}

		// 写入权限包含读取权限
		if (this._type === PermissionType.WRITE && type === PermissionType.READ) {
			return true;
		}

		// 精确匹配
		return this._type === type;
	}

	/**
	 * 验证权限
	 *
	 * @throws {Error} 当权限验证失败时
	 */
	private validatePermission(): void {
		if (!this._name || this._name.trim().length === 0) {
			throw new Error('权限名称不能为空');
		}

		if (!this._description || this._description.trim().length === 0) {
			throw new Error('权限描述不能为空');
		}

		if (!Object.values(PermissionType).includes(this._type)) {
			throw new Error(`无效的权限类型: ${this._type}`);
		}

		if (!Object.values(PermissionScope).includes(this._scope)) {
			throw new Error(`无效的权限作用域: ${this._scope}`);
		}

		if (!Object.values(PermissionStatus).includes(this._status)) {
			throw new Error(`无效的权限状态: ${this._status}`);
		}

		if (this._resourceTypes.length === 0) {
			throw new Error('权限必须指定至少一个资源类型');
		}

		// 验证资源类型不能为空
		for (const resourceType of this._resourceTypes) {
			if (!resourceType || resourceType.trim().length === 0) {
				throw new Error('资源类型不能为空');
			}
		}
	}

	/**
	 * 创建权限副本
	 *
	 * @param updates - 更新参数
	 * @returns 新的权限实例
	 */
	clone(
		updates: Partial<{
			name: string;
			description: string;
			type: PermissionType;
			scope: PermissionScope;
			resourceTypes: string[];
			status: PermissionStatus;
			parentPermissionId: EntityId;
			conditions: Record<string, unknown>;
			metadata: Record<string, unknown>;
		}>
	): Permission {
		return new Permission(
			this.id,
			updates.name ?? this._name,
			updates.description ?? this._description,
			updates.type ?? this._type,
			updates.scope ?? this._scope,
			updates.resourceTypes ?? this._resourceTypes,
			updates.status ?? this._status,
			updates.parentPermissionId ?? this._parentPermissionId,
			updates.conditions ?? this._conditions,
			updates.metadata ?? this._metadata,
			this.auditInfo
		);
	}

	/**
	 * 转换为JSON对象
	 *
	 * @returns 权限的JSON表示
	 */
	override toJSON(): Record<string, unknown> {
		return {
			id: this.id.value,
			name: this._name,
			description: this._description,
			type: this._type,
			scope: this._scope,
			resourceTypes: [...this._resourceTypes],
			status: this._status,
			parentPermissionId: this._parentPermissionId?.value,
			conditions: this._conditions,
			metadata: this._metadata,
			auditInfo: this.auditInfo
		};
	}

	/**
	 * 从JSON对象创建权限实例
	 *
	 * @param json - JSON对象
	 * @returns 权限实例
	 */
	static fromJSON(json: Record<string, unknown>): Permission {
		return new Permission(
			EntityId.fromString(json.id as string),
			json.name as string,
			json.description as string,
			json.type as PermissionType,
			json.scope as PermissionScope,
			json.resourceTypes as string[],
			json.status as PermissionStatus,
			json.parentPermissionId ? EntityId.fromString(json.parentPermissionId as string) : undefined,
			json.conditions as Record<string, unknown>,
			json.metadata as Record<string, unknown>,
			json.auditInfo as IAuditInfo
		);
	}
}
