/**
 * 缓存装饰器导出
 *
 * @description 导出缓存相关的装饰器和工具
 * @since 1.0.0
 */

export type { ICacheableOptions } from './cacheable.decorator';
export {
  Cacheable,
  getCacheableMetadata,
  CACHEABLE_METADATA_KEY,
} from './cacheable.decorator';
