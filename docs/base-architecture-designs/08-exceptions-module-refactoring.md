# Exceptions模块重构方案 - 基于Cache模块设计模式

## 🎯 重构概述

### 重构背景

当前Exceptions模块虽然实现了基本的异常处理功能，但在架构设计上存在以下问题：

- 缺乏统一的设计模式和架构规范
- 与其他模块的集成度不够深入
- 缺乏企业级的配置管理和监控能力
- 多租户支持不够完善
- 缺乏可扩展的策略系统

### 重构目标

通过参考Cache模块的优秀设计模式，将Exceptions模块重构为：

- **企业级异常管理平台**：提供统一、可扩展的异常处理能力
- **多租户原生支持**：完整的租户隔离和上下文管理
- **配置驱动架构**：基于@aiofix/config的统一配置管理
- **策略模式应用**：可插拔的异常处理策略
- **深度NestJS集成**：装饰器、依赖注入、生命周期管理
- **清晰的模块边界**：与Core模块明确分工，避免功能重叠

## 🔄 Core模块与Exceptions模块边界划分

### 当前问题分析

通过分析Core模块的异常处理相关代码，发现以下问题：

1. **功能重叠**：
   - Core模块的`CoreErrorBus`与Exceptions模块的异常处理功能重叠
   - Core模块的`CoreExceptionFilter`与Exceptions模块的过滤器功能重叠
   - 两个模块都在处理异常分类、通知、恢复等功能

2. **职责不清**：
   - Core模块既提供基础设施又处理具体异常
   - Exceptions模块缺乏与Core模块的深度集成
   - 异常处理流程分散在多个模块中

3. **依赖混乱**：
   - Exceptions模块依赖Core模块，但Core模块也依赖异常处理
   - 循环依赖风险
   - 模块边界不清晰

### 边界重新划分方案

#### Core模块职责（保持不变）

**Core模块专注于基础设施和架构基础**：

```typescript
// Core模块保留的核心职责
packages/core/src/
├── common/
│   ├── error-handling/
│   │   ├── error-handling.interface.ts    # 错误处理接口定义
│   │   └── core-error-bus.ts             # 核心错误总线（基础设施）
│   └── multi-tenant/                     # 多租户基础设施
├── application/
│   └── common/exceptions/
│       └── application-exception.ts      # 应用层异常基类
└── infrastructure/
    └── monitoring/                       # 监控基础设施
```

**Core模块保留的功能**：

- ✅ **错误总线基础设施**：`CoreErrorBus`作为底层错误处理基础设施
- ✅ **错误处理接口定义**：`IErrorBus`、`IErrorHandler`等核心接口
- ✅ **应用层异常基类**：`BaseApplicationException`等基础异常类
- ✅ **多租户上下文管理**：租户隔离的基础设施
- ✅ **监控基础设施**：性能监控、指标收集等

#### Exceptions模块职责（重构后）

**Exceptions模块专注于异常处理的具体实现和用户接口**：

```typescript
// Exceptions模块的新职责
packages/exceptions/src/
├── interfaces/                    # 异常处理专用接口
├── core/                         # 异常处理核心实现
├── strategies/                   # 异常处理策略
├── bridges/                      # 与Core模块的桥梁
├── config/                       # 异常处理配置
├── nestjs/                       # NestJS集成
├── exceptions/                   # 具体异常定义
├── filters/                      # 异常过滤器
└── examples/                     # 使用示例
```

**Exceptions模块新增的功能**：

- ✅ **统一异常管理器**：基于Core模块错误总线的上层管理器
- ✅ **异常处理策略**：可插拔的异常处理策略
- ✅ **异常转换桥梁**：连接Core模块和HTTP层的桥梁
- ✅ **NestJS深度集成**：装饰器、过滤器、拦截器
- ✅ **配置管理**：异常处理专用配置
- ✅ **具体异常类**：HTTP异常、业务异常等

### 迁移策略

#### Phase 1: 接口统一和桥梁建立

**目标**：建立Core模块和Exceptions模块之间的清晰接口

**任务清单**：

- [ ] 在Exceptions模块中创建Core模块错误总线的适配器
- [ ] 实现异常转换桥梁，连接Core模块和HTTP层
- [ ] 统一异常分类和上下文管理接口
- [ ] 建立配置管理桥梁

**代码示例**：

```typescript
// packages/exceptions/src/bridges/core-error-bus.bridge.ts
export class CoreErrorBusBridge {
  constructor(
    private readonly coreErrorBus: CoreErrorBus,
    private readonly logger: ILoggerService
  ) {}

  async publishToCoreErrorBus(
    exception: IUnifiedException,
    context: IExceptionContext
  ): Promise<void> {
    // 将Exceptions模块的异常转换为Core模块的错误格式
    const coreError = this.convertToCoreError(exception);
    const coreContext = this.convertToCoreContext(context);
    
    await this.coreErrorBus.publish(coreError, coreContext);
  }

  private convertToCoreError(exception: IUnifiedException): Error {
    // 转换逻辑
  }

  private convertToCoreContext(context: IExceptionContext): Partial<IErrorContext> {
    // 转换逻辑
  }
}
```

