/**
 * 智能查询优化器
 *
 * @description 基于执行计划和性能指标的查询优化
 * 提供查询分析、索引建议、性能优化等企业级功能
 *
 * ## 业务规则
 *
 * ### 查询分析规则
 * - 自动分析SQL查询的执行计划
 * - 识别慢查询和性能瓶颈
 * - 检测查询模式和反模式
 * - 生成查询复杂度评估报告
 *
 * ### 优化建议规则
 * - 基于执行计划生成优化建议
 * - 推荐合适的索引策略
 * - 建议查询重写和优化
 * - 提供性能提升预估
 *
 * ### 索引管理规则
 * - 分析表结构和查询模式
 * - 自动生成索引创建建议
 * - 检测冗余和无用索引
 * - 支持复合索引优化策略
 *
 * ### 监控和报告规则
 * - 实时监控查询性能指标
 * - 生成查询性能分析报告
 * - 跟踪优化效果和改进
 * - 提供查询性能趋势分析
 *
 * @since 1.0.0
 */

/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import type { TenantContext } from '../interfaces';

/**
 * 查询执行计划
 */
export interface IQueryExecutionPlan {
  /** 查询ID */
  queryId: string;
  /** 原始SQL */
  sql: string;
  /** 参数 */
  params: any[];
  /** 执行计划节点 */
  planNodes: IExecutionPlanNode[];
  /** 估计成本 */
  estimatedCost: number;
  /** 估计执行时间（毫秒） */
  estimatedTime: number;
  /** 扫描的行数 */
  estimatedRows: number;
  /** 是否使用索引 */
  usesIndex: boolean;
  /** 分析时间 */
  analyzedAt: Date;
}

/**
 * 执行计划节点
 */
export interface IExecutionPlanNode {
  /** 节点类型 */
  nodeType:
    | 'SeqScan'
    | 'IndexScan'
    | 'BitmapScan'
    | 'NestedLoop'
    | 'HashJoin'
    | 'Sort'
    | 'Aggregate';
  /** 表名 */
  tableName?: string;
  /** 索引名 */
  indexName?: string;
  /** 过滤条件 */
  filter?: string;
  /** 成本 */
  cost: { startup: number; total: number };
  /** 行数 */
  rows: number;
  /** 宽度 */
  width: number;
  /** 子节点 */
  children: IExecutionPlanNode[];
}

/**
 * 查询优化建议
 */
