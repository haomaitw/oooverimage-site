(() => {
  'use strict';
  // Brand moments and pointer effects: intro animation, headline rotator, seal spin,
  // card tilt and the 「看」 cursor over work. Pointer effects need a mouse; all stop under reduced motion.
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const pointerFx = () => fine.matches && !reduce.matches;

  /* Intro: the official logo animation, once per session, click to skip. */
  const intro = document.querySelector('.intro-loader');
  if (intro && root.classList.contains('js-intro')) {
    const finish = () => {
      intro.classList.add('is-done');
      try { sessionStorage.setItem('ovi-intro', '1'); } catch {}
      setTimeout(() => intro.remove(), 800);
    };
    intro.querySelector('video').play().catch(finish);
    setTimeout(finish, 3200);
    intro.addEventListener('click', finish, {once: true});
  } else intro?.remove();

  /* Headline: over shot / film / stage / work — from the VI 「extra ideas」. */
  const words = [...document.querySelectorAll('.rotator > span')];
  if (words.length) {
    let i = 0;
    words[0].classList.add('is-on');
    setInterval(() => {
      if (reduce.matches || document.hidden) return;
      const prev = words[i];
      prev.classList.replace('is-on', 'is-off');
      i = (i + 1) % words.length;
      words[i].classList.remove('is-off'); words[i].classList.add('is-on');
      setTimeout(() => prev.classList.remove('is-off'), 700);
    }, 2600);
  }

  /* Seals turn with scroll. */
  let spinFrame = 0;
  const spin = () => { spinFrame = 0; root.style.setProperty('--spin', reduce.matches ? 0 : (scrollY * .1).toFixed(1)); };
  addEventListener('scroll', () => { if (!spinFrame) spinFrame = requestAnimationFrame(spin); }, {passive: true});

  /* Tilt with glare on work media. */
  let tilted = null;
  const reset = el => { el.classList.remove('is-tilting'); el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); };
  document.addEventListener('pointermove', e => {
    if (!pointerFx()) return;
    const el = e.target.closest?.('.work-media');
    if (tilted && tilted !== el) { reset(tilted); tilted = null; }
    if (!el) return;
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--ry', `${((x - .5) * 6).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${((.5 - y) * 6).toFixed(2)}deg`);
    el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
    el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
    el.classList.add('is-tilting'); tilted = el;
  }, {passive: true});

  /* 「看」 cursor: only over work cards, eased follow. */
  const cursor = document.querySelector('.cursor');
  if (cursor) {
    let x = 0, y = 0, cx = 0, cy = 0, raf = 0;
    const follow = () => {
      cx += (x - cx) * .2; cy += (y - cy) * .2;
      cursor.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
      raf = Math.abs(x - cx) + Math.abs(y - cy) > .3 ? requestAnimationFrame(follow) : 0;
    };
    const update = target => cursor.classList.toggle('is-on', pointerFx() && !!target?.closest?.('.work-card, .next-case'));
    document.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      if (!cursor.classList.contains('is-on')) { cx = e.clientX; cy = e.clientY; }
      x = e.clientX; y = e.clientY; update(e.target);
      if (!raf) raf = requestAnimationFrame(follow);
    }, {passive: true});
    addEventListener('scroll', () => update(document.elementFromPoint(x, y)), {passive: true});
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
  }

  /* Chrome highlight follows the pointer on the headline, the over story and the footer wordmark. */
  const chromes = [...document.querySelectorAll('.chrome-text, .over-lead, .footer-wordmark, .over-items')];
  let cf = 0, lx = 0, ly = 0;
  const sheen = () => {
    cf = 0;
    for (const el of chromes) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) continue;
      el.style.setProperty('--sx', `${(((lx - r.left) / r.width) * 100).toFixed(1)}%`);
      el.style.setProperty('--sy', `${(((ly - r.top) / r.height) * 100).toFixed(1)}%`);
    }
  };
  if (chromes.length) document.addEventListener('pointermove', e => { if (!pointerFx()) return; lx = e.clientX; ly = e.clientY; if (!cf) cf = requestAnimationFrame(sheen); }, {passive: true});
  // Touch screens: the sheen drifts slowly instead.
  if (chromes.length && !fine.matches && !reduce.matches) {
    let t = 0;
    setInterval(() => { t += .02; chromes.forEach(el => { el.style.setProperty('--sx', `${50 + Math.sin(t) * 45}%`); el.style.setProperty('--sy', `${30 + Math.cos(t * .7) * 30}%`); }); }, 50);
  }

  /* Magnetic primary buttons (subtle). */
  document.querySelectorAll('.solid-button').forEach(b => {
    b.addEventListener('pointermove', e => {
      if (!pointerFx()) return;
      const r = b.getBoundingClientRect();
      b.style.translate = `${((e.clientX - r.left - r.width / 2) * .12).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * .2).toFixed(1)}px`;
    });
    b.addEventListener('pointerleave', () => { b.style.translate = ''; });
  });
})();
