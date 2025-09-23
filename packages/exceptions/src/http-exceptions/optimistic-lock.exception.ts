import { AbstractHttpException } from './abstract-http.exception';
import { CONTENT_VERSION_HEADER } from '../utils/constants';
import { HttpStatus } from '@nestjs/common';
import { OptimisticLockData } from './vo/optimistic-lock.dto';

/**
 * 乐观锁异常
 *
 * 当乐观锁版本冲突时抛出此异常。
 * 遵循HTTP 409状态码标准。
 *
 * @description 乐观锁冲突的409异常，包含当前版本信息
 *
 * ## 业务规则
 *
 * ### 使用场景
 * - 并发更新冲突
 * - 数据版本不匹配
 * - 乐观锁机制失败
 *
 * ### 响应头设置
 * - 自动设置当前版本号到响应头
 *
 * @example
 * ```typescript
 * throw new OptimisticLockException(5);
 * ```
 *
 * @since 1.0.0
 */
export class OptimisticLockException extends AbstractHttpException<OptimisticLockData> {
	constructor(public readonly currentVersion: number, rootCause?: unknown) {
		super(
			'Optimistic Lock Conflict',
			'The resource has been modified by another user. Current version is {currentVersion}.',
			HttpStatus.CONFLICT,
			{ currentVersion },
			undefined,
			rootCause
		);
	}

	override getPresetHeadersValues(): Record<string, string> {
		return {
			[CONTENT_VERSION_HEADER]: this.currentVersion.toString()
		};
	}
}
