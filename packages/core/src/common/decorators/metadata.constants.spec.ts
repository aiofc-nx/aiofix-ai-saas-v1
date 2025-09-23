/**
 * 元数据常量测试
 *
 * @description 测试装饰器元数据常量的定义和工具函数
 * @since 1.0.0
 */
import {
  COMMAND_HANDLER_METADATA,
  QUERY_HANDLER_METADATA,
  EVENT_HANDLER_METADATA,
  SAGA_METADATA,
  PERFORMANCE_MONITOR_METADATA,
  DATA_ISOLATION_METADATA,
  CACHE_METADATA,
  VALIDATION_METADATA,
  AUTHORIZATION_METADATA,
  TRANSACTION_METADATA,
  RETRY_METADATA,
  TIMEOUT_METADATA,
  LOGGING_METADATA,
  AUDIT_METADATA,
  MULTI_TENANT_METADATA,
  ASYNC_CONTEXT_METADATA,
  MIDDLEWARE_METADATA,
  INTERCEPTOR_METADATA,
  DecoratorType,
  HandlerType,
  METADATA_KEYS,
  DEFAULT_METADATA_VALUES,
  METADATA_VERSION,
  METADATA_NAMESPACE,
  getMetadataKey,
  getDefaultMetadata,
  isValidDecoratorType,
  isValidHandlerType,
  getHandlerType,
  getAllDecoratorTypes,
  getAllHandlerTypes,
} from './metadata.constants';

