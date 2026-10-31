// ========================================
// 100Percent — Animation & Interaction Engine
// Libraries: Lenis (smooth scroll) • GSAP + ScrollTrigger (animations)
//            Vanta + Three.js (3D background) • Magic UI ports
//            React Bits vanilla ports • SmoothUI Siri Orb
// ========================================

/* global gsap, ScrollTrigger, Lenis, VANTA, THREE */

// ----------------------------------------
// 0. Preloader — ASCII progress (index only)
// ----------------------------------------
function initPreloader() {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  const bar = document.getElementById('preloaderBar');
  const pct = document.getElementById('preloaderPct');
  const reduced = prefersReducedMotion();
  const DURATION = reduced ? 200 : 1400;
  const start = performance.now();

  function frame(now) {
    const t = Math.min((now - start) / DURATION, 1);
    const eased = 1 - Math.pow(1 - t, 2);
    const percent = Math.round(eased * 100);
    if (pct) pct.textContent = percent + '%';
    if (bar) {
      const filled = Math.round(eased * 12);
      bar.innerHTML =
        '<span class="fill">' + '+'.repeat(filled) + '</span>' +
        '='.repeat(12 - filled);
    }
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      preloader.classList.add('done');
      // Guaranteed removal even if the fade transition is throttled.
      setTimeout(function () { preloader.style.display = 'none'; }, 800);
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    }
  }
  requestAnimationFrame(frame);

  // Watchdog: if rAF is throttled (background tab), force-complete.
  setTimeout(function () {
    if (!preloader.classList.contains('done')) {
      preloader.classList.add('done');
      setTimeout(function () { preloader.style.display = 'none'; }, 800);
    }
  }, 2400);
}

// ----------------------------------------
// 0b. Journey sector reveals (index)
// All sector text is visible from load — no staggered reveals.
// Text scrolls in lockstep with the 3D camera via scroll progress.
// ----------------------------------------
function initSectorReveals() {
  const revealTargets = [
    '.sector-kicker',
    '.sector-title',
    '.sector-title-large',
    '.sector-text',
    '.sector-meta',
    '.sector-numeral',
    '.sector-actions'
  ];
  revealTargets.forEach((selector) => {
    document.querySelectorAll(selector).forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.visibility = 'visible';
    });
  });
}

// ----------------------------------------
// 0c. Unified scroll — one ScrollTrigger drives both 3D camera and DOM text
// Keeps shapes and text moving together as a single camera dolly.
// ----------------------------------------
function initUnifiedScroll() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const p = self.progress; // 0..1 linear scroll progress

      // Drive the 3D camera from the SAME progress value
      if (typeof window.__descentSetProgress === 'function') {
        window.__descentSetProgress(p);
      }
    },
  });
}

// ----------------------------------------
// 1. Lenis Smooth Scroll (with GSAP sync)
// ----------------------------------------
let lenis = null;

function initLenis() {
  if (typeof Lenis === 'undefined') return;
  
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    orientation: 'vertical',
    gestureOrientation: 'both',
  });

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  } else {
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
}

// ----------------------------------------
// 2. Vanta Animated Background (hero)
// ----------------------------------------
let vantaEffect = null;

function initVanta() {
  const heroEl = document.getElementById('hero-background');
  if (!heroEl || typeof VANTA === 'undefined' || typeof THREE === 'undefined') return;
  
  try {
    vantaEffect = VANTA.NET({
      el: '#hero-background',
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.00,
      minWidth: 200.00,
      scale: 1.00,
      scaleMobile: 1.00,
      color: 0xd4af37,              // Gordon's gold
      backgroundColor: 0x0f1c2e,    // navy deep
      points: 14,
      maxDistance: 24,
      spacing: 18,
      showDots: true
    });
  } catch (e) {
    console.warn('Vanta init failed, falling back to CSS background', e);
  }
}

// ----------------------------------------
// 3. GSAP Entrance Animations
// ----------------------------------------
function initHeroAnimations() {
  if (typeof gsap === 'undefined') return;

  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' }
  });

  tl.from('.hero-kicker', { opacity: 0, y: 24, duration: 0.7 })
    .from('.hero-title', { opacity: 0, y: 48, duration: 0.9 }, '-=0.45')
    .from('.hero-subtitle', { opacity: 0, y: 32, duration: 0.7 }, '-=0.55')
    .from('.hero-actions .btn', { opacity: 0, y: 24, stagger: 0.12, duration: 0.6 }, '-=0.45')
    .from('.hero-visual', { opacity: 0, y: 40, scale: 0.96, duration: 0.8 }, '-=0.4');
}

function initScrollAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  // Section headers reveal — immediateRender:false keeps content visible if rAF stalls
  gsap.utils.toArray('.section-header').forEach((header) => {
    gsap.from(header, {
      opacity: 0,
      y: 40,
      duration: 0.9,
      ease: 'power3.out',
      immediateRender: false,
      scrollTrigger: {
        trigger: header,
        start: 'top 85%',
        toggleActions: 'play none none none'
      }
    });
  });

  // Stat cards stagger reveal
  ScrollTrigger.batch('.stat-card', {
    onEnter: (batch) => gsap.from(batch, {
      opacity: 0,
      y: 48,
      stagger: 0.15,
      duration: 0.8,
      ease: 'power3.out',
      immediateRender: false
    }),
    start: 'top 85%',
    once: true
  });

  // Feature cards stagger reveal
  ScrollTrigger.batch('.feature-card', {
    onEnter: (batch) => gsap.from(batch, {
      opacity: 0,
      y: 48,
      scale: 0.97,
      stagger: 0.12,
      duration: 0.8,
      ease: 'power3.out',
      immediateRender: false
    }),
    start: 'top 85%',
    once: true
  });

  // Marquee fade in
  const marquee = document.querySelector('.marquee');
  if (marquee) {
    gsap.from(marquee, {
      opacity: 0,
      y: 32,
      duration: 1,
      ease: 'power3.out',
      immediateRender: false,
      scrollTrigger: {
        trigger: marquee,
        start: 'top 90%',
        toggleActions: 'play none none none'
      }
    });
  }

  // Parallax on tilt card
  const tiltCard = document.querySelector('.tilt-card');
  if (tiltCard) {
    gsap.to(tiltCard, {
      yPercent: -8,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });
  }
}

// ----------------------------------------
// 4. Animated Counters (React Bits port)
// ----------------------------------------
function animateCounterWithSuffix(element, target, suffix = '', duration = 2000) {
  const start = performance.now();
  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = eased * target;
    if (value >= 1000000) {
      element.textContent = (value / 1000000).toFixed(1) + 'M' + suffix;
    } else if (value >= 1000) {
      element.textContent = (value / 1000).toFixed(0) + 'k' + suffix;
    } else {
      element.textContent = Math.floor(value) + suffix;
    }
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        entry.target.dataset.counted = 'true';
        const target = parseFloat(entry.target.dataset.counter);
        const suffix = entry.target.dataset.suffix || '';
        animateCounterWithSuffix(entry.target, target, suffix, 2200);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(counter => observer.observe(counter));
}

// ----------------------------------------
// 5. Spotlight Cards (React Bits port)
// ----------------------------------------
function initSpotlightCards() {
  const cards = document.querySelectorAll('.spotlight-card');
  if (!cards.length) return;

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    });
  });
}

// ----------------------------------------
// 6. Tilt Cards (React Bits port, enhanced)
// ----------------------------------------
function initTiltCards() {
  const cards = document.querySelectorAll('.tilt-card');
  if (!cards.length) return;

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.02)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) scale(1)';
    });
  });
}

