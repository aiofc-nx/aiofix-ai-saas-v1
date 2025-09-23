/**
 * 查询系统导出
 *
 * @description 导出查询相关的所有公共API
 * @since 1.0.0
 */

// 基础设施
export * from './base';

// 处理器 - 明确导出以避免重复
export type {
	IQueryHandler as IQueryHandlerV2,
	IQueryHandlerFactory,
	IQueryHandlerRegistry,
	IQueryExecutionContext,
	IQueryExecutionResult,
	IQueryValidator,
	IQueryValidationResult as IQueryValidationResultV2
} from './handlers';

// 装饰器
export * from './decorators';
