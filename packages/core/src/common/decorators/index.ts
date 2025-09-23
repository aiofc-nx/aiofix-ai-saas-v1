/**
 * 装饰器导出文件
 *
 * @description 导出所有装饰器相关的常量、接口、工具函数和装饰器
 * @since 1.0.0
 */

// 元数据系统
export * from './metadata.constants';
export * from './metadata.interfaces';
export * from './metadata.utils';

// CQRS 装饰器
export {
  CommandHandler,
  isCommandHandler,
  getCommandType,
  getCommandHandlerPriority,
  supportsCommandType,
  getCommandHandlerMetadata,
  type CommandHandlerDecorator,
  type CommandHandlerClass,
  type ICommandHandlerOptions,
} from './command-handler.decorator';

export {
  QueryHandler,
  isQueryHandler,
  getQueryType,
  getQueryHandlerPriority,
  supportsQueryType,
  getQueryHandlerMetadata,
  type QueryHandlerDecorator,
  type QueryHandlerClass,
  type IQueryHandlerOptions,
} from './query-handler.decorator';

export {
  EventHandler,
  isEventHandler,
  getEventType,
  getEventHandlerPriority,
  supportsEventType,
  getEventHandlerMetadata,
  type EventHandlerDecorator,
  type EventHandlerClass,
  type IEventHandlerOptions,
} from './event-handler.decorator';

export {
  Saga,
  isSaga,
  getSagaType,
  getSagaPriority,
  supportsSagaType,
  getSagaMetadata,
  type SagaDecorator,
  type SagaHandlerClass,
  type ISagaOptions,
  type ISagaHandler,
} from './saga.decorator';
