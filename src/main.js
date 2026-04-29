import { renderAuth } from './components/Auth.js';
import { renderSidebar } from './components/Sidebar.js';
import { renderChat } from './components/Chat.js';

const app = document.getElementById('app');

let sidebarOpen = true;
let currentUser = null;
let chatController = null;
let sidebarController = null;

// Load persisted data
window.sessionHistory = JSON.parse(localStorage.getItem('leamus_history') || '[]');
window.sessionChats = JSON.parse(localStorage.getItem('leamus_chats') || '[]');
window.currentChatId = null;

function boot() {
  const saved = sessionStorage.getItem('leamus_user');
  if (saved) {
    try { currentUser = JSON.parse(saved); renderApp(); }
    catch { renderAuthScreen(); }
  } else {
    renderAuthScreen();
  }
}

function renderAuthScreen() {
  app.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'height:100vh;';
  app.appendChild(wrapper);
  renderAuth(wrapper, onAuthSuccess);
}

function onAuthSuccess(user) {
  currentUser = user;
  sessionStorage.setItem('leamus_user', JSON.stringify(user));
  renderApp();
}

function renderApp() {
  app.innerHTML = `
    <div class="screen app-screen active" style="flex-direction:column;height:100vh;">
      <div class="topbar">
        <button class="topbar-btn" id="sidebarToggle">☰</button>
        <div class="topbar-logo">
          <div class="topbar-icon">✦</div>
          <div class="topbar-name">Leamus<span>AI</span></div>
        </div>
        <div class="topbar-spacer"></div>
        <button class="topbar-btn" id="historyTopBtn">📋 History</button>
        <div class="user-avatar" id="userAvatar" title="${currentUser.name}">${currentUser.initials}</div>
      </div>
      <div class="app-body">
        <div id="sidebarMount"></div>
        <div id="chatMount" style="flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;"></div>
      </div>
    </div>
  `;

  sidebarController = renderSidebar(
    document.getElementById('sidebarMount'),
    {
      user: currentUser,
      onNewChat: () => {
        archiveCurrentChat();
        closeSpecialView();
        chatController?.newChat();
      },
      onModeChange: (mode) => chatController?.setMode(mode),
      onChatSelect: (chatId) => {
        closeSpecialView();
        const chat = window.sessionChats.find(c => c.id === chatId);
        if (chat) chatController?.restoreChat(chat);
      }
    }
  );

  window.sidebarController = sidebarController;

  // Generate unique chat ID
  window.currentChatId = Date.now().toString();
  window.currentChatMessages = [];

  window.addToSessionHistory = function(userText, aiText) {
    // Add to current chat messages
    window.currentChatMessages = window.currentChatMessages || [];

    // Save to active chat in sessionChats
    const existing = window.sessionChats.find(c => c.id === window.currentChatId);
    if (existing) {
      existing.messages.push({ role: 'user', text: userText });
      if (aiText) existing.messages.push({ role: 'ai', text: aiText });
      existing.updatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      localStorage.setItem('leamus_chats', JSON.stringify(window.sessionChats));
    } else {
      // Create new chat entry
      const newChat = {
        id: window.currentChatId,
        title: userText.slice(0, 50) + (userText.length > 50 ? '…' : ''),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages: [
          { role: 'ai', text: 'Hi! How can I help you today?' },
          { role: 'user', text: userText }
        ]
      };
      if (aiText) newChat.messages.push({ role: 'ai', text: aiText });
      window.sessionChats.unshift(newChat);
      localStorage.setItem('leamus_chats', JSON.stringify(window.sessionChats));
      // Add to sidebar recent
      if (window.sidebarController) {
        window.sidebarController.addRecentChat(newChat);
      }
    }
  };

  window.updateLastAIMessage = function(aiText) {
    const chat = window.sessionChats.find(c => c.id === window.currentChatId);
    if (chat) {
      chat.messages.push({ role: 'ai', text: aiText });
      localStorage.setItem('leamus_chats', JSON.stringify(window.sessionChats));
    }
  };

  chatController = renderChat(
    document.getElementById('chatMount'),
    { user: currentUser, initialMode: 'chat' }
  );

  // Load existing chats into sidebar
  window.sessionChats.forEach(chat => {
    sidebarController.addRecentChat(chat);
  });

  document.getElementById('sidebarToggle').addEventListener('click', () => {
    sidebarOpen = !sidebarOpen;
    sidebarController.collapse(!sidebarOpen);
  });

  document.getElementById('historyTopBtn').addEventListener('click', function() {
    const active = this.classList.toggle('active');
    if (active) showHistoryView();
    else closeSpecialView();
  });

  document.getElementById('userAvatar').addEventListener('click', showUserMenu);
}

function archiveCurrentChat() {
  // Current chat is already saved in sessionChats via addToSessionHistory
  // Just generate new chat ID
  window.currentChatId = Date.now().toString();
  window.currentChatMessages = [];
}

