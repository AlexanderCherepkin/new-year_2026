/* ===========================
   new-year.js — PRODUCTION (final)
   =========================== */

// ============================================
// PRODUCTION MODE: Отключение console в продакшене
// ============================================
const __IS_LOCAL__ =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

if (!__IS_LOCAL__) {
  console.log = function () { };
  console.warn = function () { };
  console.error = function () { };
  console.info = function () { };
}

// ============================================
// PERFORMANCE DETECTION & SNOW CONFIG
// ============================================
const PerformanceManager = {
  isLowPerformance: false,
  snowEnabled: true,

  init() {
    this.detectPerformance();
    this.loadSettings();
  },

  detectPerformance() {
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4;
    const isMobile = window.innerWidth <= 768;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.isLowPerformance = cores < 4 || memory < 4 || isMobile || prefersReducedMotion;

    if (prefersReducedMotion) {
      this.snowEnabled = false;
    }
  },

  get baseSnowflakes() {
    // Если снег выключен пользователем, возвращаем 0
    if (!this.snowEnabled) return 0;

    const count = Math.floor(window.innerWidth / 100);

    // Low perf: минимум 30
    if (this.isLowPerformance) {
      return Math.max(count, 30);
    }

    // Normal: минимум 50
    return Math.max(count, 50);
  },

  loadSettings() {
    try {
      const saved = localStorage.getItem('snowEnabled');
      if (saved !== null) {
        this.snowEnabled = saved === 'true';
      }
    } catch (e) {
      // Ошибка обработана
    }
  },

  saveSettings() {
    try {
      localStorage.setItem('snowEnabled', this.snowEnabled);
    } catch (e) {
      // Ошибка обработана
    }
  },

  toggleSnow() {
    this.snowEnabled = !this.snowEnabled;
    this.saveSettings();
    return this.snowEnabled;
  }
};

PerformanceManager.init();

// ============================================
// TOAST NOTIFICATIONS SYSTEM
// ============================================
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toastContainer');
  },

  show(options) {
    if (!this.container) return null;

    const {
      type = 'info',
      title = '',
      message = '',
      duration = 5000
    } = options;

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
            <span class="toast__icon">${icons[type]}</span>
            <div class="toast__content">
                ${title ? `<div class="toast__title">${title}</div>` : ''}
                <p class="toast__message">${message}</p>
            </div>
            <button class="toast__close" aria-label="Закрыть">
                <i class="fas fa-times"></i>
            </button>
            <div class="toast__progress" style="animation-duration: ${duration}ms"></div>
        `;

    this.container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    const closeBtn = toast.querySelector('.toast__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide(toast));
    }

    if (duration > 0) {
      setTimeout(() => this.hide(toast), duration);
    }

    return toast;
  },

  hide(toast) {
    if (!toast) return;
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  },

  success(title, message, duration = 5000) {
    return this.show({ type: 'success', title, message, duration });
  },

  error(title, message, duration = 5000) {
    return this.show({ type: 'error', title, message, duration });
  },

  warning(title, message, duration = 5000) {
    return this.show({ type: 'warning', title, message, duration });
  },

  info(title, message, duration = 5000) {
    return this.show({ type: 'info', title, message, duration });
  }
};

// ============================================
// REALISTIC SNOWFLAKES (CANVAS)
// ============================================
// Canvas будет инициализирован позже в initSnowCanvas()
let snowflakes = [];

let resizeTimeout;
function resizeCanvas() {
  const canvas = document.getElementById('snowCanvas');
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

class Snowflake {
  constructor() {
    this.reset();
    this.y = Math.random() * (window.snowCanvas?.height || 0);
  }

  reset() {
    this.x = Math.random() * (window.snowCanvas?.width || 0);
    this.y = -20;
    this.radius = Math.random() * 4 + 2;
    this.speed = Math.random() * 1 + (PerformanceManager.isLowPerformance ? 1 : 1.5);
    this.wind = Math.random() * 0.8 - 0.4;
    this.opacity = Math.random() * 0.5 + 0.5;
    this.swing = Math.random() * 2 - 1;
    this.swingSpeed = Math.random() * 0.03 + 0.01;
    this.angle = 0;
  }

  update() {
    this.y += this.speed;
    this.angle += this.swingSpeed;
    this.x += Math.sin(this.angle) * this.swing + this.wind;

    if (this.y > (window.snowCanvas?.height || 0) + 20) {
      this.reset();
    }

    if (this.x > (window.snowCanvas?.width || 0) + 20) {
      this.x = -20;
    } else if (this.x < -20) {
      this.x = (window.snowCanvas?.width || 0) + 20;
    }
  }

  draw() {
    if (!window.snowCtx) return;

    window.snowCtx.save();
    window.snowCtx.translate(this.x, this.y);
    window.snowCtx.rotate(this.angle);

    window.snowCtx.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`;
    window.snowCtx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
    window.snowCtx.lineWidth = 1.5;
    window.snowCtx.lineCap = 'round';

    if (PerformanceManager.isLowPerformance) {
      window.snowCtx.beginPath();
      window.snowCtx.arc(0, 0, this.radius, 0, Math.PI * 2);
      window.snowCtx.fill();
    } else {
      const arms = 6;
      const armLength = this.radius;

      for (let i = 0; i < arms; i++) {
        window.snowCtx.rotate(Math.PI / 3);

        window.snowCtx.beginPath();
        window.snowCtx.moveTo(0, 0);
        window.snowCtx.lineTo(0, -armLength);
        window.snowCtx.stroke();

        window.snowCtx.beginPath();
        window.snowCtx.moveTo(0, -armLength * 0.6);
        window.snowCtx.lineTo(-armLength * 0.3, -armLength * 0.8);
        window.snowCtx.stroke();

        window.snowCtx.beginPath();
        window.snowCtx.moveTo(0, -armLength * 0.6);
        window.snowCtx.lineTo(armLength * 0.3, -armLength * 0.8);
        window.snowCtx.stroke();

        window.snowCtx.beginPath();
        window.snowCtx.arc(0, -armLength, 1, 0, Math.PI * 2);
        window.snowCtx.fill();
      }

      window.snowCtx.beginPath();
      window.snowCtx.arc(0, 0, 1.5, 0, Math.PI * 2);
      window.snowCtx.fill();
    }

    window.snowCtx.restore();
  }
}

