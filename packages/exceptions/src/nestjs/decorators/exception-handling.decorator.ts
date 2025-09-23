import { SetMetadata, applyDecorators } from '@nestjs/common';
import { IExceptionHandlingStrategy } from '../../interfaces';

/**
 * 异常处理装饰器选项
 *
 * @description 定义异常处理装饰器的配置选项
 * 支持自定义异常处理策略、重试机制、监控配置等
 *
 * @interface IExceptionHandlingOptions
 */
export interface IExceptionHandlingOptions {
	/**
	 * 异常处理策略
	 *
	 * @description 指定用于处理异常的策略名称或策略实例
	 * 支持内置策略和自定义策略
	 */
	strategy?: string | IExceptionHandlingStrategy;

	/**
	 * 是否启用重试机制
	 *
	 * @description 当异常发生时是否自动重试
	 * 默认值为false
	 */
	enableRetry?: boolean;

	/**
	 * 重试次数
	 *
	 * @description 最大重试次数
	 * 默认值为3次
	 */
	maxRetries?: number;

	/**
	 * 重试延迟
	 *
	 * @description 重试之间的延迟时间（毫秒）
	 * 默认值为1000ms
	 */
	retryDelay?: number;

	/**
	 * 是否启用性能监控
	 *
	 * @description 是否监控异常处理的性能指标
	 * 默认值为true
	 */
	enableMonitoring?: boolean;

	/**
	 * 是否启用日志记录
	 *
	 * @description 是否记录异常处理的详细日志
	 * 默认值为true
	 */
	enableLogging?: boolean;

	/**
	 * 是否启用通知
	 *
	 * @description 是否在异常发生时发送通知
	 * 默认值为false
	 */
	enableNotification?: boolean;

	/**
	 * 自定义错误消息
	 *
	 * @description 自定义的异常错误消息
	 * 用于覆盖默认的错误消息
	 */
	customMessage?: string;

	/**
	 * 自定义错误代码
	 *
	 * @description 自定义的异常错误代码
	 * 用于标识特定的异常类型
	 */
	customCode?: string;

	/**
	 * 异常级别
	 *
	 * @description 异常的严重级别
	 * 影响日志记录、通知和监控行为
	 */
	level?: 'info' | 'warn' | 'error' | 'fatal';

	/**
	 * 是否启用缓存
	 *
	 * @description 是否缓存异常处理结果
	 * 默认值为false
	 */
	enableCache?: boolean;

	/**
	 * 缓存时间
	 *
	 * @description 异常处理结果的缓存时间（秒）
	 * 默认值为300秒
	 */
	cacheTtl?: number;

	/**
	 * 是否启用租户隔离
	 *
	 * @description 是否启用多租户隔离
	 * 默认值为true
	 */
	enableTenantIsolation?: boolean;

	/**
	 * 是否启用降级处理
	 *
	 * @description 当异常处理失败时是否启用降级处理
	 * 默认值为true
	 */
	enableFallback?: boolean;

	/**
	 * 降级处理函数
	 *
	 * @description 降级处理的具体实现函数
	 * 当异常处理失败时调用
	 */
	fallbackHandler?: (error: Error, context: any) => any;

	/**
	 * 是否启用异步处理
	 *
	 * @description 是否异步处理异常
	 * 默认值为false
	 */
	enableAsync?: boolean;

	/**
	 * 异步处理超时
	 *
	 * @description 异步异常处理的超时时间（毫秒）
	 * 默认值为5000ms
	 */
	asyncTimeout?: number;

	/**
	 * 是否启用批量处理
	 *
	 * @description 是否批量处理异常
	 * 默认值为false
	 */
	enableBatch?: boolean;

	/**
	 * 批量处理大小
	 *
	 * @description 批量处理的最大大小
	 * 默认值为10
	 */
	batchSize?: number;

	/**
	 * 批量处理间隔
	 *
	 * @description 批量处理的时间间隔（毫秒）
	 * 默认值为1000ms
	 */
	batchInterval?: number;
}

/**
 * 异常处理装饰器元数据键
 */
export const EXCEPTION_HANDLING_METADATA_KEY = 'exception_handling_options';

