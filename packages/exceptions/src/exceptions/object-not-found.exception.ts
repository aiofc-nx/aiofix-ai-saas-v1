import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from './abstract-http.exception';
import { ObjectNotFoundData } from './vo/object-not-found.dto';

/**
 * 对象未找到异常
 *
 * 当特定实体对象不存在时抛出此异常。
 * 提供实体名称信息，便于客户端处理和用户理解。
 *
 * @description 特定实体对象的404异常，包含实体类型信息
 *
 * ## 业务规则
 *
 * ### 使用场景
 * - 根据ID查找实体时未找到
 * - 实体已被删除
 * - 用户无权访问特定实体
 *
 * ### 数据结构
 * - 包含实体名称，便于客户端识别
 * - 支持模板参数替换：{entityName}
 *
 * @example
 * ```typescript
 * // 用户未找到
 * throw new ObjectNotFoundException('User', 'USER_NOT_FOUND');
 *
 * // 订单未找到
 * throw new ObjectNotFoundException('Order', 'ORDER_NOT_FOUND', dbError);
 * ```
 *
 * @since 1.0.0
 */
export class ObjectNotFoundException extends AbstractHttpException<ObjectNotFoundData> {
	constructor(entityName: string, errorCode?: string, rootCause?: unknown) {
		super(
			'Object Not Found',
			'The {entityName} you are looking for does not exist or you do not have access to it.',
			HttpStatus.NOT_FOUND,
			{ entityName },
			errorCode,
			rootCause
		);
	}
}
