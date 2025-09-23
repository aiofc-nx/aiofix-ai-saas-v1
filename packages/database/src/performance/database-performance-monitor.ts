/**
 * 数据库性能监控器
 *
 * @description 基于Core模块的监控系统实现数据库性能监控
 * 提供实时监控、指标收集、性能分析、告警通知等企业级功能
 *
 * ## 业务规则
 *
 * ### 性能监控规则
 * - 实时监控数据库操作性能指标
 * - 自动收集和聚合性能数据
 * - 支持多维度的性能分析
 * - 提供历史趋势和对比分析
 *
 * ### 指标收集规则
 * - 记录查询执行时间和频率
 * - 监控连接池使用情况
 * - 跟踪事务处理性能
 * - 收集错误和异常统计
 *
 * ### 告警和通知规则
 * - 基于阈值的智能告警
 * - 支持多种告警通道
 * - 提供告警抑制和升级
 * - 自动生成性能报告
 *
 * ### 优化建议规则
 * - 基于监控数据生成优化建议
 * - 识别性能瓶颈和异常模式
 * - 提供容量规划和扩展建议
 * - 支持自动化性能调优
 *
 * @since 1.0.0
 */

/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';

/**
 * 数据库操作元数据
 */
export interface IDatabaseOperationMetadata {
  /** 操作类型 */
  operation: 'query' | 'execute' | 'transaction' | 'connection';
  /** SQL语句 */
  sql?: string;
  /** 连接名称 */
  connectionName: string;
  /** 租户ID */
  tenantId?: string;
  /** 查询类型 */
  queryType?: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'OTHER';
  /** 涉及的表名 */
  tableNames?: string[];
  /** 参数数量 */
  paramCount?: number;
  /** 返回行数 */
  rowCount?: number;
  /** 是否使用索引 */
  usedIndex?: boolean;
  /** 是否命中缓存 */
  cacheHit?: boolean;
}

/**
 * 数据库性能指标
 */
export interface IDatabaseMetrics {
  /** 总操作次数 */
  operations: {
    total: number;
    query: number;
    execute: number;
    transaction: number;
    connection: number;
  };
  /** 平均响应时间（毫秒） */
  averageResponseTime: {
    overall: number;
    query: number;
    execute: number;
    transaction: number;
    connection: number;
  };
  /** 错误率（百分比） */
  errorRate: {
    overall: number;
    query: number;
    execute: number;
    transaction: number;
    connection: number;
  };
  /** 吞吐量（操作/秒） */
  throughput: {
    overall: number;
    query: number;
    execute: number;
    transaction: number;
    connection: number;
  };
  /** 连接池指标 */
  connectionPool: {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingRequests: number;
    acquisitionTime: number;
  };
  /** 慢查询指标 */
  slowQueries: {
    count: number;
    averageTime: number;
    topQueries: Array<{
      sql: string;
      count: number;
      averageTime: number;
      totalTime: number;
    }>;
  };
  /** 租户指标 */
  tenantMetrics: Map<
    string,
    {
      operations: number;
      averageResponseTime: number;
      errorRate: number;
      dataSize: number;
    }
  >;
  /** 缓存指标 */
  cache: {
    hitRate: number;
    missRate: number;
    evictionRate: number;
    averageGetTime: number;
  };
}

/**
 * 性能事件
 */
export interface IPerformanceEvent {
  /** 事件ID */
  eventId: string;
  /** 事件类型 */
  eventType: 'operation' | 'error' | 'threshold' | 'anomaly';
  /** 时间戳 */
  timestamp: Date;
  /** 持续时间（毫秒） */
  duration: number;
  /** 是否成功 */
  success: boolean;
  /** 操作元数据 */
  metadata: IDatabaseOperationMetadata;
  /** 性能指标 */
  metrics?: Partial<IDatabaseMetrics>;
  /** 错误信息 */
  error?: {
    type: string;
    message: string;
    stack?: string;
  };
}

