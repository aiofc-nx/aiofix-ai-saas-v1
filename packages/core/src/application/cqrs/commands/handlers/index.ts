/**
 * 命令处理器导出
 *
 * @description 导出命令处理器相关的接口和基类
 * @since 1.0.0
 */

// 命令处理器接口
export type {
  ICommandHandler,
  ICommandHandlerFactory,
  ICommandHandlerRegistry,
  ICommandExecutionContext,
  ICommandExecutionResult,
  ICommandValidator,
  ICommandValidationResult,
} from './command-handler.interface';

// 基础命令处理器
export { BaseCommandHandler } from './base-command-handler';
