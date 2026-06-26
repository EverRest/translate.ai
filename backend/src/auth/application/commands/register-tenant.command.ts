export class RegisterTenantCommand {
  constructor(
    public readonly tenantName: string,
    public readonly email: string,
    public readonly password: string,
  ) {}
}