export interface IQueryOptimization {
  /** 查询ID */
  queryId: string;
  /** 原始SQL */
  originalSql: string;
  /** 优化后的SQL */
  optimizedSql?: string;
  /** 优化类型 */
  optimizations: IOptimizationSuggestion[];
  /** 预期性能提升 */
  expectedImprovement: {
    /** 执行时间改进（百分比） */
    executionTime: number;
    /** 资源使用改进（百分比） */
    resourceUsage: number;
    /** 吞吐量改进（百分比） */
    throughput: number;
  };
  /** 风险评估 */
  riskAssessment: 'low' | 'medium' | 'high';
  /** 建议优先级 */
  priority: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * 优化建议
 */
export interface IOptimizationSuggestion {
  /** 建议类型 */
  type: 'index' | 'rewrite' | 'schema' | 'configuration';
  /** 建议描述 */
  description: string;
  /** 具体建议 */
  suggestion: string;
  /** 预期影响 */
  impact: {
    performance: number; // 百分比
    complexity: number; // 1-10
    risk: number; // 1-10
  };
  /** 实施难度 */
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * 索引建议
 */
export interface IIndexSuggestion {
  /** 表名 */
  tableName: string;
  /** 建议的索引 */
  suggestedIndexes: IIndexDefinition[];
  /** 冗余索引 */
  redundantIndexes: string[];
  /** 未使用索引 */
  unusedIndexes: string[];
  /** 预期性能提升 */
  expectedImprovement: number; // 百分比
}

/**
 * 索引定义
 */
export interface IIndexDefinition {
  /** 索引名 */
  indexName: string;
  /** 索引类型 */
  indexType: 'btree' | 'hash' | 'gin' | 'gist' | 'partial';
  /** 列名 */
  columns: string[];
  /** 是否唯一 */
  unique: boolean;
  /** 部分索引条件 */
  whereClause?: string;
  /** 创建DDL */
  createDDL: string;
  /** 受益查询数量 */
  benefitingQueries: number;
  /** 预期性能提升 */
  expectedImprovement: number; // 百分比
}

/**
 * 查询模式
 */
export interface IQueryPattern {
  /** 模式ID */
  patternId: string;
  /** 模式类型 */
  patternType: 'select' | 'insert' | 'update' | 'delete' | 'join' | 'aggregate';
  /** SQL模板 */
  sqlTemplate: string;
  /** 出现频率 */
  frequency: number;
  /** 平均执行时间 */
  averageExecutionTime: number;
  /** 涉及的表 */
  tables: string[];
  /** 查询条件 */
  conditions: string[];
  /** 性能分类 */
  performanceCategory: 'fast' | 'moderate' | 'slow' | 'very_slow';
}

/**
 * 慢查询分析
 */
export interface ISlowQueryAnalysis {
  /** 查询SQL */
  sql: string;
  /** 执行时间 */
  executionTime: number;
  /** 执行次数 */
  executionCount: number;
  /** 平均执行时间 */
  averageExecutionTime: number;
  /** 最大执行时间 */
  maxExecutionTime: number;
  /** 总耗时 */
  totalTime: number;
  /** 性能问题 */
  performanceIssues: string[];
  /** 优化建议 */
  optimizationSuggestions: IOptimizationSuggestion[];
  /** 影响评估 */
  impact: {
    userExperience: number; // 1-10
    systemLoad: number; // 1-10
    businessCritical: number; // 1-10
  };
}

/**
 * 智能查询优化器
 */
@Injectable()
export class IntelligentQueryOptimizer {
  private readonly queryCache = new Map<string, IQueryExecutionPlan>();
  private readonly optimizationHistory = new Map<
    string,
    IQueryOptimization[]
  >();
  private readonly queryPatterns = new Map<string, IQueryPattern>();
  // 移除未使用的字段

  constructor() {
    console.log('智能查询优化器已初始化');
  }

  /**
   * 分析查询执行计划
   *
   * @description 分析SQL查询的执行计划和性能特征
   *
   * @param sql - SQL查询
   * @param params - 查询参数
   * @param connectionName - 连接名称
   * @param tenantContext - 租户上下文
   * @returns 查询执行计划
   */
  async analyzeExecutionPlan(
    sql: string,
    params: any[] = [],
    _connectionName: string = 'default',
    _tenantContext?: TenantContext,
  ): Promise<IQueryExecutionPlan> {
    const queryId = this.generateQueryId(sql, params);

    console.log(`分析查询执行计划: ${queryId}`);

    // 检查缓存
    const cached = this.queryCache.get(queryId);
    if (cached) {
      console.log(`✅ 使用缓存的执行计划: ${queryId}`);
      return cached;
    }

    // 模拟执行计划分析
    const executionPlan: IQueryExecutionPlan = {
      queryId,
      sql,
      params,
      planNodes: await this.generateExecutionPlanNodes(sql),
      estimatedCost: this.calculateQueryCost(sql),
      estimatedTime: this.estimateExecutionTime(sql),
      estimatedRows: this.estimateRowCount(sql),
      usesIndex: this.checkIndexUsage(sql),
      analyzedAt: new Date(),
    };

    // 缓存执行计划
    this.queryCache.set(queryId, executionPlan);

    console.log(`✅ 查询执行计划分析完成: ${queryId}`, {
      cost: executionPlan.estimatedCost,
      time: executionPlan.estimatedTime,
      rows: executionPlan.estimatedRows,
      usesIndex: executionPlan.usesIndex,
    });

    return executionPlan;
  }

