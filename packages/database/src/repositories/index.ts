/**
 * Repository功能导出
 *
 * @description 导出Database模块的Repository相关功能
 * 包括装饰器、基础Repository、工厂等
 *
 * @since 1.0.0
 */

// Repository装饰器
export {
  Entity,
  Repository,
  Column,
  PrimaryKey,
  OneToMany,
  ManyToOne,
  Transactional,
  Cacheable,
  CacheEvict,
  Query,
  Command,
  InjectRepository,
  DecoratorMetadataUtils,
} from '../decorators/repository.decorators';

export type {
  IEntityOptions,
  IRepositoryOptions,
  IColumnOptions,
  IRelationOptions,
  IEntityMetadata,
  IRepositoryMetadata,
  IColumnMetadata,
  IRelationMetadata,
} from '../decorators/repository.decorators';

// 基础Repository
export {
  BaseRepository,
  RepositoryFactory,
  createRepository,
} from './base-repository';

export type { IRepositoryContext } from './base-repository';
