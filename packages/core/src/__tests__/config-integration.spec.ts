/**
 * Core模块配置集成测试
 *
 * @description 测试Core模块与统一配置管理系统的集成
 *
 * @since 1.0.0
 */

import { TenantContextManager } from '../common/multi-tenant/context/tenant-context-manager';
import { CorePerformanceMonitor } from '../infrastructure/monitoring/core-performance-monitor';
import { CoreCQRSBus } from '../application/cqrs/bus/core-cqrs-bus';
import type { CoreConfigService } from '../infrastructure/config/core-config.service';
import type { ILoggerService } from '@aiofix/logging';

// Mock配置服务
const createMockConfigService = (): CoreConfigService => {
	return {
		initialize: jest.fn().mockResolvedValue(undefined),
		getConfig: jest.fn().mockResolvedValue({
			enabled: true,
			multiTenant: {
				enabled: true,
				strictMode: false,
				defaultIsolationLevel: 'ROW',
				enableContextValidation: true
			},
			monitoring: {
				enabled: true,
				interval: 60000,
				enableRealTime: true,
				enableAlerts: true,
				thresholds: {},
				enableAnalysis: true,
				enableReporting: true,
				enableMultiTenant: true
			},
			cqrs: {
				enabled: true,
				commandBus: { timeout: 30000, maxRetries: 3 },
				queryBus: { enableCache: false, cacheTTL: 300000 },
				eventBus: { enableAsync: true, maxConcurrency: 10 }
			}
		}),
		getMultiTenantConfig: jest.fn().mockResolvedValue({
			enabled: true,
			strictMode: false,
			defaultIsolationLevel: 'ROW',
			enableContextValidation: true
		}),
		getMonitoringConfig: jest.fn().mockResolvedValue({
			enabled: true,
			interval: 60000,
			enableRealTime: true,
			enableAlerts: true,
			thresholds: {},
			enableAnalysis: true,
			enableReporting: true,
			enableMultiTenant: true
		}),
		getCQRSConfig: jest.fn().mockResolvedValue({
			enabled: true,
			commandBus: { timeout: 30000, maxRetries: 3 },
			queryBus: { enableCache: false, cacheTTL: 300000 },
			eventBus: { enableAsync: true, maxConcurrency: 10 }
		}),
		getErrorHandlingConfig: jest.fn(),
		getWebConfig: jest.fn(),
		getDatabaseConfig: jest.fn(),
		getMessagingConfig: jest.fn(),
		isEnabled: jest.fn().mockResolvedValue(true),
		isMultiTenantEnabled: jest.fn().mockResolvedValue(true),
		isMonitoringEnabled: jest.fn().mockResolvedValue(true),
		isCQRSEnabled: jest.fn().mockResolvedValue(true),
		onConfigChange: jest.fn(),
		offConfigChange: jest.fn(),
		reloadConfig: jest.fn(),
		getStatus: jest.fn(),
		destroy: jest.fn()
	} as IConfigService;
};

// Mock日志服务
const createMockLogger = (): ILoggerService => {
	return {
		debug: jest.fn(),
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
		fatal: jest.fn(),
		trace: jest.fn(),
		setContext: jest.fn(),
		child: jest.fn().mockReturnThis()
	} as ILoggerService;
};

