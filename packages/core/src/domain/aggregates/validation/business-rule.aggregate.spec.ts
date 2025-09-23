/**
 * 业务规则聚合测试
 *
 * @description 测试业务规则聚合的核心功能和业务规则
 * @since 1.0.0
 */

import { BusinessRule, RuleType, RuleScope, RuleStatus } from './business-rule.aggregate';
import { EntityId } from '../../value-objects/entity-id';
import type { IAuditInfo } from '../../entities/base/audit-info';

describe('BusinessRule', () => {
	let ruleId: EntityId;
	let auditInfo: Partial<IAuditInfo>;

	beforeEach(() => {
		ruleId = EntityId.generate();
		auditInfo = {
			createdBy: 'admin-001',
			tenantId: 'system'
		};
	});

	describe('构造函数', () => {
		it('应该正确创建业务规则实体', () => {
			const rule = new BusinessRule(
				ruleId,
				'user:email:format',
				'邮箱格式验证',
				'验证邮箱地址格式是否正确',
				RuleType.FORMAT_VALIDATION,
				RuleScope.FIELD,
				(value: unknown) => typeof value === 'string' && value.includes('@'),
				RuleStatus.ACTIVE,
				1,
				0,
				[],
				{},
				auditInfo
			);

			expect(rule.id).toBe(ruleId);
			expect(rule.code).toBe('user:email:format');
			expect(rule.name).toBe('邮箱格式验证');
			expect(rule.description).toBe('验证邮箱地址格式是否正确');
			expect(rule.type).toBe(RuleType.FORMAT_VALIDATION);
			expect(rule.scope).toBe(RuleScope.FIELD);
			expect(rule.status).toBe(RuleStatus.ACTIVE);
		});

		it('应该使用默认值创建规则', () => {
			const rule = new BusinessRule(
				ruleId,
				'test:rule',
				'测试规则',
				'测试规则描述',
				RuleType.FORMAT_VALIDATION,
				RuleScope.FIELD,
				(_value: unknown) => true,
				RuleStatus.ACTIVE,
				undefined,
				undefined,
				undefined,
				undefined,
				auditInfo
			);

			expect(rule.priority).toBe(0);
			expect(rule.ruleVersion).toBe(1);
			expect(rule.dependencies).toEqual([]);
		});
	});

	describe('状态检查', () => {
		let rule: BusinessRule;

		beforeEach(() => {
			rule = new BusinessRule(
				ruleId,
				'test:rule',
				'测试规则',
				'测试规则描述',
				RuleType.FORMAT_VALIDATION,
				RuleScope.FIELD,
				(_value: unknown) => true,
				RuleStatus.ACTIVE,
				1,
				0,
				[],
				{},
				auditInfo
			);
		});

		it('应该正确检查活跃状态', () => {
			expect(rule.isActive).toBe(true);
		});

		it('应该正确检查禁用状态', () => {
			const disabledRule = new BusinessRule(
				EntityId.generate(),
				'test:rule:disabled',
				'禁用规则',
				'禁用的测试规则',
				RuleType.FORMAT_VALIDATION,
				RuleScope.FIELD,
				(_value: unknown) => true,
				RuleStatus.DISABLED,
				1,
				0,
				[],
				{},
				auditInfo
			);
			expect(disabledRule.isActive).toBe(false);
		});

		it('应该正确检查测试状态', () => {
			const testRule = new BusinessRule(
				EntityId.generate(),
				'test:rule:testing',
				'测试规则',
				'测试中的规则',
				RuleType.FORMAT_VALIDATION,
				RuleScope.FIELD,
				(_value: unknown) => true,
				RuleStatus.TESTING,
				1,
				0,
				[],
				{},
				auditInfo
			);
			expect(testRule.status).toBe(RuleStatus.TESTING);
			expect(testRule.isActive).toBe(false);
		});

		it('应该正确检查废弃状态', () => {
			const deprecatedRule = new BusinessRule(
				EntityId.generate(),
				'test:rule:deprecated',
				'废弃规则',
				'已废弃的规则',
				RuleType.FORMAT_VALIDATION,
				RuleScope.FIELD,
				(_value: unknown) => true,
				RuleStatus.DEPRECATED,
				1,
				0,
				[],
				{},
				auditInfo
			);
			expect(deprecatedRule.status).toBe(RuleStatus.DEPRECATED);
			expect(deprecatedRule.isActive).toBe(false);
		});
	});

	describe('业务方法', () => {
		let rule: BusinessRule;

		beforeEach(() => {
			rule = new BusinessRule(
				ruleId,
				'test:rule',
				'测试规则',
				'测试规则描述',
				RuleType.FORMAT_VALIDATION,
				RuleScope.FIELD,
				(_value: unknown) => true,
				RuleStatus.ACTIVE,
				1,
				0,
				[],
				{},
				auditInfo
			);
		});

		it('应该能够访问规则属性', () => {
			expect(rule.code).toBe('test:rule');
			expect(rule.name).toBe('测试规则');
			expect(rule.description).toBe('测试规则描述');
			expect(rule.type).toBe(RuleType.FORMAT_VALIDATION);
			expect(rule.scope).toBe(RuleScope.FIELD);
			expect(rule.status).toBe(RuleStatus.ACTIVE);
			expect(rule.priority).toBe(0);
			expect(rule.ruleVersion).toBe(1);
		});

		it('应该能够检查规则类型', () => {
			expect(rule.type).toBe(RuleType.FORMAT_VALIDATION);
			expect(rule.type).not.toBe(RuleType.BUSINESS_LOGIC);
		});

		it('应该能够检查作用域', () => {
			expect(rule.scope).toBe(RuleScope.FIELD);
			expect(rule.scope).not.toBe(RuleScope.SYSTEM);
		});

		it('应该能够访问元数据', () => {
			const taggedRule = new BusinessRule(
				EntityId.generate(),
				'test:rule:tagged',
				'带标签规则',
				'带标签的测试规则',
				RuleType.FORMAT_VALIDATION,
				RuleScope.FIELD,
				(_value: unknown) => true,
				RuleStatus.ACTIVE,
				1,
				0,
				[],
				{ tags: ['important', 'validation'] },
				auditInfo
			);
			expect(taggedRule.metadata.tags).toEqual(['important', 'validation']);
		});
	});

	describe('边界情况', () => {
		it('应该拒绝空的规则代码', () => {
			expect(() => {
				new BusinessRule(
					ruleId,
					'',
					'规则名称',
					'规则描述',
					RuleType.FORMAT_VALIDATION,
					RuleScope.FIELD,
					(_value: unknown) => true,
					RuleStatus.ACTIVE,
					1,
					0,
					[],
					{},
					auditInfo
				);
			}).toThrow();
		});

		it('应该能够处理空的规则名称', () => {
			const rule = new BusinessRule(
				ruleId,
				'test:rule:empty-name',
				'',
				'规则描述',
				RuleType.FORMAT_VALIDATION,
				RuleScope.FIELD,
				(_value: unknown) => true,
				RuleStatus.ACTIVE,
				1,
				0,
				[],
				{},
				auditInfo
			);
			expect(rule.name).toBe('');
		});

		it('应该能够处理空的规则描述', () => {
			const rule = new BusinessRule(
				ruleId,
				'test:rule:empty-desc',
				'规则名称',
				'',
				RuleType.FORMAT_VALIDATION,
				RuleScope.FIELD,
				(_value: unknown) => true,
				RuleStatus.ACTIVE,
				1,
				0,
				[],
				{},
				auditInfo
			);
			expect(rule.description).toBe('');
		});

		it('应该拒绝无效的验证函数', () => {
			expect(() => {
				new BusinessRule(
					ruleId,
					'test:rule',
					'规则名称',
					'规则描述',
					RuleType.FORMAT_VALIDATION,
					RuleScope.FIELD,
					null as unknown as (value: unknown) => boolean,
					RuleStatus.ACTIVE,
					1,
					0,
					[],
					{},
					auditInfo
				);
			}).toThrow();
		});
	});
});
