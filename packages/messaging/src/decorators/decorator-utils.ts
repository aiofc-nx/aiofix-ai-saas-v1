/**
 * 装饰器工具函数
 *
 * @description 提供装饰器元数据的查询和操作工具函数
 * 支持运行时反射和装饰器信息的获取
 *
 * ## 核心功能
 *
 * ### 🔍 **元数据查询**
 * - 获取装饰器元数据信息
 * - 检查类或方法是否应用了特定装饰器
 * - 支持复杂的查询条件
 *
 * ### 🎯 **类型检查**
 * - 运行时类型检查和验证
 * - 装饰器类型的识别
 * - 类型安全的元数据访问
 *
 * ### 🛠️ **实用工具**
 * - 装饰器信息的格式化和展示
 * - 批量操作和筛选功能
 * - 调试和诊断工具
 *
 * @example
 * ```typescript
 * import { getHandlerMetadata, isMessageHandler } from '@aiofix/messaging';
 *
 * // 检查类是否为消息处理器
 * if (isMessageHandler(UserCreatedHandler)) {
 *   const metadata = getHandlerMetadata(UserCreatedHandler);
 *   console.log('处理器主题:', metadata.target);
 * }
 *
 * // 获取订阅方法的元数据
 * const subscribeMetadata = getSubscribeMetadata(handler, 'onUserCreated');
 * ```
 *
 * @since 1.0.0
 */

import { IMessageHandlerMetadata } from './messaging-decorators.interface';

/**
 * 获取类的处理器元数据
 *
 * @param target - 目标类或类实例
 * @returns 处理器元数据，如果不存在则返回undefined
 */
export function getHandlerMetadata(
  target: object | (new (...args: unknown[]) => unknown),
): IMessageHandlerMetadata | undefined {
  // 如果是实例，获取其构造函数
  const targetClass =
    typeof target === 'function' ? target : target.constructor;

  return Reflect.getMetadata('messaging:handler', targetClass);
}

/**
 * 检查类是否为消息处理器
 *
 * @param target - 目标类或类实例
 * @returns 是否为消息处理器
 */
export function isMessageHandler(
  target: object | (new (...args: unknown[]) => unknown),
): boolean {
  const metadata = getHandlerMetadata(target);
  return metadata?.handlerType === 'message';
}

/**
 * 检查类是否为事件处理器
 *
 * @param target - 目标类或类实例
 * @returns 是否为事件处理器
 */
export function isEventHandler(
  target: object | (new (...args: unknown[]) => unknown),
): boolean {
  const metadata = getHandlerMetadata(target);
  return metadata?.handlerType === 'event';
}

/**
 * 检查类是否为队列处理器
 *
 * @param target - 目标类或类实例
 * @returns 是否为队列处理器
 */
export function isQueueProcessor(
  target: object | (new (...args: unknown[]) => unknown),
): boolean {
  const metadata = getHandlerMetadata(target);
  return metadata?.handlerType === 'queue';
}

/**
 * 检查类是否为Saga处理器
 *
 * @param target - 目标类或类实例
 * @returns 是否为Saga处理器
 */
export function isSaga(
  target: object | (new (...args: unknown[]) => unknown),
): boolean {
  const metadata = getHandlerMetadata(target);
  return metadata?.handlerType === 'saga';
}

/**
 * 检查类是否应用了任何消息处理器装饰器
 *
 * @param target - 目标类或类实例
 * @returns 是否应用了处理器装饰器
 */
export function isAnyHandler(
  target: object | (new (...args: unknown[]) => unknown),
): boolean {
  return getHandlerMetadata(target) !== undefined;
}

/**
 * 获取方法的订阅元数据
 *
 * @param target - 目标类实例或原型
 * @param methodName - 方法名称
 * @returns 订阅元数据，如果不存在则返回undefined
 */
export function getSubscribeMetadata(
  target: object,
  methodName: string | symbol,
): IMessageHandlerMetadata | undefined {
  return Reflect.getMetadata('messaging:subscribe', target, methodName);
}

/**
 * 检查方法是否应用了订阅装饰器
 *
 * @param target - 目标类实例或原型
 * @param methodName - 方法名称
 * @returns 是否应用了订阅装饰器
 */
export function isSubscribeMethod(
  target: object,
  methodName: string | symbol,
): boolean {
  return getSubscribeMetadata(target, methodName) !== undefined;
}

/**
 * 获取类的所有订阅方法元数据
 *
 * @param target - 目标类或类实例
 * @returns 订阅方法元数据数组
 */
export function getAllSubscribeMethods(
  target: object | (new (...args: unknown[]) => unknown),
): Array<{ methodName: string; metadata: IMessageHandlerMetadata }> {
  // 如果是类，创建实例来获取原型
  const prototype =
    typeof target === 'function'
      ? target.prototype
      : Object.getPrototypeOf(target);

  const subscribeMethods: Array<{
    methodName: string;
    metadata: IMessageHandlerMetadata;
  }> = [];

  // 获取所有属性名
  const propertyNames = Object.getOwnPropertyNames(prototype);

  for (const propertyName of propertyNames) {
    if (propertyName === 'constructor') continue;

    const metadata = getSubscribeMetadata(prototype, propertyName);
    if (metadata) {
      subscribeMethods.push({
        methodName: propertyName,
        metadata,
      });
    }
  }

  return subscribeMethods;
}

/**
 * 获取处理器处理的主题列表
 *
 * @param target - 目标类或类实例
 * @returns 主题列表
 */
