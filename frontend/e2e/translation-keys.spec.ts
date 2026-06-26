import { expect, test } from '@playwright/test';
import { registerUser, seedAuthStorage } from './helpers/auth';

test.describe('Translation keys', () => {
  test('creates a translation key for a project', async ({ page, request }) => {
    const user = await registerUser();
    await seedAuthStorage(page, user);

    const projectName = `Keys Project ${Date.now()}`;
    const apiBase = process.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

    const createProjectResponse = await request.post(`${apiBase}/projects`, {
      headers: { Authorization: `Bearer ${user.accessToken}` },
      data: { name: projectName, description: 'E2E keys project' },
    });
    expect(createProjectResponse.ok()).toBeTruthy();

    const projectBody = (await createProjectResponse.json()) as {
      data: { id: string };
    };
    const projectId = projectBody.data.id;

    const keyName = `e2e.key.${Date.now()}`;
    const sourceText = 'Hello from E2E';

    await page.goto(`/projects/${projectId}/keys`);
    await expect(
      page.getByRole('heading', { name: 'Translation keys' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Add key' }).first().click();
    await page.getByLabel('Key').fill(keyName);
    await page.getByLabel('Source text').fill(sourceText);
    await page
      .locator('form')
      .filter({ has: page.getByLabel('Key') })
      .getByRole('button', { name: 'Add key' })
      .click();

    await expect(page.getByText(keyName)).toBeVisible();
    await expect(page.getByText(sourceText)).toBeVisible();
  });
});
