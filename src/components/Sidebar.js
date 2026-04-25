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
        <div id="recentChats" style="display:flex;flex-direction:column;gap:2px;">
          <div style="font-size:12px;color:var(--text-muted);padding:6px 10px;">No chats yet</div>
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="user-avatar" style="width:28px;height:28px;font-size:11px;">${user.initials}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${user.name}</div>
          </div>
          <span style="color:var(--text-muted);font-size:16px;cursor:pointer;">⚙</span>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#newChatBtn').addEventListener('click', onNewChat);

  container.querySelectorAll('[data-mode]').forEach(item => {
    item.addEventListener('click', () => {
      container.querySelectorAll('[data-mode]').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      onModeChange(item.dataset.mode);
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
    },
    addRecentChat(text) {
      const recentDiv = document.getElementById('recentChats');
      if (!recentDiv) return;

      // Remove "No chats yet" placeholder
      const placeholder = recentDiv.querySelector('[style*="color:var(--text-muted)"]');
      if (placeholder) placeholder.remove();

      // Don't add duplicates
      const existing = [...recentDiv.querySelectorAll('.recent-item')].map(el => el.dataset.chat);
      if (existing.includes(text)) return;

      // Keep max 6 recent items
      const items = recentDiv.querySelectorAll('.recent-item');
      if (items.length >= 6) items[items.length - 1].remove();

      const div = document.createElement('div');
      div.className = 'sidebar-item recent-item';
      div.dataset.chat = text;
      div.style.cssText = 'font-size:12.5px;';
      div.innerHTML = `
        <span class="sidebar-icon">💬</span>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${text.slice(0, 28)}${text.length > 28 ? '…' : ''}</span>
      `;
      div.addEventListener('click', () => onHistorySelect(text));
      recentDiv.insertBefore(div, recentDiv.firstChild);
    }
  };
}
