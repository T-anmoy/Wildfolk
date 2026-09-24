import { test, expect } from '@playwright/test';
import { byLabel } from '../viewports.mjs';
import { route } from '../routes.mjs';
import { openPage, scrollThrough } from '../lib.mjs';

// Outside the Theme Editor an empty image slot must not render as a grey placeholder.
for (const key of ['home', 'our-story']) {
  for (const vpLabel of ['iphone', 'desktop']) {
    test(`no-images ${key} @ ${vpLabel}`, async ({ browser }) => {
      const r = route(key);
      test.skip(!r, `${key} route not available`);
      const { context, page } = await openPage(browser, byLabel(vpLabel), r.path);
      await scrollThrough(page, { pause: 30 });
      const placeholders = await page.locator('.wf-media--placeholder').count();
      await context.close();
      expect(placeholders, 'storefront placeholders').toBe(0);
    });
  }
}
