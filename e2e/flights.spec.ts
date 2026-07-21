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

  test('clicking anywhere in the Depart box actually opens the native date picker', async ({ page }) => {
    // Chrome only opens the date picker dropdown for clicks on the input's
    // own value/calendar-icon sub-widget, not for clicks anywhere in its
    // (stretched) box -- so focus alone (previous test) doesn't prove the
    // picker opens. The picker itself is a native, non-DOM popup that isn't
    // otherwise inspectable, so spy on HTMLInputElement.showPicker() to
    // confirm the click handler actually requests it.
    await page.addInitScript(() => {
      (window as unknown as { __showPickerCalls: number }).__showPickerCalls = 0;
      const original = HTMLInputElement.prototype.showPicker;
      if (original) {
        HTMLInputElement.prototype.showPicker = function (this: HTMLInputElement, ...args) {
          (window as unknown as { __showPickerCalls: number }).__showPickerCalls++;
          return original.apply(this, args);
        };
      }
    });

    await page.goto('/flights');

    const dateInput = page.getByLabel('Departure date');
    const box = await dateInput.locator('xpath=..').boundingBox();
    if (!box) throw new Error('Depart field box not found');

    await page.mouse.click(box.x + 10, box.y + box.height - 8);

    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __showPickerCalls: number }).__showPickerCalls))
      .toBeGreaterThan(0);
  });
});
