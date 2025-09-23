/**
 * 异常处理集成示例
 *
 * 展示如何使用新的异常处理架构进行完整的异常处理
 *
 * @description 异常处理集成示例
 * @since 2.0.0
 */

import { Injectable, Controller, Get, Post, Body, Param, Module } from '@nestjs/common';
import { UnifiedExceptionManager } from '../core';
import { ExceptionStrategyManager } from '../strategies';
import { CoreErrorBusBridge } from '../bridges';
import { ExceptionConfigService } from '../config';
import { ExceptionHandlingModule } from '../nestjs';
import { IUnifiedException, ExceptionCategory, ExceptionLevel } from '../interfaces';

/**
 * 用户服务集成示例
 *
 * 展示如何在业务服务中使用新的异常处理架构
 */
@Injectable()
export class UserServiceIntegration {
	constructor(
		private readonly exceptionManager: UnifiedExceptionManager,
		private readonly strategyManager: ExceptionStrategyManager,
		private readonly coreErrorBusBridge: CoreErrorBusBridge,
		private readonly configService: ExceptionConfigService
	) {}

	/**
	 * 获取用户信息
	 *
	 * @param userId 用户ID
	 * @returns 用户信息
	 */
	async getUser(userId: string): Promise<any> {
		try {
			// 模拟业务逻辑
			if (!userId) {
				throw new Error('User ID is required');
			}

			if (userId === 'not-found') {
				throw new Error('User not found');
			}

			if (userId === 'database-error') {
				throw new Error('Database connection failed');
			}

			if (userId === 'network-error') {
				throw new Error('Network timeout');
			}

			return {
				id: userId,
				name: 'John Doe',
				email: 'john@example.com',
				createdAt: new Date()
			};
		} catch (error) {
			// 使用统一异常管理器处理异常
			const context = {
				requestId: this.generateRequestId(),
				tenantId: 'tenant-001',
				userId: userId,
				operation: 'getUser',
				service: 'UserService'
			};

			const result = await this.exceptionManager.handleException(error, context);

			if (!result.success) {
				// 如果异常处理失败，记录错误并重新抛出
				console.error('Exception handling failed:', result.error);
			}

			// 重新抛出原始异常
			throw error;
		}
	}

	/**
	 * 创建用户
	 *
	 * @param userData 用户数据
	 * @returns 创建的用户
	 */
	async createUser(userData: any): Promise<any> {
		try {
			// 模拟业务逻辑
			if (!userData.name) {
				throw new Error('Name is required');
			}

			if (!userData.email) {
				throw new Error('Email is required');
			}

			if (userData.email === 'duplicate@example.com') {
				throw new Error('Email already exists');
			}

			return {
				id: this.generateUserId(),
				...userData,
				createdAt: new Date()
			};
		} catch (error) {
			// 使用统一异常管理器处理异常
			const context = {
				requestId: this.generateRequestId(),
				tenantId: 'tenant-001',
				operation: 'createUser',
				service: 'UserService',
				data: userData
			};

			const result = await this.exceptionManager.handleException(error, context);

			if (!result.success) {
				console.error('Exception handling failed:', result.error);
			}

			// 重新抛出原始异常
			throw error;
		}
	}

	/**
	 * 更新用户信息
	 *
	 * @param userId 用户ID
	 * @param userData 用户数据
	 * @returns 更新后的用户
	 */
	async updateUser(userId: string, userData: any): Promise<any> {
		try {
			// 模拟业务逻辑
			if (!userId) {
				throw new Error('User ID is required');
			}

			if (userId === 'not-found') {
				throw new Error('User not found');
			}

			if (userId === 'locked') {
				throw new Error('User account is locked');
			}

			return {
				id: userId,
				...userData,
				updatedAt: new Date()
			};
		} catch (error) {
			// 使用统一异常管理器处理异常
			const context = {
				requestId: this.generateRequestId(),
				tenantId: 'tenant-001',
				userId: userId,
				operation: 'updateUser',
				service: 'UserService',
				data: userData
			};

			const result = await this.exceptionManager.handleException(error, context);

			if (!result.success) {
				console.error('Exception handling failed:', result.error);
			}

			// 重新抛出原始异常
			throw error;
		}
	}

	/**
	 * 删除用户
	 *
	 * @param userId 用户ID
	 * @returns 删除结果
	 */
	async deleteUser(userId: string): Promise<any> {
		try {
			// 模拟业务逻辑
			if (!userId) {
				throw new Error('User ID is required');
			}

			if (userId === 'not-found') {
				throw new Error('User not found');
			}

			if (userId === 'admin') {
				throw new Error('Cannot delete admin user');
			}

			return {
				id: userId,
				deleted: true,
				deletedAt: new Date()
			};
		} catch (error) {
			// 使用统一异常管理器处理异常
			const context = {
				requestId: this.generateRequestId(),
				tenantId: 'tenant-001',
				userId: userId,
				operation: 'deleteUser',
				service: 'UserService'
			};

			const result = await this.exceptionManager.handleException(error, context);

			if (!result.success) {
				console.error('Exception handling failed:', result.error);
			}

			// 重新抛出原始异常
			throw error;
		}
	}

