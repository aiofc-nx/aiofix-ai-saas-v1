/**
 * 异常处理策略管理器测试
 *
 * 测试异常处理策略管理器的功能和性能
 *
 * @description 异常处理策略管理器单元测试
 * @since 2.0.0
 */

import { ExceptionStrategyManager } from '../exception-strategy-manager';
import { HttpExceptionStrategy } from '../http-exception-strategy';
// import { ApplicationExceptionStrategy } from '../application-exception-strategy';
import { IUnifiedException, ExceptionCategory, ExceptionLevel } from '../../interfaces';

describe('ExceptionStrategyManager', () => {
	let manager: ExceptionStrategyManager;

	beforeEach(() => {
		manager = new ExceptionStrategyManager();
	});

	describe('策略注册', () => {
		it('应该正确注册策略', () => {
			const strategy = new HttpExceptionStrategy();
			manager.registerStrategy(strategy);

			const registeredStrategy = manager.getStrategy('http-exception-strategy');
			expect(registeredStrategy).toBe(strategy);
		});

		it('应该正确注销策略', () => {
			const strategy = new HttpExceptionStrategy();
			manager.registerStrategy(strategy);

			const unregistered = manager.unregisterStrategy('http-exception-strategy');
			expect(unregistered).toBe(true);

			const registeredStrategy = manager.getStrategy('http-exception-strategy');
			expect(registeredStrategy).toBeUndefined();
		});

		it('应该正确获取所有策略', () => {
			const strategies = manager.getStrategies();
			expect(strategies.length).toBeGreaterThan(0);

			const strategyNames = strategies.map((s) => s.name);
			expect(strategyNames).toContain('http-exception-strategy');
			expect(strategyNames).toContain('application-exception-strategy');
		});

		it('应该正确获取指定策略', () => {
			const strategy = manager.getStrategy('http-exception-strategy');
			expect(strategy).toBeDefined();
			expect(strategy?.name).toBe('http-exception-strategy');
		});

		it('应该正确处理重复注册', () => {
			const strategy1 = new HttpExceptionStrategy();
			const strategy2 = new HttpExceptionStrategy();

			manager.registerStrategy(strategy1);

			expect(() => {
				manager.registerStrategy(strategy2);
			}).toThrow("Strategy with name 'http-exception-strategy' is already registered");
		});
	});

	describe('异常处理', () => {
		const mockHttpException: IUnifiedException = {
			id: 'http-exception-001',
			message: 'Bad Request',
			category: ExceptionCategory.HTTP,
			level: ExceptionLevel.ERROR,
			statusCode: 400,
			timestamp: new Date(),
			context: {
				requestId: 'req-001',
				tenantId: 'tenant-001',
				userId: 'user-001'
			}
		};

		const mockApplicationException: IUnifiedException = {
			id: 'app-exception-001',
			message: 'User not found',
			category: ExceptionCategory.APPLICATION,
			level: ExceptionLevel.ERROR,
			code: 'USER_NOT_FOUND',
			timestamp: new Date(),
			context: {
				requestId: 'req-002',
				tenantId: 'tenant-001',
				userId: 'user-001'
			}
		};

		it('应该正确处理HTTP异常', async () => {
			const results = await manager.handleException(mockHttpException);

			expect(results.length).toBeGreaterThan(0);

			const successfulResult = results.find((r) => r.success && r.handled);
			expect(successfulResult).toBeDefined();
			expect(successfulResult?.strategy).toBe('http-exception-strategy');
		});

		it('应该正确处理应用层异常', async () => {
			const results = await manager.handleException(mockApplicationException);

			expect(results.length).toBeGreaterThan(0);

			const successfulResult = results.find((r) => r.success && r.handled);
			expect(successfulResult).toBeDefined();
			expect(successfulResult?.strategy).toBe('application-exception-strategy');
		});

		it('应该正确处理未知异常', async () => {
			const unknownException: IUnifiedException = {
				id: 'unknown-exception-001',
				message: 'Unknown error',
				category: 'UNKNOWN' as any,
				level: ExceptionLevel.ERROR,
				timestamp: new Date(),
				context: {
					requestId: 'req-003',
					tenantId: 'tenant-001',
					userId: 'user-001'
				}
			};

			const results = await manager.handleException(unknownException);

			expect(results.length).toBe(0);
		});

		it('应该按优先级执行策略', async () => {
			const results = await manager.handleException(mockHttpException);

			expect(results.length).toBeGreaterThan(0);

			// HTTP策略的优先级应该高于应用层策略
			const httpResult = results.find((r) => r.strategy === 'http-exception-strategy');
			const appResult = results.find((r) => r.strategy === 'application-exception-strategy');

			if (httpResult && appResult) {
				expect(httpResult.handled).toBe(true);
				expect(appResult.handled).toBe(false);
			}
		});
	});

	describe('统计信息', () => {
		it('应该正确获取执行统计', () => {
			const stats = manager.getExecutionStats();

			expect(stats.totalExecutions).toBe(0);
			expect(stats.successfulExecutions).toBe(0);
			expect(stats.failedExecutions).toBe(0);
			expect(stats.averageExecutionTime).toBe(0);
			expect(stats.lastExecutionAt).toBeNull();
		});

		it('应该正确获取策略统计', () => {
			const stats = manager.getStrategyStats();

			expect(stats).toBeDefined();
			expect(stats['http-exception-strategy']).toBeDefined();
			expect(stats['application-exception-strategy']).toBeDefined();
		});

		it('应该正确重置统计', () => {
			// 模拟执行
			const mockException: IUnifiedException = {
				id: 'test-exception-001',
				message: 'Test exception',
				category: ExceptionCategory.HTTP,
				level: ExceptionLevel.ERROR,
				timestamp: new Date(),
				context: {
					requestId: 'req-001',
					tenantId: 'tenant-001',
					userId: 'user-001'
				}
			};

			manager.handleException(mockException);

			// 重置统计
			manager.resetStats();

			const stats = manager.getExecutionStats();
			expect(stats.totalExecutions).toBe(0);
			expect(stats.successfulExecutions).toBe(0);
			expect(stats.failedExecutions).toBe(0);
		});
	});

	describe('策略控制', () => {
		it('应该正确启用策略', () => {
			const enabled = manager.enableStrategy('http-exception-strategy');
			expect(enabled).toBe(true);

			const strategy = manager.getStrategy('http-exception-strategy');
			expect(strategy?.enabled).toBe(true);
		});

		it('应该正确禁用策略', () => {
			const disabled = manager.disableStrategy('http-exception-strategy');
			expect(disabled).toBe(true);

			const strategy = manager.getStrategy('http-exception-strategy');
			expect(strategy?.enabled).toBe(false);
		});

		it('应该正确处理不存在的策略', () => {
			const enabled = manager.enableStrategy('non-existent-strategy');
			expect(enabled).toBe(false);

			const disabled = manager.disableStrategy('non-existent-strategy');
			expect(disabled).toBe(false);
		});
	});

	describe('默认策略', () => {
		it('应该自动注册默认策略', () => {
			const strategies = manager.getStrategies();

			const strategyNames = strategies.map((s) => s.name);
			expect(strategyNames).toContain('http-exception-strategy');
			expect(strategyNames).toContain('application-exception-strategy');
			expect(strategyNames).toContain('database-exception-strategy');
			expect(strategyNames).toContain('network-exception-strategy');
		});
	});
});
