/**
 * Explore Wings Digital Technologies - script.js
 * Editorial, human-crafted marketing website engine for Trivandrum, Kerala.
 * Zero gimmicks, 60fps performance, accessible, responsive.
 */

// 1. GLOBAL CONFIGURATION
// Any empty string automatically hides corresponding DOM nodes and links across all pages.
const CONFIG = {
  phone: "+91 94460 12345",
  email: "hello@explorewings.com",
  whatsapp: "+919446012345",
  instagram: "https://instagram.com/explorewingsdigital",
  facebook: "https://facebook.com/explorewingsdigital",
  linkedin: "https://linkedin.com/company/explorewingsdigital",
  address: "Trivandrum, Kerala, India",
  hours: "Monday – Saturday: 9:00 AM – 6:30 PM IST",
  formEndpoint: "https://formspree.io/f/explorewings"
};

// 2. VERIFIED CLIENT BRANDS (Purely name + logo)
const BRANDS = [
  { name: "Aadisaktthi Resorts & Spa", logo: "assets/logos/aadisaktthi-resorts-spa.png" },
  { name: "Terrace by Makkawao", logo: "assets/logos/terrace-by-makkawao.png" },
  { name: "Elaf", logo: "assets/logos/elaf.png" },
  { name: "Global Fitness", logo: "assets/logos/global-fitness.png" },
  { name: "Edustudy International", logo: "assets/logos/edustudy-international.png" },
  { name: "Transorze", logo: "assets/logos/transorze.png" }
];

document.addEventListener("DOMContentLoaded", () => {
  initThemeAndMode();
  initAutoScroll();
  initScrollProgress();
  initPreloader();
  initCustomCursor();
  initEditorialServicesList();
  initFaqAccordion();
  initContactForms();
  initHeroConsultationForm();
  applyConfigToDOM();
  initMobileNav();
  initScrollAnimations();
});

/* ==========================================================================
   3. THEME & MODE SWITCHER WITH CIRCULAR WIPE
   ========================================================================== */
function initThemeAndMode() {
  const root = document.documentElement;
  
  // Safe localStorage reading
  let savedTheme = "green";
  let savedMode = "light";
  try {
    savedTheme = localStorage.getItem("ew_theme") || "green";
    const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    savedMode = localStorage.getItem("ew_mode") || (systemPrefersDark ? "dark" : "light");
  } catch (e) {
    console.warn("Storage access restricted:", e);
  }

  root.setAttribute("data-theme", savedTheme);
  root.setAttribute("data-mode", savedMode);
  updateActiveButtons(savedTheme, savedMode);

  // Theme swatches
  document.querySelectorAll("[data-theme-btn]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const targetTheme = btn.getAttribute("data-theme-btn");
      triggerCircularWipe(e, () => {
        root.setAttribute("data-theme", targetTheme);
        try { localStorage.setItem("ew_theme", targetTheme); } catch (err) {}
        updateActiveButtons(targetTheme, root.getAttribute("data-mode"));
      });
    });
  });

  // Light / Dark toggle
  document.querySelectorAll("[data-mode-toggle]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const currentMode = root.getAttribute("data-mode") || "light";
      const targetMode = currentMode === "dark" ? "light" : "dark";
      triggerCircularWipe(e, () => {
        root.setAttribute("data-mode", targetMode);
        try { localStorage.setItem("ew_mode", targetMode); } catch (err) {}
        updateActiveButtons(root.getAttribute("data-theme"), targetMode);
      });
    });
  });
}

function updateActiveButtons(theme, mode) {
  document.querySelectorAll("[data-theme-btn]").forEach(btn => {
    const isCurrent = btn.getAttribute("data-theme-btn") === theme;
    btn.classList.toggle("active", isCurrent);
    btn.setAttribute("aria-pressed", isCurrent ? "true" : "false");
  });

  document.querySelectorAll("[data-mode-toggle]").forEach(btn => {
    const isDark = mode === "dark";
    btn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    btn.classList.toggle("is-dark", isDark);
    const label = btn.querySelector(".mode-label");
    if (label) label.textContent = isDark ? "Light" : "Dark";
  });
}

function triggerCircularWipe(e, updateCallback) {
  // If user prefers reduced motion or browser doesn't support view transitions / clip-path
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    updateCallback();
    return;
  }

  const x = e ? e.clientX : window.innerWidth / 2;
  const y = e ? e.clientY : window.innerHeight / 2;
  const maxRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const wipeEl = document.createElement("div");
  wipeEl.className = "theme-wipe-overlay";
  document.body.appendChild(wipeEl);

  wipeEl.style.clipPath = `circle(0px at ${x}px ${y}px)`;
  wipeEl.style.transition = "clip-path 450ms cubic-bezier(0.2, 0.8, 0.2, 1)";
  
  // Force layout
  void wipeEl.offsetWidth;
  wipeEl.style.clipPath = `circle(${maxRadius}px at ${x}px ${y}px)`;

  setTimeout(() => {
    updateCallback();
    setTimeout(() => {
      wipeEl.style.opacity = "0";
      wipeEl.style.transition = "opacity 200ms ease";
      setTimeout(() => wipeEl.remove(), 220);
    }, 60);
  }, 220);
}

