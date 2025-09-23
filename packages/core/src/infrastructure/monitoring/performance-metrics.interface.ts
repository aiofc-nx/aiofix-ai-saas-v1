/**
 * 性能指标接口
 *
 * @description 定义系统性能监控的核心指标和数据结构
 * 性能指标是监控系统运行状态和性能表现的重要数据
 *
 * ## 业务规则
 *
 * ### 指标收集规则
 * - 所有指标必须具有时间戳
 * - 指标值必须为数值类型
 * - 支持指标的聚合和统计
 *
 * ### 指标分类规则
 * - 系统指标：CPU、内存、磁盘等
 * - 应用指标：请求数、响应时间、错误率等
 * - 业务指标：用户数、订单数、收入等
 *
 * ### 指标存储规则
 * - 支持指标的持久化存储
 * - 提供指标的历史数据查询
 * - 支持指标的实时监控
 *
 * @example
 * ```typescript
 * const metrics: IPerformanceMetrics = {
 *   timestamp: new Date(),
 *   systemMetrics: {
 *     cpuUsage: 45.2,
 *     memoryUsage: 67.8,
 *     diskUsage: 23.1
 *   },
 *   applicationMetrics: {
 *     requestCount: 1250,
 *     averageResponseTime: 150,
 *     errorRate: 0.02
 *   },
 *   businessMetrics: {
 *     activeUsers: 850,
 *     ordersPerMinute: 12
 *   }
 * };
 * ```
 *
 * @since 1.0.0
 */

/**
 * 系统性能指标接口
 *
 * @description 定义系统级别的性能指标
 */
export interface ISystemMetrics {
  /** CPU 使用率（百分比） */
  readonly cpuUsage: number;
  /** 内存使用率（百分比） */
  readonly memoryUsage: number;
  /** 磁盘使用率（百分比） */
  readonly diskUsage: number;
  /** 网络 I/O 使用率（百分比） */
  readonly networkUsage: number;
  /** 系统负载平均值 */
  readonly loadAverage: number;
  /** 进程数量 */
  readonly processCount: number;
  /** 线程数量 */
  readonly threadCount: number;
  /** 文件描述符使用数量 */
  readonly fileDescriptorCount: number;
}

/**
 * 应用性能指标接口
 *
 * @description 定义应用级别的性能指标
 */
export interface IApplicationMetrics {
  /** 请求总数 */
  readonly requestCount: number;
  /** 平均响应时间（毫秒） */
  readonly averageResponseTime: number;
  /** 最大响应时间（毫秒） */
  readonly maxResponseTime: number;
  /** 最小响应时间（毫秒） */
  readonly minResponseTime: number;
  /** 错误率（0-1之间的小数） */
  readonly errorRate: number;
  /** 吞吐量（请求/秒） */
  readonly throughput: number;
  /** 并发连接数 */
  readonly concurrentConnections: number;
  /** 队列长度 */
  readonly queueLength: number;
  /** 缓存命中率（0-1之间的小数） */
  readonly cacheHitRate: number;
}

/**
 * 业务性能指标接口
 *
 * @description 定义业务级别的性能指标
 */
export interface IBusinessMetrics {
  /** 活跃用户数 */
  readonly activeUsers: number;
  /** 每分钟订单数 */
  readonly ordersPerMinute: number;
  /** 每分钟收入 */
  readonly revenuePerMinute: number;
  /** 用户注册数 */
  readonly userRegistrations: number;
  /** 用户登录数 */
  readonly userLogins: number;
  /** 页面浏览量 */
  readonly pageViews: number;
  /** 会话数量 */
  readonly sessionCount: number;
  /** 转换率（0-1之间的小数） */
  readonly conversionRate: number;
}

/**
 * 性能指标接口
 *
 * @description 定义完整的性能指标数据结构
 */
