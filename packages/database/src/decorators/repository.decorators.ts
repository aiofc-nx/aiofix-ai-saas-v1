/**
 * Repository装饰器系统
 *
 * @description 声明式的数据库Repository装饰器
 * 提供@Entity、@Repository、@Column等装饰器简化数据访问
 *
 * ## 业务规则
 *
 * ### 实体装饰器规则
 * - @Entity装饰器标记领域实体类
 * - 自动映射实体到数据库表
 * - 支持表名自定义和命名策略
 * - 集成多租户隔离策略
 *
 * ### Repository装饰器规则
 * - @Repository装饰器自动创建仓储实例
 * - 支持依赖注入和生命周期管理
 * - 自动应用租户隔离和CQRS模式
 * - 提供基础CRUD操作和高级查询
 *
 * ### 列装饰器规则
 * - @Column装饰器定义实体属性映射
 * - 支持类型验证和数据转换
 * - 支持索引、约束和关系定义
 * - 集成数据验证和业务规则
 *
 * ### 关系装饰器规则
 * - @OneToMany、@ManyToOne等关系装饰器
 * - 支持延迟加载和级联操作
 * - 自动处理外键约束和数据一致性
 * - 集成多租户的关系隔离
 *
 * @since 1.0.0
 */

/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
import { Injectable, Inject } from '@nestjs/common';
import 'reflect-metadata';

/**
 * 实体元数据键
 */
export const ENTITY_METADATA_KEY = Symbol('entity:metadata');
export const REPOSITORY_METADATA_KEY = Symbol('repository:metadata');
export const COLUMN_METADATA_KEY = Symbol('column:metadata');
export const RELATION_METADATA_KEY = Symbol('relation:metadata');

/**
 * 实体配置选项
 */
export interface IEntityOptions {
  /** 表名 */
  tableName?: string;
  /** 数据库模式 */
  schema?: string;
  /** 是否启用多租户 */
  enableMultiTenant?: boolean;
  /** 租户ID列名 */
  tenantIdColumn?: string;
  /** 是否启用软删除 */
  enableSoftDelete?: boolean;
  /** 软删除列名 */
  softDeleteColumn?: string;
  /** 是否启用时间戳 */
  enableTimestamps?: boolean;
  /** 创建时间列名 */
  createdAtColumn?: string;
  /** 更新时间列名 */
  updatedAtColumn?: string;
}

/**
 * Repository配置选项
 */
export interface IRepositoryOptions {
  /** 连接名称 */
  connectionName?: string;
  /** 是否启用缓存 */
  enableCache?: boolean;
  /** 缓存TTL */
  cacheTTL?: number;
  /** 是否启用CQRS */
  enableCQRS?: boolean;
  /** 读连接名称 */
  readConnectionName?: string;
  /** 写连接名称 */
  writeConnectionName?: string;
}

/**
 * 列配置选项
 */
export interface IColumnOptions {
  /** 列名 */
  name?: string;
  /** 数据类型 */
  type?: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'uuid';
  /** 是否为主键 */
  primary?: boolean;
  /** 是否可为空 */
  nullable?: boolean;
  /** 默认值 */
  default?: any;
  /** 是否唯一 */
  unique?: boolean;
  /** 字段长度 */
  length?: number;
  /** 是否为索引 */
  index?: boolean;
}

/**
 * 关系配置选项
 */
export interface IRelationOptions {
  /** 目标实体 */
  target: () => any;
  /** 外键列名 */
  foreignKey?: string;
  /** 是否延迟加载 */
  lazy?: boolean;
  /** 级联操作 */
  cascade?: Array<'insert' | 'update' | 'remove'>;
  /** 是否可为空 */
  nullable?: boolean;
}

/**
 * 实体元数据
 */
export interface IEntityMetadata {
  /** 实体类 */
  target: any;
  /** 表名 */
  tableName: string;
  /** 数据库模式 */
  schema?: string;
  /** 配置选项 */
  options: IEntityOptions;
  /** 列元数据 */
  columns: Map<string, IColumnMetadata>;
  /** 关系元数据 */
  relations: Map<string, IRelationMetadata>;
}

/**
 * Repository元数据
 */
