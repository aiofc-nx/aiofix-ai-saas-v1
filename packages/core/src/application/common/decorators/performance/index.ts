/**
 * 性能监控装饰器导出
 *
 * @description 导出性能监控相关的装饰器和工具
 * @since 1.0.0
 */

export type { IPerformanceMonitorOptions } from './performance.decorator';
export {
  PerformanceMonitor,
  getPerformanceMonitorMetadata,
  PERFORMANCE_MONITOR_METADATA_KEY,
} from './performance.decorator';
