/**
 * 基础异常处理策略测试
 *
 * 测试基础异常处理策略的功能和性能
 *
 * @description 基础异常处理策略单元测试
 * @since 2.0.0
 */

import { BaseExceptionStrategy } from '../base-exception-strategy';
import {
	IUnifiedException,
	IExceptionHandlingResult,
	ExceptionHandlingStrategy,
	ExceptionCategory,
	ExceptionLevel
} from '../../interfaces';

/**
 * 测试异常处理策略
 */
class TestExceptionStrategy extends BaseExceptionStrategy {
	constructor() {
		super('test-strategy', ExceptionHandlingStrategy.HTTP, 50);
	}

	public async canHandle(exception: IUnifiedException): Promise<boolean> {
		return exception.category === ExceptionCategory.HTTP;
	}

	public async handle(_exception: IUnifiedException): Promise<IExceptionHandlingResult> {
		return this.createResult(true, true, { message: 'Test handled' });
	}
}

describe('BaseExceptionStrategy', () => {
	let strategy: TestExceptionStrategy;

	beforeEach(() => {
		strategy = new TestExceptionStrategy();
	});

	describe('构造函数', () => {
		it('应该正确设置策略属性', () => {
			expect(strategy.name).toBe('test-strategy');
			expect(strategy.type).toBe(ExceptionHandlingStrategy.HTTP);
			expect(strategy.priority).toBe(50);
			expect(strategy.enabled).toBe(true);
		});
	});

	describe('统计信息', () => {
		it('应该正确初始化统计信息', () => {
			const stats = strategy.getStats();
			expect(stats.totalHandled).toBe(0);
			expect(stats.successCount).toBe(0);
			expect(stats.failureCount).toBe(0);
			expect(stats.averageProcessingTime).toBe(0);
			expect(stats.lastProcessedAt).toBeNull();
		});

		it('应该正确更新统计信息', () => {
			// 模拟处理成功
			strategy['updateStats'](true, 100);

			const stats = strategy.getStats();
			expect(stats.totalHandled).toBe(1);
			expect(stats.successCount).toBe(1);
			expect(stats.failureCount).toBe(0);
			expect(stats.averageProcessingTime).toBe(100);
			expect(stats.lastProcessedAt).not.toBeNull();
		});

		it('应该正确计算平均处理时间', () => {
			// 模拟多次处理
			strategy['updateStats'](true, 100);
			strategy['updateStats'](true, 200);
			strategy['updateStats'](false, 150);

			const stats = strategy.getStats();
			expect(stats.totalHandled).toBe(3);
			expect(stats.successCount).toBe(2);
			expect(stats.failureCount).toBe(1);
			expect(stats.averageProcessingTime).toBe(150); // (100 + 200 + 150) / 3
		});

		it('应该正确重置统计信息', () => {
			// 模拟处理
			strategy['updateStats'](true, 100);

			// 重置统计
			strategy.resetStats();

			const stats = strategy.getStats();
			expect(stats.totalHandled).toBe(0);
			expect(stats.successCount).toBe(0);
			expect(stats.failureCount).toBe(0);
			expect(stats.averageProcessingTime).toBe(0);
			expect(stats.lastProcessedAt).toBeNull();
		});
	});

	describe('启用/禁用', () => {
		it('应该正确启用策略', () => {
			strategy.disable();
			expect(strategy.enabled).toBe(false);

			strategy.enable();
			expect(strategy.enabled).toBe(true);
		});

		it('应该正确禁用策略', () => {
			expect(strategy.enabled).toBe(true);

			strategy.disable();
			expect(strategy.enabled).toBe(false);
		});
	});

	describe('创建结果', () => {
		it('应该正确创建成功结果', () => {
			const result = strategy['createResult'](true, true, { message: 'Success' });

			expect(result.success).toBe(true);
			expect(result.handled).toBe(true);
			expect(result.response).toEqual({ message: 'Success' });
			expect(result.error).toBeUndefined();
			expect(result.strategy).toBe('test-strategy');
			expect(result.timestamp).toBeInstanceOf(Date);
		});

		it('应该正确创建失败结果', () => {
			const result = strategy['createResult'](false, false, null, 'Test error');

			expect(result.success).toBe(false);
			expect(result.handled).toBe(false);
			expect(result.response).toBeNull();
			expect(result.error).toBe('Test error');
			expect(result.strategy).toBe('test-strategy');
			expect(result.timestamp).toBeInstanceOf(Date);
		});
	});

	describe('异常处理', () => {
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

		it('应该正确处理异常', async () => {
			const result = await strategy.handle(mockException);

			expect(result.success).toBe(true);
			expect(result.handled).toBe(true);
			expect(result.response).toEqual({ message: 'Test handled' });
			expect(result.strategy).toBe('test-strategy');
		});

		it('应该正确判断是否可以处理异常', async () => {
			const canHandle = await strategy.canHandle(mockException);
			expect(canHandle).toBe(true);
		});

		it('应该正确判断不能处理异常', async () => {
			const nonHttpException = { ...mockException, category: ExceptionCategory.APPLICATION };
			const canHandle = await strategy.canHandle(nonHttpException);
			expect(canHandle).toBe(false);
		});
	});
});
