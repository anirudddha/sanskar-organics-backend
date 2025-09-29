// api/routes/index.js
const express = require('express');
const router = express.Router();

const { initializeFirebaseAdmin } = require('../config/firebaseConfig');
// IMPORT BOTH MIDDLEWARES
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');
const jwtAuthMiddleware = require('../middleware/jwtAuthMiddleware');

initializeFirebaseAdmin();

// --- Public Routes ---
router.get('/', (req, res) => res.send('Sanskar Organics Backend API is running!'));
router.use('/auth', require('./auth')); // For local register/login
router.use('/products', require('./products'));
router.use('/reviews', require('./reviews'));
router.use('/testimonials', require('./testimonials'));
router.use('/blog', require('./blog'));

// --- Protected Routes ---
// EXAMPLE: Let's say '/cart' and '/addresses' can be accessed by ANY logged-in user,
// but '/orders' can ONLY be accessed by Firebase users.

// These routes require a valid FIREBASE token.
// router.use('/orders', firebaseAuthMiddleware, require('./orders'));

// These routes require a valid LOCAL JWT token.
// For example, if you had a route for local users to change their password.
// router.use('/user/change-password', jwtAuthMiddleware, require('./userProfileRoutes'));


// Cleanest Approach (Using a Unified Middleware for Shared Routes)
const unifiedAuthMiddleware = require('../middleware/unifiedAuthMiddleware'); // You would need to create this file as shown in the previous answer.
router.use('/cart', unifiedAuthMiddleware, require('./cart'));
router.use('/addresses', unifiedAuthMiddleware, require('./addresses'));
router.use('/orders', unifiedAuthMiddleware, require('./orders'));

// --- Admin Routes ---
router.use('/admin', require('./admin')); 

module.exports = router;