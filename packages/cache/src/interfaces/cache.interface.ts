/**
 * 统一缓存管理系统接口
 *
 * @description 定义企业级缓存管理系统的核心接口和类型
 * 支持多租户、多级缓存、智能策略和事件驱动架构
 *
 * ## 业务规则
 *
 * ### 缓存隔离规则
 * - 支持多种隔离级别：租户、组织、用户、完全隔离
 * - 缓存键必须包含租户上下文信息
 * - 跨租户访问被严格禁止
 * - 支持租户级别的缓存清理和管理
 *
 * ### 缓存策略规则
 * - 基于访问模式的智能策略选择
 * - 支持多级缓存的协调和同步
 * - 自适应的TTL和容量管理
 * - 支持缓存预热和失效策略
 *
 * ### 性能监控规则
 * - 所有缓存操作都必须记录性能指标
 * - 支持实时监控和历史分析
 * - 提供缓存健康检查和诊断
 * - 集成告警和通知机制
 *
 * @since 1.0.0
 */

// 导入并重新导出Core模块的正式接口
import type { TenantContext } from '@aiofix/core';

// 重新导出类型以供其他模块使用
export type { TenantContext };

/**
 * 缓存隔离级别枚举
 *
 * @description 定义不同级别的缓存隔离策略
 */
export enum CacheIsolationLevel {
	/** 无隔离 - 全局共享缓存 */
	NONE = 'none',
	/** 租户级隔离 - 按租户隔离缓存 */
	TENANT = 'tenant',
	/** 组织级隔离 - 按组织隔离缓存 */
	ORGANIZATION = 'organization',
	/** 用户级隔离 - 按用户隔离缓存 */
	USER = 'user',
	/** 完全隔离 - 多维度隔离 */
	FULL = 'full'
}

/**
 * 缓存策略枚举
 *
 * @description 定义缓存的替换和管理策略
 */
export enum CacheStrategy {
	/** 最近最少使用 */
	LRU = 'lru',
	/** 最少使用频率 */
	LFU = 'lfu',
	/** 先进先出 */
	FIFO = 'fifo',
	/** 基于时间过期 */
	TTL = 'ttl',
	/** 自适应策略 */
	ADAPTIVE = 'adaptive'
}

/**
 * 缓存层类型枚举
 *
 * @description 定义不同的缓存存储层
 */
export enum CacheLayerType {
	/** 内存缓存 */
	MEMORY = 'memory',
	/** Redis缓存 */
	REDIS = 'redis',
	/** 分布式缓存 */
	DISTRIBUTED = 'distributed',
	/** 混合缓存 */
	HYBRID = 'hybrid'
}

/**
 * 数据敏感性级别枚举
 *
 * @description 定义缓存数据的敏感性级别，影响加密和访问控制
 */
export enum DataSensitivity {
	/** 公开数据 */
	PUBLIC = 'public',
	/** 内部数据 */
	INTERNAL = 'internal',
	/** 敏感数据 */
	SENSITIVE = 'sensitive',
	/** 高度敏感数据 */
	HIGH = 'high',
	/** 机密数据 */
	CONFIDENTIAL = 'confidential'
}

/**
 * 缓存访问模式枚举
 *
 * @description 定义缓存的访问模式，用于智能策略选择
 */
export enum CacheAccessPattern {
	/** 频繁读取 */
	FREQUENT_READ = 'frequent_read',
	/** 偶尔读取 */
	INFREQUENT_READ = 'infrequent_read',
	/** 写入密集 */
	WRITE_HEAVY = 'write_heavy',
	/** 读写平衡 */
	BALANCED = 'balanced',
	/** 一次性写入 */
	WRITE_ONCE = 'write_once'
}

/**
 * 缓存模块配置接口
 *
 * @description 缓存模块的完整配置，集成到统一配置管理系统
 */
export interface ICacheModuleConfig {
	/** 是否启用缓存模块 */
	enabled: boolean;

