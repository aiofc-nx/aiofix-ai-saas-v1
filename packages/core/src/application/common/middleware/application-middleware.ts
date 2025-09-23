/**
 * 应用层中间件
 *
 * 定义应用层的中间件基础设施，用于：
 * - 用例执行的前置和后置处理
 * - 横切关注点的统一实现
 * - 请求和响应的拦截处理
 *
 * @description 应用层中间件提供了用例执行的拦截和增强机制
 *
 * ## 业务规则
 *
 * ### 中间件执行规则
 * - 中间件按注册顺序执行
 * - 前置中间件在用例执行前执行
 * - 后置中间件在用例执行后执行
 * - 中间件异常会中断执行链
 *
 * ### 中间件职责规则
 * - 中间件负责横切关注点的实现
 * - 中间件不应该修改核心业务逻辑
 * - 中间件应该是无状态和可重用的
 * - 中间件应该支持异步操作
 *
 * @example
 * ```typescript
 * // 注册中间件
 * const middlewareChain = new MiddlewareChain()
 *   .use(new ValidationMiddleware())
 *   .use(new AuthorizationMiddleware())
 *   .use(new AuditLogMiddleware())
 *   .use(new PerformanceMonitorMiddleware());
 *
 * // 执行用例
 * const result = await middlewareChain.execute(useCase, request, context);
 * ```
 *
 * @since 1.0.0
 */

import {
  IUseCase,
  IUseCaseContext,
} from '../../use-cases/base/use-case.interface';

/**
 * 中间件执行上下文接口
 */
export interface IMiddlewareContext {
  /**
   * 用例实例
   */
  useCase: IUseCase<unknown, unknown>;

  /**
   * 请求参数
   */
  request: unknown;

  /**
   * 用例上下文
   */
  useCaseContext: IUseCaseContext;

  /**
   * 中间件共享数据
   */
  shared: Record<string, unknown>;

  /**
   * 执行开始时间
   */
  startTime: number;

  /**
   * 中间件执行状态
   */
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

/**
 * 中间件接口
 */
export interface IMiddleware {
  /**
   * 中间件名称
   */
  readonly name: string;

  /**
   * 中间件优先级
   */
  readonly priority: number;

  /**
   * 是否启用
   */
  readonly enabled: boolean;

  /**
   * 前置处理
   *
   * @param context - 中间件上下文
   * @returns 处理结果，返回false将中断执行
   */
  before(context: IMiddlewareContext): Promise<boolean>;

  /**
   * 后置处理
   *
   * @param context - 中间件上下文
   * @param result - 用例执行结果
   * @param error - 执行异常（如果有）
   * @returns 处理结果
   */
  after(
    context: IMiddlewareContext,
    result?: unknown,
    error?: Error,
  ): Promise<void>;

  /**
   * 异常处理
   *
   * @param context - 中间件上下文
   * @param error - 异常对象
   * @returns 是否已处理异常
   */
  onError(context: IMiddlewareContext, error: Error): Promise<boolean>;
}

/**
 * 基础中间件抽象类
 */
export abstract class BaseMiddleware implements IMiddleware {
  public readonly name: string;
  public readonly priority: number;
  public readonly enabled: boolean;

  constructor(name: string, priority: number = 0, enabled: boolean = true) {
    this.name = name;
    this.priority = priority;
    this.enabled = enabled;
  }

  /**
   * 前置处理默认实现
   */
  async before(_context: IMiddlewareContext): Promise<boolean> {
    return true; // 默认允许继续执行
  }

  /**
   * 后置处理默认实现
   */
  async after(
    _context: IMiddlewareContext,
    _result?: unknown,
    _error?: Error,
  ): Promise<void> {
    // 默认不做处理
  }

  /**
   * 异常处理默认实现
   */
  async onError(_context: IMiddlewareContext, _error: Error): Promise<boolean> {
    return false; // 默认不处理异常
  }

  /**
   * 记录日志
   *
   * @param level - 日志级别
   * @param message - 日志消息
   * @param context - 上下文信息
   */
  protected log(
    _level: string,
    _message: string,
    _context?: Record<string, unknown>,
  ): void {
    // TODO: 替换为实际的日志系统
    // console.log(`[${_level.toUpperCase()}] [${this.name}] ${_message}`, _context);
  }
}

/**
 * 中间件链
 */
export class MiddlewareChain {
  private middlewares: IMiddleware[] = [];

  /**
   * 添加中间件
   *
   * @param middleware - 中间件实例
   * @returns 中间件链实例，支持链式调用
   */
  use(middleware: IMiddleware): MiddlewareChain {
    this.middlewares.push(middleware);
    // 按优先级排序
    this.middlewares.sort((a, b) => b.priority - a.priority);
    return this;
  }

