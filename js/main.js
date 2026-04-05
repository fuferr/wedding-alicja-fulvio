/* ============================================================
   main.js — Single-page site scripts
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Sticky nav shrink on scroll ──────────────────────────
  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
  }

  // ── Mobile hamburger menu ────────────────────────────────
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }

  // ── Scroll-spy: highlight active nav link ────────────────
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-links a[href^="#"]');

  if (sections.length && navItems.length) {
    const onScroll = () => {
      let current = '';
      sections.forEach(sec => {
        if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
      });
      navItems.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── Intersection Observer fade-in ───────────────────────
  const fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 80);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    fadeEls.forEach(el => observer.observe(el));
  }

  // ── Countdown timer ──────────────────────────────────────
  const countdownEl = document.getElementById('countdown');
  if (countdownEl) {
    const weddingDate = new Date('2026-09-11T00:00:00');
    function updateCountdown() {
      const diff = weddingDate - new Date();
      if (diff <= 0) return;
      document.getElementById('countdown-days').textContent  = Math.floor(diff / 86400000);
      document.getElementById('countdown-hours').textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2,'0');
      document.getElementById('countdown-mins').textContent  = String(Math.floor((diff % 3600000) / 60000)).padStart(2,'0');
      document.getElementById('countdown-secs').textContent  = String(Math.floor((diff % 60000) / 1000)).padStart(2,'0');
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // ── Gallery lightbox ─────────────────────────────────────
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const lightboxImg   = lightbox.querySelector('img');
    const lightboxClose = lightbox.querySelector('.lightbox-close');
    document.querySelectorAll('.gallery-item[data-src]').forEach(item => {
      item.addEventListener('click', () => {
        lightboxImg.src = item.getAttribute('data-src');
        lightboxImg.alt = item.getAttribute('data-alt') || '';
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });
    const closeLightbox = () => { lightbox.classList.remove('open'); document.body.style.overflow = ''; };
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
  }

  // ── FAQ accordion ────────────────────────────────────────
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-question');
    const ans = item.querySelector('.faq-answer');
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(el => {
        el.classList.remove('open');
        el.querySelector('.faq-answer').style.maxHeight = '0';
      });
      if (!isOpen) {
        item.classList.add('open');
        ans.style.maxHeight = ans.scrollHeight + 'px';
      }
    });
  });

});

// ── Toast helper ────────────────────────────────────────────
function showToast(message, type = '') {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast ${type}`;
  void toast.offsetWidth;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}