export function getHandlerTopics(
  target: object | (new (...args: unknown[]) => unknown),
): string[] {
  const metadata = getHandlerMetadata(target);
  if (!metadata) {
    return [];
  }

  return Array.isArray(metadata.target) ? metadata.target : [metadata.target];
}

/**
 * 获取处理器的配置选项
 *
 * @param target - 目标类或类实例
 * @returns 配置选项
 */
export function getHandlerOptions(
  target: object | (new (...args: unknown[]) => unknown),
): unknown {
  const metadata = getHandlerMetadata(target);
  return metadata?.options;
}

/**
 * 检查处理器是否处理指定主题
 *
 * @param target - 目标类或类实例
 * @param topic - 主题名称
 * @returns 是否处理指定主题
 */
export function handlesTopicPattern(
  target: object | (new (...args: unknown[]) => unknown),
  topic: string,
): boolean {
  const topics = getHandlerTopics(target);

  for (const handlerTopic of topics) {
    // 支持通配符匹配
    if (matchTopic(handlerTopic, topic)) {
      return true;
    }
  }

  return false;
}

/**
 * 主题匹配函数（支持简单的通配符）
 *
 * @param pattern - 模式字符串，支持 * 通配符
 * @param topic - 要匹配的主题
 * @returns 是否匹配
 */
function matchTopic(pattern: string, topic: string): boolean {
  // 精确匹配
  if (pattern === topic) {
    return true;
  }

  // 通配符匹配
  if (pattern.includes('*')) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(topic);
  }

  return false;
}

/**
 * 格式化处理器信息为可读字符串
 *
 * @param target - 目标类或类实例
 * @returns 格式化的处理器信息
 */
export function formatHandlerInfo(
  target: object | (new (...args: unknown[]) => unknown),
): string {
  const metadata = getHandlerMetadata(target);
  if (!metadata) {
    return '未应用消息处理器装饰器';
  }

  const className = metadata.handlerClass.name;
  const handlerType = metadata.handlerType;
  const targets = Array.isArray(metadata.target)
    ? metadata.target.join(', ')
    : metadata.target;

  return `${className} (${handlerType}): ${targets}`;
}

/**
 * 获取处理器的详细信息
 *
 * @param target - 目标类或类实例
 * @returns 详细信息对象
 */
export function getHandlerDetails(
  target: object | (new (...args: unknown[]) => unknown),
): {
  className: string;
  handlerType: string;
  topics: string[];
  options: unknown;
  subscribeMethods: Array<{ methodName: string; topic: string }>;
  createdAt: Date;
} | null {
  const metadata = getHandlerMetadata(target);
  if (!metadata) {
    return null;
  }

  const subscribeMethods = getAllSubscribeMethods(target);

  return {
    className: metadata.handlerClass.name,
    handlerType: metadata.handlerType,
    topics: getHandlerTopics(target),
    options: metadata.options,
    subscribeMethods: subscribeMethods.map((sm) => ({
      methodName: sm.methodName,
      topic: Array.isArray(sm.metadata.target)
        ? sm.metadata.target[0]
        : sm.metadata.target,
    })),
    createdAt: metadata.createdAt,
  };
}

/**
 * 验证处理器类的完整性
 *
 * @param target - 目标类
 * @returns 验证结果
 */
export function validateHandler(target: new (...args: unknown[]) => unknown): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const metadata = getHandlerMetadata(target);
  if (!metadata) {
    errors.push('类未应用消息处理器装饰器');
    return { valid: false, errors, warnings };
  }

  // 检查是否有handle方法（对于类级装饰器）
  if (['message', 'event', 'queue', 'saga'].includes(metadata.handlerType)) {
    const prototype = target.prototype;
    if (!prototype.handle || typeof prototype.handle !== 'function') {
      errors.push(`${metadata.handlerType}处理器必须实现handle方法`);
    }
  }

  // 检查订阅方法
  const subscribeMethods = getAllSubscribeMethods(target);
  if (subscribeMethods.length === 0 && metadata.handlerType === 'event') {
    warnings.push('事件处理器没有订阅方法，可能需要添加@Subscribe装饰器');
  }

  // 检查配置的合理性
  if (metadata.options) {
    // 这里可以添加更多的配置验证逻辑
    if (
      'maxRetries' in metadata.options &&
      typeof metadata.options.maxRetries === 'number' &&
      metadata.options.maxRetries < 0
    ) {
      errors.push('最大重试次数不能为负数');
    }

    if (
      'timeout' in metadata.options &&
      typeof metadata.options.timeout === 'number' &&
      metadata.options.timeout <= 0
    ) {
      errors.push('超时时间必须大于0');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 调试工具：打印处理器的详细信息
 *
 * @param target - 目标类或类实例
 */
export function debugHandler(
  target: object | (new (...args: unknown[]) => unknown),
): void {
  const details = getHandlerDetails(target);
  if (!details) {
    // eslint-disable-next-line no-console
    console.log('目标对象未应用消息处理器装饰器');
    return;
  }

  // eslint-disable-next-line no-console
  console.group(`处理器详情: ${details.className}`);
  // eslint-disable-next-line no-console
  console.log('类型:', details.handlerType);
  // eslint-disable-next-line no-console
  console.log('主题:', details.topics);
  // eslint-disable-next-line no-console
  console.log('配置:', details.options);
  // eslint-disable-next-line no-console
  console.log('订阅方法:', details.subscribeMethods);
  // eslint-disable-next-line no-console
  console.log('创建时间:', details.createdAt);
  // eslint-disable-next-line no-console
  console.groupEnd();
}
