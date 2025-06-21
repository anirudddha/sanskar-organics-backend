// api/index.js (This is the main entry point for your API, equivalent to your original server.js)
require('dotenv') // Load environment variables from api/.env

const express = require('express');
const cors = require('cors');

const { connectToMongoDB, closeMongoDB } = require('./db'); // Correct path relative to api/
const { initializeFirebaseAdmin } = require('./config/firebaseConfig'); // New: Import Firebase initializer
const firebaseAuthMiddleware = require('./middleware/firebaseAuthMiddleware'); // New: Import Firebase auth middleware

const productsRoutes = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // For parsing JSON request bodies
app.use(cors()); // Enable CORS for all origins (adjust for production)

// Initialize Firebase Admin SDK at server startup
initializeFirebaseAdmin();

// Public route for API status
app.get('/', (req, res) => {
    res.send('Sanskar Organics Backend API is running!');
});

// Apply Firebase Authentication middleware to protect routes.
// All requests to /api/products will now require a valid Firebase ID token.
// If you want some product routes (e.g., GET) to be public, you would need
// to apply this middleware selectively within products.js or define separate public/private routes.
app.use('/api/products', productsRoutes);

// Placeholder for other routes that will be protected
// For example, if you add cart or order functionality, they would also be protected:
// app.use('/api/cart', firebaseAuthMiddleware, require('./routes/cart'));
// app.use('/api/orders', firebaseAuthMiddleware, require('./routes/orders'));
// app.use('/api/favorites', firebaseAuthMiddleware, require('./routes/favorites'));

// Start the server only after connecting to the MongoDB database
connectToMongoDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        console.error("Failed to start server due to database connection error:", error);
        process.exit(1); // Exit the process if DB connection fails
    });

// Handle graceful server shutdown (e.g., Ctrl+C)
process.on('SIGINT', async () => {
    console.log('Server is shutting down...');
    await closeMongoDB(); // Close MongoDB connection
    process.exit(0);
});

// Handle graceful server shutdown (e.g., Kubernetes, systemd)
process.on('SIGTERM', async () => {
    console.log('Server is shutting down...');
    await closeMongoDB(); // Close MongoDB connection
    process.exit(0);
});