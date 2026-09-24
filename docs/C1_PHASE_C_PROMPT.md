# WILDFOLK — PHASE C AUTOPILOT: COMMERCE CORE
## Claude Code · repo `wildfolkgithub` · branch `main` · store `8jvdhd-c3.myshopify.com`

---

## INPUTS (filled in by the owner; blank means "not provided")

```
# Format: KEY: value. Everything after "#" is a hint for the owner, NOT a value.
# Leave the value empty if unknown. Never treat a hint as data.

PRODUCT_HANDLE:                       # final URL handle of the honey product
GIFT_WRAP_HANDLE:                     # handle of the gift-wrap product, or empty
FREE_SHIPPING_THRESHOLD_INR:          # number only, must equal the rate in Settings → Shipping
MULTI_JAR_OFFER_TEXT:                 # exact wording of the automatic discount
MULTI_JAR_MIN_QTY:                    # number only
COD_AVAILABLE:                        # yes | no
PRICES_INCLUDE_TAX:                   # yes | no  (Settings → Taxes and duties)
DISPATCH_TIME_TEXT:                   # e.g. Ships within 1–2 working days
RETURNS_SUMMARY: No returns on honey. Replacement only if the product arrives damaged.
DAMAGE_CLAIM_WINDOW:                  # e.g. Report within 48 hours of delivery with an unboxing video
FSSAI_LICENCE_NO:
SELLER_LEGAL_NAME:
SELLER_ADDRESS:
SELLER_PHONE:
SELLER_EMAIL:
GRIEVANCE_OFFICER_NAME:
GRIEVANCE_OFFICER_EMAIL:

PINCODE_ZONES: |
  # one per line:  start-end | days | cod or prepaid

OFFERS: |
  # one per line:  message | link or empty | discount code or empty | start YYYY-MM-DD or empty | end YYYY-MM-DD or empty
```

**Rules for INPUTS:**

- Every value is client data. **Use it exactly as written; never invent, extend or reword it.**
- A blank value means the related feature ships **built but hidden**. Record it on the HUMAN list and continue.
- If `PRODUCT_HANDLE` is blank, discover it from the preview server (`/products.json`), excluding anything tagged `wf-hidden`, the Craft sample product and the gift-wrap product.
- If `FREE_SHIPPING_THRESHOLD_INR` is blank, the Filling Jar stays hidden. Never guess a threshold.
- **If no active, purchasable honey product exists** (neither `PRODUCT_HANDLE` nor discovery finds one), **STOP after C0.** Phase C is commerce work; switching the cart to drawer mode and shipping untested cart code is not acceptable. Log exactly what's missing.

---

## 0. Operating mode

- You run **autonomously**, the same way as the previous autopilot. `CLAUDE.md` governs everything.
- Read `docs/AUTOPILOT_LOG.md` first, and **append** Phase C milestones (C0–C6, PUSH-C). If any C milestone is already DONE, resume from the first one that isn't. Never redo completed work.
- Reuse the Phase A/B systems; **do not re-invent them**. Inspect the current versions before building:
  - `.wf-grid`, `wf-section` containers and the fluid tokens in `wf-design-system.css`;
  - `wf-media`, `wf-link-live`, `wf-product`, `wf-field-notes`, `wf-sticky-buy`, `wf-header-cta`;
  - the `qa/` harness and `npm run qa:launch-gate`;
  - `docs/PHASE_B_PLAN.md`.
- Use subagents for QA matrix runs, screenshot reviews and Shopify-docs verification. Commit at every milestone boundary.
- **Theme Editor configuration is done by you in JSON**, using the previous autopilot's rules:
  - `git pull --ff-only` immediately before editing;
  - minimal diffs;
  - preserve Shopify's header comment;
  - keep `settings_data.json` minified;
  - validate every file after editing.
- **Push rules:** follow `docs/prompts/C2_PHASE_C_PUSH.md`, including the live-theme safety check. Never force-push, never run `shopify theme push`, never publish.
- **Hard stops:** only the same conditions as the previous autopilot. Everything else: decide, log it, continue.

## 1. Non-negotiables for Phase C

