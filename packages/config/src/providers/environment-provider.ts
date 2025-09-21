/**
 * 环境变量配置提供者
 *
 * @description 从环境变量中加载配置的提供者实现
 * 支持嵌套配置路径、类型转换和配置映射
 *
 * ## 核心功能
 *
 * ### 🎯 环境变量映射
 * - 支持嵌套配置路径的环境变量映射
 * - 使用双下划线分隔嵌套层级
 * - 自动类型转换（字符串、数字、布尔值、JSON）
 * - 支持默认值设置
 *
 * ### 🔧 命名规则
 * - 使用 `AIOFIX_` 作为统一前缀
 * - 使用大写字母和下划线
 * - 双下划线 `__` 表示嵌套分隔符
 * - 例如：`AIOFIX_MESSAGING__GLOBAL__DEFAULT_TIMEOUT=30000`
 *
 * ### 🚀 类型转换
 * - 数字：自动识别整数和浮点数
 * - 布尔值：'true'/'false' 转换
 * - JSON：以 '{' 或 '[' 开头的字符串
 * - 数组：逗号分隔的字符串
 * - 其他：保持字符串类型
 *
 * @example
 * ```bash
 * # 环境变量设置示例
 * export AIOFIX_SYSTEM__ENVIRONMENT=production
 * export AIOFIX_MESSAGING__GLOBAL__DEFAULT_TIMEOUT=60000
 * export AIOFIX_MESSAGING__GLOBAL__ENABLE_METRICS=true
 * export AIOFIX_CORE__REDIS__HOST=redis.example.com
 * export AIOFIX_CORE__DATABASE__PASSWORD=secret123
 * ```
 *
 * ```typescript
 * const provider = new EnvironmentConfigProvider();
 * await provider.initialize();
 *
 * const timeout = await provider.get('messaging.global.defaultTimeout');
 * const redisHost = await provider.get('core.redis.host');
 * ```
 *
 * @since 1.0.0
 */

import type { IConfigProvider } from '../interfaces/config.interface';

/**
 * 环境变量映射配置
 *
 * @description 定义环境变量到配置路径的映射规则
 */
interface IEnvironmentMapping {
	/** 环境变量名称 */
	envKey: string;
	/** 配置路径 */
	configPath: string;
	/** 是否必需 */
	required?: boolean;
	/** 默认值 */
	defaultValue?: unknown;
	/** 类型转换函数 */
	transform?: (value: string) => unknown;
	/** 敏感级别 */
	sensitive?: boolean;
}

/**
 * 环境变量配置提供者实现
 *
 * @description 实现从环境变量加载配置的功能
 */
export class EnvironmentConfigProvider implements IConfigProvider {
	/** 提供者名称 */
	readonly name = 'environment';

	/** 提供者优先级（数字越小优先级越高） */
	readonly priority = 1;

	/** 是否支持写操作 */
	readonly writable = false;

	/** 是否支持监听 */
	readonly watchable = false;

	private readonly prefix: string;
	private readonly cache = new Map<string, unknown>();
	private readonly mappings: IEnvironmentMapping[];
	private initialized = false;

	constructor(prefix = 'AIOFIX_') {
		this.prefix = prefix;
		this.mappings = this.createDefaultMappings();
	}

	/**
	 * 初始化提供者
	 */
	async initialize(): Promise<void> {
		if (this.initialized) {
			return;
		}

		try {
			// 验证必需的环境变量
			const validation = this.validateRequired();
			if (!validation.valid) {
				console.warn('缺少必需的环境变量:', validation.missing);
			}

			// 预加载所有环境变量到缓存
			await this.preloadCache();

			this.initialized = true;
			console.log('环境变量配置提供者初始化完成', {
				prefix: this.prefix,
				cachedKeys: this.cache.size
			});
		} catch (error) {
			console.error('环境变量配置提供者初始化失败:', error);
			throw error;
		}
	}

