/**
 * WILDFOLK bee guide.
 *
 * A single reusable character that travels between narrative "scenes"
 * marked anywhere on the page with [data-wf-scene]. Position is derived
 * from real DOM geometry (never hardcoded pixels), so it survives
 * resizing, orientation changes and section reordering in the Theme
 * Editor.
 *
 * Behaviour contract:
 * - Enabled only on wide, fine-pointer screens with motion allowed, outside
 *   the Theme Editor and outside "minimal" motion mode. Media-query changes
 *   init/destroy it cleanly.
 * - The rAF loop runs only while the bee is travelling; once it converges it
 *   idles (no frames, wings paused) until the next scroll or re-measure.
 * - It never follows the pointer.
 * - Quiet zones: while the viewport's central band overlaps the purchase
 *   area (product-info) or any [data-wf-bee-quiet] element, it fades out and
 *   stops rendering.
 *
 * Architecture note: waypoint math (`computeState`) is kept separate
 * from rendering (`renderDom`). A future renderer can reuse `computeState`
 * and swap in its own render function without touching the geometry logic.
 */
(() => {
  if (window.wfBee) return;

  const SELECTOR_SCENE = '[data-wf-scene]';
  const SELECTOR_QUIET = '[data-wf-bee-quiet], product-info';
  const capable = window.matchMedia('(min-width: 990px) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const designMode = () => Boolean(window.Shopify && window.Shopify.designMode);
  const minimalMotion = () => document.body?.dataset.wfMotion === 'minimal';

  const EASE_POS = 0.06;
  const EASE_ANGLE = 0.04;
  const EPS_POS = 0.5; // px
  const EPS_ANGLE = 0.5; // deg
  const HEADING_OFFSET = 90; // the SVG head points up (-90°); travel direction is atan2

  class BeeGuide {
    constructor(root) {
      this.root = root;
      this.bee = root.querySelector('[data-wf-bee]');
      this.waypoints = [];
      this.quietZones = [];
      this.current = null;
      this.target = { x: 0, y: 0, angle: 0 };
      this.raf = null;
      this.active = false;
      this.measurePending = false;

      this.tick = this.tick.bind(this);
      this.wake = this.wake.bind(this);
      this.requestMeasure = this.requestMeasure.bind(this);
      this.onVisibility = this.onVisibility.bind(this);
      this.onCapabilityChange = this.onCapabilityChange.bind(this);
    }

    allowed() {
      return capable.matches && !reducedMotion.matches && !designMode() && !minimalMotion();
    }

    init() {
      if (!this.bee) return;
      capable.addEventListener('change', this.onCapabilityChange);
      reducedMotion.addEventListener('change', this.onCapabilityChange);
      this.onCapabilityChange();
    }

    destroy() {
      capable.removeEventListener('change', this.onCapabilityChange);
      reducedMotion.removeEventListener('change', this.onCapabilityChange);
      this.deactivate();
    }

    onCapabilityChange() {
      if (this.allowed()) this.activate();
      else this.deactivate();
    }

    activate() {
      if (this.active) return;
      this.active = true;
      this.bee.hidden = false;
      this.measure();
      this.current = null; // start where the page is, never fly in

      window.addEventListener('scroll', this.wake, { passive: true });
      document.addEventListener('visibilitychange', this.onVisibility);
      window.addEventListener('load', this.requestMeasure);
      this.resizeObserver = new ResizeObserver(this.requestMeasure);
      this.resizeObserver.observe(document.documentElement);
      document.fonts?.ready.then(() => this.active && this.requestMeasure());

      this.wake();
    }

    deactivate() {
      if (this.bee) this.bee.hidden = true;
      if (!this.active) return;
      this.active = false;
      window.removeEventListener('scroll', this.wake);
      document.removeEventListener('visibilitychange', this.onVisibility);
      window.removeEventListener('load', this.requestMeasure);
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
      this.stop();
    }

    // Coalesce layout reads to one per frame.
    requestMeasure() {
      if (!this.active || this.measurePending) return;
      this.measurePending = true;
      requestAnimationFrame(() => {
        this.measurePending = false;
        if (!this.active) return;
        this.measure();
        this.wake();
      });
    }

    measure() {
      const sx = window.scrollX;
      const sy = window.scrollY;
      this.waypoints = Array.from(document.querySelectorAll(SELECTOR_SCENE)).map((el) => {
        const rect = el.getBoundingClientRect();
        const xPct = parseFloat(el.dataset.wfBeeX ?? '82') / 100;
        const yPct = parseFloat(el.dataset.wfBeeY ?? '28') / 100;
        return {
          x: rect.left + sx + rect.width * xPct,
          y: rect.top + sy + rect.height * yPct,
          top: rect.top + sy,
          height: rect.height,
        };
      });
      this.quietZones = Array.from(document.querySelectorAll(SELECTOR_QUIET))
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.height > 0)
        .map((r) => ({ top: r.top + sy, bottom: r.bottom + sy }));
    }

    computeState() {
      const wps = this.waypoints;
      if (!wps.length) return null;
      const scrollY = window.scrollY + window.innerHeight * 0.4;

      let i = 0;
      while (i < wps.length - 1 && scrollY > wps[i + 1].top) i++;
      const a = wps[i];
      const b = wps[Math.min(i + 1, wps.length - 1)];
      const span = Math.max(b.top - a.top, 1);
      const t = a === b ? 0 : Math.min(Math.max((scrollY - a.top) / span, 0), 1);

      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const angle =
        dx === 0 && dy === 0
          ? this.target.angle
          : Math.atan2(dy, dx) * (180 / Math.PI) + HEADING_OFFSET;

      return { x, y, angle, sceneIndex: i, progress: t };
    }

    inQuietZone() {
      const bandTop = window.scrollY + window.innerHeight * 0.3;
      const bandBottom = window.scrollY + window.innerHeight * 0.7;
      return this.quietZones.some((z) => z.top < bandBottom && z.bottom > bandTop);
    }

    onVisibility() {
      if (document.hidden) this.stop();
      else this.wake();
    }

    wake() {
      if (!this.active || document.hidden) return;
      this.bee.classList.remove('is-idle');
      if (this.raf) return;
      this.raf = requestAnimationFrame(this.tick);
    }

    stop() {
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;
    }

    tick() {
      this.raf = null;
      if (!this.active) return;

      if (this.inQuietZone()) {
        this.bee.classList.add('is-quiet', 'is-idle');
        return; // no rendering; the next scroll re-checks
      }
      this.bee.classList.remove('is-quiet');

      const state = this.computeState();
      if (!state) return;
      this.target = state;

      if (!this.current) this.current = { x: state.x, y: state.y, angle: state.angle };

      const dx = this.target.x - this.current.x;
      const dy = this.target.y - this.current.y;
      let da = this.target.angle - this.current.angle;
      da = ((da + 180) % 360 + 360) % 360 - 180;

      const converged = Math.abs(dx) < EPS_POS && Math.abs(dy) < EPS_POS && Math.abs(da) < EPS_ANGLE;
      if (converged) {
        this.current = { x: this.target.x, y: this.target.y, angle: this.target.angle };
        this.renderDom(this.current);
        this.bee.classList.add('is-idle');
        return;
      }

      this.current.x += dx * EASE_POS;
      this.current.y += dy * EASE_POS;
      this.current.angle += da * EASE_ANGLE;
      this.renderDom(this.current);
      this.raf = requestAnimationFrame(this.tick);
    }

    renderDom(state) {
      const vx = state.x - window.scrollX;
      const vy = state.y - window.scrollY;
      this.bee.style.transform =
        `translate3d(${vx.toFixed(1)}px, ${vy.toFixed(1)}px, 0) rotate(${state.angle.toFixed(1)}deg)`;
    }
  }

  const instances = new Map();

  function initSection(section) {
    if (instances.has(section)) return;
    // Single-instance guarantee: only the first bee root on the page is used.
    if (instances.size) {
      section.querySelector('[data-wf-bee]')?.setAttribute('hidden', '');
      return;
    }
    const guide = new BeeGuide(section);
    guide.init();
    instances.set(section, guide);
  }

  function destroySection(section) {
    const guide = instances.get(section);
    if (guide) {
      guide.destroy();
      instances.delete(section);
    }
  }

  document.querySelectorAll('[data-wf-bee-root]').forEach(initSection);

  document.addEventListener('shopify:section:load', (event) => {
    const root = event.target.querySelector?.('[data-wf-bee-root]');
    if (root) initSection(root);
  });

  document.addEventListener('shopify:section:unload', (event) => {
    const root = event.target.querySelector?.('[data-wf-bee-root]');
    if (root) destroySection(root);
  });

  document.addEventListener('shopify:section:reorder', () => {
    instances.forEach((guide) => guide.requestMeasure());
  });

  window.wfBee = { instances };
})();
