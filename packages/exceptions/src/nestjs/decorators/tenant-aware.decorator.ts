import { SetMetadata, applyDecorators } from '@nestjs/common';
// import { IExceptionHandlingOptions } from './exception-handling.decorator';

/**
 * 租户感知装饰器选项
 *
 * @description 定义租户感知装饰器的配置选项
 * 支持租户隔离、租户上下文管理、租户级配置等
 *
 * @interface ITenantAwareOptions
 */
export interface ITenantAwareOptions {
	/**
	 * 是否启用租户隔离
	 *
	 * @description 是否启用多租户隔离
	 * 默认值为true
	 */
	enableIsolation?: boolean;

	/**
	 * 租户隔离级别
	 *
	 * @description 租户隔离的级别
	 * 支持数据隔离、配置隔离、资源隔离等
	 */
	isolationLevel?: 'data' | 'config' | 'resource' | 'full';

	/**
	 * 是否启用租户上下文
	 *
	 * @description 是否自动注入租户上下文
	 * 默认值为true
	 */
	enableContext?: boolean;

	/**
	 * 是否启用租户验证
	 *
	 * @description 是否验证租户权限和状态
	 * 默认值为true
	 */
	enableValidation?: boolean;

	/**
	 * 是否启用租户监控
	 *
	 * @description 是否监控租户相关的异常
	 * 默认值为true
	 */
	enableMonitoring?: boolean;

	/**
	 * 是否启用租户通知
	 *
	 * @description 是否在租户异常时发送通知
	 * 默认值为false
	 */
	enableNotification?: boolean;

	/**
	 * 租户ID字段名
	 *
	 * @description 请求中租户ID的字段名
	 * 默认值为'tenantId'
	 */
	tenantIdField?: string;

	/**
	 * 组织ID字段名
	 *
	 * @description 请求中组织ID的字段名
	 * 默认值为'organizationId'
	 */
	organizationIdField?: string;

	/**
	 * 部门ID字段名
	 *
	 * @description 请求中部门ID的字段名
	 * 默认值为'departmentId'
	 */
	departmentIdField?: string;

	/**
	 * 用户ID字段名
	 *
	 * @description 请求中用户ID的字段名
	 * 默认值为'userId'
	 */
	userIdField?: string;

	/**
	 * 是否启用租户级缓存
	 *
	 * @description 是否启用租户级别的缓存
	 * 默认值为true
	 */
	enableTenantCache?: boolean;

	/**
	 * 租户缓存前缀
	 *
	 * @description 租户缓存的键前缀
	 * 默认值为'tenant'
	 */
	tenantCachePrefix?: string;

	/**
	 * 是否启用租户级配置
	 *
	 * @description 是否启用租户级别的配置
	 * 默认值为true
	 */
	enableTenantConfig?: boolean;

	/**
	 * 租户配置优先级
	 *
	 * @description 租户配置的优先级
	 * 支持全局、租户、组织、部门等优先级
	 */
	configPriority?: ('global' | 'tenant' | 'organization' | 'department')[];

	/**
	 * 是否启用租户级日志
	 *
	 * @description 是否启用租户级别的日志记录
	 * 默认值为true
	 */
	enableTenantLogging?: boolean;

	/**
	 * 租户日志级别
	 *
	 * @description 租户日志的级别
	 * 默认值为'info'
	 */
	tenantLogLevel?: 'debug' | 'info' | 'warn' | 'error' | 'fatal';

	/**
	 * 是否启用租户级统计
	 *
	 * @description 是否启用租户级别的统计
	 * 默认值为true
	 */
	enableTenantStats?: boolean;

	/**
	 * 是否启用租户级告警
	 *
	 * @description 是否启用租户级别的告警
	 * 默认值为false
	 */
	enableTenantAlerts?: boolean;

