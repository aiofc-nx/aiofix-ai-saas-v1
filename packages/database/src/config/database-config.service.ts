/**
 * 数据库模块配置服务
 *
 * @description 基于统一配置管理系统的数据库模块配置服务
 * 提供数据库模块专用的配置管理功能，支持热更新和监控
 *
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import type {
  IConfigManager,
  IDatabaseModuleConfig,
  IConfigChangeEvent,
} from '@aiofix/config';

/**
 * 数据库模块配置服务实现
 */
@Injectable()
export class DatabaseConfigService {
  private readonly configManager: IConfigManager;
  private config: IDatabaseModuleConfig | null = null;
  private initialized = false;
  private readonly configChangeListeners: Set<
    (config: IDatabaseModuleConfig) => void
  > = new Set();

  constructor(configManager: IConfigManager) {
    this.configManager = configManager;
  }

  /**
   * 初始化配置服务
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 加载初始配置
      await this.loadConfig();

      // 监听配置变化
      this.configManager.onChange('database', (event: IConfigChangeEvent) => {
        this.handleConfigChange(event);
      });

      this.initialized = true;
    } catch (error) {
      throw new Error(
        `DatabaseConfigService初始化失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 获取完整的数据库配置
   */
  async getConfig(): Promise<IDatabaseModuleConfig> {
    await this.ensureInitialized();
    return this.config!;
  }

  /**
   * 获取默认连接配置
   */
  async getDefaultConnection(): Promise<
    IDatabaseModuleConfig['connections'][string]
  > {
    const config = await this.getConfig();
    const defaultConnectionName = config.default;
    return config.connections[defaultConnectionName];
  }

  /**
   * 获取指定连接配置
   */
  async getConnection(
    name: string,
  ): Promise<IDatabaseModuleConfig['connections'][string] | undefined> {
    const config = await this.getConfig();
    return config.connections[name];
  }

  /**
   * 获取所有连接名称
   */
  async getConnectionNames(): Promise<string[]> {
    const config = await this.getConfig();
    return Object.keys(config.connections);
  }

  /**
   * 获取事务配置
   */
  async getTransactionConfig(): Promise<IDatabaseModuleConfig['transaction']> {
    const config = await this.getConfig();
    return config.transaction;
  }

  /**
   * 获取多租户配置
   */
  async getMultiTenantConfig(): Promise<IDatabaseModuleConfig['multiTenant']> {
    const config = await this.getConfig();
    return config.multiTenant;
  }

  /**
   * 获取监控配置
   */
  async getMonitoringConfig(): Promise<IDatabaseModuleConfig['monitoring']> {
    const config = await this.getConfig();
    return config.monitoring;
  }

  /**
   * 检查数据库模块是否启用
   */
  async isEnabled(): Promise<boolean> {
    const config = await this.getConfig();
    return config.enabled;
  }

  /**
   * 检查多租户是否启用
   */
  async isMultiTenantEnabled(): Promise<boolean> {
    const config = await this.getConfig();
    return config.multiTenant.enabled;
  }

  /**
   * 检查事务管理是否启用
   */
  async isTransactionEnabled(): Promise<boolean> {
    const config = await this.getConfig();
    return config.transaction.enabled;
  }

  /**
   * 检查监控是否启用
   */
  async isMonitoringEnabled(): Promise<boolean> {
    const config = await this.getConfig();
    return config.monitoring.enabled;
  }

  /**
   * 获取租户数据库配置
   */
  async getTenantDatabaseConfig(tenantId: string): Promise<any> {
    const config = await this.getConfig();
    const defaultConnection = await this.getDefaultConnection();

    // 根据多租户策略生成租户数据库配置
    switch (config.multiTenant.strategy) {
      case 'database':
        return {
          ...defaultConnection,
          database: `${defaultConnection.database}_tenant_${tenantId}`,
        };
      case 'schema':
        return {
          ...defaultConnection,
          schema: `tenant_${tenantId}`,
        };
      case 'row':
      default:
        return defaultConnection;
    }
  }

  /**
   * 监听配置变化
   */
  onConfigChange(listener: (config: IDatabaseModuleConfig) => void): void {
    this.configChangeListeners.add(listener);
  }

  /**
   * 移除配置变化监听器
   */
  offConfigChange(listener: (config: IDatabaseModuleConfig) => void): void {
    this.configChangeListeners.delete(listener);
  }

  /**
   * 重新加载配置
   */
  async reloadConfig(): Promise<void> {
    await this.loadConfig();
    this.notifyConfigChange();
  }

  /**
   * 获取配置状态
   */
  getStatus(): {
    initialized: boolean;
    version: string;
    lastUpdated: Date | null;
    listenersCount: number;
  } {
    return {
      initialized: this.initialized,
      version: '1.0.0',
      lastUpdated: null, // 可以从配置管理器获取
      listenersCount: this.configChangeListeners.size,
    };
  }

  /**
   * 销毁配置服务
   */
  async destroy(): Promise<void> {
    this.configChangeListeners.clear();
    this.config = null;
    this.initialized = false;
  }

  // ==================== 私有方法 ====================

  /**
   * 确保服务已初始化
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
    try {
      this.config =
        await this.configManager.getModuleConfig<IDatabaseModuleConfig>(
          'database',
        );
    } catch (error) {
      throw new Error(
        `加载数据库配置失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 处理配置变化事件
   */
  private async handleConfigChange(event: IConfigChangeEvent): Promise<void> {
    try {
      // 重新加载配置
      await this.loadConfig();

      // 通知监听器
      this.notifyConfigChange();
    } catch {
      // 处理配置变化错误
    }
  }

  /**
   * 通知配置变化
   */
  private notifyConfigChange(): void {
    if (this.config) {
      this.configChangeListeners.forEach((listener) => {
        try {
          listener(this.config!);
        } catch {
          // 忽略监听器错误
        }
      });
    }
  }
}

/**
 * 创建数据库配置服务
 */
export async function createDatabaseConfigService(
  configManager: IConfigManager,
): Promise<DatabaseConfigService> {
  const service = new DatabaseConfigService(configManager);
  await service.initialize();
  return service;
}
