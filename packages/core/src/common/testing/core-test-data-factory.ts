/**
 * CoreTestDataFactory - 核心测试数据工厂实现
 *
 * 提供了完整的测试数据生成功能，包括测试数据生成器、
 * 测试数据工厂、测试数据清理等功能。
 *
 * ## 业务规则
 *
 * ### 测试数据生成规则
 * - 支持多种数据类型生成
 * - 支持自定义数据生成器
 * - 支持数据生成选项配置
 * - 支持数据生成序列化
 *
 * ### 测试数据工厂规则
 * - 支持数据生成器注册
 * - 支持数据生成器管理
 * - 支持数据生成器查找
 * - 支持数据生成器清理
 *
 * ### 测试数据清理规则
 * - 支持数据清理策略
 * - 支持数据清理验证
 * - 支持数据清理日志
 * - 支持数据清理统计
 *
 * @description 核心测试数据工厂实现类
 * @example
 * ```typescript
 * const dataFactory = new CoreTestDataFactory(logger);
 * await dataFactory.initialize();
 *
 * // 注册数据生成器
 * dataFactory.registerGenerator('user', new UserDataGenerator());
 *
 * // 生成测试数据
 * const user = dataFactory.generate('user', { name: 'Test User' });
 * const users = dataFactory.generateMany('user', 5, { role: 'admin' });
 *
 * await dataFactory.cleanup();
 * ```
 *
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import { v4 as uuidv4 } from 'uuid';
import { ITestDataFactory, ITestDataGenerator } from './testing.interface';

/**
 * 用户数据生成器
 */
export class UserDataGenerator implements ITestDataGenerator {
  public readonly name = 'user';

  public generate(options: Record<string, unknown> = {}): any {
    return {
      id: uuidv4(),
      name:
        options.name || `Test User ${Math.random().toString(36).substr(2, 9)}`,
      email:
        options.email ||
        `test${Math.random().toString(36).substr(2, 9)}@example.com`,
      phone: options.phone || `+86${Math.floor(Math.random() * 10000000000)}`,
      role: options.role || 'user',
      status: options.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...options,
    };
  }

  public generateMany(
    count: number,
    options: Record<string, unknown> = {},
  ): any[] {
    return Array.from({ length: count }, () => this.generate(options));
  }

  public generateSequence(
    count: number,
    options: Record<string, unknown> = {},
  ): any[] {
    return this.generateMany(count, options);
  }
}

/**
 * 订单数据生成器
 */
export class OrderDataGenerator implements ITestDataGenerator {
  public readonly name = 'order';

  public generate(options: Record<string, unknown> = {}): any {
    return {
      id: uuidv4(),
      orderNumber:
        options.orderNumber ||
        `ORD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      customerId: options.customerId || uuidv4(),
      customerName:
        options.customerName ||
        `Customer ${Math.random().toString(36).substr(2, 9)}`,
      totalAmount:
        options.totalAmount || Math.floor(Math.random() * 10000) + 100,
      status: options.status || 'pending',
      items: options.items || [],
      shippingAddress: options.shippingAddress || {
        street: 'Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Test Country',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      ...options,
    };
  }

  public generateMany(
    count: number,
    options: Record<string, unknown> = {},
  ): any[] {
    return Array.from({ length: count }, () => this.generate(options));
  }

  public generateSequence(
    count: number,
    options: Record<string, unknown> = {},
  ): any[] {
    return this.generateMany(count, options);
  }
}

/**
 * 产品数据生成器
 */
export class ProductDataGenerator implements ITestDataGenerator {
  public readonly name = 'product';

  public generate(options: Record<string, unknown> = {}): any {
    return {
      id: uuidv4(),
      name:
        options.name || `Product ${Math.random().toString(36).substr(2, 9)}`,
      description:
        options.description ||
        `Test product description ${Math.random().toString(36).substr(2, 9)}`,
      price: options.price || Math.floor(Math.random() * 1000) + 10,
      category: options.category || 'electronics',
      brand: options.brand || 'Test Brand',
      sku:
        options.sku ||
        `SKU${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      stock: options.stock || Math.floor(Math.random() * 100),
      status: options.status || 'active',
      images: options.images || [],
      tags: options.tags || ['test', 'product'],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...options,
    };
  }

  public generateMany(
    count: number,
    options: Record<string, unknown> = {},
  ): any[] {
    return Array.from({ length: count }, () => this.generate(options));
  }

  public generateSequence(
    count: number,
    options: Record<string, unknown> = {},
  ): any[] {
    return this.generateMany(count, options);
  }
}

/**
 * 事件数据生成器
 */
export class EventDataGenerator implements ITestDataGenerator {
  public readonly name = 'event';

