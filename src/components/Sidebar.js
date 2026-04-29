export function renderSidebar(container, { user, onNewChat, onModeChange, onChatSelect }) {
  container.innerHTML = `
    <div class="sidebar" id="sidebar">
      <div class="sidebar-new-chat" id="newChatBtn">
        <span>＋</span> New chat
      </div>
      <div class="sidebar-section">
        <div class="sidebar-label">Modes</div>
        <div class="sidebar-item active" data-mode="chat"><span class="sidebar-icon">💬</span> Chat</div>
        <div class="sidebar-item" data-mode="write"><span class="sidebar-icon">✍️</span> Writing</div>
        <div class="sidebar-item" data-mode="code"><span class="sidebar-icon">💻</span> Coding</div>
        <div class="sidebar-item" data-mode="data"><span class="sidebar-icon">📊</span> Analysis</div>
        <div class="sidebar-item" data-mode="research"><span class="sidebar-icon">🔍</span> Research</div>
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
            <div style="font-size:11px;color:var(--text-muted);">Welcome,</div>
            <div class="sidebar-user-name">${user.name}</div>
          </div>
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
      container.querySelectorAll('[data-mode]').forEach(i =>
        i.classList.toggle('active', i.dataset.mode === mode)
      );
    },
    collapse(yes) {
      container.querySelector('#sidebar').classList.toggle('collapsed', yes);
    },
    addRecentChat(chat) {
      const recentDiv = document.getElementById('recentChats');
      if (!recentDiv) return;

      // Remove placeholder
      const placeholder = recentDiv.querySelector('div:not(.recent-item)');
      if (placeholder) placeholder.remove();

      // Don't add duplicates
      if (recentDiv.querySelector(`[data-id="${chat.id}"]`)) return;

      // Max 8 items
      const items = recentDiv.querySelectorAll('.recent-item');
      if (items.length >= 8) items[items.length - 1].remove();

      const div = document.createElement('div');
      div.className = 'sidebar-item recent-item';
      div.dataset.id = chat.id;
      div.style.cssText = 'font-size:12.5px;';
      div.innerHTML = `
        <span class="sidebar-icon">💬</span>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">
          ${chat.title.slice(0, 26)}${chat.title.length > 26 ? '…' : ''}
        </span>
      `;
      div.addEventListener('click', () => onChatSelect(chat.id));
      recentDiv.insertBefore(div, recentDiv.firstChild);
    },
    highlightChat(chatId) {
      document.querySelectorAll('.recent-item').forEach(el => {
        el.classList.toggle('active', el.dataset.id === chatId);
      });
    }
  };
}
