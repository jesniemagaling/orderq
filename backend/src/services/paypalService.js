import fetch from 'node-fetch';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;

const PAYPAL_API =
  process.env.NODE_ENV === 'production'
    ? 'https://api.paypal.com'
    : 'https://api.sandbox.paypal.com';

/**
 * Get PayPal Access Token
 */
async function getAccessToken() {
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization:
        'Basic ' +
        Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('PayPal Token Error:', data);
    throw new Error(
      data.error_description || 'Failed to get PayPal access token'
    );
  }

  return data.access_token;
}

/**
 * Create PayPal Order
 * @param {number} totalAmount
 * @param {string} currency
 */
export async function createPaypalOrder(totalAmount, currency = 'PHP') {
  if (!totalAmount || isNaN(totalAmount) || Number(totalAmount) <= 0) {
    throw new Error('totalAmount must be a positive number');
  }

  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: totalAmount.toFixed(2),
          },
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.id) {
    console.error('PayPal Order Error:', data);
    throw new Error(data.message || 'Failed to create PayPal order');
  }

  return {
    id: data.id,
    links: data.links || [],
  };
}
