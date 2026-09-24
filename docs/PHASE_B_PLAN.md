# WILDFOLK — Phase B plan (Experience)

Status: **v3** (revised after design review rounds 1–2). §6 supersedes anything above it that conflicts. The critique and resolutions are in §7.
Built on Phase A: `.wf-grid` (full / wide / content tracks), `.wf-measure`, `wf-section` container queries,
fluid tokens, `wf-frame` + `wf-media` (focal points, mobile images), the hardened bee, and the `qa/` harness.

## 0. Constraints discovered in the store (they shape the plan)

| Fact | Consequence |
|---|---|
| **No product is published** (`/products.json` empty) | The PDP, featured product, sticky bar and add-to-cart can't be exercised against real data. The work is built to Craft's real markup and events, verified in code and on the featured-product placeholder, and marked NOT VERIFIED for live commerce. |
| `news` blog exists, **0 articles** | The blog layout is built against Craft's `main-blog`/`main-article` markup; only the empty state can be seen. Article rendering is NOT VERIFIED. |
| `/pages/our-story`, `/pages/faq` **don't exist** | The templates are tested through `?view=`. HUMAN: create the pages. |
| Main menu = Home / Catalog / Contact | Navigation is store data. HUMAN: set Home / Honey / Our Story / Journal / FAQ. |
| No photography anywhere | Every composition must look deliberate with the scheme-aware placeholder field, and better with photos. Nothing depends on an image to make sense. |

## 1. Narrative map — homepage as a journey

The story order is LANDSCAPE → BLOOM → HIVE → HARVEST → BOTTLE → TABLE → YOU. The bottle (the product) sits
where the story produces it: straight after the process. It moves from 9th to 6th, while the hero CTA and a
persistent header "Shop Honey" keep the purchase one tap away from the first screen.

| # | Section | Story role | Scheme (rhythm) | Composition |
|---|---|---|---|---|
| 1 | Hero | Threshold: dusk before the landscape | scheme-4 charcoal | Bottom-start display type; photo + scheme scrim when available |
| 2 | Why (story panel) | The idea: "the jar is only part of the story" | scheme-1 ivory | **statement** — oversized type, image secondary |
| 3 | Origin | Landscape | scheme-3 taupe | Landscape-led: image on the **wide** track, caption-strip meta |
| 4 | Hive | Depth, the living system | scheme-6 olive | Typographic moment (honeycomb removed); optional image-led |
| 5 | Process | Harvest → process → bottle → table | scheme-1 ivory | Steps joined by one hairline thread |
| 6 | **Featured product** | **The bottle** | scheme-2 off-white | Native Craft form; the Add to Cart is the page's single amber moment |
| 7 | How To Use (story panel) | The table | scheme-3 taupe | **inset** — large image on the wide track, copy offset |
| 8 | Quality (story panel) | Trust: clarity | scheme-1 ivory | **split**, image right |
| 9 | Reviews | Voices (hidden until real) | scheme-2 | Lead quote + secondary quotes |
| 10 | Journal | Notes from around the hive (hidden until articles) | scheme-1 | Lead story + list |
| 11 | FAQ | Practical answers | scheme-1 | Stock collapsible (brand-styled) |
| 12 | Final CTA (+ newsletter) | "The story continues with you." | scheme-4 charcoal | Centered; merges with the charcoal footer into **one** ending |

Colour logic: dark opening → light idea → earth (landscape) → deep olive (hive) → clear ivory (process) →
light product → earth (table) → ivory (trust) → dark closing, which bookends the hero. Amber is used only as a
button colour (hero CTA, Add to Cart), never as a section field. The scheme-5 amber block is retired
from the homepage closing (§13: excess yellow).

### Per viewport class (applies to every section unless noted)

