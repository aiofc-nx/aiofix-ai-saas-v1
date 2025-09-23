/**
 * 基础实体类
 *
 * 实体是领域驱动设计中的核心概念，具有唯一标识符和生命周期。
 * 实体的相等性基于其标识符，而不是属性值。
 *
 * ## 业务规则
 *
 * ### 标识符规则
 * - 每个实体必须具有唯一的标识符
 * - 标识符在实体生命周期内不可变更
 * - 标识符用于实体的相等性比较
 * - 标识符必须符合 EntityId 的格式要求
 *
 * ### 时间戳规则
 * - 创建时间在实体创建时设置，不可修改
 * - 更新时间在实体状态变更时自动更新
 * - 时间戳采用 UTC 时区，确保跨时区一致性
 * - 时间戳精度到毫秒级别
 *
 * ### 相等性规则
 * - 实体的相等性基于标识符比较，而非属性值
 * - 相同类型且相同标识符的实体被视为相等
 * - 不同类型但相同标识符的实体被视为不相等
 * - null 和 undefined 与任何实体都不相等
 *
 * ### 生命周期规则
 * - 实体创建后具有完整的生命周期管理
 * - 实体状态变更会触发相应的事件
 * - 实体支持序列化和反序列化操作
 * - 实体变更会记录操作时间和上下文
 *
 * @description 所有实体的基类，提供实体的一致行为
 * @example
 * ```typescript
 * class User extends BaseEntity {
 *   constructor(
 *     id: EntityId,
 *     private name: string,
 *     private email: string,
 *     auditInfo: Partial<AuditInfo>
 *   ) {
 *     super(id, auditInfo);
 *   }
 *
 *   getName(): string {
 *     return this.name;
 *   }
 *
 *   updateName(newName: string): void {
 *     this.name = newName;
 *     this.updateTimestamp(); // 自动更新修改时间
 *   }
 * }
 *
 * // 创建用户实体
 * const user = new User(
 *   EntityId.generate(),
 *   '张三',
 *   'zhangsan@example.com',
 *   { createdBy: 'system', tenantId: 'tenant-123' }
 * );
 *
 * // 更新用户信息
 * user.updateName('李四');
 * ```
 *
 * @since 1.0.0
 */
import { EntityId } from '../../value-objects/entity-id';
import { IAuditInfo, IPartialAuditInfo } from './audit-info';

export abstract class BaseEntity {
  private readonly _id: EntityId;
  private readonly _auditInfo: IAuditInfo;

  /**
   * 构造函数
   *
   * @param id - 实体唯一标识符
   * @param auditInfo - 审计信息，可以是完整的或部分的
   */
  protected constructor(id: EntityId, auditInfo: IPartialAuditInfo) {
    this._id = id;
    this._auditInfo = this.buildAuditInfo(auditInfo);
  }

  /**
   * 获取实体标识符
   *
   * @returns 实体唯一标识符
   */
  public get id(): EntityId {
    return this._id;
  }

  /**
   * 获取审计信息
   *
   * @returns 完整的审计信息
   */
  public get auditInfo(): IAuditInfo {
    return this._auditInfo;
  }

  /**
   * 获取创建时间
   *
   * @returns 创建时间
   */
  public get createdAt(): Date {
    return this._auditInfo.createdAt;
  }

  /**
   * 获取最后更新时间
   *
   * @returns 最后更新时间
   */
  public get updatedAt(): Date {
    return this._auditInfo.updatedAt;
  }

  /**
   * 获取删除时间
   *
   * @returns 删除时间，如果实体未被删除则返回 null
   */
  public get deletedAt(): Date | null {
    return this._auditInfo.deletedAt;
  }

  /**
   * 获取租户标识符
   *
   * @returns 租户标识符
   */
  public get tenantId(): string {
    return this._auditInfo.tenantId;
  }

  /**
   * 获取版本号
   *
   * @returns 版本号
   */
  public get version(): number {
    return this._auditInfo.version;
  }

  /**
   * 检查实体是否被删除
   *
   * @returns 如果实体被删除则返回 true，否则返回 false
   */
  public get isDeleted(): boolean {
    return this._auditInfo.deletedAt !== null;
  }

