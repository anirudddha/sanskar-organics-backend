// api/index.js (Main server entry point)
require('dotenv').config({ path: './.env' }); // Load environment variables from api/.env

const express = require('express');
const cors = require('cors');

const { connectToMongoDB } = require('./db'); // Correct path relative to api/
// No need to initialize Firebase here as it's handled by the main router setup for safety.
// const { initializeFirebaseAdmin } = require('./config/firebaseConfig');
// const firebaseAuthMiddleware = require('./middleware/firebaseAuthMiddleware');

const apiRoutes = require('./routes'); // Import the main api router

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // For parsing JSON request bodies
// Configure CORS for production: restrict origins
app.use(cors({
    origin: '*', // Allow all origins for development. Change to your frontend URL in production.
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // If you use cookies or sessions
    optionsSuccessStatus: 204
}));

// Initialize Firebase Admin SDK - moved to api/routes/index.js for better structure
// initializeFirebaseAdmin(); // Removed from here

// Mount the main API router under '/api'
app.use('/api', apiRoutes);

// Catch-all for routes not found
app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.stack);
    res.status(500).json({ message: 'Something went wrong on the server', error: err.message });
});

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
    await require('./db').closeMongoDB(); // Ensure MongoDB connection is closed
    process.exit(0);
});

// Handle graceful server shutdown (e.g., Kubernetes, systemd)
process.on('SIGTERM', async () => {
    console.log('Server is shutting down...');
    await require('./db').closeMongoDB(); // Ensure MongoDB connection is closed
    process.exit(0);
});