// Runs Theme Check and compares warnings with the recorded baseline. Exit 1 on any error or new warning.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const baseline = JSON.parse(fs.readFileSync(new URL('./baselines/theme-check-before-phase-a.json', import.meta.url)));
let raw;
try { raw = execSync('npx shopify theme check --output json', { stdio: ['ignore', 'pipe', 'ignore'] }).toString(); }
catch (e) { raw = e.stdout.toString(); }
const cwd = process.cwd() + '/';
const now = JSON.parse(raw).flatMap((f) => f.offenses.map((o) => ({ file: f.path.replace(cwd, ''), check: o.check, severity: o.severity })));
const key = (o) => `${o.file}|${o.check}`;
const baseKeys = baseline.map(key);
const errors = now.filter((o) => o.severity === 0 || o.severity === 'error');
const fresh = now.filter((o) => { const i = baseKeys.indexOf(key(o)); if (i === -1) return true; baseKeys.splice(i, 1); return false; });
console.log(`Theme Check: ${now.length} offenses (${errors.length} errors); baseline ${baseline.length}; new: ${fresh.length}`);
for (const o of fresh) console.log('  NEW', o.severity, o.file, o.check);
process.exit(errors.length || fresh.length ? 1 : 0);
