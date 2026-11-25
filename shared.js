/* shared.js — 全ページ共通スクリプト */

// Loader: DOM 構築後にすぐ非表示にして初期描画（LCP）をブロックしない
(function() {
  function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hide');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(hideLoader), { once: true });
  } else {
    requestAnimationFrame(hideLoader);
  }
  // 念のためのフォールバック
  window.addEventListener('load', hideLoader, { once: true });
})();

// Mobile nav
function setMobState(open) {
  const burger = document.getElementById('burger');
  const mobNav = document.getElementById('mobNav');
  const mobOv = document.getElementById('mobOv');
  if (!burger || !mobNav || !mobOv) return;
  burger.classList.toggle('open', open);
  mobNav.classList.toggle('show', open);
  mobOv.classList.toggle('show', open);
  document.body.classList.toggle('mob-open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
}
function toggleMob() {
  const mobNav = document.getElementById('mobNav');
  setMobState(!(mobNav && mobNav.classList.contains('show')));
}
function closeMob() {
  setMobState(false);
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMob();
});
document.querySelectorAll('.mob-nav a').forEach(a => a.addEventListener('click', closeMob));

// Header hide on scroll (passive + rAF)
(function() {
  const h = document.getElementById('header');
  if (!h) return;
  let lastY = Math.max(0, window.scrollY);
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = Math.max(0, window.scrollY);
      h.classList.toggle('hide-hdr', y > lastY && y > 120);
      h.classList.toggle('scrolled', y > 10);
      lastY = y;
      ticking = false;
    });
  }, { passive: true });
})();

// Scroll reveal（縦長のギャラリー等でも確実に表示されるよう threshold: 0）
(function() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach(el => el.classList.add('vis'));
    return;
  }
  const revealObs = new IntersectionObserver((entries) => {
    let idx = 0;
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const delay = Math.min(idx++, 6) * 40;
        setTimeout(() => e.target.classList.add('vis'), delay);
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -16px 0px' });
  targets.forEach(el => revealObs.observe(el));
})();

// Expand/collapse
function toggleExp(id, btn) {
  const el = document.getElementById(id);
  if (!el) return;
  const expanded = el.classList.toggle('expanded');
  el.style.maxHeight = expanded ? (el.scrollHeight + 'px') : '';
  btn.textContent = expanded ? '閉じる' : 'もっと見る';
  btn.setAttribute('aria-expanded', String(expanded));
}
(function() {
  document.querySelectorAll('.ach-exp').forEach(el => {
    const btn = el.nextElementSibling;
    if (el.scrollHeight <= 305) {
      el.classList.add('expanded');
      if (btn && btn.classList.contains('exp-btn')) btn.style.display = 'none';
    } else if (btn && btn.classList.contains('exp-btn')) {
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', el.id);
    }
  });
})();

// Active nav highlight（拡張子省略 URL にも対応）
(function() {
  let path = location.pathname.split('/').pop() || 'index.html';
  if (path && !path.includes('.')) path += '.html';
  document.querySelectorAll('nav a, .mob-nav a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === path || (path === 'index.html' && (href === '/' || href === 'index.html' || href === './'))) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }
  });
})();

/* ============================================================
   Lite YouTube 埋め込み — クリックで動画を再生
   - サムネイル + 再生ボタンを表示し、クリック時に iframe を生成
   - data-id: YouTube動画ID, data-start: 再生開始秒数
   - youtube-nocookie.com はエラー153が頻発するため youtube.com を使用
   - iOS/Androidでのワンタップ自動再生に対応（playsinline）
   ============================================================ */
(function() {
  document.querySelectorAll('.yt-lite').forEach(el => {
    function load(e) {
      if (el.classList.contains('yt-loaded')) return;
      if (e) e.preventDefault();
      const id = el.dataset.id;
      const start = el.dataset.start || 0;
      const label = el.getAttribute('aria-label') || '講演動画';
      // youtube.com (nocookieではない) + autoplay=1 + playsinline=1 でワンタップ再生
      const src = 'https://www.youtube.com/embed/' + id +
                  '?start=' + start +
                  '&autoplay=1&playsinline=1&rel=0';
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', src);
      iframe.setAttribute('title', label);
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      iframe.setAttribute('allowfullscreen', '');
      iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0';
      // referrerpolicy は付けない方がエラー153を回避できる（YouTubeが referrer を要求するため）
      el.innerHTML = '';
      el.appendChild(iframe);
      el.classList.add('yt-loaded');
      el.style.cursor = 'default';
    }
    el.addEventListener('click', load);
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); load(e); }
    });
  });
})();

