/**
 * Chat Component – messages, input, and AI response handling
 */

import { getAIReply } from '../utils/aiReplies.js';

export function renderChat(container, { user, initialMode = 'chat' }) {
  let currentMode = initialMode;
  let isTyping = false;

  container.innerHTML = `
    <div class="chat-area">
      <!-- Mode pills toolbar -->
      <div class="chat-toolbar">
        ${['chat','write','code','data','research'].map(m => `
          <button class="mode-pill${m === initialMode ? ' active' : ''}" data-pill="${m}">
            ${{ chat:'💬 Chat', write:'✍️ Write', code:'💻 Code', data:'📊 Analyze', research:'🔍 Research' }[m]}
          </button>
        `).join('')}
      </div>

      <!-- Welcome screen -->
      <div class="welcome-area" id="welcomeArea">
        <div class="welcome-orb">✦</div>
        <h1 class="welcome-title">Hey ${user.name.split(' ')[0]}, ready to create?</h1>
        <p class="welcome-sub">Your intelligent assistant for writing, coding, data analysis, and research — all in one place.</p>
        <div class="feature-badges">
          <div class="feature-badge badge-blue">✍️ Content</div>
          <div class="feature-badge badge-green">📊 Analysis</div>
          <div class="feature-badge badge-amber">💻 Coding</div>
          <div class="feature-badge badge-pink">🔍 Research</div>
        </div>
        <div class="suggestion-grid">
  <div class="suggestion-card" data-prompt="Debug this JavaScript async issue: const arr = [1,2,3]; arr.forEach(async (i) => { await fetch(i); })">
    <span class="suggestion-icon">🐛</span>
    <div>
      <div class="suggestion-label">Coding</div>
      <div class="suggestion-text">Debug a JavaScript async issue</div>
    </div>
  </div>
  <div class="suggestion-card" data-prompt="Write a professional cold email introducing Leamus AI to a potential client">
    <span class="suggestion-icon">✉️</span>
    <div>
      <div class="suggestion-label">Writing</div>
      <div class="suggestion-text">Write a cold outreach email</div>
    </div>
  </div>
  <div class="suggestion-card" data-prompt="Research and summarize the top AI trends and breakthroughs in 2025">
    <span class="suggestion-icon">🔍</span>
    <div>
      <div class="suggestion-label">Research</div>
      <div class="suggestion-text">Research AI trends in 2025</div>
    </div>
  </div>
  <div class="suggestion-card" data-prompt="Analyze this sales data and give key insights: Q1: $42k, Q2: $58k, Q3: $51k, Q4: $74k">
    <span class="suggestion-icon">📈</span>
    <div>
      <div class="suggestion-label">Analysis</div>
      <div class="suggestion-text">Analyze quarterly sales data</div>
    </div>
  </div>
</div>
      </div>

      <!-- Messages -->
      <div class="chat-messages" id="chatMessages"></div>

      <!-- Input area -->
      <div class="chat-input-area">
        <div class="quick-actions" id="quickActions">
          <button class="quick-btn" data-insert="Write a professional email about: ">📧 Email</button>
          <button class="quick-btn" data-insert="Write a blog post about: ">📝 Blog</button>
          <button class="quick-btn" data-insert="Write Python code to: ">🐍 Python</button>
          <button class="quick-btn" data-insert="Write JavaScript code to: ">⚡ JS</button>
          <button class="quick-btn" data-insert="Summarize the following: ">📋 Summarize</button>
          <button class="quick-btn" data-insert="Research and explain: ">🔍 Research</button>
          <button class="quick-btn" data-insert="Create a marketing campaign for: ">🎯 Marketing</button>
        </div>

        <div id="filePreviewArea"></div>

        <div class="input-row">
          <div class="chat-input-wrap">
            <button class="input-icon-btn" id="attachBtn" title="Attach file" aria-label="Attach file">📎</button>
            <input type="file" id="fileInput" style="display:none" accept=".txt,.csv,.json,.pdf,.js,.py,.md" />
            <textarea
              class="chat-textarea"
              id="chatTextarea"
              placeholder="Ask Leamus AI anything…"
              rows="1"
              aria-label="Message input"
            ></textarea>
            <button class="input-icon-btn" id="voiceBtn" title="Voice input" aria-label="Voice input">🎤</button>
          </div>
          <button class="send-btn" id="sendBtn" aria-label="Send message">➤</button>
        </div>
      </div>
    </div>
  `;

  // ── Bind events ──
  const textarea    = container.querySelector('#chatTextarea');
  const sendBtn     = container.querySelector('#sendBtn');
  const attachBtn   = container.querySelector('#attachBtn');
  const fileInput   = container.querySelector('#fileInput');
  const messages    = container.querySelector('#chatMessages');
  const welcomeArea = container.querySelector('#welcomeArea');

  let attachedFile = null;

  // Mode pills
  container.querySelectorAll('[data-pill]').forEach(pill => {
    pill.addEventListener('click', () => setMode(pill.dataset.pill));
  });

  // Quick action buttons
  container.querySelectorAll('[data-insert]').forEach(btn => {
    btn.addEventListener('click', () => {
      textarea.value = btn.dataset.insert;
      textarea.focus();
      autoResize(textarea);
    });
  });

  // Suggestion cards
  container.querySelectorAll('[data-prompt]').forEach(card => {
    card.addEventListener('click', () => {
      textarea.value = card.dataset.prompt;
      sendMessage();
    });
  });

  // Send
  sendBtn.addEventListener('click', sendMessage);
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  textarea.addEventListener('input', () => autoResize(textarea));

  // File attach
  attachBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    attachedFile = file;
    showFilePreview(file);
  });

  // Voice input (Web Speech API)
  container.querySelector('#voiceBtn').addEventListener('click', startVoiceInput);

  // ── Helpers ──
  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 130) + 'px';
  }

  function now() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

