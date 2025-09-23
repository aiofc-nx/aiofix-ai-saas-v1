/**
 * 错误分类器实现
 *
 * 提供了多种错误分类器，用于根据不同的规则和策略对错误进行分类。
 * 包括业务错误、验证错误、认证错误、数据访问错误等分类器。
 *
 * @description 错误分类器实现
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import {
	IErrorClassifier,
	IErrorClassification,
	IErrorContext,
	ErrorType,
	ErrorSeverity
} from './error-handling.interface';

/**
 * 业务错误分类器
 */
@Injectable()
export class BusinessErrorClassifier implements IErrorClassifier {
	public readonly name = 'BusinessErrorClassifier';
	public readonly priority = 100;

	constructor(private readonly logger: ILoggerService) {}

	/**
	 * 分类错误
	 */
	public async classify(error: Error, context: IErrorContext): Promise<IErrorClassification> {
		const classification: IErrorClassification = {
			type: ErrorType.BUSINESS,
			severity: ErrorSeverity.MEDIUM,
			code: 'BUSINESS_ERROR',
			message: error.message,
			description: 'Business logic error occurred',
			category: 'BUSINESS',
			recoverable: true,
			retryable: false,
			tags: ['business', 'logic'],
			metadata: {
				errorName: error.name,
				errorStack: error.stack,
				context: context
			}
		};

		// 根据错误消息确定具体分类
		if (error.message.includes('not found')) {
			classification.code = 'RESOURCE_NOT_FOUND';
			classification.severity = ErrorSeverity.LOW;
			classification.description = 'Requested resource was not found';
		} else if (error.message.includes('already exists')) {
			classification.code = 'RESOURCE_ALREADY_EXISTS';
			classification.severity = ErrorSeverity.LOW;
			classification.description = 'Resource already exists';
		} else if (error.message.includes('permission denied')) {
			classification.code = 'PERMISSION_DENIED';
			classification.severity = ErrorSeverity.MEDIUM;
			classification.description = 'Permission denied for the operation';
		} else if (error.message.includes('quota exceeded')) {
			classification.code = 'QUOTA_EXCEEDED';
			classification.severity = ErrorSeverity.HIGH;
			classification.description = 'Resource quota exceeded';
			classification.retryable = true;
			classification.maxRetries = 3;
			classification.retryDelay = 5000;
		}

		this.logger.debug(
			`Business error classified: ${classification.code} - ${classification.severity}`,
			LogContext.BUSINESS,
			{
				errorCode: classification.code,
				errorType: classification.type,
				severity: classification.severity,
				recoverable: classification.recoverable,
				retryable: classification.retryable
			}
		);

		return classification;
	}

	/**
	 * 检查是否应该分类此错误
	 */
	public shouldClassify(error: Error, _context: IErrorContext): boolean {
		// 检查错误名称
		const businessErrorNames = [
			'BusinessError',
			'DomainError',
			'ValidationError',
			'NotFoundError',
			'AlreadyExistsError',
			'PermissionDeniedError',
			'QuotaExceededError'
		];

		if (businessErrorNames.includes(error.name)) {
			return true;
		}

		// 检查错误消息
		const businessErrorMessages = [
			'not found',
			'already exists',
			'permission denied',
			'quota exceeded',
			'business rule',
			'domain rule',
			'validation failed'
		];

		return businessErrorMessages.some((msg) => error.message.toLowerCase().includes(msg));
	}
}

/**
 * 验证错误分类器
 */
@Injectable()
export class ValidationErrorClassifier implements IErrorClassifier {
	public readonly name = 'ValidationErrorClassifier';
	public readonly priority = 90;

	constructor(private readonly logger: ILoggerService) {}

