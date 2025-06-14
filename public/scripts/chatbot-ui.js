class ChatBot extends HTMLElement {

  // Static Config
  static defaultStrings = {
    chatLabel: "AI Support Chat",
    agentName: "Penny",
    chatOpenLabel: "Open chat",
    chatCloseLabel: "Close chat",
    chatBoxLabel: "Ask Penny",
    yourMessageLabel: "Your message",
    agentMessageLabel: "Message from Penny",
    messageInputLabel: "Your message",
    messagePlaceholder: "Send a message...",
    messageSendLabel: "Send your message",
    initialAgentMessage: "Hi! I can help you find products, check your past orders, or see recent announcements. What would you like to do?"
  };

  static strings = { ...ChatBot.defaultStrings };

  // Constructor / Lifecycle
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._handleKeydown = this._handleKeydown.bind(this);
    this._debounceTimeout = null;
    this._userImage = null;
    this.refs = {};
  }

  connectedCallback() {
    document.addEventListener("keydown", this._handleKeydown);
    this.loadStrings();
    this.renderChat();
    this.cacheRefs();
    this.addEventListeners();

    requestAnimationFrame(() => {
      setTimeout(() => {
        this.refs.chatBox.classList.remove("no-animation");
        this.refs.overlay.classList.remove("no-animation");
      }, 50);
    });
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this._handleKeydown);
  }

  // DOM Setup
  loadStrings() {
    const lang = this.getAttribute("lang") || document.documentElement.lang || "en";
    const inlineConfig = this.querySelector(`script[type="application/json"][data-lang="${lang}"]`) ||
                         this.querySelector('script[type="application/json"]:not([data-lang])');
    if (inlineConfig) {
      try {
        const customStrings = JSON.parse(inlineConfig.textContent);
        ChatBot.strings = { ...ChatBot.defaultStrings, ...customStrings };
      } catch (e) {
        console.warn("Invalid chatbot inline JSON config", e);
      }
    }
  }

  renderChat() {
    const s = ChatBot.strings;
    this.shadowRoot.innerHTML = `
      <style>@import url('/styles/chatbot.css');</style>
      <svg style="display:none;">
        <symbol id="icon-chat" viewBox="0 0 512 512">
          <path d="M332.8 25.6H51.2C22.921 25.6 0 48.52 0 76.8v153.6c0 28.279 22.921 51.2 51.2 51.2h25.6v76.8l89.6-76.8h166.4c28.279 0 51.2-22.921 51.2-51.2V76.8c0-28.28-22.921-51.2-51.2-51.2z"/>
          <path d="M460.8 153.6h-51.2v25.6h51.2c14.114 0 25.6 11.486 25.6 25.6v153.6c0 14.114-11.486 25.6-25.6 25.6h-51.2v46.737l-47.343-40.576-7.185-6.161H179.2c-14.114 0-25.6-11.486-25.6-25.6v-32.111L128 348.228V358.4c0 28.279 22.921 51.2 51.2 51.2h166.4l89.6 76.8v-76.8h25.6c28.279 0 51.2-22.921 51.2-51.2V204.8c0-28.279-22.921-51.2-51.2-51.2z"/>
        </symbol>
        <symbol id="icon-send" viewBox="0 0 495.003 495.003">
          <path d="M164.711 456.687a8.007 8.007 0 0 0 4.266 7.072 7.992 7.992 0 0 0 8.245-.468l55.09-37.616-67.6-32.22v63.232zM492.431 32.443a8.024 8.024 0 0 0-5.44-2.125 7.89 7.89 0 0 0-3.5.816L7.905 264.422a14.154 14.154 0 0 0 .153 25.472L133.4 349.618l250.62-205.99-219.565 220.786 156.145 74.4a14.115 14.115 0 0 0 6.084 1.376c1.768 0 3.519-.322 5.186-.977a14.188 14.188 0 0 0 7.97-7.956l154.596-390a7.968 7.968 0 0 0-2.005-8.814z"/>
        </symbol>
      </svg>
      <div id="chat" role="complementary" aria-label="${s.chatLabel}">
        <button id="chat-circle" aria-expanded="false">
          <span class="visually-hidden">${s.chatOpenLabel}</span>
          <svg class="icon" viewBox="0 0 512 512" aria-hidden="true">
            <use href="#icon-chat"></use>
          </svg>
        </button>
        <div id="chat-background-overlay" class="no-animation"></div>
        <div id="chat-box" class="card no-animation" role="region" aria-labelledby="chat-box-label" inert aria-hidden="true">
          <header class="card__head">
            <span id="chat-box-label">${s.chatBoxLabel}</span>
            <button id="chat-box-close" aria-label="${s.chatCloseLabel}">&times;</button>
          </header>
          <div class="card__body">
            <main id="chat-messages"></main>
            <div id="typing-indicator" class="hidden">${s.agentName} is typing...</div>
          </div>
          <div class="card__foot" id="chat-input">
            <label for="chat-input-control" class="visually-hidden">${s.messageInputLabel}</label>
            <textarea id="chat-input-control" placeholder="${s.messagePlaceholder}"></textarea>
            <button id="chat-submit">
              <span class="visually-hidden">${s.messageSendLabel}</span>
              <svg class="icon" viewBox="0 0 512 512" aria-hidden="true">
                <use href="#icon-send"></use>
              </svg>
            </button>
          </div>
        </div>
        <div id="chat-live-region" class="visually-hidden" aria-live="polite" aria-atomic="true"></div>
      </div>
    `;
  }

  cacheRefs() {
    const $ = (id) => this.shadowRoot.getElementById(id);
    this.refs = {
      chat: $("chat"),
      chatCircle: $("chat-circle"),
      chatBox: $("chat-box"),
      chatClose: $("chat-box-close"),
      overlay: $("chat-background-overlay"),
      messages: $("chat-messages"),
      submit: $("chat-submit"),
      textarea: this.shadowRoot.querySelector("#chat-input textarea"),
      typing: $("typing-indicator"),
      liveRegion: $("chat-live-region")
    };
  }

  addEventListeners() {
    const toggle = () => this.toggle();
    [this.refs.chatCircle, this.refs.chatClose, this.refs.overlay].forEach(el => {
      el.addEventListener("click", toggle);
    });

    this.refs.textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        clearTimeout(this._debounceTimeout);
        this._debounceTimeout = setTimeout(() => this.sendUserMessage(), 200);
      }
    });
  }

  // Messaging Logic
  async sendUserMessage() {
    const message = this.refs.textarea.value.trim();
    if (!message) return;

    this.refs.textarea.value = "";
    await this.appendMessage("user", message);

    this.refs.typing.classList.remove("hidden");

    const res = await fetch("/send-chat-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message })
    });
    const { response, displayOptions, optionSchema, timestamp } = await res.json();

    this.refs.typing.classList.add("hidden");

    if (response) {
      await this.appendMessage("agent", response, displayOptions, optionSchema, timestamp);
    }
  }

  async appendMessage(source, content, displayOptions = [], optionSchema = {}, timestamp = null) {
    const msgEl = await this.renderMessage({ source, content, timestamp });
    this.refs.messages.appendChild(msgEl);

    if (this.isAgent(source)) {
      this.refs.liveRegion.textContent = content;
    }

    if (displayOptions.length) {
      const displayBlock = this.renderDisplayOptions(displayOptions, optionSchema);
      this.refs.messages.appendChild(displayBlock);
    }

    this.refs.messages.scrollTo(0, this.refs.messages.scrollHeight);
  }

  // Visibility Controls
  open() {
    const { chat, chatBox, textarea, chatCircle } = this.refs;
    const alreadyOpened = chat.dataset.hasOpened === "true";

    chat.classList.add("open");
    chatBox.removeAttribute("inert");
    chatBox.removeAttribute("aria-hidden");
    chatCircle.setAttribute("aria-expanded", "true");

    setTimeout(() => textarea.focus(), 150);

    if (!alreadyOpened) {
      setTimeout(async () => {
        await this.appendMessage("agent", ChatBot.strings.initialAgentMessage);
      }, 500);
      chat.dataset.hasOpened = "true";
    }

    this.dispatchEvent(new Event("chat-opened"));
  }

  close() {
    const { chat, chatBox, chatCircle } = this.refs;

    chat.classList.remove("open");
    chatBox.setAttribute("inert", "");
    chatBox.setAttribute("aria-hidden", "true");
    chatCircle.setAttribute("aria-expanded", "false");
    chatCircle.focus();

    this.dispatchEvent(new Event("chat-closed"));
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  get isOpen() {
    return this.refs.chat?.classList.contains("open");
  }

  _handleKeydown(e) {
    if (e.key === "Escape" && this.isOpen) {
      this.close();
    }
  }

  // Rendering Helpers
  async renderMessage({ source, content, timestamp }) {
    const msgEl = document.createElement("article");
    msgEl.className = `message message--${source}`;
    msgEl.dataset.source = source;
    msgEl.setAttribute("role", "article");
    msgEl.setAttribute("aria-label", this.isAgent(source) ? ChatBot.strings.agentMessageLabel : ChatBot.strings.yourMessageLabel);
    
    const avatarURL = this.isAgent(source)
      ? "/agent.webp"
      : await this.getUserImage();

    const avatarAlt = this.isAgent(source) ? ChatBot.strings.agentName : "You";

    msgEl.innerHTML = `
      <img src="${avatarURL}" alt="${avatarAlt}">
      ${this.renderMessageContent(content, timestamp)}
    `;

    return msgEl;
  }

  renderMessageContent(content, timestamp = null) {
    return `
      <div class="message__content">
        ${content}
        ${timestamp ? `<time class="message__timestamp" datetime="${timestamp}">${new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>` : ""}
      </div>
    `;
  }

  renderDisplayOptions(options, schema = {}) {
    const container = document.createElement("section");
    container.className = "display-options";

    for (const option of options) {
      const article = document.createElement("article");
      article.className = "display-option";
      article.setAttribute("role", "group");

      const dl = document.createElement("dl");
      for (const [key, val] of Object.entries(option)) {
        const { type = "text", label = key } = schema[key] || {};
        const wrapper = document.createElement("div");
        wrapper.className = `display-option__item display-option__item--is-type-${type}`;

        const dt = document.createElement("dt");
        dt.textContent = label;

        const dd = document.createElement("dd");
        dd.textContent = this.formatValue(type, val);

        wrapper.appendChild(dt);
        wrapper.appendChild(dd);
        dl.appendChild(wrapper);
      }

      article.appendChild(dl);
      container.appendChild(article);
    }

    return container;
  }

  formatValue(type, val) {
    switch (type) {
      case "currency": return `$${val}`;
      case "rating": return `${val} stars`;
      case "date": return new Date(val).toLocaleDateString();
      default: return val;
    }
  }

  // Utilities 
  isAgent(source) {
    return source === "agent";
  }

  async getUserImage() {
    if (this._userImage) return this._userImage;
    try {
      const res = await fetch("/get-user-image", { method: "POST" });
      const { imageURL } = await res.json();
      this._userImage = imageURL || "/user.webp";
      return this._userImage;
    } catch {
      return "/user.webp";
    }
  }
}

customElements.define("chat-bot", ChatBot);