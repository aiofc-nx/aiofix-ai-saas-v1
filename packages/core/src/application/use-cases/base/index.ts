/**
 * 用例基础设施导出
 *
 * @description 导出用例相关的基础类、接口和工具
 * @since 1.0.0
 */

// 核心接口
export type {
  IUseCase,
  IUseCaseContext,
  IUseCaseFactory,
  IUseCaseRegistry,
  IUseCaseExecutor,
} from './use-case.interface';

// 基础用例类
export { BaseUseCase } from './base-use-case';
export type { IUseCaseExecutionResult } from './base-use-case';
export {
  BaseUseCaseError,
  UseCaseValidationError,
  UseCaseExecutionError,
  PermissionDeniedError,
} from './base-use-case';

// 命令用例类
export {
  BaseCommandUseCase,
  BusinessRuleViolationError,
} from './base-command-use-case';

// 查询用例类
export { BaseQueryUseCase } from './base-query-use-case';
export type { QueryOptions, QueryResult } from './base-query-use-case';
export {
  QueryComplexityError,
  DataAccessDeniedError,
  EntityNotFoundError,
} from './base-query-use-case';