#### Phase 2: 功能迁移和职责分离

**目标**：将Core模块中的异常处理具体实现迁移到Exceptions模块

**迁移清单**：

**从Core模块迁移到Exceptions模块**：

- [ ] `CoreExceptionFilter` → `UnifiedExceptionFilter`
- [ ] 异常分类逻辑 → `ExceptionClassifier`
- [ ] 异常通知逻辑 → `NotificationStrategy`
- [ ] 异常恢复逻辑 → `RecoveryStrategy`
- [ ] 异常监控逻辑 → `MonitoringStrategy`

**Core模块保留**：

- ✅ `CoreErrorBus`（基础设施）
- ✅ `IErrorBus`等核心接口
- ✅ `BaseApplicationException`等基础异常类
- ✅ 多租户上下文管理

#### Phase 3: 深度集成和优化

**目标**：实现两个模块的深度集成和性能优化

**任务清单**：

- [ ] 实现异常处理的缓存机制
- [ ] 优化异常转换性能
- [ ] 实现异常处理的批量处理
- [ ] 建立异常处理的监控和告警

### 依赖关系图

```mermaid
graph TB
    subgraph "Exceptions Module"
        UEM[UnifiedExceptionManager]
        ECS[ExceptionConfigService]
        UEF[UnifiedExceptionFilter]
        EBR[ExceptionBridge]
    end
    
    subgraph "Core Module"
        CEB[CoreErrorBus]
        IEB[IErrorBus Interface]
        BAE[BaseApplicationException]
        TCM[TenantContextManager]
    end
    
    subgraph "External Dependencies"
        NestJS[NestJS Framework]
        Config[@aiofix/config]
        Logging[@aiofix/logging]
    end
    
    UEM --> CEB
    UEM --> IEB
    EBR --> CEB
    UEF --> UEM
    ECS --> Config
    UEM --> Logging
    UEM --> TCM
    BAE --> UEM
    NestJS --> UEF
```

### 配置管理边界

#### Core模块配置

```typescript
// Core模块负责基础设施配置
interface ICoreErrorBusConfig {
  enabled: boolean;
  batchSize: number;
  batchInterval: number;
  processingTimeout: number;
  retentionTime: number;
}
```

#### Exceptions模块配置

```typescript
// Exceptions模块负责异常处理专用配置
interface IExceptionModuleConfig {
  enabled: boolean;
  global: {
    enableTenantIsolation: boolean;
    enableErrorBusIntegration: boolean;
    defaultHandlingStrategy: ExceptionHandlingStrategy;
  };
  http: {
    enableRFC7807: boolean;
    includeStackTrace: boolean;
  };
  strategies: {
    logging: ILoggingStrategyConfig;
    notification: INotificationStrategyConfig;
    recovery: IRecoveryStrategyConfig;
  };
}
```

## 🏗️ 架构设计对比

### Cache模块的优秀设计模式

```text
packages/cache/src/
├── interfaces/     # 接口定义层 - 完整的类型系统
├── core/          # 核心实现层 - 业务逻辑实现
├── strategies/    # 策略层 - 可插拔策略实现
├── config/        # 配置集成层 - 统一配置管理
├── nestjs/        # NestJS集成层 - 框架深度集成
└── examples/      # 使用示例 - 文档和示例代码
```

### 重构后的Exceptions模块架构

