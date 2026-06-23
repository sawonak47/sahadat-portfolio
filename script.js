/* ══════════════════════════════════════════════
   SAWON PORTFOLIO — script.js
══════════════════════════════════════════════ */

'use strict';

// ── CURSOR ──
const cursor = document.getElementById('cursor');
const cursorFollower = document.getElementById('cursor-follower');
let mouseX = 0, mouseY = 0;
let followerX = 0, followerY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (cursor) {
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
  }
});

function animateCursorFollower() {
  followerX += (mouseX - followerX) * 0.12;
  followerY += (mouseY - followerY) * 0.12;
  if (cursorFollower) {
    cursorFollower.style.left = followerX + 'px';
    cursorFollower.style.top = followerY + 'px';
  }
  requestAnimationFrame(animateCursorFollower);
}
animateCursorFollower();

// ── NAVBAR SCROLL ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
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
  document.body.style.overflow = 'hidden';
}
function closeFO() {
  if (!foOverlay || !hamBtn) return;
  foOverlay.classList.remove('open');
  hamBtn.classList.remove('open');
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

// ── DARK / LIGHT MODE ──
const html = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

const savedTheme = localStorage.getItem('sawon-theme') || 'dark';
html.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('sawon-theme', next);
    updateThemeIcon(next);
  });
}

function updateThemeIcon(theme) {
  if (!themeIcon) return;
  themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
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

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.getAttribute('data-filter');
    portfolioItems.forEach((item, i) => {
      const cat = item.getAttribute('data-category');
      const show = filter === 'all' || cat === filter;
      if (show) {
        item.classList.remove('hidden');
        item.style.animationName = 'reveal-up';
        item.style.animationDuration = '0.4s';
        item.style.animationDelay = (i * 0.05) + 's';
        item.style.animationFillMode = 'both';
      } else {
        item.classList.add('hidden');
      }
    });
  });
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
const navLinks = document.querySelectorAll('.nav-link');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinks.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href') === '#' + id) link.style.color = 'var(--violet)';
      });
    }
  });
}, { threshold: 0.4, rootMargin: '-80px 0px 0px 0px' });

sections.forEach(s => navObserver.observe(s));

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
