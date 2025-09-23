/**
 * 性能监控装饰器
 *
 * 提供了性能监控的装饰器实现，包括方法执行时间监控、
 * 性能指标收集、性能分析等功能。
 *
 * ## 业务规则
 *
 * ### 性能监控规则
 * - 支持方法执行时间监控
 * - 支持自定义性能指标收集
 * - 支持性能阈值告警
 * - 支持性能数据聚合
 *
 * ### 装饰器规则
 * - 支持类级别和方法级别监控
 * - 支持异步方法监控
 * - 支持性能数据过滤
 * - 支持性能数据采样
 *
 * ### 配置规则
 * - 支持监控开关控制
 * - 支持监控精度配置
 * - 支持监控数据存储配置
 * - 支持监控告警配置
 *
 * @description 性能监控装饰器实现
 * @example
 * ```typescript
 * class UserService {
 *   @PerformanceMonitor({
 *     metricName: 'user.create',
 *     enableTiming: true,
 *     enableErrorTracking: true,
 *     threshold: 1000
 *   })
 *   async createUser(userData: CreateUserData): Promise<User> {
 *     // 用户创建逻辑
 *   }
 *
 *   @PerformanceMonitor({
 *     metricName: 'user.query',
 *     enableTiming: true,
 *     enableCaching: true
 *   })
 *   async getUserById(id: string): Promise<User> {
 *     // 用户查询逻辑
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { SetMetadata } from '@nestjs/common';
import type { IAsyncContext } from '../../common/context/async-context.interface';
import type { DecoratorTarget } from '../../common/types/decorator-types';

// 日志服务接口（避免运行时依赖）
interface ILoggerService {
	info(message: string, context?: unknown): void;
	error(message: string, error?: Error, context?: unknown): void;
	warn(message: string, context?: unknown): void;
	debug(message: string, context?: unknown): void;
}

/**
 * 性能指标类型枚举
 */
export enum PerformanceMetricType {
	RESPONSE_TIME = 'response_time',
	THROUGHPUT = 'throughput',
	ERROR_RATE = 'error_rate',
	CACHE_HIT_RATE = 'cache_hit_rate',
	CUSTOM = 'custom'
}

/**
 * 性能告警级别枚举
 */
export enum PerformanceAlertLevel {
	LOW = 'low',
	WARNING = 'warning',
	ERROR = 'error',
	CRITICAL = 'critical'
}

/**
 * 性能监控选项接口
 */
export interface IPerformanceMonitorOptions {
	/**
	 * 指标名称
	 */
	metricName: string;

	/**
	 * 指标类型
	 */
	metricType?: PerformanceMetricType;

	/**
	 * 是否启用时间监控
	 */
	enableTiming?: boolean;

	/**
	 * 是否启用错误跟踪
	 */
	enableErrorTracking?: boolean;

	/**
	 * 是否启用参数记录
	 */
	enableParameterLogging?: boolean;

	/**
	 * 是否启用返回值记录
	 */
	enableReturnValueLogging?: boolean;

	/**
	 * 是否启用缓存监控
	 */
	enableCaching?: boolean;

	/**
	 * 是否启用数据库监控
	 */
	enableDatabaseMonitoring?: boolean;

	/**
	 * 是否启用网络监控
	 */
	enableNetworkMonitoring?: boolean;

	/**
	 * 性能阈值（毫秒）
	 */
	threshold?: number;

	/**
	 * 告警级别
	 */
	alertLevel?: PerformanceAlertLevel;

	/**
	 * 是否启用采样
	 */
	enableSampling?: boolean;

	/**
	 * 采样率（0-1）
	 */
	samplingRate?: number;

	/**
	 * 是否启用聚合
	 */
	enableAggregation?: boolean;

	/**
	 * 聚合窗口大小（毫秒）
	 */
	aggregationWindowSize?: number;

	/**
	 * 自定义标签
	 */
	tags?: Record<string, string>;

	/**
	 * 自定义元数据
	 */
	metadata?: Record<string, unknown>;

	/**
	 * 是否启用多租户
	 */
	enableMultiTenant?: boolean;

