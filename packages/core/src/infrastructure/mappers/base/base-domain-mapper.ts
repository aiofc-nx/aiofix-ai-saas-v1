/**
 * 基础领域映射器
 *
 * 提供领域对象映射的基础实现，包含通用的映射逻辑和工具方法。
 * 子类只需要实现具体的映射逻辑，基类负责处理通用功能。
 *
 * @description 基础领域映射器为所有领域映射器提供统一的基础功能
 *
 * ## 业务规则
 *
 * ### 映射执行规则
 * - 映射操作必须是原子性的
 * - 映射失败时必须回滚到原始状态
 * - 映射过程中的异常必须被正确处理
 * - 映射结果必须通过验证检查
 *
 * ### 映射一致性规则
 * - 往返映射必须保持数据完整性
 * - 映射操作必须是确定性的
 * - 相同输入必须产生相同输出
 * - 映射过程必须保持业务不变量
 *
 * ### 映射性能规则
 * - 批量映射应该比单个映射更高效
 * - 避免在映射过程中进行数据库查询
 * - 支持映射结果的缓存机制
 * - 优化对象创建和内存使用
 *
 * @example
 * ```typescript
 * export class UserMapper extends BaseDomainMapper<User, UserDbEntity> {
 *   constructor() {
 *     super('UserMapper');
 *   }
 *
 *   protected mapToPersistence(domainEntity: User): UserDbEntity {
 *     return {
 *       id: domainEntity.id.toString(),
 *       name: domainEntity.name,
 *       email: domainEntity.email,
 *       tenantId: domainEntity.tenantId,
 *       createdAt: domainEntity.createdAt,
 *       updatedAt: domainEntity.updatedAt
 *     };
 *   }
 *
 *   protected mapToDomain(dbEntity: UserDbEntity): User {
 *     return User.reconstitute(
 *       EntityId.fromString(dbEntity.id),
 *       dbEntity.name,
 *       dbEntity.email,
 *       dbEntity.tenantId,
 *       dbEntity.createdAt,
 *       dbEntity.updatedAt
 *     );
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { IDomainMapper } from './mapper.interface';

/**
 * 映射错误类
 */
export class MappingError extends Error {
  constructor(
    message: string,
    public readonly sourceType: string,
    public readonly targetType: string,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'MappingError';
  }
}

/**
 * 映射验证结果接口
 */
export interface IMappingValidationResult {
  /**
   * 是否验证通过
   */
  isValid: boolean;

  /**
   * 验证错误信息
   */
  errors: string[];

  /**
   * 警告信息
   */
  warnings: string[];
}

/**
 * 基础领域映射器抽象类
 *
 * @template TDomain - 领域对象类型
 * @template TPersistence - 持久化对象类型
 */
export abstract class BaseDomainMapper<TDomain, TPersistence>
  implements IDomainMapper<TDomain, TPersistence>
{
  protected readonly mapperName: string;

  /**
   * 构造函数
   *
   * @param mapperName - 映射器名称，用于日志和错误追踪
   */
  protected constructor(mapperName: string) {
    this.mapperName = mapperName;
  }

  /**
   * 将领域对象映射为持久化对象
   *
   * @param domainEntity - 领域对象
   * @returns 持久化对象
   * @throws {MappingError} 当映射失败时
   */
  public toPersistence(domainEntity: TDomain): TPersistence {
    try {
      this.validateDomainEntity(domainEntity);
      const result = this.mapToPersistence(domainEntity);
      this.validatePersistenceEntity(result);
      return result;
    } catch (error) {
      throw new MappingError(
        `映射到持久化对象失败: ${error instanceof Error ? error.message : String(error)}`,
        'Domain',
        'Persistence',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 将持久化对象映射为领域对象
   *
   * @param persistenceEntity - 持久化对象
   * @returns 领域对象
   * @throws {MappingError} 当映射失败时
   */
  public toDomain(persistenceEntity: TPersistence): TDomain {
    try {
      this.validatePersistenceEntity(persistenceEntity);
      const result = this.mapToDomain(persistenceEntity);
      this.validateDomainEntity(result);
      return result;
    } catch (error) {
      throw new MappingError(
        `映射到领域对象失败: ${error instanceof Error ? error.message : String(error)}`,
        'Persistence',
        'Domain',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 批量映射领域对象为持久化对象
   *
   * @param domainEntities - 领域对象数组
   * @returns 持久化对象数组
   */
  public toPersistenceBatch(domainEntities: TDomain[]): TPersistence[] {
    return domainEntities.map((entity) => this.toPersistence(entity));
  }

  /**
   * 批量映射持久化对象为领域对象
   *
   * @param persistenceEntities - 持久化对象数组
   * @returns 领域对象数组
   */
  public toDomainBatch(persistenceEntities: TPersistence[]): TDomain[] {
    return persistenceEntities.map((entity) => this.toDomain(entity));
  }

  /**
   * 验证映射的一致性
   *
   * @param domainEntity - 领域对象
   * @param persistenceEntity - 持久化对象
   * @returns 验证结果
   */
  public validateMapping(
    domainEntity: TDomain,
    _persistenceEntity: TPersistence,
  ): boolean {
    try {
      // 往返映射验证
      const mappedToPersistence = this.toPersistence(domainEntity);
      const mappedBackToDomain = this.toDomain(mappedToPersistence);

      // 验证往返映射的一致性
      return this.compareDomainEntities(domainEntity, mappedBackToDomain);
    } catch {
      return false;
    }
  }

  /**
   * 映射领域对象到持久化对象的具体实现
   *
   * @param domainEntity - 领域对象
   * @returns 持久化对象
   * @protected
   */
  protected abstract mapToPersistence(domainEntity: TDomain): TPersistence;

  /**
   * 映射持久化对象到领域对象的具体实现
   *
   * @param persistenceEntity - 持久化对象
   * @returns 领域对象
   * @protected
   */
  protected abstract mapToDomain(persistenceEntity: TPersistence): TDomain;

  /**
   * 验证领域对象的有效性
   *
   * @param domainEntity - 领域对象
   * @throws {Error} 当验证失败时
   * @protected
   */
  protected validateDomainEntity(domainEntity: TDomain): void {
    if (domainEntity === null || domainEntity === undefined) {
      throw new Error('领域对象不能为空');
    }
  }

  /**
   * 验证持久化对象的有效性
   *
   * @param persistenceEntity - 持久化对象
   * @throws {Error} 当验证失败时
   * @protected
   */
  protected validatePersistenceEntity(persistenceEntity: TPersistence): void {
    if (persistenceEntity === null || persistenceEntity === undefined) {
      throw new Error('持久化对象不能为空');
    }
  }

  /**
   * 比较两个领域对象是否相等
   *
   * @param entity1 - 第一个领域对象
   * @param entity2 - 第二个领域对象
   * @returns 是否相等
   * @protected
   */
  protected compareDomainEntities(entity1: TDomain, entity2: TDomain): boolean {
    // 默认实现使用JSON比较，子类可以重写
    return JSON.stringify(entity1) === JSON.stringify(entity2);
  }

  /**
   * 记录映射日志
   *
   * @param level - 日志级别
   * @param message - 日志消息
   * @param context - 上下文信息
   * @protected
   */
  protected log(
    _level: string,
    _message: string,
    _context?: Record<string, unknown>,
  ): void {
    // TODO: 替换为实际的日志系统
    // console.log(`[${_level.toUpperCase()}] [${this.mapperName}] ${_message}`, _context);
  }
}
