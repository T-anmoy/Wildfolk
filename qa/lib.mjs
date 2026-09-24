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
  const page = await context.newPage();
  if (onPage) onPage(page);
  const response = await page.goto(url, { waitUntil: 'load' });
  await settle(page);
  return { context, page, response };
}

export async function settle(page) {
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready.then(() => true));
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
