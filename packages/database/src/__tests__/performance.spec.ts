/**
 * 数据库性能模块测试
 *
 * @description 测试数据库性能监控和优化功能
 *
 * @since 1.0.0
 */

import {
  IntelligentConnectionPoolManager,
  IntelligentQueryOptimizer,
  DatabasePerformanceMonitor,
} from '../performance';

describe('数据库性能模块', () => {
  describe('IntelligentConnectionPoolManager', () => {
    let connectionPoolManager: IntelligentConnectionPoolManager;

    beforeEach(() => {
      connectionPoolManager = new IntelligentConnectionPoolManager();
    });

    describe('连接池管理功能', () => {
      it('应该能够获取数据库连接', async () => {
        const config = {
          host: 'localhost',
          port: 5432,
          database: 'test_db',
          username: 'test_user',
          password: 'test_pass',
          type: 'postgresql' as const,
        };

        const connection = await connectionPoolManager.getConnection(config);

        expect(connection).toBeDefined();
        expect(connection.id).toBeDefined();
        expect(connection.isConnected).toBe(true);
      });

      it('应该能够释放数据库连接', async () => {
        const config = {
          host: 'localhost',
          port: 5432,
          database: 'test_db',
          username: 'test_user',
          password: 'test_pass',
          type: 'postgresql' as const,
        };

        const connection = await connectionPoolManager.getConnection(config);

        await expect(
          connectionPoolManager.releaseConnection(connection),
        ).resolves.not.toThrow();
      });

      it('应该能够获取连接池状态', async () => {
        const poolName = 'localhost_test_db_postgresql';

        // 先获取一个连接以创建连接池
        const config = {
          host: 'localhost',
          port: 5432,
          database: 'test_db',
          username: 'test_user',
          password: 'test_pass',
          type: 'postgresql' as const,
        };
        await connectionPoolManager.getConnection(config);

        const status = await connectionPoolManager.getPoolStatus(poolName);

        expect(status).toBeDefined();
        expect(status?.poolName).toBe(poolName);
        expect(typeof status?.totalConnections).toBe('number');
        expect(typeof status?.activeConnections).toBe('number');
        expect(typeof status?.idleConnections).toBe('number');
      });

      it('应该能够获取所有连接池状态', async () => {
        const statuses = await connectionPoolManager.getAllPoolStatus();

        expect(Array.isArray(statuses)).toBe(true);
        // 初始状态可能为空
      });
    });

    describe('连接使用模式分析', () => {
      it('应该能够分析连接使用模式', async () => {
        const poolName = 'test_pool';
        const timeRange = {
          start: new Date(Date.now() - 60 * 60 * 1000), // 1小时前
          end: new Date(),
        };

        const pattern = await connectionPoolManager.analyzeConnectionUsage(
          poolName,
          timeRange,
        );

        expect(pattern).toBeDefined();
        expect(pattern.analysisTimeRange).toEqual(timeRange);
        expect(typeof pattern.averageActiveConnections).toBe('number');
        expect(typeof pattern.peakConnections).toBe('number');
        expect(typeof pattern.connectionAcquisitionTime).toBe('number');
        expect(typeof pattern.idleConnectionRatio).toBe('number');
        expect(typeof pattern.connectionLeakCount).toBe('number');
      });

      it('应该能够生成连接池优化建议', async () => {
        const poolName = 'test_pool';
        const usagePattern = {
          averageActiveConnections: 8,
          peakConnections: 15,
          connectionAcquisitionTime: 2000,
          idleConnectionRatio: 0.7,
          connectionLeakCount: 2,
          analysisTimeRange: {
            start: new Date(Date.now() - 60 * 60 * 1000),
            end: new Date(),
          },
        };

        const optimization = connectionPoolManager.generatePoolOptimization(
          poolName,
          usagePattern,
        );

        expect(optimization).toBeDefined();
        expect(typeof optimization.shouldOptimize).toBe('boolean');
        expect(Array.isArray(optimization.reasons)).toBe(true);
        expect(
          typeof optimization.expectedImprovement.connectionAcquisitionTime,
        ).toBe('number');
        expect(
          typeof optimization.expectedImprovement.resourceUtilization,
        ).toBe('number');
        expect(typeof optimization.expectedImprovement.throughput).toBe(
          'number',
        );
      });
    });

    describe('连接池健康检查', () => {
      it('应该能够检查连接池健康状况', async () => {
        const poolName = 'test_pool';

        const health = await connectionPoolManager.checkPoolHealth(poolName);

        expect(health).toBeDefined();
        expect(typeof health.healthy).toBe('boolean');
        expect(Array.isArray(health.issues)).toBe(true);
        expect(Array.isArray(health.recommendations)).toBe(true);
      });
    });
  });

  describe('IntelligentQueryOptimizer', () => {
    let queryOptimizer: IntelligentQueryOptimizer;

    beforeEach(() => {
      queryOptimizer = new IntelligentQueryOptimizer();
    });

    describe('查询执行计划分析', () => {
      it('应该能够分析查询执行计划', async () => {
        const sql = 'SELECT * FROM users WHERE email = ? AND active = ?';
        const params = ['test@example.com', true];

        const executionPlan = await queryOptimizer.analyzeExecutionPlan(
          sql,
          params,
          'default',
        );

        expect(executionPlan).toBeDefined();
        expect(executionPlan.queryId).toBeDefined();
        expect(executionPlan.sql).toBe(sql);
        expect(executionPlan.params).toEqual(params);
        expect(Array.isArray(executionPlan.planNodes)).toBe(true);
        expect(typeof executionPlan.estimatedCost).toBe('number');
        expect(typeof executionPlan.estimatedTime).toBe('number');
        expect(typeof executionPlan.estimatedRows).toBe('number');
        expect(typeof executionPlan.usesIndex).toBe('boolean');
      });

      it('应该能够缓存执行计划', async () => {
        const sql = 'SELECT id, name FROM users WHERE id = ?';
        const params = [123];

        // 第一次分析
        const plan1 = await queryOptimizer.analyzeExecutionPlan(sql, params);

        // 第二次分析应该使用缓存
        const plan2 = await queryOptimizer.analyzeExecutionPlan(sql, params);

        expect(plan1.queryId).toBe(plan2.queryId);
        expect(plan1.analyzedAt).toEqual(plan2.analyzedAt);
      });
    });

    describe('查询优化功能', () => {
      it('应该能够优化查询', async () => {
        const executionPlan = {
          queryId: 'test_query_1',
          sql: 'SELECT * FROM users WHERE email = ?',
          params: ['test@example.com'],
          planNodes: [
            {
              nodeType: 'SeqScan' as const,
              tableName: 'users',
              cost: { startup: 0, total: 1000 },
              rows: 5000,
              width: 100,
              children: [],
            },
          ],
          estimatedCost: 1500,
          estimatedTime: 2500,
          estimatedRows: 5000,
          usesIndex: false,
          analyzedAt: new Date(),
        };

        const optimization = await queryOptimizer.optimizeQuery(executionPlan);

        expect(optimization).toBeDefined();
        expect(optimization.queryId).toBe(executionPlan.queryId);
        expect(optimization.originalSql).toBe(executionPlan.sql);
        expect(Array.isArray(optimization.optimizations)).toBe(true);
        expect(typeof optimization.expectedImprovement.executionTime).toBe(
          'number',
        );
        expect(typeof optimization.expectedImprovement.resourceUsage).toBe(
          'number',
        );
        expect(typeof optimization.expectedImprovement.throughput).toBe(
          'number',
        );
        expect(['low', 'medium', 'high']).toContain(
          optimization.riskAssessment,
        );
        expect(['low', 'medium', 'high', 'critical']).toContain(
          optimization.priority,
        );
      });

      it('应该为没有索引的查询建议创建索引', async () => {
        const executionPlan = {
          queryId: 'test_query_2',
          sql: 'SELECT * FROM orders WHERE user_id = ? AND status = ?',
          params: [123, 'pending'],
          planNodes: [
            {
              nodeType: 'SeqScan' as const,
              tableName: 'orders',
              cost: { startup: 0, total: 2000 },
              rows: 10000,
              width: 200,
              children: [],
            },
          ],
          estimatedCost: 2000,
          estimatedTime: 3000,
          estimatedRows: 10000,
          usesIndex: false,
          analyzedAt: new Date(),
        };

        const optimization = await queryOptimizer.optimizeQuery(executionPlan);

        expect(optimization.optimizations.length).toBeGreaterThan(0);
        expect(
          optimization.optimizations.some((opt) => opt.type === 'index'),
        ).toBe(true);
      });
    });

    describe('索引建议功能', () => {
      it('应该能够建议索引', async () => {
        const tableName = 'users';
        const queryPatterns = [
          {
            patternId: 'pattern_1',
            patternType: 'select' as const,
            sqlTemplate: 'SELECT * FROM users WHERE email = ?',
            frequency: 100,
            averageExecutionTime: 1500,
            tables: ['users'],
            conditions: ['email = ?'],
            performanceCategory: 'slow' as const,
          },
          {
            patternId: 'pattern_2',
            patternType: 'select' as const,
            sqlTemplate:
              'SELECT * FROM users WHERE status = ? AND created_at > ?',
            frequency: 50,
            averageExecutionTime: 2000,
            tables: ['users'],
            conditions: ['status = ?', 'created_at > ?'],
            performanceCategory: 'very_slow' as const,
          },
        ];

        const suggestion = await queryOptimizer.suggestIndexes(
          tableName,
          queryPatterns,
        );

        expect(suggestion).toBeDefined();
        expect(suggestion.tableName).toBe(tableName);
        expect(Array.isArray(suggestion.suggestedIndexes)).toBe(true);
        expect(Array.isArray(suggestion.redundantIndexes)).toBe(true);
        expect(Array.isArray(suggestion.unusedIndexes)).toBe(true);
        expect(typeof suggestion.expectedImprovement).toBe('number');
      });
    });

    describe('慢查询分析', () => {
      it('应该能够分析慢查询', async () => {
        const timeRange = {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24小时前
          end: new Date(),
        };
        const thresholdMs = 1000;

        const analysis = await queryOptimizer.analyzeSlowQueries(
          timeRange,
          thresholdMs,
        );

        expect(analysis).toBeDefined();
        expect(Array.isArray(analysis)).toBe(true);

        for (const slowQuery of analysis) {
          expect(typeof slowQuery.sql).toBe('string');
          expect(typeof slowQuery.executionTime).toBe('number');
          expect(typeof slowQuery.executionCount).toBe('number');
          expect(Array.isArray(slowQuery.performanceIssues)).toBe(true);
          expect(Array.isArray(slowQuery.optimizationSuggestions)).toBe(true);
        }
      });
    });

    describe('查询模式分析', () => {
      it('应该能够分析查询模式', async () => {
        const timeRange = {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date(),
        };

        const patterns = await queryOptimizer.analyzeQueryPatterns(timeRange);

        expect(Array.isArray(patterns)).toBe(true);

        for (const pattern of patterns) {
          expect(typeof pattern.patternId).toBe('string');
          expect([
            'select',
            'insert',
            'update',
            'delete',
            'join',
            'aggregate',
          ]).toContain(pattern.patternType);
          expect(typeof pattern.sqlTemplate).toBe('string');
          expect(typeof pattern.frequency).toBe('number');
          expect(typeof pattern.averageExecutionTime).toBe('number');
          expect(Array.isArray(pattern.tables)).toBe(true);
          expect(Array.isArray(pattern.conditions)).toBe(true);
          expect(['fast', 'moderate', 'slow', 'very_slow']).toContain(
            pattern.performanceCategory,
          );
        }
      });
    });

    describe('优化统计', () => {
      it('应该能够获取优化统计', async () => {
        // 先进行一些分析以生成统计数据
        await queryOptimizer.analyzeExecutionPlan(
          'SELECT * FROM users WHERE id = ?',
          [1],
        );

        const stats = queryOptimizer.getOptimizationStats();

        expect(stats).toBeDefined();
        expect(typeof stats.totalQueries).toBe('number');
        expect(typeof stats.optimizedQueries).toBe('number');
        expect(typeof stats.averageImprovement).toBe('number');
        expect(Array.isArray(stats.topOptimizations)).toBe(true);
      });
    });
  });

  describe('DatabasePerformanceMonitor', () => {
    let performanceMonitor: DatabasePerformanceMonitor;

    beforeEach(() => {
      performanceMonitor = new DatabasePerformanceMonitor();
    });

    describe('性能指标记录', () => {
      it('应该能够记录数据库操作性能', () => {
        const metadata = {
          operation: 'query' as const,
          sql: 'SELECT * FROM users WHERE id = ?',
          connectionName: 'default',
          tenantId: 'tenant-123',
          queryType: 'SELECT' as const,
          tableNames: ['users'],
          paramCount: 1,
          rowCount: 1,
          usedIndex: true,
          cacheHit: false,
        };

        expect(() => {
          performanceMonitor.recordDatabaseOperation(
            'query',
            150,
            true,
            metadata,
          );
        }).not.toThrow();
      });

      it('应该能够记录错误操作', () => {
        const metadata = {
          operation: 'execute' as const,
          sql: 'INSERT INTO users (email) VALUES (?)',
          connectionName: 'default',
          queryType: 'INSERT' as const,
          tableNames: ['users'],
          paramCount: 1,
        };

        expect(() => {
          performanceMonitor.recordDatabaseOperation(
            'execute',
            500,
            false,
            metadata,
          );
        }).not.toThrow();
      });
    });

    describe('性能指标获取', () => {
      it('应该能够获取当前性能指标', () => {
        const metrics = performanceMonitor.getDatabaseMetrics();

        expect(metrics).toBeDefined();
        expect(typeof metrics.operations.total).toBe('number');
        expect(typeof metrics.averageResponseTime.overall).toBe('number');
        expect(typeof metrics.errorRate.overall).toBe('number');
        expect(typeof metrics.throughput.overall).toBe('number');
        expect(typeof metrics.connectionPool.totalConnections).toBe('number');
        expect(typeof metrics.slowQueries.count).toBe('number');
        expect(metrics.tenantMetrics instanceof Map).toBe(true);
        expect(typeof metrics.cache.hitRate).toBe('number');
      });

      it('应该能够获取历史性能指标', () => {
        const timeRange = {
          start: new Date(Date.now() - 60 * 60 * 1000),
          end: new Date(),
        };

        const historical = performanceMonitor.getHistoricalMetrics(timeRange);

        expect(Array.isArray(historical)).toBe(true);
        // 初始状态可能为空
      });
    });

    describe('慢查询分析', () => {
      it('应该能够分析慢查询', async () => {
        // 先记录一些慢查询
        performanceMonitor.recordDatabaseOperation('query', 2500, true, {
          operation: 'query',
          sql: 'SELECT * FROM orders WHERE created_at > ?',
          connectionName: 'default',
          queryType: 'SELECT',
          tableNames: ['orders'],
        });

        const timeRange = {
          start: new Date(Date.now() - 60 * 60 * 1000),
          end: new Date(),
        };

        const analysis = await performanceMonitor.analyzeSlowQueries(timeRange);

        expect(analysis).toBeDefined();
        expect(analysis.timeRange).toEqual(timeRange);
        expect(typeof analysis.threshold).toBe('number');
        expect(typeof analysis.totalSlowQueries).toBe('number');
        expect(typeof analysis.averageExecutionTime).toBe('number');
        expect(Array.isArray(analysis.topSlowQueries)).toBe(true);
        expect(Array.isArray(analysis.queryPatterns)).toBe(true);
        expect(Array.isArray(analysis.recommendations)).toBe(true);
      });
    });

    describe('连接池健康检查', () => {
      it('应该能够检查连接池健康状况', async () => {
        const health = await performanceMonitor.checkConnectionPoolHealth();

        expect(health).toBeDefined();
        expect(['healthy', 'degraded', 'unhealthy']).toContain(health.overall);
        expect(Array.isArray(health.pools)).toBe(true);
        expect(Array.isArray(health.recommendations)).toBe(true);
        expect(health.lastChecked instanceof Date).toBe(true);
      });
    });

    describe('告警管理', () => {
      it('应该能够获取活跃告警', () => {
        const alerts = performanceMonitor.getActiveAlerts();

        expect(Array.isArray(alerts)).toBe(true);
      });

      it('应该能够获取告警历史', () => {
        const timeRange = {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date(),
        };

        const history = performanceMonitor.getAlertHistory(timeRange);

        expect(Array.isArray(history)).toBe(true);
      });

      it('应该能够解决告警', () => {
        // 先触发一个告警
        performanceMonitor.recordDatabaseOperation(
          'query',
          3000, // 超过阈值的慢查询
          true,
          {
            operation: 'query',
            sql: 'SELECT * FROM large_table',
            connectionName: 'default',
          },
        );

        const alerts = performanceMonitor.getActiveAlerts();
        if (alerts.length > 0) {
          const alertId = alerts[0].alertId;

          expect(() => {
            performanceMonitor.resolveAlert(alertId);
          }).not.toThrow();
        }
      });
    });

    describe('性能报告生成', () => {
      it('应该能够生成性能报告', async () => {
        // 记录一些性能数据
        performanceMonitor.recordDatabaseOperation('query', 100, true, {
          operation: 'query',
          sql: 'SELECT * FROM users WHERE id = ?',
          connectionName: 'default',
        });

        const timeRange = {
          start: new Date(Date.now() - 60 * 60 * 1000),
          end: new Date(),
        };

        const report =
          await performanceMonitor.generatePerformanceReport(timeRange);

        expect(report).toBeDefined();
        expect(typeof report.summary.totalOperations).toBe('number');
        expect(typeof report.summary.averageResponseTime).toBe('number');
        expect(typeof report.summary.errorRate).toBe('number');
        expect(typeof report.summary.throughput).toBe('number');
        expect(report.slowQueries).toBeDefined();
        expect(report.connectionPoolHealth).toBeDefined();
        expect(Array.isArray(report.alerts)).toBe(true);
        expect(Array.isArray(report.recommendations)).toBe(true);
      });
    });
  });
});
