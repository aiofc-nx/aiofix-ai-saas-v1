/**
 * Core错误总线桥梁测试
 *
 * 测试Core错误总线桥梁的功能和性能
 *
 * @description Core错误总线桥梁单元测试
 * @since 2.0.0
 */

import { CoreErrorBusBridge } from '../core-error-bus.bridge';
import { IUnifiedException, ExceptionCategory, ExceptionLevel } from '../../interfaces';

// Mock Core模块的依赖
const mockCoreErrorBus = {
	publish: jest.fn().mockResolvedValue(undefined),
	subscribe: jest.fn().mockResolvedValue(undefined),
	unsubscribe: jest.fn().mockResolvedValue(undefined)
};

const mockLogger = {
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
	debug: jest.fn()
};

describe('CoreErrorBusBridge', () => {
	let bridge: CoreErrorBusBridge;

	beforeEach(() => {
		bridge = new CoreErrorBusBridge(mockCoreErrorBus as any, mockLogger as any);
		jest.clearAllMocks();
	});

	describe('构造函数', () => {
		it('应该正确初始化桥梁', () => {
			expect(bridge).toBeDefined();
		});
	});

	describe('发布异常到Core错误总线', () => {
		const mockUnifiedException: IUnifiedException = {
			id: 'exc-001',
			message: 'Test exception',
			category: ExceptionCategory.HTTP,
			level: ExceptionLevel.ERROR,
			code: 'TEST_ERROR',
			timestamp: new Date(),
			context: {
				requestId: 'req-001',
				tenantId: 'tenant-001',
				userId: 'user-001',
				organizationId: 'org-001',
				departmentId: 'dept-001'
			},
			details: ['Detail 1', 'Detail 2'],
			recoveryAdvice: 'Please retry the operation',
			retryable: true,
			retryAfter: 5000,
			traceId: 'trace-001'
		};

		it('应该正确发布异常到Core错误总线', async () => {
			await bridge.publishToCoreErrorBus(mockUnifiedException);

			expect(mockCoreErrorBus.publish).toHaveBeenCalledTimes(1);
			expect(mockCoreErrorBus.publish).toHaveBeenCalledWith(
				expect.objectContaining({
					message: 'Test exception',
					name: 'UnifiedException'
				}),
				expect.objectContaining({
					requestId: 'req-001',
					tenantId: 'tenant-001',
					userId: 'user-001',
					organizationId: 'org-001',
					departmentId: 'dept-001'
				})
			);
		});

		it('应该正确处理发布失败', async () => {
			mockCoreErrorBus.publish.mockRejectedValueOnce(new Error('Publish failed'));

			await expect(bridge.publishToCoreErrorBus(mockUnifiedException)).rejects.toThrow('Publish failed');
		});

		it('应该正确转换异常格式', async () => {
			await bridge.publishToCoreErrorBus(mockUnifiedException);

			const [, coreContext] = mockCoreErrorBus.publish.mock.calls[0];

			// 验证Core错误格式
			expect(coreError).toEqual(
				expect.objectContaining({
					message: 'Test exception',
					name: 'UnifiedException',
					stack: expect.any(String)
				})
			);

			// 验证Core上下文格式
			expect(coreContext).toEqual(
				expect.objectContaining({
					requestId: 'req-001',
					tenantId: 'tenant-001',
					userId: 'user-001',
					organizationId: 'org-001',
					departmentId: 'dept-001',
					exceptionId: 'exc-001',
					exceptionCategory: 'HTTP',
					exceptionLevel: 'ERROR',
					exceptionCode: 'TEST_ERROR',
					exceptionDetails: ['Detail 1', 'Detail 2'],
					recoveryAdvice: 'Please retry the operation',
					retryable: true,
					retryAfter: 5000,
					traceId: 'trace-001'
				})
			);
		});

		it('应该正确处理缺少上下文的异常', async () => {
			const exceptionWithoutContext: IUnifiedException = {
				...mockUnifiedException,
				context: {
					requestId: 'req-002',
					tenantId: 'tenant-001',
					userId: 'user-001'
				}
			};

			await bridge.publishToCoreErrorBus(exceptionWithoutContext);

			const [, coreContext] = mockCoreErrorBus.publish.mock.calls[0];

			expect(coreContext).toEqual(
				expect.objectContaining({
					requestId: 'req-002',
					tenantId: 'tenant-001',
					userId: 'user-001',
					organizationId: undefined,
					departmentId: undefined
				})
			);
		});

		it('应该正确处理缺少详情的异常', async () => {
			const exceptionWithoutDetails: IUnifiedException = {
				...mockUnifiedException,
				details: undefined
			};

			await bridge.publishToCoreErrorBus(exceptionWithoutDetails);

			const [, coreContext] = mockCoreErrorBus.publish.mock.calls[0];

			expect(coreContext.exceptionDetails).toBeUndefined();
		});

		it('应该正确处理缺少恢复建议的异常', async () => {
			const exceptionWithoutRecovery: IUnifiedException = {
				...mockUnifiedException,
				recoveryAdvice: undefined
			};

			await bridge.publishToCoreErrorBus(exceptionWithoutRecovery);

			const [, coreContext] = mockCoreErrorBus.publish.mock.calls[0];

			expect(coreContext.recoveryAdvice).toBeUndefined();
		});

		it('应该正确处理不可重试的异常', async () => {
			const nonRetryableException: IUnifiedException = {
				...mockUnifiedException,
				retryable: false,
				retryAfter: undefined
			};

			await bridge.publishToCoreErrorBus(nonRetryableException);

			const [, coreContext] = mockCoreErrorBus.publish.mock.calls[0];

			expect(coreContext.retryable).toBe(false);
			expect(coreContext.retryAfter).toBeUndefined();
		});
	});

	describe('异常格式转换', () => {
		it('应该正确转换HTTP异常', async () => {
			const httpException: IUnifiedException = {
				id: 'exc-002',
				message: 'Bad Request',
				category: ExceptionCategory.HTTP,
				level: ExceptionLevel.ERROR,
				statusCode: 400,
				timestamp: new Date(),
				context: {
					requestId: 'req-003',
					tenantId: 'tenant-001',
					userId: 'user-001'
				}
			};

			await bridge.publishToCoreErrorBus(httpException);

			const [, coreContext] = mockCoreErrorBus.publish.mock.calls[0];

			expect(coreError.message).toBe('Bad Request');
			expect(coreContext.exceptionCategory).toBe('HTTP');
			expect(coreContext.exceptionLevel).toBe('ERROR');
		});

		it('应该正确转换应用层异常', async () => {
			const appException: IUnifiedException = {
				id: 'exc-003',
				message: 'User not found',
				category: ExceptionCategory.APPLICATION,
				level: ExceptionLevel.ERROR,
				code: 'USER_NOT_FOUND',
				timestamp: new Date(),
				context: {
					requestId: 'req-004',
					tenantId: 'tenant-001',
					userId: 'user-001'
				}
			};

			await bridge.publishToCoreErrorBus(appException);

			const [, coreContext] = mockCoreErrorBus.publish.mock.calls[0];

			expect(coreError.message).toBe('User not found');
			expect(coreContext.exceptionCategory).toBe('APPLICATION');
			expect(coreContext.exceptionCode).toBe('USER_NOT_FOUND');
		});

		it('应该正确转换数据库异常', async () => {
			const dbException: IUnifiedException = {
				id: 'exc-004',
				message: 'Connection timeout',
				category: ExceptionCategory.DATABASE,
				level: ExceptionLevel.ERROR,
				code: 'DB_CONNECTION_TIMEOUT',
				timestamp: new Date(),
				context: {
					requestId: 'req-005',
					tenantId: 'tenant-001',
					userId: 'user-001',
					database: 'postgresql',
					table: 'users',
					operation: 'SELECT'
				}
			};

			await bridge.publishToCoreErrorBus(dbException);

			const [, coreContext] = mockCoreErrorBus.publish.mock.calls[0];

			expect(coreError.message).toBe('Connection timeout');
			expect(coreContext.exceptionCategory).toBe('DATABASE');
			expect(coreContext.exceptionCode).toBe('DB_CONNECTION_TIMEOUT');
		});

		it('应该正确转换网络异常', async () => {
			const networkException: IUnifiedException = {
				id: 'exc-005',
				message: 'Network timeout',
				category: ExceptionCategory.NETWORK,
				level: ExceptionLevel.ERROR,
				code: 'NETWORK_TIMEOUT',
				timestamp: new Date(),
				context: {
					requestId: 'req-006',
					tenantId: 'tenant-001',
					userId: 'user-001',
					endpoint: 'https://api.example.com',
					method: 'GET',
					timeout: 5000
				}
			};

			await bridge.publishToCoreErrorBus(networkException);

			const [, coreContext] = mockCoreErrorBus.publish.mock.calls[0];

			expect(coreError.message).toBe('Network timeout');
			expect(coreContext.exceptionCategory).toBe('NETWORK');
			expect(coreContext.exceptionCode).toBe('NETWORK_TIMEOUT');
		});
	});

	describe('错误处理', () => {
		it('应该正确处理Core错误总线不可用的情况', async () => {
			const mockUnifiedException: IUnifiedException = {
				id: 'exc-006',
				message: 'Test exception',
				category: ExceptionCategory.HTTP,
				level: ExceptionLevel.ERROR,
				timestamp: new Date(),
				context: {
					requestId: 'req-007',
					tenantId: 'tenant-001',
					userId: 'user-001'
				}
			};

			mockCoreErrorBus.publish.mockRejectedValueOnce(new Error('Core error bus unavailable'));

			await expect(bridge.publishToCoreErrorBus(mockUnifiedException)).rejects.toThrow('Core error bus unavailable');
		});

		it('应该正确处理无效的异常对象', async () => {
			const invalidException = null as any;

			await expect(bridge.publishToCoreErrorBus(invalidException)).rejects.toThrow();
		});

		it('应该正确处理缺少必要字段的异常', async () => {
			const incompleteException: IUnifiedException = {
				id: 'exc-007',
				message: 'Test exception',
				category: ExceptionCategory.HTTP,
				level: ExceptionLevel.ERROR,
				timestamp: new Date(),
				context: {
					requestId: 'req-008',
					tenantId: 'tenant-001',
					userId: 'user-001'
				}
			} as any;

			await bridge.publishToCoreErrorBus(incompleteException);

			expect(mockCoreErrorBus.publish).toHaveBeenCalledTimes(1);
		});
	});

	describe('性能测试', () => {
		it('应该能够快速处理大量异常', async () => {
			const exceptions: IUnifiedException[] = [];

			for (let i = 0; i < 100; i++) {
				exceptions.push({
					id: `exc-${i}`,
					message: `Test exception ${i}`,
					category: ExceptionCategory.HTTP,
					level: ExceptionLevel.ERROR,
					timestamp: new Date(),
					context: {
						requestId: `req-${i}`,
						tenantId: 'tenant-001',
						userId: 'user-001'
					}
				});
			}

			const startTime = Date.now();

			await Promise.all(exceptions.map((exception) => bridge.publishToCoreErrorBus(exception)));

			const endTime = Date.now();
			const duration = endTime - startTime;

			expect(duration).toBeLessThan(1000); // 应该在1秒内完成
			expect(mockCoreErrorBus.publish).toHaveBeenCalledTimes(100);
		});
	});
});
