/**
 * REST装饰器导出
 *
 * @description 导出REST相关的装饰器和配置
 * @since 1.0.0
 */

export {
  CommandEndpoint,
  QueryEndpoint,
  getCommandEndpointMetadata,
  getQueryEndpointMetadata,
  isCommandEndpoint,
  isQueryEndpoint,
  COMMAND_ENDPOINT_METADATA_KEY,
  QUERY_ENDPOINT_METADATA_KEY,
} from './cqrs-endpoint.decorator';

export type {
  ICommandEndpointOptions,
  IQueryEndpointOptions,
} from './cqrs-endpoint.decorator';

export {
  TenantContext,
  UserContext,
  RequestContext,
  FullContext,
} from './context.decorator';

export type {
  ITenantContext,
  IUserContext,
  IRequestContext,
} from './context.decorator';
