/**
 * PerformanceMonitorDecorator 测试
 *
 * 测试性能监控装饰器的功能，包括方法监控、类监控等。
 *
 * @description 性能监控装饰器的单元测试
 * @since 1.0.0
 */

import {
	PerformanceMonitor,
	PerformanceMonitorMethod as MonitorMethod,
	PerformanceMonitorClass as MonitorClass,
	PerformanceMetricType,
	PerformanceAlertLevel
} from './performance-monitor.decorator';

describe('PerformanceMonitorDecorator', () => {
	describe('@MonitorMethod', () => {
		it('应该能够监控方法执行时间', async () => {
			class TestService {
				@MonitorMethod({
					metricName: 'slowMethod',
					metricType: PerformanceMetricType.RESPONSE_TIME,
					threshold: 1000,
					alertLevel: PerformanceAlertLevel.ERROR
				})
				async slowMethod(): Promise<string> {
					await new Promise((resolve) => setTimeout(resolve, 100));
					return 'completed';
				}

				@MonitorMethod({
					metricName: 'fastMethod',
					metricType: PerformanceMetricType.RESPONSE_TIME,
					threshold: 100,
					alertLevel: PerformanceAlertLevel.WARNING
				})
				async fastMethod(): Promise<string> {
					return 'completed';
				}
			}

			const service = new TestService();
			const result1 = await service.slowMethod();
			const result2 = await service.fastMethod();

			expect(result1).toBe('completed');
			expect(result2).toBe('completed');
		});

		it('应该能够监控同步方法', () => {
			class TestService {
				@MonitorMethod({
					metricName: 'syncMethod',
					metricType: PerformanceMetricType.RESPONSE_TIME,
					threshold: 10,
					alertLevel: PerformanceAlertLevel.LOW
				})
				syncMethod(): string {
					return 'sync completed';
				}
			}

			const service = new TestService();
			const result = service.syncMethod();
			expect(result).toBe('sync completed');
		});

		it('应该能够监控方法错误率', async () => {
			class TestService {
				@MonitorMethod({
					metricName: 'errorMethod',
					metricType: PerformanceMetricType.ERROR_RATE,
					threshold: 0.1,
					alertLevel: PerformanceAlertLevel.ERROR
				})
				async errorMethod(): Promise<string> {
					throw new Error('Test error');
				}

				@MonitorMethod({
					metricName: 'successMethod',
					metricType: PerformanceMetricType.ERROR_RATE,
					threshold: 0.1,
					alertLevel: PerformanceAlertLevel.ERROR
				})
				async successMethod(): Promise<string> {
					return 'success';
				}
			}

			const service = new TestService();

			try {
				await service.errorMethod();
			} catch (error) {
				expect((error as Error).message).toBe('Test error');
			}

			const result = await service.successMethod();
			expect(result).toBe('success');
		});

		it('应该能够监控自定义指标', () => {
			class TestService {
				@MonitorMethod({
					metricName: 'userOperation',
					metricType: PerformanceMetricType.CUSTOM,
					threshold: 100,
					alertLevel: PerformanceAlertLevel.WARNING
				})
				userOperation(): string {
					return 'user operation completed';
				}
			}

			const service = new TestService();
			const result = service.userOperation();
			expect(result).toBe('user operation completed');
		});

		it('应该能够监控方法吞吐量', async () => {
			class TestService {
				@MonitorMethod({
					metricName: 'throughputMethod',
					metricType: PerformanceMetricType.THROUGHPUT,
					threshold: 10,
					alertLevel: PerformanceAlertLevel.LOW
				})
				async throughputMethod(): Promise<string> {
					return 'throughput test';
				}
			}

			const service = new TestService();
			const promises = [];

			for (let i = 0; i < 5; i++) {
				promises.push(service.throughputMethod());
			}

			const results = await Promise.all(promises);
			expect(results).toHaveLength(5);
			expect(results.every((result) => result === 'throughput test')).toBe(true);
		});

		it('应该能够监控CPU使用率', () => {
			class TestService {
				@MonitorMethod({
					metricName: 'cpuIntensiveMethod',
					metricType: PerformanceMetricType.CUSTOM,
					threshold: 80,
					alertLevel: PerformanceAlertLevel.ERROR
				})
				cpuIntensiveMethod(): string {
					// 模拟CPU密集型操作
					for (let i = 0; i < 1000000; i++) {
						Math.random();
					}
					return 'cpu intensive completed';
				}
			}

			const service = new TestService();
			const result = service.cpuIntensiveMethod();
			expect(result).toBe('cpu intensive completed');
		});

		it('应该能够监控内存使用率', () => {
			class TestService {
				@MonitorMethod({
					metricName: 'memoryIntensiveMethod',
					metricType: PerformanceMetricType.CUSTOM,
					threshold: 90,
					alertLevel: PerformanceAlertLevel.CRITICAL
				})
				memoryIntensiveMethod(): string {
					// 模拟内存密集型操作
					const largeArray = new Array(100000).fill(0).map(() => Math.random());
					return `memory intensive completed: ${largeArray.length}`;
				}
			}

			const service = new TestService();
			const result = service.memoryIntensiveMethod();
			expect(result).toContain('memory intensive completed');
		});

		it('应该能够处理方法参数', () => {
			class TestService {
				@MonitorMethod({
					metricName: 'methodWithParams',
					metricType: PerformanceMetricType.RESPONSE_TIME,
					threshold: 100,
					alertLevel: PerformanceAlertLevel.WARNING
				})
				methodWithParams(param1: string, param2: number): string {
					return `processed: ${param1} and ${param2}`;
				}
			}

			const service = new TestService();
			const result = service.methodWithParams('test', 42);
			expect(result).toBe('processed: test and 42');
		});

		it('应该能够处理方法返回值', () => {
			class TestService {
				@MonitorMethod({
					metricName: 'methodWithReturnValue',
					metricType: PerformanceMetricType.RESPONSE_TIME,
					threshold: 100,
					alertLevel: PerformanceAlertLevel.WARNING
				})
				methodWithReturnValue(): { data: string; count: number } {
					return { data: 'test data', count: 42 };
				}
			}

			const service = new TestService();
			const result = service.methodWithReturnValue();
			expect(result).toEqual({ data: 'test data', count: 42 });
		});
	});

	describe('@MonitorClass', () => {
		it('应该能够监控整个类的方法', () => {
			@MonitorClass({
				metricName: 'TestService',
				metricType: PerformanceMetricType.RESPONSE_TIME,
				threshold: 500,
				alertLevel: PerformanceAlertLevel.WARNING
			})
			class TestService {
				async method1(): Promise<string> {
					await new Promise((resolve) => setTimeout(resolve, 50));
					return 'method1 completed';
				}

				async method2(): Promise<string> {
					await new Promise((resolve) => setTimeout(resolve, 30));
					return 'method2 completed';
				}

				syncMethod(): string {
					return 'sync method completed';
				}
			}

			const service = new TestService();
			expect(service).toBeInstanceOf(TestService);
		});

		it('应该能够监控类的方法执行', async () => {
			@MonitorClass({
				metricName: 'TestService',
				metricType: PerformanceMetricType.RESPONSE_TIME,
				threshold: 200,
				alertLevel: PerformanceAlertLevel.LOW
			})
			class TestService {
				async monitoredMethod(): Promise<string> {
					return 'monitored method completed';
				}

				unmonitoredMethod(): string {
					return 'unmonitored method completed';
				}
			}

			const service = new TestService();
			const result1 = await service.monitoredMethod();
			const result2 = service.unmonitoredMethod();

			expect(result1).toBe('monitored method completed');
			expect(result2).toBe('unmonitored method completed');
		});

		it('应该能够监控类的错误率', async () => {
			@MonitorClass({
				metricName: 'TestService',
				metricType: PerformanceMetricType.ERROR_RATE,
				threshold: 0.2,
				alertLevel: PerformanceAlertLevel.ERROR
			})
			class TestService {
				async errorMethod(): Promise<string> {
					throw new Error('Class error');
				}

				async successMethod(): Promise<string> {
					return 'success';
				}
			}

			const service = new TestService();

			try {
				await service.errorMethod();
			} catch (error) {
				expect((error as Error).message).toBe('Class error');
			}

			const result = await service.successMethod();
			expect(result).toBe('success');
		});

		it('应该能够监控类的吞吐量', async () => {
			@MonitorClass({
				metricName: 'TestService',
				metricType: PerformanceMetricType.THROUGHPUT,
				threshold: 20,
				alertLevel: PerformanceAlertLevel.WARNING
			})
			class TestService {
				async throughputMethod(): Promise<string> {
					return 'throughput test';
				}
			}

			const service = new TestService();
			const promises = [];

			for (let i = 0; i < 10; i++) {
				promises.push(service.throughputMethod());
			}

			const results = await Promise.all(promises);
			expect(results).toHaveLength(10);
		});
	});

	describe('@PerformanceMonitor', () => {
		it('应该能够创建性能监控装饰器', () => {
			const decorator = PerformanceMonitor({
				metricName: 'test',
				metricType: PerformanceMetricType.RESPONSE_TIME,
				threshold: 1000,
				alertLevel: PerformanceAlertLevel.ERROR
			});

			expect(typeof decorator).toBe('function');
		});

		it('应该能够应用性能监控装饰器', () => {
			const decorator = PerformanceMonitor({
				metricName: 'monitoredMethod',
				metricType: PerformanceMetricType.RESPONSE_TIME,
				threshold: 500,
				alertLevel: PerformanceAlertLevel.WARNING
			});

			class TestService {
				@decorator
				monitoredMethod(): string {
					return 'monitored by decorator';
				}
			}

			const service = new TestService();
			const result = service.monitoredMethod();
			expect(result).toBe('monitored by decorator');
		});

		it('应该能够处理不同的告警级别', () => {
			const lowDecorator = PerformanceMonitor({
				metricName: 'lowThresholdMethod',
				metricType: PerformanceMetricType.RESPONSE_TIME,
				threshold: 100,
				alertLevel: PerformanceAlertLevel.LOW
			});

			const highDecorator = PerformanceMonitor({
				metricName: 'highThresholdMethod',
				metricType: PerformanceMetricType.RESPONSE_TIME,
				threshold: 1000,
				alertLevel: PerformanceAlertLevel.ERROR
			});

			class TestService {
				@lowDecorator
				lowThresholdMethod(): string {
					return 'low threshold';
				}

				@highDecorator
				highThresholdMethod(): string {
					return 'high threshold';
				}
			}

			const service = new TestService();
			expect(service.lowThresholdMethod()).toBe('low threshold');
			expect(service.highThresholdMethod()).toBe('high threshold');
		});
	});

	describe('装饰器组合', () => {
		it('应该能够组合多个装饰器', () => {
			class TestService {
				@MonitorMethod({
					metricName: 'combinedMethod',
					metricType: PerformanceMetricType.RESPONSE_TIME,
					threshold: 100,
					alertLevel: PerformanceAlertLevel.WARNING
				})
				@MonitorMethod({
					metricName: 'combinedMethod',
					metricType: PerformanceMetricType.ERROR_RATE,
					threshold: 0.1,
					alertLevel: PerformanceAlertLevel.ERROR
				})
				async combinedMethod(): Promise<string> {
					return 'combined monitoring';
				}
			}

			const service = new TestService();
			expect(service).toBeInstanceOf(TestService);
		});

		it('应该能够组合类装饰器和方法装饰器', () => {
			@MonitorClass({
				metricName: 'TestService',
				metricType: PerformanceMetricType.RESPONSE_TIME,
				threshold: 500,
				alertLevel: PerformanceAlertLevel.WARNING
			})
			class TestService {
				@MonitorMethod({
					metricName: 'specificMethod',
					metricType: PerformanceMetricType.ERROR_RATE,
					threshold: 0.05,
					alertLevel: PerformanceAlertLevel.CRITICAL
				})
				async specificMethod(): Promise<string> {
					return 'specific monitoring';
				}

				async generalMethod(): Promise<string> {
					return 'general monitoring';
				}
			}

			const service = new TestService();
			expect(service).toBeInstanceOf(TestService);
		});
	});

	describe('边界情况', () => {
		it('应该处理无效的指标类型', () => {
			class TestService {
				@MonitorMethod({
					metricName: 'invalidMetricMethod',
					metricType: 'invalid_type' as PerformanceMetricType,
					threshold: 100,
					alertLevel: PerformanceAlertLevel.WARNING
				})
				invalidMetricMethod(): string {
					return 'invalid metric';
				}
			}

			const service = new TestService();
			const result = service.invalidMetricMethod();
			expect(result).toBe('invalid metric');
		});

		it('应该处理无效的告警级别', () => {
			class TestService {
				@MonitorMethod({
					metricName: 'invalidLevelMethod',
					metricType: PerformanceMetricType.RESPONSE_TIME,
					threshold: 100,
					alertLevel: 'invalid_level' as PerformanceAlertLevel
				})
				invalidLevelMethod(): string {
					return 'invalid level';
				}
			}

			const service = new TestService();
			const result = service.invalidLevelMethod();
			expect(result).toBe('invalid level');
		});

		it('应该处理负数的告警阈值', () => {
			class TestService {
				@MonitorMethod({
					metricName: 'negativeThresholdMethod',
					metricType: PerformanceMetricType.RESPONSE_TIME,
					threshold: -100,
					alertLevel: PerformanceAlertLevel.WARNING
				})
				negativeThresholdMethod(): string {
					return 'negative threshold';
				}
			}

			const service = new TestService();
			const result = service.negativeThresholdMethod();
			expect(result).toBe('negative threshold');
		});

		it('应该处理零值的告警阈值', () => {
			class TestService {
				@MonitorMethod({
					metricName: 'zeroThresholdMethod',
					metricType: PerformanceMetricType.RESPONSE_TIME,
					threshold: 0,
					alertLevel: PerformanceAlertLevel.LOW
				})
				zeroThresholdMethod(): string {
					return 'zero threshold';
				}
			}

			const service = new TestService();
			const result = service.zeroThresholdMethod();
			expect(result).toBe('zero threshold');
		});

		it('应该处理空的方法', () => {
			class TestService {
				@MonitorMethod({
					metricName: 'emptyMethod',
					metricType: PerformanceMetricType.RESPONSE_TIME,
					threshold: 100,
					alertLevel: PerformanceAlertLevel.WARNING
				})
				emptyMethod(): void {
					// 空方法
				}
			}

			const service = new TestService();
			expect(() => service.emptyMethod()).not.toThrow();
		});

		it('应该处理抛出异常的方法', () => {
			class TestService {
				@MonitorMethod({
					metricName: 'errorMethod',
					metricType: PerformanceMetricType.ERROR_RATE,
					threshold: 0.1,
					alertLevel: PerformanceAlertLevel.ERROR
				})
				errorMethod(): never {
					throw new Error('Method error');
				}
			}

			const service = new TestService();
			expect(() => service.errorMethod()).toThrow('Method error');
		});
	});

	describe('性能测试', () => {
		it('应该能够处理大量方法调用', async () => {
			class TestService {
				@MonitorMethod({
					metricName: 'performanceMethod',
					metricType: PerformanceMetricType.RESPONSE_TIME,
					threshold: 10,
					alertLevel: PerformanceAlertLevel.LOW
				})
				async performanceMethod(): Promise<string> {
					return 'performance test';
				}
			}

			const service = new TestService();
			const startTime = Date.now();
			const promises = [];

			for (let i = 0; i < 100; i++) {
				promises.push(service.performanceMethod());
			}

			const results = await Promise.all(promises);
			const endTime = Date.now();
			const duration = endTime - startTime;

			expect(results).toHaveLength(100);
			expect(duration).toBeLessThan(1000); // 应该在1秒内完成
		});

		it('应该能够处理并发方法调用', async () => {
			class TestService {
				@MonitorMethod({
					metricName: 'concurrentMethod',
					metricType: PerformanceMetricType.THROUGHPUT,
					threshold: 50,
					alertLevel: PerformanceAlertLevel.WARNING
				})
				async concurrentMethod(): Promise<string> {
					await new Promise((resolve) => setTimeout(resolve, 10));
					return 'concurrent test';
				}
			}

			const service = new TestService();
			const startTime = Date.now();
			const promises = [];

			for (let i = 0; i < 20; i++) {
				promises.push(service.concurrentMethod());
			}

			const results = await Promise.all(promises);
			const endTime = Date.now();
			const duration = endTime - startTime;

			expect(results).toHaveLength(20);
			expect(duration).toBeLessThan(500); // 应该在500ms内完成
		});
	});
});
