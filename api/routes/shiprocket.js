// api/routes/shiprocket.js
const express = require('express');
const { ship,rates  } = require('../controllers/shiprocketController');
const router = express.Router();

// POST /api/shiprocket/ship
router.post('/ship', ship);
router.get('/rates', rates); // <-- add this line

module.exports = router;
