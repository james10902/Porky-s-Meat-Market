/**
 * Admin Module — Owner Dashboard
 * Runs entirely from localStorage — no backend required.
 */

const Admin = {
  _ordersPage:   1,
  _searchTimer:  null,
  _ordersFilter: '',

  /* ── DATA HELPERS ─────────────────────────────────────────────────── */
  _getOrders: () => {
    try { return JSON.parse(localStorage.getItem('porky_orders') || '[]'); } catch { return []; }
  },
  _saveOrders: (orders) => {
    localStorage.setItem('porky_orders', JSON.stringify(orders));
  },
  _getUsers: () => {
    try { return JSON.parse(localStorage.getItem('porky_users') || '[]'); } catch { return []; }
  },
  _saveUsers: (users) => {
    localStorage.setItem('porky_users', JSON.stringify(users));
  },
  _getMessages: () => {
    try { return JSON.parse(localStorage.getItem('porky_messages') || '[]'); } catch { return []; }
  },
  _saveMessages: (msgs) => {
    localStorage.setItem('porky_messages', JSON.stringify(msgs));
  },
  _getQuotes: () => {
    try { return JSON.parse(localStorage.getItem('porky_wholesale_quotes') || '[]'); } catch { return []; }
  },
  _saveQuotes: (quotes) => {
    localStorage.setItem('porky_wholesale_quotes', JSON.stringify(quotes));
  },

  /* ── INIT ─────────────────────────────────────────────────────────── */
  init: () => {
    const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    if (!user) { window.location.href = '/pages/admin-login.html'; return; }
    if (user.role !== 'admin') { window.location.href = '/pages/admin-login.html'; return; }
    const nameEl = document.getElementById('admin-user-name');
    if (nameEl) nameEl.textContent = user.firstname + ' ' + user.lastname;

    // Admin avatar — initials, or saved photo
    const avatarEl = document.getElementById('admin-avatar');
    if (avatarEl) {
      const savedPhoto = (() => { try { return localStorage.getItem('porky_admin_avatar'); } catch { return null; } })();
      if (savedPhoto) {
        avatarEl.innerHTML = '';
        const img = document.createElement('img');
        img.src = savedPhoto;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
        avatarEl.appendChild(img);
      } else {
        const initials = ((user.firstname?.[0] || '') + (user.lastname?.[0] || '')).toUpperCase() || 'A';
        avatarEl.textContent = initials;
      }
    }

    Admin.loadOverview();
    Admin._updateUnreadBadge();
    Admin._initNotifications();
  },

  logout: () => { if (typeof Auth !== 'undefined') Auth.logout(); else window.location.href = '/'; },

  /* ── SECTION SWITCHING ────────────────────────────────────────────── */
  showSection: (name, btn) => {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
    const section = document.getElementById('section-' + name);
    if (section) section.classList.add('active');
    if (btn) btn.classList.add('active');

    if (name === 'overview')  Admin.loadOverview();
    if (name === 'orders')    Admin.loadOrders();
    if (name === 'users')     Admin.loadUsers();
    if (name === 'messages')  Admin.loadMessages();
    if (name === 'wholesale') Admin.loadWholesale();
    if (name === 'account')   Admin.loadAccount();
  },

  /* ── FORMATTERS ───────────────────────────────────────────────────── */
  _fmt: n => 'N$' + parseFloat(n || 0).toLocaleString('en-NA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  _date: d => new Date(d).toLocaleDateString('en-NA', { day: 'numeric', month: 'short', year: 'numeric' }),
  _datetime: d => new Date(d).toLocaleDateString('en-NA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),

  _statusBadge: (s, type) => {
    const map = {
      order:   { PENDING: 'pending', CONFIRMED: 'confirmed', IN_COLD_STORAGE: 'processing', OUT_FOR_DELIVERY: 'processing', DELIVERED: 'completed', CANCELLED: 'cancelled' },
      payment: { PAID: 'completed', PENDING: 'pending', AWAITING: 'processing', FAILED: 'cancelled' },
      quote:   { NEW: 'pending', CONTACTED: 'processing', QUOTED: 'confirmed', CLOSED: 'completed' }
    };
    const cls = (map[type] || map.order)[s] || 'pending';
    return '<span class="order-status ' + cls + '">' + (s || '').replace(/_/g, ' ') + '</span>';
  },

  _toast: (msg, type) => {
    const t = document.createElement('div');
    t.className = 'admin-toast ' + (type || 'info');
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
  },

  /* ── OVERVIEW ─────────────────────────────────────────────────────── */
  loadOverview: () => {
    const orders  = Admin._getOrders();
    const users   = Admin._getUsers().filter(u => u.role !== 'admin');
    const now     = new Date();
    const day30   = new Date(now - 30 * 864e5);
    const day7    = new Date(now - 7  * 864e5);

    const totalRevenue  = orders.filter(o => o.payment_status === 'PAID').reduce((s, o) => s + parseFloat(o.total || 0), 0);
    const revenue30d    = orders.filter(o => o.payment_status === 'PAID' && new Date(o.created_at || o.date) >= day30).reduce((s, o) => s + parseFloat(o.total || 0), 0);
    const revenue7d     = orders.filter(o => o.payment_status === 'PAID' && new Date(o.created_at || o.date) >= day7).reduce((s, o) => s + parseFloat(o.total || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
    const newUsers30d   = users.filter(u => new Date(u.createdAt || u.created_at) >= day30).length;

    // Stats cards
    const statsEl = document.getElementById('stats-grid');
    if (statsEl) {
      statsEl.innerHTML = [
        { icon: '📦', label: 'Total Orders',    value: orders.length,       sub: pendingOrders + ' pending' },
        { icon: '💰', label: 'Total Revenue',   value: Admin._fmt(totalRevenue), sub: Admin._fmt(revenue30d) + ' this month' },
        { icon: '👥', label: 'Customers',       value: users.length,        sub: newUsers30d + ' new this month' },
        { icon: '🥩', label: 'Unique Products', value: [...new Set(orders.flatMap(o => (o.items || []).map(i => i.id)))].length, sub: 'across all orders' }
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
    if (revEl) {
      revEl.innerHTML = [
        { label: 'Revenue (7 days)',  value: Admin._fmt(revenue7d) },
        { label: 'Revenue (30 days)', value: Admin._fmt(revenue30d) },
        { label: 'All-time Revenue',  value: Admin._fmt(totalRevenue) }
      ].map(c =>
        '<div class="revenue-card"><div class="revenue-value">' + c.value + '</div><div class="revenue-label">' + c.label + '</div></div>'
      ).join('');
    }

    // Recent orders (last 5)
    const recentEl = document.getElementById('recent-orders-table');
    if (recentEl) {
      recentEl.innerHTML = Admin._buildOrdersTable(orders.slice(0, 5), false);
    }

    // Status breakdown
    const breakdownEl = document.getElementById('status-breakdown');
    if (breakdownEl) {
      const statuses = ['PENDING', 'CONFIRMED', 'IN_COLD_STORAGE', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
      const counts   = statuses.map(s => ({ status: s, count: orders.filter(o => o.status === s).length })).filter(r => r.count > 0);
      const total    = orders.length;

      if (!counts.length) {
        breakdownEl.innerHTML = '<div class="admin-empty" style="padding:1.5rem;">No orders yet.</div>';
      } else {
        breakdownEl.innerHTML = counts.map(r => {
          const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
          return '<div class="breakdown-row">'
            + '<div class="breakdown-label">' + Admin._statusBadge(r.status, 'order') + '</div>'
            + '<div class="breakdown-bar-wrap"><div class="breakdown-bar" style="width:' + pct + '%"></div></div>'
            + '<div class="breakdown-count">' + r.count + ' (' + pct + '%)</div>'
            + '</div>';
        }).join('');
      }
    }
  },

  _updateUnreadBadge: () => {
    const msgs   = Admin._getMessages();
    const unread = msgs.filter(m => !m.is_read).length;
    const badge  = document.getElementById('unread-badge');
    if (badge) {
      badge.textContent    = unread;
      badge.style.display  = unread > 0 ? 'inline-flex' : 'none';
    }
  },

  /* ── ORDERS ───────────────────────────────────────────────────────── */
  loadOrders: (page) => {
    if (page) Admin._ordersPage = page;
    const container    = document.getElementById('orders-table-container');
    const statusFilter = (document.getElementById('order-status-filter') || {}).value || '';
    Admin._ordersFilter = statusFilter;

    let orders = Admin._getOrders();
    if (statusFilter) orders = orders.filter(o => o.status === statusFilter);

    const limit  = 20;
    const total  = orders.length;
    const pages  = Math.ceil(total / limit) || 1;
    const pg     = Math.min(Admin._ordersPage, pages);
    const slice  = orders.slice((pg - 1) * limit, pg * limit);

    if (container) container.innerHTML = Admin._buildOrdersTable(slice, true);

    const pgEl = document.getElementById('orders-pagination');
    if (pgEl) {
      let html = '<div class="admin-pag">';
      if (pg > 1)     html += '<button onclick="Admin.loadOrders(' + (pg - 1) + ')" class="btn btn-secondary btn-sm">← Prev</button>';
      html += '<span>Page ' + pg + ' of ' + pages + ' (' + total + ' orders)</span>';
      if (pg < pages) html += '<button onclick="Admin.loadOrders(' + (pg + 1) + ')" class="btn btn-secondary btn-sm">Next →</button>';
      html += '</div>';
      pgEl.innerHTML = html;
    }
  },

  _buildOrdersTable: (orders, showActions) => {
    if (!orders || !orders.length) return '<div class="admin-empty">No orders found.</div>';
    let html = '<table class="admin-table"><thead><tr>'
      + '<th>Order Ref</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th>'
      + (showActions ? '<th>Actions</th>' : '')
      + '</tr></thead><tbody>';
    orders.forEach(o => {
      const d    = o.delivery || {};
      const name = d.firstname ? d.firstname + ' ' + d.lastname : (o.firstname ? o.firstname + ' ' + o.lastname : '—');
      const email = d.email || o.email || '';
      const ref  = o.order_number || o.id;
      html += '<tr>'
        + '<td class="admin-order-id">' + ref + '</td>'
        + '<td><div>' + name + '</div><div class="admin-sub">' + email + '</div></td>'
        + '<td>' + Admin._datetime(o.created_at || o.date) + '</td>'
        + '<td style="font-weight:600;">' + Admin._fmt(o.total) + '</td>'
        + '<td>' + Admin._statusBadge(o.payment_status || 'PENDING', 'payment') + '</td>'
        + '<td>' + Admin._statusBadge(o.status || 'PENDING', 'order') + '</td>'
        + (showActions ? '<td><div class="admin-actions">'
          + '<button onclick="Admin.viewOrder(\'' + ref + '\')" class="btn btn-secondary btn-sm">View</button>'
          + '<select onchange="Admin.updateOrderStatus(\'' + ref + '\', this.value)" class="admin-status-select">'
          + ['PENDING', 'CONFIRMED', 'IN_COLD_STORAGE', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map(s =>
              '<option value="' + s + '"' + (s === (o.status || 'PENDING') ? ' selected' : '') + '>' + s.replace(/_/g, ' ') + '</option>'
            ).join('')
          + '</select>'
          + '</div></td>' : '')
        + '</tr>';
    });
    html += '</tbody></table>';
    return html;
  },

  viewOrder: (orderRef) => {
    const overlay = document.getElementById('order-modal-overlay');
    const modal   = document.getElementById('order-modal');
    const body    = document.getElementById('modal-body');
    const title   = document.getElementById('modal-title');
    if (!modal) return;

    const orders = Admin._getOrders();
    const o      = orders.find(x => (x.order_number || x.id) === orderRef);

    overlay.classList.add('active');
    modal.classList.add('active');

    if (!o) { body.innerHTML = '<div class="admin-error">Order not found.</div>'; return; }

    title.textContent = 'Order ' + orderRef;
    const d     = o.delivery || {};
    const items = (o.items || []).map(i =>
      '<tr><td>' + (i.name || '—') + '</td><td>' + i.quantity + '</td><td>' + Admin._fmt(i.price) + '</td><td>' + Admin._fmt(i.price * i.quantity) + '</td></tr>'
    ).join('');

    body.innerHTML = '<div class="modal-grid">'
      + '<div class="modal-section"><h4>Order Info</h4>'
      + '<div class="modal-row"><span>Reference</span><strong>' + orderRef + '</strong></div>'
      + '<div class="modal-row"><span>Date</span><strong>' + Admin._datetime(o.created_at || o.date) + '</strong></div>'
      + '<div class="modal-row"><span>Status</span>' + Admin._statusBadge(o.status || 'PENDING', 'order') + '</div>'
      + '<div class="modal-row"><span>Payment</span>' + Admin._statusBadge(o.payment_status || 'PENDING', 'payment') + '</div>'
      + '<div class="modal-row"><span>Method</span><strong>' + (o.payment_method || o.paymentMethod || '—').replace(/_/g, ' ') + '</strong></div>'
      + '<div class="modal-row"><span>Delivery</span><strong>' + (o.delivery_type === 'pickup' ? 'Collect In-Store' : 'Home Delivery') + '</strong></div>'
      + '</div>'
      + '<div class="modal-section"><h4>Customer</h4>'
      + '<div class="modal-row"><span>Name</span><strong>' + (d.firstname || '') + ' ' + (d.lastname || '') + '</strong></div>'
      + '<div class="modal-row"><span>Email</span><strong>' + (d.email || '—') + '</strong></div>'
      + '<div class="modal-row"><span>Phone</span><strong>' + (d.phone || '—') + '</strong></div>'
      + (d.address ? '<div class="modal-row"><span>Address</span><strong>' + d.address + (d.suburb ? ', ' + d.suburb : '') + ', ' + (d.city || 'Windhoek') + '</strong></div>' : '')
      + '</div></div>'
      + '<div class="modal-section"><h4>Items</h4>'
      + '<table class="admin-table"><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead><tbody>' + items + '</tbody></table>'
      + '</div>'
      + '<div class="modal-totals">'
      + '<div class="modal-row"><span>Subtotal</span><strong>' + Admin._fmt((o.totals || {}).subtotal || 0) + '</strong></div>'
      + '<div class="modal-row"><span>VAT (15%)</span><strong>' + Admin._fmt((o.totals || {}).tax || 0) + '</strong></div>'
      + '<div class="modal-row"><span>Delivery</span><strong>' + (o.delivery_type === 'pickup' ? 'Free' : 'N$50.00') + '</strong></div>'
      + '<div class="modal-row total"><span>Total</span><strong>' + Admin._fmt(o.total) + '</strong></div>'
      + '</div>';
  },

  closeModal: () => {
    document.getElementById('order-modal-overlay').classList.remove('active');
    document.getElementById('order-modal').classList.remove('active');
  },

  updateOrderStatus: (orderRef, status) => {
    const orders = Admin._getOrders();
    const idx    = orders.findIndex(o => (o.order_number || o.id) === orderRef);
    if (idx === -1) { Admin._toast('Order not found.', 'error'); return; }
    orders[idx].status = status;
    // Also update payment_status when delivered
    if (status === 'DELIVERED' && orders[idx].payment_status !== 'PAID') {
      // leave payment_status as-is — don't auto-mark paid
    }
    Admin._saveOrders(orders);
    // ── Sync to customer's porky_orders so their dashboard reflects the change ──
    // porky_orders IS the shared order store — both admin and customer read it.
    // No extra step needed; they share the same localStorage key.
    Admin._toast('Order ' + orderRef + ' → ' + status.replace(/_/g, ' '), 'success');
    // Refresh the orders table in place
    Admin.loadOrders();
  },

  /* ── CUSTOMERS ────────────────────────────────────────────────────── */
  loadUsers: () => {
    const container = document.getElementById('users-table-container');
    const search    = ((document.getElementById('user-search') || {}).value || '').toLowerCase();
    const orders    = Admin._getOrders();

    let users = Admin._getUsers().filter(u => u.role !== 'admin');
    if (search) users = users.filter(u =>
      (u.firstname + ' ' + u.lastname).toLowerCase().includes(search) ||
      (u.email || '').toLowerCase().includes(search)
    );

    if (!users.length) {
      container.innerHTML = '<div class="admin-empty">No customers found.</div>';
      return;
    }

    let html = '<table class="admin-table"><thead><tr>'
      + '<th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Orders</th><th>Joined</th><th>Actions</th>'
      + '</tr></thead><tbody>';

    users.forEach(u => {
      const orderCount = orders.filter(o => (o.delivery || {}).email === u.email).length;
      html += '<tr>'
        + '<td><strong>' + u.firstname + ' ' + u.lastname + '</strong></td>'
        + '<td>' + u.email + '</td>'
        + '<td>' + (u.phone || '—') + '</td>'
        + '<td>' + Admin._statusBadge((u.role || 'customer').toUpperCase(), 'order') + '</td>'
        + '<td style="text-align:center;">' + orderCount + '</td>'
        + '<td>' + Admin._date(u.createdAt || u.created_at || new Date()) + '</td>'
        + '<td><div class="admin-actions">'
        + '<select onchange="Admin.changeUserRole(\'' + u.id + '\', this.value)" class="admin-status-select">'
        + ['customer', 'admin', 'wholesale'].map(r =>
            '<option value="' + r + '"' + (r === u.role ? ' selected' : '') + '>' + r + '</option>'
          ).join('')
        + '</select>'
        + '</div></td>'
        + '</tr>';
    });

    html += '</tbody></table><div class="admin-pag"><span>' + users.length + ' customer(s)</span></div>';
    container.innerHTML = html;
  },

  searchUsers: () => {
    clearTimeout(Admin._searchTimer);
    Admin._searchTimer = setTimeout(Admin.loadUsers, 300);
  },

  changeUserRole: (userId, role) => {
    const users = Admin._getUsers();
    const idx   = users.findIndex(u => String(u.id) === String(userId));
    if (idx === -1) { Admin._toast('User not found.', 'error'); return; }
    users[idx].role = role;
    Admin._saveUsers(users);
    Admin._toast('Role updated to ' + role + '.', 'success');
    // If changing own role, update session
    const session = Auth.getCurrentUser();
    if (session && String(session.id) === String(userId)) {
      session.role = role;
      Auth._saveSession(session);
    }
  },

  /* ── MESSAGES ─────────────────────────────────────────────────────── */
  loadMessages: () => {
    const container  = document.getElementById('messages-container');
    const unreadOnly = (document.getElementById('unread-only') || {}).checked;
    let msgs = Admin._getMessages();
    if (unreadOnly) msgs = msgs.filter(m => !m.is_read);

    if (!msgs.length) {
      container.innerHTML = '<div class="admin-empty">No messages' + (unreadOnly ? ' (unread)' : '') + ' found.</div>';
      return;
    }

    container.innerHTML = msgs.map(m => {
      const replies = (m.replies || []);
      const repliesHtml = replies.length
        ? '<div class="message-replies">'
          + replies.map(r =>
              '<div class="message-reply">'
              + '<div class="message-reply-header"><span class="message-reply-from">You replied</span><span class="admin-sub">' + Admin._datetime(r.sent_at) + '</span></div>'
              + '<div class="message-reply-body">' + r.body.replace(/\n/g, '<br>') + '</div>'
              + '</div>'
            ).join('')
          + '</div>'
        : '';

      return '<div class="message-card ' + (m.is_read ? '' : 'unread') + '" id="msg-' + m.id + '">'
        + '<div class="message-header">'
        + '<div class="message-sender">'
        + '<div class="message-sender-avatar">' + (m.name?.[0] || '?').toUpperCase() + '</div>'
        + '<div><strong>' + m.name + '</strong><span class="admin-sub">' + m.email + '</span></div>'
        + '</div>'
        + '<div class="message-meta">'
        + Admin._datetime(m.created_at)
        + (!m.is_read ? '<span class="unread-dot"></span>' : '')
        + '</div></div>'
        + (m.subject ? '<div class="message-subject">' + m.subject + '</div>' : '')
        + '<div class="message-body">' + (m.message || '').replace(/\n/g, '<br>') + '</div>'
        + repliesHtml
        + '<div class="message-actions">'
        + '<button onclick="Admin.openReply(' + m.id + ')" class="btn btn-quote btn-sm">↩ Reply</button>'
        + (!m.is_read ? '<button onclick="Admin.markRead(' + m.id + ')" class="btn btn-secondary btn-sm">✓ Mark Read</button>' : '')
        + '<button onclick="Admin.deleteMessage(' + m.id + ')" class="btn btn-sm" style="background:transparent;border:1px solid var(--color-border-light);color:var(--color-text-muted);">🗑 Delete</button>'
        + '</div></div>';
    }).join('');
  },

  markRead: (id) => {
    const msgs = Admin._getMessages();
    const idx  = msgs.findIndex(m => m.id === id);
    if (idx !== -1) { msgs[idx].is_read = true; Admin._saveMessages(msgs); }
    const el = document.getElementById('msg-' + id);
    if (el) el.classList.remove('unread');
    Admin._updateUnreadBadge();
    Admin._toast('Marked as read.', 'success');
  },

  deleteMessage: (id) => {
    if (!confirm('Delete this message? This cannot be undone.')) return;
    const msgs = Admin._getMessages().filter(m => m.id !== id);
    Admin._saveMessages(msgs);
    Admin._updateUnreadBadge();
    Admin.loadMessages();
    Admin._toast('Message deleted.', 'success');
  },

  /* ── REPLY MODAL ──────────────────────────────────────────────────── */
  openReply: (msgId) => {
    const msgs = Admin._getMessages();
    const msg  = msgs.find(m => m.id === msgId);
    if (!msg) return;

    // Mark as read when opening reply
    if (!msg.is_read) Admin.markRead(msgId);

    const modal   = document.getElementById('reply-modal');
    const overlay = document.getElementById('reply-modal-overlay');
    if (!modal) return;

    document.getElementById('reply-to-name').textContent    = msg.name;
    document.getElementById('reply-to-email').textContent   = msg.email;
    document.getElementById('reply-subject').value          = 'Re: ' + (msg.subject || 'Your enquiry');
    document.getElementById('reply-body').value             = '';
    document.getElementById('reply-msg-id').value           = msgId;
    document.getElementById('reply-original').textContent   = msg.message;

    overlay.classList.add('active');
    modal.classList.add('active');
    document.getElementById('reply-body').focus();
  },

  closeReplyModal: () => {
    document.getElementById('reply-modal-overlay').classList.remove('active');
    document.getElementById('reply-modal').classList.remove('active');
  },

  sendReply: () => {
    const subject = document.getElementById('reply-subject').value.trim();
    const body    = document.getElementById('reply-body').value.trim();
    const msgId   = parseInt(document.getElementById('reply-msg-id').value);
    const email   = document.getElementById('reply-to-email').textContent;

    if (!body) { Admin._toast('Please write a reply before sending.', 'error'); return; }

    // Save reply to the message thread
    const msgs = Admin._getMessages();
    const idx  = msgs.findIndex(m => m.id === msgId);
    if (idx !== -1) {
      if (!msgs[idx].replies) msgs[idx].replies = [];
      msgs[idx].replies.push({ subject, body, sent_at: new Date().toISOString() });
      msgs[idx].is_read = true;
      Admin._saveMessages(msgs);
    }

    // Open mailto as fallback so the email actually gets sent
    const mailtoLink = 'mailto:' + email
      + '?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(body);
    window.open(mailtoLink, '_blank');

    Admin.closeReplyModal();
    Admin.loadMessages();
    Admin._updateUnreadBadge();
    Admin._toast('Reply sent to ' + email, 'success');
  },

  /* ── WHOLESALE QUOTES ─────────────────────────────────────────────── */
  loadWholesale: () => {
    const container = document.getElementById('wholesale-container');
    const status    = (document.getElementById('quote-status-filter') || {}).value || '';
    let quotes = Admin._getQuotes();
    if (status) quotes = quotes.filter(q => q.status === status);

    if (!quotes.length) {
      container.innerHTML = '<div class="admin-empty">No quote requests found.</div>';
      return;
    }

    container.innerHTML = quotes.map(q =>
      '<div class="quote-card">'
      + '<div class="quote-header">'
      + '<div><strong>' + (q.business_name || q.name || '—') + '</strong>'
      + (q.business_type ? ' <span class="admin-sub">' + q.business_type + '</span>' : '')
      + '</div>'
      + '<div class="quote-meta">'
      + Admin._statusBadge(q.status || 'NEW', 'quote')
      + '<span class="admin-sub">' + Admin._datetime(q.created_at) + '</span>'
      + '</div></div>'
      + '<div class="quote-body">'
      + '<div class="quote-row"><span>Contact</span><strong>' + (q.contact_person || q.name || '—') + '</strong></div>'
      + '<div class="quote-row"><span>Email</span><a href="mailto:' + q.email + '">' + q.email + '</a></div>'
      + '<div class="quote-row"><span>Phone</span><strong>' + (q.phone || '—') + '</strong></div>'
      + '<div class="quote-row"><span>Location</span><strong>' + (q.delivery_location || q.location || '—') + '</strong></div>'
      + (q.product_interests || q.products ? '<div class="quote-row full"><span>Products</span><strong>' + (q.product_interests || q.products) + '</strong></div>' : '')
      + (q.additional_info || q.message ? '<div class="quote-row full"><span>Notes</span><strong>' + (q.additional_info || q.message) + '</strong></div>' : '')
      + '</div>'
      + '<div class="quote-actions">'
      + '<a href="mailto:' + q.email + '?subject=Re: Wholesale Quote — Porky\'s Meat Market" class="btn btn-quote btn-sm">↩ Reply</a>'
      + '<select onchange="Admin.updateQuoteStatus(' + q.id + ', this.value)" class="admin-status-select">'
      + ['NEW', 'CONTACTED', 'QUOTED', 'CLOSED'].map(s =>
          '<option value="' + s + '"' + (s === (q.status || 'NEW') ? ' selected' : '') + '>' + s + '</option>'
        ).join('')
      + '</select>'
      + '</div></div>'
    ).join('');
  },

  updateQuoteStatus: (id, status) => {
    const quotes = Admin._getQuotes();
    const idx    = quotes.findIndex(q => q.id === id);
    if (idx !== -1) { quotes[idx].status = status; Admin._saveQuotes(quotes); }
    Admin._toast('Quote status → ' + status, 'success');
  },

  /* ── ORDER NOTIFICATIONS ──────────────────────────────────────────── */
  _NOTIF_KEY: 'porky_admin_seen_orders',

  _getSeenOrders: () => {
    try { return JSON.parse(localStorage.getItem('porky_admin_seen_orders') || '[]'); } catch { return []; }
  },

  _initNotifications: () => {
    // Poll for new orders every 15 seconds
    Admin._checkNewOrders();
    setInterval(Admin._checkNewOrders, 15000);

    // Close panel on outside click
    document.addEventListener('click', (e) => {
      const panel = document.getElementById('admin-notif-panel');
      const btn   = document.getElementById('admin-notif-btn');
      if (panel && !panel.contains(e.target) && btn && !btn.contains(e.target)) {
        panel.style.display = 'none';
      }
    });
  },

  _checkNewOrders: () => {
    const orders  = Admin._getOrders();
    const seen    = Admin._getSeenOrders();
    const newOrders = orders.filter(o => !seen.includes(o.order_number || o.id));

    const badge = document.getElementById('admin-notif-badge');
    if (badge) {
      badge.textContent   = newOrders.length;
      badge.style.display = newOrders.length > 0 ? 'flex' : 'none';
    }

    // Populate notification list
    const list = document.getElementById('admin-notif-list');
    if (list) {
      if (!newOrders.length) {
        list.innerHTML = '<div class="admin-notif-empty">No new orders</div>';
      } else {
        list.innerHTML = newOrders.map(o => {
          const ref  = o.order_number || o.id;
          const d    = o.delivery || {};
          const name = d.firstname ? d.firstname + ' ' + d.lastname : 'Customer';
          const time = Admin._datetime(o.created_at || o.date);
          return '<div class="admin-notif-item" onclick="Admin._openOrderFromNotif(\'' + ref + '\')">'
            + '<div class="admin-notif-icon">📦</div>'
            + '<div class="admin-notif-body">'
            + '<div class="admin-notif-title">New order from ' + name + '</div>'
            + '<div class="admin-notif-meta">' + ref + ' · ' + Admin._fmt(o.total) + '</div>'
            + '<div class="admin-notif-time">' + time + '</div>'
            + '</div></div>';
        }).join('');
      }
    }
  },

  toggleNotifications: () => {
    const panel = document.getElementById('admin-notif-panel');
    if (!panel) return;
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panel.style.display === 'block') Admin._checkNewOrders();
  },

  clearNotifications: () => {
    const orders = Admin._getOrders();
    const allIds = orders.map(o => o.order_number || o.id);
    localStorage.setItem('porky_admin_seen_orders', JSON.stringify(allIds));
    Admin._checkNewOrders();
    const panel = document.getElementById('admin-notif-panel');
    if (panel) panel.style.display = 'none';
  },

  _openOrderFromNotif: (ref) => {
    const seen = Admin._getSeenOrders();
    if (!seen.includes(ref)) { seen.push(ref); localStorage.setItem('porky_admin_seen_orders', JSON.stringify(seen)); }
    Admin._checkNewOrders();
    document.getElementById('admin-notif-panel').style.display = 'none';
    Admin.showSection('orders', document.querySelector('[data-section="orders"]'));
    setTimeout(() => Admin.viewOrder(ref), 300);
  },

  /* ── ACCOUNT SETTINGS ─────────────────────────────────────────────── */
  loadAccount: () => {
    const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    if (!user) return;

    // Prefill fields
    const set = (id, val) => { const el = document.getElementById(id); if (el && val != null) el.value = val; };
    set('admin-acc-firstname', user.firstname);
    set('admin-acc-lastname',  user.lastname);
    set('admin-acc-email',     user.email);

    // Load avatar
    const avatarEl = document.getElementById('admin-profile-avatar');
    const AVATAR_KEY = 'porky_admin_avatar';
    const _loadAvatar = () => {
      const saved = (() => { try { return localStorage.getItem(AVATAR_KEY); } catch { return null; } })();
      if (saved && avatarEl) {
        avatarEl.innerHTML = '';
        const img = document.createElement('img');
        img.src = saved; img.alt = 'Admin photo';
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
        img.onerror = () => { avatarEl.textContent = (user.firstname?.[0] || 'A').toUpperCase(); };
        avatarEl.appendChild(img);
      } else if (avatarEl) {
        avatarEl.innerHTML = '';
        avatarEl.textContent = ((user.firstname?.[0] || '') + (user.lastname?.[0] || '')).toUpperCase() || 'A';
      }
    };
    _loadAvatar();

    // Avatar upload
    const input = document.getElementById('admin-avatar-input');
    if (input) {
      const newInput = input.cloneNode(true);
      input.parentNode.replaceChild(newInput, input);
      newInput.addEventListener('change', () => {
        const file = newInput.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { Admin._toast('Image must be under 2MB.', 'error'); return; }
        if (!file.type.startsWith('image/')) { Admin._toast('Please select an image file.', 'error'); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
          try { localStorage.setItem(AVATAR_KEY, e.target.result); } catch { Admin._toast('Storage full.', 'error'); return; }
          _loadAvatar();
          // Update header avatar too
          const headerAvatar = document.getElementById('admin-avatar');
          if (headerAvatar) {
            headerAvatar.innerHTML = '';
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
            headerAvatar.appendChild(img);
          }
          Admin._toast('Photo updated!', 'success');
        };
        reader.readAsDataURL(file);
      });
    }

    // Avatar remove
    const removeBtn = document.getElementById('admin-avatar-remove');
    if (removeBtn) {
      const newBtn = removeBtn.cloneNode(true);
      removeBtn.parentNode.replaceChild(newBtn, removeBtn);
      newBtn.addEventListener('click', () => {
        try { localStorage.removeItem(AVATAR_KEY); } catch {}
        if (avatarEl) { avatarEl.innerHTML = ''; avatarEl.textContent = ((user.firstname?.[0] || '') + (user.lastname?.[0] || '')).toUpperCase() || 'A'; }
        const headerAvatar = document.getElementById('admin-avatar');
        if (headerAvatar) { headerAvatar.innerHTML = ''; headerAvatar.textContent = ((user.firstname?.[0] || '') + (user.lastname?.[0] || '')).toUpperCase() || 'A'; }
        Admin._toast('Photo removed.', 'success');
      });
    }

    // Profile form
    const accForm = document.getElementById('admin-account-form');
    if (accForm) {
      const newForm = accForm.cloneNode(true);
      accForm.parentNode.replaceChild(newForm, accForm);
      newForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const firstname = document.getElementById('admin-acc-firstname').value.trim();
        const lastname  = document.getElementById('admin-acc-lastname').value.trim();
        if (!firstname || !lastname) { Admin._toast('Name cannot be empty.', 'error'); return; }

        // Update in users array
        const users = Admin._getUsers();
        const idx = users.findIndex(u => u.id === user.id);
        if (idx !== -1) {
          users[idx].firstname = firstname;
          users[idx].lastname  = lastname;
          users[idx].name      = firstname + ' ' + lastname;
          Admin._saveUsers(users);
        }
        // Update admin session
        const session = { ...user, firstname, lastname, name: firstname + ' ' + lastname };
        localStorage.setItem('porky_admin_session', JSON.stringify(session));

        // Update header name
        const nameEl = document.getElementById('admin-user-name');
        if (nameEl) nameEl.textContent = firstname + ' ' + lastname;

        const msgEl = document.getElementById('admin-acc-msg');
        if (msgEl) { msgEl.style.display = 'block'; setTimeout(() => { msgEl.style.display = 'none'; }, 3000); }
        Admin._toast('Profile updated.', 'success');
      });
    }

    // Password form
    const pwForm = document.getElementById('admin-pw-form');
    if (pwForm) {
      const newPwForm = pwForm.cloneNode(true);
      pwForm.parentNode.replaceChild(newPwForm, pwForm);
      newPwForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const current = document.getElementById('admin-pw-current').value;
        const next    = document.getElementById('admin-pw-new').value;
        const confirm = document.getElementById('admin-pw-confirm').value;
        const msgEl   = document.getElementById('admin-pw-msg');

        const showMsg = (txt, ok) => {
          if (!msgEl) return;
          msgEl.textContent = txt;
          msgEl.style.background = ok ? 'rgba(39,174,96,0.1)' : 'rgba(231,76,60,0.1)';
          msgEl.style.borderLeft = '3px solid ' + (ok ? 'var(--color-success)' : 'var(--color-error)');
          msgEl.style.color = ok ? 'var(--color-success)' : 'var(--color-error)';
          msgEl.style.display = 'block';
          setTimeout(() => { msgEl.style.display = 'none'; }, 4000);
        };

        if (!current || !next || !confirm) { showMsg('Please fill in all fields.', false); return; }
        if (next.length < 8) { showMsg('New password must be at least 8 characters.', false); return; }
        if (next !== confirm) { showMsg('Passwords do not match.', false); return; }

        const encoded = btoa(unescape(encodeURIComponent(current)));
        const users = Admin._getUsers();
        const idx = users.findIndex(u => u.id === user.id);
        if (idx === -1 || users[idx]._pw !== encoded) { showMsg('Current password is incorrect.', false); return; }

        users[idx]._pw = btoa(unescape(encodeURIComponent(next)));
        Admin._saveUsers(users);
        newPwForm.reset();
        showMsg('Password updated successfully.', true);
        Admin._toast('Password changed.', 'success');
      });
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', Admin.init);
} else {
  Admin.init();
}
