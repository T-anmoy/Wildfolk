import { defineConfig } from '@playwright/test';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

// Resolve once in the runner; workers inherit the env.
process.env.WF_BASE_URL ||= 'http://127.0.0.1:9292';
process.env.WF_QA_LABEL ||= new Date().toISOString().replace(/[:.]/g, '-');
if (!process.env.WF_QA_ROUTES) {
  process.env.WF_QA_ROUTES = execSync(`node ${path.join(here, 'discover.mjs')}`).toString();
  const { notes } = JSON.parse(process.env.WF_QA_ROUTES);
  for (const n of notes) console.log(`[qa] ${n}`);
}

const out = path.join(here, 'output', process.env.WF_QA_LABEL);

export default defineConfig({
  testDir: path.join(here, 'specs'),
  outputDir: path.join(here, '..', 'test-results'),
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: Number(process.env.WF_QA_WORKERS || 4),
  retries: 1,
  reporter: [['list'], ['json', { outputFile: path.join(out, 'results.json') }]],
  use: {
    baseURL: process.env.WF_BASE_URL,
    browserName: 'chromium',
    navigationTimeout: 60_000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    // Optional iOS-Safari proxy: WF_QA_WEBKIT=1 npm run qa:overflow
    ...(process.env.WF_QA_WEBKIT
      ? [{ name: 'webkit', use: { browserName: 'webkit' }, testMatch: /overflow\.spec/ }]
      : []),
  ],
});
