import { getAIReply } from '../utils/aiReplies.js';

export function renderChat(container, { user, initialMode = 'chat' }) {
  let currentMode = initialMode;
  let isTyping = false;

  container.innerHTML = `
    <div class="chat-area">
      <div class="chat-toolbar">
        ${['chat','write','code','data','research'].map(m => `
          <button class="mode-pill${m === initialMode ? ' active' : ''}" data-pill="${m}">
            ${{ chat:'💬 Chat', write:'✍️ Write', code:'💻 Code', data:'📊 Analyze', research:'🔍 Research' }[m]}
          </button>
        `).join('')}
      </div>
      <div class="welcome-area" id="welcomeArea">
        <div class="welcome-orb">✦</div>
        <h1 class="welcome-title">Hey ${user.name.split(' ')[0]}, ready to create?</h1>
        <p class="welcome-sub">Your intelligent assistant for writing, coding, data analysis, and research.</p>
        <div class="feature-badges">
          <div class="feature-badge badge-blue">✍️ Content</div>
          <div class="feature-badge badge-green">📊 Analysis</div>
          <div class="feature-badge badge-amber">💻 Coding</div>
          <div class="feature-badge badge-pink">🔍 Research</div>
        </div>
        <div class="suggestion-grid">
          <div class="suggestion-card" data-prompt="Debug this JavaScript async issue: const arr = [1,2,3]; arr.forEach(async (i) => { await fetch(i); })">
            <span class="suggestion-icon">🐛</span>
            <div><div class="suggestion-label">Coding</div><div class="suggestion-text">Debug a JavaScript async issue</div></div>
          </div>
          <div class="suggestion-card" data-prompt="Write a professional cold email introducing Leamus AI to a potential client">
            <span class="suggestion-icon">✉️</span>
            <div><div class="suggestion-label">Writing</div><div class="suggestion-text">Write a cold outreach email</div></div>
          </div>
          <div class="suggestion-card" data-prompt="Research and summarize the top AI trends and breakthroughs in 2025">
            <span class="suggestion-icon">🔍</span>
            <div><div class="suggestion-label">Research</div><div class="suggestion-text">Research AI trends in 2025</div></div>
          </div>
          <div class="suggestion-card" data-prompt="Analyze this sales data and give key insights: Q1: $42k, Q2: $58k, Q3: $51k, Q4: $74k">
            <span class="suggestion-icon">📈</span>
            <div><div class="suggestion-label">Analysis</div><div class="suggestion-text">Analyze quarterly sales data</div></div>
          </div>
        </div>
      </div>
      <div class="chat-messages" id="chatMessages"></div>
      <div class="chat-input-area">
        <div class="quick-actions">
          <button class="quick-btn" data-insert="Write a professional email about: ">📧 Email</button>
          <button class="quick-btn" data-insert="Write a blog post about: ">📝 Blog</button>
          <button class="quick-btn" data-insert="Write Python code to: ">🐍 Python</button>
          <button class="quick-btn" data-insert="Write JavaScript code to: ">⚡ JS</button>
          <button class="quick-btn" data-insert="Summarize the following: ">📋 Summarize</button>
          <button class="quick-btn" data-insert="Research and explain: ">🔍 Research</button>
        </div>
        <div id="filePreviewArea"></div>
        <div class="input-row">
          <div class="chat-input-wrap">
            <button class="input-icon-btn" id="attachBtn" title="Attach file">📎</button>
            <input type="file" id="fileInput" style="display:none" accept=".txt,.csv,.json,.pdf,.js,.py,.md" />
            <textarea class="chat-textarea" id="chatTextarea" placeholder="Ask Leamus AI anything…" rows="1"></textarea>
            <button class="input-icon-btn" id="voiceBtn" title="Voice input">🎤</button>
          </div>
          <button class="send-btn" id="sendBtn">➤</button>
        </div>
      </div>
    </div>
  `;

  const textarea = container.querySelector('#chatTextarea');
  const sendBtn = container.querySelector('#sendBtn');
  const messages = container.querySelector('#chatMessages');
  const welcomeArea = container.querySelector('#welcomeArea');
  const fileInput = container.querySelector('#fileInput');
  let attachedFile = null;

  container.querySelectorAll('[data-pill]').forEach(pill => {
    pill.addEventListener('click', () => setMode(pill.dataset.pill));
  });
  container.querySelectorAll('[data-insert]').forEach(btn => {
    btn.addEventListener('click', () => { textarea.value = btn.dataset.insert; textarea.focus(); autoResize(textarea); });
  });
  container.querySelectorAll('[data-prompt]').forEach(card => {
    card.addEventListener('click', () => { textarea.value = card.dataset.prompt; sendMessage(); });
  });
  sendBtn.addEventListener('click', sendMessage);
  textarea.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
  textarea.addEventListener('input', () => autoResize(textarea));
  container.querySelector('#attachBtn').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) { attachedFile = fileInput.files[0]; showFilePreview(attachedFile); } });
  container.querySelector('#voiceBtn').addEventListener('click', startVoiceInput);

  function autoResize(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 130) + 'px'; }
  function now() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  function hideWelcome() { welcomeArea.style.display = 'none'; messages.classList.add('visible'); }

  function showWelcome() {
    welcomeArea.style.display = 'flex';
    messages.classList.remove('visible');
    messages.innerHTML = '';
    attachedFile = null;
    container.querySelector('#filePreviewArea').innerHTML = '';
    setTimeout(() => { hideWelcome(); addMessage('ai', 'Hi! How can I help you today?'); }, 300);
  }

  function showFilePreview(file) {
    const area = container.querySelector('#filePreviewArea');
    area.innerHTML = `<div class="file-preview"><span>📎</span><span>${file.name}</span><button class="file-preview-remove" id="removeFile">✕</button></div>`;
    area.querySelector('#removeFile').addEventListener('click', () => { attachedFile = null; fileInput.value = ''; area.innerHTML = ''; });
  }

  function formatText(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary);font-weight:500">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="color:var(--accent2)">$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.3);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:12.5px;color:#a5b4fc">$1</code>')
      .replace(/^#{1,3}\s(.+)$/gm, '<strong style="display:block;margin:8px 0 4px;color:var(--text-primary)">$1</strong>')
      .replace(/^[•\-]\s(.+)$/gm, '<div style="padding:2px 0 2px 12px;">• $1</div>')
      .replace(/\n/g, '<br>');
  }

  function addMessage(role, content, time) {
    hideWelcome();
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    const actionsHtml = role === 'ai' ? `<div class="msg-actions"><button class="msg-action-btn copy-btn">📋 Copy</button><button class="msg-action-btn save-btn">💾 Save</button></div>` : '';
    div.innerHTML = `
      <div class="msg-avatar ${role}">${role === 'ai' ? '✦' : user.initials}</div>
      <div class="msg-content">
        <div class="msg-bubble">${formatText(content)}</div>
        <div class="msg-time">${time || now()}</div>
        ${actionsHtml}
      </div>`;
    div.querySelector('.copy-btn')?.addEventListener('click', function() {
      navigator.clipboard?.writeText(div.querySelector('.msg-bubble').innerText).catch(() => {});
      this.textContent = '✓ Copied'; setTimeout(() => this.textContent = '📋 Copy', 1500);
    });
    div.querySelector('.save-btn')?.addEventListener('click', function() {
      this.textContent = '✓ Saved'; setTimeout(() => this.textContent = '💾 Save', 1500);
    });
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function addTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'msg ai'; div.id = 'typingMsg';
    div.innerHTML = `<div class="msg-avatar ai">✦</div><div class="msg-content"><div class="msg-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div></div>`;
    messages.appendChild(div); messages.scrollTop = messages.scrollHeight;
  }

  function removeTypingIndicator() { document.getElementById('typingMsg')?.remove(); }

  async function sendMessage() {
    const text = textarea.value.trim();
    if (!text || isTyping) return;
    textarea.value = ''; textarea.style.height = 'auto'; isTyping = true;
    const userText = attachedFile ? `${text}\n\n[Attached: ${attachedFile.name}]` : text;
    addMessage('user', userText);
    attachedFile = null; container.querySelector('#filePreviewArea').innerHTML = ''; fileInput.value = '';
    if (window.sidebarController) window.sidebarController.addRecentChat(text, []);
    if (window.addToSessionHistory) window.addToSessionHistory(text);
    addTypingIndicator();
    getAIReply(currentMode, text).then(reply => {
      removeTypingIndicator(); addMessage('ai', reply); isTyping = false;
    }).catch(() => {
      removeTypingIndicator(); addMessage('ai', 'Sorry, something went wrong. Please try again.'); isTyping = false;
    });
  }

  function setMode(mode) {
    currentMode = mode;
    container.querySelectorAll('[data-pill]').forEach(p => p.classList.toggle('active', p.dataset.pill === mode));
    const placeholders = { chat:'Ask Leamus AI anything…', write:'Describe what you want to write…', code:'Describe code to write or debug…', data:'Paste your data for analysis…', research:'What topic should I research?' };
    textarea.placeholder = placeholders[mode] || 'Ask Leamus AI anything…';
  }

