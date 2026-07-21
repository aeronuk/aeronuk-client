import { expect, test } from '@playwright/test';

test.describe('flight search smoke test', () => {
  test('redirects from / to /flights and renders the search form', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/flights$/);
    await expect(page.getByRole('heading', { name: 'Where would you like to go today?' })).toBeVisible();
  });

  test('/flights loads directly and lets the origin airport be chosen', async ({ page }) => {
    await page.goto('/flights');

    await expect(page.getByRole('heading', { name: 'Where would you like to go today?' })).toBeVisible();
    await expect(page.getByLabel('Origin airport')).toBeVisible();
    await expect(page.getByRole('button', { name: /search flights/i })).toBeVisible();
  });
});
