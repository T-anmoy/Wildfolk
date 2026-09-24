import { test } from '@playwright/test';
import { byLabel } from '../viewports.mjs';
import { route } from '../routes.mjs';
import { openPage, outDir } from '../lib.mjs';

// Viewport screenshots of states the full-page spec can't reach: the cart drawer open,
// and the offer band in each style (QA fixture template, see offer-band.spec).
const VPS = ['sm-phone', 'iphone', 'phone-landscape', 'ipad-mini', 'tablet-landscape', 'laptop-short', 'desktop', 'ultrawide'];

for (const label of VPS) {
  test(`screenshot drawer-open @ ${label}`, async ({ browser }) => {
    const r = route('product');
    test.skip(!r, 'no product');
    const { context, page } = await openPage(browser, byLabel(label), r.path);
    await page.evaluate(() => fetch('/cart/clear.js', { method: 'POST' }));
    await page.locator('[id^="ProductSubmitButton-"]').first().click();
    await page.waitForSelector('cart-drawer.active', { timeout: 15000 });
    await page.waitForTimeout(900);
    await page.screenshot({ path: outDir('drawer-open', `${label}.png`) });
    await page.evaluate(() => fetch('/cart/clear.js', { method: 'POST' }));
    await context.close();
  });

  test(`screenshot offer-bands @ ${label}`, async ({ browser }) => {
    const { context, page } = await openPage(browser, byLabel(label), '/pages/contact?view=wf-qa-offers', { reducedMotion: 'no-preference' });
    await page.mouse.move(2, 2);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: outDir('offer-bands', `${label}.png`) });
    await context.close();
  });
}
