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

  test('clicking anywhere in the Depart box focuses the date input, including over the hint text', async ({ page }) => {
    await page.goto('/flights');

    const dateInput = page.getByLabel('Departure date');
    const box = await dateInput.locator('xpath=..').boundingBox();
    if (!box) throw new Error('Depart field box not found');

    // Click near the bottom-left of the box, where the "Pick a date" hint
    // text and the box's own padding live -- previously dead space that
    // didn't respond to clicks.
    await page.mouse.click(box.x + 10, box.y + box.height - 8);

    await expect(dateInput).toBeFocused();
  });
});
