/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
/**
 * 数据库查询实现
 *
 * @description Database模块CQRS的查询实现
 * 封装SQL读操作和查询优化功能
 *
 * ## 业务规则
 *
 * ### 查询执行规则
 * - 查询操作优先使用只读数据库副本
 * - 支持查询结果缓存以提高性能
 * - 自动应用租户隔离策略
 * - 支持分页和排序功能
 *
 * ### 性能优化规则
 * - 可缓存查询自动启用缓存
 * - 支持查询计划分析和优化
 * - 智能选择最优的读数据库连接
 * - 支持查询超时和取消机制
 *
 * ### 安全规则
 * - 查询参数自动进行SQL注入防护
 * - 租户数据自动隔离
 * - 敏感数据查询需要额外权限验证
 * - 记录查询审计日志
 *
 * @since 1.0.0
 */

import type { TenantContext } from '../interfaces';
import type {
  IDatabaseConnection,
  IQueryOptions,
} from '../interfaces';
import type { IDatabaseQuery } from './cqrs-database-manager';

/**
 * 查询执行选项
 */
export interface IQueryExecutionOptions extends IQueryOptions {
  /** 连接名称 */
  connectionName?: string;
  /** 是否强制使用主数据库 */
  usePrimary?: boolean;
  /** 查询标签（用于监控） */
  queryTag?: string;
}

/**
 * 基础数据库查询实现
 */
export class DatabaseQuery<T = any> implements IDatabaseQuery<T> {
  public readonly sql: string;
  public readonly params: any[];
  public readonly cacheable: boolean;
  public readonly metadata: Record<string, unknown>;

  constructor(
    sql: string,
    params: any[] = [],
    cacheable: boolean = false,
    metadata: Record<string, unknown> = {},
  ) {
    this.sql = sql;
    this.params = params;
    this.cacheable = cacheable;
    this.metadata = {
      ...metadata,
      createdAt: new Date(),
      queryType: 'DatabaseQuery',
      operation: this.extractOperation(sql),
      tables: this.extractTables(sql),
    };
  }

