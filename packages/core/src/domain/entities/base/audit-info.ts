/**
 * 审计信息接口
 *
 * 审计信息用于记录实体的生命周期事件，包括创建、更新、删除等操作。
 * 支持完整的审计追踪，确保数据变更的可追溯性和合规性。
 *
 * ## 业务规则
 *
 * ### 创建审计规则
 * - 实体创建时必须记录创建者和创建时间
 * - 创建者信息不可为空
 * - 创建时间使用 UTC 时区
 * - 版本号从 1 开始
 *
 * ### 更新审计规则
 * - 实体更新时必须记录更新者和更新时间
 * - 更新者信息不可为空
 * - 更新时间自动设置为当前时间
 * - 版本号自动递增
 *
 * ### 删除审计规则
 * - 支持软删除，记录删除者和删除时间
 * - 删除者信息不可为空
 * - 删除时间使用 UTC 时区
 * - 记录删除原因（可选）
 *
 * ### 多租户规则
 * - 租户标识符必须记录
 * - 租户信息不可为空
 * - 支持跨租户的审计追踪
 *
 * @description 实体审计信息接口，提供完整的生命周期追踪
 * @example
 * ```typescript
 * const auditInfo: AuditInfo = {
 *   createdBy: 'user-123',
 *   updatedBy: 'user-123',
 *   deletedBy: null,
 *   createdAt: new Date('2024-01-01T00:00:00Z'),
 *   updatedAt: new Date('2024-01-01T00:00:00Z'),
 *   deletedAt: null,
 *   tenantId: 'tenant-456',
 *   version: 1,
 *   lastOperation: 'CREATE',
 *   lastOperationIp: '192.168.1.1',
 *   lastOperationUserAgent: 'Mozilla/5.0...',
 *   lastOperationSource: 'WEB',
 *   deleteReason: null
 * };
 * ```
 *
 * @since 1.0.0
 */
export interface IAuditInfo {
  /**
   * 创建者标识符
   *
   * 记录创建实体的用户或系统标识符。
   *
   * @description 创建者标识符，不可为空
   */
  createdBy: string;

  /**
   * 最后更新者标识符
   *
   * 记录最后更新实体的用户或系统标识符。
   *
   * @description 最后更新者标识符，不可为空
   */
  updatedBy: string;

  /**
   * 删除者标识符
   *
   * 记录删除实体的用户或系统标识符。
   * 如果实体未被删除，则为 null。
   *
   * @description 删除者标识符，实体未删除时为 null
   */
  deletedBy: string | null;

  /**
   * 创建时间
   *
   * 记录实体创建的时间戳。
   * 使用 UTC 时区，精度到毫秒。
   *
   * @description 创建时间，使用 UTC 时区
   */
  createdAt: Date;

  /**
   * 最后更新时间
   *
   * 记录实体最后更新的时间戳。
   * 使用 UTC 时区，精度到毫秒。
   *
   * @description 最后更新时间，使用 UTC 时区
   */
  updatedAt: Date;

  /**
   * 删除时间
   *
   * 记录实体删除的时间戳。
   * 如果实体未被删除，则为 null。
   * 使用 UTC 时区，精度到毫秒。
   *
   * @description 删除时间，实体未删除时为 null
   */
  deletedAt: Date | null;

  /**
   * 租户标识符
   *
   * 记录实体所属的租户标识符。
   * 支持多租户架构的数据隔离。
   *
   * @description 租户标识符，支持多租户架构
   */
  tenantId: string;

  /**
   * 版本号
   *
   * 记录实体的版本号，用于乐观锁控制。
   * 每次更新时自动递增。
   *
   * @description 版本号，用于乐观锁控制
   */
  version: number;

  /**
   * 最后操作类型
   *
   * 记录对实体执行的最后操作类型。
   * 可能的值：CREATE、UPDATE、DELETE、RESTORE。
   *
   * @description 最后操作类型
   */
  lastOperation: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';

  /**
   * 最后操作 IP 地址
   *
   * 记录执行最后操作的客户端 IP 地址。
   * 用于安全审计和访问追踪。
   *
   * @description 最后操作 IP 地址
   */
  lastOperationIp: string | null;

  /**
   * 最后操作用户代理
   *
   * 记录执行最后操作的客户端用户代理字符串。
   * 用于客户端识别和访问分析。
   *
   * @description 最后操作用户代理
   */
  lastOperationUserAgent: string | null;

  /**
   * 最后操作来源
   *
   * 记录执行最后操作的来源系统或接口。
   * 可能的值：WEB、API、CLI、SYSTEM。
   *
   * @description 最后操作来源
   */
  lastOperationSource: 'WEB' | 'API' | 'CLI' | 'SYSTEM' | null;