const SnowOptimizer = {
  rafId: null,
  lastTime: 0,
  fps: PerformanceManager.isLowPerformance ? 20 : 30,
  frameCount: 0,

  initSnowflakes() {
    snowflakes = [];
    const count = PerformanceManager.baseSnowflakes;
    for (let i = 0; i < count; i++) {
      snowflakes.push(new Snowflake());
    }
  },

  render(currentTime) {
    if (!window.snowCtx || !window.snowCanvas) {
      console.error('❌ render() called but canvas/ctx not available!');
      return;
    }

    if (currentTime - this.lastTime < 1000 / this.fps) {
      this.rafId = requestAnimationFrame((t) => this.render(t));
      return;
    }

    this.lastTime = currentTime;
    window.snowCtx.clearRect(0, 0, window.snowCanvas.width, window.snowCanvas.height);

    snowflakes.forEach(snowflake => {
      snowflake.update();
      snowflake.draw();
    });

    this.rafId = requestAnimationFrame((t) => this.render(t));

    // Логируем только первые 3 фрейма
    if (this.frameCount < 3) {
      console.log('🎞️ Frame', this.frameCount, '- rendered', snowflakes.length, 'snowflakes');
      this.frameCount++;
    }
  },

  start() {
    if (this.rafId) return;
    if (!PerformanceManager.snowEnabled) return;

    this.frameCount = 0;
    this.initSnowflakes();
    this.rafId = requestAnimationFrame((t) => this.render(t));
  },

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (window.snowCtx && window.snowCanvas) {
      window.snowCtx.clearRect(0, 0, window.snowCanvas.width, window.snowCanvas.height);
    }
  }
};

// ============================================
// SNOW INITIALIZATION
// ============================================
function initSnowCanvas() {
  const canvas = document.getElementById('snowCanvas');
  if (!canvas) return;

  // Обновляем глобальные переменные
  window.snowCanvas = canvas;
  window.snowCtx = canvas.getContext('2d');

  resizeCanvas();
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeCanvas, 150);
  });

  // ✅ FIX: обработчик мыши теперь внутри initSnowCanvas()
  if (!PerformanceManager.isLowPerformance) {
    canvas.addEventListener('mousemove', (e) => {
      if (!PerformanceManager.snowEnabled || Math.random() > 0.1) return;

      const newSnowflake = new Snowflake();
      newSnowflake.x = e.clientX + (Math.random() * 100 - 50);
      newSnowflake.y = e.clientY + (Math.random() * 100 - 50);
      newSnowflake.speed = Math.random() * 3 + 2;
      snowflakes.push(newSnowflake);

      const limit = PerformanceManager.baseSnowflakes + 20;
      if (snowflakes.length > limit) {
        snowflakes.splice(0, snowflakes.length - limit);
      }
    }, { passive: true });
  }

  // Автостарт снега если включен
  if (PerformanceManager.snowEnabled && window.snowCanvas) {
    SnowOptimizer.start();
  }
}

// ============================================
// SNOW TOGGLE
// ============================================
const snowToggle = document.getElementById('snowToggle');
if (snowToggle) {
  snowToggle.addEventListener('click', () => {
    const enabled = PerformanceManager.toggleSnow();
    snowToggle.classList.toggle('snow-off', !enabled);

    if (enabled) {
      SnowOptimizer.start();
    } else {
      SnowOptimizer.stop();
    }

    Toast.show({
      type: enabled ? 'success' : 'info',
      title: enabled ? 'Снег включён' : 'Снег выключен',
      message: enabled ? 'Наслаждайтесь зимней атмосферой!' : 'Анимация снега отключена',
      duration: 3000
    });
  });

  if (!PerformanceManager.snowEnabled) {
    snowToggle.classList.add('snow-off');
  }
}

// Оптимизация снега для лучшей производительности (если есть DOM-снежинки)
function optimizeSnowAnimation() {
  const snowflakes = document.querySelectorAll('.snowflake');

  // Или ограничьте количество снежинок на мобильных
  if (window.innerWidth < 768 && snowflakes.length > 30) {
    for (let i = 30; i < snowflakes.length; i++) {
      snowflakes[i].remove();
    }
  }
}

window.addEventListener('load', optimizeSnowAnimation);
window.addEventListener('resize', optimizeSnowAnimation);

// ============================================
// HEADER SCROLL EFFECT
// ============================================
const header = document.getElementById('header');
if (header) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
  }, { passive: true });
}

// ============================================
// MOBILE MENU TOGGLE
// ============================================
(function () {
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');

  if (!menuToggle || !nav) {
    console.warn('Menu elements not found');
    return;
  }

  menuToggle.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();

    // Toggle is-active on the nav element (CSS expects .nav.is-active at 1024px breakpoint)
    const isActive = nav.classList.toggle('is-active');
    menuToggle.classList.toggle('is-active', isActive);
    menuToggle.setAttribute('aria-expanded', isActive);
    menuToggle.setAttribute('aria-label', isActive ? 'Закрыть меню' : 'Открыть меню');

    document.body.classList.toggle('menu-open', isActive);
  });

  const navList = document.getElementById('navList');
  if (navList) {
    navList.querySelectorAll('.nav__link').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-active');
        menuToggle.classList.remove('is-active');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      });
    });
  }

  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target) && !menuToggle.contains(e.target)) {
      nav.classList.remove('is-active');
      menuToggle.classList.remove('is-active');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-active')) {
      nav.classList.remove('is-active');
      menuToggle.classList.remove('is-active');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    }
  });
})();

// ============================================
// SMOOTH SCROLL
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    const target = href ? document.querySelector(href) : null;
    if (!target) return;

    e.preventDefault();

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    const navEl = document.getElementById('nav');
    const menuToggleEl = document.getElementById('menuToggle');
    if (navEl && navEl.classList.contains('is-active')) {
      navEl.classList.remove('is-active');
      if (menuToggleEl) {
        menuToggleEl.classList.remove('is-active');
        menuToggleEl.setAttribute('aria-expanded', 'false');
      }
      document.body.classList.remove('menu-open');
    }
  });
});