```text
packages/exceptions/src/
├── 📋 interfaces/              # 接口定义层
│   ├── exception.interface.ts          # 异常核心接口
│   ├── exception-handler.interface.ts  # 异常处理器接口  
│   ├── exception-filter.interface.ts   # 异常过滤器接口
│   ├── exception-bridge.interface.ts   # 异常转换桥梁接口
│   └── index.ts                        # 统一导出
├── 🏗️ core/                   # 核心实现层
│   ├── unified-exception-manager.ts    # 统一异常管理器
│   ├── exception-classifier.ts         # 异常分类器
│   ├── exception-transformer.ts        # 异常转换器
│   ├── exception-context-manager.ts    # 异常上下文管理器
│   └── index.ts                        # 统一导出
├── 🔧 strategies/              # 策略层
│   ├── exception-handling.strategy.ts  # 异常处理策略
│   ├── exception-logging.strategy.ts   # 异常日志策略
│   ├── exception-recovery.strategy.ts  # 异常恢复策略
│   ├── exception-notification.strategy.ts # 异常通知策略
│   └── index.ts                        # 统一导出
├── 🌉 bridges/                 # 桥接层
│   ├── application-to-http.bridge.ts   # 应用层到HTTP桥梁
│   ├── domain-to-application.bridge.ts # 领域层到应用层桥梁
│   ├── core-error-bus.bridge.ts        # Core错误总线桥梁
│   └── index.ts                        # 统一导出
├── ⚙️ config/                  # 配置集成层
│   ├── exception-config.service.ts     # 异常配置服务
│   ├── exception-config.module.ts      # 配置模块
│   └── index.ts                        # 统一导出
├── 🧪 nestjs/                  # NestJS集成层
│   ├── unified-exception.module.ts     # 统一异常模块
│   ├── exception.decorators.ts         # 异常装饰器
│   ├── exception.interceptors.ts       # 异常拦截器
│   └── index.ts                        # 统一导出
├── 🎯 exceptions/              # 异常定义层（保留并扩展）
│   ├── http/                           # HTTP异常
│   ├── application/                    # 应用层异常
│   ├── domain/                         # 领域异常
│   ├── infrastructure/                 # 基础设施异常
│   └── index.ts                        # 统一导出
├── 🛡️ filters/                 # 过滤器层（重构）
│   ├── unified-exception.filter.ts     # 统一异常过滤器
│   ├── http-exception.filter.ts        # HTTP异常过滤器
│   ├── application-exception.filter.ts # 应用异常过滤器
│   └── index.ts                        # 统一导出
└── 📚 examples/                # 使用示例
    ├── basic-exception-handling.ts     # 基础异常处理
    ├── advanced-exception-patterns.ts  # 高级异常模式
    ├── multi-tenant-exceptions.ts      # 多租户异常处理
    └── custom-strategies.ts            # 自定义策略示例
```

## 🔧 核心组件设计

### 1. 接口定义层 (interfaces/)

#### 核心异常接口

```typescript
// packages/exceptions/src/interfaces/exception.interface.ts
export interface IExceptionModuleConfig {
  enabled: boolean;
  
  global: {
    enableTenantIsolation: boolean;
    enableErrorBusIntegration: boolean;
    enableSwaggerIntegration: boolean;
    defaultHandlingStrategy: ExceptionHandlingStrategy;
    enableMetrics: boolean;
    enableTracing: boolean;
  };
  
  http: {
    enableRFC7807: boolean;
    includeStackTrace: boolean;
    enableCORS: boolean;
    defaultErrorMessage: string;
  };
  
  logging: {
    enableStructuredLogging: boolean;
    logLevel: ExceptionLevel;
    enableSensitiveDataMasking: boolean;
  };
  
  recovery: {
    enableAutoRecovery: boolean;
    maxRetryAttempts: number;
    retryDelay: number;
    enableCircuitBreaker: boolean;
  };
  
  monitoring: {
    enableMetrics: boolean;
    metricsInterval: number;
    enableHealthChecks: boolean;
    enableAlerts: boolean;
  };
}

export interface IUnifiedException {
  readonly id: string;
  readonly category: ExceptionCategory;
  readonly level: ExceptionLevel;
  readonly message: string;
  readonly code: string;
  readonly context: IExceptionContext;
  readonly originalError?: Error;
  readonly occurredAt: Date;
  
  toErrorResponse(requestId: string): Record<string, unknown>;
  getUserFriendlyMessage(): string;
  getRecoveryAdvice(): string;
  shouldNotify(): boolean;
  shouldLog(): boolean;
}

export interface IUnifiedExceptionManager {
  initialize(): Promise<void>;
  destroy(): Promise<void>;
  
  handle(exception: unknown, host: ArgumentsHost): Promise<void>;
  registerHandler(handler: IExceptionHandler): void;
  unregisterHandler(name: string): void;
  registerStrategy(strategy: IExceptionHandlingStrategy): void;
  
  getStats(): Promise<IExceptionStats>;
  getHealth(): Promise<IExceptionHealth>;
}
```

### 2. 核心实现层 (core/)

#### 统一异常管理器

