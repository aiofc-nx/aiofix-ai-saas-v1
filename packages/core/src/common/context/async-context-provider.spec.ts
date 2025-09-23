/**
 * AsyncContextProvider 测试
 *
 * 测试异步上下文提供者的功能，包括HTTP、GraphQL、WebSocket、CLI等提供者。
 *
 * @description 异步上下文提供者的单元测试
 * @since 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  HttpRequestContextProvider,
  GraphQLRequestContextProvider,
  WebSocketContextProvider,
  CliCommandContextProvider,
  SystemTaskContextProvider,
  AsyncContextProviderManager,
} from './async-context-provider';
import { IContextData } from './async-context.interface';

// Mock logger service
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('HttpRequestContextProvider', () => {
  let provider: HttpRequestContextProvider;
  let module: TestingModule;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        HttpRequestContextProvider,
        {
          provide: 'ILoggerService',
          useValue: mockLogger,
        },
      ],
    }).compile();

    provider = moduleRef.get<HttpRequestContextProvider>(
      HttpRequestContextProvider,
    );
    module = moduleRef;
  });

  afterEach(async () => {
    await module.close();
    jest.clearAllMocks();
  });

  describe('基本属性', () => {
    it('应该具有正确的名称和优先级', () => {
      expect(provider.name).toBe('HttpRequestContextProvider');
      expect(provider.priority).toBe(100);
    });
  });

  describe('上下文数据提取', () => {
    it('应该从HTTP请求头中提取上下文数据', () => {
      const request = {
        headers: {
          'x-tenant-id': 'tenant-123',
          'x-user-id': 'user-456',
          'x-organization-id': 'org-789',
          'x-department-id': 'dept-101',
          'x-request-id': 'req-202',
          'x-correlation-id': 'corr-303',
          'x-causation-id': 'cause-404',
          'user-agent': 'Mozilla/5.0',
          'accept-language': 'zh-CN',
          'x-timezone': 'Asia/Shanghai',
        },
        ip: '192.168.1.1',
      };

      const data = provider.extractContextData(request);

      expect(data.tenantId).toBe('tenant-123');
      expect(data.userId).toBe('user-456');
      expect(data.organizationId).toBe('org-789');
      expect(data.departmentId).toBe('dept-101');
      expect(data.requestId).toBe('req-202');
      expect(data.correlationId).toBe('corr-303');
      expect(data.causationId).toBe('cause-404');
      expect(data.userAgent).toBe('Mozilla/5.0');
      expect(data.locale).toBe('zh-CN');
      expect(data.timezone).toBe('Asia/Shanghai');
      expect(data.ipAddress).toBe('192.168.1.1');
      expect(data.source).toBe('WEB');
    });

    it('应该从连接信息中提取IP地址', () => {
      const request = {
        connection: {
          remoteAddress: '10.0.0.1',
        },
      };

      const data = provider.extractContextData(request);
      expect(data.ipAddress).toBe('10.0.0.1');
    });

    it('应该处理空的请求头', () => {
      const request = {
        headers: {},
        ip: '192.168.1.1',
      };

      const data = provider.extractContextData(request);
      expect(data.source).toBe('WEB');
      expect(data.ipAddress).toBe('192.168.1.1');
    });

    it('应该处理没有请求头的请求', () => {
      const request = {
        ip: '192.168.1.1',
      };

      const data = provider.extractContextData(request);
      expect(data.source).toBe('WEB');
      expect(data.ipAddress).toBe('192.168.1.1');
    });
  });

  describe('请求支持检查', () => {
    it('应该支持具有请求头的请求', () => {
      const request = { headers: {} };
      expect(provider.supports(request)).toBe(true);
    });

    it('应该支持具有IP地址的请求', () => {
      const request = { ip: '192.168.1.1' };
      expect(provider.supports(request)).toBe(true);
    });

    it('应该支持具有连接信息的请求', () => {
      const request = { connection: {} };
      expect(provider.supports(request)).toBe(true);
    });

    it('应该拒绝不支持的请求', () => {
      const request = {};
      expect(provider.supports(request)).toBe(false);
    });
  });
});

describe('GraphQLRequestContextProvider', () => {
  let provider: GraphQLRequestContextProvider;
  let module: TestingModule;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        GraphQLRequestContextProvider,
        {
          provide: 'ILoggerService',
          useValue: mockLogger,
        },
      ],
    }).compile();

    provider = moduleRef.get<GraphQLRequestContextProvider>(
      GraphQLRequestContextProvider,
    );
    module = moduleRef;
  });

  afterEach(async () => {
    await module.close();
    jest.clearAllMocks();
  });

  describe('基本属性', () => {
    it('应该具有正确的名称和优先级', () => {
      expect(provider.name).toBe('GraphQLRequestContextProvider');
      expect(provider.priority).toBe(90);
    });
  });

  describe('上下文数据提取', () => {
    it('应该从GraphQL上下文中提取数据', () => {
      const request = {
        context: {
          tenantId: 'tenant-123',
          userId: 'user-456',
          organizationId: 'org-789',
          departmentId: 'dept-101',
          requestId: 'req-202',
          correlationId: 'corr-303',
          causationId: 'cause-404',
          userAgent: 'GraphQL-Client',
          ipAddress: '192.168.1.1',
          locale: 'en-US',
          timezone: 'UTC',
        },
        query: 'query { user { id } }',
      };

      const data = provider.extractContextData(request);

      expect(data.tenantId).toBe('tenant-123');
      expect(data.userId).toBe('user-456');
      expect(data.organizationId).toBe('org-789');
      expect(data.departmentId).toBe('dept-101');
      expect(data.requestId).toBe('req-202');
      expect(data.correlationId).toBe('corr-303');
      expect(data.causationId).toBe('cause-404');
      expect(data.userAgent).toBe('GraphQL-Client');
      expect(data.ipAddress).toBe('192.168.1.1');
      expect(data.locale).toBe('en-US');
      expect(data.timezone).toBe('UTC');
      expect(data.source).toBe('API');
    });

    it('应该从请求头中补充缺失的数据', () => {
      const request = {
        context: {
          tenantId: 'context-tenant',
        },
        headers: {
          'x-tenant-id': 'header-tenant',
          'x-user-id': 'header-user',
        },
        query: 'query { user { id } }',
      };

      const data = provider.extractContextData(request);
      expect(data.tenantId).toBe('context-tenant'); // 上下文优先
      expect(data.userId).toBe('header-user'); // 从请求头补充
    });
  });

  describe('请求支持检查', () => {
    it('应该支持GraphQL查询请求', () => {
      const request = {
        context: {},
        query: 'query { user { id } }',
      };
      expect(provider.supports(request)).toBe(true);
    });

    it('应该支持GraphQL变更请求', () => {
      const request = {
        context: {},
        mutation: 'mutation { createUser { id } }',
      };
      expect(provider.supports(request)).toBe(true);
    });

    it('应该支持GraphQL订阅请求', () => {
      const request = {
        context: {},
        subscription: 'subscription { userUpdated { id } }',
      };
      expect(provider.supports(request)).toBe(true);
    });

    it('应该拒绝不支持的请求', () => {
      const request = {};
      expect(provider.supports(request)).toBe(false);
    });
  });
});

describe('WebSocketContextProvider', () => {
  let provider: WebSocketContextProvider;
  let module: TestingModule;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        WebSocketContextProvider,
        {
          provide: 'ILoggerService',
          useValue: mockLogger,
        },
      ],
    }).compile();

    provider = moduleRef.get<WebSocketContextProvider>(
      WebSocketContextProvider,
    );
    module = moduleRef;
  });

  afterEach(async () => {
    await module.close();
    jest.clearAllMocks();
  });

  describe('基本属性', () => {
    it('应该具有正确的名称和优先级', () => {
      expect(provider.name).toBe('WebSocketContextProvider');
      expect(provider.priority).toBe(80);
    });
  });

  describe('上下文数据提取', () => {
    it('应该从WebSocket连接中提取数据', () => {
      const request = {
        connection: {
          tenantId: 'tenant-123',
          userId: 'user-456',
          organizationId: 'org-789',
          departmentId: 'dept-101',
          requestId: 'req-202',
          correlationId: 'corr-303',
          userAgent: 'WebSocket-Client',
          ipAddress: '192.168.1.1',
        },
        type: 'websocket',
      };

      const data = provider.extractContextData(request);

      expect(data.tenantId).toBe('tenant-123');
      expect(data.userId).toBe('user-456');
      expect(data.organizationId).toBe('org-789');
      expect(data.departmentId).toBe('dept-101');
      expect(data.requestId).toBe('req-202');
      expect(data.correlationId).toBe('corr-303');
      expect(data.userAgent).toBe('WebSocket-Client');
      expect(data.ipAddress).toBe('192.168.1.1');
      expect(data.source).toBe('WEB');
    });

    it('应该从握手信息中提取数据', () => {
      const request = {
        handshake: {
          headers: {
            'x-tenant-id': 'tenant-123',
            'x-user-id': 'user-456',
            'user-agent': 'WebSocket-Client',
          },
          address: '192.168.1.1',
        },
        type: 'websocket',
      };

      const data = provider.extractContextData(request);

      expect(data.tenantId).toBe('tenant-123');
      expect(data.userId).toBe('user-456');
      expect(data.userAgent).toBe('WebSocket-Client');
      expect(data.ipAddress).toBe('192.168.1.1');
    });
  });

  describe('请求支持检查', () => {
    it('应该支持WebSocket请求', () => {
      const request = {
        connection: {},
        type: 'websocket',
      };
      expect(provider.supports(request)).toBe(true);
    });

    it('应该支持具有握手信息的WebSocket请求', () => {
      const request = {
        handshake: {},
        type: 'websocket',
      };
      expect(provider.supports(request)).toBe(true);
    });

    it('应该拒绝非WebSocket请求', () => {
      const request = {
        connection: {},
        type: 'http',
      };
      expect(provider.supports(request)).toBe(false);
    });
  });
});

describe('CliCommandContextProvider', () => {
  let provider: CliCommandContextProvider;
  let module: TestingModule;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CliCommandContextProvider,
        {
          provide: 'ILoggerService',
          useValue: mockLogger,
        },
      ],
    }).compile();

    provider = moduleRef.get<CliCommandContextProvider>(
      CliCommandContextProvider,
    );
    module = moduleRef;
  });

  afterEach(async () => {
    await module.close();
    jest.clearAllMocks();
  });

  describe('基本属性', () => {
    it('应该具有正确的名称和优先级', () => {
      expect(provider.name).toBe('CliCommandContextProvider');
      expect(provider.priority).toBe(70);
    });
  });

  describe('上下文数据提取', () => {
    beforeEach(() => {
      // 设置环境变量
      process.env.TENANT_ID = 'env-tenant';
      process.env.USER_ID = 'env-user';
      process.env.ORGANIZATION_ID = 'env-org';
      process.env.DEPARTMENT_ID = 'env-dept';
      process.env.REQUEST_ID = 'env-req';
      process.env.CORRELATION_ID = 'env-corr';
    });

    afterEach(() => {
      // 清理环境变量
      delete process.env.TENANT_ID;
      delete process.env.USER_ID;
      delete process.env.ORGANIZATION_ID;
      delete process.env.DEPARTMENT_ID;
      delete process.env.REQUEST_ID;
      delete process.env.CORRELATION_ID;
    });

    it('应该从CLI命令中提取数据', () => {
      const request = {
        command: {
          tenantId: 'cmd-tenant',
          userId: 'cmd-user',
          organizationId: 'cmd-org',
          departmentId: 'cmd-dept',
          requestId: 'cmd-req',
          correlationId: 'cmd-corr',
        },
      };

      const data = provider.extractContextData(request);

      expect(data.tenantId).toBe('cmd-tenant');
      expect(data.userId).toBe('cmd-user');
      expect(data.organizationId).toBe('cmd-org');
      expect(data.departmentId).toBe('cmd-dept');
      expect(data.requestId).toBe('cmd-req');
      expect(data.correlationId).toBe('cmd-corr');
      expect(data.source).toBe('CLI');
    });

    it('应该从环境变量中提取数据', () => {
      const request = {};

      const data = provider.extractContextData(request);

      expect(data.tenantId).toBe('env-tenant');
      expect(data.userId).toBe('env-user');
      expect(data.organizationId).toBe('env-org');
      expect(data.departmentId).toBe('env-dept');
      expect(data.requestId).toBe('env-req');
      expect(data.correlationId).toBe('env-corr');
      expect(data.source).toBe('CLI');
    });
  });

  describe('请求支持检查', () => {
    it('应该支持具有命令的请求', () => {
      const request = { command: {} };
      expect(provider.supports(request)).toBe(true);
    });

    it('应该支持具有环境变量的请求', () => {
      process.env.TENANT_ID = 'test-tenant';
      const request = {};
      expect(provider.supports(request)).toBe(true);
      delete process.env.TENANT_ID;
    });

    it('应该拒绝生产环境的请求', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const request = { command: {} };
      expect(provider.supports(request)).toBe(false);

      process.env.NODE_ENV = originalEnv;
    });
  });
});

describe('SystemTaskContextProvider', () => {
  let provider: SystemTaskContextProvider;
  let module: TestingModule;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SystemTaskContextProvider,
        {
          provide: 'ILoggerService',
          useValue: mockLogger,
        },
      ],
    }).compile();

    provider = moduleRef.get<SystemTaskContextProvider>(
      SystemTaskContextProvider,
    );
    module = moduleRef;
  });

  afterEach(async () => {
    await module.close();
    jest.clearAllMocks();
  });

  describe('基本属性', () => {
    it('应该具有正确的名称和优先级', () => {
      expect(provider.name).toBe('SystemTaskContextProvider');
      expect(provider.priority).toBe(60);
    });
  });

  describe('上下文数据提取', () => {
    beforeEach(() => {
      process.env.SYSTEM_TENANT_ID = 'sys-tenant';
      process.env.SYSTEM_USER_ID = 'sys-user';
    });

    afterEach(() => {
      delete process.env.SYSTEM_TENANT_ID;
      delete process.env.SYSTEM_USER_ID;
    });

    it('应该从系统任务中提取数据', () => {
      const request = {
        task: {
          tenantId: 'task-tenant',
          userId: 'task-user',
          organizationId: 'task-org',
          departmentId: 'task-dept',
          requestId: 'task-req',
          correlationId: 'task-corr',
          causationId: 'task-cause',
        },
      };

      const data = provider.extractContextData(request);

      expect(data.tenantId).toBe('task-tenant');
      expect(data.userId).toBe('task-user');
      expect(data.organizationId).toBe('task-org');
      expect(data.departmentId).toBe('task-dept');
      expect(data.requestId).toBe('task-req');
      expect(data.correlationId).toBe('task-corr');
      expect(data.causationId).toBe('task-cause');
      expect(data.source).toBe('SYSTEM');
    });

    it('应该从环境变量中提取数据', () => {
      const request = {};

      const data = provider.extractContextData(request);

      expect(data.tenantId).toBe('sys-tenant');
      expect(data.userId).toBe('sys-user');
      expect(data.source).toBe('SYSTEM');
    });
  });

  describe('请求支持检查', () => {
    it('应该支持具有任务的请求', () => {
      const request = { task: {} };
      expect(provider.supports(request)).toBe(true);
    });

    it('应该支持具有系统环境变量的请求', () => {
      process.env.SYSTEM_TENANT_ID = 'test-tenant';
      const request = {};
      expect(provider.supports(request)).toBe(true);
      delete process.env.SYSTEM_TENANT_ID;
    });

    it('应该拒绝不支持的请求', () => {
      const request = {};
      expect(provider.supports(request)).toBe(false);
    });
  });
});

describe('AsyncContextProviderManager', () => {
  let manager: AsyncContextProviderManager;
  let module: TestingModule;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AsyncContextProviderManager,
        {
          provide: 'ILoggerService',
          useValue: mockLogger,
        },
      ],
    }).compile();

    manager = moduleRef.get<AsyncContextProviderManager>(
      AsyncContextProviderManager,
    );
    module = moduleRef;
  });

  afterEach(async () => {
    await module.close();
    jest.clearAllMocks();
  });

  describe('提供者管理', () => {
    it('应该能够添加提供者', () => {
      const provider = new HttpRequestContextProvider(mockLogger as any);
      manager.addProvider(provider);

      const providers = manager.getProviders();
      expect(providers).toContain(provider);
    });

    it('应该按优先级排序提供者', () => {
      const provider1 = new HttpRequestContextProvider(mockLogger as any);
      const provider2 = new GraphQLRequestContextProvider(mockLogger as any);
      const provider3 = new WebSocketContextProvider(mockLogger as any);

      manager.addProvider(provider3); // 优先级 80
      manager.addProvider(provider1); // 优先级 100
      manager.addProvider(provider2); // 优先级 90

      const providers = manager.getProviders();
      expect(providers[0]).toBe(provider1); // 最高优先级
      expect(providers[1]).toBe(provider2);
      expect(providers[2]).toBe(provider3);
    });

    it('应该能够移除提供者', () => {
      const provider = new HttpRequestContextProvider(mockLogger as any);
      manager.addProvider(provider);

      expect(manager.getProviders()).toContain(provider);

      const removed = manager.removeProvider(provider.name);
      expect(removed).toBe(true);
      expect(manager.getProviders()).not.toContain(provider);
    });

    it('应该处理移除不存在的提供者', () => {
      const removed = manager.removeProvider('non-existent');
      expect(removed).toBe(false);
    });

    it('应该能够清除所有提供者', () => {
      manager.addProvider(new HttpRequestContextProvider(mockLogger as any));
      manager.addProvider(new GraphQLRequestContextProvider(mockLogger as any));

      expect(manager.getProviders()).toHaveLength(2);

      manager.clear();
      expect(manager.getProviders()).toHaveLength(0);
    });
  });

  describe('上下文数据提取', () => {
    it('应该使用适用的提供者提取数据', () => {
      const httpProvider = new HttpRequestContextProvider(mockLogger as any);
      const graphqlProvider = new GraphQLRequestContextProvider(
        mockLogger as any,
      );

      manager.addProvider(httpProvider);
      manager.addProvider(graphqlProvider);

      const request = {
        headers: {
          'x-tenant-id': 'tenant-123',
          'x-user-id': 'user-456',
        },
        query: 'query { user { id } }',
      };

      const data = manager.extractContextData(request);

      expect(data.tenantId).toBe('tenant-123');
      expect(data.userId).toBe('user-456');
      expect(data.source).toBe('API'); // GraphQL提供者覆盖了HTTP提供者的source
    });

    it('应该处理提供者提取失败的情况', () => {
      const mockProvider = {
        name: 'MockProvider',
        priority: 100,
        supports: jest.fn().mockReturnValue(true),
        extractContextData: jest.fn().mockImplementation(() => {
          throw new Error('Extraction failed');
        }),
      };

      manager.addProvider(mockProvider as any);

      const request = {};
      const data = manager.extractContextData(request);

      expect(data).toEqual({});
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to extract data from MockProvider: Extraction failed',
        expect.any(String),
        expect.any(Object),
      );
    });

    it('应该处理没有适用提供者的情况', () => {
      const request = {};
      const data = manager.extractContextData(request);

      expect(data).toEqual({});
    });
  });

  describe('统计信息', () => {
    it('应该能够获取提供者统计信息', () => {
      manager.addProvider(new HttpRequestContextProvider(mockLogger as any));
      manager.addProvider(new GraphQLRequestContextProvider(mockLogger as any));
      manager.addProvider(new WebSocketContextProvider(mockLogger as any));

      const stats = manager.getStatistics();

      expect(stats.totalProviders).toBe(3);
      expect(stats.providerNames).toContain('HttpRequestContextProvider');
      expect(stats.providerNames).toContain('GraphQLRequestContextProvider');
      expect(stats.providerNames).toContain('WebSocketContextProvider');
      expect(stats.priorityRange.min).toBe(80); // WebSocket优先级最低
      expect(stats.priorityRange.max).toBe(100); // HTTP优先级最高
    });

    it('应该处理空提供者列表的统计信息', () => {
      const stats = manager.getStatistics();

      expect(stats.totalProviders).toBe(0);
      expect(stats.providerNames).toEqual([]);
      expect(stats.priorityRange.min).toBe(0);
      expect(stats.priorityRange.max).toBe(0);
    });
  });
});
