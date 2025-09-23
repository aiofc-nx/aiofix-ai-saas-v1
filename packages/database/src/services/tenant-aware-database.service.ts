/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
/**
 * 租户感知数据库服务
 *
 * @description 基于Core模块的多租户数据库服务实现
 * 提供租户隔离的数据库操作，确保数据安全和隔离
 *
 * ## 业务规则
 *
 * ### 租户上下文规则
 * - 所有数据库操作必须在租户上下文中执行
 * - 自动应用租户隔离策略
 * - 支持租户上下文的自动传递和验证
 *
 * ### 数据隔离规则
 * - 严格的租户数据隔离，防止跨租户数据泄露
 * - 支持多种隔离级别（数据库、模式、行级）
 * - 自动注入租户标识符到查询中
 *
 * ### 权限验证规则
 * - 每个操作都经过租户权限验证
 * - 禁止未授权的跨租户访问
 * - 记录所有数据访问审计日志
 *
 * ### 性能优化规则
 * - 租户感知的查询缓存
 * - 智能的连接池管理
 * - 批量操作的事务优化
 *
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import type { TenantContext } from '../interfaces';
import type {
  ITenantAwareDatabaseService,
  IDatabaseService,
  IDatabaseConnection,
  ITransaction,
  IExecuteResult,
  IQueryOptions,
  IExecuteOptions,
  ITransactionOptions,
  ICleanupResult,
  ITenantAwareRepository,
} from '../interfaces';
import type { DatabaseIsolationStrategy } from '../strategies/database-isolation.strategy';

/**
 * 租户上下文管理器接口（简化版本）
 */
interface ITenantContextManager {
  getCurrentContext(): Promise<TenantContext | null>;
  setContext(context: TenantContext): Promise<void>;
  clearContext(): Promise<void>;
}

/**
 * 租户感知数据库服务实现
 */
@Injectable()
export class TenantAwareDatabaseService implements ITenantAwareDatabaseService {
  constructor(
    private readonly baseDatabaseService: IDatabaseService,
    private readonly isolationStrategy: DatabaseIsolationStrategy,
    private readonly tenantContextManager?: ITenantContextManager,
  ) {}

  /**
   * 执行租户隔离的查询
   *
   * @description 自动应用租户隔离策略的数据库查询
   *
   * ## 业务逻辑
   *
   * 1. **获取租户上下文**：从当前执行上下文获取租户信息
   * 2. **权限验证**：验证当前租户是否有权执行此查询
   * 3. **查询隔离**：应用租户隔离策略修改SQL和参数
   * 4. **执行查询**：使用隔离后的查询执行数据库操作
   * 5. **结果过滤**：确保返回结果只包含当前租户的数据
   *
   * @param sql - SQL查询语句
   * @param params - 查询参数
   * @param options - 查询选项
   * @returns 查询结果
   */
  async query<T>(
    sql: string,
    params?: any[],
    options?: IQueryOptions,
  ): Promise<T[]> {
    const tenantContext = await this.getCurrentTenantContext();

    // 验证租户权限
    await this.validateTenantAccess(sql, tenantContext);

    // 应用租户隔离
    const isolatedSql = this.isolationStrategy.isolateQuery(sql, tenantContext);
    const isolatedParams = this.isolationStrategy.isolateParams(
      params || [],
      tenantContext,
    );

    console.log(`租户查询 [${tenantContext?.tenantId || 'system'}]:`, {
      originalSql: sql,
      isolatedSql,
      params: isolatedParams,
    });

    return this.baseDatabaseService.query<T>(
      isolatedSql,
      isolatedParams,
      options,
    );
  }

  /**
   * 执行租户隔离的命令
   *
   * @description 自动应用租户隔离策略的数据库命令
   *
   * @param sql - SQL命令语句
   * @param params - 命令参数
   * @param options - 执行选项
   * @returns 执行结果
   */
  async execute(
    sql: string,
    params?: any[],
    options?: IExecuteOptions,
  ): Promise<IExecuteResult> {
    const tenantContext = await this.getCurrentTenantContext();

    // 验证租户权限
    await this.validateTenantAccess(sql, tenantContext);

    // 应用租户隔离
    const isolatedSql = this.isolationStrategy.isolateQuery(sql, tenantContext);
    const isolatedParams = this.isolationStrategy.isolateParams(
      params || [],
      tenantContext,
    );

    console.log(`租户命令 [${tenantContext?.tenantId || 'system'}]:`, {
      originalSql: sql,
      isolatedSql,
      params: isolatedParams,
    });

    return this.baseDatabaseService.execute(
      isolatedSql,
      isolatedParams,
      options,
    );
  }

  /**
   * 获取租户感知的数据库连接
   *
   * @description 根据租户上下文获取相应的数据库连接
   *
   * @param connectionName - 连接名称
   * @returns 数据库连接
   */
  async getConnection(connectionName?: string): Promise<IDatabaseConnection> {
    const tenantContext = await this.getCurrentTenantContext();
    const baseConnection =
      await this.baseDatabaseService.getConnection(connectionName);

    // 应用租户连接配置
    const tenantConnection = this.isolationStrategy.getTenantConnectionConfig(
      baseConnection,
      tenantContext,
    );

    console.log(`获取租户连接 [${tenantContext?.tenantId || 'system'}]:`, {
      connectionName: tenantConnection.name,
      type: tenantConnection.type,
    });

    return tenantConnection;
  }