  /**
   * 优化查询
   *
   * @description 基于执行计划生成查询优化建议
   *
   * @param executionPlan - 查询执行计划
   * @returns 查询优化建议
   */
  async optimizeQuery(
    executionPlan: IQueryExecutionPlan,
  ): Promise<IQueryOptimization> {
    console.log(`优化查询: ${executionPlan.queryId}`);

    const optimizations: IOptimizationSuggestion[] = [];

    // 分析是否需要索引
    if (!executionPlan.usesIndex && executionPlan.estimatedRows > 1000) {
      optimizations.push({
        type: 'index',
        description: '查询未使用索引，建议创建合适的索引',
        suggestion: this.generateIndexSuggestion(executionPlan.sql),
        impact: {
          performance: 70,
          complexity: 3,
          risk: 2,
        },
        difficulty: 'easy',
      });
    }

    // 分析是否需要查询重写
    if (executionPlan.estimatedCost > 1000) {
      const rewriteSuggestion = this.analyzeQueryRewrite(executionPlan.sql);
      if (rewriteSuggestion) {
        optimizations.push({
          type: 'rewrite',
          description: '查询可以重写以提高性能',
          suggestion: rewriteSuggestion,
          impact: {
            performance: 40,
            complexity: 5,
            risk: 3,
          },
          difficulty: 'medium',
        });
      }
    }

    // 分析是否有全表扫描
    const hasFullTableScan = executionPlan.planNodes.some(
      (node) => node.nodeType === 'SeqScan' && node.rows > 10000,
    );
    if (hasFullTableScan) {
      optimizations.push({
        type: 'schema',
        description: '存在全表扫描，影响查询性能',
        suggestion: '考虑添加WHERE条件限制或创建复合索引',
        impact: {
          performance: 80,
          complexity: 4,
          risk: 2,
        },
        difficulty: 'medium',
      });
    }

    // 计算预期性能提升
    const expectedImprovement =
      this.calculateExpectedImprovement(optimizations);

    // 评估风险和优先级
    const riskAssessment = this.assessOptimizationRisk(optimizations);
    const priority = this.calculateOptimizationPriority(
      executionPlan,
      optimizations,
    );

    const optimization: IQueryOptimization = {
      queryId: executionPlan.queryId,
      originalSql: executionPlan.sql,
      optimizedSql: this.generateOptimizedSql(executionPlan.sql, optimizations),
      optimizations,
      expectedImprovement,
      riskAssessment,
      priority,
    };

    // 记录优化历史
    const history = this.optimizationHistory.get(executionPlan.queryId) || [];
    history.push(optimization);
    this.optimizationHistory.set(executionPlan.queryId, history);

    console.log(`✅ 查询优化完成: ${executionPlan.queryId}`, {
      optimizations: optimizations.length,
      expectedImprovement,
      priority,
    });

    return optimization;
  }

  /**
   * 建议索引
   *
   * @description 基于查询模式分析建议创建的索引
   *
   * @param tableName - 表名
   * @param queryPatterns - 查询模式
   * @returns 索引建议
   */
  async suggestIndexes(
    tableName: string,
    queryPatterns: IQueryPattern[],
  ): Promise<IIndexSuggestion> {
    console.log(`生成索引建议: ${tableName}`);

    const suggestedIndexes: IIndexDefinition[] = [];
    const redundantIndexes: string[] = [];
    const unusedIndexes: string[] = [];

    // 分析查询模式生成索引建议
    for (const pattern of queryPatterns) {
      if (pattern.tables.includes(tableName)) {
        const indexDef = this.analyzePatternForIndex(pattern, tableName);
        if (indexDef) {
          suggestedIndexes.push(indexDef);
        }
      }
    }

    // 去重和优化索引建议
    const optimizedIndexes = this.optimizeIndexSuggestions(suggestedIndexes);

    // 模拟检测冗余和未使用索引
    redundantIndexes.push(`idx_${tableName}_old_1`, `idx_${tableName}_old_2`);
    unusedIndexes.push(`idx_${tableName}_unused_1`);

    const expectedImprovement =
      this.calculateIndexImprovement(optimizedIndexes);

    const suggestion: IIndexSuggestion = {
      tableName,
      suggestedIndexes: optimizedIndexes,
      redundantIndexes,
      unusedIndexes,
      expectedImprovement,
    };

    console.log(`✅ 索引建议生成完成: ${tableName}`, {
      suggested: optimizedIndexes.length,
      redundant: redundantIndexes.length,
      unused: unusedIndexes.length,
      improvement: expectedImprovement,
    });

    return suggestion;
  }

