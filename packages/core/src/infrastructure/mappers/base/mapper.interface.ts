/**
 * 映射器接口定义
 *
 * 定义映射器的基础接口，用于在不同层次之间进行数据转换。
 * 映射器是Clean Architecture中连接不同层次的关键组件。
 *
 * @description 映射器接口提供了数据转换的标准契约
 *
 * ## 业务规则
 *
 * ### 映射方向规则
 * - 支持双向映射：领域对象 ↔ 持久化对象
 * - 支持类型安全的映射转换
 * - 支持批量映射操作
 * - 支持映射验证和错误处理
 *
 * ### 映射一致性规则
 * - 映射操作必须是幂等的
 * - 往返映射必须保持数据一致性
 * - 映射失败时必须提供明确的错误信息
 * - 映射过程必须是可审计的
 *
 * ### 映射性能规则
 * - 映射操作应该是高效的
 * - 支持批量映射优化
 * - 支持映射结果缓存
 * - 避免不必要的对象创建
 *
 * @example
 * ```typescript
 * export class UserMapper implements IDomainMapper<User, UserDbEntity> {
 *   toPersistence(domainEntity: User): UserDbEntity {
 *     return {
 *       id: domainEntity.id.toString(),
 *       name: domainEntity.name,
 *       email: domainEntity.email,
 *       createdAt: domainEntity.createdAt,
 *       updatedAt: domainEntity.updatedAt
 *     };
 *   }
 *
 *   toDomain(dbEntity: UserDbEntity): User {
 *     return new User(
 *       EntityId.fromString(dbEntity.id),
 *       dbEntity.name,
 *       dbEntity.email,
 *       dbEntity.createdAt,
 *       dbEntity.updatedAt
 *     );
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

/**
 * 基础映射器接口
 *
 * @template TDomain - 领域对象类型
 * @template TPersistence - 持久化对象类型
 */
export interface IMapper<TDomain, TPersistence> {
  /**
   * 将领域对象映射为持久化对象
   *
   * @param domainEntity - 领域对象
   * @returns 持久化对象
   * @throws {MappingError} 当映射失败时
   */
  toPersistence(domainEntity: TDomain): TPersistence;

  /**
   * 将持久化对象映射为领域对象
   *
   * @param persistenceEntity - 持久化对象
   * @returns 领域对象
   * @throws {MappingError} 当映射失败时
   */
  toDomain(persistenceEntity: TPersistence): TDomain;
}

/**
 * 领域映射器接口
 *
 * @template TDomain - 领域对象类型
 * @template TPersistence - 持久化对象类型
 */
export interface IDomainMapper<TDomain, TPersistence>
  extends IMapper<TDomain, TPersistence> {
  /**
   * 批量映射领域对象为持久化对象
   *
   * @param domainEntities - 领域对象数组
   * @returns 持久化对象数组
   */
  toPersistenceBatch(domainEntities: TDomain[]): TPersistence[];

  /**
   * 批量映射持久化对象为领域对象
   *
   * @param persistenceEntities - 持久化对象数组
   * @returns 领域对象数组
   */
  toDomainBatch(persistenceEntities: TPersistence[]): TDomain[];

  /**
   * 验证映射的一致性
   *
   * @param domainEntity - 领域对象
   * @param persistenceEntity - 持久化对象
   * @returns 验证结果
   */
  validateMapping(
    domainEntity: TDomain,
    persistenceEntity: TPersistence,
  ): boolean;
}

/**
 * 聚合根映射器接口
 *
 * @template TAggregateRoot - 聚合根类型
 * @template TPersistence - 持久化对象类型
 */
export interface IAggregateMapper<TAggregateRoot, TPersistence>
  extends IDomainMapper<TAggregateRoot, TPersistence> {
  /**
   * 映射聚合根到持久化对象（包含事件）
   *
   * @param aggregateRoot - 聚合根
   * @returns 持久化对象和事件
   */
  toPersistenceWithEvents(aggregateRoot: TAggregateRoot): {
    entity: TPersistence;
    events: unknown[];
  };

  /**
   * 从持久化对象和事件历史重建聚合根
   *
   * @param persistenceEntity - 持久化对象
   * @param events - 事件历史
   * @returns 聚合根
   */
  fromPersistenceWithHistory(
    persistenceEntity: TPersistence,
    events: unknown[],
  ): TAggregateRoot;
}

/**
 * 值对象映射器接口
 *
 * @template TValueObject - 值对象类型
 * @template TPrimitive - 原始类型
 */
export interface IValueObjectMapper<TValueObject, TPrimitive> {
  /**
   * 将值对象映射为原始值
   *
   * @param valueObject - 值对象
   * @returns 原始值
   */
  toPrimitive(valueObject: TValueObject): TPrimitive;

  /**
   * 将原始值映射为值对象
   *
   * @param primitive - 原始值
   * @returns 值对象
   */
  fromPrimitive(primitive: TPrimitive): TValueObject;
}

/**
 * DTO映射器接口
 *
 * @template TDomain - 领域对象类型
 * @template TDTO - DTO类型
 */
export interface IDtoMapper<TDomain, TDTO> extends IMapper<TDomain, TDTO> {
  /**
   * 将领域对象映射为DTO
   *
   * @param domainEntity - 领域对象
   * @returns DTO对象
   */
  toDto(domainEntity: TDomain): TDTO;

  /**
   * 将DTO映射为领域对象
   *
   * @param dto - DTO对象
   * @returns 领域对象
   */
  fromDto(dto: TDTO): TDomain;
}
