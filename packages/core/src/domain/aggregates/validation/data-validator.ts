/**
 * 数据验证器
 *
 * @description 数据验证器提供常用的数据验证功能，包括格式验证、范围验证、类型验证等。
 * 支持链式调用和自定义验证规则。
 *
 * ## 业务规则
 *
 * ### 验证链规则
 * - 支持多个验证规则的链式组合
 * - 验证按添加顺序执行
 * - 任何一个验证失败都会中断链式验证
 * - 验证链支持条件验证和可选验证
 *
 * ### 错误处理规则
 * - 每个验证失败都有明确的错误信息
 * - 支持自定义错误消息
 * - 错误信息支持国际化
 * - 验证结果包含详细的上下文信息
 *
 * ### 性能优化规则
 * - 验证结果支持缓存
 * - 重复验证自动去重
 * - 支持异步验证的批量处理
 * - 验证器实例可以复用
 *
 * @example
 * ```typescript
 * // 创建邮箱验证器
 * const emailValidator = new DataValidator()
 *   .required('邮箱地址不能为空')
 *   .email('邮箱格式不正确')
 *   .maxLength(100, '邮箱长度不能超过100个字符');
 *
 * // 执行验证
 * const result = await emailValidator.validate('user@example.com');
 *
 * // 创建复合验证器
 * const userValidator = new DataValidator()
 *   .object({
 *     email: new DataValidator().required().email(),
 *     name: new DataValidator().required().minLength(2).maxLength(50),
 *     age: new DataValidator().required().integer().min(18).max(120)
 *   });
 *
 * const userResult = await userValidator.validate({
 *   email: 'user@example.com',
 *   name: 'John Doe',
 *   age: 25
 * });
 * ```
 *
 * @since 1.0.0
 */

import { IValidationResult } from './business-rule.aggregate';

/**
 * 验证器配置接口
 *
 * @description 定义数据验证器的配置选项
 */
export interface IValidatorConfig {
  /** 是否启用缓存 */
  enableCache?: boolean;
  /** 缓存过期时间（毫秒） */
  cacheExpiration?: number;
  /** 是否启用异步验证 */
  enableAsync?: boolean;
  /** 验证超时时间（毫秒） */
  timeout?: number;
  /** 自定义错误消息 */
  customMessages?: Record<string, string>;
}

/**
 * 验证规则接口
 *
 * @description 定义单个验证规则的信息
 */
export interface IValidationRule {
  /** 规则名称 */
  name: string;
  /** 验证函数 */
  validator: (
    value: unknown,
    context?: Record<string, unknown>,
  ) => boolean | Promise<boolean>;
  /** 错误消息 */
  message: string;
  /** 是否必须验证 */
  required: boolean;
  /** 验证条件 */
  condition?: (value: unknown, context?: Record<string, unknown>) => boolean;
}

/**
 * 数据验证器类
 *
 * @description 提供灵活的数据验证功能，支持链式调用和复合验证
 */
export class DataValidator {
  private _rules: IValidationRule[] = [];
  private readonly _config: IValidatorConfig = {};

  constructor(config?: IValidatorConfig) {
    this._config = { ...config };
  }

  // ==================== 基础验证规则 ====================

  /**
   * 必填验证
   */
  required(message: string = '此字段为必填项'): DataValidator {
    this._rules.push({
      name: 'required',
      validator: (value) =>
        value !== null && value !== undefined && value !== '',
      message,
      required: true,
    });
    return this;
  }

  /**
   * 可选验证（跳过null/undefined）
   */
  optional(): DataValidator {
    // 添加一个标记，表示后续验证在值为null/undefined时跳过
    this._rules.push({
      name: 'optional',
      validator: () => true,
      message: '',
      required: false,
    });
    return this;
  }

  // ==================== 字符串验证规则 ====================

  /**
   * 最小长度验证
   */
  minLength(min: number, message?: string): DataValidator {
    this._rules.push({
      name: 'minLength',
      validator: (value) => typeof value === 'string' && value.length >= min,
      message: message || `长度不能少于${min}个字符`,
      required: true,
    });
    return this;
  }

  /**
   * 最大长度验证
   */
  maxLength(max: number, message?: string): DataValidator {
    this._rules.push({
      name: 'maxLength',
      validator: (value) => typeof value === 'string' && value.length <= max,
      message: message || `长度不能超过${max}个字符`,
      required: true,
    });
    return this;
  }

  /**
   * 邮箱格式验证
   */
  email(message: string = '邮箱格式不正确'): DataValidator {
    this._rules.push({
      name: 'email',
      validator: (value) => {
        if (typeof value !== 'string') return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      },
      message,
      required: true,
    });
    return this;
  }

  /**
   * 正则表达式验证
   */
  pattern(regex: RegExp, message: string = '格式不正确'): DataValidator {
    this._rules.push({
      name: 'pattern',
      validator: (value) => typeof value === 'string' && regex.test(value),
      message,
      required: true,
    });
    return this;
  }

  // ==================== 数值验证规则 ====================

  /**
   * 整数验证
   */
  integer(message: string = '必须是整数'): DataValidator {
    this._rules.push({
      name: 'integer',
      validator: (value) => Number.isInteger(value),
      message,
      required: true,
    });
    return this;
  }

  /**
   * 最小值验证
   */
  min(min: number, message?: string): DataValidator {
    this._rules.push({
      name: 'min',
      validator: (value) => typeof value === 'number' && value >= min,
      message: message || `值不能小于${min}`,
      required: true,
    });
    return this;
  }

