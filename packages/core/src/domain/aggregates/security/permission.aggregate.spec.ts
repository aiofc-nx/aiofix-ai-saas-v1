/**
 * 权限实体测试
 *
 * @description 测试权限实体的核心功能和业务规则
 * @since 1.0.0
 */

import { Permission, PermissionScope, PermissionType, PermissionStatus } from './permission.aggregate';
import { EntityId } from '../../value-objects/entity-id';
import type { IAuditInfo } from '../../entities/base/audit-info';

describe('Permission', () => {
	let permissionId: EntityId;
	let auditInfo: Partial<IAuditInfo>;

	beforeEach(() => {
		permissionId = EntityId.generate();
		auditInfo = {
			createdBy: 'admin-001',
			tenantId: 'system'
		};
	});

	describe('构造函数', () => {
		it('应该正确创建权限实体', () => {
			const permission = new Permission(
				permissionId,
				'document:read',
				'文档读取权限',
				'允许读取文档内容',
				PermissionScope.RESOURCE,
				PermissionType.DATA,
				PermissionStatus.ACTIVE,
				[],
				{},
				auditInfo
			);

			expect(permission.id).toBe(permissionId);
			expect(permission.name).toBe('文档读取权限');
			expect(permission.description).toBe('允许读取文档内容');
			expect(permission.scope).toBe(PermissionScope.RESOURCE);
			expect(permission.type).toBe(PermissionType.DATA);
			expect(permission.status).toBe(PermissionStatus.ACTIVE);
		});

		it('应该使用默认状态创建权限', () => {
			const permission = new Permission(
				permissionId,
				'document:read',
				'文档读取权限',
				'允许读取文档内容',
				PermissionScope.RESOURCE,
				PermissionType.DATA,
				PermissionStatus.ACTIVE,
				[],
				{},
				auditInfo
			);

			expect(permission.status).toBe(PermissionStatus.ACTIVE);
		});
	});

	describe('状态检查', () => {
		let permission: Permission;

		beforeEach(() => {
			permission = new Permission(
				permissionId,
				'document:read',
				'文档读取权限',
				'允许读取文档内容',
				PermissionScope.RESOURCE,
				PermissionType.DATA,
				PermissionStatus.ACTIVE,
				[],
				{},
				auditInfo
			);
		});

		it('应该正确检查活跃状态', () => {
			expect(permission.isActive).toBe(true);
		});

		it('应该正确检查禁用状态', () => {
			const disabledPermission = new Permission(
				EntityId.generate(),
				'document:read:disabled',
				'禁用权限',
				'已禁用的权限',
				PermissionScope.RESOURCE,
				PermissionType.DATA,
				PermissionStatus.DISABLED,
				[],
				{},
				auditInfo
			);
			expect(disabledPermission.isActive).toBe(false);
		});

		it('应该正确检查废弃状态', () => {
			const deprecatedPermission = new Permission(
				EntityId.generate(),
				'document:read:deprecated',
				'废弃权限',
				'已废弃的权限',
				PermissionScope.RESOURCE,
				PermissionType.DATA,
				PermissionStatus.DEPRECATED,
				[],
				{},
				auditInfo
			);
			expect(deprecatedPermission.isActive).toBe(false);
		});
	});

	describe('业务方法', () => {
		let permission: Permission;

		beforeEach(() => {
			permission = new Permission(
				permissionId,
				'document:read',
				'文档读取权限',
				'允许读取文档内容',
				PermissionScope.RESOURCE,
				PermissionType.DATA,
				PermissionStatus.ACTIVE,
				[],
				{},
				auditInfo
			);
		});

		it('应该能够访问权限属性', () => {
			expect(permission.code).toBe('document:read');
			expect(permission.name).toBe('文档读取权限');
			expect(permission.description).toBe('允许读取文档内容');
			expect(permission.scope).toBe(PermissionScope.RESOURCE);
			expect(permission.type).toBe(PermissionType.DATA);
			expect(permission.status).toBe(PermissionStatus.ACTIVE);
		});

		it('应该能够检查权限状态', () => {
			expect(permission.isActive).toBe(true);
			expect(permission.isDisabled).toBe(false);
			expect(permission.isDeprecated).toBe(false);
		});

		it('应该能够管理权限依赖', () => {
			expect(permission.dependencies).toEqual([]);
			expect(permission.dependsOn('document:read')).toBe(false);
		});
	});

	describe('边界情况', () => {
		it('应该拒绝空的权限代码', () => {
			expect(() => {
				new Permission(
					permissionId,
					'',
					'权限名称',
					'权限描述',
					PermissionScope.RESOURCE,
					PermissionType.DATA,
					PermissionStatus.ACTIVE,
					[],
					{},
					auditInfo
				);
			}).toThrow('权限代码不能为空');
		});

		it('应该能够处理空的权限描述', () => {
			const permission = new Permission(
				permissionId,
				'document:read',
				'权限名称',
				'',
				PermissionScope.RESOURCE,
				PermissionType.DATA,
				PermissionStatus.ACTIVE,
				[],
				{},
				auditInfo
			);
			expect(permission.description).toBe('');
		});

		it('应该能够处理空的依赖列表', () => {
			const permission = new Permission(
				permissionId,
				'document:read',
				'权限名称',
				'权限描述',
				PermissionScope.RESOURCE,
				PermissionType.DATA,
				PermissionStatus.ACTIVE,
				[],
				{},
				auditInfo
			);
			expect(permission.dependencies).toEqual([]);
		});

		it('应该能够处理权限元数据', () => {
			const permission = new Permission(
				permissionId,
				'document:read',
				'权限名称',
				'权限描述',
				PermissionScope.RESOURCE,
				PermissionType.DATA,
				PermissionStatus.ACTIVE,
				[],
				{ category: 'document', level: 'read' },
				auditInfo
			);
			expect(permission.metadata).toEqual({ category: 'document', level: 'read' });
		});
	});
});
