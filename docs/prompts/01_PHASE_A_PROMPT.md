# WILDFOLK — PHASE A: FOUNDATION
## Claude Code prompt · repo `wildfolkgithub` · branch `main` · store `8jvdhd-c3.myshopify.com`

You are the lead Shopify theme engineer, responsive-systems engineer and QA lead for WILDFOLK. `CLAUDE.md` (the Master Operating System) governs everything here; re-read sections 02, 09, 15, 22, 24–30 and 33 before starting. The first-session audit is at `docs/WILDFOLK_AUDIT_01.md`. **Treat the audit as leads to verify, not as truth.** Confirm every finding in the current code before changing it.

Think hard before each milestone. Keep a todo list, and update it as you go.

---

## 1. Mission

Make the existing storefront **correct, fast and structurally responsive at every viewport and aspect ratio**, without redesigning compositions (that is Phase B). At the end of Phase A:

- every Wildfolk image loads the right file at the right size, with the right crop;
- motion works as designed, never hides content, and never runs when it shouldn't;
- every `wf-*` section sits on a shared responsive layout system instead of a 620px strip;
- a repeatable automated QA harness proves all of this across 18 viewports.

## 2. Hard boundaries (Phase A)

- **Do not push.** Commit locally in the logical commits listed in §9. The owner pushes with a separate checklist.
- **Do not edit** `templates/*.json`, `sections/*-group.json`, `config/settings_data.json` or `locales/en.default.json`. These are Theme Editor territory. If a change there is needed, add it to the **THEME EDITOR FOLLOW-UP** list in your report.
  - **Only exception:** adding brand-new translation keys to `locales/en.default.json`. If you must, keep the Shopify comment header intact, change nothing else in the file, and mention it in the report.
- **Do not modify stock Craft files** except `layout/theme.liquid`, which is allowed only for the `theme-color` meta in §6.9. Stock Craft sections, snippets, `base.css` and the native commerce JS stay untouched in Phase A.
- **No new runtime dependencies in the theme.** The dev-only dependencies for the QA harness (§5) are allowed.
- **No composition redesign, no new visual features, no bee visual redesign.** Phase B handles those.
- **No invented content.** Leave every `[CLIENT-CONFIRM: …]` placeholder as it is.
- **The Theme Editor must keep working.** Existing section instances must render identically or better with their current saved settings.
  - Remember that a new schema setting is read as its `default` on every existing instance that lacks the key. Choose defaults deliberately.

## 3. Stop conditions

Stop and report instead of improvising if any of these happen:

- `git pull --ff-only` fails, or the working tree is dirty at start;
- the preview server at `http://127.0.0.1:9292` is unreachable and you cannot proceed without it. In that case, ask the owner to start `npx shopify theme dev --store 8jvdhd-c3.myshopify.com --store-password "<pw>"` in another terminal, then continue;
- Theme Check reports an error you cannot resolve within scope;
- a fix would require editing a file in the §2 forbidden list.

---

## 4. Milestone A0 — Pre-flight and verification

1. Run:
   ```
   git status
   git branch --show-current
   git remote -v
   git fetch origin
   git pull --ff-only
   git log --oneline --decorate -15
   ```
2. **Verify the owner's Theme Editor pre-flight** by reading the pulled JSON (read only), and report ✅/❌ for each item:
   - `wf-bee-guide` is **not** the first entry in `templates/index.json` `order`;
   - `featured-product` has a `product` setting;
   - hero `button_link` and final-CTA `button_link` are set (home and `page.our-story.json`);
   - scheme-2 `button_label` is not `#F5F0E6`;
   - a logo is set.

   If any are ❌, continue anyway: the code fixes are independent. List the missing items at the top of your final report.
3. **Re-verify the audit's code findings** before touching anything, and note any that no longer hold:
   - `wf-media` iterates a string for srcset;
   - the `calc(var(--wf-duration-reveal) * 1ms …)` and drift `calc` are invalid;
   - `.wf-hero` places its body in the `auto` row;
   - `--wf-content-width: 62rem` is applied to layouts;
   - process richtext is output inside a `<p>`;
   - the bee rAF loop never idles.
4. Record Theme Check as the baseline, and save the exact warning list for comparison:
   ```
   npx shopify theme check
   ```

## 5. Milestone A1 — QA harness first (captures the "before" state)

Build this **before** fixing anything so the baseline is real.

### 5.1 Setup

