/**
 * Contact function - handles /api/contact/*
 */
const { query } = require('./db');
const { createResponse } = require('./middleware');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, {});
  }

  // Extract path after /api/contact
  const fullPath = event.path;
  let path = '';
  
  if (fullPath.includes('/api/contact')) {
    path = fullPath.replace('/api/contact', '');
  } else if (fullPath.includes('/.netlify/functions/contact')) {
    path = fullPath.replace('/.netlify/functions/contact', '');
  }
  
  try {
    // Route based on path and method
    if (event.httpMethod === 'POST' && (path === '' || path === '/')) {
      return await handleContactSubmit(event);
    } else if (event.httpMethod === 'POST' && path === '/wholesale') {
      return await handleWholesaleSubmit(event);
    } else {
      return createResponse(404, { error: 'Endpoint not found' });
    }
  } catch (error) {
    console.error('Contact function error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

/**
 * POST /contact
 */
async function handleContactSubmit(event) {
  const { name, email, phone, message } = JSON.parse(event.body || '{}');
  
  // Basic validation
  if (!name || !email || !message) {
    return createResponse(400, { error: 'Name, email, and message are required' });
  }

  try {
    const result = await query(
      `INSERT INTO contact_messages (name, email, phone, message, type)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`,
      [name, email, phone || null, message, 'general']
    );
    
    return createResponse(201, { 
      message: 'Contact message submitted successfully',
      id: result.rows[0].id 
    });
  } catch (err) {
    console.error('Contact submit error:', err.message);
    return createResponse(500, { error: 'Failed to submit contact message' });
  }
}

/**
 * POST /contact/wholesale
 */
async function handleWholesaleSubmit(event) {
  const { businessName, contactName, email, phone, businessType, requirements } = JSON.parse(event.body || '{}');
  
  // Basic validation
  if (!businessName || !contactName || !email || !businessType) {
    return createResponse(400, { error: 'Business name, contact name, email, and business type are required' });
  }

  try {
    const result = await query(
      `INSERT INTO wholesale_inquiries (business_name, contact_name, email, phone, business_type, requirements)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at`,
      [businessName, contactName, email, phone || null, businessType, requirements || null]
    );
    
    return createResponse(201, { 
      message: 'Wholesale inquiry submitted successfully',
      id: result.rows[0].id 
    });
  } catch (err) {
    console.error('Wholesale submit error:', err.message);
    return createResponse(500, { error: 'Failed to submit wholesale inquiry' });
  }
}