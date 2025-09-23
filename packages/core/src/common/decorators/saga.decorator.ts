/**
 * @Saga 装饰器
 *
 * 用于标记 Saga 处理器类的装饰器。
 * Saga 是用于管理分布式事务的模式，该装饰器提供丰富的配置选项。
 *
 * ## 业务规则
 *
 * ### Saga 类型规则
 * - 每个 Saga 处理器必须指定处理的 Saga 类型
 * - Saga 类型必须是字符串，用于标识具体的 Saga
 * - Saga 类型在运行时用于路由和识别 Saga 实例
 *
 * ### 配置规则
 * - 装饰器支持优先级配置，用于处理多个 Saga 的情况
 * - 支持超时配置，防止 Saga 无限等待
 * - 支持重试配置，处理临时性失败
 * - 支持补偿机制配置，处理 Saga 失败时的回滚
 * - 支持验证、授权、事务等企业级配置
 *
 * ### 元数据规则
 * - 装饰器将配置信息存储为元数据
 * - 元数据用于运行时行为控制和监控
 * - 支持动态配置和运行时调整
 *
 * @description Saga 处理器装饰器，用于标记和配置 Saga 处理器
 * @example
 * ```typescript
 * @Saga('OrderProcessing', {
 *   priority: 1,
 *   timeout: 60000,
 *   sagaTimeout: 300000, // 5分钟
 *   compensationTimeout: 60000, // 1分钟
 *   retry: {
 *     maxRetries: 3,
 *     retryDelay: 5000,
 *     backoffMultiplier: 2
 *   },
 *   enableCompensation: true,
 *   enableTimeout: true,
 *   validation: {
 *     rules: { orderId: 'required|string', customerId: 'required|string' }
 *   },
 *   authorization: {
 *     permissions: ['order.process']
 *   },
 *   transaction: {
 *     propagation: 'REQUIRED',
 *     isolation: 'READ_COMMITTED'
 *   }
 * })
 * export class OrderProcessingSaga {
 *   async handle(event: OrderCreatedEvent): Promise<void> {
 *     // 处理订单处理 Saga
 *   }
 *
 *   async compensate(event: OrderCreatedEvent): Promise<void> {
 *     // 补偿操作
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
import 'reflect-metadata';
import { BaseDomainEvent } from '../../domain/events/base/base-domain-event';
import {
  setSagaMetadata,
  getSagaMetadata as getMetadata,
} from './metadata.utils';
import {
  ISagaMetadata,
  IRetryConfig,
  IValidationConfig,
  IAuthorizationConfig,
  ITransactionConfig,
  IMultiTenantConfig,
  IDataIsolationConfig,
  IPerformanceMonitorConfig,
} from './metadata.interfaces';

/**
 * Saga 处理器接口
 */
export interface ISagaHandler<
  TEvent extends BaseDomainEvent = BaseDomainEvent,
> {
  /**
   * 处理事件
   *
   * @param event - 要处理的事件
   * @returns Promise，事件处理完成后解析
   * @throws {Error} 当事件处理失败时
   */
  handle(event: TEvent): Promise<void>;

  /**
   * 补偿操作
   *
   * @param event - 要补偿的事件
   * @returns Promise，补偿操作完成后解析
   * @throws {Error} 当补偿操作失败时
   */
  compensate?(event: TEvent): Promise<void>;

  /**
   * 获取支持的 Saga 类型
   *
   * @returns Saga 类型名称
   */
  getSupportedSagaType(): string;

  /**
   * 检查是否支持指定的 Saga 类型
   *
   * @param sagaType - Saga 类型名称
   * @returns 如果支持指定的 Saga 类型则返回 true，否则返回 false
   */
  supports(sagaType: string): boolean;

  /**
   * 获取处理器的优先级
   *
   * @returns 处理器优先级
   */
  getPriority(): number;

  /**
   * 检查事件是否可以处理
   *
   * @param event - 要检查的事件
   * @returns 如果事件可以处理则返回 true，否则返回 false
   */
  canHandle(event: TEvent): Promise<boolean>;
}

/**
 * Saga 装饰器选项
 */
