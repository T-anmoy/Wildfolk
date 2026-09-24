import { test, expect } from '@playwright/test';
import { byLabel } from '../viewports.mjs';
import { route } from '../routes.mjs';
import { openPage } from '../lib.mjs';

// Label information: rows only with values; "Inclusive of all taxes" only when
// PRICES_INCLUDE_TAX=yes (env WF_PRICES_INCLUDE_TAX, default: not set = no).
test('label information rows are truthful', async ({ browser }) => {
  const r = route('product');
  test.skip(!r, 'no product');
  const { context, page } = await openPage(browser, byLabel('desktop'), r.path);
  const data = await page.evaluate(() => {
    const block = document.querySelector('.wf-label-info');
    const rows = block ? [...block.querySelectorAll('.wf-label-info__row:not([hidden])')].map((row) => ({
      label: row.querySelector('dt')?.textContent.trim(),
      value: row.querySelector('dd')?.textContent.trim(),
    })) : [];
    return { present: !!block, rows, taxText: document.body.innerText.includes('Inclusive of all taxes') };
  });
  const vjson = await page.evaluate((p) => fetch(`${p}.js`).then((x) => x.json()), r.path);
  await context.close();
  for (const row of data.rows) expect(row.value, `row "${row.label}" has a value`).not.toBe('');
  const mrp = data.rows.find((row) => row.label === 'MRP');
  if (mrp) expect(mrp.value).toContain((vjson.variants[0].price / 100).toFixed(2));
  if (process.env.WF_PRICES_INCLUDE_TAX === 'yes') {
    if (data.present) expect(data.taxText).toBe(true);
  } else {
    expect(data.taxText, '"Inclusive of all taxes" must not show while PRICES_INCLUDE_TAX is not yes').toBe(false);
  }
  if (!data.present) test.info().annotations.push({ type: 'note', description: 'label info hidden: no wildfolk.* metafields / FSSAI / care settings yet' });
});
