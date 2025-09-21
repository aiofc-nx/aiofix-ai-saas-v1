/**
 * 配置验证器
 *
 * @description 提供统一配置的验证功能
 * 支持JSON Schema验证、自定义规则验证和业务逻辑验证
 *
 * ## 验证策略
 *
 * ### 🎯 多层验证
 * 1. **类型验证**：基于JSON Schema的类型检查
 * 2. **范围验证**：数值范围、字符串长度等约束
 * 3. **格式验证**：邮箱、URL、正则表达式等格式检查
 * 4. **业务逻辑验证**：自定义业务规则验证
 * 5. **一致性验证**：跨模块配置的一致性检查
 *
 * ### 🔧 验证规则
 * - 必需字段验证
 * - 数据类型验证
 * - 值域范围验证
 * - 格式规范验证
 * - 依赖关系验证
 * - 安全性验证
 *
 * ### 📊 验证结果
 * - 详细的错误信息
 * - 警告和建议
 * - 验证路径追踪
 * - 修复建议
 *
 * @example
 * ```typescript
 * const validator = new ConfigValidator();
 *
 * // 验证完整配置
 * const result = await validator.validateConfig(config);
 * if (!result.valid) {
 *   console.error('配置验证失败:', result.errors);
 * }
 *
 * // 验证模块配置
 * const messagingResult = await validator.validateModule('messaging', messagingConfig);
 *
 * // 注册自定义验证规则
 * validator.registerRule('redis-connection', {
 *   validate: async (config) => {
 *     // 测试Redis连接
 *     return await testRedisConnection(config);
 *   },
 *   message: 'Redis连接测试失败'
 * });
 * ```
 *
 * @since 1.0.0
 */

import type {
	IConfigValidator,
	IConfigValidationResult,
	IConfigSchema,
	IValidationRule,
	IUnifiedConfig,
	ISystemConfig
} from '../interfaces/config.interface';

import { Environment } from '../interfaces/config.interface';

// 移除未使用的接口

/**
 * 配置验证器实现
 *
 * @description 实现配置验证的核心逻辑
 */
export class ConfigValidator implements IConfigValidator {
	private readonly customRules = new Map<string, IValidationRule>();
	private readonly moduleSchemas = new Map<string, IConfigSchema>();

	constructor() {
		this.initializeDefaultRules();
		this.initializeModuleSchemas();
	}

	/**
	 * 验证配置
	 *
	 * @param schema - 配置模式
	 * @param config - 配置对象
	 * @returns 验证结果
	 */
	async validate<T = unknown>(schema: IConfigSchema<T>, config: unknown): Promise<IConfigValidationResult> {
		const errors: string[] = [];
		const warnings: string[] = [];

		try {
			// 基础类型验证
			const typeValidation = this.validateType(schema, config);
			errors.push(...typeValidation.errors);
			warnings.push(...typeValidation.warnings);

			// 属性验证
			if (typeof config === 'object' && config !== null) {
				const propertyValidation = await this.validateProperties(schema, config as Record<string, unknown>);
				errors.push(...propertyValidation.errors);
				warnings.push(...propertyValidation.warnings);
			}

			// 自定义规则验证
			if (schema.customRules) {
				const customValidation = await this.validateCustomRules(schema.customRules, config);
				errors.push(...customValidation.errors);
				warnings.push(...customValidation.warnings);
			}

			return {
				valid: errors.length === 0,
				errors,
				warnings,
				validatedAt: new Date(),
				validatorVersion: '1.0.0'
			};
		} catch (error) {
			return {
				valid: false,
				errors: [`验证过程中发生错误: ${error instanceof Error ? error.message : String(error)}`],
				warnings: [],
				validatedAt: new Date()
			};
		}
	}

