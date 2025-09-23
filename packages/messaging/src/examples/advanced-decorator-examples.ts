/**
 * 高级装饰器使用示例
 *
 * @description 展示Messaging模块装饰器辅助功能的完整使用
 * 包含预设配置、组合装饰器、中间件系统等高级功能
 *
 * @example
 * ```typescript
 * // 运行示例
 * import './advanced-decorator-examples';
 * ```
 *
 * @since 1.0.0
 */

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  // 基础装饰器
  MessageHandler,
  Subscribe,
  // 高级创建函数
  createHighPriorityMessageHandler,
  // 预设配置
  createMessageHandlerWithPreset,
  createQueueProcessorWithPreset,
  // 装饰器组合
  DecoratorComposer,
  conditionalDecorator,
  environmentAwareMessageHandler,
  // 中间件系统
  withMiddleware,
  LoggingMiddleware,
  PerformanceMiddleware,
  StandardMiddlewares,
  createConfigurableMiddleware,
  // 类型定义
  MessagePriority,
} from '../decorators';

// ==================== 预设配置示例 ====================

/**
 * 使用预设配置的消息处理器
 */
@createMessageHandlerWithPreset('payment.processed', 'CRITICAL_TASK')
export class PaymentProcessedHandler {
  async handle(message: any): Promise<void> {
    console.log('处理支付完成消息:', message);
    // 关键任务：高优先级、高可靠性
  }
}

/**
 * 使用预设配置的队列处理器
 */
@createQueueProcessorWithPreset('email-queue', 'HIGH_THROUGHPUT')
export class EmailQueueProcessor {
  async process(job: any): Promise<void> {
    console.log('处理邮件队列任务:', job);
    // 高吞吐量：高并发、快速处理
  }
}

// ==================== 构建器模式示例 ====================

/**
 * 使用构建器模式创建复杂配置的处理器
 */
@(DecoratorComposer.messageHandler('order.created')
  .withHighPriority()
  .withRetries(5)
  .withTimeout(30000)
  .withTenantIsolation()
  .withQueue('order-processing')
  .build())
export class OrderCreatedHandler {
  async handle(message: any): Promise<void> {
    console.log('处理订单创建消息:', message);
  }
}

/**
 * 使用构建器模式创建事件处理器
 */
@(DecoratorComposer.eventHandler(['user.registered', 'user.verified'])
  .withBatch(100, 5000)
  .withConcurrency(10)
  .withTenantIsolation()
  .build())
export class UserEventHandler {
  async handle(events: any[]): Promise<void> {
    console.log('批量处理用户事件:', events.length);
  }
}

/**
 * 使用构建器模式创建Saga
 */
@(DecoratorComposer.saga('order-fulfillment', [
  'order.created',
  'payment.confirmed',
  'inventory.reserved',
])
  .withTimeout(300000) // 5分钟
  .withPersistence()
  .withTenantIsolation()
  .withCompensation('rollback-order')
  .build())
export class OrderFulfillmentSaga {
  async handle(events: any[]): Promise<void> {
    console.log('处理订单履行Saga:', events);
  }
}

// ==================== 装饰器组合示例 ====================

/**
 * 组合多个装饰器的处理器
 */
@MessageHandler('notification.send')
export class NotificationHandler {
  async handle(message: any): Promise<void> {
    console.log('处理通知消息:', message);
  }

  @Subscribe('notification.queued')
  async onQueued(event: any): Promise<void> {
    console.log('通知已入队:', event);
  }

  @Subscribe('notification.failed')
  async onFailed(event: any): Promise<void> {
    console.log('通知发送失败:', event);
  }
}

// ==================== 条件装饰器示例 ====================

/**
 * 根据环境条件应用不同装饰器的处理器
 */
@conditionalDecorator({
  condition: () => process.env.NODE_ENV === 'production',
  whenTrue: createHighPriorityMessageHandler('analytics.event'),
  whenFalse: MessageHandler('analytics.event'),
})
export class AnalyticsEventHandler {
  async handle(message: any): Promise<void> {
    console.log('处理分析事件:', message);
  }
}

