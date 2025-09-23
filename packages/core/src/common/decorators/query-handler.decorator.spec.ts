/**
 * QueryHandler 装饰器测试
 *
 * @description 测试 QueryHandler 装饰器的功能
 * @since 1.0.0
 */
import 'reflect-metadata';
import {
  QueryHandler,
  isQueryHandler,
  getQueryType,
  getQueryHandlerPriority,
  supportsQueryType,
  getQueryHandlerMetadata,
  QueryHandlerClass,
} from './query-handler.decorator';
import { BaseQuery } from '../../application/cqrs/queries/base/base-query';
import { IQueryHandler } from '../../application/cqrs/queries/base/query-handler.interface';
import { BaseQueryResult } from '../../application/cqrs/queries/base/base-query-result';

// 测试用的查询结果类
class TestQueryResult extends BaseQueryResult<{ id: number; name: string }> {
  constructor(
    data: Array<{ id: number; name: string }>,
    page: number = 1,
    pageSize: number = 10,
    totalCount: number = data.length,
    metadata?: Record<string, unknown>,
  ) {
    super(data, page, pageSize, totalCount, metadata);
  }

  get resultType(): string {
    return 'TestQueryResult';
  }
}

// 测试用的查询类
class TestQuery extends BaseQuery {
  constructor(
    public readonly filter: string,
    tenantId: string = 'test-tenant',
    userId: string = 'test-user',
    page: number = 1,
    pageSize: number = 10,
  ) {
    super(tenantId, userId, page, pageSize);
  }

  get queryType(): string {
    return 'TestQuery';
  }

  validate(): void {
    if (!this.filter) {
      throw new Error('Filter is required');
    }
  }

  protected createCopyWithSortRules(
    sortRules: Array<import('../cqrs/queries/base/base-query').ISortRule>,
  ): this {
    const copy = new TestQuery(
      this.filter,
      this.tenantId,
      this.userId,
      this.page,
      this.pageSize,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (copy as any)._sortRules = [...sortRules];
    return copy as this;
  }
}

// 测试用的查询处理器类（不使用装饰器）
class TestQueryHandlerWithoutDecorator
  implements IQueryHandler<TestQuery, TestQueryResult>
{
  async execute(_query: TestQuery): Promise<TestQueryResult> {
    return new TestQueryResult([
      { id: 1, name: `Result for ${_query.filter}` },
    ]);
  }

  getSupportedQueryType(): string {
    return 'TestQuery';
  }

  getPriority(): number {
    return 0;
  }

  validateQuery(_query: TestQuery): void {
    _query.validate();
  }

  async canHandle(_query: TestQuery): Promise<boolean> {
    return true;
  }

  generateCacheKey(_query: TestQuery): string {
    return `test-${_query.filter}`;
  }

  getCacheExpiration(): number {
    return 300;
  }

  supports(_queryType: string): boolean {
    return _queryType === this.getSupportedQueryType();
  }
}

// 测试用的查询处理器类（使用基础装饰器）
// @ts-expect-error - TypeScript 装饰器签名误报
@QueryHandler('TestQuery')
class BasicTestQueryHandler
  implements IQueryHandler<TestQuery, TestQueryResult>
{
  async execute(_query: TestQuery): Promise<TestQueryResult> {
    return new TestQueryResult([
      { id: 1, name: `Result for ${_query.filter}` },
    ]);
  }

  getSupportedQueryType(): string {
    return 'TestQuery';
  }

  getPriority(): number {
    return 0;
  }

  validateQuery(_query: TestQuery): void {
    _query.validate();
  }

  async canHandle(_query: TestQuery): Promise<boolean> {
    return true;
  }

  generateCacheKey(_query: TestQuery): string {
    return `test-${_query.filter}`;
  }

  getCacheExpiration(): number {
    return 300;
  }

  supports(_queryType: string): boolean {
    return _queryType === this.getSupportedQueryType();
  }
}

// 测试用的查询处理器类（使用高级装饰器）
// @ts-expect-error - TypeScript 装饰器签名误报
@QueryHandler('AdvancedTestQuery', {
  priority: 10,
  timeout: 5000,
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
  },
  cache: {
    keyGenerator: (args) => `advanced-${JSON.stringify(args)}`,
    expiration: 600,
    cacheCondition: () => true,
    invalidateCondition: () => false,
  },
  validation: {
    rules: { filter: 'required|string' },
    skipValidation: false,
  },
  authorization: {
    permissions: ['test.read'],
    skipAuthorization: false,
  },
  multiTenant: {
    tenantResolver: async (_context: unknown): Promise<string> => 'test-tenant',
  },
  dataIsolation: {
    strategy: 'AUTO',
  },
  performanceMonitor: {
    thresholds: {
      warning: 500,
      error: 2000,
    },
    metrics: ['query_time', 'result_count'],
  },
  enableLogging: true,
  enableAudit: false,
  enablePerformanceMonitor: true,
  customConfig: {
    maxResultSize: 1000,
    enablePagination: true,
  },
})
class AdvancedTestQueryHandler
  implements IQueryHandler<TestQuery, TestQueryResult>
{
  async execute(query: TestQuery): Promise<TestQueryResult> {
    return new TestQueryResult([
      { id: 1, name: `Advanced result for ${query.filter}` },
    ]);
  }

  getSupportedQueryType(): string {
    return 'AdvancedTestQuery';
  }

  getPriority(): number {
    return 10;
  }

  validateQuery(_query: TestQuery): void {
    _query.validate();
  }

  async canHandle(_query: TestQuery): Promise<boolean> {
    return true;
  }

  generateCacheKey(query: TestQuery): string {
    return `advanced-${query.filter}`;
  }

  getCacheExpiration(): number {
    return 600;
  }

  supports(_queryType: string): boolean {
    return _queryType === this.getSupportedQueryType();
  }
}

