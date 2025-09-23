/**
 * 数据清理结果接口定义
 *
 * @description 定义租户数据清理操作的结果信息
 * 提供详细的清理统计和错误信息
 *
 * ## 业务规则
 *
 * ### 清理完整性规则
 * - 必须统计总记录数和实际删除数
 * - 必须记录失败的操作和原因
 * - 必须记录清理操作的耗时
 * - 必须提供详细的错误信息
 *
 * ### 安全性规则
 * - 清理操作必须有明确的权限验证
 * - 必须记录清理操作的审计日志
 * - 支持清理操作的回滚和恢复
 * - 清理前必须进行数据备份
 *
 * @example
 * ```typescript
 * const result = await tenantService.cleanupTenantData('tenant-123');
 *
 * console.log(`清理统计:`);
 * console.log(`- 总记录数: ${result.totalRecords}`);
 * console.log(`- 成功删除: ${result.deletedRecords}`);
 * console.log(`- 删除失败: ${result.failedRecords}`);
 * console.log(`- 清理耗时: ${result.duration}ms`);
 *
 * if (result.errors && result.errors.length > 0) {
 *   console.error('清理错误:', result.errors);
 * }
 * ```
 *
 * @since 1.0.0
 */

/**
 * 数据清理结果接口
 *
 * @description 租户数据清理操作的详细结果信息
 * 用于统计清理效果和错误诊断
 */
export interface ICleanupResult {
  /** 总记录数 - 清理操作涉及的总记录数量 */
  totalRecords: number;

  /** 删除的记录数 - 成功删除的记录数量 */
  deletedRecords: number;

  /** 失败的记录数 - 删除失败的记录数量 */
  failedRecords: number;

  /** 清理耗时 - 整个清理操作的执行时间（毫秒） */
  duration: number;

  /** 错误列表 - 清理过程中遇到的错误信息（可选） */
  errors?: string[];
}