- Add `@playwright/test` and `@axe-core/playwright` as devDependencies in the root `package.json`, alongside the existing `@shopify/cli`.
- Install Chromium with `npx playwright install chromium`. Add WebKit as an optional project if it installs cleanly, since it is the closest proxy for iOS Safari.
- Put everything under `qa/`:
  - `playwright.config.*`
  - `qa/viewports.*`
  - `qa/routes.*`
  - `qa/specs/*.spec.*`
  - `qa/README.md` (how to run it)
- Add `qa/output/`, `test-results/` and `playwright-report/` to `.gitignore`.
- Base URL comes from `WF_BASE_URL`, defaulting to `http://127.0.0.1:9292`. The output label comes from `WF_QA_LABEL`, defaulting to a timestamp.
- Add npm scripts:
  - `qa`: full matrix
  - `qa:quick`: 390×844, 844×390, 1024×768, 1440×900, 2560×1080 only
  - `qa:a11y`
  - `qa:overflow`

### 5.2 Viewport matrix (`qa/viewports.*`)

| Label | Size |
|---|---|
| sm-phone | 360×640 |
| iphone-se | 375×667 |
| iphone | 390×844 |
| iphone-pro | 393×852 |
| android | 412×915 |
| iphone-max | 430×932 |
| phone-landscape | 844×390 |
| ipad-mini | 768×1024 |
| ipad-air | 820×1180 |
| ipad-pro11 | 834×1194 |
| tablet-landscape | 1024×768 |
| ipad-pro13 | 1024×1366 |
| laptop-short | 1280×720 |
| laptop-hd | 1366×768 |
| desktop | 1440×900 |
| fullhd | 1920×1080 |
| ultrawide | 2560×1080 |
| qhd | 2560×1440 |

Phone entries use `isMobile: true`, `hasTouch: true` and a device scale factor of 2 or 3.

### 5.3 Routes (`qa/routes.*`)

- `/`
- the product page
- `/pages/our-story`
- `/pages/faq`
- `/pages/contact`
- `/cart`
- `/search?q=honey`
- `/this-page-does-not-exist` (the 404)
- the first blog, if it exists

**Discover the product handle; never hard-code it.** Try the first product link on `/collections/all`, then `/products.json`, then the `WF_PRODUCT_HANDLE` env var. Skip gracefully, with a logged note, when a route doesn't exist.

### 5.4 Specs

1. **`screenshots`** — a full-page PNG for every route × viewport, saved to `qa/output/<label>/<route>/<viewport>.png`.
   - Emulate `reducedMotion: 'reduce'` so shots are deterministic.
   - Wait for `networkidle` and for fonts (`document.fonts.ready`).
   - Scroll the page top to bottom once before the shot so lazy images load.
2. **`overflow`** — per route × viewport, assert `document.documentElement.scrollWidth <= innerWidth`.
   - On failure, list the offending elements (tag, classes, section id, right edge) for any element whose `getBoundingClientRect().right > innerWidth + 1` that isn't inside an intentional scroll container.
3. **`a11y`** — axe-core on every route at 390×844 and 1440×900.
   - Fail on `serious` or `critical` issues that are **new relative to the baseline JSON**. Store the baseline in `qa/output/<label>/a11y.json`. Pre-existing stock-Craft issues are reported, not failed.
4. **`tap-targets`** — at 390×844, report visible interactive elements under 44×44 CSS px, grouped as `wf-*` vs stock. Fail only for `wf-*` elements.
5. **`media`** — on `/` at 390×844 and 1440×900, check that:
   - the hero `<img>` has `loading="eager"` and `fetchpriority="high"`;
   - every `.wf-media__img` has a srcset with at least 2 candidates, all with a valid `w` descriptor, and every URL returns 200;
   - on phones, the `currentSrc` width is at most 3× the rendered width × DPR.
   - If no images are uploaded yet, the spec passes with a "no images to verify" note.
6. **`console`** — on every route at 1440×900, collect `pageerror` and `console.error`. Fail on any error originating from a `wf-*` asset.
7. **`motion-smoke`** — on `/` at 1440×900 **without** reduced motion, scroll through the page and check:
   - `[data-wf-reveal]` elements end as `.is-visible`;
   - the computed `transition-duration` on a reveal element is greater than 0;
   - the bee element exists once.

   At 390×844 with `hasTouch`, check that the bee is not rendered or is hidden.

### 5.5 Baseline

