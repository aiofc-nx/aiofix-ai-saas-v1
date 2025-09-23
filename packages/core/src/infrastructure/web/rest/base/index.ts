/**
 * REST基础控制器导出
 *
 * @description 导出REST基础控制器和相关接口
 * @since 1.0.0
 */

export {
  BaseCommandController,
  type ICommandContext,
  type ICommandResponse,
  type ICommandExecutionOptions,
} from './base-command.controller';

export {
  BaseQueryController,
  type IQueryContext,
  type IQueryResponse,
  type IQueryExecutionOptions,
  type IPaginatedResult,
} from './base-query.controller';
