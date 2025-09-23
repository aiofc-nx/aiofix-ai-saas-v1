/**
 * 基础聚合根映射器
 *
 * 提供聚合根映射的基础实现，包含事件处理和聚合根重建功能。
 * 聚合根映射器是事件溯源架构中的关键组件。
 *
 * @description 基础聚合根映射器为所有聚合根映射器提供统一的基础功能
 *
 * ## 业务规则
 *
 * ### 聚合根映射规则
 * - 聚合根映射必须包含事件处理
 * - 支持从事件历史重建聚合根状态
 * - 映射过程必须保持聚合根的完整性
 * - 事件序列必须保持正确的顺序
 *
 * ### 事件处理规则
 * - 未提交的事件必须被正确提取
 * - 事件映射必须保持事件的完整性
 * - 事件顺序必须与聚合根状态一致
 * - 事件重放必须能够重建正确的聚合根状态
 *
 * ### 聚合根重建规则
 * - 重建过程必须按事件时间顺序执行
 * - 重建结果必须与原始聚合根状态一致
 * - 重建过程必须处理事件版本兼容性
 * - 重建失败时必须提供详细的错误信息
 *
 * @example
 * ```typescript
 * export class UserAggregateMapper extends BaseAggregateMapper<UserAggregate, UserDbEntity> {
 *   constructor() {
 *     super('UserAggregateMapper');
 *   }
 *
 *   protected mapToPersistence(aggregateRoot: UserAggregate): UserDbEntity {
 *     return {
 *       id: aggregateRoot.id.toString(),
 *       name: aggregateRoot.name,
 *       email: aggregateRoot.email,
 *       version: aggregateRoot.version,
 *       createdAt: aggregateRoot.createdAt,
 *       updatedAt: aggregateRoot.updatedAt
 *     };
 *   }
 *
 *   protected mapToDomain(dbEntity: UserDbEntity): UserAggregate {
 *     return UserAggregate.reconstitute(
 *       EntityId.fromString(dbEntity.id),
 *       dbEntity.name,
 *       dbEntity.email,
 *       dbEntity.version,
 *       dbEntity.createdAt,
 *       dbEntity.updatedAt
 *     );
 *   }
 *
 *   protected mapEventToPersistence(event: BaseDomainEvent): unknown {
 *     return {
 *       eventId: event.eventId.toString(),
 *       eventType: event.eventType,
 *       aggregateId: event.aggregateId.toString(),
 *       eventData: event.eventData,
 *       occurredAt: event.occurredAt,
 *       version: event.version
 *     };
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import type { BaseDomainEvent } from '../../../domain/events/base/base-domain-event';
import { BaseDomainMapper, MappingError } from './base-domain-mapper';
import type { IAggregateMapper } from './mapper.interface';

/**
 * 聚合根映射结果接口
 */
export interface IAggregateRootMappingResult<TPersistence> {
  /**
   * 持久化实体
   */
  entity: TPersistence;

  /**
   * 未提交的事件
   */
  events: unknown[];
}

/**
 * 事件映射结果接口
 */
export interface IEventMappingResult {
  /**
   * 事件标识符
   */
  eventId: string;

  /**
   * 事件类型
   */
  eventType: string;

  /**
   * 聚合根标识符
   */
  aggregateId: string;

  /**
   * 事件数据
   */
  eventData: Record<string, unknown>;

  /**
   * 发生时间
   */
  occurredAt: Date;

  /**
   * 事件版本
   */
  version: number;
}

/**
 * 基础聚合根映射器抽象类
 *
 * @template TAggregateRoot - 聚合根类型
 * @template TPersistence - 持久化对象类型
 */
