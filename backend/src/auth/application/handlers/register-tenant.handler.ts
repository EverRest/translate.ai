import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { slugify } from '../../../shared/utils/string.utils';
import { PasswordService } from '../../infrastructure/password.service';
import { toAuthUser, TokenService } from '../../infrastructure/token.service';
import { RegisterTenantCommand } from '../commands/register-tenant.command';

@Injectable()
@CommandHandler(RegisterTenantCommand)
export class RegisterTenantHandler implements ICommandHandler<RegisterTenantCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
  ) {}

  async execute(command: RegisterTenantCommand) {
    const baseSlug = slugify(command.tenantName) || 'tenant';
    let slug = baseSlug;
    let suffix = 0;

    while (await this.prisma.tenant.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const passwordHash = await this.passwords.hash(command.password);

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: command.tenantName,
          slug,
          subscriptionSince: new Date(),
        },
      });
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: command.email.toLowerCase(),
          password: passwordHash,
          role: UserRole.admin,
        },
      });
      return { tenant, user };
    });

    const authUser = toAuthUser(result.user);
    const token = this.tokens.sign(authUser);

    return {
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
      user: {
        id: authUser.userId,
        email: authUser.email,
        role: authUser.role,
      },
      ...token,
    };
  }
}
