/**
 * 发布者接口定义
 *
 * 定义了事件发布者和命令发布者的核心接口，支持异步发布、
 * 批量发布、重试机制、事务支持等企业级特性。
 *
 * @description 发布者接口定义
 * @since 1.0.0
 */

// 临时定义接口，直到相关模块完成
interface ICommand {
	getCommandType(): string;
	getCommandId(): string;
	getTenantId(): string | undefined;
}

interface ICommandResult {
	success: boolean;
	data?: unknown;
	error?: string;
}

interface IDomainEvent {
	getEventType(): string;
	getEventId(): string;
	getTenantId(): string | undefined;
}

interface IAsyncContext {
	[key: string]: unknown;
}
/**
 * 发布选项接口
 */
export interface IPublishOptions {
	/**
	 * 是否异步发布
	 */
	async?: boolean;

	/**
	 * 发布超时时间（毫秒）
	 */
	timeout?: number;

	/**
	 * 重试次数
	 */
	retries?: number;

	/**
	 * 重试延迟（毫秒）
	 */
	retryDelay?: number;

	/**
	 * 是否在事务中发布
	 */
	transactional?: boolean;

	/**
	 * 发布优先级
	 */
	priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

	/**
	 * 自定义元数据
	 */
	metadata?: Record<string, unknown>;

	/**
	 * 发布上下文
	 */
	context?: IAsyncContext;
}

/**
 * 发布结果接口
 */
export interface IPublishResult<T = unknown> {
	/**
	 * 是否成功
	 */
	success: boolean;

	/**
	 * 发布的消息ID
	 */
	messageId: string;

	/**
	 * 发布时间戳
	 */
	timestamp: Date;

	/**
	 * 处理时间（毫秒）
	 */
	duration: number;

	/**
	 * 结果数据
	 */
	result?: T;

	/**
	 * 错误信息
	 */
	error?: string;

	/**
	 * 重试次数
	 */
	retryCount: number;

	/**
	 * 元数据
	 */
	metadata?: Record<string, unknown>;
}

/**
 * 批量发布结果接口
 */
export interface IBatchPublishResult<T = unknown> {
	/**
	 * 总数量
	 */
	total: number;

	/**
	 * 成功数量
	 */
	successful: number;

	/**
	 * 失败数量
	 */
	failed: number;

	/**
	 * 结果列表
	 */
	results: Array<IPublishResult<T>>;

	/**
	 * 批量发布时间戳
	 */
	timestamp: Date;

	/**
	 * 总处理时间（毫秒）
	 */
	duration: number;
}

/**
 * 事件发布者接口
 */
export interface IEventPublisher {
	/**
	 * 发布单个事件
	 */
	publish<T extends IDomainEvent>(event: T, options?: IPublishOptions): Promise<IPublishResult>;

	/**
	 * 批量发布事件
	 */
	publishBatch<T extends IDomainEvent>(events: T[], options?: IPublishOptions): Promise<IBatchPublishResult>;

	/**
	 * 发布事件并等待处理完成
	 */
	publishAndWait<T extends IDomainEvent>(event: T, options?: IPublishOptions): Promise<IPublishResult>;

	/**
	 * 检查发布者是否可用
	 */
	isAvailable(): boolean;

	/**
	 * 获取发布者统计信息
	 */
	getStatistics(): IPublisherStatistics;
}

/**
 * 命令发布者接口
 */
export interface ICommandPublisher {
	/**
	 * 发布单个命令
	 */
	publish<T extends ICommand, R extends ICommandResult>(
		command: T,
		options?: IPublishOptions
	): Promise<IPublishResult<R>>;

	/**
	 * 批量发布命令
	 */
	publishBatch<T extends ICommand, R extends ICommandResult>(
		commands: T[],
		options?: IPublishOptions
	): Promise<IBatchPublishResult<R>>;

	/**
	 * 发布命令并等待结果
	 */
	publishAndWait<T extends ICommand, R extends ICommandResult>(
		command: T,
		options?: IPublishOptions
	): Promise<IPublishResult<R>>;

	/**
	 * 检查发布者是否可用
	 */
	isAvailable(): boolean;

	/**
	 * 获取发布者统计信息
	 */
	getStatistics(): IPublisherStatistics;
}

/**
 * 发布者统计信息接口
 */
export interface IPublisherStatistics {
	/**
	 * 总发布数量
	 */
	totalPublished: number;

	/**
	 * 成功发布数量
	 */
	successfulPublished: number;

	/**
	 * 失败发布数量
	 */
	failedPublished: number;

	/**
	 * 平均处理时间（毫秒）
	 */
	averageProcessingTime: number;

	/**
	 * 按优先级统计
	 */
	byPriority: Record<string, number>;

	/**
	 * 按类型统计
	 */
	byType: Record<string, number>;

	/**
	 * 按租户统计
	 */
	byTenant: Record<string, number>;

	/**
	 * 按时间统计
	 */
	byTime: {
		lastHour: number;
		lastDay: number;
		lastWeek: number;
		lastMonth: number;
	};

	/**
	 * 最后更新时间
	 */
	lastUpdatedAt: Date;
}

/**
 * 发布者配置接口
 */
export interface IPublisherConfiguration {
	/**
	 * 是否启用发布者
	 */
	enabled: boolean;

	/**
	 * 默认发布选项
	 */
	defaultOptions: IPublishOptions;

	/**
	 * 批量发布大小
	 */
	batchSize: number;

	/**
	 * 批量发布间隔（毫秒）
	 */
	batchInterval: number;

	/**
	 * 最大重试次数
	 */
	maxRetries: number;

	/**
	 * 默认重试延迟（毫秒）
	 */
	defaultRetryDelay: number;

	/**
	 * 发布超时时间（毫秒）
	 */
	publishTimeout: number;

	/**
	 * 是否启用统计
	 */
	enableStatistics: boolean;

	/**
	 * 统计保留时间（毫秒）
	 */
	statisticsRetentionTime: number;
}

/**
 * 发布者生命周期接口
 */
export interface IPublisherLifecycle {
	/**
	 * 启动发布者
	 */
	start(): Promise<void>;

	/**
	 * 停止发布者
	 */
	stop(): Promise<void>;

	/**
	 * 检查是否已启动
	 */
	isStarted(): boolean;

	/**
	 * 健康检查
	 */
	healthCheck(): Promise<boolean>;
}
