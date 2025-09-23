/**
 * 命令侧输出端口接口
 *
 * 定义命令处理过程中需要的外部依赖接口，这些接口遵循Clean Architecture的端口适配器模式。
 * 命令侧端口主要用于状态变更操作和事件发布。
 *
 * @description 命令侧端口接口定义了命令处理器与外部世界交互的契约
 *
 * ## 业务规则
 *
 * ### 端口设计规则
 * - 端口接口定义在应用层，实现在基础设施层
 * - 端口接口应该基于业务概念而非技术实现
 * - 端口接口应该保持稳定，避免频繁变更
 * - 端口接口应该支持测试替身和模拟
 *
 * ### 命令端口职责规则
 * - 命令端口负责状态变更操作的外部依赖
 * - 命令端口支持事务性操作
 * - 命令端口负责领域事件的发布
 * - 命令端口支持外部服务的集成
 *
 * @example
 * ```typescript
 * // 在命令处理器中使用端口
 * @CommandHandler(CreateUserCommand)
 * export class CreateUserCommandHandler extends BaseCommandHandler<CreateUserCommand, CreateUserResult> {
 *   constructor(
 *     private readonly userRepository: IUserWriteRepository,
 *     private readonly eventPublisher: IDomainEventPublisher,
 *     private readonly emailService: IEmailNotificationPort
 *   ) {
 *     super('CreateUserCommandHandler', 'CreateUser');
 *   }
 *
 *   protected async executeCommand(command: CreateUserCommand): Promise<CreateUserResult> {
 *     const user = UserAggregate.create(command.name, command.email);
 *     await this.userRepository.save(user);
 *
 *     const events = user.getUncommittedEvents();
 *     await this.eventPublisher.publishAll(events);
 *
 *     await this.emailService.sendWelcomeEmail(user.email, user.name);
 *
 *     return new CreateUserResult(user.id);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { EntityId } from '../../../domain/value-objects/entity-id';
import { IAggregateRoot } from '../../../domain/aggregates/base/aggregate-root.interface';
import { BaseDomainEvent } from '../../../domain/events/base/base-domain-event';
import { IServiceHealthStatus } from '../../common/interfaces/application-interfaces';

/**
 * 写仓储端口接口
 *
 * 定义聚合根写操作的端口契约
 *
 * @template TAggregateRoot - 聚合根类型
 */
export interface IWriteRepositoryPort<TAggregateRoot extends IAggregateRoot> {
	/**
	 * 保存聚合根
	 *
	 * @param aggregateRoot - 要保存的聚合根
	 * @returns 保存操作的Promise
	 */
	save(aggregateRoot: TAggregateRoot): Promise<void>;

	/**
	 * 根据ID查找聚合根
	 *
	 * @param id - 聚合根标识符
	 * @returns 聚合根实例，如果不存在返回null
	 */
	findById(id: EntityId): Promise<TAggregateRoot | null>;

	/**
	 * 删除聚合根
	 *
	 * @param id - 聚合根标识符
	 * @returns 删除操作的Promise
	 */
	delete(id: EntityId): Promise<void>;

	/**
	 * 检查聚合根是否存在
	 *
	 * @param id - 聚合根标识符
	 * @returns 如果存在返回true，否则返回false
	 */
	exists(id: EntityId): Promise<boolean>;

	/**
	 * 保存聚合根和事件
	 *
	 * @param aggregateRoot - 聚合根实例
	 * @returns 保存操作的Promise
	 */
	saveWithEvents(aggregateRoot: TAggregateRoot): Promise<void>;
}

/**
 * 领域事件发布端口接口
 */
export interface IDomainEventPublisherPort {
	/**
	 * 发布单个领域事件
	 *
	 * @param event - 要发布的领域事件
	 * @returns 发布操作的Promise
	 */
	publish(event: BaseDomainEvent): Promise<void>;

	/**
	 * 批量发布领域事件
	 *
	 * @param events - 要发布的领域事件数组
	 * @returns 发布操作的Promise
	 */
	publishAll(events: BaseDomainEvent[]): Promise<void>;

	/**
	 * 延迟发布事件
	 *
	 * @param event - 要发布的领域事件
	 * @param delay - 延迟时间（毫秒）
	 * @returns 发布操作的Promise
	 */
	publishDelayed(event: BaseDomainEvent, delay: number): Promise<void>;

	/**
	 * 调度事件发布
	 *
	 * @param event - 要发布的领域事件
	 * @param scheduledAt - 调度时间
	 * @returns 发布操作的Promise
	 */
	publishScheduled(event: BaseDomainEvent, scheduledAt: Date): Promise<void>;
}

/**
 * 事务管理端口接口
 */
export interface ITransactionManagerPort {
	/**
	 * 开始事务
	 *
	 * @param isolationLevel - 事务隔离级别
	 * @returns 事务上下文
	 */
	begin(isolationLevel?: string): Promise<ITransactionContext>;

	/**
	 * 提交事务
	 *
	 * @param context - 事务上下文
	 * @returns 提交操作的Promise
	 */
	commit(context: ITransactionContext): Promise<void>;

	/**
	 * 回滚事务
	 *
	 * @param context - 事务上下文
	 * @returns 回滚操作的Promise
	 */
	rollback(context: ITransactionContext): Promise<void>;

