/* shared.js — 全ページ共通スクリプト */

// Loader
window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('loader').classList.add('hide'), 400);
});

// Mobile nav
function toggleMob() {
  document.getElementById('burger').classList.toggle('open');
  document.getElementById('mobNav').classList.toggle('show');
  document.getElementById('mobOv').classList.toggle('show');
}
function closeMob() {
  document.getElementById('burger').classList.remove('open');
  document.getElementById('mobNav').classList.remove('show');
  document.getElementById('mobOv').classList.remove('show');
}

// Header hide on scroll
let lastY = 0;
window.addEventListener('scroll', () => {
  const h = document.getElementById('header');
  const y = window.scrollY;
  h.classList.toggle('hide-hdr', y > lastY && y > 120);
  h.classList.toggle('scrolled', y > 10);
  lastY = y;
});

// Scroll reveal
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('vis'), i * 50);
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// Expand/collapse
function toggleExp(id, btn) {
  const el = document.getElementById(id);
  el.classList.toggle('expanded');
  btn.textContent = el.classList.contains('expanded') ? '閉じる' : 'もっと見る';
}

// Active nav highlight
(function() {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a, .mob-nav a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === path || (path === 'index.html' && (href === '/' || href === 'index.html' || href === './'))) {
      a.classList.add('active');
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
   訪問者カウンター（index.html の #visit-count 要素にのみ表示）
   - CounterAPI v1（無料・登録不要）を使用
   - sessionStorage で同一セッションの重複カウントを防ぐ
   - 同じブラウザで再訪しても、ブラウザを閉じるまでは1カウント
   ------------------------------------------------------------
   カウンター値を変更したい場合は CounterAPI の以下URLにアクセス:
   https://api.counterapi.dev/v1/gushi-hyuma/site-visits/
   ============================================================ */
(function() {
  const elNum = document.getElementById('visit-count');
  if (!elNum) return;

  const NAMESPACE = 'gushi-hyuma';      // 識別用のネームスペース
  const KEY       = 'site-visits';      // カウンター名
  const SESSION_FLAG = 'gh_visit_counted';

  function fmt(n) { return Number(n).toLocaleString('ja-JP'); }

  function animate(el, target) {
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
      const counted = sessionStorage.getItem(SESSION_FLAG);
      // 初回訪問なら +1、再アクセス時は GET のみ
      const action = counted ? '' : 'up';
      const url = `https://api.counterapi.dev/v1/${NAMESPACE}/${KEY}/${action}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('counter unavailable');
      const data = await res.json();
      if (!counted) sessionStorage.setItem(SESSION_FLAG, '1');
      const n = data.count ?? data.value ?? 0;
      animate(elNum, n);
    } catch (e) {
      // API 失敗時はフォールバック表示
      elNum.textContent = '—';
      elNum.style.fontSize = '1.5rem';
      elNum.title = 'カウンター取得エラー';
    }
  }
  run();
})();
