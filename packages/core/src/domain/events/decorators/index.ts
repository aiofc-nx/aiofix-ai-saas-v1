/**
 * 领域事件装饰器导出
 *
 * @description 导出领域事件相关的装饰器和元数据工具
 * @since 1.0.0
 */

// 领域事件装饰器
export {
  DomainEvent,
  EventHandler,
  getDomainEventMetadata,
  isDomainEvent,
  getEventHandlers,
  DomainEventRegistry,
  DOMAIN_EVENT_METADATA_KEY,
} from './domain-event.decorator';

// 领域事件配置类型
export type { DomainEventOptions } from './domain-event.decorator';
