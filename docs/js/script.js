/**
 * EXPLORE WINGS DIGITAL TECHNOLOGIES — TRIVANDRUM (THIRUVANANTHAPURAM), KERALA
 * Complete Vanilla JS Interactive Engine
 * ==========================================================================
 * Labelled Sections:
 *  1. BRANDS — Single Source-of-Truth Client Array (Builds Static Row, Marquee, Carousel & Drawer)
 *  2. THEMES — Red/Green Swatches + Light/Dark Mode Toggle + Circular Wipe + Safe localStorage
 *  3. AUTO SCROLL — Top Bar Auto-Scroll (Slow/Medium/Fast) + Stop on Wheel/Touch/Key/Click/Bottom
 *  4. PRELOADER & TRANSITIONS — Split Curtain Preloader & Left-to-Right Page Sweep
 *  5. MARQUEE & CLIENT DRAWER — Static Logo Row, Two-Row Infinite Scroller & Slide-In Client Modal
 *  6. REVEAL DIRECTIONS — Multi-Directional Scroll Reveals (Left/Right/Up/Down/Zoom/Rotate/Flip/Blur/Clip)
 *  7. TABS — Shopify-Style 5-Tab Feature Showcase with Auto-Cycling Progress Bar
 *  8. CAROUSEL — Draggable Client Stories Carousel with Tall Rounded Cards
 *  9. MODAL & FILTER — Portfolio Filter Tabs & Case Study Detail Modal
 * 10. FORM, PRICING & NAV — Mobile Right Drawer Accordion, Pricing Toggle, FAQ & Contact Form
 * ==========================================================================
 */

/* ==========================================================================
   1. BRANDS — SINGLE SOURCE-OF-TRUTH ARRAY
   Add a brand in one object entry below. Automatically builds:
   - Static client logo row (#staticBrandRow)
   - Two-row opposite-direction marquee (#brandMarqueeRow1, #brandMarqueeRow2 & [data-brand-scroller])
   - Client stories tall card carousel (#clientStoriesTrack)
   - Right-side slide-in client detail drawer (#clientDetailDrawer)
   ========================================================================== */
const BRANDS = [
  { id: 'aadisaktthi', name: 'Aadisaktthi Resorts & Spa', logo: 'assets/logos/aadisaktthi-resorts-spa.png' },
  { id: 'terrace-makkawao', name: 'Terrace by Makkawao', logo: 'assets/logos/terrace-by-makkawao.png' },
  { id: 'transorze', name: 'Transorze', logo: 'assets/logos/transorze.png' },
  { id: 'edustudy', name: 'Edustudy International', logo: 'assets/logos/edustudy-international.png' },
  { id: 'global-fitness', name: 'Global Fitness', logo: 'assets/logos/global-fitness.png' },
  { id: 'elaf', name: 'Elaf', logo: 'assets/logos/elaf.png' },
  { id: 'lulu', name: 'LuLu', logo: 'assets/logos/lulu-mall.png' },
  { id: 'munch', name: 'Munch (Nestlé)', logo: 'assets/logos/munch.png' }
];

/* ==========================================================================
   TABBED FEATURE SHOWCASE DATA (5 TABS ON HOME PAGE)
   ========================================================================== */