export interface IPerformanceMetrics {
  /** 指标收集时间戳 */
  readonly timestamp: Date;
  /** 系统性能指标 */
  readonly systemMetrics: ISystemMetrics;
  /** 应用性能指标 */
  readonly applicationMetrics: IApplicationMetrics;
  /** 业务性能指标 */
  readonly businessMetrics: IBusinessMetrics;
  /** 租户标识符 */
  readonly tenantId: string;
  /** 服务标识符 */
  readonly serviceId: string;
  /** 实例标识符 */
  readonly instanceId: string;
  /** 指标版本 */
  readonly version: string;
  /** 自定义指标 */
  readonly customMetrics?: Record<string, number>;
}

/**
 * 性能指标聚合接口
 *
 * @description 定义性能指标的聚合统计信息
 */
export interface IPerformanceMetricsAggregation {
  /** 聚合时间范围开始 */
  readonly startTime: Date;
  /** 聚合时间范围结束 */
  readonly endTime: Date;
  /** 聚合的指标数量 */
  readonly count: number;
  /** 系统指标聚合 */
  readonly systemMetrics: {
    readonly avgCpuUsage: number;
    readonly maxCpuUsage: number;
    readonly avgMemoryUsage: number;
    readonly maxMemoryUsage: number;
    readonly avgDiskUsage: number;
    readonly maxDiskUsage: number;
  };
  /** 应用指标聚合 */
  readonly applicationMetrics: {
    readonly totalRequests: number;
    readonly avgResponseTime: number;
    readonly maxResponseTime: number;
    readonly minResponseTime: number;
    readonly avgErrorRate: number;
    readonly maxErrorRate: number;
    readonly avgThroughput: number;
    readonly maxThroughput: number;
  };
  /** 业务指标聚合 */
  readonly businessMetrics: {
    readonly avgActiveUsers: number;
    readonly maxActiveUsers: number;
    readonly totalOrders: number;
    readonly totalRevenue: number;
    readonly avgConversionRate: number;
    readonly maxConversionRate: number;
  };
}

/**
 * 性能指标查询选项接口
 *
 * @description 定义查询性能指标的选项
 */
export interface IPerformanceMetricsQueryOptions {
  /** 开始时间 */
  readonly startTime?: Date;
  /** 结束时间 */
  readonly endTime?: Date;
  /** 租户ID */
  readonly tenantId?: string;
  /** 服务ID */
  readonly serviceId?: string;
  /** 实例ID */
  readonly instanceId?: string;
  /** 聚合间隔（毫秒） */
  readonly aggregationInterval?: number;
  /** 指标类型过滤 */
  readonly metricTypes?: string[];
  /** 排序字段 */
  readonly sortBy?: string;
  /** 排序方向 */
  readonly sortOrder?: 'asc' | 'desc';
  /** 限制返回数量 */
  readonly limit?: number;
  /** 偏移量 */
  readonly offset?: number;
}

/**
 * 性能指标统计接口
 *
 * @description 定义性能指标的统计信息
 */
export interface IPerformanceMetricsStatistics {
  /** 统计时间范围 */
  readonly timeRange: {
    readonly start: Date;
    readonly end: Date;
  };
  /** 总指标数量 */
  readonly totalMetrics: number;
  /** 系统指标统计 */
  readonly systemStats: {
    readonly avgCpuUsage: number;
    readonly avgMemoryUsage: number;
    readonly avgDiskUsage: number;
    readonly peakCpuUsage: number;
    readonly peakMemoryUsage: number;
    readonly peakDiskUsage: number;
  };
  /** 应用指标统计 */
  readonly applicationStats: {
    readonly totalRequests: number;
    readonly avgResponseTime: number;
    readonly peakResponseTime: number;
    readonly avgErrorRate: number;
    readonly peakErrorRate: number;
    readonly avgThroughput: number;
    readonly peakThroughput: number;
  };
  /** 业务指标统计 */
  readonly businessStats: {
    readonly avgActiveUsers: number;
    readonly peakActiveUsers: number;
    readonly totalOrders: number;
    readonly totalRevenue: number;
    readonly avgConversionRate: number;
    readonly peakConversionRate: number;
  };
  /** 最后更新时间 */
  readonly lastUpdated: Date;
}
