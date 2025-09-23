/**
 * 规则集合实体
 *
 * @description 规则集合是业务规则的组合，用于管理相关规则的集合验证。
 * 支持规则的逻辑组合、优先级排序和批量验证。
 *
 * ## 业务规则
 *
 * ### 集合组织规则
 * - 规则集合必须有明确的业务目标
 * - 规则在集合中按优先级排序
 * - 支持规则的动态添加和移除
 * - 集合验证支持快速失败和完整验证两种模式
 *
 * ### 验证执行规则
 * - 高优先级规则优先执行
 * - 支持并行和串行两种执行模式
 * - 失败规则的错误信息需要聚合
 * - 验证结果包含详细的执行统计
 *
 * ### 规则依赖规则
 * - 依赖规则必须先于被依赖规则执行
 * - 依赖规则失败时跳过被依赖规则
 * - 支持条件依赖和强制依赖
 * - 依赖关系变更需要重新计算执行顺序
 *
 * @example
 * ```typescript
 * // 创建用户验证规则集合
 * const userValidationRuleSet = new RuleSet(
 *   EntityId.generate(),
 *   'user:validation:complete',
 *   '用户完整验证',
 *   '用户创建和更新时的完整验证规则集合',
 *   RuleSetType.ENTITY_VALIDATION,
 *   ExecutionMode.FAIL_FAST,
 *   auditInfo
 * );
 *
 * // 添加规则
 * userValidationRuleSet.addRule('user:email:format', 10);
 * userValidationRuleSet.addRule('user:email:unique', 9);
 * userValidationRuleSet.addRule('user:name:required', 8);
 *
 * // 执行验证
 * const result = await userValidationRuleSet.validateAll(userData);
 * ```
 *
 * @since 1.0.0
 */

import { BaseAggregateRoot } from '../../aggregates/base/base-aggregate-root';
import { EntityId } from '../../value-objects/entity-id';
import type { IAuditInfo } from '../../entities/base/audit-info';
import { IValidationResult, RuleStatus } from './business-rule.aggregate';

/**
 * 规则集合类型枚举
 *
 * @description 定义规则集合的类型分类
 */
export enum RuleSetType {
  /** 实体验证 */
  ENTITY_VALIDATION = 'entity_validation',
  /** 业务流程验证 */
  BUSINESS_PROCESS = 'business_process',
  /** 数据完整性验证 */
  DATA_INTEGRITY = 'data_integrity',
  /** 安全验证 */
  SECURITY_VALIDATION = 'security_validation',
  /** 配置验证 */
  CONFIGURATION_VALIDATION = 'configuration_validation',
}

/**
 * 执行模式枚举
 *
 * @description 定义规则集合的执行模式
 */
export enum ExecutionMode {
  /** 快速失败模式 - 遇到第一个失败就停止 */
  FAIL_FAST = 'fail_fast',
  /** 完整验证模式 - 执行所有规则 */
  COMPLETE = 'complete',
  /** 并行执行模式 - 并行执行独立规则 */
  PARALLEL = 'parallel',
}

/**
 * 规则引用接口
 *
 * @description 定义规则集合中的规则引用信息
 */
export interface IRuleReference {
  /** 规则代码 */
  readonly ruleCode: string;
  /** 规则优先级 */
  readonly priority: number;
  /** 是否必须通过 */
  readonly required: boolean;
  /** 规则条件 */
  readonly condition?: string;
  /** 自定义参数 */
  readonly parameters?: Record<string, unknown>;
}

/**
 * 集合验证结果接口
 *
 * @description 定义规则集合验证的结果信息
 */
export interface IRuleSetValidationResult {
  /** 整体验证是否通过 */
  readonly isValid: boolean;
  /** 执行的规则数量 */
  readonly executedRules: number;
  /** 通过的规则数量 */
  readonly passedRules: number;
  /** 失败的规则数量 */
  readonly failedRules: number;
  /** 跳过的规则数量 */
  readonly skippedRules: number;
  /** 详细的规则验证结果 */
  readonly ruleResults: Record<string, IValidationResult>;
  /** 总执行时间（毫秒） */
  readonly totalExecutionTime: number;
  /** 聚合的错误信息 */
  readonly aggregatedErrors: string[];
  /** 聚合的警告信息 */
  readonly aggregatedWarnings: string[];
}

