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

  window.wfCommerce = { wfFormatMoney, updateFacts, parseZones, zoneMessage };
  window.wfFormatMoney = wfFormatMoney;
})();
