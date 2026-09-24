/**
 * WILDFOLK commerce helpers (product page, featured product, cart).
 *
 * - wfFormatMoney: formats paise with the shop's own money format (Craft has no JS
 *   formatter, so the format string is passed from Liquid: shop.money_format).
 * - Variant facts: on Craft's PUB_SUB_EVENTS.variantChange, update every
 *   [data-wf-fact] (unit price / net quantity / MRP) for that section.
 * - <wf-pincode>: delivery estimate from the wf_pincode_zones theme setting.
 * Every interactive element is a custom element (connected/disconnected), so it
 * survives Section Rendering API re-renders without duplicate listeners.
 */
(() => {
  if (window.wfCommerce) return;

  function wfFormatMoney(cents, format) {
    const value = Number(cents) || 0;
    const fmt = format || '{{amount}}';
    const group = (amount, decimals, thousands = ',', decimal = '.') => {
      const [whole, frac] = (amount / 100).toFixed(decimals).split('.');
      return whole.replace(/\B(?=(\d{3})+(?!\d))/g, thousands) + (frac ? decimal + frac : '');
    };
    return fmt.replace(/\{\{\s*(\w+)\s*\}\}/, (_, key) => {
      switch (key) {
        case 'amount_no_decimals':
          return group(value, 0);
        case 'amount_with_comma_separator':
          return group(value, 2, '.', ',');
        case 'amount_no_decimals_with_comma_separator':
          return group(value, 0, '.', ',');
        case 'amount_with_apostrophe_separator':
          return group(value, 2, "'", '.');
        case 'amount_with_space_separator':
          return group(value, 2, ' ', ',');
        default:
          return group(value, 2);
      }
    });
  }

  // ---------- Variant facts ----------

  function variantData(sectionId) {
    const el = document.querySelector(`script[data-wf-variants="${sectionId}"]`);
    if (!el) return null;
    try {
      return { map: JSON.parse(el.textContent), format: el.dataset.moneyFormat };
    } catch (e) {
      return null;
    }
  }

  function updateFacts(sectionId, variant) {
    const data = variantData(sectionId);
    if (!data) return;
    const facts = variant ? data.map[String(variant.id)] : null;
    const price = variant ? variant.price : null;
    document.querySelectorAll(`[data-wf-fact][data-wf-section="${sectionId}"]`).forEach((el) => {
      const out = el.querySelector('[data-wf-fact-value]');
      const kind = el.dataset.wfFact;
      let text = '';
      if (kind === 'unit' && facts && facts.w > 0) text = wfFormatMoney(Math.floor((price * 100) / facts.w), data.format);
      if (kind === 'net' && facts && facts.w > 0) text = `${facts.w} g`;
      if (kind === 'mrp' && price != null) text = wfFormatMoney(price, data.format);
      if (out) out.textContent = text;
      const row = kind === 'net' ? el.closest('.wf-label-info__row') : el;
      if (row) row.hidden = !text;
    });
  }

  function subscribeVariants() {
    if (typeof subscribe !== 'function' || typeof PUB_SUB_EVENTS === 'undefined') return false;
    subscribe(PUB_SUB_EVENTS.variantChange, ({ data }) => {
      if (data && data.sectionId) updateFacts(data.sectionId, data.variant);
    });
    return true;
  }
  // pubsub.js is deferred before this file; retry once after DOMContentLoaded just in case.
  if (!subscribeVariants()) document.addEventListener('DOMContentLoaded', subscribeVariants, { once: true });

  // ---------- Pincode checker ----------

  const STORAGE_KEY = 'wf-pincode';
  const store = {
    get() {
      try { return window.localStorage.getItem(STORAGE_KEY) || ''; } catch (e) { return ''; }
    },
    set(v) {
      try { window.localStorage.setItem(STORAGE_KEY, v); } catch (e) { /* storage unavailable */ }
    },
  };

  function parseZones(raw) {
    return String(raw || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const [range, days, mode] = line.split('|').map((part) => (part || '').trim());
        const m = /^(\d{6})\s*-\s*(\d{6})$/.exec(range || '') || /^(\d{6})$/.exec(range || '');
        if (!m) return null;
        const start = Number(m[1]);
        const end = Number(m[2] || m[1]);
        return { start: Math.min(start, end), end: Math.max(start, end), days, mode: (mode || '').toLowerCase() };
      })
      .filter(Boolean);
  }

  function zoneMessage(zone) {
    if (!zone) return "We'll confirm delivery for this pincode at checkout.";
    if (/^(none|no|not deliverable|undeliverable)$/.test(zone.mode)) return "Sorry, we don't deliver to this pincode yet.";
    const parts = [];
    if (zone.days) parts.push(`Delivery in ${zone.days} days`);
    if (zone.mode === 'cod') parts.push('COD available');
    if (zone.mode === 'prepaid') parts.push('Prepaid orders only');
    return parts.length ? `${parts.join(' · ')}.` : "We'll confirm delivery for this pincode at checkout.";
  }

  if (!customElements.get('wf-pincode')) {
    customElements.define(
      'wf-pincode',
      class WfPincode extends HTMLElement {
        connectedCallback() {
          this.zones = parseZones(this.dataset.zones);
          this.form = this.querySelector('form');
          this.input = this.querySelector('input');
          this.error = this.querySelector('.wf-pincode__error');
          this.result = this.querySelector('.wf-pincode__result');
          if (!this.form || !this.input) return;
          this.onSubmit = (event) => {
            event.preventDefault();
            this.check(true);
          };
          this.onInput = () => {
            this.input.value = this.input.value.replace(/\D/g, '').slice(0, 6);
            if (this.error && !this.error.hidden && this.input.value.length === 6) this.clearError();
          };
          this.form.addEventListener('submit', this.onSubmit);
          this.input.addEventListener('input', this.onInput);
          const last = store.get();
          if (/^\d{6}$/.test(last)) {
            this.input.value = last;
            this.check(false);
          }
        }

        disconnectedCallback() {
          this.form?.removeEventListener('submit', this.onSubmit);
          this.input?.removeEventListener('input', this.onInput);
        }

        clearError() {
          this.error.hidden = true;
          this.input.removeAttribute('aria-invalid');
        }

        check(remember) {
          const value = this.input.value.trim();
          if (!/^\d{6}$/.test(value)) {
            this.error.hidden = false;
            this.input.setAttribute('aria-invalid', 'true');
            this.result.textContent = '';
            return;
          }
          this.clearError();
          const pin = Number(value);
          const zone = this.zones.find((z) => pin >= z.start && pin <= z.end);
          this.result.textContent = zoneMessage(zone);
          if (remember) store.set(value);
        }
      }
    );
  }


  // ---------- Cart helpers (drawer + /cart page) ----------

  const live = { 'wf-free-ship': 0, 'wf-upgrade-line': 0, 'wf-gift-wrap': 0 };
  let lastFill = 0;

  function cartContext(el) {
    const drawer = el.closest('cart-drawer');
    if (drawer) return { drawer, sections: ['cart-drawer', 'cart-icon-bubble'] };
    const items = document.querySelector('cart-items');
    if (items && typeof items.getSectionsToRender === 'function') return { page: items.getSectionsToRender() };
    return {};
  }

  // Mutate the cart with the native AJAX API and let Craft's own rendering paths
  // redraw the drawer / cart page from the Section Rendering API response.
  async function cartRequest(url, body, el) {
    const ctx = cartContext(el);
    const sections = ctx.drawer ? ctx.sections : (ctx.page || []).map((s) => s.section);
    const config = typeof fetchConfig === 'function' ? fetchConfig() : { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' } };
    const response = await fetch(url, {
      ...config,
      body: JSON.stringify({ ...body, sections, sections_url: window.location.pathname }),
    });
    const state = await response.json();
    if (!response.ok || state.status) throw new Error(state.description || state.message || 'Cart update failed');
    if (ctx.drawer && state.sections) {
      ctx.drawer.renderContents(state);
    } else if (ctx.page && state.sections) {
      ctx.page.forEach((section) => {
        const host = document.getElementById(section.id);
        const html = state.sections[section.section];
        if (!host || !html) return;
        const target = host.querySelector(section.selector) || host;
        const source = new DOMParser().parseFromString(html, 'text/html').querySelector(section.selector);
        if (source) target.innerHTML = source.innerHTML;
      });
    }
    if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
      // 'cart-items' source: Craft's cart components skip their own refetch (already rendered above).
      publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-items', cartData: state });
    }
    return state;
  }

  const reducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.body?.dataset.wfMotion === 'minimal';

  if (!customElements.get('wf-free-ship')) {
    customElements.define(
      'wf-free-ship',
      class WfFreeShip extends HTMLElement {
        connectedCallback() {
          live['wf-free-ship']++;
          const target = Math.max(0, Math.min(1, parseFloat(this.dataset.fill) || 0));
          if (reducedMotion() || lastFill === target) {
            this.style.setProperty('--wf-fill', target);
          } else {
            // Re-rendered element: start from the previous level, then fill (transform only).
            this.style.setProperty('--wf-fill', lastFill);
            this.classList.add('is-animating');
            requestAnimationFrame(() => requestAnimationFrame(() => this.style.setProperty('--wf-fill', target)));
          }
          lastFill = target;
        }

        disconnectedCallback() {
          live['wf-free-ship']--;
        }
      }
    );
  }

  if (!customElements.get('wf-upgrade-line')) {
    customElements.define(
      'wf-upgrade-line',
      class WfUpgradeLine extends HTMLElement {
        connectedCallback() {
          live['wf-upgrade-line']++;
          this.button = this.querySelector('button');
          this.onClick = () => this.upgrade();
          this.button?.addEventListener('click', this.onClick);
        }

        disconnectedCallback() {
          live['wf-upgrade-line']--;
          this.button?.removeEventListener('click', this.onClick);
        }

        async upgrade() {
          this.button.disabled = true;
          this.button.setAttribute('aria-busy', 'true');
          try {
            const cart = await cartRequest(
              '/cart/change.js',
              { id: this.dataset.lineKey, quantity: Number(this.dataset.min) },
              this
            );
            const discounted =
              (cart.total_discount || 0) > 0 ||
              (cart.cart_level_discount_applications || []).length > 0 ||
              (cart.items || []).some((item) => (item.line_level_discount_allocations || []).length > 0);
            window.wfCommerce.lastUpgrade = { discounted, total_discount: cart.total_discount || 0 };
            if (!discounted) console.warn('[wf-upgrade-line] Quantity updated but Shopify applied no discount — check the automatic discount.');
          } catch (e) {
            console.warn('[wf-upgrade-line]', e.message);
            this.button.disabled = false;
            this.button.removeAttribute('aria-busy');
          }
        }
      }
    );
  }

  if (!customElements.get('wf-gift-wrap')) {
    customElements.define(
      'wf-gift-wrap',
      class WfGiftWrap extends HTMLElement {
        connectedCallback() {
          live['wf-gift-wrap']++;
          this.input = this.querySelector('input[type="checkbox"]');
          this.error = this.querySelector('.wf-gift-wrap__error');
          this.onChange = () => this.toggle();
          this.input?.addEventListener('change', this.onChange);
        }

        disconnectedCallback() {
          live['wf-gift-wrap']--;
          this.input?.removeEventListener('change', this.onChange);
        }

        async toggle() {
          const add = this.input.checked;
          this.input.disabled = true;
          if (this.error) this.error.hidden = true;
          window.wfCommerce.giftToggles = (window.wfCommerce.giftToggles || 0) + 1;
          try {
            if (add) {
              await cartRequest('/cart/add.js', { items: [{ id: Number(this.dataset.variant), quantity: 1 }] }, this);
            } else if (this.dataset.lineKey) {
              await cartRequest('/cart/change.js', { id: this.dataset.lineKey, quantity: 0 }, this);
            }
          } catch (e) {
            this.input.checked = !add;
            this.input.disabled = false;
            if (this.error) {
              this.error.textContent = e.message;
              this.error.hidden = false;
            }
          }
        }
      }
    );
  }

  window.wfCommerce = { wfFormatMoney, updateFacts, parseZones, zoneMessage, cartRequest, live };
  window.wfFormatMoney = wfFormatMoney;
})();
