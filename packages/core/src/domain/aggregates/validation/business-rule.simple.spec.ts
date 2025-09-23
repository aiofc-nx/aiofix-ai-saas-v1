/**
 * 业务规则实体简单测试
 *
 * @description 测试业务规则实体的基本功能
 * @since 1.0.0
 */

import { BusinessRule, RuleType, RuleScope, RuleStatus } from './business-rule.entity';
import { EntityId } from '../../value-objects/entity-id';
import { AuditInfoBuilder } from '../../entities/base/audit-info';

describe('BusinessRule - Simple Tests', () => {
	let ruleId: EntityId;
	let auditInfo: any;

	beforeEach(() => {
		ruleId = EntityId.generate();
		auditInfo = new AuditInfoBuilder().withCreatedBy('admin-001').withTenantId('system').build();
	});

	describe('构造函数', () => {
		it('应该正确创建业务规则实体', () => {
			const rule = new BusinessRule(
				ruleId,
				'user:email:format',
				'邮箱格式验证',
				RuleType.VALIDATION,
				RuleScope.USER,
				'email.includes("@")',
				'return email.includes("@")',
				RuleStatus.ACTIVE,
				1,
				'1.0.0',
				[],
				undefined,
				undefined,
				auditInfo
			);

			expect(rule.id).toBe(ruleId);
			expect(rule.name).toBe('user:email:format');
			expect(rule.description).toBe('邮箱格式验证');
			expect(rule.type).toBe(RuleType.VALIDATION);
			expect(rule.scope).toBe(RuleScope.USER);
			expect(rule.status).toBe(RuleStatus.ACTIVE);
		});

		it('应该正确检查活跃状态', () => {
			const rule = new BusinessRule(
				ruleId,
				'test:rule',
				'测试规则',
				RuleType.VALIDATION,
				RuleScope.USER,
				'true',
				'return true',
				RuleStatus.ACTIVE,
				1,
				'1.0.0',
				[],
				undefined,
				undefined,
				auditInfo
			);

			expect(rule.isActive()).toBe(true);
		});

		it('应该正确检查作用域', () => {
			const rule = new BusinessRule(
				ruleId,
				'test:rule',
				'测试规则',
				RuleType.VALIDATION,
				RuleScope.USER,
				'true',
				'return true',
				RuleStatus.ACTIVE,
				1,
				'1.0.0',
				[],
				undefined,
				undefined,
				auditInfo
			);

			expect(rule.appliesToScope(RuleScope.USER)).toBe(true);
			expect(rule.appliesToScope(RuleScope.SYSTEM)).toBe(false);
		});

		it('应该正确检查规则类型', () => {
			const rule = new BusinessRule(
				ruleId,
				'test:rule',
				'测试规则',
				RuleType.VALIDATION,
				RuleScope.USER,
				'true',
				'return true',
				RuleStatus.ACTIVE,
				1,
				'1.0.0',
				[],
				undefined,
				undefined,
				auditInfo
			);

			expect(rule.isOfType(RuleType.VALIDATION)).toBe(true);
			expect(rule.isOfType(RuleType.CALCULATION)).toBe(false);
		});
	});

	describe('边界情况', () => {
		it('应该拒绝空的规则名称', () => {
			expect(() => {
				new BusinessRule(
					ruleId,
					'',
					'规则描述',
					RuleType.VALIDATION,
					RuleScope.USER,
					'true',
					'return true',
					RuleStatus.ACTIVE,
					1,
					'1.0.0',
					[],
					undefined,
					undefined,
					auditInfo
				);
			}).toThrow('规则名称不能为空');
		});

		it('应该拒绝空的规则条件', () => {
			expect(() => {
				new BusinessRule(
					ruleId,
					'test:rule',
					'规则描述',
					RuleType.VALIDATION,
					RuleScope.USER,
					'',
					'return true',
					RuleStatus.ACTIVE,
					1,
					'1.0.0',
					[],
					undefined,
					undefined,
					auditInfo
				);
			}).toThrow('规则条件不能为空');
		});

		it('应该拒绝空的规则动作', () => {
			expect(() => {
				new BusinessRule(
					ruleId,
					'test:rule',
					'规则描述',
					RuleType.VALIDATION,
					RuleScope.USER,
					'true',
					'',
					RuleStatus.ACTIVE,
					1,
					'1.0.0',
					[],
					undefined,
					undefined,
					auditInfo
				);
			}).toThrow('规则动作不能为空');
		});
	});
});
