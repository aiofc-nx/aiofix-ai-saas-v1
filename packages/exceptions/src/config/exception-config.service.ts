/**
 * 异常配置服务
 *
 * 负责管理异常处理模块的配置，包括配置加载、验证、热更新等功能。
 * 与@aiofix/config模块集成，提供统一的配置管理能力。
 *
 * @description 异常配置服务实现类
 * @example
 * ```typescript
 * const configService = new ExceptionConfigService(configManager);
 * const config = await configService.getConfig();
 * ```
 *
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import type { IConfigManager } from '@aiofix/config';
import type { IExceptionModuleConfig } from '../interfaces/exception.interface';

/**
 * 异常配置服务
 */
@Injectable()
export class ExceptionConfigService {
	private config: IExceptionModuleConfig | null = null;
	private configVersion = 0;
	private lastConfigUpdate = new Date();

	constructor(private readonly configManager: IConfigManager, private readonly logger: ILoggerService) {}

	/**
	 * 获取异常模块配置
	 *
	 * @returns 异常模块配置
	 */
	async getConfig(): Promise<IExceptionModuleConfig> {
		if (!this.config) {
			await this.loadConfig();
		}
		if (!this.config) {
			throw new Error('Failed to load configuration');
		}
		return this.config;
	}

	/**
	 * 获取配置版本
	 *
	 * @returns 配置版本号
	 */
	getConfigVersion(): number {
		return this.configVersion;
	}

	/**
	 * 获取最后配置更新时间
	 *
	 * @returns 最后配置更新时间
	 */
	getLastConfigUpdate(): Date {
		return this.lastConfigUpdate;
	}

	/**
	 * 检查配置是否已加载
	 *
	 * @returns 配置是否已加载
	 */
	isConfigLoaded(): boolean {
		return this.config !== null;
	}

	/**
	 * 重新加载配置
	 */
	async reloadConfig(): Promise<void> {
		try {
			this.logger.info('开始重新加载异常模块配置', LogContext.SYSTEM);

			await this.loadConfig();

			this.logger.info('异常模块配置重新加载完成', LogContext.SYSTEM, {
				version: this.configVersion,
				lastUpdate: this.lastConfigUpdate
			});
		} catch (error) {
			this.logger.error('重新加载异常模块配置失败', LogContext.SYSTEM, {}, error as Error);
			throw error;
		}
	}

