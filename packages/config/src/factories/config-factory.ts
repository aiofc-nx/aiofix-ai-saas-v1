/**
 * 配置工厂
 *
 * @description 提供配置管理相关组件的创建和初始化功能
 * 支持不同环境和场景的快速配置管理器创建
 *
 * ## 核心功能
 *
 * ### 🏭 工厂模式
 * - 统一的配置管理器创建接口
 * - 预设配置模板支持
 * - 环境感知的自动配置
 * - 组件组合和依赖注入
 *
 * ### 🎯 预设配置
 * - 开发环境预设：详细日志、快速配置
 * - 测试环境预设：最小化配置、快速启动
 * - 生产环境预设：高性能、高安全性
 * - 自定义预设：用户定义的配置模板
 *
 * ### 🔧 智能配置
 * - 根据环境变量自动选择配置
 * - 配置冲突检测和解决
 * - 配置优化建议
 * - 配置迁移支持
 *
 * @example
 * ```typescript
 * // 创建默认配置管理器
 * const manager = await ConfigFactory.createDefault();
 *
 * // 创建生产环境配置管理器
 * const prodManager = await ConfigFactory.createForProduction();
 *
 * // 使用自定义选项创建
 * const customManager = await ConfigFactory.create({
 *   providers: [new EnvironmentConfigProvider()],
 *   enableCache: true,
 *   enableHotReload: false
 * });
 *
 * // 使用预设创建
 * const highPerfManager = await ConfigFactory.createFromPreset('high-performance');
 * ```
 *
 * @since 1.0.0
 */

import type {
  IConfigManager,
  IConfigManagerOptions,
  IConfigProvider,
} from '../interfaces/config.interface';

import { Environment } from '../interfaces/config.interface';
import { UnifiedConfigManager } from '../core/config-manager';
import { EnvironmentConfigProvider } from '../providers/environment-provider';

/**
 * 配置预设接口
 *
 * @description 定义配置预设的结构
 */
export interface IConfigPreset {
  /** 预设名称 */
  name: string;
  /** 预设描述 */
  description: string;
  /** 预设选项 */
  options: IConfigManagerOptions;
  /** 环境限制 */
  environments?: Environment[];
  /** 预设标签 */
  tags?: string[];
}

/**
 * 配置工厂选项接口
 *
 * @description 定义工厂创建配置管理器时的选项
 */
export interface IConfigFactoryOptions extends IConfigManagerOptions {
  /** 自动检测环境 */
  autoDetectEnvironment?: boolean;
  /** 使用默认提供者 */
  useDefaultProviders?: boolean;
  /** 环境变量前缀 */
  envPrefix?: string;
  /** 配置文件路径 */
  configPath?: string;
  /** 预设名称 */
  preset?: string;
}

/**
 * 配置工厂类
 *
 * @description 实现配置管理器的创建和配置功能
 */
export class ConfigFactory {
  private static readonly presets = new Map<string, IConfigPreset>();
  private static initialized = false;