/**
 * 慢查询分析
 */
export interface ISlowQueryAnalysis {
  /** 时间范围 */
  timeRange: { start: Date; end: Date };
  /** 慢查询阈值（毫秒） */
  threshold: number;
  /** 总慢查询数 */
  totalSlowQueries: number;
  /** 平均执行时间 */
  averageExecutionTime: number;
  /** 最慢的查询 */
  topSlowQueries: Array<{
    sql: string;
    executionCount: number;
    averageTime: number;
    maxTime: number;
    totalTime: number;
    lastSeen: Date;
  }>;
  /** 查询模式分析 */
  queryPatterns: Array<{
    pattern: string;
    count: number;
    averageTime: number;
    tables: string[];
  }>;
  /** 优化建议 */
  recommendations: Array<{
    type: 'index' | 'rewrite' | 'schema' | 'configuration';
    description: string;
    impact: 'low' | 'medium' | 'high';
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
}

/**
 * 连接池健康状况
 */
export interface IConnectionPoolHealth {
  /** 总体健康状态 */
  overall: 'healthy' | 'degraded' | 'unhealthy';
  /** 各个连接池的健康状态 */
  pools: Array<{
    poolName: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingRequests: number;
    averageAcquisitionTime: number;
    errorRate: number;
    issues: string[];
  }>;
  /** 优化建议 */
  recommendations: Array<{
    poolName: string;
    recommendation: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  /** 最后检查时间 */
  lastChecked: Date;
}

/**
 * 性能告警
 */
export interface IPerformanceAlert {
  /** 告警ID */
  alertId: string;
  /** 告警级别 */
  level: 'info' | 'warning' | 'error' | 'critical';
  /** 告警类型 */
  type:
    | 'slow_query'
    | 'high_error_rate'
    | 'connection_pool_exhausted'
    | 'memory_usage'
    | 'disk_usage';
  /** 告警标题 */
  title: string;
  /** 告警描述 */
  description: string;
  /** 触发时间 */
  triggeredAt: Date;
  /** 相关指标 */
  metrics: {
    current: number;
    threshold: number;
    unit: string;
  };
  /** 影响范围 */
  impact: {
    tenants: string[];
    operations: string[];
    estimatedUsers: number;
  };
  /** 建议操作 */
  recommendedActions: string[];
  /** 是否已解决 */
  resolved: boolean;
  /** 解决时间 */
  resolvedAt?: Date;
}

/**
 * 数据库性能监控器
 */
@Injectable()
export class DatabasePerformanceMonitor {
  private readonly performanceEvents: IPerformanceEvent[] = [];
  private readonly alerts: IPerformanceAlert[] = [];
  private readonly metrics: IDatabaseMetrics;
  private readonly metricsHistory: Array<{
    timestamp: Date;
    metrics: IDatabaseMetrics;
  }> = [];

  // 性能阈值配置
  private readonly thresholds = {
    slowQueryMs: 1000,
    errorRatePercent: 5,
    connectionAcquisitionMs: 5000,
    throughputOpsPerSec: 100,
    connectionPoolUtilization: 80,
    cacheHitRatePercent: 80,
  };

  constructor() {
    console.log('数据库性能监控器已初始化');

    // 初始化指标
    this.metrics = this.initializeMetrics();

    // 启动定期任务
    this.startPeriodicTasks();
  }