// ----------------------------------------
// 7. Magnetic Buttons (GSAP)
// ----------------------------------------
function initMagneticButtons() {
  if (typeof gsap === 'undefined') return;
  
  document.querySelectorAll('.btn-primary, .btn-primary-nav').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, { x: x * 0.25, y: y * 0.25, duration: 0.35, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

// ----------------------------------------
// 8. Split Text (React Bits port)
// Split characters show immediately — they scroll with the page
// in lockstep with the 3D camera.
// ----------------------------------------
function splitTextChars(element) {
  const text = element.textContent;
  element.setAttribute('aria-label', text);
  element.innerHTML = text.split('').map((char, i) =>
    `<span class="split-char" aria-hidden="true" style="display:inline-block; opacity:1; transform:none;">${char === ' ' ? '&nbsp;' : char}</span>`
  ).join('');
}

function initSplitText() {
  const elements = document.querySelectorAll('.split-text');
  if (!elements.length) return;
  elements.forEach(el => splitTextChars(el));
}

// ----------------------------------------
// 9. Header Scroll State
// ----------------------------------------
function initHeaderScroll() {
  const header = document.getElementById('mainHeader');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ----------------------------------------
// 10. Smooth Anchor Links (Lenis)
// ----------------------------------------
function initAnchorLinks() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#' || href.length < 2) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(target, { duration: 1.2 });
        } else {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
}

// ----------------------------------------
// 11. Typewriter (React Bits port)
// ----------------------------------------
function typewriter(element, texts, speed = 80, pause = 2400) {
  let textIndex = 0, charIndex = 0, deleting = false;

  function tick() {
    const current = texts[textIndex];
    element.textContent = current.slice(0, charIndex);

    if (!deleting && charIndex < current.length) {
      charIndex++;
      setTimeout(tick, speed);
    } else if (deleting && charIndex > 0) {
      charIndex--;
      setTimeout(tick, speed / 2);
    } else if (!deleting) {
      deleting = true;
      setTimeout(tick, pause);
    } else {
      deleting = false;
      textIndex = (textIndex + 1) % texts.length;
      setTimeout(tick, 500);
    }
  }
  tick();
}

function initTypewriter() {
  const el = document.querySelector('.typewriter');
  if (!el) return;
  let phrases = [];
  try {
    phrases = JSON.parse(el.dataset.phrases || '[]');
  } catch (e) {
    phrases = [];
  }
  if (phrases.length) typewriter(el, phrases);
}

// ----------------------------------------
// 12. Login Form (preserved)
// ----------------------------------------
function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    let isValid = true;
    if (!email) {
      showInputError(document.getElementById('email'), 'Please enter your email or username');
      isValid = false;
    } else {
      clearInputError(document.getElementById('email'));
    }
    if (!password) {
      showInputError(document.getElementById('password'), 'Please enter your password');
      isValid = false;
    } else {
      clearInputError(document.getElementById('password'));
    }

    if (isValid) {
      const btn = form.querySelector('.login-btn');
      btn.textContent = 'Logging in...';
      btn.style.opacity = '0.7';
      btn.disabled = true;

      if (typeof gsap !== 'undefined') {
        gsap.to(btn, { scale: 0.97, duration: 0.15, yoyo: true, repeat: 1 });
      }

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1200);
    }
  });
}

function showInputError(input, message) {
  input.classList.add('error');
  input.style.borderColor = '#ef4444';
  const existingError = input.parentNode.querySelector('.error-message');
  if (existingError) existingError.remove();
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.color = '#ef4444';
  errorDiv.style.fontSize = '12px';
  errorDiv.style.marginTop = '4px';
  input.parentNode.appendChild(errorDiv);
}

function clearInputError(input) {
  input.classList.remove('error');
  input.style.borderColor = '';
  const errorMsg = input.parentNode.querySelector('.error-message');
  if (errorMsg) errorMsg.remove();
}

// ----------------------------------------
// 13. Password Toggle (preserved)
// ----------------------------------------
function initPasswordToggle() {
  const toggle = document.getElementById('togglePassword');
  const password = document.getElementById('password');
  if (!toggle || !password) return;

  let isVisible = false;
  toggle.addEventListener('click', () => {
    isVisible = !isVisible;
    password.type = isVisible ? 'text' : 'password';
    const svg = toggle.querySelector('svg');
    if (isVisible) {
      svg.innerHTML = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.06M9 9h.01M17 17h.01M12 20a8 8 0 0 0-6.24-11.15M18.76 3.84A10.05 10.05 0 0 1 22 12c0 7-7 11-11 11a18.45 18.45 0 0 1-5.06-5.06"></path>
      `;
    } else {
      svg.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      `;
    }
  });
}

// ----------------------------------------
// 14. Question Page (preserved)
// ----------------------------------------
function initQuestionNavigation() {
  const qButtons = document.querySelectorAll('.q-button');
  if (!qButtons.length) return;

  qButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      qButtons.forEach(b => b.classList.remove('active', 'current'));
      btn.classList.add('current');
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(btn, { scale: 0.9 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' });
      }
    });
  });
}

