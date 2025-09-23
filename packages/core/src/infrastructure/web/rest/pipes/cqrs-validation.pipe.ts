/**
 * CQRS验证管道
 *
 * 提供CQRS命令和查询的输入验证功能，集成DTO验证和业务规则验证。
 * 管道在请求处理前验证输入数据的格式和业务规则。
 *
 * @description CQRS验证管道提供输入数据的自动验证功能
 *
 * ## 业务规则
 *
 * ### 验证层次规则
 * - 首先进行DTO格式验证
 * - 然后进行业务规则验证
 * - 最后进行权限相关验证
 * - 任何验证失败都会中断请求处理
 *
 * ### 验证错误处理规则
 * - 验证错误必须返回详细的错误信息
 * - 错误信息应该便于客户端理解和处理
 * - 支持多语言的错误消息
 * - 记录验证失败的审计日志
 *
 * ### 验证性能规则
 * - 验证操作应该是高效的
 * - 支持验证结果的缓存
 * - 避免重复的验证操作
 * - 监控验证操作的性能
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Post()
 *   @UsePipes(new CqrsValidationPipe())
 *   async createUser(
 *     @Body() dto: CreateUserDto
 *   ) {
 *     // DTO自动验证
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate, ValidationError as ClassValidatorError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ValidationErrorCodes } from '../../../../common/errors';

/**
 * 验证错误详情接口
 */
export interface IValidationErrorDetail {
	/**
	 * 字段名
	 */
	field: string;

	/**
	 * 错误消息
	 */
	message: string;

	/**
	 * 错误代码
	 */
	code: string;

	/**
	 * 错误值
	 */
	value?: unknown;

	/**
	 * 约束信息
	 */
	constraints?: Record<string, string>;
}

/**
 * 验证选项接口
 */
export interface IValidationOptions {
	/**
	 * 是否跳过缺失属性的验证
	 */
	skipMissingProperties?: boolean;

	/**
	 * 是否允许未知属性
	 */
	forbidUnknownValues?: boolean;

	/**
	 * 是否启用白名单验证
	 */
	whitelist?: boolean;

	/**
	 * 是否转换输入类型
	 */
	transform?: boolean;

	/**
	 * 验证组
	 */
	groups?: string[];

	/**
	 * 是否总是验证
	 */
	always?: boolean;
}

/**
 * CQRS验证管道
 */
export class CqrsValidationPipe implements PipeTransform<unknown> {
	private readonly options: IValidationOptions;

	constructor(options: IValidationOptions = {}) {
		this.options = {
			skipMissingProperties: false,
			forbidUnknownValues: true,
			whitelist: true,
			transform: true,
			always: true,
			...options
		};
	}

	/**
	 * 转换和验证输入数据
	 *
	 * @param value - 输入值
	 * @param metadata - 参数元数据
	 * @returns 验证后的值
	 * @throws {BadRequestException} 当验证失败时
	 */
	async transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> {
		// 如果没有类型信息，直接返回
		if (!metadata.metatype || !this.shouldValidate(metadata.metatype)) {
			return value;
		}

		try {
			// 转换为类实例
			const object = plainToClass(metadata.metatype, value, {
				enableImplicitConversion: this.options.transform
			});

			// 执行验证
			const errors = await validate(object, {
				skipMissingProperties: this.options.skipMissingProperties,
				forbidUnknownValues: this.options.forbidUnknownValues,
				whitelist: this.options.whitelist,
				groups: this.options.groups,
				always: this.options.always
			});

			// 如果有验证错误，抛出异常
			if (errors.length > 0) {
				const validationErrors = this.formatValidationErrors(errors);

				this.log('warn', '输入验证失败', {
					inputType: metadata.metatype?.name,
					errors: validationErrors
				});

				throw new BadRequestException({
					message: '输入验证失败',
					code: ValidationErrorCodes.VAL_INVALID_INPUT,
					errors: validationErrors
				});
			}

			this.log('debug', '输入验证成功', {
				inputType: metadata.metatype?.name
			});

			return object;
		} catch (error) {
			if (error instanceof BadRequestException) {
				throw error;
			}

			this.log('error', '验证管道异常', {
				error: error instanceof Error ? error.message : String(error),
				inputType: metadata.metatype?.name
			});

			throw new BadRequestException({
				message: '验证失败',
				code: ValidationErrorCodes.VAL_INVALID_INPUT,
				details: error instanceof Error ? error.message : String(error)
			});
		}
	}

	/**
	 * 检查是否应该验证
	 *
	 * @param metatype - 元类型
	 * @returns 是否应该验证
	 * @private
	 */
	private shouldValidate(metatype: new (...args: unknown[]) => unknown): boolean {
		const types: (new (...args: unknown[]) => unknown)[] = [String, Boolean, Number, Array, Object];
		return !types.includes(metatype);
	}

	/**
	 * 格式化验证错误
	 *
	 * @param errors - 验证错误数组
	 * @returns 格式化的错误详情
	 * @private
	 */
	private formatValidationErrors(errors: ClassValidatorError[]): IValidationErrorDetail[] {
		return errors.map((error) => ({
			field: error.property,
			message: Object.values(error.constraints || {}).join(', '),
			code: Object.keys(error.constraints || {})[0] || ValidationErrorCodes.VAL_INVALID_INPUT,
			value: error.value,
			constraints: error.constraints
		}));
	}

	/**
	 * 记录日志
	 *
	 * @param level - 日志级别
	 * @param message - 日志消息
	 * @param context - 上下文信息
	 * @private
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	private log(_level: string, _message: string, _context?: Record<string, unknown>): void {
		// TODO: 替换为实际的日志系统
		// console.log(`[${_level.toUpperCase()}] [CqrsValidationPipe] ${_message}`, _context);
	}
}
