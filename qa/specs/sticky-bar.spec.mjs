import { test, expect } from '@playwright/test';
import { byLabel } from '../viewports.mjs';
import { route } from '../routes.mjs';
import { openPage } from '../lib.mjs';

test('sticky-bar hidden on desktop', async ({ browser }) => {
  const r = route('product');
  test.skip(!r, 'no product published — sticky bar NOT VERIFIED');
  const { context, page } = await openPage(browser, byLabel('desktop'), r.path);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(500);
  await expect(page.locator('wf-sticky-buy')).toBeHidden();
  await context.close();
});

test('sticky-bar phone: hidden while the main button is visible, inert when hidden', async ({ browser }) => {
  const r = route('product');
  test.skip(!r, 'no product published — sticky bar NOT VERIFIED');
  const { context, page } = await openPage(browser, byLabel('iphone'), r.path);
  const bar = page.locator('wf-sticky-buy');
  await page.locator('[id^="ProductSubmitButton-"]').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await expect(bar).not.toHaveClass(/is-visible/);
  expect(await bar.getAttribute('aria-hidden')).toBe('true');
  expect(await bar.evaluate((el) => el.inert)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(bar).toHaveClass(/is-visible/, { timeout: 5000 });
  expect(await bar.getAttribute('aria-hidden')).toBe('false');
  await context.close();
});