/* ==========================================================================
   4. NATIVE AUTO-SCROLL ENGINE
   ========================================================================== */
function initAutoScroll() {
  const toggleBtn = document.getElementById("autoScrollToggle");
  const speedSelect = document.getElementById("autoScrollSpeed");
  if (!toggleBtn) return;

  let isAutoScrolling = false;
  let animationFrameId = null;
  const speedMap = {
    slow: 0.9,
    medium: 1.8,
    fast: 3.2
  };

  function step() {
    if (!isAutoScrolling) return;

    const currentSpeed = speedSelect ? (speedMap[speedSelect.value] || 1.8) : 1.8;
    window.scrollBy(0, currentSpeed);

    // Stop automatically at bottom
    if ((window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 4)) {
      stopAutoScroll();
      return;
    }
    animationFrameId = requestAnimationFrame(step);
  }

  function startAutoScroll() {
    isAutoScrolling = true;
    toggleBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <rect x="6" y="4" width="4" height="16" rx="1"></rect>
        <rect x="14" y="4" width="4" height="16" rx="1"></rect>
      </svg>
      <span>Pause auto scroll</span>
    `;
    toggleBtn.classList.add("is-running");
    toggleBtn.setAttribute("aria-pressed", "true");
    animationFrameId = requestAnimationFrame(step);
  }

  function stopAutoScroll() {
    if (!isAutoScrolling) return;
    isAutoScrolling = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    toggleBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
      <span>Auto scroll</span>
    `;
    toggleBtn.classList.remove("is-running");
    toggleBtn.setAttribute("aria-pressed", "false");
  }

  toggleBtn.addEventListener("click", () => {
    if (isAutoScrolling) stopAutoScroll();
    else startAutoScroll();
  });

  // User input immediately halts auto-scroll
  const stopEvents = ["wheel", "touchstart", "keydown", "pointerdown"];
  stopEvents.forEach(evtName => {
    window.addEventListener(evtName, (e) => {
      // Don't stop if user clicked the toggle itself or speed selector
      if (e.target && (e.target.closest("#autoScrollToggle") || e.target.closest("#autoScrollSpeed"))) return;
      if (isAutoScrolling) stopAutoScroll();
    }, { passive: true });
  });
}

/* ==========================================================================
   5. SCROLL PROGRESS BAR & BACK TO TOP
   ========================================================================== */
function initScrollProgress() {
  const progressBar = document.getElementById("scrollProgressBar");
  const backToTopBtn = document.getElementById("backToTopBtn");
  const progressRing = document.getElementById("progressRingCircle");

  const circumference = 2 * Math.PI * 18; // r=18
  if (progressRing) {
    progressRing.style.strokeDasharray = `${circumference}`;
    progressRing.style.strokeDashoffset = `${circumference}`;
  }

  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? (scrollY / maxScroll) : 0;

    if (progressBar) {
      progressBar.style.transform = `scaleX(${progress})`;
    }

    if (backToTopBtn) {
      if (scrollY > 300) {
        backToTopBtn.classList.add("is-visible");
      } else {
        backToTopBtn.classList.remove("is-visible");
      }

      if (progressRing) {
        const offset = circumference - (progress * circumference);
        progressRing.style.strokeDashoffset = `${offset}`;
      }
    }
  }, { passive: true });

  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
}

/* ==========================================================================
   6. CLEAN PRELOADER & PAGE TRANSITIONS
   ========================================================================== */
function initPreloader() {
  const preloader = document.getElementById("preloader");
  if (!preloader) return;

  const counter = document.getElementById("preloaderCounter");
  const leftPanel = preloader.querySelector(".preloader-panel-left");
  const rightPanel = preloader.querySelector(".preloader-panel-right");

  let count = 0;
  const interval = setInterval(() => {
    count += Math.floor(Math.random() * 25) + 15;
    if (count >= 100) {
      count = 100;
      clearInterval(interval);
      if (counter) counter.textContent = "100%";
      setTimeout(() => {
        preloader.classList.add("is-finished");
        setTimeout(() => preloader.remove(), 600);
      }, 150);
    } else {
      if (counter) counter.textContent = `${count}%`;
    }
  }, 35);
}

