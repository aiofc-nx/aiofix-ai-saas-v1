/**
 * 业务规则实体
 *
 * @description 定义系统中的业务规则实体，用于实现复杂的业务逻辑验证
 *
 * ## 业务规则
 *
 * ### 规则定义规则
 * - 规则必须具有唯一的标识符
 * - 规则名称在租户内必须唯一
 * - 规则必须指定类型和作用域
 * - 规则状态必须是有效的枚举值
 *
 * ### 规则执行规则
 * - 规则可以包含条件和动作
 * - 规则支持优先级排序
 * - 规则可以组合成规则集
 * - 规则执行结果可以被缓存
 *
 * ### 规则验证规则
 * - 规则表达式必须是有效的
 * - 规则条件不能形成死循环
 * - 规则动作必须是安全的
 * - 规则执行时间不能超过限制
 *
 * @example
 * ```typescript
 * const rule = new BusinessRule(
 *   EntityId.generate(),
 *   'user-age-validation',
 *   '用户年龄验证规则',
 *   RuleType.VALIDATION,
 *   RuleScope.USER,
 *   'age >= 18',
 *   'throw new Error("用户年龄必须大于等于18岁")',
 *   RuleStatus.ACTIVE
 * );
 * ```
 *
 * @since 1.0.0
 */

import { BaseEntity } from '../../entities/base/base-entity';
import { EntityId } from '../../value-objects/entity-id';
import { IAuditInfo } from '../../entities/base/audit-info';

/**
 * 规则类型枚举
 */
export enum RuleType {
	/** 验证规则 */
	VALIDATION = 'validation',
	/** 转换规则 */
	TRANSFORMATION = 'transformation',
	/** 计算规则 */
	CALCULATION = 'calculation',
	/** 授权规则 */
	AUTHORIZATION = 'authorization',
	/** 审计规则 */
	AUDIT = 'audit',
	/** 通知规则 */
	NOTIFICATION = 'notification'
}

/**
 * 规则作用域枚举
 */
export enum RuleScope {
	/** 系统级规则 */
	SYSTEM = 'system',
	/** 租户级规则 */
	TENANT = 'tenant',
	/** 组织级规则 */
	ORGANIZATION = 'organization',
	/** 部门级规则 */
	DEPARTMENT = 'department',
	/** 用户级规则 */
	USER = 'user',
	/** 资源级规则 */
	RESOURCE = 'resource',
	/** 流程级规则 */
	PROCESS = 'process'
}

/**
 * 规则状态枚举
 */
export enum RuleStatus {
	/** 活跃状态 */
	ACTIVE = 'active',
	/** 禁用状态 */
	DISABLED = 'disabled',
	/** 测试状态 */
	TESTING = 'testing',
	/** 过期状态 */
	EXPIRED = 'expired',
	/** 待审核状态 */
	PENDING = 'pending'
}

/**
 * 业务规则实体
 */
export class BusinessRule extends BaseEntity {
	private readonly _name: string;
	private readonly _description: string;
	private readonly _type: RuleType;
	private readonly _scope: RuleScope;
	private readonly _condition: string;
	private readonly _action: string;
	private readonly _status: RuleStatus;
	private readonly _priority: number;
	private readonly _version: string;
	private readonly _tags: string[];
	private readonly _parameters?: Record<string, unknown>;
	private readonly _metadata?: Record<string, unknown>;

	/**
	 * 构造函数
	 *
	 * @param id - 规则标识符
	 * @param name - 规则名称
	 * @param description - 规则描述
	 * @param type - 规则类型
	 * @param scope - 规则作用域
	 * @param condition - 规则条件表达式
	 * @param action - 规则动作表达式
	 * @param status - 规则状态
	 * @param priority - 规则优先级
	 * @param version - 规则版本
	 * @param tags - 规则标签
	 * @param parameters - 规则参数
	 * @param metadata - 规则元数据
	 * @param auditInfo - 审计信息
	 */
	constructor(
		id: EntityId,
		name: string,
		description: string,
		type: RuleType,
		scope: RuleScope,
		condition: string,
		action: string,
		status: RuleStatus,
		priority: number = 0,
		version: string = '1.0.0',
		tags: string[] = [],
		parameters?: Record<string, unknown>,
		metadata?: Record<string, unknown>,
		auditInfo?: IAuditInfo
	) {
		super(id, auditInfo || {});

		this._name = name;
		this._description = description;
		this._type = type;
		this._scope = scope;
		this._condition = condition;
		this._action = action;
		this._status = status;
		this._priority = priority;
		this._version = version;
		this._tags = [...tags];
		this._parameters = parameters ? { ...parameters } : undefined;
		this._metadata = metadata ? { ...metadata } : undefined;

		this.validateRule();
	}

	/**
	 * 获取规则名称
	 */
	get name(): string {
		return this._name;
	}

	/**
	 * 获取规则描述
	 */
	get description(): string {
		return this._description;
	}

	/**
	 * 获取规则类型
	 */
	get type(): RuleType {
		return this._type;
	}

	/**
	 * 获取规则作用域
	 */
	get scope(): RuleScope {
		return this._scope;
	}

	/**
	 * 获取规则条件表达式
	 */
	get condition(): string {
		return this._condition;
	}

	/**
	 * 获取规则动作表达式
	 */
	get action(): string {
		return this._action;
	}

	/**
	 * 获取规则状态
	 */
	get status(): RuleStatus {
		return this._status;
	}

