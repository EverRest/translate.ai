export type TenantSummary = {
  id: string;
  name: string;
  slug: string;
};

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  tenantId: string;
  tenant?: TenantSummary | null;
};

export type AuthSession = {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  tenantName: string;
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  expiresIn: number;
};

export type RegisterResponse = LoginResponse & {
  tenant: { id: string; name: string; slug: string };
  user: { id: string; email: string; role: string };
};

export type MeResponse = AuthUser;