/* ============================================================
   フォトギャラリー ライトボックス（gallery.html）
   - .gal-item クリックで高解像度画像を拡大表示
   - 左右矢印キー / スワイプ / Escape に対応
   ============================================================ */
(function() {
  const items = Array.from(document.querySelectorAll('.gal-item'));
  if (!items.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'lb-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', '写真の拡大表示');
  overlay.innerHTML =
    '<button type="button" class="lb-btn lb-close" aria-label="閉じる">&times;</button>' +
    '<button type="button" class="lb-btn lb-prev" aria-label="前の写真">&#8249;</button>' +
    '<div class="lb-stage">' +
      '<img class="lb-img" alt="">' +
      '<div class="lb-counter" aria-live="polite"></div>' +
    '</div>' +
    '<button type="button" class="lb-btn lb-next" aria-label="次の写真">&#8250;</button>';
  document.body.appendChild(overlay);

  const lbImg = overlay.querySelector('.lb-img');
  const lbCounter = overlay.querySelector('.lb-counter');
  const btnClose = overlay.querySelector('.lb-close');
  const btnPrev = overlay.querySelector('.lb-prev');
  const btnNext = overlay.querySelector('.lb-next');

  let current = -1;
  let lastTrigger = null;
  let touchStartX = 0;

  function fullUrl(item) {
    const img = item.querySelector('img');
    return item.dataset.full || (img ? img.currentSrc || img.src : '');
  }

  function show(index) {
    current = (index + items.length) % items.length;
    const item = items[current];
    const img = item.querySelector('img');
    lbImg.src = fullUrl(item);
    lbImg.alt = img ? img.alt : '';
    lbCounter.textContent = (current + 1) + ' / ' + items.length;
    // 次の画像を先読み
    const preload = new Image();
    preload.src = fullUrl(items[(current + 1) % items.length]);
  }

  function open(index, trigger) {
    lastTrigger = trigger;
    show(index);
    overlay.classList.add('show');
    document.body.classList.add('lb-open');
    btnClose.focus();
  }

  function close() {
    if (!overlay.classList.contains('show')) return;
    overlay.classList.remove('show');
    document.body.classList.remove('lb-open');
    if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
  }

  items.forEach((item, i) => {
    item.addEventListener('click', () => open(i, item));
  });

  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', (e) => { e.stopPropagation(); show(current - 1); });
  btnNext.addEventListener('click', (e) => { e.stopPropagation(); show(current + 1); });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  overlay.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  overlay.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 45) show(current + (dx < 0 ? 1 : -1));
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('show')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(current - 1);
    else if (e.key === 'ArrowRight') show(current + 1);
  });
})();

/* ============================================================
   訪問者カウンター（表示は index.html の #visit-count 要素のみ）
   - 自前の Cloudflare Worker（_worker/counter.js）で数える
     ※ 以前の CounterAPI v1 は廃止（410 Gone）されたため移行
   - どのページから来ても 1 セッション 1 カウント（sessionStorage で重複を防ぐ）
   - 同じブラウザで再訪しても、ブラウザを閉じるまでは1カウント
   ------------------------------------------------------------
   カウンター値に下駄を履かせたい場合は _worker/wrangler.toml の
   VISITS_BASE を変えて deploy する
   ============================================================ */
(function() {
  const elNum = document.getElementById('visit-count');
  const API = 'https://gushi-visits.hisator-notebook.com/visits';
  const SESSION_FLAG = 'gh_visit_counted';

  let counted = false;
  try { counted = !!sessionStorage.getItem(SESSION_FLAG); } catch (e) {}
  // 表示の無いページで、もう数え済みなら何もしない
  if (!elNum && counted) return;

  function fmt(n) { return Number(n).toLocaleString('ja-JP'); }

  function animate(el, target) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = fmt(target);
      return;
    }
    const duration = 1400;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(Math.floor(target * eased));
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = fmt(target);
    }
    requestAnimationFrame(step);
  }

  async function run() {
    try {
      // 初回訪問なら POST で +1、再アクセス時は GET のみ
      const res = await fetch(API, { method: counted ? 'GET' : 'POST', cache: 'no-store' });
      if (!res.ok) throw new Error('counter unavailable');
      const data = await res.json();
      if (!counted) { try { sessionStorage.setItem(SESSION_FLAG, '1'); } catch (e) {} }
      if (elNum) animate(elNum, data.count ?? 0);
    } catch (e) {
      // API 失敗時はフォールバック表示
      if (!elNum) return;
      elNum.textContent = '—';
      elNum.style.fontSize = '1.5rem';
      elNum.title = 'カウンター取得エラー';
    }
  }
  run();
})();