/**
 * 环境感知的消息处理器
 */
@environmentAwareMessageHandler(
  'log.entry',
  // 生产环境配置
  {
    priority: MessagePriority.LOW,
    maxRetries: 1,
    timeout: 60000,
  },
  // 开发环境配置
  {
    priority: MessagePriority.NORMAL,
    maxRetries: 3,
    timeout: 30000,
  },
)
export class LogEntryHandler {
  async handle(message: any): Promise<void> {
    console.log('处理日志条目:', message);
  }
}

// ==================== 中间件系统示例 ====================

/**
 * 使用标准中间件的处理器
 */
@MessageHandler('user.activity')
export class UserActivityHandler {
  @withMiddleware(...StandardMiddlewares)
  async handle(message: any): Promise<any> {
    console.log('处理用户活动:', message);

    // 模拟一些处理时间
    await new Promise((resolve) => globalThis.setTimeout(resolve, 100));

    return { processed: true, timestamp: new Date() };
  }
}

/**
 * 使用自定义中间件配置的处理器
 */
@MessageHandler('data.sync')
export class DataSyncHandler {
  @createConfigurableMiddleware({
    enableLogging: true,
    enablePerformance: true,
    enableValidation: true,
    enableTenantContext: true,
  })
  async handle(message: any): Promise<any> {
    console.log('处理数据同步:', message);

    // 验证数据
    if (!message.data) {
      throw new Error('数据不能为空');
    }

    // 模拟数据处理
    await new Promise((resolve) => globalThis.setTimeout(resolve, 200));

    return { synced: true, recordCount: message.data.length };
  }
}

/**
 * 使用自定义中间件的处理器
 */
@MessageHandler('file.upload')
export class FileUploadHandler {
  @withMiddleware(LoggingMiddleware, PerformanceMiddleware, {
    name: 'fileValidation',
    async before(context) {
      const message = context.args[0];
      if (!message.file || !message.file.size) {
        throw new Error('文件信息无效');
      }
      console.log(`验证文件: ${message.file.name}, 大小: ${message.file.size}`);
    },
    async after(context, result) {
      console.log('文件上传处理完成:', result);
    },
  })
  async handle(message: any): Promise<any> {
    console.log('处理文件上传:', message.file.name);

    // 模拟文件处理
    await new Promise((resolve) => globalThis.setTimeout(resolve, 500));

    return {
      uploaded: true,
      fileId: `file_${Date.now()}`,
      size: message.file.size,
    };
  }
}

// ==================== 高级功能组合示例 ====================

/**
 * 综合使用多种高级功能的复杂处理器
 */
@(DecoratorComposer.messageHandler('complex.workflow')
  .withPreset('CRITICAL_TASK')
  .withQueue('workflow-queue')
  .build())
export class ComplexWorkflowHandler {
  @createConfigurableMiddleware({
    enableLogging: true,
    enablePerformance: true,
    enableTenantContext: true,
    customMiddlewares: [
      {
        name: 'workflowTracking',
        async before(context) {
          const message = context.args[0];
          console.log(`开始工作流: ${message.workflowId}`);
          context.properties.set('workflowId', message.workflowId);
        },
        async after(context, result) {
          const workflowId = context.properties.get('workflowId');
          console.log(`工作流完成: ${workflowId}`, result);
        },
        async onError(context, error) {
          const workflowId = context.properties.get('workflowId');
          console.error(`工作流失败: ${workflowId}`, error.message);
        },
      },
    ],
  })
  async handle(message: any): Promise<any> {
    console.log('执行复杂工作流:', message);

    // 模拟多步骤处理
    const steps = ['validate', 'process', 'notify', 'cleanup'];
    const results = [];

    for (const step of steps) {
      console.log(`执行步骤: ${step}`);
      await new Promise((resolve) => globalThis.setTimeout(resolve, 100));
      results.push({ step, completed: true, timestamp: new Date() });
    }

    return {
      workflowId: message.workflowId,
      completed: true,
      steps: results,
      duration: performance.now(),
    };
  }

