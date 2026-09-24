import { test, expect } from '@playwright/test';
import { byLabel } from '../viewports.mjs';
import { openPage, scrollThrough } from '../lib.mjs';

for (const vpLabel of ['iphone', 'desktop']) {
  test(`media / @ ${vpLabel}`, async ({ browser, request }) => {
    const vp = byLabel(vpLabel);
    const { context, page } = await openPage(browser, vp, '/');
    await scrollThrough(page);
    const data = await page.evaluate(() => {
      const hero = document.querySelector('.wf-hero img');
      const imgs = [...document.querySelectorAll('img.wf-media__img')].map((img) => ({
        srcset: img.getAttribute('srcset') || '',
        currentSrc: img.currentSrc,
        rendered: img.getBoundingClientRect().width,
        natural: img.naturalWidth,
      }));
      return {
        hero: hero && { loading: hero.getAttribute('loading'), fetchpriority: hero.getAttribute('fetchpriority') },
        imgs,
        dpr: window.devicePixelRatio,
      };
    });
    await context.close();

    if (!data.imgs.length) {
      test.info().annotations.push({ type: 'note', description: 'no images to verify' });
      return;
    }
    if (data.hero) {
      expect(data.hero.loading, 'hero loading').toBe('eager');
      expect(data.hero.fetchpriority, 'hero fetchpriority').toBe('high');
    }
    for (const img of data.imgs) {
      const candidates = img.srcset.split(/,\s+(?=\S)/).map((c) => c.trim()).filter(Boolean);
      expect(candidates.length, `srcset candidates: ${img.srcset}`).toBeGreaterThanOrEqual(2);
      for (const c of candidates) {
        const [url, desc] = c.split(/\s+/);
        expect(desc, `descriptor in "${c}"`).toMatch(/^\d+w$/);
        const res = await request.get(url.startsWith('//') ? `https:${url}` : url);
        expect(res.status(), url).toBe(200);
      }
      if (vp.isMobile && img.rendered > 0 && img.natural > 0) {
        expect(img.natural, `currentSrc too large: ${img.currentSrc}`).toBeLessThanOrEqual(3 * img.rendered * data.dpr);
      }
    }
  });
}
