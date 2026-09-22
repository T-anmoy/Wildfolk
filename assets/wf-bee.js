/**
 * WILDFOLK bee guide.
 *
 * A single reusable character that travels between narrative "scenes"
 * marked anywhere on the page with [data-wf-scene]. Position is derived
 * from real DOM geometry (never hardcoded pixels), so it survives
 * resizing, orientation changes and section reordering in the Theme
 * Editor.
 *
 * Architecture note: waypoint math (`computeState`) is kept separate
 * from rendering (`renderDom`). A future WebGL/Three.js bee can reuse
 * `computeState` and swap in its own render function without touching
 * the scene/geometry logic below.
 */
(() => {
  if (window.wfBee) return;

  const SELECTOR_SCENE = '[data-wf-scene]';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  const designMode = () => window.Shopify && window.Shopify.designMode;
  const minimalMotion = () => document.body?.dataset.wfMotion === 'minimal';

  class BeeGuide {
    constructor(root) {
      this.root = root;
      this.bee = root.querySelector('[data-wf-bee]');
      this.waypoints = [];
      this.current = { x: 0, y: 0, angle: 0 };
      this.target = { x: 0, y: 0, angle: 0 };
      this.pointer = null;
      this.raf = null;
      this.running = false;

      this.onScroll = this.onScroll.bind(this);
      this.onResize = this.onResize.bind(this);
      this.onPointerMove = this.onPointerMove.bind(this);
      this.onVisibility = this.onVisibility.bind(this);
      this.tick = this.tick.bind(this);
    }

    init() {
      if (!this.bee) return;
      this.measure();
      if (minimalMotion()) {
        this.bee.hidden = true;
        return;
      }

      this.motionAllowed = !reducedMotion.matches && !designMode();

      if (!this.motionAllowed) {
        this.bee.setAttribute('data-wf-bee-static', '');
        this.placeAtFirstScene();
        return;
      }

      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onResize, { passive: true });
      document.addEventListener('visibilitychange', this.onVisibility);
      if (finePointer.matches) {
        window.addEventListener('pointermove', this.onPointerMove, { passive: true });
      }
      this.start();
    }

    destroy() {
      window.removeEventListener('scroll', this.onScroll);
      window.removeEventListener('resize', this.onResize);
      window.removeEventListener('pointermove', this.onPointerMove);
      document.removeEventListener('visibilitychange', this.onVisibility);
      this.stop();
    }

    measure() {
      const nodes = Array.from(document.querySelectorAll(SELECTOR_SCENE));
      this.waypoints = nodes.map((el) => {
        const rect = el.getBoundingClientRect();
        const xPct = parseFloat(el.dataset.wfBeeX ?? '82') / 100;
        const yPct = parseFloat(el.dataset.wfBeeY ?? '28') / 100;
        return {
          x: rect.left + window.scrollX + rect.width * xPct,
          y: rect.top + window.scrollY + rect.height * yPct,
          top: rect.top + window.scrollY,
          height: rect.height,
        };
      });
    }

    placeAtFirstScene() {
      if (!this.waypoints.length) return;
      const p = this.waypoints[0];
      const vx = p.x - window.scrollX;
      const vy = p.y - window.scrollY;
      this.bee.style.transform = `translate3d(${vx}px, ${vy}px, 0)`;
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
      const angle = dx === 0 && dy === 0 ? this.current.angle : Math.atan2(dy, dx) * (180 / Math.PI);

      return { x, y, angle, sceneIndex: i, progress: t };
    }

    onScroll() {
      this.dirty = true;
    }

    onResize() {
      this.measure();
      this.dirty = true;
    }

    onPointerMove(event) {
      this.pointer = { x: event.clientX + window.scrollX, y: event.clientY + window.scrollY };
    }

    onVisibility() {
      if (document.hidden) this.stop();
      else this.start();
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.raf = requestAnimationFrame(this.tick);
    }

    stop() {
      this.running = false;
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;
    }

    tick() {
      if (!this.running) return;

      const state = this.computeState();
      if (state) {
        let { x, y, angle } = state;

        if (this.pointer) {
          const dist = Math.hypot(this.pointer.x - x, this.pointer.y - y);
          const influence = Math.max(0, 1 - dist / 260) * 0.18;
          x += (this.pointer.x - x) * influence;
          y += (this.pointer.y - y) * influence;
        }

        this.target.x = x;
        this.target.y = y;
        this.target.angle = angle;
      }

      this.current.x += (this.target.x - this.current.x) * 0.06;
      this.current.y += (this.target.y - this.current.y) * 0.06;
      let da = this.target.angle - this.current.angle;
      da = ((da + 180) % 360 + 360) % 360 - 180;
      this.current.angle += da * 0.04;

      this.renderDom(this.current);
      this.raf = requestAnimationFrame(this.tick);
    }

    renderDom(state) {
      const vx = state.x - window.scrollX;
      const vy = state.y - window.scrollY;
      this.bee.style.transform =
        `translate3d(${vx}px, ${vy}px, 0) rotate(${state.angle.toFixed(1)}deg)`;
    }
  }

  const instances = new Map();

  function initSection(section) {
    if (instances.has(section)) return;
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
    instances.forEach((guide) => guide.measure());
  });

  window.wfBee = { instances };
})();
