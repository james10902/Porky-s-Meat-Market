/**
 * Orders function - handles /api/orders/*
 */
const db = require('./db');
const { authenticate, createResponse } = require('./middleware');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, {});
  }

  // Extract path after /api/orders
  const fullPath = event.path;
  let path = '';
  
  if (fullPath.includes('/api/orders')) {
    path = fullPath.replace('/api/orders', '');
  } else if (fullPath.includes('/.netlify/functions/orders')) {
    path = fullPath.replace('/.netlify/functions/orders', '');
  }
  
  try {
    // Route based on path and method
    if (event.httpMethod === 'POST' && (path === '' || path === '/')) {
      return await handleCreateOrder(event);
    } else if (event.httpMethod === 'GET' && (path === '' || path === '/')) {
      return await handleGetAllOrders(event);
    } else if (event.httpMethod === 'GET' && path.startsWith('/') && !path.includes('/tracking') && !path.includes('/cancel')) {
      const id = path.substring(1);
      return await handleGetOrderById(event, id);
    } else if (event.httpMethod === 'GET' && path.includes('/tracking')) {
      const id = path.split('/')[1];
      return await handleGetOrderTracking(event, id);
    } else if (event.httpMethod === 'PATCH' && path.includes('/cancel')) {
      const id = path.split('/')[1];
      return await handleCancelOrder(event, id);
    } else if (event.httpMethod === 'DELETE' && path.startsWith('/')) {
      const id = path.substring(1);
      return await handleDeleteOrder(event, id);
    } else {
      return createResponse(404, { error: 'Endpoint not found' });
    }
  } catch (error) {
    console.error('Orders function error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

/**
 * POST /orders
 */
async function handleCreateOrder(event) {
  const authResult = await authenticate(event);
  if (authResult.error) {
    return createResponse(authResult.status, { error: authResult.error });
  }

  const orderData = JSON.parse(event.body || '{}');
  const { items, shippingAddress, paymentMethod, totalAmount } = orderData;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return createResponse(400, { error: 'Order must contain at least one item' });
  }

  try {
    // Start transaction
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders (user_id, shipping_address, payment_method, total_amount, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [authResult.user.id, shippingAddress || null, paymentMethod || 'cash', totalAmount || 0, 'pending']
      );
      
      const orderId = orderResult.rows[0].id;
      
      // Insert order items
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [orderId, item.productId, item.quantity, item.unitPrice || 0]
        );
      }
      
      await client.query('COMMIT');
      
      return createResponse(201, { 
        message: 'Order created successfully',
        orderId: orderId 
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Create order error:', err.message);
    return createResponse(500, { error: 'Failed to create order' });
  }
}

/**
 * GET /orders
 */
async function handleGetAllOrders(event) {
  const authResult = await authenticate(event);
  if (authResult.error) {
    return createResponse(authResult.status, { error: authResult.error });
  }

  try {
    const result = await db.query(
      `SELECT o.*, 
              json_agg(oi.*) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [authResult.user.id]
    );
    
    return createResponse(200, result.rows);
  } catch (err) {
    console.error('Get orders error:', err.message);
    return createResponse(500, { error: 'Failed to fetch orders' });
  }
}

/**
 * GET /orders/:id
 */
async function handleGetOrderById(event, id) {
  const authResult = await authenticate(event);
  if (authResult.error) {
    return createResponse(authResult.status, { error: authResult.error });
  }

  if (!id) {
    return createResponse(400, { error: 'Order ID required' });
  }

  try {
    const result = await db.query(
      `SELECT o.*, 
              json_agg(oi.*) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = $1 AND o.user_id = $2
       GROUP BY o.id`,
      [id, authResult.user.id]
    );
    
    if (!result.rows.length) {
      return createResponse(404, { error: 'Order not found' });
    }
    
    return createResponse(200, result.rows[0]);
  } catch (err) {
    console.error('Get order by ID error:', err.message);
    return createResponse(500, { error: 'Failed to fetch order' });
  }
}

/**
 * GET /orders/:id/tracking
 */
async function handleGetOrderTracking(event, id) {
  const authResult = await authenticate(event);
  if (authResult.error) {
    return createResponse(authResult.status, { error: authResult.error });
  }

  if (!id) {
    return createResponse(400, { error: 'Order ID required' });
  }

  try {
    const result = await db.query(
      `SELECT tracking_number, carrier, status, estimated_delivery, tracking_url
       FROM order_tracking
       WHERE order_id = $1`,
      [id]
    );
    
    if (!result.rows.length) {
      return createResponse(404, { error: 'Tracking information not found' });
    }
    
    return createResponse(200, result.rows[0]);
  } catch (err) {
    console.error('Get tracking error:', err.message);
    return createResponse(500, { error: 'Failed to fetch tracking information' });
  }
}

/**
 * PATCH /orders/:id/cancel
 */
async function handleCancelOrder(event, id) {
  const authResult = await authenticate(event);
  if (authResult.error) {
    return createResponse(authResult.status, { error: authResult.error });
  }

  if (!id) {
    return createResponse(400, { error: 'Order ID required' });
  }

  try {
    const result = await db.query(
      `UPDATE orders 
       SET status = 'cancelled', cancelled_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status IN ('pending', 'processing')
       RETURNING id`,
      [id, authResult.user.id]
    );
    
    if (!result.rows.length) {
      return createResponse(404, { error: 'Order not found or cannot be cancelled' });
    }
    
    return createResponse(200, { message: 'Order cancelled successfully' });
  } catch (err) {
    console.error('Cancel order error:', err.message);
    return createResponse(500, { error: 'Failed to cancel order' });
  }
}

/**
 * DELETE /orders/:id
 */
async function handleDeleteOrder(event, id) {
  const authResult = await authenticate(event);
  if (authResult.error) {
    return createResponse(authResult.status, { error: authResult.error });
  }

  if (!id) {
    return createResponse(400, { error: 'Order ID required' });
  }

  try {
    const result = await db.query(
      `DELETE FROM orders 
       WHERE id = $1 AND user_id = $2 AND status = 'cancelled'
       RETURNING id`,
      [id, authResult.user.id]
    );
    
    if (!result.rows.length) {
      return createResponse(404, { error: 'Order not found or cannot be deleted' });
    }
    
    return createResponse(200, { message: 'Order deleted successfully' });
  } catch (err) {
    console.error('Delete order error:', err.message);
    return createResponse(500, { error: 'Failed to delete order' });
  }
}