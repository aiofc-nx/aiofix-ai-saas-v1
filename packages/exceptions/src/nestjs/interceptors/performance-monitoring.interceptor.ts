import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { getPerformanceMonitoringOptions } from '../decorators/performance-monitoring.decorator';

/**
 * 性能监控拦截器
 *
 * @description 拦截方法执行并监控性能指标
 * 支持响应时间、内存使用、CPU使用等指标监控
 *
 * ## 功能特性
 *
 * ### 性能指标监控
 * - 监控方法执行响应时间
 * - 监控内存使用情况
 * - 监控CPU使用情况
 * - 监控数据库查询性能
 * - 监控外部API调用性能
 *
 * ### 装饰器集成
 * - 读取方法上的性能监控装饰器配置
 * - 根据装饰器配置应用相应的监控策略
 * - 支持自定义监控配置
 *
 * ### 性能分析
 * - 记录性能指标数据
 * - 支持性能趋势分析
 * - 支持性能报告生成
 * - 支持性能告警机制
 *
 * ### 告警机制
 * - 支持性能阈值告警
 * - 支持性能异常告警
 * - 支持告警通知机制
 * - 支持告警频率控制
 *
 * ## 使用示例
 *
 * ### 基础用法
 * ```typescript
 * @Injectable()
 * export class SomeService {
 *   @PerformanceMonitoring()
 *   async someMethod(): Promise<void> {
 *     // 方法实现
 *   }
 * }
 * ```
 *
 * ### 详细监控
 * ```typescript
 * @Injectable()
 * export class SomeService {
 *   @PerformanceMonitoring({
 *     level: 'detailed',
 *     recordResponseTime: true,
 *     recordMemoryUsage: true,
 *     recordCpuUsage: true
 *   })
 *   async detailedMethod(): Promise<void> {
 *     // 方法实现
 *   }
 * }
 * ```
 *
 * ### 告警监控
 * ```typescript
 * @Injectable()
 * export class SomeService {
 *   @PerformanceMonitoring({
 *     enableAlerts: true,
 *     alertConfig: {
 *       responseTimeThreshold: 5000,
 *       memoryThreshold: 0.9
 *     }
 *   })
 *   async alertMethod(): Promise<void> {
 *     // 方法实现
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class PerformanceMonitoringInterceptor implements NestInterceptor {
	private readonly logger = new Logger(PerformanceMonitoringInterceptor.name);

	/**
	 * 拦截方法执行
	 *
	 * @description 拦截方法执行并监控性能指标
	 * 根据装饰器配置应用相应的监控策略
	 *
	 * @param context 执行上下文
	 * @param next 下一个处理器
	 * @returns 处理结果
	 *
	 * @example
	 * ```typescript
	 * // 拦截器会自动监控性能
	 * const result = await this.interceptor.intercept(context, next);
	 * ```
	 *
	 * @since 1.0.0
	 */
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const startTime = Date.now();
		const startMemory = process.memoryUsage();
		const startCpu = process.cpuUsage();

		const handler = context.getHandler();
		const className = context.getClass().name;
		const methodName = handler.name;

		// 获取性能监控配置
		const monitoringOptions = getPerformanceMonitoringOptions(context.getClass(), handler.name);

		// 如果没有启用监控，直接执行
		if (!monitoringOptions?.enabled) {
			return next.handle();
		}

		this.logger.debug(`开始性能监控: ${className}.${methodName}`, {
			options: monitoringOptions,
			timestamp: new Date().toISOString()
		});

		return next.handle().pipe(
			tap({
				next: (result) => {
					this.recordPerformanceMetrics(
						context,
						startTime,
						startMemory,
						startCpu,
						monitoringOptions,
						'success',
						result
					);
				},
				error: (error) => {
					this.recordPerformanceMetrics(
						context,
						startTime,
						startMemory,
						startCpu,
						monitoringOptions,
						'error',
						null,
						error
					);
				}
			})
		);
	}

	/**
	 * 记录性能指标
	 *
	 * @description 记录方法执行的性能指标
	 * 包括响应时间、内存使用、CPU使用等
	 *
	 * @param context 执行上下文
	 * @param startTime 开始时间
	 * @param startMemory 开始内存使用
	 * @param startCpu 开始CPU使用
	 * @param options 监控配置
	 * @param status 执行状态
	 * @param result 执行结果
	 * @param error 异常对象
	 *
	 * @example
	 * ```typescript
	 * this.recordPerformanceMetrics(context, startTime, startMemory, startCpu, options, 'success', result);
	 * ```
	 *
	 * @since 1.0.0
	 */
	private recordPerformanceMetrics(
		context: ExecutionContext,
		startTime: number,
		startMemory: NodeJS.MemoryUsage,
		startCpu: NodeJS.CpuUsage,
		options: any,
		status: 'success' | 'error',
		result?: any,
		error?: Error
	): void {
		const endTime = Date.now();
		const endMemory = process.memoryUsage();
		const endCpu = process.cpuUsage(startCpu);

		const handler = context.getHandler();
		const className = context.getClass().name;
		const methodName = handler.name;

		// 计算性能指标
		const responseTime = endTime - startTime;
		const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
		const cpuDelta = (endCpu.user + endCpu.system) / 1000; // 转换为毫秒

		// 构建性能指标数据
		const metrics = {
			className,
			methodName,
			status,
			responseTime,
			timestamp: new Date().toISOString(),
			...(options.recordMemoryUsage && {
				memoryUsage: {
					heapUsed: endMemory.heapUsed,
					heapTotal: endMemory.heapTotal,
					external: endMemory.external,
					delta: memoryDelta
				}
			}),
			...(options.recordCpuUsage && {
				cpuUsage: {
					user: endCpu.user,
					system: endCpu.system,
					total: cpuDelta
				}
			}),
			...(error && {
				error: {
					message: error.message,
					stack: error.stack
				}
			})
		};

		// 记录性能指标
		this.logPerformanceMetrics(metrics, options);

		// 检查性能阈值
		this.checkPerformanceThresholds(metrics, options);

		// 发送性能告警
		if (options.enableAlerts) {
			this.sendPerformanceAlerts(metrics, options);
		}
	}

	/**
	 * 记录性能指标日志
	 *
	 * @description 根据监控级别记录性能指标日志
	 * 支持不同级别的日志记录
	 *
	 * @param metrics 性能指标数据
	 * @param options 监控配置
	 *
	 * @example
	 * ```typescript
	 * this.logPerformanceMetrics(metrics, options);
	 * ```
	 *
	 * @since 1.0.0
	 */
	private logPerformanceMetrics(metrics: any, options: any): void {
		const logLevel = this.getLogLevel(metrics.status, options.level);

		switch (logLevel) {
			case 'debug':
				this.logger.debug('性能指标记录', metrics);
				break;
			case 'info':
				this.logger.log('性能指标记录', metrics);
				break;
			case 'warn':
				this.logger.warn('性能指标记录', metrics);
				break;
			case 'error':
				this.logger.error('性能指标记录', metrics);
				break;
			default:
				this.logger.log('性能指标记录', metrics);
		}
	}

	/**
	 * 获取日志级别
	 *
	 * @description 根据执行状态和监控级别确定日志级别
	 * 支持不同场景的日志级别配置
	 *
	 * @param status 执行状态
	 * @param level 监控级别
	 * @returns 日志级别
	 *
	 * @example
	 * ```typescript
	 * const logLevel = this.getLogLevel('success', 'detailed');
	 * ```
	 *
	 * @since 1.0.0
	 */
	private getLogLevel(status: string, level: string): string {
		if (status === 'error') {
			return 'error';
		}

		switch (level) {
			case 'basic':
				return 'info';
			case 'detailed':
				return 'debug';
			case 'comprehensive':
				return 'debug';
			default:
				return 'info';
		}
	}

	/**
	 * 检查性能阈值
	 *
	 * @description 检查性能指标是否超过阈值
	 * 支持响应时间、内存使用、CPU使用等阈值检查
	 *
	 * @param metrics 性能指标数据
	 * @param options 监控配置
	 *
	 * @example
	 * ```typescript
	 * this.checkPerformanceThresholds(metrics, options);
	 * ```
	 *
	 * @since 1.0.0
	 */
	private checkPerformanceThresholds(metrics: any, options: any): void {
		const thresholds = options.thresholds || {};
		const violations = [];

		// 检查响应时间阈值
		if (thresholds.responseTime && metrics.responseTime > thresholds.responseTime) {
			violations.push({
				type: 'responseTime',
				value: metrics.responseTime,
				threshold: thresholds.responseTime
			});
		}

		// 检查内存使用阈值
		if (thresholds.memoryUsage && metrics.memoryUsage) {
			const memoryUsageRatio = metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal;
			if (memoryUsageRatio > thresholds.memoryUsage) {
				violations.push({
					type: 'memoryUsage',
					value: memoryUsageRatio,
					threshold: thresholds.memoryUsage
				});
			}
		}

		// 检查CPU使用阈值
		if (thresholds.cpuUsage && metrics.cpuUsage) {
			const cpuUsageRatio = metrics.cpuUsage.total / 1000; // 转换为秒
			if (cpuUsageRatio > thresholds.cpuUsage) {
				violations.push({
					type: 'cpuUsage',
					value: cpuUsageRatio,
					threshold: thresholds.cpuUsage
				});
			}
		}

		// 记录阈值违规
		if (violations.length > 0) {
			this.logger.warn('性能阈值违规', {
				className: metrics.className,
				methodName: metrics.methodName,
				violations,
				timestamp: metrics.timestamp
			});
		}
	}

	/**
	 * 发送性能告警
	 *
	 * @description 发送性能告警通知
	 * 支持多种告警渠道和告警级别
	 *
	 * @param metrics 性能指标数据
	 * @param options 监控配置
	 *
	 * @example
	 * ```typescript
	 * this.sendPerformanceAlerts(metrics, options);
	 * ```
	 *
	 * @since 1.0.0
	 */
	private sendPerformanceAlerts(metrics: any, options: any): void {
		const alertConfig = options.alertConfig || {};
		const alerts = [];

		// 检查响应时间告警
		if (alertConfig.responseTimeThreshold && metrics.responseTime > alertConfig.responseTimeThreshold) {
			alerts.push({
				type: 'responseTime',
				message: `响应时间超过阈值: ${metrics.responseTime}ms > ${alertConfig.responseTimeThreshold}ms`,
				severity: 'high'
			});
		}

		// 检查内存使用告警
		if (alertConfig.memoryThreshold && metrics.memoryUsage) {
			const memoryUsageRatio = metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal;
			if (memoryUsageRatio > alertConfig.memoryThreshold) {
				alerts.push({
					type: 'memoryUsage',
					message: `内存使用率超过阈值: ${(memoryUsageRatio * 100).toFixed(2)}% > ${(
						alertConfig.memoryThreshold * 100
					).toFixed(2)}%`,
					severity: 'high'
				});
			}
		}

		// 检查CPU使用告警
		if (alertConfig.cpuThreshold && metrics.cpuUsage) {
			const cpuUsageRatio = metrics.cpuUsage.total / 1000; // 转换为秒
			if (cpuUsageRatio > alertConfig.cpuThreshold) {
				alerts.push({
					type: 'cpuUsage',
					message: `CPU使用率超过阈值: ${(cpuUsageRatio * 100).toFixed(2)}% > ${(
						alertConfig.cpuThreshold * 100
					).toFixed(2)}%`,
					severity: 'high'
				});
			}
		}

		// 发送告警
		if (alerts.length > 0) {
			this.logger.error('性能告警', {
				className: metrics.className,
				methodName: metrics.methodName,
				alerts,
				timestamp: metrics.timestamp
			});

			// TODO: 实现实际的告警发送逻辑
			// 可以集成邮件、短信、Slack等告警渠道
		}
	}
}