/**
 * 异常处理装饰器
 *
 * @description 为方法或类添加异常处理能力
 * 支持自定义异常处理策略、重试机制、监控配置等
 *
 * ## 功能特性
 *
 * ### 异常处理策略
 * - 支持内置策略和自定义策略
 * - 支持策略优先级和组合
 * - 支持策略的动态配置
 *
 * ### 重试机制
 * - 支持自动重试
 * - 支持重试次数和延迟配置
 * - 支持重试条件判断
 *
 * ### 性能监控
 * - 支持异常处理性能监控
 * - 支持性能指标收集
 * - 支持性能报告生成
 *
 * ### 日志记录
 * - 支持结构化日志记录
 * - 支持日志级别控制
 * - 支持敏感数据脱敏
 *
 * ### 通知机制
 * - 支持异常通知
 * - 支持通知渠道配置
 * - 支持通知频率控制
 *
 * ### 缓存机制
 * - 支持异常处理结果缓存
 * - 支持缓存时间配置
 * - 支持缓存策略选择
 *
 * ### 租户隔离
 * - 支持多租户隔离
 * - 支持租户上下文管理
 * - 支持租户级配置
 *
 * ### 降级处理
 * - 支持降级处理机制
 * - 支持降级策略配置
 * - 支持降级条件判断
 *
 * ### 异步处理
 * - 支持异步异常处理
 * - 支持异步超时控制
 * - 支持异步结果处理
 *
 * ### 批量处理
 * - 支持异常批量处理
 * - 支持批量大小配置
 * - 支持批量间隔控制
 *
 * ## 使用示例
 *
 * ### 基础用法
 * ```typescript
 * @ExceptionHandler()
 * async getUserById(id: string): Promise<User> {
 *   // 方法实现
 * }
 * ```
 *
 * ### 自定义策略
 * ```typescript
 * @ExceptionHandler({
 *   strategy: 'custom_strategy',
 *   enableRetry: true,
 *   maxRetries: 3,
 *   retryDelay: 1000
 * })
 * async createUser(userData: CreateUserDto): Promise<User> {
 *   // 方法实现
 * }
 * ```
 *
 * ### 性能监控
 * ```typescript
 * @ExceptionHandler({
 *   enableMonitoring: true,
 *   enableLogging: true,
 *   level: 'error'
 * })
 * async updateUser(id: string, userData: UpdateUserDto): Promise<User> {
 *   // 方法实现
 * }
 * ```
 *
 * ### 缓存和重试
 * ```typescript
 * @ExceptionHandler({
 *   enableCache: true,
 *   cacheTtl: 300,
 *   enableRetry: true,
 *   maxRetries: 5,
 *   retryDelay: 2000
 * })
 * async getExpensiveData(): Promise<ExpensiveData> {
 *   // 方法实现
 * }
 * ```
 *
 * ### 租户隔离
 * ```typescript
 * @ExceptionHandler({
 *   enableTenantIsolation: true,
 *   enableNotification: true,
 *   customMessage: '租户操作失败'
 * })
 * async tenantOperation(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * ### 降级处理
 * ```typescript
 * @ExceptionHandler({
 *   enableFallback: true,
 *   fallbackHandler: (error, context) => {
 *     // 降级处理逻辑
 *     return { success: false, message: '服务暂时不可用' };
 *   }
 * })
 * async criticalOperation(): Promise<Result> {
 *   // 方法实现
 * }
 * ```
 *
 * ### 异步处理
 * ```typescript
 * @ExceptionHandler({
 *   enableAsync: true,
 *   asyncTimeout: 10000,
 *   enableBatch: true,
 *   batchSize: 20
 * })
 * async asyncOperation(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * @param options 异常处理配置选项
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * // 基础异常处理
 * @ExceptionHandler()
 * async basicMethod(): Promise<void> {
 *   // 方法实现
 * }
 *
 * // 高级异常处理
 * @ExceptionHandler({
 *   strategy: 'advanced_strategy',
 *   enableRetry: true,
 *   maxRetries: 3,
 *   enableMonitoring: true,
 *   enableCache: true,
 *   cacheTtl: 600,
 *   enableTenantIsolation: true,
 *   enableNotification: true,
 *   level: 'error'
 * })
 * async advancedMethod(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export function ExceptionHandler(options: IExceptionHandlingOptions = {}): MethodDecorator & ClassDecorator {
	// 设置默认值
	const defaultOptions: Required<IExceptionHandlingOptions> = {
		strategy: 'default',
		enableRetry: false,
		maxRetries: 3,
		retryDelay: 1000,
		enableMonitoring: true,
		enableLogging: true,
		enableNotification: false,
		customMessage: '',
		customCode: '',
		level: 'error',
		enableCache: false,
		cacheTtl: 300,
		enableTenantIsolation: true,
		enableFallback: true,
		fallbackHandler: undefined,
		enableAsync: false,
		asyncTimeout: 5000,
		enableBatch: false,
		batchSize: 10,
		batchInterval: 1000
	};

	// 合并配置
	const finalOptions = { ...defaultOptions, ...options };

	// 验证配置
	validateExceptionHandlingOptions(finalOptions);

	return applyDecorators(SetMetadata(EXCEPTION_HANDLING_METADATA_KEY, finalOptions));
}

/**
 * 验证异常处理配置选项
 *
 * @description 验证异常处理配置选项的有效性
 * 确保配置值在合理范围内
 *
 * @param options 异常处理配置选项
 * @throws {Error} 当配置无效时抛出错误
 *
 * @example
 * ```typescript
 * const options = {
 *   maxRetries: 5,
 *   retryDelay: 2000,
 *   cacheTtl: 600
 * };
 *
 * validateExceptionHandlingOptions(options);
 * ```
 *
 * @since 1.0.0
 */
