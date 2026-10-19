(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const track = (event, detail = {}) => {
    // Intent events only; no form text or personal data. Nothing is sent unless an analytics layer is added.
    const payload = {event, ...detail};
    window.dispatchEvent(new CustomEvent('oooverimage:interaction', {detail: payload}));
    if (Array.isArray(window.dataLayer)) window.dataLayer.push(payload);
  };
  document.addEventListener('click', event => {
    const el = event.target.closest('[data-track]');
    if (el) track(el.dataset.track);
  });

  /* ---------- Header: tone over dark heroes, hide on scroll down ---------- */
  const header = $('.header');
  const darkHero = $('[data-hero]');
  if (darkHero) new IntersectionObserver(([e]) => { header.dataset.tone = e.isIntersecting ? 'dark' : 'light'; }, {rootMargin: `-${parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header')) || 80}px 0px 0px 0px`}).observe(darkHero);
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    if (!header.classList.contains('menu-open')) header.classList.toggle('is-hidden', y > lastY + 4 && y > 240);
    if (y < lastY - 4) header.classList.remove('is-hidden');
    lastY = y;
  }, {passive: true});
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  /* ---------- Mobile menu ---------- */
  const menuButton = $('.menu-toggle'), mobileNav = $('#mobile-nav');
  function setMenu(open) {
    mobileNav.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.querySelector('.menu-label').textContent = open ? '關閉' : '選單';
    header.classList.toggle('menu-open', open);
    document.body.classList.toggle('lock', open);
  }
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  mobileNav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mobileNav.hidden) { setMenu(false); menuButton.focus(); } });
  matchMedia('(min-width: 861px)').addEventListener('change', () => setMenu(false));

  /* ---------- Home reel ---------- */
  const hero = $('.hero[data-hero]');
  if (hero) {
    const slides = $$('.slide', hero), tabs = $$('.slide-tab', hero);
    const toggle = $('.reel-toggle', hero), now = $('.hero-now', hero);
    const DURATION = 6000;
    let current = 0, timer = 0, paused = false;
    hero.style.setProperty('--slide-duration', DURATION + 'ms');
    const prime = el => {
      el.querySelector('img[loading]')?.removeAttribute('loading');
      const v = el.querySelector('video[data-src]');
      if (v && !v.src) { v.preload = 'auto'; v.src = v.dataset.src; }
    };
    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach((el, i) => {
        const on = i === current, video = el.querySelector('video');
        el.classList.toggle('is-on', on);
        if (video) { if (on) { prime(el); video.currentTime = 0; video.play().catch(() => {}); } else video.pause(); }
      });
      prime(slides[(current + 1) % slides.length]);
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-pressed', String(i === current));
        tab.classList.remove('is-running'); void tab.offsetWidth;
        if (i === current && !paused && !reduce.matches) tab.classList.add('is-running');
      });
      if (now) {
        now.querySelector('.now-index').textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
        now.querySelector('.now-title').textContent = tabs[current].querySelector('.tab-title').textContent;
      }
      clearTimeout(timer);
      if (!paused && !reduce.matches) timer = setTimeout(() => show(current + 1), DURATION);
    }
    function setPaused(value) {
      paused = value;
      hero.classList.toggle('is-paused', paused);
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', paused ? '播放輪播' : '暫停輪播');
      slides[current].querySelector('video')?.[paused ? 'pause' : 'play']()?.catch?.(() => {});
      show(current);
    }
    $('.slide-tabs', hero).addEventListener('click', e => { const tab = e.target.closest('.slide-tab'); if (tab) show(tabs.indexOf(tab)); });
    toggle.addEventListener('click', () => setPaused(!paused));
    // The picture itself links to the work shown.
    hero.addEventListener('click', e => {
      if (e.target.closest('a,button,.hero-copy')) return;
      location.href = slides[current].dataset.href;
    });
    // Swipe on touch screens.
    let sx = null;
    hero.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, {passive: true});
    hero.addEventListener('touchend', e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    }, {passive: true});
    document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(timer); slides[current].querySelector('video')?.pause(); } else show(current); });
    new IntersectionObserver(([e]) => { if (!e.isIntersecting) { clearTimeout(timer); slides[current].querySelector('video')?.pause(); } else show(current); }).observe(hero);
    reduce.addEventListener('change', () => show(current));
    if (reduce.matches) setPaused(true); else show(0);
  }

  /* ---------- Video loops: work cards and tiles play on hover (desktop) or when in view (touch) ---------- */
  const loops = $$('.work-card, .duo-tile').filter(el => el.querySelector('video.loop'));
  const start = el => { if (reduce.matches) return; const v = el.querySelector('video.loop'); if (!v.src) v.src = v.dataset.src; v.play().then(() => el.classList.add('is-playing')).catch(() => {}); };
  const stop = el => { el.querySelector('video.loop').pause(); el.classList.remove('is-playing'); };
  loops.forEach(el => {
    el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') start(el); });
    el.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') stop(el); });
  });
  if (!fine.matches) {
    const io = new IntersectionObserver(entries => entries.forEach(e => e.isIntersecting && e.intersectionRatio > .6 ? start(e.target) : stop(e.target)), {threshold: [0, .6]});
    loops.forEach(el => io.observe(el));
  }

  /* ---------- Work filters ---------- */
  const filterBar = $('.filters');
  const filterable = $('.work-grid.is-filterable');
  if (filterBar && filterable) {
    const cards = $$('.work-card', filterable), empty = $('.empty-note');
    const apply = key => {
      let shown = 0;
      cards.forEach(card => { const hit = key === 'all' || card.dataset.service === key; card.classList.toggle('is-hidden', !hit); shown += hit; });
      empty.hidden = shown > 0;
      $$('button', filterBar).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === key)));
    };
    filterBar.addEventListener('click', e => {
      const b = e.target.closest('[data-filter]');
      if (!b || b.getAttribute('aria-pressed') === 'true') return;
      apply(b.dataset.filter);
      history.replaceState(null, '', b.dataset.filter === 'all' ? location.pathname : `#${b.dataset.filter}`);
      track('portfolio_filter', {category: b.dataset.filter});
    });
    const fromHash = () => {
      const key = location.hash.slice(1) || 'all';
      if ($(`[data-filter="${CSS.escape(key)}"]`, filterBar)) apply(key);
    };
    addEventListener('hashchange', fromHash);
    fromHash();
  }

  /* ---------- Home: service rows preview follows the pointer ---------- */
  const preview = $('.row-preview');
  if (preview && fine.matches) {
    const pimg = document.createElement('img'); pimg.alt = '';
    let px = 0, py = 0, raf = 0;
    const move = () => { raf = 0; preview.style.transform = `translate3d(${px + 28}px,${py - 100}px,0)`; };
    $$('.service-row').forEach(row => {
      row.addEventListener('pointerenter', () => { pimg.src = row.dataset.preview; if (!pimg.isConnected) preview.append(pimg); preview.classList.add('is-on'); });
      row.addEventListener('pointerleave', () => preview.classList.remove('is-on'));
      row.addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(move); });
    });
  }

  /* ---------- Contact brief: compose, copy, mail ---------- */
  const form = $('#brief-form');
  if (form) {
    const status = $('#copy-status'), submit = $('button[type=submit]', form), mail = $('.brief-mail', form);
    const service = $('#brief-service');
    const wanted = new URLSearchParams(location.search).get('service');
    if (wanted && $(`option[value="${CSS.escape(wanted)}"]`, service)) service.value = wanted;
    const field = id => document.getElementById(id).value.trim();
    const compose = () => [
      '你好，過度影像！我想詢問拍攝合作。',
      `拍攝類型：${service.selectedOptions[0].textContent}`,
      ...[['需要的內容','brief-format'],['日期與地點','brief-date'],['預算範圍','brief-budget'],['稱呼與聯絡方式','brief-name']].map(([l, id]) => field(id) ? `${l}：${field(id)}` : ''),
      field('brief-idea') ? `拍攝需求：${field('brief-idea')}` : ''
    ].filter(Boolean).join('\n');
    const syncMail = () => { mail.href = `mailto:oooverimage@gmail.com?subject=${encodeURIComponent('拍攝合作詢問｜' + service.selectedOptions[0].textContent)}&body=${encodeURIComponent(compose())}`; };
    const reset = () => { submit.classList.remove('copied'); submit.innerHTML = '複製詢問內容<span aria-hidden="true">↗</span>'; status.textContent = ''; delete status.dataset.state; };
    form.addEventListener('input', () => { reset(); syncMail(); });
    form.addEventListener('change', syncMail);
    syncMail();
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!field('brief-idea')) { status.textContent = '請先寫下想拍的內容。'; status.dataset.state = 'error'; $('#brief-idea').focus(); return; }
      const text = compose();
      try {
        await navigator.clipboard.writeText(text);
        status.textContent = '已複製，尚未送出。請開啟 Instagram 貼上傳送，或改用 Email 寄出。';
        status.dataset.state = 'ok';
        submit.classList.add('copied'); submit.innerHTML = '已複製<span aria-hidden="true">✓</span>';
        track('inquiry_copy_success', {category: service.value});
      } catch {
        status.textContent = '無法自動複製，請手動選取以下內容：\n\n' + text; status.dataset.state = 'error';
      }
    });
  }
})();
