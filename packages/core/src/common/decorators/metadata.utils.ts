/**
 * 装饰器元数据工具函数
 *
 * 提供了用于操作装饰器元数据的工具函数。
 * 这些函数封装了 Reflect API 的使用，提供类型安全的元数据操作。
 *
 * ## 业务规则
 *
 * ### 类型安全规则
 * - 所有工具函数都提供类型安全
 * - 使用泛型确保元数据类型正确
 * - 支持编译时类型检查
 *
 * ### 错误处理规则
 * - 工具函数应该处理异常情况
 * - 提供有意义的错误信息
 * - 支持默认值和回退机制
 *
 * ### 性能规则
 * - 工具函数应该优化性能
 * - 避免重复的反射操作
 * - 支持缓存机制
 *
 * @description 装饰器元数据工具函数
 * @since 1.0.0
 */
import 'reflect-metadata';
import { METADATA_VERSION, DecoratorType } from './metadata.constants';
import {
  IMetadata,
  ICommandHandlerMetadata,
  IQueryHandlerMetadata,
  IEventHandlerMetadata,
  ISagaMetadata,
} from './metadata.interfaces';

/**
 * 设置元数据
 *
 * @param target - 目标对象
 * @param metadataKey - 元数据键
 * @param metadata - 元数据值
 */
export function setMetadata<T extends IMetadata>(
  target: object,
  metadataKey: string,
  metadata: T,
): void {
  Reflect.defineMetadata(metadataKey, metadata, target);
}

/**
 * 获取元数据
 *
 * @param target - 目标对象
 * @param metadataKey - 元数据键
 * @returns 元数据值，如果不存在则返回 undefined
 */
export function getMetadata<T extends IMetadata>(
  target: object,
  metadataKey: string,
): T | undefined {
  return Reflect.getMetadata(metadataKey, target) as T | undefined;
}

/**
 * 检查是否存在元数据
 *
 * @param target - 目标对象
 * @param metadataKey - 元数据键
 * @returns 如果存在元数据则返回 true，否则返回 false
 */
export function hasMetadata(target: object, metadataKey: string): boolean {
  return Reflect.hasMetadata(metadataKey, target);
}

/**
 * 删除元数据
 *
 * @param target - 目标对象
 * @param metadataKey - 元数据键
 * @returns 如果成功删除则返回 true，否则返回 false
 */
export function deleteMetadata(target: object, metadataKey: string): boolean {
  return Reflect.deleteMetadata(metadataKey, target);
}

/**
 * 获取所有元数据键
 *
 * @param target - 目标对象
 * @returns 元数据键数组
 */
export function getMetadataKeys(target: object): string[] {
  return Reflect.getMetadataKeys(target) || [];
}

/**
 * 设置命令处理器元数据
 *
 * @param target - 目标对象
 * @param commandType - 命令类型
 * @param metadata - 元数据
 */
export function setCommandHandlerMetadata(
  target: object,
  commandType: string,
  metadata: Partial<ICommandHandlerMetadata> = {},
): void {
  const fullMetadata: ICommandHandlerMetadata = {
    decoratorType: 'CommandHandler' as DecoratorType,
    version: METADATA_VERSION,
    createdAt: new Date(),
    enabled: true,
    priority: 0,
    commandType,
    handlerType: 'Command' as any,
    enableLogging: true,
    enableAudit: true,
    enablePerformanceMonitor: true,
    ...metadata,
  };

  setMetadata(target, 'aiofix:core:CommandHandlerMetadata', fullMetadata);
}

/**
 * 获取命令处理器元数据
 *
 * @param target - 目标对象
 * @returns 命令处理器元数据，如果不存在则返回 undefined
 */
export function getCommandHandlerMetadata(
  target: object,
): ICommandHandlerMetadata | undefined {
  return getMetadata<ICommandHandlerMetadata>(
    target,
    'aiofix:core:CommandHandlerMetadata',
  );
}

/**
 * 设置查询处理器元数据
 *
 * @param target - 目标对象
 * @param queryType - 查询类型
 * @param metadata - 元数据
 */
export function setQueryHandlerMetadata(
  target: object,
  queryType: string,
  metadata: Partial<IQueryHandlerMetadata> = {},
): void {
  const fullMetadata: IQueryHandlerMetadata = {
    decoratorType: 'QueryHandler' as DecoratorType,
    version: METADATA_VERSION,
    createdAt: new Date(),
    enabled: true,
    priority: 0,
    queryType,
    handlerType: 'Query' as any,
    enableLogging: true,
    enableAudit: false,
    enablePerformanceMonitor: true,
    ...metadata,
  };

  setMetadata(target, 'aiofix:core:QueryHandlerMetadata', fullMetadata);
}

