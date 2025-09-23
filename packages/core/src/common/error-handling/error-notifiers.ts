/**
 * 错误通知器实现
 *
 * 提供了多种错误通知器，用于将错误信息发送到不同的通知渠道。
 * 包括邮件、短信、Slack、Webhook等通知器。
 *
 * @description 错误通知器实现
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import { IErrorNotifier, IErrorInfo, IErrorProcessingStep, ErrorSeverity } from './error-handling.interface';

/**
 * 邮件错误通知器
 */
@Injectable()
export class EmailErrorNotifier implements IErrorNotifier {
	public readonly name = 'EmailErrorNotifier';
	public readonly priority = 100;

	constructor(private readonly logger: ILoggerService) {}

	/**
	 * 发送错误通知
	 */
	public async notify(errorInfo: IErrorInfo): Promise<IErrorProcessingStep> {
		const startTime = Date.now();

		try {
			// 检查是否应该发送邮件通知
			if (!this.shouldSendEmail(errorInfo)) {
				const duration = Date.now() - startTime;

				return {
					stepId: `email-${Date.now()}`,
					stepName: 'EmailErrorNotifier',
					stepType: 'NOTIFICATION',
					executedAt: new Date(),
					status: 'SKIPPED',
					result: {
						reason: 'Email notification not required',
						sent: false
					},
					duration
				};
			}

			// 构建邮件内容
			const emailContent = this.buildEmailContent(errorInfo);

			// 这里可以集成邮件服务，如 SendGrid、AWS SES、Nodemailer 等
			// 暂时只记录日志
			this.logger.warn(`Email notification sent for error: ${errorInfo.classification.code}`, LogContext.SYSTEM, {
				errorId: errorInfo.context.errorId,
				errorCode: errorInfo.classification.code,
				severity: errorInfo.classification.severity,
				notificationType: 'email'
			});

			const duration = Date.now() - startTime;

			return {
				stepId: `email-${Date.now()}`,
				stepName: 'EmailErrorNotifier',
				stepType: 'NOTIFICATION',
				executedAt: new Date(),
				status: 'SUCCESS',
				result: {
					emailContent,
					sent: true,
					recipients: this.getEmailRecipients(errorInfo)
				},
				duration
			};
		} catch (error) {
			const duration = Date.now() - startTime;

			return {
				stepId: `email-${Date.now()}`,
				stepName: 'EmailErrorNotifier',
				stepType: 'NOTIFICATION',
				executedAt: new Date(),
				status: 'FAILED',
				error: (error as Error).message,
				duration
			};
		}
	}

	/**
	 * 检查是否应该发送通知
	 */
	public shouldNotify(errorInfo: IErrorInfo): boolean {
		// 只对高级别和严重级别的错误发送邮件
		return (
			errorInfo.classification.severity === ErrorSeverity.HIGH ||
			errorInfo.classification.severity === ErrorSeverity.CRITICAL
		);
	}

	/**
	 * 检查是否应该发送邮件
	 */
	private shouldSendEmail(errorInfo: IErrorInfo): boolean {
		return this.shouldNotify(errorInfo);
	}

