/**
 * 基础命令类
 *
 * 命令是 CQRS 模式中的写操作，表示用户或系统想要执行的动作。
 * 命令封装了执行操作所需的所有数据，并包含必要的元数据。
 *
 * ## 业务规则
 *
 * ### 命令标识规则
 * - 每个命令必须具有唯一的命令标识符
 * - 命令标识符用于命令的去重和追踪
 * - 命令标识符必须符合 EntityId 的格式要求
 *
 * ### 租户隔离规则
 * - 每个命令必须包含租户标识符
 * - 支持多租户架构的命令隔离
 * - 租户信息不可为空
 *
 * ### 时间戳规则
 * - 命令创建时间使用 UTC 时区
 * - 时间戳精度到毫秒级别
 * - 命令时间不可修改
 *
 * ### 版本控制规则
 * - 命令版本用于命令演化管理
 * - 版本号从 1 开始递增
 * - 支持向后兼容的命令处理
 *
 * ### 元数据规则
 * - 命令必须包含必要的元数据
 * - 包括用户信息、IP 地址、用户代理等
 * - 元数据用于审计和追踪
 *
 * @description 所有命令的基类，提供命令的一致行为
 * @example
 * ```typescript
 * class CreateUserCommand extends BaseCommand {
 *   constructor(
 *     public readonly email: string,
 *     public readonly name: string,
 *     public readonly password: string,
 *     tenantId: string,
 *     userId: string
 *   ) {
 *     super(tenantId, userId);
 *   }
 *
 *   get commandType(): string {
 *     return 'CreateUser';
 *   }
 * }
 *
 * // 创建命令
 * const command = new CreateUserCommand(
 *   'user@example.com',
 *   '张三',
 *   'password123',
 *   'tenant-123',
 *   'user-456'
 * );
 * ```
 *
 * @since 1.0.0
 */
import { EntityId } from '../../../../domain/value-objects/entity-id';

export abstract class BaseCommand {
  private readonly _commandId: EntityId;
  private readonly _tenantId: string;
  private readonly _userId: string;
  private readonly _createdAt: Date;
  private readonly _commandVersion: number;
  private readonly _metadata: Record<string, unknown>;

  /**
   * 构造函数
   *
   * @param tenantId - 租户标识符
   * @param userId - 用户标识符
   * @param commandVersion - 命令版本号，默认为 1
   * @param metadata - 额外的元数据
   */
  protected constructor(
    tenantId: string,
    userId: string,
    commandVersion: number = 1,
    metadata: Record<string, unknown> = {},
  ) {
    this._commandId = EntityId.generate();
    this._tenantId = tenantId;
    this._userId = userId;
    this._createdAt = new Date();
    this._commandVersion = commandVersion;
    this._metadata = { ...metadata };

    this.validate();
  }

  /**
   * 获取命令标识符
   *
   * @returns 命令唯一标识符
   */
  public get commandId(): EntityId {
    return this._commandId;
  }

  /**
   * 获取租户标识符
   *
   * @returns 租户标识符
   */
  public get tenantId(): string {
    return this._tenantId;
  }

  /**
   * 获取用户标识符
   *
   * @returns 用户标识符
   */
  public get userId(): string {
    return this._userId;
  }

  /**
   * 获取命令创建时间
   *
   * @returns 命令创建时间
   */
  public get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * 获取命令版本号
   *
   * @returns 命令版本号
   */
  public get commandVersion(): number {
    return this._commandVersion;
  }

  /**
   * 获取命令元数据
   *
   * @returns 命令元数据
   */
  public get metadata(): Record<string, unknown> {
    return { ...this._metadata };
  }

  /**
   * 获取命令类型名称
   *
   * 子类必须重写此方法以返回具体的命令类型名称。
   *
   * @returns 命令类型名称
   */
  public abstract get commandType(): string;

  /**
   * 获取命令的业务数据
   *
   * 子类应该重写此方法以返回命令的业务数据。
   * 默认实现返回空对象。
   *
   * @returns 命令的业务数据
   */
  public get commandData(): Record<string, unknown> {
    return {};
  }

