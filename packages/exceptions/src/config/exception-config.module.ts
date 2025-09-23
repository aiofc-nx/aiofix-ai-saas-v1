/**
 * 异常配置模块
 *
 * 负责提供异常处理模块的配置服务，与@aiofix/config模块集成。
 * 提供配置的加载、验证、热更新等功能。
 *
 * @description 异常配置模块实现类
 * @example
 * ```typescript
 * @Module({
 *   imports: [ExceptionConfigModule.forRoot()],
 * })
 * export class AppModule {}
 * ```
 *
 * @since 1.0.0
 */

import { Module, DynamicModule, Global } from '@nestjs/common';
import { ExceptionConfigService } from './exception-config.service';

/**
 * 异常配置模块选项
 */
export interface IExceptionConfigModuleOptions {
	/**
	 * 是否启用全局配置
	 */
	isGlobal?: boolean;

	/**
	 * 是否启用配置热更新
	 */
	enableHotReload?: boolean;

	/**
	 * 配置更新检查间隔（毫秒）
	 */
	configCheckInterval?: number;
}

/**
 * 异常配置模块
 */
@Global()
@Module({})
export class ExceptionConfigModule {
	/**
	 * 创建根配置模块
	 *
	 * @param options - 配置选项
	 * @returns 动态模块
	 */
	static forRoot(options: IExceptionConfigModuleOptions = {}): DynamicModule {
		const { isGlobal = true, enableHotReload = true, configCheckInterval = 30000 } = options;

		return {
			module: ExceptionConfigModule,
			providers: [
				{
					provide: ExceptionConfigService,
					useFactory: async (configManager: any, logger: any) => {
						const service = new ExceptionConfigService(configManager, logger);

						// 如果启用热更新，启动配置检查
						if (enableHotReload) {
							service.startConfigWatcher(configCheckInterval);
						}

						return service;
					},
					inject: ['IConfigManager', 'ILoggerService']
				},
				{
					provide: 'EXCEPTION_CONFIG_OPTIONS',
					useValue: options
				}
			],
			exports: [ExceptionConfigService],
			global: isGlobal
		};
	}

	/**
	 * 创建特性配置模块
	 *
	 * @param options - 配置选项
	 * @returns 动态模块
	 */
	static forFeature(_options: Partial<IExceptionConfigModuleOptions> = {}): DynamicModule {
		return {
			module: ExceptionConfigModule,
			providers: [
				{
					provide: ExceptionConfigService,
					useFactory: async (configManager: any, logger: any) => {
						return new ExceptionConfigService(configManager, logger);
					},
					inject: ['IConfigManager', 'ILoggerService']
				}
			],
			exports: [ExceptionConfigService]
		};
	}
}
