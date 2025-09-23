/**
 * CommandHandler 装饰器测试
 *
 * @description 测试 CommandHandler 装饰器的功能
 * @since 1.0.0
 */
import 'reflect-metadata';
import {
  CommandHandler,
  isCommandHandler,
  getCommandType,
  getCommandHandlerPriority,
  supportsCommandType,
  getCommandHandlerMetadata,
  CommandHandlerClass,
} from './command-handler.decorator';
import { BaseCommand } from '../../application/cqrs/commands/base/base-command';
import { ICommandHandler } from '../../application/cqrs/commands/base/command-handler.interface';

// 测试用的命令类
class TestCommand extends BaseCommand {
  constructor(
    public readonly testData: string,
    tenantId: string = 'test-tenant',
    userId: string = 'test-user',
  ) {
    super(tenantId, userId);
  }

  get commandType(): string {
    return 'TestCommand';
  }

  validate(): void {
    if (!this.testData) {
      throw new Error('Test data is required');
    }
  }
}

// 测试用的命令处理器类（不使用装饰器）
class TestCommandHandlerWithoutDecorator
  implements ICommandHandler<TestCommand>
{
  async execute(_command: TestCommand): Promise<void> {
    // 模拟处理逻辑
    console.log(`Processing: ${_command.testData}`);
  }

  getSupportedCommandType(): string {
    return 'TestCommand';
  }

  getPriority(): number {
    return 0;
  }

  validateCommand(command: TestCommand): void {
    command.validate();
  }

  async canHandle(_command: TestCommand): Promise<boolean> {
    return true;
  }

  supports(_commandType: string): boolean {
    return _commandType === 'TestCommand';
  }
}

// 测试用的命令处理器类（使用基础装饰器）
// @ts-expect-error - TypeScript 装饰器签名误报
@CommandHandler('TestCommand')
class BasicTestCommandHandler implements ICommandHandler<TestCommand> {
  async execute(command: TestCommand): Promise<void> {
    console.log(`Processing: ${command.testData}`);
  }

  getSupportedCommandType(): string {
    return 'TestCommand';
  }

  getPriority(): number {
    return 0;
  }

  validateCommand(command: TestCommand): void {
    command.validate();
  }

  async canHandle(_command: TestCommand): Promise<boolean> {
    return true;
  }

  supports(_commandType: string): boolean {
    return _commandType === 'TestCommand';
  }
}

// 测试用的命令处理器类（使用高级装饰器）
// @ts-expect-error - TypeScript 装饰器签名误报
@CommandHandler('AdvancedTestCommand', {
  priority: 10,
  timeout: 5000,
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
  },
  validation: {
    rules: { testData: 'required|string' },
    skipValidation: false,
  },
  authorization: {
    permissions: ['test.execute'],
    skipAuthorization: false,
  },
  transaction: {
    propagation: 'REQUIRED',
    timeout: 30000,
  },
  multiTenant: {
    tenantResolver: async (_context: unknown): Promise<string> => 'test-tenant',
  },
  dataIsolation: {
    strategy: 'AUTO',
  },
  performanceMonitor: {
    thresholds: {
      warning: 1000,
      error: 5000,
    },
    metrics: ['execution_time', 'memory_usage'],
  },
  enableLogging: true,
  enableAudit: true,
  enablePerformanceMonitor: true,
  customConfig: {
    customField: 'customValue',
    maxConcurrency: 5,
  },
})
class AdvancedTestCommandHandler implements ICommandHandler<TestCommand> {
  async execute(_command: TestCommand): Promise<void> {
    console.log(`Advanced processing: ${_command.testData}`);
  }

  getSupportedCommandType(): string {
    return 'AdvancedTestCommand';
  }

  getPriority(): number {
    return 10;
  }

  validateCommand(command: TestCommand): void {
    command.validate();
  }

  async canHandle(_command: TestCommand): Promise<boolean> {
    return true;
  }

  supports(_commandType: string): boolean {
    return _commandType === 'TestCommand';
  }
}

// 无效的命令处理器类（缺少 execute 方法）
class InvalidCommandHandler {
  // 缺少 execute 方法
}

