/**
 * Cart Module
 * Manages shopping cart functionality with localStorage persistence
 */

const Cart = {
  STORAGE_KEY: 'porky_cart',

  init: () => {
    try {
      const data = localStorage.getItem(Cart.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  getItems: () => Cart.init(),

  getItem: (productId) => Cart.init().find(item => item.id === productId),

  addItem: (product, quantity = 1) => {
    const items = Cart.init();
    const existing = items.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({
        id:       product.id,
        name:     product.name,
        price:    product.price,
        unit:     product.unit || 'per kg',
        image:    product.image_url || product.image || '',
        category: product.category || '',
        quantity: quantity
      });
    }
    Cart.save(items);
    Cart.emit('itemAdded', { product, quantity });
    return items;
  },

  updateItem: (productId, quantity) => {
    if (quantity <= 0) return Cart.removeItem(productId);
    const items = Cart.init();
    const item = items.find(i => i.id === productId);
    if (item) {
      item.quantity = quantity;
      Cart.save(items);
      Cart.emit('itemUpdated', { productId, quantity });
    }
    return items;
  },

  removeItem: (productId) => {
    const filtered = Cart.init().filter(item => item.id !== productId);
    Cart.save(filtered);
    Cart.emit('itemRemoved', { productId });
    return filtered;
  },

  clear: () => {
    Cart.save([]);
    Cart.emit('cartCleared', {});
  },

  getTotals: () => {
    const items    = Cart.init();
    const itemCount = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal  = items.reduce((s, i) => s + (i.price * i.quantity), 0);
    const tax       = subtotal * 0.15;
    const total     = subtotal + tax;
    return {
      itemCount,
      subtotal,
      tax,
      total,
      formattedSubtotal: 'N$' + subtotal.toFixed(2),
      formattedTax:      'N$' + tax.toFixed(2),
      formattedTotal:    'N$' + total.toFixed(2)
    };
  },

  hasItem:      (id) => Cart.init().some(i => i.id === id),
  getItemCount: ()   => Cart.init().reduce((s, i) => s + i.quantity, 0),

  save: (items) => {
    try { localStorage.setItem(Cart.STORAGE_KEY, JSON.stringify(items)); } catch (e) {}
  },

  listeners: {},

  on: (event, cb) => {
    if (!Cart.listeners[event]) Cart.listeners[event] = [];
    Cart.listeners[event].push(cb);
  },

  off: (event, cb) => {
    if (Cart.listeners[event])
      Cart.listeners[event] = Cart.listeners[event].filter(fn => fn !== cb);
  },

  emit: (event, data) => {
    (Cart.listeners[event] || []).forEach(cb => cb(data));
    window.dispatchEvent(new CustomEvent('cart:' + event, { detail: data }));
  }
};

// Keep badge in sync
const _syncCartBadge = () => {
  const totals = Cart.getTotals();
  const badge  = document.querySelector('[data-cart-count]');
  if (badge) badge.textContent = totals.itemCount;
  Cart.emit('updated', { items: Cart.getItems(), totals });
};

Cart.on('itemAdded',   _syncCartBadge);
Cart.on('itemUpdated', _syncCartBadge);
Cart.on('itemRemoved', _syncCartBadge);
Cart.on('cartCleared', _syncCartBadge);

if (typeof module !== 'undefined' && module.exports) module.exports = Cart;
