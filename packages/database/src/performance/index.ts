/**
 * 数据库性能模块导出
 *
 * @description 导出数据库性能监控和优化相关功能
 * 包括连接池管理、查询优化、性能监控等
 *
 * @since 1.0.0
 */

// 智能连接池管理器
export { IntelligentConnectionPoolManager } from './connection-pool-manager';

export type {
  IConnectionPoolConfig,
  IConnectionPoolStatus,
  IConnectionUsagePattern,
  IConnectionPoolOptimization,
  IConnectionPoolEvent,
} from './connection-pool-manager';

// 智能查询优化器
export { IntelligentQueryOptimizer } from './query-optimizer';

export type {
  IQueryExecutionPlan,
  IExecutionPlanNode,
  IQueryOptimization,
  IOptimizationSuggestion,
  IIndexSuggestion,
  IIndexDefinition,
  IQueryPattern,
  ISlowQueryAnalysis,
} from './query-optimizer';

// 数据库性能监控器
export { DatabasePerformanceMonitor } from './database-performance-monitor';

export type {
  IDatabaseOperationMetadata,
  IDatabaseMetrics,
  IPerformanceEvent,
  IConnectionPoolHealth,
  IPerformanceAlert,
} from './database-performance-monitor';
