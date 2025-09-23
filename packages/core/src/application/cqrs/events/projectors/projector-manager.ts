/**
 * 投射器管理器
 *
 * 负责管理所有事件投射器的注册、发现和执行。
 * 投射器管理器是事件投射系统的核心协调者。
 *
 * @description 投射器管理器提供了事件投射的统一管理和执行机制
 *
 * ## 业务规则
 *
 * ### 投射器注册规则
 * - 投射器按事件类型注册和索引
 * - 同一事件类型可以有多个投射器
 * - 投射器注册时进行有效性验证
 * - 支持投射器的动态注册和注销
 *
 * ### 投射器执行规则
 * - 投射器按注册顺序执行
 * - 投射器执行是异步和并行的
 * - 投射器失败不影响其他投射器
 * - 支持投射器的批量执行
 *
 * ### 投射器监控规则
 * - 监控投射器的执行性能
 * - 追踪投射器的成功率和失败率
 * - 记录投射器的执行日志
 * - 支持投射器的健康检查
 *
 * @example
 * ```typescript
 * const projectorManager = new ProjectorManager();
 *
 * // 注册投射器
 * projectorManager.register(new UserCreatedProjector());
 * projectorManager.register(new UserUpdatedProjector());
 *
 * // 处理事件
 * const event = new UserCreatedEvent(userId, name, email);
 * await projectorManager.projectEvent(event);
 *
 * // 重建读模型
 * const events = await eventStore.getEventStream(userId);
 * await projectorManager.rebuildAllReadModels(userId, events);
 * ```
 *
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { BaseDomainEvent } from '../../../../domain/events/base/base-domain-event';
import { IEventProjector, IProjectorManager, IProjectionExecutionResult } from './event-projector.interface';

/**
 * 投射器注册信息
 */
interface IProjectorRegistration {
	/**
	 * 投射器实例
	 */
	projector: IEventProjector<any>;

	/**
	 * 注册时间
	 */
	registeredAt: Date;

	/**
	 * 是否启用
	 */
	enabled: boolean;

	/**
	 * 执行统计
	 */
	stats: {
		totalExecutions: number;
		successfulExecutions: number;
		failedExecutions: number;
		totalExecutionTime: number;
		lastExecutedAt?: Date;
		lastError?: string;
	};
}

/**
 * 投射器管理器实现
 */
@Injectable()
export class ProjectorManager implements IProjectorManager {
	/**
	 * 投射器注册表（按事件类型索引）
	 */
	private readonly projectorsByEventType = new Map<string, IProjectorRegistration[]>();

	/**
	 * 投射器注册表（按投射器名称索引）
	 */
	private readonly projectorsByName = new Map<string, IProjectorRegistration>();

	/**
	 * 注册事件投射器
	 *
	 * @param projector - 投射器实例
	 */
	register(projector: IEventProjector<any>): void {
		const projectorName = projector.getProjectorName();

		// 检查是否已注册
		if (this.projectorsByName.has(projectorName)) {
			throw new Error(`投射器 ${projectorName} 已经注册`);
		}

		// 创建注册信息
		const registration: IProjectorRegistration = {
			projector,
			registeredAt: new Date(),
			enabled: true,
			stats: {
				totalExecutions: 0,
				successfulExecutions: 0,
				failedExecutions: 0,
				totalExecutionTime: 0
			}
		};

		// 按名称注册
		this.projectorsByName.set(projectorName, registration);

		// 按事件类型注册
		for (const eventType of projector.getProjectedEventTypes()) {
			if (!this.projectorsByEventType.has(eventType)) {
				this.projectorsByEventType.set(eventType, []);
			}
			const projectors = this.projectorsByEventType.get(eventType);
			if (projectors) {
				projectors.push(registration);
			}
		}

		// 测试环境不需要实际日志输出
		if (process.env.NODE_ENV !== 'test') {
			console.warn(`投射器 ${projectorName} 注册成功`, {
				eventTypes: projector.getProjectedEventTypes()
			});
		}
	}

	/**
	 * 投射事件
	 *
	 * @param event - 要投射的事件
	 */
	async projectEvent(event: BaseDomainEvent): Promise<void> {
		const projectors = this.getProjectors(event.eventType);

		if (projectors.length === 0) {
			// 测试环境不需要实际日志输出
			if (process.env.NODE_ENV !== 'test') {
				console.warn(`没有找到事件类型 ${event.eventType} 的投射器`);
			}
			return;
		}

		// 并行执行所有投射器
		const projectionPromises = projectors.map((projector) => this.executeProjector(projector, event));

		const results = await Promise.allSettled(projectionPromises);

		// 处理执行结果
		results.forEach((result, index) => {
			const projector = projectors[index];
			if (result.status === 'rejected') {
				console.error(`投射器 ${projector.getProjectorName()} 执行失败`, result.reason);
			}
		});
	}

	/**
	 * 批量投射事件
	 *
	 * @param events - 要投射的事件数组
	 */
	async projectEvents(events: BaseDomainEvent[]): Promise<void> {
		// 测试环境不需要实际日志输出
		if (process.env.NODE_ENV !== 'test') {
			console.warn(`开始批量投射 ${events.length} 个事件`);
		}

		for (const event of events) {
			try {
				await this.projectEvent(event);
			} catch (error) {
				console.error(`投射事件 ${event.eventId} 失败`, error);
				// 继续处理其他事件
			}
		}

		// 测试环境不需要实际日志输出
		if (process.env.NODE_ENV !== 'test') {
			console.warn(`批量投射完成，共处理 ${events.length} 个事件`);
		}
	}

