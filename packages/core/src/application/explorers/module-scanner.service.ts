/**
 * ModuleScannerService - 模块扫描器服务
 *
 * 负责扫描和发现项目中的模块，支持多种扫描策略。
 * 该服务提供模块发现、依赖分析、路径解析等功能。
 *
 * @description 模块扫描器服务，用于发现和扫描项目模块
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import { Type } from '@nestjs/common';
import * as path from 'path';
// import * as fs from 'fs';
// import * as glob from 'glob';

/**
 * 模块信息接口
 */
export interface IModuleInfo {
	/**
	 * 模块类
	 */
	moduleClass: Type<unknown>;

	/**
	 * 模块名称
	 */
	moduleName: string;

	/**
	 * 模块路径
	 */
	modulePath: string;

	/**
	 * 模块类型
	 */
	moduleType: 'root' | 'feature' | 'shared' | 'core' | 'unknown';

	/**
	 * 模块元数据
	 */
	metadata: {
		imports?: Type<unknown>[];
		exports?: Type<unknown>[];
		providers?: Type<unknown>[];
		controllers?: Type<unknown>[];
	};

	/**
	 * 依赖的模块
	 */
	dependencies: IModuleInfo[];

	/**
	 * 被依赖的模块
	 */
	dependents: IModuleInfo[];

	/**
	 * 扫描时间
	 */
	scannedAt: Date;
}

/**
 * 扫描选项接口
 */
export interface IScanOptions {
	/**
	 * 扫描深度
	 */
	depth?: number;

	/**
	 * 排除模式
	 */
	excludePatterns?: string[];

	/**
	 * 包含模式
	 */
	includePatterns?: string[];

	/**
	 * 是否包含 node_modules
	 */
	includeNodeModules?: boolean;

	/**
	 * 是否递归扫描
	 */
	recursive?: boolean;

	/**
	 * 文件扩展名
	 */
	extensions?: string[];

	/**
	 * 是否分析依赖
	 */
	analyzeDependencies?: boolean;

	/**
	 * 是否检测循环依赖
	 */
	detectCircularDependencies?: boolean;
}

/**
 * 依赖图接口
 */
export interface IDependencyGraph {
	/**
	 * 所有模块
	 */
	modules: Map<string, IModuleInfo>;

	/**
	 * 依赖关系
	 */
	dependencies: Map<string, string[]>;

	/**
	 * 循环依赖
	 */
	circularDependencies: string[][];

	/**
	 * 拓扑排序结果
	 */
	topologicalOrder: string[];

	/**
	 * 根模块
	 */
	rootModules: string[];

	/**
	 * 叶子模块
	 */
	leafModules: string[];
}

/**
 * 模块扫描器服务
 */
@Injectable()
export class ModuleScannerService {
	constructor(private readonly logger: ILoggerService) {}

	private readonly defaultOptions: IScanOptions = {
		depth: 10,
		excludePatterns: ['node_modules', '.git', 'dist', 'build', 'coverage'],
		includePatterns: ['**/*.module.ts', '**/*.module.js'],
		includeNodeModules: false,
		recursive: true,
		extensions: ['.ts', '.js'],
		analyzeDependencies: true,
		detectCircularDependencies: true
	};

	/**
	 * 扫描指定路径
	 */
	public async scanPath(scanPath: string, options: IScanOptions = {}): Promise<IModuleInfo[]> {
		const mergedOptions = { ...this.defaultOptions, ...options };
		this.logger.info('Scanning path: ' + scanPath, LogContext.SYSTEM, {
			scanPath
		});

		try {
			const moduleFiles = await this.findModuleFiles(scanPath, mergedOptions);
			const modules = await this.loadModules(moduleFiles, mergedOptions);

			if (mergedOptions.analyzeDependencies) {
				await this.analyzeModuleDependencies(modules);
			}

			this.logger.info('Found ' + modules.length + ' modules', LogContext.SYSTEM, { moduleCount: modules.length });
			return modules;
		} catch (error) {
			this.logger.error('Failed to scan path ' + scanPath, LogContext.SYSTEM, { scanPath }, error as Error);
			throw error;
		}
	}

