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
      <!-- Topbar -->
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
 
      <!-- Body -->
      <div class="app-body">
        <div id="sidebarMount"></div>
        <div id="chatMount" style="flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;"></div>
      </div>
    </div>
  `;
 
  // Sidebar
  sidebarController = renderSidebar(
    document.getElementById('sidebarMount'),
    {
      user: currentUser,
      onNewChat: () => chatController?.newChat(),
      onModeChange: (mode) => {
        chatController?.setMode(mode);
      },
      onHistorySelect: (prompt) => {
        chatController?.loadHistory(prompt);
      }
    }
  );
 
  // Chat
  chatController = renderChat(
    document.getElementById('chatMount'),
    { user: currentUser, initialMode: 'chat' }
  );
 
  // Topbar bindings
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    sidebarOpen = !sidebarOpen;
    sidebarController.collapse(!sidebarOpen);
  });
 
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
 
  document.getElementById('historyTopBtn').addEventListener('click', function() {
    const active = this.classList.toggle('active');
    document.getElementById('dashboardTopBtn').classList.remove('active');
    if (active) showSpecialView('history');
    else chatController?.newChat();
  });
 
  document.getElementById('dashboardTopBtn').addEventListener('click', function() {
    const active = this.classList.toggle('active');
    document.getElementById('historyTopBtn').classList.remove('active');
    if (active) showSpecialView('dashboard');
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
 
// Restore saved theme
const savedTheme = localStorage.getItem('leamus_theme');
if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
 
// ── Special views (History / Dashboard) ──
function showSpecialView(view) {
  const mount = document.getElementById('chatMount');
  if (!mount) return;
 
  const content = view === 'history' ? `
    <div style="flex:1;overflow-y:auto;padding:20px;">
      <h2 style="font-size:18px;font-weight:600;color:var(--text-primary);margin-bottom:16px;">📋 Chat History</h2>
      ${[
        { icon: '✍️', title: 'Write marketing email for SaaS', time: 'Today, 2:34 PM' },
        { icon: '💻', title: 'Debug React useEffect hook', time: 'Yesterday, 11:20 AM' },
        { icon: '📊', title: 'Analyze Q4 sales performance data', time: '2 days ago' },
        { icon: '🔍', title: 'Research AI trends and developments 2025', time: '1 week ago' },
        { icon: '💬', title: 'Explain machine learning fundamentals', time: '1 week ago' },
      ].map(h => `
        <div style="background:var(--glass);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all 0.2s;"
          onmouseover="this.style.borderColor='var(--accent)'"
          onmouseout="this.style.borderColor='var(--border)'"
          onclick="document.getElementById('historyTopBtn').classList.remove('active');document.getElementById('dashboardTopBtn').classList.remove('active');">
          <span style="font-size:20px;">${h.icon}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13.5px;font-weight:500;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${h.title}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${h.time}</div>
          </div>
          <span style="color:var(--text-muted);font-size:13px;">→</span>
        </div>
      `).join('')}
    </div>
  ` : `
    <div style="flex:1;overflow-y:auto;padding:20px;">
      <h2 style="font-size:18px;font-weight:600;color:var(--text-primary);margin-bottom:16px;">⚡ Dashboard</h2>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px;">
        ${[
          { label:'Messages sent', value:'127', icon:'💬' },
          { label:'Docs analyzed', value:'14', icon:'📊' },
          { label:'Code snippets', value:'38', icon:'💻' },
          { label:'Hours saved', value:'12h', icon:'⏱️' },
        ].map(stat => `
          <div style="background:var(--glass2);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <div style="font-size:24px;margin-bottom:6px;">${stat.icon}</div>
            <div style="font-size:24px;font-weight:700;color:var(--text-primary)">${stat.value}</div>
            <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">${stat.label}</div>
          </div>
        `).join('')}
      </div>
      <div style="background:var(--glass);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:12px;">
        <div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:12px;">Mode Usage</div>
        ${[
          { mode:'Coding', pct:42, color:'var(--accent)' },
          { mode:'Writing', pct:31, color:'var(--accent2)' },
          { mode:'Research', pct:27, color:'var(--accent3)' },
        ].map(m => `
          <div style="margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-secondary);margin-bottom:4px;">
              <span>${m.mode}</span><span>${m.pct}%</span>
            </div>
            <div style="height:6px;background:var(--glass2);border-radius:3px;overflow:hidden;">
              <div style="height:100%;width:${m.pct}%;background:${m.color};border-radius:3px;transition:width 0.6s ease;"></div>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="background:rgba(108,127,255,0.1);border:1px solid rgba(108,127,255,0.3);border-radius:12px;padding:14px;">
        <div style="font-size:13px;color:var(--accent);font-weight:600;margin-bottom:4px;">💡 Pro Tip</div>
        <div style="font-size:12.5px;color:var(--text-secondary);line-height:1.5;">Try the Analysis mode to upload CSV or JSON files for instant AI-powered data insights and visualisation recommendations.</div>
      </div>
    </div>
  `;
 
  // Temporarily inject into chat area
  const existing = mount.querySelector('.special-view');
  if (existing) existing.remove();
 
  const div = document.createElement('div');
  div.className = 'special-view';
  div.style.cssText = 'flex:1;overflow:hidden;display:flex;flex-direction:column;';
  div.innerHTML = content;
 
  // Insert before chat-area
  const chatArea = mount.querySelector('.chat-area');
  if (chatArea) {
    chatArea.style.display = 'none';
    mount.appendChild(div);
  }
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
    animation:fadeUp 0.2s ease;
  `;
  menu.innerHTML = `
    <div style="padding:10px 12px;border-bottom:1px solid var(--border);margin-bottom:6px;">
      <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${currentUser.name}</div>
      <div style="font-size:11px;color:var(--text-secondary)">${currentUser.email}</div>
      <div style="font-size:11px;color:var(--accent);margin-top:2px;">${currentUser.plan} plan</div>
    </div>
    ${[
      { icon:'⚙️', label:'Settings' },
      { icon:'👤', label:'Profile' },
      { icon:'📊', label:'Usage & Billing' },
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
 
  // Click outside to close
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
