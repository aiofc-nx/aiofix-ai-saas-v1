/**
 * 领域异常基础设施导出
 *
 * @description 导出领域异常相关的基础类和工具
 * @since 1.0.0
 */

// 基础领域异常类
export {
  BaseDomainException,
  DomainExceptionType,
  DomainExceptionSeverity,
  BusinessRuleViolationException,
  DomainValidationException,
  DomainStateException,
  DomainPermissionException,
} from './base-domain-exception';
