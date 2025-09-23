/**
 * 异常处理使用示例
 *
 * 展示如何使用新的异常处理架构，包括：
 * - 统一异常管理器
 * - 策略系统
 * - NestJS集成
 * - Core模块集成
 *
 * @description 异常处理架构使用示例
 * @since 2.0.0
 */

import { Injectable, Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UnifiedExceptionManager } from '../core';
import { ExceptionStrategyManager } from '../strategies';
import { CoreErrorBusBridge } from '../bridges';
import { ExceptionHandlingModule } from '../nestjs';
import { IUnifiedException } from '../interfaces';

/**
 * 用户服务示例
 *
 * 展示如何在业务服务中使用异常处理
 */
@Injectable()
export class UserService {
	constructor(
		private readonly exceptionManager: UnifiedExceptionManager,
		private readonly strategyManager: ExceptionStrategyManager,
		private readonly coreErrorBusBridge: CoreErrorBusBridge
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

			return {
				id: userId,
				name: 'John Doe',
				email: 'john@example.com'
			};
		} catch (error) {
			// 使用统一异常管理器处理异常
			const context = {
				requestId: 'req-001',
				tenantId: 'tenant-001',
				userId: userId,
				operation: 'getUser'
			};

			const unifiedException = await this.exceptionManager.transformException(error, context);

			// 发布到Core错误总线
			await this.coreErrorBusBridge.publishToCoreErrorBus(unifiedException);

			// 应用策略处理
			await this.strategyManager.handleException(unifiedException);

			// 重新抛出异常
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

			return {
				id: 'user-001',
				...userData,
				createdAt: new Date()
			};
		} catch (error) {
			// 使用统一异常管理器处理异常
			const context = {
				requestId: 'req-002',
				tenantId: 'tenant-001',
				operation: 'createUser',
				data: userData
			};

			const unifiedException = await this.exceptionManager.transformException(error, context);

			// 发布到Core错误总线
			await this.coreErrorBusBridge.publishToCoreErrorBus(unifiedException);

			// 应用策略处理
			await this.strategyManager.handleException(unifiedException);

			// 重新抛出异常
			throw error;
		}
	}
}

/**
 * 用户控制器示例
 *
 * 展示如何在NestJS控制器中使用异常处理
 */
@Controller('users')
export class UserController {
	constructor(private readonly userService: UserService) {}

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
}

/**
 * 应用模块示例
 *
 * 展示如何配置异常处理模块
 */
export class AppModule {
	static forRoot() {
		return {
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
			providers: [UserService],
			controllers: [UserController]
		};
	}
}

/**
 * 异常处理配置示例
 *
 * 展示如何配置异常处理选项
 */
export const exceptionHandlingConfig = {
	// 全局配置
	global: {
		enableMonitoring: true,
		enableStatistics: true,
		enableRecovery: true,
		enableClassification: true,
		timeout: 5000
	},

	// 策略配置
	strategies: {
		http: {
			enabled: true,
			priority: 10,
			timeout: 3000
		},
		application: {
			enabled: true,
			priority: 20,
			timeout: 5000
		},
		database: {
			enabled: true,
			priority: 30,
			timeout: 10000
		},
		network: {
			enabled: true,
			priority: 40,
			timeout: 8000
		}
	},

	// 监控配置
	monitoring: {
		enablePerformanceTracking: true,
		enableErrorTracking: true,
		enableCustomMetrics: true,
		metricsInterval: 60000
	},

	// 统计配置
	statistics: {
		enableRealTimeStats: true,
		enableHistoricalStats: true,
		statsRetentionDays: 30
	}
};

/**
 * 自定义异常处理策略示例
 *
 * 展示如何创建自定义异常处理策略
 */
export class CustomBusinessExceptionStrategy extends ExceptionStrategyManager {
	constructor() {
		super();
	}

	/**
	 * 处理业务异常
	 *
	 * @param exception 异常信息
	 * @returns 处理结果
	 */
	async handleBusinessException(exception: IUnifiedException): Promise<any> {
		// 自定义业务异常处理逻辑
		if (exception.code === 'BUSINESS_RULE_VIOLATION') {
			return {
				success: true,
				handled: true,
				response: {
					errorType: 'BUSINESS_ERROR',
					message: '业务规则违反',
					recoveryAdvice: '请检查输入数据并重试',
					retryable: true,
					retryAfter: 5000
				}
			};
		}

		return {
			success: false,
			handled: false,
			error: 'Cannot handle this business exception'
		};
	}
}

/**
 * 异常处理使用示例
 *
 * 展示如何在实际应用中使用异常处理
 */
export class ExceptionHandlingUsageExample {
	private exceptionManager: UnifiedExceptionManager;
	private strategyManager: ExceptionStrategyManager;
	private coreErrorBusBridge: CoreErrorBusBridge;

	constructor() {
		this.exceptionManager = new UnifiedExceptionManager();
		this.strategyManager = new ExceptionStrategyManager();
		this.coreErrorBusBridge = new CoreErrorBusBridge();
	}

	/**
	 * 示例：处理HTTP异常
	 */
	async handleHttpException() {
		const httpException = new Error('Bad Request');
		const context = {
			requestId: 'req-001',
			tenantId: 'tenant-001',
			userId: 'user-001',
			method: 'POST',
			url: '/api/users',
			statusCode: 400
		};

		// 转换异常
		const unifiedException = await this.exceptionManager.transformException(httpException, context);

		// 发布到Core错误总线
		await this.coreErrorBusBridge.publishToCoreErrorBus(unifiedException);

		// 应用策略处理
		await this.strategyManager.handleException(unifiedException);

		// console.log('HTTP异常处理结果:', results);
	}

	/**
	 * 示例：处理应用层异常
	 */
	async handleApplicationException() {
		const appException = new Error('User not found');
		const context = {
			requestId: 'req-002',
			tenantId: 'tenant-001',
			userId: 'user-001',
			operation: 'getUser',
			resource: 'User'
		};

		// 转换异常
		const unifiedException = await this.exceptionManager.transformException(appException, context);

		// 发布到Core错误总线
		await this.coreErrorBusBridge.publishToCoreErrorBus(unifiedException);

		// 应用策略处理
		await this.strategyManager.handleException(unifiedException);

		// console.log('应用层异常处理结果:', results);
	}

	/**
	 * 示例：处理数据库异常
	 */
	async handleDatabaseException() {
		const dbException = new Error('Connection timeout');
		const context = {
			requestId: 'req-003',
			tenantId: 'tenant-001',
			userId: 'user-001',
			database: 'postgresql',
			table: 'users',
			operation: 'SELECT'
		};

		// 转换异常
		const unifiedException = await this.exceptionManager.transformException(dbException, context);

		// 发布到Core错误总线
		await this.coreErrorBusBridge.publishToCoreErrorBus(unifiedException);

		// 应用策略处理
		await this.strategyManager.handleException(unifiedException);

		// console.log('数据库异常处理结果:', results);
	}

	/**
	 * 示例：处理网络异常
	 */
	async handleNetworkException() {
		const networkException = new Error('Network timeout');
		const context = {
			requestId: 'req-004',
			tenantId: 'tenant-001',
			userId: 'user-001',
			endpoint: 'https://api.example.com',
			method: 'GET',
			timeout: 5000
		};

		// 转换异常
		const unifiedException = await this.exceptionManager.transformException(networkException, context);

		// 发布到Core错误总线
		await this.coreErrorBusBridge.publishToCoreErrorBus(unifiedException);

		// 应用策略处理
		await this.strategyManager.handleException(unifiedException);

		// console.log('网络异常处理结果:', results);
	}
}
