/**
 * CoreExceptionFilter 测试
 *
 * @description 测试核心异常过滤器的基本功能
 * @since 1.0.0
 */
import { CoreExceptionFilter } from './core-exception-filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { IErrorBus } from './error-handling.interface';

// Mock error bus
const mockErrorBus: jest.Mocked<IErrorBus> = {
  publish: jest.fn().mockResolvedValue({}),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  getStatistics: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
};

// Mock logger service
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock arguments host
const createMockArgumentsHost = (type: 'http' | 'graphql' | 'ws' = 'http') => {
  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  const mockRequest = {
    method: 'GET',
    url: '/api/test',
    headers: {
      'user-agent': 'test-agent',
      'x-tenant-id': 'tenant-123',
      'x-user-id': 'user-456',
    },
    ip: '127.0.0.1',
    user: { id: 'user-456' },
  };

  return {
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => mockRequest),
      getResponse: jest.fn(() => mockResponse),
    })),
    getType: jest.fn(() => type),
    getArgs: jest.fn(() => [mockRequest, mockResponse]),
    getArgByIndex: jest.fn(
      (index: number) => [mockRequest, mockResponse][index],
    ),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
  };
};

describe('CoreExceptionFilter', () => {
  let filter: CoreExceptionFilter;

  beforeEach(() => {
    jest.clearAllMocks();
    filter = new CoreExceptionFilter(mockErrorBus, mockLogger as any);
  });

  describe('基本功能', () => {
    it('应该能够创建异常过滤器实例', () => {
      expect(filter).toBeDefined();
      expect(filter).toBeInstanceOf(CoreExceptionFilter);
    });

    it('应该能够处理 HTTP 异常', async () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);
      const host = createMockArgumentsHost('http');

      await expect(filter.catch(exception, host as any)).resolves.not.toThrow();

      // 验证错误总线被调用
      expect(mockErrorBus.publish).toHaveBeenCalledWith(
        exception,
        expect.any(Object),
      );

      // 验证响应被设置
      const response = host.switchToHttp().getResponse();
      expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(response.json).toHaveBeenCalled();
    });

    it('应该能够处理一般错误', async () => {
      const exception = new Error('Internal error');
      const host = createMockArgumentsHost('http');

      await expect(filter.catch(exception, host as any)).resolves.not.toThrow();

      expect(mockErrorBus.publish).toHaveBeenCalledWith(
        exception,
        expect.any(Object),
      );

      const response = host.switchToHttp().getResponse();
      expect(response.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });

    it('应该能够处理不同类型的上下文', async () => {
      const exception = new Error('Test error');

      // HTTP 上下文
      const httpHost = createMockArgumentsHost('http');
      await expect(
        filter.catch(exception, httpHost as any),
      ).resolves.not.toThrow();

      // GraphQL 上下文
      const graphqlHost = createMockArgumentsHost('graphql');
      await expect(
        filter.catch(exception, graphqlHost as any),
      ).resolves.not.toThrow();

      // WebSocket 上下文
      const wsHost = createMockArgumentsHost('ws');
      await expect(
        filter.catch(exception, wsHost as any),
      ).resolves.not.toThrow();

      expect(mockErrorBus.publish).toHaveBeenCalledTimes(3);
    });
  });

  describe('错误总线集成', () => {
    it('应该在错误总线发布失败时继续工作', async () => {
      mockErrorBus.publish.mockRejectedValueOnce(new Error('Publish failed'));

      const exception = new Error('Test error');
      const host = createMockArgumentsHost('http');

      await expect(filter.catch(exception, host as any)).resolves.not.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to publish exception to error bus'),
        expect.any(String),
        expect.any(Object),
        expect.any(Error),
      );
    });

    it('应该记录异常信息', async () => {
      const exception = new Error('Test error');
      const host = createMockArgumentsHost('http');

      await filter.catch(exception, host as any);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Exception caught'),
        expect.any(String),
        expect.any(Object),
        exception,
      );
    });
  });

  describe('响应格式化', () => {
    it('应该返回正确的 HTTP 异常响应格式', async () => {
      const exception = new HttpException(
        'Bad request',
        HttpStatus.BAD_REQUEST,
      );
      const host = createMockArgumentsHost('http');

      await filter.catch(exception, host as any);

      const response = host.switchToHttp().getResponse();
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: expect.any(String),
          timestamp: expect.any(String),
          path: '/api/test',
        }),
      );
    });

    it('应该正确处理内部服务器错误', async () => {
      const exception = new Error('Internal error');
      const host = createMockArgumentsHost('http');

      await filter.catch(exception, host as any);

      const response = host.switchToHttp().getResponse();
      expect(response.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          timestamp: expect.any(String),
          path: '/api/test',
        }),
      );
    });
  });

  describe('边界情况', () => {
    it('应该处理特殊字符的异常消息', async () => {
      const exception = new HttpException(
        '错误信息_José_🚀',
        HttpStatus.BAD_REQUEST,
      );
      const host = createMockArgumentsHost('http');

      await expect(filter.catch(exception, host as any)).resolves.not.toThrow();
      expect(mockErrorBus.publish).toHaveBeenCalled();
    });

    it('应该处理没有消息的异常', async () => {
      const exception = new Error('');
      const host = createMockArgumentsHost('http');

      await expect(filter.catch(exception, host as any)).resolves.not.toThrow();
      expect(mockErrorBus.publish).toHaveBeenCalled();
    });

    it('应该处理复杂的异常对象', async () => {
      const exception = new Error('Complex error');
      (exception as any).code = 'COMPLEX_ERROR';
      (exception as any).details = { field: 'value', nested: { data: true } };
      const host = createMockArgumentsHost('http');

      await expect(filter.catch(exception, host as any)).resolves.not.toThrow();
      expect(mockErrorBus.publish).toHaveBeenCalled();
    });
  });

  describe('性能测试', () => {
    it('应该能够处理大量异常', async () => {
      const host = createMockArgumentsHost('http');
      const promises: Array<Promise<void>> = [];

      for (let i = 0; i < 100; i++) {
        const exception = new Error(`Error ${i}`);
        promises.push(filter.catch(exception, host as any));
      }

      await expect(Promise.all(promises)).resolves.not.toThrow();
      expect(mockErrorBus.publish).toHaveBeenCalledTimes(100);
    });
  });
});
