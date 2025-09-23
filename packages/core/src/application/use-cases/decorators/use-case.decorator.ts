/**
 * 用例装饰器
 *
 * 用于标记和配置用例类，提供用例的元数据管理和自动发现功能。
 * 这个装饰器使得框架能够自动识别用例，并为其提供相应的基础设施支持。
 *
 * @description 用例装饰器提供了声明式的用例定义方式
 *
 * ## 业务规则
 *
 * ### 用例标识规则
 * - 每个用例必须有唯一的名称标识
 * - 用例名称用于注册表管理和路由
 * - 用例名称应该反映业务意图
 * - 用例名称在系统内必须唯一
 *
 * ### 用例类型规则
 * - 用例类型分为命令(command)和查询(query)
 * - 命令用例处理状态变更操作
 * - 查询用例处理数据检索操作
 * - 用例类型决定了执行策略和优化方式
 *
 * ### 用例权限规则
 * - 用例可以定义所需的权限列表
 * - 权限验证在用例执行前进行
 * - 权限不足时抛出权限异常
 * - 权限应该遵循最小权限原则
 *
 * ### 用例监控规则
 * - 用例执行应该被监控和度量
 * - 关键用例的性能指标应该被收集
 * - 用例执行失败应该触发告警
 * - 用例使用情况应该用于业务分析
 *
 * @example
 * ```typescript
 * @UseCase({
 *   name: 'CreateUser',
 *   description: '创建用户用例',
 *   type: 'command',
 *   permissions: ['user:create'],
 *   critical: true,
 *   monitored: true
 * })
 * export class CreateUserUseCase extends BaseCommandUseCase<CreateUserRequest, CreateUserResponse> {
 *   // 用例实现
 * }
 * ```
 *
 * @since 1.0.0
 */

import 'reflect-metadata';
import { DecoratorTarget } from 'src/common/types';

/**
 * 用例类型枚举
 */
export enum UseCaseType {
	COMMAND = 'command',
	QUERY = 'query'
}

/**
 * 用例配置选项
 */
export interface IUseCaseOptions {
	/**
	 * 用例名称
	 *
	 * @description 用例的唯一标识名称，用于：
	 * - 用例注册表管理
	 * - 日志记录和调试
	 * - 性能监控和指标收集
	 * - API路由和文档生成
	 *
	 * @example 'CreateUser', 'GetUserProfile', 'UpdateUserEmail'
	 */
	name: string;

	/**
	 * 用例描述
	 *
	 * @description 用例的业务描述，用于：
	 * - 文档生成和业务理解
	 * - 开发工具提示
	 * - API文档生成
	 * - 业务分析和审计
	 *
	 * @example '创建新用户，包括验证、持久化和事件发布'
	 */
	description: string;

	/**
	 * 用例类型
	 *
	 * @description 用例的类型，决定执行策略：
	 * - command: 状态变更操作，需要事务和事件发布
	 * - query: 数据检索操作，只读且可缓存
	 *
	 * @example 'command', 'query'
	 */
	type: UseCaseType | 'command' | 'query';

	/**
	 * 用例版本
	 *
	 * @description 用例的版本号，用于：
	 * - 版本兼容性管理
	 * - API版本控制
	 * - 变更追踪和回滚
	 *
	 * @default '1.0.0'
	 * @example '1.0.0', '2.1.0', '3.0.0-beta.1'
	 */
	version?: string;

	/**
	 * 所需权限
	 *
	 * @description 执行此用例所需的权限列表，用于：
	 * - 权限验证和访问控制
	 * - 安全审计
	 * - 角色权限分配
	 *
	 * @example ['user:create', 'user:manage']
	 */
	permissions?: string[];

	/**
	 * 用例分类
	 *
	 * @description 用例的业务分类，用于：
	 * - 用例分组和管理
	 * - 监控指标分类
	 * - 权限控制分组
	 *
	 * @example 'user-management', 'order-processing', 'billing'
	 */
	category?: string;

	/**
	 * 用例标签
	 *
	 * @description 用例的分类标签，用于：
	 * - 用例分组和过滤
	 * - 监控指标分类
	 * - 批量操作
	 *
	 * @example ['core', 'user'], ['business', 'order']
	 */
	tags?: string[];

	/**
	 * 是否为关键用例
	 *
	 * @description 标记用例是否为业务关键用例
	 * - true: 关键用例，失败时需要特殊处理和告警
	 * - false: 普通用例，失败时记录日志即可
	 *
	 * @default false
	 */
	critical?: boolean;

	/**
	 * 是否启用监控
	 *
	 * @description 是否为此用例启用详细监控
	 * - true: 启用性能监控、指标收集、链路追踪
	 * - false: 只记录基础日志
	 *
	 * @default true
	 */
	monitored?: boolean;

	/**
	 * 缓存配置
	 *
	 * @description 查询用例的缓存配置
	 * 只对查询用例有效
	 */
	cache?: {
		/**
		 * 是否启用缓存
		 */
		enabled: boolean;

		/**
		 * 缓存生存时间（秒）
		 */
		ttl?: number;

		/**
		 * 缓存键前缀
		 */
		keyPrefix?: string;
	};