export abstract class BaseAggregateMapper<TAggregateRoot, TPersistence>
  extends BaseDomainMapper<TAggregateRoot, TPersistence>
  implements IAggregateMapper<TAggregateRoot, TPersistence>
{
  /**
   * 构造函数
   *
   * @param mapperName - 映射器名称
   */
  protected constructor(mapperName: string) {
    super(mapperName);
  }

  /**
   * 映射聚合根到持久化对象（包含事件）
   *
   * @param aggregateRoot - 聚合根
   * @returns 持久化对象和事件
   */
  public toPersistenceWithEvents(
    aggregateRoot: TAggregateRoot,
  ): IAggregateRootMappingResult<TPersistence> {
    try {
      this.validateDomainEntity(aggregateRoot);

      // 映射聚合根实体
      const entity = this.mapToPersistence(aggregateRoot);

      // 提取和映射未提交的事件
      const uncommittedEvents = this.extractUncommittedEvents(aggregateRoot);
      const mappedEvents = uncommittedEvents.map((event) =>
        this.mapEventToPersistence(event),
      );

      return {
        entity,
        events: mappedEvents,
      };
    } catch (error) {
      throw new MappingError(
        `聚合根映射失败: ${error instanceof Error ? error.message : String(error)}`,
        'AggregateRoot',
        'PersistenceWithEvents',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 从持久化对象和事件历史重建聚合根
   *
   * @param persistenceEntity - 持久化对象
   * @param events - 事件历史
   * @returns 聚合根
   */
  public fromPersistenceWithHistory(
    persistenceEntity: TPersistence,
    events: unknown[],
  ): TAggregateRoot {
    try {
      this.validatePersistenceEntity(persistenceEntity);

      // 先从持久化对象创建基础聚合根
      const aggregateRoot = this.mapToDomain(persistenceEntity);

      // 如果有事件历史，重放事件
      if (events.length > 0) {
        const domainEvents = events.map((event) =>
          this.mapEventToDomain(event),
        );
        return this.replayEvents(aggregateRoot, domainEvents);
      }

      return aggregateRoot;
    } catch (error) {
      throw new MappingError(
        `从事件历史重建聚合根失败: ${error instanceof Error ? error.message : String(error)}`,
        'PersistenceWithEvents',
        'AggregateRoot',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 提取聚合根的未提交事件
   *
   * @param aggregateRoot - 聚合根
   * @returns 未提交的事件数组
   * @protected
   */
  protected extractUncommittedEvents(
    aggregateRoot: TAggregateRoot,
  ): BaseDomainEvent[] {
    // 默认实现假设聚合根有getUncommittedEvents方法
    // 子类可以重写此方法以适应不同的聚合根实现
    if (
      typeof (aggregateRoot as Record<string, unknown>).getUncommittedEvents ===
      'function'
    ) {
      const method = (aggregateRoot as Record<string, unknown>)
        .getUncommittedEvents as () => BaseDomainEvent[];
      return method();
    }
    return [];
  }

  /**
   * 映射事件到持久化格式
   *
   * @param event - 领域事件
   * @returns 持久化事件格式
   * @protected
   */
  protected mapEventToPersistence(event: BaseDomainEvent): IEventMappingResult {
    return {
      eventId: event.eventId.toString(),
      eventType: event.eventType,
      aggregateId: event.aggregateId.toString(),
      eventData: event.eventData || {},
      occurredAt: event.occurredAt,
      version: (event as unknown as { version: number }).version || 1,
    };
  }

  /**
   * 映射持久化事件到领域事件
   *
   * @param eventData - 持久化事件数据
   * @returns 领域事件
   * @protected
   */
  protected abstract mapEventToDomain(eventData: unknown): BaseDomainEvent;

  /**
   * 重放事件到聚合根
   *
   * @param aggregateRoot - 聚合根
   * @param events - 事件数组
   * @returns 重建后的聚合根
   * @protected
   */
  protected replayEvents(
    aggregateRoot: TAggregateRoot,
    events: BaseDomainEvent[],
  ): TAggregateRoot {
    // 默认实现假设聚合根有replayEvents方法
    // 子类可以重写此方法以适应不同的聚合根实现
    if (
      typeof (aggregateRoot as Record<string, unknown>).replayEvents ===
      'function'
    ) {
      const method = (aggregateRoot as Record<string, unknown>)
        .replayEvents as (events: BaseDomainEvent[]) => TAggregateRoot;
      return method(events);
    }

    // 如果没有replayEvents方法，返回原聚合根
    this.log('warn', '聚合根没有实现replayEvents方法，跳过事件重放', {
      aggregateType: (aggregateRoot as Record<string, unknown>).constructor
        ?.name,
      eventsCount: events.length,
    });

    return aggregateRoot;
  }

  /**
   * 获取聚合根版本
   *
   * @param aggregateRoot - 聚合根
   * @returns 版本号
   * @protected
   */
  protected getAggregateVersion(aggregateRoot: TAggregateRoot): number {
    if (
      typeof (aggregateRoot as Record<string, unknown>).version === 'number'
    ) {
      return (aggregateRoot as Record<string, unknown>).version as number;
    }
    return 1; // 默认版本
  }

  /**
   * 设置聚合根版本
   *
   * @param aggregateRoot - 聚合根
   * @param version - 版本号
   * @protected
   */
  protected setAggregateVersion(
    aggregateRoot: TAggregateRoot,
    version: number,
  ): void {
    if (
      typeof (aggregateRoot as Record<string, unknown>).setVersion ===
      'function'
    ) {
      const method = (aggregateRoot as Record<string, unknown>).setVersion as (
        version: number,
      ) => void;
      method(version);
    }
  }
}
