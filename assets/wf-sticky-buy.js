/**
 * WILDFOLK mobile sticky buy bar.
 *
 * - Visible only below 990px, and only after the main Add to Cart button has
 *   been scrolled past (IntersectionObserver).
 * - Submits the native product form (button[form]), so Craft's product-form.js
 *   handles variants, quantity, selling plans, errors and the cart notification.
 * - Mirrors the main button's state (disabled / sold out / loading) with a
 *   MutationObserver, and price + variant through Craft's pub/sub
 *   PUB_SUB_EVENTS.variantChange event ({ data: { sectionId, html, variant } }).
 * - Hidden (inert + aria-hidden) while the cart notification is open or while a
 *   form field has focus; body padding only while visible.
 */
if (!customElements.get('wf-sticky-buy')) {
  customElements.define(
    'wf-sticky-buy',
    class WfStickyBuy extends HTMLElement {
      connectedCallback() {
        this.sectionId = this.dataset.section;
        this.mainButton = document.getElementById(`ProductSubmitButton-${this.sectionId}`);
        this.button = this.querySelector('[data-wf-submit]');
        this.label = this.querySelector('[data-wf-label]');
        this.priceEl = this.querySelector('[data-wf-price]');
        this.variantEl = this.querySelector('[data-wf-variant]');
        if (!this.mainButton || !this.button) return;

        this.mq = window.matchMedia('(max-width: 989px)');
        this.pastButton = false;
        this.fieldFocused = false;
        this.cartOpen = false;

        this.update = this.update.bind(this);
        this.onFocusIn = this.onFocusIn.bind(this);
        this.onFocusOut = this.onFocusOut.bind(this);

        this.io = new IntersectionObserver(([entry]) => {
          this.pastButton = !entry.isIntersecting && entry.boundingClientRect.top < 0;
          this.update();
        });
        this.io.observe(this.mainButton);

        this.buttonObserver = new MutationObserver(() => this.mirrorButton());
        this.buttonObserver.observe(this.mainButton, {
          attributes: true,
          attributeFilter: ['disabled', 'aria-disabled', 'class'],
          childList: true,
          subtree: true,
          characterData: true,
        });

        this.notification = document.getElementById('cart-notification');
        if (this.notification) {
          this.notificationObserver = new MutationObserver(() => {
            this.cartOpen = this.notification.classList.contains('active');
            this.update();
          });
          this.notificationObserver.observe(this.notification, { attributes: true, attributeFilter: ['class'] });
        }

        document.addEventListener('focusin', this.onFocusIn);
        document.addEventListener('focusout', this.onFocusOut);
        this.mq.addEventListener('change', this.update);

        if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
          this.unsubscribe = subscribe(PUB_SUB_EVENTS.variantChange, ({ data }) => {
            if (!data || data.sectionId !== this.sectionId) return;
            this.onVariantChange(data.variant);
          });
        }

        this.mirrorButton();
        this.update();
      }

      disconnectedCallback() {
        this.io?.disconnect();
        this.buttonObserver?.disconnect();
        this.notificationObserver?.disconnect();
        this.unsubscribe?.();
        document.removeEventListener('focusin', this.onFocusIn);
        document.removeEventListener('focusout', this.onFocusOut);
        this.mq?.removeEventListener('change', this.update);
        document.body.classList.remove('wf-sticky-buy-open');
      }

      isField(el) {
        return el && el.matches?.('input:not([type="radio"]):not([type="checkbox"]), select, textarea');
      }

      onFocusIn(event) {
        if (this.contains(event.target)) return;
        this.fieldFocused = this.isField(event.target);
        this.update();
      }

      onFocusOut() {
        // Re-evaluate after focus settles on the next element.
        requestAnimationFrame(() => {
          this.fieldFocused = this.isField(document.activeElement);
          this.update();
        });
      }

      // Disabled / sold out / loading all come from the real submit button.
      mirrorButton() {
        const main = this.mainButton;
        const busy = main.getAttribute('aria-disabled') === 'true' || main.classList.contains('loading');
        this.button.disabled = main.hasAttribute('disabled') || busy;
        this.button.classList.toggle('loading', busy);
        const mainLabel = main.querySelector('span')?.textContent.trim();
        if (mainLabel && this.label) this.label.textContent = mainLabel;
      }

      onVariantChange(variant) {
        if (this.variantEl) {
          this.variantEl.textContent = variant ? variant.title : window.variantStrings?.unavailable || '';
        }
        // Craft has already swapped the live price markup before publishing.
        const price = document.querySelector(`#price-${this.sectionId} .price`);
        if (price && this.priceEl) {
          const onSale = price.classList.contains('price--on-sale');
          const item = price.querySelector(onSale ? '.price__sale .price-item--sale' : '.price__regular .price-item--regular');
          const text = item?.textContent.trim();
          if (text) this.priceEl.textContent = text;
        }
        this.mirrorButton();
      }

      update() {
        const show = this.mq.matches && this.pastButton && !this.cartOpen && !this.fieldFocused;
        if (show === this.visible) return;
        this.visible = show;
        this.classList.toggle('is-visible', show);
        this.toggleAttribute('inert', !show);
        this.setAttribute('aria-hidden', String(!show));
        document.body.classList.toggle('wf-sticky-buy-open', show);
      }
    }
  );
}