	/**
	 * 分类错误
	 */
	public async classify(error: Error, context: IErrorContext): Promise<IErrorClassification> {
		const classification: IErrorClassification = {
			type: ErrorType.VALIDATION,
			severity: ErrorSeverity.LOW,
			code: 'VALIDATION_ERROR',
			message: error.message,
			description: 'Input validation failed',
			category: 'VALIDATION',
			recoverable: true,
			retryable: false,
			tags: ['validation', 'input'],
			metadata: {
				errorName: error.name,
				errorStack: error.stack,
				context: context
			}
		};

		// 根据错误消息确定具体分类
		if (error.message.includes('required')) {
			classification.code = 'REQUIRED_FIELD_MISSING';
			classification.description = 'Required field is missing';
		} else if (error.message.includes('invalid format')) {
			classification.code = 'INVALID_FORMAT';
			classification.description = 'Invalid data format';
		} else if (error.message.includes('too long')) {
			classification.code = 'FIELD_TOO_LONG';
			classification.description = 'Field value is too long';
		} else if (error.message.includes('too short')) {
			classification.code = 'FIELD_TOO_SHORT';
			classification.description = 'Field value is too short';
		} else if (error.message.includes('invalid email')) {
			classification.code = 'INVALID_EMAIL';
			classification.description = 'Invalid email format';
		} else if (error.message.includes('invalid phone')) {
			classification.code = 'INVALID_PHONE';
			classification.description = 'Invalid phone number format';
		}

		this.logger.debug(
			`Validation error classified: ${classification.code} - ${classification.severity}`,
			LogContext.BUSINESS,
			{
				errorCode: classification.code,
				errorType: classification.type,
				severity: classification.severity
			}
		);

		return classification;
	}

	/**
	 * 检查是否应该分类此错误
	 */
	public shouldClassify(error: Error, _context: IErrorContext): boolean {
		// 检查错误名称
		const validationErrorNames = ['ValidationError', 'BadRequestError', 'InvalidInputError', 'FormatError'];

		if (validationErrorNames.includes(error.name)) {
			return true;
		}

		// 检查错误消息
		const validationErrorMessages = [
			'validation',
			'invalid',
			'required',
			'format',
			'too long',
			'too short',
			'bad request'
		];

		return validationErrorMessages.some((msg) => error.message.toLowerCase().includes(msg));
	}
}

/**
 * 认证错误分类器
 */
@Injectable()
export class AuthenticationErrorClassifier implements IErrorClassifier {
	public readonly name = 'AuthenticationErrorClassifier';
	public readonly priority = 80;

	constructor(private readonly logger: ILoggerService) {}

	/**
	 * 分类错误
	 */
	public async classify(error: Error, context: IErrorContext): Promise<IErrorClassification> {
		const classification: IErrorClassification = {
			type: ErrorType.AUTHENTICATION,
			severity: ErrorSeverity.MEDIUM,
			code: 'AUTHENTICATION_ERROR',
			message: error.message,
			description: 'Authentication failed',
			category: 'AUTHENTICATION',
			recoverable: true,
			retryable: false,
			tags: ['authentication', 'security'],
			metadata: {
				errorName: error.name,
				errorStack: error.stack,
				context: context
			}
		};

		// 根据错误消息确定具体分类
		if (error.message.includes('invalid credentials')) {
			classification.code = 'INVALID_CREDENTIALS';
			classification.description = 'Invalid username or password';
		} else if (error.message.includes('token expired')) {
			classification.code = 'TOKEN_EXPIRED';
			classification.description = 'Authentication token has expired';
			classification.retryable = true;
			classification.maxRetries = 1;
			classification.retryDelay = 1000;
		} else if (error.message.includes('token invalid')) {
			classification.code = 'TOKEN_INVALID';
			classification.description = 'Authentication token is invalid';
		} else if (error.message.includes('account locked')) {
			classification.code = 'ACCOUNT_LOCKED';
			classification.description = 'User account is locked';
			classification.severity = ErrorSeverity.HIGH;
		} else if (error.message.includes('account disabled')) {
			classification.code = 'ACCOUNT_DISABLED';
			classification.description = 'User account is disabled';
			classification.severity = ErrorSeverity.HIGH;
		}

		this.logger.debug(
			`Authentication error classified: ${classification.code} - ${classification.severity}`,
			LogContext.AUTH,
			{
				errorCode: classification.code,
				errorType: classification.type,
				severity: classification.severity
			}
		);

		return classification;
	}

	/**
	 * 检查是否应该分类此错误
	 */
	public shouldClassify(error: Error, _context: IErrorContext): boolean {
		// 检查错误名称
		const authErrorNames = ['AuthenticationError', 'UnauthorizedError', 'TokenError', 'CredentialError'];

		if (authErrorNames.includes(error.name)) {
			return true;
		}

		// 检查错误消息
		const authErrorMessages = [
			'authentication',
			'unauthorized',
			'invalid credentials',
			'token expired',
			'token invalid',
			'account locked',
			'account disabled'
		];

		return authErrorMessages.some((msg) => error.message.toLowerCase().includes(msg));
	}
}

