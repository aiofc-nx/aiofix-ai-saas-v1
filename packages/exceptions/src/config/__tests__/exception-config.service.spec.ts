/**
 * 异常配置服务测试
 *
 * 测试异常配置服务的功能和性能
 *
 * @description 异常配置服务单元测试
 * @since 2.0.0
 */

import { ExceptionConfigService } from '../exception-config.service';
import { IExceptionModuleConfig } from '../../interfaces';

// Mock @aiofix/config依赖
const mockConfigManager = {
	getModuleConfig: jest.fn(),
	updateModuleConfig: jest.fn(),
	reloadConfig: jest.fn(),
	onConfigChange: jest.fn()
};

const mockLogger = {
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
	debug: jest.fn()
};

describe('ExceptionConfigService', () => {
	let configService: ExceptionConfigService;

	beforeEach(() => {
		configService = new ExceptionConfigService(mockConfigManager as any, mockLogger as any);
		jest.clearAllMocks();
	});

	describe('构造函数', () => {
		it('应该正确初始化配置服务', () => {
			expect(configService).toBeDefined();
		});
	});

	describe('配置加载', () => {
		it('应该正确加载默认配置', async () => {
			mockConfigManager.getModuleConfig.mockResolvedValueOnce(null);

			const config = await configService.getConfig();

			expect(config).toBeDefined();
			expect(config.enabled).toBe(true);
			expect(config.global.enableTenantIsolation).toBe(true);
			expect(config.global.enableErrorBusIntegration).toBe(true);
			expect(config.global.enableSwaggerIntegration).toBe(true);
			expect(config.global.defaultHandlingStrategy).toBe('HTTP');
			expect(config.global.enableMetrics).toBe(true);
			expect(config.global.enableTracing).toBe(true);
		});

		it('应该正确加载自定义配置', async () => {
			const customConfig: IExceptionModuleConfig = {
				enabled: false,
				global: {
					enableTenantIsolation: false,
					enableErrorBusIntegration: false,
					enableSwaggerIntegration: false,
					defaultHandlingStrategy: 'APPLICATION',
					enableMetrics: false,
					enableTracing: false
				},
				http: {
					enableRFC7807: false,
					includeStackTrace: true,
					enableCORS: false,
					defaultErrorMessage: 'Custom error message'
				},
				logging: {
					enableStructuredLogging: false,
					logLevel: 'WARN',
					enableSensitiveDataMasking: false
				},
				recovery: {
					enableAutoRecovery: false,
					maxRetryAttempts: 5,
					retryDelay: 2000,
					enableCircuitBreaker: false
				},
				monitoring: {
					enableMetrics: false,
					metricsInterval: 120000,
					enableHealthChecks: false,
					enableAlerts: false
				}
			};

			mockConfigManager.getModuleConfig.mockResolvedValueOnce(customConfig);

			const config = await configService.getConfig();

			expect(config).toEqual(customConfig);
		});

		it('应该正确处理配置加载失败', async () => {
			mockConfigManager.getModuleConfig.mockRejectedValueOnce(new Error('Config load failed'));

			const config = await configService.getConfig();

			expect(config).toBeDefined();
			expect(config.enabled).toBe(true); // 应该返回默认配置
		});
	});

	describe('配置验证', () => {
		it('应该正确验证有效配置', async () => {
			const validConfig: IExceptionModuleConfig = {
				enabled: true,
				global: {
					enableTenantIsolation: true,
					enableErrorBusIntegration: true,
					enableSwaggerIntegration: true,
					defaultHandlingStrategy: 'HTTP',
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
					logLevel: 'ERROR',
					enableSensitiveDataMasking: true
				},
				recovery: {
					enableAutoRecovery: true,
					maxRetryAttempts: 3,
					retryDelay: 1000,
					enableCircuitBreaker: true
				},
				monitoring: {
					enableMetrics: true,
					metricsInterval: 60000,
					enableHealthChecks: true,
					enableAlerts: true
				}
			};

			const isValid = await configService.validateConfig(validConfig);
			expect(isValid).toBe(true);
		});

		it('应该正确检测无效配置', async () => {
			const invalidConfig = {
				enabled: 'invalid', // 应该是boolean
				global: {
					enableTenantIsolation: true,
					enableErrorBusIntegration: true,
					enableSwaggerIntegration: true,
					defaultHandlingStrategy: 'INVALID_STRATEGY', // 无效的策略
					enableMetrics: true,
					enableTracing: true
				}
			} as any;

			const isValid = await configService.validateConfig(invalidConfig);
			expect(isValid).toBe(false);
		});

		it('应该正确检测缺少必要字段的配置', async () => {
			const incompleteConfig = {
				enabled: true
				// 缺少其他必要字段
			} as any;

			const isValid = await configService.validateConfig(incompleteConfig);
			expect(isValid).toBe(false);
		});
	});

	describe('配置更新', () => {
		it('应该正确更新配置', async () => {
			const newConfig: IExceptionModuleConfig = {
				enabled: true,
				global: {
					enableTenantIsolation: false,
					enableErrorBusIntegration: true,
					enableSwaggerIntegration: true,
					defaultHandlingStrategy: 'APPLICATION',
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
					logLevel: 'ERROR',
					enableSensitiveDataMasking: true
				},
				recovery: {
					enableAutoRecovery: true,
					maxRetryAttempts: 3,
					retryDelay: 1000,
					enableCircuitBreaker: true
				},
				monitoring: {
					enableMetrics: true,
					metricsInterval: 60000,
					enableHealthChecks: true,
					enableAlerts: true
				}
			};

			mockConfigManager.updateModuleConfig.mockResolvedValueOnce(undefined);

			await configService.updateConfig(newConfig);

			expect(mockConfigManager.updateModuleConfig).toHaveBeenCalledWith('exceptions', newConfig);
		});

		it('应该正确处理配置更新失败', async () => {
			const newConfig: IExceptionModuleConfig = {
				enabled: true,
				global: {
					enableTenantIsolation: true,
					enableErrorBusIntegration: true,
					enableSwaggerIntegration: true,
					defaultHandlingStrategy: 'HTTP',
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
					logLevel: 'ERROR',
					enableSensitiveDataMasking: true
				},
				recovery: {
					enableAutoRecovery: true,
					maxRetryAttempts: 3,
					retryDelay: 1000,
					enableCircuitBreaker: true
				},
				monitoring: {
					enableMetrics: true,
					metricsInterval: 60000,
					enableHealthChecks: true,
					enableAlerts: true
				}
			};

			mockConfigManager.updateModuleConfig.mockRejectedValueOnce(new Error('Update failed'));

			await expect(configService.updateConfig(newConfig)).rejects.toThrow('Update failed');
		});
	});

	describe('配置重载', () => {
		it('应该正确重载配置', async () => {
			mockConfigManager.reloadConfig.mockResolvedValueOnce(undefined);

			await configService.reloadConfig();

			expect(mockConfigManager.reloadConfig).toHaveBeenCalledWith('exceptions');
		});

		it('应该正确处理配置重载失败', async () => {
			mockConfigManager.reloadConfig.mockRejectedValueOnce(new Error('Reload failed'));

			await expect(configService.reloadConfig()).rejects.toThrow('Reload failed');
		});
	});

	describe('配置监听', () => {
		it('应该正确注册配置变更监听器', () => {
			const listener = jest.fn();

			configService.onConfigChange(listener);

			expect(mockConfigManager.onConfigChange).toHaveBeenCalledWith('exceptions', listener);
		});

		it('应该正确处理配置变更', async () => {
			const listener = jest.fn();
			const newConfig: IExceptionModuleConfig = {
				enabled: true,
				global: {
					enableTenantIsolation: true,
					enableErrorBusIntegration: true,
					enableSwaggerIntegration: true,
					defaultHandlingStrategy: 'HTTP',
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
					logLevel: 'ERROR',
					enableSensitiveDataMasking: true
				},
				recovery: {
					enableAutoRecovery: true,
					maxRetryAttempts: 3,
					retryDelay: 1000,
					enableCircuitBreaker: true
				},
				monitoring: {
					enableMetrics: true,
					metricsInterval: 60000,
					enableHealthChecks: true,
					enableAlerts: true
				}
			};

			configService.onConfigChange(listener);

			// 模拟配置变更
			const configChangeHandler = mockConfigManager.onConfigChange.mock.calls[0][1];
			configChangeHandler(newConfig);

			expect(listener).toHaveBeenCalledWith(newConfig);
		});
	});

	describe('默认配置', () => {
		it('应该提供合理的默认配置', () => {
			const defaultConfig = configService.getDefaultConfig();

			expect(defaultConfig).toBeDefined();
			expect(defaultConfig.enabled).toBe(true);
			expect(defaultConfig.global.enableTenantIsolation).toBe(true);
			expect(defaultConfig.global.enableErrorBusIntegration).toBe(true);
			expect(defaultConfig.global.enableSwaggerIntegration).toBe(true);
			expect(defaultConfig.global.defaultHandlingStrategy).toBe('HTTP');
			expect(defaultConfig.global.enableMetrics).toBe(true);
			expect(defaultConfig.global.enableTracing).toBe(true);
		});

		it('应该提供合理的HTTP默认配置', () => {
			const defaultConfig = configService.getDefaultConfig();

			expect(defaultConfig.http.enableRFC7807).toBe(true);
			expect(defaultConfig.http.includeStackTrace).toBe(false);
			expect(defaultConfig.http.enableCORS).toBe(true);
			expect(defaultConfig.http.defaultErrorMessage).toBe('An error occurred');
		});

		it('应该提供合理的日志默认配置', () => {
			const defaultConfig = configService.getDefaultConfig();

			expect(defaultConfig.logging.enableStructuredLogging).toBe(true);
			expect(defaultConfig.logging.logLevel).toBe('ERROR');
			expect(defaultConfig.logging.enableSensitiveDataMasking).toBe(true);
		});

		it('应该提供合理的恢复默认配置', () => {
			const defaultConfig = configService.getDefaultConfig();

			expect(defaultConfig.recovery.enableAutoRecovery).toBe(true);
			expect(defaultConfig.recovery.maxRetryAttempts).toBe(3);
			expect(defaultConfig.recovery.retryDelay).toBe(1000);
			expect(defaultConfig.recovery.enableCircuitBreaker).toBe(true);
		});

		it('应该提供合理的监控默认配置', () => {
			const defaultConfig = configService.getDefaultConfig();

			expect(defaultConfig.monitoring.enableMetrics).toBe(true);
			expect(defaultConfig.monitoring.metricsInterval).toBe(60000);
			expect(defaultConfig.monitoring.enableHealthChecks).toBe(true);
			expect(defaultConfig.monitoring.enableAlerts).toBe(true);
		});
	});

	describe('配置合并', () => {
		it('应该正确合并部分配置', () => {
			const partialConfig = {
				enabled: false,
				global: {
					enableTenantIsolation: false
				}
			};

			const mergedConfig = configService.mergeWithDefault(partialConfig);

			expect(mergedConfig.enabled).toBe(false);
			expect(mergedConfig.global.enableTenantIsolation).toBe(false);
			expect(mergedConfig.global.enableErrorBusIntegration).toBe(true); // 应该保持默认值
			expect(mergedConfig.http.enableRFC7807).toBe(true); // 应该保持默认值
		});

		it('应该正确处理空配置', () => {
			const emptyConfig = {};

			const mergedConfig = configService.mergeWithDefault(emptyConfig);

			expect(mergedConfig).toEqual(configService.getDefaultConfig());
		});

		it('应该正确处理null配置', () => {
			const nullConfig = null;

			const mergedConfig = configService.mergeWithDefault(nullConfig);

			expect(mergedConfig).toEqual(configService.getDefaultConfig());
		});
	});
});
