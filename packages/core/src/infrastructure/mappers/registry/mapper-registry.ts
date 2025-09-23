/**
 * 映射器注册表
 *
 * 管理所有映射器的注册、发现和获取，提供映射器的生命周期管理。
 * 注册表支持运行时映射器发现和依赖注入集成。
 *
 * @description 映射器注册表提供了映射器的集中管理功能
 *
 * ## 业务规则
 *
 * ### 注册规则
 * - 每个类型组合只能注册一个主映射器
 * - 映射器注册时必须验证元数据的完整性
 * - 支持映射器的动态注册和注销
 * - 注册冲突时应该提供明确的错误信息
 *
 * ### 发现规则
 * - 支持按类型查找映射器
 * - 支持按标签和分类过滤映射器
 * - 支持映射器的继承关系查找
 * - 提供映射器的元数据查询
 *
 * ### 生命周期规则
 * - 映射器实例应该是单例的
 * - 支持映射器的延迟初始化
 * - 支持映射器的依赖注入
 * - 提供映射器的健康检查
 *
 * @example
 * ```typescript
 * // 注册映射器
 * const registry = new MapperRegistry();
 * registry.registerMapper('User', 'UserDbEntity', new UserMapper());
 * registry.registerMapper('Email', 'string', new EmailMapper());
 *
 * // 获取映射器
 * const userMapper = registry.getMapper<User, UserDbEntity>('User', 'UserDbEntity');
 * const emailMapper = registry.getValueObjectMapper<Email, string>('Email', 'string');
 *
 * // 执行映射
 * const userDbEntity = userMapper.toPersistence(user);
 * const emailString = emailMapper.toPrimitive(email);
 * ```
 *
 * @since 1.0.0
 */

import type { IDomainMapper, IAggregateMapper, IValueObjectMapper, IDtoMapper } from '../base/mapper.interface';
import { MapperType, type IMapperMetadata, getMapperMetadata, isMapper } from '../decorators/mapper.decorator';

/**
 * 映射器注册信息接口
 */
export interface IMapperRegistration {
	/**
	 * 映射器实例
	 */
	mapper: unknown;

	/**
	 * 映射器元数据
	 */
	metadata: IMapperMetadata;

	/**
	 * 注册时间
	 */
	registeredAt: Date;

	/**
	 * 是否为单例
	 */
	singleton: boolean;
}

/**
 * 映射器查找选项接口
 */
export interface IMapperLookupOptions {
	/**
	 * 映射器类型过滤
	 */
	mapperType?: MapperType;

	/**
	 * 分类过滤
	 */
	category?: string;

	/**
	 * 标签过滤
	 */
	tags?: string[];

	/**
	 * 版本过滤
	 */
	version?: string;
}

/**
 * 映射器注册表类
 */
export class MapperRegistry {
	private readonly mappers = new Map<string, IMapperRegistration>();
	private readonly typeIndex = new Map<string, Set<string>>();

	/**
	 * 注册映射器
	 *
	 * @param sourceType - 源类型名称
	 * @param targetType - 目标类型名称
	 * @param mapper - 映射器实例
	 * @param singleton - 是否为单例，默认为true
	 * @throws {Error} 当注册失败时
	 */
	public registerMapper(sourceType: string, targetType: string, mapper: unknown, singleton: boolean = true): void {
		const mapperKey = this.createMapperKey(sourceType, targetType);

		// 检查是否已注册
		if (this.mappers.has(mapperKey)) {
			throw new Error(`映射器已存在: ${sourceType} -> ${targetType}`);
		}

		// 验证映射器
		if (!isMapper(mapper)) {
			throw new Error(`对象不是有效的映射器: ${mapper?.constructor?.name}`);
		}

		// 获取元数据
		const metadata = getMapperMetadata(mapper);
		if (!metadata) {
			throw new Error(`映射器缺少元数据: ${mapper?.constructor?.name}`);
		}

		// 创建注册信息
		const registration: IMapperRegistration = {
			mapper,
			metadata,
			registeredAt: new Date(),
			singleton
		};

		// 注册映射器
		this.mappers.set(mapperKey, registration);

		// 更新类型索引
		this.updateTypeIndex(sourceType, mapperKey);
		this.updateTypeIndex(targetType, mapperKey);

		this.log('info', '映射器注册成功', {
			sourceType,
			targetType,
			mapperType: metadata.mapperType,
			mapperName: mapper?.constructor?.name
		});
	}

