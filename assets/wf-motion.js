/**
 * WILDFOLK motion system: scroll-linked reveal + scene visibility.
 * Framework-free, IntersectionObserver-based, Theme Editor safe.
 * Native Craft reveal (.scroll-trigger) is left untouched — this only
 * governs elements opting in via [data-wf-reveal] / .wf-scene.
 */
(() => {
  if (window.wfMotion) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const minimalMotion = () => document.body?.dataset.wfMotion === 'minimal';
  const observers = new WeakMap();

  function revealObserverFor(root) {
    if (observers.has(root)) return observers.get(root);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.15 }
    );
    observers.set(root, observer);
    return observer;
  }

  function sceneObserverFor(root) {
    const key = Symbol.for('wf-scene-observer');
    if (root[key]) return root[key];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle('is-in-view', entry.isIntersecting);
        }
      },
      { rootMargin: '0px', threshold: 0.05 }
    );
    root[key] = observer;
    return observer;
  }

  function initWithin(root) {
    const revealTargets = root.querySelectorAll('[data-wf-reveal]');
    revealTargets.forEach((el, i) => {
      if (!el.style.getPropertyValue('--wf-reveal-delay')) {
        el.style.setProperty('--wf-reveal-delay', `${Math.min(i, 6) * 70}ms`);
      }
      if (reducedMotion.matches || minimalMotion()) {
        el.classList.add('is-visible');
      } else {
        revealObserverFor(document).observe(el);
      }
    });

    root.querySelectorAll('.wf-scene').forEach((scene) => {
      sceneObserverFor(document).observe(scene);
    });
  }

  function cleanupWithin(root) {
    root.querySelectorAll('[data-wf-reveal]').forEach((el) => {
      revealObserverFor(document).unobserve(el);
    });
    root.querySelectorAll('.wf-scene').forEach((scene) => {
      sceneObserverFor(document).unobserve(scene);
    });
  }

  document.addEventListener('DOMContentLoaded', () => initWithin(document));
  if (document.readyState !== 'loading') initWithin(document);

  document.addEventListener('shopify:section:load', (event) => initWithin(event.target));
  document.addEventListener('shopify:section:unload', (event) => cleanupWithin(event.target));
  document.addEventListener('shopify:section:reorder', () => initWithin(document));
  document.addEventListener('shopify:block:select', (event) => {
    event.target.querySelectorAll?.('[data-wf-reveal]')?.forEach((el) => el.classList.add('is-visible'));
  });

  window.wfMotion = { initWithin, cleanupWithin, reducedMotion };
})();
