/**
 * 异常处理核心接口定义
 *
 * 定义了统一异常处理系统的核心接口，包括异常管理器、异常分类、异常上下文等。
 * 这些接口为整个异常处理系统提供了标准化的契约。
 *
 * @description 异常处理核心接口定义
 * @since 1.0.0
 */

import type { ArgumentsHost } from '@nestjs/common';

/**
 * 基础异常类型定义
 *
 * 所有异常都应该符合这个基础结构，提供统一的异常处理基础。
 * 这避免了使用 any 类型，提高了类型安全性。
 */
export type BaseException = Record<string, unknown>;

/**
 * 异常级别枚举
 */
export enum ExceptionLevel {
	/**
	 * 信息级别 - 一般信息记录
	 */
	INFO = 'info',

	/**
	 * 警告级别 - 需要注意但不影响系统运行
	 */
	WARN = 'warn',

	/**
	 * 错误级别 - 影响功能但系统可继续运行
	 */
	ERROR = 'error',

	/**
	 * 致命级别 - 系统无法继续运行
	 */
	FATAL = 'fatal'
}

/**
 * 异常分类枚举
 */
export enum ExceptionCategory {
	/**
	 * HTTP异常 - 与HTTP请求相关的异常
	 */
	HTTP = 'http',

	/**
	 * 应用层异常 - 业务逻辑相关的异常
	 */
	APPLICATION = 'application',

	/**
	 * 领域异常 - 领域规则相关的异常
	 */
	DOMAIN = 'domain',

	/**
	 * 基础设施异常 - 技术基础设施相关的异常
	 */
	INFRASTRUCTURE = 'infrastructure',

	/**
	 * 外部服务异常 - 第三方服务相关的异常
	 */
	EXTERNAL = 'external',

	/**
	 * 配置异常 - 配置相关的异常
	 */
	CONFIGURATION = 'configuration',

	/**
	 * 验证异常 - 数据验证相关的异常
	 */
	VALIDATION = 'validation'
}

/**
 * 异常处理策略枚举
 */
export enum ExceptionHandlingStrategy {
	/**
	 * 记录策略 - 仅记录异常
	 */
	LOG_ONLY = 'log_only',

	/**
	 * 通知策略 - 记录并发送通知
	 */
	NOTIFY = 'notify',

	/**
	 * 恢复策略 - 尝试自动恢复
	 */
	RECOVER = 'recover',

	/**
	 * 降级策略 - 启用降级服务
	 */
	FALLBACK = 'fallback',

	/**
	 * 阻断策略 - 阻断请求
	 */
	BLOCK = 'block'
}

/**
 * 异常上下文接口
 */
export interface IExceptionContext {
	/**
	 * 异常ID
	 */
	readonly id: string;

	/**
	 * 租户ID
	 */
	readonly tenantId?: string;

	/**
	 * 用户ID
	 */
	readonly userId?: string;

	/**
	 * 组织ID
	 */
	readonly organizationId?: string;

	/**
	 * 部门ID
	 */
	readonly departmentId?: string;

	/**
	 * 请求ID
	 */
	readonly requestId?: string;

	/**
	 * 关联ID
	 */
	readonly correlationId?: string;

	/**
	 * 用户代理
	 */
	readonly userAgent?: string;

	/**
	 * IP地址
	 */
	readonly ipAddress?: string;

	/**
	 * 请求来源
	 */
	readonly source?: 'WEB' | 'API' | 'CLI' | 'SYSTEM';

	/**
	 * 异常发生时间
	 */
	readonly occurredAt: Date;

	/**
	 * 自定义上下文数据
	 */
	readonly customData?: Record<string, unknown>;
}

/**
 * 统一异常接口
 */
export interface IUnifiedException {
	/**
	 * 异常ID
	 */
	readonly id: string;

	/**
	 * 异常分类
	 */
	readonly category: ExceptionCategory;

	/**
	 * 异常级别
	 */
	readonly level: ExceptionLevel;

	/**
	 * 异常消息
	 */
	readonly message: string;

	/**
	 * 异常代码
	 */
	readonly code: string;

	/**
	 * 异常上下文
	 */
	readonly context: IExceptionContext;

	/**
	 * 原始错误
	 */
	readonly originalError?: Error;

	/**
	 * 异常发生时间
	 */
	readonly occurredAt: Date;

	/**
	 * 转换为错误响应
	 *
	 * @param requestId - 请求ID
	 * @returns 错误响应对象
	 */
	toErrorResponse(requestId: string): Record<string, unknown>;

	/**
	 * 获取用户友好的错误消息
	 *
	 * @returns 用户友好的错误消息
	 */
	getUserFriendlyMessage(): string;

	/**
	 * 获取恢复建议
	 *
	 * @returns 恢复建议
	 */
	getRecoveryAdvice(): string;

