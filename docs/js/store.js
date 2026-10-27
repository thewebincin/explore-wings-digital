'use strict';
/**
 * Explore Wings Client-Side Data & Maintenance Bridge for GitHub Pages
 */
(function() {
  const isGitHubPages = window.location.hostname.endsWith('github.io') || window.location.protocol === 'file:';
  
  // Default Seed Fallback
  const DEFAULT_KEY = 'ew_site_content';
  const MAINT_KEY = 'maintenance_mode';
  const BYPASS_KEY = 'ew_preview_live';

  // 1. Check URL parameters for bypass or preview toggles
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('preview') === 'live' || urlParams.get('bypass') === 'ew-preview') {
    localStorage.setItem(BYPASS_KEY, 'true');
  } else if (urlParams.get('preview') === 'off') {
    localStorage.removeItem(BYPASS_KEY);
  }

  const isMaintOn = localStorage.getItem(MAINT_KEY) === 'on';
  const isPreviewLive = localStorage.getItem(BYPASS_KEY) === 'true';
  const isCurrentMaintPage = window.location.pathname.endsWith('maintenance.html');
  const isCurrentAdminPage = window.location.pathname.includes('/admin/');

  // 2. Handle Maintenance Mode Redirection on Static Hosting
  if (!isCurrentAdminPage) {
    if (isMaintOn && !isPreviewLive && !isCurrentMaintPage) {
      // Public visitor blocked -> redirect to maintenance.html
      const prefix = window.location.pathname.includes('/admin/') ? '../' : './';
      window.location.replace(prefix + 'maintenance.html');
      return;
    }

    if (!isMaintOn && isCurrentMaintPage) {
      // Maintenance turned off -> redirect back to homepage
      window.location.replace('./index.html');
      return;
    }
  }

  // 3. Inject Floating Preview Banner if previewing live while maintenance is on
  if (isMaintOn && isPreviewLive && !isCurrentMaintPage && !isCurrentAdminPage) {
    window.addEventListener('DOMContentLoaded', () => {
      if (!document.querySelector('.admin-preview-floating-bar')) {
        const bar = document.createElement('aside');
        bar.className = 'admin-preview-floating-bar';
        bar.style.cssText = 'position: sticky; top: 0; z-index: 99999; background: #D97706; color: #FFFFFF; padding: 10px 20px; font-size: 0.875rem; font-weight: 600; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 10px rgba(0,0,0,0.25); flex-wrap: wrap; gap: 10px; font-family: sans-serif;';
        bar.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.1rem;">⚠️</span>
            <span><strong>Live Preview Active:</strong> Maintenance Mode is ON in GitHub Pages. Public visitors see the 503 Maintenance Page.</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <a href="?preview=off" style="color: #FFFFFF; text-decoration: underline; font-weight: 700;">View 503 Maintenance Screen</a>
            <a href="admin/index.html#maintenance" style="background: #FFFFFF; color: #92400E; padding: 4px 12px; border-radius: 4px; text-decoration: none; font-weight: 700;">Admin Settings</a>
          </div>
        `;
        document.body.prepend(bar);
      }
    });
  }

  // 4. Inject Admin Confirmation Chip on Maintenance Screen if logged in as Admin
  if (isCurrentMaintPage) {
    window.addEventListener('DOMContentLoaded', () => {
      const isAdmin = localStorage.getItem('ew_admin_logged_in') === 'true';
      const card = document.querySelector('.maintenance-card');
      if (isAdmin && card && !document.getElementById('adminMaintNotice')) {
        const notice = document.createElement('div');
        notice.id = 'adminMaintNotice';
        notice.style.cssText = 'background: #0F172A; color: #F8FAFC; padding: 12px 18px; border-radius: 8px; margin-bottom: 24px; font-size: 0.8125rem; display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; text-align: left; border: 1px solid #334155;';
        notice.innerHTML = `
          <div>
            <strong style="color: #38BDF8;">🔧 Admin Logged In:</strong>
            <span style="display: block; font-size: 0.75rem; color: #94A3B8; margin-top: 2px;">This is the real 503 screen visitors see on GitHub Pages.</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <a href="index.html?preview=live" style="padding: 5px 12px; font-size: 0.75rem; font-weight: 700; background: #2563EB; color: #fff; text-decoration: none; border-radius: 4px;">Preview Live Site &rarr;</a>
            <a href="admin/index.html" style="padding: 5px 12px; font-size: 0.75rem; font-weight: 600; background: #334155; color: #fff; text-decoration: none; border-radius: 4px;">Admin Panel</a>
          </div>
        `;
        card.prepend(notice);
      }
    });
  }

  // 5. Client-side Form Handling for Static Hosting (Captures leads into localStorage)
  window.addEventListener('DOMContentLoaded', () => {
    // Lead capture forms
    const leadForms = document.querySelectorAll('#heroConsultForm, #projectEnquiryForm, form[action*="/api/consultation"]');
    leadForms.forEach(form => {
      form.addEventListener('submit', (e) => {
        if (isGitHubPages) {
          e.preventDefault();
          const formData = new FormData(form);
          const data = Object.fromEntries(formData.entries());
          data.submitted_at = new Date().toISOString();
          
          const existing = JSON.parse(localStorage.getItem('ew_enquiries') || '[]');
          existing.unshift(data);
          localStorage.setItem('ew_enquiries', JSON.stringify(existing));
          
          alert('Thank you! Your enquiry has been received by Explore Wings Digital Technologies.');
          form.reset();
        }
      });
    });

    // Maintenance notification form
    const notifyForm = document.getElementById('notifyForm');
    if (notifyForm) {
      notifyForm.addEventListener('submit', (e) => {
        if (isGitHubPages) {
          e.preventDefault();
          const contact = notifyForm.contact.value;
          const subscribers = JSON.parse(localStorage.getItem('ew_subscribers') || '[]');
          subscribers.unshift({ contact, created_at: new Date().toISOString() });
          localStorage.setItem('ew_subscribers', JSON.stringify(subscribers));
          
          const msgDiv = document.getElementById('notifyMsg');
          if (msgDiv) {
            msgDiv.style.display = 'block';
            msgDiv.style.color = '#10B981';
            msgDiv.textContent = 'Thank you! You will be notified the moment we are back online.';
          }
          notifyForm.reset();
        }
      });
    }

    // Apply any customized section edits from localStorage to DOM
    try {
      const storedData = JSON.parse(localStorage.getItem('ew_custom_sections') || '{}');
      if (storedData) {
        // Hero headline
        if (storedData['home_hero_title']) {
          const el = document.querySelector('.hero-headline');
          if (el) el.innerHTML = storedData['home_hero_title'];
        }
        if (storedData['home_hero_subtitle']) {
          const el = document.querySelector('.hero-lead-text');
          if (el) el.textContent = storedData['home_hero_subtitle'];
        }
      }
    } catch(err) {}
  });
})();