| Class | Intent |
|---|---|
| small phone 360 | Single column; image first unless `mobile_order` = text-first; display type ≥ 36px, never clipped |
| phone 390–430 | As above; hero bottom-centre; process as a vertical sequence with a left thread |
| phone landscape 844×390 | Content-height hero, one CTA; split panels go 2-column from 750px container width |
| tablet portrait 768–834 | 2-column splits; process 2×2; journal 2 columns |
| tablet landscape / short laptop 1024–1366 × ≤820 | Hero headline and CTA above the fold (tested); product buy panel sticky beside the gallery |
| desktop 1440 | Content track 1100px, wide track 1440px; full asymmetry |
| wide / ultrawide ≥1920 | Only full-bleed layers grow; the hero height is capped by aspect ratio; copy stays on the measure |

## 2. Product placement

- The featured product moves to 6th (after Process). This is a JSON reorder done by me in the Phase B configuration commit.
- There is a persistent **header "Shop Honey"** CTA (all pages) plus the hero CTA, so the purchase path exists on screen one.
- The final CTA and footer both carry a Shop Honey route.

## 3. Component designs (CORE / ENHANCEMENT / EXPERIMENT)

### B1 Homepage & Our Story

| Item | Class | Design | Schema (id · type · default) | Files |
|---|---|---|---|---|
| Story panel layouts | CORE | `split` (current), `full-bleed` (image on the full track, copy anchored bottom-start with scheme scrim; no image → large type on scheme), `inset` (image on the wide track, 7/12; copy offset over the lower edge on a scheme panel), `statement` (display-scale heading across the content track, body in a narrow column, image secondary and small) | `layout` · select · `split`; `mobile_order` · select (`image-first`/`text-first`) · `image-first` | `sections/wf-story-panel.liquid`, CSS |
| Origin landscape-led | CORE | Image on the wide track (21:9 desktop, 4:5 phone) → heading + copy (2-column on wide containers) → `dl` as a caption strip with hairline rules | none (new composition is the default) | `sections/wf-origin.liquid`, CSS |
| Hive rebuild | CORE | Honeycomb SVG removed. Optional `image` + `image_mobile`: when set, image-led (full-bleed, copy anchored); without, a typographic moment: oversized display heading, narrow measure, strong scale contrast | `image`, `image_mobile` · image_picker | `sections/wf-hive.liquid`, CSS |
| Process thread | CORE | One hairline through the step indices: horizontal across 4 columns (wide), per row in 2×2 (mid), vertical down the left edge (narrow). It draws once on reveal (`scaleX`/`scaleY`, transform only) and is static under reduced motion | none | `sections/wf-process.liquid`, CSS |
| Reviews editorial | ENHANCEMENT | First quote large on the content track, others in 2–3 columns; `max_blocks` 6; no stars or counts | (existing) | `sections/wf-reviews.liquid`, CSS |
| Journal feature | ENHANCEMENT | Desktop: lead story + secondary column; tablet: 2 columns; phone: a list with 72px thumbnails | none | CSS |
| Final CTA + newsletter | CORE | Optional `newsletter` block using native `{% form 'customer' %}` with a labelled email input, success/error states and `contact[tags]=newsletter` | block `newsletter`: `heading` text, `text` richtext | `sections/wf-final-cta.liquid`, CSS |
| Our Story variation | CORE | Same sections, different layouts via JSON: people = `inset`, values = `statement`, craft = `split` right | — | `templates/page.our-story.json` (config commit) |
| FAQ alignment | CORE | Phase A review: the stock collapsible-content FAQ is a narrow centred column that doesn't line up with wf sections. A CSS layer aligns it to the content track, with brand typography for the summary rows and 44px targets (no markup change) | none | `assets/wf-chrome.css` |
| Continuity device | ENHANCEMENT | Typographic, not a new animation system: the eyebrow rule is the thread. A 1px hairline, the same one used in process, opens every narrative scene at the top of its content track (static) | none | CSS |

### B2 Product page

