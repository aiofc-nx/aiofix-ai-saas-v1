# @aiofix/exceptions

企业级异常处理库，遵循RFC7807标准，为NestJS应用提供统一的异常处理解决方案。

## 特性

- ✅ **RFC7807标准**: 严格遵循Problem Details for HTTP APIs标准
- ✅ **类型安全**: 完整的TypeScript类型支持
- ✅ **NestJS集成**: 无缝集成NestJS异常过滤器
- ✅ **Swagger文档**: 自动生成API错误文档
- ✅ **结构化日志**: 提供详细的错误日志记录
- ✅ **模板支持**: 支持动态参数替换
- ✅ **零依赖**: 无外部依赖，轻量级设计

## 安装

```bash
pnpm add @aiofix/exceptions
```

## 快速开始

### 1. 注册异常过滤器

```typescript
import { NestFactory } from '@nestjs/core';
import { HttpAdapterHost } from '@nestjs/core';
import { AnyExceptionFilter, HttpExceptionFilter } from '@aiofix/exceptions';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const httpAdapterHost = app.get(HttpAdapterHost);

  // 注册异常过滤器（顺序很重要）
  app.useGlobalFilters(
    new AnyExceptionFilter(httpAdapterHost),
    new HttpExceptionFilter(httpAdapterHost),
  );

  await app.listen(3000);
}
```

### 2. 使用预定义异常

```typescript
import { Injectable } from '@nestjs/common';
import { ObjectNotFoundException, GeneralBadRequestException } from '@aiofix/exceptions';

@Injectable()
export class UserService {
  async findUser(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new ObjectNotFoundException('User', 'USER_NOT_FOUND');
    }
    return user;
  }

  async createUser(data: CreateUserDto) {
    const errors = await this.validateUser(data);
    if (errors.length > 0) {
      throw new GeneralBadRequestException(errors, 'VALIDATION_FAILED');
    }
    return this.userRepository.create(data);
  }
}
```

### 3. 创建自定义异常

```typescript
import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from '@aiofix/exceptions';

export class UserAlreadyExistsException extends AbstractHttpException<{email: string}> {
  constructor(email: string) {
    super(
      'User Already Exists',
      'A user with email {email} already exists',
      HttpStatus.CONFLICT,
      { email },
      'USER_ALREADY_EXISTS'
    );
  }
}
```

## 可用异常类

### 通用异常

- `GeneralBadRequestException` - 400 请求验证失败
- `GeneralUnauthorizedException` - 401 身份验证失败
- `GeneralForbiddenException` - 403 权限不足
- `GeneralNotFoundException` - 404 资源未找到
- `GeneralInternalServerException` - 500 内部服务器错误

### 特定异常

- `ObjectNotFoundException` - 特定对象未找到
- `ConflictEntityCreationException` - 实体创建冲突
- `OptimisticLockException` - 乐观锁冲突
- `InternalServiceUnavailableException` - 内部服务不可用
- `MissingConfigurationForFeatureException` - 功能配置缺失

## Swagger集成

使用提供的装饰器自动生成API文档：

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { ApiEntityNotFound, ApiBadRequest } from '@aiofix/exceptions';

@Controller('users')
export class UserController {
  @Get(':id')
  @ApiEntityNotFound('USER_NOT_FOUND')
  @ApiBadRequest('INVALID_USER_ID')
  async getUser(@Param('id') id: string) {
    return this.userService.findUser(id);
  }
}
```

## 错误响应格式

所有异常都会生成符合RFC7807标准的错误响应：

```json
{
  "type": "https://aiofix.ai/docs/errors",
  "title": "User Not Found",
  "detail": "The User you are looking for does not exist or you do not have access to it.",
  "status": 404,
  "instance": "req-12345",
  "errorCode": "USER_NOT_FOUND",
  "data": {
    "entityName": "User"
  }
}
```

## 开发

### 构建

```bash
nx build exceptions
```

### 测试

```bash
nx test exceptions
```

### Lint检查

```bash
nx lint exceptions
```

## 许可证

MIT
