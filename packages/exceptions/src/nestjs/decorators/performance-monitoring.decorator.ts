import { SetMetadata, applyDecorators } from '@nestjs/common';

/**
 * 性能监控装饰器选项
 */
export interface IPerformanceMonitoringOptions {
	/** 是否启用性能监控 */
	enabled?: boolean;
	/** 监控级别 */
	level?: 'basic' | 'detailed' | 'comprehensive';
	/** 是否记录响应时间 */
	recordResponseTime?: boolean;
	/** 是否记录内存使用 */
	recordMemoryUsage?: boolean;
	/** 是否记录CPU使用 */
	recordCpuUsage?: boolean;
	/** 是否记录数据库查询 */
	recordDatabaseQueries?: boolean;
	/** 是否记录外部API调用 */
	recordExternalCalls?: boolean;
	/** 性能阈值配置 */
	thresholds?: {
		responseTime?: number;
		memoryUsage?: number;
		cpuUsage?: number;
	};
	/** 是否启用告警 */
	enableAlerts?: boolean;
	/** 告警配置 */
	alertConfig?: {
		responseTimeThreshold?: number;
		memoryThreshold?: number;
		cpuThreshold?: number;
	};
}

/**
 * 性能监控装饰器元数据键
 */
export const PERFORMANCE_MONITORING_METADATA_KEY = 'performance_monitoring_options';

/**
 * 性能监控装饰器
 *
 * @description 为方法添加性能监控能力
 * 支持响应时间、内存使用、CPU使用等指标监控
 *
 * @param options 性能监控配置选项
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * @PerformanceMonitoring({
 *   level: 'detailed',
 *   recordResponseTime: true,
 *   enableAlerts: true
 * })
 * async monitoredMethod(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export function PerformanceMonitoring(options: IPerformanceMonitoringOptions = {}): MethodDecorator {
	const defaultOptions: Required<IPerformanceMonitoringOptions> = {
		enabled: true,
		level: 'basic',
		recordResponseTime: true,
		recordMemoryUsage: false,
		recordCpuUsage: false,
		recordDatabaseQueries: false,
		recordExternalCalls: false,
		thresholds: {
			responseTime: 1000,
			memoryUsage: 0.8,
			cpuUsage: 0.8
		},
		enableAlerts: false,
		alertConfig: {
			responseTimeThreshold: 5000,
			memoryThreshold: 0.9,
			cpuThreshold: 0.9
		}
	};

	const finalOptions = { ...defaultOptions, ...options };
	validatePerformanceMonitoringOptions(finalOptions);

	return applyDecorators(SetMetadata(PERFORMANCE_MONITORING_METADATA_KEY, finalOptions));
}

/**
 * 验证性能监控配置选项
 */
function validatePerformanceMonitoringOptions(options: Required<IPerformanceMonitoringOptions>): void {
	const validLevels = ['basic', 'detailed', 'comprehensive'];
	if (!validLevels.includes(options.level)) {
		throw new Error(`监控级别必须是以下之一: ${validLevels.join(', ')}`);
	}

	if (options.thresholds.responseTime < 0) {
		throw new Error('响应时间阈值必须大于0');
	}

	if (options.thresholds.memoryUsage < 0 || options.thresholds.memoryUsage > 1) {
		throw new Error('内存使用率阈值必须在0-1之间');
	}

	if (options.thresholds.cpuUsage < 0 || options.thresholds.cpuUsage > 1) {
		throw new Error('CPU使用率阈值必须在0-1之间');
	}
}

/**
 * 获取性能监控配置选项
 */
export function getPerformanceMonitoringOptions(
	target: any,
	propertyKey: string | symbol
): IPerformanceMonitoringOptions | undefined {
	return Reflect.getMetadata(PERFORMANCE_MONITORING_METADATA_KEY, target, propertyKey);
}

/**
 * 检查是否启用了性能监控
 */
export function hasPerformanceMonitoringEnabled(target: any, propertyKey: string | symbol): boolean {
	const options = getPerformanceMonitoringOptions(target, propertyKey);
	return options?.enabled === true;
}

/**
 * 预定义的性能监控装饰器
 */

/**
 * 基础性能监控装饰器
 */
export const BasicMonitoring = () =>
	PerformanceMonitoring({
		level: 'basic',
		recordResponseTime: true
	});

/**
 * 详细性能监控装饰器
 */
export const DetailedMonitoring = () =>
	PerformanceMonitoring({
		level: 'detailed',
		recordResponseTime: true,
		recordMemoryUsage: true,
		recordCpuUsage: true
	});

/**
 * 全面性能监控装饰器
 */
export const ComprehensiveMonitoring = () =>
	PerformanceMonitoring({
		level: 'comprehensive',
		recordResponseTime: true,
		recordMemoryUsage: true,
		recordCpuUsage: true,
		recordDatabaseQueries: true,
		recordExternalCalls: true,
		enableAlerts: true
	});

/**
 * 响应时间监控装饰器
 */
export const ResponseTimeMonitoring = (threshold: number = 1000) =>
	PerformanceMonitoring({
		recordResponseTime: true,
		thresholds: { responseTime: threshold },
		enableAlerts: true,
		alertConfig: { responseTimeThreshold: threshold * 2 }
	});

/**
 * 内存监控装饰器
 */
export const MemoryMonitoring = (threshold: number = 0.8) =>
	PerformanceMonitoring({
		recordMemoryUsage: true,
		thresholds: { memoryUsage: threshold },
		enableAlerts: true,
		alertConfig: { memoryThreshold: threshold + 0.1 }
	});

/**
 * CPU监控装饰器
 */
export const CpuMonitoring = (threshold: number = 0.8) =>
	PerformanceMonitoring({
		recordCpuUsage: true,
		thresholds: { cpuUsage: threshold },
		enableAlerts: true,
		alertConfig: { cpuThreshold: threshold + 0.1 }
	});