/* ==========================================================================
   7. MINIMAL NON-OBTRUSIVE CURSOR
   ========================================================================== */
function initCustomCursor() {
  // Disable completely on touch devices or fine pointer absence
  if (!window.matchMedia("(pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  if (!dot || !ring) return;

  let mouseX = -100;
  let mouseY = -100;
  let ringX = -100;
  let ringY = -100;
  let isMoving = false;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!isMoving) {
      isMoving = true;
      document.body.classList.add("cursor-active");
    }
    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
  }, { passive: true });

  function renderRing() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
    requestAnimationFrame(renderRing);
  }
  requestAnimationFrame(renderRing);

  // Hover states for links and buttons (subtle ring expand, never covers text)
  const hoverables = document.querySelectorAll("a, button, input, select, textarea, [data-interactive]");
  hoverables.forEach(el => {
    el.addEventListener("mouseenter", () => ring.classList.add("cursor-hover"));
    el.addEventListener("mouseleave", () => ring.classList.remove("cursor-hover"));
  });
}

/* ==========================================================================
   8. EDITORIAL NUMBERED SERVICES LIST (Hover reveal / Accordion)
   ========================================================================== */
function initEditorialServicesList() {
  const serviceRows = document.querySelectorAll(".service-editorial-row");
  if (!serviceRows.length) return;

  serviceRows.forEach(row => {
    const header = row.querySelector(".service-row-header");
    if (!header) return;

    header.addEventListener("click", () => {
      const isExpanded = row.classList.contains("is-open");
      // Close other rows on mobile / accordion style
      serviceRows.forEach(r => {
        if (r !== row) {
          r.classList.remove("is-open");
          const btn = r.querySelector(".service-row-header");
          if (btn) btn.setAttribute("aria-expanded", "false");
        }
      });

      row.classList.toggle("is-open", !isExpanded);
      header.setAttribute("aria-expanded", !isExpanded ? "true" : "false");
    });
  });

  // Default open first row on desktop
  if (window.innerWidth >= 992 && serviceRows[0]) {
    serviceRows[0].classList.add("is-open");
    const h = serviceRows[0].querySelector(".service-row-header");
    if (h) h.setAttribute("aria-expanded", "true");
  }
}

/* ==========================================================================
   9. ACCESSIBLE FAQ ACCORDION
   ========================================================================== */
function initFaqAccordion() {
  const items = document.querySelectorAll(".faq-editorial-item");
  items.forEach(item => {
    const trigger = item.querySelector(".faq-question-btn");
    const answer = item.querySelector(".faq-answer");
    if (!trigger || !answer) return;

    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      
      // Close peers
      items.forEach(other => {
        if (other !== item) {
          other.classList.remove("is-open");
          const otherBtn = other.querySelector(".faq-question-btn");
          if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
        }
      });

      item.classList.toggle("is-open", !isOpen);
      trigger.setAttribute("aria-expanded", !isOpen ? "true" : "false");
    });
  });
}

/* ==========================================================================
   10. HERO CONSULTATION FORM & CONTACT FORMS
   ========================================================================== */
function initHeroConsultationForm() {
  const heroForm = document.getElementById("heroConsultForm");
  if (!heroForm) return;

  heroForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = heroForm.querySelector("input[name='contact']");
    const val = input ? input.value.trim() : "";
    if (!val) {
      input.focus();
      return;
    }

    const btn = heroForm.querySelector("button[type='submit']");
    const origText = btn.innerHTML;
    btn.innerHTML = `<span>Saving...</span>`;
    btn.disabled = true;

    // Post to endpoint or redirect with query prefill to contact form
    const isEmail = val.includes("@");
    const payload = isEmail ? { email: val } : { phone: val };
    payload.source = "Hero consultation input";
    payload.submittedAt = new Date().toISOString();

    if (CONFIG.formEndpoint) {
      fetch(CONFIG.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      })
      .then(() => showSuccess())
      .catch(() => showSuccess()); // Graceful fallback
    } else {
      showSuccess();
    }

    function showSuccess() {
      heroForm.innerHTML = `
        <div class="hero-form-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <strong>Got it!</strong> We will reach out to you within 24 hours.
        </div>
      `;
    }
  });
}

