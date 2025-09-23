/**
 * Message Interface 测试
 *
 * @description 测试消息接口定义和类型验证
 * @since 1.0.0
 */
import {
  IMessage,
  IMessageOptions,
  MessagePriority,
  MessageStatus,
} from './message.interface';
import { EntityId } from '../../../domain/value-objects/entity-id';

describe('Message Interface', () => {
  describe('MessagePriority 枚举', () => {
    it('应该定义所有优先级级别', () => {
      expect(MessagePriority.LOW).toBe(1);
      expect(MessagePriority.NORMAL).toBe(5);
      expect(MessagePriority.HIGH).toBe(10);
      expect(MessagePriority.URGENT).toBe(15);
    });

    it('应该包含所有优先级值', () => {
      const priorities = Object.values(MessagePriority);
      expect(priorities).toContain(1);
      expect(priorities).toContain(5);
      expect(priorities).toContain(10);
      expect(priorities).toContain(15);
      expect(priorities).toHaveLength(8); // 包含键名和值
    });
  });

  describe('MessageStatus 枚举', () => {
    it('应该定义所有状态', () => {
      expect(MessageStatus.PENDING).toBe('pending');
      expect(MessageStatus.PROCESSING).toBe('processing');
      expect(MessageStatus.COMPLETED).toBe('completed');
      expect(MessageStatus.FAILED).toBe('failed');
      expect(MessageStatus.EXPIRED).toBe('expired');
      expect(MessageStatus.CANCELLED).toBe('cancelled');
    });

    it('应该包含所有状态值', () => {
      const statuses = Object.values(MessageStatus);
      expect(statuses).toContain('pending');
      expect(statuses).toContain('processing');
      expect(statuses).toContain('completed');
      expect(statuses).toContain('failed');
      expect(statuses).toContain('expired');
      expect(statuses).toContain('cancelled');
      expect(statuses).toHaveLength(6);
    });
  });

  describe('消息类型', () => {
    it('应该接受字符串类型', () => {
      const messageType: string = 'UserCreated';
      expect(typeof messageType).toBe('string');
    });

    it('应该支持不同的消息类型', () => {
      const types: string[] = [
        'UserCreated',
        'OrderProcessed',
        'PaymentCompleted',
        'EmailSent',
        'NotificationDelivered',
      ];

      types.forEach((type) => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });
    });
  });

  describe('IMessage 接口', () => {
    it('应该定义完整的消息结构', () => {
      const messageId = EntityId.generate();
      const message: IMessage = {
        id: messageId,
        type: 'TestMessage',
        payload: { test: 'data' },
        tenantId: 'tenant-123',
        createdAt: new Date(),
        status: MessageStatus.PENDING,
        priority: MessagePriority.NORMAL,
        retryCount: 0,
        maxRetries: 3,
      };

      expect(message.id).toBe(messageId);
      expect(message.type).toBe('TestMessage');
      expect(message.payload).toEqual({ test: 'data' });
      expect(message.tenantId).toBe('tenant-123');
      expect(message.createdAt).toBeInstanceOf(Date);
      expect(message.status).toBe(MessageStatus.PENDING);
      expect(message.priority).toBe(MessagePriority.NORMAL);
      expect(message.retryCount).toBe(0);
      expect(message.maxRetries).toBe(3);
    });

    it('应该支持可选属性', () => {
      const message: IMessage = {
        id: EntityId.generate(),
        type: 'MinimalMessage',
        payload: {},
        tenantId: 'tenant-123',
        createdAt: new Date(),
        status: MessageStatus.PENDING,
        priority: MessagePriority.NORMAL,
        retryCount: 0,
        maxRetries: 3,
      };

      expect(message.expiresAt).toBeUndefined();
      expect(message.correlationId).toBeUndefined();
      expect(message.replyTo).toBeUndefined();
      expect(message.metadata).toBeUndefined();
    });

    it('应该支持完整的消息属性', () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const message: IMessage = {
        id: EntityId.generate(),
        type: 'CompleteMessage',
        payload: { data: 'test' },
        tenantId: 'tenant-123',
        createdAt: new Date(),
        status: MessageStatus.PROCESSING,
        priority: MessagePriority.HIGH,
        retryCount: 1,
        maxRetries: 5,
        expiresAt,
        correlationId: 'corr-123',
        replyTo: 'reply-queue',
        metadata: { source: 'test', version: '1.0' },
      };

      expect(message.expiresAt).toBe(expiresAt);
      expect(message.correlationId).toBe('corr-123');
      expect(message.replyTo).toBe('reply-queue');
      expect(message.metadata).toEqual({ source: 'test', version: '1.0' });
    });
  });

  describe('IMessageOptions 接口', () => {
    it('应该定义消息选项结构', () => {
      const options: IMessageOptions = {
        priority: MessagePriority.HIGH,
        ttl: 3600000,
        maxRetries: 5,
        correlationId: 'corr-123',
        replyTo: 'reply-queue',
        metadata: { version: '2.0' },
      };

      expect(options.priority).toBe(MessagePriority.HIGH);
      expect(options.ttl).toBe(3600000);
      expect(options.maxRetries).toBe(5);
      expect(options.correlationId).toBe('corr-123');
      expect(options.replyTo).toBe('reply-queue');
      expect(options.metadata).toEqual({ version: '2.0' });
    });

    it('应该支持部分选项', () => {
      const options: IMessageOptions = {
        priority: MessagePriority.LOW,
        ttl: 1800000,
      };

      expect(options.priority).toBe(MessagePriority.LOW);
      expect(options.ttl).toBe(1800000);
      expect(options.maxRetries).toBeUndefined();
      expect(options.correlationId).toBeUndefined();
    });

    it('应该支持空选项对象', () => {
      const options: IMessageOptions = {};

      expect(Object.keys(options)).toHaveLength(0);
    });
  });

  describe('类型兼容性测试', () => {
    it('应该支持不同的载荷类型', () => {
      interface IUserCreatedPayload {
        userId: string;
        email: string;
        name: string;
      }

      interface IOrderProcessedPayload {
        orderId: string;
        amount: number;
        currency: string;
      }

      const userMessage: IMessage = {
        id: EntityId.generate(),
        type: 'UserCreated',
        payload: {
          userId: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        } as unknown as Record<string, unknown>,
        tenantId: 'tenant-123',
        createdAt: new Date(),
        status: MessageStatus.PENDING,
        priority: MessagePriority.NORMAL,
        retryCount: 0,
        maxRetries: 3,
      };

      const orderMessage: IMessage = {
        id: EntityId.generate(),
        type: 'OrderProcessed',
        payload: {
          orderId: 'order-456',
          amount: 99.99,
          currency: 'USD',
        } as unknown as Record<string, unknown>,
        tenantId: 'tenant-123',
        createdAt: new Date(),
        status: MessageStatus.COMPLETED,
        priority: MessagePriority.HIGH,
        retryCount: 0,
        maxRetries: 3,
      };

      expect(
        (userMessage.payload as unknown as IUserCreatedPayload).userId,
      ).toBe('user-123');
      expect(
        (userMessage.payload as unknown as IUserCreatedPayload).email,
      ).toBe('test@example.com');
      expect(
        (orderMessage.payload as unknown as IOrderProcessedPayload).orderId,
      ).toBe('order-456');
      expect(
        (orderMessage.payload as unknown as IOrderProcessedPayload).amount,
      ).toBe(99.99);
    });
  });

  describe('边界情况', () => {
    it('应该处理空载荷', () => {
      const message: IMessage = {
        id: EntityId.generate(),
        type: 'EmptyMessage',
        payload: {},
        tenantId: 'tenant-123',
        createdAt: new Date(),
        status: MessageStatus.PENDING,
        priority: MessagePriority.NORMAL,
        retryCount: 0,
        maxRetries: 3,
      };

      expect(message.payload).toEqual({});
      expect(Object.keys(message.payload)).toHaveLength(0);
    });

    it('应该处理特殊字符和Unicode', () => {
      const message: IMessage = {
        id: EntityId.generate(),
        type: 'UnicodeMessage',
        payload: {
          text: '测试消息_José_🚀_特殊字符!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~',
        },
        tenantId: '租户-123',
        createdAt: new Date(),
        status: MessageStatus.PENDING,
        priority: MessagePriority.NORMAL,
        retryCount: 0,
        maxRetries: 3,
      };

      expect((message.payload as { text: string }).text).toContain('测试消息');
      expect((message.payload as { text: string }).text).toContain('José');
      expect((message.payload as { text: string }).text).toContain('🚀');
      expect(message.tenantId).toBe('租户-123');
    });

    it('应该处理复杂的载荷结构', () => {
      interface IComplexPayload {
        user: {
          id: string;
          profile: {
            name: string;
            email: string;
            preferences: {
              theme: string;
              language: string;
            };
          };
        };
        metadata: {
          source: string;
          timestamp: string;
          tags: string[];
        };
      }

      const message: IMessage = {
        id: EntityId.generate(),
        type: 'ComplexMessage',
        payload: {
          user: {
            id: 'user-123',
            profile: {
              name: 'Test User',
              email: 'test@example.com',
              preferences: {
                theme: 'dark',
                language: 'zh-CN',
              },
            },
          },
          metadata: {
            source: 'api',
            timestamp: new Date().toISOString(),
            tags: ['important', 'user-action'],
          },
        } as unknown as Record<string, unknown>,
        tenantId: 'tenant-123',
        createdAt: new Date(),
        status: MessageStatus.PENDING,
        priority: MessagePriority.NORMAL,
        retryCount: 0,
        maxRetries: 3,
      };

      const payload = message.payload as unknown as IComplexPayload;
      expect(payload.user.id).toBe('user-123');
      expect(payload.user.profile.preferences.theme).toBe('dark');
      expect(payload.metadata.tags).toContain('important');
    });
  });

  describe('消息选项测试', () => {
    it('应该正确设置各种优先级', () => {
      const highOptions: IMessageOptions = {
        priority: MessagePriority.HIGH,
      };

      const lowOptions: IMessageOptions = {
        priority: MessagePriority.LOW,
      };

      const urgentOptions: IMessageOptions = {
        priority: MessagePriority.URGENT,
      };

      expect(highOptions.priority).toBe(MessagePriority.HIGH);
      expect(lowOptions.priority).toBe(MessagePriority.LOW);
      expect(urgentOptions.priority).toBe(MessagePriority.URGENT);
    });

    it('应该正确设置TTL和关联ID', () => {
      const options: IMessageOptions = {
        ttl: 5000, // 5秒
        correlationId: 'correlation-123',
        replyTo: 'reply-queue-456',
      };

      expect(options.ttl).toBe(5000);
      expect(options.correlationId).toBe('correlation-123');
      expect(options.replyTo).toBe('reply-queue-456');
    });
  });
});
