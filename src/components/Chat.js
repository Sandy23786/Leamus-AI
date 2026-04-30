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
          <button class="quick-btn" data-insert="Generate image of: ">🖼️ Image</button>
          <button class="quick-btn" data-insert="Generate video of: ">🎬 Video</button>
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

    const actionsHtml = role === 'ai' ? `
      <div class="msg-actions">
        <button class="msg-action-btn copy-btn">📋 Copy</button>
        <button class="msg-action-btn save-btn">💾 Save</button>
      </div>` : '';

    // Check for special content types
    if (role === 'ai' && content.startsWith('__IMAGE_RESULT__')) {
      const data = JSON.parse(content.replace('__IMAGE_RESULT__', ''));
      div.innerHTML = `
        <div class="msg-avatar ai">✦</div>
        <div class="msg-content" style="max-width:90%;">
          <div class="msg-bubble" style="padding:12px;">
            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">
              ✨ Here are 3 images generated for: <strong style="color:var(--text-primary);">"${data.prompt}"</strong>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px;">
              ${data.urls.map((url, i) => `
                <div style="position:relative;border-radius:8px;overflow:hidden;border:1px solid var(--border);">
                  <img src="${url}" alt="Generated image ${i+1}"
                    style="width:100%;height:140px;object-fit:cover;display:block;cursor:pointer;"
                    onclick="window.open('${url}','_blank')"
                    onerror="this.parentElement.innerHTML='<div style=\'height:140px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:12px;\'>Loading...</div>'"
                  />
                  <a href="${url}" download="leamus-ai-image-${i+1}.jpg"
                    style="position:absolute;bottom:6px;right:6px;background:rgba(0,0,0,0.7);color:white;border-radius:6px;padding:3px 8px;font-size:11px;text-decoration:none;cursor:pointer;">
                    ⬇ Save
                  </a>
                </div>
              `).join('')}
            </div>
            <div style="font-size:11px;color:var(--text-muted);">Click any image to view full size · Click ⬇ Save to download</div>
          </div>
          <div class="msg-time">${time || now()}</div>
          <div class="msg-actions">
            <button class="msg-action-btn" onclick="this.closest('.msg').querySelectorAll('img').forEach(img => { const a = document.createElement('a'); a.href=img.src; a.download='leamus-ai.jpg'; a.click(); })">⬇ Download All</button>
          </div>
        </div>
      `;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
      return;
    }

   if (role === 'ai' && content.startsWith('__CANVAS_VIDEO__')) {
      const data = JSON.parse(content.replace('__CANVAS_VIDEO__', ''));
      const canvasId = 'canvas_' + Date.now();
      const duration = 300; // 5 minutes max, stops at 5 min

      div.innerHTML = `
        <div class="msg-avatar ai">✦</div>
        <div class="msg-content" style="max-width:92%;">
          <div class="msg-bubble" style="padding:14px;">
            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">
              🎬 Animated video for: <strong style="color:var(--text-primary);">"${data.prompt}"</strong>
            </div>

            <div style="border-radius:10px;overflow:hidden;background:#000;position:relative;">
              <canvas id="${canvasId}" width="640" height="360"
                style="width:100%;display:block;"></canvas>

              <!-- Controls overlay -->
              <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.85));padding:16px 12px 10px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                  <div id="prog_${canvasId}" style="flex:1;height:3px;background:rgba(255,255,255,0.2);border-radius:2px;cursor:pointer;">
                    <div id="progfill_${canvasId}" style="height:100%;width:0%;background:var(--accent);border-radius:2px;"></div>
                  </div>
                  <span id="time_${canvasId}" style="font-size:11px;color:#ccc;min-width:80px;text-align:right;">0:00 / 5:00</span>
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                  <button id="playbtn_${canvasId}" style="background:none;border:none;color:white;font-size:20px;cursor:pointer;padding:0;">⏸</button>
                  <button id="restartbtn_${canvasId}" style="background:none;border:none;color:white;font-size:16px;cursor:pointer;padding:0;">⏮</button>
                  <span style="font-size:12px;color:#aaa;margin-left:4px;">${data.theme} · animated</span>
                  <button id="fullscreenbtn_${canvasId}" style="background:none;border:none;color:white;font-size:16px;cursor:pointer;padding:0;margin-left:auto;">⛶</button>
                </div>
              </div>
            </div>

            <div style="font-size:11px;color:var(--text-muted);margin-top:8px;">
              Continuous animated video · Up to 5 minutes · Theme: ${data.theme}
            </div>
          </div>
          <div class="msg-time">${time || now()}</div>
        </div>
      `;

      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;

      // Start animation after DOM renders
      setTimeout(() => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;
        const theme = data.theme;

        let frame = 0;
        let startTime = Date.now();
        let paused = false;
        let pausedAt = 0;
        let animFrame = null;
        const maxMs = duration * 1000;

        const playBtn = document.getElementById(`playbtn_${canvasId}`);
        const restartBtn = document.getElementById(`restartbtn_${canvasId}`);
        const progFill = document.getElementById(`progfill_${canvasId}`);
        const timeEl = document.getElementById(`time_${canvasId}`);
        const fullBtn = document.getElementById(`fullscreenbtn_${canvasId}`);

        function fmtTime(ms) {
          const s = Math.floor(ms / 1000);
          return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
        }

        // Theme drawing functions
        const drawers = {
          ocean: (t) => {
            // Sky gradient
            const sky = ctx.createLinearGradient(0, 0, 0, H*0.6);
            sky.addColorStop(0, `hsl(${200 + Math.sin(t*0.1)*10}, 70%, ${30+Math.sin(t*0.2)*5}%)`);
            sky.addColorStop(1, `hsl(${190 + Math.sin(t*0.15)*8}, 60%, 50%)`);
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, W, H*0.6);

            // Sun
            const sunX = W*0.75 + Math.sin(t*0.05)*30;
            const sunY = H*0.15 + Math.cos(t*0.07)*15;
            const sunGrad = ctx.createRadialGradient(sunX,sunY,0,sunX,sunY,60);
            sunGrad.addColorStop(0,'rgba(255,240,100,0.9)');
            sunGrad.addColorStop(0.3,'rgba(255,200,50,0.5)');
            sunGrad.addColorStop(1,'rgba(255,150,0,0)');
            ctx.fillStyle = sunGrad;
            ctx.beginPath(); ctx.arc(sunX,sunY,60,0,Math.PI*2); ctx.fill();

            // Ocean
            const ocean = ctx.createLinearGradient(0,H*0.55,0,H);
            ocean.addColorStop(0,`hsl(200,70%,${35+Math.sin(t*0.3)*5}%)`);
            ocean.addColorStop(1,`hsl(210,80%,15%)`);
            ctx.fillStyle = ocean;
            ctx.fillRect(0,H*0.55,W,H*0.45);

            // Waves
            for (let w = 0; w < 8; w++) {
              ctx.beginPath();
              ctx.strokeStyle = `rgba(255,255,255,${0.05+w*0.03})`;
              ctx.lineWidth = 1.5;
              const waveY = H*0.55 + w*30 + Math.sin(t*0.5+w)*8;
              ctx.moveTo(0, waveY);
              for (let x = 0; x <= W; x += 5) {
                ctx.lineTo(x, waveY + Math.sin(x*0.02 + t*(0.8+w*0.1))*12);
              }
              ctx.stroke();
            }

            // Foam
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 2;
            const foamY = H*0.6 + Math.sin(t*0.8)*10;
            ctx.moveTo(0, foamY);
            for (let x = 0; x <= W; x += 3) {
              ctx.lineTo(x, foamY + Math.sin(x*0.04 + t*1.5)*6);
            }
            ctx.stroke();

            // Horizon reflection
            ctx.fillStyle = `rgba(255,230,100,${0.1+Math.sin(t*0.2)*0.05})`;
            ctx.beginPath();
            const reflW = 40 + Math.sin(t*0.3)*20;
            ctx.ellipse(sunX, H*0.58, reflW, 4, 0, 0, Math.PI*2);
            ctx.fill();

            // Clouds
            for (let c = 0; c < 4; c++) {
              const cx = ((W*0.25*c + t*15*(c%2===0?1:-0.5)) % (W+200)) - 100;
              const cy = H*0.1 + c*20 + Math.sin(t*0.1+c)*10;
              ctx.fillStyle = `rgba(255,255,255,${0.6+Math.sin(t*0.1+c)*0.1})`;
              for (let b = 0; b < 5; b++) {
                ctx.beginPath();
                ctx.arc(cx+b*18, cy+Math.sin(b)*8, 20+b*3, 0, Math.PI*2);
                ctx.fill();
              }
            }
          },

          space: (t) => {
            // Deep space background
            ctx.fillStyle = `hsl(240,40%,${3+Math.sin(t*0.1)*2}%)`;
            ctx.fillRect(0,0,W,H);

            // Nebula clouds
            for (let n = 0; n < 3; n++) {
              const nx = W*(0.2+n*0.3) + Math.sin(t*0.05+n)*30;
              const ny = H*(0.3+n*0.2) + Math.cos(t*0.07+n)*20;
              const ng = ctx.createRadialGradient(nx,ny,0,nx,ny,120+n*40);
              const hues = [280,200,320];
              ng.addColorStop(0,`hsla(${hues[n]},70%,40%,0.15)`);
              ng.addColorStop(0.5,`hsla(${hues[n]},60%,30%,0.08)`);
              ng.addColorStop(1,'transparent');
              ctx.fillStyle = ng;
              ctx.beginPath(); ctx.arc(nx,ny,200,0,Math.PI*2); ctx.fill();
            }

            // Stars — twinkle
            for (let s = 0; s < 200; s++) {
              const sx = (s * 127 + 50) % W;
              const sy = (s * 83 + 30) % H;
              const twinkle = Math.sin(t*(0.5+s*0.1)+s)*0.5+0.5;
              const size = 0.5 + (s%3)*0.5;
              ctx.fillStyle = `rgba(255,255,255,${0.3+twinkle*0.7})`;
              ctx.beginPath(); ctx.arc(sx,sy,size,0,Math.PI*2); ctx.fill();
            }

            // Shooting stars
            for (let ss = 0; ss < 2; ss++) {
              const phase = (t*0.3 + ss*3.14) % 6.28;
              if (phase < 1) {
                const sx = W*(0.2+ss*0.5);
                const progress = phase;
                ctx.strokeStyle = `rgba(255,255,255,${1-progress})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(sx + progress*80, H*0.2 + progress*60);
                ctx.lineTo(sx + progress*80 - 40, H*0.2 + progress*60 - 30);
                ctx.stroke();
              }
            }

            // Planet
            const px = W*0.7 + Math.sin(t*0.02)*5;
            const py = H*0.35 + Math.cos(t*0.03)*5;
            const planetGrad = ctx.createRadialGradient(px-15,py-15,5,px,py,60);
            planetGrad.addColorStop(0,'hsl(270,60%,60%)');
            planetGrad.addColorStop(0.5,'hsl(260,50%,35%)');
            planetGrad.addColorStop(1,'hsl(250,60%,10%)');
            ctx.fillStyle = planetGrad;
            ctx.beginPath(); ctx.arc(px,py,60,0,Math.PI*2); ctx.fill();

            // Planet ring
            ctx.strokeStyle = 'rgba(200,180,100,0.5)';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.ellipse(px,py,90,15,0.3,0,Math.PI*2);
            ctx.stroke();

            // Galaxy spiral
            ctx.save();
            ctx.translate(W*0.25, H*0.65);
            for (let g = 0; g < 150; g++) {
              const angle = g*0.15 + t*0.1;
              const r = g*1.2;
              const gx = Math.cos(angle)*r;
              const gy = Math.sin(angle)*r*0.4;
              const alpha = Math.max(0,(1-g/150)*0.8);
              ctx.fillStyle = `rgba(180,150,255,${alpha})`;
              ctx.beginPath(); ctx.arc(gx,gy,0.8,0,Math.PI*2); ctx.fill();
            }
            ctx.restore();
          },

          forest: (t) => {
            // Sky
            const sky = ctx.createLinearGradient(0,0,0,H*0.5);
            sky.addColorStop(0,`hsl(200,60%,${40+Math.sin(t*0.1)*5}%)`);
            sky.addColorStop(1,`hsl(180,40%,55%)`);
            ctx.fillStyle = sky; ctx.fillRect(0,0,W,H*0.5);

            // Sun rays
            ctx.save();
            ctx.translate(W*0.5, -20);
            for (let r = 0; r < 12; r++) {
              const angle = (r/12)*Math.PI*2 + t*0.05;
              const rayLen = 150 + Math.sin(t*0.3+r)*30;
              ctx.strokeStyle = `rgba(255,240,150,${0.05+Math.sin(t*0.2+r)*0.02})`;
              ctx.lineWidth = 15;
              ctx.beginPath();
              ctx.moveTo(0,0);
              ctx.lineTo(Math.cos(angle)*rayLen, Math.sin(angle)*rayLen);
              ctx.stroke();
            }
            ctx.restore();

            // Ground
            const ground = ctx.createLinearGradient(0,H*0.5,0,H);
            ground.addColorStop(0,`hsl(120,50%,${20+Math.sin(t*0.15)*3}%)`);
            ground.addColorStop(1,`hsl(110,40%,10%)`);
            ctx.fillStyle = ground; ctx.fillRect(0,H*0.5,W,H*0.5);

            // Grass blades
            for (let g = 0; g < 60; g++) {
              const gx = (g/60)*W;
              const gh = 15+Math.sin(g*2.1)*10;
              const sway = Math.sin(t*0.8+g*0.3)*5;
              ctx.strokeStyle = `hsl(${110+Math.sin(g)*10},60%,${30+Math.sin(g*3)*10}%)`;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(gx, H*0.5+5);
              ctx.quadraticCurveTo(gx+sway, H*0.5-gh/2, gx+sway*1.5, H*0.5-gh);
              ctx.stroke();
            }

            // Trees — draw back to front
            for (let layer = 0; layer < 3; layer++) {
              const treeCount = 5 + layer*2;
              for (let tr = 0; tr < treeCount; tr++) {
                const tx = (W/(treeCount))*(tr+0.5) + Math.sin(tr*1.7)*20;
                const ty = H*(0.45 + layer*0.05);
                const th = 80 - layer*20;
                const sway = Math.sin(t*0.4+tr+layer)*3;

                // Trunk
                ctx.fillStyle = `hsl(25,40%,${15+layer*5}%)`;
                ctx.fillRect(tx-4+sway*0.3, ty, 8, th*0.6);

                // Canopy layers
                for (let c = 0; c < 3; c++) {
                  const cr = (th*0.5) - c*10;
                  const cg = ctx.createRadialGradient(tx+sway,ty-c*20,0,tx+sway,ty-c*20,cr);
                  cg.addColorStop(0,`hsl(${120+layer*5},${55+c*5}%,${25+layer*3+c*3}%)`);
                  cg.addColorStop(1,`hsl(${115+layer*5},45%,${15+layer*2}%)`);
                  ctx.fillStyle = cg;
                  ctx.beginPath();
                  ctx.arc(tx+sway, ty-c*18, cr, 0, Math.PI*2);
                  ctx.fill();
                }
              }
            }

            // Fireflies at night
            for (let f = 0; f < 20; f++) {
              const fx = W*(0.1+f*0.045) + Math.sin(t*0.5+f*1.3)*30;
              const fy = H*(0.4+f%5*0.08) + Math.cos(t*0.6+f)*15;
              const flicker = Math.sin(t*(2+f*0.3)+f)*0.5+0.5;
              ctx.fillStyle = `rgba(200,255,100,${flicker*0.7})`;
              ctx.beginPath(); ctx.arc(fx,fy,1.5,0,Math.PI*2); ctx.fill();
              const gl = ctx.createRadialGradient(fx,fy,0,fx,fy,8);
              gl.addColorStop(0,`rgba(180,255,80,${flicker*0.2})`);
              gl.addColorStop(1,'transparent');
              ctx.fillStyle = gl;
              ctx.beginPath(); ctx.arc(fx,fy,8,0,Math.PI*2); ctx.fill();
            }
          },

          fire: (t) => {
            // Dark background
            ctx.fillStyle = '#0a0005';
            ctx.fillRect(0,0,W,H);

            // Embers
            for (let e = 0; e < 80; e++) {
              const ex = (e*137 + Math.sin(t+e)*50) % W;
              const ey = H - (((t*20*(0.5+e%3*0.3)) + e*30) % (H+50));
              const eb = Math.sin(t*(1+e*0.1)+e)*0.5+0.5;
              ctx.fillStyle = `rgba(255,${100+e%100},20,${eb*0.8})`;
              ctx.beginPath(); ctx.arc(ex,ey,1+e%2,0,Math.PI*2); ctx.fill();
            }

            // Main flame
            for (let f = 0; f < 5; f++) {
              const fw = 60+f*30;
              const fx = W*0.5 + Math.sin(t*0.3+f)*20;
              const fh = H*0.4 + Math.sin(t*0.5+f)*30;

              ctx.save();
              ctx.translate(fx, H*0.85);

              const flameGrad = ctx.createRadialGradient(0,0,0,0,-fh*0.5,fw);
              flameGrad.addColorStop(0,'rgba(255,255,200,0.9)');
              flameGrad.addColorStop(0.2,`rgba(255,${150-f*10},0,0.8)`);
              flameGrad.addColorStop(0.6,`rgba(255,${50-f*5},0,0.4)`);
              flameGrad.addColorStop(1,'transparent');
              ctx.fillStyle = flameGrad;

              ctx.beginPath();
              ctx.moveTo(0,0);
              const waver = Math.sin(t*(1+f*0.2))*fw*0.3;
              ctx.bezierCurveTo(
                -fw*0.5+waver, -fh*0.3,
                fw*0.3+waver, -fh*0.6,
                Math.sin(t*0.8+f)*10, -fh
              );
              ctx.bezierCurveTo(
                -fw*0.3+waver, -fh*0.6,
                fw*0.5+waver, -fh*0.3,
                0, 0
              );
              ctx.fill();
              ctx.restore();
            }

            // Ground glow
            const groundGlow = ctx.createRadialGradient(W*0.5,H,0,W*0.5,H,W*0.4);
            groundGlow.addColorStop(0,'rgba(255,80,0,0.3)');
            groundGlow.addColorStop(1,'transparent');
            ctx.fillStyle = groundGlow;
            ctx.fillRect(0,0,W,H);

            // Smoke
            for (let s = 0; s < 15; s++) {
              const sx = W*0.5 + Math.sin(t*0.2+s*1.1)*40;
              const sy = H*0.3 - (t*8+s*20) % (H*0.5);
              const sr = 20+s*5;
              ctx.fillStyle = `rgba(50,30,30,${0.05+s*0.01})`;
              ctx.beginPath(); ctx.arc(sx,sy,sr,0,Math.PI*2); ctx.fill();
            }
          },

          city: (t) => {
            // Night sky
            const sky = ctx.createLinearGradient(0,0,0,H*0.6);
            sky.addColorStop(0,`hsl(240,30%,5%)`);
            sky.addColorStop(1,`hsl(260,20%,12%)`);
            ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);

            // Stars
            for (let s = 0; s < 80; s++) {
              const sx = (s*97+30)%W;
              const sy = (s*61+20)%H*0.5;
              const twinkle = Math.sin(t*(0.5+s*0.1)+s)*0.5+0.5;
              ctx.fillStyle = `rgba(255,255,255,${twinkle*0.6})`;
              ctx.beginPath(); ctx.arc(sx,sy,0.5,0,Math.PI*2); ctx.fill();
            }

            // Moon
            ctx.fillStyle = 'rgba(255,250,220,0.9)';
            ctx.beginPath(); ctx.arc(W*0.85, H*0.12, 25, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'rgba(220,220,180,0.5)';
            ctx.beginPath(); ctx.arc(W*0.85+8, H*0.12-5, 22, 0, Math.PI*2); ctx.fill();

            // Buildings
            const buildings = [
              {x:0.05,w:0.08,h:0.5,windows:[[0.2,0.15],[0.6,0.15],[0.2,0.35],[0.6,0.35]]},
              {x:0.12,w:0.06,h:0.7,windows:[[0.3,0.1],[0.7,0.1],[0.3,0.3]]},
              {x:0.18,w:0.10,h:0.45,windows:[[0.25,0.2],[0.55,0.2],[0.85,0.2]]},
              {x:0.28,w:0.07,h:0.65,windows:[[0.2,0.15],[0.6,0.15]]},
              {x:0.35,w:0.12,h:0.55,windows:[[0.2,0.1],[0.5,0.1],[0.8,0.1]]},
              {x:0.47,w:0.08,h:0.75,windows:[[0.3,0.08],[0.7,0.08]]},
              {x:0.55,w:0.09,h:0.48,windows:[[0.25,0.2],[0.65,0.2]]},
              {x:0.64,w:0.11,h:0.60,windows:[[0.2,0.12],[0.5,0.12],[0.8,0.12]]},
              {x:0.75,w:0.07,h:0.52,windows:[[0.3,0.18],[0.7,0.18]]},
              {x:0.82,w:0.10,h:0.68,windows:[[0.25,0.1],[0.55,0.1],[0.85,0.1]]},
              {x:0.92,w:0.08,h:0.44,windows:[[0.3,0.22],[0.7,0.22]]},
            ];

            buildings.forEach(b => {
              const bx = b.x * W;
              const bw = b.w * W;
              const bh = b.h * H;
              const by = H - bh;

              // Building body
              const bgrad = ctx.createLinearGradient(bx,by,bx+bw,by);
              bgrad.addColorStop(0,`hsl(220,20%,${8+Math.random()*3}%)`);
              bgrad.addColorStop(1,`hsl(220,15%,12%)`);
              ctx.fillStyle = bgrad;
              ctx.fillRect(bx,by,bw,bh);

              // Windows
              b.windows.forEach(([wx,wy]) => {
                for (let wrow = 0; wrow < 15; wrow++) {
                  for (let wcol = 0; wcol < 3; wcol++) {
                    const winX = bx + bw*wx*0.8 + wcol*bw*0.25;
                    const winY = by + bh*wy*0.5 + wrow*18;
                    if (winY > H-10) return;
                    const lit = Math.sin(t*0.1 + winX + winY) > 0.2;
                    const flicker = lit && Math.sin(t*3+winX*winY) > 0.95;
                    ctx.fillStyle = flicker
                      ? `rgba(255,200,100,0.95)`
                      : lit
                        ? `rgba(255,220,120,${0.5+Math.sin(t*0.05+winX)*0.3})`
                        : 'rgba(20,20,40,0.8)';
                    ctx.fillRect(winX, winY, 6, 9);
                  }
                }
              });
            });

            // Ground and road
            ctx.fillStyle = `hsl(220,15%,8%)`;
            ctx.fillRect(0,H*0.88,W,H*0.12);

            // Road
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0,H*0.9,W,H*0.1);

            // Road markings — animated
            for (let rm = 0; rm < 10; rm++) {
              const rmx = ((rm*W/5 - t*40) % W + W) % W;
              ctx.fillStyle = 'rgba(255,220,0,0.7)';
              ctx.fillRect(rmx, H*0.945, 40, 3);
            }

            // Neon glow on ground
            const neonColors = ['rgba(255,0,100','rgba(0,200,255','rgba(150,0,255'];
            buildings.slice(0,3).forEach((b,i) => {
              const glow = ctx.createRadialGradient(b.x*W+b.w*W*0.5,H*0.88,0,b.x*W+b.w*W*0.5,H*0.88,60);
              glow.addColorStop(0,`${neonColors[i]},${0.15+Math.sin(t*0.5+i)*0.05})`);
              glow.addColorStop(1,'transparent');
              ctx.fillStyle = glow;
              ctx.fillRect(0,H*0.7,W,H*0.3);
            });

            // Moving cars
            for (let car = 0; car < 3; car++) {
              const cx = ((t*60*(car%2===0?1:-1) + car*200) % (W+100) + W+100) % (W+100) - 50;
              const cy = H*0.93 + car*5;
              ctx.fillStyle = ['#ff3300','#0066ff','#ffcc00'][car];
              ctx.fillRect(cx,cy,30,12);
              // Headlights
              ctx.fillStyle = 'rgba(255,255,200,0.8)';
              ctx.beginPath(); ctx.arc(car%2===0?cx+30:cx,cy+6,4,0,Math.PI*2); ctx.fill();
            }
          },

          sunset: (t) => {
            const hour = (t*0.02) % Math.PI;
            const sunProgress = hour / Math.PI;

            // Sky gradient based on sun position
            const sky = ctx.createLinearGradient(0,0,0,H*0.7);
            sky.addColorStop(0,`hsl(${220+sunProgress*40},${60-sunProgress*20}%,${10+sunProgress*30}%)`);
            sky.addColorStop(0.4,`hsl(${20+sunProgress*20},${70}%,${30+sunProgress*20}%)`);
            sky.addColorStop(0.7,`hsl(${10},${80}%,${40+sunProgress*10}%)`);
            sky.addColorStop(1,`hsl(${200},${50}%,${20}%)`);
            ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);

            // Sun
            const sunX = W*0.5;
            const sunY = H*(0.8 - sunProgress*0.5);
            const sunSize = 45;
            const sunGrad = ctx.createRadialGradient(sunX,sunY,0,sunX,sunY,sunSize*3);
            sunGrad.addColorStop(0,'rgba(255,255,200,1)');
            sunGrad.addColorStop(0.1,'rgba(255,200,50,0.9)');
            sunGrad.addColorStop(0.3,'rgba(255,100,0,0.4)');
            sunGrad.addColorStop(1,'transparent');
            ctx.fillStyle = sunGrad;
            ctx.beginPath(); ctx.arc(sunX,sunY,sunSize*3,0,Math.PI*2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,200,0.95)';
            ctx.beginPath(); ctx.arc(sunX,sunY,sunSize,0,Math.PI*2); ctx.fill();

            // Horizon
            ctx.fillStyle = `hsl(${10+sunProgress*10},60%,${15+sunProgress*10}%)`;
            ctx.fillRect(0,H*0.65,W,H*0.35);

            // Water reflection
            const waterGrad = ctx.createLinearGradient(0,H*0.65,0,H);
            waterGrad.addColorStop(0,`hsl(200,40%,${15+sunProgress*10}%)`);
            waterGrad.addColorStop(1,`hsl(210,30%,8%)`);
            ctx.fillStyle = waterGrad;
            ctx.fillRect(0,H*0.7,W,H*0.3);

            // Water waves
            for (let w = 0; w < 10; w++) {
              ctx.strokeStyle = `rgba(255,${100+w*10},50,${0.1+w*0.02})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              const wy = H*0.72+w*15;
              for (let x = 0; x <= W; x += 4) {
                const y = wy + Math.sin(x*0.03+t*(0.5+w*0.1))*5;
                x === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
              }
              ctx.stroke();
            }

            // Sun reflection on water
            const reflGrad = ctx.createRadialGradient(sunX,H*0.75,0,sunX,H*0.75,80);
            reflGrad.addColorStop(0,`rgba(255,180,50,${0.4+Math.sin(t*0.5)*0.1})`);
            reflGrad.addColorStop(1,'transparent');
            ctx.fillStyle = reflGrad;
            ctx.fillRect(0,H*0.65,W,H*0.35);

            // Clouds
            for (let c = 0; c < 6; c++) {
              const cx = ((c*W*0.18 + t*8*(c%2===0?1:-0.7)) % (W+200)) - 100;
              const cy = H*(0.1+c*0.06);
              const alpha = 0.6+Math.sin(t*0.1+c)*0.2;
              ctx.fillStyle = `rgba(${200+c*5},${120+c*15},${80+c*10},${alpha})`;
              for (let b = 0; b < 5; b++) {
                ctx.beginPath();
                ctx.arc(cx+b*22,cy+Math.sin(b)*10,18+b*4,0,Math.PI*2);
                ctx.fill();
              }
            }

            // Birds
            for (let bird = 0; bird < 8; bird++) {
              const bx = ((bird*80+t*25) % (W+100)) - 50;
              const by = H*0.25+bird*12+Math.sin(t*0.5+bird)*8;
              const wingFlap = Math.sin(t*3+bird)*10;
              ctx.strokeStyle = `rgba(20,10,5,${0.7+Math.sin(t+bird)*0.2})`;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(bx-12,by+wingFlap);
              ctx.quadraticCurveTo(bx,by,bx+12,by+wingFlap);
              ctx.stroke();
            }
          },

          snow: (t) => {
            // Winter sky
            const sky = ctx.createLinearGradient(0,0,0,H);
            sky.addColorStop(0,`hsl(210,30%,${15+Math.sin(t*0.1)*5}%)`);
            sky.addColorStop(1,`hsl(200,20%,35%)`);
            ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);

            // Snow ground
            ctx.fillStyle = `hsl(210,30%,${80+Math.sin(t*0.1)*3}%)`;
            ctx.beginPath();
            ctx.moveTo(0,H*0.7);
            for (let x = 0; x <= W; x += 20) {
              ctx.lineTo(x, H*0.7+Math.sin(x*0.05+t*0.1)*8);
            }
            ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill();

            // Trees with snow
            for (let tr = 0; tr < 8; tr++) {
              const tx = W*(0.05+tr*0.13);
              const th = 80+tr%3*30;
              ctx.fillStyle = `hsl(25,30%,${15+tr%2*5}%)`;
              ctx.fillRect(tx-3,H*0.65-th*0.5,6,th*0.5);
              for (let l = 0; l < 3; l++) {
                ctx.fillStyle = `hsl(${140+l*5},${30-l*5}%,${20+l*5}%)`;
                ctx.beginPath();
                ctx.moveTo(tx,H*0.65-th-l*20);
                ctx.lineTo(tx-25+l*5,H*0.65-th*0.5-l*20);
                ctx.lineTo(tx+25-l*5,H*0.65-th*0.5-l*20);
                ctx.closePath(); ctx.fill();
                // Snow on branches
                ctx.fillStyle = 'rgba(240,248,255,0.7)';
                ctx.fillRect(tx-20+l*4,H*0.65-th*0.5-l*20,40-l*8,4);
              }
            }

            // Falling snowflakes
            for (let s = 0; s < 120; s++) {
              const sx = (s*137 + Math.sin(t*0.3+s)*30) % W;
              const sy = ((t*15*(0.5+s%5*0.15) + s*20) % (H+20));
              const size = 1+s%4*0.5;
              const alpha = 0.4+s%3*0.2;
              ctx.fillStyle = `rgba(220,235,255,${alpha})`;
              ctx.beginPath();
              // Simple snowflake
              for (let arm = 0; arm < 6; arm++) {
                const angle = (arm/6)*Math.PI*2;
                ctx.moveTo(sx,sy);
                ctx.lineTo(sx+Math.cos(angle)*size*3,sy+Math.sin(angle)*size*3);
              }
              ctx.strokeStyle = `rgba(220,235,255,${alpha})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
              ctx.beginPath(); ctx.arc(sx,sy,size,0,Math.PI*2); ctx.fill();
            }

            // Northern lights
            for (let nl = 0; nl < 3; nl++) {
              const nlGrad = ctx.createLinearGradient(0,H*0.1,0,H*0.5);
              nlGrad.addColorStop(0,'transparent');
              nlGrad.addColorStop(0.5,`hsla(${140+nl*40},80%,50%,${0.1+Math.sin(t*0.2+nl)*0.05})`);
              nlGrad.addColorStop(1,'transparent');
              ctx.fillStyle = nlGrad;
              ctx.beginPath();
              ctx.moveTo(W*(nl*0.3),H*0.1);
              for (let x = 0; x <= W; x += 10) {
                ctx.lineTo(x, H*0.1+Math.sin(x*0.01+t*0.3+nl)*30);
              }
              ctx.lineTo(W,H*0.5); ctx.lineTo(0,H*0.5); ctx.closePath(); ctx.fill();
            }
          },

          rain: (t) => {
            // Dark stormy sky
            const sky = ctx.createLinearGradient(0,0,0,H);
            sky.addColorStop(0,`hsl(220,20%,${8+Math.sin(t*0.2)*3}%)`);
            sky.addColorStop(1,`hsl(210,15%,18%)`);
            ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);

            // Storm clouds
            for (let c = 0; c < 8; c++) {
              const cx = ((c*W*0.15 + t*20*(c%2===0?1:-0.5)) % (W+300)) - 150;
              const cy = H*(0.1+c%3*0.08);
              const cr = 60+c%3*30;
              const cGrad = ctx.createRadialGradient(cx,cy,0,cx,cy,cr);
              cGrad.addColorStop(0,`rgba(${40+c*5},${40+c*3},${60},${0.8+Math.sin(t*0.1+c)*0.1})`);
              cGrad.addColorStop(1,'transparent');
              ctx.fillStyle = cGrad;
              ctx.beginPath(); ctx.arc(cx,cy,cr*1.5,0,Math.PI*2); ctx.fill();
            }

            // Lightning
            if (Math.sin(t*0.7) > 0.97) {
              ctx.fillStyle = `rgba(200,220,255,${(Math.sin(t*0.7)-0.97)*30})`;
              ctx.fillRect(0,0,W,H);
              ctx.strokeStyle = 'rgba(200,220,255,0.9)';
              ctx.lineWidth = 2;
              ctx.beginPath();
              const lx = W*0.3+Math.random()*W*0.4;
              ctx.moveTo(lx,0);
              let ly = 0;
              while (ly < H*0.6) {
                const step = 20+Math.random()*30;
                ctx.lineTo(lx+(Math.random()-0.5)*40, ly+step);
                ly += step;
              }
              ctx.stroke();
            }

            // Rain drops
            for (let r = 0; r < 200; r++) {
              const rx = (r*73 + t*5) % W;
              const ry = ((t*200*(0.8+r%4*0.1) + r*15) % (H+30)) - 10;
              const alpha = 0.2+r%3*0.15;
              ctx.strokeStyle = `rgba(150,180,220,${alpha})`;
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(rx,ry);
              ctx.lineTo(rx-2,ry+12);
              ctx.stroke();
            }

            // Puddles and splashes
            for (let p = 0; p < 6; p++) {
              const px = W*(0.1+p*0.15);
              const py = H*0.88+p%2*15;
              const splashPhase = (t*2+p) % 1;
              if (splashPhase < 0.3) {
                ctx.strokeStyle = `rgba(150,180,220,${0.5*(1-splashPhase/0.3)})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.ellipse(px,py,splashPhase*20,splashPhase*5,0,0,Math.PI*2);
                ctx.stroke();
              }
              ctx.fillStyle = 'rgba(100,140,180,0.3)';
              ctx.beginPath();
              ctx.ellipse(px,py+5,20,5,0,0,Math.PI*2);
              ctx.fill();
            }

            // Ground
            ctx.fillStyle = `hsl(210,15%,${12+Math.sin(t*0.1)*2}%)`;
            ctx.fillRect(0,H*0.85,W,H*0.15);
            ctx.fillStyle = 'rgba(100,140,180,0.15)';
            ctx.fillRect(0,H*0.87,W,H*0.05);
          },

          abstract: (t) => {
            ctx.fillStyle = `hsl(240,30%,5%)`;
            ctx.fillRect(0,0,W,H);

            // Flowing waves
            for (let layer = 0; layer < 6; layer++) {
              ctx.beginPath();
              const hue = (layer*40 + t*10) % 360;
              ctx.strokeStyle = `hsla(${hue},70%,60%,${0.3+layer*0.05})`;
              ctx.lineWidth = 1.5;
              for (let x = 0; x <= W; x += 3) {
                const y = H*0.5
                  + Math.sin(x*0.01*(layer+1) + t*(0.3+layer*0.1))*80
                  + Math.cos(x*0.02 + t*0.2)*40*(layer*0.2);
                x === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
              }
              ctx.stroke();
            }

            // Geometric shapes
            for (let s = 0; s < 8; s++) {
              const sx = W*0.5 + Math.cos(t*0.2+s*0.785)*W*0.3;
              const sy = H*0.5 + Math.sin(t*0.3+s*0.785)*H*0.25;
              const sr = 15+s*5;
              const hue = (s*45+t*20) % 360;
              ctx.strokeStyle = `hsla(${hue},70%,60%,${0.4+Math.sin(t+s)*0.3})`;
              ctx.lineWidth = 1.5;

              ctx.save();
              ctx.translate(sx,sy);
              ctx.rotate(t*0.2+s*0.3);

              if (s%3===0) {
                ctx.beginPath(); ctx.arc(0,0,sr,0,Math.PI*2); ctx.stroke();
              } else if (s%3===1) {
                ctx.strokeRect(-sr/2,-sr/2,sr,sr);
              } else {
                ctx.beginPath();
                for (let p = 0; p <= 5; p++) {
                  const px = Math.cos((p/5)*Math.PI*2-Math.PI/2)*sr;
                  const py = Math.sin((p/5)*Math.PI*2-Math.PI/2)*sr;
                  p===0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
                }
                ctx.closePath(); ctx.stroke();
              }
              ctx.restore();
            }

            // Particles
            for (let p = 0; p < 60; p++) {
              const angle = (p/60)*Math.PI*2 + t*0.1;
              const r = 80+Math.sin(t*0.5+p*0.3)*60;
              const px = W*0.5 + Math.cos(angle)*r*(1+p*0.01);
              const py = H*0.5 + Math.sin(angle)*r*0.6;
              const hue = (p*6+t*30) % 360;
              ctx.fillStyle = `hsla(${hue},80%,65%,${0.5+Math.sin(t+p)*0.4})`;
              ctx.beginPath(); ctx.arc(px,py,2,0,Math.PI*2); ctx.fill();
            }
          }
        };

        const drawFn = drawers[theme] || drawers.abstract;

        function render() {
          if (paused) return;
          const elapsed = (Date.now() - startTime) / 1000;
          const t2 = elapsed;

          if (elapsed >= duration) { stopPlay(); return; }

          drawFn(t2);
          frame++;

          // Update progress
          const pct = (elapsed / duration) * 100;
          if (progFill) progFill.style.width = pct + '%';
          if (timeEl) timeEl.textContent = `${fmtTime(elapsed*1000)} / 5:00`;

          animFrame = requestAnimationFrame(render);
        }

        function stopPlay() {
          paused = true;
          cancelAnimationFrame(animFrame);
          if (playBtn) playBtn.textContent = '▶';
        }

        function startPlay() {
          paused = false;
          if (playBtn) playBtn.textContent = '⏸';
          startTime = Date.now() - pausedAt;
          render();
        }

        if (playBtn) {
          playBtn.addEventListener('click', () => {
            if (paused) {
              startPlay();
            } else {
              pausedAt = (Date.now() - startTime);
              stopPlay();
            }
          });
        }

        if (restartBtn) {
          restartBtn.addEventListener('click', () => {
            startTime = Date.now();
            pausedAt = 0;
            paused = false;
            if (playBtn) playBtn.textContent = '⏸';
            render();
          });
        }

        if (fullBtn) {
          fullBtn.addEventListener('click', () => {
            if (canvas.requestFullscreen) canvas.requestFullscreen();
          });
        }

        // Auto start
        render();
      }, 200);

      return;
    }

    if (role === 'ai' && content.startsWith('__VIDEO_RESULT__')) {
      const data = JSON.parse(content.replace('__VIDEO_RESULT__', ''));
      const totalDuration = data.scenes.reduce((sum, s) => sum + s.duration, 0);

      div.innerHTML = `
        <div class="msg-avatar ai">✦</div>
        <div class="msg-content" style="max-width:92%;">
          <div class="msg-bubble" style="padding:14px;">
            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">
              🎬 Video created for: <strong style="color:var(--text-primary);">"${data.prompt}"</strong>
              <span style="margin-left:8px;font-size:11px;color:var(--text-muted);">${totalDuration}s · ${data.scenes.length} scenes</span>
            </div>

            <!-- Video Player -->
            <div style="background:#000;border-radius:10px;overflow:hidden;position:relative;margin-bottom:10px;" id="videoPlayer_${Date.now()}">
              <div id="sceneContainer" style="position:relative;width:100%;padding-top:56.25%;">
                <img id="sceneImage" src="${data.scenes[0].imageUrl}"
                  style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;"
                  onerror="this.style.background='#1a1a2e'"
                />
                <div id="sceneCaption" style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.8));padding:20px 12px 10px;color:white;font-size:13px;">
                  ${data.scenes[0].caption}
                </div>
                <div id="sceneCounter" style="position:absolute;top:8px;right:10px;background:rgba(0,0,0,0.6);color:white;font-size:11px;padding:3px 8px;border-radius:10px;">
                  Scene 1/${data.scenes.length}
                </div>
                <div id="playOverlay" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3);cursor:pointer;">
                  <div style="width:56px;height:56px;background:rgba(108,127,255,0.9);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;">▶</div>
                </div>
              </div>

              <!-- Progress bar -->
              <div style="background:#222;padding:8px 12px;display:flex;align-items:center;gap:10px;">
                <span id="playBtn" style="cursor:pointer;font-size:18px;color:white;">▶</span>
                <div style="flex:1;height:4px;background:#444;border-radius:2px;cursor:pointer;" id="progressBar">
                  <div id="progressFill" style="height:100%;width:0%;background:var(--accent);border-radius:2px;transition:width 0.3s;"></div>
                </div>
                <span id="timeDisplay" style="font-size:11px;color:#aaa;min-width:50px;">0:00 / ${Math.floor(totalDuration/60)}:${String(totalDuration%60).padStart(2,'0')}</span>
              </div>
            </div>

            <!-- Scene thumbnails -->
            <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;margin-bottom:8px;">
              ${data.scenes.map((s, i) => `
                <div class="scene-thumb" data-scene="${i}"
                  style="flex-shrink:0;width:80px;border-radius:6px;overflow:hidden;border:2px solid ${i===0?'var(--accent)':'var(--border)'};cursor:pointer;">
                  <img src="${s.imageUrl}" style="width:100%;height:48px;object-fit:cover;display:block;"
                    onerror="this.style.background='#333'"
                  />
                  <div style="font-size:10px;padding:2px 4px;background:var(--glass2);color:var(--text-muted);text-align:center;">${s.duration}s</div>
                </div>
              `).join('')}
            </div>

            <div style="font-size:11px;color:var(--text-muted);">Click ▶ to play · Click scenes to jump · Images load in order</div>
          </div>
          <div class="msg-time">${time || now()}</div>
        </div>
      `;

      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;

      // Video player logic
      setTimeout(() => {
        const scenes = data.scenes;
        let currentScene = 0;
        let playing = false;
        let elapsed = 0;
        let interval = null;
        const totalSecs = totalDuration;

        const sceneImage = div.querySelector('#sceneImage');
        const sceneCaption = div.querySelector('#sceneCaption');
        const sceneCounter = div.querySelector('#sceneCounter');
        const playBtn = div.querySelector('#playBtn');
        const playOverlay = div.querySelector('#playOverlay');
        const progressFill = div.querySelector('#progressFill');
        const timeDisplay = div.querySelector('#timeDisplay');

        function formatTime(s) {
          return `${Math.floor(s/60)}:${String(Math.floor(s)%60).padStart(2,'0')}`;
        }

        function goToScene(idx) {
          currentScene = idx;
          sceneImage.src = scenes[idx].imageUrl;
          sceneCaption.textContent = scenes[idx].caption;
          sceneCounter.textContent = `Scene ${idx+1}/${scenes.length}`;
          div.querySelectorAll('.scene-thumb').forEach((t,i) => {
            t.style.borderColor = i === idx ? 'var(--accent)' : 'var(--border)';
          });
        }

        function stopPlay() {
          playing = false;
          clearInterval(interval);
          playBtn.textContent = '▶';
          if (playOverlay) playOverlay.style.display = 'flex';
        }

        function startPlay() {
          playing = true;
          if (playOverlay) playOverlay.style.display = 'none';
          playBtn.textContent = '⏸';

          // Calculate scene boundaries
          let sceneBoundaries = [];
          let acc = 0;
          scenes.forEach(s => { acc += s.duration; sceneBoundaries.push(acc); });

          interval = setInterval(() => {
            elapsed += 0.1;
            if (elapsed >= totalSecs) {
              elapsed = 0;
              currentScene = 0;
              goToScene(0);
              stopPlay();
              progressFill.style.width = '0%';
              timeDisplay.textContent = `0:00 / ${formatTime(totalSecs)}`;
              return;
            }

            // Update progress
            progressFill.style.width = `${(elapsed/totalSecs)*100}%`;
            timeDisplay.textContent = `${formatTime(elapsed)} / ${formatTime(totalSecs)}`;

            // Check scene change
            let newScene = sceneBoundaries.findIndex(b => elapsed < b);
            if (newScene === -1) newScene = scenes.length - 1;
            if (newScene !== currentScene) goToScene(newScene);
          }, 100);
        }

        playBtn.addEventListener('click', () => { playing ? stopPlay() : startPlay(); });
        playOverlay?.addEventListener('click', () => { playing ? stopPlay() : startPlay(); });

        div.querySelectorAll('.scene-thumb').forEach((thumb, i) => {
          thumb.addEventListener('click', () => {
            let acc = 0;
            for (let j = 0; j < i; j++) acc += scenes[j].duration;
            elapsed = acc;
            goToScene(i);
            if (!playing) startPlay();
          });
        });
      }, 500);

      return;
    }

    // Normal text message
    const bubbleInner = formatText(content);
    div.innerHTML = `
      <div class="msg-avatar ${role}">${role === 'ai' ? '✦' : user.initials}</div>
      <div class="msg-content">
        <div class="msg-bubble">${bubbleInner}</div>
        <div class="msg-time">${time || now()}</div>
        ${actionsHtml}
      </div>
    `;

    div.querySelector('.copy-btn')?.addEventListener('click', function() {
      navigator.clipboard?.writeText(div.querySelector('.msg-bubble').innerText).catch(() => {});
      this.textContent = '✓ Copied';
      setTimeout(() => this.textContent = '📋 Copy', 1500);
    });

    div.querySelector('.save-btn')?.addEventListener('click', function() {
      this.textContent = '✓ Saved';
      setTimeout(() => this.textContent = '💾 Save', 1500);
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
    if (window.addToSessionHistory) window.addToSessionHistory(text, null);
    addTypingIndicator();
    getAIReply(currentMode, text).then(reply => {
      removeTypingIndicator(); addMessage('ai', reply);
      if (window.updateLastAIMessage) window.updateLastAIMessage(reply);
      isTyping = false;
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
    restoreChat: (chat) => {
      hideWelcome();
      messages.innerHTML = '';
      if (chat.messages && chat.messages.length > 0) {
        chat.messages.forEach(m => addMessage(m.role, m.text));
      } else {
        addMessage('ai', 'Hi! How can I help you today?');
      }
      // Highlight in sidebar
      if (window.sidebarController) window.sidebarController.highlightChat(chat.id);
      // Set current chat ID so new messages go into this chat
      window.currentChatId = chat.id;
      messages.scrollTop = messages.scrollHeight;
    }
  };
}
