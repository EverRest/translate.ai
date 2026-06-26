const apiBase = process.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export type RegisteredUser = {
  email: string;
  password: string;
  tenantName: string;
  accessToken: string;
};

export async function registerUser(
  suffix = Date.now(),
): Promise<RegisteredUser> {
  const tenantName = `E2E Org ${suffix}`;
  const email = `e2e-${suffix}@example.com`;
  const password = 'password123';

  const response = await fetch(`${apiBase}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantName, email, password }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(body.message ?? `Register failed: ${response.status}`);
  }

  const body = (await response.json()) as {
    data: { accessToken: string };
  };

  return {
    email,
    password,
    tenantName,
    accessToken: body.data.accessToken,
  };
}

export async function seedAuthStorage(page: import('@playwright/test').Page, user: RegisteredUser) {
  const meResponse = await fetch(`${apiBase}/auth/me`, {
    headers: { Authorization: `Bearer ${user.accessToken}` },
  });

  if (!meResponse.ok) {
    throw new Error(`Failed to load profile: ${meResponse.status}`);
  }

  const meBody = (await meResponse.json()) as { data: Record<string, unknown> };

  await page.addInitScript(
    ({ storageKey, accessToken, user }) => {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ state: { accessToken, user }, version: 0 }),
      );
    },
    {
      storageKey: 'translate-ai-auth',
      accessToken: user.accessToken,
      user: meBody.data,
    },
  );
}
