import { test, expect } from '@playwright/test';
import { byLabel } from '../viewports.mjs';
import { openPage } from '../lib.mjs';

// The hero headline and primary CTA must be fully visible without scrolling on short laptops.
for (const vpLabel of ['laptop-short', 'laptop-hd']) {
  test(`above-fold hero @ ${vpLabel}`, async ({ browser }) => {
    const vp = byLabel(vpLabel);
    const { context, page } = await openPage(browser, vp, '/');
    const boxes = await page.evaluate(() => {
      const box = (el) => el && (({ top, bottom, left, right }) => ({ top, bottom, left, right }))(el.getBoundingClientRect());
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
    expect(boxes.cta, 'hero primary CTA present').toBeTruthy();
    expect(boxes.cta.bottom, 'hero CTA bottom').toBeLessThanOrEqual(boxes.vh);
  });
}
