/**
 * ============================================================================
 * EXPLORE WINGS DIGITAL TECHNOLOGIES — BUILT-IN CHATBOT (chatbot.js)
 * Trivandrum (Thiruvananthapuram), Kerala, India
 * ============================================================================
 * Features:
 * 1. Floating round launcher (bottom-right above WhatsApp) + unread dot
 * 2. "Hi, need help?" nudge bubble appearing after 6 seconds
 * 3. Spring-animated window with logo.png on white chip, "Wing Assistant",
 *    green "Online" dot, minimize, clear chat & close controls
 * 4. Knowledge base covering services, pricing (Essential/Signature/Premium),
 *    4-step process (Listen, Create, Launch, Grow), turnaround, Trivandrum HQ,
 *    working hours, and client brands
 * 5. Interactive 4-step Lead Capture flow (Name → Phone/Email → Service → Budget)
 *    with validation, summary preview, Formspree/EmailJS submission & animation
 * 6. Optional AI Proxy switch (never exposes API keys in front-end code) with
 *    automatic fallback to the local knowledge base
 * 7. sessionStorage conversation persistence (inside try/catch), keyboard
 *    accessibility (Enter to send, Esc to close), and screen-reader announcements
 * ============================================================================
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. CONFIGURATION & EASY-TO-EDIT KNOWLEDGE BASE
     ========================================================================== */
  const CHATBOT_CONFIG = {
    botName: 'Wing Assistant',
    logoSrc: 'logo.png',
    whatsappNumber: '918921309190',
    leadEndpoint: 'https://formspree.io/f/your-placeholder-id', // [Placeholder — Formspree/EmailJS]
    nudgeDelayMs: 6000,
    storageKey: 'ew_wing_assistant_chat_v1',
    soundEnabledByDefault: false,
    // Optional AI mode: connects to your backend proxy so API keys are NEVER in frontend code
    aiMode: {
      enabled: false,
      proxyEndpoint: '/api/wing-assistant-chat',
      timeoutMs: 4500
    }
  };

  const QUICK_CHIPS = [
    'Website design',
    'Branding & logo',
    'Social media',
    'Pricing',
    'Our clients',
    'Book a consultation',
    'Talk on WhatsApp'
  ];

  const KNOWLEDGE_BASE = [
    {
      id: 'websites',
      keywords: ['website', 'web design', 'site', 'landing page', 'ecommerce', 'mobile site', 'business website'],
      answer:
        'We design fast, mobile-first **Websites & Business Websites** tailored for resorts, cafes, clinics, academies, fitness centers, and retail stores in Trivandrum & across Kerala.\n\n• Custom design in your brand colors\n• Direct WhatsApp & phone enquiry buttons\n• Local Google SEO setup included\n• Typical turnaround: **2 to 4 weeks**.'
    },
    {
      id: 'branding',
      keywords: ['brand', 'branding', 'logo', 'packaging', 'menu', 'box', 'signage', 'identity', 'rebrand'],
      answer:
        'Our **Branding, Logos & Packaging** team crafts unforgettable visual identities:\n\n• Custom logo design + full color & font system\n• Restaurant menus, resort brochures & storefront signage\n• Retail & food packaging (like **Elaf — "Flavors that Unite"**)\n• Delivered with print-ready & digital files.'
    },
    {
      id: 'social',
      keywords: ['social', 'instagram', 'facebook', 'reels', 'content', 'ads', 'marketing', 'google ads', 'meta ads', 'seo'],
      answer:
        'We handle **Social Media, Reels Production & Digital Marketing** so your business stays busy every week:\n\n• Monthly Instagram & Facebook calendars\n• On-location photo & Reel shoots in Trivandrum\n• Targeted Meta & Google Ads for local footfall & enquiries\n• Google Maps listing optimization.'
    },
    {
      id: 'pricing',
      keywords: ['price', 'pricing', 'cost', 'package', 'budget', 'rate', 'essential', 'signature', 'premium', 'how much'],
      answer:
        'Our transparent packages:\n\n1. **Essential**: ₹35,000 one-time (or ₹15,000/mo) — Ideal for new local shops & cafes\n2. **Signature (Most Popular)**: ₹75,000 one-time (or ₹28,000/mo) — Complete website, branding & social launch\n3. **Premium**: ₹1,45,000 one-time (or ₹52,000/mo) — Full multi-channel production & growth campaigns\n\nWould you like to **Book a consultation** for a custom quote?'
    },
    {
      id: 'process',
      keywords: ['process', 'how it works', 'steps', 'timeline', 'turnaround', 'how long', 'time'],
      answer:
        'We follow a simple 4-step process:\n\n1. **Listen**: Understand your business goals & customers in Trivandrum/Kerala\n2. **Create**: Design your logo, website, photos & campaigns\n3. **Launch**: Go live smoothly after your review\n4. **Grow**: Track enquiries and scale with ongoing support\n\nMost websites & brand launches take **2–4 weeks**.'
    },
    {
      id: 'clients',
      keywords: ['client', 'work', 'brands', 'trust', 'aadisaktthi', 'terrace', 'makkawao', 'transorze', 'edustudy', 'global fitness', 'elaf', 'lulu', 'munch'],
      answer:
        'Brands that trust **Explore Wings Digital Technologies** include:\n\n• **Aadisaktthi Resorts & Spa** (Kovalam, Trivandrum)\n• **Terrace by Makkawao** (Cafe & dining, Kazhakkoottam)\n• **Transorze**\n• **Edustudy International**\n• **Global Fitness**\n• **Elaf** ("Flavors that Unite")\n• **LuLu** & **Munch (Nestlé)**\n\nVisit our home page to see our trusted brands marquee!'
    },
    {
      id: 'location',
      keywords: ['where', 'location', 'address', 'trivandrum', 'thiruvananthapuram', 'kerala', 'office', 'hours', 'timing', 'contact', 'phone', 'email'],
      answer:
        'We are proudly based in **Trivandrum (Thiruvananthapuram), Kerala, India**.\n\n• **Hours**: Monday – Saturday: 9:30 AM – 6:30 PM IST\n• **Call**: +91 75104 05067 / +91 62389 76168\n• **WhatsApp**: +91 89213 09190\n• **Email**: hello@explorewings.in\n\nType **"Book a consultation"** here or message us on WhatsApp!'
    }
  ];

  /* ==========================================================================
     2. STATE & SESSION STORAGE PERSISTENCE
     ========================================================================== */
  let state = {
    isOpen: false,
    isMinimized: false,
    soundEnabled: CHATBOT_CONFIG.soundEnabledByDefault,
    leadStep: null, // null | 'name' | 'contact' | 'service' | 'budget'
    leadData: {
      name: '',
      contact: '',
      service: '',
      budget: ''
    },
    messages: []
  };

  function loadSession() {
    try {
      const raw = sessionStorage.getItem(CHATBOT_CONFIG.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          state.messages = parsed.messages;
          state.leadStep = parsed.leadStep || null;
          state.leadData = parsed.leadData || { name: '', contact: '', service: '', budget: '' };
          return true;
        }
      }
    } catch (_) {}
    return false;
  }

  function saveSession() {
    try {
      sessionStorage.setItem(
        CHATBOT_CONFIG.storageKey,
        JSON.stringify({
          messages: state.messages.slice(-30),
          leadStep: state.leadStep,
          leadData: state.leadData
        })
      );
    } catch (_) {}
  }

  function getTimeStr() {
    try {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return 'Just now';
    }
  }

  /* ==========================================================================
     3. BUILD & INJECT CHATBOT DOM
     ========================================================================== */
  function initChatbotDOM() {
    if (document.getElementById('wingChatbotWindow')) return;

    // 1. Nudge Bubble ("Hi, need help?" after 6 seconds)
    const nudge = document.createElement('div');
    nudge.className = 'wing-chatbot-nudge';
    nudge.id = 'wingChatbotNudge';
    nudge.setAttribute('role', 'status');
    nudge.innerHTML = `
      <span>👋 Hi, need help?</span>
      <button type="button" class="wing-chatbot-nudge-close" id="wingNudgeClose" aria-label="Dismiss message">✕</button>
    `;

    // 2. Floating Round Launcher Button (above WhatsApp button)
    const launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.className = 'wing-chatbot-launcher';
    launcher.id = 'wingChatbotLauncher';
    launcher.setAttribute('aria-label', 'Open Wing Assistant Chat');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.innerHTML = `
      <span class="wing-chatbot-unread" id="wingChatbotUnread">1</span>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      </svg>
    `;

    // 3. Main Chat Window
    const win = document.createElement('aside');
    win.className = 'wing-chatbot-window';
    win.id = 'wingChatbotWindow';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-label', 'Wing Assistant Chat Window');
    win.innerHTML = `
      <div class="wing-chatbot-header">
        <div class="wing-chatbot-brand">
          <span class="logo-white-chip">
            <img src="${CHATBOT_CONFIG.logoSrc}" alt="Explore Wings Logo" onerror="this.style.display='none'" />
          </span>
          <div>
            <div class="wing-chatbot-title">${CHATBOT_CONFIG.botName}</div>
            <div class="wing-chatbot-status">
              <span class="wing-online-dot"></span>
              <span>Online • Trivandrum Desk</span>
            </div>
          </div>
        </div>
        <div class="wing-chatbot-controls">
          <button type="button" class="wing-chat-ctrl-btn" id="wingChatMinBtn" title="Minimize chat" aria-label="Minimize chat">—</button>
          <button type="button" class="wing-chat-ctrl-btn" id="wingChatCloseBtn" title="Close chat" aria-label="Close chat">✕</button>
        </div>
      </div>

      <div class="wing-chatbot-messages" id="wingChatMessages" aria-live="polite"></div>

      <div class="wing-quick-chips" id="wingQuickChips" aria-label="Quick reply options"></div>

      <div class="wing-chatbot-footer">
        <form class="wing-chatbot-form" id="wingChatForm" novalidate>
          <input
            type="text"
            class="wing-chatbot-input"
            id="wingChatInput"
            placeholder="Ask a question or type 'book'..."
            aria-label="Type your message"
            autocomplete="off"
          />
          <button type="submit" class="wing-chatbot-send" aria-label="Send message">Send</button>
        </form>
        <div class="wing-chatbot-subbar">
          <a
            href="https://wa.me/${CHATBOT_CONFIG.whatsappNumber}?text=Hi%20Explore%20Wings%20team%20in%20Trivandrum%2C%20I%20would%20like%20to%20discuss%20a%20project."
            target="_blank"
            rel="noopener"
            class="wing-human-link"
            onclick="fetch('/api/analytics/whatsapp-click').catch(function(){});"
          >
            <span>💬 Talk to a human on WhatsApp</span>
          </a>
          <button type="button" class="wing-clear-btn" id="wingClearChatBtn">Clear chat</button>
        </div>
      </div>
    `;

    document.body.appendChild(nudge);
    document.body.appendChild(launcher);
    document.body.appendChild(win);

    renderQuickChips(QUICK_CHIPS);

    const restored = loadSession();
    if (restored) {
      renderAllMessages();
    } else {
      pushMessage(
        'bot',
        'Namaskaram! 👋 Welcome to **Explore Wings Digital Technologies** in Trivandrum, Kerala.\n\nHow can we help grow your business today? Choose a quick topic below or ask me anything.'
      );
    }

    // Show "Hi, need help?" nudge after 6 seconds if chat hasn't been opened
    setTimeout(() => {
      if (!state.isOpen) {
        nudge.classList.add('visible');
      }
    }, CHATBOT_CONFIG.nudgeDelayMs);

    bindEvents(launcher, nudge, win);
  }

  /* ==========================================================================
     4. RENDERING MESSAGES, TYPING INDICATOR & QUICK CHIPS
     ========================================================================== */
  function formatMarkdownLite(text) {
    const safe = String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return safe
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');
  }

  function renderAllMessages() {
    const box = document.getElementById('wingChatMessages');
    if (!box) return;
    box.innerHTML = '';
    state.messages.forEach(m => {
      const div = document.createElement('div');
      div.className = `wing-msg ${m.sender}`;
      div.innerHTML = `${formatMarkdownLite(m.text)}<span class="wing-msg-time">${m.time}</span>`;
      box.appendChild(div);
    });
    box.scrollTop = box.scrollHeight;
  }

  function pushMessage(sender, text) {
    const msg = { sender, text, time: getTimeStr() };
    state.messages.push(msg);
    saveSession();

    const box = document.getElementById('wingChatMessages');
    if (box) {
      const div = document.createElement('div');
      div.className = `wing-msg ${sender}`;
      div.innerHTML = `${formatMarkdownLite(text)}<span class="wing-msg-time">${msg.time}</span>`;
      box.appendChild(div);
      box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
    }
  }

  function showTypingThenReply(replyText, customChips) {
    const box = document.getElementById('wingChatMessages');
    if (!box) return;

    const typing = document.createElement('div');
    typing.className = 'wing-typing';
    typing.id = 'wingTypingIndicator';
    typing.setAttribute('aria-label', 'Wing Assistant is typing');
    typing.innerHTML = '<span></span><span></span><span></span>';
    box.appendChild(typing);
    box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });

    setTimeout(() => {
      if (typing.parentNode) typing.remove();
      pushMessage('bot', replyText);
      if (customChips) renderQuickChips(customChips);
    }, 520);
  }

  function renderQuickChips(chipsArray) {
    const wrap = document.getElementById('wingQuickChips');
    if (!wrap) return;
    wrap.innerHTML = '';
    chipsArray.forEach(label => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'wing-chip';
      btn.textContent = label;
      btn.addEventListener('click', () => handleUserTurn(label));
      wrap.appendChild(btn);
    });
  }

  /* ==========================================================================
     5. LEAD CAPTURE FLOW + OPTIONAL AI PROXY + KNOWLEDGE BASE MATCHING
     ========================================================================== */
  async function submitLeadToEndpoint(lead) {
    if (
      CHATBOT_CONFIG.leadEndpoint &&
      CHATBOT_CONFIG.leadEndpoint.startsWith('https://formspree.io/') &&
      !CHATBOT_CONFIG.leadEndpoint.includes('your-placeholder-id')
    ) {
      try {
        const fd = new FormData();
        fd.append('name', lead.name);
        fd.append('contact', lead.contact);
        fd.append('service', lead.service);
        fd.append('budget', lead.budget);
        fd.append('source', 'Wing Assistant Chatbot');
        await fetch(CHATBOT_CONFIG.leadEndpoint, {
          method: 'POST',
          body: fd,
          headers: { Accept: 'application/json' }
        });
      } catch (_) {}
    }
  }

  function handleLeadCaptureStep(input) {
    const clean = input.trim();

    if (state.leadStep === 'name') {
      if (clean.length < 2) {
        showTypingThenReply('Please share your **full name** (at least 2 characters) so we know who to address.');
        return;
      }
      state.leadData.name = clean;
      state.leadStep = 'contact';
      saveSession();
      showTypingThenReply(
        `Nice to meet you, **${clean}**! What is your **phone/WhatsApp number** or **email address**?`
      );
      return;
    }

    if (state.leadStep === 'contact') {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
      const digits = clean.replace(/\D/g, '');
      const isPhone = digits.length >= 8 && digits.length <= 15;
      if (!isEmail && !isPhone) {
        showTypingThenReply(
          'Please enter a valid **10-digit phone/WhatsApp number** or a valid **email address** (e.g. `9876543210` or `name@business.com`).'
        );
        return;
      }
      state.leadData.contact = clean;
      state.leadStep = 'service';
      saveSession();
      showTypingThenReply(
        'Great! Which **service** do you need help with?',
        ['Website design', 'Branding & logo', 'Social media & Ads', 'Photo & video shoot', 'Complete package']
      );
      return;
    }

    if (state.leadStep === 'service') {
      state.leadData.service = clean;
      state.leadStep = 'budget';
      saveSession();
      showTypingThenReply(
        'Almost done! What is your approximate **budget range**? `[Placeholder tiers]`',
        ['₹35k – ₹60k (Essential)', '₹60k – ₹1.2L (Signature)', '₹1.2L+ (Premium)', 'Not sure yet']
      );
      return;
    }

    if (state.leadStep === 'budget') {
      state.leadData.budget = clean;
      const summary = { ...state.leadData };
      state.leadStep = null;
      saveSession();

      submitLeadToEndpoint(summary);

      showTypingThenReply(
        `✅ **Consultation Request Confirmed!**\n\n• **Name**: ${summary.name}\n• **Contact**: ${summary.contact}\n• **Service**: ${summary.service}\n• **Budget**: ${summary.budget}\n\nOur Trivandrum team will reach out within 2 working hours. You can also click **"Talk to a human on WhatsApp"** below anytime!`,
        QUICK_CHIPS
      );
    }
  }

  async function tryOptionalAIProxy(query) {
    if (!CHATBOT_CONFIG.aiMode.enabled || !CHATBOT_CONFIG.aiMode.proxyEndpoint) {
      return null;
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CHATBOT_CONFIG.aiMode.timeoutMs);
      const res = await fetch(CHATBOT_CONFIG.aiMode.proxyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data && data.reply) return data.reply;
      }
    } catch (_) {}
    return null;
  }

  async function handleUserTurn(rawInput) {
    const text = (rawInput || '').trim();
    if (!text) return;

    pushMessage('user', text);
    const lower = text.toLowerCase();

    // Direct WhatsApp shortcut
    if (lower.includes('talk on whatsapp') || lower === 'whatsapp') {
      const url = `https://wa.me/${CHATBOT_CONFIG.whatsappNumber}?text=${encodeURIComponent(
        'Hi Explore Wings Digital Technologies in Trivandrum, I would like a free consultation.'
      )}`;
      window.open(url, '_blank', 'noopener');
      showTypingThenReply(
        'I have opened **WhatsApp** in a new tab so you can chat directly with our Trivandrum team! Feel free to ask anything else here too.'
      );
      return;
    }

    // Cancel lead capture if user types cancel
    if (state.leadStep && (lower === 'cancel' || lower === 'stop')) {
      state.leadStep = null;
      saveSession();
      showTypingThenReply('No problem! We paused the booking form. How else can I help you today?', QUICK_CHIPS);
      return;
    }

    // Continue active lead capture step
    if (state.leadStep) {
      handleLeadCaptureStep(text);
      return;
    }

    // Start lead capture flow
    if (
      lower.includes('book a consultation') ||
      lower.includes('book') ||
      lower.includes('free consultation') ||
      lower.includes('start project') ||
      lower.includes('get quote')
    ) {
      state.leadStep = 'name';
      state.leadData = { name: '', contact: '', service: '', budget: '' };
      saveSession();
      showTypingThenReply(
        "Let's book your **free consultation** with our Trivandrum team! (Type `cancel` anytime to stop.)\n\nFirst, what is your **full name**?"
      );
      return;
    }

    // Optional AI mode (with graceful fallback to knowledge base)
    const aiReply = await tryOptionalAIProxy(text);
    if (aiReply) {
      showTypingThenReply(aiReply, QUICK_CHIPS);
      return;
    }

    // Match built-in Knowledge Base
    for (const item of KNOWLEDGE_BASE) {
      if (item.keywords.some(k => lower.includes(k))) {
        showTypingThenReply(item.answer, QUICK_CHIPS);
        return;
      }
    }

    // Friendly fallback (never an error screen)
    showTypingThenReply(
      'Thanks for asking! We help businesses in **Trivandrum & Kerala** with **Websites, Branding & Logos, Social Media, Photo/Video Shoots, and Digital Marketing**.\n\nWould you like to see our **Pricing**, explore **Our clients**, or **Book a consultation** right here in chat?',
      QUICK_CHIPS
    );
  }

  /* ==========================================================================
     6. EVENT LISTENERS & KEYBOARD ACCESSIBILITY
     ========================================================================== */
  function bindEvents(launcher, nudge, win) {
    const unread = document.getElementById('wingChatbotUnread');
    const nudgeClose = document.getElementById('wingNudgeClose');
    const minBtn = document.getElementById('wingChatMinBtn');
    const closeBtn = document.getElementById('wingChatCloseBtn');
    const clearBtn = document.getElementById('wingClearChatBtn');
    const form = document.getElementById('wingChatForm');
    const input = document.getElementById('wingChatInput');

    function openChat() {
      state.isOpen = true;
      state.isMinimized = false;
      win.classList.add('open');
      win.classList.remove('minimized');
      launcher.setAttribute('aria-expanded', 'true');
      nudge.classList.remove('visible');
      if (unread) unread.classList.add('hidden');
      setTimeout(() => {
        if (input) input.focus();
      }, 220);
    }

    function closeChat() {
      state.isOpen = false;
      win.classList.remove('open');
      launcher.setAttribute('aria-expanded', 'false');
    }

    launcher.addEventListener('click', () => {
      if (state.isOpen) closeChat();
      else openChat();
    });

    nudge.addEventListener('click', e => {
      if (e.target === nudgeClose) {
        nudge.classList.remove('visible');
        return;
      }
      openChat();
    });

    if (minBtn) {
      minBtn.addEventListener('click', () => {
        state.isMinimized = !state.isMinimized;
        win.classList.toggle('minimized', state.isMinimized);
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', closeChat);
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        state.messages = [];
        state.leadStep = null;
        try {
          sessionStorage.removeItem(CHATBOT_CONFIG.storageKey);
        } catch (_) {}
        renderAllMessages();
        pushMessage(
          'bot',
          'Chat cleared! 👋 How can we help your business in Trivandrum today?'
        );
        renderQuickChips(QUICK_CHIPS);
      });
    }

    if (form && input) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const val = input.value;
        input.value = '';
        handleUserTurn(val);
      });
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && state.isOpen) {
        closeChat();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbotDOM);
  } else {
    initChatbotDOM();
  }
})();