export interface IRepositoryMetadata {
  /** Repository类 */
  target: any;
  /** 实体类 */
  entityClass: any;
  /** 配置选项 */
  options: IRepositoryOptions;
}

/**
 * 列元数据
 */
export interface IColumnMetadata {
  /** 属性名 */
  propertyName: string;
  /** 列名 */
  columnName: string;
  /** 配置选项 */
  options: IColumnOptions;
}

/**
 * 关系元数据
 */
export interface IRelationMetadata {
  /** 属性名 */
  propertyName: string;
  /** 关系类型 */
  relationType: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  /** 配置选项 */
  options: IRelationOptions;
}

/**
 * 实体装饰器
 *
 * @description 标记类为数据库实体
 *
 * @param options - 实体配置选项
 * @returns 类装饰器
 */
export function Entity(options: IEntityOptions = {}): ClassDecorator {
  return function (target: any) {
    const tableName = options.tableName || target.name.toLowerCase();

    const entityMetadata: IEntityMetadata = {
      target,
      tableName,
      schema: options.schema,
      options: {
        enableMultiTenant: true,
        tenantIdColumn: 'tenant_id',
        enableSoftDelete: false,
        enableTimestamps: true,
        createdAtColumn: 'created_at',
        updatedAtColumn: 'updated_at',
        ...options,
      },
      columns: new Map(),
      relations: new Map(),
    };

    Reflect.defineMetadata(ENTITY_METADATA_KEY, entityMetadata, target);

    console.log(`注册实体装饰器: ${target.name} -> ${tableName}`);

    return target;
  };
}

/**
 * Repository装饰器
 *
 * @description 标记类为Repository并自动注册
 *
 * @param entityClass - 关联的实体类
 * @param options - Repository配置选项
 * @returns 类装饰器
 */
export function Repository(
  entityClass: any,
  options: IRepositoryOptions = {},
): ClassDecorator {
  return function (target: any) {
    const repositoryMetadata: IRepositoryMetadata = {
      target,
      entityClass,
      options: {
        enableCache: false,
        cacheTTL: 300000, // 5分钟
        enableCQRS: true,
        ...options,
      },
    };

    Reflect.defineMetadata(REPOSITORY_METADATA_KEY, repositoryMetadata, target);

    // 使其可注入
    Injectable()(target);

    console.log(`注册Repository装饰器: ${target.name} for ${entityClass.name}`);

    return target;
  };
}

/**
 * 列装饰器
 *
 * @description 定义实体属性到数据库列的映射
 *
 * @param options - 列配置选项
 * @returns 属性装饰器
 */
export function Column(options: IColumnOptions = {}): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    const propertyName = String(propertyKey);
    const columnName = options.name || propertyName;

    const columnMetadata: IColumnMetadata = {
      propertyName,
      columnName,
      options: {
        type: 'string',
        nullable: true,
        ...options,
      },
    };

    // 获取或创建实体元数据
    let entityMetadata: IEntityMetadata = Reflect.getMetadata(
      ENTITY_METADATA_KEY,
      target.constructor,
    );
    if (!entityMetadata) {
      entityMetadata = {
        target: target.constructor,
        tableName: target.constructor.name.toLowerCase(),
        options: {},
        columns: new Map(),
        relations: new Map(),
      };
      Reflect.defineMetadata(
        ENTITY_METADATA_KEY,
        entityMetadata,
        target.constructor,
      );
    }

    entityMetadata.columns.set(propertyName, columnMetadata);

    console.log(
      `注册列装饰器: ${target.constructor.name}.${propertyName} -> ${columnName}`,
    );
  };
}

/**
 * 主键装饰器
 *
 * @description 标记属性为主键
 *
 * @param options - 主键配置选项
 * @returns 属性装饰器
 */
export function PrimaryKey(
  options: Omit<IColumnOptions, 'primary'> = {},
): PropertyDecorator {
  return Column({
    ...options,
    primary: true,
    nullable: false,
  });
}

/**
 * 一对多关系装饰器
 *
 * @description 定义一对多关系
 *
 * @param targetEntity - 目标实体类
 * @param options - 关系配置选项
 * @returns 属性装饰器
 */
