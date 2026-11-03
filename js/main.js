(() => {
  'use strict';

  const W = window.WEDDING;
  const doc = document.documentElement;
  doc.classList.remove('no-js');

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = n => String(n).padStart(2, '0');

  /* ---------------------------------------------------------
     Images: responsive URLs + blurred placeholder
     --------------------------------------------------------- */
  const WIDTHS = [480, 800, 1200, 1600, 2000];
  // Ảnh tự host do scripts/convert_webp.py tạo: "images/IMG_6519" → IMG_6519-800.webp, -1600, -3200
  const LOCAL_WIDTHS = [800, 1600, 3200];
  const isLocal = id => /[/.]/.test(id);
  const isSingleFile = id => /\.\w{3,4}$/.test(id);

  function photoUrl(id, w, extra = '') {
    if (isLocal(id)) {
      if (isSingleFile(id)) return id;
      const lw = LOCAL_WIDTHS.find(x => x >= w) || LOCAL_WIDTHS[LOCAL_WIDTHS.length - 1];
      return `${id}-${lw}.webp`;
    }
    return `https://images.unsplash.com/photo-${id}?auto=format&w=${w}&q=${w < 100 ? 30 : 72}${extra}`;
  }
  function srcset(id) {
    if (isLocal(id)) return isSingleFile(id) ? '' : LOCAL_WIDTHS.map(w => `${id}-${w}.webp ${w}w`).join(', ');
    return WIDTHS.map(w => `${photoUrl(id, w)} ${w}w`).join(', ');
  }
  const tinyUrl = id => (isLocal(id) ? '' : photoUrl(id, 32, '&blur=80'));

  function makeImg(id, sizes, alt, eager = false) {
    const img = new Image();
    img.decoding = 'async';
    if (!eager) img.loading = 'lazy';
    img.alt = alt || '';
    img.sizes = sizes;
    const set = srcset(id);
    if (set) img.srcset = set;
    img.src = photoUrl(id, 1200);
    const done = () => img.classList.add('is-loaded');
    if (img.complete && img.naturalWidth) done();
    else img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
    return img;
  }

  function fillFigure(fig, id, sizes, alt) {
    const t = tinyUrl(id);
    if (t) fig.style.setProperty('--ph', `url("${t}")`);
    fig.appendChild(makeImg(id, sizes, alt));
    fig.dataset.photo = id;
  }

  /* ---------------------------------------------------------
     Flat photo list (drives lightbox + contact sheet)
     --------------------------------------------------------- */
  const ALL = [];
  W.galleries.forEach(g => g.photos.forEach(p => {
    p.gallery = g;
    p.alt = `${g.title} — ${p.cap}`;
    ALL.push(p);
  }));
  const indexOfId = id => Math.max(0, ALL.findIndex(p => p.id === id));

  // Hydrate static figures in the page
  $$('figure[data-photo]').forEach(fig => {
    const id = fig.dataset.photo;
    const p = ALL.find(x => x.id === id);
    fillFigure(fig, id, fig.dataset.sizes || '100vw', p ? p.alt : 'Ảnh cưới');
  });

  /* ---------------------------------------------------------
     Reveal on scroll (only elements marked .reveal)
     --------------------------------------------------------- */
  const revealIO = 'IntersectionObserver' in window && !reduceMotion
    ? new IntersectionObserver(entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
      }), { rootMargin: '0px 0px -10% 0px', threshold: 0.12 })
    : null;
  const observeReveal = root => $$('.reveal', root).forEach(el => (revealIO ? revealIO.observe(el) : el.classList.add('is-in')));
  observeReveal(document);

  /* ---------------------------------------------------------
     Nav: solid after hero, hide on scroll down, mobile menu
     --------------------------------------------------------- */
  const nav = $('#nav');
  const hero = $('#home');
  const menu = $('#menu');
  const menuBtn = $('#menuBtn');
  let lastY = scrollY;

  function onScroll() {
    const y = scrollY;
    const pastHero = y > hero.offsetHeight - nav.offsetHeight;
    nav.classList.toggle('is-solid', pastHero);
    const goingDown = y > lastY + 4;
    const goingUp = y < lastY - 4;
    if (pastHero && goingDown && menu.hidden) nav.classList.add('is-hidden');
    if (goingUp || !pastHero) nav.classList.remove('is-hidden');
    lastY = y;
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('menu-open', open);
    nav.classList.remove('is-hidden');
    doc.classList.toggle('locked', open);
    if (open) $('a', menu).focus();
  }
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });

  // Links to #rsvp open that accordion item
  const rsvp = $('#rsvp');
  const openRsvp = () => { if (location.hash === '#rsvp') rsvp.open = true; };
  document.addEventListener('click', e => { if (e.target.closest('a[href="#rsvp"]')) rsvp.open = true; });
  addEventListener('hashchange', openRsvp);
  openRsvp();

  /* ---------------------------------------------------------
     Chapter indicator (desktop)
     --------------------------------------------------------- */
  const chapterList = $('#chapters');
  const chapterSecs = $$('[data-chapter]').filter(s => !s.hidden);
  chapterSecs.forEach((s, i) => {
    const li = document.createElement('li');
    li.innerHTML = `${pad(i + 1)} <span>${s.dataset.chapter}</span>`;
    chapterList.appendChild(li);
  });
  if ('IntersectionObserver' in window) {
    const items = $$('li', chapterList);
    const chIO = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const i = chapterSecs.indexOf(e.target);
        items.forEach((li, j) => li.classList.toggle('is-active', i === j));
        chapterList.classList.toggle('is-over-hero', e.target === hero);
        chapterList.classList.toggle('is-dark', e.target.id === 'end');
      });
    }, { rootMargin: '-50% 0px -50% 0px' });
    chapterSecs.forEach(s => chIO.observe(s));
  }

  /* ---------------------------------------------------------
     Album: 4 kiểu hiển thị + PhotoSwipe (photoswipe.com, MIT)
       justified — các hàng cao bằng nhau, ảnh hiện trọn
       magazine  — lưới so le, ảnh `feat` to gấp đôi
       chapters  — chia theo bối cảnh, mỗi chương mở bằng 1 ảnh lớn
       slideshow — 1 ảnh lớn + dải ảnh nhỏ để chọn
     Mở trang với ?chon → hiện bảng chọn kiểu (khách không thấy).
     Bấm ảnh: PhotoSwipe phóng ra từ đúng ô đó; không tải được → trình xem ảnh sẵn có.
     --------------------------------------------------------- */
  const PSWP = 'https://cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/';
  const LAYOUTS = { justified: 'Lưới đều', magazine: 'Tạp chí', chapters: 'Theo chương', slideshow: 'Trình chiếu' };
  const LAYOUT_KEY = 'album-layout-preview';
  const grid = $('#albumGrid');
  const isPicker = /[?&]chon\b/.test(location.search);
  let layout = W.albumLayout in LAYOUTS ? W.albumLayout : 'justified';
  if (isPicker) { try { const v = localStorage.getItem(LAYOUT_KEY); if (v in LAYOUTS) layout = v; } catch (e) {} }

  const ratio = p => p.w / p.h;
  const cell = (p, cls = '', sizes = '') => {
    const i = ALL.indexOf(p);
    return `<a class="${cls}" href="${p.id}-3200.webp" style="--r:${ratio(p).toFixed(4)}" data-i="${i}"
      data-sizes="${sizes}" aria-label="Xem ảnh ${i + 1} / ${ALL.length}"></a>`;
  };
  const RENDER = {
    justified: () => `<div class="jgrid">${ALL.map(p => cell(p, 'jgrid__item', `(min-width: 1100px) ${Math.round(ratio(p) * 240)}px, ${Math.round(ratio(p) * 120)}px`)).join('')}</div>`,
    magazine: () => `<div class="mgrid">${ALL.map(p => cell(p, `mgrid__item${p.feat ? ' is-feat' : ''}${ratio(p) < 1 ? ' is-tall' : ''}`, p.feat ? '(min-width: 900px) 66vw, 100vw' : '(min-width: 900px) 33vw, 50vw')).join('')}</div>`,
    chapters: () => W.albumChapters.map((c, k) => {
      const ps = ALL.filter(p => p.g === c.key);
      const lead = ps.find(p => p.feat) || ps[0];
      const rest = ps.filter(p => p !== lead);
      return `<section class="chap">
        <header class="chap__head"><h3 class="chap__title">${c.title}</h3><p class="chap__count">${ps.length} ảnh</p></header>
        ${cell(lead, 'chap__lead', '(min-width: 1100px) 1100px, 100vw')}
        <div class="jgrid">${rest.map(p => cell(p, 'jgrid__item', `(min-width: 1100px) ${Math.round(ratio(p) * 240)}px, ${Math.round(ratio(p) * 120)}px`)).join('')}</div>
      </section>`;
    }).join(''),
    slideshow: () => `<div class="sshow">
        <div class="sshow__stage">
          <button class="sshow__nav sshow__nav--prev" type="button" aria-label="Ảnh trước"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
          <div class="sshow__main" id="sshowMain"></div>
          <button class="sshow__nav sshow__nav--next" type="button" aria-label="Ảnh sau"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
        </div>
        <p class="sshow__count" id="sshowCount" aria-live="polite"></p>
        <div class="sshow__thumbs" id="sshowThumbs">${ALL.map((p, i) => `<button type="button" class="sshow__thumb" data-t="${i}" aria-label="Ảnh ${i + 1}"></button>`).join('')}</div>
      </div>`
  };

  function hydrate() {
    $$('a[data-i]', grid).forEach(a => {
      const p = ALL[+a.dataset.i];
      const img = makeImg(p.id, a.dataset.sizes || '50vw', `Ảnh cưới ${+a.dataset.i + 1}`);
      img.width = p.w; img.height = p.h;
      a.appendChild(img);
    });
  }
  let ssIndex = 0;
  function slideTo(i) {
    ssIndex = (i + ALL.length) % ALL.length;
    const p = ALL[ssIndex];
    const main = $('#sshowMain');
    main.innerHTML = cell(p, 'sshow__img', '(min-width: 900px) 1100px, 100vw');
    hydrate();
    $('#sshowCount').innerHTML = `${pad(ssIndex + 1)} <span>/ ${pad(ALL.length)}</span>`;
    $$('.sshow__thumb', grid).forEach((t, k) => t.classList.toggle('is-on', k === ssIndex));
    const on = $(`.sshow__thumb[data-t="${ssIndex}"]`, grid);
    const strip = $('#sshowThumbs');
    if (on && strip) strip.scrollTo({ left: on.offsetLeft - strip.clientWidth / 2 + on.offsetWidth / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  function renderGallery() {
    grid.className = `album album--${layout}`;
    grid.innerHTML = RENDER[layout]();
    hydrate();
    if (layout === 'slideshow') {
      $$('.sshow__thumb', grid).forEach(t => {
        const p = ALL[+t.dataset.t];
        t.appendChild(makeImg(p.id, '120px', ''));
      });
      slideTo(ssIndex);
    }
  }
  renderGallery();

  grid.addEventListener('click', e => {
    const t = e.target.closest('.sshow__thumb');
    if (t) return slideTo(+t.dataset.t);
    if (e.target.closest('.sshow__nav--prev')) return slideTo(ssIndex - 1);
    if (e.target.closest('.sshow__nav--next')) return slideTo(ssIndex + 1);
    const a = e.target.closest('a[data-i]');
    if (!a || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    openAlbumAt(+a.dataset.i);
  });
  grid.addEventListener('keydown', e => {
    if (layout !== 'slideshow') return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); slideTo(ssIndex - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); slideTo(ssIndex + 1); }
  });

  // Bảng chọn kiểu (chỉ khi mở ?chon)
  if (isPicker) {
    const bar = document.createElement('div');
    bar.className = 'layout-pick';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Chọn kiểu hiển thị album');
    bar.innerHTML = `<span class="layout-pick__label">Kiểu album</span>` +
      Object.entries(LAYOUTS).map(([k, v]) => `<button type="button" data-l="${k}" aria-pressed="${k === layout}">${v}</button>`).join('');
    grid.before(bar);
    bar.addEventListener('click', e => {
      const b = e.target.closest('button[data-l]');
      if (!b) return;
      layout = b.dataset.l;
      try { localStorage.setItem(LAYOUT_KEY, layout); } catch (err) {}
      $$('button', bar).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      renderGallery();
    });
  }

  let pswpReady = null;
  function loadPswp() {
    if (pswpReady) return pswpReady;
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = PSWP + 'photoswipe.css';
    document.head.appendChild(css);
    pswpReady = import(PSWP + 'photoswipe.esm.min.js').then(m => m.default);
    pswpReady.catch(() => { pswpReady = null; });
    return pswpReady;
  }
  function openAlbumAt(index) {
    const elFor = i => $(`a[data-i="${i}"]`, grid) || $(`.sshow__thumb[data-t="${i}"]`, grid);
    loadPswp().then(PhotoSwipe => {
      const pswp = new PhotoSwipe({
        dataSource: ALL.map((p, i) => {
          const el = elFor(i), img = el && $('img', el);
          return {
            src: `${p.id}-3200.webp`, srcset: `${p.id}-800.webp 800w, ${p.id}-1600.webp 1600w, ${p.id}-3200.webp ${p.w}w`,
            width: p.w, height: p.h, msrc: img ? img.currentSrc : undefined, element: el, alt: `Ảnh cưới ${i + 1}`
          };
        }),
        index,
        bgOpacity: 0.96,
        showHideAnimationType: reduceMotion ? 'none' : 'zoom',
        wheelToZoom: true,
        closeTitle: 'Đóng', zoomTitle: 'Phóng to', arrowPrevTitle: 'Ảnh trước', arrowNextTitle: 'Ảnh sau',
        errorMsg: 'Không tải được ảnh này.'
      });
      pswp.addFilter('thumbEl', (el, data) => data.element || el);
      if (layout === 'slideshow') pswp.on('change', () => slideTo(pswp.currIndex));
      pswp.init();
    }).catch(() => openLightbox(index, { from: elFor(index) }));
  }
  // Tải trước PhotoSwipe khi khu Album sắp hiện ra để lần bấm đầu mở ngay
  if ('IntersectionObserver' in window) {
    const pio = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { pio.disconnect(); loadPswp(); } }, { rootMargin: '400px' });
    pio.observe(grid);
  }

  /* ---------------------------------------------------------
     History: back button closes overlays (important on mobile)
     --------------------------------------------------------- */
  const layers = []; // stack of 'album' | 'lb'
  function pushLayer(name) {
    layers.push(name);
    history.pushState({ layer: name, depth: layers.length }, '');
  }
  function popLayerUI() {
    // Called for UI close buttons: let popstate do the actual closing
    if (layers.length) history.back();
  }
  addEventListener('popstate', () => {
    const top = layers.pop();
    if (top === 'lb') closeLightbox();
    else if (top === 'album') closeAlbum();
  });

  /* ---------------------------------------------------------
     Album view (Level 2)
     --------------------------------------------------------- */
  const albumView = $('#albumView');
  const albumInner = $('#albumInner');
  // Bố cục cho ảnh dọc: trio = 3 ảnh tràn ngang, large = 1 ảnh dọc lớn
  const PATTERN = ['trio', 'right', 'pair', 'left', 'large', 'pair'];
  const TAKES = { trio: 3, pair: 2, right: 1, left: 1, large: 1 };
  let albumReturnFocus = null;

  function figHtml(p) {
    return `<figure class="av-fig"><div class="ph js-open" data-id="${p.id}" tabindex="0" role="button" aria-label="Mở ảnh: ${p.cap}"></div></figure>`;
  }

  function renderAlbum(g) {
    const gi = W.galleries.indexOf(g);
    const next = W.galleries[(gi + 1) % W.galleries.length];
    let html = `
      <header class="av-head">
        <p class="kicker">Album ${pad(gi + 1)}</p>
        <h2 class="av-head__title" id="albumTitle">${g.title}</h2>
        <p class="av-head__count">${g.photos.length} ảnh · Doanh &amp; Luyến</p>
      </header>`;
    let i = 0, k = 0;
    const photos = g.photos;
    while (i < photos.length) {
      let type = PATTERN[k++ % PATTERN.length];
      const left = photos.length - i;
      if (type === 'trio' && left < 3) type = left === 2 ? 'pair' : 'large';
      if (type === 'pair' && left < 2) type = 'large';
      const chunk = photos.slice(i, i + TAKES[type]);
      i += chunk.length;
      const cls = type === 'right' || type === 'left' ? `av-single av-single--${type}` : `av-${type}`;
      html += `<div class="av-block ${cls}" data-type="${type}">${chunk.map(figHtml).join('')}</div>`;
    }
    html += `
      <div class="av-end">
        <button class="btn" type="button" data-sheet>Xem dạng lưới</button>
        <button class="av-next" type="button" data-next="${next.key}"><small>Album tiếp theo</small>${next.title} →</button>
      </div>`;
    albumInner.innerHTML = html;

    const sizeFor = type => ({
      trio: '(min-width: 700px) 34vw, 100vw',
      pair: '(min-width: 1100px) 40vw, 50vw',
      large: '(min-width: 1100px) 50vw, 100vw'
    }[type] || '(min-width: 1100px) 42vw, 82vw');
    $$('.av-block', albumInner).forEach(block => {
      const type = block.dataset.type;
      $$('.ph', block).forEach(ph => {
        const p = ALL[indexOfId(ph.dataset.id)];
        fillFigure(ph, p.id, sizeFor(type), p.alt);
        if (!ph.closest('.av-trio')) ph.parentElement.classList.add('reveal');
      });
    });
    observeReveal(albumInner);
    albumView.scrollTop = 0;
  }

  function openAlbum(key, push = true) {
    const g = W.galleries.find(x => x.key === key);
    if (!g) return;
    const alreadyOpen = !albumView.hidden;
    renderAlbum(g);
    if (alreadyOpen) return;
    albumReturnFocus = document.activeElement;
    albumView.hidden = false;
    doc.classList.add('locked');
    requestAnimationFrame(() => requestAnimationFrame(() => albumView.classList.add('is-open')));
    $('#albumClose').focus({ preventScroll: true });
    if (push) pushLayer('album');
  }

  function closeAlbum() {
    albumView.classList.remove('is-open');
    setTimeout(() => {
      albumView.hidden = true;
      albumInner.innerHTML = '';
      if (lb.hidden) doc.classList.remove('locked');
    }, reduceMotion ? 0 : 450);
    if (albumReturnFocus) albumReturnFocus.focus({ preventScroll: true });
  }

  $('#albumClose').addEventListener('click', popLayerUI);
  albumInner.addEventListener('click', e => {
    const next = e.target.closest('[data-next]');
    if (next) return openAlbum(next.dataset.next, false);
    if (e.target.closest('[data-sheet]')) {
      const first = albumInner.querySelector('[data-id]');
      openLightbox(indexOfId(first.dataset.id), { sheet: true });
    }
  });

  /* ---------------------------------------------------------
     Open lightbox from any photo on the page / in album
     --------------------------------------------------------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('.js-open');
    if (!el || el.closest('.lb')) return;
    const id = el.dataset.id || el.dataset.photo;
    openLightbox(indexOfId(id), { from: el });
  });
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.js-open[role="button"]')) {
      e.preventDefault();
      e.target.click();
    }
  });

  /* ---------------------------------------------------------
     Lightbox (Level 3)
     --------------------------------------------------------- */
  const lb = $('#lb');
  const lbSlide = $('#lbSlide');
  const lbCounter = $('#lbCounter');
  const lbDots = $('#lbDots');
  const sheet = $('#sheet');
  const sheetGrid = $('#sheetGrid');
  let lbImg = $('#lbImg');
  let current = 0;
  let lbReturnFocus = null;
  let idleTimer = 0;
  let sheetBuilt = false;
  const preloaded = new Set();

  // Pinch-to-zoom state for the current photo (reset on every show())
  const ZOOM_MIN = 1, ZOOM_MAX = 4, ZOOM_TAP = 2.5;
  let zoomScale = 1, zoomX = 0, zoomY = 0;
  function applyZoom() {
    lbImg.style.transform = zoomScale > 1 ? `translate(${zoomX}px, ${zoomY}px) scale(${zoomScale})` : '';
    lbImg.classList.toggle('is-zoomed', zoomScale > 1.01);
  }
  function clampZoomPan() {
    const r = stage.getBoundingClientRect();
    const maxX = Math.max(0, (r.width * (zoomScale - 1)) / 2);
    const maxY = Math.max(0, (r.height * (zoomScale - 1)) / 2);
    zoomX = Math.min(maxX, Math.max(-maxX, zoomX));
    zoomY = Math.min(maxY, Math.max(-maxY, zoomY));
  }
  function resetZoom() {
    zoomScale = 1; zoomX = 0; zoomY = 0;
    if (lbImg) { lbImg.style.transform = ''; lbImg.classList.remove('is-zoomed'); }
  }
  function toggleZoomAt(clientX, clientY) {
    const r = stage.getBoundingClientRect();
    if (zoomScale > 1.01) {
      zoomScale = 1; zoomX = 0; zoomY = 0;
    } else {
      zoomScale = ZOOM_TAP;
      zoomX = -(clientX - r.left - r.width / 2) * (zoomScale - 1);
      zoomY = -(clientY - r.top - r.height / 2) * (zoomScale - 1);
      clampZoomPan();
    }
    lbImg.style.transition = 'transform 300ms cubic-bezier(0.22, 0.61, 0.36, 1)';
    applyZoom();
    setTimeout(() => { lbImg.style.transition = ''; }, 320);
  }

  const LB_SIZES = '100vw';

  function preload(i) {
    const p = ALL[(i + ALL.length) % ALL.length];
    if (preloaded.has(p.id)) return;
    preloaded.add(p.id);
    const im = new Image();
    im.sizes = LB_SIZES;
    const set = srcset(p.id);
    if (set) im.srcset = set;
    im.src = photoUrl(p.id, 1600);
  }

  function renderDots() {
    const n = ALL.length, max = 7;
    const start = Math.min(Math.max(0, current - 3), Math.max(0, n - max));
    const end = Math.min(n, start + max);
    let html = '';
    for (let i = start; i < end; i++) {
      const edge = (i === start && start > 0) || (i === end - 1 && end < n);
      html += `<i class="${i === current ? 'on' : ''}${edge ? ' edge' : ''}"></i>`;
    }
    lbDots.innerHTML = html;
  }

  function show(i, dir = 0) {
    current = (i + ALL.length) % ALL.length;
    resetZoom();
    const p = ALL[current];

    // Instant placeholder: the (usually cached) thumbnail / tiny blur behind the hi-res image
    const pageImg = document.querySelector(`.ph[data-photo="${p.id}"] img.is-loaded`);
    const ph = pageImg ? pageImg.currentSrc : tinyUrl(p.id);
    lbSlide.style.backgroundImage = ph ? `url("${ph}")` : '';

    const img = makeImg(p.id, LB_SIZES, p.alt, true);
    img.id = 'lbImg';
    img.draggable = false;
    lbImg.replaceWith(img);
    lbImg = img;

    if (dir && !reduceMotion) {
      lbSlide.animate(
        [{ opacity: 0, transform: `translateX(${dir * 40}px)` }, { opacity: 1, transform: 'none' }],
        { duration: 420, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }
      );
    }

    lbCounter.innerHTML = `${pad(current + 1)} <span>/ ${pad(ALL.length)}</span>`;
    renderDots();
    preload(current + 1);
    preload(current - 1);

    $$('.sheet__item', sheetGrid).forEach((el, j) => el.classList.toggle('is-current', j === current));
  }

  function go(dir) { show(current + dir, dir); pokeUI(); }

  function openLightbox(i, opts = {}) {
    lbReturnFocus = opts.from || document.activeElement;
    lb.hidden = false;
    doc.classList.add('locked');
    lbSlide.classList.remove('enter');
    void lbSlide.offsetWidth;
    if (!reduceMotion) lbSlide.classList.add('enter');
    show(i);
    requestAnimationFrame(() => lb.classList.add('is-open'));
    lb.classList.remove('ui-hidden');
    pokeUI();
    $('#lbClose').focus({ preventScroll: true });
    pushLayer('lb');
    if (opts.sheet) openSheet();
  }

  function closeLightbox() {
    lb.classList.remove('is-open');
    closeSheet();
    clearTimeout(idleTimer);
    setTimeout(() => {
      lb.hidden = true;
      if (albumView.hidden) doc.classList.remove('locked');
    }, reduceMotion ? 0 : 380);
    if (lbReturnFocus && lbReturnFocus.focus) lbReturnFocus.focus({ preventScroll: true });
  }

  // Controls fade away when idle (pointer devices); tap toggles on touch
  function pokeUI() {
    lb.classList.remove('ui-hidden');
    clearTimeout(idleTimer);
    if (!sheet.hidden) return;
    idleTimer = setTimeout(() => lb.classList.add('ui-hidden'), 2800);
  }
  lb.addEventListener('mousemove', pokeUI);

  $('#lbClose').addEventListener('click', popLayerUI);
  $('#lbPrev').addEventListener('click', () => go(-1));
  $('#lbNext').addEventListener('click', () => go(1));

  /* Contact sheet */
  function buildSheet() {
    if (sheetBuilt) return;
    sheetBuilt = true;
    const frag = document.createDocumentFragment();
    ALL.forEach((p, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sheet__item';
      b.setAttribute('aria-label', `Ảnh ${i + 1}: ${p.cap}`);
      b.innerHTML = `<div class="ph"></div><span>${pad(i + 1)}</span>`;
      const ph = $('.ph', b);
      const t = tinyUrl(p.id);
      if (t) ph.style.setProperty('--ph', `url("${t}")`);
      ph.appendChild(makeImg(p.id, '(min-width: 1100px) 16vw, (min-width: 600px) 25vw, 33vw', ''));
      b.addEventListener('click', () => { closeSheet(); show(i); pokeUI(); });
      frag.appendChild(b);
    });
    sheetGrid.appendChild(frag);
  }
  function openSheet() {
    buildSheet();
    sheet.hidden = false;
    clearTimeout(idleTimer);
    lb.classList.remove('ui-hidden');
    $$('.sheet__item', sheetGrid).forEach((el, j) => el.classList.toggle('is-current', j === current));
    const cur = sheetGrid.children[current];
    if (cur) cur.scrollIntoView({ block: 'center' });
    $('#sheetClose').focus({ preventScroll: true });
  }
  function closeSheet() {
    if (sheet.hidden) return;
    sheet.hidden = true;
    if (!lb.hidden) $('#lbSheetBtn').focus({ preventScroll: true });
  }
  $('#lbSheetBtn').addEventListener('click', openSheet);
  $('#sheetClose').addEventListener('click', () => { closeSheet(); pokeUI(); });

  /* Keyboard */
  document.addEventListener('keydown', e => {
    if (!lb.hidden) {
      if (e.key === 'Escape') { e.preventDefault(); sheet.hidden ? popLayerUI() : closeSheet(); return; }
      if (!sheet.hidden) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      else if (e.key === 'Tab') trapFocus(e, lb);
      else pokeUI();
      return;
    }
    if (!albumView.hidden) {
      if (e.key === 'Escape') popLayerUI();
      else if (e.key === 'Tab') trapFocus(e, albumView);
      return;
    }
    if (!menu.hidden && e.key === 'Escape') { setMenu(false); menuBtn.focus(); }
  });

  function trapFocus(e, root) {
    const f = $$('button, [href], [tabindex]:not([tabindex="-1"])', root).filter(el => !el.closest('[hidden]') && el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* Swipe / tap / pinch-zoom on the stage */
  const stage = $('#lbStage');
  let sx = 0, sy = 0, st = 0, dx = 0, dy = 0, dragging = false, axis = null;
  const activePointers = new Map(); // pointerId -> {x,y}, drives pinch + zoomed panning
  let pinchStartDist = 0, pinchStartScale = 1, pinchStartMid = { x: 0, y: 0 }, zoomPanStart = { x: 0, y: 0 };
  let lastTapTime = 0, lastTapPos = { x: 0, y: 0 };

  stage.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.size === 2) {
      // Second finger down: (re)start a pinch from the current zoom state
      dragging = false;
      lbSlide.style.transition = 'none';
      lbSlide.style.transform = '';
      lb.style.backgroundColor = '';
      const pts = [...activePointers.values()];
      pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      pinchStartScale = zoomScale;
      pinchStartMid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      zoomPanStart = { x: zoomX, y: zoomY };
      axis = 'pinch';
    } else if (zoomScale > 1.01) {
      // Single finger while zoomed in: pan the photo instead of swiping
      axis = 'pan-zoom';
      sx = e.clientX; sy = e.clientY;
      zoomPanStart = { x: zoomX, y: zoomY };
    } else {
      dragging = true; axis = null;
      sx = e.clientX; sy = e.clientY; st = performance.now(); dx = dy = 0;
      lbSlide.style.transition = 'none';
    }
  });

  stage.addEventListener('pointermove', e => {
    if (!activePointers.has(e.pointerId)) return;
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (axis === 'pinch' && activePointers.size === 2) {
      const pts = [...activePointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      zoomScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, pinchStartScale * (dist / pinchStartDist)));
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      zoomX = zoomPanStart.x + (mid.x - pinchStartMid.x);
      zoomY = zoomPanStart.y + (mid.y - pinchStartMid.y);
      clampZoomPan();
      applyZoom();
      return;
    }
    if (axis === 'pan-zoom') {
      zoomX = zoomPanStart.x + (e.clientX - sx);
      zoomY = zoomPanStart.y + (e.clientY - sy);
      clampZoomPan();
      applyZoom();
      return;
    }
    if (!dragging) return;
    dx = e.clientX - sx; dy = e.clientY - sy;
    if (!axis && Math.hypot(dx, dy) > 8) axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (axis === 'x') lbSlide.style.transform = `translateX(${dx}px)`;
    else if (axis === 'y' && dy > 0) {
      lbSlide.style.transform = `translateY(${dy}px) scale(${1 - Math.min(dy / 1600, 0.08)})`;
      lb.style.backgroundColor = `rgba(13, 12, 11, ${1 - Math.min(dy / 500, 0.5)})`;
    }
  });

  const endDrag = e => {
    activePointers.delete(e.pointerId);

    if (axis === 'pinch' || axis === 'pan-zoom') {
      const wasTap = axis === 'pan-zoom' && Math.hypot(e.clientX - sx, e.clientY - sy) < 8;
      if (activePointers.size === 1 && zoomScale > 1.01) {
        // Lifted one of two pinching fingers: keep panning with the remaining one
        const rest = [...activePointers.values()][0];
        axis = 'pan-zoom';
        sx = rest.x; sy = rest.y;
        zoomPanStart = { x: zoomX, y: zoomY };
        return;
      }
      axis = null; dragging = false;
      // A tap while already zoomed in doesn't reach the un-zoomed tap branch below,
      // so double-tap-to-zoom-out has to be detected here too.
      if (wasTap && e.type === 'pointerup') {
        const now = performance.now();
        const isDoubleTap = now - lastTapTime < 300 && Math.hypot(e.clientX - lastTapPos.x, e.clientY - lastTapPos.y) < 30;
        if (isDoubleTap) {
          lastTapTime = 0;
          toggleZoomAt(e.clientX, e.clientY);
          return;
        }
        lastTapTime = now; lastTapPos = { x: e.clientX, y: e.clientY };
        lb.classList.toggle('ui-hidden');
        clearTimeout(idleTimer);
      }
      if (zoomScale <= 1.01) resetZoom();
      return;
    }

    if (!dragging) return;
    dragging = false;
    const dt = performance.now() - st;
    lbSlide.style.transition = 'transform 350ms cubic-bezier(0.22, 0.61, 0.36, 1)';
    lbSlide.style.transform = '';
    lb.style.backgroundColor = '';
    const fast = dt < 300;

    if (axis === 'x' && (Math.abs(dx) > 60 || (fast && Math.abs(dx) > 25))) {
      lbSlide.style.transition = 'none';
      go(dx < 0 ? 1 : -1);
    } else if (axis === 'y' && dy > 110) {
      popLayerUI();
    } else if (!axis && e.type === 'pointerup') {
      if (e.pointerType === 'mouse') {
        // Mouse click on the image advances; no zoom affordance for pointer devices
        if (e.target === lbImg) go(1);
      } else {
        const now = performance.now();
        const isDoubleTap = now - lastTapTime < 300 && Math.hypot(e.clientX - lastTapPos.x, e.clientY - lastTapPos.y) < 30;
        if (isDoubleTap) {
          lastTapTime = 0;
          toggleZoomAt(e.clientX, e.clientY);
        } else {
          lastTapTime = now;
          lastTapPos = { x: e.clientX, y: e.clientY };
          lb.classList.toggle('ui-hidden');
          clearTimeout(idleTimer);
        }
      }
    }
    setTimeout(() => { lbSlide.style.transition = ''; }, 360);
  };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  /* ---------------------------------------------------------
     Wedding info: families, countdown, calendar
     --------------------------------------------------------- */
  const mapUrl = addr => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
  const PIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg>';
  const house = (f, mod) => `
    <article class="house house--${mod} reveal">
      <h3 class="house__side">${f.side}</h3>
      <p class="house__parents"><span>Ông</span> ${f.father}<br><span>Bà</span> ${f.mother}</p>
      <p class="house__child"><span class="house__role">${f.child.role}</span><span class="house__name">${f.child.name}</span></p>
      <div class="house__place">
        <p class="house__addr">Tư gia ${f.side.toLowerCase()}<br>${f.address}</p>
        <ul class="house__events">
          ${f.events.map(ev => `<li><time>${ev.time}</time><span>${ev.title}<small>${ev.date}</small></span></li>`).join('')}
        </ul>
        <a class="house__map" href="${f.map || mapUrl(f.address)}" target="_blank" rel="noopener">${PIN}Chỉ đường đến ${f.side.toLowerCase()}</a>
      </div>
    </article>`;
  $('#families').innerHTML =
    house(W.families[0], 'groom') +
    `<div class="houses__mid" aria-hidden="true"><i></i>${HEART}<i></i></div>` +
    house(W.families[1], 'bride');
  observeReveal($('#families'));

  const target = new Date(W.date);
  const countdown = $('#countdown');
  function tick() {
    const now = new Date();
    const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const days = Math.round((startOfDay(target) - startOfDay(now)) / 864e5);
    countdown.textContent = days > 1 ? `Còn ${days} ngày`
      : days === 1 ? 'Ngày mai'
      : days === 0 ? 'Hôm nay là ngày trọng đại'
      : 'Cảm ơn bạn đã đến chung vui';
  }
  tick();

  /* The End → all photos */
  $('#allPhotosBtn').addEventListener('click', () => openAlbumAt(0));
  /* ---------------------------------------------------------
     Nhạc nền: tự phát khi mở trang. Nếu trình duyệt chặn (chưa có
     tương tác), nhạc bắt đầu ở lần chạm/bấm phím đầu tiên.
     Khách đã tắt nhạc → lần sau vào lại không tự phát nữa.
     --------------------------------------------------------- */
  const bgm = $('#bgm');
  const musicBtn = $('#musicBtn');
  const musicLabel = $('#musicLabel');
  const MUSIC_VOLUME = 0.6;
  const MUSIC_OFF_KEY = 'wedding-music-off';
  const store = {
    get() { try { return localStorage.getItem(MUSIC_OFF_KEY) === '1'; } catch (e) { return false; } },
    set(off) { try { off ? localStorage.setItem(MUSIC_OFF_KEY, '1') : localStorage.removeItem(MUSIC_OFF_KEY); } catch (e) {} }
  };
  let wantMusic = !store.get();
  let pausedByHide = false;
  let fadeRaf = 0;

  function renderMusic() {
    const playing = !bgm.paused;
    musicBtn.classList.toggle('is-playing', playing);
    musicBtn.classList.toggle('is-waiting', wantMusic && !playing);
    musicBtn.setAttribute('aria-pressed', String(playing));
    musicLabel.textContent = playing ? 'Tắt nhạc' : 'Bật nhạc';
  }

  // Tăng/giảm âm lượng mượt (iOS bỏ qua volume — khi đó chỉ bật/tắt)
  function fadeTo(target, ms, done) {
    cancelAnimationFrame(fadeRaf);
    const from = bgm.volume, t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / ms);
      bgm.volume = from + (target - from) * k;
      if (k < 1) fadeRaf = requestAnimationFrame(step);
      else if (done) done();
    };
    fadeRaf = requestAnimationFrame(step);
  }

  function startMusic() {
    bgm.volume = 0;
    return Promise.resolve(bgm.play()).then(() => fadeTo(MUSIC_VOLUME, 1500));
  }

  // Lần tương tác đầu tiên (không tính bấm vào chính nút nhạc) → phát nhạc
  const GESTURES = ['pointerdown', 'touchend', 'keydown', 'click'];
  function onFirstGesture(e) {
    if (e.target.closest && e.target.closest('#musicBtn')) return;
    if (!wantMusic || !bgm.paused) return disarm();
    startMusic().then(disarm).catch(() => {});
  }
  const arm = () => GESTURES.forEach(t => document.addEventListener(t, onFirstGesture, { capture: true, passive: true }));
  const disarm = () => GESTURES.forEach(t => document.removeEventListener(t, onFirstGesture, { capture: true }));

  musicBtn.addEventListener('click', () => {
    if (!bgm.paused) {
      wantMusic = false;
      store.set(true);
      fadeTo(0, 500, () => bgm.pause());
      musicLabel.textContent = 'Bật nhạc';
    } else {
      wantMusic = true;
      store.set(false);
      startMusic().catch(() => {});
    }
  });

  bgm.addEventListener('play', renderMusic);
  bgm.addEventListener('pause', renderMusic);
  // Tạm dừng khi khách chuyển tab/ứng dụng, quay lại thì phát tiếp
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !bgm.paused) { pausedByHide = true; bgm.pause(); }
    else if (!document.hidden && pausedByHide) { pausedByHide = false; if (wantMusic) bgm.play().catch(() => {}); }
  });
  // Không phát được (mạng lỗi, trình duyệt không hỗ trợ) → ẩn nút
  bgm.addEventListener('error', () => { musicBtn.hidden = true; wantMusic = false; disarm(); });

  renderMusic();
  if (wantMusic) startMusic().catch(arm);
})();
