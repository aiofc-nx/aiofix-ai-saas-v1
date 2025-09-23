/**
 * BaseCommand 测试
 *
 * @description 测试 BaseCommand 基础命令类的功能
 * @since 1.0.0
 */
import { BaseCommand } from './base-command';
import { EntityId } from '../../../../domain/value-objects/entity-id';

// 测试用的命令类
class TestCommand extends BaseCommand {
	private _customCommandId?: EntityId;

	constructor(
		public readonly action: string,
		public readonly data: Record<string, unknown> = {},
		tenantId: string = 'default',
		userId: string = 'default-user',
		commandVersion?: number,
		metadata?: Record<string, unknown>,
		customCommandId?: EntityId
	) {
		super(tenantId, userId, commandVersion, metadata);
		this._customCommandId = customCommandId;
	}

	get commandId(): EntityId {
		return this._customCommandId || super.commandId;
	}

	get commandType(): string {
		return 'TestCommand';
	}

	get commandData(): Record<string, unknown> {
		return {
			action: this.action,
			data: this.data
		};
	}

	validate(): void {
		// 只在特定测试中验证，构造函数调用时不抛出错误
		if (this.action === 'INVALID_ACTION') {
			throw new Error('Action is invalid');
		}
	}
}

// 复杂命令类
class ComplexCommand extends BaseCommand {
	constructor(
		public readonly operation: {
			type: 'CREATE' | 'UPDATE' | 'DELETE';
			target: string;
			payload: Record<string, unknown>;
		},
		public readonly options: {
			async?: boolean;
			timeout?: number;
			retries?: number;
		} = {},
		tenantId: string = 'default',
		userId: string = 'default-user'
	) {
		super(tenantId, userId);
	}

	get commandType(): string {
		return 'ComplexCommand';
	}

	get commandData(): Record<string, unknown> {
		return {
			operation: this.operation,
			options: this.options
		};
	}

	validate(): void {
		if (this.operation && !this.operation.type) {
			throw new Error('Operation type is required');
		}
		if (this.operation && !this.operation.target) {
			throw new Error('Operation target is required');
		}
		if (this.options && this.options.timeout && this.options.timeout < 0) {
			throw new Error('Timeout must be non-negative');
		}
	}
}