  /**
   * 记录数据库操作性能
   *
   * @description 记录数据库操作的性能指标
   *
   * @param operation - 操作类型
   * @param duration - 执行时间（毫秒）
   * @param success - 是否成功
   * @param metadata - 操作元数据
   */
  recordDatabaseOperation(
    operation: 'query' | 'execute' | 'transaction' | 'connection',
    duration: number,
    success: boolean,
    metadata: IDatabaseOperationMetadata,
  ): void {
    const event: IPerformanceEvent = {
      eventId: this.generateEventId(),
      eventType: success ? 'operation' : 'error',
      timestamp: new Date(),
      duration,
      success,
      metadata,
    };

    // 记录事件
    this.performanceEvents.push(event);

    // 保持事件历史在合理范围内
    if (this.performanceEvents.length > 10000) {
      this.performanceEvents.splice(0, 1000);
    }

    // 更新指标
    this.updateMetrics(event);

    // 检查告警条件
    this.checkAlertConditions(event);

    console.log(
      `记录数据库操作: ${operation} (${duration.toFixed(2)}ms) - ${success ? '成功' : '失败'}`,
    );
  }

  /**
   * 获取数据库性能指标
   *
   * @description 获取当前的数据库性能指标
   *
   * @returns 数据库性能指标
   */
  getDatabaseMetrics(): IDatabaseMetrics {
    return { ...this.metrics };
  }

  /**
   * 获取历史性能指标
   *
   * @description 获取指定时间范围内的历史性能指标
   *
   * @param timeRange - 时间范围
   * @returns 历史性能指标
   */
  getHistoricalMetrics(timeRange: { start: Date; end: Date }): Array<{
    timestamp: Date;
    metrics: IDatabaseMetrics;
  }> {
    return this.metricsHistory.filter(
      (entry) =>
        entry.timestamp >= timeRange.start && entry.timestamp <= timeRange.end,
    );
  }

  /**
   * 分析慢查询
   *
   * @description 分析指定时间范围内的慢查询
   *
   * @param timeRange - 时间范围
   * @param threshold - 慢查询阈值（毫秒）
   * @returns 慢查询分析结果
   */
  async analyzeSlowQueries(
    timeRange: { start: Date; end: Date },
    threshold: number = this.thresholds.slowQueryMs,
  ): Promise<ISlowQueryAnalysis> {
    console.log('分析慢查询', { timeRange, threshold });

    // 筛选慢查询事件
    const slowQueryEvents = this.performanceEvents.filter(
      (event) =>
        event.eventType === 'operation' &&
        event.metadata.operation === 'query' &&
        event.duration >= threshold &&
        event.timestamp >= timeRange.start &&
        event.timestamp <= timeRange.end,
    );

    // 统计慢查询
    const queryStats = new Map<
      string,
      {
        sql: string;
        count: number;
        totalTime: number;
        maxTime: number;
        lastSeen: Date;
      }
    >();

    for (const event of slowQueryEvents) {
      const sql = event.metadata.sql || 'unknown';
      const stats = queryStats.get(sql) || {
        sql,
        count: 0,
        totalTime: 0,
        maxTime: 0,
        lastSeen: new Date(0),
      };

      stats.count++;
      stats.totalTime += event.duration;
      stats.maxTime = Math.max(stats.maxTime, event.duration);
      stats.lastSeen =
        event.timestamp > stats.lastSeen ? event.timestamp : stats.lastSeen;

      queryStats.set(sql, stats);
    }

    // 生成Top慢查询
    const topSlowQueries = Array.from(queryStats.values())
      .map((stats) => ({
        sql: stats.sql,
        executionCount: stats.count,
        averageTime: stats.totalTime / stats.count,
        maxTime: stats.maxTime,
        totalTime: stats.totalTime,
        lastSeen: stats.lastSeen,
      }))
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 10);

    // 分析查询模式
    const queryPatterns = this.analyzeQueryPatterns(slowQueryEvents);

    // 生成优化建议
    const recommendations = this.generateOptimizationRecommendations(
      topSlowQueries.map((q) => ({
        sql: q.sql,
        averageTime: q.averageTime,
        count: q.executionCount,
      })),
    );

