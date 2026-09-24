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
| PUSH-A | DONE | pushed 2490587..dbc1c8d | origin/main == HEAD (dbc1c8d). No Shopify bot commit after 95s. Live theme's wf-design-system.css pulled read-only = local. Live storefront password-protected. Gate: Theme Check 0 err/no new; after-phase-a-final 324/326 (2 = CLI error page, fixed in harness) + qa:quick 118/118 |
| B0 | DONE | (this commit) | before-phase-b baseline = after-phase-a-final (identical theme code). Plan v3 after 3 critique rounds: 5 CORE → 1 CORE → 0 CORE |
| B1 | DONE | 457e6bf | Story-panel layouts, origin landscape-led, hive typographic, process thread, reviews lead, journal, final-CTA newsletter, pre-launch integrity (wf-link-live, sample-product guard, no storefront placeholders) |
| B2 | DONE | c0a8e81, 4d93f3e | Product layer + field notes block + sticky bar. PDP NOT renderable (no product) — built to Craft markup/events, verified in code only |
| B3 | DONE | 2f5d572 | Header CTA (verified at 360/390/1440 via a temporary live link, reverted), drawer account link, footer brand |
| B4 | DONE | 0f15c86 | Blog/article layer; only the empty blog is visible (0 articles) |
| B5 | DONE | 9c8984a config, bff5a3f qa, review fixes + config follow-up | after-phase-b-final: 337 passed / 0 failed / 6 skipped (product-dependent). Theme Check 0 err / 9 warn (= baseline). Screenshot review by subagent (home all 10 viewports; our-story/blog/contact at 5) → 2 blockers + 7 majors fixed, re-verified |
| PUSH-B | DONE | pushed dbc1c8d..438dfcd | origin/main == HEAD (438dfcd). No bot commit after 95s. Live theme wf-design-system.css + templates/index.json pulled read-only = local. Gate: Theme Check 0 err/no new; after-phase-b-final 337 pass/0 fail/6 skip; qa:quick 129 pass/6 skip; launch gate OK (password on) |

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

- D10 (B0): Phase B plan went through 3 creative-director critique rounds (5 → 1 → 0 CORE). Spec-mandated items were kept over the critique where they conflicted (CLIENT-CONFIRM visible but styled, final-CTA newsletter, sticky bar, hero phone centring, process 2×2).
- D11 (B1): Pre-launch integrity: CTAs whose destination is empty or missing are hidden on the storefront (wf-link-live). Today the hero/final/header "Shop Honey" and "Meet the Story" are therefore hidden until a product is published and the Our Story page exists. The sample featured product is hidden outside the editor.
- D12 (B1): The above-fold spec asserts the CTA only when one is rendered (it's intentionally absent pre-launch); the headline is always asserted. Two cases were added (360×640, 844×390).
- D13 (B3): The phone account icon moves into the drawer (a new log-in link) to make room for "Shop". Craft's drawer had no account link.
- D14 (B5): The harness retries dev-server 502s and discovery 5xx (transient upstream render failures seen during the run). Keyboard spec follows focus into shadow roots (<shopify-account>).

## Screenshot review — after Phase A (home, our-story × 8 viewports)

- Improvements: placeholders visible (no more blank gaps); hero aligned to the header container and bottom-anchored; balanced 2-line headings instead of 4–5-line squeezes; 2-column splits from tablet; no overflow, clipping or hidden content anywhere.
- Intended: reviews/journal hidden while empty; hero secondary CTA hidden on landscape phones (spec 8.5).
- Carried to Phase B: the stock FAQ (collapsible-content) is a narrow centred column that doesn't align with wf sections; some 2-line paragraphs look ragged under `text-wrap: pretty`; the 360px hero is filled by its content (no breathing room); the "Example product title" placeholder wraps to 3 lines at 768.

## Screenshot review — after Phase B

- Home reads as one restrained editorial journey: charcoal → ivory → taupe → olive → ivory → charcoal → taupe → ivory → charcoal; amber only on buttons; the olive hive statement is the strongest beat. Clearly better than Phase A (no grey boxes, no sample t-shirt).
- Fixed after review: contact "Button label" default and "COLLABORATIO/NS" break; the phantom indent on text-led panels; the stray inset hairline; the hero void on tall phones/tablets; the hairline cutting into the contact form; the generic footer newsletter copy; hive lines ending in "·"; FAQ eyebrow/tracking; the footer bottom row alignment.
- Remaining (content/stock, logged for HUMAN/next phase): the contact page's three widths and duplicate "Contact"/"Let's talk." headlines (stock sections, content); Our Story shares home's skeleton until photography arrives; type doesn't grow beyond ~1920px; the final-CTA eyebrow repeats "Bring it to the table" (client copy); the footer menu contains only "Search" (store data).

## Open issues

- Commerce / add-to-cart / sticky-bar QA cannot exercise a real product. The specs skip with a note, and it's marked NOT VERIFIED.
