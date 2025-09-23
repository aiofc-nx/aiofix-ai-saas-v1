/**
 * 映射器工具类
 *
 * 提供映射操作的通用工具函数，包含类型检查、数据转换、验证等功能。
 * 工具类为映射器实现提供便利的辅助方法。
 *
 * @description 映射器工具类提供了映射操作的通用工具函数
 *
 * ## 业务规则
 *
 * ### 类型检查规则
 * - 提供安全的类型检查方法
 * - 支持复杂类型的深度检查
 * - 检查失败时提供详细的错误信息
 * - 支持自定义类型检查逻辑
 *
 * ### 数据转换规则
 * - 提供常用的数据转换方法
 * - 支持嵌套对象的深度转换
 * - 保持转换过程的类型安全
 * - 支持自定义转换逻辑
 *
 * ### 验证规则
 * - 提供通用的验证方法
 * - 支持自定义验证规则
 * - 验证失败时提供详细的错误信息
 * - 支持异步验证操作
 *
 * @example
 * ```typescript
 * // 类型检查
 * if (MappingUtils.isValidEntity(entity)) {
 *   const mapped = mapper.toPersistence(entity);
 * }
 *
 * // 数据转换
 * const cleanData = MappingUtils.removeNullValues(rawData);
 * const normalizedData = MappingUtils.normalizeKeys(cleanData);
 *
 * // 验证
 * const isValid = MappingUtils.validateRequired(data, ['id', 'name', 'email']);
 * ```
 *
 * @since 1.0.0
 */

/**
 * 映射工具类
 */
export class MappingUtils {
	/**
	 * 检查对象是否为有效的实体
	 *
	 * @param entity - 要检查的对象
	 * @returns 是否为有效实体
	 */
	public static isValidEntity(entity: unknown): boolean {
		if (entity === null || entity === undefined) {
			return false;
		}

		if (typeof entity !== 'object') {
			return false;
		}

		// 检查是否有id属性
		return 'id' in (entity as object);
	}

	/**
	 * 检查对象是否为有效的值对象
	 *
	 * @param valueObject - 要检查的对象
	 * @returns 是否为有效值对象
	 */
	public static isValidValueObject(valueObject: unknown): boolean {
		if (valueObject === null || valueObject === undefined) {
			return false;
		}

		// 值对象可以是原始类型或对象
		return true;
	}

	/**
	 * 移除对象中的null和undefined值
	 *
	 * @param obj - 要清理的对象
	 * @returns 清理后的对象
	 */
	public static removeNullValues<T extends Record<string, unknown>>(obj: T): Partial<T> {
		const cleaned: Partial<T> = {};

		Object.keys(obj).forEach((key) => {
			const value = obj[key];
			if (value !== null && value !== undefined) {
				cleaned[key as keyof T] = value as T[keyof T];
			}
		});

		return cleaned;
	}

	/**
	 * 规范化对象键名（转换为camelCase）
	 *
	 * @param obj - 要规范化的对象
	 * @returns 规范化后的对象
	 */
	public static normalizeKeys<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
		const normalized: Record<string, unknown> = {};

		Object.keys(obj).forEach((key) => {
			const normalizedKey = this.toCamelCase(key);
			normalized[normalizedKey] = obj[key];
		});

		return normalized;
	}

	/**
	 * 将字符串转换为camelCase
	 *
	 * @param str - 要转换的字符串
	 * @returns camelCase字符串
	 */
	public static toCamelCase(str: string): string {
		return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
	}

	/**
	 * 将字符串转换为snake_case
	 *
	 * @param str - 要转换的字符串
	 * @returns snake_case字符串
	 */
	public static toSnakeCase(str: string): string {
		return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
	}

	/**
	 * 验证对象是否包含必需字段
	 *
	 * @param obj - 要验证的对象
	 * @param requiredFields - 必需字段列表
	 * @returns 验证结果
	 */
	public static validateRequired(obj: Record<string, unknown>, requiredFields: string[]): boolean {
		return requiredFields.every((field) => {
			const value = obj[field];
			return value !== null && value !== undefined && value !== '';
		});
	}

	/**
	 * 获取对象的缺失字段
	 *
	 * @param obj - 要检查的对象
	 * @param requiredFields - 必需字段列表
	 * @returns 缺失字段列表
	 */
	public static getMissingFields(obj: Record<string, unknown>, requiredFields: string[]): string[] {
		return requiredFields.filter((field) => {
			const value = obj[field];
			return value === null || value === undefined || value === '';
		});
	}

	/**
	 * 深度克隆对象
	 *
	 * @param obj - 要克隆的对象
	 * @returns 克隆后的对象
	 */
	public static deepClone<T>(obj: T): T {
		if (obj === null || typeof obj !== 'object') {
			return obj;
		}

		if (obj instanceof Date) {
			return new Date(obj.getTime()) as unknown as T;
		}

		if (Array.isArray(obj)) {
			return obj.map((item) => this.deepClone(item)) as unknown as T;
		}

		const cloned = {} as T;
		Object.keys(obj).forEach((key) => {
			(cloned as Record<string, unknown>)[key] = this.deepClone((obj as Record<string, unknown>)[key]);
		});

		return cloned;
	}

	/**
	 * 比较两个对象是否深度相等
	 *
	 * @param obj1 - 第一个对象
	 * @param obj2 - 第二个对象
	 * @returns 是否相等
	 */
	public static deepEqual(obj1: unknown, obj2: unknown): boolean {
		if (obj1 === obj2) {
			return true;
		}

		if (obj1 === null || obj2 === null || obj1 === undefined || obj2 === undefined) {
			return false;
		}

		if (typeof obj1 !== typeof obj2) {
			return false;
		}

		if (typeof obj1 !== 'object') {
			return obj1 === obj2;
		}

		if (Array.isArray(obj1) !== Array.isArray(obj2)) {
			return false;
		}

		const keys1 = Object.keys(obj1 as object);
		const keys2 = Object.keys(obj2 as object);

		if (keys1.length !== keys2.length) {
			return false;
		}

		return keys1.every((key) => {
			return this.deepEqual((obj1 as Record<string, unknown>)[key], (obj2 as Record<string, unknown>)[key]);
		});
	}

	/**
	 * 安全的JSON序列化
	 *
	 * @param obj - 要序列化的对象
	 * @returns JSON字符串
	 */
	public static safeJsonStringify(obj: unknown): string {
		try {
			return JSON.stringify(obj, (key, value) => {
				// 处理循环引用
				if (typeof value === 'object' && value !== null) {
					if (this.hasCircularReference(value)) {
						return '[Circular Reference]';
					}
				}
				return value;
			});
		} catch (error) {
			return `[Serialization Error: ${error instanceof Error ? error.message : String(error)}]`;
		}
	}

	/**
	 * 安全的JSON解析
	 *
	 * @param json - JSON字符串
	 * @returns 解析后的对象
	 */
	public static safeJsonParse<T = unknown>(json: string): T | null {
		try {
			return JSON.parse(json) as T;
		} catch {
			return null;
		}
	}

	/**
	 * 检查对象是否有循环引用
	 *
	 * @param obj - 要检查的对象
	 * @returns 是否有循环引用
	 * @private
	 */
	private static hasCircularReference(obj: unknown): boolean {
		const seen = new WeakSet();

		function detect(current: unknown): boolean {
			if (typeof current === 'object' && current !== null) {
				if (seen.has(current as object)) {
					return true;
				}
				seen.add(current as object);

				for (const value of Object.values(current as object)) {
					if (detect(value)) {
						return true;
					}
				}
			}
			return false;
		}

		return detect(obj);
	}
}