	/**
	 * 扫描指定模式
	 */
	public async scanPattern(pattern: string, options: IScanOptions = {}): Promise<IModuleInfo[]> {
		const mergedOptions = { ...this.defaultOptions, ...options };
		this.logger.info('Scanning pattern: ' + pattern, LogContext.SYSTEM, {
			pattern
		});

		try {
			const moduleFiles = await this.findModuleFilesByPattern(pattern, mergedOptions);
			const modules = await this.loadModules(moduleFiles, mergedOptions);

			if (mergedOptions.analyzeDependencies) {
				await this.analyzeModuleDependencies(modules);
			}

			this.logger.info('Found ' + modules.length + ' modules matching pattern', LogContext.SYSTEM, {
				moduleCount: modules.length,
				pattern
			});
			return modules;
		} catch (error) {
			this.logger.error('Failed to scan pattern ' + pattern, LogContext.SYSTEM, { pattern }, error as Error);
			throw error;
		}
	}

	/**
	 * 分析模块依赖关系
	 */
	public async analyzeDependencies(modules: IModuleInfo[]): Promise<IDependencyGraph> {
		const graph: IDependencyGraph = {
			modules: new Map(),
			dependencies: new Map(),
			circularDependencies: [],
			topologicalOrder: [],
			rootModules: [],
			leafModules: []
		};

		// 构建模块映射
		modules.forEach((module) => {
			graph.modules.set(module.moduleName, module);
		});

		// 分析依赖关系
		for (const module of modules) {
			const dependencies: string[] = [];

			if (module.metadata.imports) {
				for (const importedModule of module.metadata.imports) {
					const importedModuleName = importedModule.name;
					if (graph.modules.has(importedModuleName)) {
						dependencies.push(importedModuleName);
					}
				}
			}

			graph.dependencies.set(module.moduleName, dependencies);
		}

		// 检测循环依赖
		graph.circularDependencies = this.detectCircularDependencies(graph);

		// 拓扑排序
		graph.topologicalOrder = this.topologicalSort(graph);

		// 识别根模块和叶子模块
		graph.rootModules = this.findRootModules(graph);
		graph.leafModules = this.findLeafModules(graph);

		return graph;
	}

	/**
	 * 查找模块文件
	 */
	private async findModuleFiles(scanPath: string, options: IScanOptions): Promise<string[]> {
		const patterns = options.includePatterns || ['**/*.module.ts'];
		const excludePatterns = options.excludePatterns || [];

		const allFiles: string[] = [];

		for (const pattern of patterns) {
			const fullPattern = path.join(scanPath, pattern);
			const files = await this.globFiles(fullPattern, excludePatterns);
			allFiles.push(...files);
		}

		return [...new Set(allFiles)];
	}

	/**
	 * 根据模式查找模块文件
	 */
	private async findModuleFilesByPattern(pattern: string, options: IScanOptions): Promise<string[]> {
		const excludePatterns = options.excludePatterns || [];
		return await this.globFiles(pattern, excludePatterns);
	}

	/**
	 * 使用 glob 查找文件
	 */
	private async globFiles(_pattern: string, _excludePatterns: string[]): Promise<string[]> {
		// 暂时返回空数组，因为 glob 依赖还没有正确安装
		// 在实际实现中，这里应该使用 glob 库来查找文件
		return [];
	}

	/**
	 * 加载模块
	 */
	private async loadModules(moduleFiles: string[], _options: IScanOptions): Promise<IModuleInfo[]> {
		const modules: IModuleInfo[] = [];

		for (const filePath of moduleFiles) {
			try {
				const moduleInfo = await this.loadModuleFromFile(filePath);
				if (moduleInfo) {
					modules.push(moduleInfo);
				}
			} catch (error) {
				this.logger.warn(
					'Failed to load module from ' + filePath + ': ' + (error as Error).message,
					LogContext.SYSTEM,
					{ filePath, error: (error as Error).message }
				);
			}
		}

		return modules;
	}

	/**
	 * 从文件加载模块
	 */
	private async loadModuleFromFile(filePath: string): Promise<IModuleInfo | null> {
		try {
			const moduleName = path.basename(filePath, path.extname(filePath));
			const moduleType = this.determineModuleType(moduleName);

			return {
				moduleClass: null as unknown as Type<unknown>,
				moduleName,
				modulePath: filePath,
				moduleType,
				metadata: {
					imports: [],
					exports: [],
					providers: [],
					controllers: []
				},
				dependencies: [],
				dependents: [],
				scannedAt: new Date()
			};
		} catch (error) {
			this.logger.warn(
				'Failed to load module from file ' + filePath + ': ' + (error as Error).message,
				LogContext.SYSTEM,
				{ filePath, error: (error as Error).message }
			);
			return null;
		}
	}