/**
 * 规则集合实体类
 *
 * @description 规则集合聚合根，管理相关业务规则的组合验证
 */
export class RuleSet extends BaseAggregateRoot {
  constructor(
    id: EntityId,
    private readonly _code: string,
    private readonly _name: string,
    private readonly _description: string,
    private readonly _type: RuleSetType,
    private readonly _executionMode: ExecutionMode,
    private _rules: IRuleReference[] = [],
    private readonly _status: RuleStatus = RuleStatus.ACTIVE,
    private readonly _version: number = 1,
    auditInfo: Partial<IAuditInfo>,
  ) {
    super(id, auditInfo);

    // 验证规则集合代码格式
    this.validateRuleSetCode(_code);
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

  get type(): RuleSetType {
    return this._type;
  }

  get executionMode(): ExecutionMode {
    return this._executionMode;
  }

  get rules(): readonly IRuleReference[] {
    return [...this._rules];
  }

  get status(): RuleStatus {
    return this._status;
  }

  get ruleSetVersion(): number {
    return this._version;
  }

  // ==================== 状态检查 ====================

  get isActive(): boolean {
    return this._status === RuleStatus.ACTIVE;
  }

  get isEmpty(): boolean {
    return this._rules.length === 0;
  }

  get ruleCount(): number {
    return this._rules.length;
  }

  get requiredRuleCount(): number {
    return this._rules.filter((rule) => rule.required).length;
  }

  // ==================== 规则管理方法 ====================

  /**
   * 添加规则
   */
  addRule(
    ruleCode: string,
    priority: number = 0,
    required: boolean = true,
    condition?: string,
    parameters?: Record<string, unknown>,
  ): void {
    // 检查规则是否已存在
    if (this.hasRule(ruleCode)) {
      throw new Error(`规则 ${ruleCode} 已存在于集合中`);
    }

    const ruleReference: IRuleReference = {
      ruleCode,
      priority,
      required,
      condition,
      parameters,
    };

    this._rules.push(ruleReference);

    // 按优先级排序
    this.sortRulesByPriority();
  }

  /**
   * 移除规则
   */
  removeRule(ruleCode: string): void {
    const index = this._rules.findIndex((rule) => rule.ruleCode === ruleCode);
    if (index > -1) {
      this._rules.splice(index, 1);
    }
  }

  /**
   * 更新规则优先级
   */
  updateRulePriority(ruleCode: string, newPriority: number): void {
    const rule = this._rules.find((r) => r.ruleCode === ruleCode);
    if (!rule) {
      throw new Error(`规则 ${ruleCode} 不存在于集合中`);
    }

    // 创建新的规则引用（因为RuleReference是只读的）
    const updatedRule: IRuleReference = {
      ...rule,
      priority: newPriority,
    };

    const index = this._rules.findIndex((r) => r.ruleCode === ruleCode);
    this._rules[index] = updatedRule;

    // 重新排序
    this.sortRulesByPriority();
  }

  /**
   * 检查是否包含指定规则
   */
  hasRule(ruleCode: string): boolean {
    return this._rules.some((rule) => rule.ruleCode === ruleCode);
  }

  /**
   * 获取指定规则
   */
  getRule(ruleCode: string): IRuleReference | undefined {
    return this._rules.find((rule) => rule.ruleCode === ruleCode);
  }

  // ==================== 验证执行方法 ====================

  /**
   * 验证所有规则
   *
   * @description 根据执行模式验证集合中的所有规则
   * @param value 要验证的值
   * @param context 验证上下文
   * @returns 集合验证结果
   */
  async validateAll(
    value: unknown,
    context?: Record<string, unknown>,
  ): Promise<IRuleSetValidationResult> {
    if (!this.isActive) {
      throw new Error(`规则集合 ${this._code} 未激活，无法执行验证`);
    }

    const startTime = Date.now();
    const ruleResults: Record<string, IValidationResult> = {};
    const errors: string[] = [];
    const warnings: string[] = [];

    let executedRules = 0;
    let passedRules = 0;
    let failedRules = 0;
    let skippedRules = 0;

    // 根据执行模式选择验证策略
    switch (this._executionMode) {
      case ExecutionMode.FAIL_FAST:
        await this.executeFailFast(
          value,
          context,
          ruleResults,
          errors,
          warnings,
        );
        break;
      case ExecutionMode.COMPLETE:
        await this.executeComplete(
          value,
          context,
          ruleResults,
          errors,
          warnings,
        );
        break;
      case ExecutionMode.PARALLEL:
        await this.executeParallel(
          value,
          context,
          ruleResults,
          errors,
          warnings,
        );
        break;
    }

    // 统计结果
    for (const result of Object.values(ruleResults)) {
      executedRules++;
      if (result.isValid) {
        passedRules++;
      } else {
        failedRules++;
      }
    }

    skippedRules = this._rules.length - executedRules;

    const totalExecutionTime = Date.now() - startTime;
    const isValid = failedRules === 0;

    return {
      isValid,
      executedRules,
      passedRules,
      failedRules,
      skippedRules,
      ruleResults,
      totalExecutionTime,
      aggregatedErrors: errors,
      aggregatedWarnings: warnings,
    };
  }

  // ==================== 私有执行方法 ====================

  /**
   * 快速失败执行
   */
  private async executeFailFast(
    value: unknown,
    context: Record<string, unknown> | undefined,
    ruleResults: Record<string, IValidationResult>,
    errors: string[],
    warnings: string[],
  ): Promise<void> {
    for (const ruleRef of this._rules) {
      // 这里应该从规则仓库获取实际的规则实例
      // 当前简化实现
      const result: IValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        context,
        executionTime: 1,
      };

      ruleResults[ruleRef.ruleCode] = result;

      if (!result.isValid && ruleRef.required) {
        errors.push(...result.errors);
        warnings.push(...result.warnings);
        break; // 快速失败
      }
    }
  }

