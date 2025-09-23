/**
 * 测试支持接口定义
 *
 * 定义了测试支持系统的核心接口，包括测试模块、测试工具、
 * 测试基类、测试数据生成等功能。
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
 * @description 测试支持接口定义
 * @since 1.0.0
 */

import { Type } from '@nestjs/common';
import type { IAsyncContext } from '../../common/context/async-context.interface';

/**
 * 测试环境类型枚举
 */
export enum TestEnvironmentType {
  /**
   * 单元测试
   */
  UNIT = 'unit',

  /**
   * 集成测试
   */
  INTEGRATION = 'integration',

  /**
   * 端到端测试
   */
  E2E = 'e2e',

  /**
   * 性能测试
   */
  PERFORMANCE = 'performance',

  /**
   * 负载测试
   */
  LOAD = 'load',

  /**
   * 压力测试
   */
  STRESS = 'stress',
}

/**
 * 测试数据生成器接口
 */
export interface ITestDataGenerator<T = any> {
  /**
   * 生成器名称
   */
  name: string;

  /**
   * 生成测试数据
   */
  generate(options?: Record<string, unknown>): T;

  /**
   * 批量生成测试数据
   */
  generateMany(count: number, options?: Record<string, unknown>): T[];

  /**
   * 生成测试数据序列
   */
  generateSequence(count: number, options?: Record<string, unknown>): T[];
}

/**
 * 测试数据工厂接口
 */
export interface ITestDataFactory {
  /**
   * 注册数据生成器
   */
  registerGenerator<T>(name: string, generator: ITestDataGenerator<T>): void;

  /**
   * 获取数据生成器
   */
  getGenerator<T>(name: string): ITestDataGenerator<T> | undefined;

  /**
   * 生成测试数据
   */
  generate<T>(name: string, options?: Record<string, unknown>): T;

  /**
   * 批量生成测试数据
   */
  generateMany<T>(
    name: string,
    count: number,
    options?: Record<string, unknown>,
  ): T[];

  /**
   * 清理测试数据
   */
  cleanup(): Promise<void>;
}

/**
 * 测试模拟器接口
 */
export interface ITestMock<T = any> {
  /**
   * 模拟器名称
   */
  name: string;

  /**
   * 模拟对象
   */
  mock: T;

  /**
   * 恢复模拟
   */
  restore(): void;

  /**
   * 重置模拟
   */
  reset(): void;

  /**
   * 验证调用
   */
  verify(): boolean;
}

/**
 * 测试断言工具接口
 */
export interface ITestAssertion {
  /**
   * 断言相等
   */
  equal<T>(actual: T, expected: T, message?: string): void;

  /**
   * 断言不相等
   */
  notEqual<T>(actual: T, expected: T, message?: string): void;

  /**
   * 断言为真
   */
  true(actual: boolean, message?: string): void;

  /**
   * 断言为假
   */
  false(actual: boolean, message?: string): void;

  /**
   * 断言为null
   */
  null(actual: any, message?: string): void;

  /**
   * 断言不为null
   */
  notNull(actual: any, message?: string): void;

  /**
   * 断言为undefined
   */
  undefined(actual: any, message?: string): void;

  /**
   * 断言不为undefined
   */
  notUndefined(actual: any, message?: string): void;

  /**
   * 断言抛出异常
   */
  throws(fn: () => void, message?: string): void;

  /**
   * 断言不抛出异常
   */
  notThrows(fn: () => void, message?: string): void;

  /**
   * 断言包含
   */
  contains<T>(array: T[], item: T, message?: string): void;

  /**
   * 断言不包含
   */
  notContains<T>(array: T[], item: T, message?: string): void;

  /**
   * 断言匹配正则表达式
   */
  match(actual: string, pattern: RegExp, message?: string): void;

  /**
   * 断言不匹配正则表达式
   */
  notMatch(actual: string, pattern: RegExp, message?: string): void;
}

/**
 * 测试配置接口
 */
export interface ITestConfiguration {
  /**
   * 测试环境类型
   */
  environment: TestEnvironmentType;

  /**
   * 是否启用测试数据库
   */
  enableTestDatabase: boolean;

  /**
   * 测试数据库配置
   */
  testDatabase?: {
    type: string;
    host: string;
    port: number;
    database: string;
    username?: string;
    password?: string;
  };

  /**
   * 是否启用测试缓存
   */
  enableTestCache: boolean;

  /**
   * 测试缓存配置
   */
  testCache?: {
    type: string;
    host: string;
    port: number;
    database?: number;
  };

  /**
   * 是否启用测试消息队列
   */
  enableTestMessageQueue: boolean;

  /**
   * 测试消息队列配置
   */
  testMessageQueue?: {
    type: string;
    host: string;
    port: number;
    database?: number;
  };

  /**
   * 是否启用测试日志
   */
  enableTestLogging: boolean;

  /**
   * 测试日志级别
   */
  testLogLevel: string;

  /**
   * 是否启用测试监控
   */
  enableTestMonitoring: boolean;

