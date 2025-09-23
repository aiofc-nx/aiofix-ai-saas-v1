/**
 * 统一异常管理器测试
 *
 * 测试统一异常管理器的核心功能和性能
 *
 * @description 统一异常管理器单元测试
 * @since 2.0.0
 */

import { UnifiedExceptionManager } from '../unified-exception-manager';
import { ExceptionContextManager } from '../exception-context-manager';
import { ExceptionClassifier } from '../exception-classifier';
import { ExceptionTransformer } from '../exception-transformer';
import { ExceptionCategory } from '../../interfaces';

describe('UnifiedExceptionManager', () => {
	let manager: UnifiedExceptionManager;
	let contextManager: ExceptionContextManager;
	let classifier: ExceptionClassifier;
	let transformer: ExceptionTransformer;

	beforeEach(() => {
		contextManager = new ExceptionContextManager();
		classifier = new ExceptionClassifier();
		transformer = new ExceptionTransformer(contextManager, classifier);
		manager = new UnifiedExceptionManager(transformer);
	});

	describe('初始化', () => {
		it('应该正确初始化管理器', () => {
			expect(manager).toBeDefined();
			expect(manager.isInitialized()).toBe(false);
		});

		it('应该正确初始化配置', async () => {
			await manager.initialize();
			expect(manager.isInitialized()).toBe(true);
		});

		it('应该正确处理重复初始化', async () => {
			await manager.initialize();
			await manager.initialize(); // 重复初始化
			expect(manager.isInitialized()).toBe(true);
		});
	});

	describe('异常转换', () => {
		beforeEach(async () => {
			await manager.initialize();
		});

		it('应该正确转换Error对象', async () => {
			const error = new Error('Test error');
			const context = {
				requestId: 'req-001',
				tenantId: 'tenant-001',
				userId: 'user-001'
			};

			const unifiedException = await manager.transformException(error, context);

			expect(unifiedException).toBeDefined();
			expect(unifiedException.message).toBe('Test error');
			expect(unifiedException.context.requestId).toBe('req-001');
			expect(unifiedException.context.tenantId).toBe('tenant-001');
			expect(unifiedException.context.userId).toBe('user-001');
		});

		it('应该正确转换HTTP异常', async () => {
			const httpError = {
				status: 400,
				message: 'Bad Request',
				response: {
					statusCode: 400,
					message: 'Bad Request'
				}
			};

			const context = {
				requestId: 'req-002',
				tenantId: 'tenant-001',
				userId: 'user-001',
				type: 'HTTP',
				method: 'POST',
				url: '/api/users'
			};

			const unifiedException = await manager.transformException(httpError, context);

			expect(unifiedException).toBeDefined();
			expect(unifiedException.category).toBe(ExceptionCategory.HTTP);
			expect(unifiedException.statusCode).toBe(400);
			expect(unifiedException.message).toBe('Bad Request');
		});

		it('应该正确转换应用层异常', async () => {
			const appError = {
				code: 'USER_NOT_FOUND',
				message: 'User not found',
				context: {
					userId: 'user-123',
					operation: 'getUser'
				}
			};

			const context = {
				requestId: 'req-003',
				tenantId: 'tenant-001',
				userId: 'user-001',
				type: 'APPLICATION'
			};

			const unifiedException = await manager.transformException(appError, context);

			expect(unifiedException).toBeDefined();
			expect(unifiedException.category).toBe(ExceptionCategory.APPLICATION);
			expect(unifiedException.code).toBe('USER_NOT_FOUND');
			expect(unifiedException.message).toBe('User not found');
		});

		it('应该正确处理转换失败', async () => {
			const invalidError = null;
			const context = {
				requestId: 'req-004',
				tenantId: 'tenant-001',
				userId: 'user-001'
			};

			const unifiedException = await manager.transformException(invalidError, context);

			expect(unifiedException).toBeDefined();
			expect(unifiedException.message).toBe('Unknown error occurred');
			expect(unifiedException.category).toBe(ExceptionCategory.UNKNOWN);
		});
	});

	describe('异常处理', () => {
		beforeEach(async () => {
			await manager.initialize();
		});

		it('应该正确处理异常', async () => {
			const error = new Error('Test error');
			const context = {
				requestId: 'req-001',
				tenantId: 'tenant-001',
				userId: 'user-001'
			};

			const result = await manager.handleException(error, context);

			expect(result).toBeDefined();
			expect(result.success).toBe(true);
			expect(result.exceptionId).toBeDefined();
		});

		it('应该正确处理处理失败', async () => {
			const error = new Error('Test error');
			const invalidContext = null;

			const result = await manager.handleException(error, invalidContext);

			expect(result).toBeDefined();
			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});
	});

	describe('统计信息', () => {
		beforeEach(async () => {
			await manager.initialize();
		});

		it('应该正确获取统计信息', async () => {
			const stats = await manager.getStats();

			expect(stats).toBeDefined();
			expect(stats.totalProcessed).toBe(0);
			expect(stats.successCount).toBe(0);
			expect(stats.failureCount).toBe(0);
			expect(stats.averageProcessingTime).toBe(0);
		});

		it('应该正确更新统计信息', async () => {
			const error = new Error('Test error');
			const context = {
				requestId: 'req-001',
				tenantId: 'tenant-001',
				userId: 'user-001'
			};

			await manager.handleException(error, context);

			const stats = await manager.getStats();
			expect(stats.totalProcessed).toBe(1);
			expect(stats.successCount).toBe(1);
			expect(stats.failureCount).toBe(0);
		});

		it('应该正确重置统计信息', async () => {
			const error = new Error('Test error');
			const context = {
				requestId: 'req-001',
				tenantId: 'tenant-001',
				userId: 'user-001'
			};

			await manager.handleException(error, context);
			await manager.resetStats();

			const stats = await manager.getStats();
			expect(stats.totalProcessed).toBe(0);
			expect(stats.successCount).toBe(0);
			expect(stats.failureCount).toBe(0);
		});
	});

	describe('健康检查', () => {
		beforeEach(async () => {
			await manager.initialize();
		});

		it('应该正确获取健康状态', async () => {
			const health = await manager.getHealth();

			expect(health).toBeDefined();
			expect(health.status).toBe('healthy');
			expect(health.initialized).toBe(true);
			expect(health.lastCheck).toBeDefined();
		});

		it('应该正确检测不健康状态', async () => {
			// 模拟管理器未初始化
			const uninitializedManager = new UnifiedExceptionManager(transformer);
			const health = await uninitializedManager.getHealth();

			expect(health).toBeDefined();
			expect(health.status).toBe('unhealthy');
			expect(health.initialized).toBe(false);
		});
	});

	describe('配置管理', () => {
		it('应该正确加载默认配置', async () => {
			await manager.initialize();
			const config = manager.getConfig();

			expect(config).toBeDefined();
			expect(config.enabled).toBe(true);
			expect(config.global.enableTenantIsolation).toBe(true);
			expect(config.global.enableErrorBusIntegration).toBe(true);
		});

		it('应该正确更新配置', async () => {
			await manager.initialize();

			const newConfig = {
				enabled: true,
				global: {
					enableTenantIsolation: false,
					enableErrorBusIntegration: false,
					enableSwaggerIntegration: true,
					defaultHandlingStrategy: 'HTTP' as any,
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

			await manager.updateConfig(newConfig);
			const updatedConfig = manager.getConfig();

			expect(updatedConfig.global.enableTenantIsolation).toBe(false);
			expect(updatedConfig.global.enableErrorBusIntegration).toBe(false);
		});
	});

	describe('处理器管理', () => {
		beforeEach(async () => {
			await manager.initialize();
		});

		it('应该正确注册处理器', () => {
			const handler = {
				name: 'test-handler',
				canHandle: jest.fn().mockReturnValue(true),
				handle: jest.fn().mockResolvedValue({ success: true })
			};

			manager.registerHandler(handler);
			const handlers = manager.getHandlers();

			expect(handlers).toContain(handler);
		});

		it('应该正确注销处理器', () => {
			const handler = {
				name: 'test-handler',
				canHandle: jest.fn().mockReturnValue(true),
				handle: jest.fn().mockResolvedValue({ success: true })
			};

			manager.registerHandler(handler);
			manager.unregisterHandler('test-handler');
			const handlers = manager.getHandlers();

			expect(handlers).not.toContain(handler);
		});

		it('应该正确处理重复注册', () => {
			const handler1 = {
				name: 'test-handler',
				canHandle: jest.fn().mockReturnValue(true),
				handle: jest.fn().mockResolvedValue({ success: true })
			};

			const handler2 = {
				name: 'test-handler',
				canHandle: jest.fn().mockReturnValue(true),
				handle: jest.fn().mockResolvedValue({ success: true })
			};

			manager.registerHandler(handler1);

			expect(() => {
				manager.registerHandler(handler2);
			}).toThrow("Handler with name 'test-handler' is already registered");
		});
	});

	describe('策略管理', () => {
		beforeEach(async () => {
			await manager.initialize();
		});

		it('应该正确注册策略', () => {
			const strategy = {
				name: 'test-strategy',
				priority: 100,
				canHandle: jest.fn().mockReturnValue(true),
				handle: jest.fn().mockResolvedValue({ success: true, handled: true })
			};

			manager.registerStrategy(strategy);
			const strategies = manager.getStrategies();

			expect(strategies).toContain(strategy);
		});

		it('应该正确注销策略', () => {
			const strategy = {
				name: 'test-strategy',
				priority: 100,
				canHandle: jest.fn().mockReturnValue(true),
				handle: jest.fn().mockResolvedValue({ success: true, handled: true })
			};

			manager.registerStrategy(strategy);
			manager.unregisterStrategy('test-strategy');
			const strategies = manager.getStrategies();

			expect(strategies).not.toContain(strategy);
		});
	});

	describe('销毁', () => {
		beforeEach(async () => {
			await manager.initialize();
		});

		it('应该正确销毁管理器', async () => {
			await manager.destroy();
			expect(manager.isInitialized()).toBe(false);
		});

		it('应该正确处理重复销毁', async () => {
			await manager.destroy();
			await manager.destroy(); // 重复销毁
			expect(manager.isInitialized()).toBe(false);
		});
	});
});
