// api/routes/index.js
const express = require('express');
const router = express.Router();

const { initializeFirebaseAdmin } = require('../config/firebaseConfig');
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');

// Initialize Firebase Admin SDK
initializeFirebaseAdmin();

// Public route for API status
router.get('/', (req, res) => {
    res.send('Sanskar Organics Backend API is running!');
});

// All requests starting with /products are handled by the products router.
// Public/private logic is handled within 'products.js'.
router.use('/products', require('./products'));

// All requests starting with /reviews are handled by the reviews router.
// Public/private logic is handled within 'reviews.js'.
router.use('/reviews', require('./reviews'));

// These routes require authentication for ALL their endpoints.
router.use('/cart', firebaseAuthMiddleware, require('./cart'));
router.use('/orders', firebaseAuthMiddleware, require('./orders'));
router.use('/addresses', firebaseAuthMiddleware, require('./addresses'));

router.use('/admin', require('./admin')); 

module.exports = router;