/**
 * 装饰器中间件系统
 *
 * @description 提供装饰器的中间件功能，支持横切关注点的处理
 * 包括日志记录、性能监控、错误处理、验证等通用功能
 *
 * ## 核心功能
 *
 * ### 🔌 **中间件系统**
 * - 可插拔的中间件架构
 * - 支持前置和后置处理
 * - 中间件链式执行
 *
 * ### 📊 **内置中间件**
 * - 日志记录中间件
 * - 性能监控中间件
 * - 错误处理中间件
 * - 参数验证中间件
 *
 * ### 🎯 **自定义中间件**
 * - 支持自定义中间件开发
 * - 中间件注册和管理
 * - 中间件配置和参数传递
 *
 * @example
 * ```typescript
 * import {
 *   withMiddleware,
 *   LoggingMiddleware,
 *   PerformanceMiddleware
 * } from '@aiofix/messaging';
 *
 * // 使用内置中间件
 * @MessageHandler('user.created')
 * @withMiddleware(LoggingMiddleware, PerformanceMiddleware)
 * export class UserCreatedHandler {
 *   async handle(message: UserCreatedMessage): Promise<void> {
 *     // 处理逻辑会被中间件包装
 *   }
 * }
 *
 * // 自定义中间件
 * const CustomMiddleware: IDecoratorMiddleware = {
 *   async before(context) {
 *     console.log('执行前处理');
 *   },
 *   async after(context, result) {
 *     console.log('执行后处理');
 *   }
 * };
 * ```
 *
 * @since 1.0.0
 */

/**
 * 中间件执行上下文
 */
export interface IMiddlewareContext {
	/** 目标类 */
	target: any;
	/** 方法名称 */
	methodName: string;
	/** 方法参数 */
	args: any[];
	/** 装饰器元数据 */
	metadata: any;
	/** 执行开始时间 */
	startTime: number;
	/** 租户上下文 */
	tenantContext?: any;
	/** 自定义属性 */
	properties: Map<string, any>;
}

/**
 * 装饰器中间件接口
 */
export interface IDecoratorMiddleware {
	/** 中间件名称 */
	name?: string;

	/**
	 * 前置处理
	 * @param context 执行上下文
	 */
	before?(context: IMiddlewareContext): Promise<void> | void;

	/**
	 * 后置处理
	 * @param context 执行上下文
	 * @param result 执行结果
	 */
	after?(context: IMiddlewareContext, result: any): Promise<void> | void;

	/**
	 * 错误处理
	 * @param context 执行上下文
	 * @param error 错误对象
	 */
	onError?(context: IMiddlewareContext, error: Error): Promise<void> | void;

	/**
	 * 最终处理（无论成功还是失败都会执行）
	 * @param context 执行上下文
	 */
	finally?(context: IMiddlewareContext): Promise<void> | void;
}

/**
 * 中间件管理器
 */
export class MiddlewareManager {
	private static middlewares = new Map<string, IDecoratorMiddleware>();

	/**
	 * 注册中间件
	 */
	static register(name: string, middleware: IDecoratorMiddleware): void {
		this.middlewares.set(name, middleware);
	}

	/**
	 * 获取中间件
	 */
	static get(name: string): IDecoratorMiddleware | undefined {
		return this.middlewares.get(name);
	}

	/**
	 * 获取所有中间件
	 */
	static getAll(): Map<string, IDecoratorMiddleware> {
		return new Map(this.middlewares);
	}

	/**
	 * 清空中间件
	 */
	static clear(): void {
		this.middlewares.clear();
	}
}

/**
 * 中间件装饰器
 *
 * @param middlewares 要应用的中间件列表
 * @returns 方法装饰器
 */
