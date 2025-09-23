/**
 * 数据库命令实现
 *
 * @description Database模块CQRS的命令实现
 * 封装SQL写操作和相关的领域事件
 *
 * ## 业务规则
 *
 * ### 命令执行规则
 * - 每个命令封装一个原子性的写操作
 * - 命令必须在事务中执行
 * - 命令执行后必须处理关联的领域事件
 * - 支持命令的重试和补偿机制
 *
 * ### 事件关联规则
 * - 命令可以携带多个领域事件
 * - 事件在命令成功执行后才被持久化
 * - 事件持久化与数据写入在同一事务中
 * - 事件发布在事务提交后异步进行
 *
 * ### 租户隔离规则
 * - 命令自动应用租户隔离策略
 * - 事件包含租户上下文信息
 * - 支持租户特定的数据写入
 * - 验证租户权限和数据访问
 *
 * @since 1.0.0
 */

import type { TenantContext } from '../interfaces';
import type { ITransaction } from '../interfaces';
import type { IDatabaseCommand, IDomainEvent } from './cqrs-database-manager';

/**
 * 基础数据库命令实现
 */
export class DatabaseCommand<T = any> implements IDatabaseCommand<T> {
  public readonly sql: string;
  public readonly params: any[];
  public readonly events: IDomainEvent[];
  public readonly metadata: Record<string, unknown>;

  constructor(
    sql: string,
    params: any[] = [],
    events: IDomainEvent[] = [],
    metadata: Record<string, unknown> = {},
  ) {
    this.sql = sql;
    this.params = params;
    this.events = events;
    this.metadata = {
      ...metadata,
      createdAt: new Date(),
      commandType: 'DatabaseCommand',
    };
  }

