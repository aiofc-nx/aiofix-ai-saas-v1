/**
 * 基础DTO映射器
 *
 * 提供领域对象与DTO之间映射的基础实现，用于接口层的数据传输。
 * DTO映射器负责将内部领域模型转换为外部API格式。
 *
 * @description 基础DTO映射器为所有DTO映射器提供统一的基础功能
 *
 * ## 业务规则
 *
 * ### DTO映射规则
 * - DTO映射必须保护内部领域模型的完整性
 * - 映射过程必须过滤敏感信息
 * - 支持不同版本的DTO格式
 * - 映射结果必须符合API契约
 *
 * ### 数据安全规则
 * - 敏感字段必须被过滤或脱敏
 * - 内部实现细节不能暴露给外部
 * - 支持基于权限的字段过滤
 * - 记录数据访问和映射操作
 *
 * ### 版本兼容规则
 * - 支持多版本DTO格式
 * - 向后兼容的DTO演进
 * - 版本转换必须是无损的
 * - 提供版本迁移工具
 *
 * @example
 * ```typescript
 * export class UserDtoMapper extends BaseDtoMapper<User, UserDto> {
 *   constructor() {
 *     super('UserDtoMapper');
 *   }
 *
 *   protected mapToDto(domainEntity: User): UserDto {
 *     return {
 *       id: domainEntity.id.toString(),
 *       name: domainEntity.name,
 *       email: domainEntity.email,
 *       createdAt: domainEntity.createdAt.toISOString(),
 *       // 不包含内部字段如version、tenantId等
 *     };
 *   }
 *
 *   protected mapFromDto(dto: UserDto): User {
 *     return User.reconstitute(
 *       EntityId.fromString(dto.id),
 *       dto.name,
 *       dto.email,
 *       new Date(dto.createdAt)
 *     );
 *   }
 *
 *   protected filterSensitiveFields(dto: UserDto, userPermissions: string[]): UserDto {
 *     if (!userPermissions.includes('user:read:email')) {
 *       return { ...dto, email: '***@***.***' };
 *     }
 *     return dto;
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { BaseDomainMapper, MappingError } from './base-domain-mapper';
import type { IDtoMapper } from './mapper.interface';

/**
 * DTO映射选项接口
 */
export interface IDtoMappingOptions {
	/**
	 * 用户权限列表
	 */
	userPermissions?: string[];

	/**
	 * 敏感字段列表
	 */
	sensitiveFields?: string[];

	/**
	 * DTO版本
	 */
	version?: string;

	/**
	 * 是否包含元数据
	 */
	includeMetadata?: boolean;

	/**
	 * 自定义字段过滤器
	 */
	fieldFilter?: (fieldName: string, fieldValue: unknown) => boolean;
}

/**
 * 基础DTO映射器抽象类
 *
 * @template TDomain - 领域对象类型
 * @template TDTO - DTO类型
 */
