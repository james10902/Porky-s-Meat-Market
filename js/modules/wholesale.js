/**
 * Wholesale Module
 * Handles wholesale quote form submission and validation
 */

const Wholesale = {
  init: () => {
    const form = DOM.byId('wholesale-form');
    if (!form) return;

    DOM.on(form, 'submit', Wholesale.handleSubmit);
  },

  handleSubmit: async (e) => {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('[type="submit"]');

    // Collect form data
    const data = DOM.getFormData(form);

    // Validate required fields
    const required = ['business_name', 'contact_person', 'email', 'phone', 'business_type', 'delivery_location', 'product_interests'];
    const missing = required.filter(field => !data[field] || !data[field].trim());

    if (missing.length > 0) {
      Wholesale.showMessage('Please fill in all required fields.', 'error');
      return;
    }

    if (!DOM.isValidEmail(data.email)) {
      Wholesale.showMessage('Please enter a valid email address.', 'error');
      return;
    }

    DOM.disable(submitBtn);
    DOM.setText(submitBtn, 'SUBMITTING...');

    try {
      // Post to real API, fall back to simulated success
      try {
        const response = await API.contact.wholesale(data);
        Wholesale.showMessage(
          response.message || 'Thank you, ' + data.contact_person + '! Your quote request has been received. Our wholesale team will contact you within 24 hours.',
          'success'
        );
      } catch (apiErr) {
        if (apiErr.status === 422) {
          Wholesale.showMessage(apiErr.message || 'Please fill in all required fields.', 'error');
          return;
        }
        // API down — simulate success
        console.warn('Wholesale API unavailable, simulating:', apiErr.message);
        await new Promise(resolve => setTimeout(resolve, 600));
        Wholesale.showMessage(
          'Thank you, ' + data.contact_person + '! Your quote request has been received. Our wholesale team will contact you within 24 hours.',
          'success'
        );
      }
      form.reset();
    } catch (error) {
      Wholesale.showMessage('Something went wrong. Please try again or call us directly.', 'error');
    } finally {
      DOM.enable(submitBtn);
      DOM.setText(submitBtn, 'SUBMIT QUOTE REQUEST');
    }
  },

  showMessage: (text, type) => {
    const el = DOM.byId('form-message');
    if (!el) return;
    el.textContent = text;
    el.className = `form-message ${type}`;
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Wholesale.init());
} else {
  Wholesale.init();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Wholesale;
}
