/**
 * Checkout Module
 * Full multi-step checkout: Delivery → Payment → Review → Processing → Success/Fail
 */

const Checkout = {
  currentStep:   1,
  deliveryType:  'delivery',
  paymentMethod: 'card',
  deliveryData:  {},
  DELIVERY_FEE:  50,

  init: () => {
    if (typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
      window.location.href = '/pages/login.html?return=' + encodeURIComponent(window.location.pathname);
      return;
    }
    if (!Cart.getItems().length) {
      window.location.href = '/pages/products.html';
      return;
    }
    Checkout._renderSummary();
    Checkout._prefillDelivery();
    Checkout._bindCardInputs();
    Checkout._generateReference();
    Checkout.goToStep(1);
  },

  goToStep: (step) => {
    document.querySelectorAll('.checkout-step-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.checkout-step').forEach(s => {
      s.classList.remove('active');
      if (parseInt(s.dataset.step) < step) s.classList.add('done');
      else s.classList.remove('done');
    });
    const section = document.getElementById('step-' + step);
    if (section) section.classList.add('active');
    const navStep = document.querySelector('[data-step="' + step + '"]');
    if (navStep) navStep.classList.add('active');
    Checkout.currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /* ── STEP 1: Delivery ─────────────────────────────────────────────── */
  setDeliveryType: (type, btn) => {
    Checkout.deliveryType = type;
    document.querySelectorAll('.delivery-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const addrFields  = document.getElementById('delivery-address-fields');
    const pickupInfo  = document.getElementById('pickup-info');
    const deliveryRow = document.querySelector('.delivery-row');
    if (type === 'pickup') {
      if (addrFields)  addrFields.style.display = 'none';
      if (pickupInfo)  pickupInfo.style.display  = 'block';
      if (deliveryRow) deliveryRow.querySelector('span:last-child').textContent = 'Free';
    } else {
      if (addrFields)  addrFields.style.display = 'block';
      if (pickupInfo)  pickupInfo.style.display  = 'none';
      if (deliveryRow) deliveryRow.querySelector('span:last-child').textContent = 'N$' + Checkout.DELIVERY_FEE.toFixed(2);
    }
    Checkout._updateTotals();
  },

  _prefillDelivery: () => {
    const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    if (!user) return;
    const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    set('d-firstname', user.firstname);
    set('d-lastname',  user.lastname);
    set('d-email',     user.email);
    set('d-phone',     user.phone);
  },

  _submitDelivery: (e) => {
    e.preventDefault();
    const form = document.getElementById('delivery-form');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    Checkout.deliveryData = {
      firstname:    document.getElementById('d-firstname').value.trim(),
      lastname:     document.getElementById('d-lastname').value.trim(),
      email:        document.getElementById('d-email').value.trim(),
      phone:        document.getElementById('d-phone').value.trim(),
      address:      (document.getElementById('d-address') || {}).value || '',
      suburb:       (document.getElementById('d-suburb')  || {}).value || '',
      city:         (document.getElementById('d-city')    || {}).value || 'Windhoek',
      notes:        (document.getElementById('d-notes')   || {}).value || '',
      deliveryType: Checkout.deliveryType
    };
    Checkout.goToStep(2);
  },

  /* ── STEP 2: Payment ──────────────────────────────────────────────── */
  setPaymentMethod: (method, btn) => {
    Checkout.paymentMethod = method;
    document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ['card', 'eft', 'mobile', 'cod'].forEach(m => {
      const panel = document.getElementById('payment-' + m);
      if (panel) panel.style.display = m === method ? 'block' : 'none';
    });
    Checkout._clearAlert();
  },

  submitPayment: () => {
    if (Checkout.paymentMethod === 'card') {
      const num = (document.getElementById('card-number') || {}).value || '';
      const exp = (document.getElementById('card-expiry') || {}).value || '';
      const cvv = (document.getElementById('card-cvv')    || {}).value || '';
      if (num.replace(/\s/g, '').length < 16) { Checkout._showAlert('Please enter a valid 16-digit card number.'); return; }
      if (!/^\d{2}\/\d{2}$/.test(exp))        { Checkout._showAlert('Please enter a valid expiry date (MM/YY).'); return; }
      if (cvv.length < 3)                      { Checkout._showAlert('Please enter a valid CVV.'); return; }
      // Check expiry not in past
      const [mm, yy] = exp.split('/');
      const expDate  = new Date(2000 + parseInt(yy), parseInt(mm) - 1, 1);
      if (expDate < new Date()) { Checkout._showAlert('Your card has expired. Please use a different card.'); return; }
    }
    Checkout._clearAlert();
    Checkout._buildReview();
    Checkout.goToStep(3);
  },

  /* ── STEP 3: Review ───────────────────────────────────────────────── */
  _buildReview: () => {
    const container = document.getElementById('order-review');
    if (!container) return;
    const d          = Checkout.deliveryData;
    const items      = Cart.getItems();
    const totals     = Cart.getTotals();
    const fee        = Checkout.deliveryType === 'pickup' ? 0 : Checkout.DELIVERY_FEE;
    const grandTotal = totals.total + fee;
    const methodLabels = { card: 'Credit / Debit Card', eft: 'EFT / Bank Transfer', mobile: 'Mobile Pay', cod: 'Cash on Delivery' };
    const cardLast4 = Checkout.paymentMethod === 'card'
      ? ((document.getElementById('card-number') || {}).value || '').replace(/\s/g, '').slice(-4)
      : '';

    let html = '<div class="review-section"><h4>Delivery</h4>'
      + '<div class="review-row"><span>Name</span><strong>' + d.firstname + ' ' + d.lastname + '</strong></div>'
      + '<div class="review-row"><span>Email</span><strong>' + d.email + '</strong></div>'
      + '<div class="review-row"><span>Phone</span><strong>' + d.phone + '</strong></div>';
    html += Checkout.deliveryType === 'delivery'
      ? '<div class="review-row"><span>Address</span><strong>' + d.address + (d.suburb ? ', ' + d.suburb : '') + ', ' + d.city + '</strong></div>'
      : '<div class="review-row"><span>Method</span><strong>Collect in-store — Lafrenz, Windhoek</strong></div>';
    html += '</div><div class="review-section"><h4>Payment</h4>'
      + '<div class="review-row"><span>Method</span><strong>' + (methodLabels[Checkout.paymentMethod] || Checkout.paymentMethod) + '</strong></div>';
    if (cardLast4) html += '<div class="review-row"><span>Card</span><strong>•••• •••• •••• ' + cardLast4 + '</strong></div>';
    html += '</div><div class="review-section"><h4>Items (' + items.length + ')</h4>';
    items.forEach(function(item) {
      html += '<div class="review-row"><span>' + item.name + ' &times; ' + item.quantity + '</span><strong>N$' + (item.price * item.quantity).toFixed(2) + '</strong></div>';
    });
    html += '</div><div class="review-section"><h4>Total</h4>'
      + '<div class="review-row"><span>Subtotal</span><strong>' + totals.formattedSubtotal + '</strong></div>'
      + '<div class="review-row"><span>VAT (15%)</span><strong>' + totals.formattedTax + '</strong></div>'
      + '<div class="review-row"><span>Delivery</span><strong>' + (fee === 0 ? 'Free' : 'N$' + fee.toFixed(2)) + '</strong></div>'
      + '<div class="review-row grand-total-row"><span>Grand Total</span><strong>N$' + grandTotal.toFixed(2) + '</strong></div>'
      + '</div>';
    container.innerHTML = html;
  },

  /* ── STEP 4: Place Order + Payment Processing ─────────────────────── */
  placeOrder: async () => {
    const terms = document.getElementById('confirm-terms');
    if (!terms || !terms.checked) {
      Checkout._showAlert('Please confirm your order details to continue.');
      return;
    }
    Checkout._clearAlert();
    Checkout._setLoading('place-order-btn', true);

    // Show processing overlay for card payments
    if (Checkout.paymentMethod === 'card') {
      Checkout._showProcessing('Contacting payment gateway…');
      await Checkout._delay(800);
      Checkout._updateProcessing('Verifying card details…');
      await Checkout._delay(700);
      Checkout._updateProcessing('Authorising payment…');
      await Checkout._delay(900);
    }

    const cartItems = Cart.getItems();
    const totals    = Cart.getTotals();
    const cardNum   = (document.getElementById('card-number') || {}).value || '';

    const payload = {
      items:          cartItems.map(i => ({ product_id: i.id, quantity: i.quantity })),
      delivery_type:  Checkout.deliveryType,
      payment_method: Checkout.paymentMethod,
      delivery:       Checkout.deliveryData,
      notes:          Checkout.deliveryData.notes || null,
      card_last4:     cardNum ? cardNum.replace(/\s/g, '').slice(-4) : null
    };

    let result;
    try {
      result = await API.orders.create(payload);
    } catch (apiErr) {
      Checkout._hideProcessing();
      Checkout._setLoading('place-order-btn', false);

      // Handle payment declined (simulate for demo)
      if (apiErr.status === 402) {
        Checkout._showPaymentDeclined();
        return;
      }

      // Fallback: save locally
      console.warn('Order API unavailable, saving locally:', apiErr.message);
      result = {
        order_number:   'PMM-' + Date.now().toString(36).toUpperCase().slice(-6),
        status:         'PENDING',
        payment_status: 'PENDING',
        total:          totals.total + (Checkout.deliveryType === 'pickup' ? 0 : Checkout.DELIVERY_FEE),
        message:        'Order saved locally.'
      };
      try {
        const existing = JSON.parse(localStorage.getItem('porky_orders') || '[]');
        existing.unshift({
          id: result.order_number, date: new Date().toISOString(),
          items: cartItems, totals, delivery: Checkout.deliveryData,
          paymentMethod: Checkout.paymentMethod, status: 'PENDING'
        });
        localStorage.setItem('porky_orders', JSON.stringify(existing));
      } catch (e) {}
    }

    Checkout._hideProcessing();
    Checkout._setLoading('place-order-btn', false);
    Cart.clear();

    // Show success screen
    Checkout._showSuccess(result);
  },

  /* ── Payment processing overlay ───────────────────────────────────── */
  _showProcessing: (msg) => {
    let overlay = document.getElementById('payment-processing-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'payment-processing-overlay';
      overlay.className = 'payment-processing-overlay';
      overlay.innerHTML = '<div class="payment-processing-box">'
        + '<div class="payment-spinner"></div>'
        + '<p id="payment-processing-msg" class="payment-processing-msg"></p>'
        + '</div>';
      document.body.appendChild(overlay);
    }
    document.getElementById('payment-processing-msg').textContent = msg;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  _updateProcessing: (msg) => {
    const el = document.getElementById('payment-processing-msg');
    if (el) el.textContent = msg;
  },

  _hideProcessing: () => {
    const overlay = document.getElementById('payment-processing-overlay');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  },

  _showPaymentDeclined: () => {
    document.querySelectorAll('.checkout-step-section').forEach(s => s.classList.remove('active'));
    const declined = document.getElementById('step-declined');
    if (declined) { declined.style.display = 'block'; declined.classList.add('active'); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  _showSuccess: (result) => {
    document.querySelectorAll('.checkout-step-section').forEach(s => s.classList.remove('active'));
    const success = document.getElementById('step-success');
    if (!success) return;
    success.style.display = 'block';
    success.classList.add('active');

    const orderId = result.order_number || result.id;
    const total   = result.total ? 'N$' + parseFloat(result.total).toFixed(2) : '';

    const idEl  = document.getElementById('success-order-id');
    const msgEl = document.getElementById('success-message');
    const totEl = document.getElementById('success-total');
    const pmEl  = document.getElementById('success-payment-method');

    if (idEl)  idEl.textContent  = orderId;
    if (totEl) totEl.textContent = total;
    if (pmEl)  pmEl.textContent  = { card: 'Card Payment', eft: 'EFT / Bank Transfer', mobile: 'Mobile Pay', cod: 'Cash on Delivery' }[Checkout.paymentMethod] || Checkout.paymentMethod;

    const payStatus = result.payment_status || 'PENDING';
    let msg = '';
    if (Checkout.paymentMethod === 'card') {
      msg = payStatus === 'PAID'
        ? '✅ Payment approved! Your order is confirmed and being prepared.'
        : '⏳ Payment is being processed. You will receive a confirmation shortly.';
    } else if (Checkout.paymentMethod === 'eft') {
      msg = '🏦 Please complete your EFT payment using reference <strong>' + orderId + '</strong>. Your order will be confirmed once payment reflects (1–2 business days).';
    } else if (Checkout.paymentMethod === 'mobile') {
      msg = '📱 Please send your payment to <strong>+264 61 262 175</strong> using reference <strong>' + orderId + '</strong>. Your order will be confirmed once payment is received.';
    } else {
      msg = '💵 Your order is confirmed. Please have <strong>' + total + '</strong> ready when your order arrives.';
    }
    if (msgEl) msgEl.innerHTML = msg;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  _delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /* ── Summary sidebar ──────────────────────────────────────────────── */
  _renderSummary: () => {
    const items  = Cart.getItems();
    const fee    = Checkout.deliveryType === 'pickup' ? 0 : Checkout.DELIVERY_FEE;
    const itemsEl = document.getElementById('summary-items');
    if (itemsEl) {
      itemsEl.innerHTML = items.map(function(item) {
        return '<div class="summary-item">'
          + '<img src="' + (item.image || '/assets/Images/Gallery.jpg') + '" alt="' + item.name + '" class="summary-item-img" onerror="this.src=\'/assets/Images/Gallery.jpg\'">'
          + '<div class="summary-item-info"><div class="summary-item-name">' + item.name + '</div><div class="summary-item-qty">&times; ' + item.quantity + '</div></div>'
          + '<div class="summary-item-price">N$' + (item.price * item.quantity).toFixed(2) + '</div>'
          + '</div>';
      }).join('');
    }
    Checkout._updateTotals();
  },

  _updateTotals: () => {
    const totals = Cart.getTotals();
    const fee    = Checkout.deliveryType === 'pickup' ? 0 : Checkout.DELIVERY_FEE;
    const grand  = totals.total + fee;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('summary-subtotal', totals.formattedSubtotal);
    set('summary-tax',      totals.formattedTax);
    set('summary-delivery', fee === 0 ? 'Free' : 'N$' + fee.toFixed(2));
    set('summary-total',    'N$' + grand.toFixed(2));
  },

  /* ── Card input live formatting ───────────────────────────────────── */
  _bindCardInputs: () => {
    const numInput  = document.getElementById('card-number');
    const nameInput = document.getElementById('card-name');
    const expInput  = document.getElementById('card-expiry');

    if (numInput) {
      numInput.addEventListener('input', () => {
        let v = numInput.value.replace(/\D/g, '').slice(0, 16);
        numInput.value = v.replace(/(.{4})/g, '$1 ').trim();
        const preview = document.getElementById('preview-number');
        if (preview) preview.textContent = (v + '................').slice(0, 16).replace(/(.{4})/g, '$1 ').trim().replace(/\d/g, (c, i) => i < v.length ? c : '•');
        const badge = document.getElementById('card-brand-badge');
        const brand = document.getElementById('preview-brand');
        let b = '💳', bt = 'CARD';
        if (/^4/.test(v))           { b = '💙'; bt = 'VISA'; }
        else if (/^5[1-5]/.test(v)) { b = '🔴'; bt = 'MASTERCARD'; }
        else if (/^3[47]/.test(v))  { b = '🟢'; bt = 'AMEX'; }
        if (badge) badge.textContent = b;
        if (brand) brand.textContent = bt;
      });
    }
    if (nameInput) {
      nameInput.addEventListener('input', () => {
        const el = document.getElementById('preview-name');
        if (el) el.textContent = nameInput.value.toUpperCase() || 'YOUR NAME';
      });
    }
    if (expInput) {
      expInput.addEventListener('input', () => {
        let v = expInput.value.replace(/\D/g, '').slice(0, 4);
        if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
        expInput.value = v;
        const el = document.getElementById('preview-expiry');
        if (el) el.textContent = v || 'MM/YY';
      });
    }
  },

  _generateReference: () => {
    const ref = 'PMM-' + Math.random().toString(36).toUpperCase().slice(2, 8);
    ['eft-reference', 'mobile-reference'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = ref;
    });
  },

  _showAlert: (msg) => {
    const el = document.getElementById('checkout-alert');
    if (!el) return;
    el.innerHTML = msg;
    el.className = 'checkout-alert-box error';
    el.style.display = 'flex';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  _clearAlert: () => {
    const el = document.getElementById('checkout-alert');
    if (el) { el.style.display = 'none'; el.textContent = ''; }
  },

  _setLoading: (btnId, on) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = on;
    const t = btn.querySelector('.btn-text');
    const s = btn.querySelector('.btn-spinner');
    if (t) t.style.display = on ? 'none' : '';
    if (s) s.style.display = on ? 'inline-block' : 'none';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const deliveryForm = document.getElementById('delivery-form');
  if (deliveryForm) deliveryForm.addEventListener('submit', Checkout._submitDelivery);
  Checkout.init();
});
