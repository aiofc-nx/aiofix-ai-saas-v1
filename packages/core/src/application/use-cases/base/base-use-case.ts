/**
 * 基础用例抽象类
 *
 * 提供用例的基础实现，所有具体用例都应该继承此类。
 * 这个类实现了用例的通用功能，如上下文管理、验证、日志记录等。
 *
 * @description 基础用例类为所有用例提供统一的基础功能
 *
 * ## 业务规则
 *
 * ### 用例执行规则
 * - 用例执行前必须进行请求验证
 * - 用例执行时必须创建执行上下文
 * - 用例执行过程中必须记录日志
 * - 用例执行失败时必须提供清晰的错误信息
 *
 * ### 用例上下文规则
 * - 每次用例执行都有独立的上下文
 * - 上下文包含用户、租户、请求等信息
 * - 上下文在用例执行期间保持不变
 * - 上下文信息用于审计和日志记录
 *
 * ### 用例验证规则
 * - 请求参数必须进行基础验证
 * - 业务规则验证在具体用例中实现
 * - 验证失败时抛出明确的验证异常
 * - 验证逻辑应该是可测试的
 *
 * ### 用例日志规则
 * - 用例开始执行时记录开始日志
 * - 用例执行成功时记录成功日志
 * - 用例执行失败时记录错误日志
 * - 日志应该包含足够的上下文信息
 *
 * @example
 * ```typescript
 * export class CreateUserUseCase extends BaseUseCase<CreateUserRequest, CreateUserResponse> {
 *   constructor(
 *     private readonly userRepository: IUserRepository,
 *     private readonly eventBus: IDomainEventBus
 *   ) {
 *     super('CreateUser', '创建用户用例');
 *   }
 *
 *   async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
 *     // 基础类会自动处理验证、上下文创建、日志记录
 *     return super.execute(request);
 *   }
 *
 *   protected async executeUseCase(
 *     request: CreateUserRequest,
 *     context: IUseCaseContext
 *   ): Promise<CreateUserResponse> {
 *     // 具体的业务逻辑实现
 *     const user = User.create(request.name, request.email);
 *     await this.userRepository.save(user);
 *     return new CreateUserResponse(user.id);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { IUseCase, IUseCaseContext } from './use-case.interface';

/**
 * 用例执行结果
 */
export interface IUseCaseExecutionResult<TResponse> {
	/**
	 * 执行是否成功
	 */
	success: boolean;

	/**
	 * 响应数据
	 */
	data?: TResponse;

	/**
	 * 错误信息
	 */
	error?: {
		code: string;
		message: string;
		details?: unknown;
	};

	/**
	 * 执行元数据
	 */
	metadata: {
		useCaseName: string;
		executionTime: number;
		timestamp: Date;
		context: IUseCaseContext;
	};
}

/**
 * 基础用例抽象类
 *
 * @template TRequest - 请求类型
 * @template TResponse - 响应类型
 */
export abstract class BaseUseCase<TRequest, TResponse> implements IUseCase<TRequest, TResponse> {
	protected readonly useCaseName: string;
	protected readonly useCaseDescription: string;
	protected readonly useCaseVersion: string;
	protected readonly requiredPermissions: string[];

	constructor(
		useCaseName: string,
		useCaseDescription: string,
		useCaseVersion: string = '1.0.0',
		requiredPermissions: string[] = []
	) {
		this.useCaseName = useCaseName;
		this.useCaseDescription = useCaseDescription;
		this.useCaseVersion = useCaseVersion;
		this.requiredPermissions = requiredPermissions;
	}

	/**
	 * 执行用例
	 *
	 * @description 用例执行的主要入口点，包含完整的执行流程
	 */
	async execute(request: TRequest): Promise<TResponse> {
		const startTime = Date.now();
		const context = this.createContext();

		try {
			// 1. 记录开始执行日志
			this.logUseCaseStart(request, context);

			// 2. 验证请求参数
			await this.validateRequest(request);

			// 3. 验证权限
			await this.validatePermissions(context);

			// 4. 执行具体的用例逻辑
			const response = await this.executeUseCase(request, context);

			// 5. 记录成功执行日志
			const executionTime = Date.now() - startTime;
			this.logUseCaseSuccess(request, response, context, executionTime);

			return response;
		} catch (error) {
			// 6. 记录执行失败日志
			const executionTime = Date.now() - startTime;
			this.logUseCaseError(request, error, context, executionTime);
			throw error;
		}
	}

	/**
	 * 执行具体的用例逻辑
	 *
	 * @description 子类必须实现此方法来定义具体的业务逻辑
	 *
	 * @param request - 用例请求
	 * @param context - 执行上下文
	 * @returns 用例响应
	 */
	protected abstract executeUseCase(request: TRequest, context: IUseCaseContext): Promise<TResponse>;

	/**
	 * 获取用例名称
	 */
	getUseCaseName(): string {
		return this.useCaseName;
	}

	/**
	 * 获取用例描述
	 */
	getUseCaseDescription(): string {
		return this.useCaseDescription;
	}

	/**
	 * 获取用例版本
	 */
	getUseCaseVersion(): string {
		return this.useCaseVersion;
	}