	/**
	 * 是否启用异步上下文
	 */
	enableAsyncContext?: boolean;

	/**
	 * 性能过滤器
	 */
	filter?: (context: IAsyncContext) => boolean;

	/**
	 * 性能转换器
	 */
	transformer?: (value: unknown) => unknown;
}

/**
 * 性能监控元数据键
 */
export const PERFORMANCE_MONITOR_METADATA_KEY = 'performance_monitor_metadata';

/**
 * 性能监控装饰器
 *
 * 用于监控方法或类的性能指标
 *
 * @param options 性能监控选项
 * @returns 装饰器函数
 */
export function PerformanceMonitor(options: IPerformanceMonitorOptions): MethodDecorator & ClassDecorator {
	return (target: DecoratorTarget, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
		if (descriptor) {
			// 方法装饰器
			const originalMethod = descriptor.value;

			descriptor.value = function (...args: unknown[]) {
				const startTime = Date.now();
				let error: Error | undefined;
				let result: unknown;

				try {
					result = originalMethod.apply(this, args);

					// 如果结果是Promise，则处理异步情况
					if (
						result &&
						typeof result === 'object' &&
						result !== null &&
						'then' in result &&
						typeof (result as { then: unknown }).then === 'function'
					) {
						return (result as Promise<unknown>)
							.then((resolvedResult: unknown) => {
								const endTime = Date.now();
								const executionTime = endTime - startTime;

								// 记录性能指标
								PerformanceMonitorDecorator.recordMetric(options, {
									executionTime,
									error: error?.message,
									success: true
								});

								return resolvedResult;
							})
							.catch((err: Error) => {
								error = err;
								const endTime = Date.now();
								const executionTime = endTime - startTime;

								PerformanceMonitorDecorator.recordMetric(options, {
									executionTime,
									error: error?.message,
									success: false
								});

								throw err;
							});
					} else {
						// 同步方法
						const endTime = Date.now();
						const executionTime = endTime - startTime;

						PerformanceMonitorDecorator.recordMetric(options, {
							executionTime,
							error: error?.message,
							success: true
						});

						return result;
					}
				} catch (err) {
					error = err as Error;
					const endTime = Date.now();
					const executionTime = endTime - startTime;

					PerformanceMonitorDecorator.recordMetric(options, {
						executionTime,
						error: error?.message,
						success: false
					});

					throw err;
				}
			};

			// 设置元数据
			if (propertyKey) {
				SetMetadata(PERFORMANCE_MONITOR_METADATA_KEY, options)(
					target as (...args: unknown[]) => unknown,
					propertyKey,
					descriptor
				);
			}
		} else {
			// 类装饰器
			SetMetadata(PERFORMANCE_MONITOR_METADATA_KEY, options)(target as (...args: unknown[]) => unknown);
		}
	};
}

/**
 * 性能监控方法装饰器
 *
 * 专门用于方法级别的性能监控
 *
 * @param options 性能监控选项
 * @returns 方法装饰器
 */
export function PerformanceMonitorMethod(options: IPerformanceMonitorOptions): MethodDecorator {
	return PerformanceMonitor(options) as MethodDecorator;
}

/**
 * 性能监控类装饰器
 *
 * 专门用于类级别的性能监控
 *
 * @param options 性能监控选项
 * @returns 类装饰器
 */
export function PerformanceMonitorClass(options: IPerformanceMonitorOptions): ClassDecorator {
	return PerformanceMonitor(options) as ClassDecorator;
}

/**
 * 响应时间监控装饰器
 *
 * 专门用于监控方法响应时间
 *
 * @param metricName 指标名称
 * @param threshold 响应时间阈值（毫秒）
 * @returns 方法装饰器
 */
export function ResponseTimeMonitor(metricName: string, threshold: number = 1000): MethodDecorator {
	return PerformanceMonitor({
		metricName,
		metricType: PerformanceMetricType.RESPONSE_TIME,
		enableTiming: true,
		threshold,
		alertLevel: PerformanceAlertLevel.WARNING
	});
}

/**
 * 吞吐量监控装饰器
 *
 * 专门用于监控方法吞吐量
 *
 * @param metricName 指标名称
 * @returns 方法装饰器
 */
