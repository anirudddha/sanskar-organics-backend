// sanskar_organics_backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectToMongoDB, closeMongoDB } = require('./db');
const productsRoutes = require('./routes/products');
// REMOVED: const authRoutes = require('./routes/auth');
// REMOVED: const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// All routes are now public (no authentication required)
app.get('/', (req, res) => {
    res.send('Sanskar Organics Backend API is running!');
});

// REMOVED: app.use('/api/auth', authRoutes); // Auth routes are no longer needed

// API routes (products, cart, orders, favorites, etc.)
// Products route is now public
app.use('/api/products', productsRoutes);

// Placeholder for Cart, Orders, Favorites routes (you'll create these files)
// These routes will also be public
// app.use('/api/cart', require('./routes/cart'));
// app.use('/api/orders', require('./routes/orders'));
// app.use('/api/favorites', require('./routes/favorites'));


// Start the server only after connecting to the database
connectToMongoDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        console.error("Failed to start server due to database connection error:", error);
        process.exit(1);
    });

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Server is shutting down...');
    await closeMongoDB();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Server is shutting down...');
    await closeMongoDB();
    process.exit(0);
});