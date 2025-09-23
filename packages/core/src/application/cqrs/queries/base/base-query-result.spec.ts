/**
 * BaseQueryResult 测试
 *
 * @description 测试 BaseQueryResult 基础查询结果类的功能
 * @since 1.0.0
 */
import { BaseQueryResult } from './base-query-result';

// 测试用的数据类型
interface ITestData {
	id: number;
	name: string;
	email?: string;
}

// 测试用的查询结果类
class TestQueryResult extends BaseQueryResult<ITestData> {
	constructor(
		data: ITestData[],
		page: number = 1,
		pageSize: number = 10,
		totalCount: number = data.length,
		metadata?: Record<string, unknown>
	) {
		super(data, page, pageSize, totalCount, metadata);
	}

	get resultType(): string {
		return 'TestQueryResult';
	}
}

describe('BaseQueryResult', () => {
	const testData: ITestData[] = [
		{ id: 1, name: 'Alice', email: 'alice@example.com' },
		{ id: 2, name: 'Bob', email: 'bob@example.com' },
		{ id: 3, name: 'Charlie' }
	];

	const testMetadata = {
		queryTime: 150,
		cacheHit: false,
		source: 'database'
	};

	describe('构造函数', () => {
		it('应该正确创建查询结果', () => {
			const result = new TestQueryResult(testData, 1, 10, 25, testMetadata);

			expect(result).toBeInstanceOf(BaseQueryResult);
			expect(result.getData()).toEqual(testData);
			expect(result.getTotalCount()).toBe(25);
		});

		it('应该正确创建只有数据的查询结果', () => {
			const result = new TestQueryResult(testData);

			expect(result.getData()).toEqual(testData);
			expect(result.getTotalCount()).toBe(3); // 默认为数据长度
		});

		it('应该正确创建空数据的查询结果', () => {
			const result = new TestQueryResult([]);

			expect(result.getData()).toEqual([]);
			expect(result.getTotalCount()).toBe(0);
		});
	});

	describe('数据访问', () => {
		let result: TestQueryResult;

		beforeEach(() => {
			result = new TestQueryResult(testData, 1, 10, 25, testMetadata);
		});

		it('应该正确返回数据', () => {
			expect(result.getData()).toEqual(testData);
		});

		it('应该正确返回数据数量', () => {
			expect(result.getData().length).toBe(3);
		});

		it('应该正确检查是否有数据', () => {
			expect(result.hasData()).toBe(true);

			const emptyResult = new TestQueryResult([]);
			expect(emptyResult.hasData()).toBe(false);
		});
	});

	describe('分页信息', () => {
		let result: TestQueryResult;

		beforeEach(() => {
			result = new TestQueryResult(testData, 1, 10, 25);
		});

		it('应该正确返回分页信息', () => {
			const pagination = result.getPaginationInfo();
			expect(pagination.page).toBe(1);
			expect(pagination.pageSize).toBe(10);
			expect(pagination.totalCount).toBe(25);
			expect(pagination.totalPages).toBe(3);
			expect(pagination.hasNextPage).toBe(true);
			expect(pagination.hasPreviousPage).toBe(false);
		});

		it('应该正确检查是否有下一页', () => {
			expect(result.hasNextPage()).toBe(true);

			const lastPageResult = new TestQueryResult(testData, 3, 10, 25);
			expect(lastPageResult.hasNextPage()).toBe(false);
		});

		it('应该正确检查是否有上一页', () => {
			expect(result.hasPreviousPage()).toBe(false);

			const middlePageResult = new TestQueryResult(testData, 2, 10, 25);
			expect(middlePageResult.hasPreviousPage()).toBe(true);
		});

		it('应该正确返回总页数', () => {
			expect(result.getTotalPages()).toBe(3);
		});

		it('应该正确返回总记录数', () => {
			expect(result.getTotalCount()).toBe(25);
		});

		it('应该正确返回当前页码', () => {
			expect(result.getPage()).toBe(1);
		});

		it('应该正确返回页面大小', () => {
			expect(result.getPageSize()).toBe(10);
		});
	});

	describe('元数据操作', () => {
		let result: TestQueryResult;

		beforeEach(() => {
			result = new TestQueryResult(testData, 1, 10, 25, testMetadata);
		});

		it('应该正确返回元数据', () => {
			expect(result.getMetadata()).toEqual(testMetadata);
		});

		it('应该正确检查是否有元数据', () => {
			const metadata = result.getMetadata();
			expect(Object.keys(metadata).length).toBeGreaterThan(0);

			const noMetadataResult = new TestQueryResult(testData);
			const emptyMetadata = noMetadataResult.getMetadata();
			expect(Object.keys(emptyMetadata).length).toBe(0);
		});

		it('应该正确获取指定的元数据值', () => {
			expect(result.getMetadataValue('queryTime')).toBe(150);
			expect(result.getMetadataValue('cacheHit')).toBe(false);
			expect(result.getMetadataValue('source')).toBe('database');
			expect(result.getMetadataValue('nonexistent')).toBeUndefined();
		});
	});

	describe('数据转换', () => {
		let result: TestQueryResult;

		beforeEach(() => {
			result = new TestQueryResult(testData, 1, 10, 25, testMetadata);
		});

		it('应该正确获取数据数组', () => {
			const array = result.getData();
			expect(Array.isArray(array)).toBe(true);
			expect(array).toEqual(testData);
		});

		it('应该正确转换为 JSON', () => {
			const json = result.toJSON();
			expect(json).toHaveProperty('data', testData);
			expect(json).toHaveProperty('pagination');
			expect(json).toHaveProperty('metadata', testMetadata);
			expect(json).toHaveProperty('hasData', true);
			expect(json).toHaveProperty('itemCount', 3);
		});

		it('应该正确转换为字符串', () => {
			const str = result.toString();
			expect(typeof str).toBe('string');
			expect(str).toContain('3'); // 数据数量
		});
	});

	describe('数据操作', () => {
		let result: TestQueryResult;

		beforeEach(() => {
			result = new TestQueryResult(testData);
		});

		it('应该正确映射数据', () => {
			const mapped = result.map((item) => ({ ...item, processed: true }));
			expect(mapped).toHaveLength(3);
			expect(mapped[0]).toHaveProperty('processed', true);
			expect(mapped[0]).toHaveProperty('id', 1);
			expect(mapped[0]).toHaveProperty('name', 'Alice');
		});

		it('应该正确过滤数据', () => {
			const filtered = result.filter((item) => item.email !== undefined);
			expect(filtered).toHaveLength(2);
			expect(filtered.every((item) => item.email !== undefined)).toBe(true);
		});

		it('应该正确查找数据', () => {
			const found = result.find((item) => item.name === 'Bob');
			expect(found).toBeDefined();
			expect(found?.id).toBe(2);
			expect(found?.name).toBe('Bob');

			const notFound = result.find((item) => item.name === 'David');
			expect(notFound).toBeUndefined();
		});

		it('应该正确检查数据是否存在', () => {
			expect(result.some((item) => item.name === 'Alice')).toBe(true);
			expect(result.some((item) => item.name === 'David')).toBe(false);
		});

		it('应该正确检查所有数据是否满足条件', () => {
			expect(result.every((item) => typeof item.id === 'number')).toBe(true);
			expect(result.every((item) => item.email !== undefined)).toBe(false);
		});

		it('应该正确通过数组方法获取第一个和最后一个元素', () => {
			const data = result.getData();
			expect(data[0]).toEqual(testData[0]);
			expect(data[data.length - 1]).toEqual(testData[2]);

			const emptyResult = new TestQueryResult([]);
			const emptyData = emptyResult.getData();
			expect(emptyData[0]).toBeUndefined();
		});
	});

	describe('边界情况', () => {
		it('应该处理无效的分页信息', () => {
			const result = new TestQueryResult(testData, -1, 0, -5);
			expect(result.getPage()).toBe(-1);
			expect(result.getPageSize()).toBe(0);
			expect(result.getTotalCount()).toBe(-5);
		});

		it('应该处理大量数据', () => {
			const largeData = Array.from({ length: 1000 }, (_, i) => ({
				id: i,
				name: `User${i}`
			}));

			const result = new TestQueryResult(largeData, 1, 100, 1000);
			expect(result.getData().length).toBe(1000);
			expect(result.hasData()).toBe(true);
			const data = result.getData();
			expect(data[0].id).toBe(0);
			expect(data[data.length - 1].id).toBe(999);
		});

		it('应该处理特殊字符和 Unicode', () => {
			const unicodeData = [
				{ id: 1, name: '张三', email: '张三@example.com' },
				{ id: 2, name: 'José', email: 'josé@example.com' },
				{ id: 3, name: '🚀 Rocket', email: 'rocket@example.com' }
			];

			const result = new TestQueryResult(unicodeData);
			expect(result.getData().length).toBe(3);
			expect(result.find((item) => item.name === '张三')).toBeDefined();
			expect(result.find((item) => item.name === 'José')).toBeDefined();
			expect(result.find((item) => item.name === '🚀 Rocket')).toBeDefined();
		});
	});
});
