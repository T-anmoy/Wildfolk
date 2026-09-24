# Wildfolk responsive QA harness

Playwright + axe-core checks across 18 viewports, run against the local theme preview.

## Run

1. Start the preview in another terminal:
   `npx shopify theme dev --store 8jvdhd-c3.myshopify.com --store-password "$WF_STORE_PASSWORD"`
2. From the repo root:

| Command | What |
|---|---|
| `npm run qa` | full matrix (all specs × 18 viewports) |
| `npm run qa:quick` | 390×844, 844×390, 1024×768, 1440×900, 2560×1080 only |
| `npm run qa:a11y` | axe-core only |
| `npm run qa:overflow` | horizontal overflow only |
| `npm run qa:themecheck` | Theme Check compared with `qa/baselines/theme-check-before-phase-a.json` |

Env: `WF_BASE_URL` (default `http://127.0.0.1:9292`), `WF_QA_LABEL` (output folder, default timestamp),
`WF_QA_WORKERS` (default 4), `WF_PRODUCT_HANDLE` / `WF_BLOG_HANDLE` (fallbacks for discovery),
`WF_QA_WEBKIT=1` (adds a WebKit overflow pass as an iOS Safari proxy).

Output: `qa/output/<label>/<route>/<viewport>.png`, `a11y/*.json`, `tap-targets/*.json`, `results.json`.

## Specs

- `screenshots` — full-page PNG per route × viewport (reduced motion, fonts ready, lazy images loaded).
- `overflow` — `scrollWidth` must not exceed the viewport; lists offending elements.
- `a11y` — axe (WCAG 2.2 AA tags) at 390×844 and 1440×900. Fails only on serious/critical rules that are
  new or grew versus `qa/baselines/a11y/` (recorded on the first run).
- `tap-targets` — 390×844; reports < 44×44 targets; fails only for `wf-*`.
- `media` — hero priority, `wf-media` srcset validity, mobile download size.
- `console` — fails on errors from `wf-*` assets.
- `motion-smoke` — reveals finish, transitions are real, one bee on desktop, no bee on touch phones.
- `above-fold` — hero h1 + primary CTA visible without scrolling at 1280×720 and 1366×768.

Routes are discovered from the preview (`qa/discover.mjs`); the product handle is never hard-coded.

Notes: the harness hides the `shopify theme dev` Polaris overlay (dev tooling, never on the storefront) and
aborts `shop.app` requests (Shopify's Shop Pay iframe, which can hang the load event). Neither is theme code.