	/**
	 * 验证完整配置
	 *
	 * @param config - 统一配置对象
	 * @returns 验证结果
	 */
	async validateConfig(config: IUnifiedConfig): Promise<IConfigValidationResult> {
		const errors: string[] = [];
		const warnings: string[] = [];

		try {
			// 验证系统配置
			const systemValidation = await this.validateSystemConfig(config.system);
			errors.push(...systemValidation.errors);
			warnings.push(...systemValidation.warnings);

			// 验证各模块配置
			const moduleValidations = await Promise.all([
				this.validateModule('core', config.core),
				this.validateModule('messaging', config.messaging),
				this.validateModule('auth', config.auth),
				this.validateModule('tenant', config.tenant),
				this.validateModule('ai', config.ai),
				this.validateModule('logging', config.logging),
				this.validateModule('cache', config.cache),
				this.validateModule('database', config.database)
			]);

			for (const validation of moduleValidations) {
				errors.push(...validation.errors);
				warnings.push(...validation.warnings);
			}

			// 验证跨模块一致性
			const consistencyValidation = await this.validateConsistency(config);
			errors.push(...consistencyValidation.errors);
			warnings.push(...consistencyValidation.warnings);

			return {
				valid: errors.length === 0,
				errors,
				warnings,
				validatedAt: new Date(),
				validatorVersion: '1.0.0'
			};
		} catch (error) {
			return {
				valid: false,
				errors: [`配置验证过程中发生错误: ${error instanceof Error ? error.message : String(error)}`],
				warnings: [],
				validatedAt: new Date()
			};
		}
	}

	/**
	 * 验证模块配置
	 *
	 * @param module - 模块名称
	 * @param config - 模块配置
	 * @returns 验证结果
	 */
	async validateModule(module: string, config: unknown): Promise<IConfigValidationResult> {
		const schema = this.moduleSchemas.get(module);
		if (!schema) {
			return {
				valid: true,
				errors: [],
				warnings: [`模块 ${module} 没有定义验证模式`],
				validatedAt: new Date()
			};
		}

		return this.validate(schema, config);
	}

	/**
	 * 注册验证规则
	 *
	 * @param name - 规则名称
	 * @param rule - 验证规则
	 */
	registerRule(name: string, rule: IValidationRule): void {
		this.customRules.set(name, rule);
		console.log('注册自定义验证规则:', name);
	}

	/**
	 * 验证配置更新
	 *
	 * @param path - 配置路径
	 * @param oldValue - 旧值
	 * @param newValue - 新值
	 * @returns 验证结果
	 */
	async validateUpdate(path: string, oldValue: unknown, newValue: unknown): Promise<IConfigValidationResult> {
		const errors: string[] = [];
		const warnings: string[] = [];

		try {
			// 检查值是否相同
			if (oldValue === newValue) {
				warnings.push('新值与旧值相同，无需更新');
			}

			// 检查关键配置的更新
			const criticalPaths = ['system.environment', 'core.database', 'core.redis', 'auth.jwt.secret'];

			if (criticalPaths.some((criticalPath) => path.startsWith(criticalPath))) {
				warnings.push('更新关键配置可能需要重启应用才能生效');
			}

			// 检查敏感配置的更新
			const sensitivePaths = ['core.database.password', 'core.redis.password', 'auth.jwt.secret'];

			if (sensitivePaths.includes(path)) {
				warnings.push('正在更新敏感配置，请确保新值的安全性');
			}

			// 类型一致性检查
			if (oldValue !== undefined && newValue !== undefined) {
				const oldType = typeof oldValue;
				const newType = typeof newValue;

				if (oldType !== newType) {
					warnings.push(`配置类型发生变化: ${oldType} -> ${newType}`);
				}
			}

			// 特定路径的业务逻辑验证
			const businessValidation = await this.validateBusinessLogic(path, newValue);
			errors.push(...businessValidation.errors);
			warnings.push(...businessValidation.warnings);

			return {
				valid: errors.length === 0,
				errors,
				warnings,
				path,
				validatedAt: new Date()
			};
		} catch (error) {
			return {
				valid: false,
				errors: [`配置更新验证失败: ${error instanceof Error ? error.message : String(error)}`],
				warnings: [],
				path,
				validatedAt: new Date()
			};
		}
	}

	/**
	 * 验证系统配置
	 *
	 * @param config - 系统配置
	 * @returns 验证结果
	 */
	private async validateSystemConfig(config: ISystemConfig): Promise<IConfigValidationResult> {
		const errors: string[] = [];
		const warnings: string[] = [];

		// 验证系统名称
		if (!config.name || typeof config.name !== 'string' || config.name.trim().length === 0) {
			errors.push('系统名称不能为空');
		}

		// 验证系统版本
		if (!config.version || typeof config.version !== 'string') {
			errors.push('系统版本不能为空');
		} else if (!/^\d+\.\d+\.\d+/.test(config.version)) {
			warnings.push('系统版本建议使用语义化版本格式（如 1.0.0）');
		}

		// 验证环境
		const validEnvironments = Object.values(Environment);
		if (!validEnvironments.includes(config.environment)) {
			errors.push(`无效的环境类型: ${config.environment}，有效值: ${validEnvironments.join(', ')}`);
		}

		// 验证配置版本
		if (!config.configVersion || typeof config.configVersion !== 'string') {
			errors.push('配置版本不能为空');
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
			path: 'system',
			validatedAt: new Date()
		};
	}

