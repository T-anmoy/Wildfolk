# WILDFOLK — PHASE B: EXPERIENCE
## Claude Code prompt · repo `wildfolkgithub` · branch `main` · store `8jvdhd-c3.myshopify.com`

You are the creative director, Shopify theme architect, senior Liquid/front-end engineer, interaction designer and QA lead for WILDFOLK. `CLAUDE.md` governs everything. Re-read §11–14 (design north star, concept, anti-clichés, visual system), §18–22 (product, header/footer, journal, story, motion), §24 (responsive), §27–28 (Theme Editor/JSON), §31–33 (review and QA) and §45 (definition of done).

Phase A is complete. It gave you:

- the `qa/` Playwright harness (`npm run qa`, `qa:quick`, `qa:a11y`, `qa:overflow`) covering 18 viewports;
- the `.wf-grid` breakout grid (`full` / `wide` / `content` tracks + `.wf-measure`);
- `wf-section` container queries, fluid type/space tokens, hero height/aspect rules, focal-point and mobile-image support in `wf-media`, and the hardened bee engine.

**Build on these; do not re-invent them.** Read Phase A's commits (`git log --oneline -20`) and the current `wf-*` files before planning.

Think hard. Keep a todo list.

---

## 1. Mission

Turn the corrected foundation into **a brand experience that feels designed for every screen**. The site should read as one continuous journey (landscape → bloom → hive → harvest → bottle → table → you) and not as a stack of sections, on a 360px phone, on a short 1280×720 laptop and on a 2560×1080 ultrawide.

The commercial path must be the clearest thing on the page. A visitor should always know what the product is, why to trust it and how to buy it.

**Mobile is composed, not shrunk.** Every section needs a deliberate composition for each viewport class:

- small phone
- phone
- phone landscape
- tablet portrait
- tablet landscape / short laptop
- desktop
- wide / ultrawide

## 2. Boundaries

- **Do not push.** Commit locally per milestone (§9).
- **Native commerce stays native.** Keep the product form, variant picker, quantity, buy buttons, dynamic checkout, cart notification, cart page and the structured data. Build the experience around them; never replace them with fake systems.
- **Stock Craft files:** minimal, surgical edits only where a hook is genuinely needed (e.g. rendering a snippet from `main-product.liquid`). Prefer:
  1. theme settings / blocks that already exist;
  2. a Wildfolk CSS layer scoped to the template;
  3. a small snippet render.

  Justify every stock-file edit in the report.
- **Theme Editor territory** (`templates/*.json`, `sections/*-group.json`, `config/settings_data.json`): do not edit it.
  - Design new settings so that **existing saved instances receive good defaults automatically.** A missing key reads as the schema `default`, so choose defaults that produce the new, better composition.
  - Anything that needs reordering, colour-scheme reassignment or content entry goes into **THEME EDITOR FOLLOW-UP** as exact click-by-click steps.
- **Content truth (§15):** invent nothing. No claims, reviews, origins, processes, certifications or statistics. Keep `[CLIENT-CONFIRM: …]` placeholders. Where a composition needs content that doesn't exist yet, it must degrade gracefully (hide the element, not show a lie).
- **Anti-clichés (§13):** no honeycomb motif, no cartoon bee, no glassmorphism, no random gradients, no oversized rounded cards, no marquee, no excess yellow. No WebGL/Three.js.
- **Performance:** no new third-party dependencies in the theme; transform/opacity-only motion; offscreen work paused; no layout shift.

## 3. Stop conditions

Stop and report if any of these happen:

- `git pull --ff-only` fails or the tree is dirty at start;
- the preview server is unreachable (ask the owner to start it);
- Phase A's harness or foundation is missing;
- the product has no variants/inventory to test add-to-cart (continue the build, but mark the cart tests NOT VERIFIED);
- any change would require editing a Theme Editor file.

---

## 4. Milestone B0 — Inspect, design and plan (then STOP for approval)

1. Run:
   ```
   git status
   git fetch origin
   git pull --ff-only
   git log --oneline --decorate -20
   npx shopify theme check      # save the warning baseline
   WF_QA_LABEL=before-phase-b npm run qa
   ```
