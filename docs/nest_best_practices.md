If you're building a **production-grade NestJS API**, the biggest gains come from consistency, architecture, observability, security, and scalability—not from Nest-specific decorators.

Below are **50 NestJS best practices** organized by category, with examples.

---

# 1. Use Feature-Based Module Structure

❌ Bad

```text
controllers/
services/
repositories/
```

✅ Good

```text
src/
├── users/
│ ├── users.module.ts
│ ├── users.controller.ts
│ ├── users.service.ts
│ └── dto/
├── auth/
├── payments/
```

```ts
@Module({
controllers: [UsersController],
providers: [UsersService],
})
export class UsersModule {}
```

---

# 2. Follow Clean Architecture

Separate:

```text
Domain
Application
Infrastructure
Presentation
```

Example:

```text
users/
├── domain/
├── application/
├── infrastructure/
└── presentation/
```

---

# 3. Keep Controllers Thin

❌

```ts
@Post()
async create() {
// 100 lines of business logic
}
```

✅

```ts
@Post()
create(@Body() dto: CreateUserDto) {
return this.createUserUseCase.execute(dto);
}
```

---

# 4. Put Business Logic in Services/Use Cases

```ts
@Injectable()
export class CreateUserUseCase {
execute(dto: CreateUserDto) {
return this.userRepository.create(dto);
}
}
```

---

# 5. Use Dependency Injection Everywhere

```ts
constructor(
private readonly userService: UserService,
) {}
```

Never:

```ts
const service = new UserService();
```

---

# 6. Prefer Interfaces/Tokens

```ts
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
```

```ts
providers: [
{
provide: USER_REPOSITORY,
useClass: UserRepository,
}
]
```

---

# 7. Use DTOs for Input

```ts
export class CreateUserDto {
email: string;
}
```

Never expose entities directly.

---

# 8. Validate Every Request

```ts
export class CreateUserDto {
@IsEmail()
email: string;
}
```

---

# 9. Enable Global ValidationPipe

```ts
app.useGlobalPipes(
new ValidationPipe({
whitelist: true,
transform: true,
forbidNonWhitelisted: true,
}),
);
```

---

# 10. Use Transformation

```ts
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {}
```

---

# 11. Never Return ORM Models Directly

❌

```ts
return user;
```

✅

```ts
return UserResponseDto.from(user);
```

---

# 12. Use Response DTOs

```ts
export class UserResponseDto {
id: number;
email: string;
}
```

Hide:

```ts
password
refreshToken
internalFlags
```

---

# 13. Global Exception Filter

```ts
@Catch()
export class GlobalExceptionFilter
```

Standardize errors.

```json
{
"success": false,
"message": "Validation failed"
}
```

---

# 14. Create Domain Exceptions

```ts
throw new UserAlreadyExistsException();
```

instead of

```ts
throw new BadRequestException();
```

---

# 15. Use Custom Pipes

```ts
@Param('uuid', ParseUUIDPipe)
```

Custom:

```ts
PhonePipe
CurrencyPipe
```

---

# 16. Use Interceptors

Example:

```ts
LoggingInterceptor
```

```ts
intercept(context, next) {
return next.handle();
}
```

---

# 17. Add Request Logging

Use interceptor or middleware.

```ts
GET /users 23ms
```

---

# 18. Correlation IDs

Generate:

```ts
x-request-id
```

for tracing.

```ts
req.id
```

---

# 19. Use Structured Logging

Avoid:

```ts
console.log()
```

Use:

```ts
pino
```

or

```ts
winston
```

Example:

```ts
logger.info({
userId,
action: 'create-user'
});
```

---

# 20. Centralize Configuration

```ts
ConfigModule.forRoot({
isGlobal: true,
});
```

---

# 21. Validate Environment Variables

```ts
Joi.object({
DB_HOST: Joi.string().required(),
});
```

---

# 22. Never Read process.env Directly

❌

```ts
process.env.DB_HOST
```

✅

```ts
configService.get('DB_HOST')
```

---

# 23. Use Config Factories

```ts
export default () => ({
jwt: {
secret: process.env.JWT_SECRET,
}
});
```

---

# 24. Use Repository Pattern

