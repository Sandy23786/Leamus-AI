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

window.sessionHistory = [];

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
        <button class="topbar-btn" id="dashboardTopBtn">⚡ Dashboard</button>
        <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme" title="Toggle light/dark mode">🌙</button>
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
      onNewChat: () => chatController?.newChat(),
      onModeChange: (mode) => chatController?.setMode(mode),
      onHistorySelect: (prompt) => chatController?.loadHistory(prompt)
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
    document.getElementById('dashboardTopBtn').classList.remove('active');
    const chatMount = document.getElementById('chatMount');
    const chatArea = chatMount ? chatMount.querySelector('.chat-area') : null;
    const existing = chatMount ? chatMount.querySelector('.special-view') : null;
    if (existing) existing.remove();
    if (chatArea) chatArea.style.display = 'flex';
    if (active) showHistoryView();
    else chatController?.newChat();
  });

  document.getElementById('dashboardTopBtn').addEventListener('click', function() {
    const active = this.classList.toggle('active');
    document.getElementById('historyTopBtn').classList.remove('active');
    const chatMount = document.getElementById('chatMount');
    const chatArea = chatMount ? chatMount.querySelector('.chat-area') : null;
    const existing = chatMount ? chatMount.querySelector('.special-view') : null;
    if (existing) existing.remove();
    if (chatArea) chatArea.style.display = 'flex';
    if (active) showDashboardView();
    else chatController?.newChat();
  });

  document.getElementById('userAvatar').addEventListener('click', showUserMenu);
}

// ── Theme toggle ──
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') !== 'light';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('themeToggle').textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('leamus_theme', isDark ? 'light' : 'dark');
}

const savedTheme = localStorage.getItem('leamus_theme');
if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

// ── History View ──
function showHistoryView() {
  const mount = document.getElementById('chatMount');
  if (!mount) return;

  const existing = mount.querySelector('.special-view');
  if (existing) existing.remove();

  const chatArea = mount.querySelector('.chat-area');
  if (chatArea) chatArea.style.display = 'none';

  const histories = window.sessionHistory || [];

  const div = document.createElement('div');
  div.className = 'special-view';
  div.style.cssText = 'flex:1;overflow:hidden;display:flex;flex-direction:column;';
  div.innerHTML = `
    <div style="flex:1;overflow-y:auto;padding:20px;">
      <h2 style="font-size:18px;font-weight:600;color:var(--text-primary);margin-bottom:16px;">📋 Chat History</h2>
      ${histories.length === 0 ? `
        <div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
          <div style="font-size:40px;margin-bottom:12px;">💬</div>
          <div style="font-size:14px;">No chats yet this session.<br>Start a conversation to see your history here.</div>
        </div>
      ` : histories.map((h, i) => `
        <div class="history-card" data-index="${i}" style="background:var(--glass);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all 0.2s;"
          onmouseover="this.style.borderColor='var(--accent)'"
          onmouseout="this.style.borderColor='var(--border)'">
          <span style="font-size:20px;">💬</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13.5px;font-weight:500;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${h.text}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${h.time}</div>
          </div>
          <span style="color:var(--text-muted);font-size:13px;">→</span>
        </div>
      `).join('')}
    </div>
  `;

  div.querySelectorAll('.history-card').forEach(card => {
    card.addEventListener('click', () => {
      document.getElementById('historyTopBtn').classList.remove('active');
      document.getElementById('dashboardTopBtn').classList.remove('active');
      div.remove();
      if (chatArea) chatArea.style.display = 'flex';
      const idx = parseInt(card.dataset.index);
      const h = (window.sessionHistory || [])[idx];
      if (h) chatController?.loadHistory(h.text);
    });
  });

  mount.appendChild(div);
}

// ── Dashboard View ──
function showDashboardView() {
  const mount = document.getElementById('chatMount');
  if (!mount) return;

  const existing = mount.querySelector('.special-view');
  if (existing) existing.remove();

  const chatArea = mount.querySelector('.chat-area');
  if (chatArea) chatArea.style.display = 'none';

  const msgCount = window.sessionHistory ? window.sessionHistory.length : 0;

  const div = document.createElement('div');
  div.className = 'special-view';
  div.style.cssText = 'flex:1;overflow:hidden;display:flex;flex-direction:column;';
  div.innerHTML = `
    <div style="flex:1;overflow-y:auto;padding:20px;">
      <h2 style="font-size:18px;font-weight:600;color:var(--text-primary);margin-bottom:16px;">⚡ Dashboard</h2>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px;">
        <div style="background:var(--glass2);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:24px;margin-bottom:6px;">💬</div>
          <div style="font-size:24px;font-weight:700;color:var(--text-primary)">${msgCount}</div>
          <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">Messages this session</div>
        </div>
        <div style="background:var(--glass2);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:24px;margin-bottom:6px;">⏱️</div>
          <div style="font-size:24px;font-weight:700;color:var(--text-primary)">Live</div>
          <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">Session active</div>
        </div>
      </div>
      <div style="background:rgba(108,127,255,0.1);border:1px solid rgba(108,127,255,0.3);border-radius:12px;padding:14px;">
        <div style="font-size:13px;color:var(--accent);font-weight:600;margin-bottom:4px;">💡 Pro Tip</div>
        <div style="font-size:12.5px;color:var(--text-secondary);line-height:1.5;">Try the Analysis mode to upload CSV or JSON files for instant AI-powered data insights and visualisation recommendations.</div>
      </div>
    </div>
  `;

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
    border-radius:12px;padding:8px;min-width:200px;
    box-shadow:0 8px 32px rgba(0,0,0,0.4);
  `;
  menu.innerHTML = `
    <div style="padding:10px 12px;border-bottom:1px solid var(--border);margin-bottom:6px;">
      <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${currentUser.name}</div>
      <div style="font-size:11px;color:var(--text-secondary)">${currentUser.email}</div>
    </div>
    ${[
      { icon:'⚙️', label:'Settings' },
      { icon:'👤', label:'Profile' },
      { icon:'🔒', label:'Privacy' },
    ].map(item => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;cursor:pointer;font-size:13px;color:var(--text-secondary);transition:all 0.15s;"
        onmouseover="this.style.background='var(--glass2)';this.style.color='var(--text-primary)'"
        onmouseout="this.style.background='transparent';this.style.color='var(--text-secondary)'">
        <span style="font-size:16px;">${item.icon}</span>${item.label}
      </div>
    `).join('')}
    <div style="border-top:1px solid var(--border);margin-top:6px;padding-top:6px;">
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