1. **Native commerce only.** Use Craft's product form, cart drawer, the Section Rendering API refresh, `/cart/*.js` endpoints, Shopify discounts and Shopify checkout. No fake cart, no custom checkout, no client-side price calculation presented as the charge.
2. **Truth.** Show offers, thresholds, delivery promises, COD, FSSAI and seller details **only from INPUTS or store data**. Every promise shown on the storefront must match what Shopify will actually charge or do.
3. **Re-render safety.** Craft re-renders the cart drawer via the Section Rendering API. Build every interactive Wildfolk cart element as a **custom element** (`connectedCallback` / `disconnectedCallback`) so it survives re-renders with no duplicate listeners. Verify by adding, changing and removing items repeatedly.
4. **Money.** Format money using the shop's money format (inspect how Craft formats money in JS and reuse that; otherwise pass `shop.money_format` from Liquid). Liquid money values are in paise; convert correctly.
5. **Accessibility.** Every moving element has a visible pause control. Every control is keyboard-operable and has an accessible name. Nothing essential is hover-only.
6. **Motion.** Motion follows `CLAUDE.md` §22: animation loops run only while visible and active, and reduced motion gets a complete, static version.
7. **Stock Craft files:** one-line hooks only (render a `wf-*` snippet or add a setting), each justified in the report.

---

## C0 — Pre-flight

1. Run:
   ```
   git status
   git fetch origin
   git pull --ff-only
   git log --oneline -10
   ```
2. Record the Theme Check baseline (`npx shopify theme check`).
3. Start the preview server if it isn't running, using `WF_STORE_PASSWORD`.
4. **Verify the admin work against the live data**, and log ✅/❌ for each:
   - the product exists, is active, and has variants and media;
   - the `wildfolk.*` product metafields and the `wildfolk.net_weight_g` variant metafield are readable in Liquid. Render a temporary debug output **locally only**, never commit it; or check through `/products/<handle>.js` where applicable;
   - the gift wrap product exists and is tagged `wf-hidden`;
   - the pages `/pages/our-story` and `/pages/faq` exist.
5. Parse INPUTS and log which features will ship **live** and which ship **hidden**.
6. Run a baseline: `WF_QA_LABEL=before-phase-c npm run qa`. The 6 product-dependent specs skipped earlier should now run if the product exists.

## C1 — Wire the product into the storefront (JSON configuration)