	/**
	 * 获取所需权限
	 */
	getRequiredPermissions(): string[] {
		return [...this.requiredPermissions];
	}

	/**
	 * 验证请求参数
	 *
	 * @description 验证请求参数的基础有效性
	 * 子类可以重写此方法来添加特定的验证逻辑
	 *
	 * @param request - 要验证的请求
	 * @throws {UseCaseValidationError} 当验证失败时
	 */
	protected validateRequest(request: TRequest): void {
		if (request === null || request === undefined) {
			throw new Error(`[${this.useCaseName}] 请求参数不能为空`);
		}

		// 基础验证逻辑
		this.performBasicValidation(request);
	}

	/**
	 * 验证权限
	 *
	 * @description 验证当前用户是否有执行此用例的权限
	 *
	 * @param context - 执行上下文
	 * @throws {PermissionDeniedError} 当权限验证失败时
	 */
	protected async validatePermissions(context: IUseCaseContext): Promise<void> {
		if (this.requiredPermissions.length === 0) {
			return; // 无权限要求
		}

		if (!context.user) {
			throw new Error(`[${this.useCaseName}] 用例需要用户身份验证`);
		}

		const userPermissions = context.user.permissions || [];
		const hasAllPermissions = this.requiredPermissions.every((permission) => userPermissions.includes(permission));

		if (!hasAllPermissions) {
			const missingPermissions = this.requiredPermissions.filter((permission) => !userPermissions.includes(permission));
			throw new Error(`[${this.useCaseName}] 权限不足，缺少权限: ${missingPermissions.join(', ')}`);
		}
	}

	/**
	 * 创建执行上下文
	 *
	 * @description 创建用例执行的上下文信息
	 * 子类可以重写此方法来添加特定的上下文信息
	 *
	 * @returns 执行上下文
	 */
	protected createContext(): IUseCaseContext {
		return {
			request: {
				id: this.generateRequestId(),
				timestamp: new Date()
			},
			system: {
				service: 'aiofix-saas',
				version: '1.0.0',
				environment: process.env.NODE_ENV || 'development'
			}
		};
	}

	/**
	 * 执行基础验证
	 *
	 * @param request - 请求对象
	 */
	private performBasicValidation(_request: TRequest): void {
		// 可以在这里添加通用的验证逻辑
		// 例如：检查必填字段、数据类型等
	}

	/**
	 * 生成请求ID
	 *
	 * @returns 唯一的请求ID
	 */
	private generateRequestId(): string {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * 记录用例开始执行日志
	 */
	private logUseCaseStart(request: TRequest, context: IUseCaseContext): void {
		console.warn(`[${this.useCaseName}] 开始执行`, {
			request,
			context: {
				requestId: context.request?.id,
				userId: context.user?.id,
				tenantId: context.tenant?.id
			}
		});
	}

	/**
	 * 记录用例成功执行日志
	 */
	private logUseCaseSuccess(
		request: TRequest,
		response: TResponse,
		context: IUseCaseContext,
		executionTime: number
	): void {
		console.warn(`[${this.useCaseName}] 执行成功`, {
			executionTime: `${executionTime}ms`,
			context: {
				requestId: context.request?.id,
				userId: context.user?.id,
				tenantId: context.tenant?.id
			}
		});
	}

	/**
	 * 记录用例执行失败日志
	 */
	private logUseCaseError(request: TRequest, error: unknown, context: IUseCaseContext, executionTime: number): void {
		console.error(`[${this.useCaseName}] 执行失败`, {
			error: {
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined
			},
			executionTime: `${executionTime}ms`,
			context: {
				requestId: context.request?.id,
				userId: context.user?.id,
				tenantId: context.tenant?.id
			}
		});
	}
}

/**
 * 用例基础异常类
 */
export abstract class BaseUseCaseError extends Error {
	abstract readonly errorCode: string;
	abstract readonly errorType: string;

	constructor(message: string, public readonly useCaseName: string, public readonly context?: IUseCaseContext) {
		super(message);
		this.name = this.constructor.name;
	}
}

/**
 * 用例验证异常
 */
export class UseCaseValidationError extends BaseUseCaseError {
	readonly errorCode = 'USE_CASE_VALIDATION_ERROR';
	readonly errorType = 'validation';

	constructor(
		message: string,
		useCaseName: string,
		public readonly validationErrors: string[],
		context?: IUseCaseContext
	) {
		super(message, useCaseName, context);
	}
}

/**
 * 用例执行异常
 */
export class UseCaseExecutionError extends BaseUseCaseError {
	readonly errorCode = 'USE_CASE_EXECUTION_ERROR';
	readonly errorType = 'execution';

	constructor(message: string, useCaseName: string, public readonly originalError?: Error, context?: IUseCaseContext) {
		super(message, useCaseName, context);
	}
}

/**
 * 权限拒绝异常
 */
export class PermissionDeniedError extends BaseUseCaseError {
	readonly errorCode = 'PERMISSION_DENIED_ERROR';
	readonly errorType = 'permission';

	constructor(
		message: string,
		useCaseName: string,
		public readonly requiredPermissions: string[],
		public readonly userPermissions: string[],
		context?: IUseCaseContext
	) {
		super(message, useCaseName, context);
	}
}
