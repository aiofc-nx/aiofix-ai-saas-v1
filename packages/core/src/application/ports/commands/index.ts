/**
 * 命令端口导出
 *
 * @description 导出命令侧专用的输出端口接口
 * @since 1.0.0
 */

// 命令侧端口接口
export type {
	IWriteRepositoryPort,
	IDomainEventPublisherPort,
	ITransactionManagerPort,
	ITransactionContext,
	IExternalServicePort,
	IServiceCallOptions,
	INotificationPort,
	IEmailNotification,
	IEmailAttachment,
	ISmsNotification,
	IPushNotification,
	INotificationBatch,
	IFileStoragePort,
	IFileUpload,
	IFileUploadOptions,
	IFileInfo
} from './command-ports.interface';
