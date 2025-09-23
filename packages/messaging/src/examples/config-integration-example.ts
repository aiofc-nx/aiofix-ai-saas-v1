/**
 * Messaging模块配置集成示例
 *
 * @description 演示如何使用统一配置管理平台集成messaging模块
 * 包括配置服务使用、NestJS模块集成、热更新等功能
 *
 * @since 1.0.0
 */

import { Module } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { createConfigManager, IMessagingModuleConfig } from '@aiofix/config';
import {
  MessagingConfigService,
  createMessagingConfigService,
  InjectMessagingService,
  InjectMessagingConfig,
  SimpleMessagingService,
} from '..';

/**
 * 基础配置集成示例
 */
async function basicConfigIntegrationExample(): Promise<void> {
  console.log('🎯 基础配置集成示例\n');

  try {
    // 1. 创建统一配置管理器
    console.log('1️⃣ 创建统一配置管理器...');
    const configManager = await createConfigManager();

    // 2. 创建messaging配置服务
    console.log('2️⃣ 创建messaging配置服务...');
    const messagingConfigService =
      await createMessagingConfigService(configManager);

    // 3. 获取messaging配置
    console.log('3️⃣ 获取messaging配置...');
    const messagingConfig = await messagingConfigService.getConfig();
    console.log('Messaging配置:', {
      enabled: messagingConfig.enabled,
      defaultTimeout: messagingConfig.global.defaultTimeout,
      redisHost: messagingConfig.redis.host,
      queuesCount: Object.keys(messagingConfig.queues).length,
    });

    // 4. 获取特定配置
    console.log('4️⃣ 获取特定配置...');
    const globalConfig = await messagingConfigService.getGlobalConfig();
    const redisConfig = await messagingConfigService.getRedisConfig();
    console.log('全局配置:', globalConfig);
    console.log('Redis配置:', redisConfig);

    // 5. 监听配置变化
    console.log('5️⃣ 设置配置变化监听...');
    messagingConfigService.onConfigChange((newConfig) => {
      console.log('配置已更新:', {
        enabled: newConfig.enabled,
        defaultTimeout: newConfig.global.defaultTimeout,
      });
    });

    // 6. 更新配置
    console.log('6️⃣ 更新全局配置...');
    await messagingConfigService.updateGlobalConfig({
      defaultTimeout: 45000,
      enableVerboseLogging: true,
    });

    // 7. 验证配置
    console.log('7️⃣ 验证配置...');
    const isValid = await messagingConfigService.validateConfig();
    console.log('配置验证结果:', isValid);

    // 8. 获取统计信息
    console.log('8️⃣ 获取配置统计...');
    const stats = messagingConfigService.getConfigStatistics();
    console.log('配置统计:', stats);

    // 9. 清理资源
    console.log('9️⃣ 清理资源...');
    await messagingConfigService.destroy();
    await configManager.destroy();

    console.log('✅ 基础配置集成示例完成！\n');
  } catch (error) {
    console.error('❌ 基础配置集成示例失败:', error);
  }
}

/**
 * NestJS模块集成示例
 */
@Module({
  providers: [],
})
class ExampleAppModuleImpl {}

/**
 * 服务中使用配置的示例
 */
@Injectable()
class ExampleMessagingServiceImpl {
  constructor(
    @InjectMessagingService()
    private readonly messagingService: SimpleMessagingService,
    @InjectMessagingConfig()
    private readonly configService: MessagingConfigService,
  ) {}

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    // 获取配置
    const config = await this.configService.getConfig();
    console.log('服务初始化，当前配置:', {
      enabled: config.enabled,
      timeout: config.global.defaultTimeout,
    });

    // 监听配置变化
    this.configService.onConfigChange((newConfig) => {
      console.log('服务配置已更新:', newConfig.global.defaultTimeout);
      this.handleConfigUpdate(newConfig);
    });
  }

  /**
   * 发送消息
   */
  async sendMessage(topic: string, data: unknown): Promise<void> {
    const config = await this.configService.getGlobalConfig();

    if (!config.enableVerboseLogging) {
      // 简单发送
      await this.messagingService.send(topic, data);
    } else {
      // 详细日志发送
      console.log('发送消息:', { topic, data });
      await this.messagingService.send(topic, data);
      console.log('消息发送完成');
    }
  }

  /**
   * 处理配置更新
   *
   * @param newConfig - 新配置
   */
  private handleConfigUpdate(newConfig: IMessagingModuleConfig): void {
    // 根据新配置调整服务行为
    if (newConfig.global.enableVerboseLogging) {
      console.log('启用详细日志模式');
    } else {
      console.log('禁用详细日志模式');
    }
  }
}

