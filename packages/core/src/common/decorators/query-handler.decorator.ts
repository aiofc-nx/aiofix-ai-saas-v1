/**
 * @QueryHandler 装饰器
 *
 * 用于标记查询处理器类的装饰器。
 * 该装饰器将查询类型与处理器类关联，并提供丰富的配置选项。
 *
 * ## 业务规则
 *
 * ### 查询类型规则
 * - 每个查询处理器必须指定处理的查询类型
 * - 查询类型必须是字符串，用于标识具体的查询
 * - 查询类型在运行时用于路由查询到正确的处理器
 *
 * ### 配置规则
 * - 装饰器支持优先级配置，用于处理多个处理器的情况
 * - 支持超时配置，防止查询处理无限等待
 * - 支持重试配置，处理临时性失败
 * - 支持缓存配置，提高查询性能
 * - 支持验证、授权等企业级配置
 *
 * ### 元数据规则
 * - 装饰器将配置信息存储为元数据
 * - 元数据用于运行时行为控制和监控
 * - 支持动态配置和运行时调整
 *
 * @description 查询处理器装饰器，用于标记和配置查询处理器
 * @example
 * ```typescript
 * @QueryHandler('GetUsers', {
 *   priority: 1,
 *   timeout: 15000,
 *   retry: {
 *     maxRetries: 2,
 *     retryDelay: 500
 *   },
 *   cache: {
 *     expiration: 300,
 *     keyGenerator: (args) => `users:${args[0]?.status}`
 *   },
 *   validation: {
 *     rules: { page: 'required|integer|min:1', pageSize: 'required|integer|max:100' }
 *   },
 *   authorization: {
 *     permissions: ['user.read']
 *   }
 * })
 * export class GetUsersQueryHandler implements IQueryHandler<GetUsersQuery, UserListResult> {
 *   async execute(query: GetUsersQuery): Promise<UserListResult> {
 *     // 处理获取用户列表查询
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
import 'reflect-metadata';
import { BaseQuery } from '../../application/cqrs/queries/base/base-query';
import { IQueryHandler } from '../../application/cqrs/queries/base/query-handler.interface';
import { IQueryResult } from '../../application/cqrs/queries/base/base-query';
import {
  setQueryHandlerMetadata,
  getQueryHandlerMetadata as getMetadata,
} from './metadata.utils';
import {
  IQueryHandlerMetadata,
  IRetryConfig,
  ICacheConfig,
  IValidationConfig,
  IAuthorizationConfig,
  IMultiTenantConfig,
  IDataIsolationConfig,
  IPerformanceMonitorConfig,
} from './metadata.interfaces';

/**
 * 查询处理器装饰器选项
 */
export interface IQueryHandlerOptions {
  /**
   * 处理器优先级（数值越小优先级越高）
   */
  priority?: number;

  /**
   * 超时时间（毫秒）
   */
  timeout?: number;

  /**
   * 重试配置
   */
  retry?: IRetryConfig;

  /**
   * 缓存配置
   */
  cache?: ICacheConfig;

  /**
   * 验证配置
   */
  validation?: IValidationConfig;

  /**
   * 授权配置
   */
  authorization?: IAuthorizationConfig;

  /**
   * 多租户配置
   */
  multiTenant?: IMultiTenantConfig;

  /**
   * 数据隔离配置
   */
  dataIsolation?: IDataIsolationConfig;

  /**
   * 性能监控配置
   */
  performanceMonitor?: IPerformanceMonitorConfig;

  /**
   * 是否启用日志记录
   */
  enableLogging?: boolean;

  /**
   * 是否启用审计
   */
  enableAudit?: boolean;

  /**
   * 是否启用性能监控
   */
  enablePerformanceMonitor?: boolean;

  /**
   * 自定义配置
   */
  customConfig?: Record<string, unknown>;
}

/**
 * 查询处理器装饰器工厂函数
 *
 * @param queryType - 查询类型
 * @param options - 装饰器选项
 * @returns 装饰器函数
 */
export function QueryHandler<
  TQuery extends BaseQuery,
  TResult extends IQueryResult,
>(queryType: string, options: IQueryHandlerOptions = {}) {
  return function (
    target: new (...args: any[]) => IQueryHandler<TQuery, TResult>,
  ) {
    // 验证目标类实现了 IQueryHandler 接口
    const prototype = target.prototype;
    if (typeof prototype.execute !== 'function') {
      throw new Error(
        `Query handler ${target.name} must implement execute method`,
      );
    }

    // 设置查询处理器元数据
    setQueryHandlerMetadata(target, queryType, options);

    // 添加静态方法用于获取查询类型
    Object.defineProperty(target, 'queryType', {
      value: queryType,
      writable: false,
      enumerable: true,
      configurable: false,
    });

    // 添加静态方法用于获取处理器优先级
    Object.defineProperty(target, 'priority', {
      value: options.priority || 0,
      writable: false,
      enumerable: true,
      configurable: false,
    });

    // 添加静态方法用于检查是否支持指定查询类型
    Object.defineProperty(target, 'supports', {
      value: function (qryType: string): boolean {
        return qryType === queryType;
      },
      writable: false,
      enumerable: true,
      configurable: false,
    });

    // 添加静态方法用于获取元数据
    Object.defineProperty(target, 'getMetadata', {
      value: function (): IQueryHandlerMetadata | undefined {
        return getMetadata(target);
      },
      writable: false,
      enumerable: true,
      configurable: false,
    });

    return target;
  };
}

/**
 * 检查类是否被 @QueryHandler 装饰器标记
 *
 * @param target - 目标类
 * @returns 如果被标记则返回 true，否则返回 false
 */
export function isQueryHandler(target: any): boolean {
  return getQueryHandlerMetadata(target) !== undefined;
}

/**
 * 获取查询处理器的查询类型
 *
 * @param target - 目标类
 * @returns 查询类型，如果未标记则返回 undefined
 */
export function getQueryType(target: any): string | undefined {
  const metadata = getQueryHandlerMetadata(target);
  return metadata?.queryType;
}

/**
 * 获取查询处理器的优先级
 *
 * @param target - 目标类
 * @returns 优先级，如果未标记则返回 undefined
 */
export function getQueryHandlerPriority(target: any): number | undefined {
  const metadata = getQueryHandlerMetadata(target);
  return metadata?.priority;
}

/**
 * 检查查询处理器是否支持指定的查询类型
 *
 * @param target - 目标类
 * @param queryType - 查询类型
 * @returns 如果支持则返回 true，否则返回 false
 */
export function supportsQueryType(target: any, queryType: string): boolean {
  const metadata = getQueryHandlerMetadata(target);
  return metadata?.queryType === queryType;
}

/**
 * 获取查询处理器的完整元数据
 *
 * @param target - 目标类
 * @returns 查询处理器元数据，如果未标记则返回 undefined
 */
export function getQueryHandlerMetadata(
  target: any,
): IQueryHandlerMetadata | undefined {
  return getMetadata(target);
}

/**
 * 查询处理器装饰器类型
 */
export type QueryHandlerDecorator = typeof QueryHandler;

/**
 * 查询处理器类类型
 */
export type QueryHandlerClass<
  TQuery extends BaseQuery = BaseQuery,
  TResult extends IQueryResult = IQueryResult,
> = new (...args: any[]) => IQueryHandler<TQuery, TResult> & {
  queryType: string;
  priority: number;
  supports(queryType: string): boolean;
  getMetadata(): IQueryHandlerMetadata | undefined;
};
