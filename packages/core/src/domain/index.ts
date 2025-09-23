/**
 * 领域层导出
 *
 * @description 导出领域层相关的所有公共API（符合01-architecture-design-overview.md标准）
 * @since 1.0.0
 */

// 值对象系统（基础组件，被其他组件引用）
export * from './value-objects';

// 实体系统
export * from './entities';

// 聚合根系统
export * from './aggregates';

// 领域服务系统
export * from './services';

// 领域事件系统
export * from './events';

// 仓储接口系统
export * from './repositories';

// 领域异常系统
export * from './exceptions';
