/**
 * EntityId 值对象测试
 *
 * @description 测试 EntityId 值对象的功能
 * @since 1.0.0
 */
import { EntityId } from './entity-id';

describe('EntityId', () => {
  describe('生成新的标识符', () => {
    it('应该生成有效的 UUID v4 格式标识符', () => {
      const id = EntityId.generate();

      expect(id).toBeInstanceOf(EntityId);
      expect(id.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(EntityId.isValid(id.value)).toBe(true);
    });

    it('每次生成的标识符应该不同', () => {
      const id1 = EntityId.generate();
      const id2 = EntityId.generate();

      expect(id1.value).not.toBe(id2.value);
    });
  });

  describe('从字符串创建标识符', () => {
    it('应该从有效的 UUID v4 字符串创建标识符', () => {
      const uuidString = '550e8400-e29b-41d4-a716-446655440000';
      const id = EntityId.fromString(uuidString);

      expect(id).toBeInstanceOf(EntityId);
      expect(id.value).toBe(uuidString);
    });

    it('应该拒绝无效的 UUID 格式', () => {
      expect(() => {
        EntityId.fromString('invalid-uuid');
      }).toThrow('Invalid EntityId');
    });

    it('应该拒绝非 UUID v4 格式', () => {
      // UUID v1 格式
      const uuidV1 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
      expect(() => {
        EntityId.fromString(uuidV1);
      }).toThrow('Invalid EntityId');
    });
  });

  describe('标识符验证', () => {
    it('应该验证有效的 UUID v4 格式', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(EntityId.isValid(validUuid)).toBe(true);
    });

    it('应该拒绝无效的格式', () => {
      expect(EntityId.isValid('')).toBe(false);
      expect(EntityId.isValid('invalid')).toBe(false);
      expect(EntityId.isValid(null as any)).toBe(false);
      expect(EntityId.isValid(undefined as any)).toBe(false);
    });
  });

  describe('标识符相等性', () => {
    it('相同值的标识符应该相等', () => {
      const uuidString = '550e8400-e29b-41d4-a716-446655440000';
      const id1 = EntityId.fromString(uuidString);
      const id2 = EntityId.fromString(uuidString);

      expect(id1.equals(id2)).toBe(true);
    });

    it('不同值的标识符应该不相等', () => {
      const id1 = EntityId.generate();
      const id2 = EntityId.generate();

      expect(id1.equals(id2)).toBe(false);
    });

    it('与 null 或 undefined 比较应该返回 false', () => {
      const id = EntityId.generate();

      expect(id.equals(null)).toBe(false);
      expect(id.equals(undefined)).toBe(false);
    });
  });

  describe('标识符转换', () => {
    it('应该正确转换为字符串', () => {
      const uuidString = '550e8400-e29b-41d4-a716-446655440000';
      const id = EntityId.fromString(uuidString);

      expect(id.toString()).toBe(uuidString);
    });

    it('应该正确转换为 JSON', () => {
      const uuidString = '550e8400-e29b-41d4-a716-446655440000';
      const id = EntityId.fromString(uuidString);

      expect(id.toJSON()).toBe(uuidString);
    });
  });

  describe('标识符工具方法', () => {
    it('应该正确获取哈希码', () => {
      const uuidString = '550e8400-e29b-41d4-a716-446655440000';
      const id = EntityId.fromString(uuidString);

      expect(id.getHashCode()).toBe(uuidString);
    });

    it('应该正确检查是否为空', () => {
      const id = EntityId.generate();

      expect(id.isEmpty()).toBe(false);
    });

    it('应该正确创建副本', () => {
      const id1 = EntityId.generate();
      const id2 = id1.clone();

      expect(id1.equals(id2)).toBe(true);
      expect(id1).not.toBe(id2); // 不同的实例
    });

    it('应该正确获取版本信息', () => {
      const id = EntityId.generate();

      expect(id.getVersion()).toBe(4);
    });

    it('应该正确比较大小', () => {
      const id1 = EntityId.fromString('00000000-0000-4000-8000-000000000000');
      const id2 = EntityId.fromString('ffffffff-ffff-4fff-8fff-ffffffffffff');

      expect(id1.compareTo(id2)).toBe(-1);
      expect(id2.compareTo(id1)).toBe(1);
      expect(id1.compareTo(id1)).toBe(0);
    });
  });
});