	/**
	 * 在事务中执行操作
	 *
	 * @param operation - 要执行的操作
	 * @param isolationLevel - 事务隔离级别
	 * @returns 操作结果
	 */
	executeInTransaction<T>(operation: (context: ITransactionContext) => Promise<T>, isolationLevel?: string): Promise<T>;
}

/**
 * 事务上下文接口
 */
export interface ITransactionContext {
	/**
	 * 事务ID
	 */
	transactionId: string;

	/**
	 * 隔离级别
	 */
	isolationLevel: string;

	/**
	 * 开始时间
	 */
	startTime: Date;

	/**
	 * 是否活跃
	 */
	isActive: boolean;

	/**
	 * 事务元数据
	 */
	metadata: Record<string, unknown>;
}

/**
 * 外部服务集成端口接口
 */
export interface IExternalServicePort {
	/**
	 * 服务名称
	 */
	readonly serviceName: string;

	/**
	 * 调用外部服务
	 *
	 * @param operation - 操作名称
	 * @param data - 请求数据
	 * @param options - 调用选项
	 * @returns 服务响应
	 */
	call<TRequest, TResponse>(operation: string, data: TRequest, options?: IServiceCallOptions): Promise<TResponse>;

	/**
	 * 检查服务健康状态
	 *
	 * @returns 健康状态
	 */
	checkHealth(): Promise<IServiceHealthStatus>;
}

/**
 * 服务调用选项接口
 */
export interface IServiceCallOptions {
	/**
	 * 超时时间（毫秒）
	 */
	timeout?: number;

	/**
	 * 重试次数
	 */
	retries?: number;

	/**
	 * 请求头
	 */
	headers?: Record<string, string>;

	/**
	 * 是否幂等操作
	 */
	idempotent?: boolean;
}

// IServiceHealthStatus 接口已移动到 ./application/common/interfaces/application-interfaces.ts
// 这里不再重复定义，避免与通用接口的冲突

/**
 * 通知发送端口接口
 */
export interface INotificationPort {
	/**
	 * 发送邮件通知
	 *
	 * @param notification - 邮件通知内容
	 * @returns 发送结果
	 */
	sendEmail(notification: IEmailNotification): Promise<void>;

	/**
	 * 发送短信通知
	 *
	 * @param notification - 短信通知内容
	 * @returns 发送结果
	 */
	sendSms(notification: ISmsNotification): Promise<void>;

	/**
	 * 发送推送通知
	 *
	 * @param notification - 推送通知内容
	 * @returns 发送结果
	 */
	sendPush(notification: IPushNotification): Promise<void>;

	/**
	 * 批量发送通知
	 *
	 * @param notifications - 通知数组
	 * @returns 发送结果
	 */
	sendBatch(notifications: INotificationBatch): Promise<void>;
}

/**
 * 邮件通知接口
 */
export interface IEmailNotification {
	to: string[];
	cc?: string[];
	bcc?: string[];
	subject: string;
	body: string;
	isHtml?: boolean;
	attachments?: IEmailAttachment[];
	priority?: 'low' | 'normal' | 'high';
}

/**
 * 邮件附件接口
 */
export interface IEmailAttachment {
	filename: string;
	content: Buffer | string;
	contentType: string;
}

/**
 * 短信通知接口
 */
export interface ISmsNotification {
	to: string[];
	message: string;
	priority?: 'low' | 'normal' | 'high';
}

/**
 * 推送通知接口
 */
export interface IPushNotification {
	to: string[];
	title: string;
	body: string;
	data?: Record<string, unknown>;
	priority?: 'low' | 'normal' | 'high';
}

/**
 * 批量通知接口
 */
export interface INotificationBatch {
	emails?: IEmailNotification[];
	sms?: ISmsNotification[];
	push?: IPushNotification[];
}

/**
 * 文件存储端口接口
 */
export interface IFileStoragePort {
	/**
	 * 上传文件
	 *
	 * @param file - 文件数据
	 * @param options - 上传选项
	 * @returns 文件信息
	 */
	upload(file: IFileUpload, options?: IFileUploadOptions): Promise<IFileInfo>;

	/**
	 * 下载文件
	 *
	 * @param fileId - 文件标识符
	 * @returns 文件数据
	 */
	download(fileId: string): Promise<Buffer>;

	/**
	 * 删除文件
	 *
	 * @param fileId - 文件标识符
	 * @returns 删除操作的Promise
	 */
	delete(fileId: string): Promise<void>;

	/**
	 * 获取文件信息
	 *
	 * @param fileId - 文件标识符
	 * @returns 文件信息
	 */
	getFileInfo(fileId: string): Promise<IFileInfo>;
}

/**
 * 文件上传接口
 */
export interface IFileUpload {
	filename: string;
	content: Buffer;
	contentType: string;
	size: number;
}

/**
 * 文件上传选项接口
 */
export interface IFileUploadOptions {
	path?: string;
	overwrite?: boolean;
	metadata?: Record<string, unknown>;
}

/**
 * 文件信息接口
 */
export interface IFileInfo {
	id: string;
	filename: string;
	contentType: string;
	size: number;
	path: string;
	uploadedAt: Date;
	metadata: Record<string, unknown>;
}