Run `WF_QA_LABEL=before-phase-a npm run qa`. Some specs are *expected* to fail on the baseline (media, motion-smoke); record those results as the "before" evidence. **Do not weaken assertions to make the baseline pass.**

---

## 6. Milestone A2 — Critical fixes

For each fix, confirm the bug in code first, then apply the smallest correct change.

### 6.1 `snippets/wf-media.liquid` (srcset, sizes, focal point, placeholder)

- Build widths with `| split: ','`. Only emit candidates `<= img.width`, and always include `img.width` itself when it is smaller than the largest candidate. `src` uses `min(1500, img.width)`. Apply the same logic to the mobile `<source>`.
- Accept a `sizes_mobile` parameter (default `100vw`) for the mobile `<source>`. Keep `sizes_attr` for desktop.
- **Focal point:** read the merchant-set focal point for both the desktop and mobile image and apply it as `object-position` (via an inline `style` custom property such as `--wf-focal`, consumed in CSS). Fall back to `50% 50%`.
  - **Verify the exact Liquid API** (`image.presentation.focal_point`) against shopify.dev documentation or Theme Check's Liquid schema before using it. If it can't be verified, implement the custom property with a fallback only, and report it.
- **Placeholder:** keep the element for layout stability, but make it `aria-hidden="true"` with no accessible name. Style it in CSS as a quiet taupe field (a token, not a hard-coded hex). Make the placeholder selectors in `wf-home.css` actually match; they currently target a compound selector that never matches.
- Keep the existing call-site API backward compatible.

### 6.2 `sections/wf-hero.liquid` (LCP)

- Add a checkbox setting: *Prioritise image loading*, default `true`, with info text "Keep on when this hero is the first visible section." Treat the image as the LCP candidate when `section.settings.priority_load` is true **or** `section.index == 1`.
- Remove `data-wf-reveal` from the hero `h1`, body copy and actions. The hero's most important text must never wait for JS or sit at `opacity: 0`.
  - If an entrance is kept, make it **CSS-only, transform-based (no opacity-from-zero on text), and gated by `prefers-reduced-motion: no-preference`**.

### 6.3 Motion CSS (`assets/wf-design-system.css`)

- Fix the reveal transition: `calc(var(--wf-duration-reveal) * var(--wf-motion-scale))`. Apply the equivalent fix to drift.
- **Reveal must never hide content without JS.** Gate the hidden starting state behind `@media (scripting: enabled)`, keeping the existing reduced-motion, minimal-mode and design-mode escapes.
- **Drift and reveal both write `transform`.** Separate them so no single element carries both:
  - in `sections/wf-origin.liquid`, reveal goes on the wrapper and drift on an inner element;
  - check `wf-hive` for the same issue.
- Pause drift offscreen, as today, and honour `--wf-motion-scale`.

### 6.4 `assets/wf-motion.js`

- Guard against the double `initWithin(document)`. Elements already in the viewport on init become visible immediately, with no delay.
- Keep the Theme Editor event handling intact.

### 6.5 `sections/wf-process.liquid`

- Output richtext inside a `<div class="wf-body rte">`, not a `<p>`.
- Don't render an empty `<ol>`.
- Move every inline `style=""` into `wf-home.css` classes.

### 6.6 `sections/wf-reviews.liquid`

- Give it its own class names; stop borrowing `wf-process__*`. Move inline styles to CSS.
- **Empty state:** with zero blocks, render nothing on the storefront. When `request.design_mode` is true, show a short merchant-only notice explaining that the section is hidden until genuine reviews are added.

### 6.7 `sections/wf-journal-feature.liquid`

- With no blog or no articles, render nothing on the storefront, and show a design-mode-only notice in the editor.
- Guard the blank heading.
- Use `alt=""` on images inside title-bearing links, to avoid duplicate announcements.
- Style card links (colour inherits, underline on the title only on hover/focus, with a visible focus ring).
- Move inline styles to CSS.

### 6.8 CSS loading

`wf-home.css` is currently linked once per section. Load it once per page with a clean, Theme-Editor-safe approach, and justify your choice in the report. Do not let any `wf-*` section render unstyled when added alone to another template.

### 6.9 `layout/theme.liquid`

Set `<meta name="theme-color">` from the first colour scheme's background. This is the only change to this file.

## 7. Milestone A3 — Bee engine hardening (behaviour only; the look is unchanged)

In `assets/wf-bee.js` and `assets/wf-bee.css`:

1. **Idle.** Stop the rAF loop when the bee has converged (position delta < 0.5px and angle delta < 0.5°), and add an `is-idle` class that pauses the wing animation. Restart on scroll, resize or remeasure.
2. **Geometry.** Re-measure waypoints with a `ResizeObserver` on the document element, coalesced to one measure per frame, plus after `document.fonts.ready` and `window.load`.
3. **Orientation.** The SVG head points up. Correct the heading (e.g. `angle + 90`) and verify it visually by moving in all four directions.
4. **No fly-in.** Initialize `current` at the first waypoint's position.
5. **Capability gate.** Enable only when `(min-width: 990px) and (pointer: fine)` and reduced motion is off, the Theme Editor is inactive, and the mode is not "minimal". Listen for changes to those media queries and cleanly init/destroy (including removing listeners).
6. **Remove pointer attraction entirely.** The brief rules out a bee that follows the user.
7. **Quiet zones.** When the viewport's central band overlaps the purchase area, fade the bee to `opacity: 0` and stop rendering.
   - The purchase area is the featured product or main product. Inspect Craft's markup to find a robust hook (for example a `product-info` element or a stable section class). Also support an explicit `[data-wf-bee-quiet]` attribute for future sections.
8. **Static fallback.** Fix or remove the dead `placeAtFirstScene` viewport/absolute mismatch.
9. Keep the `computeState` / `renderDom` separation and the single-instance guarantee.

## 8. Milestone A4 — Responsive foundation (structure, not composition)

Goal: every `wf-*` section works as a deliberate composition from 360px to 2560×1080, using tokens and container queries. **Stock Craft sections are not touched.**

### 8.1 Tokens (`wf-design-system.css`)