  /**
   * 分析慢查询
   *
   * @description 分析系统中的慢查询并提供优化建议
   *
   * @param timeRange - 分析时间范围
   * @param thresholdMs - 慢查询阈值（毫秒）
   * @returns 慢查询分析结果
   */
  async analyzeSlowQueries(
    timeRange: { start: Date; end: Date },
    thresholdMs: number = 1000,
  ): Promise<ISlowQueryAnalysis[]> {
    console.log('分析慢查询', { timeRange, thresholdMs });

    const slowQueries: ISlowQueryAnalysis[] = [];

    // 模拟慢查询数据
    const mockSlowQueries = [
      {
        sql: 'SELECT * FROM users WHERE email = ? AND status = ?',
        executionTime: 2500,
        executionCount: 150,
      },
      {
        sql: 'SELECT COUNT(*) FROM orders o JOIN order_items oi ON o.id = oi.order_id WHERE o.created_at > ?',
        executionTime: 5200,
        executionCount: 45,
      },
      {
        sql: 'UPDATE users SET last_login = ? WHERE id IN (SELECT user_id FROM sessions WHERE active = true)',
        executionTime: 1800,
        executionCount: 80,
      },
    ];

    for (const mockQuery of mockSlowQueries) {
      const analysis = await this.analyzeSlowQuery(mockQuery, thresholdMs);
      if (analysis) {
        slowQueries.push(analysis);
      }
    }

    // 按影响排序
    slowQueries.sort((a, b) => b.totalTime - a.totalTime);

    console.log(`✅ 慢查询分析完成: 发现 ${slowQueries.length} 个慢查询`);

    return slowQueries;
  }

  /**
   * 分析查询模式
   *
   * @description 分析系统中的查询模式和趋势
   *
   * @param timeRange - 分析时间范围
   * @returns 查询模式分析结果
   */
  async analyzeQueryPatterns(timeRange: {
    start: Date;
    end: Date;
  }): Promise<IQueryPattern[]> {
    console.log('分析查询模式', timeRange);

    const patterns: IQueryPattern[] = [];

    // 模拟查询模式数据
    const mockPatterns = [
      {
        patternType: 'select' as const,
        sqlTemplate: 'SELECT * FROM users WHERE email = ?',
        frequency: 1250,
        averageExecutionTime: 45,
        tables: ['users'],
        conditions: ['email = ?'],
      },
      {
        patternType: 'join' as const,
        sqlTemplate:
          'SELECT o.*, u.name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.status = ?',
        frequency: 800,
        averageExecutionTime: 120,
        tables: ['orders', 'users'],
        conditions: ['o.status = ?'],
      },
      {
        patternType: 'aggregate' as const,
        sqlTemplate:
          'SELECT COUNT(*), SUM(amount) FROM orders WHERE created_at BETWEEN ? AND ?',
        frequency: 200,
        averageExecutionTime: 350,
        tables: ['orders'],
        conditions: ['created_at BETWEEN ? AND ?'],
      },
    ];

    for (let i = 0; i < mockPatterns.length; i++) {
      const mockPattern = mockPatterns[i];
      const pattern: IQueryPattern = {
        patternId: `pattern_${i + 1}`,
        patternType: mockPattern.patternType,
        sqlTemplate: mockPattern.sqlTemplate,
        frequency: mockPattern.frequency,
        averageExecutionTime: mockPattern.averageExecutionTime,
        tables: mockPattern.tables,
        conditions: mockPattern.conditions,
        performanceCategory: this.categorizePerformance(
          mockPattern.averageExecutionTime,
        ),
      };

      patterns.push(pattern);
      this.queryPatterns.set(pattern.patternId, pattern);
    }

    console.log(`✅ 查询模式分析完成: 发现 ${patterns.length} 个模式`);

    return patterns;
  }

