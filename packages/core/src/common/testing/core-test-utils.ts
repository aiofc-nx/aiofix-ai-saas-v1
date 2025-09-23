/**
 * CoreTestUtils - 核心测试工具实现
 *
 * 提供了完整的测试工具功能，包括等待工具、重试工具、
 * 数据生成工具、对象操作工具等功能。
 *
 * ## 业务规则
 *
 * ### 等待工具规则
 * - 支持固定时间等待
 * - 支持条件等待
 * - 支持超时控制
 * - 支持间隔控制
 *
 * ### 重试工具规则
 * - 支持重试次数控制
 * - 支持重试延迟控制
 * - 支持重试条件控制
 * - 支持重试日志记录
 *
 * ### 数据生成工具规则
 * - 支持随机数据生成
 * - 支持序列数据生成
 * - 支持模板数据生成
 * - 支持数据验证
 *
 * ### 对象操作工具规则
 * - 支持深度克隆
 * - 支持深度比较
 * - 支持对象合并
 * - 支持对象转换
 *
 * @description 核心测试工具实现类
 * @example
 * ```typescript
 * const utils = new CoreTestUtils();
 *
 * // 等待工具
 * await utils.wait(1000);
 * await utils.waitFor(() => condition === true, 5000, 100);
 *
 * // 重试工具
 * const result = await utils.retry(() => operation(), 3, 1000);
 *
 * // 数据生成工具
 * const randomStr = utils.randomString(10);
 * const randomNum = utils.randomNumber(1, 100);
 * const randomEmail = utils.randomEmail();
 *
 * // 对象操作工具
 * const cloned = utils.deepClone(obj);
 * const isEqual = utils.deepEqual(obj1, obj2);
 * ```
 *
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ITestUtils } from './testing.interface';

/**
 * 核心测试工具
 */
@Injectable()
export class CoreTestUtils implements ITestUtils {
	/**
	 * 等待指定时间
	 */
	public async wait(ms: number): Promise<void> {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}

	/**
	 * 等待条件满足
	 */
	public async waitFor(condition: () => boolean, timeout: number = 5000, interval: number = 100): Promise<void> {
		const startTime = Date.now();

		while (Date.now() - startTime < timeout) {
			if (condition()) {
				return;
			}
			await this.wait(interval);
		}

		throw new Error(`Timeout waiting for condition after ${timeout}ms`);
	}

