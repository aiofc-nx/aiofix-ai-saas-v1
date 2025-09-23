/**
 * 权限实体简单测试
 *
 * @description 测试权限实体的基本功能
 * @since 1.0.0
 */

import { Permission, PermissionScope, PermissionType, PermissionStatus } from './permission.entity';
import { EntityId } from '../../value-objects/entity-id';
import { AuditInfoBuilder } from '../../entities/base/audit-info';

describe('Permission - Simple Tests', () => {
	let permissionId: EntityId;
	let auditInfo: any;

	beforeEach(() => {
		permissionId = EntityId.generate();
		auditInfo = new AuditInfoBuilder().withCreatedBy('admin-001').withTenantId('system').build();
	});

	describe('构造函数', () => {
		it('应该正确创建权限实体', () => {
			const permission = new Permission(
				permissionId,
				'文档读取权限',
				'允许读取文档内容',
				PermissionType.READ,
				PermissionScope.RESOURCE,
				['document'],
				PermissionStatus.ACTIVE,
				undefined,
				undefined,
				undefined,
				auditInfo
			);

			expect(permission.id).toBe(permissionId);
			expect(permission.name).toBe('文档读取权限');
			expect(permission.description).toBe('允许读取文档内容');
			expect(permission.scope).toBe(PermissionScope.RESOURCE);
			expect(permission.type).toBe(PermissionType.READ);
			expect(permission.status).toBe(PermissionStatus.ACTIVE);
		});

		it('应该正确检查活跃状态', () => {
			const permission = new Permission(
				permissionId,
				'文档读取权限',
				'允许读取文档内容',
				PermissionType.READ,
				PermissionScope.RESOURCE,
				['document'],
				PermissionStatus.ACTIVE,
				undefined,
				undefined,
				undefined,
				auditInfo
			);

			expect(permission.isActive()).toBe(true);
		});

		it('应该正确检查资源类型', () => {
			const permission = new Permission(
				permissionId,
				'文档读取权限',
				'允许读取文档内容',
				PermissionType.READ,
				PermissionScope.RESOURCE,
				['document', 'file'],
				PermissionStatus.ACTIVE,
				undefined,
				undefined,
				undefined,
				auditInfo
			);

			expect(permission.appliesToResourceType('document')).toBe(true);
			expect(permission.appliesToResourceType('file')).toBe(true);
			expect(permission.appliesToResourceType('image')).toBe(false);
		});

		it('应该正确检查权限类型', () => {
			const permission = new Permission(
				permissionId,
				'文档管理权限',
				'允许管理文档',
				PermissionType.ADMIN,
				PermissionScope.RESOURCE,
				['document'],
				PermissionStatus.ACTIVE,
				undefined,
				undefined,
				undefined,
				auditInfo
			);

			expect(permission.includesType(PermissionType.READ)).toBe(true);
			expect(permission.includesType(PermissionType.WRITE)).toBe(true);
			expect(permission.includesType(PermissionType.ADMIN)).toBe(true);
		});
	});

	describe('边界情况', () => {
		it('应该拒绝空的权限名称', () => {
			expect(() => {
				new Permission(
					permissionId,
					'',
					'权限描述',
					PermissionType.READ,
					PermissionScope.RESOURCE,
					['document'],
					PermissionStatus.ACTIVE,
					undefined,
					undefined,
					undefined,
					auditInfo
				);
			}).toThrow('权限名称不能为空');
		});

		it('应该拒绝空的资源类型列表', () => {
			expect(() => {
				new Permission(
					permissionId,
					'权限名称',
					'权限描述',
					PermissionType.READ,
					PermissionScope.RESOURCE,
					[],
					PermissionStatus.ACTIVE,
					undefined,
					undefined,
					undefined,
					auditInfo
				);
			}).toThrow('权限必须指定至少一个资源类型');
		});
	});
});