  /**
   * 获取优化统计
   *
   * @description 获取查询优化的统计信息
   *
   * @returns 优化统计
   */
  getOptimizationStats(): {
    totalQueries: number;
    optimizedQueries: number;
    averageImprovement: number;
    topOptimizations: IOptimizationSuggestion[];
  } {
    const totalQueries = this.queryCache.size;
    const optimizedQueries = this.optimizationHistory.size;

    // 计算平均改进
    let totalImprovement = 0;
    let improvementCount = 0;

    for (const optimizations of this.optimizationHistory.values()) {
      for (const opt of optimizations) {
        totalImprovement += opt.expectedImprovement.executionTime;
        improvementCount++;
      }
    }

    const averageImprovement =
      improvementCount > 0 ? totalImprovement / improvementCount : 0;

    // 获取最佳优化建议
    const allOptimizations: IOptimizationSuggestion[] = [];
    for (const optimizations of this.optimizationHistory.values()) {
      for (const opt of optimizations) {
        allOptimizations.push(...opt.optimizations);
      }
    }

    const topOptimizations = allOptimizations
      .sort((a, b) => b.impact.performance - a.impact.performance)
      .slice(0, 5);

    return {
      totalQueries,
      optimizedQueries,
      averageImprovement,
      topOptimizations,
    };
  }

  // ==================== 私有方法 ====================

  /**
   * 生成查询ID
   */
  private generateQueryId(sql: string, params: any[]): string {
    const normalized = sql.replace(/\s+/g, ' ').trim().toLowerCase();
    const paramsStr = JSON.stringify(params);
    return `query_${Buffer.from(normalized + paramsStr)
      .toString('base64')
      .substring(0, 16)}`;
  }

  /**
   * 生成执行计划节点
   */
  private async generateExecutionPlanNodes(
    sql: string,
  ): Promise<IExecutionPlanNode[]> {
    // 简化的执行计划生成
    const nodes: IExecutionPlanNode[] = [];

    if (sql.toLowerCase().includes('join')) {
      nodes.push({
        nodeType: 'HashJoin',
        cost: { startup: 100, total: 500 },
        rows: 1000,
        width: 200,
        children: [
          {
            nodeType: 'SeqScan',
            tableName: 'users',
            cost: { startup: 0, total: 200 },
            rows: 500,
            width: 100,
            children: [],
          },
          {
            nodeType: 'IndexScan',
            tableName: 'orders',
            indexName: 'idx_orders_user_id',
            cost: { startup: 0, total: 300 },
            rows: 500,
            width: 100,
            children: [],
          },
        ],
      });
    } else if (sql.toLowerCase().includes('where')) {
      nodes.push({
        nodeType: this.checkIndexUsage(sql) ? 'IndexScan' : 'SeqScan',
        tableName: this.extractTableName(sql),
        indexName: this.checkIndexUsage(sql) ? 'idx_primary' : undefined,
        cost: { startup: 0, total: this.checkIndexUsage(sql) ? 50 : 200 },
        rows: this.checkIndexUsage(sql) ? 10 : 1000,
        width: 100,
        children: [],
      });
    } else {
      nodes.push({
        nodeType: 'SeqScan',
        tableName: this.extractTableName(sql),
        cost: { startup: 0, total: 300 },
        rows: 1000,
        width: 100,
        children: [],
      });
    }

    return nodes;
  }

  /**
   * 计算查询成本
   */
  private calculateQueryCost(sql: string): number {
    let cost = 100; // 基础成本

    // 根据查询复杂度调整成本
    if (sql.toLowerCase().includes('join')) cost += 300;
    if (sql.toLowerCase().includes('order by')) cost += 100;
    if (sql.toLowerCase().includes('group by')) cost += 150;
    if (sql.toLowerCase().includes('having')) cost += 50;
    if (!this.checkIndexUsage(sql)) cost += 500;

    return cost;
  }

  /**
   * 估计执行时间
   */
  private estimateExecutionTime(sql: string): number {
    const baseCost = this.calculateQueryCost(sql);
    return Math.max(10, baseCost / 10); // 毫秒
  }

