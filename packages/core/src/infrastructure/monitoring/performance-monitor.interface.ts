/**
 * 性能监控器接口
 *
 * @description 定义性能监控系统的核心功能和行为
 * 性能监控器负责收集、存储、分析和报告系统性能指标
 *
 * ## 业务规则
 *
 * ### 指标收集规则
 * - 支持实时和批量指标收集
 * - 提供指标的去重和聚合功能
 * - 支持自定义指标收集器
 *
 * ### 数据存储规则
 * - 支持指标的持久化存储
 * - 提供数据压缩和归档功能
 * - 支持数据的备份和恢复
 *
 * ### 监控告警规则
 * - 支持阈值告警和异常检测
 * - 提供多种告警通知方式
 * - 支持告警的抑制和恢复
 *
 * ### 性能优化规则
 * - 支持指标的采样和过滤
 * - 提供数据缓存和预聚合
 * - 支持异步处理和批量操作
 *
 * @example
 * ```typescript
 * const monitor = new CorePerformanceMonitor();
 *
 * // 启动监控
 * await monitor.start();
 *
 * // 收集指标
 * const metrics = await monitor.collectMetrics();
 *
 * // 查询历史数据
 * const history = await monitor.queryMetrics({
 *   startTime: new Date(Date.now() - 3600000),
 *   endTime: new Date()
 * });
 *
 * // 设置告警
 * await monitor.setAlert('cpu_usage', {
 *   threshold: 80,
 *   operator: 'greater_than',
 *   notification: 'email'
 * });
 * ```
 *
 * @since 1.0.0
 */

import type {
  IPerformanceMetrics,
  IPerformanceMetricsAggregation,
  IPerformanceMetricsQueryOptions,
  IPerformanceMetricsStatistics,
} from './performance-metrics.interface';

/**
 * 性能收集器接口
 *
 * @description 定义性能指标收集器的基本行为
 */
export interface IPerformanceCollector {
  /**
   * 收集性能指标
   *
   * @description 收集指定类型的性能指标
   * 收集器应该实现具体的指标收集逻辑
   *
   * @param metricType 指标类型
   * @param options 收集选项
   * @returns 收集到的指标数据
   *
   * @example
   * ```typescript
   * const systemMetrics = await collector.collect('system', {
   *   includeCpu: true,
   *   includeMemory: true
   * });
   * ```
   */
  collect(
    metricType: string,
    options?: Record<string, unknown>,
  ): Promise<Record<string, number>>;

  /**
   * 获取支持的指标类型
   *
   * @description 返回此收集器支持的指标类型列表
   *
   * @returns 支持的指标类型列表
   */
  getSupportedTypes(): string[];

  /**
   * 检查收集器是否健康
   *
   * @description 检查收集器的健康状态
   *
   * @returns 收集器是否健康
   */
  isHealthy(): Promise<boolean>;

  /**
   * 获取收集器名称
   *
   * @description 返回收集器的唯一名称
   *
   * @returns 收集器名称
   */
  getName(): string;
}

/**
 * 性能告警接口
 *
 * @description 定义性能告警的配置和处理
 */
export interface IPerformanceAlert {
  /** 告警ID */
  readonly id: string;
  /** 告警名称 */
  readonly name: string;
  /** 指标名称 */
  readonly metricName: string;
  /** 告警阈值 */
  readonly threshold: number;
  /** 比较操作符 */
  readonly operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  /** 告警级别 */
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  /** 是否启用 */
  readonly enabled: boolean;
  /** 告警描述 */
  readonly description?: string;
  /** 通知方式 */
  readonly notifications: string[];
  /** 创建时间 */
  readonly createdAt: Date;
  /** 最后触发时间 */
  readonly lastTriggeredAt?: Date;
  /** 触发次数 */
  readonly triggerCount: number;
}

/**
 * 性能监控器接口
 *
 * @description 定义性能监控系统的核心功能
 */
export interface IPerformanceMonitor {
  /**
   * 启动性能监控
   *
   * @description 启动性能监控服务
   * 开始收集性能指标和运行监控任务
   *
   * @returns 启动是否成功
   *
   * @example
   * ```typescript
   * await monitor.start();
   * ```
   */
  start(): Promise<void>;

  /**
   * 停止性能监控
   *
   * @description 停止性能监控服务
   * 停止收集性能指标和运行监控任务
   *
   * @returns 停止是否成功
   *
   * @example
   * ```typescript
   * await monitor.stop();
   * ```
   */
  stop(): Promise<void>;

  /**
   * 收集性能指标
   *
   * @description 收集当前的性能指标
   * 包括系统、应用和业务指标
   *
   * @param options 收集选项
   * @returns 性能指标数据
   *
   * @example
   * ```typescript
   * const metrics = await monitor.collectMetrics({
   *   includeSystem: true,
   *   includeApplication: true,
   *   includeBusiness: false
   * });
   * ```
   */
  collectMetrics(options?: {
    includeSystem?: boolean;
    includeApplication?: boolean;
    includeBusiness?: boolean;
    customCollectors?: string[];
  }): Promise<IPerformanceMetrics>;

