/**
 * 网络异常处理策略
 *
 * 专门处理网络相关的异常，包括：
 * - 连接超时异常
 * - 网络不可达异常
 * - DNS解析异常
 * - SSL/TLS异常
 * - 代理异常
 *
 * @description 网络异常处理策略实现
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
 * 网络异常处理策略
 *
 * 处理所有网络相关的异常，包括：
 * - 网络连接异常
 * - 网络超时异常
 * - DNS解析异常
 * - SSL/TLS证书异常
 * - 代理服务器异常
 * - 网络配置异常
 *
 * ## 业务规则
 *
 * ### 异常分类规则
 * - 只处理category为'NETWORK'的异常
 * - 支持所有网络异常类型
 * - 自动识别异常严重程度
 *
 * ### 处理规则
 * - 网络异常转换为用户友好的消息
 * - 提供网络问题的诊断建议
 * - 记录详细的网络上下文
 * - 支持网络异常的监控和告警
 *
 * ### 安全规则
 * - 网络配置信息不暴露给客户端
 * - 敏感网络信息仅记录在服务器日志中
 * - 支持网络异常的审计追踪
 * - 提供网络性能统计
 *
 * @example
 * ```typescript
 * const strategy = new NetworkExceptionStrategy();
 *
 * const exception: IUnifiedException = {
 *   id: 'exc-004',
 *   message: 'Connection timeout',
 *   category: 'NETWORK',
 *   level: 'ERROR',
 *   code: 'NETWORK_TIMEOUT',
 *   // ... 其他属性
 * };
 *
 * const result = await strategy.handle(exception);
 * // result.response 包含网络异常的处理结果
 * ```
 *
 * @since 2.0.0
 */
export class NetworkExceptionStrategy extends BaseExceptionStrategy {
	/**
	 * 构造函数
	 */
	constructor() {
		super('network-exception-strategy', ExceptionHandlingStrategy.NETWORK, 40);
	}

	/**
	 * 判断是否可以处理网络异常
	 *
	 * @param exception 待处理的异常
	 * @returns 是否可以处理
	 */
	public async canHandle(exception: IUnifiedException): Promise<boolean> {
		return exception.category === ExceptionCategory.NETWORK;
	}

	/**
	 * 处理网络异常
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

			// 构建网络异常响应
			const response = this.buildNetworkExceptionResponse(exception);

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
				`Network strategy processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * 构建网络异常响应
	 *
	 * @param exception 异常信息
	 * @returns 网络异常响应
	 */
	private buildNetworkExceptionResponse(exception: IUnifiedException): any {
		const response: any = {
			errorType: 'NETWORK_ERROR',
			errorCode: exception.code || 'UNKNOWN_NETWORK_ERROR',
			message: this.getUserFriendlyMessage(exception),
			severity: exception.level,
			timestamp: new Date().toISOString()
		};

		// 添加网络上下文信息
		if (exception.context) {
			response.context = {
				tenantId: exception.context.tenantId,
				userId: exception.context.userId,
				requestId: exception.context.requestId,
				endpoint: exception.context.endpoint,
				method: exception.context.method,
				timeout: exception.context.timeout
			};
		}

		// 添加错误详情（不包含敏感信息）
		if (exception.details) {
			response.details = this.sanitizeNetworkDetails(exception.details);
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
			NETWORK_TIMEOUT: '网络连接超时，请检查网络连接后重试',
			NETWORK_UNREACHABLE: '网络不可达，请检查网络连接',
			DNS_RESOLUTION_FAILED: '域名解析失败，请检查网络配置',
			SSL_CERTIFICATE_ERROR: 'SSL证书验证失败，请检查证书配置',
			TLS_HANDSHAKE_FAILED: 'TLS握手失败，请检查加密配置',
			PROXY_ERROR: '代理服务器错误，请检查代理配置',
			CONNECTION_REFUSED: '连接被拒绝，请检查服务状态',
			CONNECTION_RESET: '连接被重置，请稍后重试',
			CONNECTION_ABORTED: '连接被中止，请稍后重试',
			NETWORK_CONFIG_ERROR: '网络配置错误，请联系管理员',
			FIREWALL_BLOCKED: '防火墙阻止连接，请联系管理员',
			ROUTING_ERROR: '网络路由错误，请联系管理员',
			BANDWIDTH_EXCEEDED: '带宽超限，请稍后重试',
			NETWORK_INTERFACE_ERROR: '网络接口错误，请联系管理员'
		};

		return friendlyMessages[exception.code || ''] || '网络连接失败，请稍后重试';
	}

	/**
	 * 清理网络详情信息，移除敏感数据
	 *
	 * @param details 原始详情信息
	 * @returns 清理后的详情信息
	 */
	private sanitizeNetworkDetails(details: any): any {
		if (!details || typeof details !== 'object') {
			return details;
		}

		const sanitized = { ...details };

		// 移除敏感信息
		const sensitiveFields = [
			'password',
			'token',
			'secret',
			'key',
			'credential',
			'auth',
			'certificate',
			'privateKey',
			'proxyAuth'
		];

		for (const field of sensitiveFields) {
			if (sanitized[field]) {
				sanitized[field] = '[REDACTED]';
			}
		}

		// 清理URL中的敏感参数
		if (sanitized.url) {
			try {
				const url = new URL(sanitized.url);
				const sensitiveParams = ['password', 'token', 'secret', 'key', 'auth'];

				for (const param of sensitiveParams) {
					if (url.searchParams.has(param)) {
						url.searchParams.set(param, '[REDACTED]');
					}
				}

				sanitized.url = url.toString();
			} catch {
				// 如果URL解析失败，保持原样
			}
		}

		return sanitized;
	}
}
