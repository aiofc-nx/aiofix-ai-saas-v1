/**
 * 请求类型定义
 *
 * @description 定义各种请求类型的通用接口，用于上下文提取
 * @since 1.0.0
 */

import type { FastifyRequest } from './fastify-types';

/**
 * 通用请求接口
 * 支持多种请求类型的上下文提取
 */
export interface IUniversalRequest {
	headers?: Record<string, string | string[] | undefined>;
	url?: string;
	method?: string;
	connection?: {
		remoteAddress?: string;
	};
	context?: Record<string, unknown>;
	handshake?: {
		headers?: Record<string, string | string[] | undefined>;
		address?: string;
	};
	command?: string;
	task?: string;
	type?: string;
	mutation?: unknown;
	subscription?: unknown;
}

/**
 * 类型守卫：检查是否为 FastifyRequest
 */
export function isFastifyRequest(request: IUniversalRequest | FastifyRequest): request is FastifyRequest {
	return 'headers' in request && 'method' in request && 'url' in request;
}

/**
 * 安全地获取请求头值
 */
export function getHeaderValue(request: IUniversalRequest, headerName: string): string | undefined {
	if (request.headers) {
		const value = request.headers[headerName];
		return Array.isArray(value) ? value[0] : value;
	}
	return undefined;
}

/**
 * 安全地获取请求属性
 */
export function getRequestProperty<T>(request: IUniversalRequest, property: string): T | undefined {
	if (property in request) {
		return (request as Record<string, unknown>)[property] as T;
	}
	return undefined;
}

/**
 * 安全地获取嵌套属性
 */
export function getNestedProperty<T>(request: IUniversalRequest, path: string): T | undefined {
	const parts = path.split('.');
	let current: unknown = request;

	for (const part of parts) {
		if (current && typeof current === 'object' && part in current) {
			current = (current as Record<string, unknown>)[part];
		} else {
			return undefined;
		}
	}

	return current as T;
}