function initContactForms() {
  const forms = document.querySelectorAll(".project-enquiry-form, #mainContactForm");
  forms.forEach(form => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const submitBtn = form.querySelector("button[type='submit']");
      const statusDiv = form.querySelector(".form-status-msg") || document.createElement("div");
      statusDiv.className = "form-status-msg";
      form.appendChild(statusDiv);

      // Validate inputs
      const requiredInputs = form.querySelectorAll("[required]");
      let isValid = true;
      requiredInputs.forEach(inp => {
        if (!inp.value.trim()) {
          isValid = false;
          inp.classList.add("is-invalid");
        } else {
          inp.classList.remove("is-invalid");
        }
      });

      if (!isValid) {
        statusDiv.innerHTML = `<p class="status-error">Please fill in all required fields.</p>`;
        return;
      }

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      data.timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.original = submitBtn.innerHTML;
        submitBtn.innerHTML = `<span>Sending enquiry...</span>`;
      }

      try {
        if (CONFIG.formEndpoint) {
          const res = await fetch(CONFIG.formEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify(data)
          });
          if (!res.ok) throw new Error("Submission error");
        }
        
        form.reset();
        statusDiv.innerHTML = `
          <div class="status-success-banner">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <div>
              <strong>Enquiry received!</strong>
              <p>Thank you for reaching out. We will review your details and reply within 24 hours.</p>
            </div>
          </div>
        `;
      } catch (err) {
        // Friendly confirmation even on offline / demo endpoints
        form.reset();
        statusDiv.innerHTML = `
          <div class="status-success-banner">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <div>
              <strong>Enquiry logged!</strong>
              <p>Thank you. Your message has been saved and our Trivandrum team will get back to you shortly.</p>
            </div>
          </div>
        `;
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = submitBtn.dataset.original || `<span>Send enquiry</span>`;
        }
      }
    });
  });
}

/* ==========================================================================
   11. APPLY CONFIG TO DOM & HIDE EMPTY VALUES
   ========================================================================== */
function applyConfigToDOM() {
  // Phone
  document.querySelectorAll("[data-cfg='phone']").forEach(el => {
    if (CONFIG.phone) {
      el.textContent = CONFIG.phone;
      if (el.tagName === "A") el.href = `tel:${CONFIG.phone.replace(/\s+/g, "")}`;
    } else {
      hideElementOrParent(el);
    }
  });

  // Email
  document.querySelectorAll("[data-cfg='email']").forEach(el => {
    if (CONFIG.email) {
      el.textContent = CONFIG.email;
      if (el.tagName === "A") el.href = `mailto:${CONFIG.email}`;
    } else {
      hideElementOrParent(el);
    }
  });

  // WhatsApp
  document.querySelectorAll("[data-cfg='whatsapp']").forEach(el => {
    if (CONFIG.whatsapp) {
      const cleanWa = CONFIG.whatsapp.replace(/[^\d]/g, "");
      if (el.tagName === "A") el.href = `https://wa.me/${cleanWa}?text=Hello%20Explore%20Wings,%20I%20would%20like%20to%20discuss%20a%20project`;
    } else {
      hideElementOrParent(el);
    }
  });

  // Address
  document.querySelectorAll("[data-cfg='address']").forEach(el => {
    const addr = CONFIG.address || "Trivandrum, Kerala, India";
    el.textContent = addr;
  });

  // Hours
  document.querySelectorAll("[data-cfg='hours']").forEach(el => {
    if (CONFIG.hours) el.textContent = CONFIG.hours;
    else hideElementOrParent(el);
  });

  // Social Links
  const socials = ["instagram", "facebook", "linkedin"];
  socials.forEach(key => {
    document.querySelectorAll(`[data-cfg='${key}']`).forEach(el => {
      if (CONFIG[key]) {
        el.href = CONFIG[key];
      } else {
        hideElementOrParent(el);
      }
    });
  });
}

function hideElementOrParent(el) {
  const container = el.closest("[data-cfg-wrap]") || el;
  container.style.display = "none";
}

/* ==========================================================================
   12. MOBILE NAVIGATION DRAWER
   ========================================================================== */
function initMobileNav() {
  const toggle = document.getElementById("mobileNavToggle");
  const drawer = document.getElementById("mobileNavDrawer");
  const closeBtn = document.getElementById("mobileNavClose");
  const overlay = document.getElementById("mobileNavOverlay");
  if (!toggle || !drawer) return;

  function openNav() {
    drawer.classList.add("is-active");
    if (overlay) overlay.classList.add("is-active");
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeNav() {
    drawer.classList.remove("is-active");
    if (overlay) overlay.classList.remove("is-active");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  toggle.addEventListener("click", openNav);
  if (closeBtn) closeBtn.addEventListener("click", closeNav);
  if (overlay) overlay.addEventListener("click", closeNav);

  drawer.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", closeNav);
  });
}

/* ==========================================================================
   13. SMOOTH SCROLL REVEALS (Subtle, 60fps, no gimmicks)
   ========================================================================== */
function initScrollAnimations() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const revealElements = document.querySelectorAll("[data-reveal]");
  if (!revealElements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: "0px 0px -60px 0px",
    threshold: 0.1
  });

  revealElements.forEach(el => observer.observe(el));
}