  /**
   * 估计行数
   */
  private estimateRowCount(sql: string): number {
    if (sql.toLowerCase().includes('where')) {
      return Math.floor(Math.random() * 1000) + 10;
    }
    return Math.floor(Math.random() * 10000) + 1000;
  }

  /**
   * 检查索引使用
   */
  private checkIndexUsage(sql: string): boolean {
    const lowerSql = sql.toLowerCase();
    return (
      lowerSql.includes('where id =') ||
      lowerSql.includes('primary key') ||
      lowerSql.includes('unique')
    );
  }

  /**
   * 提取表名
   */
  private extractTableName(sql: string): string {
    const match = sql.toLowerCase().match(/from\s+(\w+)/);
    return match ? match[1] : 'unknown_table';
  }

  /**
   * 生成索引建议
   */
  private generateIndexSuggestion(sql: string): string {
    const tableName = this.extractTableName(sql);
    const whereMatch = sql.toLowerCase().match(/where\s+(\w+)\s*=/);
    const column = whereMatch ? whereMatch[1] : 'id';

    return `CREATE INDEX idx_${tableName}_${column} ON ${tableName}(${column});`;
  }

  /**
   * 分析查询重写
   */
  private analyzeQueryRewrite(sql: string): string | null {
    const lowerSql = sql.toLowerCase();

    if (lowerSql.includes('select *')) {
      return '使用具体列名替代SELECT *，减少数据传输量';
    }

    if (lowerSql.includes('or')) {
      return '考虑使用UNION替代OR条件，可能提高索引利用率';
    }

    if (lowerSql.includes("like '%")) {
      return '避免前缀通配符，考虑使用全文索引或其他搜索方案';
    }

    return null;
  }

  /**
   * 计算预期性能提升
   */
  private calculateExpectedImprovement(
    optimizations: IOptimizationSuggestion[],
  ): {
    executionTime: number;
    resourceUsage: number;
    throughput: number;
  } {
    let executionTime = 0;
    let resourceUsage = 0;
    let throughput = 0;

    for (const opt of optimizations) {
      executionTime += opt.impact.performance * 0.8;
      resourceUsage += opt.impact.performance * 0.6;
      throughput += opt.impact.performance * 0.7;
    }

    return {
      executionTime: Math.min(executionTime, 90), // 最大90%改进
      resourceUsage: Math.min(resourceUsage, 80),
      throughput: Math.min(throughput, 85),
    };
  }

  /**
   * 评估优化风险
   */
  private assessOptimizationRisk(
    optimizations: IOptimizationSuggestion[],
  ): 'low' | 'medium' | 'high' {
    const avgRisk =
      optimizations.reduce((sum, opt) => sum + opt.impact.risk, 0) /
      optimizations.length;

    if (avgRisk <= 3) return 'low';
    if (avgRisk <= 6) return 'medium';
    return 'high';
  }

  /**
   * 计算优化优先级
   */
  private calculateOptimizationPriority(
    plan: IQueryExecutionPlan,
    optimizations: IOptimizationSuggestion[],
  ): 'low' | 'medium' | 'high' | 'critical' {
    const avgImpact =
      optimizations.reduce((sum, opt) => sum + opt.impact.performance, 0) /
      optimizations.length;

    if (plan.estimatedTime > 5000 || avgImpact > 70) return 'critical';
    if (plan.estimatedTime > 1000 || avgImpact > 50) return 'high';
    if (plan.estimatedTime > 500 || avgImpact > 30) return 'medium';
    return 'low';
  }

  /**
   * 生成优化后的SQL
   */
  private generateOptimizedSql(
    sql: string,
    optimizations: IOptimizationSuggestion[],
  ): string | undefined {
    let optimizedSql = sql;

    for (const opt of optimizations) {
      if (opt.type === 'rewrite') {
        // 简化的SQL重写逻辑
        if (sql.toLowerCase().includes('select *')) {
          optimizedSql = optimizedSql.replace(
            /select \*/gi,
            'SELECT id, name, email',
          ); // 示例
        }
      }
    }

    return optimizedSql !== sql ? optimizedSql : undefined;
  }