	/**
	 * 验证配置
	 *
	 * @param config - 配置对象
	 * @returns 验证结果
	 */
	validateConfig(config: any): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		try {
			// 验证基本结构
			if (!config || typeof config !== 'object') {
				errors.push('配置必须是一个对象');
				return { valid: false, errors };
			}

			// 验证全局配置
			if (!config.global || typeof config.global !== 'object') {
				errors.push('全局配置必须是一个对象');
			} else {
				this.validateGlobalConfig(config.global, errors);
			}

			// 验证HTTP配置
			if (!config.http || typeof config.http !== 'object') {
				errors.push('HTTP配置必须是一个对象');
			} else {
				this.validateHttpConfig(config.http, errors);
			}

			// 验证日志配置
			if (!config.logging || typeof config.logging !== 'object') {
				errors.push('日志配置必须是一个对象');
			} else {
				this.validateLoggingConfig(config.logging, errors);
			}

			// 验证恢复配置
			if (!config.recovery || typeof config.recovery !== 'object') {
				errors.push('恢复配置必须是一个对象');
			} else {
				this.validateRecoveryConfig(config.recovery, errors);
			}

			// 验证监控配置
			if (!config.monitoring || typeof config.monitoring !== 'object') {
				errors.push('监控配置必须是一个对象');
			} else {
				this.validateMonitoringConfig(config.monitoring, errors);
			}

			return { valid: errors.length === 0, errors };
		} catch (error) {
			errors.push(`配置验证过程中发生错误: ${error instanceof Error ? error.message : String(error)}`);
			return { valid: false, errors };
		}
	}

	/**
	 * 获取默认配置
	 *
	 * @returns 默认配置
	 */
	getDefaultConfig(): IExceptionModuleConfig {
		return {
			enabled: true,
			global: {
				enableTenantIsolation: true,
				enableErrorBusIntegration: true,
				enableSwaggerIntegration: true,
				defaultHandlingStrategy: 'log_only',
				enableMetrics: true,
				enableTracing: true
			},
			http: {
				enableRFC7807: true,
				includeStackTrace: false,
				enableCORS: true,
				defaultErrorMessage: 'An error occurred'
			},
			logging: {
				enableStructuredLogging: true,
				logLevel: 'error',
				enableSensitiveDataMasking: true
			},
			recovery: {
				enableAutoRecovery: false,
				maxRetryAttempts: 3,
				retryDelay: 1000,
				enableCircuitBreaker: false
			},
			monitoring: {
				enableMetrics: true,
				metricsInterval: 60000,
				enableHealthChecks: true,
				enableAlerts: false
			}
		};
	}

	/**
	 * 加载配置
	 */
	private async loadConfig(): Promise<void> {
		try {
			this.logger.debug('开始加载异常模块配置', LogContext.SYSTEM);

			// 从配置管理器获取配置
			const rawConfig = await this.configManager.getModuleConfig('exceptions');

			// 验证配置
			const validation = this.validateConfig(rawConfig);
			if (!validation.valid) {
				this.logger.warn('异常模块配置验证失败，使用默认配置', LogContext.SYSTEM, {
					errors: validation.errors
				});
				this.config = this.getDefaultConfig();
			} else {
				this.config = rawConfig as IExceptionModuleConfig;
			}

			// 更新版本和时间
			this.configVersion++;
			this.lastConfigUpdate = new Date();

			this.logger.info('异常模块配置加载完成', LogContext.SYSTEM, {
				version: this.configVersion,
				enabled: this.config.enabled
			});
		} catch (error) {
			this.logger.error('加载异常模块配置失败，使用默认配置', LogContext.SYSTEM, {}, error as Error);
			this.config = this.getDefaultConfig();
			this.configVersion++;
			this.lastConfigUpdate = new Date();
		}
	}

	/**
	 * 验证全局配置
	 */
	private validateGlobalConfig(global: any, errors: string[]): void {
		if (typeof global.enableTenantIsolation !== 'boolean') {
			errors.push('global.enableTenantIsolation 必须是布尔值');
		}

		if (typeof global.enableErrorBusIntegration !== 'boolean') {
			errors.push('global.enableErrorBusIntegration 必须是布尔值');
		}

		if (typeof global.enableSwaggerIntegration !== 'boolean') {
			errors.push('global.enableSwaggerIntegration 必须是布尔值');
		}

		if (typeof global.defaultHandlingStrategy !== 'string') {
			errors.push('global.defaultHandlingStrategy 必须是字符串');
		}

		if (typeof global.enableMetrics !== 'boolean') {
			errors.push('global.enableMetrics 必须是布尔值');
		}

		if (typeof global.enableTracing !== 'boolean') {
			errors.push('global.enableTracing 必须是布尔值');
		}
	}

	/**
	 * 验证HTTP配置
	 */
	private validateHttpConfig(http: any, errors: string[]): void {
		if (typeof http.enableRFC7807 !== 'boolean') {
			errors.push('http.enableRFC7807 必须是布尔值');
		}

		if (typeof http.includeStackTrace !== 'boolean') {
			errors.push('http.includeStackTrace 必须是布尔值');
		}

		if (typeof http.enableCORS !== 'boolean') {
			errors.push('http.enableCORS 必须是布尔值');
		}

		if (typeof http.defaultErrorMessage !== 'string') {
			errors.push('http.defaultErrorMessage 必须是字符串');
		}
	}

	/**
	 * 验证日志配置
	 */
	private validateLoggingConfig(logging: any, errors: string[]): void {
		if (typeof logging.enableStructuredLogging !== 'boolean') {
			errors.push('logging.enableStructuredLogging 必须是布尔值');
		}

		if (typeof logging.logLevel !== 'string') {
			errors.push('logging.logLevel 必须是字符串');
		}

		if (typeof logging.enableSensitiveDataMasking !== 'boolean') {
			errors.push('logging.enableSensitiveDataMasking 必须是布尔值');
		}
	}

	/**
	 * 验证恢复配置
	 */
	private validateRecoveryConfig(recovery: any, errors: string[]): void {
		if (typeof recovery.enableAutoRecovery !== 'boolean') {
			errors.push('recovery.enableAutoRecovery 必须是布尔值');
		}

		if (typeof recovery.maxRetryAttempts !== 'number' || recovery.maxRetryAttempts < 0) {
			errors.push('recovery.maxRetryAttempts 必须是非负数字');
		}

		if (typeof recovery.retryDelay !== 'number' || recovery.retryDelay < 0) {
			errors.push('recovery.retryDelay 必须是非负数字');
		}

		if (typeof recovery.enableCircuitBreaker !== 'boolean') {
			errors.push('recovery.enableCircuitBreaker 必须是布尔值');
		}
	}

	/**
	 * 验证监控配置
	 */
	private validateMonitoringConfig(monitoring: any, errors: string[]): void {
		if (typeof monitoring.enableMetrics !== 'boolean') {
			errors.push('monitoring.enableMetrics 必须是布尔值');
		}

		if (typeof monitoring.metricsInterval !== 'number' || monitoring.metricsInterval < 0) {
			errors.push('monitoring.metricsInterval 必须是非负数字');
		}

		if (typeof monitoring.enableHealthChecks !== 'boolean') {
			errors.push('monitoring.enableHealthChecks 必须是布尔值');
		}

		if (typeof monitoring.enableAlerts !== 'boolean') {
			errors.push('monitoring.enableAlerts 必须是布尔值');
		}
	}
}
