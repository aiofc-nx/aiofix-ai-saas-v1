/**
 * 数据库统计接口定义
 *
 * @description 定义数据库性能统计和健康检查相关的接口
 * 用于监控数据库状态和性能指标
 *
 * @since 1.0.0
 */

/**
 * 数据库统计信息接口
 */
export interface IDatabaseStats {
  connections: {
    active: number;
    idle: number;
    total: number;
  };
  queries: {
    total: number;
    successful: number;
    failed: number;
    averageTime: number;
  };
  transactions: {
    active: number;
    committed: number;
    rolledBack: number;
    averageTime: number;
  };
  lastUpdated: Date;
}

/**
 * 数据库健康状态接口
 */
export interface IDatabaseHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  connections: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    errorRate: number;
  }>;
  recommendations: string[];
  lastChecked: Date;
}