	/**
	 * 生成请求ID
	 *
	 * @returns 请求ID
	 */
	private generateRequestId(): string {
		return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * 生成用户ID
	 *
	 * @returns 用户ID
	 */
	private generateUserId(): string {
		return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}

/**
 * 用户控制器集成示例
 *
 * 展示如何在NestJS控制器中使用新的异常处理架构
 */
@Controller('users')
export class UserControllerIntegration {
	constructor(private readonly userService: UserServiceIntegration) {}

	/**
	 * 获取用户信息
	 *
	 * @param id 用户ID
	 * @returns 用户信息
	 */
	@Get(':id')
	async getUser(@Param('id') id: string) {
		return await this.userService.getUser(id);
	}

	/**
	 * 创建用户
	 *
	 * @param userData 用户数据
	 * @returns 创建的用户
	 */
	@Post()
	async createUser(@Body() userData: any) {
		return await this.userService.createUser(userData);
	}

	/**
	 * 更新用户信息
	 *
	 * @param id 用户ID
	 * @param userData 用户数据
	 * @returns 更新后的用户
	 */
	@Post(':id')
	async updateUser(@Param('id') id: string, @Body() userData: any) {
		return await this.userService.updateUser(id, userData);
	}

	/**
	 * 删除用户
	 *
	 * @param id 用户ID
	 * @returns 删除结果
	 */
	@Post(':id/delete')
	async deleteUser(@Param('id') id: string) {
		return await this.userService.deleteUser(id);
	}
}

/**
 * 应用模块集成示例
 *
 * 展示如何配置异常处理模块进行集成
 */
@Module({
	imports: [
		// 全局注册异常处理模块
		ExceptionHandlingModule.forRoot({
			enableGlobalFilter: true,
			enableGlobalInterceptor: true,
			enableMonitoring: true,
			enableStatistics: true,
			enableRecovery: true,
			enableClassification: true
		})
	],
	providers: [UserServiceIntegration],
	controllers: [UserControllerIntegration]
})
export class AppModuleIntegration {}

/**
 * 异常处理集成测试示例
 *
 * 展示如何测试异常处理集成
 */
export class ExceptionHandlingIntegrationTest {
	private exceptionManager: UnifiedExceptionManager;
	private strategyManager: ExceptionStrategyManager;
	private coreErrorBusBridge: CoreErrorBusBridge;
	private configService: ExceptionConfigService;

	constructor() {
		// 初始化组件
		this.configService = new ExceptionConfigService(null as any, null as any);
		this.coreErrorBusBridge = new CoreErrorBusBridge(null as any, null as any);
		this.strategyManager = new ExceptionStrategyManager();
		this.exceptionManager = new UnifiedExceptionManager(null as any, this.configService, null as any, null as any);
	}

	/**
	 * 测试HTTP异常处理
	 */
	async testHttpExceptionHandling() {
		const httpException: IUnifiedException = {
			id: 'exc-test-001',
			message: 'Bad Request',
			category: ExceptionCategory.HTTP,
			level: ExceptionLevel.ERROR,
			statusCode: 400,
			timestamp: new Date(),
			context: {
				requestId: 'req-test-001',
				tenantId: 'tenant-001',
				userId: 'user-001'
			}
		};

		const results = await this.strategyManager.handleException(httpException);

		// console.log('HTTP异常处理结果:', results);

		const successfulResult = results.find((r) => r.success && r.handled);
		expect(successfulResult).toBeDefined();
		expect(successfulResult?.strategy).toBe('http-exception-strategy');
	}

	/**
	 * 测试应用层异常处理
	 */
	async testApplicationExceptionHandling() {
		const appException: IUnifiedException = {
			id: 'exc-test-002',
			message: 'User not found',
			category: ExceptionCategory.APPLICATION,
			level: ExceptionLevel.ERROR,
			code: 'USER_NOT_FOUND',
			timestamp: new Date(),
			context: {
				requestId: 'req-test-002',
				tenantId: 'tenant-001',
				userId: 'user-001'
			}
		};

		const results = await this.strategyManager.handleException(appException);

		// console.log('应用层异常处理结果:', results);

		const successfulResult = results.find((r) => r.success && r.handled);
		expect(successfulResult).toBeDefined();
		expect(successfulResult?.strategy).toBe('application-exception-strategy');
	}

	/**
	 * 测试数据库异常处理
	 */
	async testDatabaseExceptionHandling() {
		const dbException: IUnifiedException = {
			id: 'exc-test-003',
			message: 'Connection timeout',
			category: ExceptionCategory.DATABASE,
			level: ExceptionLevel.ERROR,
			code: 'DB_CONNECTION_TIMEOUT',
			timestamp: new Date(),
			context: {
				requestId: 'req-test-003',
				tenantId: 'tenant-001',
				userId: 'user-001',
				database: 'postgresql',
				table: 'users',
				operation: 'SELECT'
			}
		};

		const results = await this.strategyManager.handleException(dbException);

		// console.log('数据库异常处理结果:', results);

		const successfulResult = results.find((r) => r.success && r.handled);
		expect(successfulResult).toBeDefined();
		expect(successfulResult?.strategy).toBe('database-exception-strategy');
	}

	/**
	 * 测试网络异常处理
	 */
	async testNetworkExceptionHandling() {
		const networkException: IUnifiedException = {
			id: 'exc-test-004',
			message: 'Network timeout',
			category: ExceptionCategory.NETWORK,
			level: ExceptionLevel.ERROR,
			code: 'NETWORK_TIMEOUT',
			timestamp: new Date(),
			context: {
				requestId: 'req-test-004',
				tenantId: 'tenant-001',
				userId: 'user-001',
				endpoint: 'https://api.example.com',
				method: 'GET',
				timeout: 5000
			}
		};

		const results = await this.strategyManager.handleException(networkException);

		// console.log('网络异常处理结果:', results);

		const successfulResult = results.find((r) => r.success && r.handled);
		expect(successfulResult).toBeDefined();
		expect(successfulResult?.strategy).toBe('network-exception-strategy');
	}

	/**
	 * 运行所有测试
	 */
	async runAllTests() {
		// console.log('开始运行异常处理集成测试...');

		try {
			await this.testHttpExceptionHandling();
			// console.log('✅ HTTP异常处理测试通过');

			await this.testApplicationExceptionHandling();
			// console.log('✅ 应用层异常处理测试通过');

			await this.testDatabaseExceptionHandling();
			// console.log('✅ 数据库异常处理测试通过');

			await this.testNetworkExceptionHandling();
			// console.log('✅ 网络异常处理测试通过');

			// console.log('🎉 所有异常处理集成测试通过！');
		} catch (error) {
			console.error('❌ 异常处理集成测试失败:', error);
			throw error;
		}
	}
}

/**
 * 异常处理集成配置示例
 *
 * 展示如何配置异常处理集成
 */
export const exceptionHandlingIntegrationConfig = {
	// 全局配置
	global: {
		enableTenantIsolation: true,
		enableErrorBusIntegration: true,
		enableSwaggerIntegration: true,
		defaultHandlingStrategy: 'HTTP',
		enableMetrics: true,
		enableTracing: true
	},

	// HTTP配置
	http: {
		enableRFC7807: true,
		includeStackTrace: false,
		enableCORS: true,
		defaultErrorMessage: 'An error occurred'
	},

	// 日志配置
	logging: {
		enableStructuredLogging: true,
		logLevel: 'ERROR',
		enableSensitiveDataMasking: true
	},

	// 恢复配置
	recovery: {
		enableAutoRecovery: true,
		maxRetryAttempts: 3,
		retryDelay: 1000,
		enableCircuitBreaker: true
	},

	// 监控配置
	monitoring: {
		enableMetrics: true,
		metricsInterval: 60000,
		enableHealthChecks: true,
		enableAlerts: true
	}
};

/**
 * 异常处理集成使用示例
 *
 * 展示如何在实际应用中使用异常处理集成
 */
export class ExceptionHandlingIntegrationUsage {
	private userService: UserServiceIntegration;

	constructor() {
		// 初始化用户服务
		this.userService = new UserServiceIntegration(
			null as any, // exceptionManager
			null as any, // strategyManager
			null as any, // coreErrorBusBridge
			null as any // configService
		);
	}

	/**
	 * 示例：处理用户获取异常
	 */
	async handleGetUserException() {
		try {
			await this.userService.getUser('not-found');
			// console.log('用户信息:', user);
		} catch {
			// console.log('捕获到异常:', error.message);
		}
	}

	/**
	 * 示例：处理用户创建异常
	 */
	async handleCreateUserException() {
		try {
			await this.userService.createUser({
				name: 'John Doe',
				email: 'duplicate@example.com'
			});
			// console.log('创建的用户:', user);
		} catch {
			// console.log('捕获到异常:', error.message);
		}
	}

	/**
	 * 示例：处理用户更新异常
	 */
	async handleUpdateUserException() {
		try {
			await this.userService.updateUser('locked', {
				name: 'Updated Name'
			});
			// console.log('更新的用户:', user);
		} catch {
			// console.log('捕获到异常:', error.message);
		}
	}

	/**
	 * 示例：处理用户删除异常
	 */
	async handleDeleteUserException() {
		try {
			await this.userService.deleteUser('admin');
			// console.log('删除结果:', result);
		} catch {
			// console.log('捕获到异常:', error.message);
		}
	}

	/**
	 * 运行所有示例
	 */
	async runAllExamples() {
		// console.log('开始运行异常处理集成示例...');

		await this.handleGetUserException();
		await this.handleCreateUserException();
		await this.handleUpdateUserException();
		await this.handleDeleteUserException();

		// console.log('🎉 所有异常处理集成示例完成！');
	}
}
