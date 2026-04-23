// Product Card Component

class ProductCard {
  constructor(product, container) {
    this.product = product;
    this.container = container;
  }
  
  render() {
    const html = `
      <div class="product-card" data-product-id="${this.product.id}">
        <div class="product-image">
          <img 
            src="${this.product.image_url}" 
            alt="${this.sanitize(this.product.name)}"
            loading="lazy"
            onerror="this.src='/assets/images/placeholder.png'"
          />
        </div>
        <div class="product-info">
          <h3 class="product-name">${this.sanitize(this.product.name)}</h3>
          <p class="product-description">${this.sanitize(this.product.description)}</p>
          <div class="product-footer">
            <span class="product-price">N$${this.product.price.toFixed(2)}</span>
            <button class="btn btn-primary" onclick="addToCart('${this.product.id}')">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    `;
    this.container.innerHTML += html;
  }
  
  sanitize(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProductCard;
}
