import { test, expect } from '@playwright/test';
import { byLabel } from '../viewports.mjs';
import { route } from '../routes.mjs';
import { openPage } from '../lib.mjs';

// Tab through the page: every focus stop must be visible (not hidden, inert or
// aria-hidden) and carry a visible focus indicator (outline or box-shadow).
const pages = [
  ['home', 'desktop', 40],
  ['home', 'iphone', 25],
  ['product', 'iphone', 40],
  ['product', 'desktop', 40],
];

for (const [key, vpLabel, stops] of pages) {
  test(`keyboard ${key} @ ${vpLabel}`, async ({ browser }) => {
    const r = route(key);
    test.skip(!r, `${key} route not available (no product published)`);
    const { context, page } = await openPage(browser, byLabel(vpLabel), r.path);
    const problems = [];
    let seen = 0;
    for (let i = 0; i < stops; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const host = document.activeElement;
        if (!host || host === document.body) return null;
        // Follow focus into shadow roots (e.g. <shopify-account>), where the ring is drawn.
        let el = host;
        while (el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const hidden =
          !!host.closest('[aria-hidden="true"], [inert]') ||
          cs.visibility === 'hidden' ||
          rect.width === 0 ||
          rect.height === 0;
        const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
        const shadow = cs.boxShadow && cs.boxShadow !== 'none';
        // Some Craft controls draw focus on a child/pseudo; accept a focus-visible match with any of these.
        return {
          desc: `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} "${(el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 30)}"`,
          hidden,
          indicator: outline || shadow,
          iframe: el.tagName === 'IFRAME',
        };
      });
      if (!info || info.iframe) continue;
      seen++;
      if (info.hidden) problems.push(`hidden element focused: ${info.desc}`);
      else if (!info.indicator) problems.push(`no visible focus indicator: ${info.desc}`);
    }
    await context.close();
    expect(seen, 'focus stops reached').toBeGreaterThan(3);
    expect(problems).toEqual([]);
  });
}

test('keyboard: cart drawer traps focus and every stop is visible', async ({ browser }) => {
  const r = route('product');
  test.skip(!r, 'no product');
  const { context, page } = await openPage(browser, byLabel('desktop'), r.path);
  await page.evaluate(() => fetch('/cart/clear.js', { method: 'POST' }));
  await page.locator('[id^="ProductSubmitButton-"]').first().click();
  await page.waitForSelector('cart-drawer.active', { timeout: 15000 });
  await page.waitForTimeout(600);
  const problems = [];
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        inDrawer: !!el.closest('cart-drawer'),
        visible: rect.width > 0 && rect.height > 0 && cs.visibility !== 'hidden',
        indicator: (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none'),
        desc: el.tagName + '.' + String(el.className).slice(0, 40),
      };
    });
    if (!info) continue;
    if (!info.inDrawer) problems.push('focus escaped the open drawer: ' + info.desc);
    else if (!info.visible) problems.push('invisible focus stop: ' + info.desc);
    else if (!info.indicator) problems.push('no focus indicator: ' + info.desc);
  }
  await page.evaluate(() => fetch('/cart/clear.js', { method: 'POST' }));
  await context.close();
  expect(problems).toEqual([]);
});