	/**
	 * 重试操作
	 */
	public async retry<T>(operation: () => Promise<T> | T, maxAttempts: number = 3, delay: number = 1000): Promise<T> {
		let lastError: Error | undefined;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				return await operation();
			} catch (error) {
				lastError = error as Error;

				if (attempt === maxAttempts) {
					throw lastError;
				}

				await this.wait(delay);
			}
		}

		throw lastError || new Error('Retry operation failed');
	}

	/**
	 * 捕获异常
	 */
	public catchError(fn: () => void): Error | undefined {
		try {
			fn();
			return undefined;
		} catch (error) {
			return error as Error;
		}
	}

	/**
	 * 捕获异步异常
	 */
	public async catchAsyncError(fn: () => Promise<void>): Promise<Error | undefined> {
		try {
			await fn();
			return undefined;
		} catch (error) {
			return error as Error;
		}
	}

	/**
	 * 生成随机字符串
	 */
	public randomString(length: number = 10): string {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let result = '';
		for (let i = 0; i < length; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	}

	/**
	 * 生成随机数字
	 */
	public randomNumber(min: number = 0, max: number = 100): number {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	/**
	 * 生成随机布尔值
	 */
	public randomBoolean(): boolean {
		return Math.random() < 0.5;
	}

	/**
	 * 生成随机日期
	 */
	public randomDate(start?: Date, end?: Date): Date {
		const startDate = start || new Date(2020, 0, 1);
		const endDate = end || new Date();
		const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
		return new Date(randomTime);
	}

	/**
	 * 生成随机UUID
	 */
	public randomUuid(): string {
		return uuidv4();
	}

	/**
	 * 生成随机邮箱
	 */
	public randomEmail(): string {
		const domains = ['example.com', 'test.com', 'demo.org', 'sample.net'];
		const username = this.randomString(8).toLowerCase();
		const domain = domains[Math.floor(Math.random() * domains.length)];
		return `${username}@${domain}`;
	}

	/**
	 * 生成随机手机号
	 */
	public randomPhone(): string {
		const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139'];
		const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
		const suffix = Math.floor(Math.random() * 100000000)
			.toString()
			.padStart(8, '0');
		return `+86${prefix}${suffix}`;
	}

	/**
	 * 生成随机IP地址
	 */
	public randomIpAddress(): string {
		const octets = Array.from({ length: 4 }, () => this.randomNumber(0, 255));
		return octets.join('.');
	}

	/**
	 * 生成随机URL
	 */
	public randomUrl(): string {
		const protocols = ['http', 'https'];
		const domains = ['example.com', 'test.com', 'demo.org', 'sample.net'];
		const paths = ['', '/api', '/test', '/demo', '/sample'];

		const protocol = protocols[Math.floor(Math.random() * protocols.length)];
		const domain = domains[Math.floor(Math.random() * domains.length)];
		const path = paths[Math.floor(Math.random() * paths.length)];

		return `${protocol}://${domain}${path}`;
	}

	/**
	 * 生成随机JSON
	 */
	public randomJson(): Record<string, unknown> {
		const keys = ['name', 'value', 'id', 'type', 'status', 'description'];
		const result: Record<string, unknown> = {};

		const keyCount = this.randomNumber(1, 5);
		for (let i = 0; i < keyCount; i++) {
			const key = keys[Math.floor(Math.random() * keys.length)];
			const value = this.randomValue();
			result[key] = value;
		}

		return result;
	}

	/**
	 * 深度克隆对象
	 */
	public deepClone<T>(obj: T): T {
		if (obj === null || typeof obj !== 'object') {
			return obj;
		}

		if (obj instanceof Date) {
			return new Date(obj.getTime()) as unknown as T;
		}

		if (obj instanceof Array) {
			return obj.map((item) => this.deepClone(item)) as unknown as T;
		}

		if (typeof obj === 'object') {
			const cloned = {} as T;
			for (const key in obj) {
				if (Object.prototype.hasOwnProperty.call(obj, key)) {
					cloned[key] = this.deepClone(obj[key]);
				}
			}
			return cloned;
		}

		return obj;
	}

	/**
	 * 深度比较对象
	 */
	public deepEqual<T>(obj1: T, obj2: T): boolean {
		if (obj1 === obj2) {
			return true;
		}

		if (obj1 == null || obj2 == null) {
			return obj1 === obj2;
		}

		if (typeof obj1 !== typeof obj2) {
			return false;
		}

		if (typeof obj1 !== 'object') {
			return obj1 === obj2;
		}

		if (Array.isArray(obj1) !== Array.isArray(obj2)) {
			return false;
		}

		if (Array.isArray(obj1)) {
			if (obj1.length !== (obj2 as any).length) {
				return false;
			}
			for (let i = 0; i < obj1.length; i++) {
				if (!this.deepEqual(obj1[i], (obj2 as any)[i])) {
					return false;
				}
			}
			return true;
		}

		const keys1 = Object.keys(obj1);
		const keys2 = Object.keys(obj2);

		if (keys1.length !== keys2.length) {
			return false;
		}

		for (const key of keys1) {
			if (!keys2.includes(key)) {
				return false;
			}
			if (!this.deepEqual((obj1 as any)[key], (obj2 as any)[key])) {
				return false;
			}
		}

		return true;
	}

	/**
	 * 格式化测试数据
	 */
	public formatTestData(data: any): string {
		if (data === null) {
			return 'null';
		}

		if (data === undefined) {
			return 'undefined';
		}

		if (typeof data === 'string') {
			return `"${data}"`;
		}

		if (typeof data === 'number' || typeof data === 'boolean') {
			return String(data);
		}

		if (data instanceof Date) {
			return `Date(${data.toISOString()})`;
		}

		if (Array.isArray(data)) {
			const items = data.map((item) => this.formatTestData(item));
			return `[${items.join(', ')}]`;
		}

		if (typeof data === 'object') {
			const entries = Object.entries(data).map(([key, value]) => {
				return `${key}: ${this.formatTestData(value)}`;
			});
			return `{${entries.join(', ')}}`;
		}

		return String(data);
	}

	/**
	 * 创建测试快照
	 */
	public createSnapshot<T>(data: T): string {
		return JSON.stringify(data, null, 2);
	}

	/**
	 * 比较测试快照
	 */
	public compareSnapshot<T>(data: T, snapshot: string): boolean {
		const currentSnapshot = this.createSnapshot(data);
		return currentSnapshot === snapshot;
	}

	/**
	 * 生成随机值
	 */
	private randomValue(): unknown {
		const types = ['string', 'number', 'boolean', 'null', 'array', 'object'];
		const type = types[Math.floor(Math.random() * types.length)];

		switch (type) {
			case 'string':
				return this.randomString(10);
			case 'number':
				return this.randomNumber(1, 100);
			case 'boolean':
				return this.randomBoolean();
			case 'null':
				return null;
			case 'array':
				return Array.from({ length: this.randomNumber(1, 5) }, () => this.randomValue());
			case 'object':
				return this.randomJson();
			default:
				return this.randomString(10);
		}
	}
}
