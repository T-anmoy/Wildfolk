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
| C0 | DONE | (log) | Attempt 3: `honey` now **available** (₹999, 1 variant, 1 image). Real add-to-cart via main button + sticky bar pass (5/5). Metafields `wildfolk.*` empty; description empty; our-story/faq 404; no gift-wrap product; INPUTS blank except RETURNS_SUMMARY. before-phase-c baseline = earlier run (379/4) + the 4 owner fixes (see resume attempt 2) |
| C1 | IN PROGRESS | | |
| C2 | TODO | | |
| C3 | TODO | | |
| C4 | TODO | | |
| C5 | TODO | | |
| C6 | TODO | | |
| PUSH-C | TODO | | |

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


## Phase C — C0 pre-flight (2026-09-24)

Environment: git clean, `main` = `origin/main` (ad45616), `pull --ff-only` up to date. The preview server was down; restarted with `npx shopify theme dev` (worked without `WF_STORE_PASSWORD`, which is not set in the agent environment). Theme Check 0 errors / 9 warnings (= baseline). `docs/prompts/C2_PHASE_C_PUSH.md` **does not exist** (the only Phase C file is untracked `docs/C1_PHASE_C_PROMPT.md`).

| Check | Result |
|---|---|
| Product exists | ✅ `/products/honey` — title "HONEY", vendor Wildfolk, 1 image, 1 variant "Default Title" ₹999.00, weight 500 g |
| Product active **and purchasable** | ❌ `available: false` (product + variant) → storefront shows *Sold out*. Likely inventory tracked at 0 without "continue selling". |
| Has variants | ⚠️ single default variant only (no size variants) |
| Has media | ✅ 1 image |
| `wildfolk.*` product metafields | ❌ none readable (`product.metafields.wildfolk` = `{}`) |
| `wildfolk.net_weight_g` variant metafield | ❌ blank |
| Gift-wrap product tagged `wf-hidden` | ❌ not found (`/products.json` has only `honey`) |
| `/pages/our-story` | ❌ 404 |
| `/pages/faq` | ❌ 404 |
| Policies | ✅ refund, shipping, privacy, terms all exist (`/policies/*`) |
| Journal articles | ❌ 0 in `news` |
| Money format | `Rs. {{amount}}` (store setting; consider `₹{{amount}}`) |

INPUTS parsed: every value is **blank** except `RETURNS_SUMMARY` = "No returns on honey. Replacement only if the product arrives damaged." All inputs-driven features would ship hidden: Filling Jar (no threshold), multi-jar nudge, COD, tax line, dispatch time, damage window, FSSAI, seller details, grievance officer, pincode zones, offers.

Decision: **STOP after C0** (the Phase C rule: "If no active, purchasable honey product exists … STOP after C0 … switching the cart to drawer mode and shipping untested cart code is not acceptable"). No theme code or configuration was changed. The temporary metafield debug output was reverted and never committed.

Baseline `before-phase-c` (the product route now exists): **379 passed / 4 failed / 0 skipped**, 16.4 min. The previously skipped product specs now run. The 4 failures are pre-existing issues exposed by the product's arrival, and Phase C's C2 (on resume) must fix them:
- `above-fold hero @ phone-landscape`: the hero CTA now renders (the catalogue has a product) and its bottom sits at 491px on an 844×390 screen. The landscape-phone hero needs a tighter stack.
- `keyboard product @ iphone/desktop`: Craft's `product__media-toggle` ("Open media 1 in modal") receives focus while visually hidden. This is stock Craft markup; fix it with a focus-visible style or a small wf CSS reveal-on-focus.
- `tap-targets product @ iphone`: 58 items flagged as "wf". This is a **harness misclassification**: on the PDP, `body.wf-sticky-buy-open` makes every element match `[class*="wf-"]`. The classifier must ignore `body`/`html` classes. Real wf targets must be re-checked after that fix.
- Commerce/sticky-bar specs ran against a sold-out product, so they exercised only the disabled path. Real add-to-cart is still NOT VERIFIED.

To resume Phase C, the owner must:
1. Make the honey purchasable: Admin → Products → HONEY → Inventory → set a quantity at the location (or tick "Continue selling when out of stock"), status Active, sales channel Online Store.
2. Fill INPUTS in `docs/C1_PHASE_C_PROMPT.md`, at least `FREE_SHIPPING_THRESHOLD_INR` (must equal Settings → Shipping), `PRICES_INCLUDE_TAX`, `COD_AVAILABLE`, `DISPATCH_TIME_TEXT`, `DAMAGE_CLAIM_WINDOW`, `FSSAI_LICENCE_NO` and the seller/grievance details.
3. Create metafield definitions (Admin → Settings → Custom data → Products / Variants, namespace `wildfolk`, including variant `wildfolk.net_weight_g` as an integer) and fill them.
4. Optional: create a "Gift wrap" product tagged `wf-hidden`.
5. Create the pages Our Story (template `page.our-story`) and FAQ (template `page.faq`).
6. Add `docs/prompts/C2_PHASE_C_PUSH.md` (push protocol), or confirm the Phase B push protocol applies.
Then rerun the Phase C prompt; it resumes at C0 (re-verify) → C1.

### Phase C — resume attempt 2 (2026-09-24)

- Re-verified C0: `/products/honey.js` (cache-busted) still reports `available: false` on the product and its only variant; the PDP renders "Sold out". `/pages/our-story` and `/pages/faq` are still 404. INPUTS are unchanged (all blank except `RETURNS_SUMMARY`). `docs/prompts/C2_PHASE_C_PUSH.md` is still missing. **The hard stop stands: C1–C6 and PUSH-C were not run.**
- Owner-requested before-phase-c fixes (local commits, not pushed):
  1. ✅ Hero CTA above the fold at 844×390: two-column landscape hero (CTA bottom 346px < 390).
  2. ✅ Craft `product__media-toggle`: **kept focusable** (it's the only keyboard route to the lightbox; making it unfocusable would be an a11y regression). It now has a real box and a visible outline, via `wf-product.css`. No stock file touched.
  3. ✅ The tap-target classifier ignores `<body>`/`<html>` classes.
  4. ⛔ Commerce + sticky-bar specs now perform a **real** add to cart and **fail** when the product isn't purchasable (3 failing, correctly). They'll pass once Shopify reports the product available.
- Targeted run: above-fold, keyboard, tap-targets pass (19); commerce ×2 + sticky real-add fail on `available: false`.

### Phase C — resume attempt 3 (2026-09-24)
- C0 passes: the product is purchasable. Decision D-C1: `docs/prompts/C2_PHASE_C_PUSH.md` does not exist, so PUSH-C follows `docs/prompts/02_PHASE_B_PUSH.md` steps plus the autopilot gates (live-theme safety, remote check, no force, no theme push/publish).
- Decision D-C2: before-phase-c baseline is not re-run in full. The earlier run (379 pass / 4 fail, same theme code apart from the 4 owner-requested fixes) stands, and the fixes are verified by targeted runs. The after-phase-c full matrix is the regression gate.