describe('CommandHandler装饰器', () => {
  describe('基础装饰器功能', () => {
    it('应该正确标记命令处理器类', () => {
      expect(isCommandHandler(BasicTestCommandHandler)).toBe(true);
      expect(isCommandHandler(TestCommandHandlerWithoutDecorator)).toBe(false);
    });

    it('应该正确设置命令类型', () => {
      expect(getCommandType(BasicTestCommandHandler)).toBe('TestCommand');
      expect(
        getCommandType(TestCommandHandlerWithoutDecorator),
      ).toBeUndefined();
    });

    it('应该正确设置静态属性', () => {
      expect(
        (BasicTestCommandHandler as unknown as { commandType: string })
          .commandType,
      ).toBe('TestCommand');
      expect(
        (BasicTestCommandHandler as unknown as { priority: number }).priority,
      ).toBe(0);
      expect(
        typeof (BasicTestCommandHandler as unknown as { supports: unknown })
          .supports,
      ).toBe('function');
      expect(
        typeof (BasicTestCommandHandler as unknown as { getMetadata: unknown })
          .getMetadata,
      ).toBe('function');
    });

    it('应该正确检查命令类型支持', () => {
      expect(
        (
          BasicTestCommandHandler as unknown as {
            supports: (type: string) => boolean;
          }
        ).supports('TestCommand'),
      ).toBe(true);
      expect(
        (
          BasicTestCommandHandler as unknown as {
            supports: (type: string) => boolean;
          }
        ).supports('OtherCommand'),
      ).toBe(false);
    });

    it('应该正确获取元数据', () => {
      const metadata = (
        BasicTestCommandHandler as unknown as {
          getMetadata: () => { commandType: string; priority: number };
        }
      ).getMetadata();
      expect(metadata).toBeDefined();
      expect(metadata.commandType).toBe('TestCommand');
      expect(metadata.priority).toBe(0);
    });
  });

  describe('高级装饰器功能', () => {
    it('应该正确设置优先级', () => {
      expect(getCommandHandlerPriority(AdvancedTestCommandHandler)).toBe(10);
      expect(
        (AdvancedTestCommandHandler as unknown as { priority: number })
          .priority,
      ).toBe(10);
    });

    it('应该正确设置完整配置', () => {
      const metadata = getCommandHandlerMetadata(AdvancedTestCommandHandler);
      expect(metadata).toBeDefined();
      expect(metadata!.commandType).toBe('AdvancedTestCommand');
      expect(metadata!.priority).toBe(10);
      expect(metadata!.timeout).toBe(5000);
      expect(metadata!.retry).toBeDefined();
      expect(metadata!.validation).toBeDefined();
      expect(metadata!.authorization).toBeDefined();
      expect(metadata!.transaction).toBeDefined();
      expect(metadata!.multiTenant).toBeDefined();
      expect(metadata!.dataIsolation).toBeDefined();
      expect(metadata!.performanceMonitor).toBeDefined();
      expect(metadata!.enableLogging).toBe(true);
      expect(metadata!.enableAudit).toBe(true);
      expect(metadata!.enablePerformanceMonitor).toBe(true);
      expect(metadata!.customConfig).toBeDefined();
    });

    it('应该正确设置重试配置', () => {
      const metadata = getCommandHandlerMetadata(AdvancedTestCommandHandler);
      const retry = metadata!.retry;
      expect(retry!.maxRetries).toBe(3);
      expect(retry!.retryDelay).toBe(1000);
      expect(retry!.backoffMultiplier).toBe(2);
    });

    it('应该正确设置验证配置', () => {
      const metadata = getCommandHandlerMetadata(AdvancedTestCommandHandler);
      const validation = metadata!.validation;
      expect(validation!.skipValidation).toBe(false);
      expect(validation!.rules).toEqual({ testData: 'required|string' });
    });

    it('应该正确设置授权配置', () => {
      const metadata = getCommandHandlerMetadata(AdvancedTestCommandHandler);
      const authorization = metadata!.authorization;
      expect(authorization!.skipAuthorization).toBe(false);
      expect(authorization!.permissions).toEqual(['test.execute']);
    });

    it('应该正确设置事务配置', () => {
      const metadata = getCommandHandlerMetadata(AdvancedTestCommandHandler);
      const transaction = metadata!.transaction;
      expect(transaction!.propagation).toBe('REQUIRED');
      expect(transaction!.timeout).toBe(30000);
    });

    it('应该正确设置多租户配置', () => {
      const metadata = getCommandHandlerMetadata(AdvancedTestCommandHandler);
      const multiTenant = metadata!.multiTenant;
      expect(typeof multiTenant!.tenantResolver).toBe('function');
    });

    it('应该正确设置数据隔离配置', () => {
      const metadata = getCommandHandlerMetadata(AdvancedTestCommandHandler);
      const dataIsolation = metadata!.dataIsolation;
      expect(dataIsolation!.strategy).toBe('AUTO');
    });

    it('应该正确设置性能监控配置', () => {
      const metadata = getCommandHandlerMetadata(AdvancedTestCommandHandler);
      const performanceMonitor = metadata!.performanceMonitor;
      expect(performanceMonitor!.thresholds).toEqual({
        warning: 1000,
        error: 5000,
      });
      expect(performanceMonitor!.metrics).toEqual([
        'execution_time',
        'memory_usage',
      ]);
    });

    it('应该正确设置自定义配置', () => {
      const metadata = getCommandHandlerMetadata(AdvancedTestCommandHandler);
      const customConfig = metadata!.customConfig;
      expect(customConfig!.customField).toBe('customValue');
      expect(customConfig!.maxConcurrency).toBe(5);
    });
  });

  describe('工具函数', () => {
    it('supportsCommandType 应该正确检查命令类型支持', () => {
      expect(supportsCommandType(BasicTestCommandHandler, 'TestCommand')).toBe(
        true,
      );
      expect(supportsCommandType(BasicTestCommandHandler, 'OtherCommand')).toBe(
        false,
      );
      expect(
        supportsCommandType(AdvancedTestCommandHandler, 'AdvancedTestCommand'),
      ).toBe(true);
      expect(
        supportsCommandType(AdvancedTestCommandHandler, 'TestCommand'),
      ).toBe(false);
    });

    it('应该正确处理未标记的类', () => {
      expect(isCommandHandler(TestCommandHandlerWithoutDecorator)).toBe(false);
      expect(
        getCommandType(TestCommandHandlerWithoutDecorator),
      ).toBeUndefined();
      expect(
        getCommandHandlerPriority(TestCommandHandlerWithoutDecorator),
      ).toBeUndefined();
      expect(
        supportsCommandType(TestCommandHandlerWithoutDecorator, 'TestCommand'),
      ).toBe(false);
      expect(
        getCommandHandlerMetadata(TestCommandHandlerWithoutDecorator),
      ).toBeUndefined();
    });
  });

  describe('错误处理', () => {
    it('应该拒绝没有 execute 方法的类', () => {
      expect(() => {
        // @ts-expect-error - TypeScript 装饰器签名误报
        @CommandHandler('InvalidCommand')
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        class TestInvalidHandlerClass extends InvalidCommandHandler {}
      }).toThrow(
        'Command handler TestInvalidHandlerClass must implement execute method',
      );
    });

    it('应该处理空的选项对象', () => {
      // @ts-expect-error - TypeScript 装饰器签名误报
      @CommandHandler('EmptyOptionsCommand', {})
      class EmptyOptionsHandler implements ICommandHandler<TestCommand> {
        async execute(_command: TestCommand): Promise<void> {
          console.log(`Processing: ${_command.testData}`);
        }

        getSupportedCommandType(): string {
          return 'EmptyOptionsCommand';
        }

        getPriority(): number {
          return 0;
        }

        validateCommand(command: TestCommand): void {
          command.validate();
        }

        async canHandle(_command: TestCommand): Promise<boolean> {
          return true;
        }

        supports(_commandType: string): boolean {
          return _commandType === this.getSupportedCommandType();
        }
      }

      expect(isCommandHandler(EmptyOptionsHandler)).toBe(true);
      expect(getCommandType(EmptyOptionsHandler)).toBe('EmptyOptionsCommand');
      expect(getCommandHandlerPriority(EmptyOptionsHandler)).toBe(0);
    });
  });

  describe('边界情况', () => {
    it('应该处理特殊字符的命令类型', () => {
      // @ts-expect-error - TypeScript 装饰器签名误报
      @CommandHandler('Special-Command_Type.123')
      class SpecialCommandHandler implements ICommandHandler<TestCommand> {
        async execute(_command: TestCommand): Promise<void> {
          console.log(`Processing: ${_command.testData}`);
        }

        getSupportedCommandType(): string {
          return 'Special-Command_Type.123';
        }

        getPriority(): number {
          return 0;
        }

        validateCommand(command: TestCommand): void {
          command.validate();
        }

        async canHandle(_command: TestCommand): Promise<boolean> {
          return true;
        }

        supports(_commandType: string): boolean {
          return _commandType === this.getSupportedCommandType();
        }
      }

      expect(getCommandType(SpecialCommandHandler)).toBe(
        'Special-Command_Type.123',
      );
      expect(
        supportsCommandType(SpecialCommandHandler, 'Special-Command_Type.123'),
      ).toBe(true);
    });

    it('应该处理负数优先级', () => {
      // @ts-expect-error - TypeScript 装饰器签名误报
      @CommandHandler('NegativePriorityCommand', { priority: -5 })
      class NegativePriorityHandler implements ICommandHandler<TestCommand> {
        async execute(_command: TestCommand): Promise<void> {
          console.log(`Processing: ${_command.testData}`);
        }

        getSupportedCommandType(): string {
          return 'NegativePriorityCommand';
        }

        getPriority(): number {
          return -5;
        }

        validateCommand(command: TestCommand): void {
          command.validate();
        }

        async canHandle(_command: TestCommand): Promise<boolean> {
          return true;
        }

        supports(_commandType: string): boolean {
          return _commandType === this.getSupportedCommandType();
        }
      }

      expect(getCommandHandlerPriority(NegativePriorityHandler)).toBe(-5);
      expect(
        (NegativePriorityHandler as unknown as { priority: number }).priority,
      ).toBe(-5);
    });

    it('应该处理大数值配置', () => {
      // @ts-expect-error - TypeScript 装饰器签名误报
      @CommandHandler('LargeNumbersCommand', {
        priority: Number.MAX_SAFE_INTEGER,
        timeout: Number.MAX_SAFE_INTEGER,
      })
      class LargeNumbersHandler implements ICommandHandler<TestCommand> {
        async execute(_command: TestCommand): Promise<void> {
          console.log(`Processing: ${_command.testData}`);
        }

        getSupportedCommandType(): string {
          return 'LargeNumbersCommand';
        }

        getPriority(): number {
          return Number.MAX_SAFE_INTEGER;
        }

        validateCommand(command: TestCommand): void {
          command.validate();
        }

        async canHandle(_command: TestCommand): Promise<boolean> {
          return true;
        }

        supports(_commandType: string): boolean {
          return _commandType === this.getSupportedCommandType();
        }
      }

      const metadata = getCommandHandlerMetadata(LargeNumbersHandler);
      expect(metadata!.priority).toBe(Number.MAX_SAFE_INTEGER);
      expect(metadata!.timeout).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe('类型检查', () => {
    it('应该正确定义 CommandHandlerClass 类型', () => {
      const handlerClass =
        BasicTestCommandHandler as unknown as CommandHandlerClass<TestCommand>;

      expect(
        (handlerClass as unknown as { commandType: string }).commandType,
      ).toBe('TestCommand');
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

    it('应该支持泛型命令类型', () => {
      // @ts-expect-error - TypeScript 装饰器签名误报
      @CommandHandler('GenericCommand')
      class GenericCommandHandler<T extends BaseCommand>
        implements ICommandHandler<T>
      {
        async execute(_command: T): Promise<void> {
          console.log(
            `Processing generic command: ${(_command as unknown as { commandType: string }).commandType}`,
          );
        }

        getSupportedCommandType(): string {
          return 'GenericCommand';
        }

        getPriority(): number {
          return 0;
        }

        validateCommand(_command: T): void {
          // 泛型验证
        }

        async canHandle(_command: T): Promise<boolean> {
          return true;
        }

        supports(_commandType: string): boolean {
          return _commandType === this.getSupportedCommandType();
        }
      }

      expect(isCommandHandler(GenericCommandHandler)).toBe(true);
      expect(getCommandType(GenericCommandHandler)).toBe('GenericCommand');
    });
  });
});