	/**
	 * 注销映射器
	 *
	 * @param sourceType - 源类型名称
	 * @param targetType - 目标类型名称
	 */
	public unregisterMapper(sourceType: string, targetType: string): void {
		const mapperKey = this.createMapperKey(sourceType, targetType);

		if (this.mappers.has(mapperKey)) {
			this.mappers.delete(mapperKey);

			// 更新类型索引
			this.removeFromTypeIndex(sourceType, mapperKey);
			this.removeFromTypeIndex(targetType, mapperKey);

			this.log('info', '映射器注销成功', {
				sourceType,
				targetType
			});
		}
	}

	/**
	 * 获取领域映射器
	 *
	 * @template TDomain - 领域对象类型
	 * @template TPersistence - 持久化对象类型
	 * @param sourceType - 源类型名称
	 * @param targetType - 目标类型名称
	 * @returns 领域映射器实例
	 * @throws {Error} 当映射器不存在时
	 */
	public getMapper<TDomain, TPersistence>(
		sourceType: string,
		targetType: string
	): IDomainMapper<TDomain, TPersistence> {
		const registration = this.getMapperRegistration(sourceType, targetType);
		return registration.mapper as IDomainMapper<TDomain, TPersistence>;
	}

	/**
	 * 获取聚合根映射器
	 *
	 * @template TAggregateRoot - 聚合根类型
	 * @template TPersistence - 持久化对象类型
	 * @param sourceType - 源类型名称
	 * @param targetType - 目标类型名称
	 * @returns 聚合根映射器实例
	 */
	public getAggregateMapper<TAggregateRoot, TPersistence>(
		sourceType: string,
		targetType: string
	): IAggregateMapper<TAggregateRoot, TPersistence> {
		const registration = this.getMapperRegistration(sourceType, targetType);

		if (registration.metadata.mapperType !== MapperType.AGGREGATE) {
			throw new Error(`映射器不是聚合根映射器: ${sourceType} -> ${targetType}`);
		}

		return registration.mapper as IAggregateMapper<TAggregateRoot, TPersistence>;
	}

	/**
	 * 获取值对象映射器
	 *
	 * @template TValueObject - 值对象类型
	 * @template TPrimitive - 原始类型
	 * @param sourceType - 源类型名称
	 * @param targetType - 目标类型名称
	 * @returns 值对象映射器实例
	 */
	public getValueObjectMapper<TValueObject, TPrimitive>(
		sourceType: string,
		targetType: string
	): IValueObjectMapper<TValueObject, TPrimitive> {
		const registration = this.getMapperRegistration(sourceType, targetType);

		if (registration.metadata.mapperType !== MapperType.VALUE_OBJECT) {
			throw new Error(`映射器不是值对象映射器: ${sourceType} -> ${targetType}`);
		}

		return registration.mapper as IValueObjectMapper<TValueObject, TPrimitive>;
	}

	/**
	 * 获取DTO映射器
	 *
	 * @template TDomain - 领域对象类型
	 * @template TDTO - DTO类型
	 * @param sourceType - 源类型名称
	 * @param targetType - 目标类型名称
	 * @returns DTO映射器实例
	 */
	public getDtoMapper<TDomain, TDTO>(sourceType: string, targetType: string): IDtoMapper<TDomain, TDTO> {
		const registration = this.getMapperRegistration(sourceType, targetType);

		if (registration.metadata.mapperType !== MapperType.DTO) {
			throw new Error(`映射器不是DTO映射器: ${sourceType} -> ${targetType}`);
		}

		return registration.mapper as IDtoMapper<TDomain, TDTO>;
	}

	/**
	 * 检查映射器是否存在
	 *
	 * @param sourceType - 源类型名称
	 * @param targetType - 目标类型名称
	 * @returns 是否存在
	 */
	public hasMapper(sourceType: string, targetType: string): boolean {
		const mapperKey = this.createMapperKey(sourceType, targetType);
		return this.mappers.has(mapperKey);
	}