/**
 * 高级配置功能示例
 */
async function advancedConfigExample(): Promise<void> {
  console.log('🚀 高级配置功能示例\n');

  try {
    // 1. 创建配置管理器和热更新
    console.log('1️⃣ 创建配置管理器和热更新...');
    const { createConfigManagerWithHotReload } = await import('@aiofix/config');
    const { configManager, hotReloader } =
      await createConfigManagerWithHotReload({
        enabled: true,
        fileWatch: {
          enabled: true,
          paths: ['./config/messaging.json'],
          debounceDelay: 1000,
        },
      });

    // 2. 创建messaging配置服务
    const messagingConfig = await createMessagingConfigService(configManager);

    // 3. 监听特定配置路径
    console.log('2️⃣ 设置热更新监听...');
    hotReloader.watchPath('messaging.global', (event) => {
      console.log('全局配置更新:', event.newValue);
    });

    hotReloader.watchPath('messaging.redis', (event) => {
      console.log('Redis配置更新:', event.newValue);
    });

    // 4. 手动触发配置更新
    console.log('3️⃣ 手动触发配置更新...');
    await hotReloader.triggerUpdate('messaging.global.defaultTimeout', 60000);

    // 5. 批量配置更新
    console.log('4️⃣ 批量配置更新...');
    await hotReloader.batchUpdate([
      { path: 'messaging.global.maxRetries', value: 5, source: 'example' },
      {
        path: 'messaging.global.enableVerboseLogging',
        value: false,
        source: 'example',
      },
    ]);

    // 6. 获取更新后的配置
    console.log('5️⃣ 获取更新后的配置...');
    const updatedConfig = await messagingConfig.getGlobalConfig();
    console.log('更新后的全局配置:', updatedConfig);

    // 7. 配置历史和回滚
    console.log('6️⃣ 查看配置历史...');
    const history = hotReloader.getHistory(
      'messaging.global.defaultTimeout',
      5,
    );
    console.log('配置历史:', history.length, '条记录');

    // 8. 清理资源
    console.log('7️⃣ 清理资源...');
    await messagingConfig.destroy();
    await hotReloader.destroy();
    await configManager.destroy();

    console.log('✅ 高级配置功能示例完成！\n');
  } catch (error) {
    console.error('❌ 高级配置功能示例失败:', error);
  }
}

/**
 * 环境变量配置示例
 */
async function environmentConfigExample(): Promise<void> {
  console.log('🌍 环境变量配置示例\n');

  try {
    // 设置示例环境变量
    process.env.AIOFIX_MESSAGING__GLOBAL__DEFAULT_TIMEOUT = '30000';
    process.env.AIOFIX_MESSAGING__REDIS__HOST = 'redis.example.com';
    process.env.AIOFIX_MESSAGING__REDIS__PORT = '6380';

    // 1. 创建配置管理器
    console.log('1️⃣ 创建配置管理器（使用环境变量）...');
    const configManager = await createConfigManager();

    // 2. 创建messaging配置服务
    const messagingConfig = await createMessagingConfigService(configManager);

    // 3. 验证环境变量映射
    console.log('2️⃣ 验证环境变量映射...');
    const globalConfig = await messagingConfig.getGlobalConfig();
    const redisConfig = await messagingConfig.getRedisConfig();

    console.log('环境变量映射结果:', {
      timeout: globalConfig.defaultTimeout, // 应该是30000
      redisHost: redisConfig.host, // 应该是redis.example.com
      redisPort: redisConfig.port, // 应该是6380
    });

    // 4. 清理
    await messagingConfig.destroy();
    await configManager.destroy();

    console.log('✅ 环境变量配置示例完成！\n');
  } catch (error) {
    console.error('❌ 环境变量配置示例失败:', error);
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  console.log('🎉 Messaging模块配置集成演示\n');
  console.log('='.repeat(60));

  await basicConfigIntegrationExample();
  await advancedConfigExample();
  await environmentConfigExample();

  console.log('='.repeat(60));
  console.log('🎊 所有演示完成！Messaging配置集成运行正常！');
}

// 导出演示函数和类型别名
export {
  basicConfigIntegrationExample,
  advancedConfigExample,
  environmentConfigExample,
};

export { ExampleAppModuleImpl as ExampleAppModule };
export { ExampleMessagingServiceImpl as ExampleMessagingService };

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}
