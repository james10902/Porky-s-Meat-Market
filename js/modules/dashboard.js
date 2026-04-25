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
    // Admins have their own dashboard — redirect them away
    if (Dashboard.currentUser && Dashboard.currentUser.role === 'admin') {
      window.location.href = '/pages/admin.html';
      return;
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

  /* ── TABS ── */
  _setupTabs: () => {
    document.querySelectorAll('.sidebar-link').forEach(function(link) {
      link.addEventListener('click', function() {
        Dashboard.switchTab(link.getAttribute('data-tab'));
      });
    });
  },

  switchTab: async (tabName) => {
    document.querySelectorAll('.tab-content').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.sidebar-link').forEach(function(l) { l.classList.remove('active'); });
    var tab  = document.getElementById(tabName + '-tab');
    var link = document.querySelector('[data-tab="' + tabName + '"]');
    if (tab)  tab.classList.add('active');
    if (link) link.classList.add('active');
    if (tabName === 'orders')  await Dashboard.loadOrders();
    if (tabName === 'history') await Dashboard.loadHistory();
    if (tabName === 'account') Dashboard._setupProfilePic();
  },

  /* ── STATUS HELPERS ── */
  _statusLabel: function(s) {
    return { PENDING:'Order Placed', CONFIRMED:'Confirmed', IN_COLD_STORAGE:'In Cold Storage', OUT_FOR_DELIVERY:'Out for Delivery', DELIVERED:'Delivered', CANCELLED:'Cancelled' }[s] || s;
  },
  _statusClass: function(s) {
    return { PENDING:'pending', CONFIRMED:'confirmed', IN_COLD_STORAGE:'processing', OUT_FOR_DELIVERY:'processing', DELIVERED:'completed', CANCELLED:'cancelled' }[s] || 'pending';
  },
  _paymentLabel: function(s) {
    return { PAID:'✅ Paid', PENDING:'⏳ Pending', AWAITING:'🏦 Awaiting Payment', FAILED:'❌ Failed', REFUNDED:'↩️ Refunded' }[s] || s || '';
  },
  _paymentClass: function(s) {
    return { PAID:'completed', PENDING:'pending', AWAITING:'processing', FAILED:'cancelled', REFUNDED:'processing' }[s] || 'pending';
  },

  /* ── LOCAL FALLBACK ── */
  _getLocalOrders: function() {
    try { return JSON.parse(localStorage.getItem('porky_orders') || '[]'); } catch (e) { return []; }
  },
  _normalise: function(o) {
    return {
      id: o.id,
      order_number: o.order_number || o.id,
      created_at: o.created_at || o.date,
      status: o.status || 'PENDING',
      payment_status: o.payment_status || (o.paymentMethod === 'card' ? 'PAID' : 'PENDING'),
      payment_method: o.payment_method || o.paymentMethod || 'cod',
      total: o.total || (o.totals ? o.totals.total : 0),
      delivery_type: o.delivery_type || (o.delivery ? o.delivery.deliveryType : 'delivery'),
      items: (o.items || []).map(function(i) {
        return { name: i.name, quantity: i.quantity, price: i.price, img: i.image || i.image_url || '/assets/Images/Gallery.jpg' };
      })
    };
  },

  /* ── MY ORDERS ── */
  loadOrders: async function() {
    var container = document.getElementById('orders-container');
    var loading   = document.getElementById('orders-loading');
    if (!container) return;
    if (loading) loading.style.display = 'flex';
    container.innerHTML = '';

    var orders = [];
    var hasToken = !!(typeof API !== 'undefined' && API.token);
    if (hasToken) {
      try {
        orders = await API.orders.getAll();
        Dashboard._orders = orders;
      } catch (err) {
        orders = Dashboard._getLocalOrders().map(Dashboard._normalise);
        Dashboard._orders = orders;
      }
    } else {
      orders = Dashboard._getLocalOrders().map(Dashboard._normalise);
      Dashboard._orders = orders;
    }

    if (loading) loading.style.display = 'none';

    if (!orders.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">📦</div><h3>No orders yet</h3><p>Your orders will appear here once you place one.</p><a href="/pages/products.html" class="btn btn-quote">Start Shopping</a></div>';
      return;
    }
    container.innerHTML = orders.map(function(o) { return Dashboard._renderOrderCard(o); }).join('');
  },

  _renderOrderCard: function(o) {
    var items   = o.items || [];
    var orderId = o.order_number || o.id;
    var date    = new Date(o.created_at || o.date).toLocaleDateString('en-NA', { day:'numeric', month:'short', year:'numeric' });
    var total   = 'N$' + parseFloat(o.total || 0).toFixed(2);
    var paymentMade = ['PAID','REFUNDED'].includes(o.payment_status);
    var canCancel   = ['PENDING','CONFIRMED'].includes(o.status) && !paymentMade;

    var thumbs = items.slice(0, 3).map(function(i) {
      return '<img src="' + (i.image_url || i.img || '/assets/Images/Gallery.jpg') + '" alt="' + (i.name||'') + '" class="order-item-thumb" onerror="this.src=\'/assets/Images/Gallery.jpg\'">';
    }).join('') + (items.length > 3 ? '<span class="order-item-more">+' + (items.length - 3) + '</span>' : '');

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

  cancelOrder: async function(uuid, orderNumber) {
    if (!confirm('Cancel order ' + orderNumber + '? This cannot be undone.')) return;
    var hasToken = !!(typeof API !== 'undefined' && API.token);
    if (hasToken) {
      try {
        await API.orders.cancel(uuid);
        Dashboard.showToast('Order ' + orderNumber + ' cancelled.', 'success');
        await Dashboard.loadOrders();
        return;
      } catch (err) { /* fall through */ }
    }
    try {
      var local = Dashboard._getLocalOrders();
      var idx = local.findIndex(function(o) { return o.id === uuid || o.order_number === uuid || o.id === orderNumber; });
      if (idx !== -1) { local[idx].status = 'CANCELLED'; localStorage.setItem('porky_orders', JSON.stringify(local)); }
      Dashboard.showToast('Order ' + orderNumber + ' cancelled.', 'success');
      await Dashboard.loadOrders();
    } catch (e) {
      Dashboard.showToast('Could not cancel order.', 'error');
    }
  },

  /* ── TRACK ORDER ── */
  trackOrderById: function(orderId) {
    Dashboard.switchTab('tracking');
    var input = document.getElementById('tracking-id');
    if (input) input.value = orderId;
    Dashboard.showTracking();
  },

  showTracking: async function() {
    var input    = document.getElementById('tracking-id');
    var query    = (input ? input.value.trim() : '').toUpperCase();
    var resultEl = document.getElementById('tracking-result');
    var emptyEl  = document.getElementById('tracking-empty');

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

    var match = null;
    var hasToken = !!(typeof API !== 'undefined' && API.token);
    if (hasToken) {
      try {
        var apiOrders = await API.orders.getAll();
        match = apiOrders.find(function(o) {
          return (o.order_number || '').toUpperCase() === query || String(o.id).toUpperCase() === query;
        });
        if (match) {
          try {
            var trackData = await API.orders.track(match.id);
            resultEl.innerHTML = Dashboard._renderTracking(trackData, match);
            return;
          } catch (e) { /* fall through */ }
        }
      } catch (e) { /* API unavailable */ }
    }

    if (!match) {
      var localOrders = Dashboard._getLocalOrders().map(Dashboard._normalise);
      match = localOrders.find(function(o) {
        return (o.order_number || '').toUpperCase() === query || String(o.id).toUpperCase() === query;
      });
    }

    if (!match) {
      resultEl.innerHTML = '<div class="tracking-not-found">'
        + '<p>No order found with reference <strong>' + query + '</strong>.</p>'
        + '<p>Check your confirmation email or <a href="#" onclick="Dashboard.switchTab(\'orders\');return false;">My Orders</a>.</p>'
        + '</div>';
      return;
    }

    var syntheticTrack = Dashboard._buildTrackingFromStatus(match);
    resultEl.innerHTML = Dashboard._renderTracking(syntheticTrack, match);
  },

  _buildTrackingFromStatus: function(order) {
    var statusOrder = ['PENDING','CONFIRMED','IN_COLD_STORAGE','OUT_FOR_DELIVERY','DELIVERED'];
    var currentIdx  = statusOrder.indexOf(order.status);
    var steps = [
      { label: 'Order Placed',     key: 'PENDING' },
      { label: 'Order Confirmed',  key: 'CONFIRMED' },
      { label: 'In Cold Storage',  key: 'IN_COLD_STORAGE' },
      { label: 'Out for Delivery', key: 'OUT_FOR_DELIVERY' },
      { label: 'Delivered',        key: 'DELIVERED' }
    ].map(function(s, i) {
      return { label: s.label, completed: order.status === 'CANCELLED' ? false : i <= currentIdx };
    });
    return { order: order, steps: steps };
  },

  _renderTracking: function(trackData, order) {
    var steps   = trackData.steps || [];
    var o       = trackData.order || order;
    var orderId = o.order_number || o.id;
    var date    = new Date(o.created_at || o.date).toLocaleDateString('en-NA', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
    var icons   = ['📋','✅','❄️','🚚','🏠'];
    var done    = steps.filter(function(s) { return s.completed; }).length;
    var pct     = Math.round((done / Math.max(steps.length, 1)) * 100);

    var stepsHtml = steps.map(function(s, i) {
      return '<div class="track-step ' + (s.completed ? 'active' : '') + '">'
        + '<div class="track-step-icon">' + (icons[i] || '•') + '</div>'
        + '<div class="track-step-info">'
        + '<div class="track-step-label">' + s.label + '</div>'
        + '<div class="track-step-sub">' + (s.completed ? 'Completed' : 'Pending') + '</div>'
        + '</div></div>';
    }).join('');

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

  /* ── ORDER HISTORY ── */
  loadHistory: async function() {
    var container = document.getElementById('history-container');
    var loading   = document.getElementById('history-loading');
    if (!container) return;
    if (loading) loading.style.display = 'flex';
    container.innerHTML = '';

    var allOrders = [];
    var hasToken = !!(typeof API !== 'undefined' && API.token);
    if (hasToken) {
      try {
        allOrders = await API.orders.getAll();
      } catch (err) {
        allOrders = Dashboard._getLocalOrders().map(Dashboard._normalise);
      }
    } else {
      allOrders = Dashboard._getLocalOrders().map(Dashboard._normalise);
    }

    if (loading) loading.style.display = 'none';

    if (!allOrders.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><h3>No order history yet</h3><p>Your orders will appear here once you place one.</p><a href="/pages/products.html" class="btn btn-quote">Start Shopping</a></div>';
      return;
    }

    var html = '<table class="history-table"><thead><tr>'
      + '<th>Order Ref</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th></th>'
      + '</tr></thead><tbody>';

    allOrders.forEach(function(o) {
      var orderId   = o.order_number || o.id;
      var date      = new Date(o.created_at || o.date).toLocaleDateString('en-NA', { day:'numeric', month:'short', year:'numeric' });
      var canDelete = ['DELIVERED','CANCELLED'].includes(o.status);
      html += '<tr>'
        + '<td class="history-order-id">' + orderId + '</td>'
        + '<td>' + date + '</td>'
        + '<td>' + (o.items||[]).length + '</td>'
        + '<td style="font-weight:600;">N$' + parseFloat(o.total||0).toFixed(2) + '</td>'
        + '<td><span class="order-status ' + Dashboard._paymentClass(o.payment_status) + '">' + Dashboard._paymentLabel(o.payment_status) + '</span></td>'
        + '<td><span class="order-status ' + Dashboard._statusClass(o.status) + '">' + Dashboard._statusLabel(o.status) + '</span></td>'
        + '<td>' + (canDelete ? '<button onclick="Dashboard.deleteOrder(\'' + (o.id||orderId) + '\',\'' + orderId + '\')" class="btn-icon-delete" title="Remove from history">🗑</button>' : '') + '</td>'
        + '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  },

  deleteOrder: async function(uuid, orderNumber) {
    if (!confirm('Remove order ' + orderNumber + ' from your history?')) return;
    try {
      var local = Dashboard._getLocalOrders().filter(function(o) { return o.id !== uuid && o.id !== orderNumber; });
      localStorage.setItem('porky_orders', JSON.stringify(local));
      Dashboard.showToast('Order removed from history.', 'success');
      await Dashboard.loadHistory();
    } catch (e) {
      Dashboard.showToast('Could not remove order.', 'error');
    }
  },

  clearHistory: async function() {
    if (!confirm('Remove all completed and cancelled orders from your history? This cannot be undone.')) return;
    try {
      var local = Dashboard._getLocalOrders().filter(function(o) { return !['DELIVERED','CANCELLED'].includes(o.status); });
      localStorage.setItem('porky_orders', JSON.stringify(local));
      Dashboard.showToast('History cleared.', 'success');
      await Dashboard.loadHistory();
    } catch (e) {
      Dashboard.showToast('Could not clear history.', 'error');
    }
  },

  /* ── ACCOUNT FORM ── */
  _setupAccountForm: function() {
    var form = document.getElementById('account-form');
    if (!form) return;

    var u = Dashboard.currentUser;
    if (u) {
      var set = function(id, val) { var el = document.getElementById(id); if (el && val) el.value = val; };
      set('account-firstname', u.firstname);
      set('account-lastname',  u.lastname);
      set('account-email',     u.email);
      set('account-phone',     u.phone);
    }

    Dashboard._setupProfilePic();

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      var btn = form.querySelector('[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
      var msgEl = document.getElementById('account-msg');

      try {
        var data = {
          firstname: (document.getElementById('account-firstname') || {}).value || '',
          lastname:  (document.getElementById('account-lastname')  || {}).value || '',
          phone:     (document.getElementById('account-phone')     || {}).value || ''
        };
        if (typeof Auth !== 'undefined') {
          var session = Auth.getCurrentUser();
          if (session) {
            Object.assign(session, data);
            Auth._saveSession(session);
            Auth.updateNavUI();
          }
        }
        if (msgEl) { msgEl.style.display = 'flex'; setTimeout(function() { msgEl.style.display = 'none'; }, 3000); }
      } catch (err) {
        Dashboard.showToast('Could not save profile. Please try again.', 'error');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'SAVE CHANGES'; }
      }
    });
  },

  /* ── PROFILE PICTURE ── */
  _setupProfilePic: function() {
    var avatarEl  = document.getElementById('profile-pic-avatar');
    var input     = document.getElementById('profile-pic-input');
    var editBtn   = document.getElementById('profile-pic-edit-btn');
    var removeBtn = document.getElementById('profile-pic-remove');
    if (!avatarEl || !input) return;

    var STORAGE_KEY = 'porky_avatar';

    var _loadAvatar = function() {
      try {
        var saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          Dashboard._setAvatarImg(avatarEl, saved);
        } else {
          var u = Dashboard.currentUser;
          var initials = ((u && u.firstname ? u.firstname[0] : '') + (u && u.lastname ? u.lastname[0] : '')).toUpperCase() || '👤';
          avatarEl.innerHTML = '';
          avatarEl.textContent = initials;
        }
      } catch (e) {
        avatarEl.textContent = '👤';
      }
    };
    _loadAvatar();

    var newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);

    if (editBtn) {
      var newEditBtn = editBtn.cloneNode(true);
      editBtn.parentNode.replaceChild(newEditBtn, editBtn);
      newEditBtn.addEventListener('click', function() { newInput.click(); });
    }

    var uploadBtn = document.querySelector('[onclick*="profile-pic-input"]');
    if (uploadBtn) {
      uploadBtn.onclick = null;
      uploadBtn.addEventListener('click', function() { newInput.click(); });
    }

    newInput.addEventListener('change', function() {
      var file = newInput.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { Dashboard.showToast('Image must be under 2MB.', 'error'); return; }
      if (!file.type.startsWith('image/')) { Dashboard.showToast('Please select an image file.', 'error'); return; }

      var reader = new FileReader();
      reader.onload = function(evt) {
        var dataUrl = evt.target.result;
        try { localStorage.setItem(STORAGE_KEY, dataUrl); } catch (storageErr) {
          try { localStorage.removeItem(STORAGE_KEY); localStorage.setItem(STORAGE_KEY, dataUrl); }
          catch (e2) { Dashboard.showToast('Storage full. Try a smaller image.', 'error'); return; }
        }
        Dashboard._setAvatarImg(avatarEl, dataUrl);
        try { var s = Auth.getCurrentUser(); if (s) { s.avatar = dataUrl; Auth._saveSession(s); } } catch (e) {}
        try { Auth.updateNavUI(); } catch (e) {}
        Dashboard.showToast('Profile photo updated!', 'success');
      };
      reader.onerror = function() { Dashboard.showToast('Could not read image file.', 'error'); };
      reader.readAsDataURL(file);
    });

    if (removeBtn) {
      var newRemoveBtn = removeBtn.cloneNode(true);
      removeBtn.parentNode.replaceChild(newRemoveBtn, removeBtn);
      newRemoveBtn.addEventListener('click', function() {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        var u = Dashboard.currentUser;
        var initials = ((u && u.firstname ? u.firstname[0] : '') + (u && u.lastname ? u.lastname[0] : '')).toUpperCase() || '👤';
        avatarEl.innerHTML = '';
        avatarEl.textContent = initials;
        try { var s = Auth.getCurrentUser(); if (s) { delete s.avatar; Auth._saveSession(s); } } catch (e) {}
        try { Auth.updateNavUI(); } catch (e) {}
        Dashboard.showToast('Profile photo removed.', 'success');
      });
    }
  },

  _setAvatarImg: function(el, src) {
    el.innerHTML = '';
    var img = document.createElement('img');
    img.src = src;
    img.alt = 'Profile photo';
    img.onerror = function() { el.textContent = '👤'; };
    el.appendChild(img);
  },

  _setupLogout: function() {
    var btn = document.getElementById('logout-btn');
    if (btn) btn.addEventListener('click', function() {
      if (typeof Auth !== 'undefined') Auth.logout(); else window.location.href = '/';
    });
  },

  /* ── TOAST NOTIFICATIONS ── */
  showToast: function(msg, type) {
    var toast = document.createElement('div');
    toast.className = 'dashboard-toast ' + (type || 'info');
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(function() { toast.classList.add('show'); });
    setTimeout(function() { toast.classList.remove('show'); setTimeout(function() { toast.remove(); }, 300); }, 3500);
  }
};

document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('dashboard-main')) Dashboard.init();
});

if (typeof module !== 'undefined' && module.exports) module.exports = Dashboard;
