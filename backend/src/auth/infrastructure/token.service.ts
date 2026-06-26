import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { AuthUser, JwtPayload } from '../../shared/auth/auth-user.interface';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  sign(user: AuthUser): { accessToken: string; expiresIn: number } {
    const payload: JwtPayload = {
      sub: user.userId,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };
    const expiresIn = this.config.get<number>('JWT_EXPIRES_IN', 3600);
    const accessToken = this.jwtService.sign(payload, { expiresIn });
    return { accessToken, expiresIn };
  }

  verify(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

export function toAuthUser(user: {
  id: string;
  tenantId: string;
  email: string;
  role: UserRole;
}): AuthUser {
  return {
    userId: user.id,
    tenantId: user.tenantId,
    email: user.email,
    role: user.role,
  };
}
