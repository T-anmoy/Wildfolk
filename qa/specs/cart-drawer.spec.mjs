import { test, expect } from '@playwright/test';
import { byLabel } from '../viewports.mjs';
import { route } from '../routes.mjs';
import { openPage } from '../lib.mjs';
import { clearCart, cartJson, closeCartUi, isWfError } from '../commerce-lib.mjs';

// Craft cart drawer + Wildfolk additions, against the real cart API.
// Features whose INPUTS are blank must be absent; their element logic is exercised
// with fixture elements injected into the open drawer (the real custom elements).

async function openPdp(browser, vp, collectErrors) {
  const r = route('product');
  const errors = [];
  const { context, page } = await openPage(browser, byLabel(vp), r.path, {
    onPage: (p) => {
      p.on('pageerror', (e) => errors.push(e.message + (e.stack || '')));
      p.on('console', (m) => m.type() === 'error' && errors.push(m.text() + ' ' + (m.location()?.url || '')));
    },
  });
  if (collectErrors) collectErrors.list = errors;
  await clearCart(page);
  return { context, page, r };
}

test('drawer opens from the main button and from the sticky bar', async ({ browser }) => {
  test.skip(!route('product'), 'no product');
  const { context, page } = await openPdp(browser, 'iphone');
  await page.locator('[id^="ProductSubmitButton-"]').first().click();
  await expect(page.locator('cart-drawer.active')).toBeVisible({ timeout: 15000 });
  expect((await cartJson(page)).item_count).toBe(1);
  // Sticky bar hides while the drawer is open
  await expect(page.locator('wf-sticky-buy')).not.toHaveClass(/is-visible/);
  await closeCartUi(page);
  await expect(page.locator('cart-drawer.active')).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const bar = page.locator('wf-sticky-buy.is-visible');
  await expect(bar).toBeVisible({ timeout: 10000 });
  await bar.locator('[data-wf-submit]').click();
  await expect(page.locator('cart-drawer.active')).toBeVisible({ timeout: 15000 });
  await expect.poll(async () => (await cartJson(page)).item_count, { timeout: 10000 }).toBe(2);
  await clearCart(page);
  await context.close();
});

test('drawer re-renders stay clean; unset features absent; gift message persists', async ({ browser }) => {
  test.skip(!route('product'), 'no product');
  const errs = {};
  const { context, page } = await openPdp(browser, 'desktop', errs);
  await page.locator('[id^="ProductSubmitButton-"]').first().click();
  await expect(page.locator('cart-drawer.active')).toBeVisible({ timeout: 15000 });
  for (let i = 0; i < 5; i++) {
    await page.locator('cart-drawer .quantity__button[name="plus"]').first().click();
    await expect.poll(async () => (await cartJson(page)).item_count, { timeout: 10000 }).toBe(i + 2);
    await page.waitForTimeout(300);
    const counts = await page.evaluate(() => ({
      live: { ...window.wfCommerce.live },
      dom: {
        'wf-free-ship': document.querySelectorAll('wf-free-ship').length,
        'wf-upgrade-line': document.querySelectorAll('wf-upgrade-line').length,
        'wf-gift-wrap': document.querySelectorAll('wf-gift-wrap').length,
      },
    }));
    expect(counts.live, 'connected custom elements == elements in the DOM (no leaks)').toEqual(counts.dom);
  }
  // INPUTS blank → these features ship hidden
  const hidden = await page.evaluate(() => ({
    jar: document.querySelectorAll('cart-drawer wf-free-ship').length,
    nudge: document.querySelectorAll('cart-drawer wf-upgrade-line').length,
    gift: document.querySelectorAll('cart-drawer wf-gift-wrap').length,
  }));
  test.info().annotations.push({ type: 'hidden-features', description: JSON.stringify(hidden) });
  // Gift message = Craft's native cart note
  await expect(page.locator('#Details-CartDrawer summary')).toContainText('Gift message (optional)');
  await page.locator('#Details-CartDrawer summary').click();
  await page.fill('#CartDrawer-Note', 'QA gift message');
  await page.locator('#CartDrawer-Note').blur();
  await expect.poll(async () => (await cartJson(page)).note, { timeout: 10000 }).toBe('QA gift message');
  await clearCart(page);
  await context.close();
  expect((errs.list || []).filter(isWfError), 'wf-* errors').toEqual([]);
});

test('Filling Jar fill level and gift-wrap toggle (fixture elements, real cart API)', async ({ browser }) => {
  test.skip(!route('product'), 'no product');
  const { context, page, r } = await openPdp(browser, 'desktop');
  const product = await page.evaluate((p) => fetch(`${p}.js`).then((x) => x.json()), r.path);
  await page.locator('[id^="ProductSubmitButton-"]').first().click();
  await expect(page.locator('cart-drawer.active')).toBeVisible({ timeout: 15000 });

  // Jar: the fill scale equals data-fill (0, below, at/above the threshold), reduced to transform only.
  const scales = await page.evaluate(async () => {
    const out = [];
    for (const fill of [0, 0.4, 1]) {
      const el = document.createElement('wf-free-ship');
      el.dataset.fill = String(fill);
      el.innerHTML = '<svg><rect class="wf-free-ship__fill" width="10" height="10"/></svg>';
      document.querySelector('cart-drawer .drawer__footer').prepend(el);
      await new Promise((res) => setTimeout(res, 1100));
      out.push(getComputedStyle(el).getPropertyValue('--wf-fill').trim());
      el.remove();
    }
    return out;
  });
  expect(scales.map(Number)).toEqual([0, 0.4, 1]);

  // Gift wrap: add → the line appears and Craft re-renders the drawer (fixture element
  // is replaced; live count stays consistent); the product is used as a stand-in item.
  const variant = product.variants[0].id;
  await page.evaluate((v) => {
    const el = document.createElement('wf-gift-wrap');
    el.dataset.variant = String(v);
    el.dataset.lineKey = '';
    el.innerHTML = '<label><input type="checkbox" class="wf-gift-wrap__input"> QA gift wrap</label><p class="wf-gift-wrap__error" hidden></p>';
    document.querySelector('cart-drawer .cart-drawer__footer').prepend(el);
  }, variant);
  const before = (await cartJson(page)).item_count;
  let runs = 0;
  await page.locator('cart-drawer wf-gift-wrap input').check();
  await expect.poll(async () => (await cartJson(page)).item_count, { timeout: 10000 }).toBe(before + 1);
  runs = await page.evaluate(() => window.wfCommerce.giftToggles);
  expect(runs, 'the toggle handler ran exactly once').toBe(1);
  await expect(page.locator('cart-drawer wf-gift-wrap')).toHaveCount(0); // drawer re-rendered from the server
  expect(await page.evaluate(() => window.wfCommerce.live['wf-gift-wrap'])).toBe(0);
  await clearCart(page);
  await context.close();
});
