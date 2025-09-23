/**
 * @file AbstractHttpException 单元测试
 * @description 测试抽象HTTP异常基类的功能
 */

import { AbstractHttpException } from './abstract-http.exception';

/**
 * 测试用异常类
 */
class TestException extends AbstractHttpException<{ userId: string }> {
	constructor(userId: string) {
		super('Test Error', 'User {userId} encountered an error', 400, { userId }, 'TEST_ERROR');
	}
}

describe('AbstractHttpException', () => {
	describe('toErrorResponse', () => {
		it('应该生成标准的错误响应格式', () => {
			const exception = new TestException('123');
			const response = exception.toErrorResponse('req-456');

			expect(response).toEqual({
				type: 'https://aiofix.ai/docs/errors',
				title: 'Test Error',
				detail: 'User 123 encountered an error',
				status: 400,
				instance: 'req-456',
				errorCode: 'TEST_ERROR',
				data: { userId: '123' }
			});
		});

		it('应该支持模板参数替换', () => {
			const exception = new TestException('user123');
			const response = exception.toErrorResponse('req-789');

			expect(response.detail).toBe('User user123 encountered an error');
		});

		it('应该处理没有数据的情况', () => {
			class SimpleException extends AbstractHttpException {
				constructor() {
					super('Simple Error', 'A simple error occurred', 500);
				}
			}

			const exception = new SimpleException();
			const response = exception.toErrorResponse('req-001');

			expect(response).toEqual({
				type: 'https://aiofix.ai/docs/errors',
				title: 'Simple Error',
				detail: 'A simple error occurred',
				status: 500,
				instance: 'req-001',
				errorCode: undefined
			});
		});
	});

	describe('getPresetHeadersValues', () => {
		it('应该返回空对象作为默认值', () => {
			const exception = new TestException('123');
			const headers = exception.getPresetHeadersValues();

			expect(headers).toEqual({});
		});

		it('应该允许子类重写响应头', () => {
			class CustomHeaderException extends AbstractHttpException {
				constructor() {
					super('Custom Error', 'Custom error message', 401);
				}

				override getPresetHeadersValues(): Record<string, string> {
					return {
						'WWW-Authenticate': 'Bearer realm="api"'
					};
				}
			}

			const exception = new CustomHeaderException();
			const headers = exception.getPresetHeadersValues();

			expect(headers).toEqual({
				'WWW-Authenticate': 'Bearer realm="api"'
			});
		});
	});
});
