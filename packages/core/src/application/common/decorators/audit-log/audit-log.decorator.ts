import type { MethodDecoratorTarget } from '../../../../common/types/decorator-types';

/**
 * 审计日志装饰器
 *
 * 为应用层方法添加审计日志功能，记录操作的详细信息。
 * 装饰器通过元数据设置审计配置，实际日志记录由拦截器实现。
 *
 * @description 审计日志装饰器提供了声明式的审计日志功能
 *
 * ## 业务规则
 *
 * ### 审计日志记录规则
 * - 记录操作的完整上下文信息
 * - 记录操作的执行时间和结果
 * - 敏感信息应该被过滤或脱敏
 * - 审计日志应该不可篡改
 *
 * ### 审计日志安全规则
 * - 审计日志不应该包含敏感数据
 * - 审计日志应该支持数据脱敏
 * - 审计日志应该有访问权限控制
 * - 审计日志应该支持合规性要求
 *
 * @example
 * ```typescript
 * @AuditLog({
 *   operation: 'create',
 *   resourceType: 'user',
 *   sensitiveFields: ['password', 'creditCard']
 * })
 * async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
 *   // 用例实现
 * }
 * ```
 *
 * @since 1.0.0
 */

/**
 * 审计日志配置接口
 */
export interface IAuditLogOptions {
	/**
	 * 操作类型
	 */
	operation: string;

	/**
	 * 资源类型
	 */
	resourceType: string;

	/**
	 * 是否记录请求参数
	 */
	logRequest?: boolean;

	/**
	 * 是否记录响应结果
	 */
	logResponse?: boolean;

	/**
	 * 是否记录执行时间
	 */
	logExecutionTime?: boolean;

	/**
	 * 敏感字段（不记录）
	 */
	sensitiveFields?: string[];
}

/**
 * 审计日志装饰器元数据键
 */
export const AUDIT_LOG_METADATA_KEY = Symbol('auditLog');

/**
 * 审计日志装饰器
 *
 * @description 为方法添加审计日志功能
 *
 * @param options - 审计日志配置选项
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * @AuditLog({ operation: 'create', resourceType: 'user' })
 * async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
 *   // 用例实现
 * }
 * ```
 */
export function AuditLog(options: IAuditLogOptions): MethodDecorator {
	return function (target: MethodDecoratorTarget, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
		// 设置元数据
		Reflect.defineMetadata(AUDIT_LOG_METADATA_KEY, options, target, propertyKey);

		const originalMethod = descriptor.value;

		descriptor.value = async function (...args: unknown[]): Promise<unknown> {
			// 审计日志记录将在运行时注入
			// 这里只是设置元数据，实际日志记录由拦截器实现
			return await originalMethod.apply(this, args);
		};

		return descriptor;
	};
}

/**
 * 获取审计日志元数据
 *
 * @param target - 目标对象
 * @param propertyKey - 属性键
 * @returns 审计日志配置选项
 */
export function getAuditLogMetadata(target: MethodDecoratorTarget, propertyKey: string): IAuditLogOptions | undefined {
	return Reflect.getMetadata(AUDIT_LOG_METADATA_KEY, target, propertyKey);
}