/**
 * 数据访问错误分类器
 */
@Injectable()
export class DataAccessErrorClassifier implements IErrorClassifier {
	public readonly name = 'DataAccessErrorClassifier';
	public readonly priority = 70;

	constructor(private readonly logger: ILoggerService) {}

	/**
	 * 分类错误
	 */
	public async classify(error: Error, context: IErrorContext): Promise<IErrorClassification> {
		const classification: IErrorClassification = {
			type: ErrorType.DATA_ACCESS,
			severity: ErrorSeverity.HIGH,
			code: 'DATA_ACCESS_ERROR',
			message: error.message,
			description: 'Data access error occurred',
			category: 'DATA_ACCESS',
			recoverable: true,
			retryable: true,
			maxRetries: 3,
			retryDelay: 2000,
			tags: ['data', 'access', 'database'],
			metadata: {
				errorName: error.name,
				errorStack: error.stack,
				context: context
			}
		};

		// 根据错误消息确定具体分类
		if (error.message.includes('connection')) {
			classification.code = 'DATABASE_CONNECTION_ERROR';
			classification.description = 'Database connection failed';
			classification.severity = ErrorSeverity.CRITICAL;
		} else if (error.message.includes('timeout')) {
			classification.code = 'DATABASE_TIMEOUT';
			classification.description = 'Database operation timed out';
			classification.retryDelay = 5000;
		} else if (error.message.includes('constraint')) {
			classification.code = 'CONSTRAINT_VIOLATION';
			classification.description = 'Database constraint violation';
			classification.retryable = false;
		} else if (error.message.includes('deadlock')) {
			classification.code = 'DEADLOCK_DETECTED';
			classification.description = 'Database deadlock detected';
			classification.retryDelay = 1000;
		} else if (error.message.includes('not found')) {
			classification.code = 'RECORD_NOT_FOUND';
			classification.description = 'Database record not found';
			classification.severity = ErrorSeverity.LOW;
			classification.retryable = false;
		}

		this.logger.debug(
			`Data access error classified: ${classification.code} - ${classification.severity}`,
			LogContext.DATABASE,
			{
				errorCode: classification.code,
				errorType: classification.type,
				severity: classification.severity
			}
		);

		return classification;
	}

	/**
	 * 检查是否应该分类此错误
	 */
	public shouldClassify(error: Error, _context: IErrorContext): boolean {
		// 检查错误名称
		const dataAccessErrorNames = [
			'DatabaseError',
			'ConnectionError',
			'QueryError',
			'TransactionError',
			'ConstraintError',
			'TimeoutError'
		];

		if (dataAccessErrorNames.includes(error.name)) {
			return true;
		}

		// 检查错误消息
		const dataAccessErrorMessages = [
			'database',
			'connection',
			'query',
			'transaction',
			'constraint',
			'timeout',
			'deadlock',
			'sql',
			'mongodb',
			'postgresql',
			'mysql'
		];

		return dataAccessErrorMessages.some((msg) => error.message.toLowerCase().includes(msg));
	}
}

/**
 * 网络错误分类器
 */
@Injectable()
export class NetworkErrorClassifier implements IErrorClassifier {
	public readonly name = 'NetworkErrorClassifier';
	public readonly priority = 60;

	constructor(private readonly logger: ILoggerService) {}

