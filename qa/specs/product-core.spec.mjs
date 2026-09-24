import { test, expect } from '@playwright/test';
import { byLabel } from '../viewports.mjs';
import { route } from '../routes.mjs';
import { openPage } from '../lib.mjs';

test('unit price, money format and trust row', async ({ browser }) => {
  const r = route('product');
  test.skip(!r, 'no product');
  const { context, page } = await openPage(browser, byLabel('iphone'), r.path);
  await page.waitForFunction(() => window.wfCommerce);
  const res = await page.evaluate(() => {
    const data = document.querySelector('script[data-wf-variants]');
    const map = JSON.parse(data.textContent);
    const format = data.dataset.moneyFormat;
    const unit = document.querySelector('.product__info-container .wf-unit-price');
    return {
      map,
      format,
      unitText: unit && !unit.hidden ? unit.textContent.replace(/\s+/g, ' ').trim() : null,
      fmt1: window.wfCommerce.wfFormatMoney(99900, format),
      fmt2: window.wfCommerce.wfFormatMoney(123456, '₹{{amount_no_decimals}}'),
      trust: [...document.querySelectorAll('.wf-trust-row__item')].map((li) => li.textContent.trim()),
    };
  });
  await context.close();
  // Money: the shop's own format.
  expect(res.fmt1).toBe(res.format.replace(/\{\{\s*amount\s*\}\}/, '999.00'));
  expect(res.fmt2).toBe('₹1,235');
  // Unit price = price / net weight × 100 for the current variant; hidden without a weight.
  const [first] = Object.values(res.map);
  if (first.w > 0) {
    const expected = Math.floor((first.p * 100) / first.w);
    expect(res.unitText).toContain('/ 100 g');
    expect(res.unitText).toContain((expected / 100).toFixed(2));
  } else {
    expect(res.unitText, 'unit price hidden without wildfolk.net_weight_g').toBeNull();
  }
  // Trust row: only the configured item(s) — never a returns promise.
  for (const t of res.trust) expect(t).not.toMatch(/easy return|free return/i);
  expect(res.trust.length).toBeLessThanOrEqual(4);
});
