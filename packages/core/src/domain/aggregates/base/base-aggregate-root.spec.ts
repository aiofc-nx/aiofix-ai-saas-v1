/**
 * BaseAggregateRoot 测试
 *
 * @description 测试 BaseAggregateRoot 基础聚合根类的功能
 * @since 1.0.0
 */
import { BaseAggregateRoot } from './base-aggregate-root';
import { BaseDomainEvent } from '../../events/base/base-domain-event';
import { EntityId } from '../../value-objects/entity-id';
import { IPartialAuditInfo } from './audit-info';

// 测试用的具体领域事件类
class TestDomainEvent extends BaseDomainEvent {
	constructor(aggregateId: EntityId, aggregateVersion: number, tenantId: string, public readonly testData: string) {
		super(aggregateId, aggregateVersion, tenantId);
	}

	get eventType(): string {
		return 'TestDomainEvent';
	}
}

class AnotherTestEvent extends BaseDomainEvent {
	constructor(aggregateId: EntityId, aggregateVersion: number, tenantId: string) {
		super(aggregateId, aggregateVersion, tenantId);
	}

	get eventType(): string {
		return 'AnotherTestEvent';
	}
}

// 测试用的具体聚合根类
class TestAggregateRoot extends BaseAggregateRoot {
	private _name = '';
	private _isActive = true;

	constructor(id: EntityId, name: string, auditInfo: IPartialAuditInfo) {
		super(id, auditInfo);
		this._name = name;
		this.addDomainEvent(new TestDomainEvent(id, this.version, this.tenantId, `Created: ${name}`));
	}

	get name(): string {
		return this._name;
	}

	get isActive(): boolean {
		return this._isActive;
	}

	updateName(newName: string): void {
		if (this._name === newName) {
			return;
		}
		this._name = newName;
		this.addDomainEvent(new TestDomainEvent(this.id, this.version, this.tenantId, `Updated: ${newName}`));
		this.markAsModified();
	}

	activate(): void {
		if (this._isActive) {
			return;
		}
		this._isActive = true;
		this.addDomainEvent(new AnotherTestEvent(this.id, this.version, this.tenantId));
		this.markAsModified();
	}

	deactivate(): void {
		if (!this._isActive) {
			return;
		}
		this._isActive = false;
		this.addDomainEvent(new AnotherTestEvent(this.id, this.version, this.tenantId));
		this.markAsModified();
	}

	removeAllEvents(): void {
		this.clearDomainEvents();
	}

	removeSpecificEvent(event: BaseDomainEvent): void {
		this.removeDomainEvent(event);
	}
}

