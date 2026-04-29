/**
 * Leamus AI – Main Entry Point
 */

import { renderAuth } from './components/Auth.js';
import { renderSidebar } from './components/Sidebar.js';
import { renderChat } from './components/Chat.js';

const app = document.getElementById('app');

let sidebarOpen = true;
let currentUser = null;
let chatController = null;
let sidebarController = null;

window.sessionHistory = JSON.parse(localStorage.getItem('leamus_history') || '[]');
window.sessionChats = JSON.parse(localStorage.getItem('leamus_chats') || '[]');

// ── Boot ──
function boot() {
  const saved = sessionStorage.getItem('leamus_user');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      renderApp();
    } catch {
      renderAuthScreen();
    }
  } else {
    renderAuthScreen();
  }
}

// ── Auth screen ──
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

// ── Main app ──
function renderApp() {
  app.innerHTML = `
    <div class="screen app-screen active" style="flex-direction:column;height:100vh;">
      <div class="topbar">
        <button class="topbar-btn" id="sidebarToggle" aria-label="Toggle sidebar">☰</button>
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
        window.archiveCurrentChat && window.archiveCurrentChat();
        closeSpecialView();
        chatController?.newChat();
      },
      onModeChange: (mode) => chatController?.setMode(mode),
      onHistorySelect: (prompt, messages) => {
        closeSpecialView();
        chatController?.restoreChat(prompt, messages);
      }
    }
  );

  window.sidebarController = sidebarController;

  window.addToSessionHistory = function(text) {
    const exists = window.sessionHistory.find(h => h.text === text);
    if (!exists) {
      window.sessionHistory.unshift({
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      localStorage.setItem('leamus_history', JSON.stringify(window.sessionHistory));
      if (window.sidebarController) window.sidebarController.addRecentChat(text, []);
    }
  };

  window.archiveCurrentChat = function() {
    if (window.sessionHistory && window.sessionHistory.length > 0) {
      const chatMessages = document.getElementById('chatMessages');
      const msgs = [];
      if (chatMessages) {
        chatMessages.querySelectorAll('.msg').forEach(msg => {
          msgs.push({
            role: msg.classList.contains('user') ? 'user' : 'ai',
            text: msg.querySelector('.msg-bubble')?.innerText || ''
          });
        });
      }
      window.sessionChats.unshift({
        title: window.sessionHistory[window.sessionHistory.length - 1]?.text || 'Chat',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages: msgs,
        history: [...window.sessionHistory]
      });
      localStorage.setItem('leamus_chats', JSON.stringify(window.sessionChats));
      window.sessionHistory = [];
      localStorage.setItem('leamus_history', JSON.stringify(window.sessionHistory));
      const recentDiv = document.getElementById('recentChats');
      if (recentDiv) {
        recentDiv.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:6px 10px;">No chats yet</div>';
      }
    }
  };

  chatController = renderChat(
    document.getElementById('chatMount'),
    { user: currentUser, initialMode: 'chat' }
  );

  document.getElementById('sidebarToggle').addEventListener('click', () => {
    sidebarOpen = !sidebarOpen;
    sidebarController.collapse(!sidebarOpen);
  });

  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  document.getElementById('historyTopBtn').addEventListener('click', function() {
    const active = this.classList.toggle('active');
    if (active) showHistoryView();
    else closeSpecialView();
  });

  document.getElementById('userAvatar').addEventListener('click', showUserMenu);
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

// ── History View ──
function showHistoryView() {
  const mount = document.getElementById('chatMount');
  if (!mount) return;
  const existing = mount.querySelector('.special-view');
  if (existing) existing.remove();
  const chatArea = mount.querySelector('.chat-area');
  if (chatArea) chatArea.style.display = 'none';

  const allChats = [
    ...(window.sessionHistory && window.sessionHistory.length > 0 ? [{
      title: window.sessionHistory[window.sessionHistory.length - 1]?.text || 'Current chat',
      time: 'Current session',
      messages: [],
      history: [...window.sessionHistory],
      isCurrent: true
    }] : []),
    ...(window.sessionChats || [])
  ];

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
      ` : allChats.map((chat, i) => `
        <div class="history-card" data-index="${i}"
          style="background:var(--glass);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all 0.2s;"
          onmouseover="this.style.borderColor='var(--accent)'"
          onmouseout="this.style.borderColor='var(--border)'">
          <span style="font-size:20px;">${chat.isCurrent ? '🟢' : '💬'}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13.5px;font-weight:500;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${chat.title}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${chat.time}${chat.isCurrent ? ' · Active' : ''}</div>
          </div>
          <span style="color:var(--text-muted);font-size:13px;">→</span>
        </div>
      `).join('')}
    </div>
  `;

  div.querySelectorAll('.history-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.index);
      const chat = allChats[idx];
      if (!chat) return;
      closeSpecialView();
      if (chat.isCurrent) return;
      chatController?.restoreChat(chat.title, chat.messages);
    });
  });

  div.querySelector('#clearHistoryBtn')?.addEventListener('click', () => {
    window.sessionHistory = [];
    window.sessionChats = [];
    localStorage.removeItem('leamus_history');
    localStorage.removeItem('leamus_chats');
    showHistoryView();
  });

  mount.appendChild(div);
}

// ── User menu ──
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
