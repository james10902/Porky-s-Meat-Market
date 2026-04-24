/**
 * DOM Utility Functions
 * Helper functions for common DOM operations
 */

const DOM = {
  /**
   * Select element by ID
   */
  byId: (id) => document.getElementById(id),

  /**
   * Select elements by class
   */
  byClass: (className) => document.querySelectorAll(`.${className}`),

  /**
   * Select elements by CSS selector
   */
  query: (selector) => document.querySelector(selector),

  /**
   * Select all elements by CSS selector
   */
  queryAll: (selector) => document.querySelectorAll(selector),

  /**
   * Create element with optional classes
   */
  create: (tag, classes = '', innerHTML = '') => {
    const el = document.createElement(tag);
    if (classes) el.className = classes;
    if (innerHTML) el.innerHTML = innerHTML;
    return el;
  },

  /**
   * Add event listener
   */
  on: (element, event, handler) => {
    if (element) {
      element.addEventListener(event, handler);
    }
  },

  /**
   * Remove event listener
   */
  off: (element, event, handler) => {
    if (element) {
      element.removeEventListener(event, handler);
    }
  },

  /**
   * Add class to element
   */
  addClass: (element, className) => {
    if (element) element.classList.add(className);
  },

  /**
   * Remove class from element
   */
  removeClass: (element, className) => {
    if (element) element.classList.remove(className);
  },

  /**
   * Toggle class on element
   */
  toggleClass: (element, className) => {
    if (element) element.classList.toggle(className);
  },

  /**
   * Check if element has class
   */
  hasClass: (element, className) => {
    return element ? element.classList.contains(className) : false;
  },

  /**
   * Set element attributes
   */
  setAttr: (element, attrName, value) => {
    if (element) element.setAttribute(attrName, value);
  },

  /**
   * Get element attributes
   */
  getAttr: (element, attrName) => {
    return element ? element.getAttribute(attrName) : null;
  },

  /**
   * Set element data attributes
   */
  setData: (element, dataKey, value) => {
    if (element) element.dataset[dataKey] = value;
  },

  /**
   * Get element data attributes
   */
  getData: (element, dataKey) => {
    return element ? element.dataset[dataKey] : null;
  },

  /**
   * Set element text content
   */
  setText: (element, text) => {
    if (element) element.textContent = text;
  },

  /**
   * Get element text content
   */
  getText: (element) => {
    return element ? element.textContent : '';
  },

  /**
   * Set element HTML content
   */
  setHTML: (element, html) => {
    if (element) element.innerHTML = html;
  },

  /**
   * Get element HTML content
   */
  getHTML: (element) => {
    return element ? element.innerHTML : '';
  },

  /**
   * Append child to element
   */
  append: (parent, child) => {
    if (parent && child) parent.appendChild(child);
  },

  /**
   * Clear element content
   */
  clear: (element) => {
    if (element) element.innerHTML = '';
  },

  /**
   * Remove element from DOM
   */
  remove: (element) => {
    if (element && element.parentNode) element.parentNode.removeChild(element);
  },

  /**
   * Show element
   */
  show: (element) => {
    if (element) element.style.display = '';
  },

  /**
   * Hide element
   */
  hide: (element) => {
    if (element) element.style.display = 'none';
  },

  /**
   * Toggle element visibility
   */
  toggle: (element) => {
    if (element) {
      element.style.display = element.style.display === 'none' ? '' : 'none';
    }
  },

  /**
   * Check if element is visible
   */
  isVisible: (element) => {
    return element ? element.style.display !== 'none' : false;
  },

  /**
   * Delegate event to child elements
   */
  delegate: (parent, event, selector, handler) => {
    if (parent) {
      parent.addEventListener(event, (e) => {
        if (e.target.matches(selector)) {
          handler.call(e.target, e);
        }
      });
    }
  },

  /**
   * Scroll element into view
   */
  scrollIntoView: (element) => {
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  },

  /**
   * Get element position
   */
  getPosition: (element) => {
    if (!element) return null;
    return element.getBoundingClientRect();
  },

  /**
   * Check if element is in viewport
   */
  isInViewport: (element) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  /**
   * Disable element
   */
  disable: (element) => {
    if (element) element.disabled = true;
  },

  /**
   * Enable element
   */
  enable: (element) => {
    if (element) element.disabled = false;
  },

  /**
   * Get form data as object
   */
  getFormData: (form) => {
    if (!form) return {};
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });
    return data;
  },

  /**
   * Set form data from object
   */
  setFormData: (form, data) => {
    if (!form || !data) return;
    Object.keys(data).forEach((key) => {
      const input = form.elements[key];
      if (input) input.value = data[key];
    });
  },

  /**
   * Validate email
   */
  isValidEmail: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  /**
   * Sanitize HTML string to prevent XSS
   */
  sanitizeHTML: (html) => {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOM;
}