  /**
   * 检查两个命令是否相等
   *
   * 命令的相等性基于命令标识符比较。
   *
   * @param other - 要比较的另一个命令
   * @returns 如果两个命令相等则返回 true，否则返回 false
   */
  public equals(other: BaseCommand | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (!(other instanceof this.constructor)) {
      return false;
    }

    return this._commandId.equals(other._commandId);
  }

  /**
   * 获取命令的哈希码
   *
   * 用于在 Map 或 Set 中使用命令作为键。
   *
   * @returns 哈希码字符串
   */
  public getHashCode(): string {
    return this._commandId.getHashCode();
  }

  /**
   * 将命令转换为字符串表示
   *
   * @returns 字符串表示
   */
  public toString(): string {
    return `${this.commandType}(${this._commandId.toString()})`;
  }

  /**
   * 将命令转换为 JSON 表示
   *
   * @returns JSON 表示
   */
  public toJSON(): Record<string, unknown> {
    return {
      commandId: this._commandId.toString(),
      commandType: this.commandType,
      tenantId: this._tenantId,
      userId: this._userId,
      createdAt: this._createdAt.toISOString(),
      commandVersion: this._commandVersion,
      commandData: this.commandData,
      metadata: this._metadata,
    };
  }

  /**
   * 获取命令的类型名称
   *
   * @returns 类型名称
   */
  public getTypeName(): string {
    return this.constructor.name;
  }

  /**
   * 比较两个命令的大小
   *
   * 基于命令创建时间进行比较。
   *
   * @param other - 要比较的另一个命令
   * @returns 比较结果：-1 表示小于，0 表示等于，1 表示大于
   */
  public compareTo(other: BaseCommand): number {
    if (other === null || other === undefined) {
      return 1;
    }

    if (this._createdAt < other._createdAt) {
      return -1;
    }
    if (this._createdAt > other._createdAt) {
      return 1;
    }

    // 如果时间相同，按命令ID比较
    return this._commandId.compareTo(other._commandId);
  }

  /**
   * 检查命令是否为指定类型
   *
   * @param commandType - 命令类型名称
   * @returns 如果命令是指定类型则返回 true，否则返回 false
   */
  public isOfType(commandType: string): boolean {
    return this.commandType === commandType;
  }

  /**
   * 检查命令是否属于指定的租户
   *
   * @param tenantId - 租户标识符
   * @returns 如果命令属于指定的租户则返回 true，否则返回 false
   */
  public belongsToTenant(tenantId: string): boolean {
    return this._tenantId === tenantId;
  }

  /**
   * 检查命令是否属于指定的用户
   *
   * @param userId - 用户标识符
   * @returns 如果命令属于指定的用户则返回 true，否则返回 false
   */
  public belongsToUser(userId: string): boolean {
    return this._userId === userId;
  }

  /**
   * 获取元数据值
   *
   * @param key - 元数据键
   * @returns 元数据值，如果不存在则返回 undefined
   */
  public getMetadata(key: string): unknown {
    return this._metadata[key];
  }

  /**
   * 检查是否包含指定的元数据键
   *
   * @param key - 元数据键
   * @returns 如果包含指定的元数据键则返回 true，否则返回 false
   */
  public hasMetadata(key: string): boolean {
    return key in this._metadata;
  }

  /**
   * 验证命令的有效性
   *
   * 子类应该重写此方法以实现具体的验证逻辑。
   *
   * @throws {Error} 当命令无效时
   * @protected
   */
  protected validate(): void {
    if (!this._commandId || this._commandId.isEmpty()) {
      throw new Error('Command ID cannot be null or empty');
    }

    if (!this._tenantId) {
      throw new Error('Tenant ID cannot be null or empty');
    }

    if (!this._userId) {
      throw new Error('User ID cannot be null or empty');
    }

    if (this._commandVersion < 1) {
      throw new Error('Command version must be greater than 0');
    }
  }
}
