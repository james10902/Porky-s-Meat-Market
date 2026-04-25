/**
 * Animations Module
 * - Scroll-triggered reveal for sections
 * - Auto-scrolling product slider on homepage
 */

const Animations = {
  _observer: null,

  init: () => {
    Animations._initScrollReveal();
    Animations._initProductSlider();
  },

  /* ── Scroll Reveal ── */
  _initScrollReveal: () => {
    const targets = document.querySelectorAll(
      '.reveal, .reveal-left, .reveal-right, ' +
      '.feature-item, .value-card, .timeline-item, ' +
      '.review-card, .product-card, .slider-card'
    );

    if (!targets.length) return;

    Animations._observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          Animations._observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(el => {
      // Add reveal class if not already present
      if (!el.classList.contains('reveal') &&
          !el.classList.contains('reveal-left') &&
          !el.classList.contains('reveal-right')) {
        el.classList.add('reveal');
      }
      Animations._observer.observe(el);
    });
  },

  /* ── Product Slider ── */
  _initProductSlider: () => {
    const wrapper = document.getElementById('product-slider-wrapper');
    if (!wrapper) return;

    const products = [
      { name: 'Beef Mince',           price: 'N$85.99/kg',  img: '/assets/Images/Beef mince.jpg' },
      { name: 'Beef Stew',            price: 'N$109.99/kg', img: '/assets/Images/Beef Stew.jpg' },
      { name: 'Beef Wors',            price: 'N$129.99/kg', img: '/assets/Images/Beef Wors.jpg' },
      { name: 'Chicken Breast',       price: 'N$79.99/kg',  img: '/assets/Images/Chicken Breast Bone.jpg' },
      { name: 'Chicken Feet',         price: 'N$29.99/kg',  img: '/assets/Images/Chicken Feet.jpg' },
      { name: 'Chicken Leg Quarters', price: 'N$59.99/kg',  img: '/assets/Images/Chicken Leg Quatres.jpg' },
      { name: 'Chicken Liver',        price: 'N$34.99/kg',  img: '/assets/Images/Chicken Liver.jpg' },
      { name: 'Chicken Necks',        price: 'N$24.99/kg',  img: '/assets/Images/Chicken Necks.jpg' },
      { name: 'Droewors',             price: 'N$189.99/kg', img: '/assets/Images/Droewors.jpg' },
      { name: 'Game Stew',            price: 'N$149.99/kg', img: '/assets/Images/Game stew.jpg' },
      { name: 'Big Polonies',         price: 'N$54.99/kg',  img: '/assets/Images/Big polonies.jpg' },
      { name: 'Mini Polony',          price: 'N$49.99/kg',  img: '/assets/Images/Mini polony.jpg' },
      { name: 'Pork Lion Chops',      price: 'N$99.99/kg',  img: '/assets/Images/Pork Lion Chops.jpg' },
      { name: 'Pork Shoulder Chops',  price: 'N$89.99/kg',  img: '/assets/Images/Pork Shoulder chops.jpg' }
    ];

    // Duplicate for seamless loop
    const all = [...products, ...products];
    const cardHtml = all.map(p => `
      <a href="/pages/products.html" class="slider-card" aria-label="${p.name}">
        <img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.src='/assets/Images/Gallery.jpg'">
        <div class="slider-card-info">
          <div class="slider-card-name">${p.name}</div>
          <div class="slider-card-price">${p.price}</div>
        </div>
      </a>`).join('');

    wrapper.innerHTML = `<div class="product-slider-track" id="product-slider-track">${cardHtml}</div>`;
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', Animations.init);
} else {
  Animations.init();
}

if (typeof module !== 'undefined' && module.exports) module.exports = Animations;
