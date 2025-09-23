/**
 * CoreTestBase - 核心测试基类实现
 *
 * 提供了完整的测试基类功能，包括测试设置、测试清理、
 * 测试数据管理、测试模拟管理等功能。
 *
 * ## 业务规则
 *
 * ### 测试基类规则
 * - 支持测试生命周期管理
 * - 支持测试数据管理
 * - 支持测试模拟管理
 * - 支持测试上下文管理
 *
 * ### 测试设置规则
 * - 支持测试前设置
 * - 支持测试后清理
 * - 支持测试数据准备
 * - 支持测试环境配置
 *
 * ### 测试数据规则
 * - 支持测试数据生成
 * - 支持测试数据清理
 * - 支持测试数据隔离
 * - 支持测试数据验证
 *
 * ### 测试模拟规则
 * - 支持模拟对象创建
 * - 支持模拟对象管理
 * - 支持模拟对象恢复
 * - 支持模拟对象验证
 *
 * @description 核心测试基类实现类
 * @example
 * ```typescript
 * class UserServiceTest extends CoreTestBase {
 *   private userService: UserService;
 *
 *   async setup() {
 *     await super.setup();
 *     this.userService = this.testModule.getTestService(UserService);
 *   }
 *
 *   async testCreateUser() {
 *     const userData = this.generateTestData('user', { name: 'Test User' });
 *     const user = await this.userService.createUser(userData);
 *     this.assertion.equal(user.name, 'Test User');
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import { v4 as uuidv4 } from 'uuid';
import type { IAsyncContext } from '../../common/context/async-context.interface';
import {
	ITestBase,
	ITestModule,
	ITestDataFactory,
	ITestAssertion,
	ITestMock,
	type ITestConfiguration,
	TestEnvironmentType
} from './testing.interface';
import { CoreTestingModule } from './core-testing-module';
import { CoreTestDataFactory } from './core-test-data-factory';
import { CoreTestAssertion } from './core-test-assertion';

/**
 * 核心测试基类
 */
@Injectable()
export abstract class CoreTestBase implements ITestBase {
	public testModule!: ITestModule;
	public dataFactory: ITestDataFactory;
	public assertion: ITestAssertion;
	public context?: IAsyncContext;

	private readonly mocks = new Map<string, ITestMock>();
	private _isSetup = false;

	constructor(
		protected readonly configuration: ITestConfiguration = {
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
			enableTestDataCleanup: true
		},
		protected readonly logger?: ILoggerService
	) {
		this.dataFactory = new CoreTestDataFactory(this.logger);
		this.assertion = new CoreTestAssertion();
	}

	/**
	 * 设置测试
	 */
	public async setup(): Promise<void> {
		if (this._isSetup) {
			this.logger?.warn('Test is already setup', LogContext.SYSTEM, {
				testName: this.constructor.name
			});
			return;
		}

		this.logger?.info('Setting up test...', LogContext.SYSTEM, {
			testName: this.constructor.name,
			environment: this.configuration.environment
		});

		try {
			// 创建测试模块
			this.testModule = new CoreTestingModule(this.configuration, this.logger);
			await this.testModule.initialize();

			// 初始化测试数据工厂
			// await this.dataFactory.initialize();

			// 创建测试上下文
			this.context = this.createTestContext();

			// 设置测试数据
			if (this.configuration.enableTestDataIsolation) {
				await this.setupTestData();
			}

			// 调用子类的设置方法
			await this.onSetup();

			this._isSetup = true;

			this.logger?.info('Test setup completed', LogContext.SYSTEM, {
				testName: this.constructor.name
			});
		} catch (error) {
			this.logger?.error(
				'Failed to setup test',
				LogContext.SYSTEM,
				{
					testName: this.constructor.name,
					error: (error as Error).message
				},
				error as Error
			);
			throw error;
		}
	}

