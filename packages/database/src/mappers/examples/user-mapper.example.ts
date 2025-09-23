/**
 * 用户映射器使用示例
 *
 * 演示如何使用数据库映射器进行用户实体的映射操作。
 * 包含完整的映射器定义、配置和使用方法。
 *
 * @description 用户映射器示例展示了映射器的完整使用方法
 *
 * @example
 * ```typescript
 * // 使用映射器
 * const userMapper = new UserDatabaseMapper();
 * const dbEntity = userMapper.toPersistence(user);
 * const domainUser = userMapper.toDomain(dbEntity);
 *
 * // 在Repository中使用
 * @Repository({
 *   entity: User,
 *   mapper: UserDatabaseMapper
 * })
 * export class UserRepository extends MappedRepository<User, UserDbEntity> {
 *   // 自动应用映射器
 * }
 * ```
 *
 * @since 1.0.0
 */

import { DatabaseMapper } from '../decorators/database-mapper.decorator';
import { DatabaseDomainMapper } from '../base/database-mapper';

/**
 * 用户领域对象接口（示例）
 */
interface IUser {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 用户数据库实体接口（示例）
 */
interface IUserDbEntity {
  id: string;
  name: string;
  email: string;
  tenant_id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

/**
 * 用户数据库映射器示例
 *
 * @description 演示用户实体的数据库映射实现
 */
@DatabaseMapper({
  domainType: 'User',
  persistenceType: 'UserDbEntity',
  description: '用户数据库映射器',
  tableSchema: {
    tableName: 'users',
    schemaName: 'public',
    primaryKey: 'id',
    tenantColumn: 'tenant_id',
    createdAtColumn: 'created_at',
    updatedAtColumn: 'updated_at',
    deletedAtColumn: 'deleted_at',
  },
  tenantIsolation: {
    enabled: true,
    strategy: require('../decorators/database-mapper.decorator')
      .TenantIsolationStrategy.ROW_LEVEL,
    tenantColumn: 'tenant_id',
  },
  cache: {
    enabled: true,
    ttl: 300,
    keyPrefix: 'user',
    cacheNulls: false,
  },
  performanceMonitoring: true,
  slowQueryThreshold: 1000,
})
export class UserDatabaseMapper extends DatabaseDomainMapper<
  IUser,
  IUserDbEntity
> {
  constructor() {
    super('UserDatabaseMapper', {
      tenantIsolation: true,
      cacheEnabled: true,
      cacheTtl: 300,
      tableSchema: {
        tableName: 'users',
        schemaName: 'public',
        primaryKey: 'id',
        tenantColumn: 'tenant_id',
      },
    });
  }

  /**
   * 映射用户领域对象到数据库实体
   *
   * @param user - 用户领域对象
   * @returns 用户数据库实体
   * @protected
   */
  protected mapToPersistence(user: IUser): IUserDbEntity {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      tenant_id: user.tenantId,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    };
  }

  /**
   * 映射用户数据库实体到领域对象
   *
   * @param dbEntity - 用户数据库实体
   * @returns 用户领域对象
   * @protected
   */
  protected mapToDomain(dbEntity: IUserDbEntity): IUser {
    return {
      id: dbEntity.id,
      name: dbEntity.name,
      email: dbEntity.email,
      tenantId: dbEntity.tenant_id,
      createdAt: dbEntity.created_at,
      updatedAt: dbEntity.updated_at,
    };
  }

  /**
   * 验证用户领域对象
   *
   * @param user - 用户对象
   * @throws {Error} 当验证失败时
   * @protected
   */
  protected override validateDomainEntity(user: IUser): void {
    super.validateDomainEntity(user);

    if (!user.id) {
      throw new Error('用户ID不能为空');
    }

    if (!user.name || user.name.trim().length === 0) {
      throw new Error('用户名不能为空');
    }

    if (!user.email || !user.email.includes('@')) {
      throw new Error('用户邮箱格式无效');
    }

    if (!user.tenantId) {
      throw new Error('租户ID不能为空');
    }
  }

  /**
   * 验证用户数据库实体
   *
   * @param dbEntity - 数据库实体
   * @throws {Error} 当验证失败时
   * @protected
   */
  protected override validatePersistenceEntity(dbEntity: IUserDbEntity): void {
    super.validatePersistenceEntity(dbEntity);

    if (!dbEntity.id) {
      throw new Error('数据库实体ID不能为空');
    }

    if (!dbEntity.tenant_id) {
      throw new Error('数据库实体租户ID不能为空');
    }
  }
}
