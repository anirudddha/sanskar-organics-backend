const axios = require('axios');
const { getAuthToken } = require('./auth');
const BASE = 'https://apiv2.shiprocket.in/v1/external';

async function getRates(pickup_pincode, delivery_pincode, weight, cod) {
  const token = await getAuthToken();

  const { data } = await axios.get(
    `${BASE}/courier/serviceability/`,
    {
      params: {
        pickup_postcode: pickup_pincode,
        delivery_postcode: delivery_pincode,
        weight,
        cod
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return data.data;
}

module.exports = { getRates };
