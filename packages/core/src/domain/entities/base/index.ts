/**
 * 实体基础设施导出
 *
 * @description 导出实体相关的基础类、接口和工具
 * @since 1.0.0
 */

// 基础实体接口
export type { IBaseEntity } from './base-entity.interface';

// 实体接口
export type {
	IEntity,
	IEntityFactory,
	IEntitySpecification,
	IEntityValidator,
	IEntityValidationResult,
	IEntityAuditInfo
} from './entity.interface';

// 基础实体类
export { BaseEntity } from './base-entity';

// 审计信息
export type { IAuditInfo } from './audit-info';

// 重新导出常用类型（避免重复导出，已在 value-objects 中导出）
// export type { EntityId } from '../../value-objects/entity-id';