2. **Inspect** the current homepage, Our Story, product, header, footer, blog and article at the key viewports from the screenshots. Also inspect the store data you can reach through the preview: the menu items, product variants, whether metafields are populated, and whether a blog exists.
3. **Write `docs/PHASE_B_PLAN.md`** containing:
   - **Narrative map:** the homepage as a journey. For each section, its role in the story, its composition per viewport class (a short description per class) and its colour scheme. Propose a **colour rhythm with narrative logic** (e.g. ivory for the opening, taupe for landscape, charcoal/olive for the hive and depth, ivory for the product, a single amber moment at most); scheme changes are Theme Editor follow-ups.
   - **Product placement:** where the purchase path first appears, and why. It must be reachable far earlier than the current 9th position; propose the minimal Theme Editor reorder, or a compact product moment that doesn't require one.
   - **Component designs:** for each item in §5–§8, the design intent, markup approach, settings schema (IDs, types, defaults) and the files affected.
   - **Motion plan:** what moves, why, how much, and the reduced-motion and mobile behaviour. Restraint is the default; justify every animation against §22.
   - **Classification** of every idea as CORE / ENHANCEMENT / EXPERIMENT. **Only CORE and ENHANCEMENT get built in Phase B.** EXPERIMENT items are listed for later.
   - **Risks and the stock files touched.**
4. **STOP.** Print a concise summary of the plan and wait for the owner's reply. Do not write theme code before approval. If the owner requests changes, update the plan and stop again.

---

## 5. Milestone B1 — Homepage & Our Story compositions

Build on `.wf-grid`, `wf-section` container queries and the fluid tokens. Every composition must be verified at the full viewport matrix.

1. **`wf-story-panel`: composition variants.** Add a `layout` select:
   - `split` (current)
   - `full-bleed` (image on the full track, copy overlaid or anchored with a scheme-aware scrim)
   - `inset` (large image on the wide track, copy offset over or beside it asymmetrically)
   - `statement` (typographic, image optional/secondary)

   Add a `mobile_order` select (`image-first` / `text-first`). Choose defaults so the existing three homepage panels (Why, Quality, How To Use) no longer share one composition. Where saved instances all fall back to one default, recommend per-instance Theme Editor choices in the follow-up list and make the default the most versatile variant. Every variant must work with and without an image.
2. **`wf-origin`:** a landscape-led composition. The image runs on the wide or full track on desktop and ultrawide. Origin meta (`dl`) sits as a restrained caption strip. On phones: image, then heading, then copy, then meta. Keep placeholder meta values visible (the content-truth policy) but styled so they look intentional.
3. **`wf-hive`:** remove the honeycomb SVG. Replace it with an image-led composition (new optional image + mobile image) or, without an image, a typographic moment on a dark scheme with strong scale contrast. No decorative patterns.
4. **`wf-process`:**
   - wide container: 4 columns joined by a single hairline thread that runs across the steps;
   - mid container: 2×2;
   - narrow container: a vertical sequence with the same thread running down the left edge.

   The thread is CSS/SVG, draws once on reveal and is static under reduced motion. Step images are optional and art-directed.
5. **`wf-reviews`:** editorial quote layout — one large lead quote plus secondary quotes; a single column on phones; `max_blocks` set. It stays hidden when empty (Phase A behaviour). No stars, ratings or counts unless real data exists.
6. **`wf-journal-feature`:**
   - desktop: a lead story on the content track with secondary stories in a column;
   - tablet: two columns;
   - phone: a list with compact thumbnails.
7. **Closing sequence (`wf-final-cta`):** add an optional newsletter block using Shopify's native `{% form 'customer' %}` (with success/error states and a labelled input). This lets the homepage close with **one** ending instead of Final CTA → newsletter → footer. The follow-up list explains how to hide the footer-group newsletter on the homepage or overall, and the trade-offs of each.
8. **Our Story** reuses the same sections, and must read as a longer-form editorial page rather than a copy of the homepage: vary its layouts through settings defaults and follow-up instructions.
9. **Continuity device (CORE only if it passes §22–23):** one quiet visual thread linking the narrative scenes, e.g. the process hairline motif echoed as section-transition rules, or consistent eyebrow/rule typography. No new animation systems. The bee remains as hardened in Phase A; its visual redesign is an EXPERIMENT for later.

