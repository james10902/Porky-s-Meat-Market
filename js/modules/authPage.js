/**
 * AuthPage Module — Login/Register page UI
 * Uses Firebase for Google Sign-In.
 * Uses localStorage auth for email/password (reliable, no backend needed).
 */

const AuthPage = {
  init: () => {
    // If a customer is already logged in, redirect them
    if (Auth.isAuthenticated()) {
      const user = Auth.getCurrentUser();
      // Admin should never be on the customer login page
      if (user && user.role === 'admin') {
        window.location.href = '/pages/admin.html';
        return;
      }
      const returnTo = new URLSearchParams(window.location.search).get('return') || '/pages/products.html';
      const safe = returnTo.includes('/admin') ? '/pages/products.html' : returnTo;
      window.location.href = safe;
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'register') AuthPage.showTab('register');
    if (params.get('tab') === 'forgot')   AuthPage.showTab('forgot');
    AuthPage._bindLogin();
    AuthPage._bindRegister();
    AuthPage._bindForgot();
  },

  /* ── Tab switching ── */
  showTab: (tab) => {
    document.querySelectorAll('.auth-tab').forEach(el => {
      el.classList.toggle('active', el.id === 'tab-' + tab);
      el.setAttribute('aria-selected', el.id === 'tab-' + tab ? 'true' : 'false');
    });
    document.querySelectorAll('.auth-panel').forEach(el => {
      el.classList.toggle('active', el.id === 'panel-' + tab);
    });
    AuthPage._clearAlert();
  },

  showForgot: (e) => {
    e.preventDefault();
    AuthPage.showTab('forgot');
  },

  /* ── Alerts ── */
  _showAlert: (msg, type, targetId) => {
    const el = document.getElementById(targetId || 'auth-alert');
    if (!el) return;
    el.textContent = msg;
    el.className   = 'auth-alert ' + (type || 'error');
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  _clearAlert: (targetId) => {
    const el = document.getElementById(targetId || 'auth-alert');
    if (el) { el.style.display = 'none'; el.textContent = ''; }
  },

  /* ── Loading state ── */
  _setLoading: (btnId, loading) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const text    = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.btn-spinner');
    btn.disabled  = loading;
    if (text)    text.style.display    = loading ? 'none' : '';
    if (spinner) spinner.style.display = loading ? 'inline-block' : 'none';
  },

  /* ── Redirect after auth ── */
  _redirect: () => {
    const returnTo = new URLSearchParams(window.location.search).get('return') || '/pages/products.html';
    // Never redirect a customer to an admin page
    const safe = returnTo.includes('/admin') ? '/pages/products.html' : returnTo;
    window.location.href = safe;
  },

  /* ── Google Sign-In (Firebase only) ── */
  googleSignIn: async () => {
    AuthPage._clearAlert();
    document.querySelectorAll('.btn-google').forEach(b => { b.disabled = true; });

    try {
      if (typeof FirebaseAuth === 'undefined' || !FirebaseAuth.isAvailable()) {
        AuthPage._showAlert('Google sign-in is not available. Please use email/password instead.', 'error');
        return;
      }

      const result = await FirebaseAuth.signInWithGoogle();

      if (result.cancelled) return;

      if (result.success) {
        AuthPage._showAlert('Welcome, ' + result.user.firstname + '! Redirecting…', 'success');
        setTimeout(AuthPage._redirect, 700);
      } else {
        // Show the actual Firebase error, not a generic message
        AuthPage._showAlert(result.error || 'Google sign-in failed. Please try email instead.', 'error');
      }
    } catch (err) {
      console.error('[AuthPage] Google sign-in error:', err);
      // Show the real error message so it's debuggable
      const msg = err?.message || String(err);
      if (msg.includes('popup-blocked') || msg.includes('popup_blocked')) {
        AuthPage._showAlert('Popup was blocked. Please allow popups for this site and try again.', 'error');
      } else if (msg.includes('network') || msg.includes('Network')) {
        AuthPage._showAlert('Network error. Check your connection and try again.', 'error');
      } else if (msg.includes('auth/unauthorized-domain')) {
        AuthPage._showAlert('This domain is not authorised for Google sign-in. Please use email/password.', 'error');
      } else {
        AuthPage._showAlert('Google sign-in failed: ' + msg, 'error');
      }
    } finally {
      document.querySelectorAll('.btn-google').forEach(b => { b.disabled = false; });
    }
  },

  /* ── Email/Password Login ── */
  _bindLogin: () => {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      AuthPage._clearAlert();

      const email    = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      if (!email || !password) {
        AuthPage._showAlert('Please enter your email and password.', 'error');
        return;
      }

      AuthPage._setLoading('login-btn', true);

      const result = AuthPage._localLogin(email, password);

      if (result.success) {
        // Admin gets saved to admin session key and redirected to admin panel
        if (result.user.role === 'admin') {
          localStorage.setItem('porky_admin_session', JSON.stringify(result.user));
          AuthPage._showAlert('Welcome, ' + result.user.firstname + '! Redirecting to admin…', 'success');
          setTimeout(() => { window.location.href = '/pages/admin.html'; }, 700);
        } else {
          Auth._saveSession(result.user);
          Auth._emit('loggedIn', result.user);
          AuthPage._showAlert('Welcome back, ' + result.user.firstname + '! Redirecting…', 'success');
          setTimeout(AuthPage._redirect, 700);
        }
      } else {
        AuthPage._showAlert(result.error, 'error');
      }

      AuthPage._setLoading('login-btn', false);
    });
  },

  /* ── Pure localStorage login (no async, no network) ── */
  _localLogin: (email, password) => {
    try {
      const raw   = localStorage.getItem('porky_users');
      const users = raw ? JSON.parse(raw) : [];
      const match = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (!match) {
        return { success: false, error: 'No account found with this email. Please create one.' };
      }
      const encoded = btoa(unescape(encodeURIComponent(password)));
      if (match._pw !== encoded) {
        return { success: false, error: 'Incorrect password. Please try again.' };
      }
      const session = { ...match };
      delete session._pw;
      return { success: true, user: session };
    } catch (err) {
      console.error('[AuthPage] _localLogin error:', err);
      return { success: false, error: 'Something went wrong. Please try again.' };
    }
  },

  /* ── Register ── */
  _bindRegister: () => {
    const form = document.getElementById('register-form');
    if (!form) return;

    const pwInput = document.getElementById('reg-password');
    if (pwInput) pwInput.addEventListener('input', () => AuthPage._updateStrength(pwInput.value));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      AuthPage._clearAlert();

      const firstname = document.getElementById('reg-firstname').value.trim();
      const lastname  = document.getElementById('reg-lastname').value.trim();
      const email     = document.getElementById('reg-email').value.trim();
      const phone     = document.getElementById('reg-phone').value.trim();
      const password  = document.getElementById('reg-password').value;
      const confirm   = document.getElementById('reg-confirm').value;
      const terms     = document.getElementById('agree-terms').checked;

      if (!firstname || !lastname || !email || !password) {
        AuthPage._showAlert('Please fill in all required fields.', 'error'); return;
      }
      if (password.length < 8) {
        AuthPage._showAlert('Password must be at least 8 characters.', 'error'); return;
      }
      if (password !== confirm) {
        AuthPage._showAlert('Passwords do not match.', 'error'); return;
      }
      if (!terms) {
        AuthPage._showAlert('Please accept the Terms & Conditions.', 'error'); return;
      }

      AuthPage._setLoading('register-btn', true);

      // Register in localStorage
      const result = AuthPage._localRegister({ firstname, lastname, email, phone, password });

      if (result.success) {
        Auth._saveSession(result.user);
        Auth._emit('registered', result.user);
        AuthPage._showAlert('Account created! Welcome, ' + result.user.firstname + '!', 'success');
        setTimeout(AuthPage._redirect, 700);
      } else {
        AuthPage._showAlert(result.error, 'error');
      }

      AuthPage._setLoading('register-btn', false);
    });
  },

  /* ── Pure localStorage register ── */
  _localRegister: ({ firstname, lastname, email, phone, password }) => {
    try {
      const raw   = localStorage.getItem('porky_users');
      const users = raw ? JSON.parse(raw) : [];

      if (users.find(u => u.email.toLowerCase() === email.toLowerCase().trim())) {
        return { success: false, error: 'An account with this email already exists. Please sign in.' };
      }

      const encoded = btoa(unescape(encodeURIComponent(password)));
      const user = {
        id:        Date.now(),
        firstname: firstname.trim(),
        lastname:  lastname.trim(),
        name:      firstname.trim() + ' ' + lastname.trim(),
        email:     email.toLowerCase().trim(),
        phone:     phone || '',
        role:      'customer',
        createdAt: new Date().toISOString(),
        _pw:       encoded
      };

      users.push(user);
      localStorage.setItem('porky_users', JSON.stringify(users));

      const session = { ...user };
      delete session._pw;
      return { success: true, user: session };
    } catch (err) {
      console.error('[AuthPage] _localRegister error:', err);
      return { success: false, error: 'Something went wrong. Please try again.' };
    }
  },

  /* ── Forgot Password ── */
  _bindForgot: () => {
    const form = document.getElementById('forgot-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      AuthPage._clearAlert('forgot-alert');
      const email = document.getElementById('forgot-email').value.trim();
      if (!email) {
        AuthPage._showAlert('Please enter your email address.', 'error', 'forgot-alert');
        return;
      }

      AuthPage._setLoading('forgot-btn', true);

      // Check if account exists in localStorage
      const users = (() => { try { return JSON.parse(localStorage.getItem('porky_users') || '[]'); } catch { return []; } })();
      const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

      if (!user) {
        // Don't reveal if email exists — show generic message
        AuthPage._showAlert('If an account exists for ' + email + ', a reset link has been sent.', 'success', 'forgot-alert');
        AuthPage._setLoading('forgot-btn', false);
        form.reset();
        return;
      }

      // Try Firebase password reset if available
      let firebaseSent = false;
      try {
        if (typeof FirebaseAuth !== 'undefined' && FirebaseAuth.isAvailable()) {
          await FirebaseAuth.sendPasswordReset(email);
          firebaseSent = true;
        }
      } catch (_) {}

      if (firebaseSent) {
        AuthPage._showAlert('Password reset email sent to ' + email + '. Check your inbox.', 'success', 'forgot-alert');
      } else {
        // Firebase not available — show inline reset form
        AuthPage._showInlineReset(email, user);
      }

      form.reset();
      AuthPage._setLoading('forgot-btn', false);
    });
  },

  /* ── Inline password reset (when Firebase is unavailable) ── */
  _showInlineReset: (email, user) => {
    const container = document.getElementById('forgot-form').parentElement;

    // Remove any existing reset form
    const existing = document.getElementById('inline-reset-form');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.id = 'inline-reset-form';
    div.style.cssText = 'margin-top:1rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.1);';
    div.innerHTML = `
      <p style="font-size:0.85rem;color:var(--color-text-secondary);margin-bottom:1rem;">
        Set a new password for <strong>${email}</strong>:
      </p>
      <div class="form-group">
        <label for="reset-new-pw">New Password</label>
        <div class="input-password-wrap">
          <input type="password" id="reset-new-pw" placeholder="Min. 8 characters" minlength="8" style="width:100%;">
          <button type="button" class="toggle-password" onclick="AuthPage.togglePassword('reset-new-pw', this)" aria-label="Show password">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      </div>
      <div class="form-group">
        <label for="reset-confirm-pw">Confirm Password</label>
        <input type="password" id="reset-confirm-pw" placeholder="Repeat password" style="width:100%;">
      </div>
      <div id="reset-msg" style="display:none;font-size:0.85rem;margin-bottom:0.75rem;"></div>
      <button type="button" class="btn btn-quote btn-lg" id="reset-submit-btn" style="width:100%;">
        <span class="btn-text">SET NEW PASSWORD</span>
        <span class="btn-spinner" style="display:none;"></span>
      </button>
    `;
    container.appendChild(div);

    document.getElementById('reset-submit-btn').addEventListener('click', () => {
      const newPw  = document.getElementById('reset-new-pw').value;
      const confPw = document.getElementById('reset-confirm-pw').value;
      const msgEl  = document.getElementById('reset-msg');

      const showMsg = (txt, ok) => {
        msgEl.textContent = txt;
        msgEl.style.color = ok ? 'var(--color-success)' : 'var(--color-error)';
        msgEl.style.display = 'block';
      };

      if (newPw.length < 8) { showMsg('Password must be at least 8 characters.', false); return; }
      if (newPw !== confPw)  { showMsg('Passwords do not match.', false); return; }

      try {
        const users = JSON.parse(localStorage.getItem('porky_users') || '[]');
        const idx   = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
        if (idx !== -1) {
          users[idx]._pw = btoa(unescape(encodeURIComponent(newPw)));
          localStorage.setItem('porky_users', JSON.stringify(users));
          showMsg('✅ Password updated! You can now sign in.', true);
          setTimeout(() => {
            div.remove();
            AuthPage.showTab('login');
          }, 1500);
        }
      } catch (err) {
        showMsg('Something went wrong. Please try again.', false);
      }
    });
  },

  /* ── Password strength indicator ── */
  _updateStrength: (pw) => {
    const bar = document.getElementById('password-strength');
    if (!bar) return;
    let score = 0;
    if (pw.length >= 8)          score++;
    if (/[A-Z]/.test(pw))        score++;
    if (/[0-9]/.test(pw))        score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const levels = [
      { width: '0%',   color: 'transparent' },
      { width: '25%',  color: '#E74C3C' },
      { width: '50%',  color: '#F39C12' },
      { width: '75%',  color: '#F5A623' },
      { width: '100%', color: '#27AE60' }
    ];
    const l = levels[score] || levels[0];
    bar.style.setProperty('--strength-width', l.width);
    bar.style.setProperty('--strength-color', l.color);
  },

  /* ── Toggle password visibility ── */
  togglePassword: (inputId, btn) => {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isText = input.type === 'text';
    input.type = isText ? 'password' : 'text';
    btn.setAttribute('aria-label', isText ? 'Show password' : 'Hide password');
    const svg = btn.querySelector('svg');
    if (svg) {
      svg.innerHTML = isText
        ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
        : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>';
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', AuthPage.init);
} else {
  AuthPage.init();
}

if (typeof module !== 'undefined' && module.exports) module.exports = AuthPage;
