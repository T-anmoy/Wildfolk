import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const label = process.env.WF_QA_LABEL;
export const outDir = (...p) => {
  const dir = path.join(here, 'output', label, ...p);
  fs.mkdirSync(path.dirname(dir), { recursive: true });
  return dir;
};
export const baselineDir = (...p) => path.join(here, 'baselines', ...p);

export async function openPage(browser, vp, url, { reducedMotion = 'reduce', onPage } = {}) {
  const context = await browser.newContext({
    baseURL: process.env.WF_BASE_URL,
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.deviceScaleFactor,
    isMobile: browser.browserType().name() === 'firefox' ? undefined : vp.isMobile,
    hasTouch: vp.hasTouch,
    reducedMotion,
  });
  // shop.app (Shop Pay sign-in iframe injected by Shopify) can hang for minutes; it isn't theme code.
  await context.route(/^https:\/\/shop\.app\//, (route) => route.abort());
  const page = await context.newPage();
  if (onPage) onPage(page);
  // Third-party iframes Shopify injects (e.g. shop.app) can hang the load event;
  // wait for the DOM, then give 'load' a bounded chance.
  let response;
  // `theme dev` intermittently serves its own Polaris error page instead of the theme
  // (seen on the 404 route). Retry until the theme document (#MainContent) is served.
  // Also retries transient 502s from the dev server's upstream render.
  for (let attempt = 0; attempt < 5; attempt++) {
    response = await page.goto(url, { waitUntil: 'domcontentloaded' });
    if (await page.locator('#MainContent').count()) break;
    await page.waitForTimeout(2000 * (attempt + 1));
  }
  await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
  await settle(page);
  return { context, page, response };
}

export async function settle(page) {
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await hideDevOverlay(page);
}

// `shopify theme dev` occasionally injects a Polaris banner overlay (dev tooling only,
// never on the storefront). Hide it so it can't pollute overflow/screenshots.
export async function hideDevOverlay(page) {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('[class*="Polaris-"]')) {
      let top = el;
      while (top.parentElement && top.parentElement !== document.body) top = top.parentElement;
      if (top.parentElement === document.body && !top.matches('main, header, footer, .shopify-section, [id^="shopify-section"]')) {
        top.style.setProperty('display', 'none', 'important');
      }
    }
  });
}

export async function scrollThrough(page, { pause = 60 } = {}) {
  await page.evaluate(async (pause) => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.7));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, pause));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, pause * 3));
  }, pause);
}

export const slug = (s) => s.replace(/[^a-z0-9-]+/gi, '-');