  /**
   * 移除中间件
   *
   * @param middlewareName - 中间件名称
   * @returns 中间件链实例
   */
  remove(middlewareName: string): MiddlewareChain {
    this.middlewares = this.middlewares.filter(
      (m) => m.name !== middlewareName,
    );
    return this;
  }

  /**
   * 执行中间件链
   *
   * @param useCase - 用例实例
   * @param request - 请求参数
   * @param useCaseContext - 用例上下文
   * @returns 执行结果
   */
  async execute<TRequest, TResponse>(
    useCase: IUseCase<TRequest, TResponse>,
    request: TRequest,
    useCaseContext: IUseCaseContext,
  ): Promise<TResponse> {
    const context: IMiddlewareContext = {
      useCase,
      request,
      useCaseContext,
      shared: {},
      startTime: Date.now(),
      status: 'pending',
    };

    try {
      // 执行前置中间件
      context.status = 'executing';
      for (const middleware of this.middlewares.filter((m) => m.enabled)) {
        const shouldContinue = await middleware.before(context);
        if (!shouldContinue) {
          throw new Error(`中间件 ${middleware.name} 中断了执行`);
        }
      }

      // 执行用例
      const result = await useCase.execute(request);
      context.status = 'completed';

      // 执行后置中间件
      for (const middleware of this.middlewares
        .filter((m) => m.enabled)
        .reverse()) {
        await middleware.after(context, result);
      }

      return result;
    } catch (error) {
      context.status = 'failed';
      const err = error instanceof Error ? error : new Error(String(error));

      // 执行异常处理中间件
      let handled = false;
      for (const middleware of this.middlewares.filter((m) => m.enabled)) {
        const wasHandled = await middleware.onError(context, err);
        if (wasHandled) {
          handled = true;
          break;
        }
      }

      // 如果没有中间件处理异常，重新抛出
      if (!handled) {
        throw err;
      }

      // 如果异常被处理，返回undefined（这种情况很少见）
      return undefined as TResponse;
    }
  }

  /**
   * 获取已注册的中间件列表
   *
   * @returns 中间件列表
   */
  getMiddlewares(): IMiddleware[] {
    return [...this.middlewares];
  }

  /**
   * 清空所有中间件
   */
  clear(): void {
    this.middlewares = [];
  }
}

/**
 * 验证中间件
 */
export class ValidationMiddleware extends BaseMiddleware {
  constructor() {
    super('ValidationMiddleware', 1000); // 高优先级
  }

  override async before(context: IMiddlewareContext): Promise<boolean> {
    this.log('debug', '开始验证请求参数', {
      useCaseName: context.useCase.getUseCaseName(),
      requestType: context.request?.constructor?.name,
    });

    // 验证逻辑将在具体实现中注入
    return true;
  }
}

/**
 * 授权中间件
 */
export class AuthorizationMiddleware extends BaseMiddleware {
  constructor() {
    super('AuthorizationMiddleware', 900); // 高优先级
  }

  override async before(context: IMiddlewareContext): Promise<boolean> {
    this.log('debug', '开始权限验证', {
      useCaseName: context.useCase.getUseCaseName(),
      userId: context.useCaseContext.user?.id,
      requiredPermissions: context.useCase.getRequiredPermissions?.() ?? [],
    });

    // 权限验证逻辑将在具体实现中注入
    return true;
  }
}

/**
 * 审计日志中间件
 */
export class AuditLogMiddleware extends BaseMiddleware {
  constructor() {
    super('AuditLogMiddleware', 100); // 低优先级，最后执行
  }

  override async after(
    context: IMiddlewareContext,
    _result?: unknown,
    error?: Error,
  ): Promise<void> {
    const executionTime = Date.now() - context.startTime;

    this.log('info', '用例执行完成', {
      useCaseName: context.useCase.getUseCaseName(),
      executionTime,
      success: !error,
      errorMessage: error?.message,
    });

    // 审计日志记录逻辑将在具体实现中注入
  }
}

/**
 * 性能监控中间件
 */
export class PerformanceMonitorMiddleware extends BaseMiddleware {
  constructor(private readonly slowThreshold: number = 1000) {
    super('PerformanceMonitorMiddleware', 200);
  }

  override async after(
    context: IMiddlewareContext,
    _result?: unknown,
    _error?: Error,
  ): Promise<void> {
    const executionTime = Date.now() - context.startTime;

    if (executionTime > this.slowThreshold) {
      this.log('warn', '检测到慢用例执行', {
        useCaseName: context.useCase.getUseCaseName(),
        executionTime,
        threshold: this.slowThreshold,
      });
    }

    // 性能指标收集逻辑将在具体实现中注入
  }
}
