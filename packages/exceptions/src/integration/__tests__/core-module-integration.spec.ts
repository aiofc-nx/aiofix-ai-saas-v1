/**
 * Core模块集成测试
 *
 * 测试Exceptions模块与Core模块的集成功能
 *
 * @description Core模块集成测试
 * @since 2.0.0
 */

import { UnifiedExceptionManager } from '../../core';
import { ExceptionStrategyManager } from '../../strategies';
import { CoreErrorBusBridge } from '../../bridges';
import { ExceptionConfigService } from '../../config';
import { IUnifiedException, ExceptionCategory, ExceptionLevel } from '../../interfaces';

// Mock Core模块的依赖
const mockCoreErrorBus = {
	publish: jest.fn().mockResolvedValue(undefined),
	subscribe: jest.fn().mockResolvedValue(undefined),
	unsubscribe: jest.fn().mockResolvedValue(undefined)
};

const mockConfigManager = {
	getModuleConfig: jest.fn().mockResolvedValue(null),
	updateModuleConfig: jest.fn().mockResolvedValue(undefined),
	reloadConfig: jest.fn().mockResolvedValue(undefined),
	onConfigChange: jest.fn()
};

const mockLogger = {
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
	debug: jest.fn()
};

describe('Core模块集成测试', () => {
	let exceptionManager: UnifiedExceptionManager;
	let strategyManager: ExceptionStrategyManager;
	let coreErrorBusBridge: CoreErrorBusBridge;
	let configService: ExceptionConfigService;

	beforeEach(async () => {
		// 初始化配置服务
		configService = new ExceptionConfigService(mockConfigManager as any, mockLogger as any);

		// 初始化Core错误总线桥梁
		coreErrorBusBridge = new CoreErrorBusBridge(mockCoreErrorBus as any, mockLogger as any);

		// 初始化策略管理器
		strategyManager = new ExceptionStrategyManager();

		// 初始化异常管理器
		exceptionManager = new UnifiedExceptionManager(
			null as any, // transformer将在内部创建
			configService,
			mockCoreErrorBus as any,
			mockLogger as any
		);

		await exceptionManager.initialize();

		jest.clearAllMocks();
	});

	describe('异常处理流程集成', () => {
		it('应该正确处理完整的异常处理流程', async () => {
			const error = new Error('Test integration error');
			const context = {
				requestId: 'req-integration-001',
				tenantId: 'tenant-001',
				userId: 'user-001',
				organizationId: 'org-001',
				departmentId: 'dept-001'
			};

			// 处理异常
			const result = await exceptionManager.handleException(error, context);

			expect(result).toBeDefined();
			expect(result.success).toBe(true);
			expect(result.exceptionId).toBeDefined();

			// 验证异常被发布到Core错误总线
			expect(mockCoreErrorBus.publish).toHaveBeenCalledTimes(1);

			const [coreError, coreContext] = mockCoreErrorBus.publish.mock.calls[0];
			expect(coreError.message).toBe('Test integration error');
			expect(coreContext.requestId).toBe('req-integration-001');
			expect(coreContext.tenantId).toBe('tenant-001');
			expect(coreContext.userId).toBe('user-001');
			expect(coreContext.organizationId).toBe('org-001');
			expect(coreContext.departmentId).toBe('dept-001');
		});

		it('应该正确处理HTTP异常并应用策略', async () => {
			const httpError = {
				status: 400,
				message: 'Bad Request',
				response: {
					statusCode: 400,
					message: 'Bad Request'
				}
			};

			const context = {
				requestId: 'req-integration-002',
				tenantId: 'tenant-001',
				userId: 'user-001',
				type: 'HTTP',
				method: 'POST',
				url: '/api/users'
			};

			const result = await exceptionManager.handleException(httpError, context);

			expect(result).toBeDefined();
			expect(result.success).toBe(true);

			// 验证异常被发布到Core错误总线
			expect(mockCoreErrorBus.publish).toHaveBeenCalledTimes(1);

			const [coreError, coreContext] = mockCoreErrorBus.publish.mock.calls[0];
			expect(coreError.message).toBe('Bad Request');
			expect(coreContext.exceptionCategory).toBe('HTTP');
		});

		it('应该正确处理应用层异常并应用策略', async () => {
			const appError = {
				code: 'USER_NOT_FOUND',
				message: 'User not found',
				context: {
					userId: 'user-123',
					operation: 'getUser'
				}
			};

			const context = {
				requestId: 'req-integration-003',
				tenantId: 'tenant-001',
				userId: 'user-001',
				type: 'APPLICATION'
			};

			const result = await exceptionManager.handleException(appError, context);

			expect(result).toBeDefined();
			expect(result.success).toBe(true);

			// 验证异常被发布到Core错误总线
			expect(mockCoreErrorBus.publish).toHaveBeenCalledTimes(1);

			const [coreError, coreContext] = mockCoreErrorBus.publish.mock.calls[0];
			expect(coreError.message).toBe('User not found');
			expect(coreContext.exceptionCategory).toBe('APPLICATION');
			expect(coreContext.exceptionCode).toBe('USER_NOT_FOUND');
		});
	});

	describe('策略系统集成', () => {
		it('应该正确应用HTTP异常策略', async () => {
			const httpException: IUnifiedException = {
				id: 'exc-integration-001',
				message: 'Bad Request',
				category: ExceptionCategory.HTTP,
				level: ExceptionLevel.ERROR,
				statusCode: 400,
				timestamp: new Date(),
				context: {
					requestId: 'req-integration-004',
					tenantId: 'tenant-001',
					userId: 'user-001'
				}
			};

			const results = await strategyManager.handleException(httpException);

			expect(results.length).toBeGreaterThan(0);

			const successfulResult = results.find((r) => r.success && r.handled);
			expect(successfulResult).toBeDefined();
			expect(successfulResult?.strategy).toBe('http-exception-strategy');
		});

		it('应该正确应用应用层异常策略', async () => {
			const appException: IUnifiedException = {
				id: 'exc-integration-002',
				message: 'User not found',
				category: ExceptionCategory.APPLICATION,
				level: ExceptionLevel.ERROR,
				code: 'USER_NOT_FOUND',
				timestamp: new Date(),
				context: {
					requestId: 'req-integration-005',
					tenantId: 'tenant-001',
					userId: 'user-001'
				}
			};

			const results = await strategyManager.handleException(appException);

			expect(results.length).toBeGreaterThan(0);

			const successfulResult = results.find((r) => r.success && r.handled);
			expect(successfulResult).toBeDefined();
			expect(successfulResult?.strategy).toBe('application-exception-strategy');
		});

		it('应该正确应用数据库异常策略', async () => {
			const dbException: IUnifiedException = {
				id: 'exc-integration-003',
				message: 'Connection timeout',
				category: ExceptionCategory.DATABASE,
				level: ExceptionLevel.ERROR,
				code: 'DB_CONNECTION_TIMEOUT',
				timestamp: new Date(),
				context: {
					requestId: 'req-integration-006',
					tenantId: 'tenant-001',
					userId: 'user-001',
					database: 'postgresql',
					table: 'users',
					operation: 'SELECT'
				}
			};

			const results = await strategyManager.handleException(dbException);

			expect(results.length).toBeGreaterThan(0);

			const successfulResult = results.find((r) => r.success && r.handled);
			expect(successfulResult).toBeDefined();
			expect(successfulResult?.strategy).toBe('database-exception-strategy');
		});

		it('应该正确应用网络异常策略', async () => {
			const networkException: IUnifiedException = {
				id: 'exc-integration-004',
				message: 'Network timeout',
				category: ExceptionCategory.NETWORK,
				level: ExceptionLevel.ERROR,
				code: 'NETWORK_TIMEOUT',
				timestamp: new Date(),
				context: {
					requestId: 'req-integration-007',
					tenantId: 'tenant-001',
					userId: 'user-001',
					endpoint: 'https://api.example.com',
					method: 'GET',
					timeout: 5000
				}
			};

			const results = await strategyManager.handleException(networkException);

			expect(results.length).toBeGreaterThan(0);

			const successfulResult = results.find((r) => r.success && r.handled);
			expect(successfulResult).toBeDefined();
			expect(successfulResult?.strategy).toBe('network-exception-strategy');
		});
	});

	describe('配置管理集成', () => {
		it('应该正确加载和验证配置', async () => {
			const config = await configService.getConfig();

			expect(config).toBeDefined();
			expect(config.enabled).toBe(true);
			expect(config.global.enableTenantIsolation).toBe(true);
			expect(config.global.enableErrorBusIntegration).toBe(true);
		});

		it('应该正确处理配置更新', async () => {
			const newConfig = {
				enabled: true,
				global: {
					enableTenantIsolation: false,
					enableErrorBusIntegration: true,
					enableSwaggerIntegration: true,
					defaultHandlingStrategy: 'APPLICATION' as any,
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
					logLevel: 'ERROR' as any,
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

			await configService.updateConfig(newConfig);

			expect(mockConfigManager.updateModuleConfig).toHaveBeenCalledWith('exceptions', newConfig);
		});
	});

	describe('错误总线集成', () => {
		it('应该正确发布异常到Core错误总线', async () => {
			const unifiedException: IUnifiedException = {
				id: 'exc-integration-005',
				message: 'Integration test error',
				category: ExceptionCategory.HTTP,
				level: ExceptionLevel.ERROR,
				statusCode: 500,
				timestamp: new Date(),
				context: {
					requestId: 'req-integration-008',
					tenantId: 'tenant-001',
					userId: 'user-001',
					organizationId: 'org-001',
					departmentId: 'dept-001'
				},
				details: ['Detail 1', 'Detail 2'],
				recoveryAdvice: 'Please retry the operation',
				retryable: true,
				retryAfter: 5000,
				traceId: 'trace-integration-001'
			};

			await coreErrorBusBridge.publishToCoreErrorBus(unifiedException);

			expect(mockCoreErrorBus.publish).toHaveBeenCalledTimes(1);

			const [coreError, coreContext] = mockCoreErrorBus.publish.mock.calls[0];
			expect(coreError.message).toBe('Integration test error');
			expect(coreContext.requestId).toBe('req-integration-008');
			expect(coreContext.tenantId).toBe('tenant-001');
			expect(coreContext.userId).toBe('user-001');
			expect(coreContext.organizationId).toBe('org-001');
			expect(coreContext.departmentId).toBe('dept-001');
			expect(coreContext.exceptionId).toBe('exc-integration-005');
			expect(coreContext.exceptionCategory).toBe('HTTP');
			expect(coreContext.exceptionLevel).toBe('ERROR');
			expect(coreContext.exceptionCode).toBeUndefined();
			expect(coreContext.exceptionDetails).toEqual(['Detail 1', 'Detail 2']);
			expect(coreContext.recoveryAdvice).toBe('Please retry the operation');
			expect(coreContext.retryable).toBe(true);
			expect(coreContext.retryAfter).toBe(5000);
			expect(coreContext.traceId).toBe('trace-integration-001');
		});

		it('应该正确处理Core错误总线不可用的情况', async () => {
			mockCoreErrorBus.publish.mockRejectedValueOnce(new Error('Core error bus unavailable'));

			const unifiedException: IUnifiedException = {
				id: 'exc-integration-006',
				message: 'Test error',
				category: ExceptionCategory.HTTP,
				level: ExceptionLevel.ERROR,
				timestamp: new Date(),
				context: {
					requestId: 'req-integration-009',
					tenantId: 'tenant-001',
					userId: 'user-001'
				}
			};

			await expect(coreErrorBusBridge.publishToCoreErrorBus(unifiedException)).rejects.toThrow(
				'Core error bus unavailable'
			);
		});
	});

	describe('性能集成测试', () => {
		it('应该能够快速处理大量异常', async () => {
			const exceptions: IUnifiedException[] = [];

			for (let i = 0; i < 50; i++) {
				exceptions.push({
					id: `exc-integration-${i}`,
					message: `Integration test exception ${i}`,
					category: ExceptionCategory.HTTP,
					level: ExceptionLevel.ERROR,
					statusCode: 400,
					timestamp: new Date(),
					context: {
						requestId: `req-integration-${i}`,
						tenantId: 'tenant-001',
						userId: 'user-001'
					}
				});
			}

			const startTime = Date.now();

			await Promise.all(exceptions.map((exception) => strategyManager.handleException(exception)));

			const endTime = Date.now();
			const duration = endTime - startTime;

			expect(duration).toBeLessThan(1000); // 应该在1秒内完成
			expect(mockCoreErrorBus.publish).toHaveBeenCalledTimes(0); // 策略管理器不直接发布到错误总线
		});

		it('应该能够快速处理大量异常并发布到Core错误总线', async () => {
			const exceptions: IUnifiedException[] = [];

			for (let i = 0; i < 50; i++) {
				exceptions.push({
					id: `exc-integration-${i}`,
					message: `Integration test exception ${i}`,
					category: ExceptionCategory.HTTP,
					level: ExceptionLevel.ERROR,
					statusCode: 400,
					timestamp: new Date(),
					context: {
						requestId: `req-integration-${i}`,
						tenantId: 'tenant-001',
						userId: 'user-001'
					}
				});
			}

			const startTime = Date.now();

			await Promise.all(exceptions.map((exception) => coreErrorBusBridge.publishToCoreErrorBus(exception)));

			const endTime = Date.now();
			const duration = endTime - startTime;

			expect(duration).toBeLessThan(1000); // 应该在1秒内完成
			expect(mockCoreErrorBus.publish).toHaveBeenCalledTimes(50);
		});
	});

	describe('错误处理集成', () => {
		it('应该正确处理异常处理过程中的错误', async () => {
			const error = new Error('Test error');
			const invalidContext = null;

			const result = await exceptionManager.handleException(error, invalidContext);

			expect(result).toBeDefined();
			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});

		it('应该正确处理策略执行失败', async () => {
			const invalidException = null as any;

			const results = await strategyManager.handleException(invalidException);

			expect(results.length).toBe(0);
		});

		it('应该正确处理配置加载失败', async () => {
			mockConfigManager.getModuleConfig.mockRejectedValueOnce(new Error('Config load failed'));

			const config = await configService.getConfig();

			expect(config).toBeDefined();
			expect(config.enabled).toBe(true); // 应该返回默认配置
		});
	});
});
