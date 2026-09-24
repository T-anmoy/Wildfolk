import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { byLabel } from '../viewports.mjs';
import { openPage } from '../lib.mjs';

// Uses the QA-only fixture template (qa/fixtures → templates/, gitignored; synced to the
// dev theme by `theme dev`). Fixture offers include expired, future and invalid dates.
const here = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = 'page.wf-qa-offers.json';
const URL = '/pages/contact?view=wf-qa-offers';

test.beforeAll(async () => {
  const src = path.join(here, '..', 'fixtures', FIXTURE);
  const dest = path.join(here, '..', '..', 'templates', FIXTURE);
  if (!fs.existsSync(dest)) fs.copyFileSync(src, dest);
  const base = process.env.WF_BASE_URL;
  for (let i = 0; i < 30; i++) {
    const html = await fetch(base + URL).then((r) => r.text()).catch(() => '');
    if (html.includes('wf-offer-band--viscous')) return;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('offer-band fixture template did not sync to the dev theme');
});

test('scheduling: expired, future and invalid offers are not rendered; empty band absent', async ({ browser }) => {
  const { context, page } = await openPage(browser, byLabel('desktop'), URL, { reducedMotion: 'no-preference' });
  const text = await page.evaluate(() => [...document.querySelectorAll('wf-offer-band .wf-offer-band__track:not(.wf-offer-band__track--clone)')].map((t) => t.innerText).join(' | '));
  const lower = text.toLowerCase();
  expect(lower).toContain('qa fixture active one');
  expect(lower).not.toContain('expired');
  expect(lower).not.toContain('future');
  expect(lower).not.toContain('invalid date');
  expect(await page.locator('wf-offer-band').count(), '4 bands configured, the all-expired one renders nothing').toBe(3);
  await context.close();
});

test('JS date re-check removes offers that expired after caching (local ?wf_offer_today)', async ({ browser }) => {
  const { context, page } = await openPage(browser, byLabel('desktop'), `${URL}&wf_offer_today=2031-01-01`);
  const letterpress = await page.evaluate(() =>
    [...document.querySelectorAll('.wf-offer-band--letterpress .wf-offer-band__item')].map((li) => li.textContent.trim().toLowerCase())
  );
  expect(letterpress.join(' ')).not.toContain('ends 2030-06-30');
  expect(await page.evaluate(() => window.wfOfferBand.isActive('2020-01-01', '2020-01-02', '2024-05-05'))).toBe(false);
  expect(await page.evaluate(() => window.wfOfferBand.isActive('', '2030-06-30', '2030-06-30'))).toBe(true);
  expect(await page.evaluate(() => window.wfOfferBand.isActive('2099-01-01', '', '2030-06-30'))).toBe(false);
  expect(await page.evaluate(() => window.wfOfferBand.isActive('01/02/2024', '', '2030-06-30'))).toBe(false);
  await context.close();
});

test('viscous ticker moves, and the pause button stops it', async ({ browser }) => {
  const { context, page } = await openPage(browser, byLabel('desktop'), URL, { reducedMotion: 'no-preference' });
  await page.mouse.move(5, 890);
  const tx = () => page.evaluate(() => getComputedStyle(document.querySelector('.wf-offer-band--viscous .wf-offer-band__track')).transform);
  const a = await tx();
  await page.waitForTimeout(1000);
  expect(await tx(), 'ticker drifts').not.toBe(a);
  await page.locator('.wf-offer-band--viscous [data-wf-pause]').click();
  await page.mouse.move(5, 890);
  const b = await tx();
  await page.waitForTimeout(1000);
  expect(await tx(), 'paused: transform unchanged over 1s').toBe(b);
  await expect(page.locator('.wf-offer-band--viscous [data-wf-pause]')).toHaveAttribute('aria-pressed', 'true');
  // The seamless-loop copy is hidden from assistive tech and never focusable
  const clone = await page.evaluate(() => {
    const c = document.querySelector('.wf-offer-band__track--clone');
    return { hidden: c.getAttribute('aria-hidden'), focusable: [...c.querySelectorAll('a')].filter((a) => a.tabIndex >= 0).length };
  });
  expect(clone).toEqual({ hidden: 'true', focusable: 0 });
  await context.close();
});

test('reduced motion: static single message with controls', async ({ browser }) => {
  const { context, page } = await openPage(browser, byLabel('iphone'), URL, { reducedMotion: 'reduce' });
  const state = await page.evaluate(() => {
    const band = document.querySelector('.wf-offer-band--viscous');
    const visible = [...band.querySelectorAll('.wf-offer-band__track:not(.wf-offer-band__track--clone) .wf-offer-band__item')].filter((li) => !li.hidden).length;
    return { mode: band.className, visible, anim: getComputedStyle(band.querySelector('.wf-offer-band__track')).animationName, prev: !!band.querySelector('[data-wf-prev]') };
  });
  expect(state.mode).toContain('is-mode-swap');
  expect(state.visible).toBe(1);
  expect(state.anim).toBe('none');
  expect(state.prev).toBe(true);
  await context.close();
});

test('tap-to-apply links are well-formed', async ({ browser }) => {
  const { context, page } = await openPage(browser, byLabel('desktop'), URL);
  const hrefs = await page.evaluate(() => [...document.querySelectorAll('.wf-offer-band__track:not(.wf-offer-band__track--clone) .wf-offer-band__chip')].map((a) => a.getAttribute('href')));
  await context.close();
  expect(hrefs.length).toBeGreaterThan(0);
  for (const h of hrefs) expect(h).toMatch(/^\/discount\/[A-Za-z0-9%._~-]+\?redirect=%2F[A-Za-z0-9%._~-]*$/);
  expect(hrefs).toContain('/discount/QA%2520TEST%2525?redirect=%2F');
});

test('storefront header: no active offers → the band renders nothing', async ({ browser }) => {
  const { context, page } = await openPage(browser, byLabel('desktop'), '/');
  expect(await page.locator('.shopify-section-group-header-group wf-offer-band').count()).toBe(0);
  await context.close();
});