```typescript
// packages/exceptions/src/core/unified-exception-manager.ts
@Injectable()
export class UnifiedExceptionManager implements IUnifiedExceptionManager {
  private handlers = new Map<string, IExceptionHandler>();
  private strategies = new Map<string, IExceptionHandlingStrategy>();
  private initialized = false;
  private config: IExceptionModuleConfig | null = null;

  constructor(
    private readonly configManager: IConfigManager,
    private readonly errorBus: CoreErrorBus,
    private readonly logger: ILoggerService
  ) {}

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // 加载配置
      this.config = await this.configManager.getModuleConfig('exceptions');
      this.logger.info('异常模块配置加载完成', LogContext.SYSTEM, { config: this.config });

      // 初始化错误总线集成
      if (this.config.global.enableErrorBusIntegration) {
        await this.initializeErrorBusIntegration();
      }

      // 注册默认策略
      await this.registerDefaultStrategies();

      // 启动监控
      if (this.config.monitoring.enableMetrics) {
        await this.startMonitoring();
      }

      this.initialized = true;
      this.logger.info('统一异常管理器初始化完成', LogContext.SYSTEM);
    } catch (error) {
      this.logger.error('UnifiedExceptionManager初始化失败', LogContext.SYSTEM, {}, error as Error);
      throw new Error(`UnifiedExceptionManager初始化失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async handle(exception: unknown, host: ArgumentsHost): Promise<void> {
    await this.ensureInitialized();

    const startTime = Date.now();
    let unifiedException: IUnifiedException;

    try {
      // 转换为统一异常
      unifiedException = await this.transformException(exception, host);
      
      // 更新统计信息
      await this.updateStats(unifiedException);

      // 发布到错误总线
      if (this.config?.global.enableErrorBusIntegration) {
        await this.publishToErrorBus(unifiedException);
      }

      // 应用处理策略
      await this.applyStrategies(unifiedException, host);

      // 执行注册的处理器
      await this.executeHandlers(unifiedException, host);

      this.logger.debug('异常处理完成', LogContext.SYSTEM, {
        exceptionId: unifiedException.id,
        duration: Date.now() - startTime
      });

    } catch (handlingError) {
      this.logger.error('异常处理过程中发生错误', LogContext.SYSTEM, {
        originalException: exception,
        handlingError: handlingError instanceof Error ? handlingError.message : String(handlingError),
        duration: Date.now() - startTime
      }, handlingError as Error);
      
      // 降级处理：直接返回基本错误响应
      await this.fallbackErrorHandling(exception, host);
    }
  }

  private async registerDefaultStrategies(): Promise<void> {
    const strategies = [
      new LoggingStrategy(this.logger),
      new HttpResponseStrategy(),
      new NotificationStrategy(),
      new RecoveryStrategy(),
      new MonitoringStrategy()
    ];

    for (const strategy of strategies) {
      this.registerStrategy(strategy);
    }
  }

  private async applyStrategies(exception: IUnifiedException, host: ArgumentsHost): Promise<void> {
    const applicableStrategies = Array.from(this.strategies.values())
      .filter(strategy => strategy.shouldApply(exception))
      .sort((a, b) => b.priority - a.priority);

    for (const strategy of applicableStrategies) {
      try {
        const result = await strategy.apply(exception, host);
        this.logger.debug(`策略 ${strategy.name} 执行结果`, LogContext.SYSTEM, { result });
      } catch (strategyError) {
        this.logger.warn(`策略 ${strategy.name} 执行失败`, LogContext.SYSTEM, {
          error: strategyError instanceof Error ? strategyError.message : String(strategyError)
        });
      }
    }
  }

  // ... 其他方法实现
}
```

### 3. 策略层 (strategies/)

#### 异常处理策略

```typescript
// packages/exceptions/src/strategies/exception-handling.strategy.ts
export interface IExceptionHandlingStrategy {
  readonly name: string;
  readonly priority: number;
  
  shouldApply(exception: IUnifiedException): boolean;
  apply(exception: IUnifiedException, host: ArgumentsHost): Promise<IExceptionHandlingResult>;
}

export class LoggingStrategy implements IExceptionHandlingStrategy {
  readonly name = 'logging';
  readonly priority = 100;
  
  constructor(private readonly logger: ILoggerService) {}
  
  shouldApply(exception: IUnifiedException): boolean {
    return exception.shouldLog();
  }
  
  async apply(exception: IUnifiedException): Promise<IExceptionHandlingResult> {
    const logData = {
      exceptionId: exception.id,
      category: exception.category,
      level: exception.level,
      message: exception.message,
      code: exception.code,
      context: exception.context,
      stack: exception.originalError?.stack
    };

    switch (exception.level) {
      case ExceptionLevel.FATAL:
      case ExceptionLevel.ERROR:
        this.logger.error('异常记录', LogContext.EXCEPTION, logData, exception.originalError);
        break;
      case ExceptionLevel.WARN:
        this.logger.warn('异常警告', LogContext.EXCEPTION, logData);
        break;
      default:
        this.logger.info('异常信息', LogContext.EXCEPTION, logData);
    }
    
    return { success: true, action: 'logged', metadata: { level: exception.level } };
  }
}

export class HttpResponseStrategy implements IExceptionHandlingStrategy {
  readonly name = 'http_response';
  readonly priority = 90;
  
  shouldApply(exception: IUnifiedException): boolean {
    return exception.category === ExceptionCategory.HTTP || 
           exception.category === ExceptionCategory.APPLICATION;
  }
  
