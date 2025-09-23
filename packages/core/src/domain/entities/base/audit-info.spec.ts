/**
 * AuditInfo 测试
 *
 * 测试审计信息接口和构建器的功能，包括审计信息创建、构建器模式等。
 *
 * @description 审计信息接口和构建器的单元测试
 * @since 1.0.0
 */

import { IAuditInfo, IPartialAuditInfo, AuditInfoBuilder } from './audit-info';

describe('AuditInfo', () => {
  describe('IAuditInfo 接口', () => {
    it('应该正确定义审计信息结构', () => {
      const auditInfo: IAuditInfo = {
        createdBy: 'user-123',
        updatedBy: 'user-123',
        deletedBy: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        deletedAt: null,
        tenantId: 'tenant-456',
        version: 1,
        lastOperation: 'CREATE',
        lastOperationIp: '192.168.1.1',
        lastOperationUserAgent: 'Mozilla/5.0',
        lastOperationSource: 'WEB',
        deleteReason: null,
      };

      expect(auditInfo.createdBy).toBe('user-123');
      expect(auditInfo.updatedBy).toBe('user-123');
      expect(auditInfo.deletedBy).toBeNull();
      expect(auditInfo.createdAt).toBeInstanceOf(Date);
      expect(auditInfo.updatedAt).toBeInstanceOf(Date);
      expect(auditInfo.deletedAt).toBeNull();
      expect(auditInfo.tenantId).toBe('tenant-456');
      expect(auditInfo.version).toBe(1);
      expect(auditInfo.lastOperation).toBe('CREATE');
      expect(auditInfo.lastOperationIp).toBe('192.168.1.1');
      expect(auditInfo.lastOperationUserAgent).toBe('Mozilla/5.0');
      expect(auditInfo.lastOperationSource).toBe('WEB');
      expect(auditInfo.deleteReason).toBeNull();
    });

    it('应该支持所有操作类型', () => {
      const operations: Array<IAuditInfo['lastOperation']> = [
        'CREATE',
        'UPDATE',
        'DELETE',
        'RESTORE',
      ];

      operations.forEach((operation) => {
        const auditInfo: IAuditInfo = {
          createdBy: 'user',
          updatedBy: 'user',
          deletedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          tenantId: 'tenant',
          version: 1,
          lastOperation: operation,
          lastOperationIp: null,
          lastOperationUserAgent: null,
          lastOperationSource: null,
          deleteReason: null,
        };

        expect(auditInfo.lastOperation).toBe(operation);
      });
    });

    it('应该支持所有操作来源', () => {
      const sources: Array<IAuditInfo['lastOperationSource']> = [
        'WEB',
        'API',
        'CLI',
        'SYSTEM',
        null,
      ];

      sources.forEach((source) => {
        const auditInfo: IAuditInfo = {
          createdBy: 'user',
          updatedBy: 'user',
          deletedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          tenantId: 'tenant',
          version: 1,
          lastOperation: 'CREATE',
          lastOperationIp: null,
          lastOperationUserAgent: null,
          lastOperationSource: source,
          deleteReason: null,
        };

        expect(auditInfo.lastOperationSource).toBe(source);
      });
    });
  });

  describe('IPartialAuditInfo 接口', () => {
    it('应该支持部分审计信息', () => {
      const partialAuditInfo: IPartialAuditInfo = {
        createdBy: 'user-123',
        tenantId: 'tenant-456',
        version: 1,
      };

      expect(partialAuditInfo.createdBy).toBe('user-123');
      expect(partialAuditInfo.tenantId).toBe('tenant-456');
      expect(partialAuditInfo.version).toBe(1);
      expect(partialAuditInfo.updatedBy).toBeUndefined();
    });

    it('应该支持空的部分审计信息', () => {
      const emptyAuditInfo: IPartialAuditInfo = {};
      expect(emptyAuditInfo.createdBy).toBeUndefined();
      expect(emptyAuditInfo.tenantId).toBeUndefined();
    });
  });

  describe('AuditInfoBuilder', () => {
    let builder: AuditInfoBuilder;

    beforeEach(() => {
      builder = new AuditInfoBuilder();
    });

    describe('基本构建', () => {
      it('应该构建基本的审计信息', () => {
        const auditInfo = builder.build();

        expect(auditInfo.createdBy).toBe('system');
        expect(auditInfo.updatedBy).toBe('system');
        expect(auditInfo.deletedBy).toBeNull();
        expect(auditInfo.createdAt).toBeInstanceOf(Date);
        expect(auditInfo.updatedAt).toBeInstanceOf(Date);
        expect(auditInfo.deletedAt).toBeNull();
        expect(auditInfo.tenantId).toBe('default');
        expect(auditInfo.version).toBe(1);
        expect(auditInfo.lastOperation).toBe('CREATE');
        expect(auditInfo.lastOperationIp).toBeNull();
        expect(auditInfo.lastOperationUserAgent).toBeNull();
        expect(auditInfo.lastOperationSource).toBeNull();
        expect(auditInfo.deleteReason).toBeNull();
      });

      it('应该使用当前时间作为时间戳', () => {
        const before = new Date();
        const auditInfo = builder.build();
        const after = new Date();

        expect(auditInfo.createdAt.getTime()).toBeGreaterThanOrEqual(
          before.getTime(),
        );
        expect(auditInfo.createdAt.getTime()).toBeLessThanOrEqual(
          after.getTime(),
        );
        expect(auditInfo.updatedAt.getTime()).toBeGreaterThanOrEqual(
          before.getTime(),
        );
        expect(auditInfo.updatedAt.getTime()).toBeLessThanOrEqual(
          after.getTime(),
        );
      });
    });

    describe('链式调用', () => {
      it('应该支持链式调用', () => {
        const auditInfo = builder
          .withCreatedBy('user-123')
          .withUpdatedBy('user-456')
          .withTenantId('tenant-789')
          .withVersion(5)
          .build();

        expect(auditInfo.createdBy).toBe('user-123');
        expect(auditInfo.updatedBy).toBe('user-456');
        expect(auditInfo.tenantId).toBe('tenant-789');
        expect(auditInfo.version).toBe(5);
      });

      it('应该返回构建器实例', () => {
        const result1 = builder.withCreatedBy('user');
        const result2 = builder.withTenantId('tenant');
        const result3 = builder.withVersion(2);

        expect(result1).toBe(builder);
        expect(result2).toBe(builder);
        expect(result3).toBe(builder);
      });
    });

    describe('withCreatedBy', () => {
      it('应该设置创建者', () => {
        const auditInfo = builder.withCreatedBy('creator').build();
        expect(auditInfo.createdBy).toBe('creator');
      });

      it('应该覆盖之前的设置', () => {
        const auditInfo = builder
          .withCreatedBy('first')
          .withCreatedBy('second')
          .build();
        expect(auditInfo.createdBy).toBe('second');
      });
    });

    describe('withUpdatedBy', () => {
      it('应该设置更新者', () => {
        const auditInfo = builder.withUpdatedBy('updater').build();
        expect(auditInfo.updatedBy).toBe('updater');
      });

      it('应该使用创建者作为默认更新者', () => {
        const auditInfo = builder.withCreatedBy('creator').build();
        expect(auditInfo.updatedBy).toBe('creator');
      });

      it('应该优先使用显式设置的更新者', () => {
        const auditInfo = builder
          .withCreatedBy('creator')
          .withUpdatedBy('updater')
          .build();
        expect(auditInfo.updatedBy).toBe('updater');
      });
    });

    describe('withTenantId', () => {
      it('应该设置租户标识符', () => {
        const auditInfo = builder.withTenantId('tenant-123').build();
        expect(auditInfo.tenantId).toBe('tenant-123');
      });
    });

    describe('withVersion', () => {
      it('应该设置版本号', () => {
        const auditInfo = builder.withVersion(10).build();
        expect(auditInfo.version).toBe(10);
      });
    });

    describe('withLastOperation', () => {
      it('应该设置最后操作信息', () => {
        const auditInfo = builder
          .withLastOperation('UPDATE', '192.168.1.1', 'Mozilla/5.0', 'WEB')
          .build();

        expect(auditInfo.lastOperation).toBe('UPDATE');
        expect(auditInfo.lastOperationIp).toBe('192.168.1.1');
        expect(auditInfo.lastOperationUserAgent).toBe('Mozilla/5.0');
        expect(auditInfo.lastOperationSource).toBe('WEB');
      });

      it('应该支持部分操作信息', () => {
        const auditInfo = builder.withLastOperation('DELETE').build();

        expect(auditInfo.lastOperation).toBe('DELETE');
        expect(auditInfo.lastOperationIp).toBeNull();
        expect(auditInfo.lastOperationUserAgent).toBeNull();
        expect(auditInfo.lastOperationSource).toBeNull();
      });

      it('应该支持所有操作类型', () => {
        const operations: Array<'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE'> = [
          'CREATE',
          'UPDATE',
          'DELETE',
          'RESTORE',
        ];

        operations.forEach((operation) => {
          const auditInfo = builder.withLastOperation(operation).build();
          expect(auditInfo.lastOperation).toBe(operation);
        });
      });

      it('应该支持所有操作来源', () => {
        const sources: Array<'WEB' | 'API' | 'CLI' | 'SYSTEM' | null> = [
          'WEB',
          'API',
          'CLI',
          'SYSTEM',
          null,
        ];

        sources.forEach((source) => {
          const auditInfo = builder
            .withLastOperation('CREATE', null, null, source)
            .build();
          expect(auditInfo.lastOperationSource).toBe(source);
        });
      });
    });

    describe('withDeleteReason', () => {
      it('应该设置删除原因', () => {
        const auditInfo = builder
          .withDeleteReason('User requested deletion')
          .build();
        expect(auditInfo.deleteReason).toBe('User requested deletion');
      });
    });

    describe('复杂场景', () => {
      it('应该构建完整的审计信息', () => {
        const auditInfo = builder
          .withCreatedBy('admin')
          .withUpdatedBy('user')
          .withTenantId('tenant-123')
          .withVersion(5)
          .withLastOperation('UPDATE', '192.168.1.100', 'Chrome/91.0', 'WEB')
          .withDeleteReason('Data cleanup')
          .build();

        expect(auditInfo.createdBy).toBe('admin');
        expect(auditInfo.updatedBy).toBe('user');
        expect(auditInfo.deletedBy).toBeNull();
        expect(auditInfo.tenantId).toBe('tenant-123');
        expect(auditInfo.version).toBe(5);
        expect(auditInfo.lastOperation).toBe('UPDATE');
        expect(auditInfo.lastOperationIp).toBe('192.168.1.100');
        expect(auditInfo.lastOperationUserAgent).toBe('Chrome/91.0');
        expect(auditInfo.lastOperationSource).toBe('WEB');
        expect(auditInfo.deleteReason).toBe('Data cleanup');
      });

      it('应该处理空值和默认值', () => {
        const auditInfo = builder
          .withLastOperation('CREATE', null, null, null)
          .build();

        expect(auditInfo.lastOperationIp).toBeNull();
        expect(auditInfo.lastOperationUserAgent).toBeNull();
        expect(auditInfo.lastOperationSource).toBeNull();
        expect(auditInfo.deleteReason).toBeNull();
      });

      it('应该重用构建器实例', () => {
        const auditInfo1 = builder.withCreatedBy('user1').build();
        const auditInfo2 = builder.withCreatedBy('user2').build();

        expect(auditInfo1.createdBy).toBe('user1');
        expect(auditInfo2.createdBy).toBe('user2');
      });
    });

    describe('边界情况', () => {
      it('应该处理空字符串', () => {
        const auditInfo = builder.withCreatedBy('').withTenantId('').build();

        expect(auditInfo.createdBy).toBe(''); // 空字符串应该被保留
        expect(auditInfo.tenantId).toBe(''); // 空字符串应该被保留
      });

      it('应该处理特殊字符', () => {
        const auditInfo = builder
          .withCreatedBy('user@domain.com')
          .withTenantId('tenant-123_456')
          .withDeleteReason('Reason with special chars: @#$%')
          .build();

        expect(auditInfo.createdBy).toBe('user@domain.com');
        expect(auditInfo.tenantId).toBe('tenant-123_456');
        expect(auditInfo.deleteReason).toBe('Reason with special chars: @#$%');
      });

      it('应该处理大版本号', () => {
        const auditInfo = builder.withVersion(Number.MAX_SAFE_INTEGER).build();
        expect(auditInfo.version).toBe(Number.MAX_SAFE_INTEGER);
      });

      it('应该处理零版本号', () => {
        const auditInfo = builder.withVersion(0).build();
        expect(auditInfo.version).toBe(0); // 零版本号应该被保留
      });
    });
  });
});
