import { expect, test } from '@playwright/test';

test.describe('Auth', () => {
  test('registers a new account and lands on the dashboard', async ({ page }) => {
    const suffix = Date.now();
    const email = `e2e-register-${suffix}@example.com`;

    await page.goto('/register');
    await page.getByLabel('Organization name').fill(`E2E Org ${suffix}`);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();

    await page.waitForURL('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText(`Overview for ${email}`)).toBeVisible();
  });

  test('logs in with existing credentials', async ({ page, request }) => {
    const suffix = Date.now();
    const email = `e2e-login-${suffix}@example.com`;
    const password = 'password123';

    const registerResponse = await request.post(
      `${process.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'}/auth/register`,
      {
        data: {
          tenantName: `E2E Login Org ${suffix}`,
          email,
          password,
        },
      },
    );
    expect(registerResponse.ok()).toBeTruthy();

    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.waitForURL('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});
