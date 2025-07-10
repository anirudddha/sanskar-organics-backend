// api/services/shiprocket/auth.js
const axios = require('axios');
const BASE = 'https://apiv2.shiprocket.in/v1/external';

// In-memory cache for the token
let cachedToken = null;
let tokenExpiry = null;

async function getAuthToken() {
  // If we have a token and it's not expired (with a 1-minute buffer), return it
  if (cachedToken && tokenExpiry && new Date() < tokenExpiry) {
    console.log('Using cached Shiprocket token.');
    return cachedToken;
  }

  // Otherwise, fetch a new token
  console.log('Fetching a new Shiprocket token...');
  const resp = await axios.post(
    `${BASE}/auth/login`,
    {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }
  );
  
  cachedToken = resp.data.token;

  // Set the expiry time. Shiprocket tokens last 24 hours.
  // We'll set ours to 23 hours and 59 minutes just to be safe.
  const now = new Date();
  tokenExpiry = new Date(now.getTime() + (23 * 60 + 59) * 60 * 1000);

  console.log(`New token fetched. It will expire around: ${tokenExpiry.toLocaleString()}`);

  return cachedToken;
}

module.exports = { getAuthToken };