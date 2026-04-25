/**
 * Dashboard Module — Full order management, tracking, history, account
 */

const Dashboard = {
  currentUser: null,
  _orders: [],

  init: async () => {
    if (typeof Auth !== 'undefined') {
      Dashboard.currentUser = Auth.getCurrentUser ? Auth.getCurrentUser() : null;
    }
    if (!Dashboard.currentUser) {
      window.location.href = '/pages/login.html?return=/pages/dashboard.html';
      return;
    }
    Dashboard._setGreeting();
    Dashboard._setupTabs();
    Dashboard._setupAccountForm();
    Dashboard._setupLogout();
    const hash = window.location.hash.replace('#', '');
    Dashboard.switchTab(['orders','tracking','history','account'].includes(hash) ? hash : 'orders');
  },

  _setGreeting: () => {
    const el = DOM.byId('user-greeting');
    if (!el || !Dashboard.currentUser) return;
    const h = new Date().getHours();
    const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    el.textContent = g + ', ' + (Dashboard.currentUser.firstname || 'there') + '!';
  },

  /* ── TABS ─────────────────────────────────────────────────────────── */
  _setupTabs: () => {
    document.querySelectorAll('.sidebar-link').forEach(link => {
      DOM.on(link, 'click', () => Dashboard.switchTab(DOM.getAttr(link, 'data-tab')));
    });
  },

  switchTab: async (tabName) => {
    document.querySelectorAll('.tab-content').forEach(t => DOM.removeClass(t, 'active'));
    document.querySelectorAll('.sidebar-link').forEach(l => DOM.removeClass(l, 'active'));
    const tab  = DOM.byId(tabName + '-tab');
    const link = document.querySelector('[data-tab="' + tabName + '"]');
    if (tab)  DOM.addClass(tab,  'active');
    if (link) DOM.addClass(link, 'active');
    if (tabName === 'orders')  await Dashboard.loadOrders();
    if (tabName === 'history') await Dashboard.loadHistory();
    // Re-init profile pic every time account tab is shown
    if (tabName === 'account') Dashboard._setupProfilePic();
  },

  /* ── STATUS HELPERS ───────────────────────────────────────────────── */
  _statusLabel: s => ({ PENDING:'Order Placed', CONFIRMED:'Confirmed', IN_COLD_STORAGE:'In Cold Storage', OUT_FOR_DELIVERY:'Out for Delivery', DELIVERED:'Delivered', CANCELLED:'Cancelled' }[s] || s),
  _statusClass: s => ({ PENDING:'pending', CONFIRMED:'confirmed', IN_COLD_STORAGE:'processing', OUT_FOR_DELIVERY:'processing', DELIVERED:'completed', CANCELLED:'cancelled' }[s] || 'pending'),
  _paymentLabel: s => ({ PAID:'✅ Paid', PENDING:'⏳ Pending', AWAITING:'🏦 Awaiting Payment', FAILED:'❌ Failed', REFUNDED:'↩️ Refunded' }[s] || s || ''),
  _paymentClass: s => ({ PAID:'completed', PENDING:'pending', AWAITING:'processing', FAILED:'cancelled', REFUNDED:'processing' }[s] || 'pending'),

  /* ── LOCAL FALLBACK ───────────────────────────────────────────────── */
  _getLocalOrders: () => {
    try { return JSON.parse(localStorage.getItem('porky_orders') || '[]'); } catch (e) { return []; }
  },
  _normalise: o => ({
    id: o.id, order_number: o.id, created_at: o.date, status: o.status || 'PENDING',
    payment_status: o.paymentMethod === 'card' ? 'PAID' : 'PENDING',
    payment_method: o.paymentMethod || 'cod', total: o.totals ? o.totals.total : 0,
    items: (o.items || []).map(i => ({ name: i.name, quantity: i.quantity, price: i.price, img: i.image || '/assets/Images/Gallery.jpg' }))
  }),

  /* ── MY ORDERS ────────────────────────────────────────────────────── */
  loadOrders: async () => {
    const container = DOM.byId('orders-container');
    const loading   = DOM.byId('orders-loading');
    if (!container) return;
    if (loading) loading.style.display = 'flex';
    container.innerHTML = '';

    let orders = [];
    try {
      orders = await API.orders.getAll();
      Dashboard._orders = orders;
    } catch (err) {
      console.warn('API unavailable, using local data');
      orders = Dashboard._getLocalOrders().map(Dashboard._normalise);
      Dashboard._orders = orders;
    }

    if (loading) loading.style.display = 'none';

    if (!orders.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">📦</div><h3>No orders yet</h3><p>Your orders will appear here once you place one.</p><a href="/pages/products.html" class="btn btn-quote">Start Shopping</a></div>';
      return;
    }
    container.innerHTML = orders.map(o => Dashboard._renderOrderCard(o)).join('');
  },

  _renderOrderCard: o => {
    const items    = o.items || [];
    const orderId  = o.order_number || o.id;
    const date     = new Date(o.created_at || o.date).toLocaleDateString('en-NA', { day:'numeric', month:'short', year:'numeric' });
    const total    = 'N$' + parseFloat(o.total || 0).toFixed(2);
    // Cancel only if status allows AND payment has NOT been made
    const paymentMade = ['PAID', 'REFUNDED'].includes(o.payment_status);
    const canCancel   = ['PENDING', 'CONFIRMED'].includes(o.status) && !paymentMade;

    const thumbs = items.slice(0, 3).map(i =>
      '<img src="' + (i.image_url || i.img || '/assets/Images/Gallery.jpg') + '" alt="' + (i.name||'') + '" class="order-item-thumb" onerror="this.src=\'/assets/Images/Gallery.jpg\'">'
    ).join('') + (items.length > 3 ? '<span class="order-item-more">+' + (items.length - 3) + '</span>' : '');

    return '<div class="order-card" id="order-' + orderId + '">'
      + '<div class="order-card-header">'
      + '<div class="order-card-id">' + orderId + '</div>'
      + '<div class="order-card-badges">'
      + '<span class="order-status ' + Dashboard._statusClass(o.status) + '">' + Dashboard._statusLabel(o.status) + '</span>'
      + (o.payment_status ? '<span class="order-status ' + Dashboard._paymentClass(o.payment_status) + '">' + Dashboard._paymentLabel(o.payment_status) + '</span>' : '')
      + '</div></div>'
      + '<div class="order-card-body">'
      + '<div class="order-item-thumbs">' + thumbs + '</div>'
      + '<div class="order-card-meta">'
      + '<div class="order-meta-row"><span>Date</span><strong>' + date + '</strong></div>'
      + '<div class="order-meta-row"><span>Items</span><strong>' + items.length + '</strong></div>'
      + '<div class="order-meta-row"><span>Total</span><strong class="order-total">' + total + '</strong></div>'
      + '<div class="order-meta-row"><span>Payment</span><strong>' + (o.payment_method || '—').replace(/_/g,' ') + '</strong></div>'
      + '</div></div>'
      + '<div class="order-card-actions">'
      + '<button onclick="Dashboard.trackOrderById(\'' + orderId + '\')" class="btn btn-secondary btn-sm">🚚 Track</button>'
      + (canCancel ? '<button onclick="Dashboard.cancelOrder(\'' + (o.id||orderId) + '\',\'' + orderId + '\')" class="btn btn-danger btn-sm">✕ Cancel</button>' : '')
      + '</div></div>';
  },

  cancelOrder: async (uuid, orderNumber) => {
    if (!confirm('Cancel order ' + orderNumber + '? This cannot be undone.')) return;
    try {
      await API.orders.cancel(uuid);
      Dashboard.showToast('Order ' + orderNumber + ' cancelled.', 'success');
      await Dashboard.loadOrders();
    } catch (err) {
      Dashboard.showToast(err.message || 'Could not cancel order.', 'error');
    }
  },

  /* ── TRACK ORDER ──────────────────────────────────────────────────── */
  trackOrderById: orderId => {
    Dashboard.switchTab('tracking');
    const input = DOM.byId('tracking-id');
    if (input) input.value = orderId;
    Dashboard.showTracking();
  },

  showTracking: async () => {
    const input    = DOM.byId('tracking-id');
    const query    = (input ? input.value.trim() : '').toUpperCase();
    const resultEl = DOM.byId('tracking-result');
    const emptyEl  = DOM.byId('tracking-empty');

    if (!query) {
      if (resultEl) resultEl.style.display = 'none';
      if (emptyEl)  emptyEl.style.display  = 'block';
      return;
    }

    if (resultEl) {
      resultEl.innerHTML = '<div class="tab-loading"><div class="spinner"></div><span>Looking up order…</span></div>';
      resultEl.style.display = 'block';
    }
    if (emptyEl) emptyEl.style.display = 'none';

    // Try API first, fall back to localStorage
    let match = null;
    try {
      const apiOrders = await API.orders.getAll();
      match = apiOrders.find(o =>
        (o.order_number || '').toUpperCase() === query ||
        String(o.id).toUpperCase() === query
      );
      if (match) {
        try {
          const trackData = await API.orders.track(match.id);
          resultEl.innerHTML = Dashboard._renderTracking(trackData, match);
          return;
        } catch (e) { /* fall through to local render */ }
      }
    } catch (e) { /* API unavailable */ }

    // Fall back to localStorage
    if (!match) {
      const localOrders = Dashboard._getLocalOrders().map(Dashboard._normalise);
      match = localOrders.find(o =>
        (o.order_number || '').toUpperCase() === query ||
        String(o.id).toUpperCase() === query
      );
    }

    if (!match) {
      resultEl.innerHTML = '<div class="tracking-not-found">'
        + '<p>No order found with reference <strong>' + query + '</strong>.</p>'
        + '<p>Check your confirmation email or <a href="#" onclick="Dashboard.switchTab(\'orders\');return false;">My Orders</a>.</p>'
        + '</div>';
      return;
    }

    // Generate tracking steps from order status
    const syntheticTrack = Dashboard._buildTrackingFromStatus(match);
    resultEl.innerHTML = Dashboard._renderTracking(syntheticTrack, match);
  },

  /* Build tracking steps from order status when API is unavailable */
  _buildTrackingFromStatus: (order) => {
    const statusOrder = ['PENDING', 'CONFIRMED', 'IN_COLD_STORAGE', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const currentIdx  = statusOrder.indexOf(order.status);
    const steps = [
      { label: 'Order Placed',      key: 'PENDING' },
      { label: 'Order Confirmed',   key: 'CONFIRMED' },
      { label: 'In Cold Storage',   key: 'IN_COLD_STORAGE' },
      { label: 'Out for Delivery',  key: 'OUT_FOR_DELIVERY' },
      { label: 'Delivered',         key: 'DELIVERED' }
    ].map((s, i) => ({
      label:     s.label,
      completed: order.status === 'CANCELLED' ? false : i <= currentIdx
    }));
    return { order, steps };
  },

  _renderTracking: (trackData, order) => {
    const steps   = trackData.steps || [];
    const o       = trackData.order || order;
    const orderId = o.order_number || o.id;
    const date    = new Date(o.created_at || o.date).toLocaleDateString('en-NA', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
    const icons   = ['📋','✅','❄️','🚚','🏠'];
    const done    = steps.filter(s => s.completed).length;
    const pct     = Math.round((done / Math.max(steps.length, 1)) * 100);

    const stepsHtml = steps.map((s, i) =>
      '<div class="track-step ' + (s.completed ? 'active' : '') + '">'
      + '<div class="track-step-icon">' + (icons[i] || '•') + '</div>'
      + '<div class="track-step-info">'
      + '<div class="track-step-label">' + s.label + '</div>'
      + '<div class="track-step-sub">' + (s.completed ? 'Completed' : 'Pending') + '</div>'
      + '</div></div>'
    ).join('');

    return '<div class="tracking-card">'
      + '<div class="tracking-card-header">'
      + '<div><div class="tracking-order-id">' + orderId + '</div><div class="tracking-date">Placed ' + date + '</div></div>'
      + '<span class="order-status ' + Dashboard._statusClass(o.status) + '">' + Dashboard._statusLabel(o.status) + '</span>'
      + '</div>'
      + '<div class="tracking-progress-bar"><div class="tracking-progress-fill" style="width:' + pct + '%"></div></div>'
      + '<div class="tracking-steps">' + stepsHtml + '</div>'
      + '<div class="tracking-meta">'
      + '<div class="order-meta-row"><span>Delivery</span><strong>' + (o.delivery_type === 'pickup' ? 'Collect In-Store' : 'Home Delivery') + '</strong></div>'
      + '<div class="order-meta-row"><span>Payment</span><strong>' + Dashboard._paymentLabel(o.payment_status) + '</strong></div>'
      + '</div></div>';
  },

  /* ── ORDER HISTORY ────────────────────────────────────────────────── */
  loadHistory: async () => {
    const container = DOM.byId('history-container');
    const loading   = DOM.byId('history-loading');
    if (!container) return;
    if (loading) loading.style.display = 'flex';
    container.innerHTML = '';

    let allOrders = [];
    try {
      allOrders = await API.orders.getAll();
    } catch (err) {
      allOrders = Dashboard._getLocalOrders().map(Dashboard._normalise);
    }

    if (loading) loading.style.display = 'none';

    // History tab shows ALL orders so users can see everything they've placed
    const orders = allOrders;

    if (!orders.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><h3>No order history yet</h3><p>Your orders will appear here once you place one.</p><a href="/pages/products.html" class="btn btn-quote">Start Shopping</a></div>';
      return;
    }

    let html = '<table class="history-table"><thead><tr>'
      + '<th>Order Ref</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th></th>'
      + '</tr></thead><tbody>';

    orders.forEach(o => {
      const orderId   = o.order_number || o.id;
      const date      = new Date(o.created_at || o.date).toLocaleDateString('en-NA', { day:'numeric', month:'short', year:'numeric' });
      const canDelete = ['DELIVERED','CANCELLED'].includes(o.status);
      html += '<tr>'
        + '<td class="history-order-id">' + orderId + '</td>'
        + '<td>' + date + '</td>'
        + '<td>' + (o.items||[]).length + '</td>'
        + '<td style="font-weight:600;">N$' + parseFloat(o.total||0).toFixed(2) + '</td>'
        + '<td><span class="order-status ' + Dashboard._paymentClass(o.payment_status) + '">' + Dashboard._paymentLabel(o.payment_status) + '</span></td>'
        + '<td><span class="order-status ' + Dashboard._statusClass(o.status) + '">' + Dashboard._statusLabel(o.status) + '</span></td>'
        + '<td>' + (canDelete ? '<button onclick="Dashboard.deleteOrder(\'' + (o.id||orderId) + '\',\'' + orderId + '\')" class="btn-icon-delete" title="Remove from history">🗑</button>' : '') + '</td>'
        + '</tr>';
    });$' + parseFloat(o.total||0).toFixed(2) + '</td>'
        + '<td><span class="order-status ' + Dashboard._paymentClass(o.payment_status) + '">' + Dashboard._paymentLabel(o.payment_status) + '</span></td>'
        + '<td><span class="order-status ' + Dashboard._statusClass(o.status) + '">' + Dashboard._statusLabel(o.status) + '</span></td>'
        + '<td>' + (canDelete ? '<button onclick="Dashboard.deleteOrder(\'' + (o.id||orderId) + '\',\'' + orderId + '\')" class="btn-icon-delete" title="Remove from history">🗑</button>' : '') + '</td>'
        + '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  },

  deleteOrder: async (uuid, orderNumber) => {
    if (!confirm('Remove order ' + orderNumber + ' from your history?')) return;
    try {
      await API.orders.deleteOne(uuid);
      Dashboard.showToast('Order removed from history.', 'success');
      await Dashboard.loadHistory();
    } catch (err) {
      // Fallback: remove from localStorage
      try {
        const local = Dashboard._getLocalOrders().filter(o => o.id !== uuid && o.id !== orderNumber);
        localStorage.setItem('porky_orders', JSON.stringify(local));
        Dashboard.showToast('Order removed from history.', 'success');
        await Dashboard.loadHistory();
      } catch (e) {
        Dashboard.showToast('Could not remove order.', 'error');
      }
    }
  },

  clearHistory: async () => {
    if (!confirm('Remove all completed and cancelled orders from your history? This cannot be undone.')) return;
    try {
      await API.orders.clearHistory();
      Dashboard.showToast('History cleared.', 'success');
      await Dashboard.loadHistory();
    } catch (err) {
      // Fallback: clear localStorage
      try {
        const local = Dashboard._getLocalOrders().filter(o => !['DELIVERED','CANCELLED'].includes(o.status));
        localStorage.setItem('porky_orders', JSON.stringify(local));
        Dashboard.showToast('History cleared.', 'success');
        await Dashboard.loadHistory();
      } catch (e) {
        Dashboard.showToast('Could not clear history.', 'error');
      }
    }
  },

  /* ── ACCOUNT FORM ─────────────────────────────────────────────────── */
  _setupAccountForm: () => {
    const form = DOM.byId('account-form');
    if (!form) return;

    const u = Dashboard.currentUser;
    if (u) {
      const set = (id, val) => { const el = DOM.byId(id); if (el && val) el.value = val; };
      set('account-firstname', u.firstname);
      set('account-lastname',  u.lastname);
      set('account-email',     u.email);
      set('account-phone',     u.phone);
    }

    // Profile picture
    Dashboard._setupProfilePic();

    DOM.on(form, 'submit', async e => {
      e.preventDefault();
      const btn = form.querySelector('[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
      const msgEl = DOM.byId('account-msg');

      try {
        const data = {
          firstname: (DOM.byId('account-firstname') || {}).value || '',
          lastname:  (DOM.byId('account-lastname')  || {}).value || '',
          phone:     (DOM.byId('account-phone')     || {}).value || ''
        };
        // Try API, fall back to localStorage session update
        try {
          await API.auth.updateProfile(data);
        } catch (apiErr) {
          // API unavailable — update session locally only
          console.warn('Profile API unavailable, saving locally');
        }
        // Always update local session
        if (typeof Auth !== 'undefined') {
          const session = Auth.getCurrentUser();
          if (session) {
            Object.assign(session, data);
            Auth._saveSession(session);
            Auth.updateNavUI();
          }
        }
        if (msgEl) { msgEl.style.display = 'flex'; setTimeout(() => { msgEl.style.display = 'none'; }, 3000); }
      } catch (err) {
        Dashboard.showToast('Could not save profile. Please try again.', 'error');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'SAVE CHANGES'; }
      }
    });
  },

  /* ── PROFILE PICTURE ──────────────────────────────────────────────── */
  _setupProfilePic: () => {
    const avatarEl  = DOM.byId('profile-pic-avatar');
    const input     = DOM.byId('profile-pic-input');
    const editBtn   = DOM.byId('profile-pic-edit-btn');
    const removeBtn = DOM.byId('profile-pic-remove');
    if (!avatarEl || !input) return;

    const STORAGE_KEY = 'porky_avatar';

    // ── Load saved avatar ──
    const _loadAvatar = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          Dashboard._setAvatarImg(avatarEl, saved);
        } else {
          const u = Dashboard.currentUser;
          const initials = ((u?.firstname || '')[0] || '') + ((u?.lastname || '')[0] || '');
          avatarEl.innerHTML = '';
          avatarEl.textContent = initials.toUpperCase() || '👤';
        }
      } catch (e) {
        avatarEl.textContent = '👤';
      }
    };
    _loadAvatar();

    // ── Prevent duplicate listeners by cloning the input ──
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);

    // ── Edit button triggers file picker ──
    if (editBtn) {
      const newEditBtn = editBtn.cloneNode(true);
      editBtn.parentNode.replaceChild(newEditBtn, editBtn);
      newEditBtn.addEventListener('click', () => newInput.click());
    }

    // ── Upload button also triggers file picker ──
    const uploadBtn = document.querySelector('[onclick*="profile-pic-input"]');
    if (uploadBtn) {
      uploadBtn.onclick = null;
      uploadBtn.addEventListener('click', () => newInput.click());
    }

    // ── File selected ──
    newInput.addEventListener('change', () => {
      const file = newInput.files[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        Dashboard.showToast('Image must be under 2MB.', 'error');
        return;
      }

      if (!file.type.startsWith('image/')) {
        Dashboard.showToast('Please select an image file.', 'error');
        return;
      }

      const reader = new FileReader();

      reader.onload = (evt) => {
        const dataUrl = evt.target.result;
        try {
          localStorage.setItem(STORAGE_KEY, dataUrl);
        } catch (storageErr) {
          // localStorage full — try to clear old data and retry
          try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.setItem(STORAGE_KEY, dataUrl);
          } catch (e2) {
            Dashboard.showToast('Storage full. Try a smaller image.', 'error');
            return;
          }
        }
        Dashboard._setAvatarImg(avatarEl, dataUrl);
        // Persist to session
        try {
          const session = Auth.getCurrentUser();
          if (session) { session.avatar = dataUrl; Auth._saveSession(session); }
        } catch (e) {}
        // Refresh nav profile picture
        try { Auth.updateNavUI(); } catch (e) {}
        Dashboard.showToast('Profile photo updated!', 'success');
      };

      reader.onerror = () => {
        Dashboard.showToast('Could not read image file.', 'error');
      };

      reader.readAsDataURL(file);
    });

    // ── Remove photo ──
    if (removeBtn) {
      const newRemoveBtn = removeBtn.cloneNode(true);
      removeBtn.parentNode.replaceChild(newRemoveBtn, removeBtn);
      newRemoveBtn.addEventListener('click', () => {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        const u = Dashboard.currentUser;
        const initials = ((u?.firstname || '')[0] || '') + ((u?.lastname || '')[0] || '');
        avatarEl.innerHTML = '';
        avatarEl.textContent = initials.toUpperCase() || '👤';
        try {
          const session = Auth.getCurrentUser();
          if (session) { delete session.avatar; Auth._saveSession(session); }
        } catch (e) {}
        try { Auth.updateNavUI(); } catch (e) {}
        Dashboard.showToast('Profile photo removed.', 'success');
      });
    }
  },

  _setAvatarImg: (el, src) => {
    el.innerHTML = '';
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Profile photo';
    img.onerror = () => { el.textContent = '👤'; };
    el.appendChild(img);
  },

  _setupLogout: () => {
    const btn = DOM.byId('logout-btn');
    if (btn) DOM.on(btn, 'click', () => { if (typeof Auth !== 'undefined') Auth.logout(); else window.location.href = '/'; });
  },

  /* ── TOAST NOTIFICATIONS ──────────────────────────────────────────── */
  showToast: (msg, type) => {
    const toast = document.createElement('div');
    toast.className = 'dashboard-toast ' + (type || 'info');
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3500);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { if (DOM.byId('dashboard-main')) Dashboard.init(); });
} else {
  if (DOM.byId('dashboard-main')) Dashboard.init();
}

if (typeof module !== 'undefined' && module.exports) module.exports = Dashboard;
