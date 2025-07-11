// api/controllers/shiprocketController.js

const { getRates } = require('../services/shiprocket/rates');
const { createOrder } = require('../services/shiprocket/orders');
const { getOrderDetails } = require('../services/shiprocket/tracking');
const { schedulePickup } = require('../services/shiprocket/pickup');

async function ship(req, res) {
  if (!req.body.orderPayload) {
    return res.status(400).json({
      success: false,
      error: { message: 'Missing orderPayload in request body' }
    });
  }

  try {
    const order = await createOrder(req.body.orderPayload);

    console.log('✅ Response from createOrder:', JSON.stringify(order, null, 2));

    // ✅ FIX: Pass the shipment_id, not the order_id, to schedule the pickup.
    // The createOrder response contains both.
    await schedulePickup(order.shipment_id);

    const details = await getOrderDetails(order.order_id);

    return res.json({ success: true, order, tracking: {
        awb: details.data.awb_code,
        url: details.data.tracking_url
    }});
  } catch (err) {
    if (err.response) {
      console.error('🚨 Shiprocket responded with status:', err.response.status);
      console.error('🚨 Response headers:', err.response.headers);
      console.error('🚨 Response body:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('🚨 Network or Axios error:', err.message);
    }

    const status = err.response?.status || 500;
    const payload = err.response?.data || { message: err.message };
    return res.status(status).json({ success: false, error: payload });
  }
}


async function rates(req, res) {
  const { pickup_pincode, delivery_pincode, weight, cod } = req.query;

  if (!pickup_pincode || !delivery_pincode || !weight || cod === undefined) {
    return res.status(400).json({
      success: false,
      message: 'pickup_pincode, delivery_pincode, weight, and cod are required'
    });
  }

  try {
    const data = await getRates(pickup_pincode, delivery_pincode, weight, cod);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('🚨 Rate error:', err.response?.data || err.message);
    res.status(500).json({
      success: false,
      error: err.response?.data || err.message
    });
  }
}



module.exports = { ship, rates };