## 6. Milestone B2 — Product page

1. **Layout.** Around the native `main-product`, create a Wildfolk product layer (template-scoped CSS). Craft's own sticky-info setting keeps the buy panel beside the gallery on tablet landscape and up; check it at 1024×768 and 1280×720 so the Add to Cart button is visible without scrolling. Improve typography and spacing, the price/variant/quantity hierarchy and the gallery aspect ratios per viewport class.
2. **"Field notes"** (truthful product facts):
   - **First evaluate native options:** `collapsible_tab` blocks, `text` blocks with dynamic sources, `custom_liquid`.
   - Only if these are inadequate, add one block type to `main-product`'s schema, e.g. `wf_field_notes`, with up to 6 label/value pairs. Values are **text settings the merchant connects to product metafields via dynamic sources** (no hard-coded namespaces). Any row with a blank value is not rendered; with all rows blank, the block renders nothing.
   - Present them as a restrained definition list.
   - List the suggested metafield definitions (e.g. floral source, region, harvest season, net weight, batch) in the follow-up, **as fields for the client to fill**, never with values.
3. **Mobile sticky buy bar** (`snippets/wf-sticky-buy.liquid` + small JS module, rendered from `main-product` with a minimal edit):
   - Shown only below 990px (container or viewport, whichever is correct for a fixed element), and only when the main Add to Cart button is out of view (IntersectionObserver).
   - Contents: product title (truncated), live price and an Add to Cart button.
   - **Uses the native form:** `<button type="submit" form="{{ product_form_id }}">`, so variant, quantity and selling-plan logic all come from the real form, and the cart notification fires as normal. Inspect `product-form.js`, `product-info.js`, `pubsub.js` and `constants.js`, and subscribe to the real variant-change event to mirror the price, sold-out and unavailable states and the disabled state. Verify the event names in code; do not assume them.
   - Respects `--wf-safe-bottom`. Never covers the cart notification or focused inputs; hide it while the notification is open.
   - Accessible: when hidden, it is `inert` and `aria-hidden` and not focusable. When visible, it has a clear accessible name. Slide motion is disabled under reduced motion.
   - Adds no layout shift; the page gets bottom padding only while the bar is visible.
4. **Housekeeping (follow-up list, not code):** remove the vendor text block, and hide related products if the store has fewer than 2 other products.

## 7. Milestone B3 — Header & footer

1. **Header:**
   - Logo sizing per viewport class (and on short landscape phones).
   - A **"Shop Honey" CTA** added as header settings (label + link, default label "Shop Honey", link blank = hidden). Visible from 750px up in the bar, and inside the menu drawer on phones.
   - Brand typography and spacing for the nav, a refined drawer and focus states.
   - Craft's native sticky mode (`on-scroll-up`) is set in the Theme Editor; make sure it looks deliberate.
   - **Transparent-over-hero header:** build it only if it can be done as an opt-in setting with contained changes, working with sticky, the drawer, the announcement bar and contrast on both image and no-image heroes. Otherwise, document a proposal as an EXPERIMENT and skip it.
2. **Footer:**
   - Brand-led layout per viewport class: the wordmark or logo, a short brand statement slot (merchant copy via the existing brand settings), menus, a restyled newsletter and payment icons.
   - Social icons render only where links exist.
   - No invented copy: suggested text goes in the follow-up list, clearly marked as a suggestion for the owner/client to approve.
3. **Announcement bar:** styling only; its content change is a follow-up.

## 8. Milestone B4 — Journal (blog + article)

Create a template-scoped `wf-journal.css` layer over stock `main-blog` / `main-article`, with minimal markup edits only if unavoidable.

- **Blog:** a publication feel. A lead article large on the wide track, then a grid (3 / 2 / 1 columns across desktop / tablet / phone), date and tag eyebrows, and restrained hover/focus. The empty blog degrades gracefully.
- **Article:**
  - an editorial header (eyebrow, display title, date, reading width);
  - body text on `--wf-measure`;
  - `rte` typography for `h2`/`h3`, lists, `blockquote` (as a pull quote), `figure`/`figcaption`, and images that may break out to the wide track;
  - back-to-journal and next/previous navigation if Craft exposes them;
  - share preserved.