  /**
   * 初始化工厂
   */
  static initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initializePresets();
    this.initialized = true;
    console.log('配置工厂初始化完成');
  }

  /**
   * 创建配置管理器
   *
   * @param options - 创建选项
   * @returns 配置管理器实例
   */
  static async create(
    options: IConfigFactoryOptions = {},
  ): Promise<IConfigManager> {
    this.initialize();

    const {
      autoDetectEnvironment = true,
      useDefaultProviders = true,
      envPrefix = 'AIOFIX_',
      preset,
      ...managerOptions
    } = options;

    console.log('创建配置管理器', {
      autoDetectEnvironment,
      useDefaultProviders,
      envPrefix,
      preset,
    });

    // 使用预设配置
    if (preset) {
      return this.createFromPreset(preset, managerOptions);
    }

    // 创建提供者列表
    const providers: IConfigProvider[] = [];

    // 添加默认提供者
    if (useDefaultProviders) {
      providers.push(new EnvironmentConfigProvider(envPrefix));
    }

    // 添加自定义提供者
    if (options.providers) {
      providers.push(...options.providers);
    }

    // 自动检测环境
    if (autoDetectEnvironment) {
      const environment = this.detectEnvironment();
      console.log('自动检测到环境:', environment);
    }

    // 合并选项
    const finalOptions: IConfigManagerOptions = {
      enableCache: true,
      enableHotReload: false,
      enableEncryption: false,
      enableMonitoring: true,
      enableValidation: true,
      ...managerOptions,
      providers,
    };

    // 创建配置管理器
    const manager = new UnifiedConfigManager();
    await manager.initialize(finalOptions);

    console.log('配置管理器创建完成');
    return manager;
  }

  /**
   * 创建默认配置管理器
   *
   * @returns 配置管理器实例
   */
  static async createDefault(): Promise<IConfigManager> {
    return this.create({
      autoDetectEnvironment: true,
      useDefaultProviders: true,
    });
  }

  /**
   * 创建开发环境配置管理器
   *
   * @returns 配置管理器实例
   */
  static async createForDevelopment(): Promise<IConfigManager> {
    return this.createFromPreset('development');
  }

  /**
   * 创建测试环境配置管理器
   *
   * @returns 配置管理器实例
   */
  static async createForTest(): Promise<IConfigManager> {
    return this.createFromPreset('test');
  }

  /**
   * 创建生产环境配置管理器
   *
   * @returns 配置管理器实例
   */
  static async createForProduction(): Promise<IConfigManager> {
    return this.createFromPreset('production');
  }

  /**
   * 使用预设创建配置管理器
   *
   * @param presetName - 预设名称
   * @param overrides - 选项覆盖
   * @returns 配置管理器实例
   */
  static async createFromPreset(
    presetName: string,
    overrides: Partial<IConfigManagerOptions> = {},
  ): Promise<IConfigManager> {
    this.initialize();

    const preset = this.presets.get(presetName);
    if (!preset) {
      throw new Error(`未找到配置预设: ${presetName}`);
    }

    console.log('使用预设创建配置管理器:', {
      preset: presetName,
      description: preset.description,
    });

    // 合并预设选项和覆盖选项
    const options: IConfigFactoryOptions = {
      ...preset.options,
      ...overrides,
      providers: [
        ...(preset.options.providers || []),
        ...(overrides.providers || []),
      ],
    };

    return this.create(options);
  }

  /**
   * 注册配置预设
   *
   * @param preset - 配置预设
   */
  static registerPreset(preset: IConfigPreset): void {
    this.presets.set(preset.name, preset);
    console.log('注册配置预设:', {
      name: preset.name,
      description: preset.description,
      tags: preset.tags,
    });
  }

  /**
   * 获取所有预设
   *
   * @returns 预设列表
   */
  static getPresets(): IConfigPreset[] {
    this.initialize();
    return Array.from(this.presets.values());
  }

  /**
   * 获取预设
   *
   * @param name - 预设名称
   * @returns 配置预设
   */
  static getPreset(name: string): IConfigPreset | undefined {
    this.initialize();
    return this.presets.get(name);
  }

  /**
   * 检测当前环境
   *
   * @returns 环境类型
   */
  static detectEnvironment(): Environment {
    const nodeEnv = process.env.NODE_ENV;
    const aiofixEnv = process.env.AIOFIX_SYSTEM__ENVIRONMENT;

    // 优先使用 AIOFIX 专用环境变量
    if (aiofixEnv) {
      switch (aiofixEnv.toLowerCase()) {
        case 'production':
          return Environment.PRODUCTION;
        case 'staging':
          return Environment.STAGING;
        case 'test':
          return Environment.TEST;
        case 'development':
        default:
          return Environment.DEVELOPMENT;
      }
    }

    // 使用 NODE_ENV
    switch (nodeEnv) {
      case 'production':
        return Environment.PRODUCTION;
      case 'staging':
        return Environment.STAGING;
      case 'test':
        return Environment.TEST;
      case 'development':
      default:
        return Environment.DEVELOPMENT;
    }
  }

  /**
   * 验证工厂选项
   *
   * @param options - 工厂选项
   * @returns 验证结果
   */
  static validateOptions(options: IConfigFactoryOptions): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证提供者
    if (options.providers) {
      for (const [index, provider] of options.providers.entries()) {
        if (!provider || typeof provider !== 'object') {
          errors.push(`提供者[${index}]无效`);
        }
      }
    }

    // 验证环境变量前缀
    if (options.envPrefix && !/^[A-Z_]+$/.test(options.envPrefix)) {
      warnings.push('环境变量前缀建议使用大写字母和下划线');
    }

    // 验证配置文件路径
    if (options.configPath && !options.configPath.endsWith('.json')) {
      warnings.push('配置文件建议使用.json格式');
    }

    // 验证预设名称
    if (options.preset && !this.presets.has(options.preset)) {
      errors.push(`未找到配置预设: ${options.preset}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 获取工厂统计信息
   *
   * @returns 统计信息
   */
  static getStatistics(): {
    initialized: boolean;
    presetsCount: number;
    presetNames: string[];
    defaultEnvironment: Environment;
  } {
    return {
      initialized: this.initialized,
      presetsCount: this.presets.size,
      presetNames: Array.from(this.presets.keys()),
      defaultEnvironment: this.detectEnvironment(),
    };
  }

  /**
   * 初始化内置预设
   */
  private static initializePresets(): void {
    // 开发环境预设
    this.registerPreset({
      name: 'development',
      description: '开发环境配置预设 - 启用详细日志和调试功能',
      environments: [Environment.DEVELOPMENT],
      tags: ['dev', 'debug', 'verbose'],
      options: {
        enableCache: true,
        enableHotReload: true,
        enableEncryption: false,
        enableMonitoring: true,
        enableValidation: true,
        providers: [new EnvironmentConfigProvider()],
      },
    });

    // 测试环境预设
    this.registerPreset({
      name: 'test',
      description: '测试环境配置预设 - 最小化配置，快速启动',
      environments: [Environment.TEST],
      tags: ['test', 'minimal', 'fast'],
      options: {
        enableCache: false,
        enableHotReload: false,
        enableEncryption: false,
        enableMonitoring: false,
        enableValidation: true,
        providers: [new EnvironmentConfigProvider()],
      },
    });

    // 预发布环境预设
    this.registerPreset({
      name: 'staging',
      description: '预发布环境配置预设 - 接近生产环境的配置',
      environments: [Environment.STAGING],
      tags: ['staging', 'pre-prod', 'validation'],
      options: {
        enableCache: true,
        enableHotReload: false,
        enableEncryption: true,
        enableMonitoring: true,
        enableValidation: true,
        providers: [new EnvironmentConfigProvider()],
      },
    });

    // 生产环境预设
    this.registerPreset({
      name: 'production',
      description: '生产环境配置预设 - 高性能、高安全性',
      environments: [Environment.PRODUCTION],
      tags: ['prod', 'secure', 'performance'],
      options: {
        enableCache: true,
        enableHotReload: false,
        enableEncryption: true,
        enableMonitoring: true,
        enableValidation: true,
        providers: [new EnvironmentConfigProvider()],
        cache: {
          ttl: 600000, // 10分钟
          maxSize: 1000,
          strategy: 'hybrid',
        },
        monitoring: {
          metricsInterval: 30000, // 30秒
          enableTracing: true,
          enableAuditLog: true,
        },
      },
    });

    // 高性能预设
    this.registerPreset({
      name: 'high-performance',
      description: '高性能配置预设 - 优化性能和响应速度',
      tags: ['performance', 'cache', 'optimization'],
      options: {
        enableCache: true,
        enableHotReload: false,
        enableEncryption: false,
        enableMonitoring: true,
        enableValidation: false, // 跳过验证以提高性能
        providers: [new EnvironmentConfigProvider()],
        cache: {
          ttl: 1800000, // 30分钟
          maxSize: 2000,
          strategy: 'hybrid',
        },
      },
    });

    // 高安全性预设
    this.registerPreset({
      name: 'high-security',
      description: '高安全性配置预设 - 强化安全和审计功能',
      tags: ['security', 'audit', 'encryption'],
      options: {
        enableCache: true,
        enableHotReload: false,
        enableEncryption: true,
        enableMonitoring: true,
        enableValidation: true,
        providers: [new EnvironmentConfigProvider()],
        encryption: {
          algorithm: 'aes-256-gcm',
          key: process.env.AIOFIX_ENCRYPTION_KEY || 'default-key',
          sensitivityLevels: ['sensitive', 'secret'] as any[],
        },
        monitoring: {
          metricsInterval: 15000, // 15秒
          enableTracing: true,
          enableAuditLog: true,
        },
      },
    });

    // 调试预设
    this.registerPreset({
      name: 'debug',
      description: '调试配置预设 - 启用所有调试和监控功能',
      tags: ['debug', 'verbose', 'monitoring'],
      options: {
        enableCache: false, // 禁用缓存以确保实时数据
        enableHotReload: true,
        enableEncryption: false,
        enableMonitoring: true,
        enableValidation: true,
        providers: [new EnvironmentConfigProvider()],
        monitoring: {
          metricsInterval: 5000, // 5秒
          enableTracing: true,
          enableAuditLog: true,
        },
      },
    });

    console.log('内置配置预设初始化完成:', Array.from(this.presets.keys()));
  }

  /**
   * 根据环境自动创建配置管理器
   *
   * @param environment - 指定环境（可选）
   * @returns 配置管理器实例
   */
  static async createForEnvironment(
    environment?: Environment,
  ): Promise<IConfigManager> {
    const env = environment || this.detectEnvironment();

    switch (env) {
      case Environment.DEVELOPMENT:
        return this.createForDevelopment();
      case Environment.TEST:
        return this.createForTest();
      case Environment.STAGING:
        return this.createFromPreset('staging');
      case Environment.PRODUCTION:
        return this.createForProduction();
      default:
        console.warn('未知环境，使用默认配置:', env);
        return this.createDefault();
    }
  }

  /**
   * 创建最小配置管理器（用于测试）
   *
   * @returns 配置管理器实例
   */
  static async createMinimal(): Promise<IConfigManager> {
    return this.create({
      enableCache: false,
      enableHotReload: false,
      enableEncryption: false,
      enableMonitoring: false,
      enableValidation: false,
      useDefaultProviders: true,
    });
  }

  /**
   * 创建内存配置管理器（用于单元测试）
   *
   * @param testConfig - 测试配置
   * @returns 配置管理器实例
   */
  static async createForTesting(
    testConfig?: Record<string, unknown>,
  ): Promise<IConfigManager> {
    // 这里可以创建一个内存配置提供者
    // 目前使用最小配置
    return this.createMinimal();
  }

  /**
   * 验证预设
   *
   * @param preset - 配置预设
   * @returns 验证结果
   */
  static validatePreset(preset: IConfigPreset): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证预设名称
    if (!preset.name || typeof preset.name !== 'string') {
      errors.push('预设名称不能为空');
    }

    // 验证预设描述
    if (!preset.description || typeof preset.description !== 'string') {
      errors.push('预设描述不能为空');
    }

    // 验证预设选项
    if (!preset.options || typeof preset.options !== 'object') {
      errors.push('预设选项不能为空');
    }

    // 验证环境限制
    if (preset.environments) {
      const validEnvironments = Object.values(Environment);
      const invalidEnvs = preset.environments.filter(
        (env) => !validEnvironments.includes(env),
      );
      if (invalidEnvs.length > 0) {
        errors.push(`无效的环境类型: ${invalidEnvs.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 比较预设
   *
   * @param preset1 - 预设1
   * @param preset2 - 预设2
   * @returns 比较结果
   */
  static comparePresets(
    preset1: string,
    preset2: string,
  ): {
    differences: Array<{
      path: string;
      preset1Value: unknown;
      preset2Value: unknown;
    }>;
    summary: {
      totalDifferences: number;
      majorDifferences: number;
      minorDifferences: number;
    };
  } {
    const p1 = this.presets.get(preset1);
    const p2 = this.presets.get(preset2);

    if (!p1 || !p2) {
      throw new Error('预设不存在');
    }

    // 这里可以实现详细的预设比较逻辑
    return {
      differences: [],
      summary: {
        totalDifferences: 0,
        majorDifferences: 0,
        minorDifferences: 0,
      },
    };
  }

  /**
   * 获取推荐预设
   *
   * @param environment - 环境类型
   * @param requirements - 需求标签
   * @returns 推荐的预设名称列表
   */
  static getRecommendedPresets(
    environment?: Environment,
    requirements: string[] = [],
  ): string[] {
    this.initialize();

    const recommendations: string[] = [];

    for (const [name, preset] of this.presets) {
      let score = 0;

      // 环境匹配加分
      if (environment && preset.environments?.includes(environment)) {
        score += 10;
      }

      // 标签匹配加分
      if (preset.tags) {
        const matchingTags = preset.tags.filter((tag) =>
          requirements.includes(tag),
        );
        score += matchingTags.length * 2;
      }

      // 根据分数排序推荐
      if (score > 0) {
        recommendations.push(name);
      }
    }

    return recommendations;
  }
}

// 便捷导出函数

/**
 * 创建默认配置管理器
 *
 * @returns 配置管理器实例
 */
export async function createConfigManager(): Promise<IConfigManager> {
  return ConfigFactory.createDefault();
}

/**
 * 创建开发环境配置管理器
 *
 * @returns 配置管理器实例
 */
export async function createDevelopmentConfigManager(): Promise<IConfigManager> {
  return ConfigFactory.createForDevelopment();
}

/**
 * 创建生产环境配置管理器
 *
 * @returns 配置管理器实例
 */
export async function createProductionConfigManager(): Promise<IConfigManager> {
  return ConfigFactory.createForProduction();
}

/**
 * 创建测试环境配置管理器
 *
 * @returns 配置管理器实例
 */
export async function createTestConfigManager(): Promise<IConfigManager> {
  return ConfigFactory.createForTest();
}

/**
 * 根据环境自动创建配置管理器
 *
 * @param environment - 指定环境（可选）
 * @returns 配置管理器实例
 */
export async function createConfigManagerForEnvironment(
  environment?: Environment,
): Promise<IConfigManager> {
  return ConfigFactory.createForEnvironment(environment);
}

/**
 * 使用预设创建配置管理器
 *
 * @param presetName - 预设名称
 * @param overrides - 选项覆盖
 * @returns 配置管理器实例
 */
export async function createConfigManagerFromPreset(
  presetName: string,
  overrides?: Partial<IConfigManagerOptions>,
): Promise<IConfigManager> {
  return ConfigFactory.createFromPreset(presetName, overrides);
}
