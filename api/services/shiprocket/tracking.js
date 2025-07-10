// api/services/shiprocket/tracking.js
const axios = require('axios');
const { getAuthToken } = require('./auth');
const BASE = 'https://apiv2.shiprocket.in/v1/external';

async function getOrderDetails(orderId) {
  const token = await getAuthToken();
  const resp = await axios.get(
    `${BASE}/orders/show/${orderId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return resp.data;
}

module.exports = { getOrderDetails };
