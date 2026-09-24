/**
 * WILDFOLK offer band.
 *
 * - Dates: re-checked in the browser against today's date in Asia/Kolkata
 *   (cached pages can outlive an offer). Expired or future items are removed;
 *   with none left the band disappears. Local previews (127.0.0.1 / localhost)
 *   accept ?wf_offer_today=YYYY-MM-DD for QA.
 * - viscous: CSS drift at resting speed; page scroll adds velocity that decays
 *   with heavy damping (one rAF loop, only while visible, tab visible and not
 *   paused; it stops as soon as the extra velocity has settled).
 * - letterpress: one message at a time, letters press in, hold ~5s, swap.
 * - Pause: hover, focus-within and a visible pause/play button (WCAG 2.2.2).
 * - Reduced motion / minimal mode: a static single message with prev/next.
 */
(() => {
  if (customElements.get('wf-offer-band')) return;

  const HOLD_MS = 5000;
  const DAMPING = 0.92; // per frame: honey-slow decay back to resting drift
  const GAIN = 0.35; // px of extra drift per px/frame of scroll velocity
  const EPS = 0.05;

  function todayKolkata() {
    const local = /^(127\.0\.0\.1|localhost)$/.test(window.location.hostname);
    const override = local && new URLSearchParams(window.location.search).get('wf_offer_today');
    if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) return override;
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  }

  function isActive(start, end, today) {
    const valid = (d) => !d || /^\d{4}-\d{2}-\d{2}$/.test(d);
    if (!valid(start) || !valid(end)) return false;
    if (start && start > today) return false;
    if (end && end < today) return false;
    return true;
  }

  const motionOff = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.body?.dataset.wfMotion === 'minimal';

  class WfOfferBand extends HTMLElement {
    connectedCallback() {
      this.style_ = this.dataset.style;
      this.track = this.querySelector('.wf-offer-band__track:not(.wf-offer-band__track--clone)');
      this.clone = this.querySelector('.wf-offer-band__track--clone');
      this.drift = this.querySelector('.wf-offer-band__drift');
      this.pauseBtn = this.querySelector('[data-wf-pause]');
      this.prevBtn = this.querySelector('[data-wf-prev]');
      this.nextBtn = this.querySelector('[data-wf-next]');
      if (!this.track) return;

      this.pruneByDate();
      this.items = [...this.track.children];
      if (!this.items.length) {
        (this.closest('.shopify-section') || this).hidden = true;
        return;
      }

      this.userPaused = false;
      this.hovered = false;
      this.focused = false;
      this.visible = true;
      this.index = 0;
      this.mode = this.style_ === 'viscous' && !motionOff() ? 'viscous' : this.style_ === 'static' ? 'static' : 'swap';
      this.classList.add(`is-mode-${this.mode}`);
      if (motionOff()) this.classList.add('is-reduced');

      this.bind();
      if (this.mode === 'swap' || this.mode === 'static') this.show(0, false);
      if (this.mode === 'viscous') this.initViscous();
      this.sync();
    }

    disconnectedCallback() {
      clearTimeout(this.timer);
      cancelAnimationFrame(this.raf);
      this.io?.disconnect();
      window.removeEventListener('scroll', this.onScroll);
      document.removeEventListener('visibilitychange', this.onVisibility);
    }

    pruneByDate() {
      const today = todayKolkata();
      const remove = (list) =>
        list &&
        [...list.children].forEach((li) => {
          if (!isActive(li.dataset.start, li.dataset.end, today)) li.remove();
        });
      remove(this.track);
      remove(this.clone);
      this.dataset.count = String(this.track.children.length);
      if (this.track.children.length < 2) {
        this.prevBtn?.remove();
        this.nextBtn?.remove();
      }
    }

    bind() {
      this.onEnter = () => { this.hovered = true; this.sync(); };
      this.onLeave = () => { this.hovered = false; this.sync(); };
      this.onFocusIn = () => { this.focused = true; this.sync(); };
      this.onFocusOut = (e) => { if (!this.contains(e.relatedTarget)) { this.focused = false; this.sync(); } };
      this.addEventListener('pointerenter', this.onEnter);
      this.addEventListener('pointerleave', this.onLeave);
      this.addEventListener('focusin', this.onFocusIn);
      this.addEventListener('focusout', this.onFocusOut);

      this.pauseBtn?.addEventListener('click', () => {
        this.userPaused = !this.userPaused;
        this.sync();
      });
      this.prevBtn?.addEventListener('click', () => this.step(-1));
      this.nextBtn?.addEventListener('click', () => this.step(1));

      this.onVisibility = () => this.sync();
      document.addEventListener('visibilitychange', this.onVisibility);
      this.io = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        this.sync();
      });
      this.io.observe(this);
    }

    get paused() {
      return this.userPaused || this.hovered || this.focused || !this.visible || document.hidden;
    }

    sync() {
      const paused = this.paused;
      this.classList.toggle('is-paused', paused);
      if (this.pauseBtn) {
        this.pauseBtn.setAttribute('aria-pressed', String(this.userPaused));
        this.pauseBtn.setAttribute('aria-label', this.userPaused ? 'Play offers' : 'Pause offers');
      }
      if (this.mode === 'swap') {
        clearTimeout(this.timer);
        if (!paused && this.items.length > 1) this.timer = setTimeout(() => this.step(1), HOLD_MS);
      }
      if (this.mode === 'viscous') {
        if (paused) this.stopLoop();
        else if (this.boost > EPS) this.startLoop();
      }
    }

    // ---------- letterpress / static / reduced-motion ----------

    step(delta) {
      if (this.mode === 'viscous') {
        // Reduced-motion fallback never reaches here; for the ticker, prev/next nudge the drift.
        this.offset = (this.offset || 0) + delta * 120;
        this.applyOffset();
        return;
      }
      this.show((this.index + delta + this.items.length) % this.items.length, true);
      this.sync();
    }

    show(i, animate) {
      this.index = i;
      this.items.forEach((li, n) => {
        const active = n === i;
        li.hidden = !active;
        li.classList.toggle('is-active', active);
        li.querySelectorAll('a').forEach((a) => (active ? a.removeAttribute('tabindex') : a.setAttribute('tabindex', '-1')));
      });
      if (animate && this.mode === 'swap' && this.style_ === 'letterpress' && !motionOff()) this.press(this.items[i]);
    }

    press(li) {
      const target = li.querySelector('.wf-offer-band__text, .wf-offer-band__link');
      if (!target) return;
      if (!target.dataset.wfSplit) {
        const text = target.textContent;
        target.dataset.wfSplit = '1';
        target.textContent = '';
        const sr = document.createElement('span');
        sr.className = 'visually-hidden';
        sr.textContent = text;
        const letters = document.createElement('span');
        letters.setAttribute('aria-hidden', 'true');
        const step = Math.min(24, 520 / Math.max(text.length, 1)); // whole word pressed in ≤ ~600ms
        [...text].forEach((ch, n) => {
          const s = document.createElement('span');
          s.className = 'wf-offer-band__letter';
          s.textContent = ch;
          s.style.setProperty('--wf-i', String(n));
          s.style.setProperty('--wf-step', `${step}ms`);
          letters.appendChild(s);
        });
        target.append(sr, letters);
      }
      li.classList.remove('is-pressing');
      void li.offsetWidth; // restart the CSS animation
      li.classList.add('is-pressing');
    }

    // ---------- viscous ticker ----------

    initViscous() {
      this.offset = 0;
      this.boost = 0;
      this.lastY = window.scrollY;
      this.lastT = performance.now();
      this.onScroll = () => {
        const now = performance.now();
        const dt = Math.max(now - this.lastT, 1);
        const v = Math.abs(window.scrollY - this.lastY) / (dt / 16.7); // px per frame
        this.lastY = window.scrollY;
        this.lastT = now;
        if (this.paused) return;
        this.boost = Math.min(this.boost + v * GAIN, 40);
        this.startLoop();
      };
      window.addEventListener('scroll', this.onScroll, { passive: true });
    }

    startLoop() {
      if (this.raf || this.paused) return;
      const tick = () => {
        this.raf = null;
        if (this.paused) return;
        this.offset += this.boost;
        this.boost *= DAMPING;
        this.applyOffset();
        if (this.boost > EPS) this.raf = requestAnimationFrame(tick);
        else this.boost = 0; // settled: the CSS resting drift carries on alone
      };
      this.raf = requestAnimationFrame(tick);
    }

    stopLoop() {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }

    applyOffset() {
      const half = this.track.scrollWidth || 1;
      this.offset = ((this.offset % half) + half) % half;
      this.drift.style.setProperty('--wf-extra', `${-this.offset}px`);
    }
  }

  customElements.define('wf-offer-band', WfOfferBand);
  window.wfOfferBand = { isActive, todayKolkata };
})();