	/**
	 * 验证跨模块一致性
	 *
	 * @param config - 统一配置
	 * @returns 验证结果
	 */
	private async validateConsistency(config: IUnifiedConfig): Promise<IConfigValidationResult> {
		const errors: string[] = [];
		const warnings: string[] = [];

		// TODO: 更新Redis配置一致性验证（Core配置结构已更新）
		// 验证Redis配置一致性
		// if (config.core.redis && config.messaging.redis) {
		//   if (
		//     config.core.redis.host !== config.messaging.redis.host ||
		//     config.core.redis.port !== config.messaging.redis.port
		//   ) {
		//     warnings.push(
		//       'Core模块和Messaging模块的Redis配置不一致，可能导致连接问题',
		//     );
		//   }
		// }

		// 验证环境一致性
		const environment = config.system.environment;

		// 生产环境特殊验证
		if (environment === Environment.PRODUCTION) {
			if (config.messaging.global.enableVerboseLogging) {
				warnings.push('生产环境建议关闭详细日志以提高性能');
			}

			if (!config.messaging.global.enableMetrics) {
				warnings.push('生产环境建议启用性能指标收集');
			}

			if (config.auth.jwt.secret === 'default-jwt-secret') {
				errors.push('生产环境必须设置自定义的JWT密钥');
			}

			// TODO: 更新安全配置验证（Core配置结构已更新）
			// if (!config.core.security.enableEncryption) {
			//   warnings.push('生产环境建议启用配置加密');
			// }
		}

		// 开发环境建议
		if (environment === Environment.DEVELOPMENT) {
			if (!config.messaging.global.enableVerboseLogging) {
				warnings.push('开发环境建议启用详细日志便于调试');
			}
		}

		// TODO: 更新数据库配置一致性验证（Core配置结构已更新）
		// 验证数据库连接一致性
		// if (config.database.enabled && config.core.enabled) {
		//   const primaryDb = config.database.connections[config.database.default];
		//   const coreDb = config.core.database;

		//   if (
		//     primaryDb &&
		//     (primaryDb.host !== coreDb.host ||
		//       primaryDb.port !== coreDb.port ||
		//       primaryDb.database !== coreDb.database)
		//   ) {
		//     warnings.push('数据库模块和Core模块的数据库配置不一致');
		//   }
		// }

		return {
			valid: errors.length === 0,
			errors,
			warnings,
			path: '*',
			validatedAt: new Date()
		};
	}

	/**
	 * 验证业务逻辑
	 *
	 * @param path - 配置路径
	 * @param value - 配置值
	 * @returns 验证结果
	 */
	private async validateBusinessLogic(path: string, value: unknown): Promise<{ errors: string[]; warnings: string[] }> {
		const errors: string[] = [];
		const warnings: string[] = [];

		// 端口号验证
		if (path.endsWith('.port') && typeof value === 'number') {
			if (value <= 0 || value > 65535) {
				errors.push(`端口号必须在 1-65535 范围内: ${value}`);
			}
			if (value < 1024) {
				warnings.push(`端口号 ${value} 小于1024，可能需要管理员权限`);
			}
		}

		// 超时时间验证
		if (path.includes('timeout') && typeof value === 'number') {
			if (value <= 0) {
				errors.push(`超时时间必须大于0: ${value}`);
			}
			if (value > 300000) {
				// 5分钟
				warnings.push(`超时时间 ${value}ms 过长，可能影响用户体验`);
			}
		}

		// 重试次数验证
		if (path.includes('retries') && typeof value === 'number') {
			if (value < 0) {
				errors.push(`重试次数不能为负数: ${value}`);
			}
			if (value > 10) {
				warnings.push(`重试次数 ${value} 过多，可能影响性能`);
			}
		}

		// 密码强度验证
		if (path.includes('password') && typeof value === 'string') {
			if (value.length < 8) {
				errors.push('密码长度不能少于8位');
			}
			if (!/[A-Z]/.test(value)) {
				warnings.push('密码建议包含大写字母');
			}
			if (!/[a-z]/.test(value)) {
				warnings.push('密码建议包含小写字母');
			}
			if (!/\d/.test(value)) {
				warnings.push('密码建议包含数字');
			}
		}

		// 主机地址验证
		if (path.endsWith('.host') && typeof value === 'string') {
			if (value === 'localhost' || value === '127.0.0.1') {
				warnings.push('使用localhost可能在容器化部署时出现问题');
			}
		}

		// 缓存大小验证
		if (path.includes('maxSize') && typeof value === 'number') {
			if (value <= 0) {
				errors.push(`缓存大小必须大于0: ${value}`);
			}
			if (value > 10240) {
				// 10GB
				warnings.push(`缓存大小 ${value}MB 过大，请确认内存充足`);
			}
		}

		return { errors, warnings };
	}

