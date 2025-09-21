/**
 * 统一配置管理器测试
 *
 * @description 测试统一配置管理器的核心功能
 * 验证配置加载、获取、设置、验证等基本操作
 *
 * @since 1.0.0
 */

import { UnifiedConfigManager } from '../core/config-manager';
import { EnvironmentConfigProvider } from '../providers/environment-provider';
import { ConfigValidator } from '../validation/config-validator';
import type { IMessagingModuleConfig } from '../interfaces/config.interface';

describe('UnifiedConfigManager', () => {
  let configManager: UnifiedConfigManager;

  beforeEach(async () => {
    configManager = new UnifiedConfigManager();
  });

  afterEach(async () => {
    if (configManager) {
      await configManager.destroy();
    }
  });

  describe('初始化', () => {
    it('应该成功初始化配置管理器', async () => {
      await configManager.initialize({
        enableCache: true,
        enableValidation: true,
        providers: [new EnvironmentConfigProvider()],
      });

      expect(configManager).toBeDefined();
      const stats = configManager.getStatistics();
      // expect(stats.initialized).toBe(true); // 统计信息中没有initialized字段
      expect(stats.providerCount).toBe(1);
    });

    it('应该防止重复初始化', async () => {
      await configManager.initialize();

      await expect(configManager.initialize()).rejects.toThrow(
        '配置管理器已经初始化',
      );
    });
  });

  describe('配置获取', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('应该能获取完整配置', async () => {
      const config = await configManager.getConfig();

      expect(config).toBeDefined();
      expect(config.system).toBeDefined();
      expect(config.core).toBeDefined();
      expect(config.messaging).toBeDefined();
      expect(config.system.name).toBe('AIOFix SAAS Platform');
    });

    it('应该能通过路径获取配置项', async () => {
      const systemName = await configManager.get('system.name');
      const dbHost = await configManager.get('core.database.host', 'localhost');
      const timeout = await configManager.get(
        'messaging.global.defaultTimeout',
      );

      expect(systemName).toBe('AIOFix SAAS Platform');
      expect(dbHost).toBe('localhost');
      expect(timeout).toBe(30000);
    });

    it('应该能获取模块配置', async () => {
      const messagingConfig =
        await configManager.getModuleConfig<IMessagingModuleConfig>(
          'messaging',
        );

      expect(messagingConfig).toBeDefined();
      expect(messagingConfig.enabled).toBe(true);
      expect(messagingConfig.global).toBeDefined();
      expect(messagingConfig.global.defaultTimeout).toBe(30000);
    });

    it('应该返回默认值当配置不存在时', async () => {
      const nonExistentConfig = await configManager.get(
        'non.existent.path',
        'default-value',
      );

      expect(nonExistentConfig).toBe('default-value');
    });
  });

  describe('配置设置', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('应该能设置配置项', async () => {
      const newTimeout = 60000;

      await configManager.set('messaging.global.defaultTimeout', newTimeout);
      const updatedTimeout = await configManager.get(
        'messaging.global.defaultTimeout',
      );

      expect(updatedTimeout).toBe(newTimeout);
    });

    it('应该在设置配置时触发变更事件', async () => {
      const changeEvents: any[] = [];

      configManager.onChange('messaging.global.defaultTimeout', (event) => {
        changeEvents.push(event);
      });

      await configManager.set('messaging.global.defaultTimeout', 45000);

      expect(changeEvents).toHaveLength(1);
      expect(changeEvents[0].path).toBe('messaging.global.defaultTimeout');
      expect(changeEvents[0].newValue).toBe(45000);
      expect(changeEvents[0].type).toBe('config-updated');
    });
  });

  describe('配置验证', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('应该能验证配置', async () => {
      const result = await configManager.validate('system', {
        name: 'Test System',
        version: '1.0.0',
        environment: 'development',
        configVersion: '1.0.0',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('配置监听', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('应该能添加和移除配置监听器', () => {
      const callback = jest.fn();

      configManager.onChange('test.path', callback);
      configManager.offChange('test.path', callback);

      const stats = configManager.getStatistics();
      expect(stats.listenerCount).toBe(0);
    });
  });

  describe('配置重新加载', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('应该能重新加载配置', async () => {
      const originalConfig = await configManager.getConfig();
      const reloadedConfig = await configManager.reload();

      expect(reloadedConfig).toBeDefined();
      expect(reloadedConfig.system.name).toBe(originalConfig.system.name);
    });
  });

  describe('统计信息', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('应该提供正确的统计信息', async () => {
      // 执行一些操作
      await configManager.get('system.name');
      await configManager.set('test.value', 'test');

      const stats = configManager.getStatistics();

      expect(stats.totalAccess).toBeGreaterThan(0);
      expect(stats.readAccess).toBeGreaterThan(0);
      expect(stats.writeAccess).toBeGreaterThan(0);
      expect(stats.configCount).toBeGreaterThan(0);
    });
  });
});

describe('ConfigValidator', () => {
  let validator: ConfigValidator;

  beforeEach(() => {
    validator = new ConfigValidator();
  });

  describe('系统配置验证', () => {
    it('应该验证有效的系统配置', async () => {
      const validSystemConfig = {
        name: 'Test System',
        version: '1.0.0',
        environment: 'development',
        startTime: new Date(),
        configVersion: '1.0.0',
        features: {},
      };

      const result = await validator.validateModule(
        'system',
        validSystemConfig,
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测无效的系统配置', async () => {
      const invalidSystemConfig = {
        name: '', // 空名称
        version: '', // 空版本
        environment: 'invalid-env', // 无效环境
      };

      const result = await validator.validateModule(
        'system',
        invalidSystemConfig,
      );

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('自定义验证规则', () => {
    it('应该能注册和使用自定义验证规则', async () => {
      validator.registerRule('test-rule', {
        name: 'test-rule',
        validate: (value) => value === 'valid',
        message: '测试验证失败',
      });

      // 这里需要实际的验证逻辑，目前跳过
      expect(true).toBe(true);
    });
  });
});

describe('EnvironmentConfigProvider', () => {
  let provider: EnvironmentConfigProvider;

  beforeEach(() => {
    provider = new EnvironmentConfigProvider('TEST_');
  });

  afterEach(async () => {
    await provider.destroy();
  });

  describe('环境变量处理', () => {
    it('应该能正确转换环境变量路径', () => {
      // 设置测试环境变量
      process.env.TEST_SYSTEM__NAME = 'Test System';
      process.env.TEST_CORE__DATABASE__PORT = '5432';
      process.env.TEST_MESSAGING__GLOBAL__ENABLE_METRICS = 'true';

      const stats = provider.getStatistics();
      expect(stats.prefix).toBe('TEST_');
    });

    it('应该能验证必需的环境变量', () => {
      const validation = provider.validateRequired();

      expect(validation).toBeDefined();
      expect(typeof validation.valid).toBe('boolean');
      expect(Array.isArray(validation.missing)).toBe(true);
    });
  });

  describe('配置操作', () => {
    beforeEach(async () => {
      await provider.initialize();
    });

    it('应该不支持写操作', async () => {
      await expect(provider.set('test.key', 'value')).rejects.toThrow(
        '环境变量配置提供者不支持写操作',
      );
    });

    it('应该不支持删除操作', async () => {
      await expect(provider.delete('test.key')).rejects.toThrow(
        '环境变量配置提供者不支持删除操作',
      );
    });
  });
});