	/**
	 * 获取规则优先级
	 */
	get priority(): number {
		return this._priority;
	}

	/**
	 * 获取规则版本
	 */
	get ruleVersion(): string {
		return this._version;
	}

	/**
	 * 获取规则标签
	 */
	get tags(): readonly string[] {
		return [...this._tags];
	}

	/**
	 * 获取规则参数
	 */
	get parameters(): Record<string, unknown> | undefined {
		return this._parameters ? { ...this._parameters } : undefined;
	}

	/**
	 * 获取规则元数据
	 */
	get metadata(): Record<string, unknown> | undefined {
		return this._metadata ? { ...this._metadata } : undefined;
	}

	/**
	 * 检查规则是否活跃
	 */
	isActive(): boolean {
		return this._status === RuleStatus.ACTIVE;
	}

	/**
	 * 检查规则是否适用于指定作用域
	 *
	 * @param scope - 作用域
	 * @returns 如果规则适用于该作用域返回true，否则返回false
	 */
	appliesToScope(scope: RuleScope): boolean {
		return this._scope === scope;
	}

	/**
	 * 检查规则是否包含指定标签
	 *
	 * @param tag - 标签
	 * @returns 如果规则包含该标签返回true，否则返回false
	 */
	hasTag(tag: string): boolean {
		return this._tags.includes(tag);
	}

	/**
	 * 检查规则是否具有指定类型
	 *
	 * @param type - 规则类型
	 * @returns 如果规则具有该类型返回true，否则返回false
	 */
	isOfType(type: RuleType): boolean {
		return this._type === type;
	}

	/**
	 * 比较规则优先级
	 *
	 * @param other - 其他规则
	 * @returns 如果当前规则优先级更高返回正数，相等返回0，否则返回负数
	 */
	comparePriority(other: BusinessRule): number {
		return this._priority - other._priority;
	}

	/**
	 * 验证规则
	 *
	 * @throws {Error} 当规则验证失败时
	 */
	private validateRule(): void {
		if (!this._name || this._name.trim().length === 0) {
			throw new Error('规则名称不能为空');
		}

		if (!this._description || this._description.trim().length === 0) {
			throw new Error('规则描述不能为空');
		}

		if (!Object.values(RuleType).includes(this._type)) {
			throw new Error(`无效的规则类型: ${this._type}`);
		}

		if (!Object.values(RuleScope).includes(this._scope)) {
			throw new Error(`无效的规则作用域: ${this._scope}`);
		}

		if (!Object.values(RuleStatus).includes(this._status)) {
			throw new Error(`无效的规则状态: ${this._status}`);
		}

		if (!this._condition || this._condition.trim().length === 0) {
			throw new Error('规则条件不能为空');
		}

		if (!this._action || this._action.trim().length === 0) {
			throw new Error('规则动作不能为空');
		}

		if (typeof this._priority !== 'number' || this._priority < 0) {
			throw new Error('规则优先级必须是非负数');
		}

		if (!this._version || this._version.trim().length === 0) {
			throw new Error('规则版本不能为空');
		}

		// 验证标签不能为空
		for (const tag of this._tags) {
			if (!tag || tag.trim().length === 0) {
				throw new Error('规则标签不能为空');
			}
		}
	}

	/**
	 * 创建规则副本
	 *
	 * @param updates - 更新参数
	 * @returns 新的规则实例
	 */
	clone(
		updates: Partial<{
			name: string;
			description: string;
			type: RuleType;
			scope: RuleScope;
			condition: string;
			action: string;
			status: RuleStatus;
			priority: number;
			version: string;
			tags: string[];
			parameters: Record<string, unknown>;
			metadata: Record<string, unknown>;
		}>
	): BusinessRule {
		return new BusinessRule(
			this.id,
			updates.name ?? this._name,
			updates.description ?? this._description,
			updates.type ?? this._type,
			updates.scope ?? this._scope,
			updates.condition ?? this._condition,
			updates.action ?? this._action,
			updates.status ?? this._status,
			updates.priority ?? this._priority,
			updates.version ?? this._version,
			updates.tags ?? this._tags,
			updates.parameters ?? this._parameters,
			updates.metadata ?? this._metadata,
			this.auditInfo
		);
	}

	/**
	 * 转换为JSON对象
	 *
	 * @returns 规则的JSON表示
	 */
	override toJSON(): Record<string, unknown> {
		return {
			id: this.id.value,
			name: this._name,
			description: this._description,
			type: this._type,
			scope: this._scope,
			condition: this._condition,
			action: this._action,
			status: this._status,
			priority: this._priority,
			version: this._version,
			tags: [...this._tags],
			parameters: this._parameters,
			metadata: this._metadata,
			auditInfo: this.auditInfo
		};
	}

	/**
	 * 从JSON对象创建规则实例
	 *
	 * @param json - JSON对象
	 * @returns 规则实例
	 */
	static fromJSON(json: Record<string, unknown>): BusinessRule {
		return new BusinessRule(
			EntityId.fromString(json.id as string),
			json.name as string,
			json.description as string,
			json.type as RuleType,
			json.scope as RuleScope,
			json.condition as string,
			json.action as string,
			json.status as RuleStatus,
			json.priority as number,
			json.version as string,
			json.tags as string[],
			json.parameters as Record<string, unknown>,
			json.metadata as Record<string, unknown>,
			json.auditInfo as IAuditInfo
		);
	}
}
