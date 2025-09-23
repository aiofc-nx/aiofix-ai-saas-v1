/**
 * BaseMessage 测试
 *
 * @description 测试基础消息类的功能
 * @since 1.0.0
 */
import { BaseMessage } from './base-message';
import { EntityId } from '../../../domain/value-objects/entity-id';
import {
  IMessage,
  IMessageOptions,
  MessagePriority,
  MessageStatus,
} from './message.interface';

// 测试用的消息类
class TestMessage extends BaseMessage {
  constructor(
    public readonly action: string,
    public readonly data: Record<string, unknown> = {},
    tenantId: string = 'default',
    options: IMessageOptions = {},
  ) {
    super('TestMessage', { action, data }, tenantId, options);
  }
}

// 复杂消息类
class ComplexMessage extends BaseMessage {
  constructor(
    public readonly operation: {
      type: 'CREATE' | 'UPDATE' | 'DELETE';
      target: string;
      payload: Record<string, unknown>;
    },
    public readonly config: {
      async?: boolean;
      timeout?: number;
      retries?: number;
    } = {},
    tenantId: string = 'default',
    options: IMessageOptions = {},
  ) {
    super('ComplexMessage', { operation, config }, tenantId, options);
  }
}

describe('BaseMessage', () => {
  const tenantId = 'tenant-123';
  const userId = 'user-456';

  describe('消息创建', () => {
    it('应该正确创建基础消息', () => {
      const message = new TestMessage(
        'test-action',
        { key: 'value' },
        tenantId,
      );

      expect(message.id).toBeInstanceOf(EntityId);
      expect(message.type).toBe('TestMessage');
      expect(message.action).toBe('test-action');
      expect(message.data).toEqual({ key: 'value' });
      expect(message.tenantId).toBe(tenantId);
      expect(message.createdAt).toBeInstanceOf(Date);
      expect(message.priority).toBe(MessagePriority.NORMAL);
      expect(message.status).toBe(MessageStatus.PENDING);
      expect(message.retryCount).toBe(0);
      expect(message.maxRetries).toBe(3);
    });

    it('应该为每个消息生成唯一的ID', () => {
      const message1 = new TestMessage('action1');
      const message2 = new TestMessage('action2');

      expect(message1.id.toString()).not.toBe(message2.id.toString());
    });

    it('应该正确设置消息创建时间', () => {
      const beforeCreate = new Date();
      const message = new TestMessage('test-action');
      const afterCreate = new Date();

      expect(message.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime(),
      );
      expect(message.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime(),
      );
    });

    it('应该支持自定义消息选项', () => {
      const options: IMessageOptions = {
        priority: MessagePriority.HIGH,
        maxRetries: 5,
        ttl: 60000,
        correlationId: 'corr-123',
        replyTo: 'reply-queue',
        metadata: { source: 'test' },
      };

      const message = new TestMessage('test-action', {}, tenantId, options);

      expect(message.priority).toBe(MessagePriority.HIGH);
      expect(message.maxRetries).toBe(5);
      expect(message.correlationId).toBe('corr-123');
      expect(message.replyTo).toBe('reply-queue');
      expect(message.metadata).toEqual({ source: 'test' });
      expect(message.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('消息验证', () => {
    it('应该拒绝空的消息类型', () => {
      expect(() => {
        class EmptyTypeMessage extends BaseMessage {
          constructor() {
            super('', {}, tenantId);
          }
        }
        new EmptyTypeMessage();
      }).toThrow('Message type cannot be empty');
    });

    it('应该拒绝空白的消息类型', () => {
      expect(() => {
        // 创建一个会生成空白类型的消息
        class EmptyTypeMessage extends BaseMessage {
          constructor() {
            super('   ', {}, tenantId);
          }
        }
        new EmptyTypeMessage();
      }).toThrow('Message type cannot be empty');
    });

    it('应该拒绝无效的载荷', () => {
      expect(() => {
        class InvalidPayloadMessage extends BaseMessage {
          constructor() {
            super('TestMessage', null as any, tenantId);
          }
        }
        new InvalidPayloadMessage();
      }).toThrow('Message payload must be a valid object');
    });

    it('应该拒绝空的租户ID', () => {
      expect(() => {
        new TestMessage('test-action', {}, '');
      }).toThrow('Tenant ID cannot be empty');
    });

    it('应该拒绝负数的最大重试次数', () => {
      expect(() => {
        new TestMessage('test-action', {}, tenantId, { maxRetries: -1 });
      }).toThrow('Max retries cannot be negative');
    });
  });

  describe('消息状态管理', () => {
    it('应该正确检查消息是否已过期', () => {
      // 未设置过期时间的消息
      const message1 = new TestMessage('test-action');
      expect(message1.isExpired()).toBe(false);

      // 设置过期时间的消息
      const message2 = new TestMessage('test-action', {}, tenantId, { ttl: 1 });
      setTimeout(() => {
        expect(message2.isExpired()).toBe(true);
      }, 10);
    });

    it('应该正确检查消息是否可以重试', () => {
      const message = new TestMessage('test-action', {}, tenantId, {
        maxRetries: 3,
      });

      expect(message.canRetry()).toBe(true);

      // 模拟重试次数达到上限
      Object.defineProperty(message, 'retryCount', { value: 3 });
      expect(message.canRetry()).toBe(false);
    });

    it('应该在消息过期时不允许重试', () => {
      const message = new TestMessage('test-action', {}, tenantId, {
        ttl: 1,
      });

      setTimeout(() => {
        expect(message.canRetry()).toBe(false);
      }, 10);
    });
  });

  describe('消息克隆', () => {
    it('应该正确克隆消息', () => {
      const original = new TestMessage(
        'test-action',
        { key: 'value' },
        tenantId,
      );
      const cloned = original.clone();

      expect(cloned.id.toString()).toBe(original.id.toString());
      expect(cloned.type).toBe(original.type);
      expect(cloned.payload).toEqual(original.payload);
      expect(cloned.tenantId).toBe(original.tenantId);
    });

    it('应该支持克隆时更新属性', () => {
      const original = new TestMessage(
        'test-action',
        { key: 'value' },
        tenantId,
      );
      const updates: Partial<IMessage> = {
        priority: MessagePriority.HIGH,
        status: MessageStatus.PROCESSING,
      };
      const cloned = original.clone(updates);

      expect(cloned.priority).toBe(MessagePriority.HIGH);
      expect(cloned.status).toBe(MessageStatus.PROCESSING);
      expect(cloned.id.toString()).toBe(original.id.toString());
    });
  });

  describe('消息序列化', () => {
    it('应该正确转换为JSON字符串', () => {
      const message = new TestMessage(
        'test-action',
        { key: 'value' },
        tenantId,
        {
          priority: MessagePriority.HIGH,
          correlationId: 'corr-123',
        },
      );

      const json = message.toJSON();
      const parsed = JSON.parse(json);

      expect(parsed.id).toBeDefined();
      expect(parsed.type).toBe('TestMessage');
      expect(parsed.payload).toEqual({
        action: 'test-action',
        data: { key: 'value' },
      });
      expect(parsed.priority).toBe(MessagePriority.HIGH);
      expect(parsed.tenantId).toBe(tenantId);
      expect(parsed.correlationId).toBe('corr-123');
      expect(parsed.createdAt).toBeDefined();
    });

    it('应该能够从JSON字符串创建消息', () => {
      const original = new TestMessage(
        'test-action',
        { key: 'value' },
        tenantId,
      );
      const json = original.toJSON();
      const restored = BaseMessage.fromJSON(json);

      expect(restored.id.toString()).toBe(original.id.toString());
      expect(restored.type).toBe(original.type);
      expect(restored.payload).toEqual(original.payload);
      expect(restored.tenantId).toBe(original.tenantId);
    });

    it('应该正确转换为字符串', () => {
      const message = new TestMessage('test-action');
      const str = message.toString();

      expect(str).toMatch(/^TestMessage\([a-f0-9-]+\)$/);
    });
  });

  describe('消息比较', () => {
    it('相同ID的消息应该相等', () => {
      const sharedId = EntityId.generate();

      class TestMessageClass extends BaseMessage {
        constructor(action: string, customId?: EntityId) {
          super('TestMessage', { action }, tenantId);
          if (customId) {
            Object.defineProperty(this, 'id', {
              value: customId,
              writable: false,
            });
          }
        }
      }

      const message1 = new TestMessageClass('action1', sharedId);
      const message2 = new TestMessageClass('action2', sharedId);

      expect(message1.equals(message2)).toBe(true);
    });

    it('不同ID的消息应该不相等', () => {
      const message1 = new TestMessage('action1');
      const message2 = new TestMessage('action2');

      expect(message1.equals(message2)).toBe(false);
    });

    it('与null或undefined比较应该返回false', () => {
      const message = new TestMessage('test-action');

      expect(message.equals(null)).toBe(false);
      expect(message.equals(undefined)).toBe(false);
    });

    it('应该正确获取哈希码', () => {
      const message = new TestMessage('test-action');
      expect(message.getHashCode()).toBe(message.id.toString());
    });
  });

  describe('复杂消息测试', () => {
    it('应该正确创建复杂消息', () => {
      const operation = {
        type: 'CREATE' as const,
        target: 'user',
        payload: { name: 'John', email: 'john@example.com' },
      };
      const config = {
        async: true,
        timeout: 5000,
        retries: 2,
      };

      const message = new ComplexMessage(operation, config, tenantId);

      expect(message.operation).toEqual(operation);
      expect(message.config).toEqual(config);
      expect(message.type).toBe('ComplexMessage');
    });
  });

  describe('边界情况', () => {
    it('应该处理空数据对象', () => {
      const message = new TestMessage('test-action', {}, tenantId);
      expect(message.data).toEqual({});
    });

    it('应该处理特殊字符的动作', () => {
      const specialAction = '测试动作_José_🚀';
      const message = new TestMessage(specialAction, {}, tenantId);
      expect(message.action).toBe(specialAction);
    });

    it('应该处理复杂的数据对象', () => {
      const complexData = {
        nested: {
          deep: {
            value: 'test',
            array: [1, 2, 3],
            object: { key: 'value' },
          },
        },
        unicode: '测试_José_🚀',
        numbers: [1.23, -456, 0],
        boolean: true,
      };

      const message = new TestMessage('complex-action', complexData, tenantId);
      expect(message.data).toEqual(complexData);
    });

    it('应该处理Unicode字符', () => {
      const unicodeAction = '测试动作_José_🚀';
      const message = new TestMessage(unicodeAction, {}, '租户-123');

      expect(message.action).toBe(unicodeAction);
      expect(message.tenantId).toBe('租户-123');
    });

    it('应该处理大量元数据', () => {
      const largeMetadata: Record<string, unknown> = {};
      for (let i = 0; i < 100; i++) {
        largeMetadata[`key${i}`] = `value${i}`;
      }

      const message = new TestMessage('test-action', {}, tenantId, {
        metadata: largeMetadata,
      });

      expect(message.metadata).toEqual(largeMetadata);
    });
  });

  describe('消息选项测试', () => {
    it('应该正确设置高优先级', () => {
      const message = new TestMessage('test-action', {}, tenantId, {
        priority: MessagePriority.HIGH,
      });

      expect(message.priority).toBe(MessagePriority.HIGH);
    });

    it('应该正确设置低优先级', () => {
      const message = new TestMessage('test-action', {}, tenantId, {
        priority: MessagePriority.LOW,
      });

      expect(message.priority).toBe(MessagePriority.LOW);
    });

    it('应该正确设置紧急优先级', () => {
      const message = new TestMessage('test-action', {}, tenantId, {
        priority: MessagePriority.URGENT,
      });

      expect(message.priority).toBe(MessagePriority.URGENT);
    });

    it('应该正确设置TTL和过期时间', () => {
      const ttl = 5000; // 5秒
      const beforeCreate = new Date();
      const message = new TestMessage('test-action', {}, tenantId, { ttl });
      const afterCreate = new Date();

      expect(message.expiresAt).toBeInstanceOf(Date);
      expect(message.expiresAt!.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime() + ttl,
      );
      expect(message.expiresAt!.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime() + ttl,
      );
    });

    it('应该正确设置关联ID和回复地址', () => {
      const options: IMessageOptions = {
        correlationId: 'correlation-123',
        replyTo: 'reply-queue-456',
      };

      const message = new TestMessage('test-action', {}, tenantId, options);

      expect(message.correlationId).toBe('correlation-123');
      expect(message.replyTo).toBe('reply-queue-456');
    });
  });

  describe('JSON序列化和反序列化', () => {
    it('应该正确序列化和反序列化完整的消息', () => {
      const original = new TestMessage(
        'test-action',
        { key: 'value', number: 123 },
        tenantId,
        {
          priority: MessagePriority.HIGH,
          correlationId: 'corr-123',
          replyTo: 'reply-queue',
          metadata: { source: 'test', version: '1.0' },
        },
      );

      const json = original.toJSON();
      const restored = BaseMessage.fromJSON(json);

      expect(restored.id.toString()).toBe(original.id.toString());
      expect(restored.type).toBe(original.type);
      expect(restored.payload).toEqual(original.payload);
      expect(restored.priority).toBe(original.priority);
      expect(restored.tenantId).toBe(original.tenantId);
      expect(restored.correlationId).toBe(original.correlationId);
      expect(restored.replyTo).toBe(original.replyTo);
      expect(restored.metadata).toEqual(original.metadata);
    });

    it('应该正确处理没有可选字段的消息序列化', () => {
      const original = new TestMessage('simple-action', { data: 'test' });
      const json = original.toJSON();
      const restored = BaseMessage.fromJSON(json);

      expect(restored.type).toBe(original.type);
      expect(restored.payload).toEqual(original.payload);
      expect(restored.correlationId).toBeUndefined();
      expect(restored.replyTo).toBeUndefined();
      expect(restored.metadata).toBeUndefined();
    });
  });

  describe('错误处理', () => {
    it('应该拒绝无效的JSON反序列化', () => {
      expect(() => {
        BaseMessage.fromJSON('invalid json');
      }).toThrow();
    });

    it('应该拒绝缺少必需字段的JSON', () => {
      expect(() => {
        BaseMessage.fromJSON('{"id": "123"}');
      }).toThrow();
    });
  });
});
