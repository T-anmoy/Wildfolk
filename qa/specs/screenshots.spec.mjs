import { test } from '@playwright/test';
import { matrix } from '../viewports.mjs';
import { routes } from '../routes.mjs';
import { openPage, scrollThrough, outDir } from '../lib.mjs';

for (const r of routes) {
  for (const vp of matrix) {
    test(`screenshot ${r.key} @ ${vp.label}`, async ({ browser }) => {
      const { context, page } = await openPage(browser, vp, r.path);
      await scrollThrough(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(250);
      await page.screenshot({ path: outDir(r.key, `${vp.label}.png`), fullPage: true, animations: 'disabled' });
      await context.close();
    });
  }
}
