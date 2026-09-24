import { test, expect } from '@playwright/test';
import { byLabel } from '../viewports.mjs';
import { route } from '../routes.mjs';
import { openPage, scrollThrough } from '../lib.mjs';

// The newsletter renders, has a labelled email input, and posts to Shopify's native
// customer endpoint. Nothing is submitted (live store). One visible form per page.
for (const key of ['home', 'our-story', 'contact']) {
  test(`newsletter ${key} @ desktop`, async ({ browser }) => {
    const r = route(key);
    test.skip(!r, `${key} route not available`);
    const { context, page } = await openPage(browser, byLabel('desktop'), r.path);
    await scrollThrough(page, { pause: 30 });
    const forms = await page.evaluate(() =>
      [...document.querySelectorAll('form')]
        .filter((f) => f.querySelector('input[name="form_type"][value="customer"]') && f.querySelector('input[type="email"]'))
        .filter((f) => f.getClientRects().length && getComputedStyle(f).visibility !== 'hidden')
        .map((f) => {
          const input = f.querySelector('input[type="email"]');
          const label = input.id && document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
          return {
            action: new URL(f.getAttribute('action'), location.href).pathname,
            method: (f.getAttribute('method') || '').toLowerCase(),
            labelled: !!(label && label.textContent.trim()) || !!input.getAttribute('aria-label'),
            required: input.required,
            wf: !!f.closest('.wf-final-cta__newsletter'),
          };
        })
    );
    await context.close();
    expect(forms.length, 'visible newsletter forms').toBe(1);
    const [f] = forms;
    expect(f.action).toMatch(/\/contact$/);
    expect(f.method).toBe('post');
    expect(f.labelled, 'email input has a label').toBe(true);
    if (key !== 'contact') expect(f.wf, 'the final-CTA newsletter is the one shown').toBe(true);
  });
}
