const Stripe = require('stripe');
const { stripeSecretKey, stripePublishableKey } = require('../config');

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

async function createPaymentIntent({ amount, currency = 'gbp', metadata = {} }) {
  if (!stripe) {
    return {
      mock: true,
      clientSecret: 'mock_client_secret',
      publishableKey: stripePublishableKey,
      amount
    };
  }

  const intent = await stripe.paymentIntents.create({
    amount,
    currency,
    metadata,
    automatic_payment_methods: { enabled: true }
  });

  return {
    mock: false,
    clientSecret: intent.client_secret,
    publishableKey: stripePublishableKey,
    paymentIntentId: intent.id,
    amount: intent.amount
  };
}

module.exports = {
  createPaymentIntent,
  stripeEnabled: Boolean(stripe),
  publishableKey: stripePublishableKey
};