  async apply(exception: IUnifiedException, host: ArgumentsHost): Promise<IExceptionHandlingResult> {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    
    if (!response || !request) {
      return { success: false, action: 'skipped', reason: 'not_http_context' };
    }
    
    const requestId = request.id || request.headers?.['x-request-id'] || 'unknown';
    const errorResponse = exception.toErrorResponse(requestId);
    
    // 设置响应头
    response.setHeader('Content-Type', 'application/problem+json');
    response.setHeader('X-Exception-ID', exception.id);
    
    response.status(errorResponse.status).json(errorResponse);
    
    return { 
      success: true, 
      action: 'http_response_sent',
      metadata: { 
        status: errorResponse.status,
        requestId 
      }
    };
  }
}

export class NotificationStrategy implements IExceptionHandlingStrategy {
  readonly name = 'notification';
  readonly priority = 80;
  
  shouldApply(exception: IUnifiedException): boolean {
    return exception.shouldNotify() && 
           (exception.level === ExceptionLevel.ERROR || exception.level === ExceptionLevel.FATAL);
  }
  
  async apply(exception: IUnifiedException): Promise<IExceptionHandlingResult> {
    // 集成通知系统（邮件、短信、Slack等）
    try {
      const notificationData = {
        title: `系统异常告警 - ${exception.category}`,
        message: exception.getUserFriendlyMessage(),
        level: exception.level,
        context: exception.context,
        timestamp: exception.occurredAt
      };
      
      // TODO: 实际的通知发送逻辑
      console.log('发送异常通知:', notificationData);
      
      return { success: true, action: 'notification_sent' };
    } catch (error) {
      return { 
        success: false, 
        action: 'notification_failed', 
        reason: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

export class RecoveryStrategy implements IExceptionHandlingStrategy {
  readonly name = 'recovery';
  readonly priority = 70;
  
  shouldApply(exception: IUnifiedException): boolean {
    return exception.category === ExceptionCategory.INFRASTRUCTURE ||
           exception.category === ExceptionCategory.EXTERNAL;
  }
  
  async apply(exception: IUnifiedException): Promise<IExceptionHandlingResult> {
    const recoveryAdvice = exception.getRecoveryAdvice();
    
    if (recoveryAdvice.includes('重试')) {
      // 实现重试逻辑
      return this.attemptRetry(exception);
    } else if (recoveryAdvice.includes('降级')) {
      // 实现服务降级
      return this.attemptFallback(exception);
    }
    
    return { success: false, action: 'no_recovery_available' };
  }
  
  private async attemptRetry(exception: IUnifiedException): Promise<IExceptionHandlingResult> {
    // TODO: 实现重试逻辑
    return { success: true, action: 'retry_scheduled' };
  }
  
  private async attemptFallback(exception: IUnifiedException): Promise<IExceptionHandlingResult> {
    // TODO: 实现降级逻辑
    return { success: true, action: 'fallback_activated' };
  }
}
```

### 4. 桥接层 (bridges/)

#### 应用层到HTTP异常转换桥梁

```typescript
// packages/exceptions/src/bridges/application-to-http.bridge.ts
export class ApplicationToHttpExceptionBridge {
  private static readonly statusMapping: Record<ApplicationExceptionType, HttpStatus> = {
    [ApplicationExceptionType.VALIDATION]: HttpStatus.BAD_REQUEST,
    [ApplicationExceptionType.AUTHORIZATION]: HttpStatus.FORBIDDEN,
    [ApplicationExceptionType.RESOURCE_NOT_FOUND]: HttpStatus.NOT_FOUND,
    [ApplicationExceptionType.CONCURRENCY]: HttpStatus.CONFLICT,
    [ApplicationExceptionType.EXTERNAL_SERVICE]: HttpStatus.SERVICE_UNAVAILABLE,
    [ApplicationExceptionType.BUSINESS_LOGIC]: HttpStatus.UNPROCESSABLE_ENTITY,
    [ApplicationExceptionType.INFRASTRUCTURE]: HttpStatus.INTERNAL_SERVER_ERROR,
    [ApplicationExceptionType.CONFIGURATION]: HttpStatus.INTERNAL_SERVER_ERROR,
  };

  static convert(appException: BaseApplicationException): AbstractHttpException {
    const errorCode = appException.errorCode;
    const context = appException.context;
    const userMessage = appException.getUserFriendlyMessage();

    switch (appException.errorType) {
      case ApplicationExceptionType.VALIDATION:
        return this.convertValidationException(appException, errorCode, context, userMessage);

      case ApplicationExceptionType.AUTHORIZATION:
        return new GeneralForbiddenException(errorCode, appException);

      case ApplicationExceptionType.RESOURCE_NOT_FOUND:
        return new GeneralNotFoundException(errorCode, appException);

      case ApplicationExceptionType.CONCURRENCY:
        return this.convertConcurrencyException(appException, errorCode, context);

      case ApplicationExceptionType.EXTERNAL_SERVICE:
        return this.convertExternalServiceException(appException, errorCode, context);

      case ApplicationExceptionType.BUSINESS_LOGIC:
        return new GeneralUnprocessableEntityException(userMessage, errorCode, appException);

      case ApplicationExceptionType.INFRASTRUCTURE:
      case ApplicationExceptionType.CONFIGURATION:
        return new GeneralInternalServerException(errorCode, appException);

      default:
        return new GeneralInternalServerException('UNKNOWN_APPLICATION_ERROR', appException);
    }
  }

  static getHttpStatusCode(appExceptionType: ApplicationExceptionType): HttpStatus {
    return this.statusMapping[appExceptionType] || HttpStatus.INTERNAL_SERVER_ERROR;
  }

  static shouldLogDetailed(appException: BaseApplicationException): boolean {
    return appException.severity === ApplicationExceptionSeverity.HIGH ||
           appException.severity === ApplicationExceptionSeverity.CRITICAL;
  }

  static shouldNotify(appException: BaseApplicationException): boolean {
    return appException.severity === ApplicationExceptionSeverity.CRITICAL;
  }

  private static convertValidationException(
    appException: BaseApplicationException,
    errorCode: string,
    context: Record<string, unknown>,
    userMessage: string
  ): GeneralBadRequestException {
    const validationError: ValidationError = {
      field: (context.fieldName as string) || 'unknown',
      message: userMessage,
      value: context.fieldValue,
      constraints: context.constraints as Record<string, string>
    };

    return new GeneralBadRequestException([validationError], errorCode, appException);
  }

  private static convertConcurrencyException(
    appException: BaseApplicationException,
    errorCode: string,
    context: Record<string, unknown>
  ): OptimisticLockException {
    const currentVersion = (context.actualVersion as number) || 0;
    return new OptimisticLockException(currentVersion, appException);
  }

  private static convertExternalServiceException(
    appException: BaseApplicationException,
    errorCode: string,
    context: Record<string, unknown>
  ): InternalServiceUnavailableHttpException {
    const serviceName = (context.serviceName as string) || 'unknown-service';
    return new InternalServiceUnavailableHttpException(serviceName, errorCode, appException);
  }
}
```

### 5. NestJS集成层 (nestjs/)

#### 统一异常模块

```typescript
// packages/exceptions/src/nestjs/unified-exception.module.ts
@Global()
@Module({})
export class UnifiedExceptionModule {
  static forRoot(options: IUnifiedExceptionModuleOptions = {}): DynamicModule {
    return {
      module: UnifiedExceptionModule,
      imports: [
        // 引入依赖模块
        ...(options.enableConfigIntegration !== false ? [ConfigModule] : []),
        ...(options.enableErrorBusIntegration !== false ? [CoreModule] : []),
      ],
      providers: [
        // 配置服务
        ExceptionConfigService,
        
        // 核心管理器
        {
          provide: UnifiedExceptionManager,
          useFactory: async (
            configManager: IConfigManager,
            errorBus: CoreErrorBus,
            logger: ILoggerService
          ) => {
            const manager = new UnifiedExceptionManager(configManager, errorBus, logger);
            await manager.initialize();
            
            // 注册自定义处理器
            if (options.customHandlers) {
              options.customHandlers.forEach(handler => {
                manager.registerHandler(handler);
              });
            }
            
            // 注册自定义策略
            if (options.customStrategies) {
              options.customStrategies.forEach(strategy => {
                manager.registerStrategy(strategy);
              });
            }
            
            return manager;
          },
          inject: [IConfigManager, CoreErrorBus, ILoggerService]
        },
        
        // 全局异常过滤器
        ...(options.enableGlobalFilter !== false ? [
          {
            provide: APP_FILTER,
            useFactory: (manager: UnifiedExceptionManager) => {
              return new UnifiedExceptionFilter(manager);
            },
            inject: [UnifiedExceptionManager]
          }
        ] : []),
        
        // 拦截器
        ...(options.enableInterceptor ? [
          {
            provide: APP_INTERCEPTOR,
            useClass: ExceptionInterceptor
          }
        ] : [])
      ],
      exports: [
        UnifiedExceptionManager, 
        ExceptionConfigService
      ]
    };
  }

  static forFeature(options: Partial<IUnifiedExceptionModuleOptions> = {}): DynamicModule {
    return {
      module: UnifiedExceptionModule,
      providers: [
        // 特定功能的提供者
        ...(options.customHandlers || []).map(handler => ({
          provide: `EXCEPTION_HANDLER_${handler.constructor.name}`,
          useValue: handler
        }))
      ]
    };
  }
}

// 装饰器
export const InjectUnifiedExceptionManager = () => 
  Inject(UnifiedExceptionManager);

export const InjectExceptionConfig = () => 
  Inject(ExceptionConfigService);

// 异常装饰器
export function ExceptionHandler(exceptionType: any) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        if (error instanceof exceptionType) {
          // 特殊处理逻辑
          console.log(`捕获到 ${exceptionType.name} 异常:`, error.message);
        }
        throw error;
      }
    };
    
    return descriptor;
  };
}

