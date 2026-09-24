import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { byLabel } from '../viewports.mjs';
import { routes } from '../routes.mjs';
import { openPage, scrollThrough, outDir } from '../lib.mjs';

// Reports interactive elements under 44×44 CSS px at 390×844. Fails only for wf-* elements.
for (const r of routes) {
  test(`tap-targets ${r.key} @ iphone`, async ({ browser }) => {
    const { context, page } = await openPage(browser, byLabel('iphone'), r.path);
    await scrollThrough(page, { pause: 30 });
    const found = await page.evaluate(() => {
      const sel = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [tabindex]:not([tabindex="-1"])';
      const out = [];
      for (const el of document.querySelectorAll(sel)) {
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if (rect.width <= 1 || rect.height <= 1 || cs.visibility === 'hidden' || cs.display === 'none') continue;
        if (el.closest('[aria-hidden="true"], [inert], [hidden]')) continue;
        // WCAG 2.5.8 exception: inline links inside running text.
        if (el.tagName === 'A' && el.closest('p, li') && el.closest('.rte, .wf-body')) continue;
        if (rect.width >= 44 && rect.height >= 44) continue;
        const wf = !!el.closest('[class*="wf-"]');
        out.push({
          wf,
          tag: el.tagName.toLowerCase(),
          text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 40),
          classes: typeof el.className === 'string' ? el.className.slice(0, 80) : '',
          size: `${Math.round(rect.width)}×${Math.round(rect.height)}`,
        });
      }
      return out;
    });
    await context.close();
    fs.writeFileSync(outDir('tap-targets', `${r.key}.json`), JSON.stringify(found, null, 2));
    const stock = found.filter((f) => !f.wf);
    if (stock.length) test.info().annotations.push({ type: 'stock', description: `${stock.length} small stock targets (reported only)` });
    const wf = found.filter((f) => f.wf);
    expect(wf, `wf-* tap targets under 44×44 on ${r.path}`).toEqual([]);
  });
}
