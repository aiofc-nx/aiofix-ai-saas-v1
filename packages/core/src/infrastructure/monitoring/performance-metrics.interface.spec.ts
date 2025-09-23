/**
 * PerformanceMetricsInterface 测试
 *
 * 测试性能指标接口的功能，包括指标类型、聚合、查询等。
 *
 * @description 性能指标接口的单元测试
 * @since 1.0.0
 */

import type {
	IPerformanceMetrics,
	IPerformanceMetricsAggregation,
	IPerformanceMetricsQueryOptions,
	IPerformanceMetricsStatistics,
	ISystemMetrics,
	IApplicationMetrics,
	IBusinessMetrics,
	IPerformanceMetricsReport,
	IPerformanceMetricsHealth
} from './performance-metrics.interface';

describe('PerformanceMetricsInterface', () => {
	describe('ISystemMetrics', () => {
		it('应该正确定义系统指标接口', () => {
			const systemMetrics: ISystemMetrics = {
				maxResponseTime: 45.2,
				minResponseTime: 67.8,
				diskUsage: 23.1,
				networkIn: 1024,
				networkOut: 2048,
				loadAverage: [1.2, 1.5, 1.8],
				processCount: 150,
				threadCount: 300,
				uptime: 86400,
				temperature: 45.5
			};

			expect(systemMetrics.maxResponseTime).toBe(45.2);
			expect(systemMetrics.minResponseTime).toBe(67.8);
			expect(systemMetrics.diskUsage).toBe(23.1);
			expect(systemMetrics.networkIn).toBe(1024);
			expect(systemMetrics.networkOut).toBe(2048);
			expect(systemMetrics.loadAverage).toEqual([1.2, 1.5, 1.8]);
			expect(systemMetrics.processCount).toBe(150);
			expect(systemMetrics.threadCount).toBe(300);
			expect(systemMetrics.uptime).toBe(86400);
			expect(systemMetrics.temperature).toBe(45.5);
		});

		it('应该支持可选属性', () => {
			const minimalSystemMetrics: ISystemMetrics = {
				maxResponseTime: 45.2,
				minResponseTime: 67.8,
				diskUsage: 23.1,
				networkIn: 1024,
				networkOut: 2048,
				loadAverage: [1.2, 1.5, 1.8],
				processCount: 150,
				threadCount: 300,
				uptime: 86400
			};

			expect(minimalSystemMetrics.maxResponseTime).toBe(45.2);
			expect(minimalSystemMetrics.temperature).toBeUndefined();
		});

		it('应该处理边界值', () => {
			const boundarySystemMetrics: ISystemMetrics = {
				maxResponseTime: 0,
				minResponseTime: 100,
				diskUsage: 0,
				networkIn: 0,
				networkOut: 0,
				loadAverage: [0, 0, 0],
				processCount: 0,
				threadCount: 0,
				uptime: 0,
				temperature: -10
			};

			expect(boundarySystemMetrics.maxResponseTime).toBe(0);
			expect(boundarySystemMetrics.minResponseTime).toBe(100);
			expect(boundarySystemMetrics.temperature).toBe(-10);
		});
	});

	describe('IApplicationMetrics', () => {
		it('应该正确定义应用指标接口', () => {
			const applicationMetrics: IApplicationMetrics = {
				requestCount: 1250,
				averageResponseTime: 150,
				errorRate: 0.02,
				throughput: 100,
				concurrentConnections: 50,
				queueLength: 25,
				cacheHitRate: 0.85,
				maxResponseTime: 1000,
				minResponseTime: 50
			};

			expect(applicationMetrics.requestCount).toBe(1250);
			expect(applicationMetrics.averageResponseTime).toBe(150);
			expect(applicationMetrics.errorRate).toBe(0.02);
			expect(applicationMetrics.throughput).toBe(100);
			expect(applicationMetrics.concurrentConnections).toBe(50);
			expect(applicationMetrics.queueLength).toBe(25);
			expect(applicationMetrics.cacheHitRate).toBe(0.85);
			expect(applicationMetrics.maxResponseTime).toBe(1000);
			expect(applicationMetrics.minResponseTime).toBe(50);
		});

		it('应该支持可选属性', () => {
			const minimalApplicationMetrics: IApplicationMetrics = {
				requestCount: 1250,
				averageResponseTime: 150,
				errorRate: 0.02,
				throughput: 100,
				concurrentConnections: 50,
				queueLength: 25,
				cacheHitRate: 0.85,
				maxResponseTime: 1000,
				minResponseTime: 50
			};

			expect(minimalApplicationMetrics.requestCount).toBe(1250);
			expect(minimalApplicationMetrics.maxResponseTime).toBe(1000);
			expect(minimalApplicationMetrics.minResponseTime).toBe(50);
		});

		it('应该处理高负载情况', () => {
			const highLoadMetrics: IApplicationMetrics = {
				requestCount: 100000,
				averageResponseTime: 5000,
				errorRate: 0.15,
				throughput: 1000,
				concurrentConnections: 1000,
				queueLength: 500,
				cacheHitRate: 0.3,
				maxResponseTime: 10000,
				minResponseTime: 100
			};

			expect(highLoadMetrics.requestCount).toBe(100000);
			expect(highLoadMetrics.averageResponseTime).toBe(5000);
			expect(highLoadMetrics.errorRate).toBe(0.15);
			expect(highLoadMetrics.maxResponseTime).toBe(10000);
		});
	});

	describe('IBusinessMetrics', () => {
		it('应该正确定义业务指标接口', () => {
			const businessMetrics: IBusinessMetrics = {
				activeUsers: 850,
				ordersPerMinute: 12,
				revenue: 5000,
				conversionRate: 0.15,
				customerSatisfaction: 4.5,
				supportTickets: 25,
				featureUsage: { feature1: 100, feature2: 75 },
				apiCalls: 5000,
				dataProcessed: 1024000,
				storageUsed: 2048000
			};

			expect(businessMetrics.activeUsers).toBe(850);
			expect(businessMetrics.ordersPerMinute).toBe(12);
			expect(businessMetrics.revenue).toBe(5000);
			expect(businessMetrics.conversionRate).toBe(0.15);
			expect(businessMetrics.customerSatisfaction).toBe(4.5);
			expect(businessMetrics.supportTickets).toBe(25);
			expect(businessMetrics.featureUsage).toEqual({
				feature1: 100,
				feature2: 75
			});
			expect(businessMetrics.apiCalls).toBe(5000);
			expect(businessMetrics.dataProcessed).toBe(1024000);
			expect(businessMetrics.storageUsed).toBe(2048000);
		});

		it('应该支持可选属性', () => {
			const minimalBusinessMetrics: IBusinessMetrics = {
				activeUsers: 850,
				ordersPerMinute: 12,
				revenue: 5000,
				conversionRate: 0.15,
				customerSatisfaction: 4.5,
				supportTickets: 25,
				featureUsage: { feature1: 100 },
				apiCalls: 5000
			};

			expect(minimalBusinessMetrics.activeUsers).toBe(850);
			expect(minimalBusinessMetrics.dataProcessed).toBeUndefined();
			expect(minimalBusinessMetrics.storageUsed).toBeUndefined();
		});

		it('应该处理复杂的特性使用数据', () => {
			const complexFeatureUsage: IBusinessMetrics = {
				activeUsers: 1000,
				ordersPerMinute: 20,
				revenue: 10000,
				conversionRate: 0.2,
				customerSatisfaction: 4.8,
				supportTickets: 10,
				featureUsage: {
					login: 1000,
					dashboard: 800,
					profile: 600,
					settings: 400,
					reports: 200,
					analytics: 150
				},
				apiCalls: 10000,
				dataProcessed: 2048000,
				storageUsed: 4096000
			};

			expect(complexFeatureUsage.featureUsage.login).toBe(1000);
			expect(complexFeatureUsage.featureUsage.analytics).toBe(150);
			expect(Object.keys(complexFeatureUsage.featureUsage)).toHaveLength(6);
		});
	});

	describe('IPerformanceMetrics', () => {
		it('应该正确定义性能指标接口', () => {
			const performanceMetrics: IPerformanceMetrics = {
				timestamp: new Date(),
				systemMetrics: {
					maxResponseTime: 45.2,
					minResponseTime: 67.8,
					diskUsage: 23.1,
					networkIn: 1024,
					networkOut: 2048,
					loadAverage: [1.2, 1.5, 1.8],
					processCount: 150,
					threadCount: 300,
					uptime: 86400,
					temperature: 45.5
				},
				applicationMetrics: {
					requestCount: 1250,
					averageResponseTime: 150,
					errorRate: 0.02,
					throughput: 100,
					concurrentConnections: 50,
					queueLength: 25,
					cacheHitRate: 0.85,
					maxResponseTime: 10,
					minResponseTime: 512,
					maxResponseTime: 30.5
				},
				businessMetrics: {
					activeUsers: 850,
					ordersPerMinute: 12,
					revenue: 5000,
					conversionRate: 0.15,
					customerSatisfaction: 4.5,
					supportTickets: 25,
					featureUsage: { feature1: 100, feature2: 75 },
					apiCalls: 5000,
					dataProcessed: 1024000,
					storageUsed: 2048000
				}
			};

			expect(performanceMetrics.timestamp).toBeInstanceOf(Date);
			expect(performanceMetrics.systemMetrics).toBeDefined();
			expect(performanceMetrics.applicationMetrics).toBeDefined();
			expect(performanceMetrics.businessMetrics).toBeDefined();
		});

		it('应该支持部分指标', () => {
			const partialMetrics: IPerformanceMetrics = {
				timestamp: new Date(),
				systemMetrics: {
					maxResponseTime: 45.2,
					minResponseTime: 67.8,
					diskUsage: 23.1,
					networkIn: 1024,
					networkOut: 2048,
					loadAverage: [1.2, 1.5, 1.8],
					processCount: 150,
					threadCount: 300,
					uptime: 86400
				}
			};

			expect(partialMetrics.timestamp).toBeInstanceOf(Date);
			expect(partialMetrics.systemMetrics).toBeDefined();
			expect(partialMetrics.applicationMetrics).toBeUndefined();
			expect(partialMetrics.businessMetrics).toBeUndefined();
		});
	});

	describe('IPerformanceMetricsAggregation', () => {
		it('应该正确定义指标聚合接口', () => {
			const aggregation: IPerformanceMetricsAggregation = {
				metricType: 'cpu_usage',
				aggregationType: 'average',
				timeWindow: 3600000,
				value: 45.2,
				count: 100,
				min: 20.1,
				max: 80.5,
				sum: 4520,
				variance: 125.6,
				standardDeviation: 11.2,
				percentiles: {
					p50: 44.8,
					p90: 65.2,
					p95: 72.1,
					p99: 78.5
				},
				timestamp: new Date()
			};

			expect(aggregation.metricType).toBe('cpu_usage');
			expect(aggregation.aggregationType).toBe('average');
			expect(aggregation.timeWindow).toBe(3600000);
			expect(aggregation.value).toBe(45.2);
			expect(aggregation.count).toBe(100);
			expect(aggregation.min).toBe(20.1);
			expect(aggregation.max).toBe(80.5);
			expect(aggregation.sum).toBe(4520);
			expect(aggregation.variance).toBe(125.6);
			expect(aggregation.standardDeviation).toBe(11.2);
			expect(aggregation.percentiles.p50).toBe(44.8);
			expect(aggregation.percentiles.p90).toBe(65.2);
			expect(aggregation.percentiles.p95).toBe(72.1);
			expect(aggregation.percentiles.p99).toBe(78.5);
			expect(aggregation.timestamp).toBeInstanceOf(Date);
		});

		it('应该支持不同的聚合类型', () => {
			const sumAggregation: IPerformanceMetricsAggregation = {
				metricType: 'request_count',
				aggregationType: 'sum',
				timeWindow: 3600000,
				value: 10000,
				count: 100,
				timestamp: new Date()
			};

			const maxAggregation: IPerformanceMetricsAggregation = {
				metricType: 'response_time',
				aggregationType: 'max',
				timeWindow: 3600000,
				value: 5000,
				count: 100,
				timestamp: new Date()
			};

			expect(sumAggregation.aggregationType).toBe('sum');
			expect(maxAggregation.aggregationType).toBe('max');
		});
	});

	describe('IPerformanceMetricsQueryOptions', () => {
		it('应该正确定义查询选项接口', () => {
			const queryOptions: IPerformanceMetricsQueryOptions = {
				startTime: new Date(Date.now() - 3600000),
				endTime: new Date(),
				metricTypes: ['system', 'application'],
				aggregation: 'average',
				groupBy: 'hour',
				limit: 100,
				offset: 0,
				filters: {
					maxResponseTime: { min: 0, max: 100 },
					minResponseTime: { min: 0, max: 100 }
				},
				sortBy: 'timestamp',
				sortOrder: 'desc'
			};

			expect(queryOptions.startTime).toBeInstanceOf(Date);
			expect(queryOptions.endTime).toBeInstanceOf(Date);
			expect(queryOptions.metricTypes).toEqual(['system', 'application']);
			expect(queryOptions.aggregation).toBe('average');
			expect(queryOptions.groupBy).toBe('hour');
			expect(queryOptions.limit).toBe(100);
			expect(queryOptions.offset).toBe(0);
			expect(queryOptions.filters).toBeDefined();
			expect(queryOptions.sortBy).toBe('timestamp');
			expect(queryOptions.sortOrder).toBe('desc');
		});

		it('应该支持可选属性', () => {
			const minimalQueryOptions: IPerformanceMetricsQueryOptions = {
				startTime: new Date(Date.now() - 3600000),
				endTime: new Date()
			};

			expect(minimalQueryOptions.startTime).toBeInstanceOf(Date);
			expect(minimalQueryOptions.endTime).toBeInstanceOf(Date);
			expect(minimalQueryOptions.metricTypes).toBeUndefined();
			expect(minimalQueryOptions.aggregation).toBeUndefined();
		});

		it('应该支持复杂的过滤器', () => {
			const complexFilters: IPerformanceMetricsQueryOptions = {
				startTime: new Date(Date.now() - 3600000),
				endTime: new Date(),
				filters: {
					maxResponseTime: { min: 20, max: 80 },
					minResponseTime: { min: 10, max: 90 },
					responseTime: { min: 0, max: 1000 },
					errorRate: { min: 0, max: 0.1 }
				}
			};

			expect(complexFilters.filters?.maxResponseTime?.min).toBe(20);
			expect(complexFilters.filters?.maxResponseTime?.max).toBe(80);
			expect(complexFilters.filters?.errorRate?.max).toBe(0.1);
		});
	});

	describe('IPerformanceMetricsStatistics', () => {
		it('应该正确定义统计信息接口', () => {
			const statistics: IPerformanceMetricsStatistics = {
				totalMetrics: 10000,
				collectionRate: 0.95,
				storageUsage: 1024000,
				alertCount: 5,
				lastCollectionTime: new Date(),
				averageCollectionTime: 50,
				errorRate: 0.02,
				uptime: 86400,
				version: '1.0.0',
				metadata: {
					environment: 'production',
					region: 'us-east-1',
					instance: 'web-01'
				}
			};

			expect(statistics.totalMetrics).toBe(10000);
			expect(statistics.collectionRate).toBe(0.95);
			expect(statistics.storageUsage).toBe(1024000);
			expect(statistics.alertCount).toBe(5);
			expect(statistics.lastCollectionTime).toBeInstanceOf(Date);
			expect(statistics.averageCollectionTime).toBe(50);
			expect(statistics.errorRate).toBe(0.02);
			expect(statistics.uptime).toBe(86400);
			expect(statistics.version).toBe('1.0.0');
			expect(statistics.metadata?.environment).toBe('production');
			expect(statistics.metadata?.region).toBe('us-east-1');
			expect(statistics.metadata?.instance).toBe('web-01');
		});

		it('应该支持可选属性', () => {
			const minimalStatistics: IPerformanceMetricsStatistics = {
				totalMetrics: 1000,
				collectionRate: 0.9,
				storageUsage: 512000,
				alertCount: 0,
				lastCollectionTime: new Date()
			};

			expect(minimalStatistics.totalMetrics).toBe(1000);
			expect(minimalStatistics.averageCollectionTime).toBeUndefined();
			expect(minimalStatistics.errorRate).toBeUndefined();
			expect(minimalStatistics.uptime).toBeUndefined();
			expect(minimalStatistics.version).toBeUndefined();
			expect(minimalStatistics.metadata).toBeUndefined();
		});
	});

	describe('IPerformanceMetricsReport', () => {
		it('应该正确定义报告接口', () => {
			const report: IPerformanceMetricsReport = {
				id: 'report-001',
				title: 'Performance Report',
				description: 'Weekly performance report',
				startTime: new Date(Date.now() - 604800000),
				endTime: new Date(),
				summary: {
					overallHealth: 'good',
					totalRequests: 100000,
					averageResponseTime: 150,
					errorRate: 0.02,
					uptime: 0.99
				},
				metrics: {
					system: {
						maxResponseTime: { average: 45.2, max: 80.5, min: 20.1 },
						minResponseTime: { average: 67.8, max: 90.2, min: 45.1 }
					},
					application: {
						responseTime: { average: 150, max: 1000, min: 50 },
						throughput: { average: 100, max: 200, min: 50 }
					}
				},
				recommendations: [
					'Consider scaling up CPU resources',
					'Optimize database queries',
					'Implement caching strategy'
				],
				generatedAt: new Date(),
				generatedBy: 'system'
			};

			expect(report.id).toBe('report-001');
			expect(report.title).toBe('Performance Report');
			expect(report.description).toBe('Weekly performance report');
			expect(report.startTime).toBeInstanceOf(Date);
			expect(report.endTime).toBeInstanceOf(Date);
			expect(report.summary.overallHealth).toBe('good');
			expect(report.summary.totalRequests).toBe(100000);
			expect(report.summary.averageResponseTime).toBe(150);
			expect(report.summary.errorRate).toBe(0.02);
			expect(report.summary.uptime).toBe(0.99);
			expect(report.metrics.system.maxResponseTime.average).toBe(45.2);
			expect(report.metrics.application.responseTime.max).toBe(1000);
			expect(report.recommendations).toHaveLength(3);
			expect(report.generatedAt).toBeInstanceOf(Date);
			expect(report.generatedBy).toBe('system');
		});
	});

	describe('IPerformanceMetricsHealth', () => {
		it('应该正确定义健康检查接口', () => {
			const health: IPerformanceMetricsHealth = {
				overallHealth: 'good',
				status: 'healthy',
				components: {
					system: { status: 'healthy', message: 'System metrics normal' },
					application: {
						status: 'healthy',
						message: 'Application metrics normal'
					},
					database: { status: 'warning', message: 'High connection count' }
				},
				issues: [
					{
						component: 'database',
						severity: 'warning',
						message: 'High connection count detected',
						timestamp: new Date()
					}
				],
				lastCheck: new Date(),
				uptime: 0.99,
				responseTime: 50
			};

			expect(health.overallHealth).toBe('good');
			expect(health.status).toBe('healthy');
			expect(health.components.system.status).toBe('healthy');
			expect(health.components.database.status).toBe('warning');
			expect(health.issues).toHaveLength(1);
			expect(health.issues[0].component).toBe('database');
			expect(health.issues[0].severity).toBe('warning');
			expect(health.lastCheck).toBeInstanceOf(Date);
			expect(health.uptime).toBe(0.99);
			expect(health.responseTime).toBe(50);
		});

		it('应该支持不同的健康状态', () => {
			const unhealthyHealth: IPerformanceMetricsHealth = {
				overallHealth: 'critical',
				status: 'unhealthy',
				components: {
					system: { status: 'critical', message: 'High CPU usage' },
					application: { status: 'unhealthy', message: 'High error rate' }
				},
				issues: [
					{
						component: 'system',
						severity: 'critical',
						message: 'CPU usage above 95%',
						timestamp: new Date()
					},
					{
						component: 'application',
						severity: 'high',
						message: 'Error rate above 10%',
						timestamp: new Date()
					}
				],
				lastCheck: new Date(),
				uptime: 0.85,
				responseTime: 5000
			};

			expect(unhealthyHealth.overallHealth).toBe('critical');
			expect(unhealthyHealth.status).toBe('unhealthy');
			expect(unhealthyHealth.components.system.status).toBe('critical');
			expect(unhealthyHealth.issues).toHaveLength(2);
			expect(unhealthyHealth.uptime).toBe(0.85);
			expect(unhealthyHealth.responseTime).toBe(5000);
		});
	});

	describe('边界情况', () => {
		it('应该处理极值', () => {
			const extremeMetrics: ISystemMetrics = {
				maxResponseTime: 100,
				minResponseTime: 100,
				diskUsage: 100,
				networkUsage: Number.MAX_SAFE_INTEGER,
				loadAverage: Number.MAX_SAFE_INTEGER,
				processCount: Number.MAX_SAFE_INTEGER,
				threadCount: Number.MAX_SAFE_INTEGER,
				fileDescriptorCount: Number.MAX_SAFE_INTEGER
			};

			expect(extremeMetrics.maxResponseTime).toBe(100);
			expect(extremeMetrics.minResponseTime).toBe(100);
			expect(extremeMetrics.networkUsage).toBe(Number.MAX_SAFE_INTEGER);
			expect(extremeMetrics.loadAverage).toBe(Number.MAX_SAFE_INTEGER);
		});

		it('应该处理零值', () => {
			const zeroMetrics: IApplicationMetrics = {
				requestCount: 0,
				averageResponseTime: 0,
				errorRate: 0,
				throughput: 0,
				concurrentConnections: 0,
				queueLength: 0,
				cacheHitRate: 0,
				maxResponseTime: 0,
				minResponseTime: 0
			};

			expect(zeroMetrics.requestCount).toBe(0);
			expect(zeroMetrics.errorRate).toBe(0);
			expect(zeroMetrics.cacheHitRate).toBe(0);
		});

		it('应该处理负数', () => {
			const negativeMetrics: ISystemMetrics = {
				maxResponseTime: -10,
				minResponseTime: -5,
				diskUsage: 0,
				networkIn: -100,
				networkOut: -200,
				loadAverage: [-1, -2, -3],
				processCount: 0,
				threadCount: 0,
				uptime: 0,
				temperature: -50
			};

			expect(negativeMetrics.maxResponseTime).toBe(-10);
			expect(negativeMetrics.minResponseTime).toBe(-5);
			expect(negativeMetrics.networkIn).toBe(-100);
			expect(negativeMetrics.temperature).toBe(-50);
		});
	});
});