	/** 全局配置 */
	global: {
		/** 默认TTL（毫秒） */
		defaultTTL: number;
		/** 最大缓存大小 */
		maxSize: number;
		/** 是否启用压缩 */
		enableCompression: boolean;
		/** 是否启用加密 */
		enableEncryption: boolean;
		/** 是否启用统计 */
		enableStats: boolean;
		/** 是否启用事件 */
		enableEvents: boolean;
		/** 缓存隔离级别 */
		isolationLevel: CacheIsolationLevel;
		/** 默认缓存策略 */
		defaultStrategy: CacheStrategy;
	};

	/** Redis配置 */
	redis: {
		/** Redis主机地址 */
		host: string;
		/** Redis端口 */
		port: number;
		/** Redis密码 */
		password?: string;
		/** 数据库索引 */
		db: number;
		/** 连接超时（毫秒） */
		connectTimeout: number;
		/** 命令超时（毫秒） */
		commandTimeout: number;
		/** 重试次数 */
		retries: number;
		/** 重试延迟（毫秒） */
		retryDelay: number;
		/** 集群配置 */
		cluster?: {
			enabled: boolean;
			nodes: Array<{ host: string; port: number }>;
		};
		/** 哨兵配置 */
		sentinel?: {
			enabled: boolean;
			sentinels: Array<{ host: string; port: number }>;
			name: string;
		};
	};

	/** 内存缓存配置 */
	memory: {
		/** 最大缓存大小 */
		maxSize: number;
		/** 缓存策略 */
		strategy: CacheStrategy;
		/** 清理间隔（毫秒） */
		cleanupInterval: number;
		/** 是否启用压缩 */
		enableCompression: boolean;
	};

	/** 缓存层配置 */
	layers: Record<string, ICacheLayerConfig>;

	/** 监控配置 */
	monitoring: {
		/** 是否启用监控 */
		enabled: boolean;
		/** 指标收集间隔（毫秒） */
		metricsInterval: number;
		/** 是否启用追踪 */
		enableTracing: boolean;
		/** 是否启用告警 */
		enableAlerts: boolean;
	};

	/** 预热配置 */
	warmup: {
		/** 是否启用预热 */
		enabled: boolean;
		/** 预热策略列表 */
		strategies: string[];
		/** 预热调度表达式 */
		schedule: string;
	};
}

/**
 * 缓存层配置接口
 *
 * @description 单个缓存层的配置选项
 */
export interface ICacheLayerConfig {
	/** 缓存层名称 */
	name: string;
	/** 缓存层类型 */
	type: CacheLayerType;
	/** 是否启用 */
	enabled: boolean;
	/** 优先级（数字越小优先级越高） */
	priority: number;
	/** 是否只读 */
	readOnly: boolean;
	/** 缓存选项 */
	options: ICacheOptions;
}

/**
 * 缓存选项接口
 *
 * @description 通用的缓存操作选项
 */
export interface ICacheOptions {
	/** TTL（毫秒） */
	ttl?: number;
	/** 是否压缩 */
	compress?: boolean;
	/** 是否加密 */
	encrypt?: boolean;
	/** 数据敏感性级别 */
	sensitivity?: DataSensitivity;
	/** 缓存策略 */
	strategy?: CacheStrategy;
	/** 自定义元数据 */
	metadata?: Record<string, unknown>;
}

/**
 * 缓存获取选项接口
 */
export interface ICacheGetOptions extends ICacheOptions {
	/** 是否刷新缓存 */
	refresh?: boolean;
	/** 回退值 */
	fallback?: unknown;
}

/**
 * 缓存设置选项接口
 */
export interface ICacheSetOptions extends ICacheOptions {
	/** 是否覆盖现有值 */
	overwrite?: boolean;
	/** 条件设置 */
	condition?: (existingValue: unknown) => boolean;
}

/**
 * 缓存失效选项接口
 */
export interface ICacheEvictOptions {
	/** 是否级联失效 */
	cascade?: boolean;
	/** 失效模式 */
	mode?: 'exact' | 'pattern' | 'prefix';
	/** 批量大小 */
	batchSize?: number;
}

/**
 * 缓存上下文接口
 *
 * @description 缓存操作的上下文信息
 */
