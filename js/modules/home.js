/**
 * Home Module — Handles home page functionality
 * Loads featured products from real API, falls back to mock data
 */

const Home = {
  init: async () => {
    try {
      await Home.loadCategories();
      await Home.loadFeaturedProducts();
      await Home.loadTimeline();
    } catch (error) {
      console.error('Home init error:', error);
    }
  },

  loadCategories: async () => {
    try {
      const container = DOM.byId('categories');
      if (!container) return;

      const categories = [
        { name: 'Beef',      emoji: '🥩', slug: 'beef' },
        { name: 'Pork',      emoji: '🐷', slug: 'pork' },
        { name: 'Chicken',   emoji: '🐔', slug: 'chicken' },
        { name: 'Processed', emoji: '🌭', slug: 'processed' },
        { name: 'Game',      emoji: '🦌', slug: 'game' }
      ];

      container.innerHTML = categories.map(cat => {
        return '<a href="/pages/products.html?category=' + cat.slug + '" class="card" style="text-decoration:none;text-align:center;">'
          + '<div style="font-size:2.5rem;margin-bottom:10px;">' + cat.emoji + '</div>'
          + '<h3 style="font-size:0.875rem;letter-spacing:0.08em;text-transform:uppercase;">' + cat.name + '</h3>'
          + '</a>';
      }).join('');
    } catch (error) {
      console.error('Category load error:', error);
    }
  },

  loadFeaturedProducts: async () => {
    try {
      const container = DOM.byId('featured-products');
      if (!container) return;

      let featured = null;

      // Try real API first
      try {
        const apiProducts = await API.products.getFeatured();
        if (Array.isArray(apiProducts) && apiProducts.length > 0) {
          featured = apiProducts.slice(0, 4).map(p => ({
            id:        p.id,
            name:      p.name,
            price:     parseFloat(p.price),
            unit:      p.unit || 'per kg',
            image_url: p.image_url || '/assets/Images/Gallery.jpg',
            category:  p.category_name || p.category_slug || ''
          }));
        }
      } catch (e) {
        console.warn('Featured products API unavailable, using mock data');
      }

      // Fallback mock data
      if (!featured) {
        featured = [
          { id: 1,  name: 'Beef mince',  price: 85.99, unit: 'per kg', image_url: '/assets/Images/Beef mince.jpg', category: 'Beef' },
          { id: 13, name: 'Pork Shoulder Chops', price: 89.99,  unit: 'per kg', image_url: '/assets/Images/Pork Shoulder Chops.jpg',      category: 'Pork' },
          { id: 12, name: 'Game Stew',           price: 149.99, unit: 'per kg', image_url: '/assets/Images/Game stew.jpg',                category: 'Game' },
          { id: 11, name: 'Droewors',            price: 189.99, unit: 'per kg', image_url: '/assets/Images/Droewors.jpg',                 category: 'Processed' }
        ];
      }

      container.innerHTML = featured.map(function(product) {
        var safeName = DOM.sanitizeHTML(product.name);
        var price    = 'N$' + product.price.toFixed(2);
        return '<div class="product-card">'
          + '<div class="product-image-wrap">'
          + '<img src="' + product.image_url + '" alt="' + safeName + '" class="product-image" loading="lazy" onerror="this.src=\'/assets/Images/Gallery.jpg\'">'
          + '<span class="product-category-tag">' + product.category + '</span>'
          + '</div>'
          + '<div class="product-info">'
          + '<h3 class="product-name">' + safeName + '</h3>'
          + '<div class="product-price">'
          + '<span class="price-amount">' + price + '</span>'
          + '<span class="price-unit">' + product.unit + '</span>'
          + '</div>'
          + '<div class="product-actions">'
          + '<button onclick="Home.addToCart(' + product.id + ', \'' + product.name.replace(/'/g, "\\'") + '\', ' + product.price + ', \'' + product.image_url + '\')" class="btn btn-quote" style="width:100%;">Add to Cart</button>'
          + '</div>'
          + '</div>'
          + '</div>';
      }).join('');
    } catch (error) {
      console.error('Featured products error:', error);
    }
  },

  loadTimeline: async () => {
    try {
      const container = DOM.byId('timeline');
      if (!container) return;

      const events = [
        { year: 1990, title: 'Founding',              description: "Porky's Meat Market founded during independence era" },
        { year: 1995, title: 'First Expansion',        description: 'Opened additional storage facility' },
        { year: 2004, title: 'Factory Expansion',      description: 'Major facility upgrade with modern cold storage' },
        { year: 2015, title: 'Digital Transformation', description: 'Launched online ordering system' },
        { year: 2020, title: 'B2B Portal',             description: 'Introduced wholesale portal for bulk orders' },
        { year: 2026, title: 'Present Day',            description: 'Serving over 500+ customers nationwide' }
      ];

      container.innerHTML = events.map(function(event, index) {
        return '<div class="timeline-item">'
          + '<div class="timeline-marker">' + (index + 1) + '</div>'
          + '<div class="timeline-content">'
          + '<div class="timeline-year">' + event.year + '</div>'
          + '<h4>' + event.title + '</h4>'
          + '<p class="timeline-description">' + event.description + '</p>'
          + '</div>'
          + '</div>';
      }).join('');

      Home.setupTimelineAnimations();
    } catch (error) {
      console.error('Timeline error:', error);
    }
  },

  setupTimelineAnimations: () => {
    const items = document.querySelectorAll('.timeline-item');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });

    items.forEach(item => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';
      item.style.transition = 'opacity 600ms ease, transform 600ms ease';
      observer.observe(item);
    });
  },

  addToCart: (productId, name, price, imageUrl) => {
    const product = { id: productId, name: name, price: price, image_url: imageUrl || '', category: '' };
    Cart.addItem(product, 1);
    CartDrawer.open();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (DOM.byId('featured-products')) Home.init();
  });
} else {
  if (DOM.byId('featured-products')) Home.init();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Home;
}

