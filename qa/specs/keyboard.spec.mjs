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
