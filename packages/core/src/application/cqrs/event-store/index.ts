/**
 * 事件存储模块
 *
 * @description 提供事件存储的接口定义和异常类型
 * 具体实现由@aiofix/database模块提供
 *
 * @since 1.0.0
 */

// 接口和类型 - Core模块只提供抽象接口
export type {
  IEventStore as ICoreEventStore,
  IEventStreamResult as ICoreEventStreamResult,
} from './event-store.interface';

// 异常类 - 通用异常定义
export { ConcurrencyError as CoreConcurrencyError } from './concurrency-error';

// 具体实现由@aiofix/database模块提供：
// import { MongoEventStore, PostgreSQLEventStore } from '@aiofix/database';
