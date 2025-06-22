// api/routes/reviews.js
const express = require('express');
const router = express.Router();
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');
const { getDb } = require('../db');
const { ObjectId } = require('mongodb');

// --- PUBLIC ROUTE ---

// GET reviews for a specific product
router.get('/product/:productId', async (req, res) => {
    try {
        const db       = await getDb();
        const productId = parseInt(req.params.productId);

        if (isNaN(productId)) {
            return res.status(400).json({ message: "Invalid product ID. Must be a number." });
        }

        const reviews = await db.collection('reviews')
            .find({ productId: productId })
            .sort({ reviewDate: -1 })
            .toArray();

        res.json(reviews);
    } catch (error) {
        console.error(`Error fetching reviews for product ${req.params.productId}:`, error);
        res.status(500).json({ message: "Error fetching reviews", error: error.message });
    }
});

// --- PROTECTED ROUTES ---

// POST (Add Review) - User must be authenticated
// api/routes/reviews.js (only the POST / endpoint)

router.post('/', firebaseAuthMiddleware, async (req, res) => {
    try {
        const db       = await getDb();
        const userId = req.firebaseUser.uid;
        const { productId, rating, comment, userName } = req.body;

        if (!productId || !rating || !comment) {
            return res.status(400).json({ message: "productId, rating, and comment are required." });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5." });
        }

        // Assuming product ID is stored as an integer in the 'products' collection 'id' field.
        // Adjust if your 'products' collection uses _id: ObjectId.
        const product = await db.collection('products').findOne({ id: parseInt(productId) });
        if (!product) {
            return res.status(404).json({ message: `Product with ID ${productId} not found.` });
        }

        const reviewUserName = (userName && userName.trim().length > 0)
            ? userName.trim()
            : (req.firebaseUser.name || req.firebaseUser.email || 'Anonymous');

        const review = {
            productId: parseInt(productId),
            userId: userId,
            userName: reviewUserName,
            rating: rating,
            comment: comment,
            reviewDate: new Date()
        };

        const result = await db.collection('reviews').insertOne(review);

        res.status(201).json({
            message: "Review submitted successfully!",
            reviewId: result.insertedId,
            review: {
                _id: result.insertedId,
                productId: parseInt(productId),
                userId: userId,
                userName: reviewUserName,
                rating: rating,
                comment: comment,
                reviewDate: review.reviewDate,
            }
        });

    } catch (error) {
        console.error("Error submitting review:", error);
        res.status(500).json({ message: "Error submitting review", error: error.message });
    }
});

// GET reviews for the currently logged-in user
router.get('/my-reviews', firebaseAuthMiddleware, async (req, res) => {
    try {
        const db       = await getDb();
        const userId = req.firebaseUser.uid;

        const userReviews = await db.collection('reviews')
            .find({ userId: userId })
            .sort({ reviewDate: -1 })
            .toArray();

        res.json(userReviews);
    } catch (error) {
        console.error(`Error fetching reviews for user ${req.firebaseUser.uid}:`, error);
        res.status(500).json({ message: "Error fetching user reviews", error: error.message });
    }
});

module.exports = router;