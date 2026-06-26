import { UserRole } from '@prisma/client';

export type AuthMethod = 'jwt' | 'api_key';

export interface AuthUser {
  userId: string;
  tenantId: string;
  email: string;
  role: UserRole;
  authMethod?: AuthMethod;
  /** Set when authenticated via project API key. */
  projectId?: string;
  apiKeyId?: string;
}

export interface JwtPayload {
  sub: string;
  tenantId: string;
  email: string;
  role: UserRole;
}