	/**
	 * 验证类型
	 *
	 * @param schema - 配置模式
	 * @param config - 配置对象
	 * @returns 验证结果
	 */
	private validateType(schema: IConfigSchema, config: unknown): { errors: string[]; warnings: string[] } {
		const errors: string[] = [];
		const warnings: string[] = [];

		const actualType = Array.isArray(config) ? 'array' : typeof config;

		if (schema.type !== actualType) {
			errors.push(`类型不匹配: 期望 ${schema.type}，实际 ${actualType}`);
		}

		return { errors, warnings };
	}

	/**
	 * 验证属性
	 *
	 * @param schema - 配置模式
	 * @param config - 配置对象
	 * @returns 验证结果
	 */
	private async validateProperties(
		schema: IConfigSchema,
		config: Record<string, unknown>
	): Promise<{ errors: string[]; warnings: string[] }> {
		const errors: string[] = [];
		const warnings: string[] = [];

		// 验证必需属性
		if (schema.required) {
			for (const requiredProp of schema.required) {
				if (!(requiredProp in config) || config[requiredProp] === undefined) {
					errors.push(`缺少必需属性: ${requiredProp}`);
				}
			}
		}

		// 验证各个属性
		if (schema.properties) {
			for (const [propName, propSchema] of Object.entries(schema.properties)) {
				const propValue = config[propName];

				if (propValue !== undefined) {
					const propValidation = await this.validateProperty(propName, propValue, propSchema);
					errors.push(...propValidation.errors);
					warnings.push(...propValidation.warnings);
				}
			}
		}

		// 检查额外属性
		if (schema.additionalProperties === false) {
			const allowedProps = Object.keys(schema.properties || {});
			const extraProps = Object.keys(config).filter((prop) => !allowedProps.includes(prop));

			if (extraProps.length > 0) {
				warnings.push(`发现额外属性: ${extraProps.join(', ')}`);
			}
		}

		return { errors, warnings };
	}

	/**
	 * 验证单个属性
	 *
	 * @param name - 属性名称
	 * @param value - 属性值
	 * @param schema - 属性模式
	 * @returns 验证结果
	 */
	private async validateProperty(
		name: string,
		value: unknown,
		schema: any // 简化类型，避免复杂的递归类型
	): Promise<{ errors: string[]; warnings: string[] }> {
		const errors: string[] = [];
		const warnings: string[] = [];

		// 类型验证
		const actualType = Array.isArray(value) ? 'array' : typeof value;
		if (schema.type && schema.type !== actualType) {
			errors.push(`属性 ${name} 类型不匹配: 期望 ${schema.type}，实际 ${actualType}`);
		}

		// 枚举值验证
		if (schema.enum && !schema.enum.includes(value)) {
			errors.push(`属性 ${name} 值不在允许的枚举范围内: ${schema.enum.join(', ')}`);
		}

		// 数字范围验证
		if (typeof value === 'number') {
			if (schema.minimum !== undefined && value < schema.minimum) {
				errors.push(`属性 ${name} 值 ${value} 小于最小值 ${schema.minimum}`);
			}
			if (schema.maximum !== undefined && value > schema.maximum) {
				errors.push(`属性 ${name} 值 ${value} 大于最大值 ${schema.maximum}`);
			}
		}

		// 字符串格式验证
		if (typeof value === 'string') {
			if (schema.pattern) {
				const regex = new RegExp(schema.pattern);
				if (!regex.test(value)) {
					errors.push(`属性 ${name} 不符合格式要求: ${schema.pattern}`);
				}
			}

			if (schema.format) {
				const formatValidation = this.validateStringFormat(value, schema.format);
				if (!formatValidation.valid) {
					errors.push(`属性 ${name} 格式验证失败: ${formatValidation.message}`);
				}
			}
		}

		return { errors, warnings };
	}