function startVoiceInput() {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      addMessage('ai', 'Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const voiceBtn = container.querySelector('#voiceBtn');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();

    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = '';
    let silenceTimer = null;
    let isListening = true;

    // UI — show recording state
    voiceBtn.textContent = '🔴';
    voiceBtn.title = 'Listening… click to stop';
    textarea.placeholder = '🎙️ Listening…';
    textarea.value = '';

    // Show a live indicator message
    hideWelcome();
    const liveDiv = document.createElement('div');
    liveDiv.id = 'liveVoiceIndicator';
    liveDiv.style.cssText = 'padding:10px 16px;font-size:13px;color:var(--text-muted);display:flex;align-items:center;gap:8px;';
    liveDiv.innerHTML = `<span style="color:red;font-size:16px;">🔴</span> <span id="liveTranscriptText">Listening… speak now</span>`;
    messages.appendChild(liveDiv);
    messages.scrollTop = messages.scrollHeight;

    recognition.onresult = (e) => {
      let interim = '';
      finalTranscript = '';

      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript;
        } else {
          interim += e.results[i][0].transcript;
        }
      }

      const display = finalTranscript || interim;
      textarea.value = display;
      autoResize(textarea);

      // Update live indicator
      const liveText = document.getElementById('liveTranscriptText');
      if (liveText) liveText.textContent = display || 'Listening… speak now';

      // Auto-send after 2 seconds of silence
      clearTimeout(silenceTimer);
      if (finalTranscript.trim()) {
        silenceTimer = setTimeout(() => {
          if (isListening) {
            recognition.stop();
          }
        }, 2000);
      }
    };

    recognition.onend = () => {
      isListening = false;
      clearTimeout(silenceTimer);

      // Remove live indicator
      document.getElementById('liveVoiceIndicator')?.remove();

      // Reset button
      voiceBtn.textContent = '🎤';
      voiceBtn.title = 'Voice input';
      textarea.placeholder = 'Ask Leamus AI anything…';
      voiceBtn.onclick = null;
      voiceBtn.addEventListener('click', startVoiceInput);

      // Send the message
      const text = finalTranscript.trim() || textarea.value.trim();
      if (text) {
        textarea.value = text;
        sendMessage();
      } else {
        // Nothing was said
        if (messages.querySelector('.msg')) {
          // keep messages visible
        } else {
          welcomeArea.style.display = 'flex';
          messages.classList.remove('visible');
        }
      }
    };

    recognition.onerror = (e) => {
      isListening = false;
      clearTimeout(silenceTimer);
      document.getElementById('liveVoiceIndicator')?.remove();
      voiceBtn.textContent = '🎤';
      voiceBtn.title = 'Voice input';
      textarea.placeholder = 'Ask Leamus AI anything…';
      voiceBtn.onclick = null;
      voiceBtn.addEventListener('click', startVoiceInput);

      if (e.error === 'not-allowed') {
        addMessage('ai', '🎤 Microphone access was denied. Please allow microphone permission in your browser settings:\n\n• Click the 🔒 lock icon in the address bar\n• Set Microphone to **Allow**\n• Refresh the page and try again.');
      } else if (e.error === 'no-speech') {
        addMessage('ai', 'No speech detected. Please try again and speak clearly into your microphone.');
      }
    };

    // Click button again to stop manually
    voiceBtn.onclick = () => {
      isListening = false;
      clearTimeout(silenceTimer);
      recognition.stop();
    };

    recognition.start();
  }

  return {
    newChat: showWelcome,
    setMode,
    loadHistory: (prompt) => { textarea.value = prompt; sendMessage(); },
    restoreChat: (title, msgs) => {
      hideWelcome(); messages.innerHTML = '';
      if (msgs && msgs.length > 0) { msgs.forEach(m => addMessage(m.role, m.text)); }
      else { addMessage('ai', 'Continuing from: **' + title + '**\n\nHow can I help you further?'); }
    }
  };
}
