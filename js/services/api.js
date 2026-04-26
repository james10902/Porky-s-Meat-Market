/**
 * API Service Layer
 * Centralised HTTP communication with the backend.
 * Base URL is auto-detected: same origin in production, localhost:3000 in dev.
 */

const API = {
  // Works on both Netlify and Vercel — /api routes to serverless functions
  baseURL: '/api',

  // JWT token (loaded from localStorage on init)
  token: null,

  /* ── Token helpers ─────────────────────────────────────────────────── */
  setToken: (token) => {
    API.token = token;
    localStorage.setItem('auth_token', token);
  },

  clearToken: () => {
    API.token = null;
    localStorage.removeItem('auth_token');
  },

  loadToken: () => {
    API.token = localStorage.getItem('auth_token') || null;
  },

  /* ── Core fetch wrapper ────────────────────────────────────────────── */
  request: async (endpoint, options = {}) => {
    const url     = API.baseURL + endpoint;
    const headers = { 'Content-Type': 'application/json', ...options.headers };

    if (API.token) headers['Authorization'] = 'Bearer ' + API.token;

    try {
      const response = await fetch(url, { ...options, headers });

      // Handle 401 — token expired
      if (response.status === 401) {
        API.clearToken();
        if (typeof Auth !== 'undefined') Auth._clearSession();
        // Don't redirect here — let the caller decide
      }

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : null;

      if (!response.ok) {
        const msg = (data && data.error) ? data.error : `HTTP ${response.status}`;
        throw Object.assign(new Error(msg), { status: response.status, data });
      }

      return data;
    } catch (err) {
      // Re-throw network errors with a friendly message
      if (err.name === 'TypeError') {
        throw new Error('Cannot reach the server. Please check your connection.');
      }
      throw err;
    }
  },

  get:    (endpoint)       => API.request(endpoint, { method: 'GET' }),
  post:   (endpoint, data) => API.request(endpoint, { method: 'POST',  body: JSON.stringify(data) }),
  put:    (endpoint, data) => API.request(endpoint, { method: 'PUT',   body: JSON.stringify(data) }),
  patch:  (endpoint, data) => API.request(endpoint, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (endpoint)       => API.request(endpoint, { method: 'DELETE' }),

  /* ── Auth endpoints ────────────────────────────────────────────────── */
  auth: {
    register:    (data)              => API.post('/auth/register', data),
    login:       (email, password)   => API.post('/auth/login', { email, password }),
    logout:      ()                  => { API.clearToken(); return Promise.resolve(); },
    me:          ()                  => API.get('/auth/me'),
    updateProfile: (data)            => API.put('/auth/profile', data),
    changePassword: (cur, next)      => API.post('/auth/change-password', { currentPassword: cur, newPassword: next })
  },

  /* ── Products endpoints ────────────────────────────────────────────── */
  products: {
    getAll:      (filters = {})  => {
      // Remove empty values to keep URL clean
      const clean = {};
      Object.keys(filters).forEach(k => { if (filters[k] !== '' && filters[k] !== undefined) clean[k] = filters[k]; });
      return API.get('/products?' + new URLSearchParams(clean).toString());
    },
    getById:     (id)            => API.get('/products/' + id),
    getFeatured: ()              => API.get('/products/featured'),
    getCategories: ()            => API.get('/products/categories')
  },

  /* ── Orders endpoints ──────────────────────────────────────────────── */
  orders: {
    create:      (data)  => API.post('/orders', data),
    getAll:      ()      => API.get('/orders'),
    getById:     (id)    => API.get('/orders/' + id),
    track:       (id)    => API.get('/orders/' + id + '/tracking'),
    cancel:      (id)    => API.patch('/orders/' + id + '/cancel', {}),
    deleteOne:   (id)    => API.delete('/orders/' + id),
    clearHistory: ()     => API.delete('/orders')
  },

  /* ── Contact / Wholesale ───────────────────────────────────────────── */
  contact: {
    send:        (data) => API.post('/contact', data),
    wholesale:   (data) => API.post('/contact/wholesale', data)
  },

  /* ── Utility ───────────────────────────────────────────────────────── */
  health: () => API.get('/health'),

  /** Small delay helper used in mock code */
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Load token on startup
API.loadToken();

if (typeof module !== 'undefined' && module.exports) module.exports = API;
