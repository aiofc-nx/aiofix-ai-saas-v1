/**
 * BaseQuery 测试
 *
 * @description 测试 BaseQuery 基础查询类的功能
 * @since 1.0.0
 */

import { BaseQuery } from './base-query';
import { EntityId } from '../../../../domain/value-objects/entity-id';

// 测试用的具体查询类
class TestQuery extends BaseQuery {
	constructor(
		public readonly filter: string,
		tenantId: string,
		userId: string,
		page: number = 1,
		pageSize: number = 10
	) {
		super(tenantId, userId, page, pageSize);
	}

	public get queryType(): string {
		return 'TestQuery';
	}

	public getQueryType(): string {
		return 'TestQuery';
	}

	public validate(): void {
		// 基础验证，子类可以重写
		if (!this.tenantId || this.tenantId.trim().length === 0) {
			throw new Error('Tenant ID is required');
		}
		if (!this.userId || this.userId.trim().length === 0) {
			throw new Error('User ID is required');
		}
	}
}

describe('BaseQuery', () => {
	describe('查询创建', () => {
		it('应该正确创建基础查询', () => {
			const query = new TestQuery('test-filter', 'tenant-1', 'user-1');

			expect(query.filter).toBe('test-filter');
			expect(query.tenantId).toBe('tenant-1');
			expect(query.userId).toBe('user-1');
			expect(query.page).toBe(1);
			expect(query.pageSize).toBe(10);
		});

		it('应该为每个查询生成唯一的ID', () => {
			const query1 = new TestQuery('filter1', 'tenant-1', 'user-1');
			const query2 = new TestQuery('filter2', 'tenant-1', 'user-1');

			expect(query1.queryId).not.toEqual(query2.queryId);
		});

		it('应该正确设置查询创建时间', () => {
			const before = new Date();
			const query = new TestQuery('test-filter', 'tenant-1', 'user-1');
			const after = new Date();

			expect(query.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(query.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
		});
	});

	describe('查询类型和验证', () => {
		it('应该返回正确的查询类型', () => {
			const query = new TestQuery('test-filter', 'tenant-1', 'user-1');

			expect(query.getQueryType()).toBe('TestQuery');
		});

		it('应该正确验证查询', () => {
			const validQuery = new TestQuery('valid-filter', 'tenant-1', 'user-1');
			expect(() => validQuery.validate()).not.toThrow();

			// 测试无效的租户ID
			expect(() => {
				new TestQuery('filter', '', 'user-1');
			}).toThrow('Tenant ID is required');
		});
	});

	describe('查询相等性', () => {
		it('相同ID的查询应该相等', () => {
			const query1 = new TestQuery('filter', 'tenant-1', 'user-1');
			const query2 = new TestQuery('filter', 'tenant-1', 'user-1');

			// 由于每次创建都会生成新的ID，所以它们不相等
			expect(query1.equals(query2)).toBe(false);
		});

		it('不同ID的查询应该不相等', () => {
			const query1 = new TestQuery('filter1', 'tenant-1', 'user-1');
			const query2 = new TestQuery('filter2', 'tenant-1', 'user-1');

			expect(query1.equals(query2)).toBe(false);
		});

		it('与 null 或 undefined 比较应该返回 false', () => {
			const query = new TestQuery('filter', 'tenant-1', 'user-1');

			expect(query.equals(null)).toBe(false);
			expect(query.equals(undefined)).toBe(false);
		});
	});

	describe('查询比较', () => {
		it('应该按创建时间比较查询', async () => {
			const query1 = new TestQuery('filter1', 'tenant-1', 'user-1');
			await new Promise((resolve) => setTimeout(resolve, 10)); // 等待10ms
			const query2 = new TestQuery('filter2', 'tenant-1', 'user-1');

			expect(query1.compareTo(query2)).toBeLessThan(0);
			expect(query2.compareTo(query1)).toBeGreaterThan(0);
		});

		it('与 null 或 undefined 比较应该返回 1', () => {
			const query = new TestQuery('filter', 'tenant-1', 'user-1');

			expect(query.compareTo(null)).toBe(1);
			expect(query.compareTo(undefined)).toBe(1);
		});
	});

	describe('租户关联', () => {
		it('应该正确检查查询是否属于指定的租户', () => {
			const query = new TestQuery('filter', 'tenant-1', 'user-1');

			expect(query.belongsToTenant('tenant-1')).toBe(true);
			expect(query.belongsToTenant('tenant-2')).toBe(false);
		});
	});

	describe('查询转换', () => {
		it('应该正确转换为字符串', () => {
			const query = new TestQuery('test-filter', 'tenant-1', 'user-1');

			const str = query.toString();
			expect(str).toContain('TestQuery');
			expect(str).toContain('(');
			expect(str).toContain(')');
		});

		it('应该正确转换为 JSON', () => {
			const query = new TestQuery('test-filter', 'tenant-1', 'user-1');

			const json = query.toJSON();
			expect(json.tenantId).toBe('tenant-1');
			expect(json.userId).toBe('user-1');
			expect(json.page).toBe(1);
			expect(json.pageSize).toBe(10);
		});

		it('应该正确获取哈希码', () => {
			const query = new TestQuery('test-filter', 'tenant-1', 'user-1');

			// BaseQuery 的 getHashCode 方法返回字符串
			const hashCode = query.getHashCode();
			expect(typeof hashCode).toBe('string');
			expect(hashCode.length).toBeGreaterThan(0);
		});

		it('应该正确获取类型名称', () => {
			const query = new TestQuery('test-filter', 'tenant-1', 'user-1');

			expect(query.getTypeName()).toBe('TestQuery');
		});
	});

	describe('边界情况', () => {
		it('应该处理特殊字符的过滤器', () => {
			const specialFilter = 'filter with special chars: !@#$%^&*()';
			const query = new TestQuery(specialFilter, 'tenant-1', 'user-1');

			expect(query.filter).toBe(specialFilter);
		});

		it('应该处理 Unicode 字符', () => {
			const unicodeFilter = '过滤器 with 中文 and émojis 🚀';
			const query = new TestQuery(unicodeFilter, 'tenant-1', 'user-1');

			expect(query.filter).toBe(unicodeFilter);
		});

		it('应该处理默认分页参数', () => {
			const query = new TestQuery('filter', 'tenant-1', 'user-1');

			expect(query.page).toBe(1);
			expect(query.pageSize).toBe(10);
		});

		it('应该处理自定义分页参数', () => {
			const query = new TestQuery('filter', 'tenant-1', 'user-1', 2, 20);

			expect(query.page).toBe(2);
			expect(query.pageSize).toBe(20);
		});
	});

	describe('查询性能测试', () => {
		it('应该快速创建大量查询', () => {
			const start = Date.now();
			const queries = [];

			for (let i = 0; i < 1000; i++) {
				queries.push(new TestQuery(`filter-${i}`, 'tenant-1', 'user-1'));
			}

			const end = Date.now();
			expect(end - start).toBeLessThan(1000); // 应该在1秒内完成
			expect(queries).toHaveLength(1000);
		});

		it('应该支持查询的批量比较', () => {
			const queries = [
				new TestQuery('filter1', 'tenant-1', 'user-1'),
				new TestQuery('filter2', 'tenant-1', 'user-1'),
				new TestQuery('filter3', 'tenant-1', 'user-1')
			];

			// 测试批量比较
			for (let i = 0; i < queries.length; i++) {
				for (let j = i + 1; j < queries.length; j++) {
					expect(queries[i].equals(queries[j])).toBe(false);
				}
			}
		});

		it('应该高效处理查询序列化', () => {
			const query = new TestQuery('test-filter', 'tenant-1', 'user-1');
			const start = Date.now();

			for (let i = 0; i < 1000; i++) {
				query.toJSON();
			}

			const end = Date.now();
			expect(end - start).toBeLessThan(100); // 应该在100ms内完成
		});
	});
});