export abstract class BaseDtoMapper<TDomain, TDTO extends Record<string, unknown>>
	extends BaseDomainMapper<TDomain, TDTO>
	implements IDtoMapper<TDomain, TDTO>
{
	// 继承基类的toPersistence和toDomain方法，但重新命名以避免混淆
	public override toPersistence = this.toDto;
	public override toDomain = this.fromDto;
	protected override mapToPersistence = this.mapToDto;
	protected override mapToDomain = this.mapFromDto;

	/**
	 * 构造函数
	 *
	 * @param mapperName - 映射器名称
	 */
	protected constructor(mapperName: string) {
		super(mapperName);
	}

	/**
	 * 将领域对象映射为DTO
	 *
	 * @param domainEntity - 领域对象
	 * @param options - 映射选项
	 * @returns DTO对象
	 */
	public toDto(domainEntity: TDomain, options?: IDtoMappingOptions): TDTO {
		try {
			this.validateDomainEntity(domainEntity);

			let dto = this.mapToDto(domainEntity);

			// 应用字段过滤
			if (options) {
				dto = this.applyFieldFiltering(dto, options);
			}

			this.validateDto(dto);
			return dto;
		} catch (error) {
			throw new MappingError(
				`映射到DTO失败: ${error instanceof Error ? error.message : String(error)}`,
				'Domain',
				'DTO',
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * 将DTO映射为领域对象
	 *
	 * @param dto - DTO对象
	 * @returns 领域对象
	 */
	public fromDto(dto: TDTO): TDomain {
		try {
			this.validateDto(dto);
			const result = this.mapFromDto(dto);
			this.validateDomainEntity(result);
			return result;
		} catch (error) {
			throw new MappingError(
				`从DTO映射失败: ${error instanceof Error ? error.message : String(error)}`,
				'DTO',
				'Domain',
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * 批量映射领域对象为DTO
	 *
	 * @param domainEntities - 领域对象数组
	 * @param options - 映射选项
	 * @returns DTO数组
	 */
	public toDtoBatch(domainEntities: TDomain[], options?: IDtoMappingOptions): TDTO[] {
		return domainEntities.map((entity) => this.toDto(entity, options));
	}

	/**
	 * 批量映射DTO为领域对象
	 *
	 * @param dtos - DTO数组
	 * @returns 领域对象数组
	 */
	public fromDtoBatch(dtos: TDTO[]): TDomain[] {
		return dtos.map((dto) => this.fromDto(dto));
	}

	/**
	 * 映射领域对象到DTO的具体实现
	 *
	 * @param domainEntity - 领域对象
	 * @returns DTO对象
	 * @protected
	 */
	protected abstract mapToDto(domainEntity: TDomain): TDTO;

	/**
	 * 映射DTO到领域对象的具体实现
	 *
	 * @param dto - DTO对象
	 * @returns 领域对象
	 * @protected
	 */
	protected abstract mapFromDto(dto: TDTO): TDomain;

	/**
	 * 应用字段过滤
	 *
	 * @param dto - DTO对象
	 * @param options - 映射选项
	 * @returns 过滤后的DTO对象
	 * @protected
	 */
	protected applyFieldFiltering(dto: TDTO, options: IDtoMappingOptions): TDTO {
		let filteredDto = { ...dto };

		// 应用敏感字段过滤
		if (options.sensitiveFields && options.sensitiveFields.length > 0) {
			filteredDto = this.filterSensitiveFields(filteredDto, options.sensitiveFields);
		}

		// 应用权限过滤
		if (options.userPermissions && options.userPermissions.length > 0) {
			filteredDto = this.filterByPermissions(filteredDto, options.userPermissions);
		}

		// 应用自定义字段过滤器
		if (options.fieldFilter) {
			filteredDto = this.applyCustomFieldFilter(filteredDto, options.fieldFilter);
		}

		return filteredDto;
	}

	/**
	 * 过滤敏感字段
	 *
	 * @param dto - DTO对象
	 * @param sensitiveFields - 敏感字段列表
	 * @returns 过滤后的DTO对象
	 * @protected
	 */
	protected filterSensitiveFields(dto: TDTO, sensitiveFields: string[]): TDTO {
		const filtered = { ...dto };

		sensitiveFields.forEach((field) => {
			if (field in filtered) {
				filtered[field as keyof TDTO] = '***' as TDTO[keyof TDTO];
			}
		});

		return filtered;
	}

	/**
	 * 基于权限过滤字段
	 *
	 * @param dto - DTO对象
	 * @param userPermissions - 用户权限列表
	 * @returns 过滤后的DTO对象
	 * @protected
	 */
	protected filterByPermissions(dto: TDTO, _userPermissions: string[]): TDTO {
		// 默认实现不过滤，子类可以重写
		return dto;
	}

	/**
	 * 应用自定义字段过滤器
	 *
	 * @param dto - DTO对象
	 * @param fieldFilter - 字段过滤器函数
	 * @returns 过滤后的DTO对象
	 * @protected
	 */
	protected applyCustomFieldFilter(dto: TDTO, fieldFilter: (fieldName: string, fieldValue: unknown) => boolean): TDTO {
		const filtered = { ...dto };

		Object.keys(filtered).forEach((key) => {
			const value = filtered[key as keyof TDTO];
			if (!fieldFilter(key, value)) {
				delete filtered[key as keyof TDTO];
			}
		});

		return filtered;
	}

	/**
	 * 验证DTO对象的有效性
	 *
	 * @param dto - DTO对象
	 * @throws {Error} 当验证失败时
	 * @protected
	 */
	protected validateDto(dto: TDTO): void {
		if (dto === null || dto === undefined) {
			throw new Error('DTO对象不能为空');
		}
	}

	/**
	 * 记录映射日志
	 *
	 * @param level - 日志级别
	 * @param message - 日志消息
	 * @param context - 上下文信息
	 * @protected
	 */
	protected override log(_level: string, _message: string, _context?: Record<string, unknown>): void {
		// TODO: 替换为实际的日志系统
		// console.log(`[${_level.toUpperCase()}] [${this.mapperName}] ${_message}`, _context);
	}
}
