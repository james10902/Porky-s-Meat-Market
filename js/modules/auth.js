/**
 * Auth Module
 * Client-side authentication using localStorage.
 * Stores hashed-ish passwords (base64 — not cryptographic, demo only).
 * Replace with real JWT/API calls when a backend is available.
 */

const Auth = {
  USERS_KEY:   'porky_users',
  SESSION_KEY: 'porky_session',

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                             */
  /* ------------------------------------------------------------------ */

  /** Encode password (demo only — use bcrypt server-side in production) */
  _encode: (str) => btoa(unescape(encodeURIComponent(str))),

  _getUsers: () => {
    try { return JSON.parse(localStorage.getItem(Auth.USERS_KEY)) || []; }
    catch { return []; }
  },

  _saveUsers: (users) => {
    localStorage.setItem(Auth.USERS_KEY, JSON.stringify(users));
  },

  _getSession: () => {
    try { return JSON.parse(localStorage.getItem(Auth.SESSION_KEY)); }
    catch { return null; }
  },

  _saveSession: (user) => {
    localStorage.setItem(Auth.SESSION_KEY, JSON.stringify(user));
  },

  _clearSession: () => {
    localStorage.removeItem(Auth.SESSION_KEY);
  },

  /* ------------------------------------------------------------------ */
  /*  Public API                                                          */
  /* ------------------------------------------------------------------ */

  getCurrentUser: () => Auth._getSession(),

  isAuthenticated: () => Auth._getSession() !== null,

  /**
   * Register a new user.
   * Tries the real API first; falls back to localStorage if API is unreachable.
   * Returns { success, user, error }
   */
  register: async (data) => {
    const { firstname, lastname, email, phone, password } = data;

    if (!firstname || !lastname || !email || !password) {
      return { success: false, error: 'Please fill in all required fields.' };
    }
    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters.' };
    }

    // Try real API
    try {
      const res = await API.auth.register({ firstname, lastname, email, phone, password });
      if (res && res.token) {
        API.setToken(res.token);
        const session = { ...res.user };
        Auth._saveSession(session);
        Auth._emit('registered', session);
        return { success: true, user: session };
      }
    } catch (err) {
      // If it's a 409 (duplicate) or 422 (validation), surface the error
      if (err.status === 409 || err.status === 422) {
        return { success: false, error: err.message };
      }
      // Otherwise fall through to localStorage fallback
      console.warn('API unavailable, using localStorage auth:', err.message);
    }

    // ── localStorage fallback ──
    const users = Auth._getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    const user = {
      id: Date.now(), firstname: firstname.trim(), lastname: lastname.trim(),
      name: firstname.trim() + ' ' + lastname.trim(),
      email: email.toLowerCase().trim(), phone: phone || '',
      createdAt: new Date().toISOString(), _pw: Auth._encode(password)
    };
    users.push(user);
    Auth._saveUsers(users);
    const session = { ...user };
    delete session._pw;
    Auth._saveSession(session);
    Auth._emit('registered', session);
    return { success: true, user: session };
  },

  /**
   * Log in an existing user.
   * Tries the real API first; falls back to localStorage.
   * Returns { success, user, error }
   */
  login: async (email, password) => {
    if (!email || !password) {
      return { success: false, error: 'Please enter your email and password.' };
    }

    // Try real API
    try {
      const res = await API.auth.login(email, password);
      if (res && res.token) {
        API.setToken(res.token);
        const session = { ...res.user };
        Auth._saveSession(session);
        Auth._emit('loggedIn', session);
        return { success: true, user: session };
      }
    } catch (err) {
      if (err.status === 401) {
        return { success: false, error: 'Incorrect email or password.' };
      }
      console.warn('API unavailable, using localStorage auth:', err.message);
    }

    // ── localStorage fallback ──
    const users = Auth._getUsers();
    const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user || user._pw !== Auth._encode(password)) {
      return { success: false, error: 'Incorrect email or password.' };
    }
    const session = { ...user };
    delete session._pw;
    Auth._saveSession(session);
    Auth._emit('loggedIn', session);
    return { success: true, user: session };
  },

  /**
   * Log out the current user.
   */
  logout: () => {
    Auth._clearSession();
    Auth._emit('loggedOut', {});
    window.location.href = '/';
  },

  /**
   * Update profile fields for the current session.
   */
  updateProfile: (data) => {
    const session = Auth._getSession();
    if (!session) return { success: false, error: 'Not logged in.' };

    const users = Auth._getUsers();
    const idx   = users.findIndex(u => u.id === session.id);
    if (idx === -1) return { success: false, error: 'User not found.' };

    const updated = { ...users[idx], ...data, id: session.id, email: session.email };
    users[idx] = updated;
    Auth._saveUsers(users);

    const newSession = { ...updated };
    delete newSession._pw;
    Auth._saveSession(newSession);

    Auth._emit('profileUpdated', newSession);
    return { success: true, user: newSession };
  },

  /**
   * Redirect to login page, preserving the current URL as a return destination.
   */
  requireAuth: (returnUrl) => {
    if (!Auth.isAuthenticated()) {
      const dest = returnUrl || window.location.pathname + window.location.search;
      window.location.href = '/pages/login.html?return=' + encodeURIComponent(dest);
    }
  },

  /* ------------------------------------------------------------------ */
  /*  UI helpers                                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Update nav to show user name / logout when logged in.
   * Call this on every page after DOM is ready.
   */
  updateNavUI: () => {
    const user       = Auth.getCurrentUser();
    const ordersBtn  = document.querySelector('.nav-orders-btn');
    const navRight   = document.querySelector('.nav-right');
    const mobileLink = document.getElementById('nav-signin-link');

    // Update mobile sign-in link
    if (mobileLink) {
      if (user) {
        mobileLink.textContent = '👤 ' + user.firstname.toUpperCase();
        mobileLink.href = '/pages/dashboard.html';
      } else {
        mobileLink.textContent = '👤 SIGN IN';
        mobileLink.href = '/pages/login.html';
      }
    }

    if (!navRight) return;

    // Remove any existing user chip or admin link
    navRight.querySelector('.nav-user-chip')?.remove();
    navRight.querySelector('.nav-admin-btn')?.remove();

    if (user) {
      if (ordersBtn) {
        ordersBtn.textContent = '👤 ' + user.firstname;
        ordersBtn.href = '/pages/dashboard.html';
      }

      // Admin button for admin users
      if (user.role === 'admin') {
        const adminBtn = document.createElement('a');
        adminBtn.className = 'nav-admin-btn';
        adminBtn.href = '/pages/admin.html';
        adminBtn.textContent = '⚙️ Admin';
        adminBtn.title = 'Owner Dashboard';
        navRight.insertBefore(adminBtn, navRight.querySelector('.cart-btn'));
      }

      // Sign Out chip
      const chip = document.createElement('button');
      chip.className = 'nav-user-chip';
      chip.textContent = 'Sign Out';
      chip.setAttribute('aria-label', 'Sign out');
      chip.addEventListener('click', Auth.logout);
      navRight.appendChild(chip);
    } else {
      if (ordersBtn) {
        ordersBtn.textContent = '👤 Sign In';
        ordersBtn.href = '/pages/login.html';
      }
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Events                                                              */
  /* ------------------------------------------------------------------ */
  _listeners: {},

  _emit: (event, data) => {
    const cbs = Auth._listeners[event] || [];
    cbs.forEach(cb => cb(data));
    window.dispatchEvent(new CustomEvent('auth:' + event, { detail: data }));
  },

  on: (event, cb) => {
    if (!Auth._listeners[event]) Auth._listeners[event] = [];
    Auth._listeners[event].push(cb);
  },

  off: (event, cb) => {
    if (Auth._listeners[event]) {
      Auth._listeners[event] = Auth._listeners[event].filter(fn => fn !== cb);
    }
  },

  /* ------------------------------------------------------------------ */
  /*  Init                                                                */
  /* ------------------------------------------------------------------ */
  init: () => {
    // Update nav on every page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', Auth.updateNavUI);
    } else {
      Auth.updateNavUI();
    }
  }
};

// Boot
Auth.init();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Auth;
}
