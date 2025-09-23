/**
 * BaseDomainEvent 测试
 *
 * @description 测试 BaseDomainEvent 基础领域事件类的功能
 * @since 1.0.0
 */
import { BaseDomainEvent } from './base-domain-event';
import { EntityId } from '../../value-objects/entity-id';

// 测试用的具体事件类
class TestDomainEvent extends BaseDomainEvent {
	constructor(aggregateId: EntityId, aggregateVersion: number, tenantId: string, public readonly testData: string) {
		super(aggregateId, aggregateVersion, tenantId);
	}

	get eventType(): string {
		return 'TestDomainEvent';
	}

	override get eventData(): Record<string, unknown> {
		return {
			testData: this.testData
		};
	}
}

describe('BaseDomainEvent', () => {
	let aggregateId: EntityId;
	let tenantId: string;

	beforeEach(() => {
		aggregateId = EntityId.generate();
		tenantId = 'test-tenant-123';
	});

	describe('事件创建', () => {
		it('应该正确创建领域事件', () => {
			const event = new TestDomainEvent(aggregateId, 1, tenantId, 'test-data');

			expect(event).toBeInstanceOf(BaseDomainEvent);
			expect(event.eventId).toBeInstanceOf(EntityId);
			expect(event.aggregateId.equals(aggregateId)).toBe(true);
			expect(event.aggregateVersion).toBe(1);
			expect(event.tenantId).toBe(tenantId);
			expect(event.occurredAt).toBeInstanceOf(Date);
			expect(event.eventVersion).toBe(1);
			expect(event.eventType).toBe('TestDomainEvent');
		});

		it('应该为每个事件生成唯一的事件ID', () => {
			const event1 = new TestDomainEvent(aggregateId, 1, tenantId, 'data1');
			const event2 = new TestDomainEvent(aggregateId, 1, tenantId, 'data2');

			expect(event1.eventId.equals(event2.eventId)).toBe(false);
		});

		it('应该正确设置事件发生时间', () => {
			const beforeTime = new Date();
			const event = new TestDomainEvent(aggregateId, 1, tenantId, 'test-data');
			const afterTime = new Date();

			expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
			expect(event.occurredAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
		});
	});

	describe('事件类型和数据', () => {
		it('应该返回正确的事件类型', () => {
			const event = new TestDomainEvent(aggregateId, 1, tenantId, 'test-data');

			expect(event.eventType).toBe('TestDomainEvent');
		});

		it('应该返回正确的事件数据', () => {
			const testData = 'test-data-value';
			const event = new TestDomainEvent(aggregateId, 1, tenantId, testData);

			expect(event.eventData).toEqual({
				testData
			});
		});

		it('应该正确检查事件类型', () => {
			const event = new TestDomainEvent(aggregateId, 1, tenantId, 'test-data');

			expect(event.isOfType('TestDomainEvent')).toBe(true);
			expect(event.isOfType('OtherEvent')).toBe(false);
		});
	});

	describe('事件相等性', () => {
		it('相同事件ID的事件应该相等', () => {
			const event1 = new TestDomainEvent(aggregateId, 1, tenantId, 'data1');
			const event2 = new TestDomainEvent(aggregateId, 1, tenantId, 'data2');

			// 手动设置相同的事件ID
			(event1 as any)._eventId = (event2 as any)._eventId;

			expect(event1.equals(event2)).toBe(true);
		});

		it('不同事件ID的事件应该不相等', () => {
			const event1 = new TestDomainEvent(aggregateId, 1, tenantId, 'data1');
			const event2 = new TestDomainEvent(aggregateId, 1, tenantId, 'data2');

			expect(event1.equals(event2)).toBe(false);
		});

		it('与 null 或 undefined 比较应该返回 false', () => {
			const event = new TestDomainEvent(aggregateId, 1, tenantId, 'test-data');

			expect(event.equals(null)).toBe(false);
			expect(event.equals(undefined)).toBe(false);
		});

		it('不同类型的事件应该不相等', () => {
			const event1 = new TestDomainEvent(aggregateId, 1, tenantId, 'data1');

			class OtherTestEvent extends BaseDomainEvent {
				constructor(id: EntityId, version: number, tenant: string) {
					super(id, version, tenant);
				}

				get eventType(): string {
					return 'OtherTestEvent';
				}
			}

			const event2 = new OtherTestEvent(aggregateId, 1, tenantId);

			expect(event1.equals(event2)).toBe(false);
		});
	});

	describe('事件比较', () => {
		it('应该按发生时间比较事件', () => {
			const event1 = new TestDomainEvent(aggregateId, 1, tenantId, 'data1');

			// 等待一小段时间确保时间不同
			setTimeout(() => {
				const event2 = new TestDomainEvent(aggregateId, 1, tenantId, 'data2');

				expect(event1.compareTo(event2)).toBeLessThan(0);
				expect(event2.compareTo(event1)).toBeGreaterThan(0);
				expect(event1.compareTo(event1)).toBe(0);
			}, 1);
		});

		it('与 null 或 undefined 比较应该返回 1', () => {
			const event = new TestDomainEvent(aggregateId, 1, tenantId, 'test-data');

			expect(event.compareTo(null as any)).toBe(1);
			expect(event.compareTo(undefined as any)).toBe(1);
		});
	});

	describe('聚合关联', () => {
		it('应该正确检查事件是否属于指定的聚合根', () => {
			const event = new TestDomainEvent(aggregateId, 1, tenantId, 'test-data');
			const otherAggregateId = EntityId.generate();

			expect(event.belongsToAggregate(aggregateId)).toBe(true);
			expect(event.belongsToAggregate(otherAggregateId)).toBe(false);
		});

		it('应该正确检查事件是否属于指定的租户', () => {
			const event = new TestDomainEvent(aggregateId, 1, tenantId, 'test-data');
			const otherTenantId = 'other-tenant-456';

			expect(event.belongsToTenant(tenantId)).toBe(true);
			expect(event.belongsToTenant(otherTenantId)).toBe(false);
		});
	});

	describe('事件转换', () => {
		it('应该正确转换为字符串', () => {
			const event = new TestDomainEvent(aggregateId, 1, tenantId, 'test-data');

			expect(event.toString()).toMatch(/^TestDomainEvent\([a-f0-9-]+\)$/);
		});

		it('应该正确转换为 JSON', () => {
			const event = new TestDomainEvent(aggregateId, 1, tenantId, 'test-data');
			const json = event.toJSON();

			expect(json).toHaveProperty('eventId');
			expect(json).toHaveProperty('eventType', 'TestDomainEvent');
			expect(json).toHaveProperty('aggregateId');
			expect(json).toHaveProperty('aggregateVersion', 1);
			expect(json).toHaveProperty('tenantId', tenantId);
			expect(json).toHaveProperty('occurredAt');
			expect(json).toHaveProperty('eventVersion', 1);
			expect(json).toHaveProperty('eventData', { testData: 'test-data' });
		});

		it('应该正确获取哈希码', () => {
			const event = new TestDomainEvent(aggregateId, 1, tenantId, 'test-data');

			expect(event.getHashCode()).toBe(event.eventId.toString());
		});

		it('应该正确获取类型名称', () => {
			const event = new TestDomainEvent(aggregateId, 1, tenantId, 'test-data');

			expect(event.getTypeName()).toBe('TestDomainEvent');
		});
	});

	describe('事件版本', () => {
		it('应该支持自定义事件版本', () => {
			class VersionedTestEvent extends BaseDomainEvent {
				constructor(id: EntityId, version: number, tenant: string, eventVersion: number) {
					super(id, version, tenant, eventVersion);
				}

				get eventType(): string {
					return 'VersionedTestEvent';
				}
			}

			const event = new VersionedTestEvent(aggregateId, 1, tenantId, 5);

			expect(event.eventVersion).toBe(5);
		});

		it('应该默认事件版本为 1', () => {
			const event = new TestDomainEvent(aggregateId, 1, tenantId, 'test-data');

			expect(event.eventVersion).toBe(1);
		});
	});
});