	/**
	 * 获取配置
	 *
	 * @param key - 配置键
	 * @returns 配置值
	 */
	async get<T = unknown>(key: string): Promise<T | undefined> {
		this.ensureInitialized();

		// 检查缓存
		if (this.cache.has(key)) {
			return this.cache.get(key) as T;
		}

		// 查找对应的环境变量
		const envKey = this.configPathToEnvKey(key);
		const envValue = process.env[envKey];

		if (envValue === undefined) {
			return undefined;
		}

		// 类型转换
		const value = this.transformValue(envValue, key);

		// 缓存结果
		this.cache.set(key, value);

		return value as T;
	}

	/**
	 * 设置配置值（环境变量提供者不支持写操作）
	 *
	 * @param _key - 配置键
	 * @param _value - 配置值
	 */
	async set<T = unknown>(_key: string, _value: T): Promise<void> {
		throw new Error('环境变量配置提供者不支持写操作');
	}

	/**
	 * 删除配置（环境变量提供者不支持删除操作）
	 *
	 * @param _key - 配置键
	 */
	async delete(_key: string): Promise<void> {
		throw new Error('环境变量配置提供者不支持删除操作');
	}

	/**
	 * 检查配置是否存在
	 *
	 * @param key - 配置键
	 * @returns 是否存在
	 */
	async has(key: string): Promise<boolean> {
		const envKey = this.configPathToEnvKey(key);
		return process.env[envKey] !== undefined;
	}

	/**
	 * 获取所有配置键
	 *
	 * @returns 配置键列表
	 */
	async keys(): Promise<string[]> {
		this.ensureInitialized();
		return Array.from(this.cache.keys());
	}

	/**
	 * 监听配置变化（环境变量提供者不支持实时监听）
	 *
	 * @param _key - 配置键
	 * @param _callback - 变化回调
	 */
	watch(_key: string, _callback: (value: unknown) => void): void {
		console.warn('环境变量配置提供者不支持实时监听');
	}

	/**
	 * 取消监听配置变化
	 *
	 * @param _key - 配置键
	 * @param _callback - 变化回调
	 */
	unwatch(_key: string, _callback: (value: unknown) => void): void {
		// 不需要实现，因为不支持监听
	}

	/**
	 * 销毁提供者
	 */
	async destroy(): Promise<void> {
		this.cache.clear();
		this.initialized = false;
		console.log('环境变量配置提供者已销毁');
	}

	/**
	 * 获取提供者统计信息
	 *
	 * @returns 统计信息
	 */
	getStatistics(): {
		name: string;
		priority: number;
		prefix: string;
		totalEnvVars: number;
		aiofixEnvVars: number;
		cacheSize: number;
		initialized: boolean;
	} {
		const allEnvVars = Object.keys(process.env);
		const aiofixEnvVars = allEnvVars.filter((key) => key.startsWith(this.prefix));

		return {
			name: this.name,
			priority: this.priority,
			prefix: this.prefix,
			totalEnvVars: allEnvVars.length,
			aiofixEnvVars: aiofixEnvVars.length,
			cacheSize: this.cache.size,
			initialized: this.initialized
		};
	}

	/**
	 * 验证必需的环境变量
	 *
	 * @returns 验证结果
	 */
	validateRequired(): { valid: boolean; missing: string[] } {
		const missing: string[] = [];

		for (const mapping of this.mappings) {
			if (mapping.required && !process.env[mapping.envKey]) {
				missing.push(mapping.envKey);
			}
		}

		return {
			valid: missing.length === 0,
			missing
		};
	}

	/**
	 * 清空缓存
	 */
	clearCache(): void {
		this.cache.clear();
	}

	/**
	 * 重新加载环境变量
	 */
	async reload(): Promise<void> {
		this.clearCache();
		await this.preloadCache();
	}

