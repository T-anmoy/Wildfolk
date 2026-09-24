# WILDFOLK — First-Session Repository Audit & Roadmap

Audit of the uploaded `wildfolktgithub.zip` snapshot, performed per Section 43 of the Master Operating System. No files were changed.

---

## 0. Repository state at time of audit

| Check | Result |
|---|---|
| Branch | `main`, clean working tree, up to date with `origin/main` |
| Remote | `https://github.com/T-anmoy/Wildfolk.git` |
| HEAD | `2490587` — Shopify bot commit (locales/en.default.json) |
| Recent history | 10 `shopify[bot]` commits on 23 Sep (header-group, index, our-story, faq, contact, password, locales) on top of 8 local commits (Craft baseline → design system → bee guide → storyboard → Theme Check fixes) |
| Theme | Craft 16.0.0, Online Store 2.0 |
| Theme Check (`shopify theme check`, CLI 4.8) | **0 errors, 9 warnings** — all 9 in untouched stock Craft files (OrphanedSnippet, VariableName, UnusedAssign, LiquidComplexity, UndefinedObject). None in `wf-*` files. |
| Local preview | **Not run** — no store authentication in this environment |

**Path naming note.** The operating doc says the local folder is `wildfolkgithub`; the zip folder is `wildfolktgithub` (extra `t`). Fix whichever is wrong before Claude Code prompts reference paths.

**Important:** Theme Check passing does not mean the custom code is correct. Several real bugs below (srcset, CSS `calc`, hero LCP) are invisible to Theme Check.

---

## Executive summary — the 10 findings that matter most

1. **Hero image is lazy-loaded (LCP regression).** `wf-bee-guide` is first in `index.json`, so the hero is `section.index == 2` and never gets `loading="eager"` / `fetchpriority="high"`.
2. **`wf-media` srcset is broken.** `{% for w in widths %}` iterates a *string*, which Liquid treats as a single item. Verified with a Liquid engine: the loop runs once with `w = "375, 550, 750, 1100, 1500, 2000, 2600"`. This is latent today (no images uploaded) and **will break every Wildfolk image the moment photography is added.**
3. **The entire WF motion system is silently disabled by invalid CSS.** `calc(var(--wf-duration-reveal) * 1ms * …)` multiplies `900ms × 1ms` (time × time), which is invalid. Reveals snap instead of easing, and drift never runs.
4. **Every Wildfolk section is squeezed into a 620px column.** `--wf-content-width: 62rem` (1rem = 10px in Craft) is applied to *layouts*, not just reading measure. Two-column panels on a 1440px screen get roughly 270px columns.
5. **Primary conversion is broken.** Hero "Shop Honey" and both Final CTA "Shop Honey" buttons (home + Our Story) have no link, so they render as disabled. The homepage Featured Product has no product assigned.
6. **No photography anywhere.** No `wf-*` section has an image set. The homepage currently reads as colored text blocks, and the placeholders render as empty space.
7. **22 `[CLIENT-CONFIRM]` placeholders render publicly** across home, Our Story and FAQ (the correct approach while content is pending, but it is a hard launch gate).
8. **Everything outside the homepage is stock Craft.** Header, footer, product page, cart, blog, article and search are unmodified, so the brand experience ends when the visitor clicks "Shop".
9. **Add to Cart contrast fails WCAG AA.** Scheme-2 buttons use ivory `#F5F0E6` on amber `#B87824`, a 3.22:1 ratio where 4.5:1 is needed. The homepage featured product uses scheme-2.
10. **The bee contradicts the brief.** The striped cartoon SVG with constantly flapping wings follows the cursor, runs a never-idle 60fps loop on all devices, and faces the wrong direction as it travels.

---

## A. Current architecture

