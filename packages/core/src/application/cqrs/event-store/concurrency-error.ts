/**
 * 并发错误
 *
 * @description 当事件版本不匹配时抛出此异常，用于乐观并发控制
 * 在事件存储中，当尝试保存事件时发现版本号不匹配，表示其他进程已经修改了数据
 *
 * ## 业务规则
 *
 * ### 并发控制规则
 * - 事件保存时必须检查版本号，确保数据一致性
 * - 当版本号不匹配时，表示发生了并发修改
 * - 客户端应该重新获取最新版本并重试操作
 *
 * ### 错误处理规则
 * - 提供详细的错误信息，包括期望版本和实际版本
 * - 支持错误恢复和重试机制
 * - 记录并发冲突的详细信息用于监控
 *
 * @example
 * ```typescript
 * try {
 *   await eventStore.saveEvents('order-123', events, expectedVersion);
 * } catch (error) {
 *   if (error instanceof ConcurrencyError) {
 *     // 重新获取最新版本并重试
 *     const currentVersion = await eventStore.getCurrentVersion('order-123');
 *     await eventStore.saveEvents('order-123', events, currentVersion);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

/**
 * 并发错误类
 *
 * @description 表示在事件存储中发生的并发冲突错误
 */
export class ConcurrencyError extends Error {
  /**
   * 构造函数
   *
   * @param message 错误消息
   * @param expectedVersion 期望的版本号
   * @param actualVersion 实际的版本号
   * @param aggregateId 聚合根ID
   */
  constructor(
    message: string,
    public readonly expectedVersion?: number,
    public readonly actualVersion?: number,
    public readonly aggregateId?: string,
  ) {
    super(message);
    this.name = 'ConcurrencyError';

    // 确保错误堆栈跟踪正确
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConcurrencyError);
    }
  }

  /**
   * 创建版本不匹配错误
   *
   * @param aggregateId 聚合根ID
   * @param expectedVersion 期望版本
   * @param actualVersion 实际版本
   * @returns 并发错误实例
   */
  static versionMismatch(
    aggregateId: string,
    expectedVersion: number,
    actualVersion: number,
  ): ConcurrencyError {
    return new ConcurrencyError(
      `Concurrency conflict for aggregate ${aggregateId}: expected version ${expectedVersion}, but current version is ${actualVersion}`,
      expectedVersion,
      actualVersion,
      aggregateId,
    );
  }

  /**
   * 创建聚合根不存在错误
   *
   * @param aggregateId 聚合根ID
   * @param expectedVersion 期望版本
   * @returns 并发错误实例
   */
  static aggregateNotFound(
    aggregateId: string,
    expectedVersion: number,
  ): ConcurrencyError {
    return new ConcurrencyError(
      `Aggregate ${aggregateId} not found, but expected version ${expectedVersion}`,
      expectedVersion,
      0,
      aggregateId,
    );
  }

  /**
   * 获取详细的错误信息
   *
   * @returns 错误详情对象
   */
  getDetails(): {
    message: string;
    expectedVersion?: number;
    actualVersion?: number;
    aggregateId?: string;
    timestamp: Date;
  } {
    return {
      message: this.message,
      expectedVersion: this.expectedVersion,
      actualVersion: this.actualVersion,
      aggregateId: this.aggregateId,
      timestamp: new Date(),
    };
  }

  /**
   * 检查是否为版本不匹配错误
   *
   * @returns 是否为版本不匹配错误
   */
  isVersionMismatch(): boolean {
    return (
      this.expectedVersion !== undefined &&
      this.actualVersion !== undefined &&
      this.expectedVersion !== this.actualVersion
    );
  }

  /**
   * 检查是否为聚合根不存在错误
   *
   * @returns 是否为聚合根不存在错误
   */
  isAggregateNotFound(): boolean {
    return this.actualVersion === 0 && this.expectedVersion !== undefined;
  }
}