// ============================================
// COUNTDOWN TIMER
// ============================================
// COUNTDOWN TIMER - VERSION 2.0 (2025-12-26)
// ============================================
function updateCountdown() {
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');
  const timerEl = document.getElementById('countdownTimer');

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  // ✅ ИСПРАВЛЕНО: Используем более надёжный формат даты ISO 8601
  // Это гарантирует корректную работу во всех браузерах и часовых поясах
  const newYear = new Date('2026-01-01T00:00:00').getTime();
  const now = new Date().getTime();
  const distance = newYear - now;

  // 🐛 DEBUG: Логируем данные для отладки (только в первый раз)
  if (!window._countdownDebugLogged) {
    console.log('%c🎄 COUNTDOWN TIMER VERSION 2.0 LOADED! 🎄', 'background: #c41e3a; color: #ffd700; font-size: 16px; padding: 10px;');
    console.log('🎄 Countdown Debug Info:');
    console.log('  Current time:', new Date(now).toString());
    console.log('  Target time:', new Date(newYear).toString());
    console.log('  Distance (ms):', distance);
    console.log('  Distance (days):', Math.floor(distance / (1000 * 60 * 60 * 24)));
    console.log('  Distance (hours):', Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    window._countdownDebugLogged = true;
  }

  if (distance < 0) {
    if (timerEl) {
      timerEl.innerHTML = '<h3 class="section__title">С Новым 2026 годом! 🎉</h3>';
    }
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  daysEl.textContent = String(days).padStart(2, '0');
  hoursEl.textContent = String(hours).padStart(2, '0');
  minutesEl.textContent = String(minutes).padStart(2, '0');
  secondsEl.textContent = String(seconds).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ============================================
// PWA STATUS INDICATOR
// ============================================
function updatePWAStatus() {
  const statusEl = document.getElementById('pwa-status');
  const iconEl = document.getElementById('pwa-icon');
  const textEl = document.getElementById('pwa-text');

  if (!statusEl || !iconEl || !textEl) return;

  const isOnline = navigator.onLine;
  const isPWA = window.matchMedia('(display-mode: standalone)').matches;

  statusEl.style.display = 'flex';

  if (isPWA) {
    iconEl.textContent = '📱';
    textEl.textContent = 'PWA Mode';
    statusEl.style.background = 'rgba(76, 175, 80, 0.9)';
  } else if (!isOnline) {
    iconEl.textContent = '📴';
    textEl.textContent = 'Offline';
    statusEl.style.background = 'rgba(255, 152, 0, 0.9)';
  } else {
    iconEl.textContent = '✅';
    textEl.textContent = 'Online';
    statusEl.style.background = 'rgba(102, 126, 234, 0.9)';
  }

  setTimeout(() => {
    statusEl.style.opacity = '0.5';
  }, 3000);

  // ✅ чтобы не навешивать обработчик каждый вызов
  if (!statusEl.dataset.hoverBound) {
    statusEl.dataset.hoverBound = '1';
    statusEl.addEventListener('mouseenter', () => {
      statusEl.style.opacity = '1';
    });
  }
}

window.addEventListener('load', updatePWAStatus);
window.addEventListener('online', updatePWAStatus);
window.addEventListener('offline', updatePWAStatus);

// ============================================
// ACTIVE NAV LINK ON SCROLL
// ============================================
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav__link');

if (sections.length && navLinks.length) {
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const id = entry.target.getAttribute('id');

      navLinks.forEach(link => {
        link.classList.toggle(
          'nav__link--active',
          link.getAttribute('href') === '#' + id
        );
      });
    });
  }, { threshold: 0.6 });

  sections.forEach(section => navObserver.observe(section));
}

// ============================================
// SCROLL ANIMATIONS
// ============================================
const animatedElements = document.querySelectorAll('[data-animate]');

if (animatedElements.length) {
  const animationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay) || 0;
        setTimeout(() => {
          entry.target.classList.add('animated');
        }, delay);
        animationObserver.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -10% 0px',
    threshold: [0, 0.1, 0.5]
  });

  animatedElements.forEach(el => animationObserver.observe(el));
}

// ============================================
// GALLERY & LIGHTBOX
// ============================================
const Lightbox = {
  element: null,
  imageEl: null,
  captionEl: null,
  currentEl: null,
  totalEl: null,
  images: [],
  currentIndex: 0,
  initialized: false,

  init() {
    // Prevent multiple initialization
    if (this.initialized) {
      console.warn('⚠️ Lightbox already initialized');
      return;
    }

    this.element = document.getElementById('lightbox');
    if (!this.element) return;

    this.imageEl = document.getElementById('lightboxImage');
    this.captionEl = document.getElementById('lightboxCaption');
    this.currentEl = document.getElementById('lightboxCurrent');
    this.totalEl = document.getElementById('lightboxTotal');

    // Reset images array to prevent duplication
    this.images = [];

    document.querySelectorAll('.gallery__item').forEach((item, index) => {
      const img = item.querySelector('.gallery__image');
      const caption = item.querySelector('.gallery__caption');

      if (!img) return;

      this.images.push({
        src: img.src.replace('w=600', 'w=1200').replace('w=800', 'w=1200'),
        caption: caption ? caption.textContent : ''
      });

      item.addEventListener('click', () => this.open(index));
    });

    if (this.totalEl) {
      this.totalEl.textContent = this.images.length;
    }

    const closeBtn = this.element.querySelector('.lightbox__close');
    const prevBtn = this.element.querySelector('.lightbox__prev');
    const nextBtn = this.element.querySelector('.lightbox__next');

    if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    if (prevBtn) prevBtn.addEventListener('click', () => this.prev());
    if (nextBtn) nextBtn.addEventListener('click', () => this.next());

    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (!this.element.classList.contains('active')) return;

      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    });

    // Mark as initialized
    this.initialized = true;
  },

  open(index) {
    this.currentIndex = index;
    this.update();
    this.element.classList.add('active');
    document.body.classList.add('modal-open');
  },

  close() {
    this.element.classList.remove('active');
    document.body.classList.remove('modal-open');
  },

  update() {
    if (!this.imageEl || !this.captionEl || !this.currentEl) return;

    const image = this.images[this.currentIndex];
    this.imageEl.src = image.src;
    this.imageEl.alt = image.caption;
    this.captionEl.textContent = image.caption;
    this.currentEl.textContent = this.currentIndex + 1;
  },

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.update();
  },

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.update();
  }
};

