/**
 * Products Module
 * Handles product catalog display and filtering
 * Prices in NAD (Namibian Dollar) per kg — market-realistic 2025 rates
 */

const Products = {
  allProducts: [],
  filteredProducts: [],
  currentPage: 1,
  itemsPerPage: 12,
  categories: [],

  init: async () => {
    try {
      await Products.loadCategories();
      Products.setupEventListeners();
      await Products.loadProducts();
    } catch (error) {
      console.error('Products init error:', error);
      Products.showError('Failed to load products');
    }
  },

  loadCategories: async () => {
    try {
      Products.categories = [
        { id: 1, name: 'All',       slug: '' },
        { id: 2, name: 'Beef',      slug: 'beef' },
        { id: 3, name: 'Pork',      slug: 'pork' },
        { id: 4, name: 'Chicken',   slug: 'chicken' },
        { id: 5, name: 'Processed', slug: 'processed' },
        { id: 6, name: 'Game',      slug: 'game' },
        { id: 7, name: 'Bulk',      slug: 'bulk' }
      ];

      // Try to load real categories from API
      try {
        var apiCats = await API.products.getCategories();
        if (Array.isArray(apiCats) && apiCats.length > 0) {
          Products.categories = [{ id: 0, name: 'All', slug: '' }, ...apiCats];
        }
      } catch (e) { /* use defaults */ }

      var categoryFilter = DOM.byId('category-filter');
      if (categoryFilter) {
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        Products.categories.slice(1).forEach(function(cat) {
          var option = document.createElement('option');
          option.value = cat.slug;
          option.textContent = cat.name + (cat.product_count ? ' (' + cat.product_count + ')' : '');
          categoryFilter.appendChild(option);
        });
      }

      var params = new URLSearchParams(window.location.search);
      var catParam = params.get('category');
      if (catParam && categoryFilter) categoryFilter.value = catParam;
    } catch (error) {
      console.error('Category load error:', error);
    }
  },

  getMockProducts: function() {
    // Prices in NAD per kg — realistic Namibian retail/wholesale 2025
    return [
      {
        id: 1,
        name: 'Beef mince',
        price: 85.99,
        unit: 'per kg',
        category: 'beef',
        image_url: '/assets/Images/Beef mince.jpg',
        description: 'Fresh beef mince and traditional boerewors — a braai essential.'
      },
      {
        id: 2,
        name: 'Beef Stew',
        price: 109.99,
        unit: 'per kg',
        category: 'beef',
        image_url: '/assets/Images/Beef Stew.jpg',
        description: 'Tender beef stew cuts, perfect for slow-cooking.'
      },
      {
        id: 3,
        name: 'Big Polonies',
        price: 54.99,
        unit: 'per kg',
        category: 'processed',
        image_url: '/assets/Images/Big polonies.jpg',
        description: 'Classic large polony — a Namibian lunchbox staple.'
      },
      {
        id: 4,
        name: 'Mini Polony',
        price: 49.99,
        unit: 'per kg',
        category: 'processed',
        image_url: '/assets/Images/Mini polony.jpg',
        description: 'Convenient mini polony portions for everyday use.'
      },
      {
        id: 5,
        name: 'Chicken Breast (Bone-in)',
        price: 74.99,
        unit: 'per kg',
        category: 'chicken',
        image_url: '/assets/Images/Chicken Breast Bone.jpg',
        description: 'Juicy bone-in chicken breast, great for grilling or roasting.'
      },
      {
        id: 6,
        name: 'Chicken Feet',
        price: 29.99,
        unit: 'per kg',
        category: 'chicken',
        image_url: '/assets/Images/Chicken Feet.jpg',
        description: 'Fresh chicken feet — popular for soups and stews.'
      },
      {
        id: 7,
        name: 'Chicken Leg Quarters',
        price: 64.99,
        unit: 'per kg',
        category: 'chicken',
        image_url: '/assets/Images/Chicken Leg Quatres.jpg',
        description: 'Meaty chicken leg quarters, ideal for braai or oven.'
      },
      {
        id: 8,
        name: 'Chicken Liver',
        price: 34.99,
        unit: 'per kg',
        category: 'chicken',
        image_url: '/assets/Images/Chicken Liver.jpg',
        description: 'Fresh chicken livers, rich in flavour and nutrients.'
      },
      {
        id: 9,
        name: 'Chicken Necks',
        price: 24.99,
        unit: 'per kg',
        category: 'chicken',
        image_url: '/assets/Images/Chicken Necks.jpg',
        description: 'Chicken necks — perfect for stocks, soups, and braai.'
      },
      {
        id: 10,
        name: 'Chicken Soup Pack',
        price: 44.99,
        unit: 'per pack',
        category: 'chicken',
        image_url: '/assets/Images/Chicken Soup Pack.jpg',
        description: 'All-in-one chicken soup pack with mixed cuts.'
      },
      {
        id: 11,
        name: 'Droëwors',
        price: 189.99,
        unit: 'per kg',
        category: 'processed',
        image_url: '/assets/Images/Droewors.jpg',
        description: 'Traditional dried wors — a Namibian snack favourite.'
      },
      {
        id: 12,
        name: 'Game Stew',
        price: 149.99,
        unit: 'per kg',
        category: 'game',
        image_url: '/assets/Images/Game stew.jpg',
        description: 'Premium Namibian game stew cuts — wild and flavourful.'
      },
      {
        id: 13,
        name: 'Pork Shoulder Chops',
        price: 89.99,
        unit: 'per kg',
        category: 'pork',
        image_url: '/assets/Images/Pork Shoulder chops.jpg',
        description: 'Thick-cut pork shoulder chops, great for braai or pan-fry.'
      },
      {
        id: 14,
        name: 'Bulk Meat Pack',
        price: 549.99,
        unit: 'per 5 kg box',
        category: 'bulk',
        image_url: '/assets/Images/product-bulk.jpg',
        description: 'Value bulk pack — mixed cuts for households and hawkers.'
      }
    ];
  },

  loadProducts: async function(filters) {
    filters = filters || {};
    try {
      var loading = DOM.byId('loading');
      if (loading) loading.style.display = 'flex';

      // Try real API first
      try {
        var params = {};
        if (filters.search)   params.search   = filters.search;
        if (filters.category) params.category = filters.category;
        if (filters.sort)     params.sort     = filters.sort;
        params.limit = Products.itemsPerPage;
        params.page  = Products.currentPage;

        var apiResult = await API.products.getAll(params);
        if (apiResult && Array.isArray(apiResult.products)) {
          // Store for cart lookups
          Products.allProducts = apiResult.products.map(function(p) {
            return { id: p.id, name: p.name, price: parseFloat(p.price), unit: p.unit || 'per kg', image_url: p.image_url || '', category: p.category_slug || '' };
          });

          var noResults = DOM.byId('no-results');
          var container = DOM.byId('product-list');
          if (apiResult.products.length === 0) {
            if (noResults) noResults.style.display = 'flex';
            if (container) container.innerHTML = '';
          } else {
            if (noResults) noResults.style.display = 'none';
            if (container) {
              container.innerHTML = apiResult.products.map(function(product) {
                var catName = product.category_slug || product.category || '';
                var safeName = DOM.sanitizeHTML(product.name);
                var safeDesc = DOM.sanitizeHTML(product.description || '');
                var img = product.image_url || '/assets/Images/Gallery.jpg';
                var price = parseFloat(product.price).toFixed(2);
                var unit = product.unit || 'per kg';
                return '<div class="product-card">'
                  + '<div class="product-image-wrap">'
                  + '<img src="' + img + '" alt="' + safeName + '" class="product-image" loading="lazy" onerror="this.src=\'/assets/Images/Gallery.jpg\'">'
                  + '<span class="product-category-tag">' + catName + '</span>'
                  + '</div>'
                  + '<div class="product-info">'
                  + '<h3 class="product-name">' + safeName + '</h3>'
                  + '<p class="product-description">' + safeDesc + '</p>'
                  + '<div class="product-price">'
                  + '<span class="price-amount">N$' + price + '</span>'
                  + '<span class="price-unit">' + unit + '</span>'
                  + '</div>'
                  + '<div class="product-actions">'
                  + '<button onclick="Products.addToCart(' + product.id + ')" class="btn btn-quote" style="flex:1;">Add to Cart</button>'
                  + '<button onclick="CartDrawer.open()" class="btn btn-secondary">View Cart</button>'
                  + '</div>'
                  + '</div>'
                  + '</div>';
              }).join('');
            }
          }

          // Pagination from API
          var pg = apiResult.pagination;
          var paginationEl = DOM.byId('pagination');
          if (paginationEl && pg && pg.pages > 1) {
            var html = '<div class="flex-center" style="gap:8px;">';
            if (pg.page > 1) html += '<button onclick="Products.goToPage(' + (pg.page - 1) + ')" class="btn btn-secondary btn-sm">← Prev</button>';
            for (var i = 1; i <= pg.pages; i++) {
              html += i === pg.page
                ? '<button class="btn btn-quote btn-sm" disabled>' + i + '</button>'
                : '<button onclick="Products.goToPage(' + i + ')" class="btn btn-secondary btn-sm">' + i + '</button>';
            }
            if (pg.page < pg.pages) html += '<button onclick="Products.goToPage(' + (pg.page + 1) + ')" class="btn btn-secondary btn-sm">Next →</button>';
            html += '</div>';
            paginationEl.innerHTML = html;
          } else if (paginationEl) {
            paginationEl.innerHTML = '';
          }

          if (loading) loading.style.display = 'none';
          return;
        }
      } catch (apiErr) {
        console.warn('API unavailable, using local data:', apiErr.message);
      }

      // Fallback: local mock data
      Products.allProducts = Products.getMockProducts();
      Products.filterProducts(filters);
      Products.renderProducts();

      if (loading) loading.style.display = 'none';
    } catch (error) {
      console.error('Products load error:', error);
      Products.showError('Failed to load products');
    }
  },

  filterProducts: function(filters) {
    filters = filters || {};
    var filtered = Products.allProducts.slice();

    if (filters.search) {
      var q = filters.search.toLowerCase();
      filtered = filtered.filter(function(p) {
        return p.name.toLowerCase().indexOf(q) !== -1 ||
               p.description.toLowerCase().indexOf(q) !== -1;
      });
    }

    if (filters.category) {
      filtered = filtered.filter(function(p) { return p.category === filters.category; });
    }

    if (filters.sort) {
      if (filters.sort === 'price-low')  filtered.sort(function(a,b){ return a.price - b.price; });
      if (filters.sort === 'price-high') filtered.sort(function(a,b){ return b.price - a.price; });
      if (filters.sort === 'name')       filtered.sort(function(a,b){ return a.name.localeCompare(b.name); });
    }

    Products.filteredProducts = filtered;
    Products.currentPage = 1;
  },

  renderProducts: function() {
    var container = DOM.byId('product-list');
    if (!container) return;

    var start = (Products.currentPage - 1) * Products.itemsPerPage;
    var end   = start + Products.itemsPerPage;
    var page  = Products.filteredProducts.slice(start, end);

    var noResults = DOM.byId('no-results');
    if (page.length === 0) {
      if (noResults) noResults.style.display = 'flex';
      container.innerHTML = '';
      Products.renderPagination();
      return;
    }

    if (noResults) noResults.style.display = 'none';

    container.innerHTML = page.map(function(product) {
      return '<div class="product-card">'
        + '<div class="product-image-wrap">'
        + '<img src="' + product.image_url + '" alt="' + DOM.sanitizeHTML(product.name) + '" class="product-image" loading="lazy" onerror="this.src=\'/assets/Images/Gallery.jpg\'">'
        + '<span class="product-category-tag">' + product.category + '</span>'
        + '</div>'
        + '<div class="product-info">'
        + '<h3 class="product-name">' + DOM.sanitizeHTML(product.name) + '</h3>'
        + '<p class="product-description">' + DOM.sanitizeHTML(product.description) + '</p>'
        + '<div class="product-price">'
        + '<span class="price-amount">N$' + product.price.toFixed(2) + '</span>'
        + '<span class="price-unit">' + (product.unit || 'per kg') + '</span>'
        + '</div>'
        + '<div class="product-actions">'
        + '<button onclick="Products.addToCart(' + product.id + ')" class="btn btn-quote" style="flex:1;">Add to Cart</button>'
        + '<button onclick="CartDrawer.open()" class="btn btn-secondary">View Cart</button>'
        + '</div>'
        + '</div>'
        + '</div>';
    }).join('');

    Products.renderPagination();
  },

  renderPagination: function() {
    var container = DOM.byId('pagination');
    if (!container) return;

    var totalPages = Math.ceil(Products.filteredProducts.length / Products.itemsPerPage);
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    var html = '<div class="flex-center" style="gap:8px;">';
    if (Products.currentPage > 1) {
      html += '<button onclick="Products.goToPage(' + (Products.currentPage - 1) + ')" class="btn btn-secondary btn-sm">← Prev</button>';
    }
    for (var i = 1; i <= totalPages; i++) {
      if (i === Products.currentPage) {
        html += '<button class="btn btn-quote btn-sm" disabled>' + i + '</button>';
      } else {
        html += '<button onclick="Products.goToPage(' + i + ')" class="btn btn-secondary btn-sm">' + i + '</button>';
      }
    }
    if (Products.currentPage < totalPages) {
      html += '<button onclick="Products.goToPage(' + (Products.currentPage + 1) + ')" class="btn btn-secondary btn-sm">Next →</button>';
    }
    html += '</div>';
    container.innerHTML = html;
  },

  goToPage: function(page) {
    Products.currentPage = page;
    // Re-run with current filter values
    var searchInput    = DOM.byId('search');
    var categoryFilter = DOM.byId('category-filter');
    var sortSelect     = DOM.byId('sort');
    Products.loadProducts({
      search:   searchInput    ? searchInput.value    : '',
      category: categoryFilter ? categoryFilter.value : '',
      sort:     sortSelect     ? sortSelect.value     : 'name'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  addToCart: function(productId) {
    var product = Products.allProducts.find(function(p) { return p.id === productId; });
    if (product) {
      Cart.addItem(product, 1);
      CartDrawer.open();
    }
  },

  setupEventListeners: function() {
    var searchInput    = DOM.byId('search');
    var categoryFilter = DOM.byId('category-filter');
    var sortSelect     = DOM.byId('sort');

    function applyFilters() {
      Products.loadProducts({
        search:   searchInput    ? searchInput.value    : '',
        category: categoryFilter ? categoryFilter.value : '',
        sort:     sortSelect     ? sortSelect.value     : 'name'
      });
    }

    if (searchInput)    DOM.on(searchInput,    'input',  applyFilters);
    if (categoryFilter) DOM.on(categoryFilter, 'change', applyFilters);
    if (sortSelect)     DOM.on(sortSelect,     'change', applyFilters);
  },

  showError: function(message) {
    var container = DOM.byId('product-list');
    if (container) {
      container.innerHTML = '<div class="alert alert-danger" style="grid-column:1/-1;">' + message + '</div>';
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    if (DOM.byId('product-list')) Products.init();
  });
} else {
  if (DOM.byId('product-list')) Products.init();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Products;
}
