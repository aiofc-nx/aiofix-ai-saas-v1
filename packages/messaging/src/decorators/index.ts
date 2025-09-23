/**
 * 消息传递装饰器模块
 *
 * @description 提供完整的消息传递装饰器系统
 * 支持声明式的消息处理编程模型，简化消息处理器的开发
 *
 * ## 主要功能
 *
 * ### 🎨 **装饰器系统**
 * - `@MessageHandler` - 消息处理器装饰器
 * - `@EventHandler` - 事件处理器装饰器
 * - `@QueueProcessor` - 队列处理器装饰器
 * - `@Saga` - 长流程事务装饰器
 * - `@Subscribe` - 订阅方法装饰器
 *
 * ### 📋 **注册管理**
 * - 集中式装饰器注册表
 * - 元数据收集和查询
 * - 运行时反射支持
 *
 * ### 🏭 **工厂模式**
 * - 统一的装饰器创建接口
 * - 参数验证和类型安全
 * - 可扩展的装饰器系统
 *
 * @example
 * ```typescript
 * import { MessageHandler, EventHandler, Subscribe } from '@aiofix/messaging';
 *
 * // 消息处理器
 * @MessageHandler('user.created', {
 *   queue: 'user-events',
 *   priority: MessagePriority.HIGH
 * })
 * export class UserCreatedHandler {
 *   async handle(message: UserCreatedMessage): Promise<void> {
 *     // 处理用户创建消息
 *   }
 * }
 *
 * // 事件处理器
 * @EventHandler(['order.created', 'order.updated'])
 * export class OrderEventHandler {
 *   @Subscribe('order.created')
 *   async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
 *     // 处理订单创建事件
 *   }
 *
 *   @Subscribe('order.updated')
 *   async onOrderUpdated(event: OrderUpdatedEvent): Promise<void> {
 *     // 处理订单更新事件
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

// 导出接口和类型
export * from './messaging-decorators.interface';

// 导出消息接口和枚举
export {
  MessagePriority,
  MessageType,
  MessageStatus,
} from '../interfaces/messaging.interface';

// 导出装饰器注册表
export {
  DecoratorRegistry,
  getDecoratorRegistry,
  DecoratorRegistryUtils,
} from './decorator-registry';

// 导出装饰器工厂
export { DecoratorFactory, decoratorFactory } from './decorator-factory';

// 导出装饰器函数
export {
  MessageHandler,
  EventHandler,
  QueueProcessor,
  Saga,
  Subscribe,
} from './decorator-factory';

// 便捷的装饰器创建函数
export {
  createMessageHandler,
  createEventHandler,
  createQueueProcessor,
  createSaga,
  createSubscribe,
  // 高级创建函数
  createHighPriorityMessageHandler,
  createLowPriorityMessageHandler,
  createBatchEventHandler,
  createHighConcurrencyQueueProcessor,
  createReliableQueueProcessor,
  createPersistentSaga,
  createHighPrioritySubscribe,
  createFaultTolerantSubscribe,
  // 预设配置
  MessageHandlerPresets,
  QueueProcessorPresets,
  createMessageHandlerWithPreset,
  createQueueProcessorWithPreset,
} from './decorator-helpers';

// 装饰器组合功能
export {
  composeDecorators,
  DecoratorComposer,
  MessageHandlerBuilder,
  EventHandlerBuilder,
  QueueProcessorBuilder,
  SagaBuilder,
  conditionalDecorator,
  environmentAwareMessageHandler,
  tenantAwareMessageHandler,
  createMessageHandlerFactory,
  createEventHandlerFactory,
  createQueueProcessorFactory,
} from './decorator-composition';

export type { IDecoratorBuilder } from './decorator-composition';

// 装饰器中间件系统
export {
  withMiddleware,
  MiddlewareManager,
  LoggingMiddleware,
  PerformanceMiddleware,
  ErrorHandlingMiddleware,
  ValidationMiddleware,
  RetryMiddleware,
  TenantContextMiddleware,
  StandardMiddlewares,
  DevelopmentMiddlewares,
  ProductionMiddlewares,
  EnterpriseMiddlewares,
  createEnvironmentAwareMiddleware,
  createConfigurableMiddleware,
} from './decorator-middleware';

export type {
  IMiddlewareContext,
  IDecoratorMiddleware,
} from './decorator-middleware';

// 装饰器工具函数
export {
  getHandlerMetadata,
  isMessageHandler,
  isEventHandler,
  isQueueProcessor,
  isSaga,
  getSubscribeMetadata,
  getAllSubscribeMethods,
  isSubscribeMethod,
  getHandlerTopics,
  getHandlerOptions,
  handlesTopicPattern,
  formatHandlerInfo,
  getHandlerDetails,
  validateHandler,
  debugHandler,
} from './decorator-utils';