- **The Article JSON-LD must still render.**

---

## 9. Milestone B5 — Full QA, commit, report

### 9.1 Validation (all required)

1. `npx shopify theme check`: **0 errors**, with no warnings beyond the B0 baseline.
2. `WF_QA_LABEL=after-phase-b npm run qa`:
   - overflow zero on every route × viewport;
   - no new serious/critical a11y issues;
   - `wf-*` tap targets pass;
   - zero `wf-*` console errors;
   - media and motion-smoke pass;
   - the hero above-fold check passes.
3. **Add new harness specs:**
   - **`commerce`:** at 390×844 and 1440×900 —
     - from the PDP, select a variant (if several) and add to cart via the main button; assert that the cart notification appears and `/cart.js` item count increases;
     - at 390×844, scroll until the sticky bar appears, add to cart via the sticky bar, and assert the same;
     - the sold-out state mirrors correctly (if any variant is sold out);
     - clean up by clearing the cart via `/cart/clear.js` at the start of each test.
   - **`keyboard`:** tab through the header, hero CTAs, product form and sticky bar. Assert a visible focus indicator (non-zero outline/box-shadow) on every stop and that no hidden element receives focus.
   - **`sticky-bar`:** hidden at 1440×900; hidden while the main Add to Cart is visible; never overlaps the cart notification.
   - **`newsletter`:** the form renders, has a labelled input and posts to the native customer endpoint. Don't actually submit on a live store, or submit only with an obvious test address if the owner approves.
4. **Inspect the screenshots yourself.** For home, PDP, Our Story, blog and article, check at these viewports:
   - sm-phone
   - iphone
   - phone-landscape
   - ipad-mini
   - ipad-pro11
   - tablet-landscape
   - laptop-short
   - desktop
   - fullhd
   - ultrawide

   Critique each against §11–13 and §45: does it feel like WILDFOLK, is the rhythm varied, is the purchase path clear? Fix what fails, then re-run.
5. Emulate reduced motion and check that every page is complete and static. With motion on, check that nothing animates offscreen and the bee stays out of the purchase area.
6. **Theme Editor safety, verified in code:** every new setting has a label, info and default; section load/unload/reorder and block select behave; design-mode notices appear only in the editor.

### 9.2 Commits (local only)

1. `docs: add Phase B plan`
2. `feat(home): narrative compositions for story, origin, hive, process, reviews, journal, closing`
3. `feat(product): Wildfolk product layout and field notes`
4. `feat(product): mobile sticky buy bar using native product form`
5. `feat(header-footer): Shop Honey CTA, brand header and footer`
6. `feat(journal): editorial blog and article`
7. `chore(qa): commerce, keyboard, sticky-bar and newsletter specs`

Stage files explicitly and review `git diff --stat` before each commit. **Do not push.**

### 9.3 Final report

Use the `CLAUDE.md` §44 format, plus:

- **BEFORE → AFTER:** QA table and key screenshot observations per viewport class.
- **STOCK FILES TOUCHED:** each file, the lines changed and why.
- **NEW SETTINGS:** section → setting ID → default → effect on existing saved instances.
- **THEME EDITOR FOLLOW-UP:** exact click-by-click steps. Include:
  - section order and colour schemes for the narrative rhythm;
  - per-instance layout choices;
  - the header CTA link;
  - the sticky header mode;
  - hiding the vendor block and related products;
  - newsletter placement;
  - the metafield definitions to create;
  - where to set image focal points.
- **CLIENT CONTENT STILL NEEDED:** every remaining `[CLIENT-CONFIRM]` item, plus photography by section with the required crops (portrait for phones, landscape for desktop, ultra-wide for full-bleed).
- **EXPERIMENTS PROPOSED:** e.g. bee visual redesign, journey thread, header overlay if skipped, view transitions. Each with WHAT, WHY, HOW, RISK.
- **NOT VERIFIED:** real iOS Safari/Android, live checkout (Razorpay), real photography crops, Lighthouse on a real device.
- **GIT STATUS:** `git log --oneline origin/main..HEAD` and confirmation of a clean tree.
