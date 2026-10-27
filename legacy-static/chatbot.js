/**
 * Explore Wings Digital Technologies - chatbot.js
 * "Wing Assistant" - lightweight, honest, client-focused assistant.
 * Direct answers, no fluff, no AI buzzwords, lead-capture enabled.
 */

(function () {
  const KNOWLEDGE_BASE = {
    services: {
      title: "Our Core Services",
      text: "We provide six core services for businesses in Kerala and beyond:\n\n1. Custom Websites & Web Apps (fast, clean, mobile-first)\n2. Brand Identity & Logo Design (signboards, packaging, style guides)\n3. Social Media Management (reels, posts, content calendar)\n4. Photography & Commercial Video (on-location in Kerala)\n5. Performance Digital Marketing (Meta & Google ads, real leads)\n6. Google Search & Local SEO (Google Maps & local search ranking)",
      chips: ["Websites", "Branding", "Social Media", "Local SEO", "Pricing & Quote"]
    },
    websites: {
      title: "Websites & Web Apps",
      text: "We build custom websites that load in under 2 seconds, look sharp on every phone screen, and turn visitors into enquiries. No clunky bloated page builders. Everything is hand-coded or built on reliable platforms like WordPress or Shopify depending on your business model.",
      chips: ["Pricing & Quote", "How we work", "Back to Services"]
    },
    branding: {
      title: "Brand Identity & Logo Design",
      text: "We create distinct brand identities: primary and secondary logos, Malayalam & English typography pairing, color palettes, print-ready vector files, shop signboard specs, and brand guidelines you can hand to any printer in Trivandrum.",
      chips: ["Pricing & Quote", "Websites", "Back to Services"]
    },
    social: {
      title: "Social Media Management",
      text: "Consistent, thoughtful content for Instagram, Facebook, and LinkedIn. We plan monthly calendars, shoot real photos/reels, write straightforward captions, and engage with your local community. No generic Canva templates.",
      chips: ["Photo & Video", "Digital Marketing", "Back to Services"]
    },
    photo: {
      title: "Photography & Commercial Video",
      text: "Real imagery for real businesses. We bring cameras, lighting, and audio directly to your venue in Trivandrum, Kovalam, Varkala, or Kochi. Perfect for restaurant dishes, resort interiors, gym workouts, or product catalogs.",
      chips: ["Social Media", "Websites", "Back to Services"]
    },
    marketing: {
      title: "Performance Digital Marketing",
      text: "Targeted advertising across Meta (Instagram/Facebook) and Google Ads. We focus strictly on genuine inquiries, store visits, and bookings rather than meaningless vanity impressions.",
      chips: ["Pricing & Quote", "Local SEO", "Back to Services"]
    },
    localseo: {
      title: "Google Search & Local SEO",
      text: "When someone in Trivandrum searches for what you offer, you need to show up on Google Maps and top search results. We optimize your Google Business profile, citations, keywords, and local review strategy.",
      chips: ["Websites", "Pricing & Quote", "Back to Services"]
    },
    process: {
      title: "How We Work",
      text: "Our process is clear and predictable:\n\n• Step 1: Listen — We sit down with you (in person in Trivandrum or on a call) to understand your real business goals.\n• Step 2: Create — We design and build the work with weekly check-ins.\n• Step 3: Launch — Thorough testing on devices before going live.\n• Step 4: Grow — Ongoing support, SEO monitoring, and updates.",
      chips: ["Pricing & Quote", "Get Free Consultation", "Back to Services"]
    },
    pricing: {
      title: "Pricing & Quotes",
      text: "We offer transparent project packages:\n\n• Essential — For single-location businesses needing a quick, polished launch.\n• Signature — Our most popular complete package (website + brand refresh + Google Maps).\n• Growth — Complete digital presence with content creation and ongoing ads.\n\nEvery project gets a fixed written quote with no surprise fees.",
      chips: ["Get Free Consultation", "Contact Details", "Our Services"]
    },
    contact: {
      title: "Contact & Location",
      text: "We are based right here in Trivandrum, Kerala.\n\n• Location: Trivandrum, Kerala, India\n• Hours: Monday to Saturday, 9:00 AM – 6:30 PM IST\n• Email: hello@explorewings.com\n\nYou can also leave your contact information right here, and we will get back to you within 24 hours.",
      chips: ["Get Free Consultation", "Our Services", "How we work"]
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    initChatbotUI();
  });

  function initChatbotUI() {
    const launcher = document.getElementById("chatbotLauncher");
    const container = document.getElementById("chatbotContainer");
    const closeBtn = document.getElementById("chatbotCloseBtn");
    const messagesEl = document.getElementById("chatbotMessages");
    const inputEl = document.getElementById("chatbotInput");
    const sendBtn = document.getElementById("chatbotSendBtn");
    const quickRepliesEl = document.getElementById("chatbotQuickReplies");

    if (!launcher || !container) return;

    let leadCaptureState = null; // null | 'awaiting_name' | 'awaiting_contact' | 'awaiting_notes'
    const leadData = {};

    function toggleChat(open) {
      const willOpen = open !== undefined ? open : !container.classList.contains("is-active");
      container.classList.toggle("is-active", willOpen);
      launcher.setAttribute("aria-expanded", willOpen ? "true" : "false");
      if (willOpen) {
        if (!container.dataset.initialized) {
          container.dataset.initialized = "true";
          appendBotMessage(
            "നമസ്കാരം! I'm the Wing Assistant from Explore Wings Digital in Trivandrum. How can we help your business today?",
            ["Our Services", "Pricing & Quote", "How we work", "Get Free Consultation"]
          );
        }
        setTimeout(() => inputEl && inputEl.focus(), 200);
      }
    }

    launcher.addEventListener("click", () => toggleChat());
    if (closeBtn) closeBtn.addEventListener("click", () => toggleChat(false));

    function appendUserMessage(text) {
      const div = document.createElement("div");
      div.className = "chat-msg user-msg";
      div.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div>`;
      messagesEl.appendChild(div);
      scrollToBottom();
    }

    function appendBotMessage(text, chips) {
      const div = document.createElement("div");
      div.className = "chat-msg bot-msg";
      
      const formattedText = text.replace(/\n/g, "<br>");
      div.innerHTML = `
        <div class="msg-avatar">
          <img src="logo.png" alt="Explore Wings" width="24" height="24" />
        </div>
        <div class="msg-bubble">${formattedText}</div>
      `;
      messagesEl.appendChild(div);
      scrollToBottom();

      renderQuickReplies(chips || []);
    }

    function renderQuickReplies(chips) {
      quickRepliesEl.innerHTML = "";
      if (!chips || !chips.length) return;

      chips.forEach(chipText => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chat-chip";
        btn.textContent = chipText;
        btn.addEventListener("click", () => handleUserSelection(chipText));
        quickRepliesEl.appendChild(btn);
      });
      scrollToBottom();
    }

    function scrollToBottom() {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function escapeHtml(str) {
      const p = document.createElement("p");
      p.textContent = str;
      return p.innerHTML;
    }

    function handleUserSelection(query) {
      appendUserMessage(query);
      processQuery(query.toLowerCase().trim());
    }

    function handleUserInput() {
      const text = inputEl.value.trim();
      if (!text) return;
      inputEl.value = "";
      appendUserMessage(text);
      processQuery(text.toLowerCase());
    }

    if (sendBtn) sendBtn.addEventListener("click", handleUserInput);
    if (inputEl) {
      inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleUserInput();
        }
      });
    }

    function processQuery(q) {
      // If capturing lead information
      if (leadCaptureState === "awaiting_name") {
        leadData.name = q;
        leadCaptureState = "awaiting_contact";
        setTimeout(() => {
          appendBotMessage(
            `Thank you, ${leadData.name}. What is your phone number or email address so we can reach you?`,
            []
          );
        }, 350);
        return;
      }

      if (leadCaptureState === "awaiting_contact") {
        leadData.contact = q;
        leadCaptureState = "awaiting_notes";
        setTimeout(() => {
          appendBotMessage(
            "What kind of project do you have in mind? (e.g. new website, social media, logo redesign, Google ranking)",
            ["New Website", "Brand / Logo", "Social Media", "General Enquiry"]
          );
        }, 350);
        return;
      }

      if (leadCaptureState === "awaiting_notes") {
        leadData.notes = q;
        leadCaptureState = null;
        
        // Post lead to endpoint
        if (typeof CONFIG !== "undefined" && CONFIG.formEndpoint) {
          fetch(CONFIG.formEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({
              source: "Chatbot Lead Capture",
              name: leadData.name,
              contact: leadData.contact,
              notes: leadData.notes,
              timestamp: new Date().toISOString()
            })
          }).catch(() => {});
        }

        setTimeout(() => {
          appendBotMessage(
            `Thanks, ${leadData.name}! We've logged your request. Someone from our Trivandrum office will contact you via ${leadData.contact} within 24 hours.`,
            ["Our Services", "How we work", "Contact Details"]
          );
        }, 400);
        return;
      }

      // Query router
      if (q.includes("consult") || q.includes("free consultation") || q.includes("hire") || q.includes("start project")) {
        leadCaptureState = "awaiting_name";
        setTimeout(() => {
          appendBotMessage(
            "We'd love to help! Let's get your free consultation started. What is your name?",
            []
          );
        }, 300);
        return;
      }

      if (q.includes("service") || q === "back to services") {
        const item = KNOWLEDGE_BASE.services;
        setTimeout(() => appendBotMessage(item.text, item.chips), 300);
        return;
      }

      if (q.includes("web") || q.includes("site") || q.includes("app")) {
        const item = KNOWLEDGE_BASE.websites;
        setTimeout(() => appendBotMessage(item.text, item.chips), 300);
        return;
      }

      if (q.includes("brand") || q.includes("logo") || q.includes("signboard")) {
        const item = KNOWLEDGE_BASE.branding;
        setTimeout(() => appendBotMessage(item.text, item.chips), 300);
        return;
      }

      if (q.includes("social") || q.includes("instagram") || q.includes("facebook") || q.includes("reel")) {
        const item = KNOWLEDGE_BASE.social;
        setTimeout(() => appendBotMessage(item.text, item.chips), 300);
        return;
      }

      if (q.includes("photo") || q.includes("video") || q.includes("shoot") || q.includes("camera")) {
        const item = KNOWLEDGE_BASE.photo;
        setTimeout(() => appendBotMessage(item.text, item.chips), 300);
        return;
      }

      if (q.includes("marketing") || q.includes("ad") || q.includes("meta") || q.includes("google ad")) {
        const item = KNOWLEDGE_BASE.marketing;
        setTimeout(() => appendBotMessage(item.text, item.chips), 300);
        return;
      }

      if (q.includes("seo") || q.includes("google map") || q.includes("local") || q.includes("rank")) {
        const item = KNOWLEDGE_BASE.localseo;
        setTimeout(() => appendBotMessage(item.text, item.chips), 300);
        return;
      }

      if (q.includes("work") || q.includes("process") || q.includes("step") || q.includes("listen")) {
        const item = KNOWLEDGE_BASE.process;
        setTimeout(() => appendBotMessage(item.text, item.chips), 300);
        return;
      }

      if (q.includes("price") || q.includes("quote") || q.includes("cost") || q.includes("package")) {
        const item = KNOWLEDGE_BASE.pricing;
        setTimeout(() => appendBotMessage(item.text, item.chips), 300);
        return;
      }

      if (q.includes("contact") || q.includes("address") || q.includes("phone") || q.includes("where") || q.includes("location") || q.includes("trivandrum")) {
        const item = KNOWLEDGE_BASE.contact;
        setTimeout(() => appendBotMessage(item.text, item.chips), 300);
        return;
      }

      // Default fallback
      setTimeout(() => {
        appendBotMessage(
          "I'm here to help with your digital project in Trivandrum. You can explore our services, review our process, or request a free consultation.",
          ["Our Services", "Pricing & Quote", "How we work", "Get Free Consultation"]
        );
      }, 300);
    }
  }
})();
