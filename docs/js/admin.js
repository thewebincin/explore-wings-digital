/**
 * Explore Wings Admin Console - Client Scripts
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Theme Swatches & Mode Toggle
  const html = document.documentElement;
  const savedTheme = localStorage.getItem('ew_admin_theme') || 'green';
  const savedMode = localStorage.getItem('ew_admin_mode') || 'light';
  html.setAttribute('data-theme', savedTheme);
  html.setAttribute('data-mode', savedMode);

  document.querySelectorAll('[data-theme-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme-btn');
      html.setAttribute('data-theme', theme);
      localStorage.setItem('ew_admin_theme', theme);
    });
  });

  const modeBtn = document.getElementById('adminModeToggle');
  if (modeBtn) {
    modeBtn.addEventListener('click', () => {
      const current = html.getAttribute('data-mode') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-mode', next);
      localStorage.setItem('ew_admin_mode', next);
    });
  }

  // 2. Mobile Sidebar Toggle
  const sidebar = document.getElementById('adminSidebar');
  const toggleBtn = document.getElementById('adminSidebarToggle');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // 3. Auto-dismiss alerts after 5 seconds
  document.querySelectorAll('.admin-alert').forEach(alert => {
    setTimeout(() => {
      alert.style.transition = 'opacity 0.4s ease';
      alert.style.opacity = '0';
      setTimeout(() => alert.remove(), 400);
    }, 5000);
  });
});
