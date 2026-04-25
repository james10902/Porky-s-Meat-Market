/**
 * Payments routes — /api/payments
 * Stripe PaymentIntent creation
 */
const router = require('express').Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/* ── POST /api/payments/create-intent ───────────────────────────────────── */
router.post('/create-intent', async (req, res) => {
  const { amount, currency = 'nad', metadata = {} } = req.body;

  if (!amount || typeof amount !== 'number' || amount < 100) {
    return res.status(400).json({ error: 'Invalid amount.' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message || 'Payment initialisation failed.' });
  }
});

module.exports = router;