export interface ISagaOptions {
  /**
   * 处理器优先级（数值越小优先级越高）
   */
  priority?: number;

  /**
   * 超时时间（毫秒）
   */
  timeout?: number;

  /**
   * Saga 超时时间（毫秒）
   */
  sagaTimeout?: number;

  /**
   * 补偿超时时间（毫秒）
   */
  compensationTimeout?: number;

  /**
   * 重试配置
   */
  retry?: IRetryConfig;

  /**
   * 验证配置
   */
  validation?: IValidationConfig;

  /**
   * 授权配置
   */
  authorization?: IAuthorizationConfig;

  /**
   * 事务配置
   */
  transaction?: ITransactionConfig;

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
   * 是否启用补偿机制
   */
  enableCompensation?: boolean;

  /**
   * 是否启用超时处理
   */
  enableTimeout?: boolean;

  /**
   * 自定义配置
   */
  customConfig?: Record<string, unknown>;
}

/**
 * Saga 装饰器工厂函数
 *
 * @param sagaType - Saga 类型
 * @param options - 装饰器选项
 * @returns 装饰器函数
 */
export function Saga<TEvent extends BaseDomainEvent>(
  sagaType: string,
  options: ISagaOptions = {},
) {
  return function (target: new (...args: any[]) => ISagaHandler<TEvent>) {
    // 验证目标类实现了 ISagaHandler 接口
    const prototype = target.prototype;
    if (typeof prototype.handle !== 'function') {
      throw new Error(
        `Saga handler ${target.name} must implement handle method`,
      );
    }

    // 设置 Saga 元数据
    setSagaMetadata(target, sagaType, options);

    // 添加静态方法用于获取 Saga 类型
    Object.defineProperty(target, 'sagaType', {
      value: sagaType,
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

    // 添加静态方法用于检查是否支持指定 Saga 类型
    Object.defineProperty(target, 'supports', {
      value: function (sgType: string): boolean {
        return sgType === sagaType;
      },
      writable: false,
      enumerable: true,
      configurable: false,
    });

    // 添加静态方法用于获取元数据
    Object.defineProperty(target, 'getMetadata', {
      value: function (): ISagaMetadata | undefined {
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
 * 检查类是否被 @Saga 装饰器标记
 *
 * @param target - 目标类
 * @returns 如果被标记则返回 true，否则返回 false
 */
export function isSaga(target: any): boolean {
  return getSagaMetadata(target) !== undefined;
}

/**
 * 获取 Saga 处理器的 Saga 类型
 *
 * @param target - 目标类
 * @returns Saga 类型，如果未标记则返回 undefined
 */
export function getSagaType(target: any): string | undefined {
  const metadata = getSagaMetadata(target);
  return metadata?.sagaType;
}

/**
 * 获取 Saga 处理器的优先级
 *
 * @param target - 目标类
 * @returns 优先级，如果未标记则返回 undefined
 */
export function getSagaPriority(target: any): number | undefined {
  const metadata = getSagaMetadata(target);
  return metadata?.priority;
}

/**
 * 检查 Saga 处理器是否支持指定的 Saga 类型
 *
 * @param target - 目标类
 * @param sagaType - Saga 类型
 * @returns 如果支持则返回 true，否则返回 false
 */
export function supportsSagaType(target: any, sagaType: string): boolean {
  const metadata = getSagaMetadata(target);
  return metadata?.sagaType === sagaType;
}

/**
 * 获取 Saga 处理器的完整元数据
 *
 * @param target - 目标类
 * @returns Saga 处理器元数据，如果未标记则返回 undefined
 */
export function getSagaMetadata(target: any): ISagaMetadata | undefined {
  return getMetadata(target);
}

/**
 * Saga 装饰器类型
 */
export type SagaDecorator = typeof Saga;

/**
 * Saga 处理器类类型
 */
export type SagaHandlerClass<TEvent extends BaseDomainEvent = BaseDomainEvent> =
  new (...args: any[]) => ISagaHandler<TEvent> & {
    sagaType: string;
    priority: number;
    supports(sagaType: string): boolean;
    getMetadata(): ISagaMetadata | undefined;
  };
