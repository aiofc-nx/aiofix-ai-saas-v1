/**
 * CQRS 总线接口
 *
 * CQRS 总线是 CQRS 模式中的核心组件，负责路由和处理命令、查询和事件。
 * 总线提供了统一的接口来处理不同类型的消息，并支持中间件和拦截器。
 *
 * ## 业务规则
 *
 * ### 路由规则
 * - 总线负责将消息路由到正确的处理器
 * - 支持基于类型的自动路由
 * - 支持自定义路由规则
 *
 * ### 中间件规则
 * - 总线支持中间件链
 * - 中间件可以修改消息或添加额外功能
 * - 中间件按顺序执行
 *
 * ### 错误处理规则
 * - 总线提供统一的错误处理机制
 * - 支持错误重试和恢复
 * - 提供详细的错误日志
 *
 * ### 性能规则
 * - 总线应该优化消息处理性能
 * - 支持异步处理和并发控制
 * - 提供性能监控和统计
 *
 * ### 扩展性规则
 * - 总线应该支持插件和扩展
 * - 支持自定义处理器注册
 * - 支持动态配置和调整
 *
 * @description CQRS 总线接口，定义消息处理的标准行为
 * @since 1.0.0
 */
import { BaseCommand } from '../commands/base/base-command';
import { BaseQuery, IQueryResult } from '../queries/base/base-query';
import { BaseDomainEvent } from '../../../domain/events/base/base-domain-event';
import { ICommandHandler } from '../commands/base/command-handler.interface';
import { IQueryHandler } from '../queries/base/query-handler.interface';
import { IEventHandler } from '../events/base/event-handler.interface';

/**
 * 消息处理上下文接口
 */
export interface IMessageContext {
	/**
	 * 消息ID
	 */
	messageId: string;

	/**
	 * 租户ID
	 */
	tenantId: string;

	/**
	 * 用户ID
	 */
	userId: string;

	/**
	 * 消息类型
	 */
	messageType: string;

	/**
	 * 创建时间
	 */
	createdAt: Date;

	/**
	 * 元数据
	 */
	metadata: Record<string, unknown>;
}

/**
 * CQRS消息中间件接口
 */
export interface ICQRSMiddleware {
	/**
	 * 中间件名称
	 */
	name: string;

	/**
	 * 中间件优先级（数值越小优先级越高）
	 */
	priority: number;

	/**
	 * 执行中间件
	 *
	 * @param context - 消息上下文
	 * @param next - 下一个中间件或处理器
	 * @returns Promise，处理完成后解析
	 */
	execute(context: IMessageContext, next: () => Promise<unknown>): Promise<unknown>;
}

/**
 * 命令总线接口
 */
export interface ICommandBus {
	/**
	 * 执行命令
	 *
	 * @param command - 要执行的命令
	 * @returns Promise，命令执行完成后解析
	 */
	execute<TCommand extends BaseCommand>(command: TCommand): Promise<void>;

	/**
	 * 注册命令处理器
	 *
	 * @param commandType - 命令类型
	 * @param handler - 命令处理器
	 */
	registerHandler<TCommand extends BaseCommand>(commandType: string, handler: ICommandHandler<TCommand>): void;

	/**
	 * 取消注册命令处理器
	 *
	 * @param commandType - 命令类型
	 */
	unregisterHandler(commandType: string): void;

	/**
	 * 添加中间件
	 *
	 * @param middleware - 中间件
	 */
	addMiddleware(middleware: ICQRSMiddleware): void;

	/**
	 * 移除中间件
	 *
	 * @param middlewareName - 中间件名称
	 */
	removeMiddleware(middlewareName: string): void;

	/**
	 * 获取所有注册的命令类型
	 *
	 * @returns 命令类型数组
	 */
	getRegisteredCommandTypes(): string[];

	/**
	 * 检查是否支持指定的命令类型
	 *
	 * @param commandType - 命令类型
	 * @returns 如果支持则返回 true，否则返回 false
	 */
	supports(commandType: string): boolean;
}

/**
 * 查询总线接口
 */
export interface IQueryBus {
	/**
	 * 执行查询
	 *
	 * @param query - 要执行的查询
	 * @returns Promise，查询执行完成后解析为结果
	 */
	execute<TQuery extends BaseQuery, TResult extends IQueryResult>(query: TQuery): Promise<TResult>;

	/**
	 * 注册查询处理器
	 *
	 * @param queryType - 查询类型
	 * @param handler - 查询处理器
	 */
	registerHandler<TQuery extends BaseQuery, TResult extends IQueryResult>(
		queryType: string,
		handler: IQueryHandler<TQuery, TResult>
	): void;

	/**
	 * 取消注册查询处理器
	 *
	 * @param queryType - 查询类型
	 */
	unregisterHandler(queryType: string): void;