export function ThroughputMonitor(metricName: string): MethodDecorator {
	return PerformanceMonitor({
		metricName,
		metricType: PerformanceMetricType.THROUGHPUT,
		enableTiming: true,
		enableAggregation: true
	});
}

/**
 * 错误率监控装饰器
 *
 * 专门用于监控方法错误率
 *
 * @param metricName 指标名称
 * @returns 方法装饰器
 */
export function ErrorRateMonitor(metricName: string): MethodDecorator {
	return PerformanceMonitor({
		metricName,
		metricType: PerformanceMetricType.ERROR_RATE,
		enableErrorTracking: true,
		enableAggregation: true
	});
}

/**
 * 数据库性能监控装饰器
 *
 * 专门用于监控数据库操作性能
 *
 * @param metricName 指标名称
 * @param threshold 响应时间阈值（毫秒）
 * @returns 方法装饰器
 */
export function DatabasePerformanceMonitor(metricName: string, threshold: number = 500): MethodDecorator {
	return PerformanceMonitor({
		metricName,
		metricType: PerformanceMetricType.RESPONSE_TIME,
		enableTiming: true,
		enableDatabaseMonitoring: true,
		threshold,
		alertLevel: PerformanceAlertLevel.ERROR,
		tags: {
			component: 'database',
			operation: 'query'
		}
	});
}

/**
 * 缓存性能监控装饰器
 *
 * 专门用于监控缓存操作性能
 *
 * @param metricName 指标名称
 * @returns 方法装饰器
 */
export function CachePerformanceMonitor(metricName: string): MethodDecorator {
	return PerformanceMonitor({
		metricName,
		metricType: PerformanceMetricType.CACHE_HIT_RATE,
		enableTiming: true,
		enableCaching: true,
		tags: {
			component: 'cache'
		}
	});
}

/**
 * 网络性能监控装饰器
 *
 * 专门用于监控网络操作性能
 *
 * @param metricName 指标名称
 * @param threshold 响应时间阈值（毫秒）
 * @returns 方法装饰器
 */
export function NetworkPerformanceMonitor(metricName: string, threshold: number = 2000): MethodDecorator {
	return PerformanceMonitor({
		metricName,
		metricType: PerformanceMetricType.RESPONSE_TIME,
		enableTiming: true,
		enableNetworkMonitoring: true,
		threshold,
		alertLevel: PerformanceAlertLevel.WARNING,
		tags: {
			component: 'network'
		}
	});
}

/**
 * 自定义性能监控装饰器
 *
 * 用于自定义性能指标监控
 *
 * @param metricName 指标名称
 * @param metricType 指标类型
 * @param options 额外选项
 * @returns 方法装饰器
 */
export function CustomPerformanceMonitor(
	metricName: string,
	metricType: PerformanceMetricType,
	options: Partial<IPerformanceMonitorOptions> = {}
): MethodDecorator {
	return PerformanceMonitor({
		metricName,
		metricType,
		enableTiming: true,
		...options
	});
}

/**
 * 获取性能监控元数据
 *
 * @param target 目标类或方法
 * @param propertyKey 属性键（可选）
 * @returns 性能监控元数据
 */
export function getPerformanceMonitorMetadata(
	target: DecoratorTarget,
	propertyKey?: string | symbol
): IPerformanceMonitorOptions | undefined {
	if (propertyKey) {
		return Reflect.getMetadata(PERFORMANCE_MONITOR_METADATA_KEY, target, propertyKey);
	} else {
		return Reflect.getMetadata(PERFORMANCE_MONITOR_METADATA_KEY, target);
	}
}

/**
 * 检查是否有性能监控元数据
 *
 * @param target 目标类或方法
 * @param propertyKey 属性键（可选）
 * @returns 是否有性能监控元数据
 */
export function hasPerformanceMonitorMetadata(target: DecoratorTarget, propertyKey?: string | symbol): boolean {
	return getPerformanceMonitorMetadata(target, propertyKey) !== undefined;
}

/**
 * 性能监控工具函数
 */
