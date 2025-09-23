/**
 * 基础查询结果类
 *
 * 查询结果是 CQRS 模式中查询操作的返回值。
 * 封装了查询数据、分页信息、元数据等，提供标准的结果格式。
 *
 * ## 业务规则
 *
 * ### 分页规则
 * - 查询结果必须包含完整的分页信息
 * - 分页信息包括当前页、页大小、总记录数等
 * - 分页信息用于前端显示和导航
 *
 * ### 数据封装规则
 * - 查询结果封装了实际的业务数据
 * - 数据可以是单个对象或对象数组
 * - 数据应该经过适当的转换和格式化
 *
 * ### 元数据规则
 * - 查询结果包含必要的元数据
 * - 包括查询时间、缓存状态、数据来源等
 * - 元数据用于调试和监控
 *
 * ### 序列化规则
 * - 查询结果支持 JSON 序列化
 * - 序列化格式应该标准化
 * - 支持嵌套对象和数组的序列化
 *
 * @description 所有查询结果的基类，提供结果的一致行为
 * @example
 * ```typescript
 * class UserListResult extends BaseQueryResult<User> {
 *   constructor(
 *     users: User[],
 *     page: number,
 *     pageSize: number,
 *     totalCount: number
 *   ) {
 *     super(users, page, pageSize, totalCount);
 *   }
 *
 *   get queryType(): string {
 *     return 'UserList';
 *   }
 * }
 *
 * // 使用查询结果
 * const result = new UserListResult(users, 1, 10, 100);
 * console.log(result.getTotalCount()); // 100
 * console.log(result.getTotalPages()); // 10
 * console.log(result.hasNextPage()); // true
 * ```
 *
 * @since 1.0.0
 */
import { IPaginationInfo, IQueryResult } from './base-query';

export abstract class BaseQueryResult<TData = unknown> implements IQueryResult {
  private readonly _data: TData[];
  private readonly _paginationInfo: IPaginationInfo;
  private readonly _metadata: Record<string, unknown>;
  private readonly _createdAt: Date;