export function withMiddleware(...middlewares: (IDecoratorMiddleware | string)[]): MethodDecorator {
	return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
		const originalMethod = descriptor.value;

		descriptor.value = async function (...args: any[]) {
			const context: IMiddlewareContext = {
				target,
				methodName: String(propertyKey),
				args,
				metadata: Reflect.getMetadata('messaging:handler', target) || {},
				startTime: performance.now(),
				properties: new Map()
			};

			// 解析中间件
			const resolvedMiddlewares = middlewares
				.map((m) => (typeof m === 'string' ? MiddlewareManager.get(m) : m))
				.filter(Boolean) as IDecoratorMiddleware[];

			let result: any;
			let error: Error | null = null;

			try {
				// 执行前置中间件
				for (const middleware of resolvedMiddlewares) {
					if (middleware.before) {
						await middleware.before(context);
					}
				}

				// 执行原方法
				result = await originalMethod.apply(this, args);

				// 执行后置中间件
				for (const middleware of resolvedMiddlewares.reverse()) {
					if (middleware.after) {
						await middleware.after(context, result);
					}
				}

				return result;
			} catch (err) {
				error = err as Error;

				// 执行错误处理中间件
				for (const middleware of resolvedMiddlewares) {
					if (middleware.onError) {
						await middleware.onError(context, error);
					}
				}

				throw error;
			} finally {
				// 执行最终处理中间件
				for (const middleware of resolvedMiddlewares) {
					if (middleware.finally) {
						await middleware.finally(context);
					}
				}
			}
		};

		return descriptor;
	};
}

// ==================== 内置中间件 ====================

/**
 * 日志记录中间件
 */
export const LoggingMiddleware: IDecoratorMiddleware = {
	name: 'logging',

	async before(context: IMiddlewareContext): Promise<void> {
		console.warn(`[${new Date().toISOString()}] 开始执行 ${context.target.constructor.name}.${context.methodName}`);
		console.warn('参数:', context.args);
	},

	async after(context: IMiddlewareContext, result: any): Promise<void> {
		const duration = performance.now() - context.startTime;
		console.warn(`[${new Date().toISOString()}] 执行完成 ${context.target.constructor.name}.${context.methodName}`);
		console.warn('结果:', result);
		console.warn('耗时:', `${duration.toFixed(2)}ms`);
	},

	async onError(context: IMiddlewareContext, error: Error): Promise<void> {
		const duration = performance.now() - context.startTime;
		console.error(`[${new Date().toISOString()}] 执行失败 ${context.target.constructor.name}.${context.methodName}`);
		console.error('错误:', error.message);
		console.error('耗时:', `${duration.toFixed(2)}ms`);
	}
};

/**
 * 性能监控中间件
 */
export const PerformanceMiddleware: IDecoratorMiddleware = {
	name: 'performance',

	async before(context: IMiddlewareContext): Promise<void> {
		context.properties.set('startMemory', process.memoryUsage());
	},

	async after(context: IMiddlewareContext, _result: any): Promise<void> {
		const duration = performance.now() - context.startTime;
		const startMemory = context.properties.get('startMemory');
		const endMemory = process.memoryUsage();

		const memoryDiff = {
			heapUsed: endMemory.heapUsed - startMemory.heapUsed,
			heapTotal: endMemory.heapTotal - startMemory.heapTotal,
			external: endMemory.external - startMemory.external
		};

		console.warn(`性能统计 - ${context.target.constructor.name}.${context.methodName}:`);
		console.warn(`  执行时间: ${duration.toFixed(2)}ms`);
		console.warn(`  内存变化: ${(memoryDiff.heapUsed / 1024 / 1024).toFixed(2)}MB`);
	}
};

/**
 * 错误处理中间件
 */
export const ErrorHandlingMiddleware: IDecoratorMiddleware = {
	name: 'errorHandling',

	async onError(context: IMiddlewareContext, error: Error): Promise<void> {
		// 记录详细的错误信息
		const errorInfo = {
			timestamp: new Date().toISOString(),
			handler: `${context.target.constructor.name}.${context.methodName}`,
			error: {
				name: error.name,
				message: error.message,
				stack: error.stack
			},
			context: {
				args: context.args,
				metadata: context.metadata
			}
		};

		console.error('详细错误信息:', JSON.stringify(errorInfo, null, 2));

		// 可以在这里添加错误上报逻辑
		// await errorReportingService.report(errorInfo);
	}
};

/**
 * 参数验证中间件
 */
export const ValidationMiddleware: IDecoratorMiddleware = {
	name: 'validation',

	async before(context: IMiddlewareContext): Promise<void> {
		// 简单的参数验证示例
		if (!context.args || context.args.length === 0) {
			throw new Error('方法参数不能为空');
		}

		// 检查第一个参数是否为对象
		const firstArg = context.args[0];
		if (typeof firstArg !== 'object' || firstArg === null) {
			throw new Error('第一个参数必须是对象');
		}

		console.warn('参数验证通过');
	}
};

