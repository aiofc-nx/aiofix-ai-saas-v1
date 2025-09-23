/**
 * 装饰器元数据接口测试
 *
 * @description 测试装饰器元数据接口定义
 * @since 1.0.0
 */
import {
  IBaseMetadata,
  IMetadata,
  ICommandHandlerMetadata,
  IQueryHandlerMetadata,
  IEventHandlerMetadata,
  ISagaMetadata,
  IRetryConfig,
  ICacheConfig,
  IValidationConfig,
  IAuthorizationConfig,
  ITransactionConfig,
  IMultiTenantConfig,
  IDataIsolationConfig,
  IPerformanceMonitoringConfig,
  ICustomConfig,
} from './metadata.interfaces';
import { DecoratorType, HandlerType } from './metadata.constants';

describe('装饰器元数据接口', () => {
  describe('IBaseMetadata 接口', () => {
    it('应该定义基础元数据结构', () => {
      const baseMetadata: IBaseMetadata = {
        decoratorType: DecoratorType.COMMAND_HANDLER,
        version: '1.0.0',
        createdAt: new Date(),
        enabled: true,
        tags: ['test'],
        customConfig: {},
      };

      expect(baseMetadata.decoratorType).toBe(DecoratorType.COMMAND_HANDLER);
      expect(baseMetadata.version).toBe('1.0.0');
      expect(baseMetadata.createdAt).toBeInstanceOf(Date);
      expect(baseMetadata.enabled).toBe(true);
      expect(baseMetadata.tags).toEqual(['test']);
      expect(baseMetadata.customConfig).toEqual({});
    });

    it('应该支持可选属性', () => {
      const minimalMetadata: IBaseMetadata = {
        decoratorType: DecoratorType.QUERY_HANDLER,
        version: '1.0.0',
        createdAt: new Date(),
      };

      expect(minimalMetadata.decoratorType).toBe(DecoratorType.QUERY_HANDLER);
      expect(minimalMetadata.enabled).toBeUndefined();
      expect(minimalMetadata.tags).toBeUndefined();
    });
  });

  describe('ICommandHandlerMetadata 接口', () => {
    it('应该定义命令处理器元数据结构', () => {
      const metadata: ICommandHandlerMetadata = {
        decoratorType: DecoratorType.COMMAND_HANDLER,
        version: '1.0.0',
        createdAt: new Date(),
        commandType: 'TestCommand',
        handlerType: HandlerType.COMMAND,
        priority: 100,
        retry: {
          maxRetries: 3,
          retryDelay: 1000,
          backoffMultiplier: 2,
          maxRetryDelay: 5000,
        },
        validation: {
          enabled: true,
          schema: {},
          validateInput: true,
          validateOutput: false,
        },
        authorization: {
          enabled: true,
          roles: ['admin'],
          permissions: ['write'],
          requiresAuthentication: true,
        },
        transaction: {
          enabled: true,
          isolationLevel: 'READ_COMMITTED',
          timeout: 30000,
          rollbackOn: ['Error'],
        },
      };

      expect(metadata.commandType).toBe('TestCommand');
      expect(metadata.handlerType).toBe(HandlerType.COMMAND);
      expect(metadata.priority).toBe(100);
      expect(metadata.retry?.maxRetries).toBe(3);
      expect(metadata.validation?.enabled).toBe(true);
      expect(metadata.authorization?.enabled).toBe(true);
      expect(metadata.transaction?.enabled).toBe(true);
    });
  });

  describe('IQueryHandlerMetadata 接口', () => {
    it('应该定义查询处理器元数据结构', () => {
      const metadata: IQueryHandlerMetadata = {
        decoratorType: DecoratorType.QUERY_HANDLER,
        version: '1.0.0',
        createdAt: new Date(),
        queryType: 'TestQuery',
        handlerType: HandlerType.QUERY,
        priority: 100,
        cache: {
          enabled: true,
          ttl: 300,
          key: 'test-key',
          tags: ['query'],
        },
        validation: {
          enabled: true,
          schema: {},
          validateInput: true,
          validateOutput: true,
        },
      };

      expect(metadata.queryType).toBe('TestQuery');
      expect(metadata.handlerType).toBe(HandlerType.QUERY);
      expect(metadata.cache?.enabled).toBe(true);
      expect(metadata.cache?.ttl).toBe(300);
    });
  });

  describe('IEventHandlerMetadata 接口', () => {
    it('应该定义事件处理器元数据结构', () => {
      const metadata: IEventHandlerMetadata = {
        decoratorType: DecoratorType.EVENT_HANDLER,
        version: '1.0.0',
        createdAt: new Date(),
        eventType: 'TestEvent',
        handlerType: HandlerType.EVENT,
        priority: 100,
        retry: {
          maxRetries: 5,
          retryDelay: 2000,
          backoffMultiplier: 1.5,
          maxRetryDelay: 10000,
        },
        multiTenant: {
          enabled: true,
          isolationLevel: 'TENANT',
          sharedResources: false,
        },
      };

      expect(metadata.eventType).toBe('TestEvent');
      expect(metadata.handlerType).toBe(HandlerType.EVENT);
      expect(metadata.retry?.maxRetries).toBe(5);
      expect(metadata.multiTenant?.enabled).toBe(true);
    });
  });

  describe('ISagaMetadata 接口', () => {
    it('应该定义Saga元数据结构', () => {
      const metadata: ISagaMetadata = {
        decoratorType: DecoratorType.SAGA,
        version: '1.0.0',
        createdAt: new Date(),
        sagaType: 'TestSaga',
        handlerType: HandlerType.SAGA,
        priority: 100,
        timeout: 60000,
        compensation: true,
        steps: ['step1', 'step2'],
      };

      expect(metadata.sagaType).toBe('TestSaga');
      expect(metadata.handlerType).toBe(HandlerType.SAGA);
      expect(metadata.timeout).toBe(60000);
      expect(metadata.compensation).toBe(true);
      expect(metadata.steps).toEqual(['step1', 'step2']);
    });
  });

  describe('配置接口', () => {
    it('应该定义重试配置接口', () => {
      const retryConfig: IRetryConfig = {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
        maxRetryDelay: 5000,
        retryOn: ['Error'],
      };

      expect(retryConfig.maxRetries).toBe(3);
      expect(retryConfig.retryDelay).toBe(1000);
      expect(retryConfig.backoffMultiplier).toBe(2);
      expect(retryConfig.maxRetryDelay).toBe(5000);
      expect(retryConfig.retryOn).toEqual(['Error']);
    });

    it('应该定义缓存配置接口', () => {
      const cacheConfig: ICacheConfig = {
        enabled: true,
        ttl: 300,
        key: 'cache-key',
        tags: ['query', 'user'],
        condition: 'always',
        keyGenerator: 'default',
      };

      expect(cacheConfig.enabled).toBe(true);
      expect(cacheConfig.ttl).toBe(300);
      expect(cacheConfig.key).toBe('cache-key');
      expect(cacheConfig.tags).toEqual(['query', 'user']);
    });

    it('应该定义验证配置接口', () => {
      const validationConfig: IValidationConfig = {
        enabled: true,
        schema: { type: 'object' },
        validateInput: true,
        validateOutput: false,
        strict: true,
      };

      expect(validationConfig.enabled).toBe(true);
      expect(validationConfig.schema).toEqual({ type: 'object' });
      expect(validationConfig.validateInput).toBe(true);
      expect(validationConfig.validateOutput).toBe(false);
      expect(validationConfig.strict).toBe(true);
    });

    it('应该定义授权配置接口', () => {
      const authConfig: IAuthorizationConfig = {
        enabled: true,
        roles: ['admin', 'user'],
        permissions: ['read', 'write'],
        requiresAuthentication: true,
        allowAnonymous: false,
      };

      expect(authConfig.enabled).toBe(true);
      expect(authConfig.roles).toEqual(['admin', 'user']);
      expect(authConfig.permissions).toEqual(['read', 'write']);
      expect(authConfig.requiresAuthentication).toBe(true);
      expect(authConfig.allowAnonymous).toBe(false);
    });

    it('应该定义事务配置接口', () => {
      const transactionConfig: ITransactionConfig = {
        enabled: true,
        isolationLevel: 'READ_COMMITTED',
        timeout: 30000,
        rollbackOn: ['Error', 'BusinessError'],
        propagation: 'REQUIRED',
      };

      expect(transactionConfig.enabled).toBe(true);
      expect(transactionConfig.isolationLevel).toBe('READ_COMMITTED');
      expect(transactionConfig.timeout).toBe(30000);
      expect(transactionConfig.rollbackOn).toEqual(['Error', 'BusinessError']);
      expect(transactionConfig.propagation).toBe('REQUIRED');
    });

    it('应该定义多租户配置接口', () => {
      const multiTenantConfig: IMultiTenantConfig = {
        enabled: true,
        isolationLevel: 'TENANT',
        sharedResources: false,
        tenantResolver: 'header',
      };

      expect(multiTenantConfig.enabled).toBe(true);
      expect(multiTenantConfig.isolationLevel).toBe('TENANT');
      expect(multiTenantConfig.sharedResources).toBe(false);
      expect(multiTenantConfig.tenantResolver).toBe('header');
    });

    it('应该定义数据隔离配置接口', () => {
      const dataIsolationConfig: IDataIsolationConfig = {
        enabled: true,
        level: 'TENANT',
        strategy: 'DATABASE',
        encryptionEnabled: true,
      };

      expect(dataIsolationConfig.enabled).toBe(true);
      expect(dataIsolationConfig.level).toBe('TENANT');
      expect(dataIsolationConfig.strategy).toBe('DATABASE');
      expect(dataIsolationConfig.encryptionEnabled).toBe(true);
    });

    it('应该定义性能监控配置接口', () => {
      const perfConfig: IPerformanceMonitoringConfig = {
        enabled: true,
        metrics: ['execution_time', 'memory_usage'],
        threshold: 1000,
        alertLevel: 'WARNING',
        sampling: 1.0,
      };

      expect(perfConfig.enabled).toBe(true);
      expect(perfConfig.metrics).toEqual(['execution_time', 'memory_usage']);
      expect(perfConfig.threshold).toBe(1000);
      expect(perfConfig.alertLevel).toBe('WARNING');
      expect(perfConfig.sampling).toBe(1.0);
    });

    it('应该定义自定义配置接口', () => {
      const customConfig: ICustomConfig = {
        feature1: { enabled: true, value: 'test' },
        feature2: { enabled: false },
        nested: {
          deep: {
            value: 42,
            array: [1, 2, 3],
          },
        },
      };

      expect(customConfig.feature1?.enabled).toBe(true);
      expect(customConfig.feature1?.value).toBe('test');
      expect(customConfig.feature2?.enabled).toBe(false);
      expect((customConfig.nested as any)?.deep?.value).toBe(42);
    });
  });

  describe('IMetadata 接口', () => {
    it('应该定义通用元数据结构', () => {
      const metadata: IMetadata = {
        decoratorType: DecoratorType.COMMAND_HANDLER,
        version: '1.0.0',
        createdAt: new Date(),
        enabled: true,
        priority: 100,
        tags: ['command', 'handler'],
        customConfig: {
          feature: { enabled: true },
        },
      };

      expect(metadata.decoratorType).toBe(DecoratorType.COMMAND_HANDLER);
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.createdAt).toBeInstanceOf(Date);
      expect(metadata.enabled).toBe(true);
      expect(metadata.priority).toBe(100);
      expect(metadata.tags).toEqual(['command', 'handler']);
      expect(metadata.customConfig?.feature?.enabled).toBe(true);
    });

    it('应该支持可选属性', () => {
      const minimalMetadata: IMetadata = {
        decoratorType: DecoratorType.EVENT_HANDLER,
        version: '1.0.0',
        createdAt: new Date(),
      };

      expect(minimalMetadata.decoratorType).toBe(DecoratorType.EVENT_HANDLER);
      expect(minimalMetadata.enabled).toBeUndefined();
      expect(minimalMetadata.priority).toBeUndefined();
    });
  });

  describe('边界情况', () => {
    it('应该处理空配置对象', () => {
      const emptyConfig: ICustomConfig = {};
      expect(emptyConfig).toBeDefined();
      expect(Object.keys(emptyConfig)).toHaveLength(0);
    });

    it('应该处理复杂的嵌套配置', () => {
      const complexConfig: ICustomConfig = {
        level1: {
          level2: {
            level3: {
              value: 'deep nested',
              array: [1, 'two', { three: 3 }],
              boolean: true,
              null_value: null,
              undefined_value: undefined,
            },
          },
        },
        unicode: {
          chinese: '测试',
          emoji: '🚀',
          special: 'José',
        },
      };

      expect((complexConfig.level1 as any)?.level2?.level3?.value).toBe(
        'deep nested',
      );
      expect((complexConfig.unicode as any)?.chinese).toBe('测试');
      expect((complexConfig.unicode as any)?.emoji).toBe('🚀');
    });

    it('应该处理特殊字符的标签', () => {
      const metadata: IMetadata = {
        decoratorType: DecoratorType.SAGA,
        version: '1.0.0',
        createdAt: new Date(),
        tags: ['测试', 'José', '🚀', 'special-chars!@#'],
      };

      expect(metadata.tags).toContain('测试');
      expect(metadata.tags).toContain('José');
      expect(metadata.tags).toContain('🚀');
      expect(metadata.tags).toContain('special-chars!@#');
    });

    it('应该处理大数值配置', () => {
      const metadata: ICommandHandlerMetadata = {
        decoratorType: DecoratorType.COMMAND_HANDLER,
        version: '1.0.0',
        createdAt: new Date(),
        commandType: 'LargeCommand',
        handlerType: HandlerType.COMMAND,
        priority: Number.MAX_SAFE_INTEGER,
        retry: {
          maxRetries: 1000,
          retryDelay: 60000,
          maxRetryDelay: 3600000,
        },
        transaction: {
          timeout: 86400000, // 24小时
        },
      };

      expect(metadata.priority).toBe(Number.MAX_SAFE_INTEGER);
      expect(metadata.retry?.maxRetries).toBe(1000);
      expect(metadata.transaction?.timeout).toBe(86400000);
    });

    it('应该处理零值和负值配置', () => {
      const metadata: IQueryHandlerMetadata = {
        decoratorType: DecoratorType.QUERY_HANDLER,
        version: '1.0.0',
        createdAt: new Date(),
        queryType: 'ZeroValueQuery',
        handlerType: HandlerType.QUERY,
        priority: 0,
        cache: {
          enabled: false,
          ttl: 0,
        },
        performanceMonitoring: {
          enabled: false,
          threshold: 0,
          sampling: 0,
        },
      };

      expect(metadata.priority).toBe(0);
      expect(metadata.cache?.ttl).toBe(0);
      expect(metadata.performanceMonitoring?.threshold).toBe(0);
      expect(metadata.performanceMonitoring?.sampling).toBe(0);
    });
  });

  describe('接口兼容性', () => {
    it('应该支持接口继承', () => {
      const commandMetadata: ICommandHandlerMetadata = {
        decoratorType: DecoratorType.COMMAND_HANDLER,
        version: '1.0.0',
        createdAt: new Date(),
        commandType: 'TestCommand',
        handlerType: HandlerType.COMMAND,
        // 继承自 IBaseMetadata 的属性
        enabled: true,
        tags: ['command'],
        customConfig: {},
      };

      // 验证它也符合基础接口
      const baseMetadata: IBaseMetadata = commandMetadata;
      expect(baseMetadata.decoratorType).toBe(DecoratorType.COMMAND_HANDLER);
      expect(baseMetadata.enabled).toBe(true);
    });

    it('应该支持泛型元数据', () => {
      const genericMetadata: IMetadata = {
        decoratorType: DecoratorType.EVENT_HANDLER,
        version: '1.0.0',
        createdAt: new Date(),
        // 可以添加任何配置
        retry: { maxRetries: 3 },
        cache: { enabled: true },
        validation: { enabled: true },
      };

      expect(genericMetadata.retry?.maxRetries).toBe(3);
      expect(genericMetadata.cache?.enabled).toBe(true);
      expect(genericMetadata.validation?.enabled).toBe(true);
    });
  });
});
