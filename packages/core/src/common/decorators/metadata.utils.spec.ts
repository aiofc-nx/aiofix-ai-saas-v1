/**
 * 元数据工具函数测试
 *
 * @description 测试装饰器元数据工具函数的功能
 * @since 1.0.0
 */
import 'reflect-metadata';
import {
  setCommandHandlerMetadata,
  getCommandHandlerMetadata,
  setQueryHandlerMetadata,
  getQueryHandlerMetadata,
  setEventHandlerMetadata,
  getEventHandlerMetadata,
  setSagaMetadata,
  getSagaMetadata,
  setMetadata,
  getMetadata,
  hasMetadata,
  deleteMetadata,
  getMetadataKeys,
  getAllHandlerMetadata,
  isHandlerType,
  isCommandHandler,
  isQueryHandler,
  isEventHandler,
  isSaga,
  mergeMetadata,
  validateMetadata,
  cloneMetadata,
  getMetadataSummary,
} from './metadata.utils';
import { DecoratorType } from './metadata.constants';
import { IMetadata } from './metadata.interfaces';

// 测试用的类
class TestClass {}

describe('元数据工具函数', () => {
  describe('命令处理器元数据', () => {
    it('应该能够设置和获取命令处理器元数据', () => {
      setCommandHandlerMetadata(TestClass, 'TestCommand', {
        priority: 1,
        timeout: 5000,
      });

      const metadata = getCommandHandlerMetadata(TestClass);
      expect(metadata).toBeDefined();
      expect(metadata!.commandType).toBe('TestCommand');
      expect(metadata!.priority).toBe(1);
      expect(metadata!.timeout).toBe(5000);
    });

    it('应该正确处理空选项', () => {
      setCommandHandlerMetadata(TestClass, 'EmptyCommand', {});

      const metadata = getCommandHandlerMetadata(TestClass);
      expect(metadata).toBeDefined();
      expect(metadata!.commandType).toBe('EmptyCommand');
      expect(metadata!.priority).toBe(0);
    });
  });

  describe('查询处理器元数据', () => {
    it('应该能够设置和获取查询处理器元数据', () => {
      setQueryHandlerMetadata(TestClass, 'TestQuery', {
        priority: 2,
        timeout: 3000,
      });

      const metadata = getQueryHandlerMetadata(TestClass);
      expect(metadata).toBeDefined();
      expect(metadata!.queryType).toBe('TestQuery');
      expect(metadata!.priority).toBe(2);
      expect(metadata!.timeout).toBe(3000);
    });
  });

  describe('事件处理器元数据', () => {
    it('应该能够设置和获取事件处理器元数据', () => {
      setEventHandlerMetadata(TestClass, 'TestEvent', {
        priority: 3,
        enableIdempotency: true,
        enableDeadLetterQueue: true,
      });

      const metadata = getEventHandlerMetadata(TestClass);
      expect(metadata).toBeDefined();
      expect(metadata!.eventType).toBe('TestEvent');
      expect(metadata!.priority).toBe(3);
      expect(metadata!.enableIdempotency).toBe(true);
      expect(metadata!.enableDeadLetterQueue).toBe(true);
    });
  });

  describe('Saga 元数据', () => {
    it('应该能够设置和获取 Saga 元数据', () => {
      setSagaMetadata(TestClass, 'TestSaga', {
        priority: 4,
        enableCompensation: true,
        sagaTimeout: 60000,
      });

      const metadata = getSagaMetadata(TestClass);
      expect(metadata).toBeDefined();
      expect(metadata!.sagaType).toBe('TestSaga');
      expect(metadata!.priority).toBe(4);
      expect(metadata!.enableCompensation).toBe(true);
      expect(metadata!.sagaTimeout).toBe(60000);
    });
  });

  describe('通用元数据操作', () => {
    it('应该能够使用通用函数操作元数据', () => {
      const testKey = 'test-metadata-key';
      const testData = {
        test: 'value',
      } as unknown;

      // 设置元数据
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMetadata(TestClass, testKey, testData as any);

      // 检查元数据是否存在
      expect(hasMetadata(TestClass, testKey)).toBe(true);

      // 获取元数据
      const retrieved = getMetadata(TestClass, testKey);
      expect(retrieved).toEqual(testData);

      // 删除元数据
      const deleted = deleteMetadata(TestClass, testKey);
      expect(deleted).toBe(true);
      expect(hasMetadata(TestClass, testKey)).toBe(false);
    });

    it('应该能够获取所有元数据键', () => {
      setCommandHandlerMetadata(TestClass, 'TestCommand', {});

      const keys = getMetadataKeys(TestClass);
      expect(Array.isArray(keys)).toBe(true);
      expect(keys.length).toBeGreaterThan(0);
    });
  });

  describe('边界情况', () => {
    it('应该处理不存在的元数据', () => {
      const freshClass = class FreshTestClass {};

      expect(getCommandHandlerMetadata(freshClass)).toBeUndefined();
      expect(getQueryHandlerMetadata(freshClass)).toBeUndefined();
      expect(getEventHandlerMetadata(freshClass)).toBeUndefined();
      expect(getSagaMetadata(freshClass)).toBeUndefined();
    });

    it('应该处理复杂的自定义配置', () => {
      const complexConfig = {
        nested: {
          deep: {
            value: 'test',
            array: [1, 2, 3],
            object: { key: 'value' },
          },
        },
      };

      setCommandHandlerMetadata(TestClass, 'ComplexCommand', {
        customConfig: complexConfig,
      });

      const metadata = getCommandHandlerMetadata(TestClass);
      expect(metadata!.customConfig).toEqual(complexConfig);
    });
  });

  describe('高级元数据操作', () => {
    beforeEach(() => {
      // 为测试类设置各种类型的元数据
      setCommandHandlerMetadata(TestClass, 'TestCommand', { priority: 1 });
      setQueryHandlerMetadata(TestClass, 'TestQuery', { priority: 2 });
      setEventHandlerMetadata(TestClass, 'TestEvent', { priority: 3 });
      setSagaMetadata(TestClass, 'TestSaga', { priority: 4 });
    });

    it('应该能够获取所有处理器元数据', () => {
      const allMetadata = getAllHandlerMetadata(TestClass);
      expect(allMetadata).toHaveLength(4);
      expect(allMetadata.some((m) => m.priority === 1)).toBe(true);
      expect(allMetadata.some((m) => m.priority === 2)).toBe(true);
      expect(allMetadata.some((m) => m.priority === 3)).toBe(true);
      expect(allMetadata.some((m) => m.priority === 4)).toBe(true);
    });

    it('应该能够检查处理器类型', () => {
      expect(isHandlerType(TestClass, 'Command')).toBe(true);
      expect(isHandlerType(TestClass, 'Query')).toBe(true);
      expect(isHandlerType(TestClass, 'Event')).toBe(true);
      expect(isHandlerType(TestClass, 'Saga')).toBe(true);
      expect(isHandlerType(TestClass, 'Unknown')).toBe(false);
    });

    it('应该能够检查具体的处理器类型', () => {
      expect(isCommandHandler(TestClass)).toBe(true);
      expect(isQueryHandler(TestClass)).toBe(true);
      expect(isEventHandler(TestClass)).toBe(true);
      expect(isSaga(TestClass)).toBe(true);
    });

    it('应该能够合并元数据', () => {
      const baseMetadata = getCommandHandlerMetadata(TestClass)!;
      const override = { priority: 10, timeout: 5000 };

      const merged = mergeMetadata(baseMetadata, override);

      expect(merged.priority).toBe(10);
      expect(merged.timeout).toBe(5000);
      expect(merged.commandType).toBe('TestCommand');
    });

    it('应该能够验证元数据', () => {
      const validMetadata = getCommandHandlerMetadata(TestClass)!;
      expect(validateMetadata(validMetadata)).toBe(true);

      const invalidMetadata = {
        decoratorType: null,
        version: '',
        createdAt: null,
      } as unknown;
      expect(validateMetadata(invalidMetadata as IMetadata)).toBe(false);
    });

    it('应该能够克隆元数据', () => {
      const original = getCommandHandlerMetadata(TestClass)!;
      const cloned = cloneMetadata(original);

      expect(cloned).not.toBe(original);
      expect(cloned.commandType).toBe(original.commandType);
      expect(cloned.priority).toBe(original.priority);
      expect(cloned.enabled).toBe(original.enabled);
      // JSON克隆会将Date转换为字符串，这是预期行为
      expect(typeof cloned.createdAt).toBe('string');
      expect(cloned.createdAt).toBe(original.createdAt.toISOString());
    });

    it('应该能够获取元数据摘要', () => {
      const metadata = getCommandHandlerMetadata(TestClass)!;
      const summary = getMetadataSummary(metadata);

      expect(summary).toHaveProperty('decoratorType');
      expect(summary).toHaveProperty('version');
      expect(summary).toHaveProperty('enabled');
      expect(summary).toHaveProperty('priority');
      expect(summary.decoratorType).toBe(metadata.decoratorType);
      expect(summary.priority).toBe(metadata.priority);
    });
  });

  describe('错误处理和边界情况', () => {
    it('应该处理不存在元数据的类', () => {
      const EmptyClass = class EmptyClass {};

      expect(getAllHandlerMetadata(EmptyClass)).toHaveLength(0);
      expect(isCommandHandler(EmptyClass)).toBe(false);
      expect(isQueryHandler(EmptyClass)).toBe(false);
      expect(isEventHandler(EmptyClass)).toBe(false);
      expect(isSaga(EmptyClass)).toBe(false);
    });

    it('应该处理无效的元数据键', () => {
      expect(hasMetadata(TestClass, 'invalid-key')).toBe(false);
      expect(getMetadata(TestClass, 'invalid-key')).toBeUndefined();
      expect(deleteMetadata(TestClass, 'invalid-key')).toBe(false);
    });

    it('应该处理空的合并对象', () => {
      const baseMetadata = getCommandHandlerMetadata(TestClass)!;
      const merged = mergeMetadata(baseMetadata, {});

      expect(merged).toEqual(baseMetadata);
      expect(merged).not.toBe(baseMetadata);
    });

    it('应该处理深度嵌套的元数据合并', () => {
      const baseMetadata = getEventHandlerMetadata(TestClass)!;
      const override = {
        retry: {
          maxRetries: 5,
          retryDelay: 2000,
        },
        customConfig: {
          nested: {
            deep: {
              value: 'test',
            },
          },
        },
      };

      const merged = mergeMetadata(baseMetadata, override);

      expect(merged.retry?.maxRetries).toBe(5);
      expect(merged.retry?.retryDelay).toBe(2000);
      expect(((merged.customConfig as any)?.nested as any)?.deep?.value).toBe(
        'test',
      );
    });

    it('应该处理特殊字符的元数据值', () => {
      const specialMetadata = {
        decoratorType: DecoratorType.COMMAND_HANDLER,
        version: '1.0.0',
        createdAt: new Date(),
        enabled: true,
        priority: 0,
        customConfig: {
          unicode: '测试_José_🚀',
          special: '"quotes" & <tags>',
          newlines: 'line1\nline2\r\nline3',
        },
      };

      setMetadata(
        TestClass,
        'special-metadata',
        specialMetadata as unknown as IMetadata,
      );
      const retrieved = getMetadata(TestClass, 'special-metadata');

      expect(retrieved?.customConfig?.unicode).toBe('测试_José_🚀');
      expect(retrieved?.customConfig?.special).toBe('"quotes" & <tags>');
      expect(retrieved?.customConfig?.newlines).toBe('line1\nline2\r\nline3');
    });

    it('应该处理大型元数据对象', () => {
      const largeConfig: Record<string, unknown> = {};
      for (let i = 0; i < 1000; i++) {
        largeConfig[`key${i}`] = `value${i}`;
      }

      const largeMetadata = {
        decoratorType: DecoratorType.COMMAND_HANDLER,
        version: '1.0.0',
        createdAt: new Date(),
        enabled: true,
        priority: 0,
        customConfig: largeConfig,
      };

      setMetadata(TestClass, 'large-metadata', largeMetadata as IMetadata);
      const retrieved = getMetadata(TestClass, 'large-metadata');

      expect(retrieved?.customConfig).toEqual(largeConfig);
    });

    it('应该处理元数据的序列化和反序列化', () => {
      const metadata = getCommandHandlerMetadata(TestClass)!;
      const cloned = cloneMetadata(metadata);
      const summary = getMetadataSummary(cloned);

      expect(validateMetadata(cloned)).toBe(true);
      expect(summary).toHaveProperty('decoratorType', metadata.decoratorType);
      expect(summary).toHaveProperty('version', metadata.version);
    });
  });

  describe('性能测试', () => {
    it('应该能够处理大量元数据操作', () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        const TestClassDynamic = class {};
        setCommandHandlerMetadata(TestClassDynamic, `Command${i}`, {
          priority: i,
        });
        getCommandHandlerMetadata(TestClassDynamic);
        hasMetadata(TestClassDynamic, 'aiofix:core:CommandHandlerMetadata');
        deleteMetadata(TestClassDynamic, 'aiofix:core:CommandHandlerMetadata');
      }

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成
    });

    it('应该能够处理并发元数据操作', async () => {
      const promises = Array.from({ length: 100 }, async (_, i) => {
        const TestClassConcurrent = class {};
        setCommandHandlerMetadata(
          TestClassConcurrent,
          `ConcurrentCommand${i}`,
          { priority: i },
        );
        const metadata = getCommandHandlerMetadata(TestClassConcurrent);
        expect(metadata?.priority).toBe(i);
      });

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });
  });

  describe('元数据操作增强测试', () => {
    describe('复杂元数据场景', () => {
      it('应该处理多重装饰器的元数据冲突', () => {
        class MultiDecoratorClass {}

        // 设置多个不同类型的元数据
        setCommandHandlerMetadata(MultiDecoratorClass, 'TestCommand', {
          priority: 1,
        });
        setQueryHandlerMetadata(MultiDecoratorClass, 'TestQuery', {
          priority: 2,
        });
        setEventHandlerMetadata(MultiDecoratorClass, 'TestEvent', {
          priority: 3,
        });
        setSagaMetadata(MultiDecoratorClass, 'TestSaga', { priority: 4 });

        // 验证每种类型的元数据都能正确获取
        expect(getCommandHandlerMetadata(MultiDecoratorClass)?.priority).toBe(
          1,
        );
        expect(getQueryHandlerMetadata(MultiDecoratorClass)?.priority).toBe(2);
        expect(getEventHandlerMetadata(MultiDecoratorClass)?.priority).toBe(3);
        expect(getSagaMetadata(MultiDecoratorClass)?.priority).toBe(4);

        // 验证处理器类型检查
        expect(isCommandHandler(MultiDecoratorClass)).toBe(true);
        expect(isQueryHandler(MultiDecoratorClass)).toBe(true);
        expect(isEventHandler(MultiDecoratorClass)).toBe(true);
        expect(isSaga(MultiDecoratorClass)).toBe(true);
      });

      it('应该处理元数据的动态更新', () => {
        class DynamicClass {}

        // 初始设置
        setCommandHandlerMetadata(DynamicClass, 'InitialCommand', {
          priority: 1,
        });
        expect(getCommandHandlerMetadata(DynamicClass)?.commandType).toBe(
          'InitialCommand',
        );

        // 动态更新
        setCommandHandlerMetadata(DynamicClass, 'UpdatedCommand', {
          priority: 5,
        });
        expect(getCommandHandlerMetadata(DynamicClass)?.commandType).toBe(
          'UpdatedCommand',
        );
        expect(getCommandHandlerMetadata(DynamicClass)?.priority).toBe(5);
      });

      it('应该处理元数据的批量操作', () => {
        const classes = Array.from({ length: 50 }, () => class {});

        // 批量设置元数据
        classes.forEach((cls, index) => {
          setCommandHandlerMetadata(cls, `BatchCommand${index}`, {
            priority: index,
            timeout: index * 1000,
          });
        });

        // 批量验证元数据
        classes.forEach((cls, index) => {
          const metadata = getCommandHandlerMetadata(cls);
          expect(metadata?.commandType).toBe(`BatchCommand${index}`);
          expect(metadata?.priority).toBe(index);
          expect(metadata?.timeout).toBe(index * 1000);
        });
      });
    });

    describe('元数据查询和统计', () => {
      it('应该统计不同类型处理器的数量', () => {
        class StatsClass {}

        setCommandHandlerMetadata(StatsClass, 'Cmd1');
        setQueryHandlerMetadata(StatsClass, 'Query1');
        setEventHandlerMetadata(StatsClass, 'Event1');
        setSagaMetadata(StatsClass, 'Saga1');

        const allMetadata = getAllHandlerMetadata(StatsClass);
        expect(allMetadata).toHaveLength(4);

        // 检查各种处理器类型
        expect(isCommandHandler(StatsClass)).toBe(true);
        expect(isQueryHandler(StatsClass)).toBe(true);
        expect(isEventHandler(StatsClass)).toBe(true);
        expect(isSaga(StatsClass)).toBe(true);
      });

      it('应该生成基本的元数据摘要', () => {
        class ReportClass {}

        setCommandHandlerMetadata(ReportClass, 'ReportCommand', {
          priority: 10,
          timeout: 5000,
        });

        const metadata = getCommandHandlerMetadata(ReportClass)!;
        const summary = getMetadataSummary(metadata);
        expect(summary).toBeDefined();
        expect(summary.decoratorType).toBe(DecoratorType.COMMAND_HANDLER);
        expect(summary.version).toBeDefined();
        expect(summary.createdAt).toBeInstanceOf(Date);
        expect(summary.enabled).toBe(true);
      });
    });

    describe('元数据清理和维护', () => {
      it('应该能够清理所有元数据', () => {
        class CleanupClass {}

        // 设置多种元数据
        setCommandHandlerMetadata(CleanupClass, 'TestCommand');
        setQueryHandlerMetadata(CleanupClass, 'TestQuery');
        setEventHandlerMetadata(CleanupClass, 'TestEvent');

        // 验证元数据存在
        expect(isCommandHandler(CleanupClass)).toBe(true);
        expect(isQueryHandler(CleanupClass)).toBe(true);
        expect(isEventHandler(CleanupClass)).toBe(true);

        // 获取所有元数据键并删除
        const keys = getMetadataKeys(CleanupClass);
        keys.forEach((key) => {
          deleteMetadata(CleanupClass, key);
        });

        // 验证元数据已删除
        expect(isCommandHandler(CleanupClass)).toBe(false);
        expect(isQueryHandler(CleanupClass)).toBe(false);
        expect(isEventHandler(CleanupClass)).toBe(false);
      });

      it('应该处理元数据的内存管理', () => {
        const classes: any[] = [];

        // 创建大量带有元数据的类
        for (let i = 0; i < 100; i++) {
          const cls = class {};
          setCommandHandlerMetadata(cls, `Command${i}`, {
            priority: i,
          });
          classes.push(cls);
        }

        // 验证元数据正确设置
        classes.forEach((cls, index) => {
          const metadata = getCommandHandlerMetadata(cls);
          expect(metadata?.commandType).toBe(`Command${index}`);
          expect(metadata?.priority).toBe(index);
        });

        // 清理元数据
        classes.forEach((cls) => {
          deleteMetadata(cls, 'aiofix:command-handler');
        });

        // 验证清理成功
        classes.forEach((cls) => {
          expect(hasMetadata(cls, 'aiofix:command-handler')).toBe(false);
        });
      });
    });
  });
});
