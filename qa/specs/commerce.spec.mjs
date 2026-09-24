import { test, expect } from '@playwright/test';
import { byLabel } from '../viewports.mjs';
import { route } from '../routes.mjs';
import { openPage } from '../lib.mjs';

// Add to cart through the native form (main button and, on phones, the sticky bar).
// Skips until a product is published to the Online Store.
const clearCart = (page) => page.evaluate(() => fetch('/cart/clear.js', { method: 'POST' }));
const cartCount = (page) => page.evaluate(() => fetch('/cart.js').then((r) => r.json()).then((c) => c.item_count));

for (const vpLabel of ['iphone', 'desktop']) {
  test(`commerce add-to-cart @ ${vpLabel}`, async ({ browser }) => {
    const r = route('product');
    test.skip(!r, 'no product published — add-to-cart NOT VERIFIED');
    const { context, page } = await openPage(browser, byLabel(vpLabel), r.path, { reducedMotion: 'reduce' });
    await clearCart(page);
    const button = page.locator('[id^="ProductSubmitButton-"]').first();
    // A published product that can't be bought is a failure, not a pass: the add-to-cart
    // path must be exercised for real.
    const available = await page.evaluate((p) => fetch(`${p.split('?')[0]}.js`).then((r) => r.json()).then((j) => j.available), r.path);
    expect(available, 'product is purchasable (Shopify reports available: false — sold out)').toBe(true);
    await expect(button, 'main Add to Cart enabled').toBeEnabled();
    const before = await cartCount(page);
    await button.click();
    await expect(page.locator('#cart-notification.active')).toBeVisible({ timeout: 15000 });
    expect(await cartCount(page)).toBeGreaterThan(before);

    if (vpLabel === 'iphone') {
      await page.locator('#cart-notification button[type="button"]').first().click().catch(() => {});
      await clearCart(page);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const bar = page.locator('wf-sticky-buy.is-visible');
      await expect(bar).toBeVisible({ timeout: 10000 });
      await bar.locator('[data-wf-submit]').click();
      await expect(page.locator('#cart-notification.active')).toBeVisible({ timeout: 15000 });
      expect(await cartCount(page)).toBeGreaterThan(0);
    }
    await clearCart(page);
    await context.close();
  });
}
