// api/routes/auth.js

const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// @route   POST /api/auth/register
// @desc    Register a new user in MongoDB
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Authenticate a local user and get a JWT
router.post('/login', login);

module.exports = router;