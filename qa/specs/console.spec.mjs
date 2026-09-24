import { test, expect } from '@playwright/test';
import { byLabel } from '../viewports.mjs';
import { routes } from '../routes.mjs';
import { openPage, scrollThrough } from '../lib.mjs';

const isWf = (s = '') => /\/wf-[\w-]+\.(js|css)/.test(s);

for (const r of routes) {
  test(`console ${r.key} @ desktop`, async ({ browser }) => {
    const errors = [];
    const { context, page } = await openPage(browser, byLabel('desktop'), r.path, {
      reducedMotion: 'no-preference',
      onPage: (p) => {
        p.on('pageerror', (e) => errors.push({ type: 'pageerror', text: e.message, where: e.stack || '' }));
        p.on('console', (m) => {
          if (m.type() === 'error') errors.push({ type: 'console', text: m.text(), where: m.location()?.url || '' });
        });
      },
    });
    await scrollThrough(page);
    await context.close();
    const wf = errors.filter((e) => isWf(e.where) || isWf(e.text));
    const other = errors.length - wf.length;
    if (other) test.info().annotations.push({ type: 'non-wf', description: `${other} non-wf console error(s): ${errors.filter((e) => !wf.includes(e)).map((e) => e.text.slice(0, 120)).join(' | ')}` });
    expect(wf, 'wf-* console errors').toEqual([]);
  });
}
