// Shared helpers for commerce specs (native cart API only).
export const CART_UI = 'cart-drawer.active, #cart-notification.active';
export const clearCart = (page) =>
  page.evaluate(() =>
    fetch('/cart/clear.js', { method: 'POST' }).then(() =>
      fetch('/cart/update.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: '' }) })
    )
  );
export const cartJson = (page) => page.evaluate(() => fetch('/cart.js').then((r) => r.json()));
export const cartCount = async (page) => (await cartJson(page)).item_count;
export const productJson = (page, path) => page.evaluate((p) => fetch(`${p.split('?')[0]}.js`).then((r) => r.json()), path);
export async function closeCartUi(page) {
  await page.keyboard.press('Escape').catch(() => {});
  await page.locator('#cart-notification button[type="button"]').first().click({ timeout: 1000 }).catch(() => {});
  await page.waitForTimeout(400);
}
export const isWfError = (s = '') => /\/wf-[\w-]+\.(js|css)|\[wf-/.test(s);