	/**
	 * 验证字符串格式
	 *
	 * @param value - 字符串值
	 * @param format - 格式类型
	 * @returns 验证结果
	 */
	private validateStringFormat(value: string, format: string): { valid: boolean; message?: string } {
		switch (format) {
			case 'email': {
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				return {
					valid: emailRegex.test(value),
					message: '邮箱格式不正确'
				};
			}

			case 'url':
				try {
					new URL(value);
					return { valid: true };
				} catch {
					return {
						valid: false,
						message: 'URL格式不正确'
					};
				}

			case 'ipv4': {
				const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
				return {
					valid: ipv4Regex.test(value),
					message: 'IPv4地址格式不正确'
				};
			}

			case 'uuid': {
				const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
				return {
					valid: uuidRegex.test(value),
					message: 'UUID格式不正确'
				};
			}

			default:
				return { valid: true };
		}
	}

	/**
	 * 验证自定义规则
	 *
	 * @param rules - 自定义规则列表
	 * @param config - 配置对象
	 * @returns 验证结果
	 */
	private async validateCustomRules(
		rules: IValidationRule[],
		config: unknown
	): Promise<{ errors: string[]; warnings: string[] }> {
		const errors: string[] = [];
		const warnings: string[] = [];

		for (const rule of rules) {
			try {
				const isValid = await rule.validate(config);
				if (!isValid) {
					if (rule.isWarning) {
						warnings.push(rule.message);
					} else {
						errors.push(rule.message);
					}
				}
			} catch (error) {
				errors.push(`自定义规则 ${rule.name} 执行失败: ${error instanceof Error ? error.message : String(error)}`);
			}
		}

		return { errors, warnings };
	}

	/**
	 * 初始化默认验证规则
	 */
	private initializeDefaultRules(): void {
		// Redis连接验证规则
		this.registerRule('redis-connection', {
			name: 'redis-connection',
			validate: async (config: any) => {
				// 这里可以实现实际的Redis连接测试
				// 目前返回基础验证
				return config.host && config.port;
			},
			message: 'Redis连接配置无效',
			isWarning: true
		});

		// 数据库连接验证规则
		this.registerRule('database-connection', {
			name: 'database-connection',
			validate: async (config: any) => {
				// 这里可以实现实际的数据库连接测试
				return config.host && config.port && config.username && config.database;
			},
			message: '数据库连接配置无效',
			isWarning: true
		});

		// JWT密钥强度验证
		this.registerRule('jwt-secret-strength', {
			name: 'jwt-secret-strength',
			validate: async (secret: any) => {
				if (typeof secret !== 'string') {
					return false;
				}
				return secret.length >= 32 && secret !== 'default-jwt-secret';
			},
			message: 'JWT密钥强度不足，建议使用至少32位的随机字符串',
			isWarning: false
		});
	}

	/**
	 * 初始化模块验证模式
	 */
	private initializeModuleSchemas(): void {
		// 这里可以定义各模块的JSON Schema
		// 目前使用简化的验证逻辑

		// 系统配置模式
		this.moduleSchemas.set('system', {
			$id: 'system-config',
			version: '1.0.0',
			type: 'object',
			properties: {
				name: { type: 'string' },
				version: { type: 'string' },
				environment: { type: 'string' },
				configVersion: { type: 'string' }
			},
			required: ['name', 'version', 'environment', 'configVersion']
		});

		// 消息传递模块模式
		this.moduleSchemas.set('messaging', {
			$id: 'messaging-config',
			version: '1.0.0',
			type: 'object',
			properties: {
				enabled: { type: 'boolean' },
				global: { type: 'object' },
				redis: { type: 'object' },
				queues: { type: 'object' },
				handlers: { type: 'object' },
				monitoring: { type: 'object' }
			},
			required: ['enabled', 'global', 'redis']
		});

		console.log('模块验证模式初始化完成:', Array.from(this.moduleSchemas.keys()));
	}
}

/**
 * 创建配置验证器
 *
 * @returns 配置验证器实例
 */
export function createConfigValidator(): ConfigValidator {
	return new ConfigValidator();
}

/**
 * 验证配置的便捷函数
 *
 * @param config - 配置对象
 * @returns 验证结果
 */
export async function validateConfig(config: IUnifiedConfig): Promise<IConfigValidationResult> {
	const validator = createConfigValidator();
	return validator.validateConfig(config);
}

/**
 * 验证模块配置的便捷函数
 *
 * @param module - 模块名称
 * @param config - 模块配置
 * @returns 验证结果
 */
export async function validateModuleConfig(module: string, config: unknown): Promise<IConfigValidationResult> {
	const validator = createConfigValidator();
	return validator.validateModule(module, config);
}