const SHOWCASE_TABS = [
  {
    id: 'websites',
    tag: '01 • Websites',
    title: 'Fast, mobile-first websites that turn local searches into daily enquiries.',
    desc: 'We design clean, persuasive websites for resorts, restaurants, academies, clinics, and retail brands in Trivandrum — complete with instant WhatsApp buttons and clear calls to action.',
    bullets: [
      'Loads fast on mobile networks across Kerala',
      'Built-in WhatsApp chat, booking forms & interactive menus/catalogues',
      'Search-engine ready so local customers find you first on Google'
    ],
    badge: 'Mobile-First & SEO-Ready',
    link: 'services.html#service-websites',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=85'
  },
  {
    id: 'branding',
    tag: '02 • Branding',
    title: 'Memorable logos, menus, packaging, and signage people recognize instantly.',
    desc: 'From your storefront board in Kowdiar or Kazhakkoottam to takeaway boxes and brochures, we craft cohesive visual identities that build lasting trust.',
    bullets: [
      'Complete logo system, colour palette & typography guide',
      'Print-ready packaging, menus, carry bags, certificates & brochures',
      'Storefront signage and interior brand guidelines'
    ],
    badge: 'Complete Brand Kits',
    link: 'services.html#service-branding',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=85'
  },
  {
    id: 'social',
    tag: '03 • Social Media',
    title: 'Consistent Instagram Reels, stories, and festive campaigns that keep you top-of-mind.',
    desc: 'We plan, script, shoot, and publish your monthly social media calendar around Onam, Vishu, Christmas, and weekend promotions.',
    bullets: [
      'Monthly content calendar & vertical Reels filmed at your location',
      'Festive launch campaigns tailored to Kerala families & youth',
      'Active page management and community engagement'
    ],
    badge: 'Reels & Festive Content',
    link: 'services.html#service-social',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=85'
  },
  {
    id: 'photo-video',
    tag: '04 • Photo & Video',
    title: 'Authentic food, resort, fitness, and showroom photography shot on location.',
    desc: 'Real photography builds instant credibility. Our Trivandrum production team brings lighting, styling, and drone cameras directly to your venue.',
    bullets: [
      'Culinary & menu shoots for cafes, restaurants, and food brands',
      'Architectural, room, pool, and drone films for resorts & spas',
      'Campus, gym, and showroom brand films for local businesses'
    ],
    badge: 'In-House Trivandrum Crew',
    link: 'services.html#service-production',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85'
  },
  {
    id: 'marketing',
    tag: '05 • Marketing',
    title: 'Google Maps ranking and targeted local ads that bring real phone calls.',
    desc: 'We optimize your Google Business Listing and run hyper-targeted local campaigns on Instagram, Facebook, and Google Search.',
    bullets: [
      'Google Maps optimization for Trivandrum & Kerala searches',
      'Radius-targeted Instagram & Meta lead generation campaigns',
      'Plain-English monthly reports focused on real customer enquiries'
    ],
    badge: 'Local Search & Lead Ads',
    link: 'services.html#service-marketing',
    image: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=1200&q=85'
  }
];

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const htmlEl = document.documentElement;

  /* ==========================================================================
     2. THEMES — RED / GREEN SWATCHES + LIGHT / DARK MODE + CIRCULAR WIPE
     Default: data-theme="red" + data-mode="light"
     ========================================================================== */
  let currentTheme = 'red';
  let currentMode = 'light';

  try {
    const savedTheme = localStorage.getItem('ew_theme') || 'red';
    const savedMode = localStorage.getItem('ew_mode');
    if (savedTheme === 'red' || savedTheme === 'green') currentTheme = savedTheme;
    if (savedMode === 'light' || savedMode === 'dark') {
      currentMode = savedMode;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      currentMode = 'dark';
    }
  } catch (_) {
    // Safe fallback if localStorage is blocked
  }

  function applyThemeAndMode(theme, mode, clickEvent) {
    currentTheme = theme;
    currentMode = mode;

    // Optional circular reveal wipe from clicked swatch/button
    const wipeEl = document.getElementById('themeWipeCircle');
    if (wipeEl && clickEvent && !prefersReducedMotion) {
      const x = clickEvent.clientX || window.innerWidth / 2;
      const y = clickEvent.clientY || 24;
      wipeEl.style.setProperty('--wipe-x', `${x}px`);
      wipeEl.style.setProperty('--wipe-y', `${y}px`);
      wipeEl.classList.remove('is-wiping');
      void wipeEl.offsetWidth;
      wipeEl.classList.add('is-wiping');
      setTimeout(() => wipeEl.classList.remove('is-wiping'), 750);
    }

    htmlEl.setAttribute('data-theme', currentTheme);
    htmlEl.setAttribute('data-mode', currentMode);

    try {
      localStorage.setItem('ew_theme', currentTheme);
      localStorage.setItem('ew_mode', currentMode);
    } catch (_) {}

    // Update Swatch Active States
    document.querySelectorAll('[data-set-theme]').forEach(sw => {
      const t = sw.getAttribute('data-set-theme');
      sw.classList.toggle('active', t === currentTheme);
      sw.setAttribute('aria-pressed', t === currentTheme ? 'true' : 'false');
    });

    // Update Mode Toggle Button Text
    document.querySelectorAll('.mode-toggle-btn').forEach(btn => {
      btn.innerHTML = currentMode === 'light'
        ? '<span>☀</span> <span>Light Mode</span>'
        : '<span>☾</span> <span>Dark Mode</span>';
      btn.setAttribute('aria-label', `Current mode: ${currentMode}. Click to switch.`);
    });
  }

  applyThemeAndMode(currentTheme, currentMode, null);

  document.querySelectorAll('[data-set-theme]').forEach(sw => {
    sw.addEventListener('click', e => {
      const nextTheme = sw.getAttribute('data-set-theme') || 'green';
      applyThemeAndMode(nextTheme, currentMode, e);
    });
  });

  document.querySelectorAll('.mode-toggle-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const nextMode = currentMode === 'light' ? 'dark' : 'light';
      applyThemeAndMode(currentTheme, nextMode, e);
    });
  });

  /* ==========================================================================
     3. AUTO SCROLL — TOP BAR BUTTON + SLOW/MEDIUM/FAST + STOP ON INTERACTION
     ========================================================================== */
  let autoScrolling = false;
  let autoScrollRaf = null;
  const speedMap = { slow: 0.9, medium: 1.85, fast: 3.4 };
  let selectedSpeed = 'medium';

  const autoScrollBtns = document.querySelectorAll('.auto-scroll-toggle-btn');
  const speedSelects = document.querySelectorAll('.auto-scroll-speed-select');

  function syncAutoScrollUI() {
    autoScrollBtns.forEach(btn => {
      btn.classList.toggle('is-active', autoScrolling);
      btn.setAttribute('aria-pressed', autoScrolling ? 'true' : 'false');
      btn.textContent = autoScrolling ? '⏸ Stop auto scroll' : '▶ Auto scroll';
    });
  }

  function stopAutoScroll() {
    if (!autoScrolling) return;
    autoScrolling = false;
    if (autoScrollRaf) cancelAnimationFrame(autoScrollRaf);
    autoScrollRaf = null;
    syncAutoScrollUI();
  }

  function tickAutoScroll() {
    if (!autoScrolling) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (window.scrollY >= maxScroll - 2) {
      stopAutoScroll();
      return;
    }
    const pxPerFrame = speedMap[selectedSpeed] || 1.85;
    window.scrollBy(0, pxPerFrame);
    autoScrollRaf = requestAnimationFrame(tickAutoScroll);
  }

  autoScrollBtns.forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (autoScrolling) {
        stopAutoScroll();
      } else {
        autoScrolling = true;
        syncAutoScrollUI();
        autoScrollRaf = requestAnimationFrame(tickAutoScroll);
      }
    });
  });

  speedSelects.forEach(sel => {
    sel.addEventListener('change', e => {
      e.stopPropagation();
      selectedSpeed = sel.value || 'medium';
      speedSelects.forEach(other => { other.value = selectedSpeed; });
    });
    sel.addEventListener('click', e => e.stopPropagation());
  });

  // Any manual wheel, touch, key press, or click outside auto-scroll controls stops auto-scroll
  window.addEventListener('wheel', () => stopAutoScroll(), { passive: true });
  window.addEventListener('touchstart', e => {
    if (!e.target.closest('.auto-scroll-group')) stopAutoScroll();
  }, { passive: true });
  window.addEventListener('keydown', e => {
    if (!e.target.closest('.auto-scroll-group')) stopAutoScroll();
  }, { passive: true });
  window.addEventListener('mousedown', e => {
    if (!e.target.closest('.auto-scroll-group')) stopAutoScroll();
  }, { passive: true });

  /* ==========================================================================
     4. PRELOADER & TRANSITIONS — SPLIT CURTAIN & LEFT-TO-RIGHT SWEEP
     ========================================================================== */
  const preloader = document.getElementById('preloader');
  const preloaderCounter = document.getElementById('preloaderCounter');
  const preloaderBarFill = document.getElementById('preloaderBarFill');
  let sessionLoaded = false;
  try {
    sessionLoaded = sessionStorage.getItem('ew_preloader_shown') === 'true';
    sessionStorage.setItem('ew_preloader_shown', 'true');
  } catch (_) {}

  if (preloader) {
    let count = sessionLoaded || prefersReducedMotion ? 80 : 0;
    const step = sessionLoaded || prefersReducedMotion ? 10 : 5;
    const interval = sessionLoaded || prefersReducedMotion ? 16 : 24;

    const timer = setInterval(() => {
      count = Math.min(100, count + step);
      if (preloaderCounter) preloaderCounter.textContent = `${count}%`;
      if (preloaderBarFill) preloaderBarFill.style.width = `${count}%`;
      if (count >= 100) {
        clearInterval(timer);
        setTimeout(() => preloader.classList.add('is-loaded'), 140);
      }
    }, interval);
  }

  const transitionSweep = document.getElementById('pageTransitionSweep');
  document.querySelectorAll('a[href]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('https://wa.me') ||
        link.target === '_blank' ||
        e.ctrlKey ||
        e.metaKey
      ) {
        return;
      }
      if (transitionSweep && !prefersReducedMotion) {
        e.preventDefault();
        transitionSweep.classList.add('is-active');
        setTimeout(() => {
          window.location.href = href;
        }, 380);
      }
    });
  });

  /* ==========================================================================
     5. MARQUEE & CLIENT DRAWER — STATIC ROW, 2-ROW SCROLLER & SLIDE-IN MODAL
     ========================================================================== */
  function createBrandLogoCardHTML(brand) {
    return `
      <div class="brand-card-white" aria-label="${brand.name}">
        <img
          src="${brand.logo}"
          alt="${brand.name} logo"
          loading="lazy"
          onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='block';"
        />
        <span style="display:none; font-family:var(--font-display); font-weight:800; color:#0B1020; font-size:0.95rem;">
          ${brand.name}
        </span>
      </div>
    `;
  }

  // Populate Static Client Logo Row (#staticBrandRow)
  const staticBrandRow = document.getElementById('staticBrandRow');
  if (staticBrandRow) {
    staticBrandRow.innerHTML = BRANDS.map(createBrandLogoCardHTML).join('');
  }

  // Populate Two-Row Opposite-Direction Infinite Marquee Scrollers ([data-brand-scroller])
  document.querySelectorAll('[data-brand-scroller]').forEach(wrapper => {
    const row1 = wrapper.querySelector('.scroll-left') || document.createElement('div');
    const row2 = wrapper.querySelector('.scroll-right') || document.createElement('div');
    const repeated1 = [...BRANDS, ...BRANDS, ...BRANDS];
    const reversedBrands = [...BRANDS].reverse();
    const repeated2 = [...reversedBrands, ...reversedBrands, ...reversedBrands];

    if (!row1.parentElement) {
      row1.className = 'brand-marquee-row scroll-left';
      wrapper.appendChild(row1);
    }
    if (!row2.parentElement) {
      row2.className = 'brand-marquee-row scroll-right';
      wrapper.appendChild(row2);
    }
    row1.innerHTML = repeated1.map(createBrandLogoCardHTML).join('');
    row2.innerHTML = repeated2.map(createBrandLogoCardHTML).join('');
  });



  /* ==========================================================================
     6. REVEAL DIRECTIONS — MULTI-DIRECTIONAL REVEALS, STAGGER & COUNTERS
     ========================================================================== */
  // Apply automatic 90ms stagger to children inside [data-stagger]
  document.querySelectorAll('[data-stagger]').forEach(group => {
    const stepMs = parseInt(group.getAttribute('data-stagger') || '95', 10);
    Array.from(group.children).forEach((child, index) => {
      child.style.setProperty('--stagger-delay', `${index * stepMs}ms`);
    });
  });

  // Hero Letter Stagger on [data-letter-stagger]
  document.querySelectorAll('[data-letter-stagger]').forEach(el => {
    if (prefersReducedMotion) return;
    const text = el.textContent.trim();
    el.innerHTML = text
      .split('')
      .map((ch, i) => ch === ' '
        ? ' '
        : `<span class="hero-letter" style="--char-delay:${i * 28}ms">${ch}</span>`)
      .join('');
  });

  const revealObs = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('[data-reveal], .line-mask').forEach(el => {
    revealObs.observe(el);
  });

  // Animated Number Counters
  const counterObs = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        counterObs.unobserve(el);
        const target = parseFloat(el.getAttribute('data-counter') || '0');
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';
        const start = performance.now();
        const dur = 1700;

        function tick(now) {
          const p = Math.min(1, (now - start) / dur);
          const ease = 1 - Math.pow(1 - p, 3);
          el.textContent = `${prefix}${Math.round(target * ease)}${suffix}`;
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = `${prefix}${target}${suffix}`;
        }
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.35 }
  );

  document.querySelectorAll('[data-counter]').forEach(c => counterObs.observe(c));

  // Hero Rotating Word (brand, website, business, story)
  const rotatingWordTrack = document.getElementById('rotatingWordTrack');
  if (rotatingWordTrack && !prefersReducedMotion) {
    const words = rotatingWordTrack.querySelectorAll('.rotating-word-item');
    let wIdx = 0;
    if (words.length > 1) {
      setInterval(() => {
        wIdx = (wIdx + 1) % words.length;
        rotatingWordTrack.style.transform = `translateY(-${wIdx * 1.12}em)`;
      }, 2400);
    }
  }

  // Hero Floating Mockups Mouse Parallax
  const heroStage = document.querySelector('.hero-mockup-stage');
  if (heroStage && !prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
    const layers = heroStage.querySelectorAll('[data-parallax-depth]');
    window.addEventListener('mousemove', e => {
      const cx = (e.clientX / window.innerWidth - 0.5) * 2;
      const cy = (e.clientY / window.innerHeight - 0.5) * 2;
      layers.forEach(layer => {
        const d = parseFloat(layer.getAttribute('data-parallax-depth') || '12');
        layer.style.transform = `translate3d(${cx * d}px, ${cy * d}px, 0)`;
      });
    }, { passive: true });
  }

  // Process Timeline Line Draw on Scroll
  const processFill = document.querySelector('.process-line-fill');
  const processGrid = document.querySelector('.process-grid-4');
  if (processFill && processGrid) {
    window.addEventListener('scroll', () => {
      const r = processGrid.getBoundingClientRect();
      const wh = window.innerHeight;
      if (r.top < wh * 0.82 && r.bottom > 0) {
        const p = Math.min(1, Math.max(0, (wh * 0.75 - r.top) / r.height));
        processFill.style.width = `${p * 100}%`;
      }
    }, { passive: true });
  }

  // About Vertical Timeline Line Draw on Scroll
  const vTimelineFill = document.querySelector('.v-timeline-line-fill');
  const vTimeline = document.querySelector('.vertical-timeline');
  if (vTimelineFill && vTimeline) {
    const items = vTimeline.querySelectorAll('.v-timeline-item');
    window.addEventListener('scroll', () => {
      const r = vTimeline.getBoundingClientRect();
      const wh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (wh * 0.7 - r.top) / r.height));
      vTimelineFill.style.height = `${p * 100}%`;
      items.forEach(item => {
        if (item.getBoundingClientRect().top < wh * 0.72) item.classList.add('active');
      });
    }, { passive: true });
  }

  /* ==========================================================================
     7. TABS — SHOPIFY-STYLE 5-TAB FEATURE SHOWCASE WITH AUTO-PROGRESS
     ========================================================================== */
  const tabBtns = document.querySelectorAll('.showcase-tab-btn[data-tab-index]');
  const tabStage = document.getElementById('showcaseStageCard');
  if (tabBtns.length && tabStage) {
    let activeTab = 0;
    let tabProgress = 0;
    let tabPaused = false;

    const elTag = document.getElementById('showcaseTag');
    const elTitle = document.getElementById('showcaseTitle');
    const elDesc = document.getElementById('showcaseDesc');
    const elBullets = document.getElementById('showcaseBenefits');
    const elBadge = document.getElementById('showcaseBadge');
    const elLink = document.getElementById('showcaseLink');
    const elImg = document.getElementById('showcaseImage');

    function setShowcaseTab(index) {
      activeTab = (index + SHOWCASE_TABS.length) % SHOWCASE_TABS.length;
      tabProgress = 0;

      tabBtns.forEach((btn, i) => {
        btn.classList.toggle('active', i === activeTab);
        const line = btn.querySelector('.tab-progress-line');
        if (line) line.style.width = '0%';
      });

      const d = SHOWCASE_TABS[activeTab];
      if (elTag) elTag.textContent = d.tag;
      if (elTitle) elTitle.textContent = d.title;
      if (elDesc) elDesc.textContent = d.desc;
      if (elBullets) {
        elBullets.innerHTML = d.bullets
          .map(b => `<div class="feature-check-item"><span class="theme-check-icon">✓</span><span>${b}</span></div>`)
          .join('');
      }
      if (elBadge) elBadge.textContent = d.badge;
      if (elLink) elLink.setAttribute('href', d.link);
      if (elImg) {
        elImg.style.opacity = '0.35';
        setTimeout(() => {
          elImg.src = d.image;
          elImg.alt = d.title;
          elImg.style.opacity = '1';
        }, 140);
      }
    }

    tabBtns.forEach((btn, i) => {
      btn.addEventListener('click', () => setShowcaseTab(i));
    });

    tabStage.addEventListener('mouseenter', () => { tabPaused = true; });
    tabStage.addEventListener('mouseleave', () => { tabPaused = false; });

    setInterval(() => {
      if (tabPaused || prefersReducedMotion) return;
      tabProgress += 2;
      const activeBtn = tabBtns[activeTab];
      if (activeBtn) {
        const line = activeBtn.querySelector('.tab-progress-line');
        if (line) line.style.width = `${Math.min(100, tabProgress)}%`;
      }
      if (tabProgress >= 100) {
        setShowcaseTab(activeTab + 1);
      }
    }, 110);
  }

  /* ==========================================================================
     8. CAROUSEL — DRAGGABLE CLIENT STORIES CAROUSEL
     ========================================================================== */
  const storiesViewport = document.getElementById('storiesCarouselViewport');
  const storiesPrev = document.getElementById('storiesPrevBtn');
  const storiesNext = document.getElementById('storiesNextBtn');

  if (storiesViewport) {
    let isDown = false, startX = 0, scrollLeft = 0;
    storiesViewport.addEventListener('mousedown', e => {
      isDown = true;
      storiesViewport.classList.add('dragging');
      startX = e.pageX - storiesViewport.offsetLeft;
      scrollLeft = storiesViewport.scrollLeft;
    });
    ['mouseleave', 'mouseup'].forEach(ev => storiesViewport.addEventListener(ev, () => {
      isDown = false;
      storiesViewport.classList.remove('dragging');
    }));
    storiesViewport.addEventListener('mousemove', e => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - storiesViewport.offsetLeft;
      storiesViewport.scrollLeft = scrollLeft - (x - startX) * 1.4;
    });
    if (storiesPrev) storiesPrev.addEventListener('click', () => storiesViewport.scrollBy({ left: -400, behavior: 'smooth' }));
    if (storiesNext) storiesNext.addEventListener('click', () => storiesViewport.scrollBy({ left: 400, behavior: 'smooth' }));
  }

  /* ==========================================================================
     9. MODAL & FILTER — PORTFOLIO FILTER TABS & DETAIL MODAL (NEXT/PREV)
     ========================================================================== */
  const filterTabs = document.querySelectorAll('.filter-tab[data-filter]');
  const portfolioItems = Array.from(document.querySelectorAll('.portfolio-item[data-category]'));
  if (filterTabs.length && portfolioItems.length) {
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const f = tab.getAttribute('data-filter');
        portfolioItems.forEach((card, i) => {
          const cats = card.getAttribute('data-category') || '';
          const show = f === 'all' || cats.includes(f);
          card.classList.toggle('hidden', !show);
          if (show && !prefersReducedMotion) {
            card.style.opacity = '0';
            card.style.transform = 'translateY(16px) scale(0.97)';
            setTimeout(() => {
              card.style.transition = 'opacity 0.38s ease, transform 0.38s ease';
              card.style.opacity = '1';
              card.style.transform = '';
            }, i * 55);
          }
        });
      });
    });
  }

  // Portfolio Detail Modal (Challenge, Work, Result + Next/Previous Navigation)
  const caseModalBackdrop = document.getElementById('portfolioCaseModal');
  const closeCaseModalBtn = document.getElementById('closePortfolioModal');
  const prevCaseBtn = document.getElementById('modalPrevProject');
  const nextCaseBtn = document.getElementById('modalNextProject');
  let activeCaseIndex = 0;

  function openPortfolioCaseModal(idx) {
    if (!caseModalBackdrop || !BRANDS.length) return;
    activeCaseIndex = (idx + BRANDS.length) % BRANDS.length;
    const brand = BRANDS[activeCaseIndex];

    const imgEl = document.getElementById('caseModalLogo');
    const titleEl = document.getElementById('caseModalTitle');
    const metaEl = document.getElementById('caseModalMeta');
    const challengeEl = document.getElementById('caseModalChallenge');
    const workEl = document.getElementById('caseModalWork');
    const resultEl = document.getElementById('caseModalResult');

    if (imgEl) {
      imgEl.src = brand.logo;
      imgEl.alt = `${brand.name} logo`;
    }
    if (titleEl) titleEl.textContent = brand.name;
    if (metaEl) metaEl.textContent = `${brand.type} • ${brand.location}`;
    if (challengeEl) challengeEl.textContent = brand.details;
    if (workEl) workEl.textContent = brand.whatWeDid;
    if (resultEl) resultEl.textContent = brand.status;

    caseModalBackdrop.classList.add('open');
    caseModalBackdrop.setAttribute('aria-hidden', 'false');
  }

  function closePortfolioCaseModal() {
    if (!caseModalBackdrop) return;
    caseModalBackdrop.classList.remove('open');
    caseModalBackdrop.setAttribute('aria-hidden', 'true');
  }

  document.querySelectorAll('[data-open-case-index]').forEach(trigger => {
    trigger.addEventListener('click', e => {
      e.stopPropagation();
      const idx = parseInt(trigger.getAttribute('data-open-case-index') || '0', 10);
      openPortfolioCaseModal(idx);
    });
  });

  if (closeCaseModalBtn) closeCaseModalBtn.addEventListener('click', closePortfolioCaseModal);
  if (caseModalBackdrop) {
    caseModalBackdrop.addEventListener('click', e => {
      if (e.target === caseModalBackdrop) closePortfolioCaseModal();
    });
  }
  if (prevCaseBtn) prevCaseBtn.addEventListener('click', () => openPortfolioCaseModal(activeCaseIndex - 1));
  if (nextCaseBtn) nextCaseBtn.addEventListener('click', () => openPortfolioCaseModal(activeCaseIndex + 1));

  /* ==========================================================================
     10. CURSOR, SCROLL RING, FORM, PRICING & NAV
     ========================================================================== */
  // Scroll Progress Bar, Navbar Shadow, Outlined Scroll-Fill Text & Back-to-Top Ring
  const navbar = document.querySelector('.navbar');
  const scrollProgress = document.querySelector('.scroll-progress-bar');
  const backToTopBtn = document.querySelector('.back-to-top');
  const scrollFillHeadings = document.querySelectorAll('.scroll-fill-outline');

  // Inject SVG progress ring inside .back-to-top if not already present
  let backToTopCircle = null;
  if (backToTopBtn && !backToTopBtn.querySelector('.back-to-top-ring')) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'back-to-top-ring');
    svg.setAttribute('viewBox', '0 0 54 54');
    svg.innerHTML = '<circle cx="27" cy="27" r="24"></circle>';
    backToTopBtn.appendChild(svg);
    backToTopCircle = svg.querySelector('circle');
  } else if (backToTopBtn) {
    backToTopCircle = backToTopBtn.querySelector('.back-to-top-ring circle');
  }

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const pct = Math.min(1, Math.max(0, y / max));
    if (scrollProgress) scrollProgress.style.transform = `scaleX(${pct})`;
    if (navbar) navbar.classList.toggle('scrolled', y > 24);
    if (backToTopBtn) backToTopBtn.classList.toggle('visible', y > 420);
    if (backToTopCircle) {
      const circumference = 150;
      backToTopCircle.style.strokeDashoffset = `${circumference - pct * circumference}`;
    }

    // Outlined text that fills as you scroll
    scrollFillHeadings.forEach(el => {
      const r = el.getBoundingClientRect();
      const progress = Math.min(100, Math.max(0, ((window.innerHeight - r.top) / (window.innerHeight * 0.75)) * 100));
      el.style.setProperty('--fill-pct', `${progress.toFixed(1)}%`);
    });
  }, { passive: true });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Custom Cursor (Desktop Only: Dot + Ring + "View" on Images & "Drag" on Sliders)
  if (!prefersReducedMotion && window.matchMedia('(pointer: fine) and (min-width: 992px)').matches) {
    const cursorDot = document.createElement('div');
    cursorDot.className = 'custom-cursor-dot';
    cursorDot.setAttribute('aria-hidden', 'true');

    const cursorRing = document.createElement('div');
    cursorRing.className = 'custom-cursor-ring';
    cursorRing.setAttribute('aria-hidden', 'true');

    document.body.appendChild(cursorDot);
    document.body.appendChild(cursorRing);

    let mouseX = -100, mouseY = -100;
    let ringX = -100, ringY = -100;

    window.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;

      const target = e.target;
      if (!target) return;
      const dragZone = target.closest('[data-cursor="drag"], .stories-carousel-viewport');
      const viewZone = target.closest('[data-cursor="view"], .portfolio-item, .brand-card-white, .resource-card');
      const interactive = target.closest('a, button, input, select, textarea, .faq-question');

      if (dragZone) {
        cursorRing.classList.add('is-label');
        cursorRing.classList.remove('is-hover');
        cursorRing.textContent = '';
      } else if (viewZone) {
        cursorRing.classList.add('is-label');
        cursorRing.classList.remove('is-hover');
        cursorRing.textContent = '';
      } else if (interactive) {
        cursorRing.classList.add('is-hover');
        cursorRing.classList.remove('is-label');
        cursorRing.textContent = '';
      } else {
        cursorRing.classList.remove('is-hover', 'is-label');
        cursorRing.textContent = '';
      }
    }, { passive: true });

    function animateCursorRing() {
      ringX += (mouseX - ringX) * 0.22;
      ringY += (mouseY - ringY) * 0.22;
      cursorRing.style.transform = `translate(${ringX.toFixed(1)}px, ${ringY.toFixed(1)}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateCursorRing);
    }
    requestAnimationFrame(animateCursorRing);
  }

  // Mobile Right Slide-In Drawer & Accordion Links
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileBackdrop = document.getElementById('mobileDrawerBackdrop');
  const closeMobileBtn = document.getElementById('closeMobileDrawerBtn');

  function toggleMobileMenu(forceState) {
    if (!mobileDrawer) return;
    const open = typeof forceState === 'boolean' ? forceState : !mobileDrawer.classList.contains('open');
    mobileDrawer.classList.toggle('open', open);
    if (mobileBackdrop) mobileBackdrop.classList.toggle('open', open);
    if (menuToggle) menuToggle.classList.toggle('active', open);
  }

  if (menuToggle) menuToggle.addEventListener('click', () => toggleMobileMenu());
  if (closeMobileBtn) closeMobileBtn.addEventListener('click', () => toggleMobileMenu(false));
  if (mobileBackdrop) mobileBackdrop.addEventListener('click', () => toggleMobileMenu(false));

  document.querySelectorAll('.mobile-accordion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.mobile-accordion-item');
      if (item) item.classList.toggle('open');
    });
  });

  // Magnetic Buttons, Ripple & Card Cursor Spotlight / 3D Tilt
  document.querySelectorAll('.btn').forEach(btn => {
    if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.14}px, ${y * 0.18}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    }
    btn.addEventListener('click', function (e) {
      const r = this.getBoundingClientRect();
      const span = document.createElement('span');
      span.className = 'btn-ripple-circle';
      span.style.left = `${e.clientX - r.left}px`;
      span.style.top = `${e.clientY - r.top}px`;
      this.appendChild(span);
      setTimeout(() => span.remove(), 650);
    });
  });

  if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.platform-card, .bento-card, .package-card, .lulu-munch-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    });
  }

  // Services Sticky Side Nav ScrollSpy
  const stickyLinks = document.querySelectorAll('.sticky-service-link');
  const serviceSections = document.querySelectorAll('.service-detail-block[id]');
  if (stickyLinks.length && serviceSections.length) {
    window.addEventListener('scroll', () => {
      let cur = serviceSections[0].id;
      serviceSections.forEach(sec => {
        if (sec.getBoundingClientRect().top <= 240) cur = sec.id;
      });
      stickyLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${cur}`));
    }, { passive: true });
  }

  // Pricing Page Monthly / One-Time Toggle
  const billingSwitch = document.getElementById('billingSwitch');
  const priceEls = document.querySelectorAll('[data-price-onetime]');
  if (billingSwitch && priceEls.length) {
    billingSwitch.addEventListener('click', () => {
      const monthly = billingSwitch.classList.toggle('monthly');
      priceEls.forEach(el => {
        el.textContent = monthly ? el.getAttribute('data-price-monthly') : el.getAttribute('data-price-onetime');
        const note = el.parentElement.querySelector('.package-price-note');
        if (note) {
          note.textContent = monthly
            ? 'Monthly growth partnership • Pause or cancel anytime [Placeholder]'
            : 'One-time complete project investment [Placeholder]';
        }
      });
    });
  }

  // FAQ Accordion
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-question');
    const a = item.querySelector('.faq-answer');
    if (!q || !a) return;
    q.addEventListener('click', () => {
      const open = item.classList.contains('active');
      document.querySelectorAll('.faq-item.active').forEach(o => {
        o.classList.remove('active');
        const oa = o.querySelector('.faq-answer');
        if (oa) oa.style.maxHeight = '0px';
      });
      if (!open) {
        item.classList.add('active');
        a.style.maxHeight = `${a.scrollHeight + 24}px`;
      }
    });
  });

  // Contact Form with Live Validation, Progress Bar & Formspree/EmailJS Readiness
  const contactForm = document.getElementById('luxuryContactForm');
  if (contactForm) {
    const progressFill = document.getElementById('formProgressFill');
    const progressText = document.getElementById('formProgressText');
    const budgetSlider = document.getElementById('budgetRangeSlider');
    const budgetDisplay = document.getElementById('budgetValueDisplay');
    const tracked = contactForm.querySelectorAll('[data-track-progress]');

    const budgets = [
      '₹35,000 – ₹60,000 (Essential Launch) [Placeholder]',
      '₹60,000 – ₹1,20,000 (Signature Package) [Placeholder]',
      '₹1,20,000 – ₹2,50,000 (Complete Brand & Web Suite) [Placeholder]',
      '₹2,50,000 – ₹5,00,000 (Multi-Outlet Campaign) [Placeholder]',
      '₹5,00,000+ (Enterprise Annual Partner) [Placeholder]'
    ];

    if (budgetSlider && budgetDisplay) {
      budgetSlider.addEventListener('input', () => {
        budgetDisplay.textContent = budgets[parseInt(budgetSlider.value, 10)] || budgets[1];
        updateProgress();
      });
    }

    function updateProgress() {
      let filled = 0;
      tracked.forEach(f => {
        if (f.value && f.value.trim().length > 1) filled++;
      });
      const pct = Math.min(100, Math.round((filled / Math.max(1, tracked.length)) * 100));
      if (progressFill) progressFill.style.width = `${pct}%`;
      if (progressText) progressText.textContent = `${pct}% Complete`;
    }

    tracked.forEach(f => {
      f.addEventListener('input', () => {
        f.style.borderColor = '';
        updateProgress();
      });
      f.addEventListener('change', updateProgress);
    });

    document.querySelectorAll('.slot-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.slot-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const pref = document.getElementById('preferredTime');
        const val = pill.getAttribute('data-slot');
        if (pref && val) {
          pref.value = val;
          updateProgress();
        }
        contactForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    contactForm.addEventListener('submit', async e => {
      e.preventDefault();
      let valid = true;
      contactForm.querySelectorAll('[required]').forEach(req => {
        if (!req.value || !req.value.trim()) {
          valid = false;
          req.style.borderColor = '#E11D2E';
        } else {
          req.style.borderColor = '';
        }
      });
      if (!valid) return;

      const endpoint = contactForm.getAttribute('data-formspree');
      if (endpoint && endpoint.startsWith('https://formspree.io/')) {
        try {
          await fetch(endpoint, {
            method: 'POST',
            body: new FormData(contactForm),
            headers: { Accept: 'application/json' }
          });
        } catch (_) {}
      }

      const thankYou = document.getElementById('contactThankYou');
      contactForm.style.display = 'none';
      if (thankYou) thankYou.classList.add('visible');
    });
  }
  // Multi-Step Interactive Project Enquiry Form Controller
  const multiForm = document.getElementById('multiStepEnquiryForm');
  if (multiForm) {
    let currentStep = 1;
    const totalSteps = 4;
    const stepTitles = {
      1: 'About you',
      2: 'Your project',
      3: 'Budget & timing',
      4: 'Review & submit'
    };

    const stepNumEl = document.getElementById('enquiryCurrentStepNum');
    const stepTitleEl = document.getElementById('enquiryStepTitle');
    const progressFillEl = document.getElementById('enquiryStepProgressFill');

    const step1Panel = document.getElementById('enquiryStep1');
    const step2Panel = document.getElementById('enquiryStep2');
    const step3Panel = document.getElementById('enquiryStep3');
    const step4Panel = document.getElementById('enquiryStep4');
    const successPanel = document.getElementById('enquirySuccessPanel');
    const fallbackPanel = document.getElementById('enquiryFallbackPanel');

    const nameInput = document.getElementById('step1Name');
    const phoneInput = document.getElementById('step1Phone');
    const emailInput = document.getElementById('step1Email');
    const companyInput = document.getElementById('step1Company');
    const messageInput = document.getElementById('step4Message');

    const errName = document.getElementById('errName');
    const errPhone = document.getElementById('errPhone');

    // Phone input helper: ensure +91 prefix
    if (phoneInput) {
      phoneInput.addEventListener('focus', () => {
        if (!phoneInput.value.trim()) phoneInput.value = '+91 ';
      });
      phoneInput.addEventListener('input', () => {
        if (!phoneInput.value.startsWith('+91')) {
          phoneInput.value = '+91 ' + phoneInput.value.replace(/^\+?91\s*/, '');
        }
        if (errPhone) errPhone.style.display = 'none';
        phoneInput.style.borderColor = '';
      });
    }

    if (nameInput) {
      nameInput.addEventListener('input', () => {
        if (errName) errName.style.display = 'none';
        nameInput.style.borderColor = '';
      });
    }

    function showStep(step) {
      currentStep = step;
      [step1Panel, step2Panel, step3Panel, step4Panel].forEach((p, idx) => {
        if (p) p.style.display = (idx + 1 === step) ? 'block' : 'none';
      });

      if (stepNumEl) stepNumEl.textContent = step;
      if (stepTitleEl) stepTitleEl.textContent = stepTitles[step] || '';
      if (progressFillEl) progressFillEl.style.width = `${(step / totalSteps) * 100}%`;

      if (step === 4) {
        updateReviewSummary();
      }
    }

    function validateStep1() {
      let valid = true;
      const name = (nameInput ? nameInput.value : '').trim();
      if (!name) {
        if (errName) errName.style.display = 'block';
        if (nameInput) nameInput.style.borderColor = '#EF4444';
        valid = false;
      }

      const phoneRaw = (phoneInput ? phoneInput.value : '').replace(/[^0-9]/g, '');
      // Expect at least 10 digits
      const digits = phoneRaw.startsWith('91') ? phoneRaw.slice(2) : phoneRaw;
      if (digits.length < 10) {
        if (errPhone) errPhone.style.display = 'block';
        if (phoneInput) phoneInput.style.borderColor = '#EF4444';
        valid = false;
      }
      return valid;
    }

    function getSelectedServices() {
      const checked = multiForm.querySelectorAll('input[name="services"]:checked');
      const list = [];
      checked.forEach(c => list.push(c.value));
      return list.length ? list : ['Website Design'];
    }

    function getSelectedBudget() {
      const sel = multiForm.querySelector('input[name="budget_tier"]:checked');
      return sel ? sel.value : '₹35,000 – ₹75,000';
    }

    function getSelectedTimeline() {
      const sel = multiForm.querySelector('input[name="timeline"]:checked');
      return sel ? sel.value : 'Within 1 Month';
    }

    function updateReviewSummary() {
      const summaryBox = document.getElementById('enquiryReviewSummary');
      if (!summaryBox) return;
      const name = (nameInput ? nameInput.value : '').trim();
      const phone = (phoneInput ? phoneInput.value : '').trim();
      const email = (emailInput ? emailInput.value : '').trim();
      const company = (companyInput ? companyInput.value : '').trim();
      const services = getSelectedServices().join(', ');
      const budget = getSelectedBudget();
      const timeline = getSelectedTimeline();

      summaryBox.innerHTML = `
        <div style="margin-bottom: 6px;"><strong>Client:</strong> ${name} (${phone}${email ? ' • ' + email : ''}${company ? ' • ' + company : ''})</div>
        <div style="margin-bottom: 6px;"><strong>Services:</strong> <span style="color: var(--theme-primary); font-weight: 700;">${services}</span></div>
        <div><strong>Budget & Timeline:</strong> ${budget} • ${timeline}</div>
      `;
    }

    // Step 1 Next
    const btnStep1Next = document.getElementById('btnStep1Next');
    if (btnStep1Next) {
      btnStep1Next.addEventListener('click', () => {
        if (validateStep1()) showStep(2);
      });
    }

    // Step 2 Back & Next
    const btnStep2Back = document.getElementById('btnStep2Back');
    if (btnStep2Back) btnStep2Back.addEventListener('click', () => showStep(1));
    const btnStep2Next = document.getElementById('btnStep2Next');
    if (btnStep2Next) btnStep2Next.addEventListener('click', () => showStep(3));

    // Step 3 Back & Next
    const btnStep3Back = document.getElementById('btnStep3Back');
    if (btnStep3Back) btnStep3Back.addEventListener('click', () => showStep(2));
    const btnStep3Next = document.getElementById('btnStep3Next');
    if (btnStep3Next) btnStep3Next.addEventListener('click', () => showStep(4));

    // Step 4 Back
    const btnStep4Back = document.getElementById('btnStep4Back');
    if (btnStep4Back) btnStep4Back.addEventListener('click', () => showStep(3));

    // Submit Action
    const btnSubmit = document.getElementById('btnEnquirySubmit');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', async () => {
        const name = (nameInput ? nameInput.value : '').trim();
        const phone = (phoneInput ? phoneInput.value : '').trim();
        const email = (emailInput ? emailInput.value : '').trim();
        const company = (companyInput ? companyInput.value : '').trim();
        const services = getSelectedServices().join(', ');
        const budget = getSelectedBudget();
        const timeline = getSelectedTimeline();
        const message = (messageInput ? messageInput.value : '').trim();

        const submitTextEl = document.getElementById('btnEnquirySubmitText');
        if (submitTextEl) submitTextEl.textContent = 'Submitting enquiry...';
        btnSubmit.disabled = true;

        const payload = {
          name,
          phone,
          email,
          contact: phone + (email ? ' / ' + email : ''),
          company,
          service: services,
          budget,
          timeline,
          message: `Services: ${services} | Budget: ${budget} | Timeline: ${timeline} | Notes: ${message}`,
          details: message
        };

        const waText = `Hi Explore Wings, I would like to enquire about your services.\n\nName: ${name}\nPhone: ${phone}${email ? '\nEmail: ' + email : ''}${company ? '\nBusiness: ' + company : ''}\nServices: ${services}\nBudget: ${budget}\nTimeline: ${timeline}${message ? '\nMessage: ' + message : ''}`;
        const waUrl = `https://wa.me/918921309190?text=${encodeURIComponent(waText)}`;

        try {
          const res = await fetch('/api/enquiry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json().catch(() => ({ success: true }));

          // Success State
          multiForm.style.display = 'none';
          if (fallbackPanel) fallbackPanel.style.display = 'none';
          if (successPanel) {
            successPanel.style.display = 'block';
            const waLeadBtn = document.getElementById('whatsappLeadSuccessBtn');
            if (waLeadBtn) waLeadBtn.href = waUrl;
          }
        } catch (err) {
          // Automatic Network Failure Fallback State (never lose lead)
          multiForm.style.display = 'none';
          if (fallbackPanel) {
            fallbackPanel.style.display = 'block';
            const waFallbackBtn = document.getElementById('whatsappLeadFallbackBtn');
            if (waFallbackBtn) waFallbackBtn.href = waUrl;
          }
        } finally {
          btnSubmit.disabled = false;
          if (submitTextEl) submitTextEl.textContent = 'Send Project Enquiry';
        }
      });
    }

    window.resetEnquiryForm = function () {
      if (multiForm) multiForm.reset();
      if (successPanel) successPanel.style.display = 'none';
      if (fallbackPanel) fallbackPanel.style.display = 'none';
      if (multiForm) multiForm.style.display = 'block';
      showStep(1);
    };
  }

});