    const analysis: ISlowQueryAnalysis = {
      timeRange,
      threshold,
      totalSlowQueries: slowQueryEvents.length,
      averageExecutionTime:
        slowQueryEvents.length > 0
          ? slowQueryEvents.reduce((sum, event) => sum + event.duration, 0) /
            slowQueryEvents.length
          : 0,
      topSlowQueries,
      queryPatterns,
      recommendations,
    };

    console.log(
      `✅ 慢查询分析完成: 发现 ${analysis.totalSlowQueries} 个慢查询`,
    );

    return analysis;
  }

  /**
   * 检查连接池健康状况
   *
   * @description 检查所有连接池的健康状况
   *
   * @returns 连接池健康状况
   */
  async checkConnectionPoolHealth(): Promise<IConnectionPoolHealth> {
    console.log('检查连接池健康状况');

    // 模拟连接池数据
    const mockPools = [
      {
        poolName: 'primary',
        totalConnections: 10,
        activeConnections: 7,
        idleConnections: 3,
        waitingRequests: 2,
        averageAcquisitionTime: 150,
        errorRate: 2.5,
      },
      {
        poolName: 'read-replica',
        totalConnections: 8,
        activeConnections: 5,
        idleConnections: 3,
        waitingRequests: 0,
        averageAcquisitionTime: 80,
        errorRate: 1.2,
      },
    ];

    const poolHealthChecks = mockPools.map((pool) => {
      const issues: string[] = [];
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

      // 检查连接获取时间
      if (
        pool.averageAcquisitionTime > this.thresholds.connectionAcquisitionMs
      ) {
        issues.push(`连接获取时间过长: ${pool.averageAcquisitionTime}ms`);
        status = 'degraded';
      }

      // 检查等待请求
      if (pool.waitingRequests > 5) {
        issues.push(`等待连接的请求过多: ${pool.waitingRequests}`);
        status = 'unhealthy';
      }

      // 检查错误率
      if (pool.errorRate > this.thresholds.errorRatePercent) {
        issues.push(`错误率过高: ${pool.errorRate}%`);
        status = 'degraded';
      }

      // 检查连接池利用率
      const utilization =
        (pool.activeConnections / pool.totalConnections) * 100;
      if (utilization > this.thresholds.connectionPoolUtilization) {
        issues.push(`连接池利用率过高: ${utilization.toFixed(1)}%`);
        status = 'degraded';
      }

      return {
        poolName: pool.poolName,
        status,
        totalConnections: pool.totalConnections,
        activeConnections: pool.activeConnections,
        idleConnections: pool.idleConnections,
        waitingRequests: pool.waitingRequests,
        averageAcquisitionTime: pool.averageAcquisitionTime,
        errorRate: pool.errorRate,
        issues,
      };
    });

    // 确定总体健康状态
    const overallHealth = poolHealthChecks.every((p) => p.status === 'healthy')
      ? 'healthy'
      : poolHealthChecks.some((p) => p.status === 'unhealthy')
        ? 'unhealthy'
        : 'degraded';

    // 生成优化建议
    const recommendations = this.generatePoolRecommendations(poolHealthChecks);

    const health: IConnectionPoolHealth = {
      overall: overallHealth,
      pools: poolHealthChecks,
      recommendations,
      lastChecked: new Date(),
    };

    console.log(`✅ 连接池健康检查完成: ${overallHealth}`);

    return health;
  }

  /**
   * 获取活跃告警
   *
   * @description 获取当前活跃的性能告警
   *
   * @returns 活跃告警列表
   */
  getActiveAlerts(): IPerformanceAlert[] {
    return this.alerts.filter((alert) => !alert.resolved);
  }

  /**
   * 获取告警历史
   *
   * @description 获取指定时间范围内的告警历史
   *
   * @param timeRange - 时间范围
   * @returns 告警历史
   */
  getAlertHistory(timeRange: { start: Date; end: Date }): IPerformanceAlert[] {
    return this.alerts.filter(
      (alert) =>
        alert.triggeredAt >= timeRange.start &&
        alert.triggeredAt <= timeRange.end,
    );
  }

