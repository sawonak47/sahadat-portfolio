/* ══════════════════════════════════════════════
   SAWON PORTFOLIO — script.js
══════════════════════════════════════════════ */

'use strict';

// ── CURSOR ──
const cursor = document.getElementById('cursor');
const cursorFollower = document.getElementById('cursor-follower');
let mouseX = 0, mouseY = 0;
let followerX = 0, followerY = 0;
let cursorRafId = null;

function animateCursorFollower() {
  const dx = mouseX - followerX;
  const dy = mouseY - followerY;
  if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
    followerX = mouseX;
    followerY = mouseY;
    if (cursorFollower) {
      cursorFollower.style.left = followerX + 'px';
      cursorFollower.style.top = followerY + 'px';
    }
    cursorRafId = null;
    return;
  }
  followerX += dx * 0.14;
  followerY += dy * 0.14;
  if (cursorFollower) {
    cursorFollower.style.left = followerX + 'px';
    cursorFollower.style.top = followerY + 'px';
  }
  cursorRafId = requestAnimationFrame(animateCursorFollower);
}

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (cursor) {
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
  }
  if (cursorFollower && !cursorRafId) {
    cursorRafId = requestAnimationFrame(animateCursorFollower);
  }
});

// ── NAVBAR SCROLL ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (!navbar) return;
  if (window.scrollY > 40) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ── FULLSCREEN OVERLAY MENU ──
const hamBtn = document.getElementById('hamBtn');
const foOverlay = document.getElementById('fullOverlay');

function openFO() {
  if (!foOverlay || !hamBtn) return;
  foOverlay.classList.add('open');
  hamBtn.classList.add('open');
  document.body.classList.add('menu-open');
  document.body.style.overflow = 'hidden';
}
function closeFO() {
  if (!foOverlay || !hamBtn) return;
  foOverlay.classList.remove('open');
  hamBtn.classList.remove('open');
  document.body.classList.remove('menu-open');
  document.body.style.overflow = '';
}

if (hamBtn) {
  hamBtn.addEventListener('click', () => {
    foOverlay && foOverlay.classList.contains('open') ? closeFO() : openFO();
  });
}

document.querySelectorAll('.fo-link').forEach(link => {
  link.addEventListener('click', () => setTimeout(closeFO, 250));
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeFO();
});

// ── DARK / LIGHT MODE (Light Theme Default) ──
const THEME_KEY = 'sawon-theme-v2';
const html = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
html.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
    updateThemeIcon(next);
  });
}

function updateThemeIcon(theme) {
  if (!themeIcon) return;
  themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// ── SCROLL REVEAL ──
const revealElements = document.querySelectorAll(
  '.glass-card, .service-card, .portfolio-item, .timeline-item, .skill-item, .stat-item, .about-img-block, .contact-info-row, .tool-chip'
);

revealElements.forEach(el => el.classList.add('scroll-reveal'));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 60);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

revealElements.forEach(el => revealObserver.observe(el));

// ── SKILL BARS ──
const skillBars = document.querySelectorAll('.skill-bar');
const skillsSection = document.getElementById('skills');

if (skillsSection) {
  const skillObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      skillBars.forEach(bar => setTimeout(() => bar.classList.add('animated'), 200));
      skillObserver.unobserve(skillsSection);
    }
  }, { threshold: 0.3 });
  skillObserver.observe(skillsSection);
}

// ── COUNTER ANIMATION ──
function animateCounter(el, target, duration = 1500) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { start = target; clearInterval(timer); }
    el.textContent = Math.floor(start) + (el.dataset.suffix || '');
  }, 16);
}

const statsSection = document.querySelector('.stats-bar');
const statNumbers = document.querySelectorAll('.stat-number');

if (statsSection) {
  const statsObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      statNumbers.forEach(el => {
        const text = el.textContent;
        const num = parseFloat(text);
        const suffix = text.replace(/[\d.]/g, '');
        el.dataset.suffix = suffix;
        animateCounter(el, num, 1500);
      });
      statsObserver.unobserve(statsSection);
    }
  }, { threshold: 0.5 });
  statsObserver.observe(statsSection);
}