function initSubmitAnswer() {
  const btn = document.querySelector('.submit-answer-btn');
  const input = document.querySelector('.question-answer-input');
  if (!btn || !input) return;

  btn.addEventListener('click', () => {
    const answer = input.value.trim();
    if (!answer) {
      input.style.borderColor = '#ef4444';
      input.focus();
      return;
    }

    btn.textContent = 'Submitting...';
    btn.style.opacity = '0.7';
    btn.disabled = true;

    setTimeout(() => {
      const isCorrect = Math.abs(parseFloat(answer) - 0.111) < 0.01 || answer === '1/9';
      btn.textContent = 'Submit Answer';
      btn.style.opacity = '1';
      btn.disabled = false;

      if (isCorrect) {
        input.style.borderColor = '#10b981';
        btn.classList.add('correct');
        btn.textContent = 'Correct!';
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(btn, { scale: 1 }, { scale: 1.05, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.out' });
        }
        setTimeout(() => {
          const nextBtn = document.querySelector('.q-button:not(.active):not(.current)');
          if (nextBtn) nextBtn.click();
        }, 1000);
      } else {
        input.style.borderColor = '#ef4444';
        btn.textContent = 'Try Again';
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(input, { x: -6 }, { x: 6, duration: 0.06, repeat: 5, yoyo: true, clearProps: 'x' });
        }
        setTimeout(() => {
          input.style.borderColor = '';
          btn.classList.remove('correct');
          btn.textContent = 'Submit Answer';
          input.value = '';
          input.focus();
        }, 1500);
      }
    }, 900);
  });

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') btn.click();
  });
}

// ----------------------------------------
// 15. Mobile Menu (preserved)
// ----------------------------------------
function initMobileMenu() {
  const btn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.main-nav');
  if (!btn || !nav) return;

  let isOpen = false;

  const openNav = () => {
    nav.style.display = 'flex';
    nav.style.flexDirection = 'column';
    nav.style.position = 'fixed';
    nav.style.top = '72px';
    nav.style.left = '0';
    nav.style.right = '0';
    nav.style.backgroundColor = '#050a12';
    nav.style.padding = '24px';
    nav.style.borderTop = '1px solid rgba(232,237,242,0.14)';
    nav.style.zIndex = '999';
  };

  const closeNav = () => {
    nav.style.display = '';
    nav.style.flexDirection = '';
    nav.style.position = '';
    nav.style.top = '';
    nav.style.left = '';
    nav.style.right = '';
    nav.style.backgroundColor = '';
    nav.style.padding = '';
    nav.style.borderTop = '';
    nav.style.zIndex = '';
  };

  btn.addEventListener('click', () => {
    isOpen = !isOpen;
    if (isOpen) {
      openNav();
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(nav, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
      }
    } else {
      closeNav();
    }
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (isOpen) { isOpen = false; closeNav(); }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      isOpen = false;
      closeNav();
    }
  });
}

// ----------------------------------------
// 16. Reduced Motion Respect
// ----------------------------------------
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ----------------------------------------
// 16b. Animation Watchdog
// If the tab loads in a background state, requestAnimationFrame may be
// throttled and GSAP 'from' tweens never tick, leaving content invisible.
// After 3s, force any progress-0 tweens to complete so content shows.
// ----------------------------------------
function initAnimationWatchdog() {
  if (typeof gsap === 'undefined') return;
  let checks = 0;
  const interval = setInterval(() => {
    try {
      const tweens = gsap.globalTimeline.getChildren(true, true, true);
      let stuck = 0;
      tweens.forEach((t) => {
        if (t.progress() === 0 && t.isActive()) {
          t.progress(1);
          stuck++;
        }
      });
      if (stuck > 0 && typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    } catch (e) {
      /* noop */
    }
    checks++;
    if (checks >= 6) clearInterval(interval);  // run for ~12s then stop
  }, 2000);
}

// ----------------------------------------
// Sign Out
// ----------------------------------------
function signOut() {
  if (typeof sb === 'undefined') return;
  sb.auth.signOut().then(function () {
    window.location.href = 'login.html';
  }).catch(function () {
    window.location.href = 'login.html';
  });
}

window.signOut = signOut;

// ----------------------------------------
// Boot
// ----------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const reduced = prefersReducedMotion();

  initPreloader();
  initLenis();
  initHeaderScroll();
  initAnchorLinks();

  if (!reduced) {
    initVanta();
    initHeroAnimations();
    initScrollAnimations();
    initSectorReveals();
    initUnifiedScroll();
    initMagneticButtons();
    initTiltCards();
    initAnimationWatchdog();
  }

  initCounters();
  initSpotlightCards();
  initSplitText();
  initTypewriter();
  initLoginForm();
  initPasswordToggle();
  if (!document.querySelector('.question-page')) {
    initQuestionNavigation();
    initSubmitAnswer();
  }
  initMobileMenu();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (vantaEffect) vantaEffect.destroy();
  if (lenis) lenis.destroy();
});