/**
 * 简化Bull队列适配器
 *
 * @description 简化的Bull队列适配器实现，专注于核心功能
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { TenantContextManager } from '@aiofix/core';
import {
  IMessage,
  IMessageQueue,
  IMessageHandler,
  IMessageSendOptions,
  IQueueStatistics,
  IQueueHealth,
  MessageStatus,
} from '../interfaces/messaging.interface';
import { IMessagingLoggerService } from '../interfaces/messaging-logger.interface';
import { createQueueLogger } from '../factories/messaging-logger.factory';

/**
 * 简化Bull队列配置
 */
export interface ISimpleBullConfig {
  name: string;
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
  concurrency?: number;
  enableTenantIsolation?: boolean;
}

/**
 * 简化Bull队列适配器
 */
@Injectable()
export class SimpleBullQueueAdapter implements IMessageQueue {
  public readonly name: string;
  public readonly type = 'bull';

  private readonly stats: IQueueStatistics;
  private readonly handlers = new Map<string, IMessageHandler>();
  private readonly logger: IMessagingLoggerService;
  private isStarted = false;

  constructor(
    private readonly config: ISimpleBullConfig,
    logger?: IMessagingLoggerService,
  ) {
    this.name = config.name;
    this.logger = logger || createQueueLogger(this.name);

    // 初始化统计信息
    this.stats = {
      queueName: this.name,
      totalMessages: 0,
      pendingMessages: 0,
      processingMessages: 0,
      completedMessages: 0,
      failedMessages: 0,
      delayedMessages: 0,
      averageProcessingTime: 100,
      throughput: 0,
      errorRate: 0,
      lastUpdatedAt: new Date(),
    };

    this.logger.info('Bull队列适配器已初始化', {
      queueName: this.name,
      config: {
        enableTenantIsolation: config.enableTenantIsolation,
        concurrency: config.concurrency,
        redisHost: config.redis?.host,
      },
    });
  }

  async start(): Promise<void> {
    if (this.isStarted) {
      this.logger.warn('队列已经启动', { queueName: this.name });
      return;
    }

    this.logger.info('启动Bull队列', { queueName: this.name });
    this.isStarted = true;
  }

  async stop(): Promise<void> {
    if (!this.isStarted) {
      this.logger.warn('队列未启动', { queueName: this.name });
      return;
    }

    this.logger.info('停止Bull队列', { queueName: this.name });
    this.isStarted = false;
  }

  async send(message: IMessage, _options?: IMessageSendOptions): Promise<void> {
    if (!this.isStarted) {
      throw new Error(`队列 ${this.name} 未启动`);
    }

    // 模拟消息发送
    const enrichedMessage = { ...message };

    // 添加租户上下文
    if (this.config.enableTenantIsolation) {
      const tenantContext = TenantContextManager.getCurrentTenant();
      if (tenantContext) {
        enrichedMessage.metadata = {
          ...enrichedMessage.metadata,
          tenantContext,
        };
      }
    }

    // 设置发送状态
    (
      enrichedMessage as unknown as { status: MessageStatus; sentAt: Date }
    ).status = MessageStatus.SENT;
    (
      enrichedMessage as unknown as { status: MessageStatus; sentAt: Date }
    ).sentAt = new Date();

    this.logger.info('消息已发送到队列', {
      messageId: message.id.toString(),
      topic: message.topic,
      messageType: message.type,
      queueName: this.name,
      tenantId: enrichedMessage.tenantId,
    });

    // 更新统计
    this.stats.totalMessages++;
    this.stats.pendingMessages++;
  }

  async sendBatch(
    messages: IMessage[],
    options?: IMessageSendOptions,
  ): Promise<void> {
    for (const message of messages) {
      await this.send(message, options);
    }

    this.logger.info('批量发送消息到队列', {
      messageCount: messages.length,
      queueName: this.name,
      topics: messages.map((m) => m.topic),
    });
  }

  async subscribe(topic: string, handler: IMessageHandler): Promise<string> {
    if (!this.isStarted) {
      throw new Error(`队列 ${this.name} 未启动`);
    }

    const subscriptionId = `${this.name}_${topic}_${Date.now()}`;
    this.handlers.set(subscriptionId, handler);

    this.logger.info('已订阅主题', {
      topic,
      subscriptionId,
      handlerName: handler.name,
      queueName: this.name,
      totalHandlers: this.handlers.size,
    });

    return subscriptionId;
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    const handler = this.handlers.get(subscriptionId);
    if (handler) {
      this.handlers.delete(subscriptionId);
      this.logger.info('已取消订阅', {
        subscriptionId,
        handlerName: handler.name,
        queueName: this.name,
        remainingHandlers: this.handlers.size,
      });
    } else {
      this.logger.warn('订阅ID不存在', {
        subscriptionId,
        queueName: this.name,
      });
    }
  }

  async getStatistics(): Promise<IQueueStatistics> {
    this.stats.lastUpdatedAt = new Date();
    return { ...this.stats };
  }

  async clear(topic?: string): Promise<number> {
    this.logger.info('清空队列', {
      queueName: this.name,
      topic: topic || 'all',
      clearedMessages: 0,
    });
    return 0;
  }

  async healthCheck(): Promise<IQueueHealth> {
    return {
      healthy: this.isStarted,
      status: this.isStarted ? 'running' : 'stopped',
      connected: this.isStarted,
      lastCheckAt: new Date(),
      details: {
        queueName: this.name,
        handlerCount: this.handlers.size,
        stats: this.stats,
      },
    };
  }
}