	/**
	 * 预加载缓存
	 */
	private async preloadCache(): Promise<void> {
		// 遍历所有环境变量
		for (const [envKey, envValue] of Object.entries(process.env)) {
			if (envKey.startsWith(this.prefix) && envValue !== undefined) {
				const configKey = this.envKeyToConfigPath(envKey);
				const value = this.transformValue(envValue, configKey);
				this.cache.set(configKey, value);
			}
		}

		console.log('环境变量预加载完成:', {
			totalKeys: this.cache.size
		});
	}

	/**
	 * 配置路径转环境变量名
	 *
	 * @param configPath - 配置路径
	 * @returns 环境变量名
	 */
	private configPathToEnvKey(configPath: string): string {
		return (
			this.prefix +
			configPath
				.split('.')
				.map((part) => part.replace(/([A-Z])/g, '_$1').toUpperCase())
				.join('__')
		);
	}

	/**
	 * 环境变量名转配置路径
	 *
	 * @param envKey - 环境变量名
	 * @returns 配置路径
	 */
	private envKeyToConfigPath(envKey: string): string {
		return envKey
			.substring(this.prefix.length)
			.split('__')
			.map((part) => this.toCamelCase(part.toLowerCase()))
			.join('.');
	}

	/**
	 * 转换为驼峰命名
	 *
	 * @param str - 字符串
	 * @returns 驼峰命名字符串
	 */
	private toCamelCase(str: string): string {
		return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
	}

	/**
	 * 值类型转换
	 *
	 * @param value - 原始字符串值
	 * @param key - 配置键（用于特殊处理）
	 * @returns 转换后的值
	 */
	private transformValue(value: string, key?: string): unknown {
		// 布尔值转换
		if (value.toLowerCase() === 'true') {
			return true;
		}
		if (value.toLowerCase() === 'false') {
			return false;
		}

		// null 和 undefined 转换
		if (value.toLowerCase() === 'null') {
			return null;
		}
		if (value.toLowerCase() === 'undefined') {
			return undefined;
		}

		// 数字转换
		if (/^-?\d+$/.test(value)) {
			return parseInt(value, 10);
		}
		if (/^-?\d+\.\d+$/.test(value)) {
			return parseFloat(value);
		}

		// JSON 转换
		if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
			try {
				return JSON.parse(value);
			} catch {
				console.warn('JSON解析失败，返回原始字符串:', value);
			}
		}

		// 数组转换（逗号分隔）
		if (value.includes(',') && !value.includes(' ')) {
			return value.split(',').map((item) => item.trim());
		}

		// 特殊键的处理
		if (key) {
			// 端口号强制转换为数字
			if (key.endsWith('.port') && /^\d+$/.test(value)) {
				return parseInt(value, 10);
			}

			// 超时时间强制转换为数字
			if (key.includes('timeout') && /^\d+$/.test(value)) {
				return parseInt(value, 10);
			}

			// 大小限制强制转换为数字
			if ((key.includes('size') || key.includes('limit')) && /^\d+$/.test(value)) {
				return parseInt(value, 10);
			}
		}

