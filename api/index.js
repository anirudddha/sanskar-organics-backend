// api/index.js (Main server entry point for Vercel)

require('dotenv').config({ path: './.env' });

const express = require('express');
const cors = require('cors');

const { connectToMongoDB } = require('./db');

const apiRoutes = require('./routes'); // This should be './routes/index.js'

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    optionsSuccessStatus: 204
}));

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

async function ensureDbConnection() {
    try {
        await connectToMongoDB();
        console.log("Database connected.");
    } catch (error) {
        console.error("Database connection failed:", error);
        throw error;
    }
}

// Call setup function
ensureDbConnection();

// Export the Express app instance for Vercel's @vercel/node builder
module.exports = app;