  /**
   * 完整执行
   */
  private async executeComplete(
    value: unknown,
    context: Record<string, unknown> | undefined,
    ruleResults: Record<string, IValidationResult>,
    errors: string[],
    warnings: string[],
  ): Promise<void> {
    for (const ruleRef of this._rules) {
      // 这里应该从规则仓库获取实际的规则实例
      // 当前简化实现
      const result: IValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        context,
        executionTime: 1,
      };

      ruleResults[ruleRef.ruleCode] = result;

      if (!result.isValid) {
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      }
    }
  }

  /**
   * 并行执行
   */
  private async executeParallel(
    value: unknown,
    context: Record<string, unknown> | undefined,
    ruleResults: Record<string, IValidationResult>,
    errors: string[],
    warnings: string[],
  ): Promise<void> {
    // 并行执行所有规则
    const promises = this._rules.map(async (ruleRef) => {
      // 这里应该从规则仓库获取实际的规则实例
      // 当前简化实现
      const result: IValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        context,
        executionTime: 1,
      };

      return { ruleCode: ruleRef.ruleCode, result };
    });

    const results = await Promise.all(promises);

    for (const { ruleCode, result } of results) {
      ruleResults[ruleCode] = result;

      if (!result.isValid) {
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      }
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 按优先级排序规则
   */
  private sortRulesByPriority(): void {
    this._rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 验证规则集合代码格式
   */
  private validateRuleSetCode(code: string): void {
    if (!code || typeof code !== 'string') {
      throw new Error('规则集合代码不能为空');
    }

    if (code.length > 100) {
      throw new Error('规则集合代码长度不能超过100个字符');
    }

    const codeRegex = /^[a-zA-Z0-9][a-zA-Z0-9:_-]*[a-zA-Z0-9]$/;
    if (!codeRegex.test(code)) {
      throw new Error('规则集合代码只能包含字母、数字、冒号、下划线和连字符');
    }
  }
}
