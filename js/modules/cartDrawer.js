/**
 * Cart Drawer Module
 * Handles the slide-out cart UI — open/close, rendering items, updating totals
 */

const CartDrawer = {
  init: () => {
    const toggleBtn  = DOM.byId('cart-toggle');
    const closeBtn   = DOM.byId('cart-close');
    const overlay    = DOM.byId('cart-overlay');
    const clearBtn   = DOM.byId('cart-clear');

    if (!toggleBtn) return; // page doesn't have a cart drawer

    DOM.on(toggleBtn, 'click', CartDrawer.open);
    DOM.on(closeBtn,  'click', CartDrawer.close);
    DOM.on(overlay,   'click', CartDrawer.close);
    if (clearBtn) DOM.on(clearBtn, 'click', () => { Cart.clear(); CartDrawer.render(); });

    // Close on Escape
    DOM.on(document, 'keydown', (e) => {
      if (e.key === 'Escape') CartDrawer.close();
    });

    // Re-render whenever cart changes
    window.addEventListener('cart:updated',    () => CartDrawer.render());
    window.addEventListener('cart:itemAdded',  () => CartDrawer.render());
    window.addEventListener('cart:itemRemoved',() => CartDrawer.render());
    window.addEventListener('cart:cartCleared',() => CartDrawer.render());

    // Initial render (picks up persisted cart)
    CartDrawer.render();
  },

  open: () => {
    const drawer  = DOM.byId('cart-drawer');
    const overlay = DOM.byId('cart-overlay');
    DOM.addClass(drawer,  'open');
    DOM.addClass(overlay, 'open');
    DOM.setAttr(overlay, 'aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  },

  close: () => {
    const drawer  = DOM.byId('cart-drawer');
    const overlay = DOM.byId('cart-overlay');
    DOM.removeClass(drawer,  'open');
    DOM.removeClass(overlay, 'open');
    DOM.setAttr(overlay, 'aria-hidden', 'true');
    document.body.style.overflow = '';
  },

  /* Checkout — require login here, not at add-to-cart */
  _handleCheckout: () => {
    if (typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
      CartDrawer.close();
      window.location.href = '/pages/login.html?return=' + encodeURIComponent('/pages/checkout.html');
      return;
    }
    window.location.href = '/pages/checkout.html';
  },

  render: () => {
    const items      = Cart.getItems();
    const totals     = Cart.getTotals();
    const list       = DOM.byId('cart-items-list');
    const emptyEl    = DOM.byId('cart-empty');
    const footerEl   = DOM.byId('cart-footer');
    const badge      = DOM.query('[data-cart-count]');

    if (!list) return;

    // Update badge
    if (badge) {
      const count = totals.itemCount;
      DOM.setText(badge, count);
      badge.style.display = count > 0 ? 'flex' : 'none';

      // Bump animation
      DOM.addClass(badge, 'bump');
      setTimeout(() => DOM.removeClass(badge, 'bump'), 300);
    }

    if (items.length === 0) {
      if (emptyEl)  emptyEl.style.display  = 'flex';
      if (footerEl) footerEl.style.display = 'none';
      // Clear any rendered items (keep empty state)
      const existingItems = list.querySelectorAll('.cart-item');
      existingItems.forEach(el => el.remove());
      return;
    }

    if (emptyEl)  emptyEl.style.display  = 'none';
    if (footerEl) footerEl.style.display = 'block';

    // Render items
    list.innerHTML = '';
    if (emptyEl) list.appendChild(emptyEl); // keep in DOM but hidden

    items.forEach(item => {
      const el = CartDrawer.renderItem(item);
      list.appendChild(el);
    });

    // Update totals
    const subtotalEl = DOM.byId('cart-subtotal');
    const taxEl      = DOM.byId('cart-tax');
    const totalEl    = DOM.byId('cart-total');

    if (subtotalEl) DOM.setText(subtotalEl, totals.formattedSubtotal);
    if (taxEl)      DOM.setText(taxEl,      totals.formattedTax);
    if (totalEl)    DOM.setText(totalEl,    totals.formattedTotal);
  },

  renderItem: (item) => {
    const el = DOM.create('div', 'cart-item');
    el.innerHTML = `
      <img
        src="${item.image || '/assets/Images/Gallery.jpg'}"
        alt="${DOM.sanitizeHTML(item.name)}"
        class="cart-item-img"
        loading="lazy"
        onerror="this.src='/assets/Images/Gallery.jpg'"
      >
      <div class="cart-item-details">
        <div class="cart-item-name">${DOM.sanitizeHTML(item.name)}</div>
        <div class="cart-item-price">N$${(item.price * item.quantity).toFixed(2)}</div>
        <div class="cart-item-controls">
          <button class="qty-btn" data-action="dec" data-id="${item.id}" aria-label="Decrease quantity">−</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn" data-action="inc" data-id="${item.id}" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <button class="cart-item-remove" data-id="${item.id}" aria-label="Remove ${DOM.sanitizeHTML(item.name)}">✕</button>
    `;

    // Quantity controls
    el.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id     = parseInt(btn.dataset.id, 10);
        const action = btn.dataset.action;
        const current = Cart.getItem(id);
        if (!current) return;
        Cart.updateItem(id, action === 'inc' ? current.quantity + 1 : current.quantity - 1);
        CartDrawer.render();
      });
    });

    // Remove button
    const removeBtn = el.querySelector('.cart-item-remove');
    removeBtn.addEventListener('click', () => {
      Cart.removeItem(parseInt(removeBtn.dataset.id, 10));
      CartDrawer.render();
    });

    return el;
  }
};

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => CartDrawer.init());
} else {
  CartDrawer.init();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CartDrawer;
}
