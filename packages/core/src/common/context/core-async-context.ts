/**
 * CoreAsyncContext - 核心异步上下文实现
 *
 * 提供了完整的异步上下文管理功能，包括数据存储、生命周期管理、
 * 多租户支持、请求追踪等企业级特性。
 *
 * ## 业务规则
 *
 * ### 数据管理规则
 * - 上下文数据在创建时设置，支持后续修改
 * - 支持自定义数据的存储和检索
 * - 数据变更会记录时间戳
 *
 * ### 生命周期规则
 * - 上下文具有创建时间和过期时间
 * - 支持自动过期和手动清理
 * - 过期检查基于当前时间
 *
 * ### 多租户规则
 * - 支持租户级别的数据隔离
 * - 租户信息在上下文中传递
 * - 支持组织、部门级别的隔离
 *
 * ### 追踪规则
 * - 支持请求级别的追踪
 * - 关联标识符用于分布式追踪
 * - 原因标识符用于事件溯源
 *
 * @description 核心异步上下文实现类
 * @example
 * ```typescript
 * const context = new CoreAsyncContext({
 *   tenantId: 'tenant-1',
 *   userId: 'user-123',
 *   requestId: 'req-456'
 * });
 *
 * // 设置数据
 * context.setValue('organizationId', 'org-789');
 *
 * // 获取数据
 * const tenantId = context.getValue('tenantId');
 *
 * // 设置自定义数据
 * context.setCustomData('featureFlags', ['feature1', 'feature2']);
 * ```
 *
 * @since 1.0.0
 */
import { v4 as uuidv4 } from 'uuid';
import { IAsyncContext, IContextData } from './async-context.interface';

/**
 * 核心异步上下文实现
 */
export class CoreAsyncContext implements IAsyncContext {
  private readonly _id: string;
  private readonly _createdAt: Date;
  private _data: IContextData;
  private _expiresAt?: Date;

  constructor(data: Partial<IContextData> = {}) {
    this._id = uuidv4();
    this._createdAt = new Date();
    this._data = {
      ...data,
      createdAt: this._createdAt,
    };
  }

  /**
   * 获取上下文数据
   */
  public getData(): IContextData {
    return { ...this._data };
  }

  /**
   * 设置上下文数据
   */
  public setData(data: Partial<IContextData>): void {
    this._data = {
      ...this._data,
      ...data,
    };
  }

  /**
   * 获取指定键的值
   */
  public getValue<K extends keyof IContextData>(key: K): IContextData[K] {
    return this._data[key];
  }

  /**
   * 设置指定键的值
   */
  public setValue<K extends keyof IContextData>(
    key: K,
    value: IContextData[K],
  ): void {
    this._data[key] = value;
  }

  /**
   * 检查是否包含指定键
   */
  public hasValue<K extends keyof IContextData>(key: K): boolean {
    return key in this._data && this._data[key] !== undefined;
  }

  /**
   * 删除指定键
   */
  public removeValue<K extends keyof IContextData>(key: K): void {
    delete this._data[key];
  }

  /**
   * 清除所有数据
   */
  public clear(): void {
    this._data = {
      createdAt: this._createdAt,
    };
  }

  /**
   * 克隆上下文
   */
  public clone(): IAsyncContext {
    const cloned = new CoreAsyncContext(this._data);
    if (this._expiresAt) {
      cloned.setExpiresAt(this._expiresAt);
    }
    return cloned;
  }

  /**
   * 合并上下文数据
   */
  public merge(other: IAsyncContext): void {
    const otherData = other.getData();
    this._data = {
      ...this._data,
      ...otherData,
      // 保持当前上下文的创建时间
      createdAt: this._createdAt,
    };
  }

  /**
   * 检查上下文是否有效
   */
  public isValid(): boolean {
    return !this.isExpired();
  }

  /**
   * 获取上下文标识符
   */
  public getId(): string {
    return this._id;
  }

  /**
   * 获取上下文创建时间
   */
  public getCreatedAt(): Date {
    return this._createdAt;
  }

  /**
   * 获取上下文过期时间
   */
  public getExpiresAt(): Date | undefined {
    return this._expiresAt;
  }

  /**
   * 检查上下文是否已过期
   */
  public isExpired(): boolean {
    if (!this._expiresAt) {
      return false;
    }
    return new Date() > this._expiresAt;
  }

  /**
   * 设置过期时间
   */
  public setExpiresAt(expiresAt: Date): void {
    this._expiresAt = expiresAt;
  }

  /**
   * 获取自定义数据
   */
  public getCustomData(key: string): unknown {
    return this._data.customData?.[key];
  }

  /**
   * 设置自定义数据
   */
  public setCustomData(key: string, value: unknown): void {
    if (!this._data.customData) {
      this._data.customData = {};
    }
    this._data.customData[key] = value;
  }

  /**
   * 删除自定义数据
   */
  public removeCustomData(key: string): void {
    if (this._data.customData) {
      delete this._data.customData[key];
    }
  }

  /**
   * 获取所有自定义数据
   */
  public getAllCustomData(): Record<string, unknown> {
    return this._data.customData ? { ...this._data.customData } : {};
  }

