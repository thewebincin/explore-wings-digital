/**
 * Explore Wings Digital Technologies - Wing Assistant Chatbot
 * Asynchronously talks to /api/chatbot. Clean UI, quick replies, lead capture.
 */

(function () {
  const DEFAULT_QUICK_REPLIES = [
    "Our Services",
    "Website Pricing",
    "How We Work",
    "Studio Location",
    "Request Consultation"
  ];

  document.addEventListener("DOMContentLoaded", () => {
    initChatbot();
  });

  function initChatbot() {
    const launcher = document.getElementById("chatbotLauncher");
    const container = document.getElementById("chatbotContainer");
    const closeBtn = document.getElementById("chatbotCloseBtn");
    const messagesEl = document.getElementById("chatbotMessages");
    const inputEl = document.getElementById("chatbotInput");
    const sendBtn = document.getElementById("chatbotSendBtn");
    const quickRepliesEl = document.getElementById("chatbotQuickReplies");

    if (!launcher || !container) return;

    let isOpen = false;
    let hasGreeted = false;

    function toggleChat(open) {
      isOpen = (open !== undefined) ? open : !isOpen;
      container.classList.toggle("is-open", isOpen);
      launcher.setAttribute("aria-expanded", isOpen ? "true" : "false");

      if (isOpen) {
        if (!hasGreeted) {
          hasGreeted = true;
          addBotMessage(
            "Hello! I am the Explore Wings Assistant in Trivandrum. How can I help your business today?",
            DEFAULT_QUICK_REPLIES
          );
        }
        if (inputEl) setTimeout(() => inputEl.focus(), 200);
      }
    }

    launcher.addEventListener("click", () => toggleChat(true));
    if (closeBtn) closeBtn.addEventListener("click", () => toggleChat(false));

    function renderQuickReplies(chips) {
      if (!quickRepliesEl) return;
      quickRepliesEl.innerHTML = "";
      if (!chips || !chips.length) {
        quickRepliesEl.style.display = "none";
        return;
      }
      quickRepliesEl.style.display = "flex";
      chips.forEach(chipText => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chat-chip-btn";
        btn.textContent = chipText;
        btn.addEventListener("click", () => {
          handleUserSend(chipText);
        });
        quickRepliesEl.appendChild(btn);
      });
    }

    function addUserMessage(text) {
      const msg = document.createElement("div");
      msg.className = "chat-bubble user-bubble";
      msg.textContent = text;
      messagesEl.appendChild(msg);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function addBotMessage(text, chips) {
      const msg = document.createElement("div");
      msg.className = "chat-bubble bot-bubble";
      msg.innerHTML = text.replace(/\n/g, "<br>");
      messagesEl.appendChild(msg);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      renderQuickReplies(chips || DEFAULT_QUICK_REPLIES);
    }

    async function handleUserSend(rawText) {
      const text = (rawText || (inputEl ? inputEl.value : "")).trim();
      if (!text) return;

      if (inputEl) inputEl.value = "";
      addUserMessage(text);

      // Typing indicator
      const typingEl = document.createElement("div");
      typingEl.className = "chat-bubble bot-bubble is-typing";
      typingEl.textContent = "Typing...";
      messagesEl.appendChild(typingEl);
      messagesEl.scrollTop = messagesEl.scrollHeight;

      try {
        const res = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text })
        });
        const data = await res.json();
        typingEl.remove();

        if (data.reply) {
          addBotMessage(data.reply, data.quick_replies);
        } else {
          addBotMessage(
            "Thank you for your message. Would you like to leave your phone number or email so our team in Trivandrum can contact you directly?",
            ["Request Consultation", "Our Services"]
          );
        }
      } catch (err) {
        typingEl.remove();
        addBotMessage(
          "We build custom websites, brand identity, and commercial photography for businesses in Kerala. Feel free to call us or leave your contact details here.",
          DEFAULT_QUICK_REPLIES
        );
      }
    }

    if (sendBtn) {
      sendBtn.addEventListener("click", () => handleUserSend());
    }

    if (inputEl) {
      inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleUserSend();
        }
      });
    }
  }
})();
