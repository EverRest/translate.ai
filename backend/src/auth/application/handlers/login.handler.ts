import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { PasswordService } from '../../infrastructure/password.service';
import { toAuthUser, TokenService } from '../../infrastructure/token.service';
import { LoginCommand } from '../commands/login.command';

@Injectable()
@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
  ) {}

  async execute(command: LoginCommand) {
    const user = await this.prisma.user.findFirst({
      where: { email: command.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.passwords.verify(user.password, command.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const authUser = toAuthUser(user);
    return this.tokens.sign(authUser);
  }
}
