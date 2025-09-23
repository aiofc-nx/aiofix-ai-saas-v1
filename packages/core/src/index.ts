/**
 * Core 模块导出文件
 *
 * 按照分层架构组织导出：
 * - core: 核心架构层
 * - infrastructure: 基础设施层
 * - application: 应用层
 * - domain: 领域层
 * - shared: 共享层
 *
 * @description Core 模块统一导出
 * @since 1.0.0
 */

// 通用功能层 (包含所有横切关注点)
// 注意：使用显式导出避免命名冲突
export {
	// 错误处理
	BaseError,
	ValidationError,
	EntityNotFoundError,
	BusinessRuleViolationError,
	// 多租户
	TenantContextManager,
	// CQRS 装饰器
	CommandHandler,
	QueryHandler,
	EventHandler,
	// CQRS 元数据
	getCommandHandlerMetadata,
	getQueryHandlerMetadata,
	isCommandHandler,
	isQueryHandler
} from './common';

// CQRS 接口类型
export type { ICommandHandlerOptions, IQueryHandlerOptions } from './common';

// 基础设施层
// 注意：使用显式导出避免命名冲突
export {
	// 性能监控
	PerformanceMonitor,
	PERFORMANCE_MONITOR_METADATA_KEY,
	getPerformanceMonitorMetadata
} from './infrastructure';

// 基础设施层接口类型
export type {
	ICommandExecutionContext,
	IPaginatedResult,
	IPerformanceMonitorOptions,
	IPermissionValidationResult
} from './infrastructure';

// 应用层
// 注意：使用显式导出避免命名冲突
export type { IValidationResult } from './application';

// 领域层
// 注意：使用显式导出避免命名冲突
export { EntityId } from './domain';

// 对外类型导出（为其他模块提供统一的类型接口）
// 注意：避免与上述模块的导出冲突，使用显式导出
export type {
	// 多租户相关类型
	TenantContext,
	IsolationLevel,
	DataSensitivity,
	DataIsolationContext,
	// 性能监控相关类型
	IPerformanceMonitor,
	IPerformanceCollector,
	IPerformanceAlert,
	// 实体和值对象类型
	BaseEntity,
	// 配置集成类型
	ICoreModuleConfig,
	ICoreConfigStatus
} from './common/types';

// 共享层已合并到通用功能层
// export * from './shared';