  /**
   * 测试超时时间（毫秒）
   */
  testTimeout: number;

  /**
   * 是否启用并行测试
   */
  enableParallelTests: boolean;

  /**
   * 并行测试数量
   */
  parallelTestCount: number;

  /**
   * 是否启用测试覆盖率
   */
  enableTestCoverage: boolean;

  /**
   * 测试覆盖率阈值
   */
  testCoverageThreshold: number;

  /**
   * 是否启用测试数据隔离
   */
  enableTestDataIsolation: boolean;

  /**
   * 是否启用测试数据清理
   */
  enableTestDataCleanup: boolean;
}

/**
 * 测试模块接口
 */
export interface ITestModule {
  /**
   * 测试模块名称
   */
  name: string;

  /**
   * 测试配置
   */
  configuration: ITestConfiguration;

  /**
   * 初始化测试模块
   */
  initialize(): Promise<void>;

  /**
   * 清理测试模块
   */
  cleanup(): Promise<void>;

  /**
   * 获取测试应用
   */
  getTestApp(): any;

  /**
   * 获取测试模块
   */
  getTestModule(): any;

  /**
   * 获取测试服务
   */
  getTestService<T>(service: Type<T>): T;

  /**
   * 获取测试仓库
   */
  getTestRepository<T>(repository: Type<T>): T;

  /**
   * 执行测试
   */
  runTest(testFn: () => Promise<void> | void): Promise<void>;

  /**
   * 执行测试套件
   */
  runTestSuite(testSuite: () => Promise<void> | void): Promise<void>;
}

/**
 * 测试基类接口
 */
export interface ITestBase {
  /**
   * 测试模块
   */
  testModule: ITestModule;

  /**
   * 测试数据工厂
   */
  dataFactory: ITestDataFactory;

  /**
   * 测试断言工具
   */
  assertion: ITestAssertion;

  /**
   * 测试上下文
   */
  context?: IAsyncContext;

  /**
   * 设置测试
   */
  setup(): Promise<void>;

  /**
   * 清理测试
   */
  teardown(): Promise<void>;

  /**
   * 设置测试数据
   */
  setupTestData(): Promise<void>;

  /**
   * 清理测试数据
   */
  cleanupTestData(): Promise<void>;

  /**
   * 创建测试上下文
   */
  createTestContext(): IAsyncContext;

  /**
   * 生成测试数据
   */
  generateTestData<T>(name: string, options?: Record<string, unknown>): T;

  /**
   * 批量生成测试数据
   */
  generateTestDataMany<T>(
    name: string,
    count: number,
    options?: Record<string, unknown>,
  ): T[];

  /**
   * 创建模拟对象
   */
  createMock<T>(name: string, mock: T): ITestMock<T>;

  /**
   * 获取模拟对象
   */
  getMock<T>(name: string): ITestMock<T> | undefined;

  /**
   * 恢复所有模拟
   */
  restoreAllMocks(): void;

  /**
   * 重置所有模拟
   */
  resetAllMocks(): void;
}

/**
 * 测试工具接口
 */
export interface ITestUtils {
  /**
   * 等待指定时间
   */
  wait(ms: number): Promise<void>;

  /**
   * 等待条件满足
   */
  waitFor(
    condition: () => boolean,
    timeout?: number,
    interval?: number,
  ): Promise<void>;

  /**
   * 重试操作
   */
  retry<T>(
    operation: () => Promise<T> | T,
    maxAttempts?: number,
    delay?: number,
  ): Promise<T>;

  /**
   * 捕获异常
   */
  catchError(fn: () => void): Error | undefined;

  /**
   * 捕获异步异常
   */
  catchAsyncError(fn: () => Promise<void>): Promise<Error | undefined>;

  /**
   * 生成随机字符串
   */
  randomString(length?: number): string;

  /**
   * 生成随机数字
   */
  randomNumber(min?: number, max?: number): number;

  /**
   * 生成随机布尔值
   */
  randomBoolean(): boolean;

  /**
   * 生成随机日期
   */
  randomDate(start?: Date, end?: Date): Date;

  /**
   * 生成随机UUID
   */
  randomUuid(): string;

  /**
   * 生成随机邮箱
   */
  randomEmail(): string;

  /**
   * 生成随机手机号
   */
  randomPhone(): string;

  /**
   * 生成随机IP地址
   */
  randomIpAddress(): string;

  /**
   * 生成随机URL
   */
  randomUrl(): string;

  /**
   * 生成随机JSON
   */
  randomJson(): Record<string, unknown>;

  /**
   * 深度克隆对象
   */
  deepClone<T>(obj: T): T;

  /**
   * 深度比较对象
   */
  deepEqual<T>(obj1: T, obj2: T): boolean;

  /**
   * 格式化测试数据
   */
  formatTestData(data: any): string;

  /**
   * 创建测试快照
   */
  createSnapshot<T>(data: T): string;

  /**
   * 比较测试快照
   */
  compareSnapshot<T>(data: T, snapshot: string): boolean;
}