// 无效的查询处理器类（缺少 execute 方法）
class InvalidQueryHandler {
  // 缺少 execute 方法
}

describe('QueryHandler装饰器', () => {
  describe('基础装饰器功能', () => {
    it('应该正确标记查询处理器类', () => {
      expect(isQueryHandler(BasicTestQueryHandler)).toBe(true);
      expect(isQueryHandler(TestQueryHandlerWithoutDecorator)).toBe(false);
    });

    it('应该正确设置查询类型', () => {
      expect(getQueryType(BasicTestQueryHandler)).toBe('TestQuery');
      expect(getQueryType(TestQueryHandlerWithoutDecorator)).toBeUndefined();
    });

    it('应该正确设置静态属性', () => {
      expect(
        (BasicTestQueryHandler as unknown as { queryType: string }).queryType,
      ).toBe('TestQuery');
      expect(
        (BasicTestQueryHandler as unknown as { priority: number }).priority,
      ).toBe(0);
      expect(
        typeof (BasicTestQueryHandler as unknown as { supports: unknown })
          .supports,
      ).toBe('function');
      expect(
        typeof (BasicTestQueryHandler as unknown as { getMetadata: unknown })
          .getMetadata,
      ).toBe('function');
    });

    it('应该正确检查查询类型支持', () => {
      expect(
        (
          BasicTestQueryHandler as unknown as {
            supports: (type: string) => boolean;
          }
        ).supports('TestQuery'),
      ).toBe(true);
      expect(
        (
          BasicTestQueryHandler as unknown as {
            supports: (type: string) => boolean;
          }
        ).supports('OtherQuery'),
      ).toBe(false);
    });

    it('应该正确获取元数据', () => {
      const metadata = (
        BasicTestQueryHandler as unknown as {
          getMetadata: () => { queryType: string; priority: number };
        }
      ).getMetadata();
      expect(metadata).toBeDefined();
      expect(metadata.queryType).toBe('TestQuery');
      expect(metadata.priority).toBe(0);
    });
  });

  describe('高级装饰器功能', () => {
    it('应该正确设置优先级', () => {
      expect(getQueryHandlerPriority(AdvancedTestQueryHandler)).toBe(10);
      expect(
        (AdvancedTestQueryHandler as unknown as { priority: number }).priority,
      ).toBe(10);
    });

    it('应该正确设置完整配置', () => {
      const metadata = getQueryHandlerMetadata(AdvancedTestQueryHandler);
      expect(metadata).toBeDefined();
      expect(metadata!.queryType).toBe('AdvancedTestQuery');
      expect(metadata!.priority).toBe(10);
      expect(metadata!.timeout).toBe(5000);
      expect(metadata!.retry).toBeDefined();
      expect(metadata!.cache).toBeDefined();
      expect(metadata!.validation).toBeDefined();
      expect(metadata!.authorization).toBeDefined();
      expect(metadata!.multiTenant).toBeDefined();
      expect(metadata!.dataIsolation).toBeDefined();
      expect(metadata!.performanceMonitor).toBeDefined();
      expect(metadata!.enableLogging).toBe(true);
      expect(metadata!.enableAudit).toBe(false);
      expect(metadata!.enablePerformanceMonitor).toBe(true);
      expect(metadata!.customConfig).toBeDefined();
    });

    it('应该正确设置重试配置', () => {
      const metadata = getQueryHandlerMetadata(AdvancedTestQueryHandler);
      const retry = metadata!.retry;
      expect(retry!.maxRetries).toBe(3);
      expect(retry!.retryDelay).toBe(1000);
      expect(retry!.backoffMultiplier).toBe(2);
    });

    it('应该正确设置缓存配置', () => {
      const metadata = getQueryHandlerMetadata(AdvancedTestQueryHandler);
      const cache = metadata!.cache;
      expect(typeof cache!.keyGenerator).toBe('function');
      expect(cache!.expiration).toBe(600);
      expect(typeof cache!.cacheCondition).toBe('function');
      expect(typeof cache!.invalidateCondition).toBe('function');
    });

    it('应该正确设置验证配置', () => {
      const metadata = getQueryHandlerMetadata(AdvancedTestQueryHandler);
      const validation = metadata!.validation;
      expect(validation!.skipValidation).toBe(false);
      expect(validation!.rules).toEqual({ filter: 'required|string' });
    });

    it('应该正确设置授权配置', () => {
      const metadata = getQueryHandlerMetadata(AdvancedTestQueryHandler);
      const authorization = metadata!.authorization;
      expect(authorization!.skipAuthorization).toBe(false);
      expect(authorization!.permissions).toEqual(['test.read']);
    });

    it('应该正确设置多租户配置', () => {
      const metadata = getQueryHandlerMetadata(AdvancedTestQueryHandler);
      const multiTenant = metadata!.multiTenant;
      expect(typeof multiTenant!.tenantResolver).toBe('function');
    });

    it('应该正确设置数据隔离配置', () => {
      const metadata = getQueryHandlerMetadata(AdvancedTestQueryHandler);
      const dataIsolation = metadata!.dataIsolation;
      expect(dataIsolation!.strategy).toBe('AUTO');
    });

    it('应该正确设置性能监控配置', () => {
      const metadata = getQueryHandlerMetadata(AdvancedTestQueryHandler);
      const performanceMonitor = metadata!.performanceMonitor;
      expect(performanceMonitor!.thresholds).toEqual({
        warning: 500,
        error: 2000,
      });
      expect(performanceMonitor!.metrics).toEqual([
        'query_time',
        'result_count',
      ]);
    });

    it('应该正确设置自定义配置', () => {
      const metadata = getQueryHandlerMetadata(AdvancedTestQueryHandler);
      const customConfig = metadata!.customConfig;
      expect(customConfig!.maxResultSize).toBe(1000);
      expect(customConfig!.enablePagination).toBe(true);
    });
  });

  describe('工具函数', () => {
    it('supportsQueryType 应该正确检查查询类型支持', () => {
      expect(supportsQueryType(BasicTestQueryHandler, 'TestQuery')).toBe(true);
      expect(supportsQueryType(BasicTestQueryHandler, 'OtherQuery')).toBe(
        false,
      );
      expect(
        supportsQueryType(AdvancedTestQueryHandler, 'AdvancedTestQuery'),
      ).toBe(true);
      expect(supportsQueryType(AdvancedTestQueryHandler, 'TestQuery')).toBe(
        false,
      );
    });

    it('应该正确处理未标记的类', () => {
      expect(isQueryHandler(TestQueryHandlerWithoutDecorator)).toBe(false);
      expect(getQueryType(TestQueryHandlerWithoutDecorator)).toBeUndefined();
      expect(
        getQueryHandlerPriority(TestQueryHandlerWithoutDecorator),
      ).toBeUndefined();
      expect(
        supportsQueryType(TestQueryHandlerWithoutDecorator, 'TestQuery'),
      ).toBe(false);
      expect(
        getQueryHandlerMetadata(TestQueryHandlerWithoutDecorator),
      ).toBeUndefined();
    });
  });

  describe('错误处理', () => {
    it('应该拒绝没有 execute 方法的类', () => {
      expect(() => {
        // @ts-expect-error - TypeScript 装饰器签名误报
        @QueryHandler('InvalidQuery')
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        class TestInvalidHandlerClass extends InvalidQueryHandler {}
      }).toThrow(
        'Query handler TestInvalidHandlerClass must implement execute method',
      );
    });

    it('应该处理空的选项对象', () => {
      // @ts-expect-error - TypeScript 装饰器签名误报
      @QueryHandler('EmptyOptionsQuery', {})
      class EmptyOptionsHandler
        implements IQueryHandler<TestQuery, TestQueryResult>
      {
        async execute(query: TestQuery): Promise<TestQueryResult> {
          return new TestQueryResult([
            { id: 1, name: `Result for ${query.filter}` },
          ]);
        }

        getSupportedQueryType(): string {
          return 'EmptyOptionsQuery';
        }

        getPriority(): number {
          return 0;
        }

        validateQuery(query: TestQuery): void {
          query.validate();
        }

        async canHandle(_query: TestQuery): Promise<boolean> {
          return true;
        }

        generateCacheKey(query: TestQuery): string {
          return `empty-${query.filter}`;
        }

        getCacheExpiration(): number {
          return 300;
        }

        supports(_queryType: string): boolean {
          return _queryType === this.getSupportedQueryType();
        }
      }

      expect(isQueryHandler(EmptyOptionsHandler)).toBe(true);
      expect(getQueryType(EmptyOptionsHandler)).toBe('EmptyOptionsQuery');
      expect(getQueryHandlerPriority(EmptyOptionsHandler)).toBe(0);
    });
  });

  describe('边界情况', () => {
    it('应该处理特殊字符的查询类型', () => {
      // @ts-expect-error - TypeScript 装饰器签名误报
      @QueryHandler('Special-Query_Type.123')
      class SpecialQueryHandler
        implements IQueryHandler<TestQuery, TestQueryResult>
      {
        async execute(query: TestQuery): Promise<TestQueryResult> {
          return new TestQueryResult([
            { id: 1, name: `Result for ${query.filter}` },
          ]);
        }

        getSupportedQueryType(): string {
          return 'Special-Query_Type.123';
        }

        getPriority(): number {
          return 0;
        }

        validateQuery(query: TestQuery): void {
          query.validate();
        }

        async canHandle(_query: TestQuery): Promise<boolean> {
          return true;
        }

        generateCacheKey(query: TestQuery): string {
          return `special-${query.filter}`;
        }

        getCacheExpiration(): number {
          return 300;
        }

        supports(_queryType: string): boolean {
          return _queryType === this.getSupportedQueryType();
        }
      }

      expect(getQueryType(SpecialQueryHandler)).toBe('Special-Query_Type.123');
      expect(
        supportsQueryType(SpecialQueryHandler, 'Special-Query_Type.123'),
      ).toBe(true);
    });

    it('应该处理负数优先级', () => {
      // @ts-expect-error - TypeScript 装饰器签名误报
      @QueryHandler('NegativePriorityQuery', { priority: -5 })
      class NegativePriorityHandler
        implements IQueryHandler<TestQuery, TestQueryResult>
      {
        async execute(query: TestQuery): Promise<TestQueryResult> {
          return new TestQueryResult([
            { id: 1, name: `Result for ${query.filter}` },
          ]);
        }

        getSupportedQueryType(): string {
          return 'NegativePriorityQuery';
        }

        getPriority(): number {
          return -5;
        }

        validateQuery(query: TestQuery): void {
          query.validate();
        }

        async canHandle(_query: TestQuery): Promise<boolean> {
          return true;
        }

        generateCacheKey(query: TestQuery): string {
          return `negative-${query.filter}`;
        }

        getCacheExpiration(): number {
          return 300;
        }

        supports(_queryType: string): boolean {
          return _queryType === this.getSupportedQueryType();
        }
      }

      expect(getQueryHandlerPriority(NegativePriorityHandler)).toBe(-5);
      expect(
        (NegativePriorityHandler as unknown as { priority: number }).priority,
      ).toBe(-5);
    });

    it('应该处理大数值配置', () => {
      // @ts-expect-error - TypeScript 装饰器签名误报
      @QueryHandler('LargeNumbersQuery', {
        priority: Number.MAX_SAFE_INTEGER,
        timeout: Number.MAX_SAFE_INTEGER,
      })
      class LargeNumbersHandler
        implements IQueryHandler<TestQuery, TestQueryResult>
      {
        async execute(query: TestQuery): Promise<TestQueryResult> {
          return new TestQueryResult([
            { id: 1, name: `Result for ${query.filter}` },
          ]);
        }

        getSupportedQueryType(): string {
          return 'LargeNumbersQuery';
        }

        getPriority(): number {
          return Number.MAX_SAFE_INTEGER;
        }

        validateQuery(query: TestQuery): void {
          query.validate();
        }

        async canHandle(_query: TestQuery): Promise<boolean> {
          return true;
        }

        generateCacheKey(query: TestQuery): string {
          return `large-${query.filter}`;
        }

        getCacheExpiration(): number {
          return 300;
        }

        supports(_queryType: string): boolean {
          return _queryType === this.getSupportedQueryType();
        }
      }

      const metadata = getQueryHandlerMetadata(LargeNumbersHandler);
      expect(metadata!.priority).toBe(Number.MAX_SAFE_INTEGER);
      expect(metadata!.timeout).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('应该处理复杂的缓存配置', () => {
      // @ts-expect-error - TypeScript 装饰器签名误报
      @QueryHandler('ComplexCacheQuery', {
        cache: {
          keyGenerator: (args) =>
            `complex-${JSON.stringify(args)}-${Date.now()}`,
          expiration: 0, // 永不过期
          cacheCondition: (args) => Array.isArray(args) && args.length > 0,
          invalidateCondition: (args) =>
            Array.isArray(args) && args.length === 0,
        },
      })
      class ComplexCacheHandler
        implements IQueryHandler<TestQuery, TestQueryResult>
      {
        async execute(query: TestQuery): Promise<TestQueryResult> {
          return new TestQueryResult([
            { id: 1, name: `Result for ${query.filter}` },
          ]);
        }

        getSupportedQueryType(): string {
          return 'ComplexCacheQuery';
        }

        getPriority(): number {
          return 0;
        }

        validateQuery(query: TestQuery): void {
          query.validate();
        }

        async canHandle(_query: TestQuery): Promise<boolean> {
          return true;
        }

        generateCacheKey(query: TestQuery): string {
          return `complex-${query.filter}`;
        }

        getCacheExpiration(): number {
          return 0;
        }

        supports(_queryType: string): boolean {
          return _queryType === this.getSupportedQueryType();
        }
      }

      const metadata = getQueryHandlerMetadata(ComplexCacheHandler);
      const cache = metadata!.cache;
      expect(typeof cache!.keyGenerator).toBe('function');
      expect(cache!.expiration).toBe(0);
      expect(typeof cache!.cacheCondition).toBe('function');
      expect(typeof cache!.invalidateCondition).toBe('function');

      // 测试缓存条件函数
      expect(cache!.cacheCondition!(['test'])).toBe(true);
      expect(cache!.cacheCondition!([])).toBe(false);
      expect(cache!.invalidateCondition!(['test'])).toBe(false);
      expect(cache!.invalidateCondition!([])).toBe(true);
    });
  });

  describe('类型检查', () => {
    it('应该正确定义 QueryHandlerClass 类型', () => {
      const handlerClass =
        BasicTestQueryHandler as unknown as QueryHandlerClass<
          TestQuery,
          TestQueryResult
        >;

      expect((handlerClass as unknown as { queryType: string }).queryType).toBe(
        'TestQuery',
      );
      expect((handlerClass as unknown as { priority: number }).priority).toBe(
        0,
      );
      expect(
        typeof (handlerClass as unknown as { supports: unknown }).supports,
      ).toBe('function');
      expect(
        typeof (handlerClass as unknown as { getMetadata: unknown })
          .getMetadata,
      ).toBe('function');
    });

    it('应该支持泛型查询类型', () => {
      // @ts-expect-error - TypeScript 装饰器签名误报
      @QueryHandler('GenericQuery')
      class GenericQueryHandler<
        TQuery extends BaseQuery,
        TResult extends BaseQueryResult<unknown>,
      > implements IQueryHandler<TQuery, TResult>
      {
        async execute(_query: TQuery): Promise<TResult> {
          // 泛型实现
          return {} as TResult;
        }

        getSupportedQueryType(): string {
          return 'GenericQuery';
        }

        getPriority(): number {
          return 0;
        }

        validateQuery(_query: TQuery): void {
          // 泛型验证
        }

        async canHandle(_query: TQuery): Promise<boolean> {
          return true;
        }

        generateCacheKey(_query: TQuery): string {
          return `generic-${_query.queryType}`;
        }

        getCacheExpiration(): number {
          return 300;
        }

        supports(_queryType: string): boolean {
          return _queryType === this.getSupportedQueryType();
        }
      }

      expect(isQueryHandler(GenericQueryHandler)).toBe(true);
      expect(getQueryType(GenericQueryHandler)).toBe('GenericQuery');
    });
  });

  describe('缓存功能测试', () => {
    it('应该正确处理缓存键生成器', () => {
      const metadata = getQueryHandlerMetadata(AdvancedTestQueryHandler);
      const keyGenerator = metadata!.cache!.keyGenerator;

      if (keyGenerator) {
        const key = keyGenerator(['test', 'args']);
        expect(typeof key).toBe('string');
        expect(key).toContain('test');
        expect(key).toContain('args');
      }
    });

    it('应该正确处理缓存条件', () => {
      const metadata = getQueryHandlerMetadata(AdvancedTestQueryHandler);
      const cacheCondition = metadata!.cache!.cacheCondition;
      const invalidateCondition = metadata!.cache!.invalidateCondition;

      if (cacheCondition) {
        expect(cacheCondition(['test'])).toBe(true);
      }

      if (invalidateCondition) {
        expect(invalidateCondition(['test'])).toBe(false);
      }
    });
  });
});
