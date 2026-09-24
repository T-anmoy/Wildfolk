import { test, expect } from '@playwright/test';
import { byLabel } from '../viewports.mjs';
import { routes, route } from '../routes.mjs';
import { openPage, scrollThrough } from '../lib.mjs';
import { CART_UI, clearCart } from '../commerce-lib.mjs';

// Honey is non-returnable: the disclosure must be visible before purchase and in
// the cart, and no page may promise returns.
const BANNED = [/easy returns?/i, /free returns?/i, /hassle[- ]free returns?/i, /no[- ]questions[- ]asked/i, /return within/i];

test('returns line visible on the PDP and in the cart drawer, linked to the refund policy', async ({ browser }) => {
  const r = route('product');
  test.skip(!r, 'no product');
  const { context, page } = await openPage(browser, byLabel('iphone'), r.path);
  const pdp = page.locator('.product__info-container .wf-returns-line');
  await expect(pdp).toBeVisible();
  await expect(pdp.locator('a')).toHaveAttribute('href', /\/policies\/refund-policy/);
  await clearCart(page);
  await page.locator('[id^="ProductSubmitButton-"]').first().click();
  await expect(page.locator(CART_UI).first()).toBeVisible({ timeout: 15000 });
  const drawerLine = page.locator('cart-drawer .wf-returns-line');
  await expect(drawerLine).toBeVisible();
  await expect(drawerLine.locator('a')).toHaveAttribute('href', /\/policies\/refund-policy/);
  await clearCart(page);
  await context.close();
});

for (const r of routes) {
  test(`no return promises on ${r.key}`, async ({ browser }) => {
    const { context, page } = await openPage(browser, byLabel('desktop'), r.path);
    await scrollThrough(page, { pause: 20 });
    const text = await page.evaluate(() => document.body.innerText);
    await context.close();
    const hits = BANNED.filter((re) => re.test(text)).map(String);
    expect(hits, `promise phrases on ${r.path}`).toEqual([]);
  });
}
