/**
 * 事件装饰器导出
 *
 * @description 导出事件相关的装饰器和元数据工具
 * @since 1.0.0
 */

// 装饰器配置接口
export type {
  IEventProjectorOptions,
  IEventProjectorMetadata,
} from './event-projector.decorator';

// 装饰器函数
export {
  EventProjector,
  ReadModelProjector,
  AutoRegisterProjector,
} from './event-projector.decorator';

// 元数据工具
export {
  getEventProjectorMetadata,
  isEventProjector,
  isAutoRegisterProjector,
  EVENT_PROJECTOR_METADATA_KEY,
} from './event-projector.decorator';
