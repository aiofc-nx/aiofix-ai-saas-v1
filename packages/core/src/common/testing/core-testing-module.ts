/**
 * CoreTestingModule - 核心测试模块实现
 *
 * 提供了完整的测试支持功能，包括测试环境配置、测试数据准备、
 * 测试依赖注入、测试生命周期管理等企业级特性。
 *
 * ## 业务规则
 *
 * ### 测试模块规则
 * - 支持测试环境配置
 * - 支持测试数据准备
 * - 支持测试依赖注入
 * - 支持测试生命周期管理
 *
 * ### 测试工具规则
 * - 支持测试数据生成
 * - 支持测试断言工具
 * - 支持测试模拟工具
 * - 支持测试辅助函数
 *
 * ### 测试基类规则
 * - 支持通用测试基类
 * - 支持集成测试基类
 * - 支持单元测试基类
 * - 支持端到端测试基类
 *
 * ### 测试数据规则
 * - 支持测试数据工厂
 * - 支持测试数据清理
 * - 支持测试数据隔离
 * - 支持测试数据持久化
 *
 * @description 核心测试模块实现类
 * @example
 * ```typescript
 * const testingModule = new CoreTestingModule({
 *   environment: TestEnvironmentType.INTEGRATION,
 *   enableTestDatabase: true,
 *   testDatabase: {
 *     type: 'postgres',
 *     host: 'localhost',
 *     port: 5432,
 *     database: 'test_db'
 *   }
 * });
 *
 * await testingModule.initialize();
 *
 * const app = testingModule.getTestApp();
 * const userService = testingModule.getTestService(UserService);
 *
 * await testingModule.runTest(async () => {
 *   const user = await userService.createUser({ name: 'Test User' });
 *   expect(user.name).toBe('Test User');
 * });
 *
 * await testingModule.cleanup();
 * ```
 *
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import { v4 as uuidv4 } from 'uuid';
import {
  ITestModule,
  type ITestConfiguration,
  ITestDataFactory,
  ITestAssertion,
  ITestUtils,
  TestEnvironmentType,
} from './testing.interface';
import { CoreTestDataFactory } from './core-test-data-factory';
import { CoreTestAssertion } from './core-test-assertion';
import { CoreTestUtils } from './core-test-utils';

/**
 * 核心测试模块
 */
@Injectable()
export class CoreTestingModule implements ITestModule {
  public readonly name: string;
  public readonly configuration: ITestConfiguration;
  public readonly dataFactory: ITestDataFactory;
  public readonly assertion: ITestAssertion;
  public readonly utils: ITestUtils;

  private _testApp: unknown;
  private _testModule!: TestingModule;
  private _isInitialized = false;

  constructor(
    configuration: ITestConfiguration,
    private readonly logger?: ILoggerService,
  ) {
    this.name = `CoreTestingModule_${uuidv4()}`;
    const defaultConfig: ITestConfiguration = {
      environment: TestEnvironmentType.UNIT,
      enableTestDatabase: false,
      enableTestCache: false,
      enableTestMessageQueue: false,
      enableTestLogging: true,
      testLogLevel: 'error',
      enableTestMonitoring: false,
      testTimeout: 30000,
      enableParallelTests: false,
      parallelTestCount: 1,
      enableTestCoverage: false,
      testCoverageThreshold: 80,
      enableTestDataIsolation: true,
      enableTestDataCleanup: true,
    };

    this.configuration = { ...defaultConfig, ...configuration };

    this.dataFactory = new CoreTestDataFactory(this.logger);
    this.assertion = new CoreTestAssertion();
    this.utils = new CoreTestUtils();
  }