describe('BaseCommand', () => {
	let tenantId: string;

	beforeEach(() => {
		tenantId = 'test-tenant-123';
	});

	describe('命令创建', () => {
		it('应该正确创建基础命令', () => {
			const command = new TestCommand('test-action', { key: 'value' }, tenantId, 'user-123');

			expect(command).toBeInstanceOf(BaseCommand);
			expect(command.tenantId).toBe(tenantId);
			expect(command.userId).toBe('user-123');
			expect(command.action).toBe('test-action');
			expect(command.data).toEqual({ key: 'value' });
			expect(command.createdAt).toBeInstanceOf(Date);
			expect(command.commandType).toBe('TestCommand');
		});

		it('应该为每个命令生成唯一的ID', () => {
			const command1 = new TestCommand('action1');
			const command2 = new TestCommand('action2');

			expect(command1.commandId.equals(command2.commandId)).toBe(false);
		});

		it('应该正确设置命令创建时间', () => {
			const beforeTime = new Date();
			const command = new TestCommand('test-action');
			const afterTime = new Date();

			expect(command.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
			expect(command.createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
		});
	});

	describe('命令类型和验证', () => {
		it('应该返回正确的命令类型', () => {
			const command = new TestCommand('test-action');
			expect(command.commandType).toBe('TestCommand');
		});

		it('应该正确验证命令', () => {
			const validCommand = new TestCommand('valid-action');
			expect(() => validCommand.validate()).not.toThrow();

			const invalidCommand = new TestCommand('INVALID_ACTION');
			expect(() => invalidCommand.validate()).toThrow('Action is invalid');
		});

		it('应该正确检查命令类型', () => {
			const command = new TestCommand('test-action');
			expect(command.isOfType('TestCommand')).toBe(true);
			expect(command.isOfType('OtherCommand')).toBe(false);
		});
	});

	describe('命令相等性', () => {
		it('相同ID的命令应该相等', () => {
			const sharedCommandId = EntityId.generate();
			const TestCommandClass = class extends BaseCommand {
				constructor(
					public readonly action: string,
					tenantIdParam: string = 'default',
					userId: string = 'default-user',
					customCommandId?: EntityId
				) {
					super(tenantIdParam, userId);
					if (customCommandId) {
						Object.defineProperty(this, '_commandId', {
							value: customCommandId,
							writable: false
						});
					}
				}

				get commandType(): string {
					return 'TestCommand';
				}
			};

			const command1 = new TestCommandClass('action1', 'tenant-123', 'user-456', sharedCommandId);
			const command2 = new TestCommandClass('action2', 'tenant-123', 'user-456', sharedCommandId);

			expect(command1.equals(command2)).toBe(true);
		});

		it('不同ID的命令应该不相等', () => {
			const command1 = new TestCommand('action1', {}, tenantId);
			const command2 = new TestCommand('action2', {}, tenantId);

			expect(command1.equals(command2)).toBe(false);
		});

		it('与 null 或 undefined 比较应该返回 false', () => {
			const command = new TestCommand('test-action');
			expect(command.equals(null)).toBe(false);
			expect(command.equals(undefined)).toBe(false);
		});
	});

	describe('命令比较', () => {
		it('应该按创建时间比较命令', async () => {
			const command1 = new TestCommand('action1');

			// 等待一小段时间确保时间不同
			await new Promise((resolve) => setTimeout(resolve, 10));

			const command2 = new TestCommand('action2');

			expect(command1.compareTo(command2)).toBeLessThan(0);
			expect(command2.compareTo(command1)).toBeGreaterThan(0);
			expect(command1.compareTo(command1)).toBe(0);
		});

		it('与 null 或 undefined 比较应该返回 1', () => {
			const command = new TestCommand('test-action');
			expect(command.compareTo(null as any)).toBe(1);
			expect(command.compareTo(undefined as any)).toBe(1);
		});
	});

	describe('租户关联', () => {
		it('应该正确检查命令是否属于指定的租户', () => {
			const command = new TestCommand('test-action', {}, tenantId, 'user-456');
			const otherTenantId = 'other-tenant-456';

			expect(command.belongsToTenant(tenantId)).toBe(true);
			expect(command.belongsToTenant(otherTenantId)).toBe(false);
		});
	});

	describe('命令转换', () => {
		it('应该正确转换为字符串', () => {
			const command = new TestCommand('test-action');
			expect(command.toString()).toMatch(/^TestCommand\([a-f0-9-]+\)$/);
		});

		it('应该正确转换为 JSON', () => {
			const command = new TestCommand('test-action', { key: 'value' });
			const json = command.toJSON();

			expect(json).toHaveProperty('commandId');
			expect(json).toHaveProperty('commandType', 'TestCommand');
			expect(json).toHaveProperty('tenantId');
			expect(json).toHaveProperty('createdAt');
			expect(json).toHaveProperty('commandData');
			expect(json.commandData).toEqual({
				action: 'test-action',
				data: { key: 'value' }
			});
		});

		it('应该正确获取哈希码', () => {
			const command = new TestCommand('test-action');
			expect(command.getHashCode()).toBe(command.commandId.toString());
		});

		it('应该正确获取类型名称', () => {
			const command = new TestCommand('test-action');
			expect(command.getTypeName()).toBe('TestCommand');
		});
	});

	describe('复杂命令测试', () => {
		it('应该正确创建复杂命令', () => {
			const operation = {
				type: 'CREATE' as const,
				target: 'User',
				payload: { name: 'John', email: 'john@example.com' }
			};
			const options = {
				async: true,
				timeout: 5000,
				retries: 3
			};

			const command = new ComplexCommand(operation, options);

			expect(command.operation).toEqual(operation);
			expect(command.options).toEqual(options);
			expect(command.commandType).toBe('ComplexCommand');
		});

		it('应该正确验证复杂命令', () => {
			const validCommand = new ComplexCommand({
				type: 'UPDATE',
				target: 'Product',
				payload: { price: 100 }
			});
			expect(() => validCommand.validate()).not.toThrow();

			// 缺少操作类型
			const invalidTypeCommand = new ComplexCommand({
				type: '' as any,
				target: 'User',
				payload: {}
			});
			expect(() => invalidTypeCommand.validate()).toThrow('Operation type is required');

			// 缺少操作目标
			const invalidTargetCommand = new ComplexCommand({
				type: 'CREATE',
				target: '',
				payload: {}
			});
			expect(() => invalidTargetCommand.validate()).toThrow('Operation target is required');

			// 无效的超时时间
			const invalidTimeoutCommand = new ComplexCommand(
				{
					type: 'DELETE',
					target: 'User',
					payload: {}
				},
				{ timeout: -1 }
			);
			expect(() => invalidTimeoutCommand.validate()).toThrow('Timeout must be non-negative');
		});
	});

	describe('边界情况', () => {
		it('应该处理空数据对象', () => {
			const command = new TestCommand('test-action', {});
			expect(command.data).toEqual({});
			expect(() => command.validate()).not.toThrow();
		});

		it('应该处理特殊字符的动作', () => {
			const specialAction = 'test-action_123.@#$%^&*()';
			const command = new TestCommand(specialAction);
			expect(command.action).toBe(specialAction);
		});

		it('应该处理复杂的数据对象', () => {
			const complexData = {
				nested: {
					deep: {
						value: 'test',
						array: [1, 2, 3],
						object: { key: 'value' }
					}
				},
				functions: {
					// 注意：函数不会被序列化
					callback: () => 'test'
				},
				dates: new Date(),
				regex: /test/g
			};

			const command = new TestCommand('test-action', complexData);
			expect(command.data).toEqual(complexData);
		});

		it('应该处理 Unicode 字符', () => {
			const unicodeAction = '测试动作_José_🚀';
			const command = new TestCommand(unicodeAction, {}, '租户-123', 'user-456');

			expect(command.action).toBe(unicodeAction);
			expect(command.tenantId).toBe('租户-123');
		});
	});
});
