import { test, expect } from '@playwright/test';
import { byLabel } from '../viewports.mjs';
import { openPage } from '../lib.mjs';

// The hero headline — and the primary CTA whenever one is rendered — must be fully
// visible without scrolling. (Before launch the CTA is intentionally absent while its
// destination is empty: see snippets/wf-link-live.liquid.)
for (const vpLabel of ['laptop-short', 'laptop-hd', 'sm-phone', 'phone-landscape']) {
  test(`above-fold hero @ ${vpLabel}`, async ({ browser }) => {
    const vp = byLabel(vpLabel);
    const { context, page } = await openPage(browser, vp, '/');
    const boxes = await page.evaluate(() => {
      const box = (el) => el && (({ top, bottom }) => ({ top, bottom }))(el.getBoundingClientRect());
      return {
        h1: box(document.querySelector('.wf-hero h1')),
        cta: box(document.querySelector('.wf-hero .button--primary')),
        vh: window.innerHeight,
      };
    });
    await context.close();
    expect(boxes.h1, 'hero h1 present').toBeTruthy();
    expect(boxes.h1.top).toBeGreaterThanOrEqual(0);
    expect(boxes.h1.bottom, 'hero h1 bottom').toBeLessThanOrEqual(boxes.vh);
    if (boxes.cta) expect(boxes.cta.bottom, 'hero CTA bottom').toBeLessThanOrEqual(boxes.vh);
    else test.info().annotations.push({ type: 'note', description: 'no hero CTA rendered (destination not live yet)' });
  });
}
