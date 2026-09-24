import { test, expect } from '@playwright/test';
import { matrix } from '../viewports.mjs';
import { routes } from '../routes.mjs';
import { openPage, scrollThrough, hideDevOverlay } from '../lib.mjs';

for (const r of routes) {
  for (const vp of matrix) {
    test(`overflow ${r.key} @ ${vp.label}`, async ({ browser }) => {
      const { context, page } = await openPage(browser, vp, r.path);
      await scrollThrough(page, { pause: 30 });
      await hideDevOverlay(page);
      const result = await page.evaluate((vw) => {
        const scrollWidth = document.documentElement.scrollWidth;
        const clips = (el) => {
          for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
            const ox = getComputedStyle(n).overflowX;
            if (ox !== 'visible') return true;
          }
          return false;
        };
        const offenders = [];
        for (const el of document.body.querySelectorAll('*')) {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.right <= vw + 1) continue;
          const cs = getComputedStyle(el);
          if (cs.position === 'fixed' && cs.visibility === 'hidden') continue;
          if (clips(el)) continue;
          offenders.push({
            tag: el.tagName.toLowerCase(),
            classes: el.className && typeof el.className === 'string' ? el.className.slice(0, 120) : '',
            section: el.closest('[id^="shopify-section-"]')?.id || '',
            right: Math.round(rect.right),
          });
          if (offenders.length > 15) break;
        }
        return { scrollWidth, offenders, doc: { title: document.title, main: !!document.querySelector('#MainContent'), text: document.body.innerText.slice(0, 200) } };
      }, vp.width);
      await context.close();
      expect(result.scrollWidth, `Horizontal overflow on ${r.path}: ${JSON.stringify(result.offenders, null, 1)}\nDocument: ${JSON.stringify(result.doc)}`).toBeLessThanOrEqual(vp.width);
    });
  }
}
