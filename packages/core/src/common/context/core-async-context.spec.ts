/**
 * CoreAsyncContext 测试
 *
 * 测试核心异步上下文的功能，包括数据管理、生命周期管理、多租户支持等。
 *
 * @description 核心异步上下文的单元测试
 * @since 1.0.0
 */

import { CoreAsyncContext } from './core-async-context';
import { IContextData } from './async-context.interface';

describe('CoreAsyncContext', () => {
	let context: CoreAsyncContext;
	let testData: Partial<IContextData>;

	beforeEach(() => {
		testData = {
			tenantId: 'tenant-123',
			userId: 'user-456',
			organizationId: 'org-789',
			departmentId: 'dept-101',
			requestId: 'req-202',
			correlationId: 'corr-303',
			causationId: 'cause-404',
			userAgent: 'Mozilla/5.0',
			ipAddress: '192.168.1.1',
			source: 'WEB',
			locale: 'zh-CN',
			timezone: 'Asia/Shanghai'
		};
		context = new CoreAsyncContext(testData);
	});

	describe('构造函数', () => {
		it('应该正确初始化上下文', () => {
			expect(context.getId()).toBeDefined();
			expect(context.getCreatedAt()).toBeInstanceOf(Date);
			expect(context.getData()).toEqual(expect.objectContaining(testData));
		});

		it('应该生成唯一的标识符', () => {
			const context1 = new CoreAsyncContext();
			const context2 = new CoreAsyncContext();
			expect(context1.getId()).not.toBe(context2.getId());
		});

		it('应该设置创建时间', () => {
			const before = new Date();
			const testContext = new CoreAsyncContext();
			const after = new Date();

			const createdAt = testContext.getCreatedAt();
			expect(createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
		});

		it('应该处理空数据', () => {
			const emptyContext = new CoreAsyncContext();
			const data = emptyContext.getData();
			expect(data.createdAt).toBeInstanceOf(Date);
			expect(Object.keys(data)).toHaveLength(1); // 只有 createdAt
		});
	});

	describe('数据管理', () => {
		it('应该正确获取数据', () => {
			const data = context.getData();
			expect(data.tenantId).toBe('tenant-123');
			expect(data.userId).toBe('user-456');
			expect(data.organizationId).toBe('org-789');
		});

		it('应该正确设置数据', () => {
			const newData = { tenantId: 'new-tenant', userId: 'new-user' };
			context.setData(newData);

			const data = context.getData();
			expect(data.tenantId).toBe('new-tenant');
			expect(data.userId).toBe('new-user');
			expect(data.organizationId).toBe('org-789'); // 应该保留原有数据
		});

		it('应该正确获取指定键的值', () => {
			expect(context.getValue('tenantId')).toBe('tenant-123');
			expect(context.getValue('userId')).toBe('user-456');
			expect(context.getValue('locale')).toBe('zh-CN');
		});

		it('应该正确设置指定键的值', () => {
			context.setValue('tenantId', 'updated-tenant');
			expect(context.getValue('tenantId')).toBe('updated-tenant');
		});

		it('应该正确检查是否包含指定键', () => {
			expect(context.hasValue('tenantId')).toBe(true);
			expect(context.hasValue('locale')).toBe(true);
			expect(context.hasValue('timezone')).toBe(true);
		});

		it('应该正确删除指定键', () => {
			expect(context.hasValue('tenantId')).toBe(true);
			context.removeValue('tenantId');
			expect(context.hasValue('tenantId')).toBe(false);
		});

		it('应该正确清除所有数据', () => {
			context.clear();
			const data = context.getData();
			expect(Object.keys(data)).toHaveLength(1); // 只有 createdAt
			expect(data.createdAt).toBeInstanceOf(Date);
		});
	});

	describe('克隆功能', () => {
		it('应该正确克隆上下文', () => {
			const cloned = context.clone();

			expect(cloned.getId()).not.toBe(context.getId());
			// 由于克隆时会更新时间戳，只检查核心数据
			expect(cloned.getTenantId()).toBe(context.getTenantId());
			expect(cloned.getUserId()).toBe(context.getUserId());
			// 克隆的上下文创建时间应该在原上下文创建时间之后或相等
			expect(cloned.getCreatedAt().getTime()).toBeGreaterThanOrEqual(context.getCreatedAt().getTime());
		});

		it('应该克隆过期时间', () => {
			const expiresAt = new Date(Date.now() + 60000);
			context.setExpiresAt(expiresAt);

			const cloned = context.clone();
			expect(cloned.getExpiresAt()).toEqual(expiresAt);
		});
	});

	describe('合并功能', () => {
		it('应该正确合并上下文数据', () => {
			const otherContext = new CoreAsyncContext({
				tenantId: 'other-tenant',
				locale: 'en-US'
			});

			context.merge(otherContext);
			const data = context.getData();

			expect(data.tenantId).toBe('other-tenant');
			expect(data.userId).toBe('user-456'); // 保留原有数据
			expect(data.locale).toBe('en-US');
			expect(data.createdAt).toEqual(context.getCreatedAt()); // 保持原始创建时间
		});
	});

	describe('生命周期管理', () => {
		it('应该检查上下文是否有效', () => {
			expect(context.isValid()).toBe(true);
		});

		it('应该检查上下文是否已过期', () => {
			expect(context.isExpired()).toBe(false);
		});

		it('应该正确设置过期时间', () => {
			const expiresAt = new Date(Date.now() + 60000);
			context.setExpiresAt(expiresAt);

			expect(context.getExpiresAt()).toEqual(expiresAt);
			expect(context.isExpired()).toBe(false);
		});

		it('应该正确检测过期状态', () => {
			const pastTime = new Date(Date.now() - 60000);
			context.setExpiresAt(pastTime);

			expect(context.isExpired()).toBe(true);
			expect(context.isValid()).toBe(false);
		});
	});

	describe('自定义数据管理', () => {
		it('应该正确设置和获取自定义数据', () => {
			context.setCustomData('featureFlags', ['flag1', 'flag2']);
			context.setCustomData('metadata', { version: '1.0.0' });

			expect(context.getCustomData('featureFlags')).toEqual(['flag1', 'flag2']);
			expect(context.getCustomData('metadata')).toEqual({ version: '1.0.0' });
		});

		it('应该正确删除自定义数据', () => {
			context.setCustomData('temp', 'value');
			expect(context.getCustomData('temp')).toBe('value');

			context.removeCustomData('temp');
			expect(context.getCustomData('temp')).toBeUndefined();
		});

		it('应该正确获取所有自定义数据', () => {
			context.setCustomData('key1', 'value1');
			context.setCustomData('key2', 'value2');

			const allData = context.getAllCustomData();
			expect(allData).toEqual({ key1: 'value1', key2: 'value2' });
		});

		it('应该处理空的自定义数据', () => {
			const allData = context.getAllCustomData();
			expect(allData).toEqual({});
		});
	});

	describe('标识符管理', () => {
		it('应该正确获取租户标识符', () => {
			expect(context.getTenantId()).toBe('tenant-123');
		});

		it('应该正确设置租户标识符', () => {
			context.setTenantId('new-tenant');
			expect(context.getTenantId()).toBe('new-tenant');
		});

		it('应该正确获取用户标识符', () => {
			expect(context.getUserId()).toBe('user-456');
		});

		it('应该正确设置用户标识符', () => {
			context.setUserId('new-user');
			expect(context.getUserId()).toBe('new-user');
		});

		it('应该正确获取组织标识符', () => {
			expect(context.getOrganizationId()).toBe('org-789');
		});

		it('应该正确设置组织标识符', () => {
			context.setOrganizationId('new-org');
			expect(context.getOrganizationId()).toBe('new-org');
		});

		it('应该正确获取部门标识符', () => {
			expect(context.getDepartmentId()).toBe('dept-101');
		});

		it('应该正确设置部门标识符', () => {
			context.setDepartmentId('new-dept');
			expect(context.getDepartmentId()).toBe('new-dept');
		});

		it('应该正确获取请求标识符', () => {
			expect(context.getRequestId()).toBe('req-202');
		});

		it('应该正确设置请求标识符', () => {
			context.setRequestId('new-req');
			expect(context.getRequestId()).toBe('new-req');
		});

		it('应该正确获取关联标识符', () => {
			expect(context.getCorrelationId()).toBe('corr-303');
		});

		it('应该正确设置关联标识符', () => {
			context.setCorrelationId('new-corr');
			expect(context.getCorrelationId()).toBe('new-corr');
		});

		it('应该正确获取原因标识符', () => {
			expect(context.getCausationId()).toBe('cause-404');
		});

		it('应该正确设置原因标识符', () => {
			context.setCausationId('new-cause');
			expect(context.getCausationId()).toBe('new-cause');
		});
	});

	describe('请求信息管理', () => {
		it('应该正确获取用户代理', () => {
			expect(context.getUserAgent()).toBe('Mozilla/5.0');
		});

		it('应该正确设置用户代理', () => {
			context.setUserAgent('NewAgent/1.0');
			expect(context.getUserAgent()).toBe('NewAgent/1.0');
		});

		it('应该正确获取IP地址', () => {
			expect(context.getIpAddress()).toBe('192.168.1.1');
		});

		it('应该正确设置IP地址', () => {
			context.setIpAddress('10.0.0.1');
			expect(context.getIpAddress()).toBe('10.0.0.1');
		});

		it('应该正确获取请求来源', () => {
			expect(context.getSource()).toBe('WEB');
		});

		it('应该正确设置请求来源', () => {
			context.setSource('API');
			expect(context.getSource()).toBe('API');
		});

		it('应该正确获取语言设置', () => {
			expect(context.getLocale()).toBe('zh-CN');
		});

		it('应该正确设置语言设置', () => {
			context.setLocale('en-US');
			expect(context.getLocale()).toBe('en-US');
		});

		it('应该正确获取时区设置', () => {
			expect(context.getTimezone()).toBe('Asia/Shanghai');
		});

		it('应该正确设置时区设置', () => {
			context.setTimezone('UTC');
			expect(context.getTimezone()).toBe('UTC');
		});
	});

	describe('上下文级别检查', () => {
		it('应该正确检查多租户上下文', () => {
			expect(context.isMultiTenant()).toBe(true);

			const nonTenantContext = new CoreAsyncContext();
			expect(nonTenantContext.isMultiTenant()).toBe(false);
		});

		it('应该正确检查组织级别上下文', () => {
			expect(context.isOrganizationLevel()).toBe(true);

			const nonOrgContext = new CoreAsyncContext({ tenantId: 'tenant' });
			expect(nonOrgContext.isOrganizationLevel()).toBe(false);
		});

		it('应该正确检查部门级别上下文', () => {
			expect(context.isDepartmentLevel()).toBe(true);

			const nonDeptContext = new CoreAsyncContext({
				tenantId: 'tenant',
				organizationId: 'org'
			});
			expect(nonDeptContext.isDepartmentLevel()).toBe(false);
		});

		it('应该正确检查用户级别上下文', () => {
			expect(context.isUserLevel()).toBe(true);

			const nonUserContext = new CoreAsyncContext({ tenantId: 'tenant' });
			expect(nonUserContext.isUserLevel()).toBe(false);
		});

		it('应该正确获取上下文级别', () => {
			expect(context.getContextLevel()).toBe('DEPARTMENT');

			const orgContext = new CoreAsyncContext({
				tenantId: 'tenant',
				organizationId: 'org',
				userId: 'user'
			});
			expect(orgContext.getContextLevel()).toBe('ORGANIZATION');

			const userContext = new CoreAsyncContext({
				tenantId: 'tenant',
				userId: 'user'
			});
			expect(userContext.getContextLevel()).toBe('USER');

			const tenantContext = new CoreAsyncContext({
				tenantId: 'tenant'
			});
			expect(tenantContext.getContextLevel()).toBe('TENANT');

			const publicContext = new CoreAsyncContext();
			expect(publicContext.getContextLevel()).toBe('PUBLIC');
		});
	});

	describe('上下文摘要', () => {
		it('应该正确获取上下文摘要', () => {
			const summary = context.getSummary();

			expect(summary.id).toBe(context.getId());
			expect(summary.level).toBe('DEPARTMENT');
			expect(summary.tenantId).toBe('tenant-123');
			expect(summary.userId).toBe('user-456');
			expect(summary.organizationId).toBe('org-789');
			expect(summary.departmentId).toBe('dept-101');
			expect(summary.requestId).toBe('req-202');
			expect(summary.source).toBe('WEB');
			expect(summary.createdAt).toBe(context.getCreatedAt().toISOString());
			expect(summary.isValid).toBe(true);
		});

		it('应该处理过期上下文的摘要', () => {
			const pastTime = new Date(Date.now() - 60000);
			context.setExpiresAt(pastTime);

			const summary = context.getSummary();
			expect(summary.isValid).toBe(false);
			expect(summary.expiresAt).toBe(pastTime.toISOString());
		});
	});

	describe('JSON和字符串转换', () => {
		it('应该正确转换为JSON', () => {
			const json = context.toJSON();

			expect(json.id).toBe(context.getId());
			expect(json.createdAt).toBe(context.getCreatedAt().toISOString());
			expect(json.data).toEqual(context.getData());
			expect(json.expiresAt).toBeUndefined();
		});

		it('应该包含过期时间的JSON', () => {
			const expiresAt = new Date(Date.now() + 60000);
			context.setExpiresAt(expiresAt);

			const json = context.toJSON();
			expect(json.expiresAt).toBe(expiresAt.toISOString());
		});

		it('应该正确转换为字符串', () => {
			const str = context.toString();
			const parsed = JSON.parse(str);

			expect(parsed.id).toBe(context.getId());
			// 注意：JSON 序列化会将 Date 对象转换为字符串
			expect(parsed.data).toEqual({
				...context.getData(),
				createdAt: context.getData().createdAt?.toISOString()
			});
		});
	});

	describe('边界情况', () => {
		it('应该处理特殊字符', () => {
			context.setCustomData('special', 'test@#$%^&*()');
			expect(context.getCustomData('special')).toBe('test@#$%^&*()');
		});

		it('应该处理长字符串', () => {
			const longString = 'a'.repeat(1000);
			context.setCustomData('long', longString);
			expect(context.getCustomData('long')).toBe(longString);
		});

		it('应该处理复杂对象', () => {
			const complexObject = {
				nested: {
					array: [1, 2, 3],
					object: { key: 'value' }
				}
			};
			context.setCustomData('complex', complexObject);
			expect(context.getCustomData('complex')).toEqual(complexObject);
		});

		it('应该处理null和undefined值', () => {
			context.setCustomData('nullValue', null);
			context.setCustomData('undefinedValue', undefined);

			expect(context.getCustomData('nullValue')).toBeNull();
			expect(context.getCustomData('undefinedValue')).toBeUndefined();
		});
	});
});