  /**
   * 删除原因
   *
   * 记录实体删除的原因说明。
   * 仅在实体被删除时有效。
   *
   * @description 删除原因，仅在删除时有效
   */
  deleteReason: string | null;
}

/**
 * 部分审计信息接口
 *
 * 用于创建或更新实体时提供部分审计信息。
 * 系统会自动补充缺失的字段。
 *
 * @description 部分审计信息接口，用于实体创建和更新
 * @since 1.0.0
 */
export interface IPartialAuditInfo {
  /**
   * 创建者标识符
   */
  createdBy?: string;

  /**
   * 更新者标识符
   */
  updatedBy?: string;

  /**
   * 租户标识符
   */
  tenantId?: string;

  /**
   * 版本号
   */
  version?: number;

  /**
   * 最后操作类型
   */
  lastOperation?: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';

  /**
   * 最后操作 IP 地址
   */
  lastOperationIp?: string | null;

  /**
   * 最后操作用户代理
   */
  lastOperationUserAgent?: string | null;

  /**
   * 最后操作来源
   */
  lastOperationSource?: 'WEB' | 'API' | 'CLI' | 'SYSTEM' | null;

  /**
   * 删除原因
   */
  deleteReason?: string | null;
}

/**
 * 审计信息构建器
 *
 * 提供便捷的方法来构建完整的审计信息对象。
 *
 * @description 审计信息构建器，提供便捷的构建方法
 * @since 1.0.0
 */
export class AuditInfoBuilder {
  private auditInfo: Partial<IAuditInfo> = {};

  /**
   * 设置创建者
   *
   * @param createdBy - 创建者标识符
   * @returns 构建器实例
   */
  public withCreatedBy(createdBy: string): AuditInfoBuilder {
    this.auditInfo.createdBy = createdBy;
    return this;
  }

  /**
   * 设置更新者
   *
   * @param updatedBy - 更新者标识符
   * @returns 构建器实例
   */
  public withUpdatedBy(updatedBy: string): AuditInfoBuilder {
    this.auditInfo.updatedBy = updatedBy;
    return this;
  }

  /**
   * 设置租户标识符
   *
   * @param tenantId - 租户标识符
   * @returns 构建器实例
   */
  public withTenantId(tenantId: string): AuditInfoBuilder {
    this.auditInfo.tenantId = tenantId;
    return this;
  }

  /**
   * 设置版本号
   *
   * @param version - 版本号
   * @returns 构建器实例
   */
  public withVersion(version: number): AuditInfoBuilder {
    this.auditInfo.version = version;
    return this;
  }

  /**
   * 设置最后操作信息
   *
   * @param operation - 操作类型
   * @param ip - IP 地址
   * @param userAgent - 用户代理
   * @param source - 操作来源
   * @returns 构建器实例
   */
  public withLastOperation(
    operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE',
    ip?: string | null,
    userAgent?: string | null,
    source?: 'WEB' | 'API' | 'CLI' | 'SYSTEM' | null,
  ): AuditInfoBuilder {
    this.auditInfo.lastOperation = operation;
    this.auditInfo.lastOperationIp = ip || null;
    this.auditInfo.lastOperationUserAgent = userAgent || null;
    this.auditInfo.lastOperationSource = source || null;
    return this;
  }

  /**
   * 设置删除原因
   *
   * @param deleteReason - 删除原因
   * @returns 构建器实例
   */
  public withDeleteReason(deleteReason: string): AuditInfoBuilder {
    this.auditInfo.deleteReason = deleteReason;
    return this;
  }

  /**
   * 构建完整的审计信息对象
   *
   * @returns 完整的审计信息对象
   */
  public build(): IAuditInfo {
    const now = new Date();

    return {
      createdBy:
        this.auditInfo.createdBy !== undefined
          ? this.auditInfo.createdBy
          : 'system',
      updatedBy:
        this.auditInfo.updatedBy !== undefined
          ? this.auditInfo.updatedBy
          : this.auditInfo.createdBy !== undefined
            ? this.auditInfo.createdBy
            : 'system',
      deletedBy: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      tenantId:
        this.auditInfo.tenantId !== undefined
          ? this.auditInfo.tenantId
          : 'default',
      version:
        this.auditInfo.version !== undefined ? this.auditInfo.version : 1,
      lastOperation: this.auditInfo.lastOperation || 'CREATE',
      lastOperationIp: this.auditInfo.lastOperationIp || null,
      lastOperationUserAgent: this.auditInfo.lastOperationUserAgent || null,
      lastOperationSource: this.auditInfo.lastOperationSource || null,
      deleteReason: this.auditInfo.deleteReason || null,
    };
  }
}