// ============================================
// MODAL & FORM VALIDATION
// ============================================
const Modal = {
  element: null,

  init() {
    this.element = document.getElementById('bookingModal');
    if (!this.element) return;

    document.querySelectorAll('[data-modal="booking"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const packageType = btn.dataset.package;
        this.open(packageType);
      });
    });

    const closeBtn = this.element.querySelector('.modal__close');
    const backdrop = this.element.querySelector('.modal__backdrop');

    if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    if (backdrop) backdrop.addEventListener('click', () => this.close());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.element.classList.contains('active')) {
        this.close();
      }
    });
  },

  open(packageType) {
    this.element.classList.add('active');
    document.body.classList.add('modal-open');

    const partyTypeEl = document.getElementById('partyType');
    if (packageType && partyTypeEl) {
      const typeMap = {
        'family': 'family',
        'corporate': 'corporate',
        'kids': 'kids'
      };
      partyTypeEl.value = typeMap[packageType] || '';
    }

    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
      setTimeout(() => userNameEl.focus(), 100);
    }
  },

  close() {
    this.element.classList.remove('active');
    document.body.classList.remove('modal-open');
  }
};

// ============================================
// OFFLINE QUEUE ДЛЯ ФОРМЫ ЗАЯВКИ
// ============================================
const OFFLINE_REQUESTS_KEY = 'ny2026-pending-requests';

function savePendingRequest(payload) {
  try {
    const current = JSON.parse(localStorage.getItem(OFFLINE_REQUESTS_KEY) || '[]');
    current.push({
      ...payload,
      timestamp: Date.now()
    });
    localStorage.setItem(OFFLINE_REQUESTS_KEY, JSON.stringify(current));
  } catch (e) {
    // Тихо падаем, чтобы не ломать UX
  }
}

// Пока у тебя нет backend’а, это просто имитация отправки
async function sendRequestToServer(payload) {
  await new Promise(resolve => setTimeout(resolve, 2000));
}

async function flushPendingRequests() {
  try {
    const raw = localStorage.getItem(OFFLINE_REQUESTS_KEY);
    if (!raw) return;

    const list = JSON.parse(raw);
    if (!Array.isArray(list) || !list.length) return;

    for (const item of list) {
      try {
        await sendRequestToServer(item);
      } catch (e) {
        return;
      }
    }

    localStorage.removeItem(OFFLINE_REQUESTS_KEY);

    if (typeof Toast !== 'undefined') {
      Toast.success(
        'Заявки отправлены',
        'Ранее сохранённые заявки отправлены после восстановления сети',
        6000
      );
    }
  } catch (e) {
    // Игнорируем — это не критично
  }
}

window.addEventListener('online', flushPendingRequests);

// ============================================
// FORM VALIDATION
// ============================================
const FormValidator = {
  form: null,

  init() {
    this.form = document.getElementById('bookingForm');
    if (!this.form) return;

    this.setupPhoneMask();
    this.setupCharCounter();
    this.setupValidation();
    this.setupSubmit();
  },

  setupPhoneMask() {
    const phoneInput = document.getElementById('userPhone');
    if (!phoneInput) return;

    phoneInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');

      if (value.startsWith('8')) {
        value = '7' + value.slice(1);
      }

      if (!value.startsWith('7') && value.length > 0) {
        value = '7' + value;
      }

      let formatted = '';
      if (value.length > 0) formatted = '+7';
      if (value.length > 1) formatted += ' (' + value.slice(1, 4);
      if (value.length > 4) formatted += ') ' + value.slice(4, 7);
      if (value.length > 7) formatted += '-' + value.slice(7, 9);
      if (value.length > 9) formatted += '-' + value.slice(9, 11);

      e.target.value = formatted;
    });

    phoneInput.addEventListener('keydown', (e) => {
      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];

      if (allowedKeys.includes(e.key)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
        return;
      }

      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    });
  },

  setupCharCounter() {
    const textarea = document.getElementById('userMessage');
    const counter = document.getElementById('messageCounter');

    if (textarea && counter) {
      textarea.addEventListener('input', () => {
        counter.textContent = textarea.value.length;
      });
    }
  },

  setupValidation() {
    const fields = {
      userName: {
        validate: (value) => {
          if (!value.trim()) return 'Введите ваше имя';
          if (value.trim().length < 2) return 'Имя слишком короткое';
          if (!/^[а-яёА-ЯЁa-zA-Z\s-]+$/.test(value)) return 'Имя содержит недопустимые символы';
          return '';
        }
      },
      userPhone: {
        validate: (value) => {
          const digits = value.replace(/\D/g, '');
          if (!digits) return 'Введите номер телефона';
          if (digits.length !== 11) return 'Номер должен содержать 11 цифр';
          return '';
        }
      },
      userEmail: {
        validate: (value) => {
          if (!value) return '';
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) return 'Введите корректный email';
          return '';
        }
      },
      privacyAgree: {
        validate: (checked) => {
          if (!checked) return 'Необходимо согласие с политикой конфиденциальности';
          return '';
        },
        isCheckbox: true
      }
    };

    Object.keys(fields).forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (!field) return;

      const config = fields[fieldId];
      const errorEl = document.getElementById(fieldId + 'Error');

      const validateField = () => {
        const value = config.isCheckbox ? field.checked : field.value;
        const error = config.validate(value);

        if (errorEl) {
          errorEl.textContent = error;
        }

        if (!config.isCheckbox) {
          field.classList.remove('error', 'success');
          if (error) {
            field.classList.add('error');
          } else if (value) {
            field.classList.add('success');
          }
        }

        return !error;
      };

      field.addEventListener('blur', validateField);
      field.addEventListener('change', validateField);
      field._validate = validateField;
    });
  },

  setupSubmit() {
    const submitBtn = document.getElementById('submitBtn');
    if (!submitBtn) return;

    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();

      let isValid = true;
      this.form.querySelectorAll('input, select, textarea').forEach(field => {
        if (field._validate && !field._validate()) {
          isValid = false;
        }
      });

      if (!isValid) {
        Toast.error('Ошибка', 'Пожалуйста, исправьте ошибки в форме');
        return;
      }

      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      try {
        if (!navigator.onLine) {
          // Offline logic remains same
          const formData = new FormData(this.form);
          const payload = Object.fromEntries(formData.entries());
          savePendingRequest(payload);
          Toast.info(
            'Нет соединения',
            'Заявка сохранена. Мы отправим её автоматически, когда появится интернет.',
            7000
          );
        } else {
          // EmailJS Integration
          // Replace SERVICE_ID and TEMPLATE_ID with actual keys or keep placeholders
          await emailjs.sendForm('service_newyear2026', 'template_newyear2026', this.form);

          // Track Goal in Metrica
          if (typeof ym === 'function') {
            ym(99999999, 'reachGoal', 'form_submit');
          }

          Toast.success(
            'Заявка отправлена! 🎉',
            'Скоро с вами свяжется наш менеджер',
            6000
          );

          Modal.close();
          this.form.reset();

          const counter = document.getElementById('messageCounter');
          if (counter) counter.textContent = '0';

          this.form.querySelectorAll('.error, .success').forEach(el => {
            el.classList.remove('error', 'success');
          });
        }
      } catch (error) {
        console.error('EmailJS Error:', error);
        Toast.error(
          'Ошибка отправки',
          'Пожалуйста, попробуйте позже или позвоните нам: +7 (999) 123-45-67'
        );
      } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
      }
    });
  }
};

