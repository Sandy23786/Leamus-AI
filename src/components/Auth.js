export function renderAuth(container, onSuccess) {
  let mode = 'login';

  container.innerHTML = `
    <div class="screen auth-screen active" id="authScreen">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="auth-logo-icon">✦</div>
          <div class="auth-logo-text">Leamus<span>AI</span></div>
        </div>
        <p class="auth-tagline">Your intelligent assistant for everything</p>
        <div class="auth-tabs">
          <div class="auth-tab active" data-tab="login">Sign in</div>
          <div class="auth-tab" data-tab="signup">Create account</div>
        </div>
        <form class="auth-form" id="authForm" novalidate>
          <div class="form-group hidden" id="nameGroup">
            <label class="form-label" for="nameInput">Full name</label>
            <input class="form-input" type="text" id="nameInput" placeholder="Your name" autocomplete="name" />
          </div>
          <div class="form-group">
            <label class="form-label" for="emailInput">Email address</label>
            <input class="form-input" type="email" id="emailInput" placeholder="you@example.com" autocomplete="email" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="passwordInput">Password</label>
            <input class="form-input" type="password" id="passwordInput" placeholder="••••••••" autocomplete="current-password" required />
          </div>
          <div class="form-group hidden" id="confirmGroup">
            <label class="form-label" for="confirmInput">Confirm password</label>
            <input class="form-input" type="password" id="confirmInput" placeholder="••••••••" autocomplete="new-password" />
          </div>
          <button type="submit" class="btn-primary" id="authSubmitBtn">Sign in to Leamus AI →</button>
          <div class="auth-divider">
            <div class="auth-divider-line"></div>
            <span class="auth-divider-text">or</span>
            <div class="auth-divider-line"></div>
          </div>
          <button type="button" class="btn-oauth" id="googleBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          <p class="auth-footer" id="authFooter">
            Don't have an account? <a id="switchAuthLink">Create one</a>
          </p>
        </form>
      </div>
    </div>
  `;

  container.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => switchMode(tab.dataset.tab));
  });

  container.querySelector('#switchAuthLink').addEventListener('click', () => {
    switchMode(mode === 'login' ? 'signup' : 'login');
  });

  container.querySelector('#googleBtn').addEventListener('click', handleGoogleAuth);
  container.querySelector('#authForm').addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubmit();
  });

  function switchMode(newMode) {
    mode = newMode;
    container.querySelectorAll('.auth-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.tab === mode)
    );
    const isSignup = mode === 'signup';
    container.querySelector('#nameGroup').classList.toggle('hidden', !isSignup);
    container.querySelector('#confirmGroup').classList.toggle('hidden', !isSignup);
    container.querySelector('#authSubmitBtn').textContent = isSignup
      ? 'Create account →'
      : 'Sign in to Leamus AI →';
    container.querySelector('#authFooter').innerHTML = isSignup
      ? `Already have an account? <a id="switchAuthLink">Sign in</a>`
      : `Don't have an account? <a id="switchAuthLink">Create one</a>`;
    container.querySelector('#switchAuthLink').addEventListener('click', () => {
      switchMode(mode === 'login' ? 'signup' : 'login');
    });
  }

  function extractName(email, fullName) {
    if (fullName && fullName.trim()) {
      return fullName.trim().split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
    const local = email.split('@')[0];
    return local
      .replace(/[^a-zA-Z0-9 ]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  function handleSubmit() {
    const email = container.querySelector('#emailInput').value.trim();
    const password = container.querySelector('#passwordInput').value;
    if (!email || !password) return;

    const btn = container.querySelector('#authSubmitBtn');
    btn.textContent = 'Signing in…';
    btn.disabled = true;

    setTimeout(() => {
      const rawName = mode === 'signup'
        ? container.querySelector('#nameInput').value.trim()
        : '';
      const name = extractName(email, rawName);
      const user = {
        name,
        email,
        initials: name.slice(0, 2).toUpperCase(),
        plan: 'Pro'
      };
      onSuccess(user);
    }, 800);
  }

  function handleGoogleAuth() {
    const btn = container.querySelector('#googleBtn');
    btn.textContent = 'Connecting…';
    btn.disabled = true;
    setTimeout(() => {
      onSuccess({
        name: 'Google User',
        email: 'user@gmail.com',
        initials: 'GU',
        plan: 'Pro'
      });
    }, 700);
  }
}