  public generate(options: Record<string, unknown> = {}): any {
    return {
      id: uuidv4(),
      eventType: options.eventType || 'TestEvent',
      eventData: options.eventData || { message: 'Test event data' },
      eventMetadata: options.eventMetadata || { source: 'test' },
      occurredOn: options.occurredOn || new Date(),
      aggregateId: options.aggregateId || uuidv4(),
      aggregateType: options.aggregateType || 'TestAggregate',
      version: options.version || 1,
      tenantId: options.tenantId || 'test-tenant',
      userId: options.userId || uuidv4(),
      correlationId: options.correlationId || uuidv4(),
      causationId: options.causationId || uuidv4(),
      ...options,
    };
  }

  public generateMany(
    count: number,
    options: Record<string, unknown> = {},
  ): any[] {
    return Array.from({ length: count }, () => this.generate(options));
  }

  public generateSequence(
    count: number,
    options: Record<string, unknown> = {},
  ): any[] {
    return this.generateMany(count, options);
  }
}

/**
 * 命令数据生成器
 */
export class CommandDataGenerator implements ITestDataGenerator {
  public readonly name = 'command';

  public generate(options: Record<string, unknown> = {}): any {
    return {
      id: uuidv4(),
      commandType: options.commandType || 'TestCommand',
      commandData: options.commandData || { action: 'test' },
      commandMetadata: options.commandMetadata || { source: 'test' },
      executedAt: options.executedAt || new Date(),
      aggregateId: options.aggregateId || uuidv4(),
      aggregateType: options.aggregateType || 'TestAggregate',
      version: options.version || 1,
      tenantId: options.tenantId || 'test-tenant',
      userId: options.userId || uuidv4(),
      correlationId: options.correlationId || uuidv4(),
      causationId: options.causationId || uuidv4(),
      ...options,
    };
  }

  public generateMany(
    count: number,
    options: Record<string, unknown> = {},
  ): any[] {
    return Array.from({ length: count }, () => this.generate(options));
  }

  public generateSequence(
    count: number,
    options: Record<string, unknown> = {},
  ): any[] {
    return this.generateMany(count, options);
  }
}

/**
 * 查询数据生成器
 */
export class QueryDataGenerator implements ITestDataGenerator {
  public readonly name = 'query';

  public generate(options: Record<string, unknown> = {}): any {
    return {
      id: uuidv4(),
      queryType: options.queryType || 'TestQuery',
      queryData: options.queryData || { filter: {} },
      queryMetadata: options.queryMetadata || { source: 'test' },
      executedAt: options.executedAt || new Date(),
      tenantId: options.tenantId || 'test-tenant',
      userId: options.userId || uuidv4(),
      correlationId: options.correlationId || uuidv4(),
      causationId: options.causationId || uuidv4(),
      ...options,
    };
  }

  public generateMany(
    count: number,
    options: Record<string, unknown> = {},
  ): any[] {
    return Array.from({ length: count }, () => this.generate(options));
  }

  public generateSequence(
    count: number,
    options: Record<string, unknown> = {},
  ): any[] {
    return this.generateMany(count, options);
  }
}

/**
 * 核心测试数据工厂
 */
@Injectable()
export class CoreTestDataFactory implements ITestDataFactory {
  private readonly generators = new Map<string, ITestDataGenerator>();
  private _isInitialized = false;

  constructor(private readonly logger?: ILoggerService) {}