	/**
	 * 获取所有注册的映射器
	 *
	 * @param options - 查找选项
	 * @returns 映射器注册信息数组
	 */
	public getAllMappers(options?: IMapperLookupOptions): IMapperRegistration[] {
		let registrations = Array.from(this.mappers.values());

		if (options) {
			registrations = this.filterMappers(registrations, options);
		}

		return registrations;
	}

	/**
	 * 获取指定类型的所有映射器
	 *
	 * @param type - 类型名称
	 * @returns 映射器键数组
	 */
	public getMappersForType(type: string): string[] {
		return Array.from(this.typeIndex.get(type) || []);
	}

	/**
	 * 清空所有映射器
	 */
	public clear(): void {
		this.mappers.clear();
		this.typeIndex.clear();
	}

	/**
	 * 获取映射器统计信息
	 *
	 * @returns 统计信息
	 */
	public getStats(): Record<string, unknown> {
		const stats = {
			totalMappers: this.mappers.size,
			mappersByType: {} as Record<string, number>,
			registeredTypes: this.typeIndex.size
		};

		// 统计各类型映射器数量
		for (const registration of this.mappers.values()) {
			const type = registration.metadata.mapperType;
			stats.mappersByType[type] = (stats.mappersByType[type] || 0) + 1;
		}

		return stats;
	}

	/**
	 * 获取映射器注册信息
	 *
	 * @param sourceType - 源类型名称
	 * @param targetType - 目标类型名称
	 * @returns 映射器注册信息
	 * @throws {Error} 当映射器不存在时
	 * @private
	 */
	private getMapperRegistration(sourceType: string, targetType: string): IMapperRegistration {
		const mapperKey = this.createMapperKey(sourceType, targetType);
		const registration = this.mappers.get(mapperKey);

		if (!registration) {
			throw new Error(`映射器不存在: ${sourceType} -> ${targetType}`);
		}

		return registration;
	}

	/**
	 * 创建映射器键
	 *
	 * @param sourceType - 源类型名称
	 * @param targetType - 目标类型名称
	 * @returns 映射器键
	 * @private
	 */
	private createMapperKey(sourceType: string, targetType: string): string {
		return `${sourceType}->${targetType}`;
	}

	/**
	 * 更新类型索引
	 *
	 * @param type - 类型名称
	 * @param mapperKey - 映射器键
	 * @private
	 */
	private updateTypeIndex(type: string, mapperKey: string): void {
		if (!this.typeIndex.has(type)) {
			this.typeIndex.set(type, new Set());
		}
		this.typeIndex.get(type)?.add(mapperKey);
	}

	/**
	 * 从类型索引中移除
	 *
	 * @param type - 类型名称
	 * @param mapperKey - 映射器键
	 * @private
	 */
	private removeFromTypeIndex(type: string, mapperKey: string): void {
		const typeSet = this.typeIndex.get(type);
		if (typeSet) {
			typeSet.delete(mapperKey);
			if (typeSet.size === 0) {
				this.typeIndex.delete(type);
			}
		}
	}

	/**
	 * 过滤映射器
	 *
	 * @param registrations - 映射器注册信息数组
	 * @param options - 过滤选项
	 * @returns 过滤后的注册信息数组
	 * @private
	 */
	private filterMappers(registrations: IMapperRegistration[], options: IMapperLookupOptions): IMapperRegistration[] {
		return registrations.filter((registration) => {
			const metadata = registration.metadata;

			// 按映射器类型过滤
			if (options.mapperType && metadata.mapperType !== options.mapperType) {
				return false;
			}

			// 按分类过滤
			if (options.category && metadata.category !== options.category) {
				return false;
			}

			// 按标签过滤
			if (options.tags && options.tags.length > 0) {
				const mapperTags = metadata.tags || [];
				const hasMatchingTag = options.tags.some((tag) => mapperTags.includes(tag));
				if (!hasMatchingTag) {
					return false;
				}
			}

			// 按版本过滤
			if (options.version && metadata.version !== options.version) {
				return false;
			}

			return true;
		});
	}

	/**
	 * 记录日志
	 *
	 * @param level - 日志级别
	 * @param message - 日志消息
	 * @param context - 上下文信息
	 * @private
	 */
	private log(_level: string, _message: string, _context?: Record<string, unknown>): void {
		// TODO: 替换为实际的日志系统
		// console.log(`[${_level.toUpperCase()}] [MapperRegistry] ${_message}`, _context);
	}
}
