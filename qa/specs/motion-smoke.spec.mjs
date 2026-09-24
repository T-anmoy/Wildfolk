import { test, expect } from '@playwright/test';
import { byLabel } from '../viewports.mjs';
import { openPage, scrollThrough } from '../lib.mjs';

test('motion-smoke / @ desktop (motion on)', async ({ browser }) => {
  const { context, page } = await openPage(browser, byLabel('desktop'), '/', { reducedMotion: 'no-preference' });
  const duration = await page.evaluate(() => {
    const el = document.querySelector('[data-wf-reveal]');
    if (!el) return null;
    return parseFloat(getComputedStyle(el).transitionDuration.split(',')[0]);
  });
  await scrollThrough(page, { pause: 250 });
  await page.waitForTimeout(1500);
  const state = await page.evaluate(() => {
    const reveals = [...document.querySelectorAll('[data-wf-reveal]')].filter((el) => el.getClientRects().length);
    return {
      total: reveals.length,
      notVisible: reveals.filter((el) => !el.classList.contains('is-visible')).map((el) => el.className || el.tagName),
      bees: document.querySelectorAll('[data-wf-bee]').length,
    };
  });
  await context.close();
  expect(duration, 'reveal transition-duration (s)').toBeGreaterThan(0);
  expect(state.notVisible, 'reveal elements still hidden after scroll').toEqual([]);
  expect(state.bees, 'bee element count').toBe(1);
});

test('motion-smoke / @ iphone: bee absent or hidden on touch', async ({ browser }) => {
  const { context, page } = await openPage(browser, byLabel('iphone'), '/', { reducedMotion: 'no-preference' });
  await scrollThrough(page, { pause: 100 });
  const visible = await page.evaluate(() =>
    [...document.querySelectorAll('[data-wf-bee]')].some((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return !el.hidden && cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0 &&
        r.width > 0 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
    })
  );
  await context.close();
  expect(visible, 'bee visible on a touch phone').toBe(false);
});
