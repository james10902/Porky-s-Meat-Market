/**
 * Theme Module — Dark / Light / System toggle
 * Applies a full CSS variable swap via data-theme attribute.
 * Light theme tokens are defined in design-system.css under [data-theme="light"].
 */

const Theme = {
  STORAGE_KEY:   'porky_theme',
  DEFAULT_THEME: 'system',

  // Modes cycle: dark → light → system → dark
  MODES: ['dark', 'light', 'system'],

  getCurrent: () => localStorage.getItem(Theme.STORAGE_KEY) || Theme.DEFAULT_THEME,

  /* Returns the resolved theme (dark/light) for a given mode */
  _resolve: (mode) => {
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode;
  },

  set: (mode) => {
    localStorage.setItem(Theme.STORAGE_KEY, mode);
    const resolved = Theme._resolve(mode);
    Theme.apply(resolved);
    Theme._updateToggle(mode, resolved);
    Theme._emit('changed', { theme: resolved, mode });
  },

  toggle: () => {
    const current = Theme.getCurrent();
    const idx  = Theme.MODES.indexOf(current);
    const next = Theme.MODES[(idx + 1) % Theme.MODES.length];
    Theme.set(next);
    return next;
  },

  apply: (resolvedTheme) => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    document.documentElement.style.colorScheme = resolvedTheme;
  },

  _updateToggle: (mode, resolved) => {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    const icons  = { dark: '☀️', light: '🌙', system: '💻' };
    const labels = {
      dark:   'Switch to light mode',
      light:  'Switch to system mode',
      system: 'Switch to dark mode'
    };
    const titles = { dark: 'Light mode', light: 'System mode', system: 'Dark mode' };

    btn.setAttribute('aria-label', labels[mode] || labels.dark);
    btn.setAttribute('title',      titles[mode] || titles.dark);

    const icon = btn.querySelector('.theme-icon');
    if (icon) icon.textContent = icons[mode] || icons.dark;

    btn.classList.toggle('theme-light',  mode === 'light');
    btn.classList.toggle('theme-system', mode === 'system');
  },

  init: () => {
    // Default to system on first visit
    if (!localStorage.getItem(Theme.STORAGE_KEY)) {
      localStorage.setItem(Theme.STORAGE_KEY, 'system');
    }

    const mode     = Theme.getCurrent();
    const resolved = Theme._resolve(mode);
    Theme.apply(resolved);

    const wire = () => {
      const btn = document.getElementById('theme-toggle');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          Theme.toggle();
        });
        Theme._updateToggle(mode, resolved);
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', wire);
    } else {
      wire();
    }

    // React to OS preference changes when in system mode
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (Theme.getCurrent() === 'system') {
        Theme.set('system');
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
