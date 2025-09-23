/**
 * 存储基础设施导出
 *
 * @description Core模块只导出存储相关的抽象接口
 * 具体实现由对应的专门模块提供
 *
 * @since 1.0.0
 */

// 事件存储接口 - 具体实现由@aiofix/database模块提供
export * from './event-store';

// 缓存功能由@aiofix/cache模块提供
// 使用时请直接导入：import { SimpleCacheManager } from '@aiofix/cache'

// 注意：Core模块专注于架构抽象，避免重复实现具体功能
