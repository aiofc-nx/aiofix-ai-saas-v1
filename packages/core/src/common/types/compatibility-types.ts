/**
 * 兼容性类型定义
 *
 * @description 提供向后兼容的类型定义，避免重复定义
 * @since 1.0.0
 */

// 基础错误类型已移动到 ./errors/base-error.ts
// 这里不再重复定义，避免与完整实现的冲突

// 日志服务接口（保留用于兼容性）
export interface ILoggerService {
	info(message: string, context?: unknown): void;
	error(message: string, error?: Error, context?: unknown): void;
	warn(message: string, context?: unknown): void;
	debug(message: string, context?: unknown): void;

	// 企业级功能（可选）
	child?(context: string, metadata?: Record<string, unknown>): ILoggerService;
	performance?(operation: string, duration: number, metadata?: Record<string, unknown>): void;
	flush?(): Promise<void>;
	close?(): Promise<void>;
}

// 实体ID类型（保留用于兼容性）
export class EntityId {
	static fromString(value: string): EntityId {
		return new EntityId(value);
	}

	static generate(): EntityId {
		return new EntityId(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
	}

	constructor(private readonly value: string) {}

	toString(): string {
		return this.value;
	}
}

// 租户上下文管理器已移动到 ./multi-tenant/context/tenant-context-manager.ts
// 这里不再重复定义，避免与完整实现的冲突
