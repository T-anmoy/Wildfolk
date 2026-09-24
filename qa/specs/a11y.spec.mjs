import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';
import { byLabel } from '../viewports.mjs';
import { routes } from '../routes.mjs';
import { openPage, scrollThrough, outDir, baselineDir } from '../lib.mjs';

// Baseline = serious/critical results of the first recorded run (per route × viewport).
// A test fails only when a serious/critical rule is new, or its node count grew.
for (const r of routes) {
  for (const vpLabel of ['iphone', 'desktop']) {
    test(`a11y ${r.key} @ ${vpLabel}`, async ({ browser }) => {
      const vp = byLabel(vpLabel);
      const { context, page } = await openPage(browser, vp, r.path);
      await scrollThrough(page, { pause: 30 });
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .exclude('#preview-bar-iframe')
        .analyze();
      await context.close();

      const serious = results.violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => ({ id: v.id, impact: v.impact, help: v.help, targets: v.nodes.map((n) => n.target.join(' ')) }));

      const file = `${r.key}--${vpLabel}.json`;
      fs.writeFileSync(outDir('a11y', file), JSON.stringify(serious, null, 2));

      const basePath = baselineDir('a11y', file);
      if (!fs.existsSync(basePath)) {
        fs.mkdirSync(path.dirname(basePath), { recursive: true });
        fs.writeFileSync(basePath, JSON.stringify(serious, null, 2));
        test.info().annotations.push({ type: 'baseline', description: `recorded ${serious.length} serious/critical rule(s)` });
        return;
      }
      const baseline = JSON.parse(fs.readFileSync(basePath, 'utf8'));
      const baseCount = Object.fromEntries(baseline.map((v) => [v.id, v.targets.length]));
      const regressions = serious.filter((v) => v.targets.length > (baseCount[v.id] ?? 0));
      expect(regressions, `New serious/critical a11y issues on ${r.path}:\n${JSON.stringify(regressions, null, 1)}`).toEqual([]);
    });
  }
}