	/**
	 * 添加中间件
	 *
	 * @param middleware - 中间件
	 */
	addMiddleware(middleware: ICQRSMiddleware): void;

	/**
	 * 移除中间件
	 *
	 * @param middlewareName - 中间件名称
	 */
	removeMiddleware(middlewareName: string): void;

	/**
	 * 获取所有注册的查询类型
	 *
	 * @returns 查询类型数组
	 */
	getRegisteredQueryTypes(): string[];

	/**
	 * 检查是否支持指定的查询类型
	 *
	 * @param queryType - 查询类型
	 * @returns 如果支持则返回 true，否则返回 false
	 */
	supports(queryType: string): boolean;
}

/**
 * 事件总线接口
 */
export interface IEventBus {
	/**
	 * 发布事件
	 *
	 * @param event - 要发布的事件
	 * @returns Promise，事件发布完成后解析
	 */
	publish<TEvent extends BaseDomainEvent>(event: TEvent): Promise<void>;

	/**
	 * 批量发布事件
	 *
	 * @param events - 要发布的事件数组
	 * @returns Promise，所有事件发布完成后解析
	 */
	publishAll<TEvent extends BaseDomainEvent>(events: TEvent[]): Promise<void>;

	/**
	 * 注册事件处理器
	 *
	 * @param eventType - 事件类型
	 * @param handler - 事件处理器
	 */
	registerHandler<TEvent extends BaseDomainEvent>(eventType: string, handler: IEventHandler<TEvent>): void;

	/**
	 * 取消注册事件处理器
	 *
	 * @param eventType - 事件类型
	 */
	unregisterHandler(eventType: string): void;

	/**
	 * 添加中间件
	 *
	 * @param middleware - 中间件
	 */
	addMiddleware(middleware: ICQRSMiddleware): void;

	/**
	 * 移除中间件
	 *
	 * @param middlewareName - 中间件名称
	 */
	removeMiddleware(middlewareName: string): void;

	/**
	 * 获取所有注册的事件类型
	 *
	 * @returns 事件类型数组
	 */
	getRegisteredEventTypes(): string[];

	/**
	 * 检查是否支持指定的事件类型
	 *
	 * @param eventType - 事件类型
	 * @returns 如果支持则返回 true，否则返回 false
	 */
	supports(eventType: string): boolean;

	/**
	 * 订阅事件
	 *
	 * @param eventType - 事件类型
	 * @param handler - 事件处理器函数
	 * @returns 订阅ID，用于取消订阅
	 */
	subscribe<TEvent extends BaseDomainEvent>(eventType: string, handler: (event: TEvent) => Promise<void>): string;

	/**
	 * 取消订阅事件
	 *
	 * @param subscriptionId - 订阅ID
	 */
	unsubscribe(subscriptionId: string): void;
}

/**
 * CQRS 总线接口
 *
 * 统一的 CQRS 总线接口，包含命令、查询和事件总线。
 */
export interface ICQRSBus {
	/**
	 * 命令总线
	 */
	readonly commandBus: ICommandBus;

	/**
	 * 查询总线
	 */
	readonly queryBus: IQueryBus;

	/**
	 * 事件总线
	 */
	readonly eventBus: IEventBus;

	/**
	 * 执行命令
	 *
	 * @param command - 要执行的命令
	 * @returns Promise，命令执行完成后解析
	 */
	executeCommand<TCommand extends BaseCommand>(command: TCommand): Promise<void>;

	/**
	 * 执行查询
	 *
	 * @param query - 要执行的查询
	 * @returns Promise，查询执行完成后解析为结果
	 */
	executeQuery<TQuery extends BaseQuery, TResult extends IQueryResult>(query: TQuery): Promise<TResult>;

	/**
	 * 发布事件
	 *
	 * @param event - 要发布的事件
	 * @returns Promise，事件发布完成后解析
	 */
	publishEvent<TEvent extends BaseDomainEvent>(event: TEvent): Promise<void>;

	/**
	 * 批量发布事件
	 *
	 * @param events - 要发布的事件数组
	 * @returns Promise，所有事件发布完成后解析
	 */
	publishEvents<TEvent extends BaseDomainEvent>(events: TEvent[]): Promise<void>;

	/**
	 * 执行用例
	 *
	 * @param useCaseName - 用例名称
	 * @param request - 用例请求
	 * @returns Promise，用例执行完成后解析为结果
	 */
	executeUseCase<TRequest, TResponse>(useCaseName: string, request: TRequest): Promise<TResponse>;

	/**
	 * 初始化总线
	 *
	 * 注册所有处理器和中间件。
	 *
	 * @returns Promise，初始化完成后解析
	 */
	initialize(): Promise<void>;

	/**
	 * 关闭总线
	 *
	 * 清理资源和取消订阅。
	 *
	 * @returns Promise，关闭完成后解析
	 */
	shutdown(): Promise<void>;
}
