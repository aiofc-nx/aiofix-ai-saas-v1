/**
 * 命令装饰器导出
 *
 * @description 导出命令相关的装饰器和元数据工具
 * @since 1.0.0
 */

// 装饰器配置接口
export type { ICommandHandlerOptions } from './command-handler.decorator';

// 装饰器函数
export { CommandHandler, Command } from './command-handler.decorator';

// 元数据工具
export {
  getCommandHandlerMetadata,
  isCommandHandler,
  getCommandMetadata,
  isCommand,
  COMMAND_HANDLER_METADATA_KEY,
  COMMAND_METADATA_KEY,
} from './command-handler.decorator';