export class PerformanceMonitorUtils {
	/**
	 * 创建性能指标
	 *
	 * @param name 指标名称
	 * @param value 指标值
	 * @param type 指标类型
	 * @param tags 标签
	 * @returns 性能指标
	 */
	static createMetric(
		name: string,
		value: number,
		type: PerformanceMetricType = PerformanceMetricType.CUSTOM,
		tags: Record<string, string> = {}
	) {
		return {
			id: `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			name,
			type,
			value,
			unit: 'ms',
			tags,
			metadata: {},
			timestamp: new Date()
		};
	}

	/**
	 * 计算性能统计信息
	 *
	 * @param values 数值数组
	 * @returns 统计信息
	 */
	static calculateStatistics(values: number[]) {
		if (values.length === 0) {
			return {
				count: 0,
				min: 0,
				max: 0,
				average: 0,
				median: 0,
				p95: 0,
				p99: 0,
				standardDeviation: 0
			};
		}

		const sorted = [...values].sort((a, b) => a - b);
		const count = values.length;
		const min = sorted[0];
		const max = sorted[count - 1];
		const average = values.reduce((sum, val) => sum + val, 0) / count;
		const median = count % 2 === 0 ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2 : sorted[Math.floor(count / 2)];

		const p95Index = Math.floor(count * 0.95);
		const p99Index = Math.floor(count * 0.99);
		const p95 = sorted[p95Index];
		const p99 = sorted[p99Index];

		const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / count;
		const standardDeviation = Math.sqrt(variance);

		return {
			count,
			min,
			max,
			average,
			median,
			p95,
			p99,
			standardDeviation
		};
	}

	/**
	 * 格式化性能指标值
	 *
	 * @param value 指标值
	 * @param unit 单位
	 * @returns 格式化后的值
	 */
	static formatMetricValue(value: number, unit: string = 'ms'): string {
		if (unit === 'ms') {
			if (value < 1000) {
				return `${value.toFixed(2)}ms`;
			} else if (value < 60000) {
				return `${(value / 1000).toFixed(2)}s`;
			} else {
				return `${(value / 60000).toFixed(2)}m`;
			}
		}

		if (unit === 'bytes') {
			if (value < 1024) {
				return `${value.toFixed(2)}B`;
			} else if (value < 1024 * 1024) {
				return `${(value / 1024).toFixed(2)}KB`;
			} else if (value < 1024 * 1024 * 1024) {
				return `${(value / (1024 * 1024)).toFixed(2)}MB`;
			} else {
				return `${(value / (1024 * 1024 * 1024)).toFixed(2)}GB`;
			}
		}

		return `${value.toFixed(2)}${unit}`;
	}
}

/**
 * 性能监控装饰器内部实现类
 */
class PerformanceMonitorDecorator {
	private static logger: ILoggerService | null = null;

	/**
	 * 设置日志服务
	 */
	static setLogger(logger: ILoggerService): void {
		this.logger = logger;
	}

	/**
	 * 记录性能指标
	 */
	static recordMetric(
		options: IPerformanceMonitorOptions,
		data: {
			executionTime: number;
			error?: string;
			success: boolean;
		}
	): void {
		const metricData = {
			metricName: options.metricName,
			metricType: options.metricType || PerformanceMetricType.RESPONSE_TIME,
			executionTime: data.executionTime,
			success: data.success,
			error: data.error,
			timestamp: new Date(),
			tags: options.tags || {},
			metadata: options.metadata || {}
		};

		// 使用日志服务记录，如果没有则使用默认的 console.warn
		if (this.logger) {
			if (data.success) {
				this.logger.info(`Performance Monitor - ${options.metricName}`, metricData);
			} else {
				this.logger.error(`Performance Monitor - ${options.metricName}`, new Error(data.error), metricData);
			}
		} else {
			// 后备方案：使用 console.warn（仅在开发环境）
			if (process.env.NODE_ENV !== 'production') {
				console.warn(`Performance Monitor - ${options.metricName}:`, metricData);
			}
		}

		// TODO: 这里应该集成到实际的性能监控服务
		// 例如：发送到 Prometheus、InfluxDB、或自定义的监控系统
	}
}
