// api/services/shiprocket/pickup.js
const axios = require('axios');
const { getAuthToken } = require('./auth');
const BASE = 'https://apiv2.shiprocket.in/v1/external';

// ✅ FIX: The function now accepts a shipment_id
async function schedulePickup(shipment_id) { 
  const token = await getAuthToken();
  const resp = await axios.post(
    `${BASE}/courier/assign/awb`,
    // ✅ FIX: The payload key must be 'shipment_id'
    { shipment_id: shipment_id }, 
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return resp.data;
}

module.exports = { schedulePickup };