  /**
   * 存储性能指标
   *
   * @description 将性能指标存储到持久化存储中
   *
   * @param metrics 性能指标数据
   * @returns 存储是否成功
   *
   * @example
   * ```typescript
   * await monitor.storeMetrics(metrics);
   * ```
   */
  storeMetrics(metrics: IPerformanceMetrics): Promise<boolean>;

  /**
   * 查询性能指标
   *
   * @description 查询历史性能指标数据
   * 支持时间范围、过滤条件和聚合操作
   *
   * @param options 查询选项
   * @returns 性能指标列表
   *
   * @example
   * ```typescript
   * const metrics = await monitor.queryMetrics({
   *   startTime: new Date(Date.now() - 3600000),
   *   endTime: new Date(),
   *   tenantId: 'tenant-123'
   * });
   * ```
   */
  queryMetrics(
    options: IPerformanceMetricsQueryOptions,
  ): Promise<IPerformanceMetrics[]>;

  /**
   * 聚合性能指标
   *
   * @description 对性能指标进行聚合统计
   * 支持平均值、最大值、最小值等聚合操作
   *
   * @param options 聚合选项
   * @returns 聚合后的指标数据
   *
   * @example
   * ```typescript
   * const aggregation = await monitor.aggregateMetrics({
   *   startTime: new Date(Date.now() - 86400000),
   *   endTime: new Date(),
   *   aggregationInterval: 3600000
   * });
   * ```
   */
  aggregateMetrics(
    options: IPerformanceMetricsQueryOptions,
  ): Promise<IPerformanceMetricsAggregation>;

  /**
   * 获取性能统计信息
   *
   * @description 获取性能指标的统计信息
   * 包括平均值、峰值、趋势等统计指标
   *
   * @param options 统计选项
   * @returns 性能统计信息
   *
   * @example
   * ```typescript
   * const stats = await monitor.getStatistics({
   *   startTime: new Date(Date.now() - 86400000),
   *   endTime: new Date()
   * });
   * ```
   */
  getStatistics(
    options: IPerformanceMetricsQueryOptions,
  ): Promise<IPerformanceMetricsStatistics>;

  /**
   * 设置性能告警
   *
   * @description 设置性能指标的告警规则
   * 当指标超过阈值时触发告警
   *
   * @param alert 告警配置
   * @returns 设置是否成功
   *
   * @example
   * ```typescript
   * await monitor.setAlert({
   *   id: 'cpu-alert',
   *   name: 'CPU使用率告警',
   *   metricName: 'cpu_usage',
   *   threshold: 80,
   *   operator: 'greater_than',
   *   severity: 'high',
   *   notifications: ['email', 'slack']
   * });
   * ```
   */
  setAlert(
    alert: Omit<IPerformanceAlert, 'createdAt' | 'triggerCount'>,
  ): Promise<boolean>;

  /**
   * 删除性能告警
   *
   * @description 删除指定的性能告警
   *
   * @param alertId 告警ID
   * @returns 删除是否成功
   *
   * @example
   * ```typescript
   * await monitor.removeAlert('cpu-alert');
   * ```
   */
  removeAlert(alertId: string): Promise<boolean>;

  /**
   * 获取所有告警
   *
   * @description 获取所有配置的性能告警
   *
   * @returns 告警列表
   *
   * @example
   * ```typescript
   * const alerts = await monitor.getAlerts();
   * ```
   */
  getAlerts(): Promise<IPerformanceAlert[]>;

  /**
   * 注册性能收集器
   *
   * @description 注册自定义性能收集器
   *
   * @param collector 性能收集器
   * @returns 注册是否成功
   *
   * @example
   * ```typescript
   * await monitor.registerCollector(customCollector);
   * ```
   */
  registerCollector(collector: IPerformanceCollector): Promise<boolean>;

  /**
   * 注销性能收集器
   *
   * @description 注销指定的性能收集器
   *
   * @param collectorName 收集器名称
   * @returns 注销是否成功
   *
   * @example
   * ```typescript
   * await monitor.unregisterCollector('custom-collector');
   * ```
   */
  unregisterCollector(collectorName: string): Promise<boolean>;

  /**
   * 检查监控器是否健康
   *
   * @description 检查性能监控器的健康状态
   *
   * @returns 监控器是否健康
   *
   * @example
   * ```typescript
   * const isHealthy = await monitor.isHealthy();
   * ```
   */
  isHealthy(): Promise<boolean>;

  /**
   * 获取监控器统计信息
   *
   * @description 获取监控器的运行统计信息
   *
   * @returns 监控器统计信息
   *
   * @example
   * ```typescript
   * const stats = monitor.getMonitorStatistics();
   * ```
   */
  getMonitorStatistics(): {
    readonly isRunning: boolean;
    readonly startTime?: Date;
    readonly totalMetricsCollected: number;
    readonly totalAlertsTriggered: number;
    readonly registeredCollectors: number;
    readonly activeAlerts: number;
  };
}