describe('元数据常量', () => {
  describe('元数据键名常量', () => {
    it('应该定义所有元数据键名', () => {
      expect(COMMAND_HANDLER_METADATA).toBe('CommandHandlerMetadata');
      expect(QUERY_HANDLER_METADATA).toBe('QueryHandlerMetadata');
      expect(EVENT_HANDLER_METADATA).toBe('EventHandlerMetadata');
      expect(SAGA_METADATA).toBe('SagaMetadata');
      expect(PERFORMANCE_MONITOR_METADATA).toBe('PerformanceMonitorMetadata');
      expect(DATA_ISOLATION_METADATA).toBe('DataIsolationMetadata');
      expect(CACHE_METADATA).toBe('CacheMetadata');
      expect(VALIDATION_METADATA).toBe('ValidationMetadata');
      expect(AUTHORIZATION_METADATA).toBe('AuthorizationMetadata');
      expect(TRANSACTION_METADATA).toBe('TransactionMetadata');
      expect(RETRY_METADATA).toBe('RetryMetadata');
      expect(TIMEOUT_METADATA).toBe('TimeoutMetadata');
      expect(LOGGING_METADATA).toBe('LoggingMetadata');
      expect(AUDIT_METADATA).toBe('AuditMetadata');
      expect(MULTI_TENANT_METADATA).toBe('MultiTenantMetadata');
      expect(ASYNC_CONTEXT_METADATA).toBe('AsyncContextMetadata');
      expect(MIDDLEWARE_METADATA).toBe('MiddlewareMetadata');
      expect(INTERCEPTOR_METADATA).toBe('InterceptorMetadata');
    });

    it('所有键名应该是只读的', () => {
      expect(typeof COMMAND_HANDLER_METADATA).toBe('string');
      expect(typeof QUERY_HANDLER_METADATA).toBe('string');
      expect(typeof EVENT_HANDLER_METADATA).toBe('string');
      expect(typeof SAGA_METADATA).toBe('string');
    });
  });

  describe('装饰器类型枚举', () => {
    it('应该定义所有装饰器类型', () => {
      expect(DecoratorType.COMMAND_HANDLER).toBe('CommandHandler');
      expect(DecoratorType.QUERY_HANDLER).toBe('QueryHandler');
      expect(DecoratorType.EVENT_HANDLER).toBe('EventHandler');
      expect(DecoratorType.SAGA).toBe('Saga');
      expect(DecoratorType.PERFORMANCE_MONITOR).toBe('PerformanceMonitor');
      expect(DecoratorType.DATA_ISOLATION).toBe('DataIsolation');
      expect(DecoratorType.CACHE).toBe('Cache');
      expect(DecoratorType.VALIDATION).toBe('Validation');
      expect(DecoratorType.AUTHORIZATION).toBe('Authorization');
      expect(DecoratorType.TRANSACTION).toBe('Transaction');
      expect(DecoratorType.RETRY).toBe('Retry');
      expect(DecoratorType.TIMEOUT).toBe('Timeout');
      expect(DecoratorType.LOGGING).toBe('Logging');
      expect(DecoratorType.AUDIT).toBe('Audit');
      expect(DecoratorType.MULTI_TENANT).toBe('MultiTenant');
      expect(DecoratorType.ASYNC_CONTEXT).toBe('AsyncContext');
      expect(DecoratorType.MIDDLEWARE).toBe('Middleware');
      expect(DecoratorType.INTERCEPTOR).toBe('Interceptor');
    });

    it('应该包含所有期望的装饰器类型', () => {
      const decoratorTypes = Object.values(DecoratorType);
      expect(decoratorTypes).toContain('CommandHandler');
      expect(decoratorTypes).toContain('QueryHandler');
      expect(decoratorTypes).toContain('EventHandler');
      expect(decoratorTypes).toContain('Saga');
      expect(decoratorTypes.length).toBe(18);
    });
  });

  describe('处理器类型枚举', () => {
    it('应该定义所有处理器类型', () => {
      expect(HandlerType.COMMAND).toBe('Command');
      expect(HandlerType.QUERY).toBe('Query');
      expect(HandlerType.EVENT).toBe('Event');
      expect(HandlerType.SAGA).toBe('Saga');
    });

    it('应该包含所有期望的处理器类型', () => {
      const handlerTypes = Object.values(HandlerType);
      expect(handlerTypes).toContain('Command');
      expect(handlerTypes).toContain('Query');
      expect(handlerTypes).toContain('Event');
      expect(handlerTypes).toContain('Saga');
      expect(handlerTypes.length).toBe(4);
    });
  });

  describe('元数据键名映射', () => {
    it('应该正确映射装饰器类型到元数据键名', () => {
      expect(METADATA_KEYS[DecoratorType.COMMAND_HANDLER]).toBe(
        COMMAND_HANDLER_METADATA,
      );
      expect(METADATA_KEYS[DecoratorType.QUERY_HANDLER]).toBe(
        QUERY_HANDLER_METADATA,
      );
      expect(METADATA_KEYS[DecoratorType.EVENT_HANDLER]).toBe(
        EVENT_HANDLER_METADATA,
      );
      expect(METADATA_KEYS[DecoratorType.SAGA]).toBe(SAGA_METADATA);
    });

    it('应该包含所有装饰器类型的映射', () => {
      const mappedTypes = Object.keys(METADATA_KEYS);
      const decoratorTypes = Object.values(DecoratorType);

      decoratorTypes.forEach((type) => {
        expect(mappedTypes).toContain(type);
      });
    });
  });

  describe('默认元数据值', () => {
    it('应该定义命令处理器的默认值', () => {
      const defaults = DEFAULT_METADATA_VALUES[DecoratorType.COMMAND_HANDLER];
      expect(defaults.priority).toBe(0);
      expect(defaults.timeout).toBe(30000);
      expect(defaults.retryCount).toBe(3);
      expect(defaults.retryDelay).toBe(1000);
      expect(defaults.enableLogging).toBe(true);
      expect(defaults.enableAudit).toBe(true);
      expect(defaults.enablePerformanceMonitor).toBe(true);
    });

    it('应该定义查询处理器的默认值', () => {
      const defaults = DEFAULT_METADATA_VALUES[DecoratorType.QUERY_HANDLER];
      expect(defaults.priority).toBe(0);
      expect(defaults.timeout).toBe(15000);
      expect(defaults.retryCount).toBe(2);
      expect(defaults.retryDelay).toBe(500);
      expect(defaults.enableCache).toBe(true);
      expect(defaults.cacheExpiration).toBe(300);
    });

    it('应该定义事件处理器的默认值', () => {
      const defaults = DEFAULT_METADATA_VALUES[DecoratorType.EVENT_HANDLER];
      expect(defaults.priority).toBe(0);
      expect(defaults.timeout).toBe(10000);
      expect(defaults.retryCount).toBe(5);
      expect(defaults.retryDelay).toBe(2000);
      expect(defaults.enableIdempotency).toBe(true);
      expect(defaults.enableDeadLetterQueue).toBe(true);
    });

    it('应该定义 Saga 的默认值', () => {
      const defaults = DEFAULT_METADATA_VALUES[DecoratorType.SAGA];
      expect(defaults.priority).toBe(0);
      expect(defaults.timeout).toBe(60000);
      expect(defaults.retryCount).toBe(3);
      expect(defaults.retryDelay).toBe(5000);
      expect(defaults.enableCompensation).toBe(true);
      expect(defaults.enableTimeout).toBe(true);
    });
  });

  describe('工具函数', () => {
    it('getMetadataKey 应该返回完整的元数据键名', () => {
      const key = getMetadataKey(DecoratorType.COMMAND_HANDLER);
      expect(key).toBe('aiofix:core:CommandHandlerMetadata');

      const queryKey = getMetadataKey(DecoratorType.QUERY_HANDLER);
      expect(queryKey).toBe('aiofix:core:QueryHandlerMetadata');
    });

    it('getDefaultMetadata 应该返回默认元数据值', () => {
      const defaults = getDefaultMetadata(DecoratorType.COMMAND_HANDLER);
      expect(defaults).toBeDefined();
      expect(defaults.priority).toBe(0);
      expect(defaults.timeout).toBe(30000);
    });

    it('isValidDecoratorType 应该验证装饰器类型', () => {
      expect(isValidDecoratorType('CommandHandler')).toBe(true);
      expect(isValidDecoratorType('QueryHandler')).toBe(true);
      expect(isValidDecoratorType('InvalidType')).toBe(false);
      expect(isValidDecoratorType('')).toBe(false);
    });

    it('isValidHandlerType 应该验证处理器类型', () => {
      expect(isValidHandlerType('Command')).toBe(true);
      expect(isValidHandlerType('Query')).toBe(true);
      expect(isValidHandlerType('Event')).toBe(true);
      expect(isValidHandlerType('Saga')).toBe(true);
      expect(isValidHandlerType('InvalidHandler')).toBe(false);
    });

    it('getHandlerType 应该返回对应的处理器类型', () => {
      expect(getHandlerType(DecoratorType.COMMAND_HANDLER)).toBe(
        HandlerType.COMMAND,
      );
      expect(getHandlerType(DecoratorType.QUERY_HANDLER)).toBe(
        HandlerType.QUERY,
      );
      expect(getHandlerType(DecoratorType.EVENT_HANDLER)).toBe(
        HandlerType.EVENT,
      );
      expect(getHandlerType(DecoratorType.SAGA)).toBe(HandlerType.SAGA);
      expect(getHandlerType(DecoratorType.CACHE)).toBeNull();
    });

    it('getAllDecoratorTypes 应该返回所有装饰器类型', () => {
      const types = getAllDecoratorTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBe(18);
      expect(types).toContain(DecoratorType.COMMAND_HANDLER);
      expect(types).toContain(DecoratorType.QUERY_HANDLER);
      expect(types).toContain(DecoratorType.EVENT_HANDLER);
      expect(types).toContain(DecoratorType.SAGA);
    });

    it('getAllHandlerTypes 应该返回所有处理器类型', () => {
      const types = getAllHandlerTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBe(4);
      expect(types).toContain(HandlerType.COMMAND);
      expect(types).toContain(HandlerType.QUERY);
      expect(types).toContain(HandlerType.EVENT);
      expect(types).toContain(HandlerType.SAGA);
    });
  });

  describe('常量值验证', () => {
    it('METADATA_VERSION 应该是有效的版本号', () => {
      expect(METADATA_VERSION).toBe('1.0.0');
      expect(typeof METADATA_VERSION).toBe('string');
      expect(METADATA_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('METADATA_NAMESPACE 应该是有效的命名空间', () => {
      expect(METADATA_NAMESPACE).toBe('aiofix:core');
      expect(typeof METADATA_NAMESPACE).toBe('string');
      expect(METADATA_NAMESPACE).toContain(':');
    });
  });
});
