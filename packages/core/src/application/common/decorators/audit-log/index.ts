/**
 * 审计日志装饰器导出
 *
 * @description 导出审计日志相关的装饰器和工具
 * @since 1.0.0
 */

export type { IAuditLogOptions } from './audit-log.decorator';
export {
  AuditLog,
  getAuditLogMetadata,
  AUDIT_LOG_METADATA_KEY,
} from './audit-log.decorator';
