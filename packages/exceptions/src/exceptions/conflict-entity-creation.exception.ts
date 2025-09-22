import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from './abstract-http.exception';
import { ConflictEntityCreationData } from './vo/conflict-entity-creation.dto';

/**
 * 实体创建冲突异常
 *
 * 当尝试创建的实体与现有数据发生冲突时抛出此异常。
 * 遵循HTTP 409状态码标准。
 *
 * @description 实体创建冲突的409异常，包含具体的冲突信息
 *
 * ## 业务规则
 *
 * ### 使用场景
 * - 唯一约束冲突
 * - 业务规则冲突
 * - 数据一致性冲突
 *
 * ### 数据结构
 * - 包含实体名称、字段名称和字段值
 * - 支持模板参数替换
 *
 * @example
 * ```typescript
 * // 用户邮箱冲突
 * throw new ConflictEntityCreationException(
 *   'User',
 *   'email',
 *   'user@example.com',
 *   'EMAIL_ALREADY_EXISTS'
 * );
 * ```
 *
 * @since 1.0.0
 */
export class ConflictEntityCreationException extends AbstractHttpException<ConflictEntityCreationData> {
	constructor(
		public readonly entityName: string,
		public readonly fieldName: string,
		public readonly fieldValue: unknown,
		errorCode?: string,
		rootCause?: unknown
	) {
		super(
			'Conflict',
			'Cannot create {entityName} because {fieldName} "{fieldValue}" already exists',
			HttpStatus.CONFLICT,
			{ entityName, fieldName, fieldValue },
			errorCode,
			rootCause
		);
	}
}