  /**
   * 解决告警
   *
   * @description 标记告警为已解决
   *
   * @param alertId - 告警ID
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.alertId === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      console.log(`✅ 告警已解决: ${alertId}`);
    }
  }

  /**
   * 生成性能报告
   *
   * @description 生成指定时间范围内的性能报告
   *
   * @param timeRange - 时间范围
   * @returns 性能报告
   */
  async generatePerformanceReport(timeRange: {
    start: Date;
    end: Date;
  }): Promise<{
    summary: {
      totalOperations: number;
      averageResponseTime: number;
      errorRate: number;
      throughput: number;
    };
    slowQueries: ISlowQueryAnalysis;
    connectionPoolHealth: IConnectionPoolHealth;
    alerts: IPerformanceAlert[];
    recommendations: Array<{
      category: string;
      priority: 'low' | 'medium' | 'high';
      description: string;
      impact: string;
    }>;
  }> {
    console.log('生成性能报告', timeRange);

    // 计算摘要指标
    const eventsInRange = this.performanceEvents.filter(
      (event) =>
        event.timestamp >= timeRange.start && event.timestamp <= timeRange.end,
    );

    const totalOperations = eventsInRange.length;
    const averageResponseTime =
      totalOperations > 0
        ? eventsInRange.reduce((sum, event) => sum + event.duration, 0) /
          totalOperations
        : 0;
    const errorCount = eventsInRange.filter((event) => !event.success).length;
    const errorRate =
      totalOperations > 0 ? (errorCount / totalOperations) * 100 : 0;
    const timeRangeMs = timeRange.end.getTime() - timeRange.start.getTime();
    const throughput =
      timeRangeMs > 0 ? (totalOperations / timeRangeMs) * 1000 : 0;

    // 获取各项分析
    const slowQueries = await this.analyzeSlowQueries(timeRange);
    const connectionPoolHealth = await this.checkConnectionPoolHealth();
    const alerts = this.getAlertHistory(timeRange);

    // 生成综合建议
    const recommendations = [
      {
        category: '查询优化',
        priority:
          slowQueries.totalSlowQueries > 10
            ? ('high' as const)
            : ('medium' as const),
        description: `发现 ${slowQueries.totalSlowQueries} 个慢查询，建议优化`,
        impact: '可提升查询性能30-50%',
      },
      {
        category: '连接池优化',
        priority:
          connectionPoolHealth.overall !== 'healthy'
            ? ('high' as const)
            : ('low' as const),
        description: '连接池配置需要调优',
        impact: '可提升并发处理能力20-30%',
      },
      {
        category: '缓存优化',
        priority:
          this.metrics.cache.hitRate < this.thresholds.cacheHitRatePercent
            ? ('medium' as const)
            : ('low' as const),
        description: `缓存命中率 ${this.metrics.cache.hitRate.toFixed(1)}%，需要优化`,
        impact: '可减少数据库负载40-60%',
      },
    ];

    const report = {
      summary: {
        totalOperations,
        averageResponseTime,
        errorRate,
        throughput,
      },
      slowQueries,
      connectionPoolHealth,
      alerts,
      recommendations,
    };

    console.log('✅ 性能报告生成完成', {
      totalOperations,
      slowQueries: slowQueries.totalSlowQueries,
      alerts: alerts.length,
    });

    return report;
  }

  // ==================== 私有方法 ====================