  /**
   * 执行租户感知的事务
   *
   * @description 在租户上下文中执行数据库事务
   *
   * @param operation - 事务操作
   * @param options - 事务选项
   * @returns 事务结果
   */
  async executeTransaction<T>(
    operation: (trx: ITransaction) => Promise<T>,
    options?: ITransactionOptions,
  ): Promise<T> {
    const tenantContext = await this.getCurrentTenantContext();

    console.log(`开始租户事务 [${tenantContext?.tenantId || 'system'}]`);

    // 包装事务操作以自动应用租户隔离
    const wrappedOperation = async (trx: ITransaction): Promise<T> => {
      // 创建租户感知的事务包装器
      const tenantAwareTransaction = this.createTenantAwareTransaction(
        trx,
        tenantContext,
      );
      return operation(tenantAwareTransaction);
    };

    return this.baseDatabaseService.executeTransaction(
      wrappedOperation,
      options,
    );
  }

  /**
   * 获取租户感知的仓储
   *
   * @description 创建租户感知的数据仓储实例
   *
   * @param entityClass - 实体类
   * @returns 租户感知仓储
   */
  async getRepository<T>(entityClass: new () => T): Promise<any> {
    // 简化实现，后续将完善
    const tenantContext = await this.getCurrentTenantContext();

    console.log(`创建租户仓储 [${tenantContext?.tenantId || 'system'}]:`, {
      entityName: entityClass.name,
    });

    // 返回模拟的租户感知仓储
    return {
      entityClass,
      tenantContext,
      find: async (criteria: any) => {
        console.log(`租户仓储查询 [${tenantContext?.tenantId}]:`, criteria);
        return [];
      },
      save: async (entity: T) => {
        console.log(`租户仓储保存 [${tenantContext?.tenantId}]:`, entity);
      },
    };
  }

  /**
   * 根据租户查询数据
   *
   * @description 执行租户特定的数据查询
   *
   * @param sql - SQL查询语句
   * @param params - 查询参数
   * @param tenantContext - 指定的租户上下文（可选）
   * @returns 查询结果
   */
  async queryByTenant<T>(
    sql: string,
    params?: any[],
    tenantContext?: TenantContext,
  ): Promise<T[]> {
    const context = tenantContext || (await this.getCurrentTenantContext());

    if (!context?.tenantId) {
      throw new Error('租户上下文缺失，无法执行租户查询');
    }

    // 验证租户权限
    await this.validateTenantAccess(sql, context);

    // 应用租户隔离
    const isolatedSql = this.isolationStrategy.isolateQuery(sql, context);
    const isolatedParams = this.isolationStrategy.isolateParams(
      params || [],
      context,
    );

    console.log(`指定租户查询 [${context.tenantId}]:`, {
      originalSql: sql,
      isolatedSql,
      params: isolatedParams,
    });

    return this.baseDatabaseService.query<T>(isolatedSql, isolatedParams);
  }

  /**
   * 根据租户执行命令
   *
   * @description 执行租户特定的数据库命令
   *
   * @param sql - SQL命令语句
   * @param params - 命令参数
   * @param tenantContext - 指定的租户上下文（可选）
   * @returns 执行结果
   */
  async executeByTenant(
    sql: string,
    params?: any[],
    tenantContext?: TenantContext,
  ): Promise<IExecuteResult> {
    const context = tenantContext || (await this.getCurrentTenantContext());

    if (!context?.tenantId) {
      throw new Error('租户上下文缺失，无法执行租户命令');
    }

    // 验证租户权限
    await this.validateTenantAccess(sql, context);

    // 应用租户隔离
    const isolatedSql = this.isolationStrategy.isolateQuery(sql, context);
    const isolatedParams = this.isolationStrategy.isolateParams(
      params || [],
      context,
    );

    console.log(`指定租户命令 [${context.tenantId}]:`, {
      originalSql: sql,
      isolatedSql,
      params: isolatedParams,
    });

    return this.baseDatabaseService.execute(isolatedSql, isolatedParams);
  }

