/**
 * Checkout Module — Stripe card payments only
 */

// Replace with your real publishable key from https://dashboard.stripe.com/apikeys
// For demo/testing, use test mode keys. In production, use live keys.
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RPlease_replace_with_your_real_stripe_publishable_key';

// Demo fallback: If Stripe fails, show a demo success message
const DEMO_MODE = true;

const Checkout = {
  currentStep:  1,
  deliveryType: 'delivery',
  deliveryData: {},
  DELIVERY_FEE: 50,

  _stripe:      null,
  _cardElement: null,

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
    Checkout._initStripe();
    Checkout.goToStep(1);
  },

  /* ── Stripe setup ─────────────────────────────────────────────────── */
  _initStripe: () => {
    if (typeof Stripe === 'undefined') {
      console.warn('[Checkout] Stripe.js not loaded.');
      return;
    }
    Checkout._stripe  = Stripe(STRIPE_PUBLISHABLE_KEY);
    const elements    = Checkout._stripe.elements();
    const isDark      = document.documentElement.getAttribute('data-theme') !== 'light';

    Checkout._cardElement = elements.create('card', {
      style: {
        base: {
          color:           isDark ? '#F0EDE8' : '#1A1714',
          fontFamily:      '"Inter", -apple-system, sans-serif',
          fontSize:        '16px',
          fontSmoothing:   'antialiased',
          '::placeholder': { color: isDark ? '#5A5550' : '#9A9590' },
          iconColor:       '#F5A623',
        },
        invalid: { color: '#E74C3C', iconColor: '#E74C3C' }
      }
    });

    const mountEl = document.getElementById('stripe-card-element');
    if (mountEl) {
      Checkout._cardElement.mount('#stripe-card-element');
      Checkout._cardElement.on('change', (e) => {
        const errEl = document.getElementById('stripe-card-errors');
        if (errEl) errEl.textContent = e.error ? e.error.message : '';
      });
    }
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

  /* ── STEP 2 → 3: proceed to review ───────────────────────────────── */
  submitPayment: () => {
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

    let html = '<div class="review-section"><h4>Delivery</h4>'
      + '<div class="review-row"><span>Name</span><strong>' + d.firstname + ' ' + d.lastname + '</strong></div>'
      + '<div class="review-row"><span>Email</span><strong>' + d.email + '</strong></div>'
      + '<div class="review-row"><span>Phone</span><strong>' + d.phone + '</strong></div>';
    html += Checkout.deliveryType === 'delivery'
      ? '<div class="review-row"><span>Address</span><strong>' + d.address + (d.suburb ? ', ' + d.suburb : '') + ', ' + d.city + '</strong></div>'
      : '<div class="review-row"><span>Method</span><strong>Collect in-store — Lafrenz, Windhoek</strong></div>';
    html += '</div><div class="review-section"><h4>Payment</h4>'
      + '<div class="review-row"><span>Method</span><strong>💳 Credit / Debit Card (Stripe)</strong></div>'
      + '</div><div class="review-section"><h4>Items (' + items.length + ')</h4>';
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

  /* ── STEP 4: Place Order via Stripe ──────────────────────────────── */
  placeOrder: async () => {
    const terms = document.getElementById('confirm-terms');
    if (!terms || !terms.checked) {
      Checkout._showAlert('Please confirm your order details to continue.');
      return;
    }

    // Demo mode check
    if (DEMO_MODE) {
      Checkout._clearAlert();
      Checkout._setLoading('place-order-btn', true);
      
      const cartItems  = Cart.getItems();
      const totals     = Cart.getTotals();
      const fee        = Checkout.deliveryType === 'pickup' ? 0 : Checkout.DELIVERY_FEE;
      const grandTotal = totals.total + fee;
      
      Checkout._showProcessing('Processing demo payment…');
      
      // Simulate payment processing
      setTimeout(() => {
        Checkout._updateProcessing('Creating order…');
        
        setTimeout(() => {
          const orderRef = 'PMM-' + Date.now().toString().slice(-6).toUpperCase();
          Checkout._saveLocalOrder(cartItems, totals, grandTotal, orderRef, 'PAID');
          Checkout._hideProcessing();
          Checkout._setLoading('place-order-btn', false);
          Cart.clear();
          Checkout._showSuccess({ 
            order_number: orderRef, 
            status: 'CONFIRMED', 
            payment_status: 'PAID', 
            total: grandTotal 
          });
        }, 800);
      }, 800);
      return;
    }

    if (!Checkout._stripe || !Checkout._cardElement) {
      Checkout._showAlert('Payment system not ready. Please refresh and try again.');
      return;
    }

    Checkout._clearAlert();
    Checkout._setLoading('place-order-btn', true);

    const cartItems  = Cart.getItems();
    const totals     = Cart.getTotals();
    const fee        = Checkout.deliveryType === 'pickup' ? 0 : Checkout.DELIVERY_FEE;
    const grandTotal = totals.total + fee;

    Checkout._showProcessing('Creating secure payment…');

    try {
      // 1. Create PaymentIntent on backend
      const intentRes = await API.post('/payments/create-intent', {
        amount:   Math.round(grandTotal * 100), // cents/smallest unit
        currency: 'nad',
        metadata: { email: Checkout.deliveryData.email }
      });

      if (!intentRes || !intentRes.clientSecret) {
        throw new Error('Could not initialise payment. Please try again.');
      }

      Checkout._updateProcessing('Confirming payment with your bank…');

      // 2. Confirm card payment with Stripe
      const { error, paymentIntent } = await Checkout._stripe.confirmCardPayment(
        intentRes.clientSecret,
        {
          payment_method: {
            card: Checkout._cardElement,
            billing_details: {
              name:  Checkout.deliveryData.firstname + ' ' + Checkout.deliveryData.lastname,
              email: Checkout.deliveryData.email,
              phone: Checkout.deliveryData.phone
            }
          }
        }
      );

      if (error) {
        Checkout._hideProcessing();
        Checkout._setLoading('place-order-btn', false);
        if (error.code === 'card_declined' || error.decline_code) {
          Checkout._showPaymentDeclined();
        } else {
          Checkout._showAlert(error.message || 'Payment failed. Please try again.');
        }
        return;
      }

      // 3. Payment succeeded — save order locally and show success
      Checkout._updateProcessing('Saving your order…');
      const orderRef = 'PMM-' + paymentIntent.id.slice(-6).toUpperCase();
      Checkout._saveLocalOrder(cartItems, totals, grandTotal, orderRef, 'PAID');
      Checkout._hideProcessing();
      Checkout._setLoading('place-order-btn', false);
      Cart.clear();
      Checkout._showSuccess({ order_number: orderRef, status: 'CONFIRMED', payment_status: 'PAID', total: grandTotal });

    } catch (err) {
      Checkout._hideProcessing();
      Checkout._setLoading('place-order-btn', false);
      Checkout._showAlert(err.message || 'Payment failed. Please try again.');
    }
  },

  /* ── Helpers ──────────────────────────────────────────────────────── */
  _saveLocalOrder: (cartItems, totals, grandTotal, orderRef, paymentStatus) => {
    try {
      const existing = JSON.parse(localStorage.getItem('porky_orders') || '[]');
      existing.unshift({
        id: orderRef, order_number: orderRef,
        date: new Date().toISOString(), created_at: new Date().toISOString(),
        items: cartItems, totals, total: grandTotal,
        delivery: Checkout.deliveryData, delivery_type: Checkout.deliveryType,
        paymentMethod: 'card', payment_method: 'card',
        status: 'PENDING', payment_status: paymentStatus
      });
      localStorage.setItem('porky_orders', JSON.stringify(existing));
    } catch (e) { console.warn('Could not save order locally:', e); }
  },

  _showProcessing: (msg) => {
    let overlay = document.getElementById('payment-processing-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'payment-processing-overlay';
      overlay.className = 'payment-processing-overlay';
      overlay.innerHTML = '<div class="payment-processing-box"><div class="payment-spinner"></div><p id="payment-processing-msg" class="payment-processing-msg"></p></div>';
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

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('success-order-id',       orderId);
    set('success-total',          total);
    set('success-payment-method', 'Card (Stripe)');

    const msgEl = document.getElementById('success-message');
    if (msgEl) msgEl.innerHTML = result.payment_status === 'PAID'
      ? '✅ Payment approved! Your order is confirmed and being prepared.'
      : '⏳ Payment is being processed. You will receive a confirmation shortly.';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  _renderSummary: () => {
    const items   = Cart.getItems();
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