  /**
   * 构造函数
   *
   * @param data - 查询结果数据
   * @param page - 当前页码
   * @param pageSize - 页大小
   * @param totalCount - 总记录数
   * @param metadata - 额外的元数据
   */
  protected constructor(
    data: TData[],
    page: number,
    pageSize: number,
    totalCount: number,
    metadata: Record<string, unknown> = {},
  ) {
    this._data = [...data];
    this._createdAt = new Date();
    this._metadata = { ...metadata };

    // 计算分页信息
    const totalPages = Math.ceil(totalCount / pageSize);
    this._paginationInfo = {
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * 获取查询结果数据
   *
   * @returns 查询结果数据数组
   */
  public getData(): TData[] {
    return [...this._data];
  }

  /**
   * 获取分页信息
   *
   * @returns 分页信息
   */
  public getPaginationInfo(): IPaginationInfo {
    return { ...this._paginationInfo };
  }

  /**
   * 获取结果总数
   *
   * @returns 结果总数
   */
  public getTotalCount(): number {
    return this._paginationInfo.totalCount || 0;
  }

  /**
   * 获取总页数
   *
   * @returns 总页数
   */
  public getTotalPages(): number {
    return this._paginationInfo.totalPages || 0;
  }

  /**
   * 获取当前页码
   *
   * @returns 当前页码
   */
  public getPage(): number {
    return this._paginationInfo.page;
  }

  /**
   * 获取页大小
   *
   * @returns 页大小
   */
  public getPageSize(): number {
    return this._paginationInfo.pageSize;
  }

  /**
   * 检查是否有下一页
   *
   * @returns 如果有下一页则返回 true，否则返回 false
   */
  public hasNextPage(): boolean {
    return this._paginationInfo.hasNextPage || false;
  }

  /**
   * 检查是否有上一页
   *
   * @returns 如果有上一页则返回 true，否则返回 false
   */
  public hasPreviousPage(): boolean {
    return this._paginationInfo.hasPreviousPage || false;
  }

  /**
   * 获取结果创建时间
   *
   * @returns 结果创建时间
   */
  public getCreatedAt(): Date {
    return this._createdAt;
  }

  /**
   * 获取结果元数据
   *
   * @returns 结果元数据
   */
  public getMetadata(): Record<string, unknown> {
    return { ...this._metadata };
  }

  /**
   * 获取查询结果类型名称
   *
   * 子类必须重写此方法以返回具体的结果类型名称。
   *
   * @returns 结果类型名称
   */
  public abstract get resultType(): string;

  /**
   * 检查是否有数据
   *
   * @returns 如果有数据则返回 true，否则返回 false
   */
  public hasData(): boolean {
    return this._data.length > 0;
  }

  /**
   * 获取数据项数量
   *
   * @returns 数据项数量
   */
  public getItemCount(): number {
    return this._data.length;
  }

  /**
   * 获取第一个数据项
   *
   * @returns 第一个数据项，如果没有数据则返回 undefined
   */
  public getFirstItem(): TData | undefined {
    return this._data.length > 0 ? this._data[0] : undefined;
  }

  /**
   * 获取最后一个数据项
   *
   * @returns 最后一个数据项，如果没有数据则返回 undefined
   */
  public getLastItem(): TData | undefined {
    return this._data.length > 0
      ? this._data[this._data.length - 1]
      : undefined;
  }

  /**
   * 根据索引获取数据项
   *
   * @param index - 数据项索引
   * @returns 数据项，如果索引超出范围则返回 undefined
   */
  public getItemAt(index: number): TData | undefined {
    if (index < 0 || index >= this._data.length) {
      return undefined;
    }
    return this._data[index];
  }

  /**
   * 获取元数据值
   *
   * @param key - 元数据键
   * @returns 元数据值，如果不存在则返回 undefined
   */
  public getMetadataValue(key: string): unknown {
    return this._metadata[key];
  }

  /**
   * 检查是否包含指定的元数据键
   *
   * @param key - 元数据键
   * @returns 如果包含指定的元数据键则返回 true，否则返回 false
   */
  public hasMetadataKey(key: string): boolean {
    return key in this._metadata;
  }

  /**
   * 将查询结果转换为 JSON 表示
   *
   * @returns JSON 表示
   */
  public toJSON(): Record<string, unknown> {
    return {
      resultType: this.resultType,
      data: this._data,
      pagination: this._paginationInfo,
      metadata: this._metadata,
      createdAt: this._createdAt.toISOString(),
      itemCount: this.getItemCount(),
      hasData: this.hasData(),
    };
  }

  /**
   * 将查询结果转换为字符串表示
   *
   * @returns 字符串表示
   */
  public toString(): string {
    return `${this.resultType}(Items: ${this.getItemCount()}, Total: ${this.getTotalCount()}, Page: ${this.getPage()}/${this.getTotalPages()})`;
  }

  /**
   * 过滤数据
   *
   * 根据指定的条件过滤数据项。
   *
   * @param predicate - 过滤条件函数
   * @returns 过滤后的数据数组
   */
  public filter(predicate: (item: TData) => boolean): TData[] {
    return this._data.filter(predicate);
  }

  /**
   * 映射数据
   *
   * 将数据项映射为新的格式。
   *
   * @param mapper - 映射函数
   * @returns 映射后的数据数组
   */
  public map<U>(mapper: (item: TData) => U): U[] {
    return this._data.map(mapper);
  }

  /**
   * 查找数据项
   *
   * 根据指定的条件查找数据项。
   *
   * @param predicate - 查找条件函数
   * @returns 找到的数据项，如果没有找到则返回 undefined
   */
  public find(predicate: (item: TData) => boolean): TData | undefined {
    return this._data.find(predicate);
  }

  /**
   * 检查是否包含满足条件的数据项
   *
   * @param predicate - 检查条件函数
   * @returns 如果包含满足条件的数据项则返回 true，否则返回 false
   */
  public some(predicate: (item: TData) => boolean): boolean {
    return this._data.some(predicate);
  }

  /**
   * 检查是否所有数据项都满足条件
   *
   * @param predicate - 检查条件函数
   * @returns 如果所有数据项都满足条件则返回 true，否则返回 false
   */
  public every(predicate: (item: TData) => boolean): boolean {
    return this._data.every(predicate);
  }

  /**
   * 获取结果类型名称
   *
   * @returns 类型名称
   */
  public getTypeName(): string {
    return this.constructor.name;
  }
}