/* ── Market Status Widget ── */
const MarketStatus = {
  // Hours in Namibia/Windhoek time (UTC+2)
  schedule: {
    1: { open: '07:00', close: '15:30' }, // Mon
    2: { open: '07:00', close: '15:30' }, // Tue
    3: { open: '07:00', close: '15:30' }, // Wed
    4: { open: '07:00', close: '15:30' }, // Thu
    5: { open: '07:00', close: '15:30' }, // Fri
    6: { open: '08:00', close: '12:00' }, // Sat
    0: null                                // Sun — closed
  },

  init: () => {
    const bar     = document.getElementById('market-status-bar');
    const dot     = document.getElementById('market-status-dot');
    const text    = document.getElementById('market-status-text');
    const hours   = document.getElementById('market-status-hours');
    if (!bar) return;

    const update = () => {
      // Get current Windhoek time (UTC+2)
      const now     = new Date();
      const utc     = now.getTime() + now.getTimezoneOffset() * 60000;
      const wdh     = new Date(utc + 2 * 3600000);
      const day     = wdh.getDay();
      const hhmm    = wdh.getHours() * 100 + wdh.getMinutes();
      const today   = MarketStatus.schedule[day];

      if (!today) {
        // Sunday
        dot.className   = 'market-status-dot closed';
        text.className  = 'market-status-text closed';
        text.textContent = 'CLOSED TODAY';
        hours.textContent = '· Opens Monday at 7:00 AM';
        return;
      }

      const openNum  = parseInt(today.open.replace(':', ''), 10);
      const closeNum = parseInt(today.close.replace(':', ''), 10);
      const isOpen   = hhmm >= openNum && hhmm < closeNum;

      if (isOpen) {
        dot.className   = 'market-status-dot open';
        text.className  = 'market-status-text open';
        text.textContent = 'OPEN NOW';
        hours.textContent = '· Closes at ' + MarketStatus._fmt(today.close);
      } else if (hhmm < openNum) {
        dot.className   = 'market-status-dot closed';
        text.className  = 'market-status-text closed';
        text.textContent = 'CLOSED';
        hours.textContent = '· Opens today at ' + MarketStatus._fmt(today.open);
      } else {
        dot.className   = 'market-status-dot closed';
        text.className  = 'market-status-text closed';
        text.textContent = 'CLOSED';
        const nextDay = MarketStatus._nextOpenDay(day);
        hours.textContent = '· ' + nextDay;
      }
    };

    update();
    setInterval(update, 60000); // refresh every minute
  },

  _fmt: (hhmm) => {
    const [h, m] = hhmm.split(':');
    const hr = parseInt(h, 10);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const hr12 = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
    return hr12 + ':' + m + ' ' + ampm;
  },

  _nextOpenDay: (currentDay) => {
    const names = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    for (let i = 1; i <= 7; i++) {
      const next = (currentDay + i) % 7;
      const s = MarketStatus.schedule[next];
      if (s) return 'Opens ' + names[next] + ' at ' + MarketStatus._fmt(s.open);
    }
    return 'Reopens Monday';
  }
};

document.addEventListener('DOMContentLoaded', () => MarketStatus.init());
