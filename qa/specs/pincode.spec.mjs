import { test, expect } from '@playwright/test';
import { byLabel } from '../viewports.mjs';
import { route } from '../routes.mjs';
import { openPage } from '../lib.mjs';

// The storefront checker is hidden while PINCODE_ZONES is blank. The element logic is
// exercised with fixture zones injected into the PDP (the real <wf-pincode> element).
const ZONES = '110001-110099 | 2–4 | cod\n400001-400099 | 3–5 | prepaid';
const inject = (page) =>
  page.evaluate((zones) => {
    document.querySelector('#wf-qa-pincode')?.remove();
    const host = document.createElement('div');
    host.id = 'wf-qa-pincode';
    host.innerHTML = `<wf-pincode class="wf-pincode"><form class="wf-pincode__form" novalidate>
      <label class="wf-pincode__label" for="QaPin">Check delivery</label>
      <div class="wf-pincode__row"><input id="QaPin" class="wf-pincode__input" inputmode="numeric" maxlength="6" aria-describedby="QaErr QaRes">
      <button type="submit" class="button">Check</button></div>
      <p id="QaErr" class="wf-pincode__error" hidden>Enter a 6-digit pincode.</p>
      <p id="QaRes" class="wf-pincode__result" role="status" aria-live="polite"></p></form></wf-pincode>`;
    host.querySelector('wf-pincode').dataset.zones = zones;
    document.body.prepend(host);
  }, ZONES);

test('pincode checker', async ({ browser }) => {
  const r = route('product');
  test.skip(!r, 'no product');
  const { context, page } = await openPage(browser, byLabel('iphone'), r.path);
  await page.waitForFunction(() => customElements.get('wf-pincode'));
  const storefront = await page.locator('.product__info-container wf-pincode').count();
  if (!storefront) test.info().annotations.push({ type: 'note', description: 'storefront checker hidden (PINCODE_ZONES blank)' });
  await page.evaluate(() => { try { localStorage.removeItem('wf-pincode'); } catch (e) {} });
  await inject(page);
  const input = page.locator('#QaPin');
  const submit = page.locator('#wf-qa-pincode button');
  await input.fill('12345');
  await submit.click();
  await expect(page.locator('#QaErr')).toBeVisible();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await input.fill('110050');
  await submit.click();
  await expect(page.locator('#QaErr')).toBeHidden();
  await expect(page.locator('#QaRes')).toHaveText('Delivery in 2–4 days · COD available.');
  await input.fill('400010');
  await submit.click();
  await expect(page.locator('#QaRes')).toHaveText('Delivery in 3–5 days · Prepaid orders only.');
  await input.fill('999999');
  await submit.click();
  await expect(page.locator('#QaRes')).toHaveText("We'll confirm delivery for this pincode at checkout.");
  // Remembered: re-create the element; it restores the last checked pincode.
  await inject(page);
  await expect(page.locator('#QaPin')).toHaveValue('999999');
  await expect(page.locator('#QaRes')).toHaveText("We'll confirm delivery for this pincode at checkout.");
  await page.evaluate(() => { try { localStorage.removeItem('wf-pincode'); } catch (e) {} });
  await context.close();
});
