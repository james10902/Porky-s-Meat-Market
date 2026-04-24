/**
 * AuthGate Module
 * Injects a login/register modal overlay on any page.
 * Shown when a guest tries to add to cart or open the cart drawer.
 */

const AuthGate = {
  _returnUrl: null,
  _injected:  false,

  /* ---- Show the gate ---- */
  show: (returnUrl) => {
    AuthGate._returnUrl = returnUrl || window.location.pathname;
    if (!AuthGate._injected) AuthGate._inject();
    const modal = document.getElementById('auth-gate-modal');
    const overlay = document.getElementById('auth-gate-overlay');
    if (modal)   modal.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    // Focus first input
    setTimeout(() => {
      const first = modal && modal.querySelector('input');
      if (first) first.focus();
    }, 100);
  },

  hide: () => {
    const modal   = document.getElementById('auth-gate-modal');
    const overlay = document.getElementById('auth-gate-overlay');
    if (modal)   modal.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  },

  /* ---- Inject HTML into the page ---- */
  _inject: () => {
    AuthGate._injected = true;

    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'auth-gate-overlay';
    overlay.className = 'auth-gate-overlay';
    overlay.addEventListener('click', AuthGate.hide);

    // Modal
    const modal = document.createElement('div');
    modal.id = 'auth-gate-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Sign in to continue');
    modal.className = 'auth-gate-modal';

    modal.innerHTML = `
      <button class="auth-gate-close" aria-label="Close" onclick="AuthGate.hide()">✕</button>

      <div class="auth-gate-header">
        <img src="/assets/Images/Porky logo.jpg" alt="Porky's" class="auth-gate-logo">
        <h2>Sign in to order</h2>
        <p>Create a free account or sign in to add items to your cart and place orders.</p>
      </div>

      <div class="auth-gate-tabs">
        <button class="auth-gate-tab active" onclick="AuthGate._switchTab('login', this)">Sign In</button>
        <button class="auth-gate-tab" onclick="AuthGate._switchTab('register', this)">Create Account</button>
      </div>

      <div id="auth-gate-alert" class="auth-gate-alert" style="display:none;"></div>

      <!-- LOGIN -->
      <form id="gate-login-form" class="auth-gate-form" novalidate>
        <div class="form-group">
          <label for="gate-email">Email</label>
          <input type="email" id="gate-email" placeholder="you@example.com" autocomplete="email" required>
        </div>
        <div class="form-group">
          <label for="gate-password">Password</label>
          <div class="input-password-wrap">
            <input type="password" id="gate-password" placeholder="••••••••" autocomplete="current-password" required>
            <button type="button" class="toggle-password" onclick="AuthGate._togglePw('gate-password', this)">👁</button>
          </div>
        </div>
        <button type="submit" class="btn btn-quote btn-lg" style="width:100%;" id="gate-login-btn">
          <span class="btn-text">SIGN IN</span>
          <span class="btn-spinner" style="display:none;"></span>
        </button>
      </form>

      <!-- REGISTER -->
      <form id="gate-register-form" class="auth-gate-form" style="display:none;" novalidate>
        <div class="form-row">
          <div class="form-group">
            <label for="gate-firstname">First name</label>
            <input type="text" id="gate-firstname" placeholder="John" autocomplete="given-name" required>
          </div>
          <div class="form-group">
            <label for="gate-lastname">Last name</label>
            <input type="text" id="gate-lastname" placeholder="Smith" autocomplete="family-name" required>
          </div>
        </div>
        <div class="form-group">
          <label for="gate-reg-email">Email</label>
          <input type="email" id="gate-reg-email" placeholder="you@example.com" autocomplete="email" required>
        </div>
        <div class="form-group">
          <label for="gate-reg-password">Password</label>
          <div class="input-password-wrap">
            <input type="password" id="gate-reg-password" placeholder="Min. 8 characters" autocomplete="new-password" required minlength="8">
            <button type="button" class="toggle-password" onclick="AuthGate._togglePw('gate-reg-password', this)">👁</button>
          </div>
        </div>
        <button type="submit" class="btn btn-quote btn-lg" style="width:100%;" id="gate-register-btn">
          <span class="btn-text">CREATE ACCOUNT</span>
          <span class="btn-spinner" style="display:none;"></span>
        </button>
      </form>

      <p class="auth-gate-full-link">
        <a href="/pages/login.html">Full sign-in page →</a>
      </p>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    // Bind forms
    document.getElementById('gate-login-form').addEventListener('submit', AuthGate._submitLogin);
    document.getElementById('gate-register-form').addEventListener('submit', AuthGate._submitRegister);

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') AuthGate.hide();
    });
  },

  /* ---- Tab switch ---- */
  _switchTab: (tab, btn) => {
    document.querySelectorAll('.auth-gate-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('gate-login-form').style.display    = tab === 'login'    ? 'block' : 'none';
    document.getElementById('gate-register-form').style.display = tab === 'register' ? 'block' : 'none';
    AuthGate._clearAlert();
  },

  /* ---- Alert ---- */
  _showAlert: (msg, type) => {
    const el = document.getElementById('auth-gate-alert');
    if (!el) return;
    el.textContent = msg;
    el.className = 'auth-gate-alert ' + (type || 'error');
    el.style.display = 'block';
  },

  _clearAlert: () => {
    const el = document.getElementById('auth-gate-alert');
    if (el) { el.style.display = 'none'; el.textContent = ''; }
  },

  /* ---- Loading ---- */
  _setLoading: (btnId, on) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = on;
    const t = btn.querySelector('.btn-text');
    const s = btn.querySelector('.btn-spinner');
    if (t) t.style.display = on ? 'none' : '';
    if (s) s.style.display = on ? 'inline-block' : 'none';
  },

  /* ---- Submit login ---- */
  _submitLogin: async (e) => {
    e.preventDefault();
    AuthGate._clearAlert();
    const email    = document.getElementById('gate-email').value.trim();
    const password = document.getElementById('gate-password').value;
    AuthGate._setLoading('gate-login-btn', true);

    try {
      const result = await Auth.login(email, password);
      if (result.success) {
        AuthGate._showAlert('Welcome back, ' + result.user.firstname + '!', 'success');
        Auth.updateNavUI();
        setTimeout(() => {
          AuthGate.hide();
          if (typeof CartDrawer !== 'undefined') CartDrawer.open();
        }, 700);
      } else {
        AuthGate._showAlert(result.error, 'error');
      }
    } catch (err) {
      AuthGate._showAlert('Something went wrong. Please try again.', 'error');
    } finally {
      AuthGate._setLoading('gate-login-btn', false);
    }
  },

  /* ---- Submit register ---- */
  _submitRegister: async (e) => {
    e.preventDefault();
    AuthGate._clearAlert();
    const firstname = document.getElementById('gate-firstname').value.trim();
    const lastname  = document.getElementById('gate-lastname').value.trim();
    const email     = document.getElementById('gate-reg-email').value.trim();
    const password  = document.getElementById('gate-reg-password').value;
    AuthGate._setLoading('gate-register-btn', true);

    try {
      const result = await Auth.register({ firstname, lastname, email, password });
      if (result.success) {
        AuthGate._showAlert('Account created! Welcome, ' + result.user.firstname + '!', 'success');
        Auth.updateNavUI();
        setTimeout(() => {
          AuthGate.hide();
          if (typeof CartDrawer !== 'undefined') CartDrawer.open();
        }, 700);
      } else {
        AuthGate._showAlert(result.error, 'error');
      }
    } catch (err) {
      AuthGate._showAlert('Something went wrong. Please try again.', 'error');
    } finally {
      AuthGate._setLoading('gate-register-btn', false);
    }
  },

  /* ---- Toggle password ---- */
  _togglePw: (id, btn) => {
    const input = document.getElementById(id);
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.textContent = show ? '🙈' : '👁';
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthGate;
}