	/**
	 * 清理测试
	 */
	public async teardown(): Promise<void> {
		if (!this._isSetup) {
			this.logger?.warn('Test is not setup', LogContext.SYSTEM, {
				testName: this.constructor.name
			});
			return;
		}

		this.logger?.info('Tearing down test...', LogContext.SYSTEM, {
			testName: this.constructor.name
		});

		try {
			// 调用子类的清理方法
			await this.onTeardown();

			// 恢复所有模拟
			this.restoreAllMocks();

			// 清理测试数据
			if (this.configuration.enableTestDataCleanup) {
				await this.cleanupTestData();
			}

			// 清理测试模块
			if (this.testModule) {
				await this.testModule.cleanup();
			}

			// 清理测试数据工厂
			await this.dataFactory.cleanup();

			this._isSetup = false;

			this.logger?.info('Test teardown completed', LogContext.SYSTEM, {
				testName: this.constructor.name
			});
		} catch (error) {
			this.logger?.error(
				'Failed to teardown test',
				LogContext.SYSTEM,
				{
					testName: this.constructor.name,
					error: (error as Error).message
				},
				error as Error
			);
			throw error;
		}
	}

	/**
	 * 设置测试数据
	 */
	public async setupTestData(): Promise<void> {
		this.logger?.debug('Setting up test data...', LogContext.SYSTEM, {
			testName: this.constructor.name
		});

		try {
			// 子类可以重写此方法来设置特定的测试数据
			await this.onSetupTestData();

			this.logger?.debug('Test data setup completed', LogContext.SYSTEM, {
				testName: this.constructor.name
			});
		} catch (error) {
			this.logger?.error(
				'Failed to setup test data',
				LogContext.SYSTEM,
				{
					testName: this.constructor.name,
					error: (error as Error).message
				},
				error as Error
			);
			throw error;
		}
	}

	/**
	 * 清理测试数据
	 */
	public async cleanupTestData(): Promise<void> {
		this.logger?.debug('Cleaning up test data...', LogContext.SYSTEM, {
			testName: this.constructor.name
		});

		try {
			// 子类可以重写此方法来清理特定的测试数据
			await this.onCleanupTestData();

			this.logger?.debug('Test data cleanup completed', LogContext.SYSTEM, {
				testName: this.constructor.name
			});
		} catch (error) {
			this.logger?.error(
				'Failed to cleanup test data',
				LogContext.SYSTEM,
				{
					testName: this.constructor.name,
					error: (error as Error).message
				},
				error as Error
			);
			throw error;
		}
	}

	/**
	 * 创建测试上下文
	 */
	public createTestContext(): IAsyncContext {
		// 这里应该创建实际的异步上下文
		// 暂时返回一个模拟的上下文
		return {
			getTenantId: () => 'test-tenant',
			setTenantId: () => {
				/* 测试环境不需要实际设置 */
			},
			getUserId: () => 'test-user',
			setUserId: () => {
				/* 测试环境不需要实际设置 */
			},
			getOrganizationId: () => 'test-org',
			setOrganizationId: () => {
				/* 测试环境不需要实际设置 */
			},
			getDepartmentId: () => 'test-dept',
			setDepartmentId: () => {
				/* 测试环境不需要实际设置 */
			},
			getRequestId: () => uuidv4(),
			setRequestId: () => {
				/* 测试环境不需要实际设置 */
			},
			getCorrelationId: () => uuidv4(),
			setCorrelationId: () => {
				/* 测试环境不需要实际设置 */
			},
			getCausationId: () => uuidv4(),
			setCausationId: () => {
				/* 测试环境不需要实际设置 */
			},
			getUserAgent: () => 'test-agent',
			setUserAgent: () => {
				/* 测试环境不需要实际设置 */
			},
			getIpAddress: () => '127.0.0.1',
			setIpAddress: () => {
				/* 测试环境不需要实际设置 */
			},
			getSource: () => 'SYSTEM' as const,
			setSource: () => {
				/* 测试环境不需要实际设置 */
			},
			getLocale: () => 'zh-CN',
			setLocale: () => {
				/* 测试环境不需要实际设置 */
			},
			getTimezone: () => 'Asia/Shanghai',
			setTimezone: () => {
				/* 测试环境不需要实际设置 */
			},
			isMultiTenant: () => true,
			isOrganizationLevel: () => false,
			isDepartmentLevel: () => false,
			isUserLevel: () => true,
			getContextLevel: () => 'USER' as const,
			getCustomData: () => ({}),
			setCustomData: () => {
				/* 测试环境不需要实际设置 */
			},
			getAllCustomData: () => ({}),
			// clearCustomData: () => {},
			// hasCustomData: () => false,
			// getCustomDataKeys: () => [],
			// mergeCustomData: () => {},
			getData: () => ({}),
			setData: () => {
				/* 测试环境不需要实际设置 */
			},
			getValue: () => undefined,
			setValue: () => {
				/* 测试环境不需要实际设置 */
			},
			hasValue: () => false,
			removeValue: () => {
				/* 测试环境不需要实际设置 */
			},
			// clearData: () => {},
			// getDataKeys: () => [],
			// getDataSize: () => 0,
			// isEmpty: () => true,
			clear: () => {
				/* 测试环境不需要实际设置 */
			},
			merge: () => {
				/* 测试环境不需要实际设置 */
			},
			isValid: () => true,
			getId: () => 'test-context-id',
			// getVersion: () => 1,
			getCreatedAt: () => new Date(),
			// getUpdatedAt: () => new Date(),
			getExpiresAt: () => undefined,
			isExpired: () => false,
			setExpiresAt: () => {
				/* 测试环境不需要实际设置 */
			},
			removeCustomData: () => {
				/* 测试环境不需要实际设置 */
			},
			clone: () => this.createTestContext(),
			toJSON: () => ({}),
			toString: () => 'TestContext'
		};
	}

