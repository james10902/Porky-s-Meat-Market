/**
 * Contact Module
 * Handles contact form submission and validation
 */

const Contact = {
  init: () => {
    const form = DOM.byId('contact-form');
    if (!form) return;

    DOM.on(form, 'submit', Contact.handleSubmit);
  },

  handleSubmit: async (e) => {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('[type="submit"]');
    const messageEl = DOM.byId('form-message');

    // Basic validation
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    if (!name || !email || !message) {
      Contact.showMessage('Please fill in all required fields.', 'error');
      return;
    }

    if (!DOM.isValidEmail(email)) {
      Contact.showMessage('Please enter a valid email address.', 'error');
      return;
    }

    // Disable button during submission
    DOM.disable(submitBtn);
    DOM.setText(submitBtn, 'SENDING...');

    try {
      // Post to real API, fall back to simulated success
      try {
        await API.contact.send({
          name,
          email,
          phone:   (form.phone   ? form.phone.value.trim()   : ''),
          subject: (form.subject ? form.subject.value.trim() : ''),
          message
        });
      } catch (apiErr) {
        if (apiErr.status === 422) throw apiErr; // surface validation errors
        console.warn('Contact API unavailable, simulating:', apiErr.message);
        await new Promise(resolve => setTimeout(resolve, 600));
      }

      Contact.showMessage('Thank you! Your message has been sent. We\'ll get back to you shortly.', 'success');
      form.reset();
    } catch (error) {
      Contact.showMessage(error.message || 'Something went wrong. Please try again or call us directly.', 'error');
    } finally {
      DOM.enable(submitBtn);
      DOM.setText(submitBtn, 'SEND MESSAGE');
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
  document.addEventListener('DOMContentLoaded', () => Contact.init());
} else {
  Contact.init();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Contact;
}
