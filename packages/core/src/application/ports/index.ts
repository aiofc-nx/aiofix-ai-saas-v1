/**
 * 输出端口导出
 *
 * @description 导出应用层输出端口的所有接口（符合Clean Architecture端口适配器模式）
 * @since 1.0.0
 */

// 命令侧专用端口
export * from './commands';

// 查询侧专用端口
export * from './queries';

// 共享端口
export * from './shared';