| Item | Class | Design | Files |
|---|---|---|---|
| Wildfolk product layer | CORE | Template-scoped `wf-product.css` loaded by a one-line snippet render in `main-product`: title in Fraunces, price hierarchy, variant pills with 44px targets, quantity, amber Add to Cart with charcoal label, restrained description measure, gallery 4:5 on phones / 1:1 desktop | `snippets/wf-product.liquid`, `assets/wf-product.css`, `sections/main-product.liquid` (1 line) |
| Field notes | CORE | Native options evaluated: `collapsible_tab` hides only when content is blank per tab (fine for long text), not label/value rows; `text` + dynamic source can't hide a blank label. So one new block `wf_field_notes` in `main-product` with 6 label/value text pairs (values connected to metafields via dynamic sources). Blank rows are omitted; with all rows blank it renders nothing. Rendered as a restrained `dl` | `sections/main-product.liquid` (schema + 1 `when` branch), `snippets/wf-field-notes.liquid` |
| Mobile sticky buy bar | CORE | `snippets/wf-sticky-buy.liquid` + `assets/wf-sticky-buy.js`. `<button type="submit" form="product-form-{section.id}">`, IntersectionObserver on the main submit button, shown only <990px. It mirrors price and sold-out/unavailable through `subscribe(PUB_SUB_EVENTS.variantChange)`, hides while `#cart-notification.active` or while a form field has focus, is `inert` + `aria-hidden` when hidden, adds body padding only while visible, respects `--wf-safe-bottom`, and has no slide under reduced motion | new files + 1 render line |
| Housekeeping | CORE (config) | Remove the vendor text block; disable related products (the store has <2 other products) | `templates/product.json` |

### B3 Header & footer

| Item | Class | Design | Files |
|---|---|---|---|
| Header CTA | CORE | Header settings `wf_cta_label` (default "Shop Honey") + `wf_cta_link` (blank = hidden). Shown as a compact outlined button in the icon row from 750px; inside the drawer on phones | `sections/header.liquid` (schema + 1 render), `snippets/header-drawer.liquid` (1 render), `snippets/wf-header-cta.liquid` |
| Header brand styling | CORE | Wordmark sizing per class, nav typography (Manrope 500, tracking), focus rings, drawer refinement; sticky `on-scroll-up` set in JSON with a quiet hairline when stuck | `assets/wf-chrome.css` (global, scoped to `.section-header` / `.footer`) |
| Transparent header over hero | EXPERIMENT | Not built. Needs contrast logic for image/no-image heroes plus sticky interplay | — |
| Footer | CORE | Brand-led: wordmark (shop name), brand statement from the existing Brand settings (hidden when empty), menus, restyled inline newsletter, payment icons; social only when links exist (Craft already does this) | `assets/wf-chrome.css`, `sections/footer-group.json` (config) |
| Announcement bar | ENHANCEMENT | Styling only (tracking, size); content change → HUMAN | CSS |

### B4 Journal

| Item | Class | Design | Files |
|---|---|---|---|
| Blog | CORE | `wf-journal.css`, scoped to `main-blog`: lead article on the wide track (image 16:9 left, copy right on desktop), then a 3 / 2 / 1 grid, date + tag eyebrows, hover/focus underline; the empty blog shows a calm "New stories are on their way." (existing locale key) | `assets/wf-journal.css`, 1 line in `sections/main-blog.liquid` |
| Article | CORE | Editorial header (eyebrow "Journal", display title, date), body on the measure, `rte` typography (h2/h3, lists, blockquote as pull quote, figure/figcaption, images breaking to the wide track), back-to-journal link; share preserved; Article JSON-LD untouched | `assets/wf-journal.css`, 1 line in `sections/main-article.liquid` |

## 4. Motion plan

| What | Why | How much | Reduced motion / mobile |
|---|---|---|---|
| Existing reveal (fade + 8–20px rise) | Pace the reading | 900ms, once | Off; content static |
| Process thread draws once | It's the narrative line | 1 line, 1.2s, transform only | Static line |
| Sticky buy bar slide-in | Signals the bar arriving | 240ms translateY | Instant show/hide |
| Hero entrance (Phase A) | First impression | 16px rise, no opacity | Off |
| Bee (Phase A) | Unchanged | — | Off below 990px / coarse pointer |

