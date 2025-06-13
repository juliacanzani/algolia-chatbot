// /scripts/chatbot-ui.js

class ChatBot extends HTMLElement {
  static defaultStrings = {
    chatLabel: "AI Support Chat",
    agentName: "Penny",
    chatOpenLabel: "Open chat",
    chatCloseLabel: "Close chat",
    chatBoxLabel: "Ask Penny",
    yourMessageLabel: "Your message",
    agentMessageLabel: "Message from Penny",
    messagePlaceholder: "Send a message..."
  };

  static strings = { ...ChatBot.defaultStrings };

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._handleKeydown = this._handleKeydown.bind(this);
  }

  connectedCallback() {
    document.addEventListener("keydown", this._handleKeydown);

    const lang = this.getAttribute("lang") || document.documentElement.lang || "en";

    const inlineConfig = this.querySelector(`script[type="application/json"][data-lang="${lang}"]`) || this.querySelector('script[type="application/json"]:not([data-lang])');
    if (inlineConfig) {
      try {
        const customStrings = JSON.parse(inlineConfig.textContent);
        ChatBot.strings = { ...ChatBot.defaultStrings, ...customStrings };
      } catch (e) {
        console.warn("Invalid chatbot inline JSON config", e);
      }
    }

    const s = ChatBot.strings;
    this.shadowRoot.innerHTML = `
      <style>
        @import url('/styles/chatbot.css');
      </style>
      <div id="chat" role="complementary" aria-label="${s.chatLabel}">
        <button id="chat-circle" aria-expanded="false">
            <span class="visually-hidden">${s.chatOpenLabel}</span>
            <svg viewBox="0 0 512 512">
                <path d="M332.8 25.6H51.2C22.921 25.6 0 48.52 0 76.8v153.6c0 28.279 22.921 51.2 51.2 51.2h25.6v76.8l89.6-76.8h166.4c28.279 0 51.2-22.921 51.2-51.2V76.8c0-28.28-22.921-51.2-51.2-51.2z"/>
                <path d="M460.8 153.6h-51.2v25.6h51.2c14.114 0 25.6 11.486 25.6 25.6v153.6c0 14.114-11.486 25.6-25.6 25.6h-51.2v46.737l-47.343-40.576-7.185-6.161H179.2c-14.114 0-25.6-11.486-25.6-25.6v-32.111L128 348.228V358.4c0 28.279 22.921 51.2 51.2 51.2h166.4l89.6 76.8v-76.8h25.6c28.279 0 51.2-22.921 51.2-51.2V204.8c0-28.279-22.921-51.2-51.2-51.2z"/>
            </svg>
        </button>

        <div id="chat-background-overlay"></div>

        <div id="chat-box" class="card" role="region" aria-labelledby="chat-box-label" inert aria-hidden="true">
          <header class="card__head">
            <span id="chat-box-label">${s.chatBoxLabel}</span>
            <button id="chat-box-close" aria-label="${s.chatCloseLabel}">&times;</button>
          </header>
          <div class="card__body">
            <main id="chat-messages"></main> 
            <div id="typing-indicator" class="hidden">${s.agentName} is typing...</div>
          </div>
          <div class="card__foot" id="chat-input">
            <textarea placeholder="${s.messagePlaceholder}"></textarea>
            <button id="chat-submit">
                <svg viewBox="0 0 495.003 495.003">
                    <path d="M164.711 456.687a8.007 8.007 0 0 0 4.266 7.072 7.992 7.992 0 0 0 8.245-.468l55.09-37.616-67.6-32.22v63.232zM492.431 32.443a8.024 8.024 0 0 0-5.44-2.125 7.89 7.89 0 0 0-3.5.816L7.905 264.422a14.154 14.154 0 0 0 .153 25.472L133.4 349.618l250.62-205.99-219.565 220.786 156.145 74.4a14.115 14.115 0 0 0 6.084 1.376c1.768 0 3.519-.322 5.186-.977a14.188 14.188 0 0 0 7.97-7.956l154.596-390a7.968 7.968 0 0 0-2.005-8.814z"/>
                </svg>
            </button>
          </div>
        </div>

        <div id="chat-live-region" class="visually-hidden" aria-live="polite" aria-atomic="true"></div>
      </div>
    `;

    const getUserImage = async () => {
      try {
        const res = await fetch("/get-user-image", {
          method: "POST"
        });
        const { imageURL } = await res.json();
        return imageURL || "/user.webp";
      } catch {
        return "/user.webp";
      }
    };

    const shadow = this.shadowRoot;
    const chatContainer = shadow.getElementById("chat");
    const chatCircle = shadow.getElementById("chat-circle");
    const chatBox = shadow.getElementById("chat-box");
    const chatClose = shadow.getElementById("chat-box-close");
    const chatOverlay = shadow.getElementById("chat-background-overlay");
    const conversationWindow = shadow.querySelector("#chat-messages");
    const chatSubmit = shadow.getElementById("chat-submit");
    const messageInput = shadow.querySelector("#chat-input > textarea");
    const typingIndicator = shadow.getElementById("typing-indicator");
    const liveRegion = shadow.getElementById("chat-live-region");

    [chatCircle, chatClose, chatOverlay].forEach(el => {
      el.addEventListener("click", () => this.toggle());
    });
    

    const displayMessage = async (source, content, displayOptions = [], optionSchema = {}) => {
      const s = ChatBot.strings;
      const msgEl = document.createElement("article");
      msgEl.className = "message";
      msgEl.dataset.source = source;
      msgEl.setAttribute("role", "article");
      msgEl.setAttribute("aria-label", source === "operator" ? s.agentMessageLabel : s.yourMessageLabel);
      const avatarURL = source === "operator"
        ? "/operator.webp"
        : await getUserImage();
      msgEl.innerHTML = `
        <img src="${avatarURL}" alt="${source === 'operator' ? s.agentName : 'You'}">
        <div class="message__content">${content}</div>
      `;
      conversationWindow.appendChild(msgEl);

      if (source === "operator") {
        liveRegion.textContent = content;
      }

      if (displayOptions.length) {
        const displayBlock = document.createElement("section");
        displayBlock.className = "display-options";

        for (const option of displayOptions) {
          const article = document.createElement("article");
          article.className = "display-option";
          article.setAttribute("role", "group");

          const dl = document.createElement("dl");

console.log("🔍 Option:", option);
console.log("📦 Schema:", optionSchema);

          for (const [key, val] of Object.entries(option)) {
            const schema = optionSchema?.[key] ?? { type: "text", label: key };
            const itemWrapper = document.createElement("div");
            itemWrapper.className = `display-option__item display-option__item--is-type-${schema.type}`;
            const dt = document.createElement("dt");
            dt.textContent = schema.label;

            const dd = document.createElement("dd");
            switch (schema.type) {
              case "currency":
                dd.textContent = `$${val}`;
                break;
              case "rating":
                dd.textContent = `${val} stars`;
                break;
              case "date":
                dd.textContent = new Date(val).toLocaleDateString();
                break;
              default:
                dd.textContent = val;
            }
            
            itemWrapper.appendChild(dt);
            itemWrapper.appendChild(dd);
            dl.appendChild(itemWrapper);
          }

          article.appendChild(dl);
          displayBlock.appendChild(article);
        }

        conversationWindow.appendChild(displayBlock);
      }

      conversationWindow.scrollTo(0, conversationWindow.scrollHeight);
    };

    const sendUserMessage = async () => {
      const message = messageInput.value.trim();
      if (!message) return;
      messageInput.value = "";
      await displayMessage("user", message);

      typingIndicator.classList.remove("hidden"); // show indicator

      const { response, displayOptions, optionSchema } = await (
        await fetch("/send-chat-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: message })
        })
      ).json();

      typingIndicator.classList.add("hidden"); // hide after response

      if (response) {
        await displayMessage("operator", response, displayOptions, optionSchema);
      }
    };


    let debounceTimeout;
    
    messageInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(sendUserMessage, 200);
      }
    });


  }

  open() {
    const chat = this.shadowRoot.getElementById("chat");
    const chatBox = this.shadowRoot.getElementById("chat-box");
    const input = this.shadowRoot.querySelector("#chat-input textarea");
    const chatCircle = this.shadowRoot.getElementById("chat-circle");

    chat.classList.add("open");
    chatBox.removeAttribute("inert");
    chatBox.removeAttribute("aria-hidden");
    chatCircle.setAttribute("aria-expanded", "true");

    setTimeout(() => input.focus(), 150);

    this.dispatchEvent(new Event("chat-opened"));
  }

  close() {
    const chat = this.shadowRoot.getElementById("chat");
    const chatBox = this.shadowRoot.getElementById("chat-box");
    const toggle = this.shadowRoot.getElementById("chat-circle");

    chat.classList.remove("open");
    chatBox.setAttribute("inert", "");
    chatBox.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus();

    this.dispatchEvent(new Event("chat-closed"));
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  get isOpen() {
    return this.shadowRoot.getElementById("chat")?.classList.contains("open");
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this._handleKeydown);
  }

  _handleKeydown(e) {
    if (e.key === "Escape" && this.isOpen) {
      this.close();
    }
  }
}

customElements.define("chat-bot", ChatBot);
