/**
 * Auth Module
 * Admin and customer sessions are stored under SEPARATE localStorage keys
 * so they never collide with each other.
 *
 * porky_session       → customer
 * porky_admin_session → admin
 */

const Auth = {
  USERS_KEY:         'porky_users',
  SESSION_KEY:       'porky_session',
  ADMIN_SESSION_KEY: 'porky_admin_session',

  /* ── Helpers ── */
  _encode: (str) => btoa(unescape(encodeURIComponent(str))),

  _getUsers: () => {
    try { return JSON.parse(localStorage.getItem(Auth.USERS_KEY)) || []; }
    catch { return []; }
  },

  _saveUsers: (users) => {
    localStorage.setItem(Auth.USERS_KEY, JSON.stringify(users));
  },

  /* Pick the right key based on role */
  _sessionKey: (role) => role === 'admin' ? Auth.ADMIN_SESSION_KEY : Auth.SESSION_KEY,

  _getSession: () => {
    // Admin pages always read the admin session key
    // Use a strict check: path ends with admin.html or starts with /pages/admin
    const path = window.location.pathname;
    const isAdminPage = path.endsWith('admin.html') || path.endsWith('admin-login.html');
    if (isAdminPage) {
      try { return JSON.parse(localStorage.getItem(Auth.ADMIN_SESSION_KEY)); } catch { return null; }
    }
    try { return JSON.parse(localStorage.getItem(Auth.SESSION_KEY)); } catch { return null; }
  },

  _saveSession: (user) => {
    const key = Auth._sessionKey(user.role);
    localStorage.setItem(key, JSON.stringify(user));
  },

  _clearSession: () => {
    const path = window.location.pathname;
    const isAdminPage = path.endsWith('admin.html') || path.endsWith('admin-login.html');
    if (isAdminPage) {
      localStorage.removeItem(Auth.ADMIN_SESSION_KEY);
    } else {
      localStorage.removeItem(Auth.SESSION_KEY);
    }
  },

  /* ── Public API ── */
  getCurrentUser:  () => Auth._getSession(),
  isAuthenticated: () => Auth._getSession() !== null,

  register: async (data) => {
    const { firstname, lastname, email, phone, password } = data;
    if (!firstname || !lastname || !email || !password)
      return { success: false, error: 'Please fill in all required fields.' };
    if (password.length < 8)
      return { success: false, error: 'Password must be at least 8 characters.' };

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
      if (err.status === 409 || err.status === 422)
        return { success: false, error: err.message };
      console.warn('API unavailable, using localStorage auth:', err.message);
    }

    const users = Auth._getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
      return { success: false, error: 'An account with this email already exists.' };

    const user = {
      id: Date.now(),
      firstname: firstname.trim(), lastname: lastname.trim(),
      name: firstname.trim() + ' ' + lastname.trim(),
      email: email.toLowerCase().trim(), phone: phone || '',
      role: 'customer',
      createdAt: new Date().toISOString(),
      _pw: Auth._encode(password)
    };
    users.push(user);
    Auth._saveUsers(users);
    const session = { ...user };
    delete session._pw;
    Auth._saveSession(session);
    Auth._emit('registered', session);
    return { success: true, user: session };
  },

  login: async (email, password) => {
    if (!email || !password)
      return { success: false, error: 'Please enter your email and password.' };

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
      if (err.status === 401)
        return { success: false, error: 'Incorrect email or password.' };
      console.warn('API unavailable, using localStorage auth:', err.message);
    }

    const users = Auth._getUsers();
    const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user || user._pw !== Auth._encode(password))
      return { success: false, error: 'Incorrect email or password.' };

    const session = { ...user };
    delete session._pw;
    Auth._saveSession(session);
    Auth._emit('loggedIn', session);
    return { success: true, user: session };
  },

  /* Logout — admin goes back to admin-login, customer goes to home */
  logout: () => {
    if (typeof FirebaseAuth !== 'undefined' && FirebaseAuth._auth) {
      FirebaseAuth._auth.signOut().catch(() => {});
    }
    const path = window.location.pathname;
    const isAdminPage = path.endsWith('admin.html') || path.endsWith('admin-login.html');
    if (isAdminPage) {
      localStorage.removeItem(Auth.ADMIN_SESSION_KEY);
      Auth._emit('loggedOut', {});
      window.location.href = '/pages/admin-login.html';
    } else {
      localStorage.removeItem(Auth.SESSION_KEY);
      Auth._emit('loggedOut', {});
      window.location.href = '/';
    }
  },

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

  requireAuth: (returnUrl) => {
    if (!Auth.isAuthenticated()) {
      const dest = returnUrl || window.location.pathname + window.location.search;
      window.location.href = '/pages/login.html?return=' + encodeURIComponent(dest);
    }
  },

  /* ── Nav UI ── */
  updateNavUI: () => {
    // On non-admin pages, always use the customer session only
    const path = window.location.pathname;
    const isAdminPage = path.endsWith('admin.html') || path.endsWith('admin-login.html');

    let user = null;
    if (isAdminPage) {
      try { user = JSON.parse(localStorage.getItem(Auth.ADMIN_SESSION_KEY)); } catch { user = null; }
    } else {
      // Customer pages: read ONLY the customer session key, never admin
      try { user = JSON.parse(localStorage.getItem(Auth.SESSION_KEY)); } catch { user = null; }
    }

    const navRight   = document.querySelector('.nav-right');
    const mobileLink = document.getElementById('nav-signin-link');

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

    navRight.querySelector('.nav-profile')?.remove();
    navRight.querySelector('.nav-user-chip')?.remove();
    navRight.querySelector('.nav-admin-btn')?.remove();
    navRight.querySelector('.nav-signin-desktop')?.remove();

    if (user) {
      const initials = ((user.firstname?.[0] || '') + (user.lastname?.[0] || '')).toUpperCase() || '?';
      const themeBtn = navRight.querySelector('.theme-toggle-btn');

      // Admin pages get a simple chip — no customer links ever
      if (isAdminPage) {
        const chip = document.createElement('div');
        chip.className = 'nav-user-chip';
        chip.style.cssText = 'display:flex;align-items:center;gap:6px;';
        chip.innerHTML = `<span class="nav-profile-avatar" style="background:var(--color-amber);color:#000;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;">${initials}</span><span style="font-size:0.8rem;font-weight:600;">${user.firstname}</span>`;
        navRight.insertBefore(chip, themeBtn || navRight.firstChild);
        return;
      }

      // Customer pages: full dropdown, no admin link
      const savedAvatar = (() => {
        try {
          // Use Google profile photo if signed in with Google, else saved upload
          return user.avatar || localStorage.getItem('porky_avatar');
        } catch(e) { return null; }
      })();
      const avatarHtml = savedAvatar
        ? `<img src="${savedAvatar}" alt="${user.firstname}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:2px solid rgba(245,166,35,0.4);" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="nav-profile-avatar" style="display:none;">${initials}</span>`
        : `<span class="nav-profile-avatar">${initials}</span>`;

      const dropdownAvatarHtml = savedAvatar
        ? `<img src="${savedAvatar}" alt="${user.firstname}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid rgba(245,166,35,0.4);flex-shrink:0;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="nav-profile-avatar" style="display:none;width:40px;height:40px;font-size:1rem;">${initials}</span>`
        : `<span class="nav-profile-avatar" style="width:40px;height:40px;font-size:1rem;">${initials}</span>`;

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
          <div class="nav-profile-info" style="display:flex;align-items:center;gap:0.75rem;">
            ${dropdownAvatarHtml}
            <div>
              <span class="nav-profile-info-name">${user.firstname} ${user.lastname}</span>
              <span class="nav-profile-info-email">${user.email}</span>
            </div>
          </div>
          <a href="/pages/dashboard.html" class="nav-profile-item">📦 My Orders</a>
          <a href="/pages/dashboard.html#account" class="nav-profile-item">⚙️ Account Settings</a>
          <div class="nav-profile-divider"></div>
          <button class="nav-profile-item nav-profile-signout" id="nav-signout-btn">Sign Out</button>
        </div>
      `;

      navRight.insertBefore(profile, themeBtn || navRight.firstChild);

      profile.querySelector('.nav-profile-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const open = profile.classList.toggle('open');
        profile.setAttribute('aria-expanded', open);
      });

      profile.querySelector('#nav-signout-btn').addEventListener('click', Auth.logout);

      document.addEventListener('click', (e) => {
        if (!profile.contains(e.target)) {
          profile.classList.remove('open');
          profile.setAttribute('aria-expanded', 'false');
        }
      });

    } else {
      // Not logged in — show Sign In link (customer pages only)
      if (!isAdminPage) {
        const link = document.createElement('a');
        link.href = '/pages/login.html';
        link.className = 'nav-signin-desktop';
        link.setAttribute('aria-label', 'Sign In');
        link.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;vertical-align:middle;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>SIGN IN`;
        const themeBtn = navRight.querySelector('.theme-toggle-btn');
        navRight.insertBefore(link, themeBtn || navRight.firstChild);
      }
    }
  },

  /* ── Events ── */
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
    if (Auth._listeners[event])
      Auth._listeners[event] = Auth._listeners[event].filter(fn => fn !== cb);
  },

  /* ── Init ── */
  init: () => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', Auth.updateNavUI);
    } else {
      Auth.updateNavUI();
    }
  }
};

Auth.init();

if (typeof module !== 'undefined' && module.exports) module.exports = Auth;
