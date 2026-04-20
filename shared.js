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
