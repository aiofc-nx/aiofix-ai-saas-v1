/**
 * 分布式事务功能导出
 *
 * @description 导出Database模块的分布式事务和Saga功能
 * 包括分布式事务管理器、Saga实现、错误处理等
 *
 * @since 1.0.0
 */

// 分布式事务管理器
export {
  DistributedTransactionManager,
  createDistributedTransactionManager,
  DistributedTransactionError,
  SagaExecutionError,
} from './distributed-transaction-manager';

export type {
  IDistributedOperation,
  IDistributedTransactionOptions,
  IDistributedTransactionResult,
  ISagaDefinition,
  ISagaStep,
  ISagaResult,
} from './distributed-transaction-manager';

// Saga实现
export {
  BaseSaga,
  BaseSagaStep,
  ECommerceOrderSaga,
  UserRegistrationSaga,
  DistributedOperation,
  SagaStepStatus,
  SagaStatus,
  createDistributedOperation,
  createSagaStep,
  createECommerceOrderSaga,
  createUserRegistrationSaga,
} from './saga';