	/**
	 * 租户告警阈值
	 *
	 * @description 租户告警的阈值配置
	 */
	alertThresholds?: {
		errorRate?: number;
		responseTime?: number;
		memoryUsage?: number;
		cpuUsage?: number;
	};

	/**
	 * 是否启用租户级限流
	 *
	 * @description 是否启用租户级别的限流
	 * 默认值为false
	 */
	enableTenantRateLimit?: boolean;

	/**
	 * 租户限流配置
	 *
	 * @description 租户限流的配置
	 */
	rateLimitConfig?: {
		requests: number;
		windowMs: number;
		skipSuccessfulRequests?: boolean;
		skipFailedRequests?: boolean;
	};

	/**
	 * 是否启用租户级熔断
	 *
	 * @description 是否启用租户级别的熔断
	 * 默认值为false
	 */
	enableTenantCircuitBreaker?: boolean;

	/**
	 * 租户熔断配置
	 *
	 * @description 租户熔断的配置
	 */
	circuitBreakerConfig?: {
		failureThreshold: number;
		recoveryTimeout: number;
		monitoringPeriod: number;
	};

	/**
	 * 是否启用租户级重试
	 *
	 * @description 是否启用租户级别的重试
	 * 默认值为false
	 */
	enableTenantRetry?: boolean;

	/**
	 * 租户重试配置
	 *
	 * @description 租户重试的配置
	 */
	retryConfig?: {
		maxRetries: number;
		retryDelay: number;
		backoffMultiplier: number;
		maxRetryDelay: number;
	};

	/**
	 * 是否启用租户级降级
	 *
	 * @description 是否启用租户级别的降级
	 * 默认值为false
	 */
	enableTenantFallback?: boolean;

	/**
	 * 租户降级配置
	 *
	 * @description 租户降级的配置
	 */
	fallbackConfig?: {
		fallbackStrategy: 'default' | 'cached' | 'mock' | 'custom';
		fallbackHandler?: (tenantId: string, error: Error) => any;
	};

	/**
	 * 是否启用租户级审计
	 *
	 * @description 是否启用租户级别的审计
	 * 默认值为true
	 */
	enableTenantAudit?: boolean;

	/**
	 * 租户审计配置
	 *
	 * @description 租户审计的配置
	 */
	auditConfig?: {
		auditLevel: 'basic' | 'detailed' | 'comprehensive';
		auditFields: string[];
		auditRetention: number;
	};
}

/**
 * 租户感知装饰器元数据键
 */
export const TENANT_AWARE_METADATA_KEY = 'tenant_aware_options';