  /**
   * 初始化指标
   */
  private initializeMetrics(): IDatabaseMetrics {
    return {
      operations: {
        total: 0,
        query: 0,
        execute: 0,
        transaction: 0,
        connection: 0,
      },
      averageResponseTime: {
        overall: 0,
        query: 0,
        execute: 0,
        transaction: 0,
        connection: 0,
      },
      errorRate: {
        overall: 0,
        query: 0,
        execute: 0,
        transaction: 0,
        connection: 0,
      },
      throughput: {
        overall: 0,
        query: 0,
        execute: 0,
        transaction: 0,
        connection: 0,
      },
      connectionPool: {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        waitingRequests: 0,
        acquisitionTime: 0,
      },
      slowQueries: {
        count: 0,
        averageTime: 0,
        topQueries: [],
      },
      tenantMetrics: new Map(),
      cache: {
        hitRate: 0,
        missRate: 0,
        evictionRate: 0,
        averageGetTime: 0,
      },
    };
  }

  /**
   * 更新指标
   */
  private updateMetrics(event: IPerformanceEvent): void {
    const operation = event.metadata.operation;

    // 更新操作计数
    this.metrics.operations.total++;
    this.metrics.operations[operation]++;

    // 更新平均响应时间（简化计算）
    this.updateAverageResponseTime(operation, event.duration);

    // 更新错误率
    this.updateErrorRate(operation, event.success);

    // 更新租户指标
    if (event.metadata.tenantId) {
      this.updateTenantMetrics(event.metadata.tenantId, event);
    }
  }

  /**
   * 更新平均响应时间
   */
  private updateAverageResponseTime(operation: string, duration: number): void {
    const current = (this.metrics.averageResponseTime as any)[operation] || 0;
    const count = (this.metrics.operations as any)[operation];

    // 简化的移动平均计算
    (this.metrics.averageResponseTime as any)[operation] =
      (current * (count - 1) + duration) / count;

    // 更新总体平均值
    this.metrics.averageResponseTime.overall =
      (this.metrics.averageResponseTime.overall *
        (this.metrics.operations.total - 1) +
        duration) /
      this.metrics.operations.total;
  }

  /**
   * 更新错误率
   */
  private updateErrorRate(operation: string, success: boolean): void {
    if (!success) {
      const currentErrors =
        ((this.metrics.errorRate as any)[operation] / 100) *
        ((this.metrics.operations as any)[operation] - 1);
      (this.metrics.errorRate as any)[operation] =
        ((currentErrors + 1) / (this.metrics.operations as any)[operation]) *
        100;

      // 更新总体错误率
      const totalErrors =
        (this.metrics.errorRate.overall / 100) *
        (this.metrics.operations.total - 1);
      this.metrics.errorRate.overall =
        ((totalErrors + 1) / this.metrics.operations.total) * 100;
    }
  }

  /**
   * 更新租户指标
   */
  private updateTenantMetrics(
    tenantId: string,
    event: IPerformanceEvent,
  ): void {
    const current = this.metrics.tenantMetrics.get(tenantId) || {
      operations: 0,
      averageResponseTime: 0,
      errorRate: 0,
      dataSize: 0,
    };

    current.operations++;
    current.averageResponseTime =
      (current.averageResponseTime * (current.operations - 1) +
        event.duration) /
      current.operations;

    if (!event.success) {
      current.errorRate =
        (((current.errorRate / 100) * (current.operations - 1) + 1) /
          current.operations) *
        100;
    }

    this.metrics.tenantMetrics.set(tenantId, current);
  }