/**
 * 重试中间件
 */
export class RetryMiddleware implements IDecoratorMiddleware {
	name = 'retry';

	constructor(private maxRetries: number = 3, private retryDelay: number = 1000) {}

	async before(context: IMiddlewareContext): Promise<void> {
		context.properties.set('retryCount', 0);
	}

	async onError(context: IMiddlewareContext, _error: Error): Promise<void> {
		const retryCount = context.properties.get('retryCount') || 0;

		if (retryCount < this.maxRetries) {
			context.properties.set('retryCount', retryCount + 1);

			console.warn(`重试第 ${retryCount + 1} 次，延迟 ${this.retryDelay}ms`);

			// 等待重试延迟
			await new Promise((resolve) => globalThis.setTimeout(resolve, this.retryDelay));

			// 这里需要重新执行方法，但由于装饰器的限制，
			// 实际的重试逻辑需要在更高层实现
			console.warn('重试逻辑需要在方法级别实现');
		} else {
			console.warn(`已达到最大重试次数 ${this.maxRetries}，停止重试`);
		}
	}
}

/**
 * 租户上下文中间件
 */
export const TenantContextMiddleware: IDecoratorMiddleware = {
	name: 'tenantContext',

	async before(context: IMiddlewareContext): Promise<void> {
		// 从环境变量或请求上下文获取租户信息
		const tenantId = process.env.TENANT_ID || 'default';

		context.tenantContext = {
			tenantId,
			timestamp: new Date()
		};

		console.warn('设置租户上下文:', context.tenantContext);
	},

	async finally(context: IMiddlewareContext): Promise<void> {
		// 清理租户上下文
		context.tenantContext = undefined;
		console.warn('清理租户上下文');
	}
};

// ==================== 中间件组合 ====================

/**
 * 标准中间件组合
 */
export const StandardMiddlewares = [LoggingMiddleware, PerformanceMiddleware, ErrorHandlingMiddleware];

/**
 * 开发环境中间件组合
 */
export const DevelopmentMiddlewares = [
	LoggingMiddleware,
	PerformanceMiddleware,
	ErrorHandlingMiddleware,
	ValidationMiddleware
];

/**
 * 生产环境中间件组合
 */
export const ProductionMiddlewares = [ErrorHandlingMiddleware, PerformanceMiddleware];

/**
 * 企业级中间件组合
 */
export const EnterpriseMiddlewares = [
	TenantContextMiddleware,
	LoggingMiddleware,
	PerformanceMiddleware,
	ErrorHandlingMiddleware,
	ValidationMiddleware
];

/**
 * 创建环境感知的中间件装饰器
 */
export function createEnvironmentAwareMiddleware(): MethodDecorator {
	const isProduction = process.env.NODE_ENV === 'production';
	const middlewares = isProduction ? ProductionMiddlewares : DevelopmentMiddlewares;

	return withMiddleware(...middlewares);
}

/**
 * 创建可配置的中间件装饰器
 */
export function createConfigurableMiddleware(
	config: {
		enableLogging?: boolean;
		enablePerformance?: boolean;
		enableValidation?: boolean;
		enableTenantContext?: boolean;
		customMiddlewares?: IDecoratorMiddleware[];
	} = {}
): MethodDecorator {
	const middlewares: IDecoratorMiddleware[] = [];

	if (config.enableTenantContext) {
		middlewares.push(TenantContextMiddleware);
	}

	if (config.enableLogging) {
		middlewares.push(LoggingMiddleware);
	}

	if (config.enablePerformance) {
		middlewares.push(PerformanceMiddleware);
	}

	middlewares.push(ErrorHandlingMiddleware); // 错误处理总是启用

	if (config.enableValidation) {
		middlewares.push(ValidationMiddleware);
	}

	if (config.customMiddlewares) {
		middlewares.push(...config.customMiddlewares);
	}

	return withMiddleware(...middlewares);
}

// 注册内置中间件
MiddlewareManager.register('logging', LoggingMiddleware);
MiddlewareManager.register('performance', PerformanceMiddleware);
MiddlewareManager.register('errorHandling', ErrorHandlingMiddleware);
MiddlewareManager.register('validation', ValidationMiddleware);
MiddlewareManager.register('tenantContext', TenantContextMiddleware);