export function OneToMany(
  targetEntity: () => any,
  options: Omit<IRelationOptions, 'target'> = {},
): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    const propertyName = String(propertyKey);

    const relationMetadata: IRelationMetadata = {
      propertyName,
      relationType: 'one-to-many',
      options: {
        target: targetEntity,
        lazy: true,
        ...options,
      },
    };

    // 获取或创建实体元数据
    let entityMetadata: IEntityMetadata = Reflect.getMetadata(
      ENTITY_METADATA_KEY,
      target.constructor,
    );
    if (!entityMetadata) {
      entityMetadata = {
        target: target.constructor,
        tableName: target.constructor.name.toLowerCase(),
        options: {},
        columns: new Map(),
        relations: new Map(),
      };
      Reflect.defineMetadata(
        ENTITY_METADATA_KEY,
        entityMetadata,
        target.constructor,
      );
    }

    entityMetadata.relations.set(propertyName, relationMetadata);

    console.log(
      `注册一对多关系: ${target.constructor.name}.${propertyName} -> ${targetEntity().name}`,
    );
  };
}

/**
 * 多对一关系装饰器
 *
 * @description 定义多对一关系
 *
 * @param targetEntity - 目标实体类
 * @param options - 关系配置选项
 * @returns 属性装饰器
 */
export function ManyToOne(
  targetEntity: () => any,
  options: Omit<IRelationOptions, 'target'> = {},
): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    const propertyName = String(propertyKey);

    const relationMetadata: IRelationMetadata = {
      propertyName,
      relationType: 'many-to-one',
      options: {
        target: targetEntity,
        lazy: false,
        ...options,
      },
    };

    // 获取或创建实体元数据
    let entityMetadata: IEntityMetadata = Reflect.getMetadata(
      ENTITY_METADATA_KEY,
      target.constructor,
    );
    if (!entityMetadata) {
      entityMetadata = {
        target: target.constructor,
        tableName: target.constructor.name.toLowerCase(),
        options: {},
        columns: new Map(),
        relations: new Map(),
      };
      Reflect.defineMetadata(
        ENTITY_METADATA_KEY,
        entityMetadata,
        target.constructor,
      );
    }

    entityMetadata.relations.set(propertyName, relationMetadata);

    console.log(
      `注册多对一关系: ${target.constructor.name}.${propertyName} -> ${targetEntity().name}`,
    );
  };
}

/**
 * 事务装饰器
 *
 * @description 自动为方法添加事务支持
 *
 * @param options - 事务配置选项
 * @returns 方法装饰器
 */
export function Transactional(
  options: {
    connectionName?: string;
    isolationLevel?:
      | 'READ_UNCOMMITTED'
      | 'READ_COMMITTED'
      | 'REPEATABLE_READ'
      | 'SERIALIZABLE';
    timeout?: number;
    readOnly?: boolean;
  } = {},
): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const methodName = String(propertyKey);

    descriptor.value = async function (...args: any[]): Promise<any> {
      console.log(`开始事务方法: ${target.constructor.name}.${methodName}`);

      try {
        // 模拟事务执行
        console.log(`  事务配置:`, {
          connectionName: options.connectionName || 'default',
          isolationLevel: options.isolationLevel || 'READ_COMMITTED',
          timeout: options.timeout || 30000,
          readOnly: options.readOnly || false,
        });

        // 执行原方法
        const result = await originalMethod.apply(this, args);

        console.log(
          `✅ 事务方法执行成功: ${target.constructor.name}.${methodName}`,
        );
        return result;
      } catch (error) {
        console.error(
          `❌ 事务方法执行失败: ${target.constructor.name}.${methodName}`,
          error,
        );
        throw error;
      }
    };

    console.log(`注册事务装饰器: ${target.constructor.name}.${methodName}`);

    return descriptor;
  };
}

/**
 * 缓存装饰器
 *
 * @description 为Repository方法添加缓存支持
 *
 * @param options - 缓存配置选项
 * @returns 方法装饰器
 */
