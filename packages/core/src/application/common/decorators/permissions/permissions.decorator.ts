import type { MethodDecoratorTarget } from '../../../../common/types/decorator-types';

/**
 * 权限验证装饰器
 *
 * 为应用层方法添加权限验证功能，确保操作的安全性。
 * 装饰器通过元数据设置权限要求，实际权限验证由拦截器实现。
 *
 * @description 权限验证装饰器提供了声明式的权限控制功能
 *
 * ## 业务规则
 *
 * ### 权限验证规则
 * - 方法执行前必须验证用户权限
 * - 权限验证失败时应该阻止方法执行
 * - 权限验证应该支持资源级别的控制
 * - 权限验证应该记录访问日志
 *
 * ### 权限配置规则
 * - 权限配置应该是声明式的
 * - 权限配置应该支持动态资源提取
 * - 权限配置应该支持多种失败处理策略
 * - 权限配置应该提供清晰的错误消息
 *
 * @example
 * ```typescript
 * @RequirePermissions({
 *   permissions: ['user:create'],
 *   resourceExtractor: (args) => args[0].tenantId,
 *   onFailure: 'throw'
 * })
 * async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
 *   // 用例实现
 * }
 * ```
 *
 * @since 1.0.0
 */

/**
 * 权限验证配置接口
 */
export interface IRequirePermissionsOptions {
	/**
	 * 所需权限列表
	 */
	permissions: string[];

	/**
	 * 资源提取器
	 */
	resourceExtractor?: (args: unknown[]) => string;

	/**
	 * 权限验证失败时的行为
	 */
	onFailure?: 'throw' | 'return_null' | 'return_empty';

	/**
	 * 自定义错误消息
	 */
	errorMessage?: string;
}

/**
 * 权限验证装饰器元数据键
 */
export const REQUIRE_PERMISSIONS_METADATA_KEY = Symbol('requirePermissions');

/**
 * 权限验证装饰器
 *
 * @description 为方法添加权限验证功能
 *
 * @param options - 权限验证配置选项
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * @RequirePermissions({ permissions: ['user:create'] })
 * async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
 *   // 用例实现
 * }
 * ```
 */
export function RequirePermissions(options: IRequirePermissionsOptions): MethodDecorator {
	return function (target: MethodDecoratorTarget, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
		// 设置元数据
		Reflect.defineMetadata(REQUIRE_PERMISSIONS_METADATA_KEY, options, target, propertyKey);

		const originalMethod = descriptor.value;

		descriptor.value = async function (...args: unknown[]): Promise<unknown> {
			// 权限验证逻辑将在运行时注入
			// 这里只是设置元数据，实际权限验证由拦截器实现
			return await originalMethod.apply(this, args);
		};

		return descriptor;
	};
}

/**
 * 获取权限验证元数据
 *
 * @param target - 目标对象
 * @param propertyKey - 属性键
 * @returns 权限验证配置选项
 */
export function getRequirePermissionsMetadata(
	target: MethodDecoratorTarget,
	propertyKey: string
): IRequirePermissionsOptions | undefined {
	return Reflect.getMetadata(REQUIRE_PERMISSIONS_METADATA_KEY, target, propertyKey);
}