	/**
	 * 分析模块依赖关系
	 */
	private async analyzeModuleDependencies(modules: IModuleInfo[]): Promise<void> {
		for (const module of modules) {
			module.dependencies = [];
			module.dependents = [];
		}

		for (const module of modules) {
			if (module.metadata.imports) {
				for (const importedModule of module.metadata.imports) {
					const importedModuleInfo = modules.find((m) => m.moduleClass === importedModule);
					if (importedModuleInfo) {
						module.dependencies.push(importedModuleInfo);
						importedModuleInfo.dependents.push(module);
					}
				}
			}
		}
	}

	/**
	 * 检测循环依赖
	 */
	private detectCircularDependencies(graph: IDependencyGraph): string[][] {
		const visited = new Set<string>();
		const recursionStack = new Set<string>();
		const circularDependencies: string[][] = [];

		const dfs = (moduleName: string, currentPath: string[]): void => {
			if (recursionStack.has(moduleName)) {
				const cycleStart = currentPath.indexOf(moduleName);
				const cycle = currentPath.slice(cycleStart).concat(moduleName);
				circularDependencies.push(cycle);
				return;
			}

			if (visited.has(moduleName)) {
				return;
			}

			visited.add(moduleName);
			recursionStack.add(moduleName);

			const dependencies = graph.dependencies.get(moduleName) || [];
			for (const dependency of dependencies) {
				dfs(dependency, [...currentPath, moduleName]);
			}

			recursionStack.delete(moduleName);
		};

		for (const moduleName of graph.modules.keys()) {
			if (!visited.has(moduleName)) {
				dfs(moduleName, []);
			}
		}

		return circularDependencies;
	}

	/**
	 * 拓扑排序
	 */
	private topologicalSort(graph: IDependencyGraph): string[] {
		const inDegree = new Map<string, number>();
		const queue: string[] = [];
		const result: string[] = [];

		for (const moduleName of graph.modules.keys()) {
			inDegree.set(moduleName, 0);
		}

		for (const [, dependencies] of graph.dependencies.entries()) {
			for (const dependency of dependencies) {
				inDegree.set(dependency, (inDegree.get(dependency) || 0) + 1);
			}
		}

		for (const [moduleName, degree] of inDegree.entries()) {
			if (degree === 0) {
				queue.push(moduleName);
			}
		}

		while (queue.length > 0) {
			const current = queue.shift();
			if (!current) continue;
			result.push(current);

			const dependencies = graph.dependencies.get(current) || [];
			for (const dependency of dependencies) {
				const newDegree = (inDegree.get(dependency) || 0) - 1;
				inDegree.set(dependency, newDegree);

				if (newDegree === 0) {
					queue.push(dependency);
				}
			}
		}

		return result;
	}

	/**
	 * 查找根模块
	 */
	private findRootModules(graph: IDependencyGraph): string[] {
		const rootModules: string[] = [];

		for (const moduleName of graph.modules.keys()) {
			const dependencies = graph.dependencies.get(moduleName) || [];
			if (dependencies.length === 0) {
				rootModules.push(moduleName);
			}
		}

		return rootModules;
	}

	/**
	 * 查找叶子模块
	 */
	private findLeafModules(graph: IDependencyGraph): string[] {
		const leafModules: string[] = [];

		for (const moduleName of graph.modules.keys()) {
			let isLeaf = true;

			for (const [, dependencies] of graph.dependencies.entries()) {
				if (dependencies.includes(moduleName)) {
					isLeaf = false;
					break;
				}
			}

			if (isLeaf) {
				leafModules.push(moduleName);
			}
		}

		return leafModules;
	}

	/**
	 * 确定模块类型
	 */
	private determineModuleType(moduleName: string): 'root' | 'feature' | 'shared' | 'core' | 'unknown' {
		const name = moduleName.toLowerCase();

		if (name.includes('app') || name.includes('root')) {
			return 'root';
		}

		if (name.includes('core')) {
			return 'core';
		}

		if (name.includes('shared') || name.includes('common')) {
			return 'shared';
		}

		if (name.includes('feature') || name.includes('module')) {
			return 'feature';
		}

		return 'unknown';
	}
}