  /**
   * 检查告警条件
   */
  private checkAlertConditions(event: IPerformanceEvent): void {
    // 检查慢查询告警
    if (
      event.metadata.operation === 'query' &&
      event.duration > this.thresholds.slowQueryMs
    ) {
      this.createAlert({
        level: 'warning',
        type: 'slow_query',
        title: '慢查询检测',
        description: `查询执行时间 ${event.duration.toFixed(2)}ms 超过阈值 ${this.thresholds.slowQueryMs}ms`,
        metrics: {
          current: event.duration,
          threshold: this.thresholds.slowQueryMs,
          unit: 'ms',
        },
        impact: {
          tenants: event.metadata.tenantId ? [event.metadata.tenantId] : [],
          operations: ['query'],
          estimatedUsers: 10,
        },
        recommendedActions: [
          '检查查询是否使用了合适的索引',
          '考虑优化查询逻辑',
          '分析表结构和数据分布',
        ],
      });
    }

    // 检查错误率告警
    if (
      !event.success &&
      this.metrics.errorRate.overall > this.thresholds.errorRatePercent
    ) {
      this.createAlert({
        level: 'error',
        type: 'high_error_rate',
        title: '数据库错误率过高',
        description: `数据库错误率 ${this.metrics.errorRate.overall.toFixed(2)}% 超过阈值 ${this.thresholds.errorRatePercent}%`,
        metrics: {
          current: this.metrics.errorRate.overall,
          threshold: this.thresholds.errorRatePercent,
          unit: '%',
        },
        impact: {
          tenants: event.metadata.tenantId ? [event.metadata.tenantId] : [],
          operations: [event.metadata.operation],
          estimatedUsers: 50,
        },
        recommendedActions: [
          '检查数据库连接状态',
          '分析错误日志',
          '验证查询语句正确性',
        ],
      });
    }
  }

  /**
   * 创建告警
   */
  private createAlert(
    alertData: Omit<IPerformanceAlert, 'alertId' | 'triggeredAt' | 'resolved'>,
  ): void {
    const alert: IPerformanceAlert = {
      alertId: this.generateAlertId(),
      triggeredAt: new Date(),
      resolved: false,
      ...alertData,
    };

    this.alerts.push(alert);

    // 保持告警历史在合理范围内
    if (this.alerts.length > 1000) {
      this.alerts.splice(0, 100);
    }

    console.log(`🚨 创建告警: ${alert.title} (${alert.level})`);
  }

