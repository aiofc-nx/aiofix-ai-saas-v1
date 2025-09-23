/**
 * 用例装饰器导出
 *
 * @description 导出用例相关的装饰器和元数据工具
 * @since 1.0.0
 */

// 用例装饰器
export { UseCase, getUseCaseMetadata, isUseCase, USE_CASE_METADATA_KEY } from './use-case.decorator';

// 用例配置类型
export type { IUseCaseOptions, UseCaseType } from './use-case.decorator';
