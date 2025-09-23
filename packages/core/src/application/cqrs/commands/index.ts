/**
 * 命令系统导出
 *
 * @description 导出命令相关的所有公共API
 * @since 1.0.0
 */

// 基础设施
export * from './base';

// 处理器 - 明确导出以避免重复
export type {
	ICommandHandler as ICommandHandlerV2,
	ICommandHandlerFactory,
	ICommandHandlerRegistry,
	ICommandExecutionContext,
	ICommandExecutionResult,
	ICommandValidator,
	ICommandValidationResult as ICommandValidationResultV2
} from './handlers';

// 装饰器
export * from './decorators';
