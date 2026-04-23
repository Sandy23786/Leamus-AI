/**
 * Sidebar Component
 */
export function renderSidebar(container, { user, onNewChat, onModeChange, onHistorySelect }) {
  container.innerHTML = `
    <div class="sidebar" id="sidebar">
      <div class="sidebar-new-chat" id="newChatBtn">
        <span>＋</span> New chat
      </div>

      <div class="sidebar-section">
        <div class="sidebar-label">Modes</div>
        <div class="sidebar-item active" data-mode="chat">
          <span class="sidebar-icon">💬</span> Chat
        </div>
        <div class="sidebar-item" data-mode="write">
          <span class="sidebar-icon">✍️</span> Writing
        </div>
        <div class="sidebar-item" data-mode="code">
          <span class="sidebar-icon">💻</span> Coding
        </div>
        <div class="sidebar-item" data-mode="data">
          <span class="sidebar-icon">📊</span> Analysis
        </div>
        <div class="sidebar-item" data-mode="research">
          <span class="sidebar-icon">🔍</span> Research
        </div>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-label">Recent</div>
        <div class="sidebar-item history-item" data-chat="Debug React useEffect hook">
          <span class="sidebar-icon">💬</span> Debug React hook
        </div>
        <div class="sidebar-item history-item" data-chat="Write marketing email for SaaS">
          <span class="sidebar-icon">✍️</span> Marketing email
        </div>
        <div class="sidebar-item history-item" data-chat="Analyze Q4 sales performance data">
          <span class="sidebar-icon">📊</span> Q4 sales analysis
        </div>
        <div class="sidebar-item history-item" data-chat="Research latest AI developments 2025">
          <span class="sidebar-icon">🔍</span> AI trends 2025
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="user-avatar" style="width:28px;height:28px;font-size:11px;">${user.initials}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${user.name}</div>
            <div class="sidebar-user-plan">${user.plan} plan</div>
          </div>
          <span style="color:var(--text-muted);font-size:16px;cursor:pointer;">⚙</span>
        </div>
      </div>
    </div>
  `;

  // New chat
  container.querySelector('#newChatBtn').addEventListener('click', onNewChat);

  // Mode items
  container.querySelectorAll('[data-mode]').forEach(item => {
    item.addEventListener('click', () => {
      container.querySelectorAll('[data-mode]').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      onModeChange(item.dataset.mode);
    });
  });

  // History items
  container.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      onHistorySelect(item.dataset.chat);
    });
  });

  return {
    setMode(mode) {
      container.querySelectorAll('[data-mode]').forEach(i => {
        i.classList.toggle('active', i.dataset.mode === mode);
      });
    },
    collapse(yes) {
      container.querySelector('#sidebar').classList.toggle('collapsed', yes);
    }
  };
}
