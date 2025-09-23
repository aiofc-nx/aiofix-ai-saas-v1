/**
 * 业务规则实体
 *
 * @description 业务规则是领域层的核心概念，封装了业务逻辑的约束条件和验证规则。
 * 业务规则确保数据的完整性和业务逻辑的一致性。
 *
 * ## 业务规则
 *
 * ### 规则标识规则
 * - 规则代码必须全局唯一
 * - 规则代码采用层级结构：领域:实体:规则名
 * - 规则名称必须清晰描述业务约束
 * - 规则版本支持演进和兼容性管理
 *
 * ### 规则验证规则
 * - 规则必须是确定性的（相同输入产生相同结果）
 * - 规则验证不能有副作用
 * - 规则支持同步和异步验证
 * - 规则失败时必须提供明确的错误信息
 *
 * ### 规则组合规则
 * - 支持规则的逻辑组合（AND、OR、NOT）
 * - 组合规则支持短路求值优化
 * - 复合规则的错误信息需要聚合
 * - 规则依赖关系必须是有向无环图
 *
 * @example
 * ```typescript
 * // 创建简单业务规则
 * const emailRule = new BusinessRule(
 *   EntityId.generate(),
 *   'user:email:format',
 *   '邮箱格式验证',
 *   '验证邮箱地址格式是否正确',
 *   RuleType.FORMAT_VALIDATION,
 *   RuleScope.FIELD,
 *   (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
 *   auditInfo
 * );
 *
 * // 创建复合业务规则
 * const userCreationRule = new BusinessRule(
 *   EntityId.generate(),
 *   'user:creation:complete',
 *   '用户创建完整性验证',
 *   '验证用户创建时的所有必要信息',
 *   RuleType.BUSINESS_LOGIC,
 *   RuleScope.ENTITY,
 *   (userData) => {
 *     return userData.email && userData.name && userData.tenantId;
 *   },
 *   auditInfo
 * );
 *
 * // 验证规则
 * const isValid = emailRule.validate('user@example.com');
 * const result = userCreationRule.validateWithDetails({ email: 'test@example.com', name: 'Test' });
 * ```
 *
 * @since 1.0.0
 */

import { BaseAggregateRoot } from '../../aggregates/base/base-aggregate-root';
import { EntityId } from '../../value-objects/entity-id';
import type { IAuditInfo } from '../../entities/base/audit-info';

/**
 * 规则类型枚举
 *
 * @description 定义业务规则的类型分类
 */
export enum RuleType {
  /** 格式验证规则 */
  FORMAT_VALIDATION = 'format_validation',
  /** 业务逻辑规则 */
  BUSINESS_LOGIC = 'business_logic',
  /** 数据完整性规则 */
  DATA_INTEGRITY = 'data_integrity',
  /** 权限验证规则 */
  PERMISSION_CHECK = 'permission_check',
  /** 配额限制规则 */
  QUOTA_LIMIT = 'quota_limit',
  /** 时间约束规则 */
  TIME_CONSTRAINT = 'time_constraint',
  /** 依赖关系规则 */
  DEPENDENCY_CHECK = 'dependency_check',
}

/**
 * 规则作用域枚举
 *
 * @description 定义业务规则的作用范围
 */
export enum RuleScope {
  /** 字段级规则 */
  FIELD = 'field',
  /** 实体级规则 */
  ENTITY = 'entity',
  /** 聚合级规则 */
  AGGREGATE = 'aggregate',
  /** 服务级规则 */
  SERVICE = 'service',
  /** 系统级规则 */
  SYSTEM = 'system',
}

/**
 * 规则状态枚举
 *
 * @description 定义业务规则的状态
 */
export enum RuleStatus {
  /** 活跃状态 */
  ACTIVE = 'active',
  /** 已禁用 */
  DISABLED = 'disabled',
  /** 测试中 */
  TESTING = 'testing',
  /** 已废弃 */
  DEPRECATED = 'deprecated',
}

/**
 * 验证结果接口
 *
 * @description 定义规则验证的结果信息
 */
export interface IValidationResult {
  /** 验证是否通过 */
  readonly isValid: boolean;
  /** 错误信息列表 */
  readonly errors: string[];
  /** 警告信息列表 */
  readonly warnings: string[];
  /** 验证上下文信息 */
  readonly context?: Record<string, unknown>;
  /** 验证执行时间（毫秒） */
  readonly executionTime?: number;
}

/**
 * 规则验证函数类型
 *
 * @description 定义规则验证函数的签名
 */
export type RuleValidationFunction = (
  value: unknown,
  context?: Record<string, unknown>,
) => boolean | Promise<boolean>;

/**
 * 规则详细验证函数类型
 *
 * @description 定义返回详细验证结果的函数签名
 */
export type RuleDetailedValidationFunction = (
  value: unknown,
  context?: Record<string, unknown>,
) => IValidationResult | Promise<IValidationResult>;

/**
 * 业务规则实体类
 *
 * @description 业务规则聚合根，封装业务逻辑的验证和约束
 */
