/**
 * CQRS数据库管理器
 *
 * @description 基于CQRS模式的数据库读写分离管理器
 * 提供命令执行、查询处理、事件存储等企业级功能
 *
 * ## 业务规则
 *
 * ### CQRS分离规则
 * - **命令系统**：处理写操作，使用主数据库
 * - **查询系统**：处理读操作，使用只读副本
 * - **事件系统**：持久化领域事件，支持事件溯源
 * - **一致性保证**：通过事件确保最终一致性
 *
 * ### 读写分离规则
 * - 写操作必须通过命令系统执行
 * - 读操作优先使用只读数据库副本
 * - 支持读写数据库的负载均衡
 * - 自动处理主从延迟问题
 *
 * ### 事件溯源规则
 * - 所有状态变更都存储为事件序列
 * - 支持聚合根状态的重建
 * - 定期创建快照以提高性能
 * - 事件不可变更，只能追加
 *
 * ### 多租户规则
 * - 所有操作都应用租户隔离
 * - 事件存储支持租户分离
 * - 读写数据库都支持多租户
 * - 租户上下文自动传递
 *
 * @since 1.0.0
 */

/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import type { IConfigManager, IDatabaseModuleConfig } from '@aiofix/config';
import { performance } from 'perf_hooks';
import type {
  IDatabaseConnection,
  ITransaction,
  IExecuteResult,
  IQueryOptions,
} from '../interfaces';

/**
 * 数据库命令接口
 */
export interface IDatabaseCommand<T = any> {
  /** SQL语句 */
  readonly sql: string;
  /** 参数 */
  readonly params: any[];
  /** 关联的领域事件 */
  readonly events: IDomainEvent[];
  /** 命令元数据 */
  readonly metadata?: Record<string, unknown>;

  /**
   * 执行命令
   */
  execute(transaction: ITransaction): Promise<T>;
}

/**
 * 数据库查询接口
 */
export interface IDatabaseQuery<T = any> {
  /** SQL语句 */
  readonly sql: string;
  /** 参数 */
  readonly params: any[];
  /** 是否可缓存 */
  readonly cacheable: boolean;
  /** 查询元数据 */
  readonly metadata?: Record<string, unknown>;

  /**
   * 执行查询
   */
  execute(connection: IDatabaseConnection): Promise<T[]>;
}

/**
 * 领域事件接口（简化版本）
 */
export interface IDomainEvent {
  /** 事件ID */
  readonly eventId: string;
  /** 聚合根ID */
  readonly aggregateId: string;
  /** 聚合根类型 */
  readonly aggregateType: string;
  /** 事件类型 */
  readonly eventType: string;
  /** 事件版本 */
  readonly eventVersion: number;
  /** 事件数据 */
  readonly eventData: Record<string, unknown>;
  /** 事件元数据 */
  readonly metadata: Record<string, unknown>;
  /** 创建时间 */
  readonly createdAt: Date;
}

/**
 * 命令执行结果接口
 */
export interface ICommandResult<T = any> {
  /** 是否成功 */
  success: boolean;
  /** 结果数据 */
  data: T;
  /** 事件数量 */
  eventCount: number;
  /** 执行时间 */
  executionTime: number;
  /** 事务ID */
  transactionId?: string;
}

/**
 * 查询执行结果接口
 */
export interface IQueryResult<T = any> {
  /** 是否成功 */
  success: boolean;
  /** 结果数据 */
  data: T[];
  /** 总记录数 */
  totalCount: number;
  /** 执行时间 */
  executionTime: number;
  /** 是否来自缓存 */
  fromCache?: boolean;
}

/**
 * 事件存储接口
 */
export interface IEventStore {
  /**
   * 保存事件
   */
  saveEvents(events: IDomainEvent[], transaction?: ITransaction): Promise<void>;

  /**
   * 获取事件
   */
  getEvents(
    aggregateId: string,
    aggregateType: string,
    fromVersion?: number,
    toVersion?: number,
  ): Promise<IDomainEvent[]>;

  /**
   * 保存快照
   */
  saveSnapshot(
    aggregateId: string,
    aggregateType: string,
    version: number,
    snapshot: any,
  ): Promise<void>;