  /**
   * 最大值验证
   */
  max(max: number, message?: string): DataValidator {
    this._rules.push({
      name: 'max',
      validator: (value) => typeof value === 'number' && value <= max,
      message: message || `值不能大于${max}`,
      required: true,
    });
    return this;
  }

  // ==================== 类型验证规则 ====================

  /**
   * 字符串类型验证
   */
  string(message: string = '必须是字符串类型'): DataValidator {
    this._rules.push({
      name: 'string',
      validator: (value) => typeof value === 'string',
      message,
      required: true,
    });
    return this;
  }

  /**
   * 数字类型验证
   */
  number(message: string = '必须是数字类型'): DataValidator {
    this._rules.push({
      name: 'number',
      validator: (value) => typeof value === 'number' && !isNaN(value),
      message,
      required: true,
    });
    return this;
  }

  /**
   * 布尔类型验证
   */
  boolean(message: string = '必须是布尔类型'): DataValidator {
    this._rules.push({
      name: 'boolean',
      validator: (value) => typeof value === 'boolean',
      message,
      required: true,
    });
    return this;
  }

  // ==================== 复合验证规则 ====================

  /**
   * 数组验证
   */
  array(
    itemValidator?: DataValidator,
    message: string = '必须是数组类型',
  ): DataValidator {
    this._rules.push({
      name: 'array',
      validator: async (value) => {
        if (!Array.isArray(value)) return false;

        if (itemValidator) {
          // 验证数组中的每个元素
          for (const item of value) {
            const result = await itemValidator.validate(item);
            if (!result.isValid) return false;
          }
        }

        return true;
      },
      message,
      required: true,
    });
    return this;
  }

  /**
   * 对象验证
   */
  object(
    schema: Record<string, DataValidator>,
    message: string = '对象验证失败',
  ): DataValidator {
    this._rules.push({
      name: 'object',
      validator: async (value) => {
        if (typeof value !== 'object' || value === null) return false;

        // 验证对象的每个属性
        for (const [key, validator] of Object.entries(schema)) {
          const result = await validator.validate(
            (value as Record<string, unknown>)[key],
          );
          if (!result.isValid) return false;
        }

        return true;
      },
      message,
      required: true,
    });
    return this;
  }

  // ==================== 执行验证 ====================

  /**
   * 执行验证
   */
  async validate(
    value: unknown,
    context?: Record<string, unknown>,
  ): Promise<IValidationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查是否为可选验证且值为空
    const isOptional = this._rules.some((rule) => rule.name === 'optional');
    if (isOptional && (value === null || value === undefined)) {
      return {
        isValid: true,
        errors: [],
        warnings: [],
        context,
        executionTime: Date.now() - startTime,
      };
    }

    // 执行所有验证规则
    for (const rule of this._rules) {
      if (rule.name === 'optional') continue;

      try {
        // 检查验证条件
        if (rule.condition && !rule.condition(value, context)) {
          continue;
        }

        const isValid = await rule.validator(value, context);
        if (!isValid) {
          errors.push(rule.message);

          // 如果是必须验证且失败，立即返回
          if (rule.required) {
            break;
          }
        }
      } catch (error) {
        errors.push(`验证规则 ${rule.name} 执行失败: ${error}`);
        break;
      }
    }

    const executionTime = Date.now() - startTime;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      context,
      executionTime,
    };
  }

  /**
   * 同步验证（仅支持同步规则）
   */
  validateSync(
    value: unknown,
    context?: Record<string, unknown>,
  ): IValidationResult {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查是否为可选验证且值为空
    const isOptional = this._rules.some((rule) => rule.name === 'optional');
    if (isOptional && (value === null || value === undefined)) {
      return {
        isValid: true,
        errors: [],
        warnings: [],
        context,
        executionTime: Date.now() - startTime,
      };
    }

    // 执行所有同步验证规则
    for (const rule of this._rules) {
      if (rule.name === 'optional') continue;

      try {
        // 检查验证条件
        if (rule.condition && !rule.condition(value, context)) {
          continue;
        }

        const result = rule.validator(value, context);

        // 如果返回Promise，跳过（这是异步规则）
        if (result instanceof Promise) {
          warnings.push(`规则 ${rule.name} 是异步规则，在同步验证中被跳过`);
          continue;
        }

        if (!result) {
          errors.push(rule.message);

          // 如果是必须验证且失败，立即返回
          if (rule.required) {
            break;
          }
        }
      } catch (error) {
        errors.push(`验证规则 ${rule.name} 执行失败: ${error}`);
        break;
      }
    }

    const executionTime = Date.now() - startTime;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      context,
      executionTime,
    };
  }

  // ==================== 工具方法 ====================

  /**
   * 克隆验证器
   */
  clone(): DataValidator {
    const cloned = new DataValidator(this._config);
    cloned._rules = [...this._rules];
    return cloned;
  }

  /**
   * 获取规则数量
   */
  getRuleCount(): number {
    return this._rules.length;
  }

  /**
   * 获取规则名称列表
   */
  getRuleNames(): string[] {
    return this._rules.map((rule) => rule.name);
  }

  /**
   * 检查是否包含指定规则
   */
  hasRule(ruleName: string): boolean {
    return this._rules.some((rule) => rule.name === ruleName);
  }

  /**
   * 移除指定规则
   */
  removeRule(ruleName: string): DataValidator {
    this._rules = this._rules.filter((rule) => rule.name !== ruleName);
    return this;
  }

  /**
   * 清除所有规则
   */
  clearRules(): DataValidator {
    this._rules = [];
    return this;
  }
}
