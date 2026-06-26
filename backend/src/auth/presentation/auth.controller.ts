import { Body, Controller, Get, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/auth/decorators/current-user.decorator';
import { Public } from '../../shared/auth/decorators/public.decorator';
import type { AuthUser } from '../../shared/auth/auth-user.interface';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { successResponse } from '../../shared/presentation/api-response';
import { LoginCommand } from '../application/commands/login.command';
import { RegisterTenantCommand } from '../application/commands/register-tenant.command';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register tenant and admin user' })
  async register(@Body() dto: RegisterDto) {
    const data = await this.commandBus.execute(
      new RegisterTenantCommand(dto.tenantName, dto.email, dto.password),
    );
    return successResponse(data);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto) {
    const data = await this.commandBus.execute(
      new LoginCommand(dto.email, dto.password),
    );
    return successResponse(data);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user' })
  async me(@CurrentUser() user: AuthUser) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { id: true, name: true, slug: true },
    });

    return successResponse({
      id: user.userId,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tenant,
    });
  }
}