No new loops, no scroll-linked effects, no WebGL.

## 5. Risks & stock files touched

| Stock file | Change | Why |
|---|---|---|
| `sections/main-product.liquid` | `{% render 'wf-product', ... %}` (CSS + sticky bar) + `wf_field_notes` block (schema + `when`) | Only way to add a block type / reach the product form id |
| `sections/header.liquid` | 2 settings + 1 render | The CTA must be a header setting |
| `snippets/header-drawer.liquid` | 1 render | CTA inside the phone drawer |
| `sections/main-blog.liquid`, `sections/main-article.liquid` | 1 stylesheet line each | Template-scoped CSS |

Risks: Craft updates (small, documented hooks); no live product (commerce NOT VERIFIED); no articles (article NOT VERIFIED).


## 6. v2 revisions (supersede §1–§5 where they conflict)

### 6.1 Pre-launch integrity (new, CORE)
- **No dead ends.** A snippet `wf-link-live` decides whether an internal link has a live destination: `/collections/<h>` needs `products_count > 0`; `/products/<h>` must exist; `/pages/<h>` must exist; `/blogs/<h>` must exist. Hero, story-panel, final-CTA and header-CTA buttons render only when the link is live. In the Theme Editor they always render, with a merchant hint when the target is empty. So today, before a product exists, no "Shop Honey" leads to an empty catalogue, and "Meet the Story" doesn't lead to a 404. Everything appears automatically once the product and pages exist.
- **No sample product.** `featured-product.liquid` gets a one-line guard: with no product assigned, it renders nothing outside the Theme Editor (Craft otherwise shows its "Example product title" t-shirt placeholder).
- **`[CLIENT-CONFIRM]` visibility:** the Phase B spec (§5.2) explicitly requires origin placeholder values to stay visible and "look intentional", and §2 requires the placeholders to be kept. The storefront is password-protected, and removing the password is gated on resolving them (HUMAN list). So placeholders stay visible, styled by a `wf-pending` treatment: detected in Liquid, rendered in a quieter italic with a dotted underline so they read as deliberate "to be confirmed" notes, not as broken copy. They are never hidden silently (that would hide missing facts from the reviewing client).

### 6.2 No-image degradation (CORE, replaces "compositions must look deliberate with the placeholder")
- Outside the Theme Editor, an empty image slot is **not rendered**. Sections get a `--no-media` modifier and fall back to a text-led composition:
  - **split:** copy on a 7/12 column offset from the start, heading one step up in scale.
  - **inset:** the scheme panel alone, at wide-track width.
  - **full-bleed:** a display-scale type statement on the scheme.
  - **origin:** heading → copy → caption strip.
  - **hive:** the typographic version.
  - **process:** steps without media (as today).
- In the Theme Editor, the scheme-aware placeholder field stays, so the merchant sees where an image goes.
- **Hero without an image:** min-height `clamp(28rem, min(64svh, 100svh - 18rem), 80rem)` (Craft rem = 10px), so the headline and CTA can never fall below the first screen. At `(max-height: 560px)` landscape it's content height (Phase A rule). With an image it keeps the full-screen rule.
- A new QA check, "no images", runs at 390 and 1440: no `.wf-media--placeholder` on the storefront.

