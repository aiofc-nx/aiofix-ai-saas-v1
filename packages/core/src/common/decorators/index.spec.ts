/**
 * 装饰器模块导出测试
 *
 * @description 测试装饰器模块的导出功能
 * @since 1.0.0
 */
import * as DecoratorsModule from './index';

describe('装饰器模块导出', () => {
  describe('元数据系统导出', () => {
    it('应该导出元数据常量', () => {
      expect(DecoratorsModule.DecoratorType).toBeDefined();
      expect(DecoratorsModule.HandlerType).toBeDefined();
      expect(DecoratorsModule.METADATA_KEYS).toBeDefined();
      expect(typeof DecoratorsModule.DecoratorType).toBe('object');
      expect(typeof DecoratorsModule.HandlerType).toBe('object');
      expect(typeof DecoratorsModule.METADATA_KEYS).toBe('object');
    });

    it('应该导出元数据工具函数', () => {
      expect(DecoratorsModule.setMetadata).toBeDefined();
      expect(DecoratorsModule.getMetadata).toBeDefined();
      expect(DecoratorsModule.hasMetadata).toBeDefined();
      expect(DecoratorsModule.deleteMetadata).toBeDefined();
      expect(typeof DecoratorsModule.setMetadata).toBe('function');
      expect(typeof DecoratorsModule.getMetadata).toBe('function');
      expect(typeof DecoratorsModule.hasMetadata).toBe('function');
      expect(typeof DecoratorsModule.deleteMetadata).toBe('function');
    });
  });

  describe('命令处理器装饰器导出', () => {
    it('应该导出命令处理器装饰器', () => {
      expect(DecoratorsModule.CommandHandler).toBeDefined();
      expect(typeof DecoratorsModule.CommandHandler).toBe('function');
    });

    it('应该导出命令处理器工具函数', () => {
      expect(DecoratorsModule.isCommandHandler).toBeDefined();
      expect(DecoratorsModule.getCommandType).toBeDefined();
      expect(DecoratorsModule.getCommandHandlerPriority).toBeDefined();
      expect(DecoratorsModule.supportsCommandType).toBeDefined();
      expect(DecoratorsModule.getCommandHandlerMetadata).toBeDefined();

      expect(typeof DecoratorsModule.isCommandHandler).toBe('function');
      expect(typeof DecoratorsModule.getCommandType).toBe('function');
      expect(typeof DecoratorsModule.getCommandHandlerPriority).toBe(
        'function',
      );
      expect(typeof DecoratorsModule.supportsCommandType).toBe('function');
      expect(typeof DecoratorsModule.getCommandHandlerMetadata).toBe(
        'function',
      );
    });
  });

  describe('查询处理器装饰器导出', () => {
    it('应该导出查询处理器装饰器', () => {
      expect(DecoratorsModule.QueryHandler).toBeDefined();
      expect(typeof DecoratorsModule.QueryHandler).toBe('function');
    });

    it('应该导出查询处理器工具函数', () => {
      expect(DecoratorsModule.isQueryHandler).toBeDefined();
      expect(DecoratorsModule.getQueryType).toBeDefined();
      expect(DecoratorsModule.getQueryHandlerPriority).toBeDefined();
      expect(DecoratorsModule.supportsQueryType).toBeDefined();
      expect(DecoratorsModule.getQueryHandlerMetadata).toBeDefined();

      expect(typeof DecoratorsModule.isQueryHandler).toBe('function');
      expect(typeof DecoratorsModule.getQueryType).toBe('function');
      expect(typeof DecoratorsModule.getQueryHandlerPriority).toBe('function');
      expect(typeof DecoratorsModule.supportsQueryType).toBe('function');
      expect(typeof DecoratorsModule.getQueryHandlerMetadata).toBe('function');
    });
  });

  describe('事件处理器装饰器导出', () => {
    it('应该导出事件处理器装饰器', () => {
      expect(DecoratorsModule.EventHandler).toBeDefined();
      expect(typeof DecoratorsModule.EventHandler).toBe('function');
    });

    it('应该导出事件处理器工具函数', () => {
      expect(DecoratorsModule.isEventHandler).toBeDefined();
      expect(DecoratorsModule.getEventType).toBeDefined();
      expect(DecoratorsModule.getEventHandlerPriority).toBeDefined();
      expect(DecoratorsModule.supportsEventType).toBeDefined();
      expect(DecoratorsModule.getEventHandlerMetadata).toBeDefined();

      expect(typeof DecoratorsModule.isEventHandler).toBe('function');
      expect(typeof DecoratorsModule.getEventType).toBe('function');
      expect(typeof DecoratorsModule.getEventHandlerPriority).toBe('function');
      expect(typeof DecoratorsModule.supportsEventType).toBe('function');
      expect(typeof DecoratorsModule.getEventHandlerMetadata).toBe('function');
    });
  });

  describe('Saga装饰器导出', () => {
    it('应该导出Saga装饰器', () => {
      expect(DecoratorsModule.Saga).toBeDefined();
      expect(typeof DecoratorsModule.Saga).toBe('function');
    });

    it('应该导出Saga工具函数', () => {
      expect(DecoratorsModule.isSaga).toBeDefined();
      expect(DecoratorsModule.getSagaType).toBeDefined();
      expect(DecoratorsModule.getSagaPriority).toBeDefined();
      expect(DecoratorsModule.supportsSagaType).toBeDefined();
      expect(DecoratorsModule.getSagaMetadata).toBeDefined();

      expect(typeof DecoratorsModule.isSaga).toBe('function');
      expect(typeof DecoratorsModule.getSagaType).toBe('function');
      expect(typeof DecoratorsModule.getSagaPriority).toBe('function');
      expect(typeof DecoratorsModule.supportsSagaType).toBe('function');
      expect(typeof DecoratorsModule.getSagaMetadata).toBe('function');
    });
  });

  describe('模块完整性', () => {
    it('应该有完整的装饰器功能', () => {
      const exportedNames = Object.keys(DecoratorsModule);

      // 核心装饰器
      expect(exportedNames).toContain('CommandHandler');
      expect(exportedNames).toContain('QueryHandler');
      expect(exportedNames).toContain('EventHandler');
      expect(exportedNames).toContain('Saga');

      // 元数据系统
      expect(exportedNames).toContain('DecoratorType');
      expect(exportedNames).toContain('HandlerType');
      expect(exportedNames).toContain('setMetadata');
      expect(exportedNames).toContain('getMetadata');

      // 工具函数
      expect(exportedNames).toContain('isCommandHandler');
      expect(exportedNames).toContain('isQueryHandler');
      expect(exportedNames).toContain('isEventHandler');
      expect(exportedNames).toContain('isSaga');
    });

    it('应该导出足够数量的组件', () => {
      const exportedNames = Object.keys(DecoratorsModule);
      expect(exportedNames.length).toBeGreaterThan(20); // 至少有20个导出
    });

    it('应该导出的都是有效的函数或对象', () => {
      const exportedValues = Object.values(DecoratorsModule);

      exportedValues.forEach((exportedValue) => {
        expect(exportedValue).toBeDefined();
        expect(exportedValue).not.toBeNull();

        const type = typeof exportedValue;
        expect(['function', 'object', 'string']).toContain(type);
      });
    });
  });

  describe('装饰器功能验证', () => {
    it('CommandHandler 装饰器应该可以被调用', () => {
      expect(typeof DecoratorsModule.CommandHandler).toBe('function');

      // 验证装饰器可以被调用
      const decorator = DecoratorsModule.CommandHandler('TestCommand');
      expect(typeof decorator).toBe('function');
    });

    it('QueryHandler 装饰器应该可以被调用', () => {
      expect(typeof DecoratorsModule.QueryHandler).toBe('function');

      // 验证装饰器可以被调用
      const decorator = DecoratorsModule.QueryHandler('TestQuery');
      expect(typeof decorator).toBe('function');
    });

    it('EventHandler 装饰器应该可以被调用', () => {
      expect(typeof DecoratorsModule.EventHandler).toBe('function');

      // 验证装饰器可以被调用
      const decorator = DecoratorsModule.EventHandler('TestEvent');
      expect(typeof decorator).toBe('function');
    });

    it('Saga 装饰器应该可以被调用', () => {
      expect(typeof DecoratorsModule.Saga).toBe('function');

      // 验证装饰器可以被调用
      const decorator = DecoratorsModule.Saga('TestSaga');
      expect(typeof decorator).toBe('function');
    });
  });

  describe('工具函数验证', () => {
    it('元数据工具函数应该正常工作', () => {
      class TestClass {}

      // 测试设置和获取元数据
      DecoratorsModule.setMetadata(TestClass, 'test-key', 'test-value');
      const value = DecoratorsModule.getMetadata(TestClass, 'test-key');
      expect(value).toBe('test-value');

      // 测试检查元数据存在
      const exists = DecoratorsModule.hasMetadata(TestClass, 'test-key');
      expect(exists).toBe(true);

      // 测试删除元数据
      DecoratorsModule.deleteMetadata(TestClass, 'test-key');
      const deletedValue = DecoratorsModule.getMetadata(TestClass, 'test-key');
      expect(deletedValue).toBeUndefined();
    });

    it('处理器检查函数应该正常工作', () => {
      class TestHandler {}

      // 这些函数应该能够被调用而不抛出错误
      expect(() =>
        DecoratorsModule.isCommandHandler(TestHandler),
      ).not.toThrow();
      expect(() => DecoratorsModule.isQueryHandler(TestHandler)).not.toThrow();
      expect(() => DecoratorsModule.isEventHandler(TestHandler)).not.toThrow();
      expect(() => DecoratorsModule.isSaga(TestHandler)).not.toThrow();
    });
  });

  describe('边界情况', () => {
    it('应该处理空类的元数据操作', () => {
      class EmptyClass {}

      expect(
        DecoratorsModule.getMetadata(EmptyClass, 'non-existent'),
      ).toBeUndefined();
      expect(DecoratorsModule.hasMetadata(EmptyClass, 'non-existent')).toBe(
        false,
      );
      expect(() =>
        DecoratorsModule.deleteMetadata(EmptyClass, 'non-existent'),
      ).not.toThrow();
    });

    it('应该处理特殊字符的元数据键', () => {
      class TestClass {}
      const specialKey = 'test_José_🚀_key!@#';
      const value = { test: '测试' };

      DecoratorsModule.setMetadata(TestClass, specialKey, value);
      const retrievedValue = DecoratorsModule.getMetadata(
        TestClass,
        specialKey,
      );
      expect(retrievedValue).toEqual(value);
    });
  });
});