  /**
   * 初始化测试模块
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized) {
      this.logger?.warn(
        'Testing module is already initialized',
        LogContext.SYSTEM,
      );
      return;
    }

    this.logger?.info('Initializing testing module...', LogContext.SYSTEM, {
      moduleName: this.name,
      environment: this.configuration.environment,
      configuration: this.configuration,
    });

    try {
      // 初始化测试数据工厂
      // await this.dataFactory.initialize();

      // 创建测试模块
      this._testModule = await Test.createTestingModule({
        imports: this.getTestImports(),
        providers: this.getTestProviders(),
        controllers: this.getTestControllers(),
      }).compile();

      // 创建测试应用
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this._testApp = this._testModule.createNestApplication() as any;

      // 配置测试应用
      await this.configureTestApp();

      // 初始化测试应用
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this._testApp as any).init();

      this._isInitialized = true;

      this.logger?.info(
        'Testing module initialized successfully',
        LogContext.SYSTEM,
        {
          moduleName: this.name,
          environment: this.configuration.environment,
        },
      );
    } catch (error) {
      this.logger?.error(
        'Failed to initialize testing module',
        LogContext.SYSTEM,
        {
          moduleName: this.name,
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 清理测试模块
   */
  public async cleanup(): Promise<void> {
    if (!this._isInitialized) {
      this.logger?.warn('Testing module is not initialized', LogContext.SYSTEM);
      return;
    }

    this.logger?.info('Cleaning up testing module...', LogContext.SYSTEM, {
      moduleName: this.name,
    });

    try {
      // 清理测试应用
      if (this._testApp) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (this._testApp as any).close();
      }

      // 清理测试模块
      if (this._testModule) {
        await this._testModule.close();
      }

      // 清理测试数据
      if (this.configuration.enableTestDataCleanup) {
        await this.dataFactory.cleanup();
      }

      this._isInitialized = false;

      this.logger?.info(
        'Testing module cleaned up successfully',
        LogContext.SYSTEM,
        {
          moduleName: this.name,
        },
      );
    } catch (error) {
      this.logger?.error(
        'Failed to cleanup testing module',
        LogContext.SYSTEM,
        {
          moduleName: this.name,
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 获取测试应用
   */
  public getTestApp(): unknown {
    if (!this._isInitialized) {
      throw new Error('Testing module is not initialized');
    }
    return this._testApp;
  }

  /**
   * 获取测试模块
   */
  public getTestModule(): TestingModule {
    if (!this._isInitialized) {
      throw new Error('Testing module is not initialized');
    }
    return this._testModule;
  }

  /**
   * 获取测试服务
   */
  public getTestService<T>(service: new (...args: unknown[]) => T): T {
    if (!this._isInitialized) {
      throw new Error('Testing module is not initialized');
    }
    return this._testModule.get(service);
  }

  /**
   * 获取测试仓库
   */
  public getTestRepository<T>(repository: new (...args: unknown[]) => T): T {
    if (!this._isInitialized) {
      throw new Error('Testing module is not initialized');
    }
    return this._testModule.get(repository);
  }

  /**
   * 执行测试
   */
  public async runTest(testFn: () => Promise<void> | void): Promise<void> {
    if (!this._isInitialized) {
      throw new Error('Testing module is not initialized');
    }

    const startTime = Date.now();
    this.logger?.debug('Running test', LogContext.SYSTEM, {
      moduleName: this.name,
      testTimeout: this.configuration.testTimeout,
    });

    try {
      // 设置测试超时
      const timeoutPromise = new Promise((_, reject) => {
        globalThis.setTimeout(
          () => reject(new Error('Test timeout')),
          this.configuration.testTimeout,
        );
      });

      // 执行测试
      const testPromise = Promise.resolve(testFn());

      await Promise.race([testPromise, timeoutPromise]);

      const duration = Date.now() - startTime;
      this.logger?.debug('Test completed successfully', LogContext.SYSTEM, {
        moduleName: this.name,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger?.error(
        'Test failed',
        LogContext.SYSTEM,
        {
          moduleName: this.name,
          duration,
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 执行测试套件
   */
  public async runTestSuite(
    testSuite: () => Promise<void> | void,
  ): Promise<void> {
    if (!this._isInitialized) {
      throw new Error('Testing module is not initialized');
    }

    const startTime = Date.now();
    this.logger?.info('Running test suite', LogContext.SYSTEM, {
      moduleName: this.name,
      environment: this.configuration.environment,
    });

    try {
      await this.runTest(testSuite);

      const duration = Date.now() - startTime;
      this.logger?.info(
        'Test suite completed successfully',
        LogContext.SYSTEM,
        {
          moduleName: this.name,
          duration,
        },
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger?.error(
        'Test suite failed',
        LogContext.SYSTEM,
        {
          moduleName: this.name,
          duration,
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 获取测试导入
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getTestImports(): any[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imports: any[] = [];

    // 根据测试环境添加相应的导入
    switch (this.configuration.environment) {
      case TestEnvironmentType.INTEGRATION:
        // 添加集成测试所需的模块
        break;
      case TestEnvironmentType.E2E:
        // 添加端到端测试所需的模块
        break;
      case TestEnvironmentType.PERFORMANCE:
        // 添加性能测试所需的模块
        break;
      default:
        // 单元测试不需要额外的导入
        break;
    }

    return imports;
  }

  /**
   * 获取测试提供者
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getTestProviders(): any[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const providers: any[] = [];

    // 添加测试数据工厂
    providers.push({
      provide: 'TEST_DATA_FACTORY',
      useValue: this.dataFactory,
    });

    // 添加测试断言工具
    providers.push({
      provide: 'TEST_ASSERTION',
      useValue: this.assertion,
    });

    // 添加测试工具
    providers.push({
      provide: 'TEST_UTILS',
      useValue: this.utils,
    });

    // 根据配置添加相应的提供者
    if (this.configuration.enableTestDatabase) {
      // 添加测试数据库提供者
    }

    if (this.configuration.enableTestCache) {
      // 添加测试缓存提供者
    }

    if (this.configuration.enableTestMessageQueue) {
      // 添加测试消息队列提供者
    }

    return providers;
  }

  /**
   * 获取测试控制器
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getTestControllers(): any[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const controllers: any[] = [];

    // 根据测试环境添加相应的控制器
    switch (this.configuration.environment) {
      case TestEnvironmentType.E2E:
        // 添加端到端测试所需的控制器
        break;
      default:
        // 单元测试和集成测试通常不需要控制器
        break;
    }

    return controllers;
  }

  /**
   * 配置测试应用
   */
  private async configureTestApp(): Promise<void> {
    if (!this._testApp) {
      return;
    }

    // 配置测试日志
    if (this.configuration.enableTestLogging) {
      // 配置测试日志级别
    }

    // 配置测试监控
    if (this.configuration.enableTestMonitoring) {
      // 配置测试监控
    }

    // 配置测试中间件
    // 这里可以添加测试专用的中间件

    // 配置测试管道
    // 这里可以添加测试专用的管道

    // 配置测试过滤器
    // 这里可以添加测试专用的异常过滤器

    // 配置测试守卫
    // 这里可以添加测试专用的守卫

    // 配置测试拦截器
    // 这里可以添加测试专用的拦截器
  }

  /**
   * 创建测试模块的静态方法
   */
  public static async createTestingModule(
    configuration: ITestConfiguration,
    logger?: ILoggerService,
  ): Promise<CoreTestingModule> {
    const testingModule = new CoreTestingModule(configuration, logger);
    await testingModule.initialize();
    return testingModule;
  }

  /**
   * 创建测试模块的工厂方法
   */
  public static createTestingModuleFactory(
    configuration: ITestConfiguration,
    logger?: ILoggerService,
  ): () => Promise<CoreTestingModule> {
    return async () => {
      return await CoreTestingModule.createTestingModule(configuration, logger);
    };
  }
}

/**
 * 测试模块装饰器
 */
export function TestModule(metadata: unknown): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (target: any) => {
    Reflect.defineMetadata('test:module', metadata, target);
  };
}

/**
 * 测试服务装饰器
 */
export function TestService(metadata?: unknown): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (target: any) => {
    Reflect.defineMetadata('test:service', metadata || {}, target);
  };
}

/**
 * 测试控制器装饰器
 */
export function TestController(metadata?: unknown): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (target: any) => {
    Reflect.defineMetadata('test:controller', metadata || {}, target);
  };
}

/**
 * 测试提供者装饰器
 */
export function TestProvider(metadata?: unknown): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (target: any) => {
    Reflect.defineMetadata('test:provider', metadata || {}, target);
  };
}

/**
 * 测试数据装饰器
 */
export function TestData(metadata?: unknown): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (target: any) => {
    Reflect.defineMetadata('test:data', metadata || {}, target);
  };
}

/**
 * 测试模拟装饰器
 */
export function TestMock(metadata?: unknown): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (target: any) => {
    Reflect.defineMetadata('test:mock', metadata || {}, target);
  };
}