// ============================================
// BUTTON INTERACTIONS
// ============================================
document.querySelectorAll('.btn[data-action]').forEach(button => {
  button.addEventListener('click', function () {
    const action = this.getAttribute('data-action');
    const targetId = action === 'explore' ? 'features' : (action === 'offers' ? 'offers' : null);

    if (targetId) {
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
});

// ============================================
// SERVICE WORKER REGISTRATION
// ============================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        setInterval(() => registration.update(), 60000);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              if (confirm('Доступна новая версия сайта. Обновить?')) {
                newWorker.postMessage({ action: 'skipWaiting' });
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(() => {
        // Ошибка обработана
      });
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

// ============================================
// PWA INSTALL PROMPT
// ============================================
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;

  const installBtn = document.getElementById('install-app-button');
  if (!installBtn) return;

  installBtn.style.display = 'inline-flex';

  installBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;

    installBtn.disabled = true;

    try {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;

      if (choice.outcome === 'accepted') {
        if (typeof Toast !== 'undefined') {
          Toast.success('Установлено', 'Приложение добавлено на ваш экран');
        }
      } else {
        if (typeof Toast !== 'undefined') {
          Toast.info('Отмена', 'Вы всегда можете установить приложение позже');
        }
      }
    } catch (e) {
      // Тихо глушим ошибки
    } finally {
      deferredInstallPrompt = null;
      installBtn.disabled = false;
      installBtn.style.display = 'none';
    }
  }, { once: true });
});

// ============================================
// LOTTIE PLAYER
// ============================================
let lottieLoadPromise = null;

function loadLottieScript() {
  if (window.customElements && customElements.get('lottie-player')) {
    return Promise.resolve();
  }

  if (lottieLoadPromise) {
    return lottieLoadPromise;
  }

  lottieLoadPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@lottiefiles/lottie-player@2.0.4/dist/lottie-player.js';
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });

  return lottieLoadPromise;
}

function initLottiePlayers() {
  const lottiePlayers = document.querySelectorAll('lottie-player');
  if (!lottiePlayers.length) return;

  const visibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const player = entry.target;

      if (!entry.isIntersecting) {
        if (typeof player.pause === 'function') {
          try {
            player.pause();
          } catch (e) {
            // Ошибка обработана
          }
        }
        return;
      }

      loadLottieScript()
        .then(() => {
          if (typeof player.play === 'function') {
            try {
              player.play();
            } catch (e) {
              // Ошибка обработана
            }
          }
        })
        .catch(() => { });
    });
  }, { threshold: 0.1 });

  lottiePlayers.forEach(player => visibilityObserver.observe(player));
}

function initLottieWhenReady() {
  const container = document.getElementById('lottie-container');
  if (!container) return;

  if (!customElements.get('lottie-player')) {
    setTimeout(initLottieWhenReady, 100);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const lottie = document.createElement('lottie-player');
        lottie.setAttribute('src', container.dataset.src);
        lottie.setAttribute('background', 'transparent');
        lottie.setAttribute('speed', '1');
        lottie.setAttribute('loop', '');
        lottie.setAttribute('autoplay', '');
        lottie.style.cssText = 'width:100%;height:100%;';

        container.appendChild(lottie);
        observer.disconnect();
      }
    });
  }, { threshold: 0.1 });

  observer.observe(container);
}

// ============================================
// LAZY LOTTIE HANDLER
// ============================================
function initLazyLottie() {
  const lazyLottieElements = document.querySelectorAll('.lazy-lottie');
  if (!lazyLottieElements.length) return;

  loadLottieScript().then(() => {
    lazyLottieElements.forEach(element => {
      const src = element.getAttribute('src');
      const speed = element.getAttribute('speed') || '1';
      const loop = element.hasAttribute('loop');
      const autoplay = element.hasAttribute('autoplay');
      const background = element.getAttribute('background') || 'transparent';

      const lottiePlayer = document.createElement('lottie-player');
      lottiePlayer.setAttribute('src', src);
      lottiePlayer.setAttribute('speed', speed);
      lottiePlayer.setAttribute('background', background);
      if (loop) lottiePlayer.setAttribute('loop', '');
      if (autoplay) lottiePlayer.setAttribute('autoplay', '');

      const width = element.style.width || '100%';
      const height = element.style.height || '100%';
      lottiePlayer.style.cssText = `width: ${width}; height: ${height};`;

      element.parentNode.replaceChild(lottiePlayer, element);
    });
  }).catch(error => {
    console.error('Failed to initialize Lottie animations:', error);
  });
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  Toast.init();
  Lightbox.init();
  Modal.init();
  FormValidator.init();
  initSnowCanvas();
  initLazyLottie();
  initLottiePlayers();
  initScrollToTop(); // New feature

  // Track button clicks logic
  document.body.addEventListener('click', (e) => {
    if (e.target.closest('.btn')) {
      if (typeof ym === 'function') {
        ym(99999999, 'reachGoal', 'btn_click');
      }
    }
  });

  // ✅ ИСПРАВЛЕНО: Проверка localStorage вместо sessionStorage
  //    Теперь уведомление показывается только при ПЕРВОМ посещении сайта
  const hasVisitedEver = localStorage.getItem('hasVisitedSite');
  if (!hasVisitedEver) {
    setTimeout(() => {
      Toast.info(
        'Добро пожаловать! 🎄',
        'Оставьте заявку и получите скидку 10% на первый заказ',
        7000
      );
    }, 2000);
    localStorage.setItem('hasVisitedSite', 'true');
  }
});

