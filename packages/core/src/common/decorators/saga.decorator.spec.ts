/**
 * Saga 装饰器测试
 *
 * @description 测试 Saga 装饰器的功能
 * @since 1.0.0
 */
import 'reflect-metadata';
import {
	Saga,
	ISagaHandler,
	isSaga,
	getSagaType,
	getSagaPriority,
	supportsSagaType,
	getSagaMetadata
} from './saga.decorator';
import { BaseDomainEvent } from '../../domain/events/base/base-domain-event';
import { EntityId } from '../../domain/value-objects/entity-id';

// 测试用的事件类
class TestSagaEvent extends BaseDomainEvent {
	constructor(
		aggregateId: EntityId,
		aggregateVersion: number,
		tenantId: string,
		public readonly data: { orderId: string }
	) {
		super(aggregateId, aggregateVersion, tenantId);
	}

	get eventType(): string {
		return 'TestSagaEvent';
	}

	override get eventData(): Record<string, unknown> {
		return { orderId: this.data.orderId };
	}
}

// 测试用的 Saga 处理器类（使用基础装饰器）
@Saga('TestSaga')
class BasicTestSagaHandler implements ISagaHandler<TestSagaEvent> {
	async handle(_event: TestSagaEvent): Promise<void> {
		// 测试环境不需要实际日志输出
	}

	getSupportedSagaType(): string {
		return 'TestSaga';
	}

	supports(sagaType: string): boolean {
		return sagaType === 'TestSaga';
	}

	getPriority(): number {
		return 0;
	}

	async canHandle(_event: TestSagaEvent): Promise<boolean> {
		return true;
	}
}

// 测试用的 Saga 处理器类（不使用装饰器）
class TestSagaHandlerWithoutDecorator implements ISagaHandler<TestSagaEvent> {
	async handle(_event: TestSagaEvent): Promise<void> {
		// 测试环境不需要实际日志输出
	}

	getSupportedSagaType(): string {
		return 'TestSaga';
	}

	supports(sagaType: string): boolean {
		return sagaType === 'TestSaga';
	}

	getPriority(): number {
		return 0;
	}

	async canHandle(_event: TestSagaEvent): Promise<boolean> {
		return true;
	}
}

describe('Saga装饰器', () => {
	describe('基础装饰器功能', () => {
		it('应该正确标记 Saga 处理器类', () => {
			expect(isSaga(BasicTestSagaHandler)).toBe(true);
			expect(isSaga(TestSagaHandlerWithoutDecorator)).toBe(false);
		});

		it('应该正确设置 Saga 类型', () => {
			expect(getSagaType(BasicTestSagaHandler)).toBe('TestSaga');
			expect(getSagaType(TestSagaHandlerWithoutDecorator)).toBeUndefined();
		});

		it('应该正确设置静态属性', () => {
			expect((BasicTestSagaHandler as unknown as { sagaType: string }).sagaType).toBe('TestSaga');
			expect((BasicTestSagaHandler as unknown as { priority: number }).priority).toBe(0);
			expect(typeof (BasicTestSagaHandler as unknown as { supports: unknown }).supports).toBe('function');
			expect(typeof (BasicTestSagaHandler as unknown as { getMetadata: unknown }).getMetadata).toBe('function');
		});

		it('应该正确获取元数据', () => {
			const metadata = (
				BasicTestSagaHandler as unknown as {
					getMetadata: () => { sagaType: string; priority: number };
				}
			).getMetadata();
			expect(metadata).toBeDefined();
			expect(metadata.sagaType).toBe('TestSaga');
			expect(metadata.priority).toBe(0);
		});
	});

	describe('工具函数', () => {
		it('supportsSagaType 应该正确检查 Saga 类型支持', () => {
			expect(supportsSagaType(BasicTestSagaHandler, 'TestSaga')).toBe(true);
			expect(supportsSagaType(BasicTestSagaHandler, 'OtherSaga')).toBe(false);
		});

		it('应该正确处理未标记的类', () => {
			expect(isSaga(TestSagaHandlerWithoutDecorator)).toBe(false);
			expect(getSagaType(TestSagaHandlerWithoutDecorator)).toBeUndefined();
			expect(getSagaPriority(TestSagaHandlerWithoutDecorator)).toBeUndefined();
			expect(supportsSagaType(TestSagaHandlerWithoutDecorator, 'TestSaga')).toBe(false);
			expect(getSagaMetadata(TestSagaHandlerWithoutDecorator)).toBeUndefined();
		});
	});
});