/**
 * 获取查询处理器元数据
 *
 * @param target - 目标对象
 * @returns 查询处理器元数据，如果不存在则返回 undefined
 */
export function getQueryHandlerMetadata(
  target: object,
): IQueryHandlerMetadata | undefined {
  return getMetadata<IQueryHandlerMetadata>(
    target,
    'aiofix:core:QueryHandlerMetadata',
  );
}

/**
 * 设置事件处理器元数据
 *
 * @param target - 目标对象
 * @param eventType - 事件类型
 * @param metadata - 元数据
 */
export function setEventHandlerMetadata(
  target: object,
  eventType: string,
  metadata: Partial<IEventHandlerMetadata> = {},
): void {
  const fullMetadata: IEventHandlerMetadata = {
    decoratorType: 'EventHandler' as DecoratorType,
    version: METADATA_VERSION,
    createdAt: new Date(),
    enabled: true,
    priority: 0,
    eventType,
    handlerType: 'Event' as any,
    enableLogging: true,
    enableAudit: true,
    enablePerformanceMonitor: true,
    enableIdempotency: true,
    enableDeadLetterQueue: true,
    ...metadata,
  };

  setMetadata(target, 'aiofix:core:EventHandlerMetadata', fullMetadata);
}

/**
 * 获取事件处理器元数据
 *
 * @param target - 目标对象
 * @returns 事件处理器元数据，如果不存在则返回 undefined
 */
export function getEventHandlerMetadata(
  target: object,
): IEventHandlerMetadata | undefined {
  return getMetadata<IEventHandlerMetadata>(
    target,
    'aiofix:core:EventHandlerMetadata',
  );
}

/**
 * 设置 Saga 元数据
 *
 * @param target - 目标对象
 * @param sagaType - Saga 类型
 * @param metadata - 元数据
 */
export function setSagaMetadata(
  target: object,
  sagaType: string,
  metadata: Partial<ISagaMetadata> = {},
): void {
  const fullMetadata: ISagaMetadata = {
    decoratorType: 'Saga' as DecoratorType,
    version: METADATA_VERSION,
    createdAt: new Date(),
    enabled: true,
    priority: 0,
    sagaType,
    handlerType: 'Saga' as any,
    enableLogging: true,
    enableAudit: true,
    enablePerformanceMonitor: true,
    enableCompensation: true,
    enableTimeout: true,
    ...metadata,
  };

  setMetadata(target, 'aiofix:core:SagaMetadata', fullMetadata);
}

/**
 * 获取 Saga 元数据
 *
 * @param target - 目标对象
 * @returns Saga 元数据，如果不存在则返回 undefined
 */
export function getSagaMetadata(target: object): ISagaMetadata | undefined {
  return getMetadata<ISagaMetadata>(target, 'aiofix:core:SagaMetadata');
}

/**
 * 获取所有处理器元数据
 *
 * @param target - 目标对象
 * @returns 所有处理器元数据数组
 */
export function getAllHandlerMetadata(target: object): IMetadata[] {
  const metadataKeys = getMetadataKeys(target);
  const handlerMetadata: IMetadata[] = [];

  for (const key of metadataKeys) {
    if (key.startsWith('aiofix:core:') && key.endsWith('Metadata')) {
      const metadata = getMetadata<IMetadata>(target, key);
      if (metadata) {
        handlerMetadata.push(metadata);
      }
    }
  }

  return handlerMetadata;
}

/**
 * 检查是否是指定的处理器类型
 *
 * @param target - 目标对象
 * @param handlerType - 处理器类型
 * @returns 如果是指定的处理器类型则返回 true，否则返回 false
 */
export function isHandlerType(target: object, handlerType: string): boolean {
  const metadata = getAllHandlerMetadata(target);
  return metadata.some((m) => m.handlerType === handlerType);
}

/**
 * 检查是否是命令处理器
 *
 * @param target - 目标对象
 * @returns 如果是命令处理器则返回 true，否则返回 false
 */
export function isCommandHandler(target: object): boolean {
  return isHandlerType(target, 'Command');
}

/**
 * 检查是否是查询处理器
 *
 * @param target - 目标对象
 * @returns 如果是查询处理器则返回 true，否则返回 false
 */
export function isQueryHandler(target: object): boolean {
  return isHandlerType(target, 'Query');
}

/**
 * 检查是否是事件处理器
 *
 * @param target - 目标对象
 * @returns 如果是事件处理器则返回 true，否则返回 false
 */
export function isEventHandler(target: object): boolean {
  return isHandlerType(target, 'Event');
}

