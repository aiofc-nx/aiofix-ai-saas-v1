/**
 * Testing Interface 测试
 *
 * @description 测试测试支持接口定义和类型验证
 * @since 1.0.0
 */
import {
  TestEnvironmentType,
  ITestDataGenerator,
  ITestDataFactory,
  ITestMock,
  ITestUtils,
  ITestEnvironment,
  ITestModule,
} from './testing.interface';

describe('Testing Interface', () => {
  describe('TestEnvironmentType 枚举', () => {
    it('应该定义所有测试环境类型', () => {
      expect(TestEnvironmentType.UNIT).toBe('unit');
      expect(TestEnvironmentType.INTEGRATION).toBe('integration');
      expect(TestEnvironmentType.E2E).toBe('e2e');
      expect(TestEnvironmentType.PERFORMANCE).toBe('performance');
      expect(TestEnvironmentType.LOAD).toBe('load');
      expect(TestEnvironmentType.STRESS).toBe('stress');
    });

    it('应该包含所有环境类型值', () => {
      const types = Object.values(TestEnvironmentType);
      expect(types).toContain('unit');
      expect(types).toContain('integration');
      expect(types).toContain('e2e');
      expect(types).toContain('performance');
      expect(types).toContain('load');
      expect(types).toContain('stress');
      expect(types).toHaveLength(6);
    });
  });

  describe('ITestDataGenerator 接口', () => {
    it('应该定义测试数据生成器接口结构', () => {
      const generator: ITestDataGenerator<{ id: string; name: string }> = {
        name: 'UserDataGenerator',
        generate: jest.fn().mockReturnValue({ id: '1', name: 'Test User' }),
        generateMany: jest
          .fn()
          .mockReturnValue([{ id: '1', name: 'Test User' }]),
        generateSequence: jest
          .fn()
          .mockReturnValue([{ id: '1', name: 'Test User' }]),
      };

      expect(generator.name).toBe('UserDataGenerator');
      expect(typeof generator.generate).toBe('function');
      expect(typeof generator.generateMany).toBe('function');
      expect(typeof generator.generateSequence).toBe('function');
    });

    it('应该支持泛型类型', () => {
      interface UserData {
        id: string;
        name: string;
        email: string;
      }

      const userGenerator: ITestDataGenerator<UserData> = {
        name: 'UserGenerator',
        generate: jest.fn().mockReturnValue({
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
        }),
        generateMany: jest.fn().mockReturnValue([]),
        generateSequence: jest.fn().mockReturnValue([]),
      };

      expect(userGenerator.name).toBe('UserGenerator');
      expect(typeof userGenerator.generate).toBe('function');
    });

    it('应该支持可选参数', () => {
      const generator: ITestDataGenerator<string> = {
        name: 'StringGenerator',
        generate: jest.fn().mockReturnValue('test'),
        generateMany: jest.fn().mockReturnValue(['test1', 'test2']),
        generateSequence: jest.fn().mockReturnValue(['seq1', 'seq2']),
      };

      // 测试不带参数的调用
      expect(() => generator.generate()).not.toThrow();
      expect(() => generator.generateMany(5)).not.toThrow();
      expect(() => generator.generateSequence(3)).not.toThrow();

      // 测试带参数的调用
      expect(() => generator.generate({ prefix: 'test' })).not.toThrow();
      expect(() => generator.generateMany(5, { type: 'alpha' })).not.toThrow();
      expect(() => generator.generateSequence(3, { start: 1 })).not.toThrow();
    });
  });

  describe('ITestDataFactory 接口', () => {
    it('应该定义测试数据工厂接口结构', () => {
      const factory: ITestDataFactory = {
        registerGenerator: jest.fn(),
        getGenerator: jest.fn().mockReturnValue(undefined),
        generate: jest.fn().mockReturnValue({}),
        generateMany: jest.fn().mockReturnValue([]),
        cleanup: jest.fn().mockResolvedValue(undefined),
      };

      expect(typeof factory.registerGenerator).toBe('function');
      expect(typeof factory.getGenerator).toBe('function');
      expect(typeof factory.generate).toBe('function');
      expect(typeof factory.generateMany).toBe('function');
      expect(typeof factory.cleanup).toBe('function');
    });

    it('应该支持生成器注册和获取', () => {
      const mockGenerator: ITestDataGenerator<string> = {
        name: 'StringGenerator',
        generate: jest.fn().mockReturnValue('test'),
        generateMany: jest.fn().mockReturnValue(['test1', 'test2']),
        generateSequence: jest.fn().mockReturnValue(['seq1', 'seq2']),
      };

      const factory: ITestDataFactory = {
        registerGenerator: jest.fn(),
        getGenerator: jest.fn().mockReturnValue(mockGenerator),
        generate: jest.fn().mockReturnValue('generated'),
        generateMany: jest.fn().mockReturnValue(['gen1', 'gen2']),
        cleanup: jest.fn().mockResolvedValue(undefined),
      };

      // 注册生成器
      factory.registerGenerator('string', mockGenerator);
      expect(factory.registerGenerator).toHaveBeenCalledWith(
        'string',
        mockGenerator,
      );

      // 获取生成器
      const retrieved = factory.getGenerator<string>('string');
      expect(retrieved).toBe(mockGenerator);

      // 生成数据
      const data = factory.generate<string>('string');
      expect(data).toBe('generated');

      // 批量生成数据
      const manyData = factory.generateMany<string>('string', 5);
      expect(manyData).toEqual(['gen1', 'gen2']);
    });

    it('应该支持异步清理操作', async () => {
      const factory: ITestDataFactory = {
        registerGenerator: jest.fn(),
        getGenerator: jest.fn(),
        generate: jest.fn(),
        generateMany: jest.fn(),
        cleanup: jest.fn().mockResolvedValue(undefined),
      };

      await expect(factory.cleanup()).resolves.not.toThrow();
      expect(factory.cleanup).toHaveBeenCalled();
    });
  });

  describe('ITestMock 接口', () => {
    it('应该定义测试模拟接口结构', () => {
      const mock: ITestMock<string> = {
        name: 'StringMock',
        target: 'StringService',
        mock: jest.fn().mockReturnValue('mocked'),
        spy: jest.fn(),
        stub: jest.fn(),
        restore: jest.fn(),
        reset: jest.fn(),
        verify: jest.fn().mockReturnValue(true),
        getCallCount: jest.fn().mockReturnValue(0),
        getCallArgs: jest.fn().mockReturnValue([]),
        getReturnValue: jest.fn().mockReturnValue('return'),
        getReturnValues: jest.fn().mockReturnValue([]),
      };

      expect(mock.name).toBe('StringMock');
      expect(mock.target).toBe('StringService');
      expect(typeof mock.mock).toBe('function');
      expect(typeof mock.spy).toBe('function');
      expect(typeof mock.stub).toBe('function');
      expect(typeof mock.restore).toBe('function');
      expect(typeof mock.reset).toBe('function');
      expect(typeof mock.verify).toBe('function');
      expect(typeof mock.getCallCount).toBe('function');
      expect(typeof mock.getCallArgs).toBe('function');
      expect(typeof mock.getReturnValue).toBe('function');
      expect(typeof mock.getReturnValues).toBe('function');
    });

    it('应该支持泛型类型', () => {
      interface UserService {
        getUser(id: string): { id: string; name: string };
        createUser(data: { name: string }): { id: string; name: string };
      }

      const userMock: ITestMock<UserService> = {
        name: 'UserServiceMock',
        target: 'UserService',
        mock: jest.fn(),
        spy: jest.fn(),
        stub: jest.fn(),
        restore: jest.fn(),
        reset: jest.fn(),
        verify: jest.fn().mockReturnValue(true),
        getCallCount: jest.fn().mockReturnValue(2),
        getCallArgs: jest
          .fn()
          .mockReturnValue([['user-1'], [{ name: 'Test' }]]),
        getReturnValue: jest
          .fn()
          .mockReturnValue({ id: 'user-1', name: 'Test' }),
        getReturnValues: jest.fn().mockReturnValue([]),
      };

      expect(userMock.name).toBe('UserServiceMock');
      expect(userMock.target).toBe('UserService');
    });

    it('应该支持可选属性', () => {
      const simpleMock: ITestMock = {
        name: 'SimpleMock',
        target: 'SimpleService',
        mock: jest.fn(),
        spy: jest.fn(),
        stub: jest.fn(),
        restore: jest.fn(),
        reset: jest.fn(),
        verify: jest.fn().mockReturnValue(true),
        getCallCount: jest.fn().mockReturnValue(0),
        getCallArgs: jest.fn().mockReturnValue([]),
        getReturnValue: jest.fn(),
        getReturnValues: jest.fn().mockReturnValue([]),
      };

      expect(simpleMock.name).toBe('SimpleMock');
      expect(simpleMock.target).toBe('SimpleService');
      expect(simpleMock.description).toBeUndefined();
      expect(simpleMock.configuration).toBeUndefined();
    });
  });

  describe('ITestUtils 接口', () => {
    it('应该定义测试工具接口结构', () => {
      const utils: ITestUtils = {
        wait: jest.fn().mockResolvedValue(undefined),
        waitFor: jest.fn().mockResolvedValue(undefined),
        retry: jest.fn().mockResolvedValue(undefined),
        expectError: jest.fn().mockResolvedValue(undefined),
        generateRandomString: jest.fn().mockReturnValue('random'),
        generateRandomNumber: jest.fn().mockReturnValue(42),
        generateRandomBoolean: jest.fn().mockReturnValue(true),
        generateRandomEmail: jest.fn().mockReturnValue('test@example.com'),
        generateRandomPhone: jest.fn().mockReturnValue('1234567890'),
        generateRandomUrl: jest.fn().mockReturnValue('https://example.com'),
        generateRandomDate: jest.fn().mockReturnValue(new Date()),
        generateRandomUUID: jest.fn().mockReturnValue('uuid'),
        generateRandomIP: jest.fn().mockReturnValue('192.168.1.1'),
        generateRandomJSON: jest.fn().mockReturnValue({}),
        deepClone: jest.fn().mockReturnValue({}),
        deepEqual: jest.fn().mockReturnValue(true),
        formatTestData: jest.fn().mockReturnValue('formatted'),
        createSnapshot: jest.fn().mockReturnValue('snapshot'),
        compareSnapshots: jest.fn().mockReturnValue(true),
      };

      expect(typeof utils.wait).toBe('function');
      expect(typeof utils.waitFor).toBe('function');
      expect(typeof utils.retry).toBe('function');
      expect(typeof utils.expectError).toBe('function');
      expect(typeof utils.generateRandomString).toBe('function');
      expect(typeof utils.generateRandomNumber).toBe('function');
      expect(typeof utils.generateRandomBoolean).toBe('function');
      expect(typeof utils.generateRandomEmail).toBe('function');
      expect(typeof utils.generateRandomPhone).toBe('function');
      expect(typeof utils.generateRandomUrl).toBe('function');
      expect(typeof utils.generateRandomDate).toBe('function');
      expect(typeof utils.generateRandomUUID).toBe('function');
      expect(typeof utils.generateRandomIP).toBe('function');
      expect(typeof utils.generateRandomJSON).toBe('function');
      expect(typeof utils.deepClone).toBe('function');
      expect(typeof utils.deepEqual).toBe('function');
      expect(typeof utils.formatTestData).toBe('function');
      expect(typeof utils.createSnapshot).toBe('function');
      expect(typeof utils.compareSnapshots).toBe('function');
    });
  });

  describe('ITestEnvironment 接口', () => {
    it('应该定义测试环境接口结构', () => {
      const environment: ITestEnvironment = {
        type: TestEnvironmentType.UNIT,
        name: 'UnitTestEnvironment',
        description: 'Unit testing environment',
        configuration: {
          timeout: 5000,
          retries: 3,
        },
        setup: jest.fn().mockResolvedValue(undefined),
        teardown: jest.fn().mockResolvedValue(undefined),
        isReady: jest.fn().mockResolvedValue(true),
        getConfiguration: jest.fn().mockReturnValue({}),
      };

      expect(environment.type).toBe(TestEnvironmentType.UNIT);
      expect(environment.name).toBe('UnitTestEnvironment');
      expect(environment.description).toBe('Unit testing environment');
      expect(environment.configuration?.timeout).toBe(5000);
      expect(typeof environment.setup).toBe('function');
      expect(typeof environment.teardown).toBe('function');
      expect(typeof environment.isReady).toBe('function');
      expect(typeof environment.getConfiguration).toBe('function');
    });

    it('应该支持不同的环境类型', () => {
      const environments = [
        {
          type: TestEnvironmentType.UNIT,
          name: 'UnitEnv',
        },
        {
          type: TestEnvironmentType.INTEGRATION,
          name: 'IntegrationEnv',
        },
        {
          type: TestEnvironmentType.E2E,
          name: 'E2EEnv',
        },
        {
          type: TestEnvironmentType.PERFORMANCE,
          name: 'PerformanceEnv',
        },
        {
          type: TestEnvironmentType.LOAD,
          name: 'LoadEnv',
        },
        {
          type: TestEnvironmentType.STRESS,
          name: 'StressEnv',
        },
      ];

      environments.forEach((envConfig) => {
        const environment: ITestEnvironment = {
          ...envConfig,
          setup: jest.fn().mockResolvedValue(undefined),
          teardown: jest.fn().mockResolvedValue(undefined),
          isReady: jest.fn().mockResolvedValue(true),
          getConfiguration: jest.fn().mockReturnValue({}),
        };

        expect(Object.values(TestEnvironmentType)).toContain(environment.type);
      });
    });
  });

  describe('ITestModule 接口', () => {
    it('应该定义测试模块接口结构', () => {
      const module: ITestModule = {
        name: 'TestModule',
        imports: [],
        providers: [],
        exports: [],
        configure: jest.fn().mockResolvedValue(undefined),
        getProviders: jest.fn().mockReturnValue([]),
        getImports: jest.fn().mockReturnValue([]),
        getExports: jest.fn().mockReturnValue([]),
      };

      expect(module.name).toBe('TestModule');
      expect(Array.isArray(module.imports)).toBe(true);
      expect(Array.isArray(module.providers)).toBe(true);
      expect(Array.isArray(module.exports)).toBe(true);
      expect(typeof module.configure).toBe('function');
      expect(typeof module.getProviders).toBe('function');
      expect(typeof module.getImports).toBe('function');
      expect(typeof module.getExports).toBe('function');
    });

    it('应该支持可选属性', () => {
      const module: ITestModule = {
        name: 'MinimalTestModule',
        configure: jest.fn().mockResolvedValue(undefined),
        getProviders: jest.fn().mockReturnValue([]),
        getImports: jest.fn().mockReturnValue([]),
        getExports: jest.fn().mockReturnValue([]),
      };

      expect(module.name).toBe('MinimalTestModule');
      expect(module.imports).toBeUndefined();
      expect(module.providers).toBeUndefined();
      expect(module.exports).toBeUndefined();
      expect(module.description).toBeUndefined();
      expect(module.configuration).toBeUndefined();
    });
  });

  describe('边界情况', () => {
    it('应该处理空配置', () => {
      const environment: ITestEnvironment = {
        type: TestEnvironmentType.UNIT,
        name: 'EmptyConfigEnv',
        configuration: {},
        setup: jest.fn().mockResolvedValue(undefined),
        teardown: jest.fn().mockResolvedValue(undefined),
        isReady: jest.fn().mockResolvedValue(true),
        getConfiguration: jest.fn().mockReturnValue({}),
      };

      expect(environment.configuration).toEqual({});
      expect(Object.keys(environment.configuration)).toHaveLength(0);
    });

    it('应该处理特殊字符的名称', () => {
      const generator: ITestDataGenerator<string> = {
        name: '测试生成器_José_🚀',
        generate: jest.fn().mockReturnValue('test'),
        generateMany: jest.fn().mockReturnValue(['test1', 'test2']),
        generateSequence: jest.fn().mockReturnValue(['seq1', 'seq2']),
      };

      expect(generator.name).toBe('测试生成器_José_🚀');
      expect(generator.name).toContain('测试生成器');
      expect(generator.name).toContain('José');
      expect(generator.name).toContain('🚀');
    });

    it('应该处理复杂的配置对象', () => {
      const environment: ITestEnvironment = {
        type: TestEnvironmentType.PERFORMANCE,
        name: 'PerformanceEnv',
        configuration: {
          timeout: 60000,
          retries: 5,
          concurrency: 10,
          resources: {
            memory: '2GB',
            cpu: '4 cores',
          },
          database: {
            host: 'localhost',
            port: 5432,
            name: 'test_db',
            credentials: {
              username: 'test_user',
              password: 'test_pass',
            },
          },
        },
        setup: jest.fn().mockResolvedValue(undefined),
        teardown: jest.fn().mockResolvedValue(undefined),
        isReady: jest.fn().mockResolvedValue(true),
        getConfiguration: jest.fn().mockReturnValue({}),
      };

      expect(environment.configuration.timeout).toBe(60000);
      expect(environment.configuration.resources?.memory).toBe('2GB');
      expect(environment.configuration.database?.credentials?.username).toBe(
        'test_user',
      );
    });

    it('应该处理异步操作', async () => {
      const environment: ITestEnvironment = {
        type: TestEnvironmentType.INTEGRATION,
        name: 'AsyncEnv',
        setup: jest.fn().mockResolvedValue(undefined),
        teardown: jest.fn().mockResolvedValue(undefined),
        isReady: jest.fn().mockResolvedValue(true),
        getConfiguration: jest.fn().mockReturnValue({}),
      };

      await expect(environment.setup()).resolves.not.toThrow();
      await expect(environment.teardown()).resolves.not.toThrow();
      await expect(environment.isReady()).resolves.toBe(true);
    });

    it('应该处理模拟器的调用统计', () => {
      const mock: ITestMock<() => string> = {
        name: 'FunctionMock',
        target: 'testFunction',
        mock: jest.fn().mockReturnValue('mocked'),
        spy: jest.fn(),
        stub: jest.fn(),
        restore: jest.fn(),
        reset: jest.fn(),
        verify: jest.fn().mockReturnValue(true),
        getCallCount: jest.fn().mockReturnValue(5),
        getCallArgs: jest.fn().mockReturnValue([[], [], [], [], []]),
        getReturnValue: jest.fn().mockReturnValue('mocked'),
        getReturnValues: jest.fn().mockReturnValue(['mock1', 'mock2', 'mock3']),
      };

      expect(mock.getCallCount()).toBe(5);
      expect(mock.getCallArgs()).toHaveLength(5);
      expect(mock.getReturnValue()).toBe('mocked');
      expect(mock.getReturnValues()).toContain('mock1');
    });
  });
});
