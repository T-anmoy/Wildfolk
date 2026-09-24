# WILDFOLK — Autopilot progress log

Resume rule: rerun the autopilot prompt; it resumes from the first milestone not marked DONE.

## Environment facts (discovered 2026-09-24)

- Preview server: `http://127.0.0.1:9292` was already running at start (HTTP 200).
- Shopify CLI: authenticated (`theme list` works).
- Themes: `Wildfolk/main` #213565833469 is **[live]** (GitHub-connected). Storefront `/` → 302 `/password` → password protected → pushing permitted (§5.1.2).
- Store data: **zero products published to Online Store** (`/products.json` empty, `frontpage` collection has 0 products, `/collections/all` empty). Blog `news` exists with **zero articles**.

## Milestones

| ID | Status | Commits | Notes |
|---|---|---|---|
| P0 | DONE | 582c019 docs, 44a9877 config | CTAs → catalog (no product); journal → news; bee-guide last; scheme-2 label charcoal |
| A0 | DONE | — | All 6 audit code findings confirmed. Theme Check baseline 0 err / 9 warn (stock) → qa/baselines/theme-check-before-phase-a.json |
| A1 | DONE | 7bab7c4 | before-phase-a: 322 pass / 4 fail (above-fold ×2, motion-smoke ×2 — expected) |
| A2 | DONE | 0094314 media, f4bc96e hero, 1ce2b44 motion, cd4ee7f sections | CSS loading: wf-home.css merged into global wf-design-system.css |
| A3 | DONE | 5f412e9 | Verified: 0 rAF/s idle, quiet over product-info, hidden <990px |
| A4 | DONE | bbd8040 layout, 1171350 + next qa hardening | Hero above-fold passes at 1280×720 / 1366×768 |
| A5 | DONE | — | Theme Check 0 err / 9 warn (= baseline). after-phase-a-final: 324/326, the 2 failures = CLI dev error page on the 404 route (not theme) → harness retries; 404 overflow 72/72 on repeat. Screenshots reviewed (subagent + own spot checks) |
| PUSH-A | TODO | | |
| B0 | TODO | | |
| B1 | TODO | | |
| B2 | TODO | | |
| B3 | TODO | | |
| B4 | TODO | | |
| B5 | TODO | | |
| PUSH-B | TODO | | |

## Decisions

- D1 (P0): No product exists, so `featured-product.product` is left unset. Hero / final-CTA links (home + Our Story) point to `shopify://collections/all` so they stop rendering as dead buttons, and they will list the honey automatically once it's published. HUMAN: create/publish the product, then optionally repoint CTAs at the product.
- D2 (P0): The `news` blog exists (empty), so `wf-journal` → `blog: news`. The section hides itself when there are no articles (Phase A empty-state).
- D3: The root-level `settings.local.json` is an untracked local Claude permissions file (duplicate of `.claude/settings.local.json`), so it's gitignored and not committed.

- D4 (P0/A1): `/pages/our-story` and `/pages/faq` do not exist as store pages (404) although the menu links Our Story. QA renders their templates through `/pages/contact?view=our-story|faq`. HUMAN: create the pages.
- D5 (A2): Design-mode notices (reviews/journal) are hard-coded English: merchant-only, and adding locale keys would need all 51 locale files (MatchingTranslations).
- D6 (A2): The final layout CSS landed with the sections commit (cd4ee7f) because the new reviews/journal/process class names depend on it. The A4 commit carries the remaining markup migrations and the hero/placeholder refinements.
- D7 (A4): The hero min-height is `clamp(44rem, min(88svh, 100svh - 18rem), 100rem)` (not the literal 52rem/88svh) so the hero fills the first screen *below* the ~176px header. Short screens (≥750w, ≤820h) tighten the stack. This is required to pass the above-fold check at 1280×720 / 1366×768.
- D8 (A4): The placeholder fill is scheme-aware (`rgba(foreground, .08)`) so it reads on taupe/charcoal sections as well as ivory. `.wf-media.wf-media--placeholder` defeats Craft's `div:empty{display:none}`.
- D9 (A3): The bee initialises at the computed position for the current scroll (equal to the first waypoint at the top of the page), so there's no fly-in even when the page reloads mid-scroll.

## Screenshot review — after Phase A (home, our-story × 8 viewports)

- Improvements: placeholders visible (no more blank gaps); hero aligned to the header container and bottom-anchored; balanced 2-line headings instead of 4–5-line squeezes; 2-column splits from tablet; no overflow, clipping or hidden content anywhere.
- Intended: reviews/journal hidden while empty; hero secondary CTA hidden on landscape phones (spec 8.5).
- Carried to Phase B: the stock FAQ (collapsible-content) is a narrow centred column that doesn't align with wf sections; some 2-line paragraphs look ragged under `text-wrap: pretty`; the 360px hero is filled by its content (no breathing room); the "Example product title" placeholder wraps to 3 lines at 768.

## Open issues

- Commerce / add-to-cart / sticky-bar QA cannot exercise a real product. The specs skip with a note, and it's marked NOT VERIFIED.