	/**
	 * 构建邮件内容
	 */
	private buildEmailContent(errorInfo: IErrorInfo): {
		subject: string;
		body: string;
		html: string;
	} {
		const subject = `[${errorInfo.classification.severity}] ${errorInfo.classification.code} - ${errorInfo.classification.message}`;

		const body = `
Error Alert

Error ID: ${errorInfo.context.errorId}
Error Code: ${errorInfo.classification.code}
Error Message: ${errorInfo.classification.message}
Severity: ${errorInfo.classification.severity}
Type: ${errorInfo.classification.type}
Timestamp: ${errorInfo.context.timestamp.toISOString()}

Context Information:
- Tenant ID: ${errorInfo.context.tenantId || 'N/A'}
- User ID: ${errorInfo.context.userId || 'N/A'}
- Request ID: ${errorInfo.context.requestId || 'N/A'}
- Correlation ID: ${errorInfo.context.correlationId || 'N/A'}
- Source: ${errorInfo.context.source || 'N/A'}
- IP Address: ${errorInfo.context.ipAddress || 'N/A'}

Stack Trace:
${errorInfo.originalError.stack || 'N/A'}

Please investigate and take appropriate action.
    `.trim();

		const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Error Alert</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .error-details { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .context-info { background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .stack-trace { background-color: #f8d7da; padding: 15px; border-radius: 5px; font-family: monospace; white-space: pre-wrap; }
        .severity-critical { border-left: 5px solid #dc3545; }
        .severity-high { border-left: 5px solid #fd7e14; }
        .severity-medium { border-left: 5px solid #ffc107; }
        .severity-low { border-left: 5px solid #28a745; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Error Alert</h1>
        <p>An error has occurred in the system that requires attention.</p>
    </div>

    <div class="error-details severity-${errorInfo.classification.severity.toLowerCase()}">
        <h2>Error Details</h2>
        <p><strong>Error ID:</strong> ${errorInfo.context.errorId}</p>
        <p><strong>Error Code:</strong> ${errorInfo.classification.code}</p>
        <p><strong>Error Message:</strong> ${errorInfo.classification.message}</p>
        <p><strong>Severity:</strong> ${errorInfo.classification.severity}</p>
        <p><strong>Type:</strong> ${errorInfo.classification.type}</p>
        <p><strong>Timestamp:</strong> ${errorInfo.context.timestamp.toISOString()}</p>
    </div>

    <div class="context-info">
        <h2>Context Information</h2>
        <p><strong>Tenant ID:</strong> ${errorInfo.context.tenantId || 'N/A'}</p>
        <p><strong>User ID:</strong> ${errorInfo.context.userId || 'N/A'}</p>
        <p><strong>Request ID:</strong> ${errorInfo.context.requestId || 'N/A'}</p>
        <p><strong>Correlation ID:</strong> ${errorInfo.context.correlationId || 'N/A'}</p>
        <p><strong>Source:</strong> ${errorInfo.context.source || 'N/A'}</p>
        <p><strong>IP Address:</strong> ${errorInfo.context.ipAddress || 'N/A'}</p>
    </div>

    <div class="stack-trace">
        <h2>Stack Trace</h2>
        ${errorInfo.originalError.stack || 'N/A'}
    </div>

    <p>Please investigate and take appropriate action.</p>
</body>
</html>
    `.trim();

		return { subject, body, html };
	}

	/**
	 * 获取邮件收件人
	 */
	private getEmailRecipients(errorInfo: IErrorInfo): string[] {
		// 这里可以根据错误类型、严重级别、租户等确定收件人
		// 暂时返回默认收件人
		const recipients = ['admin@example.com'];

		if (errorInfo.classification.severity === ErrorSeverity.CRITICAL) {
			recipients.push('critical-alerts@example.com');
		}

		if (errorInfo.context.tenantId) {
			recipients.push(`tenant-${errorInfo.context.tenantId}@example.com`);
		}

		return recipients;
	}
}

/**
 * Slack错误通知器
 */
@Injectable()
export class SlackErrorNotifier implements IErrorNotifier {
	public readonly name = 'SlackErrorNotifier';
	public readonly priority = 90;

	constructor(private readonly logger: ILoggerService) {}

	/**
	 * 发送错误通知
	 */
	public async notify(errorInfo: IErrorInfo): Promise<IErrorProcessingStep> {
		const startTime = Date.now();

		try {
			// 检查是否应该发送Slack通知
			if (!this.shouldSendSlack(errorInfo)) {
				const duration = Date.now() - startTime;

				return {
					stepId: `slack-${Date.now()}`,
					stepName: 'SlackErrorNotifier',
					stepType: 'NOTIFICATION',
					executedAt: new Date(),
					status: 'SKIPPED',
					result: {
						reason: 'Slack notification not required',
						sent: false
					},
					duration
				};
			}

			// 构建Slack消息
			const slackMessage = this.buildSlackMessage(errorInfo);

			// 这里可以集成Slack API
			// 暂时只记录日志
			this.logger.warn(`Slack notification sent for error: ${errorInfo.classification.code}`, LogContext.SYSTEM, {
				errorId: errorInfo.context.errorId,
				errorCode: errorInfo.classification.code,
				severity: errorInfo.classification.severity,
				notificationType: 'slack'
			});

			const duration = Date.now() - startTime;

			return {
				stepId: `slack-${Date.now()}`,
				stepName: 'SlackErrorNotifier',
				stepType: 'NOTIFICATION',
				executedAt: new Date(),
				status: 'SUCCESS',
				result: {
					slackMessage,
					sent: true,
					channel: this.getSlackChannel(errorInfo)
				},
				duration
			};
		} catch (error) {
			const duration = Date.now() - startTime;

			return {
				stepId: `slack-${Date.now()}`,
				stepName: 'SlackErrorNotifier',
				stepType: 'NOTIFICATION',
				executedAt: new Date(),
				status: 'FAILED',
				error: (error as Error).message,
				duration
			};
		}
	}

	/**
	 * 检查是否应该发送通知
	 */
	public shouldNotify(errorInfo: IErrorInfo): boolean {
		// 只对中级别以上的错误发送Slack通知
		return (
			errorInfo.classification.severity === ErrorSeverity.MEDIUM ||
			errorInfo.classification.severity === ErrorSeverity.HIGH ||
			errorInfo.classification.severity === ErrorSeverity.CRITICAL
		);
	}

	/**
	 * 检查是否应该发送Slack通知
	 */
	private shouldSendSlack(errorInfo: IErrorInfo): boolean {
		return this.shouldNotify(errorInfo);
	}

	/**
	 * 构建Slack消息
	 */
	private buildSlackMessage(errorInfo: IErrorInfo): {
		text: string;
		blocks: unknown[];
		attachments: unknown[];
	} {
		const severityEmoji = this.getSeverityEmoji(errorInfo.classification.severity);
		const text = `${severityEmoji} Error Alert: ${errorInfo.classification.code}`;

		const blocks = [
			{
				type: 'header',
				text: {
					type: 'plain_text',
					text: `${severityEmoji} Error Alert`
				}
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*Error ID:*\n${errorInfo.context.errorId}`
					},
					{
						type: 'mrkdwn',
						text: `*Error Code:*\n${errorInfo.classification.code}`
					},
					{
						type: 'mrkdwn',
						text: `*Severity:*\n${errorInfo.classification.severity}`
					},
					{
						type: 'mrkdwn',
						text: `*Type:*\n${errorInfo.classification.type}`
					}
				]
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `*Error Message:*\n${errorInfo.classification.message}`
				}
			},
			{
				type: 'section',
				fields: [
					{
						type: 'mrkdwn',
						text: `*Tenant ID:*\n${errorInfo.context.tenantId || 'N/A'}`
					},
					{
						type: 'mrkdwn',
						text: `*User ID:*\n${errorInfo.context.userId || 'N/A'}`
					},
					{
						type: 'mrkdwn',
						text: `*Request ID:*\n${errorInfo.context.requestId || 'N/A'}`
					},
					{
						type: 'mrkdwn',
						text: `*Timestamp:*\n${errorInfo.context.timestamp.toISOString()}`
					}
				]
			}
		];

		const attachments = [
			{
				color: this.getSeverityColor(errorInfo.classification.severity),
				fields: [
					{
						title: 'Stack Trace',
						value: errorInfo.originalError.stack || 'N/A',
						short: false
					}
				]
			}
		];

		return { text, blocks, attachments };
	}

	/**
	 * 获取严重级别对应的表情符号
	 */
	private getSeverityEmoji(severity: ErrorSeverity): string {
		switch (severity) {
			case ErrorSeverity.CRITICAL:
				return '🚨';
			case ErrorSeverity.HIGH:
				return '⚠️';
			case ErrorSeverity.MEDIUM:
				return '⚠️';
			case ErrorSeverity.LOW:
				return 'ℹ️';
			default:
				return '❓';
		}
	}

	/**
	 * 获取严重级别对应的颜色
	 */
	private getSeverityColor(severity: ErrorSeverity): string {
		switch (severity) {
			case ErrorSeverity.CRITICAL:
				return 'danger';
			case ErrorSeverity.HIGH:
				return 'warning';
			case ErrorSeverity.MEDIUM:
				return 'warning';
			case ErrorSeverity.LOW:
				return 'good';
			default:
				return '#808080';
		}
	}

	/**
	 * 获取Slack频道
	 */
	private getSlackChannel(errorInfo: IErrorInfo): string {
		// 这里可以根据错误类型、严重级别、租户等确定频道
		// 暂时返回默认频道
		if (errorInfo.classification.severity === ErrorSeverity.CRITICAL) {
			return '#critical-alerts';
		} else if (errorInfo.classification.severity === ErrorSeverity.HIGH) {
			return '#high-priority-alerts';
		} else {
			return '#general-alerts';
		}
	}
}

/**
 * Webhook错误通知器
 */
@Injectable()
export class WebhookErrorNotifier implements IErrorNotifier {
	public readonly name = 'WebhookErrorNotifier';
	public readonly priority = 80;

	constructor(private readonly logger: ILoggerService) {}

	/**
	 * 发送错误通知
	 */
	public async notify(errorInfo: IErrorInfo): Promise<IErrorProcessingStep> {
		const startTime = Date.now();

		try {
			// 检查是否应该发送Webhook通知
			if (!this.shouldSendWebhook(errorInfo)) {
				const duration = Date.now() - startTime;

				return {
					stepId: `webhook-${Date.now()}`,
					stepName: 'WebhookErrorNotifier',
					stepType: 'NOTIFICATION',
					executedAt: new Date(),
					status: 'SKIPPED',
					result: {
						reason: 'Webhook notification not required',
						sent: false
					},
					duration
				};
			}

			// 构建Webhook负载
			const webhookPayload = this.buildWebhookPayload(errorInfo);

			// 这里可以发送HTTP请求到Webhook URL
			// 暂时只记录日志
			this.logger.warn(`Webhook notification sent for error: ${errorInfo.classification.code}`, LogContext.SYSTEM, {
				errorId: errorInfo.context.errorId,
				errorCode: errorInfo.classification.code,
				severity: errorInfo.classification.severity,
				notificationType: 'webhook'
			});

			const duration = Date.now() - startTime;

			return {
				stepId: `webhook-${Date.now()}`,
				stepName: 'WebhookErrorNotifier',
				stepType: 'NOTIFICATION',
				executedAt: new Date(),
				status: 'SUCCESS',
				result: {
					webhookPayload,
					sent: true,
					url: this.getWebhookUrl(errorInfo)
				},
				duration
			};
		} catch (error) {
			const duration = Date.now() - startTime;

			return {
				stepId: `webhook-${Date.now()}`,
				stepName: 'WebhookErrorNotifier',
				stepType: 'NOTIFICATION',
				executedAt: new Date(),
				status: 'FAILED',
				error: (error as Error).message,
				duration
			};
		}
	}

	/**
	 * 检查是否应该发送通知
	 */
	public shouldNotify(errorInfo: IErrorInfo): boolean {
		// 只对高级别和严重级别的错误发送Webhook通知
		return (
			errorInfo.classification.severity === ErrorSeverity.HIGH ||
			errorInfo.classification.severity === ErrorSeverity.CRITICAL
		);
	}

	/**
	 * 检查是否应该发送Webhook通知
	 */
	private shouldSendWebhook(errorInfo: IErrorInfo): boolean {
		return this.shouldNotify(errorInfo);
	}

	/**
	 * 构建Webhook负载
	 */
	private buildWebhookPayload(errorInfo: IErrorInfo): Record<string, unknown> {
		return {
			event: 'error_occurred',
			timestamp: errorInfo.context.timestamp.toISOString(),
			error: {
				id: errorInfo.context.errorId,
				code: errorInfo.classification.code,
				message: errorInfo.classification.message,
				severity: errorInfo.classification.severity,
				type: errorInfo.classification.type,
				description: errorInfo.classification.description,
				recoverable: errorInfo.classification.recoverable,
				retryable: errorInfo.classification.retryable,
				tags: errorInfo.classification.tags,
				metadata: errorInfo.classification.metadata
			},
			context: {
				tenantId: errorInfo.context.tenantId,
				userId: errorInfo.context.userId,
				organizationId: errorInfo.context.organizationId,
				departmentId: errorInfo.context.departmentId,
				requestId: errorInfo.context.requestId,
				correlationId: errorInfo.context.correlationId,
				causationId: errorInfo.context.causationId,
				userAgent: errorInfo.context.userAgent,
				ipAddress: errorInfo.context.ipAddress,
				source: errorInfo.context.source,
				location: errorInfo.context.location,
				systemInfo: errorInfo.context.systemInfo,
				customData: errorInfo.context.customData
			},
			originalError: {
				name: errorInfo.originalError.name,
				message: errorInfo.originalError.message,
				stack: errorInfo.originalError.stack
			},
			processingHistory: errorInfo.processingHistory
		};
	}

	/**
	 * 获取Webhook URL
	 */
	private getWebhookUrl(errorInfo: IErrorInfo): string {
		// 这里可以根据错误类型、严重级别、租户等确定Webhook URL
		// 暂时返回默认URL
		if (errorInfo.classification.severity === ErrorSeverity.CRITICAL) {
			return 'https://hooks.example.com/critical-errors';
		} else {
			return 'https://hooks.example.com/errors';
		}
	}
}