- **Widths:**
  - `--wf-measure` (reading measure, ~62–68ch)
  - `--wf-content` (tie to Craft's `--page-width`)
  - `--wf-wide` (~144rem)
  - `--wf-gutter` (fluid, e.g. `clamp(1.6rem, 4vw, 6.4rem)`)
- **Fluid space scale:** replace the fixed `--wf-space-*` values with `clamp()` equivalents, keeping the names so call sites don't break.
- **Fluid type scale:** display, xl, lg, body and eyebrow. Use `clamp()` with container-relative units (`cqi`) where a container exists and viewport units otherwise. Keep hard minimums and maximums so nothing overflows at 360px or balloons at 2560px. **Do not touch Craft's `h1`–`h5`.**
- Add `text-wrap: balance` on `.wf-heading` and `text-wrap: pretty` on `.wf-body`.
- Add safe-area tokens `--wf-safe-bottom: env(safe-area-inset-bottom, 0px)` for Phase B.

### 8.2 Breakout grid primitive (`.wf-grid`)

A named-line grid with `full`, `wide` and `content` tracks. Children default to `content`, and opt into `wide` or `full-bleed` via utility classes. Reading text is constrained with `.wf-measure` (`max-width: var(--wf-measure)`).

Reference shape (adapt as needed):

```css
.wf-grid {
  display: grid;
  grid-template-columns:
    [full-start] minmax(var(--wf-gutter), 1fr)
    [wide-start] minmax(0, calc((var(--wf-wide) - var(--wf-content)) / 2))
    [content-start] min(100% - 2 * var(--wf-gutter), var(--wf-content))
    [content-end] minmax(0, calc((var(--wf-wide) - var(--wf-content)) / 2))
    [wide-end] minmax(var(--wf-gutter), 1fr)
    [full-end];
}
```

Verify it at 360px (no overflow, gutters intact) and at 2560px (content centred, only full-bleed layers grow).

### 8.3 Container queries

Each `wf-*` section root becomes `container: wf-section / inline-size`. Internal layout switches (stacked → split) use `@container wf-section (…)`, **not** viewport media queries, so sections behave correctly wherever a merchant places them. Viewport media queries remain only for truly viewport-bound concerns: height, orientation, aspect ratio, pointer and hover.

### 8.4 Migrate existing `wf-*` sections onto the system, keeping compositions the same

- **Two-column layouts** (story panel, origin, journal) use the `content` track, and their copy uses `.wf-measure`. This removes the 620px strip. **The layouts are unchanged**; they simply get correct room.
- **Process steps:** a single column when narrow, 2×2 in a mid-width container, and 4 columns when wide. Use container widths, not `auto-fit` guesswork.
- **Hive and final CTA:** centred text on `.wf-measure`.

### 8.5 Hero rules

- Use a single-cell stacked grid (media, scrim and body share one area). The body is anchored **bottom-start** on wide containers and **bottom-centre-safe** on phones. This fixes the top-anchored bug.
- **Height:** `min-height: clamp(52rem, 88svh, 100rem)`. Never use `100vh`.
  - `@media (orientation: landscape) and (max-height: 560px)`: content-height hero, reduced display size, secondary CTA hidden.
  - `@media (min-aspect-ratio: 21/9)`: cap the height so the photo isn't sliced thin.
  - At 1280×720 and 1366×768, the headline and primary CTA must be fully visible without scrolling. Assert this in a new harness check.
- **Text colour comes from the colour scheme.** The scrim renders only when an image exists. With no image and a light scheme, the text must stay readable (contrast ≥ 4.5:1 for body, ≥ 3:1 for large display).

### 8.6 Art direction

- Add an optional **mobile image** setting to `wf-story-panel` and `wf-origin`, passed through `wf-media`. It is optional, so existing instances are unaffected.
- Set media aspect ratios per container size with custom properties (for example portrait-leaning on narrow containers, landscape-leaning on wide ones). Combined with focal points, this gives intentional crops at every ratio.
- Write accurate `sizes` for each call site to match the new layout.

### 8.7 Input

- `wf-*` interactive elements meet 44×44 tap targets on coarse pointers.
- No essential behaviour depends on hover.
- Focus states are visible on every `wf-*` link and button.

---

## 9. Milestone A5 — Validate, commit, report

### 9.1 Validation (all required)

1. `npx shopify theme check`: **0 errors**, and no warnings beyond the §4 baseline list.
2. Liquid and schema sanity: every `wf-*` schema is valid JSON with unique setting IDs, and new settings have labels, info text and sensible defaults.
3. `WF_QA_LABEL=after-phase-a npm run qa`:
   - overflow is zero on every route × viewport touched by `wf-*` code;
   - media passes (or notes "no images");
   - motion-smoke passes;
   - console shows zero `wf-*` errors;
   - a11y shows no new serious or critical issues;
   - `wf-*` tap targets pass;
   - the hero above-fold check passes at 1280×720 and 1366×768.
4. **Look at the screenshots yourself.** Open and inspect at least `/` and `/pages/our-story` at these viewports:
   - sm-phone
   - iphone
   - phone-landscape
   - ipad-mini
   - tablet-landscape
   - laptop-short
   - desktop
   - ultrawide

   Describe what you see, compare against `before-phase-a`, and fix anything broken before continuing.
5. Test the Theme Editor behaviour in code: section load, unload and reorder handlers still work, the bee is hidden in design mode, and the empty-state notices appear only in design mode.

### 9.2 Commits (local only, in this order)

1. `docs: add operating system and audit` (only if `CLAUDE.md` / `docs/` are untracked)
2. `chore(qa): add Playwright responsive QA harness`
3. `fix(media): correct wf-media srcset, add focal point and mobile sizes`
4. `fix(hero): prioritise LCP image and never hide hero text`
5. `fix(motion): repair reveal/drift timing and no-JS safety`
6. `fix(sections): process markup, reviews/journal empty states, inline styles`
7. `perf(bee): idle loop, resize-aware geometry, capability gating, quiet zones`
8. `feat(layout): Wildfolk responsive foundation — tokens, breakout grid, container queries, hero rules, art direction`

Before each commit: `git status` and `git diff --stat`, staging only the relevant files, never `git add -A` blindly. **Do not push.**

### 9.3 Final report

Use `CLAUDE.md` §44 format, plus these extra sections:

- **PRE-FLIGHT STATUS:** the ✅/❌ list from §4.2.
- **AUDIT FINDINGS:** confirmed, fixed, or no longer applicable.
- **BEFORE → AFTER:** QA summary as a table of spec × pass/fail counts, with the most important screenshot observations.
- **THEME EDITOR FOLLOW-UP:** exact clicks the owner should make (e.g. enable a mobile image, set focal points on uploaded photos).
- **NOT VERIFIED:** real iOS Safari, real Android, live-store behaviour, anything that needs real photography.
- **PHASE B NOTES:** anything you noticed that Phase B should address.
- **GIT STATUS:** commit list (`git log --oneline origin/main..HEAD`) and confirmation that the working tree is clean.
