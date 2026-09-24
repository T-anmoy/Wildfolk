/**
 * WILDFOLK motion system: scroll-linked reveal + scene visibility.
 * Framework-free, IntersectionObserver-based, Theme Editor safe.
 * Native Craft reveal (.scroll-trigger) is left untouched — this only
 * governs elements opting in via [data-wf-reveal] / .wf-scene.
 *
 * The hidden starting state lives in CSS behind (scripting: enabled) and
 * prefers-reduced-motion: no-preference, so content is never hidden without JS.
 */
(() => {
  if (window.wfMotion) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const minimalMotion = () => document.body?.dataset.wfMotion === 'minimal';
  const bound = new WeakSet();
  const STAGGER_MS = 70;
  const MAX_STAGGER_STEPS = 6;

  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.15 }
  );

  const sceneObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        entry.target.classList.toggle('is-in-view', entry.isIntersecting);
      }
    },
    { rootMargin: '0px', threshold: 0.05 }
  );

  const inViewport = (el) => {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  };

  function initWithin(root) {
    const staggerIndex = new Map();
    root.querySelectorAll('[data-wf-reveal]').forEach((el) => {
      if (bound.has(el)) return;
      bound.add(el);

      if (reducedMotion.matches || minimalMotion()) {
        el.classList.add('is-visible');
        return;
      }
      // Already on screen at init: show now, without a stagger delay.
      if (inViewport(el)) {
        el.style.setProperty('--wf-reveal-delay', '0ms');
        el.classList.add('is-visible');
        return;
      }
      // Stagger within each section, not across the whole page.
      const group = el.closest('.shopify-section') || document.body;
      const i = staggerIndex.get(group) || 0;
      staggerIndex.set(group, i + 1);
      if (!el.style.getPropertyValue('--wf-reveal-delay')) {
        el.style.setProperty('--wf-reveal-delay', `${Math.min(i, MAX_STAGGER_STEPS) * STAGGER_MS}ms`);
      }
      revealObserver.observe(el);
    });

    root.querySelectorAll('.wf-scene').forEach((scene) => sceneObserver.observe(scene));
  }

  function cleanupWithin(root) {
    root.querySelectorAll('[data-wf-reveal]').forEach((el) => {
      revealObserver.unobserve(el);
      bound.delete(el);
    });
    root.querySelectorAll('.wf-scene').forEach((scene) => sceneObserver.unobserve(scene));
  }

  // Deferred script: the DOM is parsed, but guard against a second init anyway.
  let booted = false;
  const boot = () => {
    if (booted) return;
    booted = true;
    initWithin(document);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();

  document.addEventListener('shopify:section:load', (event) => initWithin(event.target));
  document.addEventListener('shopify:section:unload', (event) => cleanupWithin(event.target));
  document.addEventListener('shopify:section:reorder', () => initWithin(document));
  document.addEventListener('shopify:block:select', (event) => {
    event.target.querySelectorAll?.('[data-wf-reveal]')?.forEach((el) => el.classList.add('is-visible'));
    if (event.target.matches?.('[data-wf-reveal]')) event.target.classList.add('is-visible');
  });

  window.wfMotion = { initWithin, cleanupWithin, reducedMotion };
})();
