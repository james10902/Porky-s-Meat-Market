/**
 * AuthPage Module — Drives the login/register page UI
 */

const AuthPage = {
  init: () => {
    if (Auth.isAuthenticated()) {
      const params   = new URLSearchParams(window.location.search);
      const returnTo = params.get('return') || '/';
      window.location.href = returnTo;
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'register') AuthPage.showTab('register');
    AuthPage._bindLogin();
    AuthPage._bindRegister();
  },

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

  _showAlert: (msg, type) => {
    const el = document.getElementById('auth-alert');
    if (!el) return;
    el.textContent = msg;
    el.className = 'auth-alert ' + (type || 'error');
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  _clearAlert: () => {
    const el = document.getElementById('auth-alert');
    if (el) { el.style.display = 'none'; el.textContent = ''; }
  },

  _setLoading: (btnId, loading) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const text    = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.btn-spinner');
    btn.disabled  = loading;
    if (text)    text.style.display    = loading ? 'none' : '';
    if (spinner) spinner.style.display = loading ? 'inline-block' : 'none';
  },

  _bindLogin: () => {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      AuthPage._clearAlert();
      const email    = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      AuthPage._setLoading('login-btn', true);
      try {
        const result = await Auth.login(email, password);
        if (result.success) {
          AuthPage._showAlert('Welcome back, ' + result.user.firstname + '! Redirecting…', 'success');
          const params   = new URLSearchParams(window.location.search);
          const returnTo = params.get('return') || '/pages/products.html';
          setTimeout(() => { window.location.href = returnTo; }, 800);
        } else {
          AuthPage._showAlert(result.error, 'error');
        }
      } catch (err) {
        AuthPage._showAlert('Something went wrong. Please try again.', 'error');
      } finally {
        AuthPage._setLoading('login-btn', false);
      }
    });
  },

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

      if (password !== confirm) { AuthPage._showAlert('Passwords do not match.', 'error'); return; }
      if (!terms) { AuthPage._showAlert('Please accept the Terms & Conditions to continue.', 'error'); return; }

      AuthPage._setLoading('register-btn', true);
      try {
        const result = await Auth.register({ firstname, lastname, email, phone, password });
        if (result.success) {
          AuthPage._showAlert('Account created! Welcome, ' + result.user.firstname + '! Redirecting…', 'success');
          const params   = new URLSearchParams(window.location.search);
          const returnTo = params.get('return') || '/pages/products.html';
          setTimeout(() => { window.location.href = returnTo; }, 800);
        } else {
          AuthPage._showAlert(result.error, 'error');
        }
      } catch (err) {
        AuthPage._showAlert('Something went wrong. Please try again.', 'error');
      } finally {
        AuthPage._setLoading('register-btn', false);
      }
    });
  },

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
    const level = levels[score] || levels[0];
    bar.style.setProperty('--strength-width', level.width);
    bar.style.setProperty('--strength-color', level.color);
  },

  togglePassword: (inputId, btn) => {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isText = input.type === 'text';
    input.type      = isText ? 'password' : 'text';
    btn.textContent = isText ? '👁' : '🙈';
    btn.setAttribute('aria-label', isText ? 'Show password' : 'Hide password');
  },

  showForgot: (e) => {
    e.preventDefault();
    AuthPage._showAlert('Password reset is not available yet. Please contact us at porkys-admin@porkysmm.com', 'error');
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', AuthPage.init);
} else {
  AuthPage.init();
}

if (typeof module !== 'undefined' && module.exports) module.exports = AuthPage;