describe('Core模块配置集成', () => {
	let mockConfigService: CoreConfigService;
	let mockLogger: ILoggerService;

	beforeEach(() => {
		mockConfigService = createMockConfigService();
		mockLogger = createMockLogger();

		// 重置TenantContextManager的静态状态
		TenantContextManager.resetMetrics();
	});

	describe('TenantContextManager配置集成', () => {
		it('应该能够设置配置服务', () => {
			expect(() => {
				TenantContextManager.setConfigService(mockConfigService);
			}).not.toThrow();
		});

		it('应该能够获取多租户配置', async () => {
			TenantContextManager.setConfigService(mockConfigService);

			const config = await TenantContextManager.getMultiTenantConfig();

			expect(config).toBeDefined();
			expect(config?.enabled).toBe(true);
			expect(config?.strictMode).toBe(false);
			expect(config?.defaultIsolationLevel).toBe('ROW');
			expect(config?.enableContextValidation).toBe(true);
		});

		it('应该能够检查多租户是否启用', async () => {
			TenantContextManager.setConfigService(mockConfigService);

			const enabled = await TenantContextManager.isMultiTenantEnabled();

			expect(enabled).toBe(true);
		});

		it('应该在没有配置服务时使用默认配置', async () => {
			// 不设置配置服务
			const config = await TenantContextManager.getMultiTenantConfig();

			expect(config).toBeDefined();
			expect(config?.enabled).toBe(true);
			expect(config?.strictMode).toBe(false);
		});

		it('应该基于配置验证租户上下文', async () => {
			TenantContextManager.setConfigService(mockConfigService);

			// 设置有效的租户上下文
			TenantContextManager.run('test-tenant', async () => {
				const validation = await TenantContextManager.validateContext();

				expect(validation.valid).toBe(true);
				expect(validation.errors).toHaveLength(0);
				expect(validation.config?.enabled).toBe(true);
				expect(validation.config?.validationEnabled).toBe(true);
			});
		});

		it('应该在严格模式下进行额外验证', async () => {
			// 设置严格模式配置
			const strictConfigService = createMockConfigService();
			(strictConfigService.getMultiTenantConfig as jest.Mock).mockResolvedValue({
				enabled: true,
				strictMode: true,
				defaultIsolationLevel: 'ROW',
				enableContextValidation: true
			});

			TenantContextManager.setConfigService(strictConfigService);

			// 设置不完整的租户上下文（缺少tenantCode）
			TenantContextManager.run('ab', async () => {
				// 长度小于3
				const validation = await TenantContextManager.validateContext();

				expect(validation.valid).toBe(false);
				expect(validation.errors.length).toBeGreaterThan(0);
				expect(validation.config?.strictMode).toBe(true);
			});
		});
	});

	describe('CorePerformanceMonitor配置集成', () => {
		it('应该能够使用配置服务初始化', async () => {
			const monitor = new CorePerformanceMonitor(mockLogger, mockConfigService);

			await expect(monitor.start()).resolves.not.toThrow();
		});

		it('应该在没有配置服务时使用默认配置', async () => {
			const monitor = new CorePerformanceMonitor(mockLogger);

			await expect(monitor.start()).resolves.not.toThrow();

			const config = monitor.getConfiguration();
			expect(config.enabled).toBe(true);
			expect(config.monitoringInterval).toBe(60000);
		});

		it('应该能够基于配置禁用监控', async () => {
			// 设置禁用监控的配置
			const disabledConfigService = createMockConfigService();
			(disabledConfigService.getMonitoringConfig as jest.Mock).mockResolvedValue({
				enabled: false
			});

			const monitor = new CorePerformanceMonitor(mockLogger, disabledConfigService);
			await monitor.start();

			const config = monitor.getConfiguration();
			expect(config.enabled).toBe(false);
		});
	});

	describe('CoreCQRSBus配置集成', () => {
		let mockCommandBus: ICommandBus;
		let mockQueryBus: IQueryBus;
		let mockEventBus: IEventBus;

		beforeEach(() => {
			mockCommandBus = { register: jest.fn() };
			mockQueryBus = { register: jest.fn() };
			mockEventBus = { register: jest.fn() };
		});

		it('应该能够使用配置服务初始化', async () => {
			const cqrsBus = new CoreCQRSBus(mockCommandBus, mockQueryBus, mockEventBus, mockConfigService);

			await expect(cqrsBus.initialize()).resolves.not.toThrow();
			expect(cqrsBus.isInitialized).toBe(true);
		});

		it('应该在没有配置服务时使用默认配置', async () => {
			const cqrsBus = new CoreCQRSBus(mockCommandBus, mockQueryBus, mockEventBus);

			await expect(cqrsBus.initialize()).resolves.not.toThrow();
			expect(cqrsBus.isInitialized).toBe(true);
		});

		it('应该能够基于配置禁用CQRS', async () => {
			// 设置禁用CQRS的配置
			const disabledConfigService = createMockConfigService();
			(disabledConfigService.getCQRSConfig as jest.Mock).mockResolvedValue({
				enabled: false
			});

			const cqrsBus = new CoreCQRSBus(mockCommandBus, mockQueryBus, mockEventBus, disabledConfigService);

			await expect(cqrsBus.initialize()).resolves.not.toThrow();
			expect(cqrsBus.isInitialized).toBe(true);
		});

		it('应该能够获取命令、查询和事件总线', () => {
			const cqrsBus = new CoreCQRSBus(mockCommandBus, mockQueryBus, mockEventBus, mockConfigService);

			expect(cqrsBus.commandBus).toBe(mockCommandBus);
			expect(cqrsBus.queryBus).toBe(mockQueryBus);
			expect(cqrsBus.eventBus).toBe(mockEventBus);
		});
	});

	describe('配置集成综合测试', () => {
		it('应该能够协调多个组件的配置', async () => {
			// 设置TenantContextManager配置
			TenantContextManager.setConfigService(mockConfigService);

			// 创建性能监控器
			const monitor = new CorePerformanceMonitor(mockLogger, mockConfigService);

			// 创建CQRS总线
			const cqrsBus = new CoreCQRSBus(
				{}, // Mock命令总线
				{}, // Mock查询总线
				{}, // Mock事件总线
				mockConfigService
			);

			// 启动所有组件
			await monitor.start();
			await cqrsBus.initialize();

			// 验证配置已加载
			expect(await TenantContextManager.isMultiTenantEnabled()).toBe(true);
			expect(monitor.getConfiguration().enabled).toBe(true);
			expect(cqrsBus.isInitialized).toBe(true);
		});

		it('应该能够处理配置加载失败', async () => {
			// 创建会失败的配置服务
			const failingConfigService = createMockConfigService();
			(failingConfigService.getMultiTenantConfig as jest.Mock).mockRejectedValue(new Error('配置加载失败'));

			TenantContextManager.setConfigService(failingConfigService);

			// 应该优雅处理配置失败
			const config = await TenantContextManager.getMultiTenantConfig();
			expect(config).toBeNull();
		});

		it('应该能够在运行时更新配置', async () => {
			// 初始配置
			TenantContextManager.setConfigService(mockConfigService);

			// 更新配置服务的返回值
			(mockConfigService.getMultiTenantConfig as jest.Mock).mockResolvedValue({
				enabled: true,
				strictMode: true, // 更新为严格模式
				defaultIsolationLevel: 'SCHEMA',
				enableContextValidation: true
			});

			// 重新获取配置
			const updatedConfig = await TenantContextManager.getMultiTenantConfig();

			expect(updatedConfig?.strictMode).toBe(true);
			expect(updatedConfig?.defaultIsolationLevel).toBe('SCHEMA');
		});
	});
});