export interface ICacheContext {
	/** 租户上下文 */
	tenantContext?: TenantContext;
	/** 操作类型 */
	operation: 'get' | 'set' | 'delete' | 'clear' | 'exists' | 'batch' | 'warmup' | 'cleanup' | 'initialize' | 'destroy';
	/** 缓存键 */
	key: string;
	/** 开始时间 */
	startTime: Date;
	/** 时间戳 */
	timestamp: Date;
	/** 元数据 */
	metadata?: Record<string, unknown>;
}

/**
 * 缓存服务接口
 *
 * @description 定义缓存服务的基本操作
 */
export interface ICacheService {
	/**
	 * 获取缓存值
	 *
	 * @param key - 缓存键
	 * @param options - 获取选项
	 * @returns 缓存值或null
	 */
	get<T>(key: string, options?: ICacheGetOptions): Promise<T | null>;

	/**
	 * 设置缓存值
	 *
	 * @param key - 缓存键
	 * @param value - 缓存值
	 * @param options - 设置选项
	 * @returns 是否设置成功
	 */
	set<T>(key: string, value: T, options?: ICacheSetOptions): Promise<boolean>;

	/**
	 * 删除缓存值
	 *
	 * @param key - 缓存键
	 * @returns 是否删除成功
	 */
	delete(key: string): Promise<boolean>;

	/**
	 * 检查缓存是否存在
	 *
	 * @param key - 缓存键
	 * @returns 是否存在
	 */
	exists(key: string): Promise<boolean>;

	/**
	 * 清空所有缓存
	 *
	 * @returns 清空的数量
	 */
	clear(): Promise<number>;

	/**
	 * 获取缓存统计信息
	 *
	 * @returns 统计信息
	 */
	getStats(): Promise<ICacheStats>;

	/**
	 * 获取缓存健康状态
	 *
	 * @returns 健康状态
	 */
	getHealth(): Promise<ICacheHealth>;
}

/**
 * 多租户感知缓存服务接口
 *
 * @description 扩展基础缓存服务，添加多租户支持
 */
export interface ITenantAwareCacheService extends ICacheService {
	/**
	 * 获取租户特定的缓存值
	 *
	 * @param key - 缓存键
	 * @param tenantContext - 租户上下文
	 * @param options - 获取选项
	 * @returns 缓存值或null
	 */
	getTenantCache<T>(key: string, tenantContext: TenantContext, options?: ICacheGetOptions): Promise<T | null>;

	/**
	 * 设置租户特定的缓存值
	 *
	 * @param key - 缓存键
	 * @param value - 缓存值
	 * @param tenantContext - 租户上下文
	 * @param options - 设置选项
	 * @returns 是否设置成功
	 */
	setTenantCache<T>(key: string, value: T, tenantContext: TenantContext, options?: ICacheSetOptions): Promise<boolean>;

	/**
	 * 清理租户缓存
	 *
	 * @param tenantId - 租户ID
	 * @returns 清理结果
	 */
	cleanupTenantCache(tenantId: string): Promise<ICacheCleanupResult>;

	/**
	 * 获取租户缓存统计
	 *
	 * @param tenantId - 租户ID
	 * @returns 租户缓存统计
	 */
	getTenantStats(tenantId: string): Promise<ICacheTenantStats>;
}

/**
 * 缓存管理器接口
 *
 * @description 统一缓存管理器的核心接口
 */
export interface IUnifiedCacheManager extends ITenantAwareCacheService {
	/**
	 * 初始化缓存管理器
	 */
	initialize(): Promise<void>;

	/**
	 * 销毁缓存管理器
	 */
	destroy(): Promise<void>;

	/**
	 * 获取所有缓存层
	 *
	 * @returns 缓存层列表
	 */
	getAllLayers(): Promise<ICacheLayer[]>;

	/**
	 * 添加缓存层
	 *
	 * @param layer - 缓存层配置
	 */
	addLayer(layer: ICacheLayerConfig): Promise<void>;

	/**
	 * 移除缓存层
	 *
	 * @param layerName - 缓存层名称
	 */
	removeLayer(layerName: string): Promise<void>;

