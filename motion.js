(() => {
  'use strict';
  // Scroll reveals, FAQ accordion, filter indicator and press feedback. Everything respects reduced motion.
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const sync = () => root.classList.toggle('motion-enabled', !reduce.matches);
  sync(); reduce.addEventListener('change', sync);

  /* Reveal: sections and cards rise in once, Apple-style, with a short stagger inside grids. */
  const targets = [...document.querySelectorAll('[data-reveal], .section-head, .work-card, .duo-tile, .service-row, .step, .faq-item, .case-media > *, .page-head > *, .footer-cta')];
  targets.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target, siblings = el.parentElement ? [...el.parentElement.children].filter(c => c.classList.contains('reveal')) : [];
      el.style.setProperty('--delay', `${Math.min(siblings.indexOf(el), 5) * 70}ms`);
      el.classList.add('is-in');
      io.unobserve(el);
    }
  }, {rootMargin: '0px 0px -8% 0px', threshold: .08});
  targets.forEach(el => io.observe(el));

  /* FAQ: height animation, one open at a time, reversible mid-flight. */
  const running = new Map();
  function finish(d, open) {
    d.open = open; d.dataset.expanded = String(open);
    d.querySelector('summary').setAttribute('aria-expanded', String(open));
    d.style.removeProperty('height'); d.style.removeProperty('overflow'); running.delete(d);
  }
  function animate(d, open) {
    const from = d.getBoundingClientRect().height;
    running.get(d)?.cancel(); running.delete(d);
    d.dataset.expanded = String(open);
    d.querySelector('summary').setAttribute('aria-expanded', String(open));
    if (reduce.matches || !d.animate) return finish(d, open);
    d.open = true;
    const to = open ? d.getBoundingClientRect().height : d.querySelector('summary').getBoundingClientRect().height + 1;
    d.style.overflow = 'hidden';
    const a = d.animate([{height: from + 'px'}, {height: to + 'px'}], {duration: 460, easing: 'cubic-bezier(.22,1,.36,1)'});
    running.set(d, a);
    a.onfinish = () => { if (running.get(d) === a) finish(d, open); };
  }
  document.querySelectorAll('.faq-item').forEach(d => { d.dataset.expanded = String(d.open); d.querySelector('summary').setAttribute('aria-expanded', String(d.open)); });
  document.addEventListener('click', e => {
    const s = e.target.closest('.faq-item > summary');
    if (!s) return;
    e.preventDefault();
    const d = s.parentElement, open = d.dataset.expanded !== 'true';
    if (open) d.parentElement.querySelectorAll(':scope > details[data-expanded=true]').forEach(o => o !== d && animate(o, false));
    animate(d, open);
  });

  /* Filter: a single white pill slides to the chosen category. */
  const bar = document.querySelector('.filters');
  if (bar) {
    const pill = document.createElement('span');
    pill.className = 'filter-indicator'; pill.setAttribute('aria-hidden', 'true'); bar.prepend(pill);
    let prev = null;
    const place = (animateIt = true) => {
      const b = bar.querySelector('[aria-pressed=true]'); if (!b) return;
      const next = {x: b.offsetLeft, w: b.offsetWidth};
      pill.style.width = next.w + 'px'; pill.style.transform = `translateX(${next.x}px)`;
      if (animateIt && prev && !reduce.matches) pill.animate([{width: prev.w + 'px', transform: `translateX(${prev.x}px)`}, {width: next.w + 'px', transform: `translateX(${next.x}px)`}], {duration: 420, easing: 'cubic-bezier(.22,1,.36,1)'});
      prev = next;
    };
    new MutationObserver(() => place()).observe(bar, {subtree: true, attributes: true, attributeFilter: ['aria-pressed']});
    addEventListener('resize', () => place(false));
    document.fonts?.ready.then(() => place(false));
    place(false);
  }

  /* Press feedback for keyboard activation (pointer presses use :active in CSS). */
  document.addEventListener('click', e => {
    if (e.detail !== 0 || reduce.matches) return;
    const c = e.target.closest('a,button,summary'); if (!c) return;
    c.classList.add('is-pressed'); setTimeout(() => c.classList.remove('is-pressed'), 180);
  });
})();