```ts
interface UserRepository {
create(dto: CreateUserDto): Promise<User>;
 }
 ```

 ---

 # 25. Hide ORM Behind Repositories

 Service should not know:

 ```ts
 Prisma
 TypeORM
 Sequelize
 ```

 ---

 # 26. Prefer Prisma for New Projects

 Prisma ORM provides:

 * Type safety
 * Better migrations
 * Better DX

 ---

 # 27. Avoid Fat Services

 Split:

 ```ts
 CreateUserUseCase
 DeleteUserUseCase
 UpdateUserUseCase
 ```

 ---

 # 28. Use CQRS for Complex Domains

 Use NestJS CQRS

 ```ts
 Command
 Handler
 Query
 Handler
 ```

 ---

 # 29. Use Events

 ```ts
 eventBus.publish(
 new UserCreatedEvent()
 );
 ```

 ---

 # 30. Implement Outbox Pattern

 For reliable messaging.

 ```text
 DB Transaction
 → Outbox
 → Kafka/RabbitMQ
 ```

 ---

 # 31. Use Sagas for Distributed Transactions

 Example:

 ```text
 Create Order
 → Reserve Funds
 → Confirm Order
 ```

 Compensations:

 ```text
 Refund Funds
 Cancel Order
 ```

 ---

 # 32. Use Async Queues

 For:

 * Emails
 * Reports
 * Notifications

 Example:

 ```ts
 BullMQ
 ```

 ---

 # 33. Never Send Emails in Request Thread

 ❌

 ```ts
 await sendEmail();
 ```

 ✅

 ```ts
 await queue.add();
 ```

 ---

 # 34. Rate Limit APIs

 ```ts
 ThrottlerModule.forRoot()
 ```

 Example:

 ```ts
 10 req/sec
 ```

 ---

 # 35. Use Helmet

 ```ts
 app.use(helmet());
 ```

 ---

 # 36. Configure CORS Properly

 ```ts
 app.enableCors({
 origin: ['https://app.com'],
 });
 ```

 Avoid:

 ```ts
 origin: '*'
 ```

 ---

 # 37. Hash Passwords Properly

 Use:

 ```ts
 argon2
 ```

 or

 ```ts
 bcrypt
 ```

 ```ts
 await argon.hash(password);
 ```

 ---

 # 38. Store Refresh Tokens Hashed

 Never plain text.

 ---

 # 39. Use JWT Rotation

 ```text
 Access Token
 Refresh Token
 ```

 Rotate refresh token each login.

 ---

 # 40. Implement Authorization Guards

 ```ts
 @UseGuards(JwtAuthGuard)
 ```

 ---

 # 41. Add RBAC

 ```ts
 @Roles('admin')
 ```

 Custom guard:

 ```ts
 RolesGuard
 ```

 ---

 # 42. Version Your API

 ```ts
 app.enableVersioning({
 type: VersioningType.URI,
 });
 ```

 Example:

 ```text
 /v1/users
 /v2/users
 ```

 ---

 # 43. Use Swagger

 Official package:

 ```ts
 SwaggerModule.setup()
 ```

 Generates docs automatically.

 ---

 # 44. Write E2E Tests

 ```ts
 describe('Users')
 ```

 Use:

 ```ts
 supertest
 ```

 ---

 # 45. Test Use Cases Separately

 ```ts
 describe(CreateUserUseCase)
 ```

 Mock repositories.

 ---

 # 46. Add Health Checks

 Use Terminus

 ```ts
 /health
 ```

 Checks:

 * DB
 * Redis
 * Queue

 ---

 # 47. Add Metrics

 Use:

 ```ts
 Prometheus
 ```

 Metrics:

 ```text
 request_count
 request_duration
 error_count
 ```

 ---

 # 48. Add Distributed Tracing

 Use:

 ```ts
 OpenTelemetry
 ```

 Track:

 ```text
 API
 DB
 Redis
 Kafka
 ```

 ---

 # 49. Graceful Shutdown

 ```ts
 app.enableShutdownHooks();
 ```

 Handle:

 ```ts
 SIGTERM
 ```

 Close:

 ```ts
 DB
 Redis
 Queue
 ```

 ---

 # 50. Keep NestJS Modules Independent

 Bad:

 ```text
 UsersModule
 ↔ PaymentsModule
 ```

 Good:

 ```text
 UsersModule
 PaymentsModule
 OrdersModule
 ```

 Communicate through:

 ```ts
 Events
 Commands
 Interfaces
 ```

 ---

 # Recommended Production Stack

 For a modern enterprise NestJS API:

 ```text
 NestJS
 Prisma
 PostgreSQL
 Redis
 BullMQ
 JWT + Refresh Tokens
 Swagger
 OpenTelemetry
 Prometheus
 Pino
 CQRS
 Outbox Pattern
 Saga Pattern
 Docker
 Kubernetes
 ```

 A particularly robust architecture for large systems is:

 ```text
 Controller
 ↓
 DTO
 ↓
 Command / Query
 ↓
 Use Case
 ↓
 Repository Interface
 ↓
 Prisma Repository
 ↓
 PostgreSQL

 Events
 ↓
 Outbox
 ↓
 Kafka/RabbitMQ
 ```

 This structure scales well from a small API to a microservice ecosystem and aligns with DDD, CQRS, Saga, and Outbox patterns.
