/**
 * Heritage Module
 * Handles heritage page timeline loading and animations
 */

const Heritage = {
  init: async () => {
    try {
      await Heritage.loadTimeline();
    } catch (error) {
      console.error('Heritage init error:', error);
    }
  },

  loadTimeline: async () => {
    const container = DOM.byId('timeline');
    if (!container) return;

    const events = [
      {
        year: '1990',
        title: 'The Beginning',
        description: 'Porky\'s Meat Market opens its doors in Lafrenz, Windhoek — the same year Namibia gained independence. A small family butchery with a big vision.'
      },
      {
        year: '1995',
        title: 'First Expansion',
        description: 'Growing demand leads to the opening of an additional cold storage facility, allowing Porky\'s to serve more clients across Windhoek.'
      },
      {
        year: '2000',
        title: 'Institutional Contracts',
        description: 'Porky\'s secures its first government and hospital supply contracts, marking the transition from retail to wholesale.'
      },
      {
        year: '2004',
        title: 'Factory Upgrade',
        description: 'Major facility upgrade at Rendsburger Street — modern cold storage, expanded processing lines, and HACCP compliance certification.'
      },
      {
        year: '2010',
        title: 'National Reach',
        description: 'Cold-chain delivery network extended to all 14 regions of Namibia. Schools, barracks, and service stations added to the client roster.'
      },
      {
        year: '2015',
        title: 'Digital Ordering',
        description: 'Launch of the online ordering system, making it easier for B2B clients to place and track bulk orders.'
      },
      {
        year: '2020',
        title: 'B2B Wholesale Portal',
        description: 'Dedicated wholesale portal introduced for hawkers, hospitals, and institutional buyers — streamlining bulk orders and pricing.'
      },
      {
        year: '2026',
        title: 'Present Day',
        description: 'Serving 500+ B2B clients nationwide. Three generations of family ownership. Still proudly Namibian, still meating the need.'
      }
    ];

    container.innerHTML = events.map((event, index) => `
      <div class="timeline-item">
        <div class="timeline-marker"></div>
        <div class="timeline-content">
          <div class="timeline-year">${event.year}</div>
          <h3>${event.title}</h3>
          <p>${event.description}</p>
        </div>
      </div>
    `).join('');

    Heritage.setupAnimations();
  },

  setupAnimations: () => {
    const items = document.querySelectorAll('.timeline-item');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    items.forEach(item => {
      item.classList.add('hidden');
      observer.observe(item);
    });
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (DOM.byId('timeline')) Heritage.init();
  });
} else {
  if (DOM.byId('timeline')) Heritage.init();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Heritage;
}