// ── PORTFOLIO FILTER ──
const filterBtns = document.querySelectorAll('.filter-btn');
const portfolioItems = document.querySelectorAll('.portfolio-item');
const ytShortsShowcase = document.getElementById('yt-shorts-showcase');
const portfolioGrid = document.getElementById('portfolio-grid');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.getAttribute('data-filter');
    let visibleIdx = 0;

    portfolioItems.forEach((item) => {
      const cats = (item.getAttribute('data-category') || '').trim().split(/\s+/);
      const show = filter === 'all' || cats.includes(filter);
      if (show) {
        item.classList.remove('hidden');
        item.classList.add('visible');
        item.style.animationName = 'reveal-up';
        item.style.animationDuration = '0.4s';
        item.style.animationDelay = (visibleIdx * 0.05) + 's';
        item.style.animationFillMode = 'both';
        visibleIdx++;
      } else {
        item.classList.add('hidden');
      }
    });

    if (ytShortsShowcase) {
      const hasVisibleShorts = ytShortsShowcase.querySelectorAll('.portfolio-item:not(.hidden)').length > 0;
      ytShortsShowcase.classList.toggle('hidden', !hasVisibleShorts);
    }
    if (portfolioGrid) {
      const hasVisibleProjects = portfolioGrid.querySelectorAll('.portfolio-item:not(.hidden)').length > 0;
      portfolioGrid.classList.toggle('hidden', !hasVisibleProjects);
    }
  });
});

// ── YOUTUBE SHORTS LIGHTBOX PLAYER ──
const ytModal = document.getElementById('yt-modal');
const ytModalIframe = document.getElementById('yt-modal-iframe');
const ytModalTitle = document.getElementById('yt-modal-title');
const ytModalSubmeta = document.getElementById('yt-modal-submeta');
const ytModalCounter = document.getElementById('yt-modal-counter');
const ytModalExtLink = document.getElementById('yt-modal-ext-link');
const ytPrevBtn = document.getElementById('yt-prev-btn');
const ytNextBtn = document.getElementById('yt-next-btn');
const ytPrevMobile = document.getElementById('yt-prev-mobile');
const ytNextMobile = document.getElementById('yt-next-mobile');
const ytCloseTriggers = document.querySelectorAll('[data-yt-close]');

const ytShortsList = Array.from(document.querySelectorAll('.yt-short-item')).map(el => ({
  id: el.dataset.ytId || '',
  url: el.dataset.ytUrl || '',
  title: el.dataset.ytTitle || 'YouTube Short',
  episode: el.dataset.ytEpisode || '',
  views: el.dataset.ytViews || ''
})).filter(v => v.id);

let activeShortIndex = 0;
let lastYtTrigger = null;

function renderActiveShort(index) {
  if (!ytShortsList.length || !ytModalIframe) return;
  activeShortIndex = (index + ytShortsList.length) % ytShortsList.length;
  const video = ytShortsList[activeShortIndex];

  ytModalIframe.src = `https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&playsinline=1`;
  ytModalIframe.title = video.title;
  if (ytModalTitle) ytModalTitle.textContent = video.title;
  if (ytModalSubmeta) ytModalSubmeta.textContent = [video.episode, video.views].filter(Boolean).join(' · ');
  if (ytModalCounter) ytModalCounter.textContent = `${activeShortIndex + 1} / ${ytShortsList.length}`;
  if (ytModalExtLink) ytModalExtLink.href = video.url || `https://www.youtube.com/shorts/${video.id}`;
}

function openYtModal(videoId, triggerEl) {
  const idx = ytShortsList.findIndex(v => v.id === videoId);
  if (idx === -1) return;

  // Fallback when opened directly via file:// (YouTube blocks iframe embeds with no HTTP Referer)
  if (window.location.protocol === 'file:') {
    window.open(ytShortsList[idx].url || `https://www.youtube.com/shorts/${videoId}`, '_blank', 'noopener,noreferrer');
    return;
  }

  if (!ytModal) return;
  lastYtTrigger = triggerEl || document.activeElement;
  renderActiveShort(idx);
  ytModal.classList.add('open');
  ytModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  const closeBtn = document.getElementById('yt-modal-close');
  if (closeBtn) closeBtn.focus();
}

function closeYtModal() {
  if (!ytModal || !ytModal.classList.contains('open')) return;
  ytModal.classList.remove('open');
  ytModal.setAttribute('aria-hidden', 'true');
  if (ytModalIframe) ytModalIframe.src = '';
  if (!foOverlay || !foOverlay.classList.contains('open')) {
    document.body.style.overflow = '';
  }
  if (lastYtTrigger && typeof lastYtTrigger.focus === 'function') {
    lastYtTrigger.focus();
  }
}

document.querySelectorAll('[data-yt-play]').forEach(btn => {
  btn.addEventListener('click', () => {
    openYtModal(btn.getAttribute('data-yt-play'), btn);
  });
});

