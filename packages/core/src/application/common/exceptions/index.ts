/**
 * 应用层异常导出
 *
 * @description 导出应用层异常相关的类和工具
 * @since 1.0.0
 */

// 基础应用层异常
export {
  BaseApplicationException,
  ApplicationExceptionType,
  ApplicationExceptionSeverity,
  ApplicationExceptionRecoveryStrategy,
  UseCaseValidationException,
  UseCaseExecutionException,
  PermissionDeniedException,
  ResourceNotFoundException,
  ConcurrencyConflictException,
  ExternalServiceException,
} from './application-exception';