/**
 * 租户感知装饰器
 *
 * @description 为方法或类添加租户感知能力
 * 支持租户隔离、租户上下文管理、租户级配置等
 *
 * ## 功能特性
 *
 * ### 租户隔离
 * - 支持数据隔离、配置隔离、资源隔离
 * - 支持不同级别的隔离策略
 * - 支持隔离级别的动态配置
 *
 * ### 租户上下文
 * - 自动注入租户上下文信息
 * - 支持租户ID、组织ID、部门ID、用户ID
 * - 支持上下文信息的自动传递
 *
 * ### 租户验证
 * - 验证租户权限和状态
 * - 验证租户配置的有效性
 * - 验证租户资源的可用性
 *
 * ### 租户监控
 * - 监控租户相关的异常
 * - 监控租户性能指标
 * - 监控租户资源使用情况
 *
 * ### 租户通知
 * - 租户异常时发送通知
 * - 支持多种通知渠道
 * - 支持通知频率控制
 *
 * ### 租户缓存
 * - 租户级别的缓存管理
 * - 支持缓存键的租户隔离
 * - 支持缓存策略的租户配置
 *
 * ### 租户配置
 * - 租户级别的配置管理
 * - 支持配置优先级
 * - 支持配置的动态更新
 *
 * ### 租户日志
 * - 租户级别的日志记录
 * - 支持日志级别的租户配置
 * - 支持日志的租户隔离
 *
 * ### 租户统计
 * - 租户级别的统计信息
 * - 支持统计数据的租户隔离
 * - 支持统计报告的租户生成
 *
 * ### 租户告警
 * - 租户级别的告警机制
 * - 支持告警阈值的租户配置
 * - 支持告警的租户隔离
 *
 * ### 租户限流
 * - 租户级别的限流控制
 * - 支持限流策略的租户配置
 * - 支持限流的租户隔离
 *
 * ### 租户熔断
 * - 租户级别的熔断机制
 * - 支持熔断策略的租户配置
 * - 支持熔断的租户隔离
 *
 * ### 租户重试
 * - 租户级别的重试机制
 * - 支持重试策略的租户配置
 * - 支持重试的租户隔离
 *
 * ### 租户降级
 * - 租户级别的降级机制
 * - 支持降级策略的租户配置
 * - 支持降级的租户隔离
 *
 * ### 租户审计
 * - 租户级别的审计功能
 * - 支持审计级别的租户配置
 * - 支持审计的租户隔离
 *
 * ## 使用示例
 *
 * ### 基础用法
 * ```typescript
 * @TenantAware()
 * async getUserById(id: string): Promise<User> {
 *   // 方法实现
 * }
 * ```
 *
 * ### 租户隔离
 * ```typescript
 * @TenantAware({
 *   enableIsolation: true,
 *   isolationLevel: 'data',
 *   enableContext: true
 * })
 * async getTenantData(): Promise<TenantData> {
 *   // 方法实现
 * }
 * ```
 *
 * ### 租户监控
 * ```typescript
 * @TenantAware({
 *   enableMonitoring: true,
 *   enableNotification: true,
 *   enableTenantStats: true
 * })
 * async criticalTenantOperation(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * ### 租户缓存
 * ```typescript
 * @TenantAware({
 *   enableTenantCache: true,
 *   tenantCachePrefix: 'tenant_data',
 *   enableTenantConfig: true
 * })
 * async getCachedTenantData(): Promise<TenantData> {
 *   // 方法实现
 * }
 * ```
 *
 * ### 租户限流
 * ```typescript
 * @TenantAware({
 *   enableTenantRateLimit: true,
 *   rateLimitConfig: {
 *     requests: 100,
 *     windowMs: 60000
 *   }
 * })
 * async rateLimitedOperation(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * ### 租户熔断
 * ```typescript
 * @TenantAware({
 *   enableTenantCircuitBreaker: true,
 *   circuitBreakerConfig: {
 *     failureThreshold: 5,
 *     recoveryTimeout: 30000
 *   }
 * })
 * async circuitBreakerOperation(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * ### 租户重试
 * ```typescript
 * @TenantAware({
 *   enableTenantRetry: true,
 *   retryConfig: {
 *     maxRetries: 3,
 *     retryDelay: 1000,
 *     backoffMultiplier: 2
 *   }
 * })
 * async retryableOperation(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * ### 租户降级
 * ```typescript
 * @TenantAware({
 *   enableTenantFallback: true,
 *   fallbackConfig: {
 *     fallbackStrategy: 'cached',
 *     fallbackHandler: (tenantId, error) => {
 *       // 降级处理逻辑
 *       return { success: false, message: '服务暂时不可用' };
 *     }
 *   }
 * })
 * async fallbackOperation(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * ### 租户审计
 * ```typescript
 * @TenantAware({
 *   enableTenantAudit: true,
 *   auditConfig: {
 *     auditLevel: 'detailed',
 *     auditFields: ['tenantId', 'userId', 'operation'],
 *     auditRetention: 90
 *   }
 * })
 * async auditedOperation(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * @param options 租户感知配置选项
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * // 基础租户感知
 * @TenantAware()
 * async basicTenantMethod(): Promise<void> {
 *   // 方法实现
 * }
 *
 * // 高级租户感知
 * @TenantAware({
 *   enableIsolation: true,
 *   isolationLevel: 'full',
 *   enableContext: true,
 *   enableValidation: true,
 *   enableMonitoring: true,
 *   enableNotification: true,
 *   enableTenantCache: true,
 *   enableTenantConfig: true,
 *   enableTenantLogging: true,
 *   enableTenantStats: true,
 *   enableTenantAlerts: true,
 *   enableTenantRateLimit: true,
 *   enableTenantCircuitBreaker: true,
 *   enableTenantRetry: true,
 *   enableTenantFallback: true,
 *   enableTenantAudit: true
 * })
 * async advancedTenantMethod(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export function TenantAware(options: ITenantAwareOptions = {}): MethodDecorator & ClassDecorator {
	// 设置默认值
	const defaultOptions: Required<ITenantAwareOptions> = {
		enableIsolation: true,
		isolationLevel: 'data',
		enableContext: true,
		enableValidation: true,
		enableMonitoring: true,
		enableNotification: false,
		tenantIdField: 'tenantId',
		organizationIdField: 'organizationId',
		departmentIdField: 'departmentId',
		userIdField: 'userId',
		enableTenantCache: true,
		tenantCachePrefix: 'tenant',
		enableTenantConfig: true,
		configPriority: ['global', 'tenant', 'organization', 'department'],
		enableTenantLogging: true,
		tenantLogLevel: 'info',
		enableTenantStats: true,
		enableTenantAlerts: false,
		alertThresholds: {
			errorRate: 0.1,
			responseTime: 5000,
			memoryUsage: 0.8,
			cpuUsage: 0.8
		},
		enableTenantRateLimit: false,
		rateLimitConfig: {
			requests: 100,
			windowMs: 60000,
			skipSuccessfulRequests: false,
			skipFailedRequests: false
		},
		enableTenantCircuitBreaker: false,
		circuitBreakerConfig: {
			failureThreshold: 5,
			recoveryTimeout: 30000,
			monitoringPeriod: 60000
		},
		enableTenantRetry: false,
		retryConfig: {
			maxRetries: 3,
			retryDelay: 1000,
			backoffMultiplier: 2,
			maxRetryDelay: 10000
		},
		enableTenantFallback: false,
		fallbackConfig: {
			fallbackStrategy: 'default',
			fallbackHandler: undefined
		},
		enableTenantAudit: true,
		auditConfig: {
			auditLevel: 'basic',
			auditFields: ['tenantId', 'userId', 'operation'],
			auditRetention: 90
		}
	};

	// 合并配置
	const finalOptions = { ...defaultOptions, ...options };

	// 验证配置
	validateTenantAwareOptions(finalOptions);

	return applyDecorators(SetMetadata(TENANT_AWARE_METADATA_KEY, finalOptions));
}

/**
 * 验证租户感知配置选项
 *
 * @description 验证租户感知配置选项的有效性
 * 确保配置值在合理范围内
 *
 * @param options 租户感知配置选项
 * @throws {Error} 当配置无效时抛出错误
 *
 * @example
 * ```typescript
 * const options = {
 *   isolationLevel: 'data',
 *   enableTenantCache: true,
 *   tenantCachePrefix: 'tenant'
 * };
 *
 * validateTenantAwareOptions(options);
 * ```
 *
 * @since 1.0.0
 */
