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
   * Tries the real API first (with short timeout); falls back to localStorage.
   * Returns { success, user, error }
   */
  login: async (email, password) => {
    if (!email || !password) {
      return { success: false, error: 'Please enter your email and password.' };
    }

    // Try real API with a short timeout so we don't hang
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await API.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });
      clearTimeout(timer);
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
      // Network error, timeout, or backend down — fall through to localStorage
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
    // Sign out from Firebase if available
    if (typeof FirebaseAuth !== 'undefined' && FirebaseAuth._auth) {
      FirebaseAuth._auth.signOut().catch(() => {});
    }
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
   * Update nav to show user profile when logged in.
   */
  updateNavUI: () => {
    const user       = Auth.getCurrentUser();
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

    // Remove any existing profile widget, user chip, or admin link
    navRight.querySelector('.nav-profile')?.remove();
    navRight.querySelector('.nav-user-chip')?.remove();
    navRight.querySelector('.nav-admin-btn')?.remove();
    navRight.querySelector('.nav-signin-desktop')?.remove();

    if (user) {
      // Build initials avatar
      const initials = ((user.firstname?.[0] || '') + (user.lastname?.[0] || '')).toUpperCase() || '?';
      // Check for saved profile photo
      const savedAvatar = (() => { try { return localStorage.getItem('porky_avatar'); } catch(e) { return null; } })();
      const avatarHtml = savedAvatar
        ? `<img src="${savedAvatar}" alt="${user.firstname}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;">`
        : `<span class="nav-profile-avatar">${initials}</span>`;

      // Admin button
      if (user.role === 'admin') {
        const adminBtn = document.createElement('a');
        adminBtn.className = 'nav-admin-btn';
        adminBtn.href = '/pages/admin.html';
        adminBtn.textContent = '⚙️ Admin';
        adminBtn.title = 'Owner Dashboard';
        navRight.insertBefore(adminBtn, navRight.querySelector('.theme-toggle-btn') || navRight.firstChild);
      }

      // Profile widget
      const profile = document.createElement('div');
      profile.className = 'nav-profile';
      profile.setAttribute('aria-haspopup', 'true');
      profile.setAttribute('aria-expanded', 'false');
      profile.innerHTML = `
        <button class="nav-profile-btn" aria-label="Account menu">
          ${avatarHtml}
          <span class="nav-profile-name">${user.firstname}</span>
          <svg class="nav-profile-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="nav-profile-dropdown">
          <div class="nav-profile-info">
            <span class="nav-profile-info-name">${user.firstname} ${user.lastname}</span>
            <span class="nav-profile-info-email">${user.email}</span>
          </div>
          <a href="/pages/dashboard.html" class="nav-profile-item">📦 My Orders</a>
          <a href="/pages/dashboard.html#account" class="nav-profile-item">⚙️ Account Settings</a>
          <div class="nav-profile-divider"></div>
          <button class="nav-profile-item nav-profile-signout" id="nav-signout-btn">Sign Out</button>
        </div>
      `;

      // Insert before theme toggle
      const themeBtn = navRight.querySelector('.theme-toggle-btn');
      if (themeBtn) {
        navRight.insertBefore(profile, themeBtn);
      } else {
        navRight.appendChild(profile);
      }

      // Toggle dropdown
      const btn      = profile.querySelector('.nav-profile-btn');
      const dropdown = profile.querySelector('.nav-profile-dropdown');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = profile.classList.toggle('open');
        profile.setAttribute('aria-expanded', open);
      });

      // Sign out
      profile.querySelector('#nav-signout-btn').addEventListener('click', Auth.logout);

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!profile.contains(e.target)) {
          profile.classList.remove('open');
          profile.setAttribute('aria-expanded', 'false');
        }
      });

    } else {
      // Not logged in — show sign-in link
      const link = document.createElement('a');
      link.href = '/pages/login.html';
      link.className = 'nav-signin-desktop';
      link.setAttribute('aria-label', 'Sign In');
      link.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;vertical-align:middle;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>SIGN IN`;
      const themeBtn = navRight.querySelector('.theme-toggle-btn');
      if (themeBtn) {
        navRight.insertBefore(link, themeBtn);
      } else {
        navRight.appendChild(link);
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
