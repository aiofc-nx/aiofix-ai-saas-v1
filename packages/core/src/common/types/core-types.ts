/**
 * Core模块核心类型定义
 *
 * @description 定义Core模块对外暴露的核心类型
 * 为其他模块提供统一的类型接口
 *
 * @since 1.0.0
 */

// 重新导出租户上下文相关类型
export type { ITenantContextData as TenantContext } from '../multi-tenant/context/tenant-context-manager';

// 重新导出隔离策略相关类型
export type {
  IsolationLevel,
  DataSensitivity,
  DataIsolationContext,
} from '../multi-tenant/isolation/isolation-context';

// 错误处理相关类型在error-handling.interface中定义

// 重新导出性能监控相关类型
export type {
  IPerformanceMetrics,
  ISystemMetrics,
  IApplicationMetrics,
  IBusinessMetrics,
} from '../../infrastructure/monitoring/performance-metrics.interface';

// CQRS相关类型在各自的总线接口中定义
