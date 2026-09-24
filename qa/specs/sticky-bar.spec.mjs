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

test('sticky-bar phone: real add to cart through the bar', async ({ browser }) => {
  const r = route('product');
  test.skip(!r, 'no product published');
  const { context, page } = await openPage(browser, byLabel('iphone'), r.path);
  const available = await page.evaluate((p) => fetch(`${p.split('?')[0]}.js`).then((x) => x.json()).then((j) => j.available), r.path);
  expect(available, 'product is purchasable (Shopify reports available: false — sold out)').toBe(true);
  await page.evaluate(() => fetch('/cart/clear.js', { method: 'POST' }));
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const bar = page.locator('wf-sticky-buy.is-visible');
  await expect(bar).toBeVisible({ timeout: 10000 });
  await expect(bar.locator('[data-wf-submit]')).toBeEnabled();
  await bar.locator('[data-wf-submit]').click();
  await expect
    .poll(() => page.evaluate(() => fetch('/cart.js').then((x) => x.json()).then((c) => c.item_count)), { timeout: 15000 })
    .toBeGreaterThan(0);
  // The bar hides while the cart UI (notification or drawer) is open
  await expect(page.locator('wf-sticky-buy')).not.toHaveClass(/is-visible/, { timeout: 5000 });
  await page.evaluate(() => fetch('/cart/clear.js', { method: 'POST' }));
  await context.close();
});
