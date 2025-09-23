/**
 * 命令基础设施导出
 *
 * @description 导出命令相关的基础类和接口
 * @since 1.0.0
 */

// 基础命令类
export { BaseCommand } from './base-command';

// 命令接口
export type {
  ICommand,
  ICommandValidationResult,
  ICommandMetadata,
  ICommandFactory,
} from './command.interface';

// 命令处理器接口
export * from './command-handler.interface';