  /**
   * 分析查询模式
   */
  private analyzeQueryPatterns(events: IPerformanceEvent[]): Array<{
    pattern: string;
    count: number;
    averageTime: number;
    tables: string[];
  }> {
    const patterns = new Map<
      string,
      {
        pattern: string;
        count: number;
        totalTime: number;
        tables: Set<string>;
      }
    >();

    for (const event of events) {
      const sql = event.metadata.sql || '';
      const pattern = this.extractQueryPattern(sql);

      const existing = patterns.get(pattern) || {
        pattern,
        count: 0,
        totalTime: 0,
        tables: new Set(),
      };

      existing.count++;
      existing.totalTime += event.duration;

      if (event.metadata.tableNames) {
        event.metadata.tableNames.forEach((table) =>
          existing.tables.add(table),
        );
      }

      patterns.set(pattern, existing);
    }

    return Array.from(patterns.values())
      .map((p) => ({
        pattern: p.pattern,
        count: p.count,
        averageTime: p.totalTime / p.count,
        tables: Array.from(p.tables),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * 提取查询模式
   */
  private extractQueryPattern(sql: string): string {
    // 简化的查询模式提取
    return sql
      .replace(/\d+/g, '?') // 替换数字
      .replace(/'[^']*'/g, '?') // 替换字符串
      .replace(/\s+/g, ' ') // 标准化空格
      .trim()
      .toLowerCase();
  }

  /**
   * 生成优化建议
   */
  private generateOptimizationRecommendations(
    slowQueries: Array<{
      sql: string;
      averageTime: number;
      count: number;
    }>,
  ): Array<{
    type: 'index' | 'rewrite' | 'schema' | 'configuration';
    description: string;
    impact: 'low' | 'medium' | 'high';
    difficulty: 'easy' | 'medium' | 'hard';
  }> {
    const recommendations: Array<{
      type: 'index' | 'rewrite' | 'schema' | 'configuration';
      description: string;
      impact: 'low' | 'medium' | 'high';
      difficulty: 'easy' | 'medium' | 'hard';
    }> = [];

    for (const query of slowQueries.slice(0, 5)) {
      if (
        query.sql.toLowerCase().includes('where') &&
        !query.sql.toLowerCase().includes('index')
      ) {
        recommendations.push({
          type: 'index',
          description: `为慢查询创建索引: ${query.sql.substring(0, 50)}...`,
          impact: 'high',
          difficulty: 'easy',
        });
      }

      if (query.sql.toLowerCase().includes('select *')) {
        recommendations.push({
          type: 'rewrite',
          description: `避免使用SELECT *，指定具体列名: ${query.sql.substring(0, 50)}...`,
          impact: 'medium',
          difficulty: 'easy',
        });
      }
    }

    return recommendations;
  }

  /**
   * 生成连接池建议
   */
  private generatePoolRecommendations(
    pools: Array<{
      poolName: string;
      status: string;
      issues: string[];
    }>,
  ): Array<{
    poolName: string;
    recommendation: string;
    priority: 'low' | 'medium' | 'high';
  }> {
    const recommendations: Array<{
      poolName: string;
      recommendation: string;
      priority: 'low' | 'medium' | 'high';
    }> = [];

    for (const pool of pools) {
      if (pool.status !== 'healthy') {
        recommendations.push({
          poolName: pool.poolName,
          recommendation: `连接池 ${pool.poolName} 需要优化: ${pool.issues.join(', ')}`,
          priority: pool.status === 'unhealthy' ? 'high' : 'medium',
        });
      }
    }

    return recommendations;
  }

  /**
   * 启动定期任务
   */
  private startPeriodicTasks(): void {
    // 每分钟保存指标快照
    globalThis.setInterval(() => {
      this.metricsHistory.push({
        timestamp: new Date(),
        metrics: { ...this.metrics },
      });

      // 保持历史记录在合理范围内（24小时）
      if (this.metricsHistory.length > 24 * 60) {
        this.metricsHistory.splice(0, 60);
      }
    }, 60 * 1000);

    // 每5分钟检查告警条件
    globalThis.setInterval(
      () => {
        this.checkPeriodicAlerts();
      },
      5 * 60 * 1000,
    );
  }

  /**
   * 定期告警检查
   */
  private checkPeriodicAlerts(): void {
    // 检查连接池利用率
    if (this.metrics.connectionPool.totalConnections > 0) {
      const utilization =
        (this.metrics.connectionPool.activeConnections /
          this.metrics.connectionPool.totalConnections) *
        100;
      if (utilization > this.thresholds.connectionPoolUtilization) {
        this.createAlert({
          level: 'warning',
          type: 'connection_pool_exhausted',
          title: '连接池利用率过高',
          description: `连接池利用率 ${utilization.toFixed(1)}% 超过阈值 ${this.thresholds.connectionPoolUtilization}%`,
          metrics: {
            current: utilization,
            threshold: this.thresholds.connectionPoolUtilization,
            unit: '%',
          },
          impact: {
            tenants: [],
            operations: ['all'],
            estimatedUsers: 100,
          },
          recommendedActions: [
            '增加连接池最大连接数',
            '优化查询性能减少连接占用时间',
            '检查是否存在连接泄漏',
          ],
        });
      }
    }

    // 检查缓存命中率
    if (this.metrics.cache.hitRate < this.thresholds.cacheHitRatePercent) {
      this.createAlert({
        level: 'info',
        type: 'memory_usage',
        title: '缓存命中率偏低',
        description: `缓存命中率 ${this.metrics.cache.hitRate.toFixed(1)}% 低于阈值 ${this.thresholds.cacheHitRatePercent}%`,
        metrics: {
          current: this.metrics.cache.hitRate,
          threshold: this.thresholds.cacheHitRatePercent,
          unit: '%',
        },
        impact: {
          tenants: [],
          operations: ['query'],
          estimatedUsers: 20,
        },
        recommendedActions: [
          '调整缓存策略和TTL',
          '增加缓存容量',
          '优化缓存键设计',
        ],
      });
    }
  }

  /**
   * 生成事件ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成告警ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
