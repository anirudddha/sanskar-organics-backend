// api/routes/index.js
const express = require('express');
const router = express.Router();

const { admin, initializeFirebaseAdmin } = require('../config/firebaseConfig');
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');

// Initialize Firebase Admin SDK
initializeFirebaseAdmin();

// Public route for API status
router.get('/', (req, res) => {
    res.send('Sanskar Organics Backend API is running!');
});

// Protected Routes (Require Authentication)
router.use('/products', require('./products'));
router.use('/cart', firebaseAuthMiddleware, require('./cart'));
router.use('/orders', firebaseAuthMiddleware, require('./orders'));
router.use('/addresses', firebaseAuthMiddleware, require('./addresses')); // New: User Addresses route

// Routes that may require authentication depending on use case
router.use('/reviews', firebaseAuthMiddleware, require('./reviews'));
router.use('/reviews/user/:userId', firebaseAuthMiddleware, require('./reviews')); // If only logged-in user can see their own reviews

// Public Routes (Do not require Authentication)
// Note: We've applied firebaseAuthMiddleware to products, cart, orders, and addresses routes.
// If you want certain operations on these (like GET products, GET reviews) to be public,
// you need to define separate public routes or conditionally apply middleware.
// For example, to make listing products public again:
router.get('/products', require('./products')); // Public route to list all products
router.get('/products/:id', require('./products')); // Public route to get a single product
router.get('/reviews/product/:productId', require('./reviews')); // Publicly accessible reviews for a product

// Optional: Public route to get a specific address for a product, e.g., seller address.
// This would typically be a different kind of address, not user addresses.
// For user addresses, all operations are typically protected.

module.exports = router;