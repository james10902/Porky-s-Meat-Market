/**
 * Nav Module
 * Handles mobile hamburger menu toggle and sticky scroll effect
 */

const Nav = {
  init: () => {
    const toggle = DOM.byId('nav-toggle');
    const menu   = DOM.byId('nav-menu');
    const navbar = DOM.query('nav');

    if (!toggle || !menu) return;

    DOM.on(toggle, 'click', () => {
      const isOpen = DOM.hasClass(menu, 'open');
      if (isOpen) {
        Nav.close(toggle, menu);
      } else {
        Nav.open(toggle, menu);
      }
    });

    // Close menu when a nav link is clicked
    menu.querySelectorAll('.nav-link').forEach(link => {
      DOM.on(link, 'click', () => Nav.close(toggle, menu));
    });

    // Close menu on outside click
    DOM.on(document, 'click', (e) => {
      if (!e.target.closest('nav') && !e.target.closest('.cart-drawer')) {
        Nav.close(toggle, menu);
      }
    });

    // Close on Escape key
    DOM.on(document, 'keydown', (e) => {
      if (e.key === 'Escape') Nav.close(toggle, menu);
    });

    // Sticky scroll effect
    if (navbar) {
      let lastScroll = 0;
      window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        if (currentScroll > 60) {
          DOM.addClass(navbar, 'scrolled');
        } else {
          DOM.removeClass(navbar, 'scrolled');
        }
        lastScroll = currentScroll;
      }, { passive: true });
    }
  },

  open: (toggle, menu) => {
    DOM.addClass(menu, 'open');
    DOM.addClass(toggle, 'open');
    DOM.setAttr(toggle, 'aria-expanded', 'true');
  },

  close: (toggle, menu) => {
    DOM.removeClass(menu, 'open');
    DOM.removeClass(toggle, 'open');
    DOM.setAttr(toggle, 'aria-expanded', 'false');
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Nav.init());
} else {
  Nav.init();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Nav;
}
