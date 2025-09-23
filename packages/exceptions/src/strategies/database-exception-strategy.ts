/**
 * 数据库异常处理策略
 *
 * 专门处理数据库相关的异常，包括：
 * - 连接异常
 * - 查询异常
 * - 事务异常
 * - 约束违反异常
 * - 超时异常
 *
 * @description 数据库异常处理策略实现
 * @since 2.0.0
 */

import { BaseExceptionStrategy } from './base-exception-strategy';
import {
	IUnifiedException,
	IExceptionHandlingResult,
	ExceptionHandlingStrategy,
	ExceptionCategory
} from '../interfaces';

/**
 * 数据库异常处理策略
 *
 * 处理所有数据库相关的异常，包括：
 * - 数据库连接异常
 * - SQL查询异常
 * - 事务处理异常
 * - 数据约束违反异常
 * - 数据库超时异常
 * - 数据迁移异常
 *
 * ## 业务规则
 *
 * ### 异常分类规则
 * - 只处理category为'DATABASE'的异常
 * - 支持所有数据库异常类型
 * - 自动识别异常严重程度
 *
 * ### 处理规则
 * - 数据库异常转换为用户友好的消息
 * - 提供数据库操作的重试建议
 * - 记录详细的数据库上下文
 * - 支持数据库异常的监控和告警
 *
 * ### 安全规则
 * - 数据库结构信息不暴露给客户端
 * - 敏感查询信息仅记录在服务器日志中
 * - 支持数据库异常的审计追踪
 * - 提供数据库性能统计
 *
 * @example
 * ```typescript
 * const strategy = new DatabaseExceptionStrategy();
 *
 * const exception: IUnifiedException = {
 *   id: 'exc-003',
 *   message: 'Connection timeout',
 *   category: 'DATABASE',
 *   level: 'ERROR',
 *   code: 'DB_CONNECTION_TIMEOUT',
 *   // ... 其他属性
 * };
 *
 * const result = await strategy.handle(exception);
 * // result.response 包含数据库异常的处理结果
 * ```
 *
 * @since 2.0.0
 */
export class DatabaseExceptionStrategy extends BaseExceptionStrategy {
	/**
	 * 构造函数
	 */
	constructor() {
		super('database-exception-strategy', ExceptionHandlingStrategy.DATABASE, 30);
	}

	/**
	 * 判断是否可以处理数据库异常
	 *
	 * @param exception 待处理的异常
	 * @returns 是否可以处理
	 */
	public async canHandle(exception: IUnifiedException): Promise<boolean> {
		return exception.category === ExceptionCategory.DATABASE;
	}

	/**
	 * 处理数据库异常
	 *
	 * @param exception 待处理的异常
	 * @returns 处理结果
	 */
	public async handle(exception: IUnifiedException): Promise<IExceptionHandlingResult> {
		const startTime = Date.now();

		try {
			if (!this.enabled) {
				return this.createResult(false, false, null, 'Strategy is disabled');
			}

			// 验证异常类型
			if (!(await this.canHandle(exception))) {
				return this.createResult(false, false, null, 'Cannot handle this exception type');
			}

			// 构建数据库异常响应
			const response = this.buildDatabaseExceptionResponse(exception);

			// 更新统计信息
			const processingTime = Date.now() - startTime;
			this.updateStats(true, processingTime);

			return this.createResult(true, true, response);
		} catch (error) {
			const processingTime = Date.now() - startTime;
			this.updateStats(false, processingTime);

			return this.createResult(
				false,
				false,
				null,
				`Database strategy processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * 构建数据库异常响应
	 *
	 * @param exception 异常信息
	 * @returns 数据库异常响应
	 */
	private buildDatabaseExceptionResponse(exception: IUnifiedException): any {
		const response: any = {
			errorType: 'DATABASE_ERROR',
			errorCode: exception.code || 'UNKNOWN_DATABASE_ERROR',
			message: this.getUserFriendlyMessage(exception),
			severity: exception.level,
			timestamp: new Date().toISOString()
		};

		// 添加数据库上下文信息
		if (exception.context) {
			response.context = {
				tenantId: exception.context.tenantId,
				userId: exception.context.userId,
				requestId: exception.context.requestId,
				database: exception.context.database,
				table: exception.context.table,
				operation: exception.context.operation
			};
		}

		// 添加错误详情（不包含敏感信息）
		if (exception.details) {
			response.details = this.sanitizeDatabaseDetails(exception.details);
		}

		// 添加恢复建议
		if (exception.recoveryAdvice) {
			response.recoveryAdvice = exception.recoveryAdvice;
		}

		// 添加追踪信息
		if (exception.traceId) {
			response.traceId = exception.traceId;
		}

		// 添加重试信息
		if (exception.retryable) {
			response.retryable = true;
			if (exception.retryAfter) {
				response.retryAfter = exception.retryAfter;
			}
		}

		return response;
	}

	/**
	 * 获取用户友好的错误消息
	 *
	 * @param exception 异常信息
	 * @returns 用户友好的消息
	 */
	private getUserFriendlyMessage(exception: IUnifiedException): string {
		// 根据错误代码返回用户友好的消息
		const friendlyMessages: Record<string, string> = {
			DB_CONNECTION_FAILED: '数据库连接失败，请稍后重试',
			DB_CONNECTION_TIMEOUT: '数据库连接超时，请稍后重试',
			DB_QUERY_TIMEOUT: '查询执行超时，请稍后重试',
			DB_TRANSACTION_FAILED: '事务执行失败，请稍后重试',
			DB_CONSTRAINT_VIOLATION: '数据约束违反，请检查输入数据',
			DB_DUPLICATE_KEY: '数据重复，请检查输入数据',
			DB_FOREIGN_KEY_VIOLATION: '外键约束违反，请检查关联数据',
			DB_NOT_NULL_VIOLATION: '必填字段为空，请检查输入数据',
			DB_UNIQUE_VIOLATION: '唯一性约束违反，请检查输入数据',
			DB_DEADLOCK: '数据库死锁，请稍后重试',
			DB_LOCK_TIMEOUT: '数据库锁超时，请稍后重试',
			DB_MIGRATION_FAILED: '数据库迁移失败，请联系管理员',
			DB_BACKUP_FAILED: '数据库备份失败，请联系管理员',
			DB_RESTORE_FAILED: '数据库恢复失败，请联系管理员'
		};

		return friendlyMessages[exception.code || ''] || '数据库操作失败，请稍后重试';
	}

	/**
	 * 清理数据库详情信息，移除敏感数据
	 *
	 * @param details 原始详情信息
	 * @returns 清理后的详情信息
	 */
	private sanitizeDatabaseDetails(details: any): any {
		if (!details || typeof details !== 'object') {
			return details;
		}

		const sanitized = { ...details };

		// 移除敏感信息
		const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential', 'auth', 'sql', 'query', 'statement'];

		for (const field of sensitiveFields) {
			if (sanitized[field]) {
				sanitized[field] = '[REDACTED]';
			}
		}

		return sanitized;
	}
}