	/**
	 * 重建所有读模型
	 *
	 * @param aggregateId - 聚合根标识符
	 * @param events - 事件历史
	 */
	async rebuildAllReadModels(aggregateId: string, events: BaseDomainEvent[]): Promise<void> {
		// 测试环境不需要实际日志输出
		if (process.env.NODE_ENV !== 'test') {
			console.warn(`开始重建聚合根 ${aggregateId} 的所有读模型`);
		}

		// 获取所有相关的投射器
		const allProjectors = new Set<IEventProjector<any>>();

		for (const event of events) {
			const projectors = this.getProjectors(event.eventType);
			projectors.forEach((p) => allProjectors.add(p));
		}

		// 为每个投射器重建读模型
		const rebuildPromises = Array.from(allProjectors)
			.filter((p) => 'rebuildReadModel' in p)
			.map(async (projector) => {
				try {
					const readModelProjector = projector as any;
					const relevantEvents = events.filter((e) => projector.canProject(e));
					await readModelProjector.rebuildReadModel(aggregateId, relevantEvents);
				} catch (error) {
					console.error(`投射器 ${projector.getProjectorName()} 重建失败`, error);
				}
			});

		await Promise.allSettled(rebuildPromises);

		// 测试环境不需要实际日志输出
		if (process.env.NODE_ENV !== 'test') {
			console.warn(`聚合根 ${aggregateId} 的所有读模型重建完成`);
		}
	}

	/**
	 * 获取已注册的投射器
	 *
	 * @param eventType - 事件类型
	 * @returns 投射器列表
	 */
	getProjectors(eventType: string): IEventProjector<any>[] {
		const registrations = this.projectorsByEventType.get(eventType) || [];
		return registrations.filter((reg) => reg.enabled).map((reg) => reg.projector);
	}

	/**
	 * 获取所有已注册的投射器
	 *
	 * @returns 投射器列表
	 */
	getAllProjectors(): IEventProjector<any>[] {
		return Array.from(this.projectorsByName.values())
			.filter((reg) => reg.enabled)
			.map((reg) => reg.projector);
	}

	/**
	 * 检查投射器是否已注册
	 *
	 * @param projectorName - 投射器名称
	 * @returns 如果已注册返回true，否则返回false
	 */
	hasProjector(projectorName: string): boolean {
		return this.projectorsByName.has(projectorName);
	}

	/**
	 * 移除投射器
	 *
	 * @param projectorName - 投射器名称
	 */
	removeProjector(projectorName: string): void {
		const registration = this.projectorsByName.get(projectorName);
		if (!registration) {
			return;
		}

		// 从名称索引中移除
		this.projectorsByName.delete(projectorName);

		// 从事件类型索引中移除
		for (const eventType of registration.projector.getProjectedEventTypes()) {
			const projectors = this.projectorsByEventType.get(eventType);
			if (projectors) {
				const index = projectors.findIndex((reg) => reg.projector.getProjectorName() === projectorName);
				if (index >= 0) {
					projectors.splice(index, 1);
				}

				// 如果没有投射器了，删除事件类型索引
				if (projectors.length === 0) {
					this.projectorsByEventType.delete(eventType);
				}
			}
		}

		// 测试环境不需要实际日志输出
		if (process.env.NODE_ENV !== 'test') {
			console.warn(`投射器 ${projectorName} 已移除`);
		}
	}

	/**
	 * 清空所有投射器
	 */
	clear(): void {
		this.projectorsByName.clear();
		this.projectorsByEventType.clear();
		// 测试环境不需要实际日志输出
		if (process.env.NODE_ENV !== 'test') {
			console.warn('所有投射器已清空');
		}
	}

	/**
	 * 获取投射器统计信息
	 *
	 * @param projectorName - 投射器名称
	 * @returns 统计信息
	 */
	getProjectorStats(projectorName: string): any {
		const registration = this.projectorsByName.get(projectorName);
		return registration?.stats;
	}

	/**
	 * 启用/禁用投射器
	 *
	 * @param projectorName - 投射器名称
	 * @param enabled - 是否启用
	 */
	setProjectorEnabled(projectorName: string, enabled: boolean): void {
		const registration = this.projectorsByName.get(projectorName);
		if (registration) {
			registration.enabled = enabled;
			// 测试环境不需要实际日志输出
			if (process.env.NODE_ENV !== 'test') {
				console.warn(`投射器 ${projectorName} ${enabled ? '已启用' : '已禁用'}`);
			}
		}
	}

	/**
	 * 执行投射器
	 *
	 * @param projector - 投射器实例
	 * @param event - 事件实例
	 * @returns 执行结果
	 */
	private async executeProjector(
		projector: IEventProjector<any>,
		event: BaseDomainEvent
	): Promise<IProjectionExecutionResult> {
		const startTime = Date.now();
		const registration = this.projectorsByName.get(projector.getProjectorName());
		if (!registration) {
			throw new Error(`投射器 ${projector.getProjectorName()} 未找到`);
		}

		try {
			// 更新统计信息
			registration.stats.totalExecutions++;

			// 执行投射
			await projector.project(event);

			// 更新成功统计
			registration.stats.successfulExecutions++;
			registration.stats.lastExecutedAt = new Date();

			const executionTime = Date.now() - startTime;
			registration.stats.totalExecutionTime += executionTime;

			return {
				success: true,
				executionTime,
				affectedReadModels: 1, // 简化实现
				context: {
					eventId: event.eventId.value,
					startTime: new Date(startTime),
					aggregateId: event.aggregateId.value,
					eventVersion: event.version,
					projectorName: projector.getProjectorName(),
					retryCount: 0,
					custom: {}
				}
			};
		} catch (error) {
			// 更新失败统计
			registration.stats.failedExecutions++;
			registration.stats.lastError = error instanceof Error ? error.message : String(error);

			const executionTime = Date.now() - startTime;
			registration.stats.totalExecutionTime += executionTime;

			throw error;
		}
	}
}