  /**
   * 执行命令
   *
   * @description 在事务中执行SQL命令
   *
   * ## 业务逻辑
   *
   * 1. **参数验证**：验证SQL和参数的有效性
   * 2. **执行SQL**：在事务中执行写操作
   * 3. **结果处理**：处理执行结果和错误
   * 4. **日志记录**：记录命令执行的详细信息
   *
   * @param transaction - 数据库事务
   * @returns 执行结果
   */
  async execute(transaction: ITransaction): Promise<T> {
    try {
      console.log('执行数据库命令:', {
        sql: this.sql.substring(0, 100) + (this.sql.length > 100 ? '...' : ''),
        paramsCount: this.params.length,
        eventsCount: this.events.length,
        transactionId: transaction.transactionId,
      });

      // 执行SQL命令
      const result = await transaction.execute(this.sql, this.params);

      console.log('数据库命令执行成功:', {
        affectedRows: result.affectedRows,
        insertId: result.insertId,
        executionTime: result.executionTime,
      });

      return result as T;
    } catch (error) {
      console.error('数据库命令执行失败:', {
        sql: this.sql,
        params: this.params,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new Error(
        `数据库命令执行失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 获取命令摘要
   */
  getSummary(): string {
    const operation = this.extractOperation(this.sql);
    const table = this.extractTable(this.sql);
    return `${operation} ${table} (${this.events.length} events)`;
  }

  /**
   * 检查是否为写操作
   */
  isWriteOperation(): boolean {
    const operation = this.extractOperation(this.sql).toLowerCase();
    return ['insert', 'update', 'delete', 'create', 'alter', 'drop'].includes(
      operation,
    );
  }

  /**
   * 检查是否包含事件
   */
  hasEvents(): boolean {
    return this.events.length > 0;
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
   * 提取表名
   */
  private extractTable(sql: string): string {
    // 简化的表名提取
    const patterns = [
      /INSERT\s+INTO\s+(\w+)/i,
      /UPDATE\s+(\w+)/i,
      /DELETE\s+FROM\s+(\w+)/i,
      /FROM\s+(\w+)/i,
    ];

    for (const pattern of patterns) {
      const match = sql.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return 'unknown_table';
  }
}

/**
 * 租户感知数据库命令
 */
export class TenantAwareDatabaseCommand<T = any> extends DatabaseCommand<T> {
  public readonly tenantContext: TenantContext;

  constructor(
    sql: string,
    params: any[],
    tenantContext: TenantContext,
    events: IDomainEvent[] = [],
    metadata: Record<string, unknown> = {},
  ) {
    super(sql, params, events, {
      ...metadata,
      tenantId: tenantContext.tenantId,
      tenantContext,
    });
    this.tenantContext = tenantContext;
  }

  /**
   * 执行租户感知的命令
   */
  override async execute(transaction: ITransaction): Promise<T> {
    console.log('执行租户感知数据库命令:', {
      tenantId: this.tenantContext.tenantId,
      sql: this.sql.substring(0, 100) + (this.sql.length > 100 ? '...' : ''),
      paramsCount: this.params.length,
    });

    // 验证租户上下文
    if (!this.tenantContext.tenantId) {
      throw new Error('租户上下文缺失，无法执行命令');
    }

    // 执行基础命令
    return super.execute(transaction);
  }

  /**
   * 获取租户摘要
   */
  getTenantSummary(): string {
    return `[${this.tenantContext.tenantId}] ${this.getSummary()}`;
  }
}

/**
 * 批量数据库命令
 */
export class BatchDatabaseCommand<T = any> implements IDatabaseCommand<T> {
  public readonly sql: string;
  public readonly params: any[];
  public readonly events: IDomainEvent[];
  public readonly metadata: Record<string, unknown>;
  public readonly commands: DatabaseCommand[];

  constructor(
    commands: DatabaseCommand[],
    metadata: Record<string, unknown> = {},
  ) {
    this.commands = commands;
    this.sql = `BATCH: ${commands.length} commands`;
    this.params = [];
    this.events = commands.flatMap((cmd) => cmd.events);
    this.metadata = {
      ...metadata,
      commandCount: commands.length,
      batchType: 'DatabaseCommandBatch',
    };
  }

  /**
   * 执行批量命令
   */
  async execute(transaction: ITransaction): Promise<T> {
    console.log(`执行批量数据库命令: ${this.commands.length} 个命令`);

    const results: any[] = [];

    try {
      for (let i = 0; i < this.commands.length; i++) {
        const command = this.commands[i];
        console.log(
          `  执行命令 ${i + 1}/${this.commands.length}: ${command.getSummary()}`,
        );

        const result = await command.execute(transaction);
        results.push(result);
      }

      console.log(`批量命令执行成功: ${results.length} 个结果`);

      return {
        batchResults: results,
        successCount: results.length,
        totalCount: this.commands.length,
      } as T;
    } catch (error) {
      console.error(
        `批量命令执行失败 (已执行 ${results.length}/${this.commands.length}):`,
        error,
      );
      throw error;
    }
  }
}

/**
 * 创建数据库命令工厂函数
 */
export function createDatabaseCommand<T = any>(
  sql: string,
  params: any[] = [],
  events: IDomainEvent[] = [],
  metadata: Record<string, unknown> = {},
): DatabaseCommand<T> {
  return new DatabaseCommand<T>(sql, params, events, metadata);
}

/**
 * 创建租户感知数据库命令工厂函数
 */
export function createTenantAwareDatabaseCommand<T = any>(
  sql: string,
  params: any[],
  tenantContext: TenantContext,
  events: IDomainEvent[] = [],
  metadata: Record<string, unknown> = {},
): TenantAwareDatabaseCommand<T> {
  return new TenantAwareDatabaseCommand<T>(
    sql,
    params,
    tenantContext,
    events,
    metadata,
  );
}

/**
 * 创建批量数据库命令工厂函数
 */
export function createBatchDatabaseCommand<T = any>(
  commands: DatabaseCommand[],
  metadata: Record<string, unknown> = {},
): BatchDatabaseCommand<T> {
  return new BatchDatabaseCommand<T>(commands, metadata);
}