// ============================================
// COUNTERS ANIMATION
// ============================================
const animateCounters = () => {
  const counters = document.querySelectorAll('[data-count]');

  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-count'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const updateCounter = () => {
      current += step;
      if (current < target) {
        counter.textContent = Math.floor(current).toLocaleString('ru-RU');
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target.toLocaleString('ru-RU');
      }
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          updateCounter();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    observer.observe(counter);
  });
};

animateCounters();

// ============================================
// PARTNERS SLIDER PAUSE
// ============================================
const partnersTrack = document.querySelector('.partners__track');
if (partnersTrack) {
  partnersTrack.addEventListener('mouseenter', () => {
    partnersTrack.style.animationPlayState = 'paused';
  });

  partnersTrack.addEventListener('mouseleave', () => {
    partnersTrack.style.animationPlayState = 'running';
  });
}

// ============================================
// VIDEO MODAL (PLACEHOLDER)
// ============================================
document.querySelectorAll('.video-card__play').forEach(btn => {
  btn.addEventListener('click', () => {
    Toast.info('🎬 Скоро!', 'Видеоплеер будет доступен в ближайшее время', 3000);
  });
});

// ============================================
// LOTTIE INIT ON LOAD
// ============================================
if (document.readyState === 'complete') {
  initLottieWhenReady();
} else {
  window.addEventListener('load', initLottieWhenReady);
}

// ============================================
// AUTO-ADD WIDTH/HEIGHT TO IMAGES
// ============================================
window.addEventListener('load', () => {
  document.querySelectorAll('img:not([width]):not([height])').forEach(img => {
    if (img.complete && img.naturalWidth) {
      img.setAttribute('width', img.naturalWidth);
      img.setAttribute('height', img.naturalHeight);
    }
  });
});

