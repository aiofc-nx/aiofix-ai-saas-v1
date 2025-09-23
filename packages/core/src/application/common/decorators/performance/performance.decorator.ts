import type { MethodDecoratorTarget } from '../../../../common/types/decorator-types';

/**
 * 性能监控装饰器
 *
 * 为应用层方法添加性能监控功能，监控方法执行时间和性能指标。
 * 装饰器通过元数据设置监控配置，实际监控逻辑由拦截器实现。
 *
 * @description 性能监控装饰器提供了声明式的性能监控功能
 *
 * ## 业务规则
 *
 * ### 性能监控规则
 * - 监控方法的执行时间和资源使用
 * - 识别性能瓶颈和慢操作
 * - 记录性能指标用于分析和优化
 * - 支持性能告警和通知
 *
 * ### 性能数据规则
 * - 性能数据应该实时收集和聚合
 * - 性能数据应该支持历史分析
 * - 性能数据应该保护用户隐私
 * - 性能数据应该支持导出和报告
 *
 * @example
 * ```typescript
 * @PerformanceMonitor({
 *   slowThreshold: 1000,
 *   tags: { module: 'user', operation: 'query' }
 * })
 * async processLargeData(data: unknown[]): Promise<ProcessResult> {
 *   // 处理逻辑
 * }
 * ```
 *
 * @since 1.0.0
 */

/**
 * 性能监控配置接口
 */
export interface IPerformanceMonitorOptions {
	/**
	 * 是否启用监控
	 */
	enabled?: boolean;

	/**
	 * 慢操作阈值（毫秒）
	 */
	slowThreshold?: number;

	/**
	 * 是否记录参数
	 */
	logArgs?: boolean;

	/**
	 * 是否记录结果
	 */
	logResult?: boolean;

	/**
	 * 监控标签
	 */
	tags?: Record<string, string>;
}

/**
 * 性能监控装饰器元数据键
 */
export const PERFORMANCE_MONITOR_METADATA_KEY = Symbol('performanceMonitor');

/**
 * 性能监控装饰器
 *
 * @description 为方法添加性能监控功能
 *
 * @param options - 性能监控配置选项
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * @PerformanceMonitor({ slowThreshold: 1000 })
 * async processLargeData(data: unknown[]): Promise<ProcessResult> {
 *   // 处理逻辑
 * }
 * ```
 */
export function PerformanceMonitor(options: IPerformanceMonitorOptions = {}): MethodDecorator {
	return function (target: MethodDecoratorTarget, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
		// 设置元数据
		Reflect.defineMetadata(PERFORMANCE_MONITOR_METADATA_KEY, options, target, propertyKey);

		const originalMethod = descriptor.value;

		descriptor.value = async function (...args: unknown[]): Promise<unknown> {
			// 性能监控逻辑将在运行时注入
			// 这里只是设置元数据，实际监控逻辑由拦截器实现
			return await originalMethod.apply(this, args);
		};

		return descriptor;
	};
}

/**
 * 获取性能监控元数据
 *
 * @param target - 目标对象
 * @param propertyKey - 属性键
 * @returns 性能监控配置选项
 */
export function getPerformanceMonitorMetadata(
	target: MethodDecoratorTarget,
	propertyKey: string
): IPerformanceMonitorOptions | undefined {
	return Reflect.getMetadata(PERFORMANCE_MONITOR_METADATA_KEY, target, propertyKey);
}
