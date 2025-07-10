// api/services/shiprocket/orders.js
const axios = require('axios');
const { getAuthToken } = require('./auth');
const BASE = 'https://apiv2.shiprocket.in/v1/external';

async function createOrder(orderPayload) {
  const token = await getAuthToken();
  console.log(orderPayload);
  const resp = await axios.post(
    `${BASE}/orders/create/adhoc`,
    orderPayload,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return resp.data;
}

module.exports = { createOrder };