function showWelcome() {
    welcomeArea.style.display = 'flex';
    messages.classList.remove('visible');
    messages.innerHTML = '';
    attachedFile = null;
    container.querySelector('#filePreviewArea').innerHTML = '';
    // Show greeting message after short delay
    setTimeout(() => {
      hideWelcome();
      addMessage('ai', 'Hi! How can I help you today?');
    }, 300);
  }

  function hideWelcome() {
    welcomeArea.style.display = 'none';
    messages.classList.add('visible');
  }

  function showFilePreview(file) {
    const area = container.querySelector('#filePreviewArea');
    area.innerHTML = `
      <div class="file-preview">
        <span>📎</span>
        <span>${file.name}</span>
        <span style="color:var(--text-muted);font-size:11px;">(${(file.size/1024).toFixed(1)} KB)</span>
        <button class="file-preview-remove" id="removeFile" aria-label="Remove file">✕</button>
      </div>
    `;
    area.querySelector('#removeFile').addEventListener('click', () => {
      attachedFile = null;
      fileInput.value = '';
      area.innerHTML = '';
    });
  }

  function addMessage(role, content, time) {
    hideWelcome();
    const div = document.createElement('div');
    div.className = `msg ${role}`;

    const avatarHtml = `<div class="msg-avatar ${role}">${role === 'ai' ? '✦' : user.initials}</div>`;
    const actionsHtml = role === 'ai' ? `
      <div class="msg-actions">
        <button class="msg-action-btn copy-btn">📋 Copy</button>
        <button class="msg-action-btn regen-btn">🔄 Regenerate</button>
        <button class="msg-action-btn save-btn">💾 Save</button>
      </div>` : '';

    let bubbleInner = '';
    if (content === '__CODE_BLOCK__') {
      bubbleInner = buildCodeBlock();
    } else {
      bubbleInner = formatText(content);
    }

    div.innerHTML = `
      ${avatarHtml}
      <div class="msg-content">
        <div class="msg-bubble">${bubbleInner}</div>
        <div class="msg-time">${time || now()}</div>
        ${actionsHtml}
      </div>
    `;

    // Copy button
    div.querySelector('.copy-btn')?.addEventListener('click', function() {
      const text = div.querySelector('.msg-bubble').innerText;
      navigator.clipboard?.writeText(text).catch(() => {});
      this.textContent = '✓ Copied';
      setTimeout(() => this.textContent = '📋 Copy', 1500);
    });

    // Save button
    div.querySelector('.save-btn')?.addEventListener('click', function() {
      this.textContent = '✓ Saved';
      setTimeout(() => this.textContent = '💾 Save', 1500);
    });

    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function addTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'msg ai';
    div.id = 'typingMsg';
    div.innerHTML = `
      <div class="msg-avatar ai">✦</div>
      <div class="msg-content">
        <div class="msg-bubble">
          <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
      </div>
    `;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeTypingIndicator() {
    document.getElementById('typingMsg')?.remove();
  }

  function formatText(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary);font-weight:500">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="color:var(--accent2)">$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.3);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:12.5px;color:#a5b4fc">$1</code>')
      .replace(/^#{1,3}\s(.+)$/gm, '<strong style="display:block;margin:8px 0 4px;color:var(--text-primary)">$1</strong>')
      .replace(/^[•\-]\s(.+)$/gm, '<div style="padding:2px 0 2px 12px;color:var(--text-secondary)">• $1</div>')
      .replace(/\n/g, '<br>');
  }

  function buildCodeBlock() {
    return `
      <div style="font-size:13px;margin-bottom:8px;color:var(--text-secondary)">Here's the code you requested:</div>
      <div class="code-block">
        <div class="code-header">
          <span class="code-lang">JAVASCRIPT</span>
          <button class="code-copy">Copy</button>
        </div>
        <div class="code-body">async function fetchData(url, options = {}) {
  const { retries = 3, timeout = 5000 } = options;

  for (let attempt = 1; attempt &lt;= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 500 * attempt));
    }
  }
}</div>
      </div>
      <div style="font-size:12.5px;color:var(--text-secondary);margin-top:8px">Includes retry logic, timeout handling, and exponential backoff. Need TypeScript types or a React hook version?</div>
    `;
  }

  async function sendMessage() {
    const text = textarea.value.trim();
    if (!text || isTyping) return;

    textarea.value = '';
    textarea.style.height = 'auto';
    isTyping = true;

    const userText = attachedFile
      ? `${text}\n\n[Attached: ${attachedFile.name}]`
      : text;

    addMessage('user', userText);
    if (window.sidebarController) window.sidebarController.addRecentChat(text);
    attachedFile = null;
    container.querySelector('#filePreviewArea').innerHTML = '';
    fileInput.value = '';

    addTypingIndicator();

    getAIReply(currentMode, text).then(reply => {
  removeTypingIndicator();
  addMessage('ai', reply);
  isTyping = false;

  document.querySelectorAll('.code-copy').forEach(btn => {
    btn.addEventListener('click', function() {
      const code = this.closest('.code-block')?.querySelector('.code-body')?.innerText || '';
      navigator.clipboard?.writeText(code).catch(() => {});
      this.textContent = 'Copied!';
      setTimeout(() => this.textContent = 'Copy', 1500);
    });
  });
}).catch(() => {
  removeTypingIndicator();
  addMessage('ai', 'Sorry, something went wrong. Please try again.');
  isTyping = false;
});
  }

  function setMode(mode) {
    currentMode = mode;
    container.querySelectorAll('[data-pill]').forEach(p =>
      p.classList.toggle('active', p.dataset.pill === mode)
    );
    const placeholders = {
      chat:     'Ask Leamus AI anything…',
      write:    'Describe what you want to write…',
      code:     'Describe code to write or paste code to debug…',
      data:     'Paste or describe your data for analysis…',
      research: 'What topic should I research?'
    };
    textarea.placeholder = placeholders[mode] || 'Ask Leamus AI anything…';
  }

  function startVoiceInput() {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      textarea.value = '(Voice input not supported in this browser)';
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.onresult = (e) => {
      textarea.value = e.results[0][0].transcript;
      autoResize(textarea);
    };
    recognition.start();
  }

  return {
    newChat: showWelcome,
    setMode,
    loadHistory: (prompt) => {
      textarea.value = prompt;
      sendMessage();
    }
  };
}