- Point every Shop Honey CTA (hero, final CTAs, header CTA and any Phase B CTA) to `shopify://products/<handle>`.
- Set the homepage featured product to the honey.
- Switch the cart to **drawer** mode (Craft's `cart_type` setting) and enable the cart note, which is the gift message.
- Commit: `chore(config): wire honey product, cart drawer and CTAs`.

## C2 — Product page completion

Build on the existing `wf-product` layer and main-product blocks, and keep the sticky buy bar working throughout.

1. **Price per 100 g** (`snippets/wf-unit-price.liquid` plus a small JS hook):
   - Liquid outputs a per-variant map of `{ variantId: net_weight_g }` as JSON.
   - The display shows `₹X / 100 g` under the price, and updates on the real variant-change event (the same event `wf-sticky-buy.js` uses).
   - It's hidden for any variant without a net weight.
   - Show it on the product page, the featured-product module and the sticky bar if space allows at 360px.
2. **Label information** (main-product block `wf_label_info`):
   - An accessible disclosure (`<details>`, or Craft's collapsible pattern) titled "Label information", listing:
     - ingredients;
     - net quantity (current variant);
     - MRP (current variant price) and "Inclusive of all taxes" only if `PRICES_INCLUDE_TAX=yes`;
     - best before / shelf life;
     - storage;
     - country of origin;
     - manufacturer / packer name and address;
     - FSSAI licence (theme setting from INPUTS);
     - consumer care contact (seller phone/email settings);
     - safety note.
   - These mirror the declarations Indian e-commerce rules expect for pre-packaged food. **Never invent any of them.**
   - Each row renders only if it has a value; if every row is empty, the block renders nothing.
3. **Trust row** (main-product block `wf_trust_row`):
   - Up to 4 items, each with a small line icon (inline SVG), text and an optional link.
   - **Leave every default blank.** Fill the instances via JSON only from INPUTS and store facts: dispatch time, "Secure payment via Razorpay" (only if Razorpay is confirmed active), COD (only if `COD_AVAILABLE=yes`), and a **"Replacement if damaged in transit"** item (never "easy returns": honey is non-returnable), using `RETURNS_SUMMARY` wording and linking to `shop.refund_policy` if it exists.
   - **Non-returnable disclosure:** near the buy buttons (and in the sticky bar's expanded info if space allows), show one quiet line built from `RETURNS_SUMMARY` + `DAMAGE_CLAIM_WINDOW`, linked to the refund policy. It must be visible *before* purchase, not only in the policy page. Hidden only if `RETURNS_SUMMARY` is blank.
4. **Pincode delivery checker** (`snippets/wf-pincode.liquid` plus a custom element):
   - The zones come from a theme setting (textarea) filled from `PINCODE_ZONES`, in the format `start-end | days | cod|prepaid`.
   - The input accepts exactly 6 digits, with an inline error. The result says "Delivery in 2–4 days · COD available" or similar.
   - **Pincodes not in any range:** show *"We'll confirm delivery for this pincode at checkout"*. Never say "not deliverable" unless the zones say so explicitly.
   - Remember the last pincode in `localStorage` (with try/catch).
   - Hidden if no zones are set. Results are announced politely to screen readers.
5. **Dispatch time:** shown from the theme setting near Add to Cart; hidden if blank.
6. **JSON:** place the new blocks on `templates/product.json` in a sensible order (price → unit price → variants → quantity → buy buttons → dispatch/pincode → trust row → description → label info → field notes → FAQ link).
7. Commit: `feat(product): unit price, label info, trust row, pincode checker`.

## C3 — Cart drawer, the Wildfolk way

Hook into Craft's `snippets/cart-drawer.liquid`, and mirror the same elements on the `/cart` page (`main-cart-footer`/`main-cart-items`) with one-line renders.

1. **The Filling Jar** (`wf-free-ship`):
   - Compute progress from `cart.total_price` (after discounts, before shipping, gift wrap included). Shopify's free-shipping condition is evaluated at checkout, so treat the bar as guidance and **list "bar vs checkout free-shipping match" under NOT VERIFIED until the owner's test order confirms it.**
   - A small SVG jar outline whose amber fill level equals `cart.total_price / threshold`, with the text "₹X away from free shipping", switching to "Free shipping unlocked" at the threshold.
   - The threshold comes from a theme setting filled from INPUTS. Hidden if the setting is blank or the cart is empty.
   - The fill animates with transform only; under reduced motion it's static.
   - Add a note in the setting's info text: *"Must match your free-shipping rate in Settings → Shipping."*
2. **Multi-jar nudge** (`wf-upgrade-line`): appears only when `MULTI_JAR_OFFER_TEXT` is set **and** the honey quantity is below `MULTI_JAR_MIN_QTY`.
   - It shows the exact offer text and a button that sets the quantity to the minimum using `/cart/change.js`, then triggers Craft's normal drawer refresh.
   - After the update, verify from the returned cart JSON that Shopify actually applied a discount. If no discount applies, log a warning in QA. **Never show a computed saving.** Only Craft's native discount display shows money.
3. **Gift wrap toggle** (`wf-gift-wrap`): shown only if the gift-wrap product exists and is available.
   - A checkbox adds or removes that product via the cart API, and its state comes from the cart contents.
   - The gift message uses Craft's native cart note, labelled "Gift message (optional)".
5. **Returns line in the drawer and cart page:** one small line under the checkout button with `RETURNS_SUMMARY`, linked to the refund policy (hidden if blank).
6. **Hide `wf-hidden` products** everywhere Wildfolk code lists products, and confirm Craft's search and predictive search respect `seo.hidden`. Report the result.
7. **Sticky bar and drawer together:** adding from the sticky bar opens the drawer, and the sticky bar hides while the drawer is open.
6. Commit: `feat(cart): filling-jar free shipping, multi-jar nudge, gift wrap and message`.

## C4 — Offer bands (`sections/wf-offer-band.liquid`)

One section, allowed in the header group and on templates. Put CSS in `wf-offer-band.css` and JS in `wf-offer-band.js`, loaded only when the section is present.

- **Blocks:** `offer`, with fields message, link (optional), discount code (optional), start date and end date (text `YYYY-MM-DD`, validated; invalid dates are ignored and a warning shows in design mode).
- **Style setting:**
  - `viscous` — the Viscous Ticker;
  - `letterpress` — the Letterpress Swap;
  - `static` — single line.
- **Scheduling:** Liquid filters out blocks outside their dates using `'now'` (Asia/Kolkata). Because pages are cached, **JS re-checks the dates on load** and removes expired items. With zero active offers, the section renders nothing on the storefront; in design mode it shows a notice.
- **Tap-to-apply:** if a block has a discount code, render a chip linking to `/discount/<CODE>?redirect=<link or the product URL>`, URL-encoded, with the label "Apply <CODE>". **Verify this URL pattern against the shopify.dev documentation** before relying on it. The chip is a real link, not a copy button.

### The Viscous Ticker

- A slow, continuous horizontal drift of the active messages, separated by a small amber dot. Duplicate the content for a seamless loop, with the copy marked `aria-hidden` and not focusable.
- **Scroll coupling:** page scroll velocity adds to the drift speed, then decays with heavy damping back to the resting speed (honey-like).
- Only one animation loop, running only while the band is visible (IntersectionObserver) and the tab is visible. It idles when resting speed is reached, and falls back to a pure CSS animation for resting drift.
- **Pause:** it pauses on hover, on focus-within and via a visible pause/play button (meeting WCAG 2.2.2). Reduced motion or the minimal motion setting gives a static single message with previous/next controls.
- Mobile: slower, larger type, 44px targets.

### The Letterpress Swap

- One message at a time. Each letter presses in (translate plus opacity, staggered, max ~600ms), holds for about 5 seconds, then swaps.
- Previous/next buttons and pause control; no `aria-live` auto-announcements. Under reduced motion, messages swap with no letter animation.

### JSON and placement

- Replace the stock announcement bar in `sections/header-group.json` with `wf-offer-band` (style `letterpress`), populated only from the INPUTS `OFFERS`.
- If `OFFERS` is blank, add the section with no blocks (it renders nothing) and record it on the HUMAN list.
- Keep the Craft announcement-bar section file itself unchanged.

Commit: `feat(offers): wf-offer-band with viscous ticker, letterpress swap and tap-to-apply`.

## C5 — Seller details and legal surfaces

- **Seller details:** add theme settings for legal name, address, phone, email, grievance officer name/email and FSSAI licence, filled from INPUTS. Render them in:
  - a `wf-seller-details` snippet in the footer (small print);
  - a `wf-seller-details` section on the contact page template.

  Every field is hidden when blank.
- **Footer policy links:** use `shop.privacy_policy`, `shop.refund_policy`, `shop.shipping_policy` and `shop.terms_of_service`, rendering only the ones that exist. Don't duplicate links already in the footer menu; check the menu's links in Liquid.
- **Contact page:** remove the duplicated "Contact" / "Let's talk." headline in JSON, keeping one heading.
- Commit: `feat(legal): seller details, FSSAI and policy links`.

## C6 — QA, review, push, report

### Harness additions (`qa/specs/`)

- **`returns-disclosure`:** the non-returnable line is visible on the PDP and in the cart drawer and links to the refund policy. A text scan across every route (excluding the refund policy page itself) fails on promise phrases such as "easy returns", "free returns", "hassle-free returns", "no-questions-asked" and "return within".
- **`label-info`:** every label row equals its metafield or setting value; rows with empty values are absent; "Inclusive of all taxes" appears only when `PRICES_INCLUDE_TAX=yes`.
- **`product-core`:** price per 100 g matches `price / net_weight × 100` for every variant and updates on variant change. Label-info rows equal the metafield values. The trust row shows only the configured items.
- **`pincode`:** a 5-digit input shows the error; an in-range pincode shows the right days and COD text; an out-of-range pincode shows the confirm-at-checkout message; the last pincode is remembered.
- **`cart-drawer`:**
  - adding from the product page and from the sticky bar opens the drawer;
  - the Filling Jar percentage is correct at 0, below and above the threshold;
  - the nudge appears and disappears correctly, and a discount allocation exists after the nudge (when configured);
  - gift wrap adds, removes and survives five consecutive re-renders with no duplicate listeners (count listeners, or check that a handler runs once);
  - the gift message persists to the cart note.
- **`offer-band`:**
  - expired and future offers are not rendered (test with fixture dates via a local-only query flag, or unit-test the date function);
  - reduced motion shows a static message;
  - the pause button stops movement (the transform stays the same over 1s);
  - tap-to-apply URLs are well-formed;
  - zero active offers means the section is absent.
- Extend `commerce`, `sticky-bar` and `keyboard` to cover the drawer.

### Gates (all required before push)

0. **No regressions:** every spec that passed in `before-phase-c` still passes.
1. Theme Check: 0 errors, no new warnings.
2. The full `after-phase-c` QA matrix passes, including the 6 previously skipped specs.
3. Overflow is zero; there are no new serious or critical a11y issues; `wf-*` tap targets pass; there are no `wf-*` console errors.
4. **Screenshot review by a subagent** of the product page, home, cart drawer open, and the offer band (each style) at these viewports:
   - sm-phone
   - iphone
   - phone-landscape
   - ipad-mini
   - tablet-landscape
   - laptop-short
   - desktop
   - ultrawide

   Fix every blocker and major finding.
5. `npm run qa:launch-gate` still behaves correctly.

### Push

**PUSH-C**, per `docs/prompts/C2_PHASE_C_PUSH.md`.

### Final report

Use the `CLAUDE.md` §44 format, plus:

- **LIVE vs HIDDEN:** each Phase C feature, and whether it shipped live or hidden (and which input would switch it on).
- **STOCK FILES TOUCHED:** with the lines changed and why.
- **NEW SETTINGS:** each new setting, its default, and its current value.
- **DECISIONS I MADE FOR YOU.**
- **HUMAN LIST:** with exact admin click paths.
- **NOT VERIFIED:** real devices, a real Razorpay payment, COD at checkout, and discount-code application on the live checkout.
- **GIT STATUS.**
