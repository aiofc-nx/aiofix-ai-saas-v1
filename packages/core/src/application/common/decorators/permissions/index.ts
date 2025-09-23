/**
 * 权限验证装饰器导出
 *
 * @description 导出权限验证相关的装饰器和工具
 * @since 1.0.0
 */

export type { IRequirePermissionsOptions } from './permissions.decorator';
export {
  RequirePermissions,
  getRequirePermissionsMetadata,
  REQUIRE_PERMISSIONS_METADATA_KEY,
} from './permissions.decorator';
