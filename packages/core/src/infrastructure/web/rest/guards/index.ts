/**
 * REST守卫导出
 *
 * @description 导出REST相关的守卫和权限检查器
 * @since 1.0.0
 */

export {
  CqrsPermissionGuard,
  DefaultPermissionChecker,
} from './cqrs-permission.guard';

export type {
  IPermissionValidationResult,
  IPermissionChecker,
} from './cqrs-permission.guard';