// ============================================
// PWA Checklist — Новый год 2026
// DevTools → Console → runPwaChecklist()
// ============================================
async function runPwaChecklist() {
  const results = [];

  const add = (id, label, status, details) => {
    results.push({ id, label, status, details });
  };

  const statusIcon = (s) =>
    ({ ok: '✅', warn: '⚠️', fail: '❌', manual: 'ℹ️' }[s] || '');

  const isHttps = location.protocol === 'https:';
  let mixedNodes = [];
  if (isHttps) {
    mixedNodes = Array.from(
      document.querySelectorAll(
        'img[src^="http://"],script[src^="http://"],link[href^="http://"],video[src^="http://"],audio[src^="http://"],source[src^="http://"],iframe[src^="http://"]'
      )
    );
  }

  if (!isHttps) {
    add('1', 'HTTPS и mixed-content', 'fail', 'Страница открыта не по HTTPS.');
  } else if (mixedNodes.length) {
    add(
      '1',
      'HTTPS и mixed-content',
      'fail',
      'Найдены http-ресурсы: ' +
      mixedNodes
        .slice(0, 5)
        .map((n) => n.outerHTML.slice(0, 120) + '…')
        .join(' | ')
    );
  } else {
    add('1', 'HTTPS и mixed-content', 'ok', 'HTTPS включён, явного mixed-content не найдено.');
  }

  add('2', 'window.isSecureContext === true', window.isSecureContext ? 'ok' : 'fail', 'isSecureContext = ' + String(window.isSecureContext));

  const manifestLink = document.querySelector('link[rel="manifest"]');
  let manifestJson = null;

  if (!manifestLink) {
    add('3', 'Manifest link', 'fail', '<link rel="manifest"> не найден.');
  } else {
    try {
      const res = await fetch(manifestLink.href, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      manifestJson = await res.json();
      add('3', 'Manifest link', 'ok', 'Manifest загружен: ' + manifestLink.href);
    } catch (e) {
      add('3', 'Manifest link', 'fail', 'Не удалось загрузить/распарсить manifest: ' + e.message);
    }
  }

  if (!('serviceWorker' in navigator)) {
    add('4', 'Service Worker регистрация', 'fail', 'navigator.serviceWorker недоступен.');
  } else {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const ctrl = navigator.serviceWorker.controller;
      if (reg && reg.active) {
        add('4', 'Service Worker регистрация', 'ok', 'Найден активный SW: ' + reg.active.scriptURL + '; controller=' + Boolean(ctrl));
      } else {
        add('4', 'Service Worker регистрация', 'fail', 'Активный SW не найден или не контролирует вкладку.');
      }
    } catch (e) {
      add('4', 'Service Worker регистрация', 'fail', 'Ошибка при получении регистрации: ' + e.message);
    }
  }

  if (!('caches' in window)) {
    add('5', 'Cache API и кэши', 'fail', 'window.caches недоступен.');
  } else {
    try {
      const keys = await caches.keys();
      if (!keys.length) add('5', 'Cache API и кэши', 'fail', 'Кэши отсутствуют.');
      else add('5', 'Cache API и кэши', 'ok', 'Найдены кэши: ' + keys.join(', '));
    } catch (e) {
      add('5', 'Cache API и кэши', 'fail', 'Ошибка при работе с Cache API: ' + e.message);
    }
  }

  if ('caches' in window) {
    try {
      const resp =
        (await caches.match(location.pathname)) ||
        (await caches.match('/')) ||
        (await caches.match('/index.html'));
      if (resp) add('6', 'Offline загрузка главной страницы', 'ok', 'В кэше найден ответ для главной страницы (эвристика).');
      else add('6', 'Offline загрузка главной страницы', 'warn', 'В кэше не найдено явного ответа для / или /index.html. Проверь offline вручную.');
    } catch (e) {
      add('6', 'Offline загрузка главной страницы', 'warn', 'Не удалось проверить Cache.match: ' + e.message);
    }
  } else {
    add('6', 'Offline загрузка главной страницы', 'fail', 'Cache API недоступен.');
  }

  if (manifestJson) {
    const m = manifestJson;
    const icons = Array.isArray(m.icons) ? m.icons : [];
    const hasName = typeof m.name === 'string' && m.name.trim().length > 0;
    const hasShort = typeof m.short_name === 'string' && m.short_name.trim().length > 0;
    const displayOk = m.display === 'standalone';
    const scopeOk = typeof m.scope === 'string' && m.scope.length > 0;
    const has192 = icons.some((i) => String(i.sizes).split(/\s+/).includes('192x192'));
    const has512 = icons.some((i) => String(i.sizes).split(/\s+/).includes('512x512'));
    const hasMask = icons.some((i) => String(i.purpose || '').includes('maskable'));

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const metaTheme = themeMeta ? themeMeta.getAttribute('content') : null;
    const themeMatch =
      metaTheme &&
      m.theme_color &&
      metaTheme.toLowerCase() === String(m.theme_color).toLowerCase();

    add('7a', 'Manifest: name/short_name', hasName && hasShort ? 'ok' : 'fail', 'name=' + m.name + '; short_name=' + m.short_name);
    add('7b', 'Manifest: display/scope', displayOk && scopeOk ? 'ok' : 'fail', 'display=' + m.display + '; scope=' + m.scope);

    const iconsDetails =
      'icons: ' +
      icons.map((i) => `${i.src} [${i.sizes}] (${i.purpose || 'any'})`).join('; ');

    add('7c', 'Manifest: icons 192/512/maskable', has192 && has512 ? (hasMask ? 'ok' : 'warn') : 'fail', iconsDetails + (hasMask ? '' : '; maskable не найден'));
    add('7d', 'Manifest vs meta theme_color', themeMatch ? 'ok' : 'warn', 'manifest.theme_color=' + m.theme_color + '; meta[name=theme-color]=' + metaTheme);
  } else {
    add('7', 'Manifest содержимое', 'fail', 'Manifest не был загружен, пропускаем проверки содержимого.');
  }

  if ('serviceWorker' in navigator) {
    try {
      const swUrl = '/service-worker.js';
      const res = await fetch(swUrl, { cache: 'no-store' });
      if (res.ok) {
        const text = await res.text();
        const hasInstall = /addEventListener\(['"]install['"]/.test(text);
        const hasActivate = /addEventListener\(['"]activate['"]/.test(text);
        const hasFetch = /addEventListener\(['"]fetch['"]/.test(text);
        const mentionsCore = /CORE_ASSETS|PRECACHE|addAll\(/.test(text);
        const hasNetworkFirst = /text\/html|mode\s*===\s*['"]navigate['"]/.test(text);
        const hasStaleWhileEvristic =
          /caches\.match\(request\).*fetch\(request\)|fetch\(request\).*caches\.match\(request\)/s.test(text);
        const hasCacheCleanup = /caches\.keys\(/.test(text);

        const ok = hasInstall && hasActivate && hasFetch && mentionsCore && hasCacheCleanup;

        add(
          '8',
          'Service Worker: стратегии и обновление (эвристика)',
          ok ? 'ok' : 'warn',
          [
            'install:' + hasInstall,
            'activate:' + hasActivate,
            'fetch:' + hasFetch,
            'coreAsset_Like:' + mentionsCore,
            'networkFirstLike:' + hasNetworkFirst,
            'staleWhileLike:' + hasStaleWhileEvristic,
            'cacheCleanup:' + hasCacheCleanup
          ].join(', ')
        );
      } else {
        add('8', 'Service Worker: стратегии и обновление (эвристика)', 'warn', 'Не удалось загрузить /service-worker.js: HTTP ' + res.status);
      }
    } catch (e) {
      add('8', 'Service Worker: стратегии и обновление (эвристика)', 'warn', 'Ошибка при fetch(/service-worker.js): ' + e.message);
    }
  }

  const hasTimerEls = ['days', 'hours', 'minutes', 'seconds'].every((id) => document.getElementById(id));
  const hasHeroTitle = !!document.querySelector('h1, .hero__title, .section__title');
  const hasSnowCanvas = !!document.getElementById('snowCanvas');
  const hasGallery = !!document.querySelector('.gallery__item, [data-gallery]');

  const brokenImages = [];
  document.querySelectorAll('img').forEach((img) => {
    const srcAttr = img.getAttribute('src');
    if (!srcAttr || srcAttr.trim() === '') return;
    if (img.complete && img.naturalWidth === 0) brokenImages.push(srcAttr);
  });

  add('9a', 'UI: таймер и основные тексты (структурно)', hasTimerEls && hasHeroTitle ? 'ok' : 'warn', 'timerEls=' + hasTimerEls + ', heroTitle=' + hasHeroTitle);
  add('9b', 'UI: снег и галерея (структурно)', hasSnowCanvas && hasGallery ? 'ok' : 'warn', 'snowCanvas=' + hasSnowCanvas + ', gallery=' + hasGallery);
  add('9c', 'UI: битые картинки на текущей загрузке', brokenImages.length ? 'fail' : 'ok', brokenImages.length ? 'Найдены битые изображения: ' + brokenImages.join(', ') : 'Все изображения загрузились без ошибок (на этот момент).');

  const bookingForm = document.getElementById('bookingForm');
  let formOfflineStatus = 'warn';
  let formDetails = '';

  if (!bookingForm) {
    formOfflineStatus = 'fail';
    formDetails = 'form#bookingForm не найдена.';
  } else {
    const hasName = !!bookingForm.querySelector('#userName');
    const hasPhone = !!bookingForm.querySelector('#userPhone');
    const hasPrivacy = !!bookingForm.querySelector('#privacyAgree');
    const hasOfflineHelpers = typeof savePendingRequest === 'function' && typeof flushPendingRequests === 'function';
    const submitFn =
      typeof FormValidator !== 'undefined' && FormValidator && FormValidator.setupSubmit
        ? FormValidator.setupSubmit.toString()
        : '';
    const usesNavigatorOnline = /navigator\.onLine/.test(submitFn);

    formOfflineStatus = (hasName && hasPhone && hasPrivacy && hasOfflineHelpers && usesNavigatorOnline) ? 'ok' : 'warn';
    formDetails =
      'fields(name,phone,privacy)=' + [hasName, hasPhone, hasPrivacy].join('/') +
      '; offlineHelpers=' + hasOfflineHelpers +
      '; uses navigator.onLine=' + usesNavigatorOnline;
  }

  add('10', 'Форма заявки и offline-логика (эвристика)', formOfflineStatus, formDetails);

  let hasBipHandler = false;
  try {
    if (typeof getEventListeners === 'function') {
      const listeners = getEventListeners(window).beforeinstallprompt || [];
      hasBipHandler = listeners.length > 0;
    }
  } catch (e) { }

  add('11', 'beforeinstallprompt обработчик', hasBipHandler ? 'ok' : 'warn', hasBipHandler ? 'На window есть обработчик beforeinstallprompt.' : 'Не удалось обнаружить обработчик beforeinstallprompt. Проверь наличие кода для установки PWA.');

  add('12a', 'Проверка установки PWA и иконки в списке приложений', 'manual', 'Требуется ручная проверка на устройстве (иконка, название, запуск по start_url).');
  add('12b', 'Отсутствие постоянных ошибок в DevTools/standalone', 'manual', 'Проверь Console и раздел Application/Service workers в браузерном и standalone-режимах.');

  console.groupCollapsed('%cPWA checklist — New Year 2026', 'font-weight:bold;color:#4caf50;');
  results.forEach((r) => {
    console.log(statusIcon(r.status) + ' [' + r.id + '] ' + r.label + ' — ' + r.details);
  });
  console.groupEnd();

  return results;
}

// ============================================
// ===== НОВОГОДНЯЯ МУЗЫКА (финальный блок) =====
// ============================================
(function () {
  const soundToggle = document.getElementById('sound-toggle');
  const audio = document.getElementById('newyear-audio');

  if (!soundToggle || !audio) return;

  let isPlaying = false;

  function ensureAudioLoaded() {
    if (audio.readyState === 0) {
      audio.load();
    }
  }

  function playNewYearSound() {
    ensureAudioLoaded();

    return audio.play().catch((err) => {
      let msg = (err && (err.message || err.name)) || 'Неизвестная ошибка';

      if (audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
        msg = 'У аудиоплеера нет поддерживаемых источников. Проверь путь к файлу и расширение (.mp3 / .ogg).';
      }

      if (typeof Toast !== 'undefined') {
        Toast.error('Ошибка звука', `Не удалось воспроизвести аудио: ${msg}`);
      }

      isPlaying = false;
      soundToggle.textContent = '🔇';
      soundToggle.style.background = 'rgba(255, 255, 255, 0.1)';
    });
  }

  function stopSound() {
    audio.pause();
    audio.currentTime = 0;
  }

  soundToggle.addEventListener('click', () => {
    if (!isPlaying) {
      isPlaying = true;
      soundToggle.textContent = '🔊';
      soundToggle.style.background = 'rgba(76, 175, 80, 0.3)';
      playNewYearSound();
    } else {
      isPlaying = false;
      soundToggle.textContent = '🔇';
      soundToggle.style.background = 'rgba(255, 255, 255, 0.1)';
      stopSound();
    }
  });
})();

// ============================================
// INITIALIZATION - Инициализация всех модулей
// ============================================
// Используем window.load вместо DOMContentLoaded для гарантии что весь DOM готов
(function initializeApp() {
  // Ждём полной загрузки страницы
  window.addEventListener('load', function () {
    console.log('🎄 Initializing New Year modules...');

    // Даём браузеру немного времени на рендеринг
    setTimeout(initModules, 100);
  });

  function initModules() {
    // Инициализация тостов
    if (typeof Toast !== 'undefined' && Toast.init) {
      Toast.init();
      console.log('✅ Toast initialized');
    }

    // Инициализация модального окна с проверкой наличия элемента
    if (typeof Modal !== 'undefined' && Modal.init) {
      // Проверяем, что элемент существует перед инициализацией
      const modalEl = document.getElementById('bookingModal');
      if (modalEl) {
        Modal.init();
        console.log('✅ Modal initialized (element found)');
      } else {
        console.error('❌ Modal element #bookingModal NOT FOUND in DOM!');
        // Пытаемся еще раз через секунду
        setTimeout(function () {
          const retryModalEl = document.getElementById('bookingModal');
          if (retryModalEl) {
            Modal.init();
            console.log('✅ Modal initialized on retry');
          } else {
            console.error('❌ Modal element still not found after retry');
          }
        }, 1000);
      }
    }

    // Инициализация лайтбокса галереи
    if (typeof Lightbox !== 'undefined' && Lightbox.init) {
      Lightbox.init();
      console.log('✅ Lightbox initialized');
    }

    // Инициализация canvas снега
    if (typeof initSnowCanvas === 'function') {
      initSnowCanvas();
      console.log('✅ Snow canvas initialized');
    }

    // Регистрация Service Worker для PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/new-year_2026/sw.js')
          .then((registration) => {
            console.log('✅ Service Worker registered:', registration.scope);

            // Проверка обновлений каждые 60 секунд
            setInterval(() => {
              registration.update();
            }, 60000);

            // Обработка обновлений SW
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              console.log('🔄 Service Worker update found');

              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Показать уведомление о доступном обновлении
                  if (confirm('Доступна новая версия сайта. Обновить?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            });
          })
          .catch((error) => {
            console.error('❌ Service Worker registration failed:', error);
          });

        // Обработка изменений контроллера (новый SW активирован)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('🔄 Service Worker controller changed');
          window.location.reload();
        });
      });
    }

    // PWA Install Prompt
    let deferredPrompt;
    const installButton = document.getElementById('install-app-button');

    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing
      e.preventDefault();
      deferredPrompt = e;

      // Show install button
      if (installButton) {
        installButton.style.display = 'block';
        console.log('💡 PWA install prompt ready');
      }
    });

    if (installButton) {
      installButton.addEventListener('click', async () => {
        if (!deferredPrompt) {
          console.log('⚠️ Install prompt not available');
          return;
        }

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user's response
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`👤 User response to install prompt: ${outcome}`);

        if (outcome === 'accepted') {
          console.log('✅ User accepted the install prompt');
        } else {
          console.log('❌ User dismissed the install prompt');
        }

        // Clear the deferredPrompt
        deferredPrompt = null;
        installButton.style.display = 'none';
      });
    }

    // Detect if app is running as PWA
    window.addEventListener('appinstalled', () => {
      console.log('🎉 PWA was installed!');
      if (installButton) {
        installButton.style.display = 'none';
      }
    });

    // Check if running as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      console.log('📱 Running as PWA (standalone mode)');
      document.body.classList.add('pwa-mode');
    }

    console.log('✅ All modules initialization complete!');
  }
})();

// ============================================
// SCROLL TO TOP FEATURE
// ============================================
function initScrollToTop() {
  const btn = document.getElementById('scrollToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      btn.classList.add('is-visible');
    } else {
      btn.classList.remove('is-visible');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    // Track Scroll Up Goal
    if (typeof ym === 'function') {
      ym(99999999, 'reachGoal', 'scroll_top');
    }
  });
}