function validateTenantAwareOptions(options: Required<ITenantAwareOptions>): void {
	// 验证隔离级别
	const validIsolationLevels = ['data', 'config', 'resource', 'full'];
	if (!validIsolationLevels.includes(options.isolationLevel)) {
		throw new Error(`隔离级别必须是以下之一: ${validIsolationLevels.join(', ')}`);
	}

	// 验证配置优先级
	const validConfigPriorities = ['global', 'tenant', 'organization', 'department'];
	for (const priority of options.configPriority) {
		if (!validConfigPriorities.includes(priority)) {
			throw new Error(`配置优先级必须是以下之一: ${validConfigPriorities.join(', ')}`);
		}
	}

	// 验证日志级别
	const validLogLevels = ['debug', 'info', 'warn', 'error', 'fatal'];
	if (!validLogLevels.includes(options.tenantLogLevel)) {
		throw new Error(`日志级别必须是以下之一: ${validLogLevels.join(', ')}`);
	}

	// 验证告警阈值
	if (options.alertThresholds.errorRate < 0 || options.alertThresholds.errorRate > 1) {
		throw new Error('错误率阈值必须在0-1之间');
	}

	if (options.alertThresholds.responseTime < 0) {
		throw new Error('响应时间阈值必须大于0');
	}

	if (options.alertThresholds.memoryUsage < 0 || options.alertThresholds.memoryUsage > 1) {
		throw new Error('内存使用率阈值必须在0-1之间');
	}

	if (options.alertThresholds.cpuUsage < 0 || options.alertThresholds.cpuUsage > 1) {
		throw new Error('CPU使用率阈值必须在0-1之间');
	}

	// 验证限流配置
	if (options.rateLimitConfig.requests < 1) {
		throw new Error('限流请求数必须大于0');
	}

	if (options.rateLimitConfig.windowMs < 1000) {
		throw new Error('限流时间窗口必须大于1000毫秒');
	}

	// 验证熔断配置
	if (options.circuitBreakerConfig.failureThreshold < 1) {
		throw new Error('熔断失败阈值必须大于0');
	}

	if (options.circuitBreakerConfig.recoveryTimeout < 1000) {
		throw new Error('熔断恢复超时必须大于1000毫秒');
	}

	if (options.circuitBreakerConfig.monitoringPeriod < 1000) {
		throw new Error('熔断监控周期必须大于1000毫秒');
	}

	// 验证重试配置
	if (options.retryConfig.maxRetries < 0 || options.retryConfig.maxRetries > 10) {
		throw new Error('重试次数必须在0-10之间');
	}

	if (options.retryConfig.retryDelay < 100) {
		throw new Error('重试延迟必须大于100毫秒');
	}

	if (options.retryConfig.backoffMultiplier < 1) {
		throw new Error('退避乘数必须大于1');
	}

	if (options.retryConfig.maxRetryDelay < options.retryConfig.retryDelay) {
		throw new Error('最大重试延迟必须大于初始重试延迟');
	}

	// 验证降级配置
	const validFallbackStrategies = ['default', 'cached', 'mock', 'custom'];
	if (!validFallbackStrategies.includes(options.fallbackConfig.fallbackStrategy)) {
		throw new Error(`降级策略必须是以下之一: ${validFallbackStrategies.join(', ')}`);
	}

	// 验证审计配置
	const validAuditLevels = ['basic', 'detailed', 'comprehensive'];
	if (!validAuditLevels.includes(options.auditConfig.auditLevel)) {
		throw new Error(`审计级别必须是以下之一: ${validAuditLevels.join(', ')}`);
	}

	if (options.auditConfig.auditRetention < 1) {
		throw new Error('审计保留期必须大于0天');
	}
}