function validateExceptionHandlingOptions(options: Required<IExceptionHandlingOptions>): void {
	// 验证重试次数
	if (options.maxRetries < 0 || options.maxRetries > 10) {
		throw new Error('重试次数必须在0-10之间');
	}

	// 验证重试延迟
	if (options.retryDelay < 100 || options.retryDelay > 60000) {
		throw new Error('重试延迟必须在100-60000毫秒之间');
	}

	// 验证缓存时间
	if (options.cacheTtl < 0 || options.cacheTtl > 3600) {
		throw new Error('缓存时间必须在0-3600秒之间');
	}

	// 验证异步超时
	if (options.asyncTimeout < 1000 || options.asyncTimeout > 30000) {
		throw new Error('异步超时必须在1000-30000毫秒之间');
	}

	// 验证批量大小
	if (options.batchSize < 1 || options.batchSize > 100) {
		throw new Error('批量大小必须在1-100之间');
	}

	// 验证批量间隔
	if (options.batchInterval < 100 || options.batchInterval > 10000) {
		throw new Error('批量间隔必须在100-10000毫秒之间');
	}

	// 验证异常级别
	const validLevels = ['info', 'warn', 'error', 'fatal'];
	if (!validLevels.includes(options.level)) {
		throw new Error(`异常级别必须是以下之一: ${validLevels.join(', ')}`);
	}
}

/**
 * 获取异常处理配置选项
 *
 * @description 从元数据中获取异常处理配置选项
 * 用于在运行时获取装饰器配置
 *
 * @param target 目标类或方法
 * @param propertyKey 属性键（可选）
 * @returns 异常处理配置选项
 *
 * @example
 * ```typescript
 * const options = getExceptionHandlingOptions(SomeClass, 'someMethod');
 * console.log('异常处理配置:', options);
 * ```
 *
 * @since 1.0.0
 */
export function getExceptionHandlingOptions(
	target: any,
	propertyKey?: string | symbol
): IExceptionHandlingOptions | undefined {
	if (propertyKey) {
		return Reflect.getMetadata(EXCEPTION_HANDLING_METADATA_KEY, target, propertyKey);
	} else {
		return Reflect.getMetadata(EXCEPTION_HANDLING_METADATA_KEY, target);
	}
}

/**
 * 检查是否启用了异常处理
 *
 * @description 检查目标方法或类是否启用了异常处理
 * 用于在运行时判断是否应用异常处理逻辑
 *
 * @param target 目标类或方法
 * @param propertyKey 属性键（可选）
 * @returns 是否启用了异常处理
 *
 * @example
 * ```typescript
 * const hasExceptionHandling = hasExceptionHandlingEnabled(SomeClass, 'someMethod');
 * if (hasExceptionHandling) {
 *   // 应用异常处理逻辑
 * }
 * ```
 *
 * @since 1.0.0
 */
export function hasExceptionHandlingEnabled(target: any, propertyKey?: string | symbol): boolean {
	const options = getExceptionHandlingOptions(target, propertyKey);
	return options !== undefined;
}

