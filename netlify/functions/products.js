/**
 * Products function - handles /api/products/*
 */
const { query } = require('./db');
const { authenticate, createResponse } = require('./middleware');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, {});
  }

  // Extract path after /api/products
  const fullPath = event.path;
  let path = '';
  
  if (fullPath.includes('/api/products')) {
    path = fullPath.replace('/api/products', '');
  } else if (fullPath.includes('/.netlify/functions/products')) {
    path = fullPath.replace('/.netlify/functions/products', '');
  }
  
  try {
    // Route based on path and method
    if (event.httpMethod === 'GET' && (path === '' || path === '/')) {
      return await handleGetAll(event);
    } else if (event.httpMethod === 'GET' && path.startsWith('/') && path !== '/featured' && path !== '/categories') {
      const id = path.substring(1);
      return await handleGetById(id);
    } else if (event.httpMethod === 'GET' && path === '/featured') {
      return await handleGetFeatured();
    } else if (event.httpMethod === 'GET' && path === '/categories') {
      return await handleGetCategories();
    } else {
      return createResponse(404, { error: 'Endpoint not found' });
    }
  } catch (error) {
    console.error('Products function error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

/**
 * GET /products
 */
async function handleGetAll(event) {
  const queryParams = event.queryStringParameters || {};
  const { category, featured, limit } = queryParams;
  
  try {
    let sql = 'SELECT * FROM products WHERE is_active = true';
    const params = [];
    
    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }
    
    if (featured === 'true') {
      sql += ' AND featured = true';
    }
    
    sql += ' ORDER BY created_at DESC';
    
    if (limit && !isNaN(parseInt(limit))) {
      params.push(parseInt(limit));
      sql += ` LIMIT $${params.length}`;
    }
    
    const result = await query(sql, params);
    return createResponse(200, result.rows);
  } catch (err) {
    console.error('Get products error:', err.message);
    return createResponse(500, { error: 'Failed to fetch products' });
  }
}

/**
 * GET /products/:id
 */
async function handleGetById(id) {
  if (!id) {
    return createResponse(400, { error: 'Product ID required' });
  }

  try {
    const result = await query(
      'SELECT * FROM products WHERE id = $1 AND is_active = true',
      [id]
    );
    
    if (!result.rows.length) {
      return createResponse(404, { error: 'Product not found' });
    }
    
    return createResponse(200, result.rows[0]);
  } catch (err) {
    console.error('Get product by ID error:', err.message);
    return createResponse(500, { error: 'Failed to fetch product' });
  }
}

/**
 * GET /products/featured
 */
async function handleGetFeatured() {
  try {
    const result = await query(
      'SELECT * FROM products WHERE featured = true AND is_active = true ORDER BY created_at DESC LIMIT 8'
    );
    return createResponse(200, result.rows);
  } catch (err) {
    console.error('Get featured products error:', err.message);
    return createResponse(500, { error: 'Failed to fetch featured products' });
  }
}

/**
 * GET /products/categories
 */
async function handleGetCategories() {
  try {
    const result = await query(
      'SELECT DISTINCT category FROM products WHERE is_active = true ORDER BY category'
    );
    const categories = result.rows.map(row => row.category);
    return createResponse(200, categories);
  } catch (err) {
    console.error('Get categories error:', err.message);
    return createResponse(500, { error: 'Failed to fetch categories' });
  }
}