/**
 * 获取租户感知配置选项
 *
 * @description 从元数据中获取租户感知配置选项
 * 用于在运行时获取装饰器配置
 *
 * @param target 目标类或方法
 * @param propertyKey 属性键（可选）
 * @returns 租户感知配置选项
 *
 * @example
 * ```typescript
 * const options = getTenantAwareOptions(SomeClass, 'someMethod');
 * console.log('租户感知配置:', options);
 * ```
 *
 * @since 1.0.0
 */
export function getTenantAwareOptions(target: any, propertyKey?: string | symbol): ITenantAwareOptions | undefined {
	if (propertyKey) {
		return Reflect.getMetadata(TENANT_AWARE_METADATA_KEY, target, propertyKey);
	} else {
		return Reflect.getMetadata(TENANT_AWARE_METADATA_KEY, target);
	}
}

/**
 * 检查是否启用了租户感知
 *
 * @description 检查目标方法或类是否启用了租户感知
 * 用于在运行时判断是否应用租户感知逻辑
 *
 * @param target 目标类或方法
 * @param propertyKey 属性键（可选）
 * @returns 是否启用了租户感知
 *
 * @example
 * ```typescript
 * const hasTenantAware = hasTenantAwareEnabled(SomeClass, 'someMethod');
 * if (hasTenantAware) {
 *   // 应用租户感知逻辑
 * }
 * ```
 *
 * @since 1.0.0
 */