export class BusinessRule extends BaseAggregateRoot {
  constructor(
    id: EntityId,
    private readonly _code: string,
    private readonly _name: string,
    private readonly _description: string,
    private readonly _type: RuleType,
    private readonly _scope: RuleScope,
    private readonly _validationFunction: RuleValidationFunction,
    private _status: RuleStatus = RuleStatus.ACTIVE,
    private readonly _version: number = 1,
    private _priority: number = 0,
    private readonly _dependencies: string[] = [],
    private readonly _metadata: Record<string, unknown> = {},
    auditInfo: Partial<IAuditInfo>,
  ) {
    super(id, auditInfo);

    // 验证规则代码格式
    this.validateRuleCode(_code);

    // 验证验证函数
    this.validateValidationFunction(_validationFunction);
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

  get type(): RuleType {
    return this._type;
  }

  get scope(): RuleScope {
    return this._scope;
  }

  get status(): RuleStatus {
    return this._status;
  }

  get ruleVersion(): number {
    return this._version;
  }

  get priority(): number {
    return this._priority;
  }

  get dependencies(): readonly string[] {
    return [...this._dependencies];
  }

  get metadata(): Readonly<Record<string, unknown>> {
    return { ...this._metadata };
  }

  // ==================== 状态检查 ====================

  get isActive(): boolean {
    return this._status === RuleStatus.ACTIVE;
  }

  get isDisabled(): boolean {
    return this._status === RuleStatus.DISABLED;
  }

  get isTesting(): boolean {
    return this._status === RuleStatus.TESTING;
  }

  get isDeprecated(): boolean {
    return this._status === RuleStatus.DEPRECATED;
  }

  // ==================== 验证方法 ====================

  /**
   * 验证值
   *
   * @description 使用业务规则验证给定的值
   * @param value 要验证的值
   * @param context 验证上下文
   * @returns 验证是否通过
   */
  async validateValue(
    value: unknown,
    context?: Record<string, unknown>,
  ): Promise<boolean> {
    if (!this.isActive) {
      throw new Error(`规则 ${this._code} 未激活，无法执行验证`);
    }

    try {
      const result = await this._validationFunction(value, context);
      return result;
    } catch (error) {
      throw new Error(`规则验证执行失败: ${error}`);
    }
  }

  /**
   * 详细验证
   *
   * @description 执行详细验证并返回完整的验证结果
   * @param value 要验证的值
   * @param context 验证上下文
   * @returns 详细验证结果
   */
  async validateWithDetails(
    value: unknown,
    context?: Record<string, unknown>,
  ): Promise<IValidationResult> {
    if (!this.isActive) {
      return {
        isValid: false,
        errors: [`规则 ${this._code} 未激活`],
        warnings: [],
        context,
      };
    }

    const startTime = Date.now();

    try {
      const isValid = await this._validationFunction(value, context);
      const executionTime = Date.now() - startTime;

      return {
        isValid,
        errors: isValid ? [] : [`规则 ${this._code} 验证失败`],
        warnings: [],
        context,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        isValid: false,
        errors: [`规则验证执行失败: ${error}`],
        warnings: [],
        context,
        executionTime,
      };
    }
  }

  // ==================== 规则管理方法 ====================

  /**
   * 启用规则
   */
  enable(): void {
    if (this._status === RuleStatus.ACTIVE) {
      return;
    }

    this._status = RuleStatus.ACTIVE;
  }

  /**
   * 禁用规则
   */
  disable(reason: string): void {
    this._status = RuleStatus.DISABLED;
    this._metadata.disableReason = reason;
    this._metadata.disabledAt = new Date();
  }

  /**
   * 设置为测试状态
   */
  setTesting(): void {
    this._status = RuleStatus.TESTING;
    this._metadata.testingStartedAt = new Date();
  }

  /**
   * 废弃规则
   */
  deprecate(reason: string, replacementRuleCode?: string): void {
    this._status = RuleStatus.DEPRECATED;
    this._metadata.deprecationReason = reason;
    this._metadata.deprecatedAt = new Date();

    if (replacementRuleCode) {
      this._metadata.replacementRule = replacementRuleCode;
    }
  }

  /**
   * 更新优先级
   */
  updatePriority(newPriority: number): void {
    if (newPriority < 0 || newPriority > 1000) {
      throw new Error('优先级必须在0-1000之间');
    }

    this._priority = newPriority;
  }

  /**
   * 添加依赖规则
   */
  addDependency(ruleCode: string): void {
    if (this._dependencies.includes(ruleCode)) {
      return;
    }

    if (this.wouldCreateCircularDependency(ruleCode)) {
      throw new Error(`添加依赖 ${ruleCode} 会造成循环依赖`);
    }

    this._dependencies.push(ruleCode);
  }

  /**
   * 移除依赖规则
   */
  removeDependency(ruleCode: string): void {
    const index = this._dependencies.indexOf(ruleCode);
    if (index > -1) {
      this._dependencies.splice(index, 1);
    }
  }

  // ==================== 验证方法 ====================

  /**
   * 验证规则代码格式
   */
  private validateRuleCode(code: string): void {
    if (!code || typeof code !== 'string') {
      throw new Error('规则代码不能为空');
    }

    if (code.length > 100) {
      throw new Error('规则代码长度不能超过100个字符');
    }

    const codeRegex = /^[a-zA-Z0-9][a-zA-Z0-9:_-]*[a-zA-Z0-9]$/;
    if (!codeRegex.test(code)) {
      throw new Error('规则代码只能包含字母、数字、冒号、下划线和连字符');
    }

    // 验证层级结构
    const parts = code.split(':');
    if (parts.length < 2 || parts.length > 5) {
      throw new Error('规则代码必须包含2-5个层级');
    }
  }

  /**
   * 验证验证函数
   */
  private validateValidationFunction(fn: RuleValidationFunction): void {
    if (typeof fn !== 'function') {
      throw new Error('验证函数必须是一个函数');
    }

    // 检查函数参数数量
    if (fn.length < 1 || fn.length > 2) {
      throw new Error('验证函数必须接受1-2个参数');
    }
  }

  /**
   * 检查是否会造成循环依赖
   */
  private wouldCreateCircularDependency(ruleCode: string): boolean {
    // 简化的循环依赖检查
    return ruleCode === this._code;
  }
}