/**
 * 检查是否是 Saga
 *
 * @param target - 目标对象
 * @returns 如果是 Saga 则返回 true，否则返回 false
 */
export function isSaga(target: object): boolean {
  return isHandlerType(target, 'Saga');
}

/**
 * 合并元数据
 *
 * @param baseMetadata - 基础元数据
 * @param overrideMetadata - 覆盖元数据
 * @returns 合并后的元数据
 */
export function mergeMetadata<T extends IMetadata>(
  baseMetadata: T,
  overrideMetadata: Partial<T>,
): T {
  const merged = {
    ...baseMetadata,
    ...overrideMetadata,
  } as T;

  // 深度合并嵌套对象（使用类型断言处理不同的元数据类型）
  const base = baseMetadata as any;
  const override = overrideMetadata as any;

  if (base.retry || override.retry) {
    merged.retry =
      base.retry && override.retry
        ? { ...base.retry, ...override.retry }
        : override.retry || base.retry;
  }

  if (base.cache || override.cache) {
    (merged as any).cache =
      base.cache && override.cache
        ? { ...base.cache, ...override.cache }
        : override.cache || base.cache;
  }

  if (base.validation || override.validation) {
    (merged as any).validation =
      base.validation && override.validation
        ? { ...base.validation, ...override.validation }
        : override.validation || base.validation;
  }

  if (base.authorization || override.authorization) {
    (merged as any).authorization =
      base.authorization && override.authorization
        ? { ...base.authorization, ...override.authorization }
        : override.authorization || base.authorization;
  }

  if (base.transaction || override.transaction) {
    (merged as any).transaction =
      base.transaction && override.transaction
        ? { ...base.transaction, ...override.transaction }
        : override.transaction || base.transaction;
  }

  if (base.multiTenant || override.multiTenant) {
    (merged as any).multiTenant =
      base.multiTenant && override.multiTenant
        ? { ...base.multiTenant, ...override.multiTenant }
        : override.multiTenant || base.multiTenant;
  }

  if (base.dataIsolation || override.dataIsolation) {
    (merged as any).dataIsolation =
      base.dataIsolation && override.dataIsolation
        ? { ...base.dataIsolation, ...override.dataIsolation }
        : override.dataIsolation || base.dataIsolation;
  }

  if (base.performanceMonitor || override.performanceMonitor) {
    merged.performanceMonitor =
      base.performanceMonitor && override.performanceMonitor
        ? { ...base.performanceMonitor, ...override.performanceMonitor }
        : override.performanceMonitor || base.performanceMonitor;
  }

  if (base.customConfig || override.customConfig) {
    merged.customConfig =
      base.customConfig && override.customConfig
        ? { ...base.customConfig, ...override.customConfig }
        : override.customConfig || base.customConfig;
  }

  return merged;
}

/**
 * 验证元数据
 *
 * @param metadata - 要验证的元数据
 * @returns 如果元数据有效则返回 true，否则返回 false
 */
export function validateMetadata(metadata: IMetadata): boolean {
  if (!metadata.decoratorType || !metadata.version || !metadata.createdAt) {
    return false;
  }

  if (typeof metadata.enabled !== 'boolean') {
    return false;
  }

  if (typeof metadata.priority !== 'number' || metadata.priority < 0) {
    return false;
  }

  if (
    metadata.timeout !== undefined &&
    (typeof metadata.timeout !== 'number' || metadata.timeout <= 0)
  ) {
    return false;
  }

  return true;
}

/**
 * 克隆元数据
 *
 * @param metadata - 要克隆的元数据
 * @returns 克隆后的元数据
 */
export function cloneMetadata<T extends IMetadata>(metadata: T): T {
  return JSON.parse(JSON.stringify(metadata)) as T;
}

/**
 * 获取元数据摘要
 *
 * @param metadata - 元数据
 * @returns 元数据摘要
 */
export function getMetadataSummary(
  metadata: IMetadata,
): Record<string, unknown> {
  const meta = metadata as any;
  return {
    decoratorType: metadata.decoratorType,
    version: metadata.version,
    enabled: metadata.enabled,
    priority: metadata.priority,
    timeout: metadata.timeout,
    createdAt: metadata.createdAt,
    hasRetry: !!meta.retry,
    hasCache: !!meta.cache,
    hasValidation: !!meta.validation,
    hasAuthorization: !!meta.authorization,
    hasTransaction: !!meta.transaction,
    hasMultiTenant: !!meta.multiTenant,
    hasDataIsolation: !!meta.dataIsolation,
    hasPerformanceMonitor: !!meta.performanceMonitor,
    hasCustomConfig: !!meta.customConfig,
  };
}