  /**
   * 转换为 JSON 表示
   */
  public toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      createdAt: this._createdAt.toISOString(),
      expiresAt: this._expiresAt?.toISOString(),
      data: this._data,
      customData: this.getAllCustomData(),
    };
  }

  /**
   * 转换为字符串表示
   */
  public toString(): string {
    return JSON.stringify(this.toJSON());
  }

  /**
   * 获取租户标识符
   */
  public getTenantId(): string | undefined {
    return this.getValue('tenantId');
  }

  /**
   * 设置租户标识符
   */
  public setTenantId(tenantId: string): void {
    this.setValue('tenantId', tenantId);
  }

  /**
   * 获取用户标识符
   */
  public getUserId(): string | undefined {
    return this.getValue('userId');
  }

  /**
   * 设置用户标识符
   */
  public setUserId(userId: string): void {
    this.setValue('userId', userId);
  }

  /**
   * 获取组织标识符
   */
  public getOrganizationId(): string | undefined {
    return this.getValue('organizationId');
  }

  /**
   * 设置组织标识符
   */
  public setOrganizationId(organizationId: string): void {
    this.setValue('organizationId', organizationId);
  }

  /**
   * 获取部门标识符
   */
  public getDepartmentId(): string | undefined {
    return this.getValue('departmentId');
  }

  /**
   * 设置部门标识符
   */
  public setDepartmentId(departmentId: string): void {
    this.setValue('departmentId', departmentId);
  }

  /**
   * 获取请求标识符
   */
  public getRequestId(): string | undefined {
    return this.getValue('requestId');
  }

  /**
   * 设置请求标识符
   */
  public setRequestId(requestId: string): void {
    this.setValue('requestId', requestId);
  }

  /**
   * 获取关联标识符
   */
  public getCorrelationId(): string | undefined {
    return this.getValue('correlationId');
  }

  /**
   * 设置关联标识符
   */
  public setCorrelationId(correlationId: string): void {
    this.setValue('correlationId', correlationId);
  }

  /**
   * 获取原因标识符
   */
  public getCausationId(): string | undefined {
    return this.getValue('causationId');
  }

  /**
   * 设置原因标识符
   */
  public setCausationId(causationId: string): void {
    this.setValue('causationId', causationId);
  }

  /**
   * 获取用户代理
   */
  public getUserAgent(): string | undefined {
    return this.getValue('userAgent');
  }

  /**
   * 设置用户代理
   */
  public setUserAgent(userAgent: string): void {
    this.setValue('userAgent', userAgent);
  }

  /**
   * 获取 IP 地址
   */
  public getIpAddress(): string | undefined {
    return this.getValue('ipAddress');
  }

  /**
   * 设置 IP 地址
   */
  public setIpAddress(ipAddress: string): void {
    this.setValue('ipAddress', ipAddress);
  }

  /**
   * 获取请求来源
   */
  public getSource(): 'WEB' | 'API' | 'CLI' | 'SYSTEM' | undefined {
    return this.getValue('source');
  }

  /**
   * 设置请求来源
   */
  public setSource(source: 'WEB' | 'API' | 'CLI' | 'SYSTEM'): void {
    this.setValue('source', source);
  }

  /**
   * 获取语言设置
   */
  public getLocale(): string | undefined {
    return this.getValue('locale');
  }

  /**
   * 设置语言设置
   */
  public setLocale(locale: string): void {
    this.setValue('locale', locale);
  }

  /**
   * 获取时区设置
   */
  public getTimezone(): string | undefined {
    return this.getValue('timezone');
  }

  /**
   * 设置时区设置
   */
  public setTimezone(timezone: string): void {
    this.setValue('timezone', timezone);
  }

  /**
   * 检查是否为多租户上下文
   */
  public isMultiTenant(): boolean {
    return !!this.getTenantId();
  }

  /**
   * 检查是否为组织级别上下文
   */
  public isOrganizationLevel(): boolean {
    return !!this.getOrganizationId();
  }

  /**
   * 检查是否为部门级别上下文
   */
  public isDepartmentLevel(): boolean {
    return !!this.getDepartmentId();
  }

  /**
   * 检查是否为用户级别上下文
   */
  public isUserLevel(): boolean {
    return !!this.getUserId();
  }

  /**
   * 获取上下文级别
   */
  public getContextLevel():
    | 'TENANT'
    | 'ORGANIZATION'
    | 'DEPARTMENT'
    | 'USER'
    | 'PUBLIC' {
    if (this.isDepartmentLevel()) {
      return 'DEPARTMENT';
    }
    if (this.isOrganizationLevel()) {
      return 'ORGANIZATION';
    }
    if (this.isUserLevel()) {
      return 'USER';
    }
    if (this.isMultiTenant()) {
      return 'TENANT';
    }
    return 'PUBLIC';
  }

  /**
   * 获取上下文摘要
   */
  public getSummary(): {
    id: string;
    level: string;
    tenantId?: string;
    userId?: string;
    organizationId?: string;
    departmentId?: string;
    requestId?: string;
    source?: string;
    createdAt: string;
    expiresAt?: string;
    isValid: boolean;
  } {
    return {
      id: this._id,
      level: this.getContextLevel(),
      tenantId: this.getTenantId(),
      userId: this.getUserId(),
      organizationId: this.getOrganizationId(),
      departmentId: this.getDepartmentId(),
      requestId: this.getRequestId(),
      source: this.getSource(),
      createdAt: this._createdAt.toISOString(),
      expiresAt: this._expiresAt?.toISOString(),
      isValid: this.isValid(),
    };
  }
}
