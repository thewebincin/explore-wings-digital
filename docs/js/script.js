/**
 * Explore Wings Digital Technologies - script.js
 * Editorial, human-crafted marketing website engine for Trivandrum, Kerala.
 * Dual color palettes (Green/Red), light/dark modes, 60fps auto-scroll engine,
 * interactive services list, FAQ accordion, accessible drawer, asynchronous forms.
 */

document.addEventListener("DOMContentLoaded", () => {
  initThemeAndMode();
  initAutoScroll();
  initScrollProgress();
  initBackToTop();
  initEditorialServicesList();
  initFaqAccordion();
  initContactForms();
  initHeroConsultationForm();
  initMobileNav();
});

/* ==========================================================================
   1. THEME & MODE SWITCHER WITH CIRCULAR WIPE
   ========================================================================== */
function initThemeAndMode() {
  const root = document.documentElement;
  
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
  wipeEl.style.transition = "clip-path 400ms cubic-bezier(0.2, 0.8, 0.2, 1)";
  
  void wipeEl.offsetWidth;
  wipeEl.style.clipPath = `circle(${maxRadius}px at ${x}px ${y}px)`;

  setTimeout(() => {
    updateCallback();
    setTimeout(() => {
      wipeEl.style.opacity = "0";
      wipeEl.style.transition = "opacity 180ms ease";
      setTimeout(() => wipeEl.remove(), 200);
    }, 60);
  }, 200);
}

/* ==========================================================================
   2. NATIVE AUTO-SCROLL ENGINE
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
    const speedSetting = speedSelect ? speedSelect.value : "medium";
    const delta = speedMap[speedSetting] || 1.8;

    window.scrollBy(0, delta);

    if ((window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 4)) {
      stopAutoScroll();
      return;
    }
    animationFrameId = requestAnimationFrame(step);
  }

  function startAutoScroll() {
    if (isAutoScrolling) return;
    isAutoScrolling = true;
    toggleBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
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

  const stopEvents = ["wheel", "touchstart", "keydown", "pointerdown"];
  stopEvents.forEach(evtName => {
    window.addEventListener(evtName, (e) => {
      if (e.target && (e.target.closest("#autoScrollToggle") || e.target.closest("#autoScrollSpeed"))) return;
      if (isAutoScrolling) stopAutoScroll();
    }, { passive: true });
  });
}

/* ==========================================================================
   3. SCROLL PROGRESS BAR & BACK TO TOP
   ========================================================================== */
function initScrollProgress() {
  const progressBar = document.getElementById("scrollProgressBar");
  if (!progressBar) return;

  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? (scrollY / maxScroll) : 0;
    progressBar.style.transform = `scaleX(${progress})`;
  }, { passive: true });
}

function initBackToTop() {
  const btn = document.getElementById("backToTop") || document.getElementById("backToTopBtn");
  if (!btn) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      btn.classList.add("is-visible");
      btn.style.display = "flex";
    } else {
      btn.classList.remove("is-visible");
      btn.style.display = "none";
    }
  }, { passive: true });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ==========================================================================
   4. EDITORIAL NUMBERED SERVICES LIST
   ========================================================================== */
function initEditorialServicesList() {
  const serviceRows = document.querySelectorAll(".service-editorial-row");
  if (!serviceRows.length) return;

  serviceRows.forEach(row => {
    const header = row.querySelector(".service-row-header");
    if (!header) return;

    header.addEventListener("click", () => {
      const isExpanded = row.classList.contains("is-open");
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
}

/* ==========================================================================
   5. ACCESSIBLE FAQ ACCORDION
   ========================================================================== */
function initFaqAccordion() {
  const items = document.querySelectorAll(".faq-editorial-item");
  items.forEach(item => {
    const trigger = item.querySelector(".faq-question-btn");
    if (!trigger) return;

    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
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
   6. HERO CONSULTATION FORM
   ========================================================================== */
function initHeroConsultationForm() {
  const heroForm = document.getElementById("heroConsultForm");
  if (!heroForm) return;

  heroForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = heroForm.querySelector("input[name='contact']");
    const val = input ? input.value.trim() : "";
    if (!val) return;

    const btn = heroForm.querySelector("button[type='submit']");
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<span>Saving...</span>`;
    btn.disabled = true;

    try {
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: val,
          source_page: "home",
          _hp: heroForm.querySelector("input[name='_hp']")?.value || ""
        })
      });
      const data = await res.json();
      if (data.success) {
        heroForm.innerHTML = `
          <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 18px 24px; color: var(--text);">
            <strong style="color: var(--primary); font-size: 1.0625rem; display: block; margin-bottom: 4px;">Thank you! Consultation requested.</strong>
            <p style="font-size: 0.875rem; color: var(--text-muted); margin: 0;">We have received your details (${val}) and will reply within 24 hours.</p>
          </div>
        `;
      } else {
        alert(data.message || "Could not submit. Please try again.");
        btn.innerHTML = origHtml;
        btn.disabled = false;
      }
    } catch (err) {
      console.error(err);
      btn.innerHTML = origHtml;
      btn.disabled = false;
    }
  });
}

/* ==========================================================================
   7. MAIN CONTACT & PROJECT ENQUIRY FORMS
   ========================================================================== */
function initContactForms() {
  const form = document.getElementById("mainContactForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector("button[type='submit']");
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<span>Sending enquiry...</span>`;
    btn.disabled = true;

    try {
      const formData = new FormData(form);
      const res = await fetch(form.action || "/api/enquiry", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        form.innerHTML = `
          <div style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 36px 24px; text-align: center;">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--theme-highlight); color: var(--primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h3 style="font-size: 1.5rem; margin-bottom: 8px;">Enquiry Received</h3>
            <p style="color: var(--text-muted); font-size: 0.9375rem; max-width: 460px; margin: 0 auto;">
              Thank you for reaching out to Explore Wings Digital Technologies. A founder will review your project brief and reply within 24 hours.
            </p>
          </div>
        `;
      } else {
        alert(data.message || "An error occurred submitting your enquiry. Please check your fields.");
        btn.innerHTML = origHtml;
        btn.disabled = false;
      }
    } catch (err) {
      console.error(err);
      alert("Submission error. Please email or call our studio directly.");
      btn.innerHTML = origHtml;
      btn.disabled = false;
    }
  });
}

/* ==========================================================================
   8. MOBILE NAVIGATION DRAWER
   ========================================================================== */
function initMobileNav() {
  const toggleBtn = document.getElementById("mobileNavToggle");
  const drawer = document.getElementById("mobileNavDrawer");
  const overlay = document.getElementById("mobileNavOverlay");
  const closeBtn = document.getElementById("mobileNavClose");

  if (!toggleBtn || !drawer) return;

  function openDrawer() {
    drawer.classList.add("is-open");
    if (overlay) overlay.classList.add("is-visible");
    document.body.style.overflow = "hidden";
    toggleBtn.setAttribute("aria-expanded", "true");
  }

  function closeDrawer() {
    drawer.classList.remove("is-open");
    if (overlay) overlay.classList.remove("is-visible");
    document.body.style.overflow = "";
    toggleBtn.setAttribute("aria-expanded", "false");
  }

  toggleBtn.addEventListener("click", openDrawer);
  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
  if (overlay) overlay.addEventListener("click", closeDrawer);

  drawer.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeDrawer);
  });
}