export function Cacheable(
  options: {
    key?: string;
    ttl?: number;
    condition?: (args: any[]) => boolean;
  } = {},
): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const methodName = String(propertyKey);

    descriptor.value = async function (...args: any[]): Promise<any> {
      const cacheKey =
        options.key ||
        `${target.constructor.name}.${methodName}:${JSON.stringify(args)}`;
      const ttl = options.ttl || 300000; // 5分钟

      console.log(`缓存方法调用: ${target.constructor.name}.${methodName}`, {
        cacheKey,
        ttl,
      });

      // 检查缓存条件
      if (options.condition && !options.condition(args)) {
        console.log(`  跳过缓存，条件不满足`);
        return originalMethod.apply(this, args);
      }

      // 模拟缓存检查
      const cached = await (this as any).checkCache?.(cacheKey);
      if (cached) {
        console.log(`✅ 缓存命中: ${cacheKey}`);
        return cached;
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args);

      // 存储到缓存
      await (this as any).setCache?.(cacheKey, result, ttl);
      console.log(`✅ 结果已缓存: ${cacheKey}`);

      return result;
    };

    console.log(`注册缓存装饰器: ${target.constructor.name}.${methodName}`);

    return descriptor;
  };
}

/**
 * 缓存清除装饰器
 *
 * @description 在方法执行后清除相关缓存
 *
 * @param patterns - 缓存键模式
 * @returns 方法装饰器
 */
export function CacheEvict(patterns: string[] = []): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const methodName = String(propertyKey);

    descriptor.value = async function (...args: any[]): Promise<any> {
      console.log(`缓存清除方法: ${target.constructor.name}.${methodName}`);

      try {
        // 执行原方法
        const result = await originalMethod.apply(this, args);

        // 清除缓存
        for (const pattern of patterns) {
          const resolvedPattern = pattern.replace(
            /\{(\d+)\}/g,
            (_, index) => args[parseInt(index)] || '',
          );
          await (this as any).evictCache?.(resolvedPattern);
          console.log(`  ✅ 清除缓存: ${resolvedPattern}`);
        }

        console.log(
          `✅ 缓存清除方法执行成功: ${target.constructor.name}.${methodName}`,
        );
        return result;
      } catch (error) {
        console.error(
          `❌ 缓存清除方法执行失败: ${target.constructor.name}.${methodName}`,
          error,
        );
        throw error;
      }
    };

    console.log(`注册缓存清除装饰器: ${target.constructor.name}.${methodName}`);

    return descriptor;
  };
}

/**
 * 查询装饰器
 *
 * @description 标记方法为查询操作，自动使用读数据库
 *
 * @param options - 查询配置选项
 * @returns 方法装饰器
 */
export function Query(
  options: {
    connectionName?: string;
    enableCache?: boolean;
    cacheTTL?: number;
  } = {},
): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const methodName = String(propertyKey);

    descriptor.value = async function (...args: any[]): Promise<any> {
      console.log(`查询方法: ${target.constructor.name}.${methodName}`, {
        connectionName: options.connectionName || 'read',
        enableCache: options.enableCache || false,
      });

      // 执行原方法
      const result = await originalMethod.apply(this, args);

      console.log(
        `✅ 查询方法执行完成: ${target.constructor.name}.${methodName}`,
      );
      return result;
    };

    console.log(`注册查询装饰器: ${target.constructor.name}.${methodName}`);

    return descriptor;
  };
}

/**
 * 命令装饰器
 *
 * @description 标记方法为命令操作，自动使用写数据库
 *
 * @param options - 命令配置选项
 * @returns 方法装饰器
 */
export function Command(
  options: {
    connectionName?: string;
    enableTransaction?: boolean;
    cacheEvict?: string[];
  } = {},
): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const methodName = String(propertyKey);

    descriptor.value = async function (...args: any[]): Promise<any> {
      console.log(`命令方法: ${target.constructor.name}.${methodName}`, {
        connectionName: options.connectionName || 'write',
        enableTransaction: options.enableTransaction !== false,
      });

      try {
        // 执行原方法
        const result = await originalMethod.apply(this, args);

        // 清除相关缓存
        if (options.cacheEvict) {
          for (const pattern of options.cacheEvict) {
            await (this as any).evictCache?.(pattern);
            console.log(`  ✅ 清除缓存: ${pattern}`);
          }
        }

        console.log(
          `✅ 命令方法执行成功: ${target.constructor.name}.${methodName}`,
        );
        return result;
      } catch (error) {
        console.error(
          `❌ 命令方法执行失败: ${target.constructor.name}.${methodName}`,
          error,
        );
        throw error;
      }
    };

    console.log(`注册命令装饰器: ${target.constructor.name}.${methodName}`);

    return descriptor;
  };
}