  /**
   * 初始化数据工厂
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized) {
      this.logger?.warn(
        'Test data factory is already initialized',
        LogContext.SYSTEM,
      );
      return;
    }

    this.logger?.info('Initializing test data factory...', LogContext.SYSTEM);

    try {
      // 注册默认数据生成器
      this.registerDefaultGenerators();

      this._isInitialized = true;

      this.logger?.info(
        'Test data factory initialized successfully',
        LogContext.SYSTEM,
        {
          generatorCount: this.generators.size,
          generatorNames: Array.from(this.generators.keys()),
        },
      );
    } catch (error) {
      this.logger?.error(
        'Failed to initialize test data factory',
        LogContext.SYSTEM,
        {
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 注册数据生成器
   */
  public registerGenerator<T>(
    name: string,
    generator: ITestDataGenerator<T>,
  ): void {
    this.logger?.debug(
      `Registering test data generator: ${name}`,
      LogContext.SYSTEM,
      { generatorName: name },
    );

    this.generators.set(name, generator);

    this.logger?.debug(
      `Test data generator registered: ${name}`,
      LogContext.SYSTEM,
      { generatorName: name },
    );
  }

  /**
   * 获取数据生成器
   */
  public getGenerator<T>(name: string): ITestDataGenerator<T> | undefined {
    const generator = this.generators.get(name);
    if (!generator) {
      this.logger?.warn(
        `Test data generator not found: ${name}`,
        LogContext.SYSTEM,
        {
          generatorName: name,
          availableGenerators: Array.from(this.generators.keys()),
        },
      );
    }
    return generator;
  }

  /**
   * 生成测试数据
   */
  public generate<T>(name: string, options: Record<string, unknown> = {}): T {
    const generator = this.getGenerator<T>(name);
    if (!generator) {
      throw new Error(`Test data generator not found: ${name}`);
    }

    this.logger?.debug(`Generating test data: ${name}`, LogContext.SYSTEM, {
      generatorName: name,
      options,
    });

    try {
      const data = generator.generate(options);

      this.logger?.debug(`Test data generated: ${name}`, LogContext.SYSTEM, {
        generatorName: name,
        dataKeys: Object.keys(data as Record<string, unknown>),
      });

      return data;
    } catch (error) {
      this.logger?.error(
        `Failed to generate test data: ${name}`,
        LogContext.SYSTEM,
        {
          generatorName: name,
          options,
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 批量生成测试数据
   */
  public generateMany<T>(
    name: string,
    count: number,
    options: Record<string, unknown> = {},
  ): T[] {
    const generator = this.getGenerator<T>(name);
    if (!generator) {
      throw new Error(`Test data generator not found: ${name}`);
    }

    this.logger?.debug(
      `Generating ${count} test data items: ${name}`,
      LogContext.SYSTEM,
      {
        generatorName: name,
        count,
        options,
      },
    );

    try {
      const data = generator.generateMany(count, options);

      this.logger?.debug(`Test data generated: ${name}`, LogContext.SYSTEM, {
        generatorName: name,
        count: data.length,
      });

      return data;
    } catch (error) {
      this.logger?.error(
        `Failed to generate test data: ${name}`,
        LogContext.SYSTEM,
        {
          generatorName: name,
          count,
          options,
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 清理测试数据
   */
  public async cleanup(): Promise<void> {
    this.logger?.info('Cleaning up test data factory...', LogContext.SYSTEM);

    try {
      // 清理所有生成器
      this.generators.clear();

      this._isInitialized = false;

      this.logger?.info(
        'Test data factory cleaned up successfully',
        LogContext.SYSTEM,
      );
    } catch (error) {
      this.logger?.error(
        'Failed to cleanup test data factory',
        LogContext.SYSTEM,
        {
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 注册默认数据生成器
   */
  private registerDefaultGenerators(): void {
    // 注册用户数据生成器
    this.registerGenerator('user', new UserDataGenerator());

    // 注册订单数据生成器
    this.registerGenerator('order', new OrderDataGenerator());

    // 注册产品数据生成器
    this.registerGenerator('product', new ProductDataGenerator());

    // 注册事件数据生成器
    this.registerGenerator('event', new EventDataGenerator());

    // 注册命令数据生成器
    this.registerGenerator('command', new CommandDataGenerator());

    // 注册查询数据生成器
    this.registerGenerator('query', new QueryDataGenerator());

    this.logger?.debug(
      'Default test data generators registered',
      LogContext.SYSTEM,
      {
        generatorCount: this.generators.size,
        generatorNames: Array.from(this.generators.keys()),
      },
    );
  }
}