export function hasTenantAwareEnabled(target: any, propertyKey?: string | symbol): boolean {
	const options = getTenantAwareOptions(target, propertyKey);
	return options !== undefined;
}

/**
 * 租户感知装饰器工厂
 *
 * @description 创建自定义的租户感知装饰器
 * 支持预设配置和动态配置
 *
 * @param presetOptions 预设配置选项
 * @returns 租户感知装饰器函数
 *
 * @example
 * ```typescript
 * // 创建数据隔离装饰器
 * const DataIsolation = createTenantAwareDecorator({
 *   enableIsolation: true,
 *   isolationLevel: 'data',
 *   enableContext: true
 * });
 *
 * // 使用数据隔离装饰器
 * @DataIsolation()
 * async dataIsolatedMethod(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export function createTenantAwareDecorator(presetOptions: Partial<ITenantAwareOptions>) {
	return function (options: Partial<ITenantAwareOptions> = {}): MethodDecorator & ClassDecorator {
		const mergedOptions = { ...presetOptions, ...options };
		return TenantAware(mergedOptions);
	};
}

/**
 * 预定义的租户感知装饰器
 *
 * @description 提供常用的租户感知装饰器预设
 * 简化常见场景的配置
 */

/**
 * 数据隔离装饰器
 *
 * @description 启用数据隔离的租户感知装饰器
 * 确保租户数据完全隔离
 *
 * @returns 租户感知装饰器
 *
 * @example
 * ```typescript
 * @DataIsolation()
 * async dataIsolatedMethod(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export const DataIsolation = () =>
	createTenantAwareDecorator({
		enableIsolation: true,
		isolationLevel: 'data',
		enableContext: true,
		enableValidation: true
	});

/**
 * 配置隔离装饰器
 *
 * @description 启用配置隔离的租户感知装饰器
 * 确保租户配置完全隔离
 *
 * @returns 租户感知装饰器
 *
 * @example
 * ```typescript
 * @ConfigIsolation()
 * async configIsolatedMethod(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export const ConfigIsolation = () =>
	createTenantAwareDecorator({
		enableIsolation: true,
		isolationLevel: 'config',
		enableTenantConfig: true,
		configPriority: ['tenant', 'global']
	});

/**
 * 资源隔离装饰器
 *
 * @description 启用资源隔离的租户感知装饰器
 * 确保租户资源完全隔离
 *
 * @returns 租户感知装饰器
 *
 * @example
 * ```typescript
 * @ResourceIsolation()
 * async resourceIsolatedMethod(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export const ResourceIsolation = () =>
	createTenantAwareDecorator({
		enableIsolation: true,
		isolationLevel: 'resource',
		enableTenantCache: true,
		enableTenantRateLimit: true
	});

/**
 * 完全隔离装饰器
 *
 * @description 启用完全隔离的租户感知装饰器
 * 确保租户在所有方面完全隔离
 *
 * @returns 租户感知装饰器
 *
 * @example
 * ```typescript
 * @FullIsolation()
 * async fullyIsolatedMethod(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export const FullIsolation = () =>
	createTenantAwareDecorator({
		enableIsolation: true,
		isolationLevel: 'full',
		enableContext: true,
		enableValidation: true,
		enableTenantCache: true,
		enableTenantConfig: true,
		enableTenantLogging: true,
		enableTenantStats: true,
		enableTenantAudit: true
	});

/**
 * 租户监控装饰器
 *
 * @description 启用租户监控的租户感知装饰器
 * 监控租户相关的异常和性能
 *
 * @returns 租户感知装饰器
 *
 * @example
 * ```typescript
 * @TenantMonitoring()
 * async monitoredMethod(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export const TenantMonitoring = () =>
	createTenantAwareDecorator({
		enableMonitoring: true,
		enableTenantStats: true,
		enableTenantAlerts: true,
		enableTenantLogging: true
	});

/**
 * 租户限流装饰器
 *
 * @description 启用租户限流的租户感知装饰器
 * 对租户进行限流控制
 *
 * @param requests 请求数限制
 * @param windowMs 时间窗口
 * @returns 租户感知装饰器
 *
 * @example
 * ```typescript
 * @TenantRateLimit(100, 60000)
 * async rateLimitedMethod(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export const TenantRateLimit = (requests: number = 100, windowMs: number = 60000) =>
	createTenantAwareDecorator({
		enableTenantRateLimit: true,
		rateLimitConfig: {
			requests,
			windowMs,
			skipSuccessfulRequests: false,
			skipFailedRequests: false
		}
	});

/**
 * 租户熔断装饰器
 *
 * @description 启用租户熔断的租户感知装饰器
 * 对租户进行熔断保护
 *
 * @param failureThreshold 失败阈值
 * @param recoveryTimeout 恢复超时
 * @returns 租户感知装饰器
 *
 * @example
 * ```typescript
 * @TenantCircuitBreaker(5, 30000)
 * async circuitBreakerMethod(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export const TenantCircuitBreaker = (failureThreshold: number = 5, recoveryTimeout: number = 30000) =>
	createTenantAwareDecorator({
		enableTenantCircuitBreaker: true,
		circuitBreakerConfig: {
			failureThreshold,
			recoveryTimeout,
			monitoringPeriod: 60000
		}
	});

/**
 * 租户重试装饰器
 *
 * @description 启用租户重试的租户感知装饰器
 * 对租户进行重试保护
 *
 * @param maxRetries 最大重试次数
 * @param retryDelay 重试延迟
 * @returns 租户感知装饰器
 *
 * @example
 * ```typescript
 * @TenantRetry(3, 1000)
 * async retryableMethod(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export const TenantRetry = (maxRetries: number = 3, retryDelay: number = 1000) =>
	createTenantAwareDecorator({
		enableTenantRetry: true,
		retryConfig: {
			maxRetries,
			retryDelay,
			backoffMultiplier: 2,
			maxRetryDelay: 10000
		}
	});

/**
 * 租户降级装饰器
 *
 * @description 启用租户降级的租户感知装饰器
 * 对租户进行降级保护
 *
 * @param fallbackStrategy 降级策略
 * @returns 租户感知装饰器
 *
 * @example
 * ```typescript
 * @TenantFallback('cached')
 * async fallbackMethod(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export const TenantFallback = (fallbackStrategy: 'default' | 'cached' | 'mock' | 'custom' = 'default') =>
	createTenantAwareDecorator({
		enableTenantFallback: true,
		fallbackConfig: {
			fallbackStrategy,
			fallbackHandler: undefined
		}
	});

/**
 * 租户审计装饰器
 *
 * @description 启用租户审计的租户感知装饰器
 * 对租户进行审计记录
 *
 * @param auditLevel 审计级别
 * @returns 租户感知装饰器
 *
 * @example
 * ```typescript
 * @TenantAudit('detailed')
 * async auditedMethod(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export const TenantAudit = (auditLevel: 'basic' | 'detailed' | 'comprehensive' = 'basic') =>
	createTenantAwareDecorator({
		enableTenantAudit: true,
		auditConfig: {
			auditLevel,
			auditFields: ['tenantId', 'userId', 'operation'],
			auditRetention: 90
		}
	});