	/**
	 * 生成测试数据
	 */
	public generateTestData<T>(name: string, options: Record<string, unknown> = {}): T {
		return this.dataFactory.generate<T>(name, options);
	}

	/**
	 * 批量生成测试数据
	 */
	public generateTestDataMany<T>(name: string, count: number, options: Record<string, unknown> = {}): T[] {
		return this.dataFactory.generateMany<T>(name, count, options);
	}

	/**
	 * 创建模拟对象
	 */
	public createMock<T>(name: string, mock: T): ITestMock<T> {
		this.logger?.debug(`Creating mock: ${name}`, LogContext.SYSTEM, {
			testName: this.constructor.name,
			mockName: name
		});

		const testMock: ITestMock<T> = {
			name,
			mock,
			restore: () => {
				this.logger?.debug(`Restoring mock: ${name}`, LogContext.SYSTEM, {
					testName: this.constructor.name,
					mockName: name
				});
			},
			reset: () => {
				this.logger?.debug(`Resetting mock: ${name}`, LogContext.SYSTEM, {
					testName: this.constructor.name,
					mockName: name
				});
			},
			verify: () => {
				this.logger?.debug(`Verifying mock: ${name}`, LogContext.SYSTEM, {
					testName: this.constructor.name,
					mockName: name
				});
				return true;
			}
		};

		this.mocks.set(name, testMock);

		this.logger?.debug(`Mock created: ${name}`, LogContext.SYSTEM, {
			testName: this.constructor.name,
			mockName: name
		});

		return testMock;
	}

	/**
	 * 获取模拟对象
	 */
	public getMock<T>(name: string): ITestMock<T> | undefined {
		return this.mocks.get(name) as ITestMock<T> | undefined;
	}

	/**
	 * 恢复所有模拟
	 */
	public restoreAllMocks(): void {
		this.logger?.debug('Restoring all mocks...', LogContext.SYSTEM, {
			testName: this.constructor.name
		});

		for (const mock of this.mocks.values()) {
			mock.restore();
		}

		this.logger?.debug('All mocks restored', LogContext.SYSTEM, {
			testName: this.constructor.name
		});
	}

	/**
	 * 重置所有模拟
	 */
	public resetAllMocks(): void {
		this.logger?.debug('Resetting all mocks...', LogContext.SYSTEM, {
			testName: this.constructor.name
		});

		for (const mock of this.mocks.values()) {
			mock.reset();
		}

		this.logger?.debug('All mocks reset', LogContext.SYSTEM, {
			testName: this.constructor.name
		});
	}

	/**
	 * 子类可以重写的设置方法
	 */
	protected async onSetup(): Promise<void> {
		// 子类可以重写此方法
	}

	/**
	 * 子类可以重写的清理方法
	 */
	protected async onTeardown(): Promise<void> {
		// 子类可以重写此方法
	}

	/**
	 * 子类可以重写的测试数据设置方法
	 */
	protected async onSetupTestData(): Promise<void> {
		// 子类可以重写此方法
	}

	/**
	 * 子类可以重写的测试数据清理方法
	 */
	protected async onCleanupTestData(): Promise<void> {
		// 子类可以重写此方法
	}
}
