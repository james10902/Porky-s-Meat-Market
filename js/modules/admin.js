/**
 * Admin Module — Owner dashboard
 * Requires admin role. Accessed at /pages/admin.html
 */

const Admin = {
  _ordersPage: 1,
  _searchTimer: null,

  init: async () => {
    // Check auth
    const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    if (!user) { window.location.href = '/pages/login.html?return=/pages/admin.html'; return; }
    if (user.role !== 'admin') {
      document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:1rem;font-family:sans-serif;background:#0a0a0a;color:#F0EDE8;">'
        + '<div style="font-size:3rem;">🔒</div>'
        + '<h2>Admin Access Required</h2>'
        + '<p style="color:#9A9590;">Your account does not have admin privileges.</p>'
        + '<a href="/" style="color:#F5A623;">← Back to site</a>'
        + '</div>';
      return;
    }

    const nameEl = document.getElementById('admin-user-name');
    if (nameEl) nameEl.textContent = user.firstname + ' ' + user.lastname;

    await Admin.loadOverview();
    await Admin.loadUnreadCount();
  },

  logout: () => { if (typeof Auth !== 'undefined') Auth.logout(); else window.location.href = '/'; },

  /* ── SECTION SWITCHING ────────────────────────────────────────────── */
  showSection: async (name, btn) => {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
    const section = document.getElementById('section-' + name);
    if (section) section.classList.add('active');
    if (btn) btn.classList.add('active');

    if (name === 'overview')  await Admin.loadOverview();
    if (name === 'orders')    await Admin.loadOrders();
    if (name === 'users')     await Admin.loadUsers();
    if (name === 'messages')  await Admin.loadMessages();
    if (name === 'wholesale') await Admin.loadWholesale();
  },

  /* ── HELPERS ──────────────────────────────────────────────────────── */
  _fmt: n => 'N$' + parseFloat(n || 0).toLocaleString('en-NA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  _date: d => new Date(d).toLocaleDateString('en-NA', { day:'numeric', month:'short', year:'numeric' }),
  _datetime: d => new Date(d).toLocaleDateString('en-NA', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }),

  _statusBadge: (s, type) => {
    const map = {
      order: { PENDING:'pending', CONFIRMED:'confirmed', IN_COLD_STORAGE:'processing', OUT_FOR_DELIVERY:'processing', DELIVERED:'completed', CANCELLED:'cancelled' },
      payment: { PAID:'completed', PENDING:'pending', AWAITING:'processing', FAILED:'cancelled' },
      quote: { NEW:'pending', CONTACTED:'processing', QUOTED:'confirmed', CLOSED:'completed' }
    };
    const cls = (map[type] || map.order)[s] || 'pending';
    return '<span class="order-status ' + cls + '">' + s.replace(/_/g,' ') + '</span>';
  },

  _toast: (msg, type) => {
    const t = document.createElement('div');
    t.className = 'admin-toast ' + (type || 'info');
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
  },

  /* ── OVERVIEW ─────────────────────────────────────────────────────── */
  loadOverview: async () => {
    try {
      const data = await API.request('/admin/dashboard');

      // Stats cards
      const statsEl = document.getElementById('stats-grid');
      if (statsEl) {
        const o = data.orders || {};
        const u = data.users  || {};
        const p = data.products || {};
        statsEl.innerHTML = [
          { icon:'📦', label:'Total Orders',    value: o.total || 0,        sub: (o.pending||0) + ' pending' },
          { icon:'💰', label:'Total Revenue',   value: Admin._fmt(data.revenue?.total_revenue), sub: Admin._fmt(data.revenue?.revenue_30d) + ' this month' },
          { icon:'👥', label:'Customers',       value: u.total || 0,        sub: (u.new_30d||0) + ' new this month' },
          { icon:'🥩', label:'Active Products', value: p.total || 0,        sub: (p.out_of_stock||0) + ' out of stock' }
        ].map(s =>
          '<div class="stat-card">'
          + '<div class="stat-card-icon">' + s.icon + '</div>'
          + '<div class="stat-card-body">'
          + '<div class="stat-card-value">' + s.value + '</div>'
          + '<div class="stat-card-label">' + s.label + '</div>'
          + '<div class="stat-card-sub">' + s.sub + '</div>'
          + '</div></div>'
        ).join('');
      }

      // Revenue cards
      const revEl = document.getElementById('revenue-grid');
      if (revEl && data.revenue) {
        const r = data.revenue;
        revEl.innerHTML = [
          { label:'Revenue (7 days)',  value: Admin._fmt(r.revenue_7d) },
          { label:'Revenue (30 days)', value: Admin._fmt(r.revenue_30d) },
          { label:'All-time Revenue',  value: Admin._fmt(r.total_revenue) }
        ].map(c =>
          '<div class="revenue-card"><div class="revenue-value">' + c.value + '</div><div class="revenue-label">' + c.label + '</div></div>'
        ).join('');
      }

      // Recent orders table
      const recentEl = document.getElementById('recent-orders-table');
      if (recentEl && data.recent_orders) {
        recentEl.innerHTML = Admin._buildOrdersTable(data.recent_orders, false);
      }

      // Status breakdown
      const breakdownEl = document.getElementById('status-breakdown');
      if (breakdownEl && data.status_breakdown) {
        const total = data.status_breakdown.reduce((s, r) => s + parseInt(r.count), 0);
        breakdownEl.innerHTML = data.status_breakdown.map(r => {
          const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
          return '<div class="breakdown-row">'
            + '<div class="breakdown-label">' + Admin._statusBadge(r.status, 'order') + '</div>'
            + '<div class="breakdown-bar-wrap"><div class="breakdown-bar" style="width:' + pct + '%"></div></div>'
            + '<div class="breakdown-count">' + r.count + ' (' + pct + '%)</div>'
            + '</div>';
        }).join('');
      }
    } catch (err) {
      console.error('Overview error:', err.message);
      Admin._toast('Could not load overview data.', 'error');
    }
  },

  loadUnreadCount: async () => {
    try {
      const data = await API.request('/admin/contact?unread=true&limit=1');
      const badge = document.getElementById('unread-badge');
      if (badge && data.pagination && data.pagination.total > 0) {
        badge.textContent = data.pagination.total;
        badge.style.display = 'inline-flex';
      }
    } catch (e) {}
  },

  /* ── ORDERS ───────────────────────────────────────────────────────── */
  loadOrders: async (page) => {
    if (page) Admin._ordersPage = page;
    const container = document.getElementById('orders-table-container');
    const statusFilter = (document.getElementById('order-status-filter') || {}).value || '';
    if (container) container.innerHTML = '<div class="admin-loading"><div class="spinner"></div></div>';

    try {
      const params = new URLSearchParams({ page: Admin._ordersPage, limit: 20 });
      if (statusFilter) params.set('status', statusFilter);
      const data = await API.request('/admin/orders/all?' + params.toString());

      if (container) container.innerHTML = Admin._buildOrdersTable(data.orders, true);

      // Pagination
      const pgEl = document.getElementById('orders-pagination');
      if (pgEl && data.pagination) {
        const { total, page: pg, limit } = data.pagination;
        const pages = Math.ceil(total / limit);
        if (pages > 1) {
          let html = '<div class="admin-pag">';
          if (pg > 1) html += '<button onclick="Admin.loadOrders(' + (pg-1) + ')" class="btn btn-secondary btn-sm">← Prev</button>';
          html += '<span>Page ' + pg + ' of ' + pages + ' (' + total + ' orders)</span>';
          if (pg < pages) html += '<button onclick="Admin.loadOrders(' + (pg+1) + ')" class="btn btn-secondary btn-sm">Next →</button>';
          html += '</div>';
          pgEl.innerHTML = html;
        } else {
          pgEl.innerHTML = '<div class="admin-pag"><span>' + total + ' order(s)</span></div>';
        }
      }
    } catch (err) {
      if (container) container.innerHTML = '<div class="admin-error">Could not load orders: ' + err.message + '</div>';
    }
  },

  _buildOrdersTable: (orders, showActions) => {
    if (!orders || !orders.length) return '<div class="admin-empty">No orders found.</div>';
    let html = '<table class="admin-table"><thead><tr>'
      + '<th>Order Ref</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th>'
      + (showActions ? '<th>Actions</th>' : '')
      + '</tr></thead><tbody>';
    orders.forEach(o => {
      const name = o.firstname ? o.firstname + ' ' + o.lastname : '—';
      html += '<tr>'
        + '<td class="admin-order-id">' + (o.order_number || o.id) + '</td>'
        + '<td><div>' + name + '</div><div class="admin-sub">' + (o.user_email || o.email || '') + '</div></td>'
        + '<td>' + Admin._datetime(o.created_at) + '</td>'
        + '<td style="font-weight:600;">' + Admin._fmt(o.total) + '</td>'
        + '<td>' + Admin._statusBadge(o.payment_status || 'PENDING', 'payment') + '</td>'
        + '<td>' + Admin._statusBadge(o.status, 'order') + '</td>'
        + (showActions ? '<td><div class="admin-actions">'
          + '<button onclick="Admin.viewOrder(\'' + o.id + '\')" class="btn btn-secondary btn-sm">View</button>'
          + '<select onchange="Admin.updateOrderStatus(\'' + o.id + '\', this.value, this)" class="admin-status-select">'
          + ['PENDING','CONFIRMED','IN_COLD_STORAGE','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'].map(s =>
              '<option value="' + s + '"' + (s === o.status ? ' selected' : '') + '>' + s.replace(/_/g,' ') + '</option>'
            ).join('')
          + '</select>'
          + '</div></td>' : '')
        + '</tr>';
    });
    html += '</tbody></table>';
    return html;
  },

  viewOrder: async (orderId) => {
    const overlay = document.getElementById('order-modal-overlay');
    const modal   = document.getElementById('order-modal');
    const body    = document.getElementById('modal-body');
    const title   = document.getElementById('modal-title');
    if (!modal) return;

    body.innerHTML = '<div class="admin-loading"><div class="spinner"></div></div>';
    overlay.classList.add('active');
    modal.classList.add('active');

    try {
      const o = await API.request('/orders/' + orderId);
      title.textContent = 'Order ' + (o.order_number || o.id);

      const items = (o.items || []).map(i =>
        '<tr><td>' + i.name + '</td><td>' + i.quantity + '</td><td>' + Admin._fmt(i.price) + '</td><td>' + Admin._fmt(i.subtotal) + '</td></tr>'
      ).join('');

      body.innerHTML = '<div class="modal-grid">'
        + '<div class="modal-section"><h4>Order Info</h4>'
        + '<div class="modal-row"><span>Reference</span><strong>' + (o.order_number||o.id) + '</strong></div>'
        + '<div class="modal-row"><span>Date</span><strong>' + Admin._datetime(o.created_at) + '</strong></div>'
        + '<div class="modal-row"><span>Status</span>' + Admin._statusBadge(o.status, 'order') + '</div>'
        + '<div class="modal-row"><span>Payment</span>' + Admin._statusBadge(o.payment_status||'PENDING', 'payment') + '</div>'
        + '<div class="modal-row"><span>Method</span><strong>' + (o.payment_method||'—').replace(/_/g,' ') + '</strong></div>'
        + '<div class="modal-row"><span>Delivery</span><strong>' + (o.delivery_type === 'pickup' ? 'Collect In-Store' : 'Home Delivery') + '</strong></div>'
        + '</div>'
        + '<div class="modal-section"><h4>Customer</h4>'
        + '<div class="modal-row"><span>Name</span><strong>' + (o.d_firstname||'') + ' ' + (o.d_lastname||'') + '</strong></div>'
        + '<div class="modal-row"><span>Email</span><strong>' + (o.d_email||'—') + '</strong></div>'
        + '<div class="modal-row"><span>Phone</span><strong>' + (o.d_phone||'—') + '</strong></div>'
        + (o.d_address ? '<div class="modal-row"><span>Address</span><strong>' + o.d_address + (o.d_suburb?', '+o.d_suburb:'') + ', ' + (o.d_city||'Windhoek') + '</strong></div>' : '')
        + '</div></div>'
        + '<div class="modal-section"><h4>Items</h4>'
        + '<table class="admin-table"><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead><tbody>' + items + '</tbody></table>'
        + '</div>'
        + '<div class="modal-totals">'
        + '<div class="modal-row"><span>Subtotal</span><strong>' + Admin._fmt(o.subtotal) + '</strong></div>'
        + '<div class="modal-row"><span>VAT (15%)</span><strong>' + Admin._fmt(o.tax) + '</strong></div>'
        + '<div class="modal-row"><span>Delivery</span><strong>' + (parseFloat(o.delivery_fee||0) === 0 ? 'Free' : Admin._fmt(o.delivery_fee)) + '</strong></div>'
        + '<div class="modal-row total"><span>Total</span><strong>' + Admin._fmt(o.total) + '</strong></div>'
        + '</div>';
    } catch (err) {
      body.innerHTML = '<div class="admin-error">Could not load order details.</div>';
    }
  },

  closeModal: () => {
    document.getElementById('order-modal-overlay').classList.remove('active');
    document.getElementById('order-modal').classList.remove('active');
  },

  updateOrderStatus: async (orderId, status, selectEl) => {
    try {
      await API.patch('/orders/' + orderId + '/status', { status });
      Admin._toast('Order status updated to ' + status.replace(/_/g,' ') + '.', 'success');
    } catch (err) {
      Admin._toast('Could not update status: ' + err.message, 'error');
      await Admin.loadOrders();
    }
  },

  /* ── CUSTOMERS ────────────────────────────────────────────────────── */
  loadUsers: async () => {
    const container = document.getElementById('users-table-container');
    const search    = (document.getElementById('user-search') || {}).value || '';
    if (container) container.innerHTML = '<div class="admin-loading"><div class="spinner"></div></div>';

    try {
      const params = new URLSearchParams({ limit: 50 });
      if (search) params.set('search', search);
      const data = await API.request('/admin/users?' + params.toString());

      if (!data.users || !data.users.length) {
        container.innerHTML = '<div class="admin-empty">No customers found.</div>';
        return;
      }

      let html = '<table class="admin-table"><thead><tr>'
        + '<th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Orders</th><th>Joined</th><th>Status</th><th>Actions</th>'
        + '</tr></thead><tbody>';

      data.users.forEach(u => {
        html += '<tr>'
          + '<td><strong>' + u.firstname + ' ' + u.lastname + '</strong></td>'
          + '<td>' + u.email + '</td>'
          + '<td>' + (u.phone || '—') + '</td>'
          + '<td>' + Admin._statusBadge(u.role.toUpperCase(), 'order') + '</td>'
          + '<td style="text-align:center;">' + (u.order_count || 0) + '</td>'
          + '<td>' + Admin._date(u.created_at) + '</td>'
          + '<td>' + (u.is_active ? '<span class="order-status completed">Active</span>' : '<span class="order-status cancelled">Disabled</span>') + '</td>'
          + '<td><div class="admin-actions">'
          + '<select onchange="Admin.changeUserRole(\'' + u.id + '\', this.value)" class="admin-status-select">'
          + ['customer','admin','wholesale'].map(r => '<option value="' + r + '"' + (r === u.role ? ' selected' : '') + '>' + r + '</option>').join('')
          + '</select>'
          + '<button onclick="Admin.toggleUser(\'' + u.id + '\',' + !u.is_active + ')" class="btn btn-sm ' + (u.is_active ? 'btn-danger' : 'btn-secondary') + '">'
          + (u.is_active ? 'Disable' : 'Enable') + '</button>'
          + '</div></td>'
          + '</tr>';
      });

      html += '</tbody></table><div class="admin-pag"><span>' + data.pagination.total + ' customer(s)</span></div>';
      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = '<div class="admin-error">Could not load customers: ' + err.message + '</div>';
    }
  },

  searchUsers: () => {
    clearTimeout(Admin._searchTimer);
    Admin._searchTimer = setTimeout(Admin.loadUsers, 400);
  },

  changeUserRole: async (userId, role) => {
    try {
      await API.patch('/admin/users/' + userId + '/role', { role });
      Admin._toast('Role updated to ' + role + '.', 'success');
    } catch (err) {
      Admin._toast('Could not update role.', 'error');
    }
  },

  toggleUser: async (userId, isActive) => {
    try {
      await API.patch('/admin/users/' + userId + '/active', { is_active: isActive });
      Admin._toast('User ' + (isActive ? 'enabled' : 'disabled') + '.', 'success');
      await Admin.loadUsers();
    } catch (err) {
      Admin._toast('Could not update user.', 'error');
    }
  },

  /* ── MESSAGES ─────────────────────────────────────────────────────── */
  loadMessages: async () => {
    const container = document.getElementById('messages-container');
    const unreadOnly = (document.getElementById('unread-only') || {}).checked;
    if (container) container.innerHTML = '<div class="admin-loading"><div class="spinner"></div></div>';

    try {
      const params = new URLSearchParams({ limit: 50 });
      if (unreadOnly) params.set('unread', 'true');
      const data = await API.request('/admin/contact?' + params.toString());

      if (!data.messages || !data.messages.length) {
        container.innerHTML = '<div class="admin-empty">No messages found.</div>';
        return;
      }

      container.innerHTML = data.messages.map(m =>
        '<div class="message-card ' + (m.is_read ? '' : 'unread') + '" id="msg-' + m.id + '">'
        + '<div class="message-header">'
        + '<div><strong>' + m.name + '</strong> <span class="admin-sub">' + m.email + '</span></div>'
        + '<div class="message-meta">'
        + Admin._datetime(m.created_at)
        + (!m.is_read ? '<span class="unread-dot"></span>' : '')
        + '</div>'
        + '</div>'
        + (m.subject ? '<div class="message-subject">' + m.subject + '</div>' : '')
        + '<div class="message-body">' + m.message + '</div>'
        + '<div class="message-actions">'
        + '<a href="mailto:' + m.email + '?subject=Re: ' + (m.subject||'Your enquiry') + '" class="btn btn-quote btn-sm">↩ Reply</a>'
        + (!m.is_read ? '<button onclick="Admin.markRead(' + m.id + ')" class="btn btn-secondary btn-sm">Mark Read</button>' : '')
        + '</div>'
        + '</div>'
      ).join('');
    } catch (err) {
      container.innerHTML = '<div class="admin-error">Could not load messages: ' + err.message + '</div>';
    }
  },

  markRead: async (id) => {
    try {
      await API.patch('/admin/contact/' + id + '/read', {});
      const el = document.getElementById('msg-' + id);
      if (el) el.classList.remove('unread');
      Admin._toast('Message marked as read.', 'success');
      await Admin.loadUnreadCount();
    } catch (err) {
      Admin._toast('Could not update message.', 'error');
    }
  },

  /* ── WHOLESALE ────────────────────────────────────────────────────── */
  loadWholesale: async () => {
    const container = document.getElementById('wholesale-container');
    const status    = (document.getElementById('quote-status-filter') || {}).value || '';
    if (container) container.innerHTML = '<div class="admin-loading"><div class="spinner"></div></div>';

    try {
      const params = new URLSearchParams({ limit: 50 });
      if (status) params.set('status', status);
      const data = await API.request('/admin/wholesale?' + params.toString());

      if (!data.quotes || !data.quotes.length) {
        container.innerHTML = '<div class="admin-empty">No quote requests found.</div>';
        return;
      }

      container.innerHTML = data.quotes.map(q =>
        '<div class="quote-card">'
        + '<div class="quote-header">'
        + '<div><strong>' + q.business_name + '</strong> <span class="admin-sub">' + q.business_type + '</span></div>'
        + '<div class="quote-meta">'
        + Admin._statusBadge(q.status, 'quote')
        + '<span class="admin-sub">' + Admin._datetime(q.created_at) + '</span>'
        + '</div>'
        + '</div>'
        + '<div class="quote-body">'
        + '<div class="quote-row"><span>Contact</span><strong>' + q.contact_person + '</strong></div>'
        + '<div class="quote-row"><span>Email</span><a href="mailto:' + q.email + '">' + q.email + '</a></div>'
        + '<div class="quote-row"><span>Phone</span><strong>' + q.phone + '</strong></div>'
        + '<div class="quote-row"><span>Location</span><strong>' + (q.delivery_location||'—') + '</strong></div>'
        + '<div class="quote-row full"><span>Products</span><strong>' + (q.product_interests||'—') + '</strong></div>'
        + (q.additional_info ? '<div class="quote-row full"><span>Notes</span><strong>' + q.additional_info + '</strong></div>' : '')
        + '</div>'
        + '<div class="quote-actions">'
        + '<a href="mailto:' + q.email + '?subject=Re: Wholesale Quote Request — Porky\'s Meat Market" class="btn btn-quote btn-sm">↩ Reply</a>'
        + '<select onchange="Admin.updateQuoteStatus(' + q.id + ', this.value)" class="admin-status-select">'
        + ['NEW','CONTACTED','QUOTED','CLOSED'].map(s => '<option value="' + s + '"' + (s === q.status ? ' selected' : '') + '>' + s + '</option>').join('')
        + '</select>'
        + '</div>'
        + '</div>'
      ).join('');
    } catch (err) {
      container.innerHTML = '<div class="admin-error">Could not load quotes: ' + err.message + '</div>';
    }
  },

  updateQuoteStatus: async (id, status) => {
    try {
      await API.patch('/admin/wholesale/' + id + '/status', { status });
      Admin._toast('Quote status updated to ' + status + '.', 'success');
    } catch (err) {
      Admin._toast('Could not update quote.', 'error');
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', Admin.init);
} else {
  Admin.init();
}