### 6.3 Purchase path on phones (CORE)
- The header CTA shows as a compact text link ("Shop Honey", ≥44×44) **in the phone icon row**, not only in the drawer. To make room, the account icon is hidden below 750px (Craft's drawer already carries the account link).
- Header sticky mode `on-scroll-up` (config), so the CTA returns on any upward scroll.
- The CTA link is configured to `shopify://collections/all` (config) and guarded by 6.1.

### 6.4 Story order and colour rhythm (CORE, replaces §1 order)

| # | Section | Scheme | Note |
|---|---|---|---|
| 1 | Hero | 4 charcoal | |
| 2 | Why | 1 ivory | split (text-led without image) |
| 3 | Origin | 3 taupe | landscape (and bloom, in general terms, by the client) |
| 4 | Hive | 6 olive | typographic device (statement line) |
| 5 | Process | 1 ivory | thread |
| 6 | **Quality** | 4 charcoal | **statement** layout: trust, stated before the price |
| 7 | **Product** | 2 off-white | arrival: `secondary_background` off, `media_size` large |
| 8 | How To Use | 3 taupe | inset |
| 9 | Reviews | 6 olive | hidden until real |
| 10 | Journal | 1 ivory | hidden until articles |
| 11 | FAQ | 1 ivory | aligned to the content track |
| 12 | Final CTA | 4 charcoal | + newsletter; one ending with the charcoal footer |

- Rule: no two adjacent visible sections share a scheme. With reviews and journal hidden, How To Use (taupe) → FAQ (ivory) holds.
- Process keeps its 4 client-authored steps (removing the "Table" step would be editing client copy). Its "Table" step foreshadows How To Use; logged as a content suggestion for the client.

### 6.5 Hive typographic device (ENHANCEMENT)
- A new optional `statement` text setting renders one oversized, tracked line. It's configured with words taken verbatim from the existing approved hive copy: "Leaving · Returning · Gathering · Tending · Storing". Nothing is invented. When blank, it's hidden.

### 6.6 Newsletter (spec §5.7 kept, stacking resolved)
- The final-CTA `newsletter` block is built (spec). It's placed in the home and Our Story final CTAs (config).
- The footer-group newsletter section is restyled (brand typography, labelled input, 44px submit), and on any page whose final CTA carries the newsletter block it is hidden by CSS (`body:has(.wf-final-cta__newsletter)`). So there's exactly **one** form per page and no duplicate success states. Other pages keep the footer newsletter.

### 6.7 Sticky buy bar (spec §6.3 kept; hardened)
- Mirrors Craft's loading / `aria-disabled` state (its button is disabled while the main submit is busy, so there's no double add). Shows the selected variant title. Height ≤ 56px + safe area. Rendered only from `main-product` (never on the homepage featured product).
- NOT VERIFIED against a live product (none exists); the `commerce` / `sticky-bar` specs skip with a note until a product is published.

### 6.8 Dropped / reclassified
- **Continuity hairline on every scene:** dropped (EXPERIMENT). The eyebrow dash already opens every scene; the process thread stays the only meaningful line.
- **Our Story "people = inset" etc.:** only the layout option ships. Our Story instances get layouts via config from existing content only. No new people/founder content.
- **Hero copy trimmed to one sentence / "honey" in the h1:** content decisions for the client (HUMAN suggestion), not code.
- **Hero phone alignment:** spec 8.5 mandates bottom-centre-safe on phones. Kept.
- **Process at mid containers:** spec §5.4 mandates 2×2 at mid width. Kept; the thread runs along each row.

### 6.9 Minor adoptions
- `visible_if` on story-panel settings (image position only for split/inset).
- Text-first mobile order changes **DOM order** (reading order = visual order on phones).
- Sold-out/unavailable buttons get a legible disabled style (≥ 4.5:1 label).
- Product media keeps `contain` (no forced crop of labels).
- Display type is allowed to grow until ~1920px containers.
- HUMAN: keep Journal out of the main menu until ~3 articles exist.

## 7. Design review record

### Round 1 — creative-director critique (5 CORE, 6 MAJOR, 8 MINOR)