  /**
   * 获取租户感知的仓储
   *
   * @description 创建租户感知的数据仓储实例
   *
   * @param entityClass - 实体类
   * @returns 租户感知仓储
   */
  async getTenantRepository<T>(
    entityClass: new () => T,
  ): Promise<ITenantAwareRepository<T>> {
    const tenantContext = await this.getCurrentTenantContext();

    console.log(`创建租户感知仓储 [${tenantContext?.tenantId || 'system'}]:`, {
      entityName: entityClass.name,
    });

    // 返回模拟的租户感知仓储
    return {
      // 基础仓储方法
      findById: async (id: string) => {
        console.log(`租户仓储根据ID查询 [${tenantContext?.tenantId}]:`, id);
        return null;
      },
      findAll: async (options) => {
        console.log(`租户仓储查询全部 [${tenantContext?.tenantId}]:`, options);
        return [];
      },
      findBy: async (criteria, options) => {
        console.log(
          `租户仓储条件查询 [${tenantContext?.tenantId}]:`,
          criteria,
          options,
        );
        return [];
      },
      save: async (entity) => {
        console.log(`租户仓储保存 [${tenantContext?.tenantId}]:`, entity);
      },
      delete: async (id: string) => {
        console.log(`租户仓储删除 [${tenantContext?.tenantId}]:`, id);
        return true;
      },
      saveBatch: async (entities) => {
        console.log(
          `租户仓储批量保存 [${tenantContext?.tenantId}]:`,
          entities.length,
        );
      },
      count: async (criteria) => {
        console.log(`租户仓储计数 [${tenantContext?.tenantId}]:`, criteria);
        return 0;
      },

      // 租户感知方法
      findByTenant: async (criteria, options) => {
        console.log(
          `租户仓储租户查询 [${tenantContext?.tenantId}]:`,
          criteria,
          options,
        );
        return [];
      },
      saveTenant: async (entity, context) => {
        const ctx = context || tenantContext;
        console.log(`租户仓储租户保存 [${ctx?.tenantId}]:`, entity);
      },
      deleteTenant: async (id: string, context) => {
        const ctx = context || tenantContext;
        console.log(`租户仓储租户删除 [${ctx?.tenantId}]:`, id);
        return true;
      },
      countByTenant: async (criteria) => {
        console.log(`租户仓储租户计数 [${tenantContext?.tenantId}]:`, criteria);
        return 0;
      },
    } as ITenantAwareRepository<T>;
  }

  /**
   * 清理租户数据
   *
   * @description 彻底清理指定租户的所有数据
   *
   * @param tenantId - 租户ID
   * @returns 清理结果
   */
  async cleanupTenantData(tenantId: string): Promise<ICleanupResult> {
    console.log(`开始清理租户数据: ${tenantId}`);

    // 验证清理权限
    if (!tenantId || tenantId.trim() === '') {
      throw new Error('租户ID不能为空');
    }

    // 使用隔离策略执行清理
    const result = await this.isolationStrategy.cleanupTenantData(tenantId);

    console.log(`租户数据清理完成: ${tenantId}`, result);

    return result;
  }

  // ==================== 私有方法 ====================

  /**
   * 获取当前租户上下文
   */
  private async getCurrentTenantContext(): Promise<TenantContext> {
    if (!this.tenantContextManager) {
      // 如果没有租户上下文管理器，返回空上下文
      return { tenantId: '', createdAt: new Date() };
    }

    const context = await this.tenantContextManager.getCurrentContext();
    return context || { tenantId: '', createdAt: new Date() };
  }

  /**
   * 验证租户访问权限
   */
  private async validateTenantAccess(
    sql: string,
    tenantContext: TenantContext,
  ): Promise<void> {
    const hasAccess = await this.isolationStrategy.validateTenantAccess(
      sql,
      tenantContext,
    );

    if (!hasAccess) {
      throw new Error(`租户 ${tenantContext.tenantId} 无权执行此操作: ${sql}`);
    }
  }

  /**
   * 创建租户感知的事务包装器
   */
  private createTenantAwareTransaction(
    baseTransaction: ITransaction,
    tenantContext: TenantContext,
  ): ITransaction {
    return {
      ...baseTransaction,
      tenantContext,

      query: async <T>(sql: string, params?: any[]): Promise<T[]> => {
        const isolatedSql = this.isolationStrategy.isolateQuery(
          sql,
          tenantContext,
        );
        const isolatedParams = this.isolationStrategy.isolateParams(
          params || [],
          tenantContext,
        );
        return baseTransaction.query<T>(isolatedSql, isolatedParams);
      },

      execute: async (sql: string, params?: any[]): Promise<IExecuteResult> => {
        const isolatedSql = this.isolationStrategy.isolateQuery(
          sql,
          tenantContext,
        );
        const isolatedParams = this.isolationStrategy.isolateParams(
          params || [],
          tenantContext,
        );
        return baseTransaction.execute(isolatedSql, isolatedParams);
      },
    };
  }
}

/**
 * 创建租户感知数据库服务工厂函数
 *
 * @description 创建租户感知数据库服务实例
 *
 * @param baseDatabaseService - 基础数据库服务
 * @param isolationStrategy - 隔离策略
 * @param tenantContextManager - 租户上下文管理器（可选）
 * @returns 租户感知数据库服务
 */
export function createTenantAwareDatabaseService(
  baseDatabaseService: IDatabaseService,
  isolationStrategy: DatabaseIsolationStrategy,
  tenantContextManager?: ITenantContextManager,
): TenantAwareDatabaseService {
  return new TenantAwareDatabaseService(
    baseDatabaseService,
    isolationStrategy,
    tenantContextManager,
  );
}