	/**
	 * 分类错误
	 */
	public async classify(error: Error, context: IErrorContext): Promise<IErrorClassification> {
		const classification: IErrorClassification = {
			type: ErrorType.NETWORK,
			severity: ErrorSeverity.MEDIUM,
			code: 'NETWORK_ERROR',
			message: error.message,
			description: 'Network error occurred',
			category: 'NETWORK',
			recoverable: true,
			retryable: true,
			maxRetries: 3,
			retryDelay: 3000,
			tags: ['network', 'connection'],
			metadata: {
				errorName: error.name,
				errorStack: error.stack,
				context: context
			}
		};

		// 根据错误消息确定具体分类
		if (error.message.includes('timeout')) {
			classification.code = 'NETWORK_TIMEOUT';
			classification.description = 'Network request timed out';
			classification.retryDelay = 5000;
		} else if (error.message.includes('connection refused')) {
			classification.code = 'CONNECTION_REFUSED';
			classification.description = 'Connection was refused';
		} else if (error.message.includes('connection reset')) {
			classification.code = 'CONNECTION_RESET';
			classification.description = 'Connection was reset';
		} else if (error.message.includes('dns')) {
			classification.code = 'DNS_ERROR';
			classification.description = 'DNS resolution failed';
		} else if (error.message.includes('ssl') || error.message.includes('tls')) {
			classification.code = 'SSL_ERROR';
			classification.description = 'SSL/TLS error occurred';
		}

		this.logger.debug(
			`Network error classified: ${classification.code} - ${classification.severity}`,
			LogContext.EXTERNAL,
			{
				errorCode: classification.code,
				errorType: classification.type,
				severity: classification.severity
			}
		);

		return classification;
	}

	/**
	 * 检查是否应该分类此错误
	 */
	public shouldClassify(error: Error, _context: IErrorContext): boolean {
		// 检查错误名称
		const networkErrorNames = ['NetworkError', 'ConnectionError', 'TimeoutError', 'HttpError', 'FetchError'];

		if (networkErrorNames.includes(error.name)) {
			return true;
		}

		// 检查错误消息
		const networkErrorMessages = ['network', 'connection', 'timeout', 'http', 'fetch', 'dns', 'ssl', 'tls', 'socket'];

		return networkErrorMessages.some((msg) => error.message.toLowerCase().includes(msg));
	}
}

/**
 * 系统错误分类器
 */
@Injectable()
export class SystemErrorClassifier implements IErrorClassifier {
	public readonly name = 'SystemErrorClassifier';
	public readonly priority = 50;

	constructor(private readonly logger: ILoggerService) {}

	/**
	 * 分类错误
	 */
	public async classify(error: Error, context: IErrorContext): Promise<IErrorClassification> {
		const classification: IErrorClassification = {
			type: ErrorType.SYSTEM,
			severity: ErrorSeverity.HIGH,
			code: 'SYSTEM_ERROR',
			message: error.message,
			description: 'System error occurred',
			category: 'SYSTEM',
			recoverable: false,
			retryable: false,
			tags: ['system', 'internal'],
			metadata: {
				errorName: error.name,
				errorStack: error.stack,
				context: context
			}
		};

		// 根据错误消息确定具体分类
		if (error.message.includes('memory')) {
			classification.code = 'MEMORY_ERROR';
			classification.description = 'Memory allocation error';
			classification.severity = ErrorSeverity.CRITICAL;
		} else if (error.message.includes('disk')) {
			classification.code = 'DISK_ERROR';
			classification.description = 'Disk I/O error';
			classification.severity = ErrorSeverity.CRITICAL;
		} else if (error.message.includes('cpu')) {
			classification.code = 'CPU_ERROR';
			classification.description = 'CPU resource error';
			classification.severity = ErrorSeverity.HIGH;
		} else if (error.message.includes('file')) {
			classification.code = 'FILE_ERROR';
			classification.description = 'File system error';
		} else if (error.message.includes('permission')) {
			classification.code = 'PERMISSION_ERROR';
			classification.description = 'System permission error';
		}

		this.logger.debug(
			`System error classified: ${classification.code} - ${classification.severity}`,
			LogContext.SYSTEM,
			{
				errorCode: classification.code,
				errorType: classification.type,
				severity: classification.severity
			}
		);

		return classification;
	}

	/**
	 * 检查是否应该分类此错误
	 */
	public shouldClassify(error: Error, _context: IErrorContext): boolean {
		// 检查错误名称
		const systemErrorNames = [
			'SystemError',
			'InternalError',
			'RuntimeError',
			'ReferenceError',
			'TypeError',
			'SyntaxError'
		];

		if (systemErrorNames.includes(error.name)) {
			return true;
		}

		// 检查错误消息
		const systemErrorMessages = ['system', 'internal', 'runtime', 'memory', 'disk', 'cpu', 'file', 'permission'];

		return systemErrorMessages.some((msg) => error.message.toLowerCase().includes(msg));
	}
}
