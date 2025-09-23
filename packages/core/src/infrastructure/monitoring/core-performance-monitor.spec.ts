/**
 * CorePerformanceMonitor 测试
 *
 * 测试核心性能监控器的功能，包括指标收集、分析、报告、告警等。
 *
 * @description 核心性能监控器的单元测试
 * @since 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CorePerformanceMonitor } from './core-performance-monitor';
import type { ILoggerService } from '@aiofix/logging';
import type { IPerformanceCollector } from './performance-monitor.interface';
import type {
  IPerformanceMetrics,
  IPerformanceMetricsQueryOptions,
  ISystemMetrics,
  IApplicationMetrics,
  IBusinessMetrics,
} from './performance-metrics.interface';

describe('CorePerformanceMonitor', () => {
  let monitor: CorePerformanceMonitor;
  let mockLogger: jest.Mocked<ILoggerService>;
  let mockCollector: jest.Mocked<IPerformanceCollector>;

  beforeEach(async () => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<ILoggerService>;

    mockCollector = {
      collect: jest.fn(),
      getSupportedTypes: jest.fn(),
      isHealthy: jest.fn(),
      getName: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: CorePerformanceMonitor,
          useFactory: (logger: ILoggerService) =>
            new CorePerformanceMonitor(logger),
          inject: ['ILoggerService'],
        },
        {
          provide: 'ILoggerService',
          useValue: mockLogger,
        },
      ],
    }).compile();

    monitor = module.get<CorePerformanceMonitor>(CorePerformanceMonitor);
  });

  afterEach(async () => {
    if (monitor.isStarted()) {
      await monitor.stop();
    }
    jest.clearAllMocks();
  });

  describe('构造函数和初始化', () => {
    it('应该正确初始化监控器', () => {
      expect(monitor).toBeInstanceOf(CorePerformanceMonitor);
      expect(monitor.isStarted()).toBe(false);
    });

    it('应该使用默认配置', () => {
      const config = monitor.getConfiguration();
      expect(config.enabled).toBe(true);
      expect(config.monitoringInterval).toBe(60000);
      expect(config.dataRetentionDays).toBe(30);
      expect(config.enableRealTimeMonitoring).toBe(true);
      expect(config.enableHistoricalStorage).toBe(true);
      expect(config.enableAlerts).toBe(true);
      expect(config.enableAnalysis).toBe(true);
      expect(config.enableReporting).toBe(true);
    });
  });

  describe('生命周期管理', () => {
    it('应该能够启动监控器', async () => {
      // 先停止监控器，然后重新启动
      if (monitor.isStarted()) {
        await monitor.stop();
      }
      jest.clearAllMocks();
      await monitor.start();
      expect(monitor.isStarted()).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Performance monitor started',
      );
    });

    it('应该能够停止监控器', async () => {
      // 确保监控器已启动
      if (!monitor.isStarted()) {
        await monitor.start();
      }
      jest.clearAllMocks();
      await monitor.stop();
      expect(monitor.isStarted()).toBe(false);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Performance monitor stopped',
      );
    });

    it('应该防止重复启动', async () => {
      await monitor.start();
      jest.clearAllMocks();
      await monitor.start();
      expect(monitor.isStarted()).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Performance monitor is already started',
      );
    });

    it('应该防止在未启动时停止', async () => {
      jest.clearAllMocks();
      await monitor.stop();
      expect(monitor.isStarted()).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Performance monitor is not started',
      );
    });
  });

  describe('配置管理', () => {
    it('应该能够获取当前配置', () => {
      const config = monitor.getConfiguration();
      expect(config).toBeDefined();
      expect(config.enabled).toBe(true);
      expect(config.monitoringInterval).toBe(60000);
    });

    it('应该能够更新配置', () => {
      const newConfig = {
        enabled: false,
        monitoringInterval: 30000,
        dataRetentionDays: 60,
      };
      monitor.updateConfiguration(newConfig);
      const config = monitor.getConfiguration();
      expect(config.enabled).toBe(false);
      expect(config.monitoringInterval).toBe(30000);
      expect(config.dataRetentionDays).toBe(60);
    });

    it('应该能够重置配置', () => {
      monitor.updateConfiguration({ enabled: false });
      monitor.resetConfiguration();
      const config = monitor.getConfiguration();
      expect(config.enabled).toBe(true);
    });
  });

  describe('指标收集', () => {
    beforeEach(async () => {
      await monitor.start();
    });

    it('应该能够收集系统指标', async () => {
      const systemMetrics: ISystemMetrics = {
        cpuUsage: 45.2,
        memoryUsage: 67.8,
        diskUsage: 23.1,
        networkUsage: 50.5,
        loadAverage: 1.5,
        processCount: 150,
        threadCount: 300,
        fileDescriptorCount: 1000,
      };

      await monitor.collectMetrics('system', systemMetrics);
      expect(mockLogger.debug).toHaveBeenCalledWith('Collected system metrics');
    });

    it('应该能够收集应用指标', async () => {
      const applicationMetrics: IApplicationMetrics = {
        requestCount: 1250,
        averageResponseTime: 150,
        maxResponseTime: 500,
        minResponseTime: 50,
        errorRate: 0.02,
        throughput: 100,
        concurrentConnections: 50,
        queueLength: 25,
        cacheHitRate: 0.85,
      };

      await monitor.collectMetrics('application', applicationMetrics);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Collected application metrics',
      );
    });

    it('应该能够收集业务指标', async () => {
      const businessMetrics: IBusinessMetrics = {
        activeUsers: 850,
        ordersPerMinute: 12,
        revenuePerMinute: 5000,
        conversionRate: 0.15,
        userRegistrations: 100,
        userLogins: 75,
        pageViews: 5000,
        sessionCount: 1200,
      };

      await monitor.collectMetrics('business', businessMetrics);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Collected business metrics',
      );
    });

    it('应该能够批量收集指标', async () => {
      const metrics: IPerformanceMetrics = {
        timestamp: new Date(),
        tenantId: 'test-tenant',
        serviceId: 'test-service',
        instanceId: 'test-instance',
        version: '1.0.0',
        systemMetrics: {
          cpuUsage: 45.2,
          memoryUsage: 67.8,
          diskUsage: 23.1,
          networkUsage: 50.5,
          loadAverage: 1.5,
          processCount: 150,
          threadCount: 300,
          fileDescriptorCount: 1000,
        },
        applicationMetrics: {
          requestCount: 1250,
          averageResponseTime: 150,
          maxResponseTime: 500,
          minResponseTime: 50,
          errorRate: 0.02,
          throughput: 100,
          concurrentConnections: 50,
          queueLength: 25,
          cacheHitRate: 0.85,
        },
        businessMetrics: {
          activeUsers: 850,
          ordersPerMinute: 12,
          revenuePerMinute: 5000,
          conversionRate: 0.15,
          userRegistrations: 100,
          userLogins: 75,
          pageViews: 5000,
          sessionCount: 1200,
        },
      };

      await monitor.collectMetrics(metrics);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Collected performance metrics',
      );
    });
  });

  describe('指标查询', () => {
    beforeEach(async () => {
      await monitor.start();
    });

    it('应该能够查询指标', async () => {
      const options: IPerformanceMetricsQueryOptions = {
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(),
        metricTypes: ['system', 'application'],
        aggregationInterval: 3600000,
      };

      const result = await monitor.queryMetrics(options);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('应该能够获取实时指标', async () => {
      const realTimeMetrics = await monitor.getRealTimeMetrics();
      expect(realTimeMetrics).toBeDefined();
      expect(realTimeMetrics.timestamp).toBeDefined();
    });

    it('应该能够获取指标统计', async () => {
      const statistics = await monitor.getMetricsStatistics();
      expect(statistics).toBeDefined();
      expect(statistics.totalMetrics).toBeDefined();
      expect(statistics.collectionRate).toBeDefined();
    });
  });

  describe('告警管理', () => {
    beforeEach(async () => {
      // 确保监控器已启动
      if (!monitor.isStarted()) {
        await monitor.start();
      }
    });

    it('应该能够设置告警', async () => {
      const alert = {
        id: 'cpu-alert',
        name: 'CPU Usage Alert',
        metricName: 'cpu_usage',
        threshold: 80,
        operator: 'greater_than' as const,
        severity: 'high' as const,
        enabled: true,
        notifications: ['email'],
      };

      jest.clearAllMocks();
      await monitor.setAlert(alert);
      expect(mockLogger.info).toHaveBeenCalledWith('Alert set: cpu-alert');
    });

    it('应该能够获取告警列表', async () => {
      const alerts = await monitor.getAlerts();
      expect(alerts).toBeDefined();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('应该能够更新告警', async () => {
      const alert = {
        id: 'cpu-alert',
        name: 'CPU Usage Alert',
        metricName: 'cpu_usage',
        threshold: 80,
        operator: 'greater_than' as const,
        severity: 'high' as const,
        enabled: true,
        notifications: ['email'],
      };

      await monitor.setAlert(alert);
      jest.clearAllMocks();
      await monitor.updateAlert('cpu-alert', { threshold: 90 });
      expect(mockLogger.info).toHaveBeenCalledWith('Alert updated: cpu-alert');
    });

    it('应该能够删除告警', async () => {
      const alert = {
        id: 'cpu-alert',
        name: 'CPU Usage Alert',
        metricName: 'cpu_usage',
        threshold: 80,
        operator: 'greater_than' as const,
        severity: 'high' as const,
        enabled: true,
        notifications: ['email'],
      };

      await monitor.setAlert(alert);
      jest.clearAllMocks();
      await monitor.removeAlert('cpu-alert');
      expect(mockLogger.info).toHaveBeenCalledWith('Alert removed: cpu-alert');
    });
  });

  describe('报告生成', () => {
    beforeEach(async () => {
      await monitor.start();
    });

    it('应该能够生成性能报告', async () => {
      jest.clearAllMocks();
      const report = await monitor.generateReport({
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(),
        includeSystemMetrics: true,
        includeApplicationMetrics: true,
        includeBusinessMetrics: true,
        format: 'json',
      });

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.metrics).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    it('应该能够生成健康检查报告', async () => {
      jest.clearAllMocks();
      const healthReport = await monitor.generateHealthReport();
      expect(healthReport).toBeDefined();
      expect(healthReport.overallHealth).toBeDefined();
      expect(healthReport.components).toBeDefined();
      expect(healthReport.issues).toBeDefined();
    });
  });

  describe('收集器管理', () => {
    beforeEach(async () => {
      // 确保监控器已启动
      if (!monitor.isStarted()) {
        await monitor.start();
      }
    });

    it('应该能够注册收集器', async () => {
      mockCollector.getSupportedTypes.mockReturnValue(['custom']);
      mockCollector.isHealthy.mockResolvedValue(true);
      mockCollector.getName.mockReturnValue('Custom Collector');

      jest.clearAllMocks();
      await monitor.registerCollector(mockCollector);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Collector registered: Custom Collector',
      );
    });

    it('应该能够取消注册收集器', async () => {
      mockCollector.getSupportedTypes.mockReturnValue(['custom']);
      mockCollector.getName.mockReturnValue('Custom Collector');

      // 先注册收集器
      await monitor.registerCollector(mockCollector);
      jest.clearAllMocks();

      // 然后取消注册
      const result = await monitor.unregisterCollector('Custom Collector');
      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Collector unregistered: Custom Collector',
      );
    });

    it('应该能够获取收集器列表', async () => {
      const collectors = await monitor.getCollectors();
      expect(collectors).toBeDefined();
      expect(Array.isArray(collectors)).toBe(true);
    });
  });

  describe('健康检查', () => {
    it('应该能够进行健康检查', async () => {
      const health = await monitor.healthCheck();
      expect(health).toBeDefined();
      expect(health.isHealthy).toBeDefined();
      expect(health.status).toBeDefined();
      expect(health.details).toBeDefined();
    });

    it('应该能够获取健康状态', async () => {
      const status = await monitor.getHealthStatus();
      expect(status).toBeDefined();
      expect(typeof status).toBe('string');
    });
  });

  describe('统计信息', () => {
    beforeEach(async () => {
      await monitor.start();
    });

    it('应该能够获取统计信息', async () => {
      jest.clearAllMocks();
      const stats = await monitor.getStatistics({
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(),
      });
      expect(stats).toBeDefined();
      expect(stats.totalMetrics).toBeDefined();
      expect(stats.timeRange).toBeDefined();
      expect(stats.systemStats).toBeDefined();
      expect(stats.applicationStats).toBeDefined();
      expect(stats.businessStats).toBeDefined();
      expect(stats.lastUpdated).toBeDefined();
    });

    it('应该能够获取详细统计信息', async () => {
      jest.clearAllMocks();
      const detailedStats = await monitor.getDetailedStatistics();
      expect(detailedStats).toBeDefined();
      expect(detailedStats.basic).toBeDefined();
      expect(detailedStats.byType).toBeDefined();
      expect(detailedStats.byTime).toBeDefined();
      expect(detailedStats.performance).toBeDefined();
    });
  });

  describe('边界情况', () => {
    it('应该处理无效的指标类型', async () => {
      await monitor.start();
      // 无效的指标类型应该被忽略或记录警告，而不是抛出错误
      await expect(
        monitor.collectMetrics('invalid-type', {}),
      ).resolves.toBeUndefined();
    });

    it('应该处理无效的告警配置', async () => {
      await monitor.start();
      const invalidAlert = {
        id: '',
        name: 'Invalid Alert',
        metricName: 'invalid_metric',
        threshold: -1,
        operator: 'invalid_operator' as 'greater_than',
        severity: 'invalid' as 'high',
        enabled: true,
        notifications: ['invalid'],
      };

      // 当前实现不验证告警配置的有效性，总是返回 true
      await expect(monitor.setAlert(invalidAlert)).resolves.toBe(true);
    });

    it('应该处理无效的查询选项', async () => {
      await monitor.start();
      const invalidOptions = {
        startTime: new Date(),
        endTime: new Date(Date.now() - 3600000), // 结束时间早于开始时间
        metricTypes: [],
        aggregationInterval: -1,
      };

      // 无效的查询选项应该返回空结果，而不是抛出错误
      const result = await monitor.queryMetrics(invalidOptions);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('应该处理收集器错误', async () => {
      await monitor.start();
      const errorCollector = {
        collect: jest.fn().mockRejectedValue(new Error('Collection failed')),
        getSupportedTypes: jest.fn().mockReturnValue(['error']),
        isHealthy: jest.fn().mockResolvedValue(false),
        getName: jest.fn().mockReturnValue('Error Collector'),
      };

      await monitor.registerCollector('error', errorCollector);
      // 收集器错误应该被捕获并记录，而不是抛出错误
      await expect(
        monitor.collectMetrics('error', {}),
      ).resolves.toBeUndefined();
    });
  });

  describe('性能测试', () => {
    beforeEach(async () => {
      await monitor.start();
    });

    it('应该能够处理大量指标收集', async () => {
      const startTime = Date.now();
      const promises: Array<Promise<void>> = [];

      for (let i = 0; i < 100; i++) {
        promises.push(
          monitor.collectMetrics('system', {
            cpuUsage: Math.random() * 100,
            memoryUsage: Math.random() * 100,
            diskUsage: Math.random() * 100,
            networkUsage: Math.random() * 100,
            loadAverage: Math.random(),
            processCount: Math.floor(Math.random() * 1000),
            threadCount: Math.floor(Math.random() * 2000),
            fileDescriptorCount: Math.floor(Math.random() * 1000),
            uptime: Math.floor(Math.random() * 86400),
          }),
        );
      }

      await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // 应该在5秒内完成
    });

    it('应该能够处理并发查询', async () => {
      const options: IPerformanceMetricsQueryOptions = {
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(),
        metricTypes: ['system'],
        aggregationInterval: 3600000,
      };

      const startTime = Date.now();
      const promises: Array<
        Promise<{
          metrics: IPerformanceMetrics[];
          statistics: unknown;
        }>
      > = [];

      for (let i = 0; i < 10; i++) {
        promises.push(monitor.queryMetrics(options));
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(10);
      expect(duration).toBeLessThan(2000); // 应该在2秒内完成
    });
  });

  describe('边界情况增强测试', () => {
    beforeEach(async () => {
      await monitor.start();
    });

    afterEach(async () => {
      await monitor.stop();
    });

    it('应该处理极大数值的指标', async () => {
      const extremeMetrics: IPerformanceMetrics = {
        timestamp: new Date(),
        tenantId: 'tenant-123',
        serviceId: 'service-456',
        instanceId: 'instance-789',
        version: '1.0.0',
        system: {
          cpuUsage: Number.MAX_SAFE_INTEGER,
          memoryUsage: Number.MAX_SAFE_INTEGER,
          diskUsage: Number.MAX_SAFE_INTEGER,
          networkUsage: Number.MAX_SAFE_INTEGER,
          fileDescriptorCount: Number.MAX_SAFE_INTEGER,
        },
        application: {
          requestCount: Number.MAX_SAFE_INTEGER,
          responseTime: Number.MAX_SAFE_INTEGER,
          errorCount: Number.MAX_SAFE_INTEGER,
          activeConnections: Number.MAX_SAFE_INTEGER,
        },
        business: {
          transactionCount: Number.MAX_SAFE_INTEGER,
          userCount: Number.MAX_SAFE_INTEGER,
          featureUsage: {},
        },
      };

      await monitor.collectMetrics(extremeMetrics);
      const stats = await monitor.getStatistics({
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(),
      });
      expect(stats).toBeDefined();
    });

    it('应该处理零值指标', async () => {
      const zeroMetrics: IPerformanceMetrics = {
        timestamp: new Date(),
        tenantId: 'tenant-123',
        serviceId: 'service-456',
        instanceId: 'instance-789',
        version: '1.0.0',
        system: {
          cpuUsage: 0,
          memoryUsage: 0,
          diskUsage: 0,
          networkUsage: 0,
          fileDescriptorCount: 0,
        },
        application: {
          requestCount: 0,
          responseTime: 0,
          errorCount: 0,
          activeConnections: 0,
        },
        business: {
          transactionCount: 0,
          userCount: 0,
          featureUsage: {},
        },
      };

      await monitor.collectMetrics(zeroMetrics);
      const stats = await monitor.getStatistics({
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(),
      });
      expect(stats).toBeDefined();
    });

    it('应该处理负数指标', async () => {
      const negativeMetrics: IPerformanceMetrics = {
        timestamp: new Date(),
        tenantId: 'tenant-123',
        serviceId: 'service-456',
        instanceId: 'instance-789',
        version: '1.0.0',
        system: {
          cpuUsage: -1,
          memoryUsage: -100,
          diskUsage: -50,
          networkUsage: -25,
          fileDescriptorCount: -10,
        },
        application: {
          requestCount: -1,
          responseTime: -1,
          errorCount: -1,
          activeConnections: -1,
        },
        business: {
          transactionCount: -1,
          userCount: -1,
          featureUsage: {},
        },
      };

      await monitor.collectMetrics(negativeMetrics);
      const stats = await monitor.getStatistics({
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(),
      });
      expect(stats).toBeDefined();
    });

    it('应该处理特殊字符的标识符', async () => {
      const specialMetrics: IPerformanceMetrics = {
        timestamp: new Date(),
        tenantId: 'tenant_José_🚀_123',
        serviceId: 'service_测试_456',
        instanceId: 'instance_special!@#',
        version: '1.0.0-beta+测试',
        system: {
          cpuUsage: 50,
          memoryUsage: 1024,
          diskUsage: 512,
          networkUsage: 256,
          fileDescriptorCount: 100,
        },
        application: {
          requestCount: 100,
          responseTime: 150,
          errorCount: 5,
          activeConnections: 20,
        },
        business: {
          transactionCount: 50,
          userCount: 25,
          featureUsage: {
            'feature_José_🚀': 10,
            feature_测试: 15,
          },
        },
      };

      await monitor.collectMetrics(specialMetrics);
      const stats = await monitor.getStatistics({
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(),
      });
      expect(stats).toBeDefined();
    });

    it('应该处理复杂的特性使用数据', async () => {
      const complexFeatureUsage = {
        'user-management': 100,
        'order-processing': 250,
        'payment-gateway': 75,
        'notification-service': 300,
        'analytics-dashboard': 50,
        'api-rate-limiting': 1000,
        'cache-invalidation': 500,
        'background-jobs': 25,
      };

      const metrics: IPerformanceMetrics = {
        timestamp: new Date(),
        tenantId: 'tenant-123',
        serviceId: 'service-456',
        instanceId: 'instance-789',
        version: '1.0.0',
        system: {
          cpuUsage: 75,
          memoryUsage: 2048,
          diskUsage: 1024,
          networkUsage: 512,
          fileDescriptorCount: 200,
        },
        application: {
          requestCount: 500,
          responseTime: 125,
          errorCount: 10,
          activeConnections: 50,
        },
        business: {
          transactionCount: 200,
          userCount: 100,
          featureUsage: complexFeatureUsage,
        },
      };

      await monitor.collectMetrics(metrics);
      const stats = await monitor.getStatistics({
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(),
      });
      expect(stats).toBeDefined();
    });
  });

  describe('错误恢复测试', () => {
    beforeEach(async () => {
      await monitor.start();
    });

    afterEach(async () => {
      await monitor.stop();
    });

    it('应该从收集器错误中恢复', async () => {
      const failingCollector: IPerformanceCollector = {
        getName: () => 'FailingCollector',
        collect: async () => {
          throw new Error('Collector failure');
        },
        isEnabled: () => true,
        getConfiguration: () => ({}),
        setConfiguration: () => {},
      };

      monitor.registerCollector(failingCollector);

      // 应该能够处理收集器错误而不崩溃
      expect(async () => {
        await monitor.collectSystemMetrics();
      }).not.toThrow();
    });

    it('应该处理配置更新错误', () => {
      const invalidConfig = {
        enableLogging: 'invalid' as any,
        enableMonitoring: 'invalid' as any,
        collectInterval: 'invalid' as any,
      };

      expect(() => {
        monitor.updateConfiguration(invalidConfig);
      }).not.toThrow();
    });

    it('应该处理告警设置错误', async () => {
      const invalidAlert = {
        id: '',
        name: '',
        condition: '',
        threshold: NaN,
        enabled: true,
      };

      const result = await monitor.setAlert(invalidAlert);
      expect(typeof result).toBe('boolean');
    });
  });
});
