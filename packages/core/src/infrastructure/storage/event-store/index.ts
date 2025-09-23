/**
 * 事件存储模块导出
 *
 * 导出事件存储相关的接口定义。
 * 具体实现由@aiofix/database模块提供。
 *
 * @description 事件存储接口导出
 * @since 1.0.0
 */

// 接口导出 - Core模块只提供抽象接口
export * from './event-store.interface';

// 具体实现由@aiofix/database模块提供
// 使用时请导入：
// import { MongoEventStore, PostgreSQLEventStore } from '@aiofix/database';