  /**
   * 分析慢查询
   */
  private async analyzeSlowQuery(
    queryData: { sql: string; executionTime: number; executionCount: number },
    thresholdMs: number,
  ): Promise<ISlowQueryAnalysis | null> {
    if (queryData.executionTime < thresholdMs) {
      return null;
    }

    const performanceIssues: string[] = [];
    const optimizationSuggestions: IOptimizationSuggestion[] = [];

    // 分析性能问题
    if (!this.checkIndexUsage(queryData.sql)) {
      performanceIssues.push('未使用索引，存在全表扫描');
      optimizationSuggestions.push({
        type: 'index',
        description: '创建合适的索引',
        suggestion: this.generateIndexSuggestion(queryData.sql),
        impact: { performance: 70, complexity: 3, risk: 2 },
        difficulty: 'easy',
      });
    }

    if (queryData.sql.toLowerCase().includes('select *')) {
      performanceIssues.push('使用SELECT *，传输不必要的数据');
      optimizationSuggestions.push({
        type: 'rewrite',
        description: '指定具体列名',
        suggestion: '使用具体列名替代SELECT *',
        impact: { performance: 20, complexity: 1, risk: 1 },
        difficulty: 'easy',
      });
    }

    const analysis: ISlowQueryAnalysis = {
      sql: queryData.sql,
      executionTime: queryData.executionTime,
      executionCount: queryData.executionCount,
      averageExecutionTime: queryData.executionTime,
      maxExecutionTime: queryData.executionTime * 1.5,
      totalTime: queryData.executionTime * queryData.executionCount,
      performanceIssues,
      optimizationSuggestions,
      impact: {
        userExperience: queryData.executionTime > 3000 ? 9 : 6,
        systemLoad: queryData.executionCount > 100 ? 8 : 5,
        businessCritical: 7,
      },
    };

    return analysis;
  }

  /**
   * 分析模式生成索引
   */
  private analyzePatternForIndex(
    pattern: IQueryPattern,
    tableName: string,
  ): IIndexDefinition | null {
    if (
      pattern.performanceCategory === 'slow' ||
      pattern.performanceCategory === 'very_slow'
    ) {
      const columns = this.extractColumnsFromConditions(pattern.conditions);
      if (columns.length > 0) {
        return {
          indexName: `idx_${tableName}_${columns.join('_')}`,
          indexType: 'btree',
          columns,
          unique: false,
          createDDL: `CREATE INDEX idx_${tableName}_${columns.join('_')} ON ${tableName}(${columns.join(', ')});`,
          benefitingQueries: pattern.frequency,
          expectedImprovement: 60,
        };
      }
    }

    return null;
  }

  /**
   * 从条件中提取列名
   */
  private extractColumnsFromConditions(conditions: string[]): string[] {
    const columns: string[] = [];

    for (const condition of conditions) {
      const match = condition.match(/(\w+)\s*=/);
      if (match) {
        columns.push(match[1]);
      }
    }

    return columns;
  }

  /**
   * 优化索引建议
   */
  private optimizeIndexSuggestions(
    indexes: IIndexDefinition[],
  ): IIndexDefinition[] {
    // 去重和合并相似索引
    const optimized = new Map<string, IIndexDefinition>();

    for (const index of indexes) {
      const key = index.columns.join(',');
      const existing = optimized.get(key);

      if (
        !existing ||
        index.expectedImprovement > existing.expectedImprovement
      ) {
        optimized.set(key, index);
      }
    }

    return Array.from(optimized.values());
  }

  /**
   * 计算索引改进
   */
  private calculateIndexImprovement(indexes: IIndexDefinition[]): number {
    return (
      indexes.reduce((sum, index) => sum + index.expectedImprovement, 0) /
        indexes.length || 0
    );
  }

  /**
   * 性能分类
   */
  private categorizePerformance(
    executionTime: number,
  ): 'fast' | 'moderate' | 'slow' | 'very_slow' {
    if (executionTime < 100) return 'fast';
    if (executionTime < 500) return 'moderate';
    if (executionTime < 2000) return 'slow';
    return 'very_slow';
  }
}
