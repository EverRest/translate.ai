import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LoginHandler } from './application/handlers/login.handler';
import { RegisterTenantHandler } from './application/handlers/register-tenant.handler';
import { ApiKeyAuthService } from './infrastructure/api-key-auth.service';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { PasswordService } from './infrastructure/password.service';
import { TokenService } from './infrastructure/token.service';
import { AuthController } from './presentation/auth.controller';

@Module({
  imports: [
    CqrsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<number>('JWT_EXPIRES_IN', 3600),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    PasswordService,
    TokenService,
    JwtStrategy,
    ApiKeyAuthService,
    RegisterTenantHandler,
    LoginHandler,
  ],
  exports: [TokenService, PasswordService, ApiKeyAuthService],
})
export class AuthModule {}