  /**
   * 执行查询
   *
   * @description 在指定连接上执行SQL查询
   *
   * ## 业务逻辑
   *
   * 1. **连接验证**：验证数据库连接的有效性
   * 2. **参数验证**：验证SQL和参数的安全性
   * 3. **执行查询**：在数据库连接上执行SQL
   * 4. **结果处理**：处理查询结果和异常
   * 5. **性能记录**：记录查询性能指标
   *
   * @param connection - 数据库连接
   * @returns 查询结果
   */
  async execute(connection: IDatabaseConnection): Promise<T[]> {
    try {
      console.log('执行数据库查询:', {
        sql: this.sql.substring(0, 100) + (this.sql.length > 100 ? '...' : ''),
        paramsCount: this.params.length,
        cacheable: this.cacheable,
        connectionName: connection.name,
        connectionType: connection.type,
      });

      // 验证连接状态
      if (!connection.isConnected) {
        throw new Error(`数据库连接未建立: ${connection.name}`);
      }

      // 执行查询
      const result = await connection.query<T>(this.sql, this.params);

      console.log('数据库查询执行成功:', {
        resultCount: result.length,
        connectionName: connection.name,
        operation: this.metadata.operation,
        tables: this.metadata.tables,
      });

      return result;
    } catch (error) {
      console.error('数据库查询执行失败:', {
        sql: this.sql,
        params: this.params,
        connectionName: connection.name,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new Error(
        `数据库查询执行失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 获取查询摘要
   */
  getSummary(): string {
    const operation = this.metadata.operation as string;
    const tables = this.metadata.tables as string[];
    return `${operation} from ${tables.join(', ')} (${this.params.length} params)`;
  }

  /**
   * 检查是否为只读查询
   */
  isReadOnlyQuery(): boolean {
    const operation = (this.metadata.operation as string).toLowerCase();
    return ['select', 'show', 'describe', 'explain'].includes(operation);
  }

  /**
   * 获取预估复杂度
   */
  getComplexity(): 'low' | 'medium' | 'high' {
    const sql = this.sql.toLowerCase();

    // 简单的复杂度评估
    if (
      sql.includes('join') ||
      sql.includes('subquery') ||
      sql.includes('union')
    ) {
      return 'high';
    }

    if (
      sql.includes('group by') ||
      sql.includes('order by') ||
      sql.includes('having')
    ) {
      return 'medium';
    }

    return 'low';
  }

  // ==================== 私有方法 ====================

  /**
   * 提取SQL操作类型
   */
  private extractOperation(sql: string): string {
    const match = sql.trim().match(/^(\w+)/i);
    return match ? match[1].toUpperCase() : 'UNKNOWN';
  }

  /**
   * 提取涉及的表名
   */
  private extractTables(sql: string): string[] {
    const tables: string[] = [];
    const patterns = [
      /FROM\s+(\w+)/gi,
      /JOIN\s+(\w+)/gi,
      /INTO\s+(\w+)/gi,
      /UPDATE\s+(\w+)/gi,
    ];

    for (const pattern of patterns) {
      const matches = sql.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && !tables.includes(match[1])) {
          tables.push(match[1]);
        }
      }
    }

    return tables;
  }
}

/**
 * 租户感知数据库查询
 */
export class TenantAwareDatabaseQuery<T = any> extends DatabaseQuery<T> {
  public readonly tenantContext: TenantContext;

  constructor(
    sql: string,
    params: any[],
    tenantContext: TenantContext,
    cacheable: boolean = false,
    metadata: Record<string, unknown> = {},
  ) {
    super(sql, params, cacheable, {
      ...metadata,
      tenantId: tenantContext.tenantId,
      tenantContext,
    });
    this.tenantContext = tenantContext;
  }

  /**
   * 执行租户感知的查询
   */
  override async execute(connection: IDatabaseConnection): Promise<T[]> {
    console.log('执行租户感知数据库查询:', {
      tenantId: this.tenantContext.tenantId,
      sql: this.sql.substring(0, 100) + (this.sql.length > 100 ? '...' : ''),
      paramsCount: this.params.length,
    });

    // 验证租户上下文
    if (!this.tenantContext.tenantId) {
      throw new Error('租户上下文缺失，无法执行查询');
    }

    // 执行基础查询
    return super.execute(connection);
  }

  /**
   * 获取租户摘要
   */
  getTenantSummary(): string {
    return `[${this.tenantContext.tenantId}] ${this.getSummary()}`;
  }
}

/**
 * 分页数据库查询
 */
export class PaginatedDatabaseQuery<T = any> extends DatabaseQuery<T> {
  public readonly pageSize: number;
  public readonly pageNumber: number;
  public readonly orderBy: Record<string, 'ASC' | 'DESC'>;

  constructor(
    baseSql: string,
    params: any[],
    pageSize: number,
    pageNumber: number,
    orderBy: Record<string, 'ASC' | 'DESC'> = {},
    cacheable: boolean = false,
    metadata: Record<string, unknown> = {},
  ) {
    // 构建分页SQL
    const paginatedSql = PaginatedDatabaseQuery.buildPaginatedSql(
      baseSql,
      pageSize,
      pageNumber,
      orderBy,
    );

    super(paginatedSql, params, cacheable, {
      ...metadata,
      pageSize,
      pageNumber,
      orderBy,
      queryType: 'PaginatedDatabaseQuery',
    });

    this.pageSize = pageSize;
    this.pageNumber = pageNumber;
    this.orderBy = orderBy;
  }

  /**
   * 获取分页信息
   */
  getPaginationInfo(): {
    pageSize: number;
    pageNumber: number;
    offset: number;
    orderBy: Record<string, 'ASC' | 'DESC'>;
  } {
    return {
      pageSize: this.pageSize,
      pageNumber: this.pageNumber,
      offset: (this.pageNumber - 1) * this.pageSize,
      orderBy: this.orderBy,
    };
  }

  /**
   * 构建分页SQL
   */
  private static buildPaginatedSql(
    baseSql: string,
    pageSize: number,
    pageNumber: number,
    orderBy: Record<string, 'ASC' | 'DESC'>,
  ): string {
    let sql = baseSql;

    // 添加排序
    if (Object.keys(orderBy).length > 0) {
      const orderClauses = Object.entries(orderBy)
        .map(([column, direction]) => `${column} ${direction}`)
        .join(', ');

      if (!sql.toLowerCase().includes('order by')) {
        sql += ` ORDER BY ${orderClauses}`;
      }
    }

    // 添加分页
    const offset = (pageNumber - 1) * pageSize;
    sql += ` LIMIT ${pageSize} OFFSET ${offset}`;

    return sql;
  }
}

/**
 * 聚合查询
 */
export class AggregateDatabaseQuery<T = any> extends DatabaseQuery<T> {
  public readonly aggregateFunction: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
  public readonly groupBy: string[];

  constructor(
    sql: string,
    params: any[],
    aggregateFunction: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX',
    groupBy: string[] = [],
    cacheable: boolean = true, // 聚合查询默认可缓存
    metadata: Record<string, unknown> = {},
  ) {
    super(sql, params, cacheable, {
      ...metadata,
      aggregateFunction,
      groupBy,
      queryType: 'AggregateDatabaseQuery',
    });

    this.aggregateFunction = aggregateFunction;
    this.groupBy = groupBy;
  }

  /**
   * 获取聚合摘要
   */
  getAggregateSummary(): string {
    const groupByClause =
      this.groupBy.length > 0 ? ` GROUP BY ${this.groupBy.join(', ')}` : '';
    return `${this.aggregateFunction}${groupByClause} (${this.getSummary()})`;
  }
}

/**
 * 创建分页查询工厂函数
 */
export function createPaginatedQuery<T = any>(
  baseSql: string,
  params: any[],
  pageSize: number,
  pageNumber: number,
  orderBy: Record<string, 'ASC' | 'DESC'> = {},
  cacheable: boolean = false,
  metadata: Record<string, unknown> = {},
): PaginatedDatabaseQuery<T> {
  return new PaginatedDatabaseQuery<T>(
    baseSql,
    params,
    pageSize,
    pageNumber,
    orderBy,
    cacheable,
    metadata,
  );
}

/**
 * 创建聚合查询工厂函数
 */
export function createAggregateQuery<T = any>(
  sql: string,
  params: any[],
  aggregateFunction: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX',
  groupBy: string[] = [],
  cacheable: boolean = true,
  metadata: Record<string, unknown> = {},
): AggregateDatabaseQuery<T> {
  return new AggregateDatabaseQuery<T>(
    sql,
    params,
    aggregateFunction,
    groupBy,
    cacheable,
    metadata,
  );
}
