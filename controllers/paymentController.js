const { createPaymentIntent, stripeEnabled, publishableKey } = require('../server/services/paymentService');

async function createIntent(req, res, next) {
  try {
    const { amount, metadata } = req.body;
    const response = await createPaymentIntent({ amount: Number(amount), metadata: metadata || {} });
    return res.json({ ...response, stripeEnabled, publishableKey });
  } catch (error) {
    return next(error);
  }
}

function getConfig(req, res) {
  return res.json({ stripeEnabled, publishableKey });
}

module.exports = {
  createIntent,
  getConfig
};