| Dir | Count | Notes |
|---|---|---|
| `layout/` | 2 | `theme.liquid` (3 WF edits: `wf-motion.js`, `wf-design-system.css`, `data-wf-motion` on body), `password.liquid` stock |
| `templates/` | 15 | Custom JSON: `index`, `page.our-story`, `page.faq`, `page.contact`, `password`. Rest stock. |
| `sections/` | 57 | 9 `wf-*` + 48 stock Craft. `header-group.json` / `footer-group.json` edited via Theme Editor. |
| `snippets/` | 41 | 2 `wf-*` (`wf-media`, `wf-bee-scene`) + stock |
| `assets/` | 195 | 5 `wf-*` (2 CSS, 2 JS + bee CSS) + stock Craft |
| `config/` | 2 | `settings_schema.json` + `wf_motion_intensity` select. `settings_data.json` uses `"current": "Craft"` preset (minified). |
| `locales/` | 51 | WF keys added to every storefront locale. `en.default.json` has since been edited in the Shopify language editor (now carries Shopify's auto-generated comment header). |

**Git hygiene:** `node_modules/` is ignored and `package.json` only has `@shopify/cli` as a devDependency. Two README-only "first commit" commits sit after the feature commits (harmless, probably from reconciling with a GitHub-created repo).

## B. Custom Wildfolk systems

| File | Purpose | State |
|---|---|---|
| `wf-hero` | Full-bleed hero, desktop/mobile art direction, 2 CTAs | LCP bug (#1), text-position bug (see F), hard-coded ivory text |
| `wf-story-panel` | Image + copy panel, 3 presets (Why / Quality / How To Use) | Used 3× on home, 3× on Our Story. Identical composition each time. |
| `wf-origin` | Landscape image + `dl` origin meta | Drift and reveal on the same element (conflict once CSS is fixed) |
| `wf-hive` | Centered copy over SVG honeycomb | Liquid-generated hexagons don't tessellate: a literal honeycomb, which the brief lists as a cliché |
| `wf-process` | Numbered steps (blocks) | Richtext output inside `<p>` → nested `<p>` (invalid HTML, styles lost). Inline styles. Renders an empty `<ol>` with no blocks. |
| `wf-reviews` | Manual quote blocks | Reuses `wf-process__*` classes. Shows public "Reviews are on their way" empty state. |
| `wf-journal-feature` | Featured + 3 secondary articles | No blog selected → public empty-state. Always renders `<h2>` even if blank. Link text likely unstyled (no global `a` color in Craft — verify). |
| `wf-final-cta` | Closing CTA | Link unset on home and Our Story |
| `wf-bee-guide` + `wf-bee-scene` | Single fixed bee travelling between `[data-wf-scene]` markers | See H |
| `wf-media` | Responsive `<picture>` helper | srcset bug (#2). Widths not capped to source width. Placeholder has no styling and is announced as "Image coming soon" to screen readers. |
| `wf-design-system.css` | Tokens, type scale, primitives, reveal/drift | Global. `calc` bug (#3). |
| `wf-home.css` | Section layouts | Loaded by every WF section via `stylesheet_tag` (8× `<link>` on home; deduped by the browser but each tag is mid-body) |
| `wf-motion.js` | Reveal + scene observers, Theme Editor events | Solid structure. Runs `initWithin(document)` twice (the defer + DOMContentLoaded pattern; harmless). |

## C. Shopify-native systems (all stock Craft 16)

Header (dropdown menu, logo top-center, no sticky), announcement bar, footer + newsletter, main-product (stacked gallery, contain fit, lightbox, vendor text block, dynamic checkout), featured-product, cart (**notification** type, not drawer), predictive search, collection/search/list-collections, main-blog (collage), main-article, main-page, contact-form, collapsible-content (FAQ), password (email-signup-banner), 404, gift card. Commerce infrastructure is intact and untouched, which is good.

## D. Design system

The palette is correctly mirrored into six Theme Editor color schemes:

| Scheme | Background | Text | Button / label | Button contrast |
|---|---|---|---|---|
| 1 | Ivory | Charcoal | Charcoal / Ivory | 15.8:1 ✅ |
| 2 | #FBF8F2 | Charcoal | **Amber / Ivory** | **3.22:1 ❌** |
| 3 | Taupe | Charcoal | Charcoal / Ivory | ✅ |
| 4 | Charcoal | Ivory | Amber / Charcoal | 4.9:1 ✅ |
| 5 | Amber | Charcoal | Charcoal / Ivory | text 4.9:1 ✅ |
| 6 | Olive | Ivory | Ivory / Olive | 7.8:1 ✅ |

**Strengths:** restrained tokens (2px radius, thin rules, no shadows); eyebrow-with-rule motif; distinct WF spacing scale.

**Weaknesses:** tokens are used only by `wf-*` sections, so stock sections ignore them. There are two parallel type scales (Craft `h1–h5` × `heading_scale 110` vs WF `clamp()` sizes), and the container token is misapplied (#4).

## E. Typography

The fonts are verified as Shopify font-library IDs: `fraunces_n4` (display) and `manrope_n4` (body), with `font-display: swap` and preloaded. Good: no third-party font requests.

Fraunces is loaded at 400 only, so there is no italic and no heavier weight available for editorial contrast. That is worth adding one style deliberately, not the whole family.

The WF display size (up to 84px) is appropriate, but inside the 620px column the h2s (up to 50px) will wrap awkwardly.

## F. Responsive system

- **Container:** see #4. On desktop this is the dominant visual defect.
- **Hero text sits at the top, not the bottom (high confidence from CSS; confirm in preview).** `.wf-hero` is `grid-template-rows: auto 1fr`. The media and scrim are absolutely positioned and occupy no cells, so `.wf-hero__body` is auto-placed in row 1 (the `auto` row), and `align-self: end` has no effect there.
- The hero forces ivory text regardless of the chosen scheme, so a light scheme with no image gives ivory on ivory.
- Story panels always stack media-first on mobile (DOM order), which is fine but identical across all three panels.
- Breakpoints are a mix of Craft's 750/990 and WF's; no WF-specific tablet composition.
- **Not verified:** any real viewport rendering (1440 → 375). No browser available here.

## G. Motion system

- Two independent reveal systems: Craft `.scroll-trigger` (enabled globally, used in 25+ stock sections) and WF `[data-wf-reveal]`, with different easing, distance and timing. Result: inconsistent motion language between WF and stock sections.
- `[data-wf-reveal]` hides content with `opacity: 0` until deferred JS runs. There is no scripting fallback, and it is applied to the **hero `<h1>`**, delaying the most important text on the page.
- Reduced-motion and the Theme-Editor "Minimal" mode are both handled correctly in principle.
- Bug #3 means none of the intended easing currently happens.

## H. Bee system

**Good:** single instance, geometry-based waypoints, Theme Editor section events handled, hidden in design mode and under reduced motion, render function separated from state (`computeState` / `renderDom`).

**Problems:**

1. **Never idles.** The `requestAnimationFrame` loop runs every frame while the tab is visible, even when the bee has settled. The `dirty` flag is set but never read. This violates "no continuous loops".
2. **Runs on mobile.** Only the pointer attraction is gated to fine pointers; the doc says mobile should simplify.
3. **Stale geometry.** It re-measures only on resize and section reorder, not when fonts, images or content change page height. It needs a `ResizeObserver` on `document.body`.
4. **Faces the wrong way.** The SVG head points up (−90°), but the code applies `rotate(atan2)` directly. Moving right the head points up; moving down the head points right.
5. **Flies in from the corner.** It starts at viewport (0,0) and visibly flies in from the top-left on load.
6. **Drifts over the purchase area.** The waypoint gap between Process and Final CTA spans Quality, How To Use, Featured Product, Reviews, Journal and FAQ, so the bee drifts across the purchase UI (z-index 40, above content).
7. **Static-placement bug.** `placeAtFirstScene` uses viewport coordinates for an `absolute` element (dead code today, since static mode is hidden by CSS).
8. **Visual language.** A striped body, perpetual wing flap, drop-shadow and cursor-following all read as mascot or cartoon, which the brief explicitly rules out. The charcoal body is also invisible on the two charcoal scenes (hero, hive).

## I. Product / cart

- `product.json` is stock Craft: vendor text block, title, price, variant pills, quantity, buy buttons with dynamic checkout, description, share, disclosures, "You may also like".
- There is no Wildfolk treatment: no origin, floral-source or batch fields (these should be metafield-driven and hidden when blank), no story continuity from the homepage, and no mobile sticky buy bar.
- For what is likely a one or two SKU store, "You may also like" will be empty or repetitive.
- **Homepage featured product:** no product assigned, and scheme-2 means the button fails contrast.
- **Cart:** notification popup (stock). This is acceptable; the drawer is optional. Razorpay is the decided gateway; checkout is Shopify-hosted and out of theme scope.
- **Not verified:** add-to-cart and the cart flow against real product data.

## J. Header / footer

- **Header:** stock. Logo top-center with no logo image uploaded (falls back to the shop name), dropdown menu, **no sticky**, no "Shop Honey" CTA. Menu contents are store data and not visible in the repo.
- **Announcement bar:** "A LIVING JOURNEY FROM HIVE TO TABLE" repeats the hero line immediately below it.
- **Footer:** the newsletter uses stock Craft copy ("Subscribe to our emails… insider news, product launches") in a generic, off-brand voice. Social links are empty and the brand headline/description are empty.
- The home page ends with Final CTA, then newsletter, then footer: three consecutive "closing" blocks.

## K. Journal / blog / article

- `blog.json`: stock collage layout. `article.json`: stock.
- The home journal feature has no blog selected, so it shows "New stories are on their way."
- There is no publication identity yet: no issue/category system, reading measure or editorial article layout.

## L. Theme Editor

**Good:** every WF section has valid schema, presets, color-scheme settings and `block.shopify_attributes`. The bee guide is removable, and there is a global motion setting.

**Gaps:**

- Schema defaults contain bracket placeholders such as `[HEADING — client copy]`, so a newly added section shows brackets. That is acceptable under the content-truth rule, but know it.
- There are no padding or width settings, which makes WF sections inconsistent with Craft sections.
- There is no `max_blocks`.
- Inline styles in process, reviews and journal are not configurable.
- The bee's X/Y waypoint percentages are hard-coded in markup.
- The **FAQ content is duplicated** between the home `wf-faq` section and `page.faq.json`, so it must be edited in two places.

## M. SEO

**Good:** canonical, OG/Twitter meta, and Craft's Product, Article and Organization JSON-LD are intact. There is one `<h1>` on home (the featured-product "h1" is a size class on an `<h2>`).

**Issues:**

- `<meta name="theme-color" content="">` is empty.
- `[CLIENT-CONFIRM]` text is crawlable if the password is removed early.
- Journal images use the article title as alt inside a link that already contains the title, so the name is announced twice (use `alt=""` there).
- The contact page has the `main-page` title followed by a rich-text "Let's talk." heading, which reads as a duplicated intro.

## N. Accessibility

1. Scheme-2 button contrast of 3.22:1 fails AA (Add to Cart).
2. The reveal system hides content without JS and delays the hero `<h1>`.
3. Dead CTAs are correctly non-focusable (`role="link" aria-disabled` with no `href`), but still visible as dead buttons.
4. The empty placeholder `div` is announced as "Image coming soon".
5. Nested `<p>` in process steps.
6. The bee is correctly `aria-hidden` and `pointer-events: none`.
7. **Not verified:** keyboard, focus and screen reader behaviour in a browser.

## O. Performance

1. Hero not eager/high priority (#1).
2. The bee's perpetual rAF loop plus a perpetual CSS wing animation on a fixed layer, on every device.
3. The broken srcset would make the browser fall back to `src` (1500w) on all viewports once images exist, which is a heavy mobile payload.
4. `wf-home.css` is linked up to 8× in the body.
5. Positives: WF JS is small (~300 lines total), framework-free, IntersectionObserver-based, and has no third-party dependencies.

## P. Technical debt

- The `calc` bug.
- Drift and reveal both writing `transform` on the same element (origin media).
- Inline styles.
- Reviews borrowing process classes.
- Duplicated FAQ.
- Two reveal systems.
- The container token misapplied.
- Placeholder styles targeting the wrong element (`.wf-story-panel__media.wf-media--placeholder` is compound, but the placeholder is a child).
- `wf-motion.js` double init.

## Q. Visual weaknesses

1. **No imagery.** The concept is a *photographic* journey (landscape → bloom → hive), but nothing is photographic yet. This outweighs every CSS decision.
2. **Narrow 620px strip** on desktop, so nothing feels editorial or cinematic.
3. **Monotonous rhythm.** Nearly every section is eyebrow → h2 → body, and the three story panels are the same composition. There are no scale changes and no full-bleed moments after the hero, so it reads as the "stack of unrelated sections" the brief warns against.
4. **Color sequence without narrative logic:** charcoal → ivory → taupe → charcoal → ivory → taupe → ivory → off-white → olive → ivory → ivory → amber → charcoal → charcoal.
5. **Honeycomb SVG and cartoon bee** are both explicitly listed as clichés to avoid.
6. **Brand discontinuity** from home to stock product, journal and footer.

## R. UX / conversion weaknesses

1. Dead "Shop Honey" CTAs (×3) and an unassigned featured product mean there is **no working purchase path from the homepage**.
2. The product appears as section 9 of 13, after seven narrative sections. For single-product D2C, price and buy should be reachable much earlier.
3. The public reviews empty-state signals "no customers yet". Hide the section when it is empty.
4. The "Quality — Clarity is part of quality" section promises clear information while origin, process, shipping and returns are all placeholders. This is honest today but self-contradicting at launch unless filled.
5. Process copy such as "handled according to the process behind the finished product" is filler; it should be replaced by confirmed facts or cut.
6. There is no persistent shop entry point (no header CTA, no sticky header).
7. Shipping, returns and contact trust information is all placeholders.

## S. Opportunities

- **Journey thread** instead of a mascot: one thin SVG line that draws across scene boundaries (landscape → hive → jar) as the page scrolls. It uses CSS/SVG only, can be capability-gated, and costs almost nothing when static.
- **Bee as a punctuation mark:** a small line-drawn glyph that appears only at scene transitions, then rests. No cursor following, no permanent flight.
- **Truthful product "field notes"** from product metafields (floral source, region, harvest season, batch, net weight). Each row is hidden when blank, so it can never fabricate.
- **Composition variants** for `wf-story-panel` (split, full-bleed with overlay, inset image, text-only statement) so one section type can create rhythm.
- **Editorial journal:** a large lead story, a reading measure of about 62–66ch, a pull-quote block and seasonal tags.
- Header transparent over the hero and solid on scroll, with a "Shop Honey" CTA.

---

## Recommendations

### CRITICAL (fix before any creative work)

| # | WHAT | WHY | HOW | FILES | RISK | IMPACT |
|---|---|---|---|---|---|---|
| C1 | Hero LCP | Hero image lazy because bee guide is section 1 | Move `wf-bee-guide` to the end of the home order **in Theme Editor** (it's position-independent). Also harden `wf-hero` to be eager when `section.index <= 2` or via an explicit "Above the fold" checkbox. | `sections/wf-hero.liquid`, `templates/index.json` (via Theme Editor) | Low | LCP |
| C2 | srcset | String iterated as one item | `assign widths = '375,550,750,1100,1500,2000,2600' \| split: ','`; skip widths > `img.width`; always include the largest available. | `snippets/wf-media.liquid` | Low | All WF images, mobile payload |
| C3 | Motion CSS | Invalid `calc` disables transitions and drift | `calc(var(--wf-duration-reveal) * var(--wf-motion-scale))`; drift uses `var(--wf-duration-drift)`. **Same commit:** split drift and reveal onto parent/child on origin media, or they'll fight over `transform`. | `assets/wf-design-system.css`, `sections/wf-origin.liquid` | Low–Med (motion becomes visible for the first time, so review it) | Motion quality |
| C4 | Purchase path | Dead CTAs, no product | Theme Editor: assign featured product, set hero/final CTA links (product URL). Optional code fallback: a `product` setting on hero/final CTA that builds the link. | Theme Editor (+ optionally `wf-hero`, `wf-final-cta`) | Low | Conversion |
| C5 | Button contrast | Add to Cart 3.22:1 | Scheme-2 `button_label` → Charcoal (4.9:1), or button → Charcoal. | Theme Editor → `settings_data.json` | Low | A11y on primary CTA |
| C6 | Launch gate | 22 public placeholders | Keep the store password on until every `[CLIENT-CONFIRM]` is filled or its block removed. Hide the reviews section when empty and the journal section when there are no articles. | `wf-reviews`, `wf-journal-feature` + content | Low | Trust |

### HIGH IMPACT

| # | WHAT | WHY | HOW | FILES | RISK | IMPACT |
|---|---|---|---|---|---|---|
| H1 | Container system | 620px strip | Add `--wf-wide-width` (≈ page width 120rem) for layouts; keep `62rem` / `~66ch` only for text measure. | `wf-design-system.css`, `wf-home.css` | Med (every WF section shifts) | Largest visual gain without photography |
| H2 | Hero layout | Body sits top | Single-cell grid (`grid-template-areas`) with body `align-self: end`; take text color from the scheme; remove `data-wf-reveal` from `h1`/body (use a CSS-only intro that never hides text). | `wf-hero.liquid`, `wf-home.css` | Low | First impression, LCP |
| H3 | Reveal safety | Content hidden without JS | Gate the hidden state behind `@media (scripting: enabled)` or a class set by a tiny inline head script; align easing/distance with Craft `.scroll-trigger` or disable one system. | `wf-design-system.css`, `theme.liquid` | Low | A11y, resilience |
| H4 | Bee engine | Perpetual loop, stale geometry, orientation, mobile | Stop rAF when converged (distance < 0.5px) and restart on scroll; `ResizeObserver` re-measure; `rotate(angle + 90)`; initialize at the first waypoint; disable on coarse pointer / <990px; exclude the product section range. | `wf-bee.js`, `wf-bee.css` | Low | Performance, polish |
| H5 | Product page | Stock Craft, brand ends at Shop | Wildfolk product layout around native form; metafield "field notes" block (hide-when-blank); mobile sticky buy bar using the native form; remove the vendor line. | `product.json`, new `wf-product-notes` snippet/block, CSS | Med | Conversion |
| H6 | Header / footer | Stock, generic copy | Upload logo; header CTA; sticky-on-scroll-up (Craft has `reduce-logo-size` / `on-scroll-up` modes); rewrite newsletter copy in brand voice; footer brand line; drop the duplicate announcement text. | Mostly Theme Editor + light CSS | Low | Brand continuity |
| H7 | Home narrative | Monotony, product too late | Composition variants for story panels; introduce the product earlier (compact product strip after "Why", or hero CTA straight to the product); merge Final CTA and newsletter into one closing moment. | `wf-story-panel`, `index.json` (Theme Editor) | Med | Story + conversion |
| H8 | Photography brief | Nothing visual to direct | Shot list mapped to sections: landscape, bloom, hive, hands, jar, table; mobile crops for the hero. This is a client deliverable, not code. | — | — | Enables everything |

### POLISH

- Process: output richtext in a `div`, not `<p>`; hide the empty `<ol>`; move inline styles to classes.
- Reviews: own class names; add `max_blocks`.
- Journal: `alt=""` on images inside title links; card link styling; hide the heading when blank.
- `wf-media`: style placeholders as a neutral taupe field; `aria-hidden` rather than "Image coming soon".
- Set `<meta name="theme-color">` to Ivory or Charcoal.
- De-duplicate the FAQ (link the home FAQ to the FAQ page, or show only 3 questions there).
- Load `wf-home.css` once (e.g. from the first WF section or the layout for the index template).
- Remove the `wf-motion.js` double init.
- Add one Fraunces italic for editorial contrast.

### EXPERIMENTAL (isolated branch or dev theme, never straight to main)

- **Journey thread** SVG line across scenes, drawn by scroll (CSS scroll-driven animation with a static fallback).
- **Bee redesign** as a minimal line glyph appearing only at scene transitions.
- View Transitions between journal card and article.
- Scroll-linked hero crop (landscape → jar).

---

## Proposed roadmap (sequenced for the GitHub ⇄ Shopify sync)

| Phase | Scope | Where | Why this order |
|---|---|---|---|
| **0 — Store-side fixes** | C1 reorder, C4, C5, logo, select blog, newsletter copy | Shopify Theme Editor only → Shopify commits → `git pull --ff-only` | Removes JSON edits from code phases, so there are no merge conflicts |
| **1 — Critical code fixes** | C1 hardening, C2, C3, C6 empty states, H3, process `<p>` | 1 Claude Code prompt, 1 commit | Small, low-risk, and unblocks images and motion |
| **2 — Layout system** | H1, H2 | 1 prompt | Largest visual change; review at all 11 widths |
| **3 — Bee / motion** | H4 (engine only) | 1 prompt | Fix behaviour before redesigning the look |
| **4 — Product** | H5 | 1–2 prompts | Needs real product + metafield definitions |
| **5 — Header / footer / journal** | H6, journal templates | 1–2 prompts | |
| **6 — Narrative + experiments** | H7, experimental list | Dev theme / branch | Only once photography exists |

**Client content needed before launch:** origin/location, floral source, process and harvest facts, shipping regions and delivery window, COD, payment methods (Razorpay is decided; confirm which methods are enabled), cancellation/returns/damaged-order policy, contact channels, genuine reviews, logo, and photography.

---

## NOT VERIFIED in this audit

Browser rendering at any viewport; the hero text-position finding (high confidence from CSS, confirm in preview); journal link colour; the menu contents, product data, metafields and store password status (store data); add-to-cart and cart; keyboard, focus and screen-reader behaviour; console errors; Lighthouse / Core Web Vitals.