	/**
	 * 超时配置
	 *
	 * @description 用例执行超时配置
	 */
	timeout?: {
		/**
		 * 执行超时时间（毫秒）
		 */
		execution: number;

		/**
		 * 是否启用超时告警
		 */
		alertOnTimeout?: boolean;
	};
}

/**
 * 用例元数据键
 */
export const USE_CASE_METADATA_KEY = Symbol('useCase');

/**
 * 用例装饰器
 *
 * @description 用于标记用例类并提供配置选项
 *
 * @param options - 用例配置选项
 * @returns 类装饰器函数
 *
 * @example
 * ```typescript
 * @UseCase({
 *   name: 'CreateUser',
 *   description: '创建用户用例',
 *   type: 'command',
 *   version: '1.0.0',
 *   permissions: ['user:create'],
 *   category: 'user-management',
 *   tags: ['core', 'user'],
 *   critical: true,
 *   monitored: true,
 *   timeout: { execution: 5000, alertOnTimeout: true }
 * })
 * export class CreateUserUseCase extends BaseCommandUseCase<CreateUserRequest, CreateUserResponse> {
 *   // 用例实现
 * }
 * ```
 */
export function UseCase(options: IUseCaseOptions): ClassDecorator {
	return function (target) {
		// 验证配置选项
		validateUseCaseOptions(options);

		// 设置默认值
		const metadata: Required<IUseCaseOptions> = {
			name: options.name,
			description: options.description,
			type: options.type as UseCaseType,
			version: options.version || '1.0.0',
			permissions: options.permissions || [],
			category: options.category || 'general',
			tags: options.tags || [],
			critical: options.critical || false,
			monitored: options.monitored !== false, // 默认启用监控
			cache: {
				enabled: options.cache?.enabled || false,
				ttl: options.cache?.ttl || 300,
				keyPrefix: options.cache?.keyPrefix || options.name.toLowerCase()
			},
			timeout: {
				execution: options.timeout?.execution || 30000, // 默认30秒
				alertOnTimeout: options.timeout?.alertOnTimeout !== false
			}
		};

		// 存储元数据
		Reflect.defineMetadata(USE_CASE_METADATA_KEY, metadata, target);

		return target;
	};
}

/**
 * 获取用例元数据
 *
 * @description 从用例类中获取元数据信息
 *
 * @param target - 用例类或实例
 * @returns 用例元数据，如果没有找到返回undefined
 *
 * @example
 * ```typescript
 * const metadata = getUseCaseMetadata(CreateUserUseCase);
 * console.log(`用例名称: ${metadata?.name}`);
 * ```
 */
export function getUseCaseMetadata(target: DecoratorTarget): Required<IUseCaseOptions> | undefined {
	const targetClass = typeof target === 'function' ? target : target.constructor;
	return Reflect.getMetadata(USE_CASE_METADATA_KEY, targetClass);
}

/**
 * 检查类是否是用例
 *
 * @description 检查给定的类是否被@UseCase装饰器标记
 *
 * @param target - 要检查的类或实例
 * @returns 如果是用例返回true，否则返回false
 *
 * @example
 * ```typescript
 * if (isUseCase(CreateUserUseCase)) {
 *   console.log('这是一个用例');
 * }
 * ```
 */
export function isUseCase(target: DecoratorTarget): boolean {
	return getUseCaseMetadata(target) !== undefined;
}

/**
 * 验证用例配置选项
 *
 * @param options - 要验证的配置选项
 * @throws {Error} 当配置选项无效时抛出错误
 */
function validateUseCaseOptions(options: IUseCaseOptions): void {
	if (!options.name || typeof options.name !== 'string' || options.name.trim().length === 0) {
		throw new Error('用例名称不能为空');
	}

	if (!options.description || typeof options.description !== 'string') {
		throw new Error('用例描述不能为空');
	}

	if (!options.type || !['command', 'query'].includes(options.type as string)) {
		throw new Error('用例类型必须是 "command" 或 "query"');
	}

	if (options.version && typeof options.version !== 'string') {
		throw new Error('用例版本必须是字符串');
	}

	if (options.permissions && !Array.isArray(options.permissions)) {
		throw new Error('用例权限必须是字符串数组');
	}

	if (options.permissions && options.permissions.some((p) => typeof p !== 'string')) {
		throw new Error('用例权限必须都是字符串');
	}

	if (options.category && typeof options.category !== 'string') {
		throw new Error('用例分类必须是字符串');
	}

	if (options.tags && !Array.isArray(options.tags)) {
		throw new Error('用例标签必须是字符串数组');
	}

	if (options.tags && options.tags.some((tag) => typeof tag !== 'string')) {
		throw new Error('用例标签必须都是字符串');
	}

	if (options.timeout?.execution && (typeof options.timeout.execution !== 'number' || options.timeout.execution <= 0)) {
		throw new Error('用例超时时间必须是正整数');
	}

	if (options.cache?.ttl && (typeof options.cache.ttl !== 'number' || options.cache.ttl <= 0)) {
		throw new Error('缓存TTL必须是正整数');
	}
}