/**
 * 异常处理装饰器工厂
 *
 * @description 创建自定义的异常处理装饰器
 * 支持预设配置和动态配置
 *
 * @param presetOptions 预设配置选项
 * @returns 异常处理装饰器函数
 *
 * @example
 * ```typescript
 * // 创建重试装饰器
 * const RetryOnException = createExceptionHandlerDecorator({
 *   enableRetry: true,
 *   maxRetries: 3,
 *   retryDelay: 1000
 * });
 *
 * // 使用重试装饰器
 * @RetryOnException()
 * async retryableMethod(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export function createExceptionHandlerDecorator(presetOptions: Partial<IExceptionHandlingOptions>) {
	return function (options: Partial<IExceptionHandlingOptions> = {}): MethodDecorator & ClassDecorator {
		const mergedOptions = { ...presetOptions, ...options };
		return ExceptionHandler(mergedOptions);
	};
}

/**
 * 预定义的异常处理装饰器
 *
 * @description 提供常用的异常处理装饰器预设
 * 简化常见场景的配置
 */

/**
 * 重试异常处理装饰器
 *
 * @description 启用重试机制的异常处理装饰器
 * 当异常发生时自动重试指定次数
 *
 * @param maxRetries 最大重试次数
 * @param retryDelay 重试延迟时间
 * @returns 异常处理装饰器
 *
 * @example
 * ```typescript
 * @RetryOnException(3, 1000)
 * async retryableMethod(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export const RetryOnException = (maxRetries: number = 3, retryDelay: number = 1000) =>
	createExceptionHandlerDecorator({
		enableRetry: true,
		maxRetries,
		retryDelay
	});

/**
 * 监控异常处理装饰器
 *
 * @description 启用性能监控的异常处理装饰器
 * 记录异常处理的性能指标
 *
 * @param level 异常级别
 * @returns 异常处理装饰器
 *
 * @example
 * ```typescript
 * @MonitorException('error')
 * async monitoredMethod(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export const MonitorException = (level: 'info' | 'warn' | 'error' | 'fatal' = 'error') =>
	createExceptionHandlerDecorator({
		enableMonitoring: true,
		enableLogging: true,
		level
	});

/**
 * 缓存异常处理装饰器
 *
 * @description 启用缓存机制的异常处理装饰器
 * 缓存异常处理结果以提高性能
 *
 * @param cacheTtl 缓存时间
 * @returns 异常处理装饰器
 *
 * @example
 * ```typescript
 * @CacheException(600)
 * async cachedMethod(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export const CacheException = (cacheTtl: number = 300) =>
	createExceptionHandlerDecorator({
		enableCache: true,
		cacheTtl
	});

/**
 * 通知异常处理装饰器
 *
 * @description 启用通知机制的异常处理装饰器
 * 在异常发生时发送通知
 *
 * @param level 异常级别
 * @returns 异常处理装饰器
 *
 * @example
 * ```typescript
 * @NotifyOnException('fatal')
 * async criticalMethod(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export const NotifyOnException = (level: 'error' | 'fatal' = 'fatal') =>
	createExceptionHandlerDecorator({
		enableNotification: true,
		level
	});

/**
 * 租户感知异常处理装饰器
 *
 * @description 启用租户隔离的异常处理装饰器
 * 支持多租户环境下的异常处理
 *
 * @returns 异常处理装饰器
 *
 * @example
 * ```typescript
 * @TenantAwareException()
 * async tenantMethod(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export const TenantAwareException = () =>
	createExceptionHandlerDecorator({
		enableTenantIsolation: true,
		enableNotification: true
	});

/**
 * 异步异常处理装饰器
 *
 * @description 启用异步处理的异常处理装饰器
 * 异步处理异常以提高响应性能
 *
 * @param timeout 异步超时时间
 * @returns 异常处理装饰器
 *
 * @example
 * ```typescript
 * @AsyncException(10000)
 * async asyncMethod(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export const AsyncException = (timeout: number = 5000) =>
	createExceptionHandlerDecorator({
		enableAsync: true,
		asyncTimeout: timeout
	});

/**
 * 批量异常处理装饰器
 *
 * @description 启用批量处理的异常处理装饰器
 * 批量处理异常以提高效率
 *
 * @param batchSize 批量大小
 * @param batchInterval 批量间隔
 * @returns 异常处理装饰器
 *
 * @example
 * ```typescript
 * @BatchException(20, 1000)
 * async batchMethod(): Promise<void> {
 *   // 方法实现
 * }
 * ```
 *
 * @since 1.0.0
 */
export const BatchException = (batchSize: number = 10, batchInterval: number = 1000) =>
	createExceptionHandlerDecorator({
		enableBatch: true,
		batchSize,
		batchInterval
	});
