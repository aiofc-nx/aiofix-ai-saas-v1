import type { MethodDecoratorTarget } from '../../../../common/types/decorator-types';

/**
 * 缓存装饰器
 *
 * 为应用层方法添加缓存功能，支持灵活的缓存策略配置。
 * 装饰器通过元数据设置缓存配置，实际缓存逻辑由拦截器实现。
 *
 * @description 缓存装饰器提供了声明式的缓存功能
 *
 * ## 业务规则
 *
 * ### 缓存策略规则
 * - 缓存键应该唯一标识方法调用
 * - 缓存生存时间应该基于数据变更频率
 * - 缓存条件应该基于业务逻辑判断
 * - 缓存失效应该及时和准确
 *
 * ### 缓存性能规则
 * - 缓存操作不应该影响主要业务逻辑
 * - 缓存失败时应该降级到原方法执行
 * - 缓存键生成应该高效和一致
 * - 缓存访问应该异步和非阻塞
 *
 * @example
 * ```typescript
 * @Cacheable({
 *   ttl: 300,
 *   keyPrefix: 'user',
 *   condition: (result) => result !== null
 * })
 * async getUser(userId: string): Promise<User> {
 *   return await this.userRepository.findById(userId);
 * }
 * ```
 *
 * @since 1.0.0
 */

/**
 * 缓存配置接口
 */
export interface ICacheableOptions {
	/**
	 * 缓存生存时间（秒）
	 */
	ttl?: number;

	/**
	 * 缓存键前缀
	 */
	keyPrefix?: string;

	/**
	 * 是否启用缓存
	 */
	enabled?: boolean;

	/**
	 * 缓存键生成器
	 */
	keyGenerator?: (target: MethodDecoratorTarget, propertyKey: string, args: unknown[]) => string;

	/**
	 * 缓存条件
	 */
	condition?: (result: unknown) => boolean;
}

/**
 * 缓存装饰器元数据键
 */
export const CACHEABLE_METADATA_KEY = Symbol('cacheable');

/**
 * 缓存装饰器
 *
 * @description 为方法添加缓存功能
 *
 * @param options - 缓存配置选项
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * @Cacheable({ ttl: 300, keyPrefix: 'user' })
 * async getUser(userId: string): Promise<User> {
 *   return await this.userRepository.findById(userId);
 * }
 * ```
 */
export function Cacheable(options: ICacheableOptions = {}): MethodDecorator {
	return function (target: MethodDecoratorTarget, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
		// 设置元数据
		Reflect.defineMetadata(CACHEABLE_METADATA_KEY, options, target, propertyKey);

		const originalMethod = descriptor.value;

		descriptor.value = async function (...args: unknown[]): Promise<unknown> {
			// 缓存键生成（为未来实现保留）
			// const cacheKey = options.keyGenerator
			//   ? options.keyGenerator(target, propertyKey as string, args)
			//   : `${options.keyPrefix || 'default'}:${propertyKey.toString()}:${JSON.stringify(args)}`;

			// 缓存逻辑将在运行时注入
			// 这里只是设置元数据，实际缓存逻辑由拦截器实现
			return await originalMethod.apply(this, args);
		};

		return descriptor;
	};
}

/**
 * 获取缓存元数据
 *
 * @param target - 目标对象
 * @param propertyKey - 属性键
 * @returns 缓存配置选项
 */
export function getCacheableMetadata(
	target: MethodDecoratorTarget,
	propertyKey: string
): ICacheableOptions | undefined {
	return Reflect.getMetadata(CACHEABLE_METADATA_KEY, target, propertyKey);
}
