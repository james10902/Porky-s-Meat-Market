// Heritage Timeline Component

class HeritageTimeline {
  constructor(container) {
    this.container = container;
    this.events = [];
  }
  
  async loadEvents() {
    try {
      const response = await fetch('/assets/data/timeline.json');
      this.events = await response.json();
      this.render();
      this.setupIntersectionObserver();
    } catch (error) {
      console.error('Failed to load timeline events:', error);
    }
  }
  
  render() {
    const html = `
      <div class="timeline-container">
        ${this.events.map((event, index) => `
          <div class="timeline-event" data-index="${index}">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <h3>${event.year}</h3>
              <p>${event.description}</p>
              ${event.image ? `<img src="${event.image}" alt="${event.year}" loading="lazy" />` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
    this.container.innerHTML = html;
  }
  
  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.5 });
    
    document.querySelectorAll('.timeline-event').forEach(el => observer.observe(el));
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HeritageTimeline;
}