function closeSpecialView() {
  const mount = document.getElementById('chatMount');
  if (!mount) return;
  const existing = mount.querySelector('.special-view');
  if (existing) existing.remove();
  const chatArea = mount.querySelector('.chat-area');
  if (chatArea) chatArea.style.display = 'flex';
  document.getElementById('historyTopBtn')?.classList.remove('active');
}

function showHistoryView() {
  const mount = document.getElementById('chatMount');
  if (!mount) return;
  const existing = mount.querySelector('.special-view');
  if (existing) existing.remove();
  const chatArea = mount.querySelector('.chat-area');
  if (chatArea) chatArea.style.display = 'none';

  const allChats = window.sessionChats || [];

  const div = document.createElement('div');
  div.className = 'special-view';
  div.style.cssText = 'flex:1;overflow:hidden;display:flex;flex-direction:column;';
  div.innerHTML = `
    <div style="flex:1;overflow-y:auto;padding:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h2 style="font-size:18px;font-weight:600;color:var(--text-primary);">📋 Chat History</h2>
        <button id="clearHistoryBtn" style="background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.3);border-radius:8px;padding:5px 12px;font-size:12px;color:var(--danger);cursor:pointer;font-family:inherit;">🗑 Clear all</button>
      </div>
      ${allChats.length === 0 ? `
        <div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
          <div style="font-size:40px;margin-bottom:12px;">💬</div>
          <div style="font-size:14px;">No chat history yet.<br>Start a conversation to see it here.</div>
        </div>
      ` : allChats.map(chat => `
        <div class="history-card" data-id="${chat.id}"
          style="background:var(--glass);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:10px;cursor:pointer;transition:all 0.2s;"
          onmouseover="this.style.borderColor='var(--accent)'"
          onmouseout="this.style.borderColor='var(--border)'">
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-size:20px;">${chat.id === window.currentChatId ? '🟢' : '💬'}</span>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13.5px;font-weight:500;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${chat.title}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${chat.time} · ${chat.messages.length} messages</div>
            </div>
            <span style="color:var(--text-muted);font-size:13px;">→</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  div.querySelectorAll('.history-card').forEach(card => {
    card.addEventListener('click', () => {
      const chatId = card.dataset.id;
      const chat = window.sessionChats.find(c => c.id === chatId);
      if (!chat) return;
      closeSpecialView();
      if (chatId === window.currentChatId) return;
      archiveCurrentChat();
      window.currentChatId = chat.id;
      chatController?.restoreChat(chat);
    });
  });

  div.querySelector('#clearHistoryBtn')?.addEventListener('click', () => {
    if (!confirm('Clear all chat history?')) return;
    window.sessionChats = [];
    window.sessionHistory = [];
    localStorage.removeItem('leamus_chats');
    localStorage.removeItem('leamus_history');
    const recentDiv = document.getElementById('recentChats');
    if (recentDiv) recentDiv.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:6px 10px;">No chats yet</div>';
    showHistoryView();
  });

  mount.appendChild(div);
}

function showUserMenu() {
  const existing = document.getElementById('userMenu');
  if (existing) { existing.remove(); return; }

  const menu = document.createElement('div');
  menu.id = 'userMenu';
  menu.style.cssText = `
    position:fixed;top:58px;right:12px;z-index:100;
    background:var(--navy-800);border:1px solid var(--border);
    border-radius:12px;padding:8px;min-width:220px;
    box-shadow:0 8px 32px rgba(0,0,0,0.4);
  `;
  menu.innerHTML = `
    <div style="padding:10px 12px;border-bottom:1px solid var(--border);margin-bottom:6px;">
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:2px;">Welcome,</div>
      <div style="font-size:14px;font-weight:600;color:var(--text-primary)">${currentUser.name}</div>
      <div style="font-size:11px;color:var(--text-secondary)">${currentUser.email}</div>
    </div>
    <div style="border-top:1px solid var(--border);padding-top:6px;">
      <div id="signOutBtn" style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;cursor:pointer;font-size:13px;color:var(--danger);transition:all 0.15s;"
        onmouseover="this.style.background='rgba(248,113,113,0.1)'"
        onmouseout="this.style.background='transparent'">
        <span style="font-size:16px;">🚪</span>Sign out
      </div>
    </div>
  `;

  document.body.appendChild(menu);

  menu.querySelector('#signOutBtn').addEventListener('click', () => {
    window.sessionChats = [];
    window.sessionHistory = [];
    localStorage.removeItem('leamus_chats');
    localStorage.removeItem('leamus_history');
    sessionStorage.removeItem('leamus_user');
    menu.remove();
    renderAuthScreen();
  });

  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      if (!menu.contains(e.target) && e.target.id !== 'userAvatar') {
        menu.remove();
        document.removeEventListener('click', handler);
      }
    });
  }, 10);
}

boot();
