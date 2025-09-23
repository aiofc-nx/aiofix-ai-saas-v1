/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 数据库连接错误类定义
 *
 * @description 数据库连接相关的错误类
 * 包括连接建立失败、连接断开、连接池耗尽等场景
 *
 * ## 业务规则
 *
 * ### 连接错误分类
 * - **连接建立失败**: 数据库服务器不可达、认证失败等
 * - **连接中断**: 网络断开、服务器重启等
 * - **连接池问题**: 连接池耗尽、配置错误等
 * - **权限问题**: 数据库访问权限不足
 *
 * ### 错误恢复策略
 * - 连接失败时支持自动重试
 * - 提供连接池状态诊断信息
 * - 支持故障转移和备用连接
 * - 记录详细的连接上下文信息
 *
 * ### 监控和告警
 * - 连接错误率监控
 * - 连接失败的实时告警
 * - 连接健康状态跟踪
 * - 性能影响分析
 *
 * @example
 * ```typescript
 * // 连接建立失败
 * throw new DatabaseConnectionError(
 *   '无法连接到数据库服务器',
 *   {
 *     host: 'localhost',
 *     port: 5432,
 *     database: 'myapp',
 *     timeout: 30000
 *   },
 *   new Error('ECONNREFUSED')
 * );
 *
 * // 连接池耗尽
 * throw new DatabaseConnectionError(
 *   '连接池已耗尽，无法获取新连接',
 *   {
 *     poolName: 'primary',
 *     maxConnections: 20,
 *     activeConnections: 20,
 *     waitingRequests: 15
 *   }
 * );
 *
 * // 错误处理示例
 * try {
 *   await databaseService.getConnection();
 * } catch (error) {
 *   if (error instanceof DatabaseConnectionError) {
 *     console.error('连接失败:', error.message);
 *     console.error('连接配置:', error.context);
 *
 *     // 尝试重连或使用备用连接
 *     await handleConnectionFailure(error);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { DatabaseError } from './database-error';

/**
 * 数据库连接错误类
 *
 * @description 数据库连接相关的专用错误类
 * 继承自DatabaseError，提供连接特定的错误处理
 *
 * ## 常见错误场景
 *
 * ### 网络相关错误
 * - 数据库服务器不可达
 * - 网络连接超时
 * - DNS解析失败
 * - 防火墙阻止连接
 *
 * ### 认证相关错误
 * - 用户名密码错误
 * - 数据库不存在
 * - 权限不足
 * - SSL证书问题
 *
 * ### 配置相关错误
 * - 连接池配置错误
 * - 连接参数无效
 * - 驱动程序问题
 * - 版本不兼容
 *
 * ### 资源相关错误
 * - 连接池耗尽
 * - 内存不足
 * - 文件描述符耗尽
 * - 数据库服务器过载
 *
 * @example
 * ```typescript
 * // 服务器不可达
 * throw new DatabaseConnectionError(
 *   '数据库服务器连接超时',
 *   {
 *     host: 'db.example.com',
 *     port: 5432,
 *     connectTimeout: 30000,
 *     retryAttempts: 3
 *   },
 *   new Error('connect ETIMEDOUT')
 * );
 *
 * // 认证失败
 * throw new DatabaseConnectionError(
 *   '数据库认证失败',
 *   {
 *     username: 'appuser',
 *     database: 'production',
 *     authMethod: 'password'
 *   },
 *   new Error('password authentication failed')
 * );
 * ```
 */
export class DatabaseConnectionError extends DatabaseError {
  /**
   * 创建数据库连接错误实例
   *
   * @description 构造连接错误对象，自动设置操作类型为'connection'
   *
   * @param message - 错误描述信息，应该清晰描述连接失败的原因
   * @param context - 连接相关的上下文信息，包含连接配置、状态等
   * @param originalError - 原始错误对象，通常来自数据库驱动
   *
   * @example
   * ```typescript
   * const connectionError = new DatabaseConnectionError(
   *   '连接池配置无效',
   *   {
   *     poolConfig: { min: 5, max: 20 },
   *     currentConnections: 0,
   *     errorCode: 'INVALID_POOL_CONFIG'
   *   },
   *   new Error('Invalid pool configuration')
   * );
   * ```
   */
  constructor(message: string, context: any, originalError?: Error) {
    super(message, 'connection', context, originalError);
    this.name = 'DatabaseConnectionError';
  }
}