	/**
	 * 批量操作
	 *
	 * @param operations - 操作列表
	 * @returns 操作结果
	 */
	batch(operations: ICacheOperation[]): Promise<ICacheBatchResult>;

	/**
	 * 缓存预热
	 *
	 * @param items - 预热项目
	 * @returns 预热结果
	 */
	warmup(items: ICacheWarmupItem[]): Promise<ICacheWarmupResult>;
}

/**
 * 缓存层接口
 *
 * @description 单个缓存层的抽象接口
 */
export interface ICacheLayer {
	/** 缓存层名称 */
	readonly name: string;
	/** 缓存层类型 */
	readonly type: CacheLayerType;
	/** 是否启用 */
	enabled: boolean;
	/** 优先级 */
	priority: number;
	/** 是否只读 */
	readOnly: boolean;
	/** 缓存服务实例 */
	service: ICacheService;
	/** 配置选项 */
	options: ICacheOptions;
}

/**
 * 缓存操作接口
 *
 * @description 定义批量操作的单个操作
 */
export interface ICacheOperation {
	/** 操作类型 */
	type: 'get' | 'set' | 'delete' | 'exists';
	/** 缓存键 */
	key: string;
	/** 缓存值（仅用于set操作） */
	value?: unknown;
	/** 操作选项 */
	options?: ICacheOptions;
}

/**
 * 缓存批量操作结果接口
 */
export interface ICacheBatchResult {
	/** 总操作数 */
	total: number;
	/** 成功操作数 */
	successful: number;
	/** 失败操作数 */
	failed: number;
	/** 详细结果 */
	results: Array<{
		operation: ICacheOperation;
		success: boolean;
		result?: unknown;
		error?: Error;
	}>;
}

/**
 * 缓存预热项目接口
 */
export interface ICacheWarmupItem {
	/** 缓存键 */
	key: string;
	/** 预热函数 */
	loader: () => Promise<unknown>;
	/** 预热选项 */
	options?: ICacheOptions;
	/** 优先级 */
	priority?: number;
}

/**
 * 缓存预热结果接口
 */
export interface ICacheWarmupResult {
	/** 总预热项目数 */
	total: number;
	/** 成功预热数 */
	successful: number;
	/** 失败预热数 */
	failed: number;
	/** 预热耗时（毫秒） */
	duration: number;
	/** 详细结果 */
	details: Array<{
		key: string;
		success: boolean;
		duration: number;
		error?: Error;
	}>;
}

/**
 * 缓存统计信息接口
 */
export interface ICacheStats {
	/** 总操作数 */
	totalOperations: number;
	/** 命中次数 */
	hits: number;
	/** 未命中次数 */
	misses: number;
	/** 命中率 */
	hitRate: number;
	/** 平均响应时间（毫秒） */
	averageResponseTime: number;
	/** 错误次数 */
	errors: number;
	/** 错误率 */
	errorRate: number;
	/** 当前缓存项数量 */
	currentSize: number;
	/** 最大缓存大小 */
	maxSize: number;
	/** 内存使用量（字节） */
	memoryUsage: number;
	/** 最后更新时间 */
	lastUpdated: Date;
}

/**
 * 租户缓存统计接口
 */
export interface ICacheTenantStats extends ICacheStats {
	/** 租户ID */
	tenantId: string;
	/** 租户名称 */
	tenantName?: string;
	/** 租户特定的键数量 */
	tenantKeyCount: number;
	/** 租户内存使用量 */
	tenantMemoryUsage: number;
}

/**
 * 缓存健康状态接口
 */
export interface ICacheHealth {
	/** 整体健康状态 */
	overall: 'healthy' | 'degraded' | 'unhealthy';
	/** 各层健康状态 */
	layers: Array<{
		name: string;
		type: CacheLayerType;
		status: 'healthy' | 'degraded' | 'unhealthy';
		latency: number;
		errorRate: number;
		message?: string;
	}>;
	/** 连接状态 */
	connections: Array<{
		name: string;
		connected: boolean;
		latency: number;
		lastCheck: Date;
	}>;
	/** 建议 */
	recommendations: string[];
	/** 检查时间 */
	checkedAt: Date;
}

