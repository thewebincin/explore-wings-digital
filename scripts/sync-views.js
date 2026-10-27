'use strict';
/**
 * sync-views.js
 * Synchronizes the rich Shopify-inspired sections from Downloads into views/site/
 * so that both the Express/SQLite server and GitHub Pages render the exact same
 * red-theme marketing experience.
 */
const fs = require('fs');
const path = require('path');

const downloadsDir = 'C:\\Users\\NAVANEETH\\Downloads\\explore-wing-digital';
const rootDir = path.resolve(__dirname, '..');
const viewsDir = path.join(rootDir, 'views', 'site');

function extractMainContent(html) {
  const match = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  return match ? match[1].trim() : html;
}

function adjustToExpressPaths(html) {
  let out = html;
  // Replace links
  out = out.replace(/href="index\.html"/g, 'href="/"');
  out = out.replace(/href="services\.html"/g, 'href="/services"');
  out = out.replace(/href="pricing\.html"/g, 'href="/pricing"');
  out = out.replace(/href="about\.html"/g, 'href="/about"');
  out = out.replace(/href="contact\.html"/g, 'href="/contact"');
  out = out.replace(/href="portfolio\.html"/g, 'href="/services"');

  // Replace images
  out = out.replace(/src="logo\.png"/g, 'src="/logo.png"');
  out = out.replace(/src="assets\//g, 'src="/assets/');
  return out;
}

// 1. Home page (index.ejs)
const indexHtml = fs.readFileSync(path.join(downloadsDir, 'index.html'), 'utf8');
const mainIndex = adjustToExpressPaths(extractMainContent(indexHtml));
fs.writeFileSync(path.join(viewsDir, 'index.ejs'), mainIndex, 'utf8');
console.log('[sync-views] Updated views/site/index.ejs');

// 2. Services page (services.ejs)
const servicesHtml = fs.readFileSync(path.join(downloadsDir, 'services.html'), 'utf8');
const mainServices = adjustToExpressPaths(extractMainContent(servicesHtml));
fs.writeFileSync(path.join(viewsDir, 'services.ejs'), mainServices, 'utf8');
console.log('[sync-views] Updated views/site/services.ejs');

// 3. Pricing page (pricing.ejs)
const pricingHtml = fs.readFileSync(path.join(downloadsDir, 'pricing.html'), 'utf8');
const mainPricing = adjustToExpressPaths(extractMainContent(pricingHtml));
fs.writeFileSync(path.join(viewsDir, 'pricing.ejs'), mainPricing, 'utf8');
console.log('[sync-views] Updated views/site/pricing.ejs');

// 4. About page (about.ejs)
const aboutHtml = fs.readFileSync(path.join(downloadsDir, 'about.html'), 'utf8');
const mainAbout = adjustToExpressPaths(extractMainContent(aboutHtml));
fs.writeFileSync(path.join(viewsDir, 'about.ejs'), mainAbout, 'utf8');
console.log('[sync-views] Updated views/site/about.ejs');

// 5. Contact page (contact.ejs)
const contactHtml = fs.readFileSync(path.join(downloadsDir, 'contact.html'), 'utf8');
const mainContact = adjustToExpressPaths(extractMainContent(contactHtml));
fs.writeFileSync(path.join(viewsDir, 'contact.ejs'), mainContact, 'utf8');
console.log('[sync-views] Updated views/site/contact.ejs');

// 6. Update chatbot partial to include clientDetailDrawer
const drawerMatch = indexHtml.match(/(<!-- =+[\s\S]*?RIGHT-SIDE SLIDE-IN CLIENT DETAIL DRAWER[\s\S]*?<\/aside>)/i);
const drawerHtml = drawerMatch ? adjustToExpressPaths(drawerMatch[1]) : '';

const chatbotPartialContent = `<!-- Wing Assistant Chatbot Float Button + Drawer Container -->
<div class="chatbot-floating-wrapper" id="chatbotFloatingWrapper">
  <!-- Bot launcher button with pulse badge -->
  <button type="button" class="chatbot-launcher-btn" id="chatbotLauncherBtn" aria-label="Open Wing Assistant Chatbot" aria-expanded="false">
    <div class="bot-launcher-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    </div>
    <span class="bot-launcher-pulse"></span>
  </button>

  <!-- Chatbot Window Dialog -->
  <div class="chatbot-window" id="chatbotWindow" role="dialog" aria-modal="true" aria-label="Wing Assistant Chat" aria-hidden="true">
    <div class="chatbot-header">
      <div class="chatbot-header-brand">
        <div class="chatbot-avatar">
          <img src="/logo.png" alt="Wing Assistant" />
        </div>
        <div>
          <h4 class="chatbot-title">Wing Assistant</h4>
          <span class="chatbot-status">
            <span class="status-indicator-dot"></span> Online &bull; Trivandrum HQ
          </span>
        </div>
      </div>
      <button type="button" class="chatbot-close-btn" id="chatbotCloseBtn" aria-label="Close Chat">✕</button>
    </div>

    <!-- Message stream area -->
    <div class="chatbot-body" id="chatbotMessages">
      <div class="chat-bubble bot-bubble">
        <p>Namaskaram! 🙏 I'm the <strong>Wing Assistant</strong> from Explore Wings Digital Technologies in Trivandrum.</p>
        <p>How can we help your business today?</p>
      </div>
      <div class="chatbot-chips-row" id="chatbotQuickChips">
        <button type="button" class="chat-chip-btn" data-chip="services">Our Services</button>
        <button type="button" class="chat-chip-btn" data-chip="pricing">Pricing &amp; Plans</button>
        <button type="button" class="chat-chip-btn" data-chip="location">Trivandrum Office</button>
        <button type="button" class="chat-chip-btn" data-chip="consult">Book Free Call</button>
      </div>
    </div>

    <!-- Footer input -->
    <div class="chatbot-footer">
      <form class="chatbot-input-form" id="chatbotInputForm">
        <input type="text" id="chatbotInputText" placeholder="Type your question..." aria-label="Type your message" autocomplete="off" />
        <button type="submit" class="chatbot-send-btn" aria-label="Send message">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  </div>
</div>

${drawerHtml}

<!-- Pulsing WhatsApp Button & Back-to-Top Button -->
<a
  href="https://wa.me/<%= ((locals.settings && locals.settings.contact_whatsapp) || '919000000000').replace(/[^0-9]/g, '') %>?text=Hello%20Explore%20Wings%20team%2C%20I%20would%20like%20to%20book%20a%20free%20consultation."
  target="_blank"
  rel="noopener"
  class="whatsapp-float"
  aria-label="Chat on WhatsApp"
>
  <svg viewBox="0 0 32 32"><path d="M16.004 3.2c-7.07 0-12.8 5.73-12.8 12.8 0 2.257.59 4.46 1.71 6.404L3.2 28.8l6.565-1.693a12.74 12.74 0 0 0 6.239 1.627h.005c7.068 0 12.796-5.73 12.796-12.8 0-3.42-1.332-6.635-3.75-9.052A12.716 12.716 0 0 0 16.004 3.2z"/></svg>
  <span class="whatsapp-tooltip">Chat With Us on WhatsApp</span>
</a>

<button type="button" class="back-to-top" id="backToTop" aria-label="Back to top">↑</button>
`;

fs.writeFileSync(path.join(viewsDir, 'partials', 'chatbot.ejs'), chatbotPartialContent, 'utf8');
console.log('[sync-views] Updated views/site/partials/chatbot.ejs');
console.log('[sync-views] All templates synchronized successfully!');
