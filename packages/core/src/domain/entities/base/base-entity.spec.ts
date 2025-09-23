/**
 * BaseEntity 测试
 *
 * 测试基础实体类的核心功能，包括标识符管理、审计信息、相等性比较等。
 *
 * @description 基础实体类的单元测试
 * @since 1.0.0
 */

import { BaseEntity } from './base-entity';
import { EntityId } from '../../value-objects/entity-id';
import { IPartialAuditInfo } from './audit-info';

/**
 * 测试实体类
 */
class TestEntity extends BaseEntity {
	constructor(id: EntityId, public readonly name: string, public readonly email: string, auditInfo: IPartialAuditInfo) {
		super(id, auditInfo);
	}

	public updateName(newName: string): void {
		(this as any).name = newName;
		this.updateTimestamp();
	}

	public updateEmail(newEmail: string): void {
		(this as any).email = newEmail;
		this.updateTimestamp();
	}

	protected override updateTimestamp(): void {
		// 模拟更新时间戳
		(this as any)._auditInfo = {
			...this.auditInfo,
			updatedAt: new Date(),
			version: this.auditInfo.version + 1
		};
	}
}

describe('BaseEntity', () => {
	let testEntity: TestEntity;
	let entityId: EntityId;
	let auditInfo: IPartialAuditInfo;

	beforeEach(() => {
		entityId = EntityId.generate();
		auditInfo = {
			createdBy: 'test-user',
			tenantId: 'test-tenant',
			version: 1
		};
		testEntity = new TestEntity(entityId, 'Test User', 'test@example.com', auditInfo);
	});

	describe('构造函数', () => {
		it('应该正确初始化实体', () => {
			expect(testEntity.id).toBe(entityId);
			expect(testEntity.name).toBe('Test User');
			expect(testEntity.email).toBe('test@example.com');
			expect(testEntity.auditInfo).toBeDefined();
		});

		it('应该正确设置审计信息', () => {
			const audit = testEntity.auditInfo;
			expect(audit.createdBy).toBe('test-user');
			expect(audit.updatedBy).toBe('test-user');
			expect(audit.tenantId).toBe('test-tenant');
			expect(audit.version).toBe(1);
			expect(audit.deletedBy).toBeNull();
			expect(audit.deletedAt).toBeNull();
			expect(audit.lastOperation).toBe('CREATE');
		});

		it('应该使用默认值填充缺失的审计信息', () => {
			const minimalAuditInfo: IPartialAuditInfo = {};
			const entity = new TestEntity(EntityId.generate(), 'Test', 'test@test.com', minimalAuditInfo);

			const audit = entity.auditInfo;
			expect(audit.createdBy).toBe('system');
			expect(audit.updatedBy).toBe('system');
			expect(audit.tenantId).toBe('default');
			expect(audit.version).toBe(1);
		});
	});

	describe('标识符管理', () => {
		it('应该正确返回实体标识符', () => {
			expect(testEntity.id).toBe(entityId);
			expect(testEntity.id.toString()).toBe(entityId.toString());
		});

		it('应该正确返回哈希码', () => {
			const hashCode = testEntity.getHashCode();
			expect(hashCode).toBe(entityId.getHashCode());
		});
	});

	describe('审计信息访问', () => {
		it('应该正确返回创建时间', () => {
			const createdAt = testEntity.createdAt;
			expect(createdAt).toBeInstanceOf(Date);
			expect(createdAt).toBe(testEntity.auditInfo.createdAt);
		});

		it('应该正确返回更新时间', () => {
			const updatedAt = testEntity.updatedAt;
			expect(updatedAt).toBeInstanceOf(Date);
			expect(updatedAt).toBe(testEntity.auditInfo.updatedAt);
		});

		it('应该正确返回删除时间', () => {
			const deletedAt = testEntity.deletedAt;
			expect(deletedAt).toBeNull();
		});

		it('应该正确返回租户标识符', () => {
			expect(testEntity.tenantId).toBe('test-tenant');
		});

		it('应该正确返回版本号', () => {
			expect(testEntity.version).toBe(1);
		});

		it('应该正确检查是否被删除', () => {
			expect(testEntity.isDeleted).toBe(false);
		});

		it('应该正确返回创建者', () => {
			expect(testEntity.createdBy).toBe('test-user');
		});

		it('应该正确返回更新者', () => {
			expect(testEntity.updatedBy).toBe('test-user');
		});

		it('应该正确返回删除者', () => {
			expect(testEntity.deletedBy).toBeNull();
		});
	});

	describe('相等性比较', () => {
		it('相同标识符的实体应该相等', () => {
			const entity1 = new TestEntity(entityId, 'User 1', 'user1@test.com', auditInfo);
			const entity2 = new TestEntity(entityId, 'User 2', 'user2@test.com', auditInfo);

			expect(entity1.equals(entity2)).toBe(true);
		});

		it('不同标识符的实体应该不相等', () => {
			const entity1 = new TestEntity(EntityId.generate(), 'User 1', 'user1@test.com', auditInfo);
			const entity2 = new TestEntity(EntityId.generate(), 'User 2', 'user2@test.com', auditInfo);

			expect(entity1.equals(entity2)).toBe(false);
		});

		it('与 null 比较应该返回 false', () => {
			expect(testEntity.equals(null)).toBe(false);
		});

		it('与 undefined 比较应该返回 false', () => {
			expect(testEntity.equals(undefined)).toBe(false);
		});

		it('不同类型但相同标识符的实体应该不相等', () => {
			class AnotherEntity extends BaseEntity {
				constructor(id: EntityId, audit: IPartialAuditInfo) {
					super(id, audit);
				}
			}

			const anotherEntity = new AnotherEntity(entityId, auditInfo);
			expect(testEntity.equals(anotherEntity)).toBe(false);
		});
	});

	describe('实体比较', () => {
		it('应该基于标识符进行比较', () => {
			const entity1 = new TestEntity(EntityId.generate(), 'User 1', 'user1@test.com', auditInfo);
			const entity2 = new TestEntity(EntityId.generate(), 'User 2', 'user2@test.com', auditInfo);

			const result = entity1.compareTo(entity2);
			expect(typeof result).toBe('number');
			expect([-1, 0, 1]).toContain(result);
		});

		it('与 null 比较应该返回 1', () => {
			const result = testEntity.compareTo(null as any);
			expect(result).toBe(1);
		});

		it('与 undefined 比较应该返回 1', () => {
			const result = testEntity.compareTo(undefined as any);
			expect(result).toBe(1);
		});
	});

	describe('字符串和JSON转换', () => {
		it('应该正确转换为字符串', () => {
			const str = testEntity.toString();
			expect(str).toContain('TestEntity');
			expect(str).toContain(entityId.toString());
		});

		it('应该正确转换为JSON', () => {
			const json = testEntity.toJSON();
			expect(json.id).toBe(entityId.toString());
			expect(json.type).toBe('TestEntity');
			expect(json.auditInfo).toBeDefined();
		});

		it('应该正确返回类型名称', () => {
			expect(testEntity.getTypeName()).toBe('TestEntity');
		});
	});

	describe('实体更新', () => {
		it('应该能够更新实体属性', async () => {
			const originalVersion = testEntity.version;
			const originalUpdatedAt = testEntity.updatedAt;

			// 等待一小段时间确保时间戳不同
			await new Promise((resolve) => global.setTimeout(resolve, 10));

			testEntity.updateName('Updated User');
			expect(testEntity.name).toBe('Updated User');
			expect(testEntity.version).toBe(originalVersion + 1);
			expect(testEntity.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
		});

		it('应该能够更新多个属性', () => {
			testEntity.updateName('New Name');
			testEntity.updateEmail('new@example.com');

			expect(testEntity.name).toBe('New Name');
			expect(testEntity.email).toBe('new@example.com');
		});
	});

	describe('验证功能', () => {
		it('应该通过有效实体的验证', () => {
			expect(() => {
				(testEntity as any).validate();
			}).not.toThrow();
		});

		it('应该拒绝无效的实体标识符', () => {
			// 由于 EntityId 构造函数会验证 UUID 格式，无效的 UUID 会在构造时抛出异常
			expect(() => {
				new TestEntity(EntityId.fromString('00000000-0000-0000-0000-000000000000'), 'Test', 'test@test.com', auditInfo);
			}).toThrow('Invalid EntityId: 00000000-0000-0000-0000-000000000000 is not a valid UUID v4');
		});

		it('应该拒绝空的租户标识符', () => {
			const entityWithEmptyTenant = new TestEntity(EntityId.generate(), 'Test', 'test@test.com', {
				...auditInfo,
				tenantId: ''
			});

			// 由于 BaseEntity 的 buildAuditInfo 方法会使用默认值，空字符串会被保留
			// 但验证方法会检查租户标识符
			expect(() => {
				(entityWithEmptyTenant as any).validate();
			}).toThrow('Tenant ID cannot be null or empty');
		});
	});

	describe('边界情况', () => {
		it('应该处理复杂的审计信息', () => {
			const complexAuditInfo: IPartialAuditInfo = {
				createdBy: 'admin',
				updatedBy: 'user',
				tenantId: 'complex-tenant',
				version: 5,
				lastOperation: 'UPDATE',
				lastOperationIp: '192.168.1.1',
				lastOperationUserAgent: 'Mozilla/5.0',
				lastOperationSource: 'WEB',
				deleteReason: null
			};

			const entity = new TestEntity(EntityId.generate(), 'Complex', 'complex@test.com', complexAuditInfo);
			const audit = entity.auditInfo;

			expect(audit.createdBy).toBe('admin');
			expect(audit.updatedBy).toBe('user');
			expect(audit.tenantId).toBe('complex-tenant');
			expect(audit.version).toBe(5);
			expect(audit.lastOperation).toBe('UPDATE');
			expect(audit.lastOperationIp).toBe('192.168.1.1');
			expect(audit.lastOperationUserAgent).toBe('Mozilla/5.0');
			expect(audit.lastOperationSource).toBe('WEB');
		});

		it('应该处理最小审计信息', () => {
			const minimalAuditInfo: IPartialAuditInfo = {};
			const entity = new TestEntity(EntityId.generate(), 'Minimal', 'minimal@test.com', minimalAuditInfo);

			expect(entity.createdBy).toBe('system');
			expect(entity.updatedBy).toBe('system');
			expect(entity.tenantId).toBe('default');
			expect(entity.version).toBe(1);
			expect(entity.auditInfo.lastOperation).toBe('CREATE');
		});
	});
});
