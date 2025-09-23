/**
 * 简化缓存模块
 *
 * @description 第一阶段的NestJS模块集成
 * 提供基础的缓存功能，后续将逐步完善
 *
 * @since 1.0.0
 */

import { Module, DynamicModule, Provider, Global, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import type { IConfigManager } from '@aiofix/config';
import { SimpleCacheManager } from '../core/simple-cache-manager';
import { SimpleCacheConfigService } from '../config/simple-cache-config.service';

/**
 * 简化缓存模块选项接口
 */
export interface ISimpleCacheModuleOptions {
	/** 是否全局模块 */
	global?: boolean;
	/** 是否启用监控 */
	enableMonitoring?: boolean;
}

/**
 * 简化缓存模块实现
 */
@Global()
@Module({})
export class SimpleCacheModule implements OnModuleInit, OnModuleDestroy {
	private static cacheManager: SimpleCacheManager | null = null;
	private static configService: SimpleCacheConfigService | null = null;

	/**
	 * 根模块配置
	 */
	static forRoot(options: ISimpleCacheModuleOptions = {}): DynamicModule {
		const providers: Provider[] = [
			// 配置服务
			{
				provide: SimpleCacheConfigService,
				useFactory: async (configManager: IConfigManager) => {
					const service = new SimpleCacheConfigService(configManager);
					SimpleCacheModule.configService = service;
					return service;
				},
				inject: ['IConfigManager'] // 临时token，等待Core模块完善
			},

			// 缓存管理器
			{
				provide: SimpleCacheManager,
				useFactory: async (configManager: IConfigManager) => {
					const manager = new SimpleCacheManager(configManager);
					SimpleCacheModule.cacheManager = manager;
					return manager;
				},
				inject: ['IConfigManager']
			}
		];

		return {
			module: SimpleCacheModule,
			providers,
			exports: [SimpleCacheManager, SimpleCacheConfigService],
			global: options.global !== false
		};
	}

	/**
	 * 模块初始化
	 */
	async onModuleInit(): Promise<void> {
		try {
			// 初始化配置服务
			if (SimpleCacheModule.configService) {
				await SimpleCacheModule.configService.initialize();
			}

			// 初始化缓存管理器
			if (SimpleCacheModule.cacheManager) {
				await SimpleCacheModule.cacheManager.initialize();
			}

			console.warn('简化缓存模块初始化完成');
		} catch (error) {
			console.error('简化缓存模块初始化失败:', error);
			throw error;
		}
	}

	/**
	 * 模块销毁
	 */
	async onModuleDestroy(): Promise<void> {
		try {
			// 销毁缓存管理器
			if (SimpleCacheModule.cacheManager) {
				await SimpleCacheModule.cacheManager.destroy();
				SimpleCacheModule.cacheManager = null;
			}

			// 销毁配置服务
			if (SimpleCacheModule.configService) {
				await SimpleCacheModule.configService.destroy();
				SimpleCacheModule.configService = null;
			}

			console.warn('简化缓存模块销毁完成');
		} catch (error) {
			console.error('简化缓存模块销毁失败:', error);
		}
	}
}

/**
 * 缓存管理器注入装饰器
 */
export const InjectSimpleCacheManager = (): ParameterDecorator => {
	return Inject(SimpleCacheManager);
};

/**
 * 缓存配置注入装饰器
 */
export const InjectSimpleCacheConfig = (): ParameterDecorator => {
	return Inject(SimpleCacheConfigService);
};