| ID | Objection (short) | Resolution |
|---|---|---|
| C1 | Public pre-launch state: sample t-shirt, CTAs to an empty catalogue, 404 story links | **Adopted** (6.1) |
| C2 | `[CLIENT-CONFIRM]` visible to customers | **Adapted.** The spec requires them visible; styled as intentional + password launch gate (6.1) |
| C3 | Grey placeholders instead of design | **Adopted** (6.2) |
| C4 | Phone purchase path not persistent | **Adopted** (6.3) |
| C5 | Order: bottle/table told twice; trust after purchase; no bloom | **Adopted** the order change (Quality before Product). Process steps kept (client copy); bloom handled in Origin copy by the client (6.4) |
| M1 | Two stacked newsletters | **Adapted.** Block kept (spec); one form per page via `:has` (6.6) |
| M2 | Product has no arrival; card-in-band; same-scheme runs | **Adopted** (6.4) |
| M3 | Four type-only scenes in a row | **Adopted** partially: Why stays split; hive gets the device (6.5). Copy cuts → client |
| M4 | Hero doesn't say what's sold | **Client content** (6.8); eyebrow already says "Wildfolk Honey" |
| M5 | Sticky bar unverifiable; double-add; variant | **Adapted.** Built (spec) + hardened; NOT VERIFIED (6.7) |
| M6 | Our Story invites invented people content | **Adopted** (6.8) |
| m1 | Hairline overuse | **Adopted**: continuity hairline dropped |
| m2 | Thread split at 2×2 | Kept per spec; thread along each row |
| m3 | Editor clutter | **Adopted** (`visible_if`) |
| m4 | Scrim contrast; DOM order | **Adopted** (DOM order; scrim ≥ .6 at the text edge) |
| m5–m8 | Bee, ultrawide, PDP states, journal menu | **Adopted** (6.9) / HUMAN |

### v3 changes (round 2)

| ID | Round-2 objection | Resolution |
|---|---|---|
| N1 (CORE) | No-image hero min-height pushes content below the fold | **Adopted.** `clamp(28rem, min(64svh, 100svh - 18rem), 80rem)`; content height on short landscape. (The critique read 44rem as 704px; Craft's rem is 10px, but the cap is adopted anyway.) The above-fold spec gains 360×640 and 844×390 cases |
| N2 (MAJOR) | Header CTA may not fit at 360px | **Adopted.** New `wf_cta_label_short` (default "Shop") used below 750px, with `white-space: nowrap`; overflow is checked at 360/375 |
| N3 (MAJOR) | Nothing enforces the `[CLIENT-CONFIRM]` launch gate | **Adopted.** `npm run qa:launch-gate` fetches the real storefront. It passes while `/` redirects to `/password`, and fails if the public HTML contains `[CLIENT-CONFIRM`. Added to the HUMAN launch checklist |
| N4 (MAJOR) | Same-scheme neighbours once content appears | **Adopted.** A structural CSS fallback draws a full-width hairline between adjacent wf sections sharing a scheme (one rule per scheme 1–6) |
| n1 | Pending style reads as a link | **Adopted.** Italic + muted (≥4.5:1), no underline; visually hidden "To be confirmed:" prefix |
| n2 | Bottle step → product link | Not built (EXPERIMENT) |
| n3 | Hidden footer newsletter confuses the merchant | **Adopted.** `info` text on the final-CTA block schema |
| n4 | Hive statement at 360px | **Adopted.** Wraps at separators; separators `aria-hidden` |
| n5 | Product arrival not reviewable pre-launch | Noted: review in the Theme Editor or with a test product (HUMAN) |

### Round 3 — final check

- N1–N3 resolved. N4 was refined: the same-scheme hairline matches Shopify's section wrappers (`.shopify-section:has(> .color-scheme-N) + .shopify-section:has(> .color-scheme-N)`), so stock sections such as the FAQ are covered. It also bridges one or two empty wrappers (hidden reviews/journal).
- **Critique verdict: CORE objections remaining: 0.** The build proceeds with CORE + ENHANCEMENT items only. EXPERIMENT items (transparent header, continuity hairline, bottle-step link, bee redesign, journey thread, view transitions) are documented, not built.
