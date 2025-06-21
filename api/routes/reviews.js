// api/routes/reviews.js
const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

// Middleware to ensure DB is connected and attach it to the request object.
router.use((req, res, next) => {
    try {
        req.db = require('../db').getDb(); // Get the MongoDB connection instance
        next();
    } catch (error) {
        res.status(500).json({ message: error.message || "Database not connected." });
    }
});

// POST (Add Review)
// User must be authenticated to leave a review.
// We can also check if the user has purchased the product before allowing review,
// but that adds complexity. For now, anyone authenticated can review.
router.post('/', async (req, res) => {
    try {
        const userId = req.firebaseUser.uid;
        const { productId, rating, comment } = req.body;

        // Basic validation
        if (!productId || !rating || !comment) {
            return res.status(400).json({ message: "productId, rating, and comment are required." });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5." });
        }

        // Check if the product exists
        const product = await req.db.collection('products').findOne({ id: parseInt(productId) });
        if (!product) {
            return res.status(404).json({ message: `Product with ID ${productId} not found.` });
        }

        // Construct the review object
        const review = {
            productId: parseInt(productId),
            userId: userId, // Store the UID of the user who wrote the review
            userName: req.firebaseUser.name || req.firebaseUser.email || 'Anonymous', // You might store more user info
            rating: rating,
            comment: comment,
            reviewDate: new Date()
        };

        // Insert the review
        const result = await req.db.collection('reviews').insertOne(review);

        // Optional: Update product's average rating (can be done via aggregation or a separate update)
        // For simplicity, we'll skip updating product average rating here, but it's a common feature.
        // await updateProductAverageRating(req.db, productId); // You'd need to implement this function

        res.status(201).json({ message: "Review submitted successfully!", reviewId: result.insertedId, review: review });

    } catch (error) {
        console.error("Error submitting review:", error);
        res.status(500).json({ message: "Error submitting review", error: error.message });
    }
});

// GET reviews for a specific product
// This route can be public or protected. Let's make it public to display reviews on product pages.
router.get('/product/:productId', async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);

        if (isNaN(productId)) {
            return res.status(400).json({ message: "Invalid product ID. Must be a number." });
        }

        // Find reviews for the given product, sorted by date
        const reviews = await req.db.collection('reviews')
            .find({ productId: productId })
            .sort({ reviewDate: -1 }) // Sort by date, newest first
            .toArray();

        res.json(reviews);
    } catch (error) {
        console.error(`Error fetching reviews for product ${req.params.productId}:`, error);
        res.status(500).json({ message: "Error fetching reviews", error: error.message });
    }
});

// Optional: GET reviews for a specific user
router.get('/user/:userId', async (req, res) => {
    // This route is more for admin or user profile views.
    // If you want to show a user's own reviews, you'd use req.firebaseUser.uid.
    // For showing ANY user's reviews, you'd need to consider privacy and potential abuse.
    // For now, let's assume we're getting reviews for the logged-in user.
    try {
        const userId = req.firebaseUser.uid; // Using the authenticated user's ID

        const userReviews = await req.db.collection('reviews')
            .find({ userId: userId })
            .sort({ reviewDate: -1 })
            .toArray();

        res.json(userReviews);
    } catch (error) {
        console.error(`Error fetching reviews for user ${req.firebaseUser.uid}:`, error);
        res.status(500).json({ message: "Error fetching user reviews", error: error.message });
    }
});

// Optional: DELETE a review (e.g., by the user who posted it or an admin)
// This would require more specific logic (e.g., checking ownership or admin roles).

module.exports = router;