		// 返回字符串
		return value;
	}

	/**
	 * 创建默认的环境变量映射
	 *
	 * @returns 映射配置列表
	 */
	private createDefaultMappings(): IEnvironmentMapping[] {
		return [
			// 系统配置
			{
				envKey: 'AIOFIX_SYSTEM__NAME',
				configPath: 'system.name',
				defaultValue: 'AIOFix SAAS Platform'
			},
			{
				envKey: 'AIOFIX_SYSTEM__VERSION',
				configPath: 'system.version',
				defaultValue: '1.0.0'
			},
			{
				envKey: 'AIOFIX_SYSTEM__ENVIRONMENT',
				configPath: 'system.environment',
				required: false,
				defaultValue: 'development'
			},

			// 核心模块 - 数据库配置
			{
				envKey: 'AIOFIX_CORE__DATABASE__TYPE',
				configPath: 'core.database.type',
				defaultValue: 'postgresql'
			},
			{
				envKey: 'AIOFIX_CORE__DATABASE__HOST',
				configPath: 'core.database.host',
				required: true,
				defaultValue: 'localhost'
			},
			{
				envKey: 'AIOFIX_CORE__DATABASE__PORT',
				configPath: 'core.database.port',
				transform: (value) => parseInt(value, 10),
				defaultValue: 5432
			},
			{
				envKey: 'AIOFIX_CORE__DATABASE__USERNAME',
				configPath: 'core.database.username',
				required: true,
				defaultValue: 'postgres'
			},
			{
				envKey: 'AIOFIX_CORE__DATABASE__PASSWORD',
				configPath: 'core.database.password',
				sensitive: true
			},
			{
				envKey: 'AIOFIX_CORE__DATABASE__DATABASE',
				configPath: 'core.database.database',
				required: true,
				defaultValue: 'aiofix'
			},

			// 核心模块 - Redis配置
			{
				envKey: 'AIOFIX_CORE__REDIS__HOST',
				configPath: 'core.redis.host',
				required: true,
				defaultValue: 'localhost'
			},
			{
				envKey: 'AIOFIX_CORE__REDIS__PORT',
				configPath: 'core.redis.port',
				transform: (value) => parseInt(value, 10),
				defaultValue: 6379
			},
			{
				envKey: 'AIOFIX_CORE__REDIS__PASSWORD',
				configPath: 'core.redis.password',
				sensitive: true
			},
			{
				envKey: 'AIOFIX_CORE__REDIS__DB',
				configPath: 'core.redis.db',
				transform: (value) => parseInt(value, 10),
				defaultValue: 0
			},

			// 消息传递模块配置
			{
				envKey: 'AIOFIX_MESSAGING__ENABLED',
				configPath: 'messaging.enabled',
				transform: (value) => value.toLowerCase() === 'true',
				defaultValue: true
			},
			{
				envKey: 'AIOFIX_MESSAGING__GLOBAL__DEFAULT_TIMEOUT',
				configPath: 'messaging.global.defaultTimeout',
				transform: (value) => parseInt(value, 10),
				defaultValue: 30000
			},
			{
				envKey: 'AIOFIX_MESSAGING__GLOBAL__MAX_RETRIES',
				configPath: 'messaging.global.maxRetries',
				transform: (value) => parseInt(value, 10),
				defaultValue: 3
			},
			{
				envKey: 'AIOFIX_MESSAGING__GLOBAL__RETRY_DELAY',
				configPath: 'messaging.global.retryDelay',
				transform: (value) => parseInt(value, 10),
				defaultValue: 1000
			},
			{
				envKey: 'AIOFIX_MESSAGING__GLOBAL__ENABLE_METRICS',
				configPath: 'messaging.global.enableMetrics',
				transform: (value) => value.toLowerCase() === 'true',
				defaultValue: true
			},
			{
				envKey: 'AIOFIX_MESSAGING__GLOBAL__ENABLE_VERBOSE_LOGGING',
				configPath: 'messaging.global.enableVerboseLogging',
				transform: (value) => value.toLowerCase() === 'true',
				defaultValue: false
			},
			{
				envKey: 'AIOFIX_MESSAGING__GLOBAL__ENABLE_TENANT_ISOLATION',
				configPath: 'messaging.global.enableTenantIsolation',
				transform: (value) => value.toLowerCase() === 'true',
				defaultValue: false
			},

			// 认证模块配置
			{
				envKey: 'AIOFIX_AUTH__ENABLED',
				configPath: 'auth.enabled',
				transform: (value) => value.toLowerCase() === 'true',
				defaultValue: true
			},
			{
				envKey: 'AIOFIX_AUTH__JWT__SECRET',
				configPath: 'auth.jwt.secret',
				required: true,
				sensitive: true,
				defaultValue: 'default-jwt-secret'
			},
			{
				envKey: 'AIOFIX_AUTH__JWT__EXPIRES_IN',
				configPath: 'auth.jwt.expiresIn',
				defaultValue: '24h'
			},
			{
				envKey: 'AIOFIX_AUTH__JWT__ISSUER',
				configPath: 'auth.jwt.issuer',
				defaultValue: 'aiofix-saas'
			},
			{
				envKey: 'AIOFIX_AUTH__JWT__AUDIENCE',
				configPath: 'auth.jwt.audience',
				defaultValue: 'aiofix-users'
			},

			// 租户模块配置
			{
				envKey: 'AIOFIX_TENANT__ENABLED',
				configPath: 'tenant.enabled',
				transform: (value) => value.toLowerCase() === 'true',
				defaultValue: true
			},
			{
				envKey: 'AIOFIX_TENANT__ISOLATION_STRATEGY',
				configPath: 'tenant.isolationStrategy',
				defaultValue: 'schema'
			},

			// AI模块配置
			{
				envKey: 'AIOFIX_AI__ENABLED',
				configPath: 'ai.enabled',
				transform: (value) => value.toLowerCase() === 'true',
				defaultValue: false
			},
			{
				envKey: 'AIOFIX_AI__DEFAULT_PROVIDER',
				configPath: 'ai.defaultProvider',
				defaultValue: 'openai'
			},

			// 日志模块配置
			{
				envKey: 'AIOFIX_LOGGING__ENABLED',
				configPath: 'logging.enabled',
				transform: (value) => value.toLowerCase() === 'true',
				defaultValue: true
			},
			{
				envKey: 'AIOFIX_LOGGING__LEVEL',
				configPath: 'logging.level',
				defaultValue: 'info'
			},

			// 缓存模块配置
			{
				envKey: 'AIOFIX_CACHE__ENABLED',
				configPath: 'cache.enabled',
				transform: (value) => value.toLowerCase() === 'true',
				defaultValue: true
			},
			{
				envKey: 'AIOFIX_CACHE__DEFAULT_STRATEGY',
				configPath: 'cache.defaultStrategy',
				defaultValue: 'hybrid'
			},

			// 数据库模块配置
			{
				envKey: 'AIOFIX_DATABASE__ENABLED',
				configPath: 'database.enabled',
				transform: (value) => value.toLowerCase() === 'true',
				defaultValue: true
			},
			{
				envKey: 'AIOFIX_DATABASE__DEFAULT',
				configPath: 'database.default',
				defaultValue: 'primary'
			}
		];
	}

	/**
	 * 确保提供者已初始化
	 */
	private ensureInitialized(): void {
		if (!this.initialized) {
			throw new Error('环境变量配置提供者未初始化');
		}
	}
}

/**
 * 创建环境变量配置提供者
 *
 * @param prefix - 环境变量前缀
 * @returns 配置提供者实例
 */
export function createEnvironmentConfigProvider(prefix?: string): EnvironmentConfigProvider {
	return new EnvironmentConfigProvider(prefix);
}

/**
 * 获取环境变量配置的便捷函数
 *
 * @param key - 配置键
 * @param defaultValue - 默认值
 * @returns 配置值
 */
export async function getEnvConfig<T = unknown>(key: string, defaultValue?: T): Promise<T> {
	const provider = new EnvironmentConfigProvider();
	await provider.initialize();

	const value = await provider.get<T>(key);
	return value !== undefined ? value : (defaultValue as T);
}

/**
 * 验证环境变量配置的便捷函数
 *
 * @param prefix - 环境变量前缀
 * @returns 验证结果
 */
export function validateEnvConfig(prefix?: string): {
	valid: boolean;
	missing: string[];
} {
	const provider = new EnvironmentConfigProvider(prefix);
	return provider.validateRequired();
}