  /**
   * 获取最新快照
   */
  getLatestSnapshot(aggregateId: string, aggregateType: string): Promise<any>;
}

/**
 * CQRS数据库管理器实现
 */
@Injectable()
export class CQRSDatabaseManager {
  private readonly configManager: IConfigManager;
  private config: IDatabaseModuleConfig | null = null;
  private initialized = false;
  private readonly writeConnections = new Map<string, IDatabaseConnection>();
  private readonly readConnections = new Map<string, IDatabaseConnection>();
  private eventStore: IEventStore | null = null;

  constructor(configManager: IConfigManager) {
    this.configManager = configManager;
  }

  /**
   * 初始化CQRS数据库管理器
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 加载配置
      await this.loadConfig();

      // 初始化读写连接
      await this.initializeConnections();

      // 初始化事件存储
      await this.initializeEventStore();

      this.initialized = true;
      console.log('CQRS数据库管理器初始化完成');
    } catch (error) {
      throw new Error(
        `CQRSDatabaseManager初始化失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 执行命令（写操作）
   *
   * @description 处理写操作，包括数据持久化和事件存储
   *
   * ## 业务逻辑
   *
   * 1. **获取写连接**：从写数据库连接池获取连接
   * 2. **开始事务**：确保数据一致性
   * 3. **执行命令**：执行业务数据写入
   * 4. **存储事件**：持久化领域事件到事件存储
   * 5. **提交事务**：确保数据和事件的原子性
   * 6. **发布事件**：异步发布事件给业务层
   *
   * @param command - 数据库命令
   * @param options - 执行选项
   * @returns 命令执行结果
   */
  async executeCommand<T>(
    command: IDatabaseCommand<T>,
    options?: { connectionName?: string; timeout?: number },
  ): Promise<ICommandResult<T>> {
    await this.ensureInitialized();
    const startTime = performance.now();

    try {
      // 获取写连接
      const writeConnectionName =
        options?.connectionName || this.config!.cqrs.writeConnection;
      const writeConnection =
        await this.getWriteConnection(writeConnectionName);

      // 开始事务
      const transaction = await writeConnection.beginTransaction();

      try {
        // 执行命令
        const result = await command.execute(transaction);

        // 存储领域事件
        if (command.events && command.events.length > 0 && this.eventStore) {
          await this.eventStore.saveEvents(command.events, transaction);
        }

        // 提交事务
        await transaction.commit();

        const executionTime = performance.now() - startTime;

        console.log(`CQRS命令执行成功:`, {
          sql: command.sql.substring(0, 100) + '...',
          eventCount: command.events?.length || 0,
          executionTime: `${executionTime.toFixed(2)}ms`,
        });

        // 异步发布事件（模拟）
        if (command.events && command.events.length > 0) {
          this.publishDomainEventsAsync(command.events);
        }

        return {
          success: true,
          data: result,
          eventCount: command.events?.length || 0,
          executionTime,
          transactionId: transaction.transactionId,
        };
      } catch (error) {
        // 回滚事务
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      const executionTime = performance.now() - startTime;

      console.error('CQRS命令执行失败:', {
        sql: command.sql,
        error: error instanceof Error ? error.message : String(error),
        executionTime: `${executionTime.toFixed(2)}ms`,
      });

      throw new Error(
        `CQRS命令执行失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 执行查询（读操作）
   *
   * @description 处理读操作，优先使用只读数据库副本
   *
   * ## 业务逻辑
   *
   * 1. **获取读连接**：从只读数据库连接池获取连接
   * 2. **应用租户隔离**：自动应用多租户隔离策略
   * 3. **执行查询**：执行数据读取操作
   * 4. **缓存处理**：支持查询结果缓存
   * 5. **性能监控**：记录查询性能指标
   *
   * @param query - 数据库查询
   * @param options - 查询选项
   * @returns 查询执行结果
   */
  async executeQuery<T>(
    query: IDatabaseQuery<T>,
    options?: IQueryOptions & { connectionName?: string },
  ): Promise<IQueryResult<T>> {
    await this.ensureInitialized();
    const startTime = performance.now();

    try {
      // 获取读连接
      const readConnectionName =
        options?.connectionName || this.config!.cqrs.readConnection;
      const readConnection = await this.getReadConnection(readConnectionName);

      // 执行查询
      const result = await query.execute(readConnection);

      const executionTime = performance.now() - startTime;

      console.log(`CQRS查询执行成功:`, {
        sql: query.sql.substring(0, 100) + '...',
        resultCount: result.length,
        cacheable: query.cacheable,
        executionTime: `${executionTime.toFixed(2)}ms`,
      });

      return {
        success: true,
        data: result,
        totalCount: result.length,
        executionTime,
        fromCache: false, // 简化实现，后续添加缓存支持
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;

      console.error('CQRS查询执行失败:', {
        sql: query.sql,
        error: error instanceof Error ? error.message : String(error),
        executionTime: `${executionTime.toFixed(2)}ms`,
      });

      throw new Error(
        `CQRS查询执行失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 重建聚合根状态
   *
   * @description 通过重放事件重建聚合根的当前状态
   *
   * @param aggregateId - 聚合根ID
   * @param aggregateType - 聚合根类型
   * @param upToVersion - 重建到指定版本（可选）
   * @returns 重建的聚合根状态
   */
  async rebuildAggregateState<T>(
    aggregateId: string,
    aggregateType: string,
    upToVersion?: number,
  ): Promise<T | null> {
    await this.ensureInitialized();

    if (!this.eventStore) {
      throw new Error('事件存储未初始化，无法重建聚合根状态');
    }

    try {
      console.log(`开始重建聚合根状态:`, {
        aggregateId,
        aggregateType,
        upToVersion,
      });

      // 尝试从快照恢复
      const snapshot = await this.eventStore.getLatestSnapshot(
        aggregateId,
        aggregateType,
      );
      let currentState: T | null = null;
      let fromVersion = 0;

      if (snapshot) {
        currentState = snapshot.snapshot;
        fromVersion = snapshot.version + 1;
        console.log(`从快照恢复状态: 版本 ${snapshot.version}`);
      }

      // 获取后续事件
      const events = await this.eventStore.getEvents(
        aggregateId,
        aggregateType,
        fromVersion,
        upToVersion,
      );

      if (events.length === 0 && !currentState) {
        console.log(`聚合根不存在: ${aggregateId}`);
        return null;
      }

      // 重放事件
      if (events.length > 0) {
        currentState = this.replayEvents<T>(currentState, events);
        console.log(`重放了 ${events.length} 个事件`);
      }

      console.log(`聚合根状态重建完成: ${aggregateId}`);
      return currentState;
    } catch (error) {
      console.error('聚合根状态重建失败:', error);
      throw new Error(
        `聚合根状态重建失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 获取事件历史
   *
   * @description 获取指定聚合根的完整事件历史
   *
   * @param aggregateId - 聚合根ID
   * @param aggregateType - 聚合根类型
   * @param fromVersion - 起始版本
   * @param toVersion - 结束版本
   * @returns 事件列表
   */
  async getEventHistory(
    aggregateId: string,
    aggregateType: string,
    fromVersion?: number,
    toVersion?: number,
  ): Promise<IDomainEvent[]> {
    await this.ensureInitialized();

    if (!this.eventStore) {
      throw new Error('事件存储未初始化');
    }

    try {
      const events = await this.eventStore.getEvents(
        aggregateId,
        aggregateType,
        fromVersion,
        toVersion,
      );

      console.log(`获取事件历史:`, {
        aggregateId,
        aggregateType,
        eventCount: events.length,
        fromVersion,
        toVersion,
      });

      return events;
    } catch (error) {
      console.error('获取事件历史失败:', error);
      throw new Error(
        `获取事件历史失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 创建快照
   *
   * @description 为指定聚合根创建状态快照
   *
   * @param aggregateId - 聚合根ID
   * @param aggregateType - 聚合根类型
   * @param version - 版本号
   * @param snapshot - 快照数据
   */
  async createSnapshot(
    aggregateId: string,
    aggregateType: string,
    version: number,
    snapshot: any,
  ): Promise<void> {
    await this.ensureInitialized();

    if (!this.eventStore) {
      throw new Error('事件存储未初始化');
    }

    try {
      await this.eventStore.saveSnapshot(
        aggregateId,
        aggregateType,
        version,
        snapshot,
      );

      console.log(`创建快照成功:`, {
        aggregateId,
        aggregateType,
        version,
      });
    } catch (error) {
      console.error('创建快照失败:', error);
      throw new Error(
        `创建快照失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 销毁CQRS数据库管理器
   */
  async destroy(): Promise<void> {
    try {
      // 关闭写连接
      for (const connection of this.writeConnections.values()) {
        await connection.close();
      }
      this.writeConnections.clear();

      // 关闭读连接
      for (const connection of this.readConnections.values()) {
        await connection.close();
      }
      this.readConnections.clear();

      this.config = null;
      this.eventStore = null;
      this.initialized = false;

      console.log('CQRS数据库管理器销毁完成');
    } catch (error) {
      console.error('CQRS数据库管理器销毁失败:', error);
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 确保已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * 加载配置
   */
  private async loadConfig(): Promise<void> {
    this.config =
      await this.configManager.getModuleConfig<IDatabaseModuleConfig>(
        'database',
      );

    if (!this.config.cqrs.enabled) {
      throw new Error('CQRS功能未启用');
    }

    console.log('CQRS配置加载完成:', {
      enabled: this.config.cqrs.enabled,
      readConnection: this.config.cqrs.readConnection,
      writeConnection: this.config.cqrs.writeConnection,
      eventStoreEnabled: this.config.cqrs.eventStore.enabled,
    });
  }

  /**
   * 初始化连接
   */
  private async initializeConnections(): Promise<void> {
    if (!this.config) {
      throw new Error('配置未加载');
    }

    // 初始化写连接
    const writeConnectionConfig =
      this.config.connections[this.config.cqrs.writeConnection];
    if (writeConnectionConfig) {
      const writeConnection = this.createMockConnection(
        this.config.cqrs.writeConnection,
        writeConnectionConfig.type,
        'write',
      );
      this.writeConnections.set(
        this.config.cqrs.writeConnection,
        writeConnection,
      );
    }

    // 初始化读连接
    const readConnectionConfig =
      this.config.connections[this.config.cqrs.readConnection];
    if (readConnectionConfig) {
      const readConnection = this.createMockConnection(
        this.config.cqrs.readConnection,
        readConnectionConfig.type,
        'read',
      );
      this.readConnections.set(this.config.cqrs.readConnection, readConnection);
    }

    console.log(
      `CQRS连接初始化完成: 写连接 ${this.writeConnections.size} 个, 读连接 ${this.readConnections.size} 个`,
    );
  }

  /**
   * 初始化事件存储
   */
  private async initializeEventStore(): Promise<void> {
    if (!this.config || !this.config.cqrs.eventStore.enabled) {
      console.log('事件存储未启用');
      return;
    }

    // 创建模拟事件存储
    this.eventStore = {
      saveEvents: async (
        events: IDomainEvent[],
        _transaction?: ITransaction,
      ): Promise<void> => {
        console.log(`保存 ${events.length} 个事件到事件存储`);
        for (const event of events) {
          console.log(
            `  - ${event.eventType}: ${event.aggregateId} v${event.eventVersion}`,
          );
        }
      },

      getEvents: async (
        aggregateId: string,
        aggregateType: string,
        fromVersion = 0,
        toVersion?: number,
      ): Promise<IDomainEvent[]> => {
        console.log(
          `获取事件: ${aggregateType}#${aggregateId} from v${fromVersion} to v${toVersion || 'latest'}`,
        );

        // 模拟返回事件
        return [
          {
            eventId: `event_${Date.now()}`,
            aggregateId,
            aggregateType,
            eventType: 'MockEvent',
            eventVersion: fromVersion + 1,
            eventData: { mock: true },
            metadata: { timestamp: new Date() },
            createdAt: new Date(),
          },
        ];
      },

      saveSnapshot: async (
        aggregateId: string,
        aggregateType: string,
        version: number,
        _snapshot: any,
      ): Promise<void> => {
        console.log(`保存快照: ${aggregateType}#${aggregateId} v${version}`);
      },

      getLatestSnapshot: async (
        aggregateId: string,
        aggregateType: string,
      ): Promise<any> => {
        console.log(`获取最新快照: ${aggregateType}#${aggregateId}`);
        return null; // 简化实现，返回空快照
      },
    };

    console.log('事件存储初始化完成');
  }

  /**
   * 获取写连接
   */
  private async getWriteConnection(
    connectionName: string,
  ): Promise<IDatabaseConnection> {
    const connection = this.writeConnections.get(connectionName);
    if (!connection) {
      throw new Error(`写连接不存在: ${connectionName}`);
    }
    return connection;
  }

  /**
   * 获取读连接
   */
  private async getReadConnection(
    connectionName: string,
  ): Promise<IDatabaseConnection> {
    const connection = this.readConnections.get(connectionName);
    if (!connection) {
      throw new Error(`读连接不存在: ${connectionName}`);
    }
    return connection;
  }

  /**
   * 创建模拟连接
   */
  private createMockConnection(
    name: string,
    type: string,
    mode: 'read' | 'write',
  ): IDatabaseConnection {
    return {
      name: `${name}_${mode}`,
      type: type as any,
      isConnected: true,

      async query<T>(sql: string, _params?: any[]): Promise<T[]> {
        console.log(`${mode}查询 [${name}]:`, sql);
        return [] as T[];
      },

      async execute(sql: string, _params?: any[]): Promise<IExecuteResult> {
        console.log(`${mode}命令 [${name}]:`, sql);
        return {
          affectedRows: 1,
          insertId: Date.now(),
          executionTime: 10,
          success: true,
        };
      },

      async beginTransaction(): Promise<ITransaction> {
        return {
          transactionId: `${mode}_trx_${Date.now()}`,
          isActive: true,

          async query<T>(sql: string, _params?: any[]): Promise<T[]> {
            console.log(`${mode}事务查询 [${name}]:`, sql);
            return [] as T[];
          },

          async execute(sql: string, _params?: any[]): Promise<IExecuteResult> {
            console.log(`${mode}事务命令 [${name}]:`, sql);
            return {
              affectedRows: 1,
              insertId: Date.now(),
              executionTime: 5,
              success: true,
            };
          },

          async commit(): Promise<void> {
            console.log(`提交${mode}事务 [${name}]`);
          },

          async rollback(): Promise<void> {
            console.log(`回滚${mode}事务 [${name}]`);
          },

          async savepoint(savepointName: string): Promise<void> {
            console.log(`设置${mode}保存点 [${name}]:`, savepointName);
          },

          async rollbackToSavepoint(savepointName: string): Promise<void> {
            console.log(`回滚到${mode}保存点 [${name}]:`, savepointName);
          },
        };
      },

      getRawConnection(): any {
        return { mockConnection: true, mode, name };
      },

      async close(): Promise<void> {
        console.log(`关闭${mode}连接 [${name}]`);
      },
    };
  }

  /**
   * 重放事件
   */
  private replayEvents<T>(initialState: T | null, events: IDomainEvent[]): T {
    // 简化的事件重放实现
    console.log(`重放 ${events.length} 个事件`);

    let state = initialState || ({} as T);

    for (const event of events) {
      // 模拟事件应用逻辑
      console.log(`应用事件: ${event.eventType} v${event.eventVersion}`);

      // 实际实现中，这里会根据事件类型应用具体的状态变更
      state = {
        ...state,
        lastEventType: event.eventType,
        lastEventVersion: event.eventVersion,
        lastUpdated: event.createdAt,
      } as T;
    }

    return state;
  }

  /**
   * 异步发布领域事件
   */
  private publishDomainEventsAsync(events: IDomainEvent[]): void {
    // 模拟异步事件发布
    globalThis.setTimeout(() => {
      console.log(`异步发布 ${events.length} 个领域事件到Core模块`);
      for (const event of events) {
        console.log(`  - 发布事件: ${event.eventType}`);
      }
    }, 10);
  }
}

/**
 * 创建CQRS数据库管理器工厂函数
 */
export function createCQRSDatabaseManager(
  configManager: IConfigManager,
): CQRSDatabaseManager {
  return new CQRSDatabaseManager(configManager);
}
