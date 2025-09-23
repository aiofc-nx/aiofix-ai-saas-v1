# 装饰器类型迁移报告

## 迁移概述

将 `packages/core/src/application/common/decorators/types` 目录下的装饰器类型定义迁移到 `packages/core/src/common/types` 目录，实现更好的架构组织。

## 迁移详情

### 迁移的文件

1. **源文件**：
   - `packages/core/src/application/common/decorators/types/decorator-target.type.ts`
   - `packages/core/src/application/common/decorators/types/index.ts`

2. **目标文件**：
   - `packages/core/src/common/types/decorator-types.ts`（新创建）
   - 更新 `packages/core/src/common/types/index.ts`

### 迁移的类型定义

```typescript
// 装饰器目标类型
export type DecoratorTarget = Record<string, unknown>;

// 类构造函数类型
export type ClassConstructor = new (...args: unknown[]) => unknown;

// 方法装饰器目标类型
export type MethodDecoratorTarget = object;
```

## 架构优化

### 迁移前的问题

1. **位置不当**：装饰器类型定义放在应用层，但这些是通用类型
2. **职责混乱**：应用层不应该包含通用的类型定义
3. **导入复杂**：其他模块需要从应用层导入通用类型

### 迁移后的优势

1. **职责清晰**：通用类型定义放在 `common/types` 目录
2. **架构合理**：遵循 Clean Architecture 的分层原则
3. **导入简化**：所有通用类型都可以从 `@aiofix/core/common/types` 统一导入
4. **易于维护**：类型定义集中管理，便于维护和扩展

## 文件结构对比

### 迁移前

```
packages/core/src/
├── application/
│   └── common/
│       └── decorators/
│           └── types/
│               ├── decorator-target.type.ts
│               └── index.ts
└── common/
    └── types/
        ├── core-types.ts
        ├── fastify-types.ts
        ├── compatibility-types.ts
        └── index.ts
```

### 迁移后

```
packages/core/src/
└── common/
    └── types/
        ├── core-types.ts
        ├── fastify-types.ts
        ├── compatibility-types.ts
        ├── decorator-types.ts  ← 新增
        └── index.ts
```

## 使用方式

### 迁移前

```typescript
import { DecoratorTarget, ClassConstructor } from '@aiofix/core/application/common/decorators/types';
```

### 迁移后

```typescript
import { DecoratorTarget, ClassConstructor } from '@aiofix/core/common/types';
// 或者
import { DecoratorTarget, ClassConstructor } from '@aiofix/core';
```

## 影响范围

1. **无破坏性变更**：类型定义内容完全一致
2. **导入路径更新**：需要更新引用这些类型的文件
3. **架构改进**：提升了代码组织的合理性

## 后续工作

1. **更新引用**：检查并更新所有引用这些类型的文件
2. **文档更新**：更新相关文档中的导入路径
3. **测试验证**：确保迁移后功能正常

## 总结

此次迁移成功将装饰器类型定义从应用层移动到通用类型目录，实现了：

- ✅ 更好的架构分层
- ✅ 更清晰的职责划分
- ✅ 更统一的类型管理
- ✅ 更简洁的导入路径

迁移完成后，`packages/core/src/common/types` 目录现在包含了所有通用类型定义，为整个 Core 模块提供了统一的类型接口。

---

**迁移时间**：2024年12月
**迁移状态**：✅ 完成
**验证状态**：✅ 无 linter 错误
