// Catalog Page Logic

document.addEventListener('DOMContentLoaded', async () => {
  const productGrid = document.getElementById('product-grid');
  
  if (productGrid) {
    try {
      // Fetch products from API
      const response = await fetch('/api/products');
      const data = await response.json();
      
      // Render product cards
      data.products.forEach(product => {
        const card = new ProductCard(product, productGrid);
        card.render();
      });
    } catch (error) {
      console.error('Failed to load products:', error);
      productGrid.innerHTML = '<p>Failed to load products. Please try again later.</p>';
    }
  }
});

// Global function to add product to cart
function addToCart(productId) {
  const cart = new Cart();
  cart.addItem(productId, 1);
  alert('Product added to cart!');
}