  @Subscribe('workflow.step.completed')
  @withMiddleware(LoggingMiddleware)
  async onStepCompleted(event: any): Promise<void> {
    console.log('工作流步骤完成:', event);
  }

  @Subscribe('workflow.failed')
  @withMiddleware(LoggingMiddleware, PerformanceMiddleware)
  async onWorkflowFailed(event: any): Promise<void> {
    console.log('工作流失败，开始补偿操作:', event);
    // 实现补偿逻辑
  }
}

// ==================== 演示函数 ====================

/**
 * 演示装饰器辅助功能
 */
export async function demonstrateAdvancedDecorators(): Promise<void> {
  console.log('🚀 开始高级装饰器功能演示\n');

  try {
    // 演示预设配置
    console.log('📋 预设配置演示:');
    const paymentHandler = new PaymentProcessedHandler();
    await paymentHandler.handle({ amount: 100, currency: 'USD' });

    // 演示构建器模式
    console.log('\n🏗️ 构建器模式演示:');
    const orderHandler = new OrderCreatedHandler();
    await orderHandler.handle({
      orderId: '12345',
      items: [{ id: 1, name: 'Product' }],
    });

    // 演示中间件系统
    console.log('\n🔌 中间件系统演示:');
    const activityHandler = new UserActivityHandler();
    await activityHandler.handle({ userId: 'user123', action: 'login' });

    // 演示复杂工作流
    console.log('\n⚙️ 复杂工作流演示:');
    const workflowHandler = new ComplexWorkflowHandler();
    const result = await workflowHandler.handle({
      workflowId: 'wf_123',
      type: 'order_processing',
      data: { orderId: '12345' },
    });
    console.log('工作流结果:', result);

    console.log('\n🎉 高级装饰器功能演示完成！');
  } catch (error) {
    console.error('❌ 演示失败:', error);
  }
}

// 如果直接运行此文件，执行演示
if (require.main === module) {
  demonstrateAdvancedDecorators();
}

// ==================== 类型示例 ====================

/**
 * 展示如何使用类型安全的装饰器配置
 */
interface OrderMessage {
  orderId: string;
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
}

interface PaymentMessage {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  method: 'credit_card' | 'paypal' | 'bank_transfer';
}

/**
 * 类型安全的订单处理器
 */
@(DecoratorComposer.messageHandler('typed.order.created')
  .withHighPriority()
  .withRetries(3)
  .withTenantIsolation()
  .build())
export class TypedOrderHandler {
  @withMiddleware(LoggingMiddleware, PerformanceMiddleware)
  async handle(
    message: OrderMessage,
  ): Promise<{ processed: boolean; orderId: string }> {
    console.log('处理类型安全的订单消息:', message.orderId);

    // 类型安全的消息处理
    const totalItems = message.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    console.log(
      `订单包含 ${totalItems} 个商品，总金额: ${message.totalAmount}`,
    );

    return {
      processed: true,
      orderId: message.orderId,
    };
  }
}

/**
 * 类型安全的支付处理器
 */
@(DecoratorComposer.messageHandler('typed.payment.processed')
  .withPreset('CRITICAL_TASK')
  .build())
export class TypedPaymentHandler {
  @createConfigurableMiddleware({
    enableLogging: true,
    enablePerformance: true,
    enableValidation: true,
  })
  async handle(
    message: PaymentMessage,
  ): Promise<{ confirmed: boolean; paymentId: string }> {
    console.log(
      `处理支付: ${message.paymentId}, 金额: ${message.amount} ${message.currency}`,
    );

    // 根据支付方式处理
    switch (message.method) {
      case 'credit_card':
        console.log('处理信用卡支付');
        break;
      case 'paypal':
        console.log('处理PayPal支付');
        break;
      case 'bank_transfer':
        console.log('处理银行转账');
        break;
    }

    return {
      confirmed: true,
      paymentId: message.paymentId,
    };
  }
}
