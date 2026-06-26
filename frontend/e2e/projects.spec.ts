import { expect, test } from '@playwright/test';
import { registerUser, seedAuthStorage } from './helpers/auth';

test.describe('Projects', () => {
  test('creates a project from the projects page', async ({ page }) => {
    const user = await registerUser();
    await seedAuthStorage(page, user);

    const projectName = `E2E Project ${Date.now()}`;

    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: 'Projects', level: 1 })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'New project' }).click();
    await page.getByLabel('Name').fill(projectName);
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(
      page.getByRole('heading', { name: projectName, level: 1 }),
    ).toBeVisible();
  });
});
