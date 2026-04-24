/**
 * Theme Module — Day / Night toggle
 * Applies a full CSS variable swap via data-theme attribute.
 * Light theme tokens are defined in design-system.css under [data-theme="light"].
 */

const Theme = {
  STORAGE_KEY:   'porky_theme',
  DEFAULT_THEME: 'dark',

  getCurrent: () => localStorage.getItem(Theme.STORAGE_KEY) || Theme.DEFAULT_THEME,

  set: (theme) => {
    localStorage.setItem(Theme.STORAGE_KEY, theme);
    Theme.apply(theme);
    Theme._updateToggle(theme);
    Theme._emit('changed', { theme });
  },

  toggle: () => {
    const next = Theme.getCurrent() === 'dark' ? 'light' : 'dark';
    Theme.set(next);
    return next;
  },

  apply: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    // color-scheme hint for browser UI (scrollbars, inputs, etc.)
    document.documentElement.style.colorScheme = theme;
  },

  _updateToggle: (theme) => {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const isDark = theme === 'dark';
    btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    btn.setAttribute('title',      isDark ? 'Light mode'           : 'Dark mode');
    // Update icon
    const icon = btn.querySelector('.theme-icon');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    btn.classList.toggle('theme-light', !isDark);
  },

  init: () => {
    // Respect OS preference on first visit
    if (!localStorage.getItem(Theme.STORAGE_KEY)) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      localStorage.setItem(Theme.STORAGE_KEY, prefersDark ? 'dark' : 'light');
    }

    const current = Theme.getCurrent();
    Theme.apply(current);

    // Wire up toggle button once DOM is ready
    const wire = () => {
      const btn = document.getElementById('theme-toggle');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          Theme.toggle();
        });
        Theme._updateToggle(current);
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', wire);
    } else {
      wire();
    }

    // Listen for OS preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(Theme.STORAGE_KEY)) {
        Theme.set(e.matches ? 'dark' : 'light');
      }
    });
  },

  _listeners: {},
  _emit: (event, data) => {
    const cbs = Theme._listeners[event] || [];
    cbs.forEach(cb => cb(data));
    window.dispatchEvent(new CustomEvent('theme:' + event, { detail: data }));
  },
  on:  (event, cb) => { if (!Theme._listeners[event]) Theme._listeners[event] = []; Theme._listeners[event].push(cb); },
  off: (event, cb) => { if (Theme._listeners[event]) Theme._listeners[event] = Theme._listeners[event].filter(f => f !== cb); }
};

Theme.init();

if (typeof module !== 'undefined' && module.exports) module.exports = Theme;