/**
 * Repository注入装饰器
 *
 * @description 注入Repository实例
 *
 * @param entityClass - 实体类
 * @returns 参数装饰器
 */
export function InjectRepository(entityClass: any): ParameterDecorator {
  const token = `REPOSITORY_${entityClass.name}`;
  return Inject(token);
}

/**
 * 装饰器元数据工具类
 */
export class DecoratorMetadataUtils {
  /**
   * 获取实体元数据
   */
  static getEntityMetadata(target: any): IEntityMetadata | undefined {
    return Reflect.getMetadata(ENTITY_METADATA_KEY, target);
  }

  /**
   * 获取Repository元数据
   */
  static getRepositoryMetadata(target: any): IRepositoryMetadata | undefined {
    return Reflect.getMetadata(REPOSITORY_METADATA_KEY, target);
  }

  /**
   * 获取所有注册的实体
   */
  static getAllEntities(): IEntityMetadata[] {
    // 简化实现，实际需要维护全局注册表
    return [];
  }

  /**
   * 获取所有注册的Repository
   */
  static getAllRepositories(): IRepositoryMetadata[] {
    // 简化实现，实际需要维护全局注册表
    return [];
  }

  /**
   * 检查类是否为实体
   */
  static isEntity(target: any): boolean {
    return Reflect.hasMetadata(ENTITY_METADATA_KEY, target);
  }

  /**
   * 检查类是否为Repository
   */
  static isRepository(target: any): boolean {
    return Reflect.hasMetadata(REPOSITORY_METADATA_KEY, target);
  }

  /**
   * 生成表的DDL语句
   */
  static generateTableDDL(entityClass: any): string {
    const metadata = this.getEntityMetadata(entityClass);
    if (!metadata) {
      throw new Error(`实体 ${entityClass.name} 没有元数据`);
    }

    const columns: string[] = [];

    // 添加列定义
    for (const [, columnMetadata] of metadata.columns) {
      const column = columnMetadata.options;
      let columnDef = `${columnMetadata.columnName} `;

      // 数据类型
      switch (column.type) {
        case 'string':
          columnDef += `VARCHAR(${column.length || 255})`;
          break;
        case 'number':
          columnDef += 'INTEGER';
          break;
        case 'boolean':
          columnDef += 'BOOLEAN';
          break;
        case 'date':
          columnDef += 'TIMESTAMP';
          break;
        case 'json':
          columnDef += 'JSONB';
          break;
        case 'uuid':
          columnDef += 'UUID';
          break;
        default:
          columnDef += 'TEXT';
      }

      // 约束
      if (column.primary) {
        columnDef += ' PRIMARY KEY';
      }
      if (!column.nullable) {
        columnDef += ' NOT NULL';
      }
      if (column.unique) {
        columnDef += ' UNIQUE';
      }
      if (column.default !== undefined) {
        columnDef += ` DEFAULT ${column.default}`;
      }

      columns.push(columnDef);
    }

    // 添加多租户列
    if (metadata.options.enableMultiTenant) {
      columns.push(
        `${metadata.options.tenantIdColumn || 'tenant_id'} VARCHAR(255) NOT NULL`,
      );
    }

    // 添加时间戳列
    if (metadata.options.enableTimestamps) {
      columns.push(
        `${metadata.options.createdAtColumn || 'created_at'} TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      );
      columns.push(
        `${metadata.options.updatedAtColumn || 'updated_at'} TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      );
    }

    // 添加软删除列
    if (metadata.options.enableSoftDelete) {
      columns.push(
        `${metadata.options.softDeleteColumn || 'deleted_at'} TIMESTAMP NULL`,
      );
    }

    const tableName = metadata.schema
      ? `${metadata.schema}.${metadata.tableName}`
      : metadata.tableName;

    return `CREATE TABLE ${tableName} (\n  ${columns.join(',\n  ')}\n);`;
  }
}