describe('BaseAggregateRoot', () => {
	let aggregateId: EntityId;
	let auditInfo: IPartialAuditInfo;

	beforeEach(() => {
		aggregateId = EntityId.generate();
		auditInfo = {
			createdBy: 'test-user',
			tenantId: 'test-tenant-123'
		};
	});

	describe('聚合根创建', () => {
		it('应该正确创建聚合根', () => {
			const aggregate = new TestAggregateRoot(aggregateId, 'Test Name', auditInfo);

			expect(aggregate).toBeInstanceOf(BaseAggregateRoot);
			expect(aggregate.id.equals(aggregateId)).toBe(true);
			expect(aggregate.name).toBe('Test Name');
			expect(aggregate.isActive).toBe(true);
			expect(aggregate.tenantId).toBe('test-tenant-123');
		});

		it('应该在创建时添加领域事件', () => {
			const aggregate = new TestAggregateRoot(aggregateId, 'Test Name', auditInfo);

			expect(aggregate.hasDomainEvents()).toBe(true);
			expect(aggregate.hasUncommittedEvents()).toBe(true);
			expect(aggregate.getEventCount()).toBe(1);
			expect(aggregate.getUncommittedEventCount()).toBe(1);
		});
	});

	describe('领域事件管理', () => {
		it('应该正确添加领域事件', () => {
			const aggregate = new TestAggregateRoot(aggregateId, 'Test Name', auditInfo);
			const initialEventCount = aggregate.getEventCount();

			aggregate.updateName('New Name');

			expect(aggregate.getEventCount()).toBe(initialEventCount + 1);
			expect(aggregate.getUncommittedEventCount()).toBe(initialEventCount + 1);
		});

		it('应该正确获取指定类型的事件', () => {
			const aggregate = new TestAggregateRoot(aggregateId, 'Test Name', auditInfo);

			aggregate.updateName('New Name');
			aggregate.deactivate();

			const testEvents = aggregate.getEventsOfType('TestDomainEvent');
			const anotherEvents = aggregate.getEventsOfType('AnotherTestEvent');

			expect(testEvents).toHaveLength(2);
			expect(anotherEvents).toHaveLength(1);
		});

		it('应该正确获取未提交的指定类型事件', () => {
			const aggregate = new TestAggregateRoot(aggregateId, 'Test Name', auditInfo);

			aggregate.updateName('New Name');
			aggregate.deactivate();

			const uncommittedTestEvents = aggregate.getUncommittedEventsOfType('TestDomainEvent');
			const uncommittedAnotherEvents = aggregate.getUncommittedEventsOfType('AnotherTestEvent');

			expect(uncommittedTestEvents).toHaveLength(2);
			expect(uncommittedAnotherEvents).toHaveLength(1);
		});

		it('应该正确检查是否有指定类型的事件', () => {
			const aggregate = new TestAggregateRoot(aggregateId, 'Test Name', auditInfo);

			aggregate.updateName('New Name');
			aggregate.deactivate();

			expect(aggregate.hasEventOfType('TestDomainEvent')).toBe(true);
			expect(aggregate.hasEventOfType('AnotherTestEvent')).toBe(true);
			expect(aggregate.hasEventOfType('NonExistentEvent')).toBe(false);
		});

		it('应该正确检查是否有未提交的指定类型事件', () => {
			const aggregate = new TestAggregateRoot(aggregateId, 'Test Name', auditInfo);

			aggregate.updateName('New Name');

			expect(aggregate.hasUncommittedEventOfType('TestDomainEvent')).toBe(true);
			expect(aggregate.hasUncommittedEventOfType('AnotherTestEvent')).toBe(false);
		});

		it('应该正确获取最新的事件', () => {
			const aggregate = new TestAggregateRoot(aggregateId, 'Test Name', auditInfo);

			aggregate.updateName('New Name');

			const latestEvent = aggregate.getLatestEvent();
			expect(latestEvent).toBeDefined();
			expect(latestEvent?.eventType).toBe('TestDomainEvent');
		});

		it('应该正确获取最新的未提交事件', () => {
			const aggregate = new TestAggregateRoot(aggregateId, 'Test Name', auditInfo);

			aggregate.updateName('New Name');

			const latestUncommittedEvent = aggregate.getLatestUncommittedEvent();
			expect(latestUncommittedEvent).toBeDefined();
			expect(latestUncommittedEvent?.eventType).toBe('TestDomainEvent');
		});
	});

	describe('事件清理', () => {
		it('应该正确清除所有领域事件', () => {
			const aggregate = new TestAggregateRoot(aggregateId, 'Test Name', auditInfo);

			aggregate.updateName('New Name');
			aggregate.deactivate();

			expect(aggregate.getEventCount()).toBe(3);

			aggregate.removeAllEvents();

			expect(aggregate.getEventCount()).toBe(0);
			expect(aggregate.getUncommittedEventCount()).toBe(0);
			expect(aggregate.hasDomainEvents()).toBe(false);
			expect(aggregate.hasUncommittedEvents()).toBe(false);
		});

		it('应该正确清除未提交的事件', () => {
			const aggregate = new TestAggregateRoot(aggregateId, 'Test Name', auditInfo);

			aggregate.updateName('New Name');

			expect(aggregate.getUncommittedEventCount()).toBe(2);

			aggregate.clearUncommittedEvents();

			expect(aggregate.getUncommittedEventCount()).toBe(0);
			expect(aggregate.hasUncommittedEvents()).toBe(false);
			expect(aggregate.getEventCount()).toBe(2); // 已提交的事件仍然存在
		});

		it('应该正确移除特定的领域事件', () => {
			const aggregate = new TestAggregateRoot(aggregateId, 'Test Name', auditInfo);

			const events = aggregate.domainEvents;
			const firstEvent = events[0];

			expect(aggregate.getEventCount()).toBe(1);

			aggregate.removeSpecificEvent(firstEvent);

			expect(aggregate.getEventCount()).toBe(0);
			expect(aggregate.getUncommittedEventCount()).toBe(0);
		});
	});

	describe('事件状态检查', () => {
		it('应该正确检查是否有未提交的事件', () => {
			const aggregate = new TestAggregateRoot(aggregateId, 'Test Name', auditInfo);

			expect(aggregate.hasUncommittedEvents()).toBe(true);

			aggregate.clearUncommittedEvents();

			expect(aggregate.hasUncommittedEvents()).toBe(false);
		});

		it('应该正确检查是否有领域事件', () => {
			const aggregate = new TestAggregateRoot(aggregateId, 'Test Name', auditInfo);

			expect(aggregate.hasDomainEvents()).toBe(true);

			aggregate.removeAllEvents();

			expect(aggregate.hasDomainEvents()).toBe(false);
		});
	});

	describe('聚合根转换', () => {
		it('应该正确转换为 JSON', () => {
			const aggregate = new TestAggregateRoot(aggregateId, 'Test Name', auditInfo);
			const json = aggregate.toJSON();

			expect(json).toHaveProperty('id');
			expect(json).toHaveProperty('type');
			expect(json).toHaveProperty('auditInfo');
			expect(json).toHaveProperty('eventCount', 1);
			expect(json).toHaveProperty('uncommittedEventCount', 1);
			expect(json).toHaveProperty('hasUncommittedEvents', true);
		});

		it('应该正确转换为字符串', () => {
			const aggregate = new TestAggregateRoot(aggregateId, 'Test Name', auditInfo);
			const string = aggregate.toString();

			expect(string).toMatch(/^TestAggregateRoot\([a-f0-9-]+\) - Events: 1, Uncommitted: 1$/);
		});
	});

	describe('业务逻辑', () => {
		it('应该正确处理重复的操作', () => {
			const aggregate = new TestAggregateRoot(aggregateId, 'Test Name', auditInfo);
			const initialEventCount = aggregate.getEventCount();

			// 尝试更新为相同的名称
			aggregate.updateName('Test Name');

			expect(aggregate.getEventCount()).toBe(initialEventCount);
			expect(aggregate.name).toBe('Test Name');
		});

		it('应该正确处理状态变更', () => {
			const aggregate = new TestAggregateRoot(aggregateId, 'Test Name', auditInfo);

			expect(aggregate.isActive).toBe(true);

			aggregate.deactivate();

			expect(aggregate.isActive).toBe(false);
			expect(aggregate.hasEventOfType('AnotherTestEvent')).toBe(true);

			aggregate.activate();

			expect(aggregate.isActive).toBe(true);
		});
	});

	describe('错误处理', () => {
		it('应该拒绝添加 null 或 undefined 事件', () => {
			const aggregate = new TestAggregateRoot(aggregateId, 'Test Name', auditInfo);

			expect(() => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(aggregate as any).addDomainEvent(null);
			}).toThrow('Domain event cannot be null or undefined');

			expect(() => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(aggregate as any).addDomainEvent(undefined);
			}).toThrow('Domain event cannot be null or undefined');
		});
	});
});