  /**
   * 获取创建者标识符
   *
   * @returns 创建者标识符
   */
  public get createdBy(): string {
    return this._auditInfo.createdBy;
  }

  /**
   * 获取最后更新者标识符
   *
   * @returns 最后更新者标识符
   */
  public get updatedBy(): string {
    return this._auditInfo.updatedBy;
  }

  /**
   * 获取删除者标识符
   *
   * @returns 删除者标识符，如果实体未被删除则返回 null
   */
  public get deletedBy(): string | null {
    return this._auditInfo.deletedBy;
  }

  /**
   * 检查两个实体是否相等
   *
   * 实体的相等性基于标识符比较，而不是属性值。
   *
   * @param other - 要比较的另一个实体
   * @returns 如果两个实体相等则返回 true，否则返回 false
   */
  public equals(other: BaseEntity | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (!(other instanceof this.constructor)) {
      return false;
    }

    return this._id.equals(other._id);
  }

  /**
   * 获取实体的哈希码
   *
   * 用于在 Map 或 Set 中使用实体作为键。
   *
   * @returns 哈希码字符串
   */
  public getHashCode(): string {
    return this._id.getHashCode();
  }

  /**
   * 将实体转换为字符串表示
   *
   * @returns 字符串表示
   */
  public toString(): string {
    return `${this.constructor.name}(${this._id.toString()})`;
  }

  /**
   * 将实体转换为 JSON 表示
   *
   * @returns JSON 表示
   */
  public toJSON(): Record<string, unknown> {
    return {
      id: this._id.toString(),
      type: this.constructor.name,
      auditInfo: this._auditInfo,
    };
  }

  /**
   * 获取实体的类型名称
   *
   * @returns 类型名称
   */
  public getTypeName(): string {
    return this.constructor.name;
  }

  /**
   * 比较两个实体的大小
   *
   * 基于标识符进行比较。
   *
   * @param other - 要比较的另一个实体
   * @returns 比较结果：-1 表示小于，0 表示等于，1 表示大于
   */
  public compareTo(other: BaseEntity): number {
    if (other === null || other === undefined) {
      return 1;
    }

    return this._id.compareTo(other._id);
  }

  /**
   * 构建完整的审计信息
   *
   * @param partialAuditInfo - 部分审计信息
   * @returns 完整的审计信息
   */
  private buildAuditInfo(partialAuditInfo: IPartialAuditInfo): IAuditInfo {
    const now = new Date();

    return {
      createdBy: partialAuditInfo.createdBy || 'system',
      updatedBy:
        partialAuditInfo.updatedBy || partialAuditInfo.createdBy || 'system',
      deletedBy: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      tenantId:
        partialAuditInfo.tenantId !== undefined
          ? partialAuditInfo.tenantId
          : 'default',
      version: partialAuditInfo.version || 1,
      lastOperation: partialAuditInfo.lastOperation || 'CREATE',
      lastOperationIp: partialAuditInfo.lastOperationIp || null,
      lastOperationUserAgent: partialAuditInfo.lastOperationUserAgent || null,
      lastOperationSource: partialAuditInfo.lastOperationSource || null,
      deleteReason: partialAuditInfo.deleteReason || null,
    };
  }

  /**
   * 更新实体的时间戳
   *
   * 在实体状态变更时调用此方法以更新最后修改时间。
   * 此方法应该在子类中重写以实现具体的更新逻辑。
   *
   * @protected
   */
  protected updateTimestamp(): void {
    // 子类应该重写此方法以实现具体的更新逻辑
    // 这里只是提供一个接口，实际的更新应该在子类中实现
  }

  /**
   * 验证实体的有效性
   *
   * 子类应该重写此方法以实现具体的验证逻辑。
   *
   * @throws {Error} 当实体无效时
   * @protected
   */
  protected validate(): void {
    if (!this._id || this._id.isEmpty()) {
      throw new Error('Entity ID cannot be null or empty');
    }

    if (!this._auditInfo.tenantId || this._auditInfo.tenantId.trim() === '') {
      throw new Error('Tenant ID cannot be null or empty');
    }
  }
}