ytCloseTriggers.forEach(el => el.addEventListener('click', closeYtModal));
if (ytPrevBtn) ytPrevBtn.addEventListener('click', () => renderActiveShort(activeShortIndex - 1));
if (ytNextBtn) ytNextBtn.addEventListener('click', () => renderActiveShort(activeShortIndex + 1));
if (ytPrevMobile) ytPrevMobile.addEventListener('click', () => renderActiveShort(activeShortIndex - 1));
if (ytNextMobile) ytNextMobile.addEventListener('click', () => renderActiveShort(activeShortIndex + 1));

document.addEventListener('keydown', (e) => {
  if (!ytModal || !ytModal.classList.contains('open')) return;
  if (e.key === 'Escape') closeYtModal();
  else if (e.key === 'ArrowLeft') renderActiveShort(activeShortIndex - 1);
  else if (e.key === 'ArrowRight') renderActiveShort(activeShortIndex + 1);
});

// ── TESTIMONIALS SLIDER ──
const track = document.getElementById('testimonial-track');
const slides = document.querySelectorAll('.testimonial-slide');
const dots = document.querySelectorAll('.dot');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

let currentSlide = 0;
let autoplayInterval;

function goToSlide(index) {
  currentSlide = (index + slides.length) % slides.length;
  if (track) track.style.transform = `translateX(-${currentSlide * 100}%)`;
  dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
}

function startAutoplay() {
  autoplayInterval = setInterval(() => goToSlide(currentSlide + 1), 5000);
}
function stopAutoplay() { clearInterval(autoplayInterval); }

if (prevBtn) prevBtn.addEventListener('click', () => { stopAutoplay(); goToSlide(currentSlide - 1); startAutoplay(); });
if (nextBtn) nextBtn.addEventListener('click', () => { stopAutoplay(); goToSlide(currentSlide + 1); startAutoplay(); });
dots.forEach((dot, i) => dot.addEventListener('click', () => { stopAutoplay(); goToSlide(i); startAutoplay(); }));

const slider = document.getElementById('testimonial-slider');
if (slider) {
  let touchStartX = 0;
  slider.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  slider.addEventListener('touchend', e => {
    const delta = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) { stopAutoplay(); goToSlide(currentSlide + (delta > 0 ? 1 : -1)); startAutoplay(); }
  });
}

if (slides.length) startAutoplay();

// ── CONTACT FORM → Google Form Redirect ──
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdjaOngibEWHydfUW91zw_dc6NRQCnJz79I3A1-YydKWDjM2w/viewform?usp=dialog';

const contactForm = document.getElementById('contactForm');
const formBtnText = document.getElementById('formBtnText');
const formBtnLoading = document.getElementById('formBtnLoading');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Loading দেখাও
    if (formBtnText) formBtnText.classList.add('hidden');
    if (formBtnLoading) formBtnLoading.classList.remove('hidden');

    // ৬০০ms পর Google Form নতুন tab-এ খুলবে
    setTimeout(() => {
      window.open(GOOGLE_FORM_URL, '_blank');

      // Button reset
      if (formBtnText) formBtnText.classList.remove('hidden');
      if (formBtnLoading) formBtnLoading.classList.add('hidden');

      contactForm.reset();
    }, 600);
  });
}

// ── BACK TO TOP ──
const backToTop = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {
  if (backToTop) {
    if (window.scrollY > 400) backToTop.classList.add('visible');
    else backToTop.classList.remove('visible');
  }
});

if (backToTop) {
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ── ACTIVE NAV LINK ──
const sections = document.querySelectorAll('section[id]');
const hashNavLinks = Array.from(document.querySelectorAll('.nav-link')).filter(
  link => (link.getAttribute('href') || '').startsWith('#')
);

if (hashNavLinks.length) {
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        hashNavLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { threshold: 0.35, rootMargin: '-80px 0px 0px 0px' });

  sections.forEach(s => navObserver.observe(s));
}

// ── SMOOTH SCROLL ──
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    }
  });
});

// ── PARALLAX ORBS ──
const orbs = document.querySelectorAll('.hero-bg-orb');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  orbs.forEach((orb, i) => { orb.style.transform = `translateY(${y * (0.08 + i * 0.04)}px)`; });
}, { passive: true });

// ── TILT ON SERVICE CARDS ──
document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `translateY(-8px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

console.log('%c✦ Sawon Portfolio Loaded ✦', 'color: #6C3EFF; font-size: 16px; font-weight: bold;');
