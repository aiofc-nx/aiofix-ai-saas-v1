/**
 * CORS插件实现
 *
 * @description 提供跨域资源共享(CORS)支持的Fastify插件
 *
 * ## 业务规则
 *
 * ### CORS配置规则
 * - origin: 允许的源域名，支持字符串、数组、函数、布尔值
 * - methods: 允许的HTTP方法，默认为GET,HEAD,PUT,PATCH,POST,DELETE
 * - allowedHeaders: 允许的请求头，支持数组或字符串
 * - credentials: 是否允许发送凭据信息（cookies、授权头等）
 * - maxAge: 预检请求的缓存时间（秒）
 *
 * ### 安全规则
 * - 生产环境不应使用通配符origin (*)
 * - 敏感API端点应限制特定的origin
 * - 预检请求应设置合理的缓存时间
 * - 应根据业务需求配置allowedHeaders
 *
 * ### 性能优化规则
 * - 合理设置maxAge减少预检请求频率
 * - 使用函数形式的origin进行动态验证时注意性能
 * - 避免过于复杂的origin验证逻辑
 *
 * @example
 * ```typescript
 * const corsPlugin = new CorsPlugin({
 *   name: 'cors',
 *   priority: 1,
 *   options: {
 *     origin: ['https://example.com', 'https://app.example.com'],
 *     credentials: true,
 *     methods: ['GET', 'POST', 'PUT', 'DELETE'],
 *     allowedHeaders: ['Content-Type', 'Authorization']
 *   }
 * });
 * ```
 *
 * @since 1.0.0
 */

import { FastifyInstance } from '../../../../common/types/fastify-types';
import { ILoggerService } from '../../../../common/types/compatibility-types';
import { CoreFastifyPlugin } from './core-fastify.plugin';
import { IFastifyPluginConfig } from '../interfaces/fastify.interface';

/**
 * CORS插件配置接口
 */
export interface ICorsPluginConfig extends IFastifyPluginConfig {
	options: {
		/**
		 * 允许的源域名
		 * - true: 允许所有域名
		 * - false: 不允许任何域名
		 * - string: 允许单个域名
		 * - string[]: 允许多个域名
		 * - function: 动态验证域名
		 */
		origin?:
			| boolean
			| string
			| string[]
			| ((origin: string, callback: (error: Error | null, allow?: boolean) => void) => void);

		/**
		 * 允许的HTTP方法
		 */
		methods?: string | string[];

		/**
		 * 允许的请求头
		 */
		allowedHeaders?: string | string[];

		/**
		 * 是否允许发送凭据信息
		 */
		credentials?: boolean;

		/**
		 * 预检请求的缓存时间（秒）
		 */
		maxAge?: number;

		/**
		 * 是否在OPTIONS请求后继续处理
		 */
		optionsSuccessStatus?: number;

		/**
		 * 预检请求失败时的状态码
		 */
		preflightContinue?: boolean;
	};
}

/**
 * CORS插件实现
 */
export class CorsPlugin extends CoreFastifyPlugin {
	constructor(config: ICorsPluginConfig, logger?: ILoggerService) {
		super(config, logger);
		this.validateCorsConfig();
	}

	/**
	 * 执行插件注册
	 */
	protected override async doRegister(fastify: FastifyInstance): Promise<void> {
		try {
			// 注册CORS插件（简化实现）
			await (fastify as unknown as { register: (plugin: unknown, options?: unknown) => Promise<void> }).register(
				require('@fastify/cors'),
				this.getCorsOptions()
			);

			this.logger?.info('CORS插件注册成功', {
				name: this.name,
				options: this.sanitizeOptionsForLog()
			});
		} catch (error) {
			this.logger?.error('CORS插件注册失败', error as Error, {
				name: this.name
			});
			throw error;
		}
	}

	/**
	 * 执行插件卸载
	 */
	protected override async doUnregister(_fastify: FastifyInstance): Promise<void> {
		// Fastify插件通常不支持动态卸载
		// 这里只记录日志
		this.logger?.info('CORS插件卸载（注意：Fastify插件通常不支持动态卸载）', {
			name: this.name
		});
	}

	/**
	 * 获取自定义指标
	 */
	protected override async getCustomMetrics(): Promise<Record<string, unknown>> {
		return {
			corsEnabled: true,
			originType: this.getOriginType(),
			credentialsEnabled: this.getCorsOptions().credentials || false,
			allowedMethods: this.getCorsOptions().methods || 'default',
			maxAge: this.getCorsOptions().maxAge || 'default'
		};
	}

	/**
	 * 验证CORS配置
	 */
	private validateCorsConfig(): void {
		const config = this.config as ICorsPluginConfig;

		if (!config.options) {
			throw new Error('CORS插件配置选项不能为空');
		}

		// 验证origin配置
		const { origin } = config.options;
		if (
			origin !== undefined &&
			typeof origin !== 'boolean' &&
			typeof origin !== 'string' &&
			typeof origin !== 'function' &&
			!Array.isArray(origin)
		) {
			throw new Error('CORS origin配置类型不正确');
		}

		// 生产环境安全检查
		if (process.env.NODE_ENV === 'production' && origin === true) {
			this.logger?.warn('生产环境使用通配符CORS origin可能存在安全风险', {
				name: this.name
			});
		}

		// 验证methods配置
		const { methods } = config.options;
		if (methods !== undefined && typeof methods !== 'string' && !Array.isArray(methods)) {
			throw new Error('CORS methods配置类型不正确');
		}

		// 验证maxAge配置
		const { maxAge } = config.options;
		if (maxAge !== undefined && (typeof maxAge !== 'number' || maxAge < 0)) {
			throw new Error('CORS maxAge必须为非负数');
		}
	}

	/**
	 * 获取CORS配置选项
	 */
	private getCorsOptions(): ICorsPluginConfig['options'] {
		const config = this.config as ICorsPluginConfig;
		return {
			origin: config.options.origin || true,
			methods: config.options.methods || ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
			allowedHeaders: config.options.allowedHeaders,
			credentials: config.options.credentials || false,
			maxAge: config.options.maxAge,
			optionsSuccessStatus: config.options.optionsSuccessStatus || 204,
			preflightContinue: config.options.preflightContinue || false
		};
	}

	/**
	 * 获取origin类型（用于指标）
	 */
	private getOriginType(): string {
		const origin = this.getCorsOptions().origin;

		if (typeof origin === 'boolean') {
			return origin ? 'wildcard' : 'none';
		}

		if (typeof origin === 'string') {
			return 'single';
		}

		if (Array.isArray(origin)) {
			return 'multiple';
		}

		if (typeof origin === 'function') {
			return 'dynamic';
		}

		return 'unknown';
	}

	/**
	 * 清理敏感信息用于日志记录
	 */
	private sanitizeOptionsForLog(): Record<string, unknown> {
		const options = this.getCorsOptions();
		return {
			originType: this.getOriginType(),
			credentialsEnabled: options.credentials,
			methodsCount: Array.isArray(options.methods) ? options.methods.length : 'default',
			maxAge: options.maxAge || 'default'
		};
	}
}