/**
 * 缓存清理结果接口
 */
export interface ICacheCleanupResult {
	/** 总键数 */
	totalKeys: number;
	/** 删除的键数 */
	deletedKeys: number;
	/** 失败的键数 */
	failedKeys: number;
	/** 清理耗时（毫秒） */
	duration: number;
	/** 错误列表 */
	errors: Error[];
}

/**
 * 缓存隔离策略接口
 *
 * @description 定义缓存隔离的具体实现策略
 */
export interface ICacheIsolationStrategy {
	/**
	 * 生成隔离的缓存键
	 *
	 * @param key - 原始缓存键
	 * @param context - 租户上下文
	 * @returns 隔离后的缓存键
	 */
	isolateKey(key: string, context: TenantContext): string;

	/**
	 * 验证缓存访问权限
	 *
	 * @param key - 缓存键
	 * @param context - 租户上下文
	 * @returns 是否有访问权限
	 */
	validateAccess(key: string, context: TenantContext): Promise<boolean>;

	/**
	 * 清理租户相关缓存
	 *
	 * @param tenantId - 租户ID
	 * @returns 清理结果
	 */
	cleanupTenantCache(tenantId: string): Promise<ICacheCleanupResult>;

	/**
	 * 提取缓存键中的租户信息
	 *
	 * @param key - 缓存键
	 * @returns 租户信息
	 */
	extractTenantInfo(key: string): {
		tenantId?: string;
		organizationId?: string;
		userId?: string;
	};
}

/**
 * 缓存策略决策接口
 *
 * @description 智能缓存策略的决策结果
 */
export interface ICacheStrategyDecision {
	/** 推荐的缓存策略 */
	strategy: CacheStrategy;
	/** 推荐的TTL */
	ttl: number;
	/** 推荐的缓存层 */
	layers: string[];
	/** 决策原因 */
	reason: string;
	/** 置信度（0-1） */
	confidence: number;
}

/**
 * 访问模式分析结果接口
 */
export interface IAccessPattern {
	/** 模式类型 */
	type: CacheAccessPattern;
	/** 访问频率（次/秒） */
	frequency: number;
	/** 平均访问间隔（毫秒） */
	avgInterval: number;
	/** 读写比例 */
	readWriteRatio: number;
	/** 数据大小（字节） */
	avgDataSize: number;
	/** 模式置信度 */
	confidence: number;
}

/**
 * 缓存错误基类
 *
 * @description 所有缓存相关错误的基类
 */
export class CacheError extends Error {
	public readonly code: string;
	public readonly timestamp: Date;

	constructor(
		message: string,
		public readonly operation: string,
		public readonly context: ICacheContext,
		code?: string
	) {
		super(message);
		this.name = 'CacheError';
		this.code = code || 'CACHE_ERROR';
		this.timestamp = new Date();
	}
}

/**
 * 缓存连接错误
 */
export class CacheConnectionError extends CacheError {
	constructor(message: string, context: ICacheContext) {
		super(message, 'connection', context, 'CACHE_CONNECTION_ERROR');
	}
}

/**
 * 缓存超时错误
 */
export class CacheTimeoutError extends CacheError {
	constructor(message: string, context: ICacheContext) {
		super(message, 'timeout', context, 'CACHE_TIMEOUT_ERROR');
	}
}

/**
 * 缓存序列化错误
 */
export class CacheSerializationError extends CacheError {
	constructor(message: string, context: ICacheContext) {
		super(message, 'serialization', context, 'CACHE_SERIALIZATION_ERROR');
	}
}

/**
 * 缓存访问拒绝错误
 */
export class CacheAccessDeniedError extends CacheError {
	constructor(message: string, context: ICacheContext) {
		super(message, 'access_denied', context, 'CACHE_ACCESS_DENIED');
	}
}

/**
 * 缓存操作错误
 */
export class CacheOperationError extends CacheError {
	constructor(message: string, operation: string, context: ICacheContext) {
		super(message, operation, context, 'CACHE_OPERATION_ERROR');
	}
}