	/**
	 * 是否应该发送通知
	 *
	 * @returns 是否应该发送通知
	 */
	shouldNotify(): boolean;

	/**
	 * 是否应该记录日志
	 *
	 * @returns 是否应该记录日志
	 */
	shouldLog(): boolean;
}

/**
 * 异常处理器接口
 */
export interface IExceptionHandler {
	/**
	 * 处理器名称
	 */
	readonly name: string;

	/**
	 * 处理器优先级
	 */
	readonly priority: number;

	/**
	 * 处理异常
	 *
	 * @param exception - 统一异常
	 * @param host - 执行上下文
	 * @returns 处理结果
	 */
	handle(exception: IUnifiedException, host: ArgumentsHost): Promise<IExceptionHandlingResult>;

	/**
	 * 检查是否应该处理此异常
	 *
	 * @param exception - 统一异常
	 * @returns 如果应该处理则返回 true，否则返回 false
	 */
	shouldHandle(exception: IUnifiedException): boolean;
}

/**
 * 异常处理策略接口
 */
export interface IExceptionHandlingStrategy {
	/**
	 * 策略名称
	 */
	readonly name: string;

	/**
	 * 策略优先级
	 */
	readonly priority: number;

	/**
	 * 检查是否应该应用此策略
	 *
	 * @param exception - 统一异常
	 * @returns 如果应该应用则返回 true，否则返回 false
	 */
	shouldApply(exception: IUnifiedException): boolean;

	/**
	 * 应用策略
	 *
	 * @param exception - 统一异常
	 * @param host - 执行上下文
	 * @returns 处理结果
	 */
	apply(exception: IUnifiedException, host: ArgumentsHost): Promise<IExceptionHandlingResult>;
}

/**
 * 异常处理结果接口
 */
export interface IExceptionHandlingResult {
	/**
	 * 是否成功
	 */
	success: boolean;

	/**
	 * 执行的动作
	 */
	action: string;

	/**
	 * 失败原因（如果失败）
	 */
	reason?: string;

	/**
	 * 元数据
	 */
	metadata?: Record<string, unknown>;
}

/**
 * 异常统计信息接口
 */
export interface IExceptionStats {
	/**
	 * 总异常数
	 */
	totalExceptions: number;

	/**
	 * 按分类统计
	 */
	byCategory: Record<ExceptionCategory, number>;

	/**
	 * 按级别统计
	 */
	byLevel: Record<ExceptionLevel, number>;

	/**
	 * 按租户统计
	 */
	byTenant: Record<string, number>;

	/**
	 * 按用户统计
	 */
	byUser: Record<string, number>;

	/**
	 * 按时间统计
	 */
	byTime: {
		lastHour: number;
		lastDay: number;
		lastWeek: number;
		lastMonth: number;
	};

	/**
	 * 处理统计
	 */
	processing: {
		totalProcessed: number;
		successful: number;
		failed: number;
		averageProcessingTime: number;
	};

	/**
	 * 最后更新时间
	 */
	lastUpdatedAt: Date;
}

/**
 * 异常健康检查接口
 */
export interface IExceptionHealth {
	/**
	 * 是否健康
	 */
	isHealthy: boolean;

	/**
	 * 健康状态详情
	 */
	details: {
		managerStatus: 'running' | 'stopped' | 'error';
		errorBusConnection: boolean;
		configLoaded: boolean;
		strategiesLoaded: number;
		handlersLoaded: number;
	};

	/**
	 * 检查时间
	 */
	checkedAt: Date;
}

/**
 * 统一异常管理器接口
 */
export interface IUnifiedExceptionManager {
	/**
	 * 初始化管理器
	 */
	initialize(): Promise<void>;

	/**
	 * 销毁管理器
	 */
	destroy(): Promise<void>;

	/**
	 * 处理异常
	 *
	 * @param exception - 异常对象
	 * @param host - 执行上下文
	 */
	handle(exception: unknown, host: ArgumentsHost): Promise<void>;

	/**
	 * 注册异常处理器
	 *
	 * @param handler - 异常处理器
	 */
	registerHandler(handler: IExceptionHandler): void;

	/**
	 * 注销异常处理器
	 *
	 * @param name - 处理器名称
	 */
	unregisterHandler(name: string): void;

	/**
	 * 注册异常处理策略
	 *
	 * @param strategy - 异常处理策略
	 */
	registerStrategy(strategy: IExceptionHandlingStrategy): void;

	/**
	 * 注销异常处理策略
	 *
	 * @param name - 策略名称
	 */
	unregisterStrategy(name: string): void;

	/**
	 * 获取统计信息
	 *
	 * @returns 异常统计信息
	 */
	getStats(): Promise<IExceptionStats>;

	/**
	 * 获取健康状态
	 *
	 * @returns 异常健康状态
	 */
	getHealth(): Promise<IExceptionHealth>;
}