export function TenantAwareException() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        // 自动添加租户上下文
        const tenantContext = TenantContextManager.getCurrentTenant();
        if (tenantContext && error instanceof BaseApplicationException) {
          error.context.tenantId = tenantContext.tenantId;
          error.context.organizationId = tenantContext.organizationId;
        }
        throw error;
      }
    };
    
    return descriptor;
  };
}
```

## 🚀 实施计划

### Phase 1: 基础架构搭建和Core模块集成 (Week 1-2)

**目标**: 建立新的架构基础并与Core模块建立清晰边界

**任务清单**:

- [ ] 创建新的目录结构
- [ ] 定义核心接口 (interfaces/)
- [ ] 实现Core模块错误总线桥梁 (bridges/)
- [ ] 实现基础的统一异常管理器
- [ ] 建立配置服务集成
- [ ] 编写基础单元测试
- [ ] **Core模块集成**: 实现与Core模块的接口适配

**交付物**:

- 完整的接口定义
- Core模块错误总线桥梁
- 可运行的基础异常管理器
- 配置服务集成
- 基础测试用例
- Core模块集成测试

### Phase 2: 策略系统实现和Core模块功能迁移 (Week 3-4)

**目标**: 实现可插拔的策略系统并迁移Core模块的异常处理功能

**任务清单**:

- [ ] 实现核心异常处理策略
- [ ] 实现异常转换桥梁
- [ ] 集成Core模块错误总线
- [ ] 实现多租户支持
- [ ] 策略系统测试
- [ ] **Core模块功能迁移**: 将Core模块的异常处理具体实现迁移到Exceptions模块
  - [ ] 迁移`CoreExceptionFilter` → `UnifiedExceptionFilter`
  - [ ] 迁移异常分类逻辑 → `ExceptionClassifier`
  - [ ] 迁移异常通知逻辑 → `NotificationStrategy`
  - [ ] 迁移异常恢复逻辑 → `RecoveryStrategy`
  - [ ] 迁移异常监控逻辑 → `MonitoringStrategy`

**交付物**:

- 完整的策略系统
- 异常转换桥梁
- 多租户支持
- 策略测试用例
- Core模块功能迁移完成
- 迁移后的集成测试

### Phase 3: NestJS深度集成 (Week 5-6)

**目标**: 实现与NestJS的深度集成

**任务清单**:

- [ ] 实现统一异常过滤器
- [ ] 开发异常装饰器系统
- [ ] 优化依赖注入
- [ ] 实现生命周期管理
- [ ] 集成测试

**交付物**:

- 统一异常模块
- 装饰器系统
- 完整的NestJS集成
- 集成测试用例

### Phase 4: 高级特性和优化 (Week 7-8)

**目标**: 实现监控、分析等高级特性

**任务清单**:

- [ ] 实现监控和指标收集
- [ ] 异常分析和诊断功能
- [ ] 自动恢复机制
- [ ] 性能优化
- [ ] 完善文档和示例

**交付物**:

- 监控和指标系统
- 异常分析功能
- 自动恢复机制
- 完整文档

## 📊 预期收益

### 架构收益

| 收益项 | 当前状态 | 重构后状态 | 改进程度 |
|--------|----------|------------|----------|
| **设计一致性** | 不一致的设计模式 | 与Cache模块统一的设计语言 | ⭐⭐⭐⭐⭐ |
| **模块化程度** | 基础模块化 | 完整的分层架构 | ⭐⭐⭐⭐⭐ |
| **可扩展性** | 有限扩展能力 | 策略模式支持灵活扩展 | ⭐⭐⭐⭐⭐ |
| **配置管理** | 基础配置支持 | 统一配置管理系统 | ⭐⭐⭐⭐⭐ |

### 开发收益

| 收益项 | 当前状态 | 重构后状态 | 改进程度 |
|--------|----------|------------|----------|
| **开发效率** | 基础开发支持 | 统一开发模式和工具链 | ⭐⭐⭐⭐ |
| **代码复用** | 有限复用 | 可复用的组件和策略 | ⭐⭐⭐⭐⭐ |
| **类型安全** | 基础类型支持 | 完整TypeScript类型系统 | ⭐⭐⭐⭐⭐ |
| **测试友好** | 基础测试支持 | 独立组件便于单元测试 | ⭐⭐⭐⭐ |

### 运维收益

| 收益项 | 当前状态 | 重构后状态 | 改进程度 |
|--------|----------|------------|----------|
| **统一监控** | 基础监控 | 一致的监控和指标体系 | ⭐⭐⭐⭐⭐ |
| **配置管理** | 静态配置 | 统一配置热更新机制 | ⭐⭐⭐⭐⭐ |
| **故障诊断** | 基础日志 | 完整异常链路追踪 | ⭐⭐⭐⭐⭐ |
| **自动恢复** | 手动处理 | 智能异常恢复策略 | ⭐⭐⭐⭐ |

## 🎯 成功指标

### 技术指标

- **代码质量**: TypeScript覆盖率 100%，Lint错误数 0
- **测试覆盖率**: 单元测试覆盖率 > 90%，集成测试覆盖率 > 80%
- **性能指标**: 异常处理延迟 < 10ms，内存占用 < 50MB
- **可靠性**: 异常处理成功率 > 99.9%

### 业务指标

- **开发效率**: 异常处理相关开发时间减少 40%
- **故障恢复**: 平均故障恢复时间减少 60%
- **运维效率**: 异常诊断时间减少 70%
- **用户体验**: 错误响应时间减少 50%

## 🔄 迁移策略

### 渐进式迁移

1. **Phase 1**: 新功能使用新架构
2. **Phase 2**: 现有核心功能迁移
3. **Phase 3**: 边缘功能迁移
4. **Phase 4**: 清理旧代码

### 向后兼容

- 保持现有API的向后兼容性
- 提供迁移指南和工具
- 逐步废弃旧接口
- 提供平滑的升级路径

### 风险控制

- 充分的测试覆盖
- 灰度发布策略
- 回滚机制
- 监控和告警

## 🎊 总结

通过参考Cache模块的优秀设计模式，Exceptions模块的重构将带来：

1. **统一的架构语言**: 与其他模块保持一致的设计模式
2. **企业级能力**: 配置管理、监控、多租户等企业级特性
3. **高度可扩展**: 策略模式支持灵活的功能扩展
4. **深度集成**: 与NestJS和Core模块的深度集成
5. **开发友好**: 完整的工具链和开发体验

这个重构方案将使Exceptions模块成为一个真正的**企业级异常管理平台**，为整个SAAS平台提供坚实的异常处理基础设施！

## 🎯 关键成功因素

### 1. 清晰的模块边界

**Core模块职责**：

- 提供错误处理的基础设施（`CoreErrorBus`）
- 定义核心接口和基础异常类
- 管理多租户上下文和监控基础设施

**Exceptions模块职责**：

- 实现具体的异常处理策略和逻辑
- 提供NestJS集成和用户友好的API
- 管理异常处理的配置和监控

### 2. 渐进式迁移策略

- **Phase 1**: 建立桥梁和接口适配
- **Phase 2**: 迁移具体功能实现
- **Phase 3**: 深度集成和优化
- **Phase 4**: 清理和文档完善

### 3. 向后兼容性保证

- 保持现有API的兼容性
- 提供平滑的升级路径
- 充分的测试覆盖和回滚机制

### 4. 性能和质量保证

- 异常处理延迟 < 10ms
- 内存占用 < 50MB
- 异常处理成功率 > 99.9%
- 代码覆盖率 > 90%

## 🚨 风险控制

### 技术风险

1. **循环依赖风险**：通过清晰的接口定义和依赖注入避免
2. **性能风险**：通过缓存和批量处理优化
3. **兼容性风险**：通过充分的测试和渐进式迁移控制

### 业务风险

1. **功能缺失风险**：通过详细的功能映射和测试用例控制
2. **用户体验风险**：通过向后兼容和平滑迁移控制
3. **运维风险**：通过监控和告警机制控制

## 🎊 最终愿景

重构完成后，我们将拥有：

1. **统一的异常处理架构**：Core模块提供基础设施，Exceptions模块提供具体实现
2. **清晰的模块边界**：每个模块职责明确，依赖关系清晰
3. **企业级的能力**：配置管理、监控、多租户、策略模式等
4. **优秀的开发体验**：完整的工具链、装饰器、类型安全
5. **高性能和可靠性**：优化的性能指标和可靠性保证

这个重构方案将使Exceptions模块成为一个真正的**企业级异常管理平台**，为整个SAAS平台提供坚实的异常处理基础设施！

---

**文档版本**: v1.0.0  
**重构版本**: @aiofix/exceptions@2.0.0  
**预计完成时间**: 8周  
**状态**: 📋 设计完成，待实施  
**核心亮点**: 🔄 Core模块边界划分 + 🏗️ Cache模块设计模式 + 🚀 企业级能力
